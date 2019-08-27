---
title: "移动端JS百度地图问题与Chrome Performance调优记录"
date: 2019/6/20
categories: 前端
---

Chrome Performance是一块宝藏，它是一个窗口用来审视浏览器内部是怎么运作的。善用它对于提高我们的编程技艺很有帮助

## 从一个问题开始

我们最近在开发一个类似微信实时位置共享的应用, 主持人指定一个位置，要求其他成员前往。 每个用户通过WebSocket来上报自己的位置信息，或者获取其他成员位置信息：

![](/images/perf/overview.png)

前端工作也比较简单，在地图上绘制成员头像以及当前位置到目标位置的直线. 地图我们选用的是`百度地图`(别吐槽) + 我自己封装的[`react-bdmap`](https://github.com/ivan-94/react-bdmap)

上线试用后收到大量反馈说地图操作卡顿。打开控制台查看Websocket，发现大量消息推送，当时成员上报频率是1s，假设有N个成员，那么1s内本端需要会接收到N条信息，而后端需要1s内需要N*N次推送。浏览器这边需要对数据进行处理、比对、渲染React节点、再渲染到地图，压根处理不过来。

> 你可以通过这个Playground来模拟这个过程

当机立断，后端需要降低客户端位置上报的频率，再通过节流(Throttle)机制，合并推送给前端.

问题定位

百度移动端渲染问题

分析问题

React Fiber解决的问题

第一个解决方案

再一次优化

进一步优化

使用Performance User Timing API在Performance标记执行行为

Performance Timeline API, the Navigation Timing API, the User Timing API, and the Resource Timing API.

API结构
