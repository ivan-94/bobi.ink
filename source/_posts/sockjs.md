---
title: "[技术地图] 你可能不知道的浏览器实时通信方案"
date: 2019/7/7
categories: 前端
---

sockjs
socket.io

低延时数据传输方法

<!-- TOC -->

- [WebSocket](#websocket)
- [XHR-streaming](#xhr-streaming)
- [EventSource](#eventsource)
- [HtmlFile](#htmlfile)
- [Polling](#polling)
  - [长轮询(Long polling)](#长轮询long-polling)
- [DDP](#ddp)
- [扩展](#扩展)

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

XHR-streaming的原理也比较简单，就是服务器端不终止HTTP的输出流，让HTTP始终处于连接状态，当有数据需要发送给客户端时再进行写入数据。它的特点就是:

- 利用持久化连接(persistent connection): 服务器不关闭输出流，连接就不会关闭
- 单工(unidirectional): 只允许服务器向浏览器单向的推送数据

我们正常的HTTP请求处理是这样的：

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

通过XHR-Streaming，可以允许服务端连续地发送消息，无需每次响应后再去建立一个连接, 所以它是除了Websocket之外最为高效的实时通信方案. 但它也并不是完美无缺。

比如XHR-streaming连接的时间越长，浏览器会占用过多内存，而且在每一次新的数据到来时，需要对消息进行划分，剔除掉已经接收的数据. 所以sockjs对它进行了优化, sockjs默认只允许每个xhr-streaming连接输出128kb数据，超过这个大小时会关闭输出流，让浏览器重新发起请求.

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

## HtmlFile

这是一种古老的‘秘术’😂，我们可能永远都不会再用到它，但是它的实现方式比较有意思，类似于JSONP这种黑科技, 所以还是值得讲一下。

HtmlFile的另一个名字叫做`永久frame(forever-frame)`, 顾名思义, 浏览器会打开一个隐藏的iframe，这个iframe请求一个分块编码的html文件(Transfer-Encoding: chunked), 和XHR-Streaming一样，这个请求永远都不会结束，服务器会不断在这个文档上输出内容。**这里面的要点是浏览器会增量渲染html文件，所以服务器可以通过添加script标签在客户端执行某些代码**，先来看个抓包的实例:

![](/images/sockjs/htmlfile.png)

从上图可以看出:

- ① 这里会给浏览器传递一个callback，通过这个callback将数据传递给父文档
- ② 服务器每当有新的数据，就向文档追加一个`<script>`标签，script的代码就是将数据传递给callback。利用浏览器会被下载边解析HTML文档的特性，新增的script会马上被执行

最后还是用流程图描述一下：

![](/images/sockjs/htmlfile-progress.png)

除了IE6、7以下不支持，大部分浏览器都支持这个方案，当浏览器不支持`XHR-streaming`时，可以作为备选方案。

## Polling

轮询是最粗暴(或者说最简单)，也是效率最低下的‘实时’通信方案，这种方式的原理就是定期向服务器发起请求, 拉取最新的消息队列:

![](/images/sockjs/polling2.png)

这种轮询方式比较合适**服务器的信息定期更新**的场景，如天气和股票行情信息。举个例子股票信息每隔5分钟更新一次，这时候客户端定期轮询, 且轮询间隔和服务端更新频率保持一致是一种理想的方式。

但是如果追求实时性，轮询会导致一些严重的问题:

- 资源浪费。比如轮询的间隔低于服务器信息更新的频率，这会浪费很多HTTP请求, 消耗宝贵的CPU时间和带宽
- 容易导致请求轰炸。比如当服务器负载比较高时，第一个请求还没处理完成，这时候第二、第三个请求接踵而来，无用的额外请求对服务端进行了轰炸。

### 长轮询(Long polling)

还有一种轮询方法，成为长轮询(Long Polling)，sockjs就是使用这种轮询方式: 长轮询指的是浏览器发送一个请求到服务器，服务器只有在有可用的新数据时才响应：

![](/images/sockjs/polling.png)

sockjs的客户端向服务端发起一个消息获取请求，服务端会将当前的消息队列返回给客户端，然后关闭连接。当消息队列为空时，服务端不会立即关闭连接，而是等待指定的时间间隔，如果在这个时间间隔内没有新的消息， 则由客户端主动超时关闭连接。

另外一个要点时，客户端的轮询请求只有在上一个请求连接关闭后才会重新发起。这就解决了上文的请求轰炸问题。而且服务端可以控制客户端发起请求的时序，因为在服务端未响应之前，客户端不会发送额外的请求(在超时期间内)。


## DDP

## 扩展

- [程序员怎么会不知道C10K 问题呢？ - 池建强- Medium](https://medium.com/@chijianqiang/程序员怎么会不知道-c10k-问题呢-d024cb7880f3)