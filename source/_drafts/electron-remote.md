---
title: "Electron的remote模块是怎么运作的?"
date: 2019/8/4
categories: 前端
---

Electron的remote模块是一个比较神奇的东西，为`渲染进程`和`主进程`通信封装了一种简单方法，通过remote你可以'直接'获取主进程对象或者调用主进程函数或对象的方法, 而不必显式发送进程间消息, 类似于 Java 的 RMI. 例如:

```js
const { remote } = require('electron')
const myModal = remote.require('myModal') // 让主进程require指定模块，并返回到渲染进程
myModal.dosomething()                     // 调用方法
```

**本质上，remote模块是基于Electron的IPC机制的，进程之间的通信的数据必须是可序列化的，比如JSON序列化**。所以本文的目的是介绍Electron是如何设计remote模块的，以及里面有什么坑。

<br>

![](/images/electron-remote/ipc.png)

<br>

**文章大纲**

- [通信协议的定义](#%e9%80%9a%e4%bf%a1%e5%8d%8f%e8%ae%ae%e7%9a%84%e5%ae%9a%e4%b9%89)
- [对象的序列化](#%e5%af%b9%e8%b1%a1%e7%9a%84%e5%ba%8f%e5%88%97%e5%8c%96)
- [影子对象](#%e5%bd%b1%e5%ad%90%e5%af%b9%e8%b1%a1)
- [对象的生命周期](#%e5%af%b9%e8%b1%a1%e7%9a%84%e7%94%9f%e5%91%bd%e5%91%a8%e6%9c%9f)
- [渲染进程怎么给主进程传递回调](#%e6%b8%b2%e6%9f%93%e8%bf%9b%e7%a8%8b%e6%80%8e%e4%b9%88%e7%bb%99%e4%b8%bb%e8%bf%9b%e7%a8%8b%e4%bc%a0%e9%80%92%e5%9b%9e%e8%b0%83)
- [一些缺陷](#%e4%b8%80%e4%ba%9b%e7%bc%ba%e9%99%b7)
- [remote模块实践和优化](#remote%e6%a8%a1%e5%9d%97%e5%ae%9e%e8%b7%b5%e5%92%8c%e4%bc%98%e5%8c%96)
- [总结](#%e6%80%bb%e7%bb%93)
- [扩展](#%e6%89%a9%e5%b1%95)

<br>

## 通信协议的定义

上文说到，remote本质上基于序列化的IPC通信的，所以首先关键需要**定义一个协议来描述一个模块/对象的外形**，其中包含下列类型:

- 原始值。例如字符串、数字、布尔值
- 数组。
- 对象。对象属性、对象的方法、以及对象的原型
- 函数。普通函数和构造方法、异常处理
- 特殊对象。Date、Buffer、Promise、异常对象等等

<br>

Electron使用MetaData(元数据)来描述这些对象外形的协议. 下面是一些转换的示例:

- **基本对象**: 基本对象很容易处理，直接值拷贝传递即可
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
    {type: "date", value: 1565002306662};  // 序列化为时间戳
    {type: "buffer", value: {data: Uint8Array(11), length: 11, type: "Buffer"}}; // 序列化为数组
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

    <br>

- **数组**: 数组也是值拷贝
  - 输入

    ```js
    [1, 2, 3];
    ```

  - 输出

    数组会递归对成员进行转换. 注意数组和基本类型没什么区别，它也是值拷贝，也就是说修改数组不会影响到对端进程的数组值。

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

<br>

- **纯对象**: 

  - 输入

    ```js
    {
      a: 1,
      b: () => {
        this.a;
      },
      c: {
        d: 'd'
      }
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
        { enumerable: true, name: "b", type: "method", writable: false },
        // electron只会转换一层，不会递归转换内嵌对象
        { enumerable: true, name: "c", type: "get", writable: true },
      ],
      name: "Object",
      // 对象的上级原型的MetaData
      proto: null,
      type: "object"
    }
    ```

    <br>

- **函数**:
  - 输入

    ```js
    function foo() {
      return 'hello world';
    };
    ```

  - 输出

    ```js
    {
      // 函数也有一个唯一id标识，因为它也是对象，主进程需要保持该对象的引用
      id: 2,
      // 函数属性成员
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

    <br>

- **Promise**：Promise只需描述then函数
  - 输入:

    ```js
    Promise.resolve();
    ```

  - 输入:

    ```js
    // Promise这里关键在于then，详见上面的函数元数据
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

<br>

了解remote的数据传输协议后，有经验的开发者应该心里有底了，它的原理大概是这样的：

![](/images/electron-remote/meta-transform.png)

主进程和渲染进程之间需要将对象序列化成MetaData描述，转换的规则上面已经解释的比较清楚了。这里面需要特殊处理是对象和函数，渲染进程拿到MetaData后需要封装成一个影子对象/函数，来供应用调用。

其中比较复杂的是对象和函数的处理，Electron为了防止对象被垃圾回收，需要将这些对象放进一个注册表中，在这个表中每个对象都有一个唯一的id来标识。这个id有点类似于‘指针’，渲染进程会拿着这个id向主进程请求访问对象。

那什么时候需要释放这些对象呢？下文会讲具体的实现细节。

还有一个上图没有展示出来的细节是，Electron不会递归去转换对象，也就是说它只会转换一层。这样可以安全地引用存在循环引用的对象、另外所有属性值应该从远程获取最新的值，不能假设它的结构不可变。

<br>
<br>

## 对象的序列化

先来看看主进程的实现，它的代码位于[/lib/browser/rpc-server.js](https://github.com/electron/electron/blob/master/lib/browser/rpc-server.js)，代码很少而且很好理解，读者可以自己读一下。

这里我们不关注对象序列化的细节，重点关注对象的生命周期和调用的流程. 

<br>

以`remote.require`为例, 这个方法用于让主进程去require指定模块，然后返回模块内容给渲染进程：

```js
handleRemoteCommand('ELECTRON_BROWSER_REQUIRE', function (event, contextId, moduleName) {
  // 调用require
  const returnValue = process.mainModule.require(moduleName)

  // 将returnValue序列化为MetaData
  return valueToMeta(event.sender, contextId, returnValue)
})
```

`handleRemoteCommand` 使用[ipcMain](https://electronjs.org/docs/api/ipc-main)监听renderer发送的请求，`contextId`用于标识一个渲染进程。

<br>

`valueToMeta`方法将值序列化为MetaData:

```js
const valueToMeta = function (sender, contextId, value, optimizeSimpleObject = false) {
  // Determine the type of value.
  const meta = { type: typeof value }
  if (meta.type === 'object') {
    // Recognize certain types of objects.
    if (value === null) {
      meta.type = 'value'
    } else if (bufferUtils.isBuffer(value)) {
      // ... 🔴 基本类型
    }
  }

  if (meta.type === 'array') {
    // 🔴 数组转换
    meta.members = value.map((el) => valueToMeta(sender, contextId, el, optimizeSimpleObject))
  } else if (meta.type === 'object' || meta.type === 'function') {
    meta.name = value.constructor ? value.constructor.name : ''
    // 🔴 将对象保存到注册表中，并返回唯一的对象id.
    // Electron会假设渲染进程会一直引用这个对象, 直到渲染进程退出
    meta.id = objectsRegistry.add(sender, contextId, value)
    meta.members = getObjectMembers(value)
    meta.proto = getObjectPrototype(value)
  } else if (meta.type === 'buffer') {
    meta.value = bufferUtils.bufferToMeta(value)
  } else if (meta.type === 'promise') {
    // 🔴promise
    value.then(function () {}, function () {})
    meta.then = valueToMeta(sender, contextId, function (onFulfilled, onRejected) {
      value.then(onFulfilled, onRejected)
    })
  } else if (meta.type === 'error') {
    // 🔴错误对象
    meta.members = plainObjectToMeta(value)
    meta.members.push({
      name: 'name',
      value: value.name
    })
  } else if (meta.type === 'date') {
    // 🔴日期
    meta.value = value.getTime()
  } else {
    // 其他
    meta.type = 'value'
    meta.value = value
  }
  return meta
}
```

<br>
<br>

## 影子对象

![](/images/electron-remote/naruto.png)

渲染进程会从MetaData中反序列化的对象或函数, 不过这只是一个‘影子’，我们也可以将它们称为**影子对象**或者**代理对象**. 类似于火影忍者中的影分身之术，主体存储在主进程中，影子对象不包含任何实体数据，当访问这些对象或调用函数/方法时，影子对象直接远程请求。

> 渲染进程的代码可以看[这里](https://github.com/electron/electron/blob/master/lib/renderer/api/remote.js)

来看看渲染进程怎么创建‘影子对象’:

**函数的处理**:

```js
  if (meta.type === 'function') {
    // 🔴创建一个'影子'函数
    const remoteFunction = function (...args) {
      let command
      // 通过new Obj形式调用
      if (this && this.constructor === remoteFunction) {
        command = 'ELECTRON_BROWSER_CONSTRUCTOR'
      } else {
        command = 'ELECTRON_BROWSER_FUNCTION_CALL'
      }
      // 🔴同步IPC远程
      // wrapArgs将函数参数序列化为MetaData
      const obj = ipcRendererInternal.sendSync(command, contextId, meta.id, wrapArgs(args))
      // 🔴反序列化返回值
      return metaToValue(obj)
    }
    ret = remoteFunction

```

<br>

**对象成员的处理**:

```js
function setObjectMembers (ref, object, metaId, members) {
  for (const member of members) {
    if (object.hasOwnProperty(member.name)) continue

    const descriptor = { enumerable: member.enumerable }
    if (member.type === 'method') {
      // 🔴创建‘影子’方法. 和上面的函数调用差不多
      const remoteMemberFunction = function (...args) {
        let command
        if (this && this.constructor === remoteMemberFunction) {
          command = 'ELECTRON_BROWSER_MEMBER_CONSTRUCTOR'
        } else {
          command = 'ELECTRON_BROWSER_MEMBER_CALL'
        }
        const ret = ipcRendererInternal.sendSync(command, contextId, metaId, member.name, wrapArgs(args))
        return metaToValue(ret)
      }
      // ...

    } else if (member.type === 'get') {
      // 🔴属性的获取
      descriptor.get = () => {
        const command = 'ELECTRON_BROWSER_MEMBER_GET'
        const meta = ipcRendererInternal.sendSync(command, contextId, metaId, member.name)
        return metaToValue(meta)
      }

      // 🔴属性的设置
      if (member.writable) {
        descriptor.set = (value) => {
          const args = wrapArgs([value])
          const command = 'ELECTRON_BROWSER_MEMBER_SET'
          const meta = ipcRendererInternal.sendSync(command, contextId, metaId, member.name, args)
          if (meta != null) metaToValue(meta)
          return value
        }
      }
    }

    Object.defineProperty(object, member.name, descriptor)
  }
}
```

<br>
<br>

## 对象的生命周期

**主进程的`valueToMeta`会将每一个对象和函数都放入注册表中，包括每次函数调用的返回值**。

这是否意味着，如果频繁调用函数，会导致注册表暴涨占用太多内存呢？这些对象什么时候释放?

<br>

首先**当渲染进程销毁时，主进程会集中销毁掉该进程的所有对象引用**：

```js
// 渲染进程退出时会通过这个事件告诉主进程，但是这个并不能保证收到
handleRemoteCommand('ELECTRON_BROWSER_CONTEXT_RELEASE', (event, contextId) => {
  // 清空对象注册表
  objectsRegistry.clear(event.sender, contextId)
  return null
})
```

因为`ELECTRON_BROWSER_CONTEXT_RELEASE`不能保证能够收到，所以`objectsRegistry`还会监听对应渲染进程的销毁事件:

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
    //🔴 监听渲染进程销毁事件, 确保万无一失
    webContents.on('render-view-deleted', listener)
  }
}
```

<br>

等**到渲染进程销毁再去释放这些对象显然是无法接受的**，和网页不一样，桌面端应用可能会7*24不间断运行，如果要等到渲染进程退出才去回收对象, 最终会导致系统资源被消耗殆尽。

所以**Electron会在渲染进程中监听对象的垃圾回收事件，再通过IPC通知主进程来递减对应对象的引用计数**， 看看渲染进程是怎么做的：

```js
/**
 * 渲染进程，反序列化
 */
function metaToValue (meta) {
  // ...
  } else {
    // 对象类型转换
    let ret
    if (remoteObjectCache.has(meta.id)) {
      // 🔴 对象再一次被访问，递增对象引用计数. 
      // v8Util是electron原生模块
      v8Util.addRemoteObjectRef(contextId, meta.id)
      return remoteObjectCache.get(meta.id)
    }

    // 创建一个影子类表示远程函数对象
    if (meta.type === 'function') {
      const remoteFunction = function (...args) {
        // ...
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

<br>

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

  // 🔴 清空引用表
  ref_mapper_[context_id_].erase(object_id_);
  if (ref_mapper_[context_id_].empty())
    ref_mapper_.erase(context_id_);

  // 🔴 ipc通知主进程
  electron_ptr->Message(true, channel, args.Clone());
}
```

<br>

再回到主进程, 主进程监听`ELECTRON_BROWSER_DEREFERENCE`事件，并递减指定对象的引用计数：

```js
handleRemoteCommand('ELECTRON_BROWSER_DEREFERENCE', function (event, contextId, id, rendererSideRefCount) {
  objectsRegistry.remove(event.sender, contextId, id, rendererSideRefCount)
})
```

<br>

如果被上面的代码绕得优点晕，那就看看下面的流程图, 消化消化：

![](/images/electron-remote/lifetime.png)

<br>
<br>

## 渲染进程怎么给主进程传递回调

在渲染进程中，通过remote还可以给主进程的函数传递回调。其实跟主进程暴露函数/对象给渲染进程的原理一样，渲染进程在将回调传递给主进程之前会放置到**回调注册表**中，然后给主进程暴露一个callbackID。

渲染进程会调用`wrapArgs`将函数调用参数序列化为MetaData:

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
        // 🔴 给主进程传递callbackId，并添加到回调注册表中
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

<br>

回到主进程，这里也有一个对应的`unwrapArgs`函数来反序列化函数参数：

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
            // 🔴 调用时，通过IPC通知渲染进程
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

<br>

那回调什么时候释放呢？这个相比渲染进程的对象引用要简单很多，因为主进程只有一个。通过上面的代码可以知道, `setRemoteCallbackFreer`会监听影子回调是否被垃圾回收，一旦被垃圾回收了则通知渲染进程:

```js
// 渲染进程
handleMessage('ELECTRON_RENDERER_RELEASE_CALLBACK', (id) => {
  callbacksRegistry.remove(id)
})
```

<br>

按照惯例，来个流程图:

![](/images/electron-remote/callback.png)

<br>
<br>

## 一些缺陷

remote机制只是对远程对象的一个‘影分身’，无法百分百和远程对象的行为保持一致，下面是一些比较常见的缺陷:

- 当渲染进程调用远程对象的方法/函数时，是进行同步IPC通信的。换言之，同步IPC调用会阻塞用户代码的执行，而且跨端的通信效率无法和原生函数调用相比，所以频繁的IPC调用会影响主进程和渲染进程的性能.
- 主进程会保持引用每一个渲染进程访问的对象，包括函数的返回值。同理，频繁的远程对象请求，对内存的占用和垃圾回收造成不小的压力
- 无法完全模拟JavaScript对象的行为。比如在remote模块中存在这些问题:
  - 数组属于'基本对象'，它是通过值拷贝传递给对端的。也就是说它不是一个‘引用对象’，在对端修改它们时，无法反应到原始的数组.
  - 对象在第一次引用时，只有可枚举的属性可以远程访问。这也意味着，一开始对象的外形就确定下来了，如果远程对象动态扩展了属性，是无法被远程访问到的
  - 渲染进程传递的回调会被异步调用，而且主进程会忽略它的返回值。异步调用是为了避免产生死锁
- 对象泄露。
  - 如果远程对象在渲染进程中泄露（例如存储在映射中，但从未释放），则主进程中的相应对象也将被泄漏，所以您应该非常小心，不要泄漏远程对象。
  - 在给主进程传递回调时也要特别小心，主进程会保持回调的引用，直到它被释放。所以在使用remote模块进行一些‘事件订阅’时，切记要解除事件订阅.
  - 还有一种场景，下文会提到

<br>
<br>

## remote模块实践和优化

![](/images/electron-remote/gzb.png)

上面是我参与过的某个项目的软件架构图，`Hybrid`层使用C/C++编写，封装了跨平台的核心业务逻辑，在此之上来构建各个平台的视图。其中桌面端我们使用的是Electron技术。

如上图，Bridge进是对Hybrid的一层Node桥接封装。一个应用中只能有一个Bridge实例，因此我们的做法是使用Electron的remote模块，让渲染进程通过主进程间接地访问Bridge.

<br>

页面需要监听Bridge的一些事件，最初我们的代码是这样的:

```ts
// bridge.ts
// 使用remote的一个好处时，可以配合Typescript实现较好的类型检查
const bridge = electron.remote.require('bridge') as typeof import('bridge')

export default bridge
```

监听Bridge事件:

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

- 主进程需要为每一个addListener回调都维持一个引用。上面的代码会在页面关闭时释放订阅，但是它没有考虑用户刷新页面或者页面崩溃的场景。这会导致回调在主进程泄露。
  
  然而就算Electron可以在调用回调时发现回调在渲染进程已经被释放掉了，但是开发者却获取不到这些信息， Bridge会始终保持对影子回调的引用.

- 另外一个比较明显的是调用效率的问题。假设页面监听了N次A事件，当A事件触发时，主进程需要给这个页面发送N个通知。


<br>

后来我们抛弃了使用remote进行事件订阅这种方式，让主进程来维护这种订阅关系, 如下图:

![](/images/electron-remote/addListener2.png)

我们改进了很多东西：

**主进程现在只维护‘哪个页面’订阅了哪个事件，从‘绑定回调’进化成为‘绑定页面’**。这样可以解决上面调用效率和回调泄露问题、比如不会因为页面刷新导致回调泄露, 并且当事件触发时只会通知一次页面。

另外这里参考了remote本身的实现，在页面销毁时移除该页面的所有订阅。相比比remote黑盒，我们自己来实现这种事件订阅关系比之前要更好调试。

<br>
<br>

## 总结

remote模块对于Electron开发有很重要的意义，毕竟很多模块只有在主进程才能访问，比如BrowserWindow、dialog. 

相比ipc通信，remote实在方面很多。通过上文我们也了解了它的基本原理和缺陷，所以remote虽好，切忌不要滥用。

remote的源码也很容易理解，值得学习. 毕竟前端目前跨端通信非常常见，例如WebViewBridge、Worker. 

remote可以给你一些灵感，但是要完全照搬它是不可行的，因为比如它依赖一些v8 'Hack'来监听对象的垃圾回收，普通开发场景是做不到的。

本文完.

<br>
<br>

## 扩展

- [Electron remote 文档](https://electronjs.org/docs/api/remote)