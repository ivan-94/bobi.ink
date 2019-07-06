---
title: "[技术地图] 浏览器实时通信方案"
date: 2019/7/5
categories: 前端
---

sockjs
socket.io

## WebSocket

WebSocket其实不是本文的主角，而且网上已经有很多教程，本文的目的是介绍WebSocket之外的一些回退方案，在浏览器不支持Websocket的情况下回到这些方案.

WebSocket顾名思义

Websocket常见的一些限制

1. 浏览器兼容性
  - Safari wss下不允许使用非标准接口
2. 心跳

简单了解一些Websocket的原理

进一步学习:

- [WebSocket 浅析](https://mp.weixin.qq.com/s/7aXMdnajINt0C5dcJy2USg?)

## XHR-streaming
## EventSource
## HtmlFile
## Polling