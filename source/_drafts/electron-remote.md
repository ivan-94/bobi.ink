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

```
handleRemoteCommand('ELECTRON_BROWSER_DEREFERENCE', function (event, contextId, id, rendererSideRefCount) {
  objectsRegistry.remove(event.sender, contextId, id, rendererSideRefCount)
})
```

TODO: 流程图

<br>

## 渲染进程给主进程传递回调

## 渲染进程端实现

函数调用
对调的处理

## 一些坑

生命周期
传递回调
内存占用，所有对象都会被缓存起来？

## 扩展