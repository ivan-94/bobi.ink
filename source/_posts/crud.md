---
title: '前端如何破解 CRUD 的循环'
date: 2023/6/16
categories: 前端
---

![Untitled](/images/crud/Untitled.jpeg)

据说，西西弗斯是一个非常聪明的国王，但他也非常自负和狂妄。他甚至敢欺骗神灵，并把死者带回人间。为此，他被宙斯（Zeus）惩罚，被迫每天推着一块巨石上山，但在接近山顶时，巨石总是会滚落下来，他不得不重新开始推石头，永远困在这个循环中…

很多开发工作也如此单调而乏味，比如今天要讲的中后台开发的场景。中后台业务基本上就是一些数据的增删改查、图表，技术含量不高，比较容易范式化。

前端如何破除 CRUD 的单调循环呢？

<br>
<br>
<br>

## 低代码

过去几年前端的低代码很火，这些`低代码平台`通常支持创建`数据模型`后，一键生成对应的增删改查页面：

<br>

![Untitled](/images/crud/Untitled.png)

<br>

<aside>
💡 本文提及的低代码是`狭义`的`低代码`，你可以认为就是`可视化搭建平台`。

</aside>

<br>

低代码在过去几年就是 「雷声大，雨点小」，跟现在的 AI 颇为相似。


不管是大厂还是小厂都在搞低代码，包括笔者也参与过几个低代码项目，但是小厂支撑不起来这样的资源投入，最后都胎死腹中。我相信很多读者也经历过这种情况。
大部分公司只是尾随市场营销噱头，盲目跟风，压根就没有做这种低代码平台资源准备和沉淀。

作为前端，能参与到低代码项目的开发是一件非常兴奋的事情，毕竟是少数前端能主导的项目，架构、组件设计、编辑器的实现可玩性很高，可以跟同行吹很久。

