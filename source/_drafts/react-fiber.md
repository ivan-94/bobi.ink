---
title: "换个角度理解 React Fiber"
date: 2019/7/10
categories: 前端
---

这个Flag立了很久，今天终于下定决心好好写一篇关于React Fiber的文章。这篇文章不会展示Fiber的源代码，会以最通俗的方式将它讲透。

Fiber 门槛很高，不理解后续React Killer Feature可能无法理解

一年一度的React Conf

还没有，目前异步功能在官方React也要到17才支持

## Fiber 不是一个新的东西

DOCS

单核多进程调度策略

考虑的因素

公平性
  长进程、短进程
  IO密集，CPU密集
响应
优先级

## 何为 Fiber?

Ruby Fiber, Geneerator, 让出机制

没办法抢占

基于时间片的主动让出机制，无法限制用户代码执行时间。

优先级机制

anujs 站在巨人的肩膀上

## 检查点与任务的拆分

两个阶段
更新节点任务

## 数据结构的调整

栈 vs 链表

## 优先级与调度

requestIdleCallback

## 中断和恢复

超时终端，更新恢复/合并

## 缺陷

高优先级任务太多，低优先级
