---
title: "if 我是前端团队 Leader，怎么做好概要设计"
date: 2019/9/6
categories: 前端
---

[if 我是前端团队 Leader，怎么制定前端协作规范?](https://juejin.im/post/5d3a7134f265da1b5d57f1ed)在掘金目前已经突破740个👍了, 谢谢大家的支持，这篇文章是前者延展。继续介绍我在前端团队管理方面的思考和探索。

软件工程中有一个软件设计阶段，通俗的讲就是在开工之前将能确定的确定下来，把该考虑的考虑了。这相比在开发阶段发现问题，解决的成本要低很多。

如果按照教科书上的定义，软件设计就是**是一个将需求转变为软件陈述（表达）的过程**。一般有**概要设计(或者初步设计， Preliminary design)**和**详细设计(Detail design)**. 概要设计将需求转换成数据和软件框架，而详细设计将框架逐步求精细化为具体的数据结构和软件的算法表达。本文讲述的是前端项目的概要设计。

相比后端开发, 对于前端，’软件设计‘很少被提及，也有可能是一直以来前端的工作都比较'简单'，所以比较粗放。一般给了原型和接口文档就直接开干了。但是随着前端开发者的工作越来越复杂，或者项目/团队的规模变大，我们越来越需要在编码之前进行合理的设计。

作为**前端入门Leader**, 最近面临了一些问题: 比如项目分工问题、项目维护缺乏文档问题, 让我开始重视软件设计阶段. 就目前看来，做好前端**概要设计**，至少有以下好处:

- **事前**. 设计文档是开发的蓝图，后续开发可以按照这个文档逐步展开。良好的设计可以保证开发沿着正常轨道迈进。
  - 我们在设计阶段会进一步梳理业务流程，加深对业务流程的理解，甚至可以找出业务流程中的不合理的东西。
  - 模块拆分。这个阶段我们会识别各个模块之间边界和重叠，将重叠的(共享的)部分抽离出来。另外模块是基本的开发工作单元，也是我们团队分工和时间评估的基础。
  - 考察关键的技术点。提出多种备选方案，充分考虑各种风险, 选择符合实际需求的方案
- **事后**. 设计文档对事后的软件维护、功能新增，有很大的帮助

<br>

下面开始介绍，前端在**软件设计阶段**应该考虑东西，或者说前端的`概要设计文档`里面应该包含哪些东西. 当然这些只是一些初步的想法，随着后面深入实践后，本文会持续更新迭代.

<br>

**文章大纲**

<!-- TOC -->

- [关键业务流程的梳理](#关键业务流程的梳理)
- [关键技术点](#关键技术点)
- [模块设计](#模块设计)
  - [入口层](#入口层)
  - [页面层](#页面层)
  - [组件层](#组件层)
  - [分工](#分工)
- [状态设计](#状态设计)
- [接口设计](#接口设计)
- [版本规划](#版本规划)
- [验证](#验证)
- [项目要求和目标](#项目要求和目标)
- [文档索引](#文档索引)
- [构建说明](#构建说明)
- [持续迭代](#持续迭代)
- [模板](#模板)
- [总结](#总结)
- [参考资料](#参考资料)

<!-- /TOC -->

<br>

> 这方面我的经验实践比较少, 也没有在大厂待过，所以本文只是我的一些思考和尝试, 可能不太现实。如果你或你的团队有这方面的更好的实践，欢迎分享给我。感激🙏

<br>
<br>

## 关键业务流程的梳理

开发任何一个产品之前，首先要确保的是对业务流程的理解，否则就会出现南辕北辙的情况。

在现实项目中发生过多次这类情况：_项目到达测试阶段，测试人员才发现应用的业务实现和产品定义不一样，或者业务流程不合理_。
这其实是一种很低级的失误，改动的成本可能很高，甚至会让你的所有工作白干。

管理比较成熟的公司会有很多手段来规避这种失误。

比如定义明确需求文档，这方面可以模仿一些标准/规范(Spec)的写作方法，严格定义一些关键字，避免模棱两可的描述;

另外可以通过各种宣贯会议，将相关人员聚集在一起，统一导入需求。在这些会议中可以进行头脑风暴，优化或细化需求的定义、发现缺陷和风险，分析可行性等等。通过不断沟通，成员之间可以分享交叉知识，确保对业务一致理解.

![](/images/fe-design/doc.png)

<br>

因此，我觉得**前端在设计阶段也应该像后端一样，用流程图或者时序图这类工具，将关键业务流程描述清楚. 尤其是涉及到前后端, 跨系统/跨页面/跨终端之间的业务交互的场景**.

举个例子，比如我们在做一个’扫码登录‘功能。我们可以将跨终端的业务梳理出来：

![](/images/fe-design/scan-login.png)

<br>

从上面的业务梳理中我们可以识别出业务对象的基本行为和状态. 例如二维码的状态转换图:

![](/images/fe-design/scan-login-state.png)

<br>

当然, 简单的增删查改花篇幅去阐述没有意义。**我们只关注应用关键的业务流程**.

总之，业务流程的梳理，可以加深我们对业务的理解，是后续设计步骤和开发的基础.

<br>
<br>

## 关键技术点

描述应用采用的或者涉及到关键技术/算法, 也可以认为是**技术选型**.

比如典型的有视频直播应用，涉及到的各种直播方案:

- RTMP 协议
- RTP协议
- HLS 协议
- flv.js
- WebRTC协议
- 等等

**在开启一个项目之前, 我们需要对项目涉及到的关键技术点进行调研和测试，最好多找几个替代方案，横向地比较它们的优势和劣势**。选择符合项目或团队自己情况的方案. 如果时间充足, 可以写一些Demo，实地踩一下坑.

如果有多个备选方案，最后要甄选出推荐方案，并说明选择的原因和考虑。

**提前做好技术的调研和选型，确定可行性，不至于开发处于被动的境地**.

关于如何进行技术选型，我在[if 我是前端团队 Leader，怎么制定前端协作规范?](https://juejin.im/post/5d3a7134f265da1b5d57f1ed#heading-10)进行了简单的讨论，可以参考一下.

<br>
<br>

## 模块设计

现代前端一般都使用**组件化思维**进行开发，**这时候我们的应用其实就是一颗由不同粒度的组件复合起来的组件树**，这颗组件树最终会体现到项目的目录结构上。 **在设计阶段我们可以根据产品原型或UI设计稿，识别出各种页面和组件**。

![](/images/fe-design/module-tree-map.png)

正常的应用，我们可以分三个层级进行拆分:

![](/images/fe-design/module.png)

### 入口层

稍微复杂一点的应用可能有多个入口，这些入口呈现的页面可能差异很大. 下面是一个常见的划分方法:

- 按子系统划分: 比如前台和后台。
- 按角色划分：比如管理员、普通用户
- 按入口划分：比如移动端、桌面端等等

<br>

### 页面层

下一步就是识别各种页面，这些页面即对应到我们的前端路由配置规则. 以下面简单的应用为例:

![](/images/fe-design/sample-pages.png)

关于模块的划分，我建议使用**思维导图**进行组织。**模块划分这个环节，你可以召集团队的其他成员开个会议，一起进行头脑风暴。大家参照着产品原型，识别出各种模块或组件的边界和交集, 讨论怎么设计页面的数据流、组件的接口等等**, 这样可以利用集体智慧，让模块拆分更加合理，另外可以促进团队成员提前熟悉项目的结构。

所以说**软件设计不是架构师或设计人员一个人的事，应该鼓励大家一起参与，设计文档是整个软件团队的产出, 是团队的知识沉淀**。

上面的应用通过页面层划分后，结果大概如下：

![](/images/fe-design/pages.png)

在这个阶段我们会确定以下内容:

- **页面以及路由设计, 确定页面之间的层级关系**
- **页面之间交互流程、数据传递**

**关于路由设计，可以遵循一些规范，笔者比较推荐[Restful URL规范](http://www.ruanyifeng.com/blog/2018/10/restful-api-best-practices.html)**, 这篇[文章](https://novoland.github.io/设计/2015/08/17/Restful%20API%20的设计规范.html)写得也不错.

路由之间的数据传递一般有以下几种方式:

- 少量数据：可以通过路由变量(例如`/posts/:id`)或者查询字符串形式传递. 还有如果你使用的是[基于History API的前端路由模式](https://react-router.docschina.org/web/api/BrowserRouter)，可以使用History的[state](https://developer.mozilla.org/zh-CN/docs/Web/API/History_API)对象来存储一些状态(最大640k)
- 大量数据：可以通过全局变量，或者状态管理器的机制进行存储, 不管这种存储在内存的方式，一旦页面刷新就会丢失。所以也可以考虑存储在本地缓存中, 例如LocalStorage

<br>

### 组件层

Ok，再往下拆分，不过要量力而行。对于一个非常复杂的项目来说，可能有成千上百个组件，而且这些组件在未来可能会不断变化，在设计阶段考虑这些拆分可能需要花费很多时间，而且收益并不明显。

那么需要怎么把握粒度呢？其实组件层设计阶段的主要目的是**找出重复的、或者结构类似的组件，将它们抽取出来统一的设计，在多个页面进行复用. 并不是把所有的组件都列举出来**。

我在[React组件设计实践总结02 - 组件的组织](https://juejin.im/post/5cd8fb916fb9a03218556fc1)这篇文章中，专门介绍React组件如何进行组织和拆分。其中提出了以下集中模式:

- 容器组件和展示组件分离。或者说分离视图和逻辑, 业务组件和傻瓜组件. 纯逻辑的东西放在Hooks中，使用起来会更加方便
- 纯组件和非纯组件. 可以认为纯组件完全依赖外部输入
- 有状态组件和无状态组件
- 布局组件和内容组件
- 统一设计同一类型组件的接口. 比如表单组件应该保持接口统一

![](/images/fe-design/sample-pages2.png)

还是上面的示例应用，申报页面有非常多的表单项，而且经常变动，另外你会发现它和预览页面的结构是差不多的，而且后面可能会有桌面端页面。

经过讨论，我们决定采用配置文件的方式来动态渲染表单页和预览页。实现一套配置控制移动端申请表单、桌面端申请表单、移动端预览、桌面端预览页面。

类似上面这种应用场景，前期的组件层设计就很有必要了。

<br>

![](/images/fe-design/components.png)

<br>

### 分工

将模块拆分清楚后，我们就可以针对这些模块进行合理的分工和时间评估。基本上有三个步骤：

![](/images/fe-design/module-plan.png)

通过上面的步骤，我们识别出来了各种模块，接着我们要确定下来这些模块之间的依赖关系，这些依赖关系影响它们是否要作为一个整体进行实现。最后再根据业务的优先级或依赖关系决定这些**模块簇**的实现优先级。

Ok, 现在可以将这些模块簇按照优先级排序, 加上评估时间(人天)，整理成一个清单。 如果你们使用看板来进行项目管理, 可以将它们作为一个任务单元，贴到看板中.

```shell
1. Foo 功能
  - c 2d
  - d 1d
  - f 3d
2. Bar 功能
  - e 1d
  - h 0.5d
3. Baz 功能
  - g 1d
4. Fu 功能
  - a 4d
  - b 1d

总计人天: 13.5
```

<br>

任务的分工有很多策略, 例如：

- 横向划分
  - 公共组件 vs 业务组件(对接业务)
  - 自上而下 vs 自下而上(指的是组件树)
- 垂直划分: 按照独立的垂直模块分工

![](/images/fe-design/module-tree.png)

<br>
<br>

## 状态设计

![](/images/fe-design/redux.png)

前端组件化伴随而来的是各种`数据驱动`或`数据流驱动`的开发模式。这种模式下，前端应用可以总结为这样一个等式:

```text
view = f(state)
```

也就是说**视图是数据或者数据流的映射**. 可见状态管理对现代前端开发的重要性。

状态的设计和后端对象模型设计差不多。**你需要根据业务和页面渲染要求抽象出各种对象模型，以及缕清对象模型之间的关系**。这个阶段可能需要和后端紧密结合，才能确定出合理的对象结构。

当然状态的设计还跟你选择的状态管理方案也有关系, 不同状态管理器方案体现的思想差异较大：_如果你选择Redux，那么应用的状态就是一颗对象树；如果你选择Mobx，应用的状态可能由多个模型对象组成，更接近传统的OOP模式_。

如果采用OOP设计方法，可以绘制`UML`图，可视化表现对象的结构和关系:

![](/images/fe-design/uml-sample.png)
<i>(图片来源: https://zongren.me/2016/12/30/uml-diagram-sample/)</i>

<br>

我在[React组件设计实践总结05 - 状态管理](https://juejin.im/post/5ce3ee436fb9a07f070e0220)这篇文章花了很多篇幅来介绍各种状态管理器的思想和开发模式, 所以这里就不展开了:

**Redux 状态设计**:

![](/images/fe-design/redux-design.png)

**Mobx 状态设计**:

![](/images/fe-design/mobx-design.png)

<br>
<br>

## 接口设计

如果前端团队在接口设计方面有主导权, 或者使用[BFF架构(服务于前端的后端)](https://www.phodal.com/blog/architecture-101-bff-for-legacy-system-migrate/)，在设计阶段我们需要对各类接口进行设计。

不过一般主导权都掌握在后端手里，因为前端对业务的关心程度较低，后端一般会综合考虑各端的接口需求、数据库存储效率、可维护性等多个方面来设计接口, 这时候前端就是接口的用户，我们有责任来验证后端接口是否符合需求.

我在[if 我是前端团队 Leader，怎么制定前端协作规范?](https://juejin.im/post/5d3a7134f265da1b5d57f1ed#heading-45)已经提及了各种接口规范. 这里不予赘述。

<br>
<br>

## 版本规划

通过上面的步骤，我们基本已经了解我们需要做什么、需要花多久。接下来，

应该制定一个版本计划，对于一个大项目可以拆分为多个**里程碑**, 估计版本发布的时间. 加不加班就看你了，作为Leader要综合考虑各种影响因素，实事求是合理地安排版本发布计划。

这个发布计划可能还需要经过PM和项目经理审核, 作为前端项目，开发计划通常还依赖于后端团队.

![](/images/fe-design/roadmap.png)

<br>

这个版本计划中会包含这些内容:

- 版本号
- 发布时间
- 包含的主要模块

<br>
<br>

## 验证

验证，或者称为’测试指导‘。 除了测试团队提供的测试用例，从开发(白盒)的角度还需要注意哪些东西?

产品或者测试可能只会从业务的层次考虑应用的运行，我们需要从研发的角度，充分考虑各种**异常情况**、**性能瓶颈**、进行**风险评估**. 阐明风险的应对方案等待.

这些情况也可以反馈给测试团队，以完善测试的用例.

<br>

## 项目要求和目标

一些需求是要提前确定下来的，对于前端来说，比较典型的就是浏览器兼容性要求。你可不要等到项目上线后，才跟我提用户要求兼容IE6!

这些项目要求可能会影响我们的开发成本、选型、测试和其他因素的评估。基本上，对于一个前端项目来说，这些要求是要提前问清楚的:

- 浏览器兼容性
- 运行环境. 例如操作系统、小程序等等
- 时间点
- 性能指标要求. 例如首屏指标、数据量指标

<br>
<br>

## 文档索引

前端项目开发可能会关联很多文档，这些文档是分散的，在设计文档中最好把它们聚合起来，方便查阅和引用. 例如:

- 需求文档
- DEMO, UI设计稿
- 测试用例
- 接口文档
- UI设计规范文档
- 前端规范文档
- ...

<br>
<br>

## 构建说明

如果你的项目需要设计构建流程，也可以在设计文档中简单提及。

例如**如何编译和运行**? **如何测试和调试**? **如何部署或发布**？ **代码如何组织**？**开发工作流**、**编码约定**等等

新成员通过这些说明可以快速上手开发.

<br>

## 持续迭代

设计文档不是一次性的，它应该跟随项目不断的迭代，不然就失去了文档的意义。

<br>
<br>

## 模板

最后，规范一些设计文档的格式和内容

```markdown
# XXX 概要设计文档

## 背景

填写项目的背景, 或者开发或重构的目的/出发点.

## 关键业务流程

可以放置关键的业务流程图、状态图、对象图等等. 梳理关键的业务流程

## 关键技术描述

可选, 描述项目中使用到的关键技术、算法、选型结论等等

## 模块拆分

- 入口
- 页面路由
- 组件设计

可以使用思维导图描述

## 状态设计

描述应用涉及的关键领域对象, 比如外形、行为和关系. 如果是OOP方式，可以使用UML描述

## 接口设计

可选，如题

## 项目要求和目标

项目目标、运行环境、兼容性要求、性能指标等等

## 验证

可选, 风险评估、异常情况考虑、特殊测试规则、测试指导等等

## 分工和版本计划

可选, 可以在单独文档或者看板中维护

## 构建说明

可选, 项目组织、构建、测试说明

## 文档索引

相关文档的索引和链接

## 参考资料

文档中索引页的外部参考资料

## CHANGELOG

列出本文档修改的历史纪录。必须指明修改的内容、日期以及修改人

```

很多开发人员都不喜欢写文档，包括我以前也是这样的。我们会找各种借口：’时间紧张，没时间做设计‘、’用来写设计文档的时间，我的开发早就做完了‘。

这些想法显然是不正确的，给我的启示是**我们要根据团队情况而定，不要求设计文档有多么详尽，在时间紧张的时候可以粗略一点。等时间充裕再回顾补充也是可以接受的; 或者如果项目划分为多个周期进行开发，我们也可以在每个周期开始时进行详细的设计**。

<br>

## 总结

文章差不多写完了，看到了知乎[@张明云](https://www.zhihu.com/people/zhang-ming-yun-88/activities)[现代软件开发中，详细设计这一步要如何来做？](https://www.zhihu.com/question/300407894)下面的一个回答:

<br>

![](/images/fe-design/zhihu.png)

<br>

和我上文所介绍基本吻合。一个软件’概要‘设计文档基本就包含这几大块。

本文完。

<br>

## 参考资料

- [如何才能写出好的软件设计文档？](https://www.infoq.cn/article/how-to-write-a-good-software-design-document)
- [软件设计文档编写概述](https://blog.csdn.net/lori2004/article/details/80011806)
- [现代软件开发中，详细设计这一步要如何来做？](https://www.zhihu.com/question/300407894)

<br>

![](/images/sponsor.jpg)