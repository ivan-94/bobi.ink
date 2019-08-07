---
title: "Electron的remote模块是怎么运作的?"
date: 2019/8/4
categories: 前端
---

Electron的remote模块是一个比较神奇的东西，为`渲染进程`和`主进程`通信封装了一种简单方法，也就是说，通过remote你可以调用主进程对象的方法, 而不必显式发送进程间消息, 类似于 Java 的 RMI. 例如:

```js
const { remote } = require('electron')
const myModal = remote.require('myModal') // 让主进程require指定模块，并返回到渲染进程
```

**本质上，remote模块是基于Electron的IPC机制的，进程之间的通信的数据必须是可序列化的，比如JSON**。所以本文的目的是介绍Electron是如何设计remote模块的，以及有什么坑。

![](/images/electron-remote/ipc.png)

## 通信协议的定义

首先需要定义一个协议来描述一个模块/对象的外形，其中包含下列类型:

- 原始值。例如字符串、数字、布尔值
- 数组。
- 对象。对象属性、对象的方法、以及对象的原型
- 函数。普通函数和构造方法、异常处理
- 特殊对象。Date、Buffer、Promise、异常对象等等

描述这些对象外形的协议，Electron称为MetaData(元数据). 下面是一个转换的示例:

- 基本对象: 基本对象很容易处理，直接值拷贝
  - 输入

    ```js
    1;
    new Date();
    Buffer.from('hello world');
    new Error('message');
    ```

  - 输出

    ```json
    {type: "value", value: 1};
    {type: "date", value: 1565002306662};
    {type: "buffer", value: {data: Uint8Array(11), length: 11, type: "Buffer"}};

    {
      members: [
        {
          name: "stack",
          value: "Error: message\n    at Object.<anonymous> (省略调用栈)"
        },
        { name: "message", value: "message" },
        { name: "name", value: "Error" }
      ],
      type: "error"
    }
    ```

- 数组
  - 输入

    ```js
    [1, 2, 3];
    ```

  - 输出

    数组会递归对成员进行转换. 注意数组和基本类型没什么区别，它也是值拷贝，也就是说修改数组不会影响到对端进程的值。

    ```json
    {
      "members": [
        {"type":"value","value":1},
        {"type":"value","value":2},
        {"type":"value","value":3}
      ],
      "type":"array"
    }
    ```

- 纯对象

  - 输入

    ```js
    {
      a: 1,
      b: () => {
        this.a;
      },
    }
    ```

  - 输出

    ```json
    {
      // 这里有一个id，用于标识主进程的一个对象
      id: 1,
      // 对象成员
      members: [
        { enumerable: true, name: "a", type: "get", writable: true },
        { enumerable: true, name: "b", type: "method", writable: false }
      ],
      name: "Object",
      proto: null,
      type: "object"
    }
    ```

- 函数
  - 输入

    ```js
    function foo() {
      return 'hello world';
    };
    ```

  - 输出

    ```js
    {
      // 函数也有一个唯一id标识，因为它是特殊的对象
      id: 2,
      members: [],
      name: "Function",
      type: "function"
      // Electron解析对象的原型链
      proto: {
        members: [
          // 构造函数
          {
            enumerable: false,
            name: "constructor",
            type: "method",
            writable: false
          },
          { enumerable: false, name: "apply", type: "method", writable: false },
          { enumerable: false, name: "bind", type: "method", writable: false },
          { enumerable: false, name: "call", type: "method", writable: false },
          { enumerable: false, name: "toString", type: "method", writable: false }
        ],
        proto: null
      },
    }
    ```

- Promise
  - 输入:

    ```js
    Promise.resolve();
    ```

  - 输入:

    ```js
    // Promise这里关键在于then，详见下面的函数元数据
    {
      type: "promise"
      then: {
        id: 2,
        members: [],
        name: "Function",
        proto: {/*见上面*/},
        type: "function"
      },
    };
    ```

了解remote的数据传输协议后，有经验的开发者应该心里有底了，它的原理大概是这样的：

