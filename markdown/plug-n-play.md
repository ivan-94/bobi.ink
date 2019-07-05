---
title: Yarn Plug'n'Play可否助你脱离node_modules苦海?
date: 2019/4/8
categories: 前端
---

使用 Yarn(v1.12+)的 Plug'n'Play 机制来取代 node_modules. 目前这还是一个实验性的特性.

## 背景

![node_modules](https://bobi.ink/images/node_modules-hole.png)

`node_modules`早就成为的全民吐槽的对象, 其他语言的开发者看到 node_modules 对 Node 就望而祛步了,
用一个字来形容的话就是'重!'.

> 如果不了解 Node 模块查找机制, 请点击[require() 源码解读](http://www.ruanyifeng.com/blog/2015/05/require.html)

一个简单的前端项目(_create-react-app_)的大小和文件数:

![](https://bobi.ink/images/front-end-project.png)

而 macOS 的`/Library`目录的大小的文件数:

![](https://bobi.ink/images/mac-library.png)

一行`hello world`就需要安装 130MB 以上的依赖模块, 而且文件数是**32,313**. 相比之下 macOS 的`/Library`
的空间占用 9.02GB, 文件数只是前者的两倍(**67,890**). 综上可以看出 node_modules 的特点是:

- 目录树结构复杂
- 文件数较多且都比较小
- 依赖多, 一个简单的项目就要安装好几吨依赖

所以说 node_modules 对于机械硬盘来说是个噩梦, 记得有一次一个同事删除 node_modules 一个下午都没搞定.
对于前端开发者来说, 我们有 N 个需要`npm install`的项目 😹.

除此之外, Node 的模块机制还有以下**缺点**:

- Node 本身并没有模块的概念, 它在运行时进行查找和加载. 这个缺点和*'动态语言与静态语言的优劣对比'*相似,
  你可能在开发环境运行得好好的, 可能到了线上就运行不了了, 原因是一个模块没有添加到 package.json

- Node 模块的查找策略非常浪费. 这个缺点在大部分前端项目中可以进行优化,
  比如 webpack 就可以限定只在项目根目录下的 node_modules 中查找, 但是对于嵌套的依赖, 依然需要 2 次以上的查找

- node_modules 不能有效地处理重复的包. 两个名称相同但是不同版本的包是不能在一个目录下共存的.
  所以会导致嵌套的 node_modules, 而且这些项目'依赖的依赖'是无法和项目或其他依赖共享的:

  ```shell
  # ① 假设项目依赖a,b,c三个模块, 依赖树为:
  #  +- a
  #    +- react@15
  #  +- b
  #    +- react@16
  #  +- c
  #    +- react@16
  # yarn安装时会按照项目被依赖的次数作为权重, 将依赖提升(hoisting),
  # 安装后的node_modules结构为:
    .
    └── node_modules
        ├── a
        │   ├── index.js
        │   ├── node_modules
        │   │   └── react  # @15
        │   └── package.json
        ├── b
        │   ├── index.js
        │   └── package.json
        ├── c
        │   ├── index.js
        │   └── package.json
        └── react  # @16 被依赖了两次, 所以进行提升

  # ② 现在假设在①的基础上, 根项目依赖了react@15, 对于项目自己的依赖肯定是要放在node_modules根目录的,
  # 由于一个目录下不能存在同名目录, 所以react@16没有的提升机会. 
  # 安装后node_moduels结构为
    .
    └── node_modules
        ├── a
        │   ├── index.js
        │   └── package.json # react@15 提升
        ├── b
        │   ├── index.js
        │   ├── node_modules
        │   │   └── react  # @16
        │   └── package.json
        ├── c
        │   ├── index.js
        │   ├── node_modules
        │   │   └── react  # @16
        │   └── package.json
        └── react  # @15
  # 上面的结果可以看出, react@16出现了重复
  ```

为此 Yarn 集成了`Plug'n'Play`(简称 pnp), 中文名称可以称为'即插即用', 来解决 node_modules'地狱'.

## 基本原理

按照普通的按照流程, Yarn 会生成一个 node_modules 目录, 然后 Node 按照它的模块查找规则在 node_modules 目录中查找.
但实际上 Node 并不知道这个模块是什么, 它在 node_modules 查找, 没找到就在父目录的 node_modules 查找, 以此类推.
这个效率是非常低下的.

**但是 Yarn 作为一个包管理器, 它知道你的项目的依赖树. 那能不能让 Yarn 告诉 Node? 让它直接到某个目录去加载模块.
这样即可以提高 Node 模块的查找效率, 也可以减少 node_modules 文件的拷贝. 这就是`Plug'n'Play`的基本原理.**

在 pnp 模式下, Yarn 不会创建 node_modules 目录, 取而代之的是一个`.png.js`文件, 这是一个 node 程序,
这个文件包含了项目的依赖树信息, 模块查找算法, 也包含了模块查找器的 patch 代码(在 Node 环境, 覆盖 Module.\_load 方法).

<br>

使用 pnp 机制的以下**优点**:

- 摆脱 node_modules.
  - 时间上: 相比较在热缓存(hot cache)环境下运行`yarn install`节省 70%的时间
  - 空间上: pnp 模式下, 所有 npm 模块都会存放在全局的缓存目录下, 依赖树扁平化, 避免拷贝和重复
- 提高模块加载效率. Node 为了查找模块, 需要调用大量的 stat 和 readdir 系统调用.
  pnp 通过 Yarn 获取或者模块信息, 直接定位模块
- 不再受限于 node_modules 同名模块不同版本不能在同一目录

> 在 Mac 下 Yarn 的安装速度非常快, 热缓存下仅需几秒. 原因是 SSD + APFS 的 Copy-on-write 机制.
> 这使得文件的拷贝不用占用空间, 相当于创建一个链接. 所以拷贝和删除的速度非常快.
> 但是 node_modules 复杂的目录结构和超多的文件, 仍然需要调用大量的系统调用, 这也会拖慢安装过程.
> <br>
> 💡 如果觉得 pnp 繁琐或不可靠, 那就赶紧用上 SSD 配合支持 Copy-on-write 的文件系统.

<br>

使用 pnp 的**风险**:

目前前端社区的各种工具都依赖于 node_modules 模块查找机制. 例如

- Node
- Electron, electron-builder 等等
- Webpack
- Typescript: 定位类型声明文件
- Babel: 定位插件和 preset
- Eslint: 定位插件和 preset, rules
- Jest
- 编辑器, 如 VsCode
- ...😿

pnp 一个非常新的东西, 在去年 9 月份(2018)面世. 要让这些工具和 pnp 集成是个不小的挑战, 而且这些这些工具
和 pnp 都是在不断迭代的, pnp 还不稳定, 未来可能变化, 这也会带来某些维护方面的负担.

除了模块查找机制, 有一些工具是直接在 node_modules 中做其他事情的, 比如缓存, 存放临时证书. 例如`cache-loader`, `webpack-dev-server`

## 开启 pnp

如果只是单纯的 Node 项目, 迁入过程还算比较简单. 首先在`package.json`开启 pnp 安装模式:

```json
{
  "installConfig": {
    "pnp": true
  }
}
```

接着安装依赖:

```shell
yarn add express
```

安装后项目根目录就会出现一个`.pnp.js`文件. 下一步编写代码:

```javascript
// index.js
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
```

接下来就是运行 Node 代码了, 如果直接`node index.js`会报`Error: Cannot find module 'express'`异常.
这是因为还没有 patch Node 的模块查找器. 可以通过以下命令运行:

```shell
yarn node

# 或者

node --require="./.pnp.js" index.js
```

> `.pnp.js`文件不应该提交到版本库, 这个文件里面包含了硬编码的缓存目录. 在 Yarn v2 中会进行重构

## 怎么集成到现有项目?

pnp 集成无非就是重新实现现有工具的模块查找机制. 随着前端工程化的发展, 一个前端项目会集成非常多的工具,
如果这些工具没法适配, 可以说 pnp 很难往前走. 然而这并不是 pnp 能够控制的, 需要这些工具开发者的配合.

社区上不少项目已经集成了 pnp:

- [create-react-app](https://github.com/facebook/create-react-app)
- [gastby](https://github.com/gatsbyjs/gatsby)

<br>

### Node

对于 Node, pnp 是开箱即用的, 直接使用`--require="./.pnp.js"`导入`.pnp.js`文件即可,
`.pnp.js`会对 Node 的 Module 对象进行 patch, 重新实现模块查找机制

### Webpack

Webpack 使用的模块查找器是[`enhanced-resolve`](https://github.com/webpack/enhanced-resolve), 可以通过[`pnp-webpack-plugin`](https://github.com/arcanis/pnp-webpack-plugin)插件来扩展`enhanced-resolve`
来支持 pnp.

```javascript
const PnpWebpackPlugin = require(`pnp-webpack-plugin`);

module.exports = {
  resolve: {
    // 扩展模块查找器
    plugins: [PnpWebpackPlugin],
  },
  resolveLoader: {
    // 扩展loader模块查找器.
    plugins: [PnpWebpackPlugin.moduleLoader(module)],
  },
};
```

### jest

[jest](http://jestjs.io)支持通过`resolver`来配置查找器:

```javascript
module.exports = {
  resolver: require.resolve(`jest-pnp-resolver`),
};
```

### Typescript

Typescript 也使用自己的模块查找器, TS团队为了性能方面的考虑, 暂时不允许第三方工具来扩展查找器. 也就是说**暂时不能用**.

在这个[issue](https://github.com/Microsoft/TypeScript/issues/28289)中, 有人提出使用`"moduleResolution": "yarnpnp"`或者使用类似[`ts-loader`](https://github.com/TypeStrong/ts-loader)的[`resolveModuleName`](https://github.com/arcanis/pnp-webpack-plugin/blob/b09fbdc2a9f16dc3837454b8d367963b1a30655f/index.js#L141)的方式支持 pnp 模块查找.

TS 团队的回应是: pnp(或者 npm 的 tink)还是早期阶段, 未来可能会有变化, 例如`.pnp.js`文件, 显然不合适那么早入坑.
另外为了优化和控制编译器性能, TS 也没有计划在编译期间暴露接口给第三方执行代码.

所以现在 Typescript 至今也没有类似 babel 的插件机制. 除非自己实现一个'TS compiler host', 例如`ts-loader`就自己扩展了插件机制和模块查找机制, 来支持类似[ts-import-plugin](https://github.com/Brooooooklyn/ts-import-plugin)等插件, 因此`ts-loader`现在是支持 pnp 的:

```js
const PnpWebpackPlugin = require(`pnp-webpack-plugin`);

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: require.resolve('ts-loader'),
        options: PnpWebpackPlugin.tsLoaderOptions(),
      },
    ],
  },
};
```

<br>

总结, **`Typescript`暂时不支持**, 且近期也没有开发计划, 所以`VsCode`也别指望了. [`fork-ts-checker-webpack-plugin`](https://github.com/Realytics/fork-ts-checker-webpack-plugin/issues/181)也还没跟上. 显然 Typescript 是 pnp 的第一拦路虎

<br>

### 其他工具

- [rollup-plugin-pnp-resolve](https://github.com/arcanis/rollup-plugin-pnp-resolve)
- [resolve](https://yarnpkg.com/en/package/resolve): babel, gulp
- [eslint](https://github.com/yarnpkg/yarn/pull/6449): 到 v6 才能[完美支持](https://github.com/yarnpkg/berry/issues/8).
- [flow](https://github.com/facebook/flow/issues/7014)
- [create-react-app](https://github.com/facebook/create-react-app/pull/5136) 支持 pnp, 但是 Typescript 模式下不支持
- electron: 暂时没有相关的消息. 对于一个electron应用来说, 依赖是自包含的, 所以pnp可能不适合该场景

## 总结

综上, pnp 是一个不错的解决方案, 可以解决 Node 模块机制的空间和时间的效率问题. 但是在现阶段, 它还不是成熟, 有
很多坑要踩, 且和社区各种工具集成存在不少问题. 所以还不建议在生产环境中使用.

所以目前阶段对于普通开发者来说, 如果要提升npm安装速度, 还是得上SSD+Copy-On-Write!😂

下面是各种项目的集成情况(✅(支持)|🚧(计划中或不完美)|❌(不支持)):

| 项目                           |     |
| ------------------------------ | --- |
| Webpack                        | ✅  |
| rollup                         | ✅  |
| browserify                     | ✅  |
| gulp                           | ✅  |
| jest                           | ✅  |
| Node                           | ✅  |
| Typescript/VScode IntelliSense | ❌  |
| eslint                         | 🚧  |
| flow                           | 🚧  |
| create-react-app               | 🚧  |
| ts-loader                      | ✅  |
| fork-ts-checker-webpack-plugin | 🚧  |

## 参考

- [Plug'n'Play Whitepaper](https://github.com/yarnpkg/rfcs/blob/master/accepted/0000-plug-an-play.md) pnp的论文
- [How to get rid of node_modules with Yarn Plug’n’Play](https://medium.freecodecamp.org/getting-rid-of-node-modules-with-yarn-plugn-play-a490e5e747d7)
- [Yarn 官方文档](https://yarnpkg.com/en/docs/pnp)
- [pnp-sample-app](https://github.com/yarnpkg/pnp-sample-app) pnp 官方示例
- [Yarn's Future - v2 and beyond](https://github.com/yarnpkg/yarn/issues/6953)
- [Hacker News Discussion](https://medium.com/@thomasreggi/yarn-plugn-play-1c398bf3e417)

相关 issues:

- [Yarn Plug 'N Play should generate a static manifest file, not `.pnp.js`](https://github.com/yarnpkg/yarn/issues/6388)
- [Typescript: Add new moduleResolution option: `yarn-pnp`](https://github.com/Microsoft/TypeScript/issues/28289)
- [fork-ts-checker-webpack-plugin: Custom resolveModuleName](https://github.com/Realytics/fork-ts-checker-webpack-plugin/issues/181)

其他方案

- [npm tink](https://github.com/npm/tink): a dependency unwinder for javascript
- [pnpm](https://github.com/pnpm/pnpm) Fast, disk space efficient package manager
- [Yarn Workspaces](https://yarnpkg.com/en/docs/workspaces) 多个项目共有依赖

