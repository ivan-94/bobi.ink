---
title: '[技术地图] CodeSandbox 如何工作?'
date: 2019/6/10
categories: 前端
---

主要模块

- app
  - app 包含编辑器
  - embed 网页内嵌运行codesandbox
  - sandbox 运行沙盒，在这里执行代码构建和预览，相当于一个缩略版的webpack. 运行在单独的iframe中
- codesandbox-api: 封装了统一的协议，用于sandbox和editor之间通信
- codesandbox-browserfs: 这是一个浏览器端的‘文件系统’，模拟了NodeJS的文件系统API，支持在本地或从多个后端服务中存储或获取文件.

## 项目构建

构建阶段

transpilation -> evaluation

Manifest 机制，和webpack的DLL差价的Manifest一样

npm 依赖的模块
- 包信息获取 https://unpkg.com/antd@3.17.0/?meta 这个会递归返回该包的所有目录信息
- 具体文件获取 https://cdn.jsdelivr.net/npm/@babel/runtime@7.3.1/helpers/interopRequireDefault.js
- 包信息的缓存：Service worker

依赖树的建立

基本对象

Manager 负责管理模块信息和进行转移以及求值
Manifest 如上
Module 模块信息, 模块信息，包含代码, 路径已经依赖模块
TranspiledModule 已转译的模块, 真正负责模块的转译工作
  - ModuleSource 模块源码，包含sourcemap和转译后的代码
  - 子模块 什么是子模块

## 扩展

- [Creating a parallel, offline, extensible, browser based bundler for CodeSandbox](https://hackernoon.com/how-i-created-a-parallel-offline-extensible-browser-based-bundler-886db508cc31)