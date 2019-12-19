---
title: '这半年的 Electron 应用开发和优化总结, 干货'
date: 2019/12/16
categories: 前端
---

今年可以拿出来说一说的项目估计就是我们用 Electron 重构了一个桌面端应用。简单介绍一下这个应用的，这个应用类似于钉钉或者企业微信，主要功能有即时通信、语音、会议，基本功能和 PC 端微信差不多，具体细节就不展开了, 这些不重要。

![](/images/electron/mygzb.png)

<br>

## 为什么选择 Electron?

原因也很简单: **我们的应用要兼容多个平台，原生开发效率低，我们没有资源**。

根据这个说了跟白说一样，大部分选择 Electron 的动机都是差不多的，无非就是穷，尤其是在夹缝中生存的企业。

**'混合化'成为了我们今年客户端重构的主题**。

先来看一下我们的客户端架构:

![](/images/electron/client-arch.png)

<br>

混合化对我们来说有两个意思:

1. 我们的架构混合了多种技术。通用底层 C/C++, 平台原生，Web
2. 跨平台

<br>

基于原有的客户端基础和情况，混合化重构自然而然分化为了两个方向:

1. 业务下沉。将通用的、核心的业务下沉。例如消息处理、语音/视频、会议、数据存储等核心模块, 封装一些底层库，如 XMPP、SIP。这些业务变动频率较低、对性能要求也比较高，而且需要跨平台，因此适合用 C/C++ 来实现。
2. UI 混合。视图层混合化目前也有较多的解决方案，例如 Electron、React Native、Flutter、或者是 HTML Hybrid。我们选择先从 Electron 开始，因为它在桌面端开发中已经有非常成熟的表现，市场上也有很多大型的 Electron 应用，例如 VSCode、Atom、Slack。在移动端，我们对 React Native 和 Flutter 我们还比较保守，后续可能会进行尝试。

<br>

现在再看上面的图, 应该就好理解了, 典型的三层结构, 和 MVC 非常相似：

- **M -- 通用混合层**。 C/C++ 封装核心、通用的业务以及业务数据存储。
- **V -- UI 层**。视图层，使用跨平台视图解决方案，对于性能要求较高的部分使用原生实现。比如 Electron
- **C -- 平台桥接层**。介于 M 和 V 之间，桥接`通用混合层`接口，同时也为 UI 层暴露一些平台相关的特性。比如在桌面端，这里会通过 Node 原生模块桥接通用混合层, 同时也补充一些 Electron 缺失或不完美的功能。

<br>
<br>

## 进程模型

Electron 的主从进程模型是基本的常识。每个 Electron 应用有且只要一个主进程(main process)、以及一个或多个渲染进程(renderer process), 对应多个 Web 页面。除此之外还有 GPU 进程、调试进程等等。可以通过 [Electron Application Architecture](https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes) 了解 Electron 的基本架构。

主进程负责创建页面窗口、协调进程间通信、事件分发。为了安全考虑，原生 GUI 相关的 API 是无法在渲染进程直接访问的，它们必须通过 IPC 调用主进程。这种主从进程模型缺点也非常明显，即主进程单点故障。主进程崩溃或者阻塞，会影响整个应用的响应。比如主进程跑长时间的 CPU 任务，将阻塞渲染进程的用户交互事件。

对我们的应用来说，有以下进程, 以及它们的职责:

**① 主进程**

- 进程间通信、窗口管理
- 全局通用服务。
- 一些只能或适合在主进程做的事情。例如浏览器下载、全局快捷键处理、托盘、session。
- 维护一些必要的全局状态

<br>

**② 渲染进程**

负责 Web 页面的渲染, 具体页面的业务处理。

<br>

**③ Service Worker**

负责静态资源缓存。缓存一些网络图片、音频。保证静态资源的稳定加载。

<br>
<br>

## 技术选型与代码组织

说说我们的技术选型。

- UI 框架 - `React`
- 状态管理 - `Mobx`
- 国际化 - `i18next`
- 打包 - `自研 CLI`

<br>

源码组织

