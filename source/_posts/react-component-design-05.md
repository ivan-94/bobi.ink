---
title: React组件设计实践总结05 - 状态管理
date: 2019/4/23
categories: 前端
---

没什么阅读量，文章较长，描述啰嗦，打击自信心

## 状态管理

## 不需要的状态管理

中后台应用, 简单应用

什么时候需要状态管理

复杂的数据流, 跨页面协作
跨组件数据通信

## Redux

Redux 是学习 React 绕不过的一个框架

Redux 的代码只有一百多行，概念却很多，学习曲线非常陡峭，看官方文档就知道了。即使它的实现很简洁，但是 开发代码并不简洁，尤其要遵循它的最佳实践，是从头开始构建一个项目时. 尽管现在有类似 dva 或 rematch 这样的二层封装库来简化它.

本文不打算深入介绍 Redux 的相关实践， 社区上面有非常多的教程，官方文档也非常详尽. 这里会介绍 Redux 的主要架构和核心思想， 以及它的适用场景.

<center>
  <img src="/images/04/redux-design.png" width="700" />
</center>

动机 <-> 实现 <-> 好处

这也是 flux 的初衷

1. 可预测状态
2. 简化应用数据流

- 单一数据源
  - 可以简化应用数据流. 解决传统多 model 模型数据流混乱问题(比如一个 model 可以修改其他 model，一个 view 受到多个 model 驱动)，让数据变动变得可预测可调试
    ![](/images/04/traditional-model.png)
  - 同构化应用开发
  - 方便调试
  - 撤销重做，时间旅行,热重载
  - 方便持久化和状态恢复
- 单向数据流
- 不能直接修改状态.
  - 只能通过 dispatch action 来触发状态变更. action 只是一个简单的对象， 携带事件的类型和 payload
  - reducer 接收 action 和旧的 state， 规约生成新的 state. reducer 只是一个纯函数，可以嵌套组合子 reducer 对复杂 state 树进行规约
  - 不可变数据
  - 可测试
- 范式化和反范式化. Store 只存储范式化的数据，减少数据冗余。视图需要的数据通过 reselect 等手段反范式化
- 隔离副作用. 可以说 Redux 的核心概念就是 reducer，然而这是一个纯函数。为了实现复杂的副作用，redux 提供了类似 Koa 的中间件机制，实现各种副作用. 比如异步请求. 除此之外，可以利用中间件机制，实现通用的业务模式， 减少代码重复。
- Devtool

- 可测试
- 时间旅行

什么时候应该使用 Redux? [You Might Not Need Redux](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367), Redux 不是你的第一选择。

当我们需要处理复杂的应用状态，且 React 本身无法满足你时. 比如：

- 你需要持久化应用状态，需要实现撤销重做这些功能
- 应用状态很复杂时
- 数据流比较复杂时
- 许多不相关的组件需要共享和更新状态

最佳实践

