---
title: "[技术地图] vue-cli"
date: 2019/5/26
categories: 前端
---

这是一个新开的'实验性'文章系列，如其名‘技术地图’，这个系列计划剖析一些前端开源项目，可能会探讨这些项目的**设计和组织**、整理他们使用到**技术栈**。 首先拿`vue-cli`小试牛刀，再决定后续要不要继续这个系列.

<br/>

我一直在思考我们编程主要在做什么？我们有一大部分工作就是选择各种工具/库/框架，来黏合业务. 工具和场景越匹配、原理了解越多，运用越娴熟，我们效率可能就越高. 这种说法很有争议，就像`程序=算法+数据结构`不能完全表达现今的软件工程一样, 说我们的工作就是堆砌工具，黏合业务, 一定程度上有自贬的意思。 但这确实是大部分程序员的真实写照。

这系列文章其实有点类似于 github 上面的`Awesome`项目. 这些 Awesome 项目就是一个**生态展览馆**, 里面项目琳琅满目. 因为数量太多了，而且缺少评分机制，大部分情况我们不可能一个个去查看，很难从中选择符合需求的项目(当然你带着明确的目的，且目标范围非常小，可能比较有用)。

<center>
<img src="https://bobi.ink/images/05/awesome.png" width="400" />
</center>

是否可以尝试换个角度，**选取一些有趣的开源项目，看看它是怎么应用这些工具的, 有序的罗列出来? 对于有相同场景的项目, 参考或者模仿价值可能会更大一些**. 这些开源项目就是巨人，站在巨人肩膀上显然省事多了

只是技术栈罗列未免过于简单，笔者还希望从这些项目中学点东西，比如他的设计和项目组织. 我会尝试简化和通俗解释里面的关键知识或亮点, 但是不求甚解。为了避免陷入细节泥潭，我会尽量使用图形化方式展示他们程序流程，避免拘泥于细节。你也可以把这些文章作为深入阅读这些项目源码的引导

我也希望读者同我交流反馈，共同学习和进步。

<br/>

---

<br/>

## vue-cli

