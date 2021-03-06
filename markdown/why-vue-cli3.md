---
title: "[问答] 为什么要用vue-cli3?"
date: 2019/7/18
categories: 前端
---

> `[问答]`系列主要整理[SegmentFault](https://segmentfault.com/q/1010000019785471)上面比较有价值的问题，以及我的回答

## [原问题](https://segmentfault.com/q/1010000019785471/a-1020000019793827)

其实这个问题主要是想了解vue-cli3与vue-cli2相比是否存在一些不得不升级的好处和优点？

产生这个问题的原因是在试用完vue-cli3之后并没有觉得好用，反而觉得束手束脚，我cli2时，webpack想怎么配怎么配为什么到了cli3我要在vue.config.js中配置
众所周知vue-cli的通用配置并不适合每种情况, 而在vue.config.js只能做增添和覆盖，所以一直没有用vue-cli3构建项目

所以想请教下 这个版本有没有值得升级的优点

<br>

## 我的回答

好问题，vue-cli3相对vue-cli有很多重要的更新。

首先说一些vue-cli这些工具的**初衷**吧: 这些工具就是为了让开发者能够**开箱即用**快速地进行应用开发而开发的，**它们秉承的是“约定大于配置”思想，简单说就是"能不配置的就不配置，你就按照我的方式来，也不要去争论这个好不好，快速进行业务开发才是正经事". 它们不建议你去配置，但也不会拦着你去配置**。

另外Webpack对初学者并不是十分友好，‘又长又臭’的配置，普通开发者很难写入定义良好，性能优化的配置。不然就不会各种cli工具冒出来了，比如parcel，create-react-app。这些工具都宣称零配置，目的就是让开发者能够愉快的进行代码开发。

<br>

---

<br>

现在来看看Vue-cli v3的改进，以及思考这些有什么意义呢？

<br>

**1. 抽离cli service层**

Create-React-App是第一个做这种事情的。vue-cli3库现在包含以下两个模块：

- CLI: 即vue全局命令，主要用于项目创建和管理，包含了`vue create`、`vue ui`这些命令。CLI命令的做的事情比较少，所以更新不会太频繁(开发者也很少会去更新这些命令)

- Service层: 负责项目的实际构建，也就是webpack项目构建。这一块是频繁更新的，一般作为项目的局部依赖。

<br>

OK，这么做有什么意义呢？考虑这样一个场景，这也是答主之前遇到的一个痛点：

**vue-cli3之前不算是一个构建CLI, 它顶多就是一个模板拷贝器, 做的事情非常少**, 所有webpack配置和构建命令都是耦合在具体的项目里面，package.json会包含一大堆开发依赖。

如果去跟进webpack或相关工具更新的朋友会有这种体会，升级不是一件容易的事情。比如你升级了babel-loader, 可能要连带webpack都升级，webpack升级后可能其他工具又不兼容了。

升级方面的痛点是其一。如果你的团队需要维护很多项目，你怎么对这些项目进行维护升级？每个项目都拷贝一下？如果某个项目做了特殊配置呢？

**对于团队而言，项目构建这一块是应该尽量做到的统一和傻瓜化的，没有必要在这方面投入太多的精力，应该把事情外包给擅长这种事情的人去做**。

**另外不要排斥更新，更新可以获得更好的开发体验和构建速度、运行性能, 别人在这方面比你了解的更多**。

**分离了vue-cli-service之后，项目构建更新只是一个命令的事情，除非做了很多特殊化操作**。**特殊化操作应该封装到vue-cli的插件中**。这就引出了vue-cli3的另外一个特色：插件

<br>

----

<br>

**2. 插件化**

相比create-react-app, vue-cli是在太仁慈了。vue-cli的插件机制很灵活，通过`webpack-chain`和`webpack-merge`可以实现webpack完全定制化。

可以对比一下市面上流行的cli工具的可扩展性：

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

<br>

对于vue-cli的插件实现机制可以看这篇[文章](https://juejin.im/post/5cedb26451882566477b7235)。

因为vue-cli灵活的扩展性，所以它不仅限于vue本身，可以扩展支持react、anything...

按照上文说的，**如果你要做深度的vue-cli定制化，不建议直接写在vue.config.js中，而是封装在插件中，独立的维护这个插件，然后项目再依赖这个插件。这样就可以简化升级的成本和复杂度**。

<br>

----

<br>

**3. GUI界面**

虽然大部分人都觉得作用不大，因为确实对开发效率并实际的提升效果。就是看着舒服直观，这就够了。

<br>

---

<br>

**4. 快速原型开发**

vue-cli3也支持直接将一个vue文件跑起来，快速原型开发或验证某些想法时，挺不错。

<br>

----

<br>

**5. [现代模式](https://cli.vuejs.org/guide/browser-compatibility.html#modern-mode)**

给先进的浏览器配合先进的代码(ES6之后),同时兼容旧版本的浏览器，先进的代码不管从文件体积还是脚本解析效率、运行效率都有较高的提升。

体积对比:

|Version|	Size (minified)	|Size (minified + gzipped)|
|-------|--------|-------|
|ES2015+ (main.mjs)	|80K	|21K|
|ES5 (main.es5.js)|	175K	|43K|

<br>

解析效率:

|Version	| Parse/eval time (individual runs)	| Parse/eval time (avg) |
|---------------|------------|-------------|
|ES2015+ (main.mjs) |	184ms, 164ms, 166ms|	172ms|
|ES5 (main.es5.js) |	389ms, 351ms, 360ms|	367ms|


<br>

---

<br>

**6. Standard Tooling for Vue.js Development**

这是vue-cli的官方介绍，vue标准开发工具. 跟进vue-cli就是跟进官方的最佳实践和前沿技术，vue团队已经为你考虑很多应用场景, why not?

<br>

---

<br>

**总结一下**：

- 如果我们喜欢折腾，肯定会觉得vue-cli3束手束脚，这时候我们不是vue-cli3的目标用户；

  就比如我们团队就自己搞了一一个CLI构建工具: [jm-cli](https://github.com/GDJiaMi/jm-cli), 根据自己的团队需求进行深度定制，不过我们这个工具是强约定的，包括目录结构、编码规范等等. 因为我们不推荐团队成员去搞特殊化定制，而且为了方便进行更新，所以干脆就不让扩展了，**统一和规范对团队来说才是最重要的**.

  **如果你有类似的开发经验，你会觉得vue-cli可能是所有构建CLI的最终归宿或者典范**。

- 如果不想折腾，只想写代码, 而且想跟进vue官方最新实践，那就直接拿来用吧；
- 如果想折腾，又要考虑团队协作和构建工具链的维护成本，vue-cli是很适合的。当然你也可以造轮子
- 如果想学webpack的构建项目，也不推荐你使用vue-cli

<br>

最后给vue团队点个赞👍

欢迎关注我，和我交流
