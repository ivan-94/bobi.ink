---
title: "[技术地图] CodeSandbox 如何工作? 上篇"
date: 2019/6/20
categories: 前端
---

这期来关注一下[`Codesandbox`](https://codesandbox.io), 这是一个浏览器端的沙盒运行环境，支持多种流行的构建模板，例如 create-react-app, vue-cli。 可以用于快速原型开发、DEMO 展示、Bug 还原等等.

相似的产品有很多，例如[`codepen`](https://codepen.io/pen)、[JSFiddle](https://jsfiddle.net)、[WebpackBin](https://webpackbin-prod.firebaseapp.com)(已废弃). Codesandbox 则更加强大，可以视作是浏览器端的 webpack 运行环境, 在 V3 版本已经支持 VsCode 模式，支持 Vscode 的插件和 Vim 模式、还有主题.

而且 CodeSandbox 支持离线运行(PWA)。基本上可以接近本地 VSCode 的编程体验. 有 iPad 的同学，也可以尝试基于它来进行开发。所以快速的原型开发我一般会直接使用 CodeSandbox

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
- 代码分割
- 模式。CodeSandbox 只考虑 development 模式，不需要考虑 production
- 文件输出
- 服务器通信。webpack 需要和开发服务器建立一个长连接用于接收指令，例如 HMR
- 静态文件处理(如图片), 这些图片需要上传到 Codesandbox 的服务器
- 插件等等。

CodeSandbox 的打包器使用了接近 Webpack Loader 的 API, 这样可以很容易地将 webpack 的一些 loader 移植过来.

来看看 Create-react-app 的实现(查看[源码](https://github.com/codesandbox/codesandbox-client/blob/84972fd027fe36c53652c22f6775e1e6d3c51145/packages/app/src/sandbox/eval/presets/create-react-app/index.js#L1)):

```jsx
import stylesTranspiler from "../../transpilers/style";
import babelTranspiler from "../../transpilers/babe";
// ...
import sassTranspiler from "../../transpilers/sass";
// ...
const preset = new Preset(
  "create-react-app",
  ["web.js", "js", "json", "web.jsx", "jsx", "ts", "tsx"],
  {
    hasDotEnv: true,
    setup: manager => {
      const babelOptions = {
        /*..*/
      };
      preset.registerTranspiler(
        module =>
          /\.(t|j)sx?$/.test(module.path) && !module.path.endsWith(".d.ts"),
        [
          {
            transpiler: babelTranspiler,
            options: babelOptions
          }
        ],
        true
      );
      preset.registerTranspiler(
        module => /\.svg$/.test(module.path),
        [
          { transpiler: svgrTranspiler },
          {
            transpiler: babelTranspiler,
            options: babelOptions
          }
        ],
        true
      );
      // ...
    }
  }
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

## 项目构建过程

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

**基本对象**

在详细介绍 Transpilation 之前先大概看一些基本对象，以及这些对象之间的关系：

![](/images/08/baseobj.png)

- Manager 这是 Sandbox 的核心对象，负责管理配置信息(Preset)、项目依赖(Manifest)、以及维护项目所有依赖的模块(TranspilerModule)
- Manifest 通过上述的 Packager 我们知道，Manifest 维护所有依赖的 npm 模块信息
- Preset 一个项目构建模板，例如 vue-cli、create-react-app. 配置了项目文件的转译规则。
- Transpiler 等价于 webpack 的 loader，负责对指定类型的文件进行转译。例如 bable、typescript、pug、sass 等等
- WorkerTranspiler 这是 Transpiler 的子类，使用一个多个 Worker 来执行转译任务，从而提高转译的性能
- TranspiledModule 表示模块本身。这里面维护转译的结果、代码执行的结果、依赖的模块信息，负责具体模块的转译(调用 Transpiler)和执行

<br>

现在来看看整体的转译流程：

![](/images/08/compiler.png)

- 配置阶段： CodeSandbox 目前只支持限定的几种应用模板，例如 vue-cli、create-react-app。不同模板之间目录结构的约定是不一样的，例如入口文件和 html 模板文件。另外文件处理的规则也不一样，比如 vue-cli 需要处理`.vue`文件。所有配置阶段会创建 Preset 对象，确定入口文件等等
- 依赖下载阶段： 即 Packager 阶段，下载项目的所有依赖，生成 Manifest 对象
- 变动计算阶段：根据 Editor 传递过来的源代码，计算新增、更新、移除的模块。
- 转译阶段：真正开始转译了，首先重新转译上个阶段计算出来的需要更新的模块。接着从入口文件作为出发点，转译和构建新的依赖图。注意这里不会重新转译没有变化的模块以及其子模块

具体模块的转译工具是由 TranspiledModule 驱动的：

![](/images/08/transpiled-module.png)

来看看大概的代码：

```js
  async transpile(manager: Manager) {
    // 已转译
    if (this.source)  return this
    // 避免重复转译, 一个模块只转译一次
    if (manager.transpileJobs[this.getId()]) return this;
    manager.transpileJobs[this.getId()] = true;

    // ...重置状态 

    // 从Preset获取Transpiler列表
    const transpilers = manager.preset.getLoaders(this.module, this.query);

    for (let i = 0; i < transpilers.length; i += 1) {
      const transpilerConfig = transpilers[i];
      // 构建LoaderContext，见下文
      const loaderContext = this.getLoaderContext(
        manager,
        transpilerConfig.options || {}
      );

      // 调用Transpiler转译源代码
      const {
        transpiledCode,
        sourceMap,
      } = await transpilerConfig.transpiler.transpile(code, loaderContext); // eslint-disable-line no-await-in-loop

      if (this.errors.length) {
        throw this.errors[0];
      }
    }

    this.logWarnings();

    const sourceEqualsCompiled = code === this.module.code;
    const sourceURL = `//# sourceURL=${location.origin}${this.module.path}${
      this.query ? `?${this.hash}` : ''
    }`;

    // Add the source of the file by default, this is important for source mapping
    // errors back to their origin
    code = `${code}\n${sourceURL}`;

    this.source = new ModuleSource(
      this.module.path,
      code,
      finalSourceMap,
      sourceEqualsCompiled
    );

    if (
      this.previousSource &&
      this.previousSource.compiledCode !== this.source.compiledCode
    ) {
      // 重置模块执行结果
      this.resetCompilation();
    }

    await Promise.all(
      this.asyncDependencies.map(async p => {
        try {
          const tModule = await p;
          this.dependencies.add(tModule);
          tModule.initiators.add(this);
        } catch (e) {
          /* let this handle at evaluation */
        }
      })
    );
    this.asyncDependencies = [];

    // 递归转译依赖的模块
    await Promise.all(
      flattenDeep([
        ...Array.from(this.transpilationInitiators).map(t =>
          t.transpile(manager)
        ),
        ...Array.from(this.dependencies).map(t => t.transpile(manager)),
      ])
    );

    return this;
  }
```

TranspiledModule 会从Preset中获取转换当前模块的Transpiler列表的，调用Transpiler对源代码进行转译，转译的过程中会收集新的依赖，当模块转译完成后，递归转译依赖列表。

Transpiler等价于webpack的loader，配置以及基本API也和webpack(查看[webpack的loader API](https://webpack.docschina.org/api/loaders/))大概保持一致，比如链式传递. 来看一下Transpiler的基本定义：

```ts
export default abstract class Transpiler {
  initialize() {}

  dispose() {}

  cleanModule(loaderContext: LoaderContext) {}

  // 🔴 代码转换
  transpile(
    code: string,
    loaderContext: LoaderContext
  ): Promise<TranspilerResult> {
    return this.doTranspilation(code, loaderContext);
  }

  // 🔴 抽象方法，由具体子类实现
  abstract doTranspilation(
    code: string,
    loaderContext: LoaderContext
  ): Promise<TranspilerResult>;

  // ...
}
```

Transpiler的接口很简单，`transpile`接受两个参数: 

- `code`即源代码.
- `loaderContext` 可以用来访问一下上下文信息，比如Transpiler的配置， 模块查找，注册依赖等等。大概外形如下:
  
  ```ts
  export type LoaderContext = {
    // 🔴 信息报告
    emitWarning: (warning: WarningStructure) => void;
    emitError: (error: Error) => void;
    emitModule: (title: string, code: string, currentPath?: string, overwrite?: boolean, isChild?: boolean) => TranspiledModule;
    emitFile: (name: string, content: string, sourceMap: SourceMap) => void;
    // 🔴 配置信息
    options: {
      context: string;
      config?: object;
      [key: string]: any;
    };
    sourceMap: boolean;
    target: string;
    path: string;
    addTranspilationDependency: (depPath: string, options?: { isAbsolute?: boolean; isEntry?: boolean; }) => void;
    resolveTranspiledModule: ( depPath: string, options?: { isAbsolute?: boolean; ignoredExtensions?: Array<string>; }) => TranspiledModule;
    resolveTranspiledModuleAsync: ( depPath: string, options?: { isAbsolute?: boolean; ignoredExtensions?: Array<string>; }) => Promise<TranspiledModule>;
     // 🔴 依赖收集
    addDependency: ( depPath: string, options?: { isAbsolute?: boolean; isEntry?: boolean; }) => void;
    addDependenciesInDirectory: ( depPath: string, options?: { isAbsolute?: boolean; isEntry?: boolean; }) => void;
    _module: TranspiledModule;
  };
  ```

先从简单的开始，来看看JSON模块的Transpiler实现：

```ts
class JSONTranspiler extends Transpiler {
  doTranspilation(code: string) {
    const result = `
      module.exports = JSON.parse(${JSON.stringify(code || '')})
    `;

    return Promise.resolve({
      transpiledCode: result,
    });
  }
}
```

为了提高转译的效率，Codesandbox利用Worker来进行多进程转译，多Worker的调度工作由`WorkerTranspiler`完成，这是Transpiler的子类，维护了一个Worker池。Babel、Typescript、Sass这类复杂的转译任务都是使用多进程的：

![](/images/08/transpiler.png)

<br>

### BabelTranspiler

其中比较典型的实现是BabelTranspiler, 在Sandbox启动时就会预先马上fork三个worker，来提高启动的速度, WorkerTranspiler会优先使用这三个worker来初始化Worker池：

```ts
// 使用worker-loader fork三个loader，用于处理babel编译
import BabelWorker from 'worker-loader?publicPath=/&name=babel-transpiler.[hash:8].worker.js!./eval/transpilers/babel/worker/index.js';

window.babelworkers = [];
for (let i = 0; i < 3; i++) {
  window.babelworkers.push(new BabelWorker());
}
```

这里面使用到了webpack的[worker-loader](https://github.com/webpack-contrib/worker-loader), 将指定模块封装为 Worker 对象。让 Worker 更容易使用:

主进程代码:

```js
// App.js
import Worker from "./file.worker.js";

const worker = new Worker();

worker.postMessage({ a: 1 });
worker.onmessage = function(event) {};

worker.addEventListener("message", function(event) {});
```

workder 代码:

```js
// Worker.js
const _ = require("lodash");

const obj = { foo: "foo" };

_.has(obj, "foo");

// Post data to parent thread
self.postMessage({ foo: "foo" });

// Respond to message from parent thread
self.addEventListener("message", event => console.log(event));
```

具体的流程如下:

![](/images/08/babel-transpiler.png)

WorkerTranspiler会维护`空闲的Worker队列`和一个`任务队列`, 它的工作就是驱动Worker来消费任务队列。具体的转译工作在Worker中进行：

![](/images/08/babel-worker.png)

<br>

### Evaluation

虽然称为打包器(bundler), 但是 CodeSandbox 并不会进行打包，也就是说他不会像 Webpack 一样，将所有的模块都打包合并成 chunks 文件.

`Transpilation`从`入口文件`开始转译, 再分析文件的模块导入规则，递归转译依赖的模块. 到`Evaluation`阶段，CodeSandbox 已经构建出了一个完整的**依赖图**. 现在要把应用跑起来

![](/images/08/dependency-graph.png)

Evaluation 的原理也比较简单，和 Transpilation 一样，也是从入口文件开始: 使用`eval`执行入口文件，如果执行过程中调用了`require`，则递归 eval 被依赖的模块。

如果你了解过 Node 的模块导入原理，你可以很容易理解这个过程：

![](/images/08/evaluation.png)

- ① 首先要初始化 html，找到`index.html`文件，将 document.body.innerHTML 设置为 html 模板的 body 内容.
- ② 注入外部资源。用户可以自定义一些外部静态文件，例如 css 和 js，这些需要 append 到 head 中
- ③ evaluate 入口模块
- ④ 所有模块都会被转译成 CommonJS 模块规范。所以需要模拟这个模块环境。大概看一下代码:

  ```js
  // 实现require方法
  function require(path: string) {
    // ... 拦截一些特殊模块

    // 在Manager对象中查找模块
    const requiredTranspiledModule = manager.resolveTranspiledModule(
      path,
      localModule.path
    );

    // 模块缓存, 如果存在缓存则说明不需要重新执行
    const cache = requiredTranspiledModule.compilation;

    return cache
      ? cache.exports
      : // 🔴递归evaluate
        manager.evaluateTranspiledModule(
          requiredTranspiledModule,
          transpiledModule
        );
  }

  // 实现require.resolve
  require.resolve = function resolve(path: string) {
    return manager.resolveModule(path, localModule.path).path;
  };

  // 模拟一些全局变量
  const globals = {};
  globals.__dirname = pathUtils.dirname(this.module.path);
  globals.__filename = this.module.path;

  // 🔴放置执行结果，即CommonJS的module对象
  this.compilation = {
    id: this.getId(),
    exports: {}
  };

  // 🔴eval
  const exports = evaluate(
    this.source.compiledCode,
    require,
    this.compilation,
    manager.envVariables,
    globals
  );
  ```

- ⑤ 使用 eval 来执行模块。同样看看代码:

  ```js
  export default function(code, require, module, env = {}, globals = {}) {
    const exports = module.exports;
    const global = g;
    const process = buildProcess(env);
    g.global = global;
    const allGlobals = {
      require,
      module,
      exports,
      process,
      setImmediate: requestFrame,
      global,
      ...globals
    };

    const allGlobalKeys = Object.keys(allGlobals);
    const globalsCode = allGlobalKeys.length ? allGlobalKeys.join(", ") : "";
    const globalsValues = allGlobalKeys.map(k => allGlobals[k]);
    // 🔴将代码封装到一个函数下面，全局变量以函数形式传入
    const newCode = `(function evaluate(` + globalsCode + `) {` + code + `\n})`;
    (0, eval)(newCode).apply(this, globalsValues);

    return module.exports;
  }
  ```

Ok！到这里 Evaluation 就解释完了，实际的代码比这里要复杂得多，比如 HMR(hot module replacement)支持, 有兴趣的读者，可以自己去看 CodeSandbox 的源码.

## 技术地图

## 扩展

- [Creating a parallel, offline, extensible, browser based bundler for CodeSandbox](https://hackernoon.com/how-i-created-a-parallel-offline-extensible-browser-based-bundler-886db508cc31)
- [year of CodeSandbox - Ives van Hoorne aka @CompuIves at @ReactEurope 2018](https://www.youtube.com/watch?v=qURPenhndYA)
- [How we make npm packages work in the browser](https://hackernoon.com/how-we-make-npm-packages-work-in-the-browser-announcing-the-new-packager-6ce16aa4cee6)
- [codesandbox/dependency-packager](https://github.com/codesandbox/dependency-packager)
