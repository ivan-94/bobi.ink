---
title: 浅谈React性能优化的方向
date: 2019/6/14
categories: 前端
---

<!-- TOC -->

- [减少渲染的节点](#减少渲染的节点)
  - [1️⃣ 减少不必要的嵌套](#1️⃣-减少不必要的嵌套)
  - [2️⃣ 虚拟列表](#2️⃣-虚拟列表)
- [减少重新渲染](#减少重新渲染)
  - [1️⃣ 纯组件](#1️⃣-纯组件)
- [精细化渲染](#精细化渲染)
  - [减少不必要的 Context, 关键数据、共享数据](#减少不必要的-context-关键数据共享数据)
  - [响应式数据的精细化控制 mobx](#响应式数据的精细化控制-mobx)

<!-- /TOC -->

从内部的一个项目优化进行总结

## 减少渲染的节点

从渲染节点的量上下功夫，减少节点渲染的数量可以显著的提高组件渲染性能。

### 1️⃣ 减少不必要的嵌套

<center>
 <img src="/images/09/styled-components.png" />
</center>

我们团队是重度的 `styled-components` 用户，其实大部分情况下我们都不需要这个玩意，比如在需要重度性能优化的场景。除了性能问题，另外一个困扰我们的是它带来的节点嵌套地狱(如上图)。所以我们需要理性地选择一些工具，比如使用原生的 CSS，减少 React 运行时的负担.

一般不必要的节点嵌套都是使用高阶组件导致的，所以不要滥用高阶组件.

### 2️⃣ 虚拟列表

虚拟列表是常见的长列表优化方式，它优化的本质也是减少渲染的节点。虚拟列表只渲染当前视口可见元素.

<center>
 <img src="/images/09/vl.png" width="500" />
</center>

虚拟列表渲染性能对比:

<center>
 <img src="/images/09/vl-compare.png" width="500" />
</center>

虚拟列表常用于一下组件场景:

- 无限滚动列表，grid, 表格，下拉列表，spreadsheets
- 无限切换的日历或轮播图
- 无限嵌套的组件树
- 聊天窗，数据流(feed)
- 等等

相关组件方案:

- [react-virtualized](https://github.com/bvaughn/react-virtualized)
- [react-window](https://github.com/bvaughn/react-window) 更轻量的react-virtualized, 同出一个作者
- [更多](https://github.com/bvaughn/react-virtualized#friends)

扩展：

- [Creating more efficient React views with windowing](https://bvaughn.github.io/forward-js-2017/#/0/0)
- [Rendering large lists with react-window](https://addyosmani.com/blog/react-window/)

## 减少重新渲染

### 1️⃣ 纯组件

Memo, shouldComponent
简化 props, 转换 boolean 一方面提高 compare 效率，一方面减少变化的可能性
recompose 精细化比对

## 精细化渲染

### 减少不必要的 Context, 关键数据、共享数据

### 响应式数据的精细化控制 mobx