[react-boilerplate](https://github.com/react-boilerplate/react-boilerplate/blob/master/docs/general/introduction.md)是比较符合‘最佳实践’的项目模板. 应用工作流如下:

![](/images/04/redux-workflow.png)

特性:

1. 针对 Redux 主要组合了这些方案: immer(不可变数据变更)，redux-saga(异步数据流处理)，reselect(选取和映射 state，支持 memo，可复合)，connected-react-router(绑定 react-router v4)
2. 根据页面分隔 saga 和 reducer。
3. 按需加载 reducer(通过 replaceReducer) 和 saga
4. 划分容器组件和展示组件

再看看 react-boilerplate 目录结构. 这是我个人比较喜欢的项目组件方式，组织非常清晰，很有参考意义

```shell
/src
  /components        # 展示组件
  /containers        # 🔴容器/页面组件
    /App             # 根组件， 例如放置Provider和Router
    /HomePage        # 页面组件
      index.js       # 页面入口
      constants.js   # 🔴 在这里定义各种常量。包括Action Type
      actions.js     # 🔴 定义各种Action函数
      saga.js        # 🔴 redux-saga 定义各种saga方法， 用于处理异步流程
      reducer.js     # 🔴 reducer。 页面组件的reducer和saga都会按需注入到根store
      selectors.js   # 🔴 redux state映射和计算
      message.js
      Form.js        # 各种局部组件
      Input.js
      ...
    /FeaturePage     # 其他页面组件结构同上
    ...
  /translations      # i18n 翻译文件
  /utils
    reducerInjectors.js  # reducer 注入器, 和页面组件一起按需注入
    sagaInjectors.js     # saga 注入器
    lodable.js
  app.js             # 应用入口
  i18n.js            # i18n配置
  configureStore.js  # 🔴 创建和配置Redux Store
  reducers.js        # 🔴 根reducers, 合并所有'页面状态'和'全局状态'(如router， language， global(例如用户鉴权信息))
```

🤬 开始吐槽!

- **Redux 核心库很小，只提供了 dispatch 和 reducer 机制，对于各种复杂的副作用处理 Redux 通过提供中间件机制外包出去**。社区有很多解决方案，redux-promise, redux-saga, redux-observable... 查看 Redux 的[生态系统](https://redux.js.org/introduction/ecosystem#actions).

  Redux 中间件的好处是扩展性非常好，所以生态百花齐放, 对于初学者则不友好. TM 起码还得需要去了解各种各样的库，横向比较的一下才知道自己需要搭配哪个库。那好吧，就选 redux-saga 吧，star 数比较多。后面又有牛人说不要面向 star 编程，选择适合自己团队的才是最好的... 挑选合适的方案之前还是得要了解各种方案本身。

  Vue 之所以学习曲线比较平缓也在于此吧。它帮助我们做了很多选择，极简的简洁方案，官方的风格指南和最佳施加，这些适合 80%以上的开发需求. 开发者减少了很多折腾的时间，可以专心写业务.

  请直接告诉我要怎么做，我该怎么组合？最佳实践？ Vuex 模范, Dva

  在出现选择困难症时，还是看看别人怎么选择，选取一个折中方案, 后续有再慢慢深入研究. 比如 Dva, rematch. 基本上比较流行的组合就是: `immer+saga+reselect`

  <br/>

- **太多模板代码**。比如上面的 react-boilerplate, 设计五个文件, 需要定义各种 Action Type、Action、 Reducer、Saga、mapper. 所以即便想进行一个小的状态变化也会需要更改好几个地方:

  ![](/images/04/redux-page.png)

  笔者个人更喜欢类似 Vuex 这种`Ducks`风格的组织方式， 将模块下的 action，saga，reducer 和 mapper 都组织在一个文件下面:

  <center>
   <img src="/images/04/redux-ducks.png" width="500" />
  </center>

  Redux 的二次封装框架基本采用类似的风格, 如[`rematch`](https://github.com/rematch/rematch)

  <center>
   <img src="/images/04/rematch.png" width="800" />
  </center>

  这些二次封装框架一般做了以下优化(其实可以当做是 Vuex 的优点)，来减少 Redux 的模板代码:

  - 使用 Ducks 风格组织代码，聚合分散的 reducer，saga，actions...
  - 更简化的 API
  - 提供了简单易用的模块化或者命名空间机制(或者称为‘分形’)。模块本身支持‘状态隔离’，让模块的 reducer、saga 只专注于模块自己的状态. 另外模块还考虑动态加载
  - 内置副作用处理机制。如使用 saga 或 redux-promise
  - 简化了不可变数据的操作方式。 如使用 immer
  - 简化 reducer。Redux 内置了 combineReducers 来复合多个 reducer，在 reducer 内部我们一般使用 switch 语句来接收 action 和处理数据变动, 其实写起来非常啰嗦. Vuex 和这些封装框架不约而同使用了 key/value 形式, 更为简洁明了
  - 简化 view 层的 connect 接口。如简化 mapProps，mapDispatch

  <br/>

- **强制不可变数据**。前面文章提过 setState 很啰嗦，为了保证状态的不可变性最简单的方式是使用对象展开或者数组展开操作符, 再复杂点可以上 Immutable.js, 这需要一点学习成本. 好在现在有 immer，按照 Javascript 的对象操作习惯来操作不可变数据

  <br/>

- **状态设计**。

  数据类型一般分为**领域数据(Domain data)**和**应用数据(或者称为 UI 数据)**. 在使用 Redux 时经常需要考虑状态要放在组件局部，还是所有状态都抽取到 Redux Store？把这些数据放到 ReduxStore 里面处理起来好像更麻烦？既然都使用 Redux 了，不把数据抽取到 ReduxStore 是否不符合最佳实践？ 笔者也时常有这样的困惑, 你也是[最佳实践的受害者](https://ruby-china.org/topics/38057)?

  我觉得可以从下面几个点进行考虑:

  - 领域数据还是应用数据? 领域数据一般都会放在 ReduxStore 中，我们通常会将 Redux 的 Store 看作一个数据库，存放范式化的数据。
  - 状态是否会被多个组件或者跨页面共享？ ReduxStore 是一个全局状态存储器，既然使用 Redux 了，有充足的理由让 Redux 来管理跨越多组件的状态
  - 状态是否需要被恢复? 如果你的应用要做‘时间旅行(撤销/重做)’或者应用持久化，如果这个状态可被恢复，应该放到 ReduxStore，集中化管理数据是 Redux 的强项
  - 状态是否需要跨越组件的生命周期？将状态放在组件局部，就会跟着组件一起被销毁。如果希望状态跨越组件的生命周期，应该放到父组件或者 Redux 中或者进行持久化. 比如一个模态框编辑的数据在关闭后是否需要保留

  在局部状态和全局状态中取舍需要一点开发经验.

  另外作为一个集中化的状态管理器，为了状态的可读性(更容易理解)和可操作性(更容易增删查改)，在状态结构上面的设计也需要花费一些精力的. 这个数据库结构的设计方法是一样的, 在设计状态之前你需要理清各种领域对象之间的关系, 在数据获取和数据变更之间取得平衡.

  Redux 官方也推荐[范式化 State](https://cn.redux.js.org/docs/recipes/reducers/NormalizingStateShape.html)，扁平化结构树, 减少嵌套，减少数据冗余. 也就是倾向于更方便被更新和存储，至于视图需要什么则交由 reselect 这些库进行计算映射和组合.

  所以说 Redux 没那么简单, 当然 80%的 Web 应用也不需要这么复杂.

  <br/>

- **不方便 Typescript 类型化**。不管是 redux 还是二次封装框架都不是特别方便 Typescript 进行类型推导，尤其是在加入各种扩展后。你可能需要显式标注很多数据类型

  扩展: [react-redux-typescript-guide](https://github.com/piotrwitek/react-redux-typescript-guide#redux---typing-patterns), [rematch & Typescript](https://rematch.gitbooks.io/rematch/docs/recipes/typescript.html)
  <br/>

- **不是分形(Fractal)**

  在没有看到[@杨剑锋](https://www.zhihu.com/people/yang-jian-feng/activities)的这条知乎[回答](https://www.zhihu.com/question/263928256/answer/275092256)之前我也不知道什么叫分形。

  前面文章也提到过‘分离逻辑和视图’和‘分离容器组件和展示组件’，这两个规则都来自于 Redux 的最佳实践。Redux 就是一个'非分形的架构'，在这个架构里视图和逻辑(或状态)可以被单独复用，这是一种简单的‘横向分层', 但在 Redux 中却很难将二者作为一个整体的组件来复用:

    <center>
    <img src="/images/04/redux-and-dumb.png" width="400" />
    </center>
    _集中化的 Store，再通过 Connect 机制可以让状态在整个应用范围内被复用；Dumb 组件抽离的状态和行为，也容易被复用_

  现在假设你需要将单个 container 抽离成独立的应用，当个 container 是无法独立工作的。**在分形的架构下，一个‘应用’有更小的‘应用’组成，‘应用’内部有自己的状态机制，单个应用可以独立工作，也可以作为子应用**. 例如 Redux 的鼻祖 Elm 的架构:

    <center>
    <img src="/images/04/elm.jpg" width="500" />
    </center>
    _Store的结构和应用的结构保持一致, 每个 Elm 组件也是一个 Elm 应用，包含完整的Action、Update、Model和View. 使得单独的应用可以被复用_

  Redux 不是分形和 Redux 本身的定位有关，它是一个纯粹的状态管理器，不涉及组件的视图实现，所以无法像 elm 和 cyclejs 一样形成一个完整的应用闭环。 其实可以发现 react 组件本身就是分形的，组件原本就是状态和视图的集合.

  分形的好处就是可以实现更灵活的复用和组合，减少胶水代码。显然现在支持纯分形架构的框架用得并不多，原因可能是门槛比较高。个人认为不支持分形在工程上还不至于成为 Redux 的痛点，我们可以通过‘模块化’将 Redux 拆分为多个模块，在多个 Container 中进行独立维护，从某种程度上是否可以减轻非分形架构的缺点？

  个人感觉到页面这个级别的分化是比较合适的，比如方便分工。比如最近笔者就有这样一个项目, 我们需要将一个原生 Windows 客户端转换成 electron 实现，限于资源问题，这个项目涉及到两个团队之间协作. Redux 在这里就是一个接口层，Windows 团队负责在 Redux 中维护状态和提供实现业务逻辑，而我们前端团队则负责展示层. 这样一来 Windows 不需要学习 React 和视图展示，我们也不需要关系他们复杂的业务逻辑(底层还是使用 C++, 暴露部分接口给 node)

**可能还有性能问题**

参考

- [我为什么从 Redux 迁移到了 Mobx](https://tech.youzan.com/mobx_vs_redux/)
- [Mobx 与 Redux 的性能对比](https://zhuanlan.zhihu.com/p/52625410)

参考

- [Redux 有什么缺点](https://www.zhihu.com/question/263928256/answer/275092256) 知乎上的吐槽
- [Redux 状态管理之痛点、分析与改良](https://zhuanlan.zhihu.com/p/27093191)
- [Redux 有哪些最佳实践?](https://www.zhihu.com/question/47995437/answer/108788493)
- [如何评价数据流管理架构 Redux?](https://www.zhihu.com/question/38591713/answer/77634014)
- [2018 年我们还有什么功能是 Redux 才适合做的吗？](https://www.zhihu.com/question/284931332/answer/441399919)
- [Cycle.js 状态管理模型](https://juejin.im/post/5c166d8fe51d45242973fdd3)

总结

本节主要介绍的 Redux 设计的动机，以及围绕着这个动机一系列设计, 再介绍了 Redux 的一些缺点和最佳实践。Redux 的生态非常繁荣，如果是初学者还是建议使用 Dva 或 rematch 这类二次封装框架，这些框架通常就是 Redux 一些最佳实践的沉淀, 减少折腾的时间。当然这只是个开始，组织一个大型项目你还有很多要学的。

扩展:

- [使用 Dva 开发复杂 SPA](https://dvajs.com/guide/develop-complex-spa.html#动态加载model)
- [Redesigning Redux](https://hackernoon.com/redesigning-redux-b2baee8b8a38)
- [Redux 官方文档](https://redux.js.org/introduction/getting-started)
- [redux 三重境](https://zhuanlan.zhihu.com/p/26485702)

## 原生态的状态管理

## mobx

action 约束变量的变更

## MST

## 基于 hooks

!不属于组件设计范围

TODO: 学习观察组件库设计和代码