作为用户(开发者)呢？可能会[排斥和质疑](https://www.zhihu.com/question/561025857)，不管怎么说，它并没有发挥市场所期望的价值。

<br>

最主要的原因是：**它解决不了复杂的问题**。


<br>

低代码直观、门槛低， 前期开发确实很爽，可视化数据建模、拖拉拽生成页面、流程编排，很快就可以把一些简单的业务开发出来。

然而软件编码本身占用研发流程的比例，据 `ChatGPT` 估算大约只有 20% ~ 30%。而且业务持续变化，代码也需要持续迭代。试想一下如何在这些低代码平台上进行重构和检索？

<br>
<br>

总的来说，有一些缺点：

- **复杂的业务逻辑用低代码可能会更加复杂。**低代码应该是特定领域问题的简化和抽象，如果只是单纯将原有的编码工作转换为 GUI 的模式，并没有多大意义。

	例如流程编排，若要用它从零搭建一个复杂的流程，如果照搬`技术语言`去表达它，那有可能是个地狱：

	![Untitled](/images/crud/Untitled%201.png)

	理想的**流程编排的节点应该是抽象程度更高的、内聚的`业务节点`，来表达`业务流程`的流转。然而**这些节点的设计和开发其实是一件非常有挑战性的事情。

- **软件工程是持续演进的，在可维护性方面，目前市面上的低代码平台并不能提供可靠的辅助和验证。**因此企业很难将核心的稳态业务交给这些平台。
- 还有很多… 平台锁定，缺乏标准，性能问题、复用、扩展性、安全问题、黑盒，可迁移性，研发成本高，可预测性/可调试性差，高可用，版本管理，不能自动化…

<br>
<br>

当然，低代码有低代码的适用场景，比如解决特定领域问题(营销活动页面，海报，数据大屏，表单引擎、商城装修、主页)，POC 验证。**即一些临时的/非核心的敏态业务**。


<aside>
💡 目前有些低代码平台也有「出码能力」，让二开有了一定的可行性。

</aside>

<aside>
💡 AI 增强后的低代码可能会更加强大。但笔者依旧保持观望的态度，毕竟准确地描述软件需求，本身就是就是软件研发的难题之一，不然我们也不需要 DDD中的各种方法论，开各种拉通会，或许也不需要需求分析师，产品…

非专业用户直接描述需求来产出软件，大多是不切实际的臆想
</aside>

<br>
<br>
<br>

## 中间形态

有没有介于可视化低代码平台和专业代码之间的中间形态？既能保持像低代码平台易用性，同时维持代码的灵活性和可维护性。

我想那就是 DSL(`domain-specific language`) 吧? **DSL 背后体现的是对特定领域问题的抽象，其形式和语法倒是次要的。**

<aside>
💡 DSL 的形式有很多，可以创建一门新的微语言(比如 SQL, GraphQL)；可以是一个 JSON 或者 YAML 形式；也可以基于一门现有的`元语言`(比如 Ruby、Groovy，Rust…)来创建，这些元语言，提供的元编程能力，可以简洁优雅地表达领域问题，同时能够复用`元语言` 本身的语言能力和基础设施。

</aside>

**严格上可视化低代码平台也是一种‘可视化’ 的 DSL，笔者认为它的局限性更多还是来源‘可视化’，相对的，它优点也大多来源’可视化‘**。

> 这又牵扯到了持续了半个多世纪的： GUI vs CLI（程序化/文本化） 之争。这个在《UNIX 编程艺术》中有深入的探讨。命令行和命令语言比起可视化接口来说，更具表达力，尤其是针对复杂的任务。另外命令行接口具有高度脚本化的能力。缺点就是需要费劲地记忆，易用性差，透明度低。当问题规模变大、程序的行为日趋单一、过程化和重复时， CLI 也常能发挥作用。
> <br>
> 如果按照`友好度`和问题域的`复杂度/规模`两个维度来划分，可以拉出以下曲线：
> <br>
> ![Untitled](/images/crud/Untitled%202.png)
>
> 中间会出现一个交叉点，在这个交叉点之后，命令行的简要行和表达力变得要比避免记忆负担更有价值。
>
> 《反 Mac 接口》一书中也进行了总结：可视化接口在处理小数量物体简单行为的情况下，工作的很好，但是当行为或物体的数量增加是，直接操作很快就编程机械重复的苦差…

**也就是说，DSL 的形式会约束 DSL 本身的表达能力。**

<br>

正如前文说的，如果‘低代码’仅仅是将原本的编码工作转换为 GUI 形式，其实并没有多大意义，因为没有抽象。

反例：

![JSON GUI vs  JSON](/images/crud/Untitled%203.png)

JSON GUI vs JSON

<br>
<br>

正例： VSCode 案例

![Untitled](/images/crud/Untitled%204.png)

![Untitled](/images/crud/Untitled%205.png)

充分利用 GUI 的优势，提供更好的目录组织、文本提示、数据录入的约束和校验。

<br>
<br>

我们可能会说 GUI 形式用户体验更好，门槛低更低，不用关心底层的细节。**其实并不一定是 GUI 带来的，而是抽象后的结果。GUI 只不过是一种接口形式**。

<br>

回到正题，为了摆脱管理后台 CRUD 的 「西西弗斯之石」： 我们可以创建一个 DSL，这个 DSL 抽象了管理端的各种场景，将繁琐的实现细节、重复的工作封装起来，暴露简洁而优雅的用户接口(User Interface)。

<aside>
💡 小结。DSL 是可视化低代码与 pro code 之间的中间中间形态，权衡了易用性/灵活性和实现成本。DSL 的形式会直接影响它的表达能力，但比形式更重要的是 DSL 对特定问题域的抽象。

我们不必重新发明一门语言，而是复用元语言的能力和生态，这基本上是零成本。
</aside>

<br>
<br>
<br>
<br>

## 抽象过程

典型的增删改查页面：

![Untitled](/images/crud/Untitled%206.png)

分析过程：

1. 后端增删改查主要由两大组件组成: `表单`和`表格`。
2. 而表单和表格又由更原子的’`字段`’组成。字段的类型决定了存储类型、录入方式、和展示方式
3. 字段有两种形态：`编辑态`和`预览态`。表格列、详情页通常是预览态，而表单和表格筛选则使用编辑态。

<br>

![Untitled](/images/crud/Untitled%207.png)

借鉴低代码平台的`组件库`/`节点库`，我们可以将这些‘字段’ 提取出来， 作为表单和表格的‘原子’单位， 这里我们给它取个名字，就叫`原件`(`Atomic`)吧。

![Untitled](/images/crud/Untitled%208.png)

`原件`将取代组件库里面的`表单组件`，作为我们 `CRUD` 页面的**最小组成单位**。它有且只有职责：

![Untitled](/images/crud/Untitled%209.png)

- 数据类型和校验。原件代表的是一种数据类型，可以是`基础类型`，比如数字、字符串、布尔值、枚举；也可以是基础类型上加了一些约束和交互，比如邮件、手机号码、链接；甚至可能有`业务属性`，比如用户，商品，订单，二维码。
- 数据的预览。
- 数据的录入，严格约束为 `value`/`onChange` 协议。好处是方便进行状态管理，可能保证原件实现的统一性。

<br>
<br>

接着组合原件来实现表单和表格组件，满足 CRUD 场景：

![Untitled](/images/crud/Untitled%2010.png)

理想状态下，我们仅需声明式地指定表格的列和原件类型，其余的技术细节应该隐藏起来。表格伪代码示例：

```bash
# 创建包含 名称、创建时间、状态三列的表格，其中可以搜索名称和创建时间
Table(
  columns(
    column(名称，name, queryable=true)
    column(创建时间, created, data-range, queryable=true)
    column(状态, status, select, options=[{label: 启用，value: 1, {label: 禁用， value: 0}}])
  )
)
```

<br>

表单伪代码示例：

```bash
# 创建包含 名称、状态、地址的表单
Form(
  item(名称，name, required=true)
  item(状态，status, select, options=[{label: 启用，value: 1, {label: 禁用， value: 0}}])
  item(地址, address, address)
)
```

<br>

如上所示，本质上，开发者就应该只关注业务数据本身，而应该忽略掉前端技术实现的噪音(比如状态管理、展示风格、分页、异常处理等等)。

<br>
<br>

表格和表单为了适应不同的需求，还会衍生出不同的展现形式：

![Untitled](/images/crud/Untitled%2011.png)

`原件` + `核心的表单/表格能力` + `场景/展示形式`，一套「组合拳」下来，基本就可以满足常见的后台 CRUD 需求了。


<br>
<br>
<br>

## 约定大于配置

前端的在研发流程中相对下游，如果上游的产品定义，UI 设计，后端协议没有保持一致性，就会苦于应付各种混乱的差异，复用性将无从谈起。

为了最小化样板代码和沟通成本，实现开箱即用的效果。我们最好拉通上下游，将相关的规范确定下来，前端开发者应该扮演好串联的角色。

<br>

这些规范包含但不限于：

- 页面的布局
- UI 风格
- 提示语
- 验证规则
- 数据的存储格式
- 通用的接口(比如文件上传，导入导出)
- …

![Untitled](/images/crud/Untitled%2012.png)

组件库可以内置这些约定，或者提供全局的配置方式。这些规范固化后，我们就享受开箱即用的快感了。

<br>
<br>
<br>

## 实现示例

基于上述思想，我们开发了一套[组件库](https://wakeadmin.wakedata.com/components-doc/)(基于 Vue 和 element-ui)，配合一套简洁的 DSL，来快速开发 CRUD 页面。

<br>

<aside>
💡 ***这套组件库耦合了我们自己的约定***。因此可能不适用于外部通用的场景。本文的意义更多是想启发读者，去构建适合自己的一套解决方案。

</aside>

**列表页定义：**

![Untitled](/images/crud/Untitled%2013.png)

```tsx
import { defineFatTable } from '@wakeadmin/components'

/**
 * 表格项类型
 */
export interface Item {
  id: number
  name: string
  createDate: number
}

export const MyTable = defineFatTable<Item>(({ column }) => {
  // 可以在这里放置 Vue hooks
  return () => ({
    async request(params) {
      /* 数据获取，自动处理异常和加载状态 */
    },
    // 删除操作
    async remove(list, ids) {
      /*列删除*/
    },
    // 表格列
    columns: [
      // queryable 标记为查询字段
      column({ prop: 'name', label: '名称', queryable: true }),
      column({ prop: 'createDate', valueType: 'date-range', label: '创建时间', queryable: true }),
      column({
        type: 'actions',
        label: '操作',
        actions: [{ name: '编辑' }, { name: '删除', onClick: (table, row) => table.remove(row) }],
      }),
    ],
  })
})
```

语法类似于 Vue defineComponent，传入一个’setup’, 。这个 setup 中可以放置一些逻辑和状态或者 Vue hooks，就和 Vue defineComponent 定义一样灵活。

返回关于表格结构的”声明”。最优的情况下，开发者只需要定义表格结构和后端接口，其余的交由组件库处理。

当然复杂的定制场景也能满足，这里可以使用 JSX，监听事件，传递组件支持的任意 props 和 slots。

<br>
<br>

**表单页示例:**

![Untitled](/images/crud/Untitled%2014.png)

```tsx
import { defineFatForm } from '@wakeadmin/components'
import { ElMessageBox } from 'element-plus'

export default defineFatForm<{
  // 🔴 这里的泛型变量可以定义表单数据结构
  name: string
  nickName: string
}>(({ item, form, consumer, group }) => {
  // 🔴 这里可以放置 Vue Hooks

  // 返回表单定义
  return () => ({
    // FatForm props 定义
    initialValue: {
      name: 'ivan',
      nickName: '狗蛋',
    },

    submit: async (values) => {
      await ElMessageBox.confirm('确认保存')
      console.log('保存成功', values)
    },

    // 🔴 子节点
    children: [
      item({ prop: 'name', label: '账号名' }),
      item({
        prop: 'nickName',
        label: '昵称',
      }),
    ],
  })
})
```

<aside>
💡 和 tailwind 配合食用更香。我们假设整体的页面是符合UI规范的，细微的调整使用 tw 会很方便

</aside>

<br>
<br>

**全局配置：**

```tsx
import { provideFatConfigurable } from '@wakeadmin/components'
import { Message } from 'element-ui'

export function injectFatConfigurations() {
  provideFatConfigurable({
    // ...
    // 统一处理 images 原件上传
    aImagesProps: {
      action: '/upload',
    },
    // 统一 date-range 原件属性
    aDateRangeProps: {
      rangeSeparator: '至',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      valueFormat: 'yyyy-MM-dd',
      shortcuts: [
        {
          text: '最近一周',
          onClick(picker: any) {
            picker.$emit('pick', getTime(7))
          },
        },
        {
          text: '最近一个月',
          onClick(picker: any) {
            picker.$emit('pick', getTime(30))
          },
        },
        {
          text: '最近三个月',
          onClick(picker: any) {
            picker.$emit('pick', getTime(90))
          },
        },
      ],
    },
  })
}
```

<br>
<br>

更多示例和深入讲解见[这里](https://wakeadmin.wakedata.com/components-doc/)。

<br>
<br>
<br>

## 更多实现

前端社区有很多类似的产品，比如：

- [XRender](https://xrender.fun/)。中后台「表单/表格/图表」开箱即用解决方案
- [Antd ProComponents](https://procomponents.ant.design/docs/intro)。ProComponents 是基于 Ant Design 而开发的模板组件，提供了更高级别的抽象支持，开箱即用。可以显著的提升制作 CRUD 页面的效率，更加专注于页面
- [百度 Amis](https://github.com/baidu/amis) 。 用 JSON 作为 DSL，来描述界面

读者不妨多参考参考。

<br>
<br>
<br>

## 总结

简单来说，我们就是从提供「**毛坯房**」升级到了「**精装房**」，精装房的设计基于我们对市场需求的充分调研和预判。目的是对于 80% 的用户场景，可以实现拎包入住，当然也允许用户在约束的范围内改装。

本文主要阐述的观点：

- 低代码平台的高效和易用大多来源于抽象，而不一定是 GUI，GUI ≠ 低代码。
- 摆脱「西西弗斯之石」 考验的是开发者的抽象能力，识别代码中固化/重复的逻辑。将模式提取出来，同时封装掉底层的实现细节。最终的目的是让开发者将注意力关注到业务本身，而不是技术实现细节。
- 用声明式、精简、高度抽象 DSL 描述业务 。DSL 的形式会约束他的表达能力，我们并不一定要创建一门新的语言，最简单的是复用元语言的生态和能力。
- 约定大于配置。设计风格、交互流程、数据存储等保持一致性，才能保证抽象收益的最大化。因此规范很重要。这需要我们和设计、产品、后端深入沟通，达成一致。
- 沉淀原件。低代码平台的效率取决于平台提供的组件能力、数量和粒度。比如前端的组件库，亦或者流程引擎的节点，都属于原件的范畴。
- 要求不要太高，这并不是一个万精油方案，我们期望能满足 80% 常见的场景，这已经是一个很好的成绩。至于那 20% 的个性需求，还是从毛坯房搞起吧。

<br>
<br>
<br>

## 扩展阅读

- [精读《低代码逻辑编排》](https://github.com/ascoders/weekly/issues/319)
- UNIX 编程艺术