```shell
bridge/                  # 桥接层代码
resources/               # 构建资源，以及第三方DLL
src/
  main/                  # 🔴主进程代码
    services/            # 📡**通过 RPC 暴露给渲染进程的全局服务**
      tray.ts            # 托盘状态管理
      shortcut.ts        # 全局快捷键分发
      preferences.ts     # 用户配置管理
      windows.ts         # 窗口管理
      screen-capture.ts  # 截屏
      bridge.ts          # 桥接层接口封装
      context-menu.ts    # 右键菜单
      state.ts           # 全局状态管理, 保存一些必要的全局状态，例如主题、当前语言、当前用户
      ...
    lib/                 # 封装库
      bridge.ts          # 桥接层API 分装
      logger.ts          # 日志
      ...
    bootstrap.ts         # 启动程序
    index.ts             # 🔴入口文件
  renderer/              # 🔴渲染进程
    services/            # 📡主进程的全局服务的客户端
      windows.ts         # 窗口管理客户端
      tray.ts
      ...
    assets/              # 静态资源
    hooks/               # React Hooks
    components/          # 通用组件
      Webview
      Editor
      toast
      ...
    pages/               # 🔴页面
      Home
        ui/              # 🔴视图代码，由前端团队维护
        store/           # 🔴状态代码，由客户端团队维护，前端Store的公开状态
        translation/     # 国际化翻译文件
        index.tsx        # 页面入口
      Settings
      Login
    page.json            # 🔴声明所有页面及页面配置。类似小程序
```

<br>

眼尖的读者会发现每个页面下有 `ui` 和 `store` 目录，分别对应视图和状态。为什么这么划分？

首先这是因为这个项目由两个团队共同来开发的，即原有的原生客户端团队和我们的前端团队。分离视图和状态有两个好处:

- 前端前期不需要关心客户端底层业务，而客户端也不需要关心前端的页面实现。职责明确，各自干好自己事情。
- 降低学习成本。我们状态管理选用了 Mobx，对于客户端同学，只需要掌握少量的 Typescript 语言知识就可以马上上手。如果熟悉 Java、C# 那就更没什么问题了。每个 Store 只是一个简单的类：

```ts
class CounterStore extends MobxStore {
  @observable
  public count: number = 0

  @action
  public incr = () => {
    this.count++
  }

  private pageReady() {
    // 页面就绪，可以在这里做一些准备工作

    // 事件监听
    // addDisposer 将释放函数添加到队列中，在页面退出时释放
    this.addDisposer(
      addListener('someevent', evt => {
        this.dosomething(evt)
      })
    )

    // ...
    this.initial()
  }

  private pageWillClose() {
    // 页面释放，可以在这里做一些资源释放
    releaseSomeResource()
  }

  // ....
}
```

<br>

使用 Mobx 作为状态管理，相比 Redux，OOP 的思想对他们更好理解。这种场景简单才是真理。分离了状态和业务逻辑，前端页面实现也简化了，视图只是状态的映射，这让我们的页面和组件更好被维护和复用。

<br>
<br>

## 性能优化(硬货)

前戏完了，关于 Electron 的一些性能优化才是本篇文章的重头戏。

Electron 不是银弹，鱼和熊掌不可兼得。Electron 带来开发效率的提升，其本身也有很多硬伤，譬如常被人吐槽的内存占用高，和原生客户端性能差异等等。为了优化 Electron 应用，我们也做了很多工作。

性能优化一般都分两步走：

