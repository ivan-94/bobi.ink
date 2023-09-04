---
title: 不要造轮子
date: 2023/9/4
categories: 前端
---

![Cover](/images/dont-reinvent/steve-busch-FqPkHwRn5x8-unsplash.jpg)

<br>

今年 MidJourney 的大火，给我们开了很多眼界，它竟然连一个就是它连正经的网站没有，核心的交互都在 Discord 上完成

![MidJourney](/images/dont-reinvent/Untitled 0.png)

<br>

还有前阵子在 X 看到这些帖子，受到一些启发：

![X](/images/dont-reinvent/Untitled.png)

![X](/images/dont-reinvent/6670D49B-C5ED-40CE-B614-5B053DDF1B1C.jpeg)

<br>

很多程序员都喜欢造轮子，事事都想自己亲力亲为，其实大可不必。仔细想想对于用户来说、对于自己来说什么才是最重要的？

![DDD](/images/dont-reinvent/Untitled%201.png)

<br>

如何按照 DDD 说法，**我们最应该重视的是系统的核心域，这是我们资源应该集中投入的地方，而对于通用域和支撑域，能外包出去就外包出去，能用现成的就用现成的**。

比如像 `Midjourney` 来说，核心域就是文生图，像用户、社区、付费等通用子域，利用现成的 SaaS 服务既能节省成本，可能还能出奇招。

<br>

那我这篇文章到底想讲什么？就是想告诉大家🤫 ：**不要造轮子、不要造轮子、不要造轮子，怎么简单怎么来。**

<br>

把精力放在有价值的事情上，支撑域和通用域尽量外包，它们可能比你想象的要专业。不管是商业的SaaS ，还是开源方案我们都有很多选择。

<br>

我先讲讲我的经历，关于 DDD 领域建模。在公司 DDD 的推广前期，很多开发者都使用 ProcessOn 这样的画图工具，按照建模约定拖拖拽拽画图， 例如下面：

![领域建模](/images/dont-reinvent/Untitled%202.png)

<br>

原本 Java 语法就比较啰嗦，引入 DDD 后，类变多了，样板代码更是直线上升。后面我们就想，能不能画完图就能生成`模板代码`呢？

<br>

于是一班人就想要开发一个可视化建模工具，还有对应的代码生成器。

如果从零开发这套`建模编辑器`，工程量可想而知，比如基于 AntV G6 (内部有一套流程编排可视化引擎，使用的就是 G6) 这些方案。

后面我就提议，为啥不用现有的画图工具呢，为啥要造轮子呢？比如开源画图工具。经过调研之后，我们发现 `draw.io` 基本能够满足产品 `MVP` 的需求。

<br>

