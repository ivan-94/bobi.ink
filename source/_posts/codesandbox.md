---
title: '[技术地图] CodeSandbox 如何工作? 上篇'
date: 2019/6/20
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
- [技术地图](#技术地图)
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
- 模式。CodeSandbox 只考虑 development 模式，不需要考虑 production
- 文件输出
- 服务器通信。webpack 需要和开发服务器建立一个长连接用于接收指令，例如 HMR
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

CodeSandbox 构建分为三个阶段:

- packager 包加载阶段，下载和处理所有模块依赖
- transpilation 转译阶段，转译所有变动的代码
- evaluation 执行阶段，使用 eval 执行模块代码进行预览

下面会按照上述的步骤来描述其中的技术点

### Packager

尽管 npm 是个'黑洞'，我们还是离不开它。 目前端项目的 node_modules 体积大，80%是各种开发依赖组成的. 由于 CodeSandbox 包揽了代码构建的部分，所以我们不需要`devDependencies`, 也就是说 CodeSandbox 中我们只需要按照所有实际代码需要的依赖，这可以减少成百上千的依赖下载. 所以暂且可以不用担心浏览器会扛不住.

CodeSandbox 的打包方式受 `WebpackDllPlugin` 启发，DllPlugin 会将所有依赖都打包到一个文件中，并创建一个 `manifest` 文件(如下图), webpack 运行时可以根据 manifest 中的模块索引(例如`__webpack_require__('../node_modules/react/index.js')`)来加载 dll 中的模块。

![](/images/08/webpack-dll-manifest.png)

基于这个思想, CodeSandbox 构建了自己的在线打包工具, 具体思路如下:

![流程图](/images/08/packager1.png)

简而言之，CodeSandbox 客户端只是简单构建一个由依赖和版本号组成的`Combination`(标识符), 再拿这个 Combination 到服务器请求。服务器会根据 Combination 来缓存打包结果，如果没有命中缓存，则进行打包.

**打包首先使用`yarn`来下载所有依赖，为了剔除 npm 模块中多余的文件，服务端还遍历了所有依赖的入口文件(package.json#main), 解析 AST 中的 require 语句，递归解析被 require 模块，最终形成一个依赖图**. 也就是 Manifest 文件，它的结构大概如下:

```js
{
  // 模块内容
  "contents": {
    "/node_modules/react/index.js": {
      "content": "'use strict';↵↵if ....", // 代码内容
      "requires": [                        // 依赖的其他模块
        "./cjs/react.development.js",
      ],
    },
    "/node_modules/react-dom/index.js": {/*..*/},
    "/node_modules/react/package.json": {/*...*/},
    //...
  },
  // 模块具体安装版本号
  "dependencies": [{name: "@babel/runtime", version: "7.3.1"}, {name: "csbbust", version: "1.0.0"},/*…*/],
  // 模块别名, 比如将react作为preact-compat的别名
  "dependencyAliases": {},
  // 依赖的依赖, 即间接依赖信息. 这些信息可以从yarn.lock获取
  "dependencyDependencies": {
    "object-assign": {
      "entries": ["object-assign"], // 模块入口
      "parents": ["react", "prop-types", "scheduler", "react-dom"], // 父模块
      "resolved": "4.1.1",
      "semver": "^4.1.1",
    }
    //...
  }
}
```

Serverless 思想

值得一提的是 CodeSandbox 的 Packager 后端使用了 Serverless(基于 AWS Lambda)，基于 ServerLess 的架构让 Packager 服务更具伸缩性，可以灵活地应付高并发的场景。使用 Serverless 之后 Packager 的响应时间显著提高，而且费用也下去了。

<br/>

回退方案

AWS Lambda 有 500MB 的空间限制. 后来作者开发了新的构建器，把包管理的步骤放置到浏览器端。和上面的打包方式结合着使用。来看看它是怎么处理的:

![流程图](/images/08/packager2.png)

Codesandbox 并不会将 package.json 中所有的包都下载下来，而是惰性的去加载。比如在转译入口 js 时，发现 react 这个模块没有在本地缓存模块队列中，这时候就会到远程将它下载回来，然后接着转译。

也就是说，因为在转译阶段静态分析模块的依赖，所以不需要将整个模块从 npm 下载回来，节省了网络传输的成本.

CodeSandbox 通过 unpkg.com 或 cdn.jsdelivr.net 来获取模块的信息的文件下载:

- 获取 package.json: https://unpkg.com/react@latest/package.json
- 包目录结构获取: https://unpkg.com/antd@3.17.0/?meta 这个会递归返回该包的所有目录信息
- 具体文件获取: https://unpkg.com/react@16.8.6/cjs/react.production.min.js 或者 https://cdn.jsdelivr.net/npm/@babel/runtime@7.3.1/helpers/interopRequireDefault.js

- 包信息的缓存：Service worker
  Manifest 机制，和 webpack 的 DLL 差价的 Manifest 一样

<br/>

---

<br/>

### Transpilation

讲完 Packager 现在来看一下 Transpilation, 在这个阶段对源代码进行转译，以便可以被浏览器执行。CodeSandbox 的整个编译器是在一个单独的 iframe 中运行的：

<center>
  <img src="/images/08/editor-vs-compiler.png" />
</center>

Editor 负责变更源代码，源代码变更会通过 postmessage 传递给 Compiler，这里面会携带 Module+template. Module 中包含所有源代码内容和其路径，其中还包含 package.json, Compiler 会根据 package.json 来读取 npm 依赖;

template 表示 Compiler 的 preset，例如`create-react-app`、`vue-cli`, 定义了一些 loader 规则，来转译不同类型的文件。 这些 template 目前的预定义的.

基本对象

Manager 负责管理模块信息和进行转移以及求值
Manifest 如上
Module 模块信息, 模块信息，包含代码, 路径已经依赖模块
TranspiledModule 已转译的模块, 真正负责模块的转译工作

- ModuleSource 模块源码，包含 sourcemap 和转译后的代码
- 子模块 什么是子模块

依赖树的建立

父子关系，比如一个模块 A 被模块 B 依赖，那么 B 就是 A 的 parent

静态资源处理
代码分隔
多进程转译
流程图

### Evaluation

虽然称为打包器(bundler), 但是 CodeSandbox 并不会进行打包，也就是说他不会像 Webpack 一样，将所有的模块都打包合并成 chunks(即合并成一个文件，如果没有代码分隔的话)。

CodeSandbox 会使用`eval`来执行入口文件。这个过程更像是 Node 环境代码执行过程。

执行过程
HMR

## 技术地图

## 扩展

- [Creating a parallel, offline, extensible, browser based bundler for CodeSandbox](https://hackernoon.com/how-i-created-a-parallel-offline-extensible-browser-based-bundler-886db508cc31)
- [year of CodeSandbox - Ives van Hoorne aka @CompuIves at @ReactEurope 2018](https://www.youtube.com/watch?v=qURPenhndYA)
- [How we make npm packages work in the browser](https://hackernoon.com/how-we-make-npm-packages-work-in-the-browser-announcing-the-new-packager-6ce16aa4cee6)
- [codesandbox/dependency-packager](https://github.com/codesandbox/dependency-packager)
