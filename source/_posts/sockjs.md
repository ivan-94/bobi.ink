---
title: "[技术地图] 你可能不知道的浏览器实时通信方案"
date: 2019/7/7
categories: 前端
---

sockjs
socket.io

<!-- TOC -->

- [WebSocket](#websocket)
- [XHR-streaming](#xhr-streaming)
- [EventSource](#eventsource)
- [Polling](#polling)

<!-- /TOC -->

## WebSocket

WebSocket其实不是本文的主角，而且网上已经有很多教程，本文的目的是介绍WebSocket之外的一些回退方案，在浏览器不支持Websocket的情况下回到这些方案.

WebSocket顾名思义. WebSocket 是浏览器中最靠近套接字的API，除最初建立连接时需要借助于现有的HTTP协议，其他时候直接基于TCP完成通信。

它的接口非常简单：

我们这里通过一张图，通俗地理解一下Websocket的原理:

复用TCP连接, 全双工

如果不考虑低版本IE，基本上WebSocket不会有什么兼容性上面的顾虑，Websocket常见的一些限制

1. 浏览器兼容性
  - Safari wss下不允许使用非标准接口
2. 心跳
3. 一些负载均衡或代理不支持Websocket

简单了解一些Websocket的原理

进一步学习:

- [WebSocket 浅析](https://mp.weixin.qq.com/s/7aXMdnajINt0C5dcJy2USg?)
- [阮一峰：WebSocket 教程](http://www.ruanyifeng.com/blog/2017/05/websocket.html)

<br>
<br>

## XHR-streaming

XHR-streaming的原理也比较简单，就是服务器端不终止HTTP的输出流，让HTTP始终处于连接状态，当有数据需要发送给客户端时再进行写入。

persistent connection
单工(unidirectional)

正常的HTTP请求处理是这样的：

```js
const http = require('http')

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  })
  res.write('hello world')
  res.end() // 终止输出流
})
```

客户端会理解接收到响应:

![](/images/sockjs/http-req.png)

现在我们不终止响应流，看会有什么情况:

```js
const http = require('http')

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  })
  res.write('hello world')
  // res.end() // 终止输出流
})
```

我们会发现请求会一直处于Pending状态，除非出现异常、服务器关闭或显式关闭连接(比如设置超时机制)，请求是不会终止的。即使处于Pending状态客户端还是可以接收数据，不必等待请求结束:

![](/images/sockjs/http-pending-req.png)

基于这个原理我们来创建一个简单的ping-pong服务器:

```js
const server = http.createServer((req, res) => {
  if (req.url === '/ping') {
    // ping请求
    if (pendingResponse == null) {
      res.writeHead(500);
      res.write('session not found');
      res.end();
      return;
    }

    pendingResponse.write('pong\n');
    res.writeHead(200)
    res.end()
  } else {
    // 保存句柄
    res.writeHead(200, {
      'Content-Type': 'text/plain',
    });
    res.write('welcome to ping\n');
    pendingResponse = res
  }
});
```

测试一下，在另一个窗口访问`/ping`路径：

![](/images/sockjs/http-stream-ping.png)

Ok! 这就是XHR-Streaming。那么Ajax怎么接收这些数据呢？ 第一种做法是在`XMLHttpRequest`的`onreadystatechange`事件中判断`readyState`是否等于`XMLHttpRequest.LOADING`；另外一种做法是在`xhr.onprogress`事件处理器中处理。下面是ping客户端实现:

```js
function listen() {
  const xhr = new XMLHttpRequest();
  xhr.onprogress = () => {
    // 注意responseText是获取服务端发送的数据，如果要获取未读数据，则需要进行裁剪
    console.log('progress', xhr.responseText);
  }
  xhr.open('POST', HOST);
  xhr.send(null);
}

function ping() {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', HOST + '/ping');
  xhr.send(null);
}

listen();
setInterval(ping, 5000);
```

不要高兴得太早😰, 如果运行上面的代码会发现`onprogress`并没有被正常的触发, 具体原因笔者也没有深入研究，我发现sockjs的服务器源码里面会预先写入2049个字节，这样就可以正常触发onprogress事件了:

```js
const server = http.createServer((req, res) => {
  if (req.url === '/ping') {
    // ping请求
    // ...
  } else {
    // 保存句柄
    res.writeHead(200, {
      'Content-Type': 'text/plain',
    });
    res.write(Array(2049).join('h') + '\n');
    pendingResponse = res
  }
});
```

最后再图解一些XHR-streaming的原理:

![](/images/sockjs/xhr-stream.png)

浏览器端http请求，响应则通过xhr-streaming

## EventSource

[`EventSource`](https://developer.mozilla.org/zh-CN/docs/Server-sent_events/EventSource)并不是什么新鲜玩意，它就是上面讲的`XHR-streaming`, 只不过浏览器给它提供了标准的API封装和协议, 抓包一看和XHR-streaming没有太大的区别:

![](/images/sockjs/eventsource.png)

上面可以看到请求的`Accept`为`text/event-stream`, 且服务端写入的数据都有标准的约定, 即载荷需要这样组织:

```js
const data = `data: ${payload}\r\n\r\n`
```

实例:

```js
const evtSource = new EventSource('sse.php');

evtSource.onmessage = function(e) {
  // do something
  // ...
  console.log("message: " + e.data)

  // 关闭流
  evtSource.close()
}
```

因为是标准的，浏览器调试也比较方便，不需要借助第三方抓包工具:

![](/images/sockjs/eventsource.png)

## Polling

轮询是最粗暴，或者说最简单的‘实时’通信方案，这种方式的原理就是定期到服务器拉取消息队列，sockjs的实现方式如下:

![](/images/sockjs/polling.png)

sockjs的客户端向服务端发起一个消息获取请求，服务端会将当前的消息队列返回给客户端，然后关闭连接。当消息队列为空时，服务端不会立即关闭连接，而是由客户端主动超时关闭连接。

当然还有一种更粗暴的：由客户端定期发起消息请求

![](/images/sockjs/polling2.png)

DDP