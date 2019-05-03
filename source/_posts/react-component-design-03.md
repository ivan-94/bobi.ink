---
title: React组件设计实践总结03 - 样式的管理
date: 2019/4/23
categories: 前端
---

## 认识到 CSS 的局限性

![vjeux-speak](/images/04/vjeux-speak.png)

2014 年[vjeux](https://github.com/vjeux)一个 [speak](https://speakerd.s3.amazonaws.com/presentations/2e15908049bb013230960224c1b4b8bd/css-in-javascript.pdf) 深刻揭示的原生 CSS 的一些局限性, 虽然有些争议性, 但是非常具有启发性. 至从那之后出现了很多 CSS-in-js 解决方案.

### 1️⃣ 全局性

CSS 的选择器是没有隔离性的, 不管是使用命名空间还是 BEM 模式组织, 最终都会污染全局命名空间. 尤其是大型团队合作的项目, 很难确定某个特定的类或者元素是否已经赋过样式, 所以在大部分情况下我们都会绞尽脑汁新奇一个类名, 而不是复用已有的类型.

### 2️⃣ 依赖

由于 CSS 的'全局性', 所以就产生了依赖问题:

一方面很难清晰地声明某个特定组件依赖于某段特定的 CSS 代码, 比如我们需要在组件渲染前就需要先将 CSS 加载完毕. 另一方面, 全局性导致你的样式可能被别的组件依赖(某种程度的细节耦合), 你不能随便修改你的样式, 牵一发而动全身. 如果团队没有制定合适的 CSS 规范(例如 BEM, 不直接标签选择器, 减少选择器等等,), 代码很快就会失控

### 3️⃣ 无用代码的移除

由于'依赖'问题, 很难判断哪些样式属于那个组件, 由于 CSS 的'叠层特性', 无法确定删除样式会带来什么影响.

> 现代浏览器已支持 CSS 无用代码检查. 但对于无组织的 CSS 效果不会太大

### 4️⃣ 压缩

选择器名和类名的压缩可以减少文件的体积, 提高加载的性能. 因为原生 CSS 一般有开发者来指定类型(在 html 或 js 动态指定),所以很难对类名进行控制

> 压缩类名也会减低代码的可读性

### 5️⃣ 常量共享

常规的 CSS 很难做到在样式和 JS 之间共享变量, 例如主题色自定义这种场景. 通常通过内联样式来试下部分这种需求

### 6️⃣ CSS 解析方式的不确定性

CSS 规则的加载顺序是很重要的, 他会影响属性应用的优先级, 如果按需加载 CSS, 则无法确保他们的解析顺序, 进而导致错误的样式应用到元素上. 有些开发者为了解决这个问题, 使用!important 声明属性, 这无疑是进入了另一个坑

解决问题的方向:

1. 实现隔离性: 比如使用随机数类名生成
2. 扁平化 CSS, 减少嵌套, 减少叠层特性的影响: 只使用类名选择器
3. 让 JS 来控制 CSS

## 组件的样式管理

### 1️⃣ 组件的样式应该高度可定制化

组件的样式应该是可以自由定制的, 开发者应该考虑组件的各种使用场景. 所以一个好的组件必须暴露相关的样式定制接口. 至少需要支持为顶层元素配置`className`和`style`属性

```typescript
interface ButtonProps {
  className?: string;
  style?: React.CSSProperties;
}
```

这两个属性应该是每个展示型组件应该暴露的 props, 其他嵌套元素也要考虑支持配置样式, 例如 footerClassName, footerStyle.

### 2️⃣ 避免使用内联 CSS

1. style props 添加的属性不能自动增加厂商前缀, 这可能会导致兼容性问题. 如果添加厂商前缀又会让代码变得啰嗦.
2. 内联 CSS 不支持复杂的样式配置, 例如伪元素, 伪类, 动画定义, 媒体查询和媒体回退(对象不允许同名属性, 例如`display: -webkit-flex; display: flex;`)
3. 内联样式通过 object 传入组件, 内联的 object 每次渲染会重新生成, 会导致组件重新渲染. 当然通过某些工具可以将静态的 object 提取出去
4. 不方便调试和阅读
   ....

所以 内联 CSS 适合用于动态且比较简单的样式属性

> 社区上有许多 CSS-in-js 方案是基于内联 CSS 的, 例如 Radium, 它使用 JS 添加事件处理器来模拟伪类, 另外也媒体查询和动画. 不过不是所有东西都可以通过 JS 模拟, 比如伪元素. 所以这类解决方案用得比较少

### 使用 CSS-in-js

最舒服 CSS,

决策树, CSS-in-js 解决方案对比

- styled-components
  - 命名, 语义
  - 缺点: 外部覆盖样式
- 开发体验: macro
- 扩展
- 下级样式配置
- 样式复用
- 主题机制

### 通用的组件库不应该耦合 CSS-in-js/CSS-module 的方案

### 使用原生 CSS

为什么不使用 Sass, less. 新的语法, 很难控制

CSS-in-js 和 inline 不适用于高性能场景, 多余的嵌套

方法论

---

## 扩展

- [Styling and CSS](https://reactjs.org/docs/faq-styling.html)
- [精读《请停止 css-in-js 的行为》](https://zhuanlan.zhihu.com/p/26878157)
- [MicheleBertoli/css-in-js](https://github.com/MicheleBertoli/css-in-js)
- [What to use for React styling?](https://www.javascriptstuff.com/how-to-style-react/)
