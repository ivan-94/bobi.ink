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
- 降低学习成本。我们状态管理选用了 Mobx，对于客户端同学，只需要掌握少量的 Typescript 语言知识就可以马上上手。如果熟悉 Java、C# 那就更没什么问题了。每个Store 只是一个简单的类：

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
    this.addDisposer(addListener('someevent', (evt) => {
       this.dosomething(evt)
    }))

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

## 坑还是会有的

## 扩展资料

<br>