[draw.io](http://draw.io) 支持自定义组件：

![draw.io 自定义组件](/images/dont-reinvent/Untitled%203.png)

<br>


这些组件支持很多`控制参数`，可以在绘制上提供一些基本约束：

![draw.io 图形控制参数](/images/dont-reinvent/Untitled%204.png)

<br>

另外组件还支持自定义数据：

![draw.io 自定义属性](/images/dont-reinvent/Untitled%205.png)


<br>

[draw.io](http://draw.io) 最终输出的 XML 结果，里面包含了组件的数据、以及组件之间的关系。  足够解析生成代码了:

![draw.io](/images/dont-reinvent/Untitled%206.png)

<br>
<br>

那我们建模结果保存在哪里呢？

一班人又扯着搞个 SaaS、怎么版本管理、怎么多人协作、怎么同步、怎么保证跟代码关联起来(DDD 就是领域驱动设计，领域模型图应该和代码设计映射起来)…  

越搞越复杂…

其实大可不必，建模结果直接存在版本库里面，跟随代码走不就好了？

<br>

---

<br>

因此本文，我们模仿上的那条 X，站在前端的角度，如果我不会后端，或者不想写后端代码，或者想快速开发一个产品 MVP，我们有哪些攻略？

我就举一些当下比较流行的例子，仅供参考，你也可以自己探索更多的方案，欢迎在评论区分享

<br>
<br>

# CMS

CMS是内容管理系统（Content Management System）的缩写。它是一种用于创建、管理、发布内容的软件应用。内容可以是文本、图片、音频、视频等各种格式。使用CMS，即使没有编程知识，用户也可以轻松地管理网站内容。

传统的 CMS 代表主要有 WordPress、[Joomla](https://www.joomla.org/)、[Drupal](https://www.drupal.org/developers)。

随着前后端分离的架构模式的流行，以及前端框架的发展， Headless CMS的概念和实践开始被广泛接受和采用, Headless CMS 的代表有  Contentful、Sanity、Strapi、Ghost 等等

<br>

![Strapi](/images/dont-reinvent/Untitled%207.png)

<br>


如果你要做的业务正好在 CMS 的命中场景(比如企业网站、新闻、博客、社区、订阅列表、记账等等)，那么对于前端开发者来说，不妨选择这些 Headless CMS 方案，可以帮助我们快速将产品搭建起来。

<br>

![Notion](/images/dont-reinvent/Untitled%208.png)

<br>

除此之外你也可以考虑使用一些`在线表格`的方案， 比如 AirTable、Google Sheets、Notion 等等。这些在线表格已经非常强大和灵活了， 利用这些平台提供的 API， 可以很容易地将数据集成到你的网站应用中。

前端侧也有专门面向 CMS 场景的框架， 比如 Astro。当然 Next.js、Nuxt.js、Remix、Gastby… 也是不错的选择

<br>
<br>

# 后端服务

如果你不熟悉后端开发，也有很多 SaaS 产品来代替它们， 比如国外这些大名鼎鼎的产品：

- Firebase
- AWS Amplify
- Vercel

<br>

![阿里云 EMAS](/images/dont-reinvent/Untitled%209.png)

<br>

国内也有腾讯云 [CloudBase](https://cloud.tencent.com/product/tcb)、微信云开发、阿里云 [EMAS](https://www.aliyun.com/activity/emas/serverless) 、uni-cloud 这类的方案。基于  Serverless 提供一站式后端开发服务， 一条龙解决资源存储、数据库、API、托管、运维、监控等等问题。

![腾讯云 Cloudbase](/images/dont-reinvent/Untitled%2010.png)


甚至一些方案还包揽了登录授权、内容审核、权限管理、支付… 

不过就是钱的问题。

<br>
<br>
<br>

# 低代码

![低代码](/images/dont-reinvent/Untitled%2011.png)

如果你连前端都不想写，那么可以尝试一下低代码方案。前后端一站式解决….

低代码是过去几年比较火(卷)的概念， 相关的产品多如牛毛，国外有 OutSystems、Mendix、Microsoft Power Apps、Builder.io 、Retool … 

国内有 WeDa、钉钉宜搭、网易 CodeWave….

这里就不一一列举了。

<br>
<br>
<br>

# 文档

我们真需要自己打一个文档站点吗？大部分情况真没必要，直接用语雀、Notion、Github Wiki、GitBook 之类的搞起来就行了。

到底是内容重要还是形式重要呢？

如果你真想搭建一个文档站点，也应该优先考虑 VitePress、Gastby、Docusaurus 这些静态网站生成器。

<br>
<br>
<br>

# 数据可视化

如果要做数据分析、数据可视化、报表、数据 Dashboard, 有很多开源的方案， 比如 Grafana、Metabase、Power BI…. 

![Metabase](/images/dont-reinvent/Untitled%2012.png)

这些工具都很强大，也是通过‘低代码’的方式，实现丰富多彩的图表、统计需求

<br>
<br>

# 站点托管

1. GitHub Pages：适合托管个人、组织或项目站点的静态网页。免费用户可以创建无限数量的仓库。
2. Netlify：为开发人员提供一个端到端的平台，用于构建、部署和托管用户界面。
3. Vercel：适合前端开发人员，特别是使用Next.js, React.js等构建的项目，提供持续部署和服务器渲染。
4. Firebase Hosting：适合托管移动应用内容和静态网站，提供快速、安全和可扩展的全球性基础设施。
5. GitLab Pages：与GitHub Pages类似，可以托管静态网站和单页应用。
6. Surge：专为前端开发人员设计的简单、单一命令的发布工具。

…

<br>
<br>

# 发现更多方案

![saas 矩阵](https://lumapartners.com/wp-content/uploads/2021/10/2y108PyCiJqGjeg9EEMLPxVXu7DhTwmuw0pqzDLsxQiQhBnlm8kC.sq_.png)


**你能想到的需求,  大概率别人已经做了，不管是技术问题还是产品问题，而且比你更加专业** 。如上图(来源LUMAscape)，展示的是市场营销相关的 SaaS 矩阵。

<br>

所以，抬头看看吧，我们有很多选择。**选择比埋头努力更重要**

所以，我们应该多反问一下自己， 我们的核心域是什么？不管是宏观的产品策略上、还是微观的个人成长上面。

问一问自己，这么值不值得这么做？ 我们真的需要吗？投入产出比(ROI)是多少?  

**如果不值得， 那就外包出去，让更专业的人去做**。

<br>

专注于自己的核心域，这样才能将自己的时间和精力集中在最能创造价值、或者我们热爱的地方。无论是个人还是企业，我们都无法在所有领域都做到专业。尝试在所有领域都做到专业，最终可能会导致没有哪一方面做得真正出色。

比如一个技术 Leader 核心任务可能是指导团队实现产品的技术开发和优化，以及提供技术方案，而不是微观的代码编码细节。

<br>

---

<br>

注意，我不是让你不要折腾。**懒惰和折腾绝对是程序员的优点**。

程序员绝对是一个爱折腾的群体，大部分出色的程序员都爱折腾

将 Github 当做图床、 将 Discord 作为交互界面、将 Notion 作为  CMS… 这些脑洞就不是一个正常的产品能想出来的…

再如那些反复折腾、造个不停的轮子：静态网站生成器、个人博客、RPC、前端的状态管理器、视图框架、构建工具、编程语言…

这让我想起《黑客与画家》里面的一些话：黑客真正想做的是设计优美的软件。创造优美事物的方式往往不是从头做起，而是在现有成果的基础上做一些小小的调整，或者将已有的观点用比较新的方式组合起来。

折腾起来吧，黑客！

<br>

编不下去了。就这样吧。你可以通过下面这些链接探索更多的替代方案：

<br>

- [RunaCapital/awesome-oss-alternatives](https://github.com/RunaCapital/awesome-oss-alternatives)
- [GetStream/awesome-saas-services](https://github.com/GetStream/awesome-saas-services)
- [georgezouq/awesome-saas](https://github.com/georgezouq/awesome-saas)
- [Product Hunt – The best new products in tech.](https://www.producthunt.com/)
- [LUMAscapes | LUMA Partners](https://lumapartners.com/lumascapes/)

<br>

本文特别鸣谢 `ChatGPT`！

<br>