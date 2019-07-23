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
  - [任务管理](#任务管理)
- [技术栈规范](#技术栈规范)
- [浏览器兼容规范](#浏览器兼容规范)
- [项目组织规范](#项目组织规范)
- [编码规范](#编码规范)
- [文档规范](#文档规范)
- [UI设计规范](#ui设计规范)
- [测试规范](#测试规范)
- [异常处理、监控和调试规范](#异常处理监控和调试规范)
- [前后端协作规范](#前后端协作规范)
- [培训/知识管理/技术沉淀](#培训知识管理技术沉淀)
- [反馈](#反馈)

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

### 任务管理

## 技术栈规范

笔者现在所在的公司在我来之前，前端技术栈就非常混乱，Vue、React和AngularJS三大框架都有, 而且风格相差也很大. 当时我就想收包裹走人. 

很少有人能精通这三个框架的，更别说是一个团队。

**三大框架跟编程语言一样都有自己的设计哲学，这跟库的不一样, 一个库的替换成本很低；而框架的背后是一个架构、一个生态。每个框架背后牵涉着开发思维、生态系统、配套工具、最佳实践、性能调优。要精通和熟练一个框架需要付出的成本是很高。**

所以说团队的开发效率是基于稳定且熟练的技术栈。稳定的技术栈规范有利于团队协作和沟通; 另外如果团队精通这个技术栈，当出现问题或者需要深入调优, 会相对轻松. 

前端技术栈规范主要包含下面这些类型:

- 编程语言
- UI框架及其配套生态, 以及备选方案。其背后的生态非常庞大:
  - UI框架
  - 路由
  - 状态管理
  - 组件库
  - 国际化
  - 动画
  - 服务端渲染
  - 脚手架、CLI工具
  - 组件测试
- 样式. 包含了命名规范、预处理器、方法论等等
- QA. 包含了测试、Lint、格式化工具、监控
- 项目构建工具流. 例如webpack、vue-cli
- 项目管理工具
- 模板引擎
- 开发工具
- 后端开发框架
- 工具库
- 开发/调试工具
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

- **README.md**: 项目说明, 这个最重要。你必须在这里提供关于项目的关键信息或者提供相关信息的入口. 一般包含下列信息:
  - 简要描述、项目主要特性
  - 运行环境/依赖、安装和构建、测试指南
  - 简单示例代码
  - 文档或文档入口, 其他版本或相关资源入口
  - 联系方式、讨论群
  - 许可、贡献/开发指南
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
- **.env\***: 项目中我们通常会使用`环境变量`来影响应用在不同运行环境下的行为. 通过[dotEnv](https://github.com/motdotla/dotenv)来从文件中读取. 通常有三个文件:

  - `.env` 通用的环境变量
  - `.env.development` 开发环境的环境变量
  - `.env.production` 生成环境的环境变量

  基本上这些文件的变动的频率很少，团队成员应该不要随意变动这些文件，以免影响其他成员。所以通常使用`.env.*.local`文件来覆盖上述的配置.

<br>

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

**脚手架和项目模板**

如果团队可以将项目结构规范确定下来，可以创建自己的脚手架工具或者项目模板，快速初始化一个项目。更甚的，可以通过‘生成器’，来生成代码模板。

相关资源
- yeoman
- plop
- babel-code-generator

<br>

## 编码规范

网络上大部分‘前端规范’指的都是编码规范. 统一的编码规范对团队项目的长远维护不无裨益. 一致性的代码规范可以增强团队开发协作、提高代码质量、减少遗留系统维护的负担。

最直接的好处就是避免写出糟糕的代码, 糟糕的代码与新手和老手关系不大，我也见过好处工作很多年的‘资深’工程师写出恶心的代码. 这样的代码随着项目的迭代会变得难以控制。

现代的Lint工具已经非常先进，几乎可以约束各种编码行为. 比如约束一个文件的长度、函数的复杂度、命名规范、注释规范、接口黑名单、DeadCode、检查简单的逻辑错误...

每一个程序员心目中对‘好代码’都有自己的主见，统一的编码规范可以像秦始皇统一战国一样，避免论战和争议。

**其实与其自己建立前端编码规范，笔者推荐选择社区沉淀下来的规范**. 这方面的资源非常多，所以本文也不武断地提出自己的规范建议. 推荐下面这些资源:

<br>

**Javascript**

- Lint工具
  - [ESLint](https://cn.eslint.org)目前是社区最流行的、通用的Javascript Lint工具，Lint界的Babel。支持定制插件、preset。如果不想折腾可以选择它的一些预定义配置
  - [TSLint](https://github.com/palantir/tslint)Typescript Lint工具。不过即将一个[废弃](https://github.com/palantir/tslint/issues/4534)了, 推荐使用ESLint
- 规范
  - [JavaScript Standard Style](https://standardjs.com/readme-zhcn.html#why-should-i-use-javascript-standard-style)零配置的、‘标准’的Javascript编码规范. 底层基于Eslint。目前不支持Typescript
  - [Airbnb JavaScript Style Guide() {](https://github.com/airbnb/javascript) Airbnb的编码规范，业界标杆
- 类型检查. 暂时将它们归类到这里，因为它们同属于[‘静态测试’](https://juejin.im/post/5d2c515d6fb9a07ead5a2bbe#heading-39)
  - [Typescript](https://www.typescriptlang.org) Javascript语言的超集，这是一门‘新’的语言，而不是简单的类型检查器. 不过**它也支持[原生Javascript的类型检查](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)**
  - [Flow](https://flow.org) Facebook出品的类型检查器，语法和Typescript类似. 个人推荐使用Typescript

<br>

**HTML**

- Lint工具
  - [HTMLHint](https://htmlhint.io)
  - [bootlint](https://github.com/twbs/bootlint)
- 规范
  - [Code Guide](https://codeguide.co)

<br>

**CSS**

- Lint工具
  - [stylelint](https://stylelint.docschina.org) 通用的CSS编码检查工具，支持最新的CSS语法、CSS-in-js、以及其他类CSS语法(如SCSS、Less). 它也有预定义配置，推荐使用
- 规范
  - [Airbnb CSS / Sass Styleguide](https://github.com/airbnb/css)
  - [Code Guide](https://codeguide.co)
  - [更多](https://css-tricks.com/css-style-guides/)
- 方法论
  - [BEM](https://css-tricks.com/bem-101/) BEM命名规范
  - [OOCSS](https://github.com/stubbornella/oocss/wiki)
  - [smacss](http://smacss.com)

关于CSS可以学习[Bootstrap](http://twitter.github.com/bootstrap/)这些传统UI框架，他们的代码组织性非常好

<br>

**代码格式化**

![](/images/frontend-standard/prt.png)

- [Prettier](https://prettier.io) 关于代码格式化的所有东西都交给它吧！

<br>

**集大成的**

- [isobar 前端代码规范及最佳实践](https://coderlmn.github.io/code-standards/#_code_reviews)
- [凹凸实验室代码规范](https://guide.aotu.io/index.html)
- [老牌的NEC规范](http://nec.netease.com/standard)
- [百度FEX规范](https://github.com/fex-team/styleguide)

<br>

**特定框架风格指南**

- [vue-style-guide](https://vue.docschina.org/v2/style-guide/)
- [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react)

<br>

**Code Review**

上述的Lint工具和类型检查器, 可以约束代码风格、避免低级的语法错误。但是即使通过上面的Lint和类型检查，代码也未必是‘好代码’。

**很多代码设计的‘最佳实践’是无法通过具象化的自动化工具或文档覆盖的, 这时候，经验或者群体智慧就派上用场了**. 比如Code Review阶段会检查这些东西:

- 编程原则、设计思想. 例如符合SOLID原则? 是否足够DRY？接口设计是否简洁易扩展、
- 模块耦合、代码重复
- 代码健壮性。是否存在内存泄露、是否线程安全、是否有潜在性能问题和异常、错误是否被处理
- 代码的性能和效率。
- 是否有没有考虑到的场景？

如果你们是第一次推行Code Review, 可以建立一个检查列表，对照着进行检查。熟练后，心中自然无码。

Code Review有很多好处，比如：

- Code Review可以让其他成员都熟悉代码。这样保证其他人都可以较快地接手你的工作，或者帮你解决某些问题
- 提高代码质量。毫无疑问. 一方面是*主动性*的代码质量提升，比如你的代码需要被人Review，会自觉尽量的提高代码质量；另一方面，其他成员可以检查提交方的代码质量
- 检查或提高新成员的编程水平。培养新人时，由于不信任它们提交的代码，我们会做一次Review检查代码是否过关。另一方面这是一次真实的案例讲解, 可以较快提高他们的能力

Code Review有两种方式: 一个提交时、一个是定时

- 提交时. 大部分开源项目采用这种方式。通俗讲就是Pull Request。只有代码通过测试、和其他成员的Review才可以合进正式版本库。这种方式也称为‘阻塞式’代码检查，一般配合GitFlow使用。
- 定时. 在项目完结后、项目的某个里程碑、或者固定的时间(每天、每个星期..). 团队成员聚在一起，回顾自己写的代码, 让其他成员进行审查

Code Review是比较难以推行的，不过这个也要看你们团队的情况，向我们钱少活多的团队，很少的时间去立马去兼顾其他成员的代码. 所以这时候定时Review会更有用，看起来更‘节省时间’. 
而提交时Review则可以针对新人，比如你不信任他们的代码或者需要希望帮助他们提高能力。

扩展

- [Code Review最佳实践](https://mp.weixin.qq.com/s?__biz=MzIwMTQwNTA3Nw==&mid=400946871&idx=1&sn=5a125337833768d705f9d87ba8cd9fff&scene=1&srcid=0104FLyeXIS6N0EShgDseIfI&key=41ecb04b051110031290b34976240e650f0169d239c89f125162a89c8d3412f2087198612e71fd7685cae9eebe08e295&ascene=0&uin=MTYyMDMzMTAwMA%3D%3D&devicetype=iMac+MacBookPro11%2C5+OSX+OSX+10.10.5+build(14F1509)&version=11020201&pass_ticket=dc5bBckt1XSthRKTIsukYHIcAvKfv0jninbMlYQ5TWnE6XS%2FrRkdHKlJjNTI2Wsg)
- [是否要做Code Review？与BAT资深架构师争论之后的思考](https://juejin.im/post/5c9740ba6fb9a071090d6a37)
- [一些Code Review工具](https://richardcao.me/2016/09/30/Talk-About-Codereview/)

## 文档规范

文档对于项目开发和维护以及学习、重构、知识管理非常重要。和写测试一样、大部分开发人员会觉得写文档是一件痛苦的事情，只有时间能够证明它的价值。比如对于人员流动比较大的公司，如果有规范的文档体系，转交工作就会变动非常轻松.

广义的文档不是指‘说明文件’本身，它有很多形式、来源和载体，可以描述一个知识、以及知识形成和迭代的过程。例如版本库代码提交记录、代码注释、决策和讨论记录、CHANGELOG、示例代码、规范、传统文档等等

<br>

**建立文档中心**

我们公司是做IM的，所以之前我们使用自己的通讯工具来分享文档，这种方式有很大问题:

1. 如果没有存档习惯，比如后端的API文档，因为由后端维护，一般不会主动去存档。这样文档就可能丢失，而且通讯工具是不会永久保存你的文档的。当丢失文件就需要和文档维护者索要
2. 糟糕的是文档维护者也是自己手动在本地存档的，这样导致的问题是如果工作转交，其他开发者需要花费一点时间来查找
3. 每一次文档更新要重新发一份, 这很麻烦，而且可能出现漏发的情况导致, 前后不一致.
4. 关于文档的学习、有意义的讨论记录无法归档, 这也是'知识'。

上面介绍的是一种非常原始的文档共享方式，很多小团队就是这么干的。

**对于项目本身的文档建议放置在项目版本库里面，跟随项目代码进行迭代, 当我们在检索或跟踪文档的历史记录时，这种方式是最方便的**。

然而很多应用是跨越多个团队的，每个团队都会有自己的文档输出(比如需求文档、系统设计文档、API文档、配置文档等等)，而且通常也不会在一个版本库里。这时候文档就比较分散。所以一个统一的文档中心是很有必要。

我们公司现在选择的方案是`Git+Markdown`，也就是说所有的文档都放置在一个git版本库下。之前也考虑过商业的方案，譬如[石墨文档](https://shimo.im/welcome)、[腾讯文档](https://docs.qq.com), 当管理层并不信任这些服务。大概的组织如下:

```shell
规范/
A应用/
  产品/
  设计/
  API文档/
  测试/
  其他/
B应用/
```

**Git版本库(例如Gitlab)有很多优势，例如历史记录跟踪、版本化、问题讨论(可以关联issue、或者提交)、多人协作、搜索、权限管理(针对不同的版本库或分组为不同人员设置权限)等等**。

`Git+Markdown`可以满足开发者的大部分需求。但是Git最擅长的是处理纯文本文件、对于二进制是无能为力的，无法针对这些类型的文档进行在线预览和编辑。

而且`Git+Markdown`并不能满足多样化的文档处理需求，比如思维导图、图表、表格、PPT、白板等需求. 毕竟它不是专业的文档处理工具。所以对于产品、设计人员这些富文档需求场景，通常会按照传统方式或者更专业的工具对文档进行管理.

<br>

**文档格式**

毫无疑问，对于开发者来说，[Markdown](https://zh.wikipedia.org/wiki/Markdown)是最适合的、最通用的文档格式。支持在线预览和变更历史跟踪。下面这些工具可以提高Markdown的开发效率:

- 可视化编辑器
  - **Visual Code**: 大部分代码编辑都支持Markdown编辑和预览
  - [**Mou**](https://link.jianshu.com/?t=http://mouapp.com/): Mac下的老牌编辑器
  - [**typora**](https://typora.io): 跨平台的Markdown编辑器，推荐
- **markdownlint**: 编码检查器
- 扩展(Visual Studio Code):
  - **Markdown All in One**: All you need to write Markdown (keyboard shortcuts, table of contents, auto preview and more)
  - **Markdown TOC**: markdown 目录生成，我最常用的markdown插件
- 图表绘制工具:
  - [**drawio**](https://www.draw.io) 基于Web的图表绘制工具、也有离线客户端
  - **KeyNote/PPT** 临时绘图也不错

<br>

**定义文档的模板**

关于如何写好文档，很难通过标准或规范来进行约束，因为它的主观性比较强, 好的文档取决于编辑者的逻辑总结能力、表达能力、以及有没有站在读者的角度去思考问题。

所以大部分可以情况下，我们为不同类型的文档提供一个模板，通过模板来说明一个文档需要包含哪些内容, 对文档的编写者进行引导.

例如一个API文档可能需要这些内容:

- 接口的索引
- 接口的版本、变更记录
- 用法和整体描述, 认证鉴权等等
- 描述具体的接口
  - 功能说明
  - 方法名称或者URI
  - 参数和返回值定义
  - 调用示例
  - 注意事项等等

具体规范内容因团队而异，这里点到为止.

扩展:

- [中文技术文档的写作规范](https://github.com/ruanyf/document-style-guide/blob/master/docs/reference.md)
- [React RFC模板](https://github.com/reactjs/rfcs/blob/master/0000-template.md)

<br>

**讨论即文档**

**一般情况下，对于一个开源项目来说除了官方文档，Issues也是一个很重要的信息来源。这Issue中我们可以获取开发者遇到的问题和解决方案、给官方反馈/投票、关注官方的最新动态、和其他开发者头脑风暴唇枪舌战**。

所以相对于使用IM，笔者更推荐Issue这种沟通模式，因为**它方便归档组织，索引和查找**。而IM上的讨论就像流水一样，一去不复返。

当然两种工具的适用场景不一样，你拿IM的使用方式来使用Issue，Issue就会变得很水。**Issue适合做有意义的、目的明确的讨论**。 所以要谴责一下在Github Issue上灌水的开发者。关于Issue有很多妙用，推荐阅读这篇文章[<如何使用 Issue 管理软件项目？>](http://www.ruanyifeng.com/blog/2017/08/issue.html)

现在很多开源项目都引入了RFC(请求意见稿)流程(参考[React采用新的RFC流程](https://www.infoq.cn/article/2017/12/react-rfc-process), 以及[Vue 最黑暗的一天](https://juejin.im/post/5d0f64d4f265da1b67211893)), 这让开发者有‘翻身农奴、当家做主’的感觉，任何人都可以参与到一个开源项目重大事件的决策之中。**每个RFC会说明决策的动机、详细设计、优缺点。除了官方文档之外，这些RFC是很有价值的学习资料**。

我觉得如果不涉及机密，团队应该要让更多人参与到项目的设计和决策中，对于新手可以学到很多东西，对于发起者也可能有考虑不周的情况。

对于企业应用开发, Issue有用吗? 我们可以将这类话题从IM转移到Issue:

- 设计方案
- 决策/建议
  - 新功能、新技术引入
  - 重构
  - 性能优化
  - 规范
- 问题讨论
- 重大事件
- 计划或进度跟踪
- ...

![](/images/frontend-standard/issue.png)

另外Issue通常通过标签来进行分类，方便组织和检索。

<br>

**代码即文档**

现在有很多种工具支持从代码中解析和生成文档, 这可以给开发者简化很多文档维护的工作。

举个例子，我们经常会遇到修改了代码，但是文档忘记没有同步的情况。通过‘代码即文档’的方式至少可以保持文档的同步更新；另外很多工具会分析代码的数据类型，自动帮我们生成参数和返回值定义，这也可以减少很多文档编写工作以及出错率。

比如可以通过下面注释方式来生成组件文档:

```jsx
import * as React from 'react';
import { Component } from 'react';

/**
 * Props注释
 */
export interface ColumnProps extends React.HTMLAttributes<any> {
  /** prop1 description */
  prop1?: string;
  /** prop2 description */
  prop2: number;
  /**
   * prop3 description
   */
  prop3: () => void;
  /** prop4 description */
  prop4: 'option1' | 'option2' | 'option3';
}

/**
 * 对组件进行注释
 */
export class Column extends Component<ColumnProps, {}> {
  render() {
    return <div>Column</div>;
  }
}
```

相关的工具有:

- API文档
  - Typescript
    - [tsdoc](https://github.com/microsoft/tsdoc) Typescript官方的注释文档标准
    - [typedoc](https://github.com/TypeStrong/typedoc) 基于tsdoc标准的文档生成器
  - Javascript
    - [jsdoc](https://github.com/jsdoc/jsdoc) Javascript文档注释标准和生成器
- 后端接口文档
  - [Swagger](https://swagger.io) Restful接口文档规范
  - GraphQL: 这个有很多工具，例如[graphiql](https://github.com/graphql/graphiql), 集成了Playground和文档，很先进
  - [Easy Mock](https://easy-mock.com/login) 一个可视化，并且能快速生成模拟数据的服务
- 组件文档
  - [StoryBook](https://storybook.js.org) 通用的组件开发、测试、文档工具
  - React
    - [Docz](http://docz.site)
    - [Styleguidist](https://github.com/styleguidist/react-styleguidist)
  - Vue
    - [vue-styleguidist](https://github.com/vue-styleguidist/vue-styleguidist)
    - 有更好的工具请评论告诉我

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

测试是保障代码质量的重要手段，但是很少有人原因在这里花太多时间。比如笔者，我很少会去给业务代码和组件写单元测试，除非自己对代码非常没有信心。 但是对于一些底层、共享的代码模块还是有测试的必要的。

我在[不知道测试什么？这些是你需要知道的软件测试类型和常识](https://juejin.im/post/5d2c515d6fb9a07ead5a2bbe)文章中，列举了一些开发者需要关注的测试类型和常识, 如果按照测试的阶段进行分类，大概是这样子的:

![](/images/frontend-standard/testing.png)

其中前端开发者需要关注的主要有以下几种测试类型:

- **单元测试**: 对独立的软件模块进行测试
  - **UI组件测试**: 包括了快照(Snapshot)测试
- **集成测试**: 在单元测试的基础上，将模块组合起来，测试它们的组合性
- **E2E测试**: 在完整、真实的运行环境下模拟真实用户对应用进行测试。**主要测试前端和后端的协调性**
- **兼容性测试**: 上面提到了浏览器兼容规范，在将版本提交给测试之前，需要确保能符合兼容性要求
- **性能测试**: 测试和分析是否存在性能问题
- **其他**:
  - 安全测试
  - SEO测试

对于小团队来说，可实施性比较高的, 也是比较简单是单元测试，所以重点关注单元测试. 因为对于小公司来说整个软件开发流程可能没有那么规范，比如很难部署一个完整的端对端测试环境，这些都不是前端团队可以操作的范围, 所以自动化测试很难推行。但是可以逐步进行开展。

**测试的流程**

首先要定义一个合适的软件测试流程, 合适的测试流程可以降低开发和测试团队之间的沟通协作成本、提高测试效率。例如我们团队目前的测试流程:

![](/images/frontend-standard/test-proc.png)

<br>

**单元测试**

单元测试有很多好处, 比如:

- 提高信心，适应变化和迭代. 如果现有代码有较为完善的单元测试，在代码重构时，可以检验模块是否依然可以工作, 一旦变更导致错误，单元测试可以帮助我们快速定位并修复错误
- 单元测试是集成测试的基础
- 测试即文档。如果文档不能解决你的问题，在你打算看源码之前，可以查看单元测试。通过这些测试，开发人员可以直观地理解程序单元的基础API
- 提升代码质量。易于测试的代码，一般都是好代码

测什么?

业务代码或业务组件是比较难以实施单元测试的，一方面它们比较多变、另一方面很多团队很少有精力维护这部分单元测试。所以**通常只要求对一些基础/底层的组件、框架或者服务进行测试, 视情况考虑是否要测试业务代码**

测试的准则:

- 推荐Petroware的[Unit Testing Guidelines](https://petroware.no/unittesting.html), 总结了27条单元测试准则，非常受用.
- 另外阿里巴巴的Java开发手册中总结的[单元测试准则](https://github.com/alibaba/p3c/blob/master/p3c-gitbook/%E5%8D%95%E5%85%83%E6%B5%8B%E8%AF%95.md), 也不错，虽然书名是Java，准则是通用的.

单元测试指标:

一般使用`测试覆盖率`来量化，尽管对于覆盖率能不能衡量单元测试的有效性存在较多争议。大部分情况下还是推荐尽可能提高覆盖率, 比如要求`语句覆盖率达到70%；核心模块的语句覆盖率和分支覆盖率都要达到100% `. 是团队情况而定

**前端测试的相关资源**

<br>

扩展

- [有赞前端质量保障体系](https://juejin.im/post/5d24096ee51d454d1d6285a1)

<br>

## 异常处理、监控和调试规范

很多开发者常常误用或者轻视异常的处理, 合理有效的异常处理可以提高应用的健壮性和可用性，另外还可以帮助开发者快速定位异常.

**异常处理**

阿里巴巴的Java开发手册中总结的[异常处理规范](https://github.com/alibaba/p3c/blob/master/p3c-gitbook/%E5%BC%82%E5%B8%B8%E6%97%A5%E5%BF%97/%E5%BC%82%E5%B8%B8%E5%A4%84%E7%90%86.md)对JavaScript的异常处理也很有参考意义，比如:

- 异常不要用来做流程控制，条件控制。
- 捕获异常是为了处理它，不要捕获了却什么都不处理而抛弃之，如果不想处理它，请将该异常抛给它的调用者。最外层的业务使用者，必须处理异常，将其转化为用户可以理解的内容。
- catch时请分清稳定代码和非稳定代码，稳定代码指的是无论如何不会出错的代码。对于非稳定代码的catch尽可能进行区分异常类型，再做对应的异常处理。不要对大段代码进行try-catch
- ...

然后再根据JavaScript本身的异常处理特点总结一些规范行为, 例如:

- 不要throw非Error对象
- 不要忽略异步异常
- 全局监控Javascript异常
- ...

资源:

- [从1000+个项目中总结出来的前10个JavaScript错误, 以及如何避免它们](https://rollbar.com/blog/top-10-javascript-errors/)
- [Javascript异常处理‘权威’指南](https://levelup.gitconnected.com/the-definite-guide-to-handling-errors-gracefully-in-javascript-58424d9c60e6)
- [前端异常处理最佳实践](https://zhuanlan.zhihu.com/p/63698500)

<br>

**日志**

对于前端来说，日志也不是毫无意义。尤其是在**生产现场**调试代码时，可贵的控制台日志可以帮助你快速找到异常的线索. 

通常我们**只要保留必要的、有意义的日志输出**，比如你不应该将console.log放到一个React渲染函数中、或者放到一个循环中, **DDos式的日志信息并不能帮助我们定位问题，反而会影响运行的性能**. 所以需要一个规范来约束日志输出行为, 比如:

- 避免重复打印日志
- 谨慎地记录日志, 划分日志级别。比如生产环境禁止输出debug日志；有选择地输出info日志；
- 使用前缀对日志进行分类, 例如: `[User] xxxx`
- 只记录关键信息, 这些信息可以帮助你诊断问题
- ...

扩展资源

- [debug](https://github.com/visionmedia/debug) 适合Node.js和浏览器的debug日志工具, 支持动态开启日志打印
- [vConsole](https://github.com/Tencent/vConsole) 移动端调试利器

<br>

**异常监控**

因为程序跑在不受控的环境， 所以对于客户端应用来说，异常监控在生产环境是非常重要的，它可以收集各种意料之外生产环境问题，帮助开发者快速定位异常。

异常监控通常会通过三种方式来收集异常数据:

1. 全局捕获。例如使用window.onerror, 或者`unhandledrejection`
2. 主动上报。在try/catch中主动上报. 
3. 用户反馈。比如弹窗让用户填写反馈信息.

和日志一样，**不是所有‘异常’都应该上报给异常监控系统，譬如一些预料之内的‘异常’**，比如用户输入错误、鉴权失败、网络错误等等. 异常监控主要用来上报一些意料之外的、或者致命性的异常.

要做好前端的异常监控其实并不容易，它需要处理这些东西:

- 浏览器兼容性。
- 碎片收集(breadcrumbs)。 收集‘灾难’现场的一些线索，这些线索对问题诊断很重要。例如当前用户信息、版本、运行环境、打印的日志、函数调用栈等等
- 调用栈的转换。通常在浏览器运行的压缩优化过的代码，这种调用栈基本没什么可读性，通常需要通过SourceMap映射到原始代码. 可以使用这个库: [source-map](https://github.com/mozilla/source-map#sourcemapconsumer)
- 数据的聚合。后端监控系统需要对前端上报的信息进行分析和聚合

对于小团队未必有能力开发这一套系统，所以推荐使用一些第三方工具。例如

- [Sentry](https://sentry.io/welcome/) 🔥免费基本够用
- [FunDebug](https://www.fundebug.com/price) 付费增强

扩展:

- [前端异常监控解决方案研究](https://cdc.tencent.com/2018/09/13/frontend-exception-monitor-research/)
- [搭建前端监控系统](https://www.cnblogs.com/warm-stranger/p/9417084.html)

## 前后端协作规范

流程
接口规范
接口文档规范
接口测试
并行开发
  Mock

## 培训/知识管理/技术沉淀

我觉得一个团队的知识管理是非常重要的. 你要问一个刚入行的新手加入团队希望得到什么？很多人的回答是'学习', 希望自己的技术可以更加精进。然而现实是目前很多公司的氛围并不是这样的，一天到晚写业务代码、 工作量大、每天做重复的事情，而且还加班，工作多年技术也没感觉有多少进步, 确实会让人非常沮丧。包括笔者也是这样的。

所以为了改善这种情况，我来聊聊最近在‘小团队’做的一些尝试.

**新人培训**

如果团队有规范的新成员培训手册，可以节省很多培训的时间，避免每次重复口述一样的内容。培训手册包含以下内容:

- **产品架构与组织架构**. 介绍公司背景和产品，一般组织的团队结构和产品的架构是相关联的. 以笔者所在公司为例, 主要产品是即时通信:

  ![](/images/frontend-standart/org.png)

- **产品研发流程**: 介绍产品开发和迭代会涉及到的流程、以及团队之间的协作衔接，例如:

  ![](/images/frontend-standart/dev-proc.png)

- **工作范围**: 团队成员的职责范围
- **建立资源索引**: 开发需要设计到的资源，比如各种文档地址、研发系统入口(例如gitlab、bug跟踪系统、文件共享、发布平台、开发/测试环境、监控系统)、协作规范等等。将这些资源整理好可以减少不必要的沟通成本
- **规范**: 即本文的主体'前端协作规范'。有规范可循，可以让成员以较快的速度入手开发、同时也减少培训成本投入。

培训手册将可能将可以文档具象化的内容整理为文档，和上文说到的Code Review一样，一些东西无法通过文档来说明，所以我们一般会搭配一个‘培训导师’，在试用期间，一对一辅导。

<br>

**营造技术学习氛围**

- 鼓励成员写技术博客，或者建立自己的团队专栏
- 鼓励参与开源项目
- 定期的专题分享. 鼓励团队成员定期进行专题学习和研究，编写技术博客， 并将学习的成果分享给其他成员.

  专题怎么来?

  专题请求. 可以请求其他成员完成专题，比如比较深的知识，可以要求团队比较有经验的进行学习分享

  - 学习总结.
  - 项目回顾
  - 难点攻克
  - 项目规范
  - 工具使用

- 落实和完善开发规范. 规范本身就是团队知识沉淀的一种直接输出
- 图书分享.
- 鼓励重构和持续优化代码
- 抽象一套基础库或框架，减少重复工作, 提高工作效率

<br>

## 反馈

大家有什么要补充或意见可以在下方评论, 一起来完善这篇文章, 谢谢！