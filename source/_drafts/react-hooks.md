---
title: "2019年了，整理了N个应用案例帮你快速迁移到React Hooks"
date: 2019/8/10
categories: 前端
---

在[React Conf 2018](https://www.youtube.com/channel/UCz5vTaEhvh7dOHEyd1efcaQ)宣布React Hooks后，我就开始尝试使用React Hooks，现在新项目基本不写Class Component了。对我来说，它确实让我的开发效率提高了很多，它改变了已有的组件开发思维和模式. 

我在[React组件设计实践总结04 - 组件的思维](https://juejin.im/post/5cdc2f54e51d453b0c35930d#heading-3)中已经总结过React Hooks的意义，以及一些应用场景。那这篇文章就完全是React Hooks的应用实例，列举了我使用React Hooks的一些实践。

希望通过这些案例，可以帮助你快速迁移到React Hooks

把之前文章的React Hooks应用场景总结拿过来:

![](/images/react-hooks/apply.png)

<br>

**目录索引**

<!-- TOC -->

- [数据存取](#数据存取)
- [组件状态](#组件状态)
  - [实现setState](#实现setstate)
  - [reducer](#reducer)
  - [useSession 简化localStorage存取](#usesession-简化localstorage存取)
    - [useQuery](#usequery)
  - [useInstance](#useinstance)
  - [封装一些工具hooks](#封装一些工具hooks)
  - [获取最新的值](#获取最新的值)
- [简单状态管理](#简单状态管理)
  - [context获取](#context获取)
    - [useTheme](#usetheme)
    - [useI18n](#usei18n)
    - [useRouter](#userouter)
- [props处理](#props处理)
  - [获取上一个Props](#获取上一个props)
  - [useWhyUpdate](#usewhyupdate)
- [模拟生命周期函数](#模拟生命周期函数)
- [事件处理](#事件处理)
  - [useChange](#usechange)
  - [自定义事件封装](#自定义事件封装)
  - [订阅](#订阅)
- [副作用封装](#副作用封装)
  - [useTitle](#usetitle)
  - [useNetworkStatus](#usenetworkstatus)
  - [useDebounce](#usedebounce)
- [简化业务逻辑](#简化业务逻辑)
  - [usePromise封装异步请求](#usepromise封装异步请求)
  - [usePromiseOnMount](#usepromiseonmount)
  - [useList](#uselist)
  - [业务逻辑抽离](#业务逻辑抽离)
- [React Hooks的生态](#react-hooks的生态)
- [扩展](#扩展)

<!-- /TOC -->

## 数据存取

## 组件状态
### 实现setState
### reducer
### useSession 简化localStorage存取
#### useQuery
### useInstance
### 封装一些工具hooks
  #### useToggle
  #### useArray
### 获取最新的值

## 简单状态管理

unstaged

### context获取

#### useTheme
#### useI18n

#### useRouter

## props处理

### 获取上一个Props
### useWhyUpdate

## 模拟生命周期函数

## 事件处理

### useChange
### 自定义事件封装
  #### useFocus
  #### useDraggable
  #### useListener (react-events)

### 订阅

## 副作用封装

### useTitle
### useNetworkStatus
### useDebounce

## 简化业务逻辑

### usePromise封装异步请求
### usePromiseOnMount
### useList
### 业务逻辑抽离

## React Hooks的生态

redux
react-spring
react-router
mobx
appoll

## 扩展

![Awesome React Hooks](https://github.com/rehooks/awesome-react-hooks)