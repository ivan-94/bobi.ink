---
title: '微前端的落地和治理实战'
date: 2023/7/13
categories: 前端
---

![Untitled](/images/microfrontend/Untitled.png)

微前端实现原理、框架选型之类的文章比较泛滥，我不打算讲这些玩意，本文主要来源于笔者过去一年落地微前端的一手经验，尽量不讲技术细节，而是讲一个体系化的方案是怎么搭建起来。

文章较长，耐心看完保证会有收获。

# 背景与痛点

首先来看下业务背景，方便读者了解我们为什么选择微前端，以及其他相关技术选型的原因。

前端在架构上面的变化远落后于后端，后端的架构已经经历了微服务、中台化、DDD 改造的腥风血雨…

在改造成微前端之前, 我们也是一个巨型的`单体应用`，后面随着业务的复杂化，业务和团队进一步进行拆分， 我们的前端项目也根据[`康威定律`](https://zh.wikipedia.org/zh-hans/%E5%BA%B7%E5%A8%81%E5%AE%9A%E5%BE%8B)，进化成为了‘`多页应用`’， 如下图所示：

![多页](/images/microfrontend/Untitled%201.png)

<br>

我们主要做的是 2B 业务，做 [POC](https://zh.wikipedia.org/zh-hans/%E6%A6%82%E5%BF%B5%E9%AA%8C%E8%AF%81)(概念验证) 和`私有化部署`是家常便饭，在已有的架构下，我们需要应用某些配置可能会牵扯多个项目，比如主题、文案、接口配置等信息的修改，需要针对多个项目进行创建分支、修改代码、构建、发布、部署… 一系列繁琐的流程

主要原因是我们的业务系统经过长期、多团队、多业态的迭代，积累了大量的技术债。

- 技术栈老旧，开发效率低，我们想要应用新的技术和规范，但碍于项目体量大、质量差，重构举步维艰。
- 子应用的拆分没有固定的范式。有些模块按照团队拆分出独立的仓库，有些仓库则采用 MonoRepo。前者仓库之间存在大量重复代码、缺乏管理；而后者 MonoRepo 则越来越臃肿, 职责不清晰，编译缓慢, 逐渐也演变成了`巨石应用`。
- 基于多页的子应用缺乏管理，规范/标准不统一。无法统一控制视觉呈现、共享的功能和依赖。造成重复工作
- 新旧项目、第三方应用集成都很复杂。
- 多行业、多团队的项目特性，导致工程管理复杂，扩展性差。
- 部署方式原始。
- 应用按照菜单聚合，而不是按照业务聚合
- ...

<br>

> 💡  怎么理解 “应用按照菜单聚合，而不是按照业务聚合” 呢？
>
> ![菜单聚合](/images/microfrontend/Untitled%202.png)
>
> **朴素的多页应用通常按照“菜单”来拆分应用，比如按照上图的顶级 Tab。**
>
> 后面来这一个这样的需求，a 应用的某些功能菜单需要在 b Tab 下展示，这时候就傻眼了：
>
> - 把 a 的相关代码搬运到 b？如果后面菜单又改了怎么办？再说，你能搬得动吗？
> - 用 iframe 将 a 套在 b 应用下？

<br>
<br>

因此我们亟需一套新的架构，**能统一管理不同团队业务线、同时能够保持原本的独立性和灵活性**。这时候微前端架构就进入了我们的考察范围：

![星状](/images/microfrontend/Untitled%203.png)

我们需要一个「底座」将不同的应用聚合起来，将原本`离散`的应用通过一个`基座`串联起来：

- **离散的应用结构，转换为星状结构。**基座可以统一管理子应用。
- **开发者可以更专注于业务的开发**。基座会提供配套的登录会话管理、权限管理、菜单管理、路由管理、主题管理等方案，子应用只需关心业务功能本身的开发。
- **更容易地集成应用**。不管是自己的业务应用、老旧系统、还是外部第三方应用，都可以在极少改动的情况下集成进来。
- **视觉统一**。
- **拆分巨石应用，让子应用可以按照“业务聚合”**。**不再耦合菜单**， 让应用更轻量、内聚、更可维护

> 💡  使用微前端之后，子应用不再耦合菜单，菜单由基座来管理和组合，菜单可以被放在任意位置。

<br>

# 架构

**由于我们原本就是`多页应用`的架构，所以基于`路由分发` + `基座形式`的微前端方案是一种比较自然的选择**。整体项目架构如下：

![Untitled](/images/microfrontend/Untitled%204.png)

我们构造了一整套体系化的方案： 从`规范`到`开发基础库`、从`权限管理系统`到`微前端基座`、从`开发调试`到`部署运维`。

1. **基础库：**我们将每个应用都重复的工作提取出来，重新设计，并严格管理起来。使之能真正有效地服务业务开发，避免重复造轮子。
2. **开发规范**：同时，我们期望提供更丰富的开发规范、指导、最佳实践作为支撑。让开发者走更少的弯路。
3. **权限管理平台**：基座的**菜单**、**权限信息**来源于`权限管理平台`, 通过权限管理平台可以灵活地给不同业态、不同角色配置不同的菜单和权限。这是我们微前端方案的重要基础。
4. **基座:** 基座是微前端应用集成的一个重要平台。同时也肩负着管理公共资源、依赖、规范的责任。主要有以下职责：
   - 子应用集成。给子应用提供渲染容器
   - 路由/菜单管理
   - 权限管理
   - 主题管理
   - 会话管理
   - 多语言管理
   - 共享依赖等
5. **运行容器：[运行容器](https://wakeadmin.wakedata.com/mapp/deploy.html)**  是我们提供的一套微前端的运行和部署方案。相比传统纯粹的前端资源静态部署，我们希望在部署阶段可以做更多的事情：

   - 动态配置。比如域名配置、SEO 信息配置
   - 主题管理。一键换肤能否实现？
   - 子应用管理。自动发现子应用，而不是在微前端基座中硬编码？
   - 语言包。能否实时配置语言包，而不需要重新编译代码、审核、发布...
   - 开发环境、测试环境部署能否简化？

   得益于`运行容器`，我们可以实现**前端部署的标准化**，支持「**一键部署」**等能力。

<br>
<br>
<br>
<br>

# 基座

![基座主界面](/images/microfrontend/Untitled%205.png)

基座主界面

如上所示，基座为子应用提供了基础的运行环境， 蓝色区域为子应用的运行范围。

<br>

![基座结构](/images/microfrontend/Untitled%206.png)

基座的大概结构如上。

首先是`会话管理`，基座会`拦截`应用的所有请求，如果监听到 401 状态码，则跳转到登录页面进行授权。登录/注册页面也是由子应用提供，我们尽量不让基座耦合具体的业务。

<br>

基座启动后，就会从`权限管理平台`拉取菜单、权限配置信息，渲染页面的菜单导航框架。同时也会对页面路由进行授权拦截，而细粒度的权限控制(比如按钮)，基座也会暴露 API 供子应用适配。

<br>

至于子应用信息，则是**由`运行容器`自动发现并注入**，避免在基座中硬编码了这些信息。基座底层基于 [qiankun](https://github.com/umijs/qiankun)，根据路由匹配渲染指定的子应用。

> 💡 `运行容器`是啥? 这个我们会在下文介绍，简单来说，它就是一个 `NodeJS` 服务，会**自动发现**已经部署在服务器中的子应用，然后将这些信息注入到基座的启动代码中。

<br>

基座还统一管理了`主题包`、`多语言`。从而保证子应用可以有较为统一的呈现。主题包也可以在部署时动态切换，这对于 POC 或者私有化部署比较方便。

> 💡  主题包主要包含 CSS 变量、组件库样式、语言包、静态资源、甚至一些部署配置信息。

<br>

![API](/images/microfrontend/Untitled%207.png)

为了方便子应用使用基座的「`服务`」， 基座也向子应用暴露了一系列的组件库和 API。

组件库基于使用 `Web Component` 的形式，实现框架无关， 基于 Vue 3 创建。Vue 3 [构建自定义元素](https://cn.vuejs.org/guide/extras/web-components.html) 也很方便，所以就没必要引入其他框架专门来编写这块了

这些 API 可以直接挂载在全局 window 对象上，子应用可以直接访问。

> 💡  实际上我们封装了一个套壳 npm 库，避免子应用直接访问 window 对象上的服务, 隐藏细节，另外可以提供类型提示。

<br>
<br>
<br>
<br>

# 子应用接入

简单、免侵入地改造子应用使我们要达成的主要目标。

## 配置

为此，我们也提供了相应的 `vue-cli` 插件, 支持快速集成，避免开发者关心 Webpack 底层的各种配置细节

> 我们的微前端主要基于 [qiankun](https://github.com/umijs/qiankun)，官方目前并不支持 Vite，并且我们大量项目主要以 Vue CLI 为主。

示例：

```jsx
const { defineConfig } = require('@vue/cli-service')
const { defineMappChild } = require('@wakeadmin/vue-cli-plugin-mapp-child')

module.exports = defineConfig({
  transpileDependencies: false,
  pluginOptions: {
    // 只需要简单的配置
    ...defineMappChild({
      mapp: {
        activeRule: '/dsp.html',
      },
    }),
  },
  lintOnSave: false,
})
```

多入口配置：

```jsx
const { defineConfig } = require('@vue/cli-service')
const { defineMappChild } = require('@wakeadmin/vue-cli-plugin-mapp-child')

module.exports = defineConfig({
  // 多页应用
  pages: {
    index: 'src/main.ts',
    another: 'src/another.ts',
  },
  pluginOptions: {
    // 微前端集成配置
    ...defineMappChild({
      mapp: [
        {
          // entry 必须为上面 pages 中定义的 key
          entry: 'index',
        },
        {
          // entry 必须为上面 pages 中定义的 key
          entry: 'another',
        },
      ],
    }),
  },
})
```

## 挂载

接着调整应用挂载程序：

```jsx
import { createApp, App as TApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import Bay from '@wakeadmin/bay'

import App from './App.vue'
import { routes } from './router'
import store from './store'

let app: TApp

Bay.createMicroApp({
  async bootstrap() {
    console.log('bootstrap vue3')
  },
  async mount(container, props) {
    console.log('mount vue3', props)

    const router = createRouter({
      history: createWebHashHistory(),
      routes,
    })

    app = createApp(App).use(store).use(router).use(Bay)

    app.mount(container?.querySelector('#app') ?? '#app')
  },

  async unmount() {
    console.log('unmount vue3')

    app.unmount()
  },

  async update() {
    console.log('update vue3')
  },
})
```

## 本地开发和调试

运行起来后， 我们会在终端打印出子应用的相关信息，如下图：

![terminal](/images/microfrontend/Untitled%208.png)

接下来，只需要在`基座的调试页面`，注册这个子应用就可以运行起来的：

![debug](/images/microfrontend/Untitled%209.png)

> 💡  有了微前端之后，子应用的开发和调试也简化了很多，可以随时挂载到任意环境，不需要配置任何服务端代理。

<br>
<br>
<br>

# 部署和治理

网上很少关于微前端应用的部署和治理的介绍，下面介绍我们自己摸索出来一套方案， 这也是本文的重点。

<br>

## 容器化

在此之前，我们的前端项目都是扔到一台静态资源服务器，很多开发者会手动操作，项目之前通过目录隔离，手动维护 Nginx 进行分流，手段原始且容易出错，场面十分混乱。

在 2021 年，我们就开始推行前端项目的容器化，来解决这种混乱的状态。

为了`标准化`、`自动化`每个项目的构建操作、部署流程，我们和后端对齐， 使用容器和 K8S 来实现发布产物的封装和部署。这样的好处是：

- 实现测试环境和生产环境的统一。
- 简化部署流程， 采用统一的配置，无需更改 Nginx 配置
- 真正做到不同团队项目的隔离。
- 支持回滚
- 简化和标准化构建流程。同时也简化了运维的工作，前后端都是容器部署。
- 运行的环境更加灵活。我们可以使用最新的 nginx 版本，可以使用 HTTP2 等新的技术，前端自己就可以部署一套 NodeJS 环境，做一些更酷的事情。对运维的依赖性会更低。

<br>

这对我们来说是一个比较重要的升级。我们的工作不再局限于静态资源的伺服，我们可以使用 NodeJS 开发 API、自动化工作流、可以进行服务端渲染等等，拓展了能力的边界。

<br>
<br>

然而，很多配置信息在构建时就固定下来了，比如 CDN 域名，接口请求路径等等。而不同环境通常会使用不同的配置信息。**这样就无法实现构建一次镜像，在不同环境运行。**

后端程序的解决办法是将配置信息外置，比如通过`环境变量`配置或者从`配置中心`(比如 Nacos)获取。

这在前端行不通，所以我们引入了`运行容器`的概念。

<br>
<br>

## 运行容器

`运行容器`，顾名思义就是整套`微前端` 的`运行时`，以 「`Docker 容器`」的形式部署。我们尽量复用 K8S 提供的基础设施(比如 PVC、配置映射、Sidecar 等) 来实现。

运行容器的主要结构：

![container](/images/microfrontend/Untitled%2010.png)

`运行容器`主要包含两大部分：

- `Nginx` ：毫无疑问，Nginx 是`静态资源伺服`的最佳能手，同时它作为内部服务`反向代理`。
- `transpiler` (我们称为`转换器`): 这是一个「搬运工」，主要负责配置的收集、代码转换。并将转换后的静态资源交给  `nginx`  伺服。

下面会详细介绍它的能力。

<br>
<br>

## 如果实现子应用的自动发现？

答案是**”约定“**。

运行容器约定了以下目录：

```bash
/data/
  /source/                   # 源目录
    /__public__/             # 公共资源, 外部可以直接访问，不需要 __public__ 前缀
    /__config__/             # 配置目录
      config.yml
      any-sub-dir/
        my-config.yml

    /__entry__/              # 基座目录
      js/
      index.html

    /__apps__/               # 子应用目录
      wkb/
      dsp/
      dmp/
        js/
        mapp.json
        index.html

    /__i18n__/               # 语言包目录
      zh.tr
      en.tr
      any-sub-dir/
        zh.tr
        en.tr

    /__theme__/              # 主题目录
      config.yml
      element-ui.css
      element-plus.css
      fonts/
      i18n/
        zh.tr
        en.tr

  /public/                    # nginx 伺服目录
```

目录结构解析：

- `/data/source`。没错，`transpiler`  就是`转译`和搬运这里的静态资源。
- `/data/public`。 `transpiler`  就是将资源转译后搬运到这里，`nginx`  对外伺服这个目录。

<br>

> 转译？`transpiler` 可以认为就是一个模板引擎，它会替换代码里面的动态变量。

<br>

再来看  `/data/source`：

- `__entry__`: 基座编译之后的代码就部署这里。
- `__apps__`: 子应用编译之后的代码就部署这里，子应用之间， 按照唯一的  `name`  区分目录。
- `__i18n__`: 扩展语言包，文件按照  `<language>.tr`  命名， 子目录的 .tr 文件也会被扫描到。
- `__config__`: 配置目录。配置文件使用  `.yml`  或  `.yaml`  命名，也可以放在子目录下。
- `__theme__`: 主题包目录。可以手动维护，也可以使用  `npmTheme`  配置项, 让  `transpiler`  从 npm 拉取。
- `__public__`: 公共资源目录。这些资源可以直接访问，而不需要  `__public__`  前缀。举个例子:
  ```bash
    __theme__/
      index.css  *# -> 访问链接 example.com/__theme__/index.css*
    __public__/
      hello.html *# -> 访问链接 example.com/hello.html*
  ```

<br>
<br>

那  `transpiler`  的工作过程应该比较清晰了：

- 扫描  `__apps__`  下的`子应用`。开发者也可以在*子应用目录下*使用  `mapp.json`  显式定义子应用描述信息。扫描后的子应用信息将放在  `microApps`  变量下。
- 扫描  `__config__`  下的配置文件。解析出配置信息。
- 扫描  `__i18n__`  下的  `.tr`, 解析结果放在  `i18n`  变量下。
- 扫描  `__theme__`  目录。`__theme__`  主题包也支持携带配置文件、语言包，所以这些信息也会合并到配置信息中。另外 CSS 文件、JavaScript 文件将被收集到  `theme`  变量中。

<br>

扫描完毕之后，`transpiler`  拿着配置信息进行`模板转译`，将  `/data/source`  下的静态资源转换被拷贝到  `/data/public`  目录下。

来看个实际的模板例子:

```html
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="description" content="[%= description %]" />
    <meta name="keywords" content="[%= keywords %]" />
    <link rel="icon" href="[%= assets.IMG_BAY_FAVICON || entryPath + '/favicon.png' %]" />
    <meta name="version" content="[%= version %]" />
    <meta name="update-time" content="[%= `${year}-${month}-${date}` %]" />
    <title>[%= title %]</title>
    <!--! [%- theme.stylesheets.map(i => `<link rel="stylesheet" href="${i + '?' + hash }" />`).join('\n') %] -->
    <!--! [%- theme.scripts.map(i => `<script async="true" src="${i + '?' + hash}"></script>`).join('\n') %] -->
    <!--! [% if (microApps.length) { %] -->
    <!--! [%- 
      `<script>
        // 微应用注入
        (window.__MAPPS__ = (window.__MAPPS__ || [])).push(${microApps.map(i => JSON.stringify(i)).join(', ')});
      </script>`
    %] -->
    <!--! [% } %]-->
    <!--! [%- `<script>
      // 静态资源注入
      (window.__MAPP_ASSETS__ = (window.__MAPP_ASSETS__ || [])).push(${JSON.stringify(assets)});

      // 全局共享的语言包
      window.__I18N_BUNDLES__ = ${JSON.stringify(i18n)};
    </script>` %] -->
    <script
      defer="defer"
      src="[%= cdnDomain ? '//' + cdnDomain : '' %][%= removeTrailingSlash(base) %]/__entry__/js/chunk-vendors.582ba02c.js?[%= hash %]"
    ></script>
    <script
      defer="defer"
      src="[%= cdnDomain ? '//' + cdnDomain : '' %][%= removeTrailingSlash(base) %]/__entry__/js/app.01bd68bb.js?[%= hash %]"
    ></script>
    <link
      href="[%= cdnDomain ? '//' + cdnDomain : '' %][%= removeTrailingSlash(base) %]/__entry__/css/app.d835cada.css?[%= hash %]"
      rel="stylesheet"
    />
  </head>

  <body>
    <noscript
      ><strong
        >We're sorry but [%= title %] doesn't work properly without JavaScript enabled. Please
        enable it to continue.
      </strong></noscript
    >
    <div id="app"></div>
  </body>
</html>
```

<br>
<br>

上面是基座的  `index.html`  模板。`transpiler`  基于  **[ejs](https://ejs.bootcss.com/)**  模板引擎，会解析替换文本文件中  `[% 模板 %]`  语法。

<br>

还有很多用法值得去挖掘。 比如:

- 全局埋点脚本注入
- 全局监控脚本注入
- ...

原理就是这么简单，只要子应用部署到 `__apps__` 目录下，我们就可以监听到，收集到必要的信息后，对 `source` 目录下的静态文件进行转译，输出到 `public` 目录下，最终由 Nginx 负责将文件传递给浏览器。

<br>
<br>
<br>

## 部署和运维

那么子应用具体如何部署和运维呢？

子应用构建、生成和发布容器的过程这里就不展开说了，可以自行搜索 Docker 的相关教程，我们这里主要简单介绍一下在 K8S 平台如何部署和运维。

将基座和子应用聚合在一起，我们需要用到 `PVC` (PersistentVolumeClaim, 即持久化卷), 你可以认为 PVC 就是一个「网络硬盘」，而每个子应用、基座都是独立运行的「主机」(`Pod` 或 容器 , *Kubernetes*  中可部署的最小、最基本对象), 这个 PVC 可以被每个子应用共享访问，只要按照约定将子应用的静态文件拷贝到 PVC 对应位置就行了。如下图所示：

![PVC](/images/microfrontend/Untitled%2011.png)

<br>
<br>
<br>

至于子应用和运行容器在 K8S 下如何组织，可以非常灵活，取决于需求和环境。笔者实践过以下几种方式：

1. 全部部署在一个 Pod 下。子应用作为 `Init Sidecar`（初始化边车）。这种部署方式比较简单，缺点就是任意一个应用需要更新，整个 Pod 都要重启，包括运行容器。

   ![方法1](/images/microfrontend/Untitled%2012.png)

   示例图：

   ![Sidecar](/images/microfrontend/Untitled%2013.png)

2. 分离运行容器和子应用。为了避免子应用更新导致整个 Pod 重启（包括运行容器），我们可以将子应用单独拎出去，子应用更新只会重启所在的 Pod，从而避免运行容器停机。

   ![方法2](/images/microfrontend/Untitled%2014.png)

3. 每个子应用都是独立的 Pod。好处就是每个子应用可以真正做到独立部署、启动，坏处就是管理起来稍显麻烦。

   ![方法3](/images/microfrontend/Untitled%2015.png)

开发者可以根据自己的运行环境选择不同的组织方式。

<br>
<br>
<br>

## 那么配置呢？

首先简单的配置可以通过`环境变量`来实现，因为在 K8S 中，配置环境变量相对简单很多:

![环境变量配置](/images/microfrontend/Untitled%2016.png)

对于稍微复杂的配置，可以使用`配置映射`(Config-Maps), 配置映射的每个键值对就相当于一个文件，我们可以挂载到容器的任何位置上：

定义配置映射：

![定义配置映射](/images/microfrontend/Untitled%2017.png)

挂载配置映射：

![挂载配置映射](/images/microfrontend/Untitled%2018.png)

配置映射可以挂载到任意的路径或文件上，它还有一个更赞的能力**是：我们可以直接修改配置映射，这些变动会同步到容器内，从而实现实时变更**。

小结。我们尽量复用了 K8S 本身的能力，这些能力足以实现较为复杂功能，避免重复造轮子。

<br>
<br>
<br>

## 更多

限于篇幅很多细节无法展开，这里点到为止：

- **如何实现一键部署？**因为使用的是容器化部署，可以将所有部署声明在 [yaml 文件](https://www.notion.so/b590284a71934f97a1db71ef967fbc5a?pvs=21)中维护, 新环境部署时直接导入就行。我们也开发过一个[可视化生成 yaml 的简易应用](https://wakeadmin.wakedata.com/k8s-deploy/index.html#/micro)
- **自动化部署？**实现自动化部署有很多手段，如果你的公司有 DevOps 平台(比如我们使用 Zadig) , 这些平台本身就提供了自动化部署的能力，你可以查看相关文档。另外在 Jenkins 中也有相关的插件来实现部署推送。再不济，[可以使用 rancher 的 CLI 等等](https://www.notion.so/a2b1fb632eb44b68b161a38f256756db?pvs=21)。
- **子应用如何共享依赖？**可以使用 [externals](https://webpack.js.org/configuration/externals/#externals), 或者 Webpack 5 的 \***\*[Module Federation](https://webpack.js.org/concepts/module-federation/#motivation),** 我们也探索过类似 [jsDelivr](https://www.jsdelivr.com/) 的方案， 详见[这里](https://wakeadmin.wakedata.com/mapp/advanced/vendors.html#%E9%85%8D%E7%BD%AE%E9%A1%B9)
- **接口服务**。运行容器除了上文讲到的各种功能，还可以提供一些造福前端的[接口服务](https://wakeadmin.wakedata.com/mapp/advanced/services.html)，比如接口代理、polyfill 服务、vendor 依赖。
- **_安全配置_**。在运行容器中统一配置 CSP、跨域等安全配置
- …

<br>
<br>
<br>

## 有哪些最佳实践?

- **保持基座业务无关性**。我们尽量保证基座不耦合业务，为了避免子应用的业务侵入到基座，我们严格管控基座仓库的开发权限，以及向下暴露接口的截面。
- **保持子应用之间的独立性**。基座除了 `EventBus` ，没有提供其他应用通信的手段。对我们来说，微前端只不过是多页应用的延续。 设计良好的应用，不应该耦合其他应用。就算是一些共享状态，也可以从后端读取。
- **避免硬编码配置信息**。因为`运行容器`有动态替换变量的能力，因此应该避免在代码中硬编码配置信息，比如域名信息、企业文案、服务器链接。而是预留模板, 在部署时通过**[运行容器](https://wakeadmin.wakedata.com/mapp/deploy.html)**来配置。
- **按照业务聚合子应用**。即按照业务边界来拆分子应用，而不是按照‘菜单’， 具体来说子应用应该对应后端的微服务，尽管很多时候做不到。

<br>
<br>
<br>

## 未来

我们整套方案并没有‘自造’复杂的技术，而是基于已有的工具整合起来的能力。这也是笔者一直坚持的观念，简单至上。

这个方案未来会如何迭代呢？

- 可视化方式，简化部署的流程。毕竟不是所有开发者都熟悉 K8S 这套概念
- 发布流程审核。生产环境部署审核。
- 基座插件。支持扩展一些除子应用之外的场景，比如一些全局通用的业务 SDK、组件库。常规的子应用只会在路由匹配到时激活，而插件会在基座启动后加载并持久存在。
- 支持子应用扩展服务端的能力。当前的子应用都是 CSR，后续运行容器可以支持子应用扩展服务端接口。
- 灰度发布。
- 支持 Vite
- …

<br>
<br>
<br>

# 总结

本文大概介绍了我们落地和治理微前端应用的大概思路。这套体系中主要包含了三个主要部件：

![微前端](/images/microfrontend/Untitled%2019.png)

- 基座：`集中式`的微前端方案，基座是整个微前端的核心，负责管理子应用，并为子应用的开发提供必要的支撑
- 子应用：负责具体业务实现，按照业务聚合和拆分。
- 运行容器：为微前端应用架构提供了部署和治理方案

因为文章篇幅原因，这里面很多细节无法展开。感兴趣的可以移步我们[公开的文档](https://wakeadmin.wakedata.com/mapp/index.html)（暂未开源）。

<br>
<br>

# 扩展阅读

- [Wakeadmin](https://wakeadmin.wakedata.com/mapp/index.html)
- [qiankun](https://github.com/umijs/qiankun)
