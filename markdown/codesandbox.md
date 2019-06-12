---
title: '[技术地图] CodeSandbox 如何工作? 上篇'
date: 2019/6/10
categories: 前端
---

这期来关注一下[`Codesandbox`](https://codesandbox.io), 这是一个浏览器端的沙盒运行环境，支持多种流行的构建模板，例如 create-react-app, vue-cli。 可以用于快速原型开发、DEMO 展示、Bug 还原等等.

相似的产品有很多，例如[`codepen`](https://codepen.io/pen)、[JSFiddle](https://jsfiddle.net)、[WebpackBin](https://webpackbin-prod.firebaseapp.com)(已废弃). Codesandbox 则更加强大，可以视作是浏览器端的 webpack 运行环境, 在 V3 版本已经支持 VsCode 模式，支持 Vscode 的插件和 Vim 模式、还有主题.

而且 CodeSandbox 支持离线运行(PWA)。基本上可以接近本地 VSCode 的编程体验. 有 iPad 的同学，也可以尝试基于它来进行开发。所以快速的原型开发我一般会直接使用 CodeSandbox

## 基本架构

![](https://bobi.ink/images/08/codesandbox.png)

笔者对 CodeSandbox 的第一印象是这玩意是运行在服务器的吧？比如 create-react-app 要运行起来需要 node 环境，需要通过 npm 安装一大堆依赖，然后通过 webpack 进行打包，还要运行一个开发服务器才能在浏览器跑起来.

实际上CodeSandbox打包和运行并不依赖于服务器, 它是完全在浏览器进行的. 大概的结构如下:

主要模块

- app
  - app 包含编辑器
  - embed 网页内嵌运行 codesandbox
  - sandbox 运行沙盒，在这里执行代码构建和预览，相当于一个缩略版的 webpack. 运行在单独的 iframe 中
- codesandbox-api: 封装了统一的协议，用于 sandbox 和 editor 之间通信
- codesandbox-browserfs: 这是一个浏览器端的‘文件系统’，模拟了 NodeJS 的文件系统 API，支持在本地或从多个后端服务中存储或获取文件.

## 项目构建

构建阶段

transpilation -> evaluation

Manifest 机制，和 webpack 的 DLL 差价的 Manifest 一样

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

- ModuleSource 模块源码，包含 sourcemap 和转译后的代码
- 子模块 什么是子模块

## 扩展

- [Creating a parallel, offline, extensible, browser based bundler for CodeSandbox](https://hackernoon.com/how-i-created-a-parallel-offline-extensible-browser-based-bundler-886db508cc31)
- [year of CodeSandbox - Ives van Hoorne aka @CompuIves at @ReactEurope 2018](https://www.youtube.com/watch?v=qURPenhndYA)