![](/images/electron-remote/meta-transform.png)

主进程和渲染进程之间需要将对象序列化成MetaData描述，转换的规则上面已经解释的比较清楚了。

其中比较复杂的是对象和函数的处理，Electron为了反之对象被垃圾回收，需要将这些对象放进一个表中，在这个表中每个对象都有一个唯一的id来标识。这个id有点类似于‘指针’，渲染进程会拿着这个id向主进程请求访问对象。那什么时候需要释放这些对象呢？下文会讲具体的实现细节。

还有一个上图没有展示出来的细节是，Electron不会递归去转换对象，也就是说它只会转换一层。这样可以避免转换存在循环引用的对象报错、另外所有属性值应该从远程获取最新的值，不能假设它的结构不可变。

<br>

## 对象的序列化

先来看看主进程的实现，它的代码位于[/lib/browser/rpc-server.js](https://github.com/electron/electron/blob/master/lib/browser/rpc-server.js)代码很少，而且很好理解，读者可以自己读一下。

这里我们不关注对象序列化的细节，重点关注对象的生命周期和调用的流程. 以`remote.require`为例, 这个方法用于让main模块去require指定模块，并返回模块内容：

```js
handleRemoteCommand('ELECTRON_BROWSER_REQUIRE', function (event, contextId, moduleName) {
  // 调用require
  const returnValue = process.mainModule.require(moduleName)

  // 将returnValue序列化为MetaData
  return valueToMeta(event.sender, contextId, returnValue)
})
```

handleRemoteCommand 从[ipcMain](https://electronjs.org/docs/api/ipc-main)监听renderer发送的请求，contextId用于标识一个renderer进程。

valueToMeta方法将值序列化为MetaData:

```js
const valueToMeta = function (sender, contextId, value, optimizeSimpleObject = false) {
  // Determine the type of value.
  const meta = { type: typeof value }
  if (meta.type === 'object') {
    // Recognize certain types of objects.
    if (value === null) {
      meta.type = 'value'
    } else if (bufferUtils.isBuffer(value)) {
      // ... 基本类型
    }
  }

  if (meta.type === 'array') {
    // 数组转换
    meta.members = value.map((el) => valueToMeta(sender, contextId, el, optimizeSimpleObject))
  } else if (meta.type === 'object' || meta.type === 'function') {
    meta.name = value.constructor ? value.constructor.name : ''
    // 🔴将对象保存到注册表中，并返回唯一的对象id.
    // Electron会假设渲染进程会一直引用这个对象, 直到渲染进程退出
    meta.id = objectsRegistry.add(sender, contextId, value)
    meta.members = getObjectMembers(value)
    meta.proto = getObjectPrototype(value)
  } else if (meta.type === 'buffer') {
    meta.value = bufferUtils.bufferToMeta(value)
  } else if (meta.type === 'promise') {
    value.then(function () {}, function () {})
    meta.then = valueToMeta(sender, contextId, function (onFulfilled, onRejected) {
      value.then(onFulfilled, onRejected)
    })
  } else if (meta.type === 'error') {
    // 错误对象
    meta.members = plainObjectToMeta(value)
    meta.members.push({
      name: 'name',
      value: value.name
    })
  } else if (meta.type === 'date') {
    meta.value = value.getTime()
  } else {
    // 其他
    meta.type = 'value'
    meta.value = value
  }
  return meta
}
```

## 影子对象

影分身之术

## 对象的生命周期

valueToMeta会将每一个对象和函数都放入注册表中，包含函数返回值。这是否意味着，如果频繁调用函数，将会导致注册表暴涨呢？占用太多内存呢？这些对象什么时候释放?

首先当渲染进程销毁时，主进程会集中销毁掉该进程的所有对象引用：

```js
// 渲染进程退出时会通过这个事件告诉主进程，但是这个并不能保证收到
handleRemoteCommand('ELECTRON_BROWSER_CONTEXT_RELEASE', (event, contextId) => {
  objectsRegistry.clear(event.sender, contextId)
  return null
})
```

因为ELECTRON_BROWSER_CONTEXT_RELEASE不能保证能够收到，所以objectsRegistry还会监听对应渲染进程的销毁事件:

```js
class ObjectsRegistry {
    registerDeleteListener (webContents, contextId) {
    // contextId => ${processHostId}-${contextCount}
    const processHostId = contextId.split('-')[0]
    const listener = (event, deletedProcessHostId) => {
      if (deletedProcessHostId &&
          deletedProcessHostId.toString() === processHostId) {
        webContents.removeListener('render-view-deleted', listener)
        this.clear(webContents, contextId)
      }
    }
    webContents.on('render-view-deleted', listener)
  }
}
```

等到渲染进程销毁再去释放这些对象显然是无法接受的，和网页不一样，桌面端应用可能会7*24不间断运行，如果要等到渲染进程退出采取回收对象会导致系统资源被消耗殆尽。

所以Electron会在渲染进程中监听对象的垃圾回收，再通过IPC通知主进程:

```js
/**
 * 渲染进程，反序列化
 */
function metaToValue (meta) {
  const types = {
    value: () => meta.value,
    array: () => meta.members.map((member) => metaToValue(member)),
    buffer: () => bufferUtils.metaToBuffer(meta.value),
    promise: () => Promise.resolve({ then: metaToValue(meta.then) }),
    error: () => metaToPlainObject(meta),
    date: () => new Date(meta.value),
    exception: () => { throw errorUtils.deserialize(meta.value) }
  }

  if (meta.type in types) {
    // 基本类型转换
    return types[meta.type]()
  } else {
    // 对象类型转换
    let ret
    if (remoteObjectCache.has(meta.id)) {
      // 🔴 添加对象引用计数. v8Util是electron原生模块
      v8Util.addRemoteObjectRef(contextId, meta.id)
      return remoteObjectCache.get(meta.id)
    }

    // 创建一个影子类表示远程函数对象
    if (meta.type === 'function') {
      const remoteFunction = function (...args) {
        let command
        if (this && this.constructor === remoteFunction) {
          command = 'ELECTRON_BROWSER_CONSTRUCTOR'
        } else {
          command = 'ELECTRON_BROWSER_FUNCTION_CALL'
        }
        const obj = ipcRendererInternal.sendSync(command, contextId, meta.id, wrapArgs(args))
        return metaToValue(obj)
      }
      ret = remoteFunction
    } else {
      ret = {}
    }

    setObjectMembers(ret, ret, meta.id, meta.members)
    setObjectPrototype(ret, ret, meta.id, meta.proto)
    Object.defineProperty(ret.constructor, 'name', { value: meta.name })

    // 🔴 监听对象的生命周期，当对象被垃圾回收时，通知到主进程
    v8Util.setRemoteObjectFreer(ret, contextId, meta.id)
    v8Util.setHiddenValue(ret, 'atomId', meta.id)
    // 🔴 添加对象引用计数
    v8Util.addRemoteObjectRef(contextId, meta.id)
    remoteObjectCache.set(meta.id, ret)
    return ret
  }
}

```

简单了解一下ObjectFreer代码:

```cpp
// atom/common/api/remote_object_freer.cc
// 添加引用计数
void RemoteObjectFreer::AddRef(const std::string& context_id, int object_id) {
  ref_mapper_[context_id][object_id]++;
}

// 对象释放事件处理器
void RemoteObjectFreer::RunDestructor() {
  // ...
  auto* channel = "ELECTRON_BROWSER_DEREFERENCE";
  base::ListValue args;
  args.AppendString(context_id_);
  args.AppendInteger(object_id_);
  args.AppendInteger(ref_mapper_[context_id_][object_id_]);

  // 清空引用表
  ref_mapper_[context_id_].erase(object_id_);
  if (ref_mapper_[context_id_].empty())
    ref_mapper_.erase(context_id_);

  // ipc通知主进程
  electron_ptr->Message(true, channel, args.Clone());
}
```

再回到主进程, 主进程监听`ELECTRON_BROWSER_DEREFERENCE`事件，并递减指定对象的引用计数：

```js
handleRemoteCommand('ELECTRON_BROWSER_DEREFERENCE', function (event, contextId, id, rendererSideRefCount) {
  objectsRegistry.remove(event.sender, contextId, id, rendererSideRefCount)
})
```

如果被上面的代码绕得优点晕，那就看看下面的流程图, 消化消化：

![](/images/electron-remote/lifetime.png)

<br>

## 渲染进程给主进程传递回调

在渲染进程中，通过remote还可以给主进程的函数传递回调。其实跟主进程暴露函数或对象给渲染进程的原理一样，渲染进程在将回调处理给主进程之前会放置到回调注册表中，然后给主进程暴露一个callbackID。

渲染进程会调用wrapArgs将函数调用参数序列化为MetaData:

```js
function wrapArgs (args, visited = new Set()) {
  const valueToMeta = (value) => {
    // 🔴 防止循环引用
    if (visited.has(value)) {
      return {
        type: 'value',
        value: null
      }
    }

    // ... 省略其他类型的处理，这些类型基本都是值拷贝
    } else if (typeof value === 'function') {
      return {
        type: 'function',
        // 添加到回调注册表中
        id: callbacksRegistry.add(value),
        location: v8Util.getHiddenValue(value, 'location'),
        length: value.length
      }
    } else {
      // ...
    }
  }
}
```

回到主进程，这里也要一个对应的`unwrapArgs`函数来反序列化函数参数：

```js
const unwrapArgs = function (sender, frameId, contextId, args) {
  const metaToValue = function (meta) {
    switch (meta.type) {
      case 'value':
        return meta.value
      // ... 省略
      case 'function': {
        const objectId = [contextId, meta.id]
        // 回调缓存
        if (rendererFunctions.has(objectId)) {
          return rendererFunctions.get(objectId)
        }

        // 🔴 封装影子函数
        const callIntoRenderer = function (...args) {
          let succeed = false
          if (!sender.isDestroyed()) {
            // 🔴通过IPC通知渲染进程
            // 忽略回调返回值
            succeed = sender._sendToFrameInternal(frameId, 'ELECTRON_RENDERER_CALLBACK', contextId, meta.id, valueToMeta(sender, contextId, args))
          }

          if (!succeed) {
            // 没有发送成功则表明渲染进程的回调可能被释放了，输出警告信息
            // 这种情况比较常见，比如被渲染进程刷新了
            removeRemoteListenersAndLogWarning(this, callIntoRenderer)
          }
        }

        v8Util.setHiddenValue(callIntoRenderer, 'location', meta.location)
        Object.defineProperty(callIntoRenderer, 'length', { value: meta.length })

        // 🔴 监听回调函数垃圾回收事件
        v8Util.setRemoteCallbackFreer(callIntoRenderer, contextId, meta.id, sender)
        rendererFunctions.set(objectId, callIntoRenderer)
        return callIntoRenderer
      }
      default:
        throw new TypeError(`Unknown type: ${meta.type}`)
    }
  }

  return args.map(metaToValue)
}
```

渲染进程响应就比较简单了：

```js
handleMessage('ELECTRON_RENDERER_CALLBACK', (id, args) => {
  callbacksRegistry.apply(id, metaToValue(args))
})
```

那回调什么时候释放呢？这个相比渲染进程的对象引用要简单很多，因为主进程只有一个。通过上面的代码可以知道, `setRemoteCallbackFreer`会监听影子回调是否被垃圾回收，一旦被垃圾回收了则通知渲染进程:

```js
handleMessage('ELECTRON_RENDERER_RELEASE_CALLBACK', (id) => {
  callbacksRegistry.remove(id)
})
```

按照惯例，来个流程图:

![](/images/electron-remote/callback.png)

<br>

## 渲染进程端实现

函数调用
对调的处理

<br>
<br>

## 一些坑

- 当渲染进程调用远程对象的方法或函数时，是进行同步IPC通信。换言之，同步IPC调用会阻塞用户代码的执行，而且跨端的通信效率无法和原生函数调用相比，所以频繁的IPC调用会影响主进程和渲染进程的性能.
- 主进程会注册每一个渲染进程访问的对象，包括函数的返回值。同理，频繁的远程对象请求，对内存的占用和垃圾回收造成不小的压力
- 无法完全模拟JavaScript对象的行为。比如在remote模块中存在这些问题:
  - 数组属于'基本对象'，它是值拷贝传递给对端的。也就是说它不是一个‘引用对象’，在对端修改它们时，无法反应到原始的数组.
  - 对象在第一次引用时，只有可枚举的属性可以远程访问。这也意味着，一开始对象的外形就确定下来了，如果远程对象动态扩展了属性，是无法被远程访问到的
  - 渲染进程传递的回调会被异步调用，而且主进程会忽略它的返回值。异步调用是为了避免产生死锁
- 对象泄露。
  - 如果远程对象在渲染进程中泄露（例如存储在映射中，但从未释放），则主进程中的相应对象也将被泄漏，所以您应该非常小心，不要泄漏远程对象。
  - 在给主进程传递回调时也要特别小心，主进程会保持回调的引用，直到它被释放。所以在使用remote模块进行一些‘事件订阅’时，切记要解除事件订阅.
  - 还有一种场景，下文会提到

<br>
<br>

## remote模块实践

![](/images/electron-remote/gzb.png)

上面是我参与过的某个项目的软件架构图，`Hybrid`层使用C/C++编写，封装了应用跨平台的核心业务逻辑，在此之上来构建各个平台的视图。其中桌面端我们使用的是Electron技术。

如上图，Bridge进是对Hybrid的一层Node桥接封装。一个应用中只能有一个Bridge实例，因此我们的做法是使用Electron的remote模块，让渲染进程通过主进程间接地访问Bridge.

页面需要监听Bridge的一些事件，最初我们的代码是这样的:

```ts
// bridge.ts
// 使用remote的一个好处时，可以配合Typescript实现较好的类型检查
const bridge = electron.remote.require('bridge') as typeof import('bridge')

export default bridge
```

某些Store:

```ts
import bridge from '~/bridge'

class Store extends MobxStore {
  // 初始化
  pageReady() {
    this.someEventDispose = bridge.addListener('someEvent', this.handleSomeEvent)
  }

  // 页面关闭
  pageWillClose() {
    this.someEventDispose()
  }
  // ...
}
```

流程图如下:

![](/images/electron-remote/addListener.png)

这种方式存在很多问题:

- 主进程需要为每一个addListener回调都维持一个引用。上面的代码会在页面关闭时释放订阅，但是它没有考虑用户刷新页面或者页面崩溃的场景。这会导致回调在主进程泄露。然而就算Electron在调用回调时可以发现回调在渲染进程已经被释放掉了，Bridge这里却无法得到这些信息， Bridge会始终保持对影子回调的引用.
- 另外一个比较明显的是调用效率的问题。假设页面监听了N次A事件，当A事件触发时，主进程需要给这个页面发送N个通知。

后来我们抛弃了使用remote进行事件订阅这种方式，让主进程来维护这种订阅关系, 如下图:

![](/images/electron-remote/addListener2.png)

我们改进了很多东西：

**主进程现在只维护‘哪个页面’订阅了哪个事件，从‘绑定回调’进化成为‘绑定页面’**。这样可以解决上面调用效率和回调泄露问题、比如不会因为页面刷新导致回调泄露。另外这里参考了remote本身的实现，在页面销毁时移除该页面的所有订阅。相比比remote黑盒，我们自己来实现这种事件订阅关系比之前要更好调试。

<br>
<br>

## 总结

值得学习，跨端通信非常常见，例如WebView、Worker

<br>
<br>

## 扩展