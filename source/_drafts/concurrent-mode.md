---
title: "React Concurrent Mode 抢先预览"
date: 2019/7/15
categories: 前端
---

2019.10.24, 在React Conf 2019召开首日， React 官方正式发布了Concurrent Mode的第一个早期社区预览版本, 正式和React 的大众开发者见面, 令人兴奋。

而去年的React Conf 上， React 则发布了 React Hook，同样是预览版本，这说明Concurrent Mode 很快也会走上正式的轨道上...

这个大招憋了四年多: TODO: Dan 的Twitter

## 什么是Concurrent Mode?

这是一个特性集合，可以让你的React 应用保持响应，可以根据用户的设备能力和网络情况优雅地调整。

**上一周，我抢在React Conf 2019 之前发布了一篇文章[《这可能是最通俗的 React Fiber(时间分片) 打开方式》](https://juejin.im/post/5dadc6045188255a270a0f85)（机智），你要了解Concurrent Mode, 强烈建议从这篇文章开始！**

所以这篇文章，我就不再深入解释 `Concurrent Mode` 是什么了，本文主要内容来源于 React 官方的 [《Introducing Concurrent Mode (Experimental)》](https://reactjs.org/docs/concurrent-mode-intro.html)

![](/images/concurrent-mode/cpu-vs-io.jpg)

**Concurrent Mode 是一个特性集合，它包含两个方向的优化**:

- CPU 密集型(CPU-bound) 更新(Reconcilation). 对于CPU 密集型的更新，可以被中断, 让位给高优先级的任务，让应用保持响应.
- I/O 密集型(CPU-bound) 更新(异步数据加载). 
  - React 可以在内存中**预渲染**，等待数据到达，然后一次性渲染出来，减少中间的加载状态的显示和页面抖动/闪烁。它的假定条件时：大部分情况下，数据的加载是非常快。加载状态会让用户觉得卡顿。
  - 另外利用Suspense 可以轻松实现发起‘并发’的‘数据请求’
  - 避免数据竞态

<br>

## 开启

## I/O: Suspense

在 16.5 已经有了这个API，大家应该比较熟悉

TODO: suspense + lazy，取代react-loadable

现在可以
Suspense + fetch data/promise  异步任务

### 怎么理解Suspense？

如果将英文翻译为等待、悬垂、悬停。React给出了一个更规范的定义：

**Suspense 不是一个‘数据获取库’, 而是一种提供给‘数据获取库’的‘机制’，通过这种机制告诉 React 数据还没有准备好，然后 React就会等待它完成，接着才更新UI** 所以 Suspense 主要用来在组件中异步加载数据。

<br>

之前早就有人剖析过 `Suspense` 的实现，它利用了React 的ErrorBoundary 机制来实现

[React：Suspense的实现与探讨](https://zhuanlan.zhihu.com/p/34210780)

react-cache

提供了内置的异步操作和异常处理原语

### 并发发起请求

### 处理竞态

### 错误处理

### 过渡

提供了多个‘复杂’的接口来实现页面的过渡

一次性刷新页面

## CPU: Time Slicing
