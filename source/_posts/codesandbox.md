---
title: '[技术地图] CodeSandbox 如何工作? 上篇'
date: 2019/6/10
categories: 前端
---

这期来关注一下[`Codesandbox`](https://codesandbox.io), 这是一个浏览器端的沙盒运行环境，支持多种流行的构建模板，例如 create-react-app, vue-cli。 可以用于快速原型开发、DEMO 展示、Bug 还原等等.

相似的产品有很多，例如[`codepen`](https://codepen.io/pen)、[JSFiddle](https://jsfiddle.net)、[WebpackBin](https://webpackbin-prod.firebaseapp.com)(已废弃). Codesandbox 则更加强大，可以视作是浏览器端的 webpack 运行环境, 在 V3 版本已经支持 VsCode 模式，支持 Vscode 的插件和 Vim 模式、还有主题.

而且 CodeSandbox 支持离线运行(PWA)。基本上可以接近本地 VSCode 的编程体验. 有 iPad 的同学，也可以尝试基于它来进行开发。所以快速的原型开发我一般会直接使用 CodeSandbox

<!-- TOC -->

- [基本架构](#基本架构)
- [基本目录结构](#基本目录结构)
- [项目构建](#项目构建)
  - [Packager](#packager)
  - [Transpilation](#transpilation)
  - [Evaluation](#evaluation)
- [扩展](#扩展)

<!-- /TOC -->

## 基本架构

![](/images/08/codesandbox.png)

笔者对 CodeSandbox 的第一印象是这玩意是运行在服务器的吧？比如 create-react-app 要运行起来需要 node 环境，需要通过 npm 安装一大堆依赖，然后通过 webpack 进行打包，还要运行一个开发服务器才能在浏览器跑起来.

实际上 CodeSandbox 打包和运行并不依赖于服务器, 它是完全在浏览器进行的. 大概的结构如下:

<center>
 <img src="/images/08/codesandbox-arch.png" width="400" />
</center>

- **Editor** 编辑器。主要用于修改文件，这里集成了 Vscode, 文件变动后会通知 Preview 进行编译. 计划下一篇文章会介绍这一块.
- **Preview** 运行结果展示。**Preview 在一个单独的 iframe 中运行, 负责代码的转译(Transpiler)和运行(Evalation)**
- **Packager** 包管理器。负责拉取和缓存 npm 依赖

CodeSandbox 的作者 Ives van Hoorne 也尝试过将 Webpack 移植到浏览器上运行，因为现在几乎所有的 CLI 都是使用 webpack 进行构建的，如果能将 webpack 移植到浏览器上, 可以利用 Webpack 强大的生态环境和转译机制(loader/plugin)，也可以低成本兼容各种 CLI.

然而 Webpack 太重了，压缩过后的大小就得 3.5MB，这还算勉强可以接受，但是要在浏览器端模拟 Node 运行环境，这个成本太高了，得不偿失。

所以 CodeSandbox 决定自己造个打包器，这个打包器更轻量，并且针对 CodeSandbox 平台进行优化, 比如 CodeSandbox 只关心开发环境的代码构建, 跟 Webpack 相比裁剪掉了以下特性:

- Tree-shaking
- 性能优化
- 模式。CodeSandbox只考虑development模式，不需要考虑production
- 文件输出
- 服务器通信。webpack需要和开发服务器建立一个长连接用于接收指令，例如HMR
- 插件等等。

CodeSandbox 的打包器使用了接近 Webpack Loader 的 API, 这样可以很容易地将 webpack 的一些 loader 移植过来.

来看看 Create-react-app 的实现(查看[源码](https://github.com/codesandbox/codesandbox-client/blob/84972fd027fe36c53652c22f6775e1e6d3c51145/packages/app/src/sandbox/eval/presets/create-react-app/index.js#L1)):

```jsx
import stylesTranspiler from '../../transpilers/style';
import babelTranspiler from '../../transpilers/babe';
// ...
import sassTranspiler from '../../transpilers/sass';
// ...
const preset = new Preset(
  'create-react-app',
  ['web.js', 'js', 'json', 'web.jsx', 'jsx', 'ts', 'tsx'],
  {
    hasDotEnv: true,
    setup: manager => {
      const babelOptions = {
        /*..*/
      };
      preset.registerTranspiler(
        module =>
          /\.(t|j)sx?$/.test(module.path) && !module.path.endsWith('.d.ts'),
        [
          {
            transpiler: babelTranspiler,
            options: babelOptions,
          },
        ],
        true,
      );
      preset.registerTranspiler(
        module => /\.svg$/.test(module.path),
        [
          { transpiler: svgrTranspiler },
          {
            transpiler: babelTranspiler,
            options: babelOptions,
          },
        ],
        true,
      );
      // ...
    },
  },
);
```

因此，目前你使用 CodeSandbox 内置的 Preset, 不支持像 webpack 一样进行配置, 个人觉得这个是符合 CodeSandbox 定位的，这是一个快速的原型开发工具，你还折腾 webpack 干嘛？

## 基本目录结构

CodeSandbox 的客户端是开源的，不然就没有本文了，它的基本目录结构如下:

```shell
- packages
  - app CodeSandbox应用
    - app 包含编辑器
    - embed 网页内嵌运行 codesandbox
    - sandbox 运行沙盒，在这里执行代码构建和预览，相当于一个缩略版的 webpack. 运行在单独的 iframe 中
  - codesandbox-api: 封装了统一的协议，用于 sandbox 和 editor 之间通信(基于postmessage)
  - codesandbox-browserfs: 这是一个浏览器端的‘文件系统’，模拟了 NodeJS 的文件系统 API，支持在本地或从多个后端服务中存储或获取文件.
```

## 项目构建

构建阶段

`packager -> transpilation -> evaluation`


CodeSandbox构建分为三个阶段:

- packager 包加载阶段，下载和处理所有模块依赖
- transpilation 转译阶段，转译所有变动的代码
- evaluation 执行阶段，使用eval执行模块代码进行预览

下面会按照上述的步骤来描述其中的技术点

### Packager

npm 依赖的模块

- 包信息获取 https://unpkg.com/antd@3.17.0/?meta 这个会递归返回该包的所有目录信息
- 具体文件获取 https://cdn.jsdelivr.net/npm/@babel/runtime@7.3.1/helpers/interopRequireDefault.js
- 包信息的缓存：Service worker
Manifest 机制，和 webpack 的 DLL 差价的 Manifest 一样

流程图

### Transpilation

基本对象

Manager 负责管理模块信息和进行转移以及求值
Manifest 如上
Module 模块信息, 模块信息，包含代码, 路径已经依赖模块
TranspiledModule 已转译的模块, 真正负责模块的转译工作

- ModuleSource 模块源码，包含 sourcemap 和转译后的代码
- 子模块 什么是子模块

依赖树的建立
静态资源处理
代码分隔
多进程转译
流程图

### Evaluation

执行过程
HMR


## 扩展

- [Creating a parallel, offline, extensible, browser based bundler for CodeSandbox](https://hackernoon.com/how-i-created-a-parallel-offline-extensible-browser-based-bundler-886db508cc31)
- [year of CodeSandbox - Ives van Hoorne aka @CompuIves at @ReactEurope 2018](https://www.youtube.com/watch?v=qURPenhndYA)