- ① 分析、找出问题。参考[《React 性能测量和分析》](https://juejin.im/post/5d06bf0a51882528194a9736)
- ② 针对问题解决问题。无外乎三个方向, 参考 [《浅谈 React 性能优化的方向》](https://juejin.im/post/5d045350f265da1b695d5bf2)

### 性能分析

最好的分析工具是 Chrome 开发者工具的 `Performance`。通过火焰图, JavaScript 执行过程的任何蛛丝马迹都可以直观的看到。

![](/images/TODO:)

<br>

对于主进程，开启调试后也可以通过 `Profile` 工具收集 JavaScript 执行信息。

如果你要分析某段代码的执行过程，也可以通过下面命令生成分析文件，然后导入到 Chrome Performance 中分析:

```shell
# 输出 cpu 和 堆分析文件
node --cpu-prof --heap-prof -e "require('request’)”“
```

<br>

### 优化策略

#### 继续和白屏作斗争

即使 Electron 通常从本地文件系统加载 JavaScript 代码，没有网络加载延迟，我们还是需要继续和页面白屏做斗争，因为 JavaScript 等资源的加载、解析和执行还是有相当大的代价([The cost of JavaScript in 2019](https://v8.dev/blog/cost-of-javascript-2019))。作为一个桌面端应用，细微的白屏延迟用户都可以感觉的到。

简单分析一下，**影响白屏的主要因素有：页面容器的创建、静态资源的加载、JavaScript 解析和执行**。

见招拆招，针对页面白屏我们做了这些优化:

<br>

**① 骨架屏**

最简单的方式。在资源未加载完毕之前，先展示页面的骨架。避免用户看到白茫茫的屏幕:

![](TODO:)

<br>

**② 惰性加载**

优先加载核心的功能，保证初次加载效率，让用户可以尽快进行交互。

- **代码分割 + 预加载**： 代码分割是最常见优化方式。我们把隐藏的内容、或者次优先级的模块拆分出去，启动模块中只保留关键路径。另外我们也可以在浏览器空闲时预加载这些模块。
- **延后加载 Node 模块**： Nodejs 模块的加载和执行需要花费较大的代价, 例如模块查找、模块文件读取、接着才是模块解析和执行。这些操作都是同步了，别忘了，node_modules 黑洞，某块模块可能会引用大量的依赖....

  Node 应用和 Electron 应用不太一样，通常 Node 服务器应用都会将模块放置在文件顶部, 然后同步加载进来。这个放到 Electron 用户界面上就无法忍受了。 页面启动速度和交互阻塞, 用户是可以感知到的，而且忍耐程度会较低。

  所以要充分评估模块的大小和依赖。

- **划分加载优先级**：既然我们没办法一开始将所有东西都加载出来，那就按照优先级渐进式地将在它们。举个例子，当我们使用 VSCode 打开一个文件时，VScode 会先展示代码面板、接着是目录树、侧边栏、代码高亮、问题面板、初始化各种插件...

<br>

**③ 使用现代的 JavaScript/CSS 代码**

Electron 每个版本都会预装最新的 Chrome，对于前端来说，这是最爽的一件事情:

- 没有负担地使用最新的 JavaScript 特性
- 没有 Polyfill、没有 runtime-helper。相比老旧浏览器，代码量更少，性能也更好
- 我们需要主动抛弃一些老旧的依赖。保持使用最新的库

<br>

**④ 打包优化**

即使使用最新最牛逼的浏览器，打包工具还是很有用。

- **减少代码体积**: 现代打包工具有非常多优化手段，例如 Webpack 支持作用域提升、摇树，还有代码压缩、预执行... 这可以合并代码、压缩代码体积，裁剪多余的代码, 减少运行时负担。
- **优化I/O**: 我们将模块合并之后，可以减少模块查找和加载的I/O往返。

<br>

**⑤ [v8 Snapshot](https://v8project.blogspot.it/2015/09/custom-startup-snapshots.html) or [v8 Code Cache](https://v8.dev/blog/code-caching)**

Atom 有很多优质的文章，分享了他们优化Atom的经历。例如它们使用了 [V8 的snapshot 来优化启动时间](https://blog.atom.io/2017/04/18/improving-startup-time.html)。

这是一种 `AOT` 优化策略，简单说 Snapshot 是堆快照，你可以认为它是 JavaScript 代码在V8中的内存表示形态。

它有两个好处: 一是相比普通 JavaScript 加载更快，二是它是二进制的，如果你为了‘安全’考虑，可以将模块转换成snapshot，这样更难被‘破解’。

不过它也有较多限制。对架构的影响比较大。比如要求在初始化的过程中不要有‘副作用’，例如DOM访问。因为在‘编译时‘这些东西不存在。

这篇文章详细介绍了如何在 Electron 中应用 v8 snapshot: [How Atom Uses Chromium Snapshots](https://flight-manual.atom.io/behind-atom/sections/how-atom-uses-chromium-snapshots/)

还有一个更加广泛使用的方案是 [v8 Code Cache](https://v8.dev/blog/code-caching)。NodeJS 12 [开始](https://www.yuque.com/egg/nodejs/nodejs-12#2e3ceb28)在构建时提前为内置库生成代码缓存，从而提升 30% 的启动耗时。

通过这些文章，深入了解 Code Cache 扩展阅读:

- [Code caching for JavaScript developers](https://v8.dev/blog/code-caching-for-devs)
- [JavaScript Start-up Performance](https://medium.com/reloading/javascript-start-up-performance-69200f43b201)
- [Improved code caching](https://v8.dev/blog/improved-code-caching)
- [如何加快 Node.js 应用的启动速度](https://fed.taobao.org/blog/taofed/do71ct/speed-node-start-time/)

<br>
<br>

**⑥ 窗口预热 与 窗口池、窗口常驻**

对于频繁打开和关闭，或者核心页面(例如主页面)，窗口池机制会很有用。

例如我们的应用首页，用户在打开登录页面时，我们就会在**后台预热**，将该加载的资源都准备好，在登录成功后，就可以立即渲染显示。窗口打开的延时很短，基本接近原生的窗口体验。

这里用到了一些 Hack 手段，我们将这些窗口放到了屏幕之外，并设置 `skipTaskBar` 来实现隐藏或者关闭的效果。

对于频繁开启/关闭的窗口，也可以使用**窗口池**来优化。比如Webview 页面，打开的一个 Webview 页面时，会优先从窗口池中选取，当窗口池为空时再创建新的窗口, 接着页面关闭后会再放回窗口池中，方便后续复用。这样页面打开的速度非常快，基本可以媲美原生。

另外，对于业务无关的、通用的窗口，也可以采用**常驻模式**，例如通知，图片查看器。这些窗口一旦创建就不会释放，打开效果会更好。

这是一种典型的以空间换取时间的优化策略.

<br>
<br>

**⑦ 跟进 Electron 最新版本**

<br>
<br>

#### 追赶原生的交互体验

白屏时间的优化只是一个开始，应用使用过程中的交互体验优化也是一个非常重要的部分。下面讲讲我们的一些优化手段：

<br>

**① 静态资源缓存**

对于一些网络资源，我们采取了一些缓存手段，保证它们展示的速度。我们目前采用的是 Service-Worker + Workbox 的方式，利用 Service-Worker 可以拦截多个页面的网络请求，从而实现跨页面的静态资源缓存，这种方式实现比较简单。

除了 Service Worker，也可以通过协议拦截方式来实现。详见: [protocol](https://electronjs.org/docs/api/protocol)。后面有时间再尝试一下，看效果怎么样。

<br>

**② 预加载机制**

如果你看过我的 [《这可能是最通俗的 React Fiber(时间分片) 打开方式》](https://juejin.im/post/5dadc6045188255a270a0f85), 应该见识到 `requestIdleCallback` 的强大，React 利用它来调度一些渲染任务，保证浏览器响应用户的交互。

这个 API 对于我们的应用优化也有重要的意义。通过它，我们可以知道浏览器的资源利用情况，利用浏览器空闲时间来预执行一些低优先级的任务。比如：

- 隐藏的 Tab
- 延后加载的模块代码
- 惰性加载的图片
- 未激活的会话
- 低优先级的任务
- ...

例如：

TODO:

<br>

**③ 避免同步操作**

Electron 可以通过 NodeJS 进行 I/O 操作，但是我们一定要尽量避免同步 I/O。例如同步的文件操作、同步的进程间通信。它们会阻塞页面的渲染和事件交互。

<br>

**④ 减少主进程负荷**

Electron 的主进程非常重要。它是所有窗口的父进程，它负责调度各种资源。如果主进程被阻塞，将影响整个应用响应性能。

你可以做一个简单的实验，在主进程上打一个断点，你会发现所有的页面窗口都会失去响应，尽管它们在各自不同的进程。这是因为所有用户交互都是由主进程分发给渲染进程的，主进程阻塞了，渲染进程当然无法接收用户事件啦。

所以不要让主进程干脏活累活，能在渲染进程做的，就在渲染进程做。**千万避免在主进程中跑计算密集任务和同步I/O**。

<br>

**⑤ 分离CPU密集型操作到单独进程或Worker, 避免阻塞UI**

<br>

**⑥ React 优化**

见 [《React 性能优化的方向》](https://juejin.im/post/5d045350f265da1b695d5bf2)

<br>

**⑦ 放弃CSS-in-js**

我们为了压缩运行时性能，能在编译时做的就在编译时做，放弃了 CSS-in-js 方案，使用纯 CSS + BEM 来编写样式。主要有两个原因:

- Electron 使用较新的 Chrome，现代 CSS 已经很强大
- 我们使用了窗口预热机制，可以率先解析这部分 CSS 代码。而 CSS-in-js 方案则是组件渲染时，动态生成的。

**⑧ 没有退路了，那就只能上 Node 原生模块了**

真好，还有退路

<br>
<br>

#### 优化进程通信

还不够，我们还在优化，后续再分享给大家。

## 坑还是会有的

## 扩展资料

<br>
