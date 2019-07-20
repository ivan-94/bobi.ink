---
title: "如果我是前端团队Leader，怎么制定前端协作规范?"
date: 2019/7/19
categories: 前端
---

一个人就是规范，虽然人员的扩展，需要考虑规范，统一步伐往前走

<!-- TOC -->

- [开发工作流规范](#开发工作流规范)
  - [开发](#开发)
    - [**版本规范**](#版本规范)
    - [**代码控制系统规范**](#代码控制系统规范)
    - [**提交信息规范**](#提交信息规范)
  - [构建规范](#构建规范)
  - [发布工作流规范](#发布工作流规范)
  - [持续集成](#持续集成)
- [技术栈规范](#技术栈规范)
- [浏览器兼容规范](#浏览器兼容规范)
- [项目组织规范](#项目组织规范)
- [编码规范](#编码规范)
- [文档规范](#文档规范)
- [UI设计规范](#ui设计规范)
- [测试规范](#测试规范)
- [前后端协作规范](#前后端协作规范)
- [基础库规范](#基础库规范)
- [新成员培训/知识管理](#新成员培训知识管理)
- [示例](#示例)

<!-- /TOC -->

<br>

**什么是规范?**

规范，名词意义上：即明文规定或约定俗成的标准，如：道德规范、技术规范等。 动词意义上：是指按照既定标准、规范的要求进行操作，使某一行为或活动达到或超越规定的标准，如：规范管理、规范操作.

<br>

**为什么需要规范?**

- 降低新成员融入项目的成本, 同时也一定程度避免挖坑
- 提高开发效率、团队协作效率, 降低沟通成本
- 实现高度统一的代码风格，方便review, 另外一方面可以提高项目的可维护性
- 方便自动化

<br>

**规范包含哪些内容?**

如文章题目，前端协作规范并不单单指‘编码规范’，这个规范涉及到前端开发活动的方方面面，例如代码库的管理、前后端协作、代码规范、兼容性规范；其中不仅仅是前端团队内部的协作，一个完整的软件生命周期内，我们需要和产品/设计、后端(或者原生客户端团队)、测试进行协作, 我们需要覆盖这些内容.

下面就介绍，如果我是前端团队的Leader，我会怎么制定前端规范，这个规范需要包含哪些内容:

## 开发工作流规范
 
### 开发

#### **版本规范**

项目的版本号应该根据某些规则进行迭代，这里推荐使用[语义化版本](https://semver.org/lang/zh-CN/)规范, 规则如下:

- 主版本号：当你做了不兼容的 API 修改，
- 次版本号：当你做了向下兼容的功能性新增，
- 修订号：当你做了向下兼容的问题修正。

<br>

#### **代码控制系统规范**

大部分团队都使用git作为版本管理器，管理好代码也是一种学问。尤其是涉及多人并发协作、需要管理多个软件版本的情况下，定义良好的版本库管理规范，可以让大型项目更有组织性，也可以提高成员协作效率.

比较流行的git分支模型/工作流是[git-flow](https://www.git-tower.com/learn/git/ebook/cn/command-line/advanced-topics/git-flow), 但是大部分团队会根据自己的情况制定自己的git工作流规范, 例如我们团队的[分支规范](https://github.com/GDJiaMi/frontend-standards/blob/master/development.md#git-%E5%88%86%E6%94%AF%E6%A8%A1%E5%9E%8B)

Git 有很多工作流方式，这些工作流的选择可能依赖于项目的规模，项目的类型以及团队成员的结构. 比如一个简单的个人项目可能不需要复杂的分支划分，我们的变更都是直接提交到 master 分支。再比如开源项目，除了核心团队成员，其他贡献者是没有提交的权限的，而且我们也需要手段来验证和讨论贡献的代码是否合理。 所以对于开源项目 fork 工作流更为适合. 了解常见的工作流有利于组织或创建适合自己团队的工作流, 提交团队协作的效率:

![](/images/frontend-standard/branch.png)

- [简单的集中式](https://github.com/ivan-94/git-guide/blob/master/branch/centralized.md)
- [基于功能分支的工作流](https://github.com/ivan-94/git-guide/blob/master/branch/feature.md)
- [Fork/Pull Request 工作流](https://github.com/ivan-94/git-guide/blob/master/branch/fork.md)

<br>

#### **提交信息规范**

一个好的提交信息, 会帮助你提高项目的整体质量. 至少具有下面这些优点:

- 格式统一的提交信息可以帮助自动化生成changelog
- 版本库不只是存放代码的仓库, 也记录项目的开发记录. 这些记录应该可以帮助后来者快速地学习和回顾代码. 也应该方便其他协作者review你的代码
- 规范化提交信息可以促进提交者提交有意义的提交

社区上比较流行的提交信息规范是[Angular的提交信息规范](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit), 除此之外，这些也很不错:

- [Atom](https://github.com/atom/atom/blob/master/CONTRIBUTING.md#git-commit-messages)
- [Ember](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-ember)
- [Eslint](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-eslint)
- [JQuery](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-jquery)

这些工具可以帮助你检查提交信息和生成CHANGELOG:

- [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) - 从项目的提交信息中生成CHANGELOG和发布信息
- [commitlint](https://github.com/conventional-changelog/commitlint) - 鞍韂提交信息
- [commitizen](https://github.com/commitizen/cz-cli) - 简单的提交规范和提交帮助工具，推荐
- [standard-changelog](https://github.com/conventional-changelog/commitlint) - angular风格的提交命令行工具 

<br>

### 构建规范

对于团队、或者需要维护多个项目场景，统一的构建工具链很重要, 这套工具应该强调"约定大于配置"，让开发者更专注于业务的开发。在[为什么要用vue-cli3?](https://juejin.im/post/5d2fcaacf265da1b95708f63)提出了vue-cli3更新有很多亮点，非常适合作为团队构建工具链的基础:

- 首先这类工具是推崇'约定大于配置'的。即按照他们的规范，实现开箱即用，快速开发业务. 在团队协作中这点很重要，我们不推荐团队成员去关心又臭又长的webpack构建配置
- vue-cli3抽离了cli service层，可以独立更新工具链。也就是说项目的构建脚本在一个独立的service项目中维护，而不是像以前一样在每个项目目录下都有webpack配置和依赖, 这样做的好处是独立地、简单地升级整个构建链
- 灵活的插件机制。对于团队的构建定制化应该封装到插件中，这样也实现独立的更新。

我们可以选择第三方CLI或者定制自己的构建链，按照上面说的这个构建链应该有以下特点:

- **强约定，体现团队的规范**。首先它应该避免团队成员去关心或更改构建的配置细节，暴露最小化的接口。 另外构建工具不仅仅是构建，通常它还会集成代码检查、测试。
- **方便升级**。尤其是团队需要维护多个项目场景, 这一点很有意义

下面是社区上比较流行的构建工具, 当然，如果你也可以根据自己的团队情况开发自己的CLI, 但是下面的工具依然很有参考价值：

- create-react-app
- vue-cli
- microbundle
- parcel

<br>

### 发布工作流规范

发布工作流指的是将‘软件成品’对外发布(如测试或生产)的一套流程, 只有将这套流程实现规范才有利于实现自动化. 

举个例子, 一个典型的发布工作流如下：

- 代码变更
- 提交代码变更到远程版本库
- 程序通过CI测试(例如Travis变绿)
- 提升package.json中的版本
- 生成CHANGELOG
- 提交package.json和CHANGELOG.md文件
- 打上Tag
- 推送

如果你遵循上面的规范，那么就可以利用社区上现有的工具来自动化这个流程. 这里工具有[conventional-changelog-cli](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli)、[conventional-github-releaser](https://github.com/conventional-changelog/conventional-github-releaser). 实际上自己开发一个也不是特别难的事情.


### 持续集成

TODO:

## 技术栈规范

笔者现在所在的公司在我来之前，前端技术栈就非常混乱，Vue、React和AngularJS三大框架都有, 而且风格相差也很大. 当时我就想收包裹走人. 

很少有人能精通这三个框架的，更别说是一个团队。

**三大框架跟编程语言一样都有自己的设计哲学，这跟库的不一样, 一个库的替换成本很低；而框架的背后是一个架构、一个生态。每个框架背后牵涉着开发思维、生态系统、配套工具、最佳实践、性能调优。要精通和熟练一个框架需要付出的成本是很高。**

所以说团队的开发效率是基于稳定且熟练的技术栈。稳定的技术栈规范有利于团队协作和沟通; 另外如果团队精通这个技术栈，当出现问题或者需要深入调优, 会相对轻松. 

前端技术栈规范主要包含下面这些类型:

- 编程语言
- UI框架及其配套生态, 以及备选方案
- 样式. 包含了命名规范、预处理器、方法论等等
- QA. 包含了测试、Lint、格式化工具
- 项目构建工具流. 例如webpack、vue-cli
- 项目管理工具
- 模板引擎
- 开发工具
- 后端开发框架
- 工具库
- 等等

下面是我们团队的[技术栈规范](https://github.com/GDJiaMi/frontend-standards/blob/master/tech-stack.md)截图：

![](/images/frontend-standard/tech-stack.png)


当然，对于团队而言也要鼓励学习新的技术、淘汰旧的技术栈。因为一般而言， 新的技术/解决方案，是为了更高的生产力而诞生的。当团队容纳一个新的技术选型需要考虑以下几点：

- 学习成本。考虑团队成员的接纳能力。如果成本小于收获的利益，在团队里面推行估计阻力会比较大
- 收益。是否能够解决当前的某些痛点
- 考虑风险。一般我们不能将一个实验阶段的技术使用的生产环境中

就我们团队而言，每个成员都有自己感兴趣的方向和领域，所以我们可以分工合作，探索各自的领域，再将成果分享出来，如果靠谱则可以在实验项目中先试验一下，最后才推广到其他项目.

<br>

## 浏览器兼容规范

前端团队应该根据针对应用所面对的用户情况、应用类型、开发成本、浏览器市场统计数据等因素，来制定自己的浏览器兼容规范，并写入应用使用手册中.

**有了浏览器兼容规范，前端开发和兼容性测试就有理有据，避免争议**。

**确定兼容策略**:

![](/images/frontend-standard/g-p.png)

**渐进增强**还是**优雅降级**. 这是两个不同方向策略，**渐进增强保证低版本浏览器的体验，对于支持新特性的新浏览器提供稍好的体验**；**优雅降级则是相反的，为现代浏览器提供最好的体验，而旧浏览器则退而求之次，保证大概的功能**.

选择不同的策略对前端开发的影响是比较大的，但是开发者没有选择权。**确定哪种兼容策略，应该取决于用户比重，如果大部分用户使用的是现代浏览器，就应该使用优雅降级，反之选择渐进增强**.

<br>
<br>

**确定浏览器分级**

![](/images/frontend-standard/brw-levl.gif)

YUI就曾提出浏览器分级原则，到今天这个原则依然适用。简单说就是将浏览器划分为多个等级，不同等级表示不同的支持程度. 比如我们团队就将浏览器划分为以下[三个等级](https://github.com/GDJiaMi/frontend-standards/blob/master/browser-compatibility.md):

- **完全兼容**: 保证百分百功能正常
- **部分兼容**: 只能保证功能、样式与需求大致一致。对于一些不影响主体需求和功能的bug，会做降低优先级处理或者不处理。
- **不兼容**: 不考虑兼容性

一般而言, 根据浏览器市场分布情况、用户占比、开发成本等因素划分等级.

举个例子，下面是我们对管理系统的兼容规范:

![](/images/frontend-standard/cpt.png)

<br>

可以从这些地方获取通用的浏览器统计数据:

- [百度流量研究院](http://tongji.baidu.com/data/browser)：主要提供国内浏览器统计
- [statcounter](http://gs.statcounter.com/): 国际浏览器统计
- [浏览器发布年份统计](https://en.wikipedia.org/wiki/Timeline_of_web_browsers)

<br>

确定浏览器是否支持某个特性:

- [caniuse](https://caniuse.com)
- [MDN](https://developer.mozilla.org/zh-CN/)

<br>

## 项目组织规范

项目组织规范定义了如何组织一个前端项目, 例如项目的命名、项目的文件结构、版本号规范等等。尤其对于开源项目，规范化的项目组织就更重要了。

一个典型的项目组织规范如下:

- **README.md**: 项目说明, 这个最重要。你必须在这里提供关于项目的关键信息或者提供相关信息的入口.
- **CHANGELOG.md**: 放置每个版本的变动内容, 通常要描述每个版本变更的内容。方便使用者确定应该使用哪个版本. 关于CHANGELOG的规范可以参考[keep a changelog](https://keepachangelog.com/en/1.0.0/)
- **package.json**: 前端项目必须. 描述当前的版本、**可用的命令**、包名、依赖、环境约束、项目配置等信息.
- **.gitignore**: 忽略不必要的文件，避免将自动生成的文件提交到版本库
- **.gitattributes**: git配置，有一些跨平台差异的行为可能需要在这里配置一下，如换行规则
- **docs/**: 项目的细化文档, 可选.
- **examples/**: 项目的示例代码，可选.
- **build**: 项目工具类脚本放置在这里，非必须。如果使用统一构建工具，则没有这个目录
- **dist/**: 项目构建结果输出目录
- **src/**: 源代码目录
- **__tests__/**: 单元测试目录. 按照[Jest](http://jestjs.io)规范, `__tests__`目录通常和被测试的模块在同一个父目录下, 例如:

  ```shell
  /src
    __tests__/
      index.ts
      a.ts
    index.ts
    a.ts
  ```

- **tests**: 全局的测试目录，通常放应用的集成测试或E2E测试等用例

**对于开源项目通常还包括这些目录**:

- **LICENSE**: 说明项目许可
- **.github**: 开源贡献规范和指南
  - CONTRIBUTING: 贡献指南, 这里一般会说明贡献的规范、以及项目的基本组织、架构等信息
  - CODE_OF_CONDUCT: 行为准则
  - COMMIT_CONVENTION: 提交信息规范，上文已经提及
  - ISSUE_TEMPLATE: Issue的模板，github可以自动识别这个模板
  - PULL_REQUEST_TEMPLATE: PR模板

任意一个优秀的开源项目都可以是你的老师，例如[React](https://github.com/facebook/react)、[Vue](https://github.com/vuejs/vue)...

<br>

上面只是一个通用的项目组织规范，具体源代码如何组织还取决于你们使用的技术栈和团队喜好。网上有很多教程，具体可以搜索`怎么组织XX项目`. 总结一下项目组织主要有三种风格:

- **Rails-style**: 按照文件的类型划分为不同的目录，例如`components`、`constants`、 `typings`、`views`. 这个来源于Ruby-on-Rails框架，它按照MVC架构来划分不同的类型，典型的目录结构如下:
  
  ```shell
    app
      models # 模型
      views # 视图
      controllers # 控制器
      helpers # 帮助程序
      assets  # 静态资源
    config     # 配置
      application.rb
      database.yml
      routes.rb      # 路由控制
      locales        # 国际化配置
      environments/
    db        # 数据库相关
  ```
  
- **Domain-style**:  按照一个功能特性或业务创建单独的文件夹，包含多种类型的文件或目录. 比如一个典型的Redux项目，所有项目的文件就近放置在同一个目录下:

  ```shell
  Todos/
    components/
    actions.js
    actionTypes.js
    constants.js
    index.js
    model.js
    reducer.js
    selectors.js
    style.css
  index.js
  rootReducer.js
  ```

- **Ducks-style**: 优点类似于Domain-style，不过更彻底, 它通常将相关联的元素定义在一个文件下。Vue的单文件组件就是一个典型的例子，除此之外Vuex也是使用这种风格:

  ```vue
  <template>
    <div id="app">
      <h1>My Todo App!</h1>
      <TodoList/>
    </div>
  </template>

  <script>
  import TodoList from './components/TodoList.vue'

  export default {
    components: {
      TodoList
    }
  }
  </script>

  <style lang="scss">
  @import './variables.scss';
  /* ... */
  </style>
  ```

大部分情况下, 我们都是使用混合两种方式的目录结构，例如:

```shell
src/
  components/      # 🔴 项目通用的‘展示组件’
    Button/
      index.tsx    # 组件的入口, 导出组件
      Groups.tsx   # 子组件
      loading.svg  # 静态资源
      style.css    # 组件样式
    ...
    index.ts       # 到处所有组件
  containers/      # 🔴 包含'容器组件'和'页面组件'
    LoginPage/     # 页面组件, 例如登录
      components/  # 页面级别展示组件，这些组件不能复用与其他页面组件。
        Button.tsx # 组件未必是一个目录形式，对于一个简单组件可以是一个单文件形式. 但还是推荐使用目录，方便扩展
        Panel.tsx
      reducer.ts   # redux reduces
      useLogin.ts  # (可选)放置'逻辑', 按照👆分离逻辑和视图的原则，将逻辑、状态处理抽取到hook文件
      types.ts     # typescript 类型声明
      style.css
      logo.png
      message.ts
      constants.ts
      index.tsx
    HomePage/
    ...
    index.tsx      # 🔴应用根组件
  hooks/           # 🔴可复用的hook
    useList.ts
    usePromise.ts
  ...
  index.tsx        # 应用入口, 在这里使用ReactDOM对跟组件进行渲染
  stores.ts        # redux stores
  contants.ts      # 全局常量
```

框架官方很少会去干预项目的组织方式，读者可以参考下面这些资源来建立自己项目组织规范:

- [React组件设计实践总结02 - 组件的组织](https://juejin.im/post/5cd8fb916fb9a03218556fc1#heading-11)
- [Redux 常见问题：代码结构](https://link.juejin.im/?target=http%3A%2F%2Fcn.redux.js.org%2Fdocs%2Ffaq%2FCodeStructure.html)
- [react-boilerplate](https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2Freact-boilerplate%2Freact-boilerplate)
- [vuex 项目结构](https://vuex.vuejs.org/zh/guide/structure.html)

<br>

## 编码规范

- [vue-style-guide](https://vue.docschina.org/v2/style-guide/)

## 文档规范

文档中心

<br>

## UI设计规范

这是一个容易被忽略的规范类型。笔者就深受其苦，我们公司初期UI并不专业，没有所谓的设计规范，这就导致他们设计出来的产品都是东借西凑，前后不统一，不同的应用这种情况更加糟糕。这搞得我们不得不浪费时间，写很多定制化样式和组件，为他们的不专业买单.

关于UI设计规范的重要性有兴趣的读者可以看这篇文章[开发和设计沟通有多难？ - 你只差一个设计规范](https://juejin.im/post/5b766ac56fb9a009aa154c27). 简单总结一下：

- 提供团队协作效率
- 提高组件的复用率. 统一的组件规范可以让组件更好管理
- 保持产品迭代过程中品牌一致性

建立一个定义良好的设计规范需要`UI设计和开发`的紧密配合，有时候也可以由我们前端来推动。比如很多开源的UI框架，一开始都是开发者YY出来的，并没有设计参与，后来组件库慢慢沉淀成型，UI设计师再规范设计一下。

如果你们团队不打算指定自己的UI设计规范，则推荐使用现成的开源组件库：

- [Ant Design](https://ant.design/index-cn)
- [Material-UI](https://material-ui.com)
- [Element UI](https://element.eleme.io)
- [WeUI](https://weui.io)
- [Microsoft Fabric](https://developer.microsoft.com/en-us/fabric#/)

这些开源组件库都经过良好的设计和沉淀, 而且配套了完善的设计原则、最佳实践和设计资源文件（Sketch 和 Axure），可以帮助业务快速设计出高质量的产品原型。

<br>

## 测试规范

Review
单元测试
安全测试
性能测试
异常监控
统计分析
SEO优化测试

## 前后端协作规范

接口规范
  接口测试
文档规范

## 基础库规范

## 新成员培训/知识管理

培训手册
  产品架构与组织架构
  产品研发流程
  工作范围
  建立资源索引
  导师机制
图书库
鼓励写技术博客，建立自己的团队博客
鼓励参与开源项目
定期的专题分享

## 示例

大家有什么要补充的可以在下方评论