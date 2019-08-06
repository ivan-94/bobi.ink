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

生命周期管理，防止垃圾回收
递归

## 主进程端实现

## 渲染进程端实现

函数调用
对调的处理

## 一些坑

生命周期
传递回调
内存占用，所有对象都会被缓存起来？

## 扩展