说到 CLI, 不得不提[Rails](https://ruby-china.github.io/rails-guides/getting_started.html)框架，它可能是*框架提供 CLI 的先祖*(具体历史没有深入考究). Rails 有一个重要的指导思想，即**约定大于配置**, **它为 Web 应用的大多数需求都提供了最好的解决方法，并且默认使用这些约定，而不是在长长的配置文件中设置每个细节**。

**CLI 也是这个指导思想下的产物**, 例如通过它提供的 CLI，可以在[15 分钟内构建一个简易的博客](https://ruby-china.github.io/rails-guides/getting_started.html), 可以通过 CLI 启动服务器和 REPL、生成项目脚手架、生成代码文件、路由、数据库迁移等等:

<center>
  <img src="https://bobi.ink/images/05/rails-cli.png" width="500">
</center>

Rails 的很多设计在那个年代就是就是一个明星(闪瞎 PHP、JSP、 ASP..., 想想要配置各种服务器，各种 xml 文件)，它的很多设计模式深刻影响了后面的 web 框架，比如 Django、Laravel, 甚至很多模仿 Rails 命名的，如 Sails、Grails.

Rails 对于前端开发影响也很深远，比如在 Nodejs 出来之前，Rails 社区就开始使用 `coffeescript + sass`预编译语言进行前端开发了, [Asset Pipeline](https://ruby-china.github.io/rails-guides/asset_pipeline.html)可以说是最早的'前端工程化', 配合[Turbolink](https://github.com/turbolinks/turbolinks)可以让传统后端渲染页面拥有不亚于单页应用的用户体验...

当初 Rails 给我带来的各种震撼还历历在目, [Ruby China 社区](https://ruby-china.org)也是国内最好社区之一. 但是目前 Rails 的关注度不如从前, 在前端社区像 Rails 这种集大成的框架也早已不吃香(参考 Ember, 某种程度上 Angular 也算吧?).

说实在话如果一生只学一门语言，我会选 Ruby，如果选一个 web 框架，那就是 Rails。

推荐大家阅读[The Rails Doctrine - Rails 信条](https://ruby-china.org/wiki/the-rails-doctrine) 这篇文章里面有一句话笔者非常喜欢: **"只要放下了自负的个人喜好，便可以跳过无谓的世俗决定，专注在最重要的地方下更快的决定。"**。为人写程序，而不是为了机器写程序.

**约定大于配置**可以减少我们做决定的数量，减少无谓的争论和考虑，让我们可以专注于更重要的事情. 这个原则可以提高开发和团队协作效率, 甚至可以凝聚一个社区.

以 Webpack 为例，恶心复杂的配置被人诟病，所以才需要 vue-cli 或者 create-react-app 这些工具.

> 没有用 Ruby/Rails 工作过, 默默写了个 Ruby China 小程序(微信搜`Ruby CN`)，算是感恩回馈社区吧

<br/>

Ok, 忍不住吹了一波 Rails, 回到正题.

笔者是使用 React 作为主力开发的，Vue 也是我非常喜欢的一个开源项目，不说别的，在开发者的'用户体验'方面 Vue 是我见过最好之一，主要体现在 API 的简洁性和易用性、文档还有项目构建工具(今天的主角).

vue-cli-ui 是我想写这系列文章的动机之一. 前阵子用了一下`vue-cli-ui`, 感觉很不错, 支持可视化配置和任务运行，比我在终端下一个项目一个项目跑 task 清爽多了. 很想在我们自家的构建工具上也搞一套，怎搞？ 学习它的源码, 我觉得可以作为博客记录下来.

现在前端工程师也有‘webpack 配置工程师’的戏称，这能说明 webpack 配置是费时费力的苦事(Angular 例外). 这不后来就有了`parcel`宣称零配置的轮子, 还有 React 社区的`create-react-app`, vue-cli 前期是基于模板的创建项目, 不算此列。

后来 vue-cli 汲取着前者的很多优点，把这块做大做优了(看来 vue 很擅长做这些事情). 我们可以来对比一下这些工具:

<br/>

|              | Vue CLI                                                                              | create-react-app                                                         | parcel                                                                         |
| ------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| 快速原型开发 | 支持                                                                                 | -                                                                        | 支持                                                                           |
| 全局模式     | 零配置原型开发就是全局的                                                             | -                                                                        | 支持                                                                           |
| 插件         | 支持                                                                                 | -                                                                        | 支持，扩展文件类型和文件输出                                                   |
| 扩展性       | 强，通过插件扩展 wepack 配置                                                         | 弱, 强约定, 无法配置 webpack，可以 eject, 然后手工配置；支持 babel-macro;(严格说可以通过[react-app-rewired](https://github.com/timarney/react-app-rewired)进行扩展) | 中(可以配置 babel，postcss，Typescript); 提供了 Node API; 支持插件扩展文件类型 |
| 多页面       | 支持                                                                                 | -                                                                        | 支持                                                                           |
| 适用范围     | Vue 组件的第一公民。通过扩展可以支持任意前端框架                                     | 针对 React 开发，不支持其他框架                                          | parcel 是一个通用的打包工具，它的竞争对手是 webpack                            |
| 编译速度     | cache-loader,thread-loader 来加速 JS 和 TS 编译                                      | babel-loader 开启了 cache                                                | 编译速度号称是 webpack 的两倍                                                  |
| 可升级性     | 支持升级 cli-service, 插件需要单独升级, 插件需要遵循语义化版本. 太多插件存在升级风险 | 支持升级 react-script, 官方维护，且强约定基本可以保障向下兼容            | 支持升级 parcel-bundler                                                        |
| UI           | 图形化管理是 CLI 的特色之一                                                          | -                                                                        | -                                                                              |

<br/>

通过上面的对比，可以看出 **vue-cli 是一个扩展性非常强的构建工具，以致于它不仅限于 Vue，也可以用来构建 React 甚至其他前端框架**。

相比而言 `create-react-app` 就是一个非常 Opinionated(坚持己见) 的工具，强约定. 一个典型的例子就是它不内置开启 babel 装饰器转译，CRA 团队认为已经废弃(或者不成熟)的语言特性不应该带到 CRA 中; 后面为了给‘优雅’地给 babel 扩展插件，就捣鼓出来了`babel-macro`, 这是一种'免配置'的 babel 插件规范.

这种强约定也是有好处的，比如不需要管理配置; 而且 CRA 团队谨慎可靠地维护着 CRA，这使得开发者可以一般无痛地升级 CRA. 如果要扩展 webpack，一般只有 eject，这就走回了手动配置 webpack 的老路, 不可取.

vue-cli 也是一个'渐进式'的 cli，vue-cli 提供了默认的 preset，但不阻止你对其进行扩展. vue-cli 的扩展接口也非常简洁(合理, 不多不少), 还有 UI 管理界面，可视化管理项目的配置和插件，用户体验很棒，计划在下一篇文章介绍 vue ui. 唯一比较不舒服的是如果滥用这种扩展性，装 N 多插件，而且插件之间还存在依赖关系时，也会成为升级维护的负担.

<br/>

---

<br/>

## 基本设计

注意，本文不是 vue-cli 的教程，最好的教程是[官方文档](https://cli.vuejs.org/zh/dev-guide/plugin-dev.html#prompts).

<br/>

### 目录结构

下面是 vue-cli 的基本目录结构. 大部分大型的前端项目都使用 lerna 实现 mono-repo 模式, 然后统一分发到 npm. 这种模式有利于项目模块组织

<center>
  <img src="https://bobi.ink/images/05/vue-cli-struct.png" width="700" />
</center>

<br/>

### **分离 CLI 层和 Service 层**

这个设计是借鉴`create-react-app`的, CLI 层只是一些基础的命令一般不需要频繁升级，而且是全局安装; 而 Service 层是多变的, 作为项目的局部依赖，不应该硬编码在 CLI 里面. CLI 和 Service 的职责划分如下:

<br/>

- CLI: 用于项目创建和管理

  - 全局安装
  - `vue create` 创建项目脚手架. 拉取最新的 Service，并选择配置需要的插件
  - `vue ui`. 启动 UI 管理界面
  - 快速原型开发: `vue serve` | `vue build`, 直接伺服和编译一个 Vue 文件
  - 插件管理: `vue add` | `vue invoke` 安装插件和调用插件生成器

- Service: 负责项目的实际构建
  - 局部安装
  - 集成 webpack 构建环境，**Service 本身只有一个插件机制, 所有构建相关逻辑都由内置插件和外部插件提供**
  - 内置插件(命令): serve, build, inspect

<br/>
<br/>

### **插件系统**

vue-cli 提供了类似 babel、eslint 的插件机制。

<center>
  <img src="https://bobi.ink/images/05/plugins.png" width="400" />
</center>

<br/>

#### **插件**

插件机制是 vue-cli 的核心, 用于扩展 Service. Service 的`命令`和 webpack 配置都由插件提供.

其实插件机制本身并没有什么技术难度, 换句话说**插件其实就是一个协议的设计**. vue-cli 插件的协议如下:

- **命名**: `@vue/cli-plugin-*`或`vue-cli-plugin-*`. package.json 中按着这个命名约定的依赖会被识别为 vue-cli 插件，另外命名约定也有利于在 github 或 npm 上筛选
- **生命周期**:
  一个插件的生命周期可以分为`安装阶段`和`运行阶段`. `vue create`命令创建项目脚手架、`vue add`以及`vue invoke`插件安装命令都属于安装阶段; 而 cli-service 命令执行时属于运行阶段.
- **基本结构**: 区分了生命周期后，插件的结构就比较清晰了:

  ```shell
  .
  ├── README.md
  ├── generator.js  # generator (可选)
  ├── prompts.js    # prompt 文件 (可选)
  ├── index.js      # service 插件
  └── package.json
  ```

  - 安装阶段:
    - prompts: 收集用户意见和配置
    - gernerator: 在安装阶段生成模板文件
  - 运行时: index.js
    - 注入 service 命令
    - 扩展和修改 webpack 配置. vue-cli 通过`webpack-chain`和`webpack-merge`来实现 webpack 可配置化

<br/>

一个简单的插件结构是这样子的:

<center>
  <img src="https://bobi.ink/codes/vue-plugin.png" width="600" />
</center>

<br/>

#### **preset**

这个 preset 和 babel 的 preset 概念实际上是不一样的:

**vue-cli 的 preset 一个脚手架创建方案**, 也就是说它只作用于`vue create`阶段。比如`vue create`时默认使用的就是 babel+eslint preset. preset 可以简化项目脚手架的创建。**团队可以共享一个 preset 来创建脚手架**。

**而 babel 中的 preset 是一个插件集合，他可以统一收纳和管理一组插件方案**. 例如`babel-preset-react`、 `babel-preset-env`. 上文说到如果扩展性被滥用，装 N 多插件，而且插件之间还存在依赖关系时，也会成为升级维护的负担. 而 'babel 式'的 preset 可以让插件更方便维护和和**一键式升级**。

尽管目前 vue 也提供了`vue upgrade`对插件进行升级，这个是基于语义化版本约定的, 且当插件之间存在依赖关系时, 不排除升级存在风险. 尤其对于团队项目还是推荐有统一地管理这些插件, 实现傻瓜化的升级。 实际上这种 'babel 式'的 preset 是可以通过 vue-plugin 实现和转发的。

<br/>

#### **配置**

vue 支持在 package.json 的 `vue` 字段或`vue.config.js`中进行配置。这里可以对 Service 核心功能和插件进行配置, 也可以直接修改 webpack 配置. 另外部分构建行为是通过环境变量进行影响的，这些可以通过`.env.*`文件进行配置

<br/>

### **基本流程**

现在来看看一个 vue-cli 内部的基本流程, Service 的插件实现是 vue-cli 比较有意思的点. 以`vue serve`为例:

<center>
  <img src="/images/05/vue-cli.png"/>
</center>

Service 对象是 vue-cli 的核心对象，负责管理和应用插件，所有命令和 webpack 配置都是以插件的形式存在:

<center>
  <img src="https://bobi.ink/images/05/vue-service-struct.png" width="700" />
</center>

**首先划分为配置阶段和运行阶段**。 配置阶段 vue-cli 会加载配置文件，并查找和应用所有插件。将 PluginAPI 实例和项目配置传递给插件运行时, 插件运行时通过 PluginAPI 注入命令(registerCommand)和 扩展 webpack 配置(chainWebpack, configureWebpack).

运行阶段则根据用户传入的命令名调用插件注入命令。在命令实现函数中，可以调用 resolveWebpackConfig()来生成最终的 webpack 配置。以 serve 命令为例，获取到 webpackConfig 后会创建一个 webpack 编译器，并开启 webpack-dev-server 开发服务器.

<br/>

## 技术地图

- **组织**
  - [lerna](http://lernajs.io)
- **cli 命令行相关工具**
  - [chalk](https://github.com/chalk/chalk): 命令行字体颜色样式
  - [cli-highlight](https://www.npmjs.com/package/cli-highlight): 终端语法高亮输出, 类似于 Highlight.js
  - [cliui](https://www.npmjs.com/package/cliui): 在终端中进行多列输出
  - [didyoumean](https://github.com/dcporter/didyoumean.js): 根据单词相似度，来对用户输入纠正提示
  - [semver](https://www.npmjs.com/package/semver): 提供语义化版本号相关的工具函数。 例如比较，规范化
  - [commander](https://github.com/tj/commander.js#readme) TJ 写的命令行选项和参数解析器，支持子命令，选项校验和类型转换，帮组信息生成等等. API 简单优雅
  - [minimist](https://www.npmjs.com/package/minimist): 一个极简的命令行参数解析器。如果只是简单的选项解析，可以用这个库
  - [inquirer](https://github.com/SBoudrias/Inquirer.js) 命令行询问
  - [ora](https://github.com/sindresorhus/ora) 命令行 spinner
  - [launch-editor](https://github.com/yyx990803/launch-editor) 打开编辑器. 通过 node 打开编辑器，前端可以 express 暴露接口调用打开
  - [open](https://www.npmjs.com/package/open) 打开 URL、文件、可执行文件
  - [execa](https://www.npmjs.com/package/execa) 更好的 child_process，修复了原生 exec 的一些问题
  - validate-npm-package-name: 验证 npm 包名称，比如创建的项目名是否合法
  - [dotenv](https://www.npmjs.com/package/dotenv) & [dotenv-expand](https://www.npmjs.com/package/dotenv-expand): 从.env 文件中加载配置，环境变量
- **网络相关**
  - [portfinder](https://www.npmjs.com/package/portfinder): 获取可用的端口
  - [address](https://www.npmjs.com/package/address): 获取当前主机的 ip，MAC 和 DNS 服务器
- **文件处理相关**
  - [slash](https://www.npmjs.com/package/slash) 一致化处理路径中的分隔符
  - [fs-extra](https://www.npmjs.com/package/fs-extra) node fs 模块扩展
  - globby: glob 模式匹配
  - rimraf 跨平台文件删除命令
  - [memfs](https://www.npmjs.com/package/memfs) 兼容 Node fs API 的内存文件系统
- **数据检验**
  - [@hapi/joi](https://www.npmjs.com/package/@hapi/joi) JSON schema 校验
- **调试**
  - [debug](https://www.npmjs.com/package/debug): 这是一个 debug 日志利器, 支持通过环境变量或动态设置来确定是否需要输出; 支持 printf 风格格式化
- **算法**
  - hash-sum: 散列值计算
  - deepmerge 深合并
- **其他**
  - [recast](https://github.com/benjamn/recast) Javascript 语法树转换器，支持非破坏性的格式化输出. 常用于扩展 js 代码
  - [javascript-stringify](https://www.npmjs.com/package/javascript-stringify): 类似于 JSON.stringify, 将对象字符串化。
- **webpack**
  - 配置定义
    - webpack-merge: 合并 webpack 配置对象
    - webpack-chain: 链式配置 webpack. 这两个库是 vue-cli 插件的重要成员
  - webpack-dev-server: webpack 开发服务器，支持代码热重载，错误信息展示，接口代理等等
  - webpack-bundle-analyzer: webpack 包分析器
- **扩展(一些相关的技术栈)**
  - http-server 快速伺服静态文件
  - plop 模板生成器
  - yeoman 项目脚手架工具
