---
title: React组件设计实践总结03 - 样式的管理
date: 2019/5/14
categories: 前端
---

CSS 是前端开发的重要组成部分，但是它并不完美，本文主要探讨 React 样式管理方面的一些解决方案，目的是实现样式的高度可定制化, 让大型项目的样式代码更容易维护.

**系列目录**

- [01 类型检查](/2019/05/10/react-component-design-01/)
- [02 组件的组织](/2019/05/11/react-component-design-02/)
- [03 样式的管理](/2019/05/14/react-component-design-03/)
- [04 组件的思维](/2019/05/15/react-component-design-04/)
- [05 状态管理](/2019/05/20/react-component-design-05/)

<br/>

**目录**

<!-- TOC -->

- [1. 认识 CSS 的局限性](#1-认识-css-的局限性)
  - [1️⃣ 全局性](#1️⃣-全局性)
  - [2️⃣ 依赖](#2️⃣-依赖)
  - [3️⃣ 无用代码的移除](#3️⃣-无用代码的移除)
  - [4️⃣ 压缩](#4️⃣-压缩)
  - [5️⃣ 常量共享](#5️⃣-常量共享)
  - [6️⃣ CSS 解析方式的不确定性](#6️⃣-css-解析方式的不确定性)
- [2. 组件的样式管理](#2-组件的样式管理)
  - [1️⃣ 组件的样式应该高度可定制化](#1️⃣-组件的样式应该高度可定制化)
  - [2️⃣ 避免使用内联 CSS](#2️⃣-避免使用内联-css)
  - [3️⃣ 使用 CSS-in-js](#3️⃣-使用-css-in-js)
    - [0. 基本用法](#0-基本用法)
    - [1. 样式扩展](#1-样式扩展)
    - [2. mixin 机制](#2-mixin-机制)
    - [3. 类 SCSS 的语法](#3-类-scss-的语法)
    - [5. JS 带来的动态性](#5-js-带来的动态性)
    - [6. 绑定组件的`全局样式`](#6-绑定组件的全局样式)
    - [7. Theme 机制及 Theme 对象的设计](#7-theme-机制及-theme-对象的设计)
    - [8. 提升开发体验](#8-提升开发体验)
    - [9. 了解 styled-components 的局限性](#9-了解-styled-components-的局限性)
    - [10. 一些开发规范](#10-一些开发规范)
    - [11. 其他 CSS-in-js 方案](#11-其他-css-in-js-方案)
  - [4️⃣ 通用的组件库不应该耦合 CSS-in-js/CSS-module 的方案](#4️⃣-通用的组件库不应该耦合-css-in-jscss-module-的方案)
  - [5️⃣ 优先使用原生 CSS](#5️⃣-优先使用原生-css)
  - [6️⃣ 选择合适自己团队的技术栈](#6️⃣-选择合适自己团队的技术栈)
  - [7️⃣ 使用 svgr 转换 svg 图标](#7️⃣-使用-svgr-转换-svg-图标)
  - [8️⃣ 结合使用 rem 和 em 等相对单位, 创建更有弹性的组件](#8️⃣-结合使用-rem-和-em-等相对单位-创建更有弹性的组件)
- [3. 规范](#3-规范)
  - [1️⃣ 促进建立统一的 UI 设计规范](#1️⃣-促进建立统一的-ui-设计规范)
  - [2️⃣ CSS 编写规范](#2️⃣-css-编写规范)
  - [3️⃣ 使用stylelint进行样式规范检查](#3️⃣-使用stylelint进行样式规范检查)
- [扩展](#扩展)

<!-- /TOC -->

<br/>

---

<br/>

## 1. 认识 CSS 的局限性

<center>
 <img src="/images/04/vjeux-speak.png" alt="vjeux-speak" width="500" />
</center>

2014 年[vjeux](https://github.com/vjeux)一个 [speak](https://speakerd.s3.amazonaws.com/presentations/2e15908049bb013230960224c1b4b8bd/css-in-javascript.pdf) 深刻揭示的原生 CSS 的一些局限性. 虽然它有些争议, 对于开发者来说更多的是启发. 至从那之后出现了很多 `CSS-in-js` 解决方案.

### 1️⃣ 全局性

CSS 的选择器是没有隔离性的, 不管是使用命名空间还是 BEM 模式组织, 最终都会污染全局命名空间. 尤其是大型团队合作的项目, 很难确定某个特定的类或者元素是否已经赋过样式. 所以在大部分情况下我们都会绞尽脑汁新创建一个类名, 而不是复用已有的类型.

解决的方向: 生成唯一的类名; shadow dom; 内联样式; Vue-scoped 方案

<br/>

### 2️⃣ 依赖

由于 CSS 的'全局性', 所以就产生了依赖问题:

一方面我们需要在组件渲染前就需要先将 CSS 加载完毕, 但是**很难清晰地定义某个特定组件依赖于某段特定的 CSS 代码**; 另一方面, **全局性导致你的样式可能被别的组件依赖(某种程度的细节耦合)**, 你不能随便修改你的样式, 以免破坏其他页面或组件的样式. 如果团队没有制定合适的 CSS 规范(例如 BEM, 不直接使用标签选择器, 减少选择器嵌套等等), 代码很快就会失控

解决的方向: 之前文章提到组件是一个内聚单元, 样式应该是和组件绑定的. 最基本的解决办法是使用类似 BEM 命名规范来避免组件之间的命名冲突, 再通过创建优于复用, 组合优于继承的原则, 来避免组件间样式耦合;

<br/>

### 3️⃣ 无用代码的移除

由于上述'依赖'问题, 组件样式之间并没有明确的边界, 很难判断哪些样式属于那个组件; 在加上 CSS 的'叠层特性', 更无法确定删除样式会带来什么影响.

> 现代浏览器已支持 CSS 无用代码检查. 但对于无组织的 CSS 效果不会太大

解决的方向: 如果样式的依赖比较明确，则可以安全地移除无用代码

<br/>

### 4️⃣ 压缩

选择器和类名的压缩可以减少文件的体积, 提高加载的性能. 因为原生 CSS 一般有开发者由配置类名(在 html 或 js 动态指定), 所以工具很难对类名进行控制.

> 压缩类名也会降低代码的可读性, 变得难以调试.

解决的方向: 由工具来转换或创建类名

<br/>

### 5️⃣ 常量共享

常规的 CSS 很难做到在样式和 JS 之间共享变量, 例如自定义主题色, 通常通过内联样式来部分实现这种需求

解决的方向: CSS-in-js

<br/>

### 6️⃣ CSS 解析方式的不确定性

CSS 规则的加载顺序是很重要的, 他会影响属性应用的优先级, 如果按需加载 CSS, 则无法确保他们的解析顺序, 进而导致错误的样式应用到元素上. 有些开发者为了解决这个问题, 使用!important 声明属性, 这无疑是进入了另一个坑.

解决方向：避免使用全局样式，组件样式隔离；样式加载和组件生命周期绑定

<br/>

---

<br/>

## 2. 组件的样式管理

### 1️⃣ 组件的样式应该高度可定制化

组件的样式应该是可以自由定制的, 开发者应该考虑组件的各种使用场景. 所以一个好的组件必须暴露相关的样式定制接口. 至少需要支持为顶层元素配置`className`和`style`属性:

```typescript
interface ButtonProps {
  className?: string;
  style?: React.CSSProperties;
}
```

这两个属性应该是每个展示型组件应该暴露的 props, 其他嵌套元素也要考虑支持配置样式, 例如 footerClassName, footerStyle.

<br/>

---

<br/>

### 2️⃣ 避免使用内联 CSS

1. style props 添加的属性不能自动增加厂商前缀, 这可能会导致兼容性问题. 如果添加厂商前缀又会让代码变得啰嗦.
2. 内联 CSS 不支持复杂的样式配置, 例如伪元素, 伪类, 动画定义, 媒体查询和媒体回退(对象不允许同名属性, 例如`display: -webkit-flex; display: flex;`)
3. 内联样式通过 object 传入组件, 内联的 object 每次渲染会重新生成, 会导致组件重新渲染. 当然通过某些工具可以将静态的 object 提取出去
4. 不方便调试和阅读
   ...

所以 内联 CSS 适合用于设置动态且比较简单的样式属性

> 社区上有许多 CSS-in-js 方案是基于内联 CSS 的, 例如 Radium, 它使用 JS 添加事件处理器来模拟伪类, 另外也媒体查询和动画. 不过不是所有东西都可以通过 JS 模拟, 比如伪元素. 所以这类解决方案用得比较少

<br/>

---

<br/>

### 3️⃣ 使用 CSS-in-js

社区有很多 CSS 解决方案, 有个[项目(MicheleBertoli/css-in-js)](https://github.com/MicheleBertoli/css-in-js)专门罗列和对比了这些方案. 读者也可以读这篇文章([What to use for React styling?](https://www.javascriptstuff.com/how-to-style-react/))学习对 CSS 相关技术进行选型决策

社区上最流行的, 也是笔者觉得使用起来最舒服的是[`styled-components`](https://www.styled-components.com), styled-components 有下列特性:

- 自动生成类名, 解决 CSS 的全局性和样式冲突. 通过组件名来标志样式, 自动生成唯一的类名, 开发者不需要为元素定义类名.
- 绑定组件. 隔离了 CSS 的依赖问题, 让组件 JSX 更加简洁, 反过来开发者需要考虑更多组件的语义
- 天生支持'关键 CSS'. 样式和组件绑定, 可以和组件一起进行代码分割和异步加载
- 自动添加厂商前缀
- 灵活的动态样式. 通过 props 和全局 theme 来动态控制样式
- 提供了一些 CSS 预处理器的语法
- 主题机制
- 支持 react-native. 这个用起来比较爽
- 支持 [stylelint](https://github.com/stylelint/stylelint), 编辑器高亮和智能提示
- 支持服务端渲染
- 符合分离展示组件和行为组件原则

> 推荐这篇文章: [Stop using css-in-javascript for web development](https://medium.com/@gajus/stop-using-css-in-javascript-for-web-development-fa32fb873dcc), styled-components 可以基本覆盖所有 CSS 的使用场景:

<br/>

#### 0. 基本用法

```ts
// 定义组件props
const Title = styled.h1<{ active?: boolean }>`
  color: ${props => (props.active ? 'red' : 'gray')};
`;

// 固定或计算组件props
const Input = styled.input.attrs({
  type: 'text',
  size: props => (props.small ? 5 : undefined),
})``;
```

<br/>

#### 1. 样式扩展

```ts
const Button = styled.button`
  color: palevioletred;
  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border: 2px solid palevioletred;
  border-radius: 3px;
`;

// 覆盖和扩展已有的组件, 包含styled生成的组件还是自定义组件(通过className传入)
const TomatoButton = styled(Button)`
  color: tomato;
  border-color: tomato;
`;
```

<br/>

#### 2. mixin 机制

在 SCSS 中, mixin 是重要的 CSS 复用机制, styled-components 也可以实现:

定义:

```ts
import { css } from 'styled-components';

// utils/styled-mixins.ts
export function truncate(width) {
  return css`
    width: ${width};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
}
```

使用:

```ts
import { truncate } from '~/utils/styled-mixins';

const Box = styled.div`
  // 混入
  ${truncate('250px')}
  background: papayawhip;
`;
```

<br/>

#### 3. 类 SCSS 的语法

```ts
const Example = styled(Component)`
  // 自动厂商前缀
  padding: 2em 1em;
  background: papayawhip;

  // 伪类
  &:hover {
    background: palevioletred;
  }

  // 提供样式优先级技巧
  &&& {
    color: palevioletred;
    font-weight: bold;
  }

  // 覆盖内联css样式
  &[style] {
    font-size: 12px !important;
    color: blue !important;
  }

  // 支持媒体查询
  @media (max-width: 600px) {
    background: tomato;

    // 嵌套规则
    &:hover {
      background: yellow;
    }
  }

  > p {
    /* descendant-selectors work as well, but are more of an escape hatch */
    text-decoration: underline;
  }

  /* Contextual selectors work as well */
  html.test & {
    display: none;
  }
`;
```

**引用其他组件**<br/>

由于 styled-components 的类名是自动生成的, 所以不能直接在选择器中声明他们, 但可以在模板字符串中引用其他组件:

```ts
const Icon = styled.svg`
  flex: none;
  transition: fill 0.25s;
  width: 48px;
  height: 48px;

  // 引用其他组件的类名. 这个组件必须是styled-components生成或者包装的组件
  ${Link}:hover & {
    fill: rebeccapurple;
  }
`;
```

<br/>

#### 5. JS 带来的动态性

媒体查询帮助方法:

```ts
// utils/styled.ts
const sizes = {
  giant: 1170,
  desktop: 992,
  tablet: 768,
  phone: 376,
};

export const media = Object.keys(sizes).reduce((accumulator, label) => {
  const emSize = sizes[label] / 16;
  accumulator[label] = (...args) => css`
    @media (max-width: ${emSize}em) {
      ${css(...args)}
    }
  `;
  return accumulator;
}, {});
```

使用:

```ts
const Container = styled.div`
  color: #333;
  ${media.desktop`padding: 0 20px;`}
  ${media.tablet`padding: 0 10px;`}
  ${media.phone`padding: 0 5px;`}
`;
```

> SCSS 也提供了很多内置工具方法, 比如颜色的处理, 尺寸的计算. styled-components 提供了一个类似的 js 库: [polished](https://github.com/styled-components/polished)来满足这部分需求, 另外还集成了常用的 mixin, 如 clearfix. 通过 babel 插件可以在编译时转换为静态代码, 不需要运行时.

<br/>

#### 6. 绑定组件的`全局样式`

全局样式和组件生命周期绑定, 当组件卸载时也会删除全局样式. 全局样式通常用于覆盖一些第三方组件样式

```ts
const GlobalStyle = createGlobalStyle`
  body {
    color: ${props => (props.whiteColor ? 'white' : 'black')};
  }
`

// Test
<React.Fragment>
  <GlobalStyle whiteColor />
  <Navigation /> {/* example of other top-level stuff */}
</React.Fragment>
```

<br/>

#### 7. Theme 机制及 Theme 对象的设计

styled-components 的 [ThemeProvider](https://www.styled-components.com/docs/advanced#theming) 可以用于取代 SCSS 的变量机制, 只不过它更加灵活, 可以被所有下级组件共享, 并动态变化.

关于 Theme 对象的设计我觉得可以参考传统的 UI 框架, 例如[Foundation](https://github.com/zurb/foundation-sites/tree/develop/scss)或者[Bootstrap](https://github.com/twbs/bootstrap/tree/master/scss), 经过多年的迭代它们代码组织非常好, 非常值得学习. 以 Bootstrap 的项目结构为例:

```shell
.
├── _alert.scss
├── ...                # 定义各种组件的样式
├── _print.scss        # 打印样式适配
├── _root.scss         # 🔴根样式, 即全局样式
├── _transitions.scss  # 过渡效果
├── _type.scss         # 🔴基本排版样式
├── _reboot.scss       # 🔴浏览器重置样式, 类似于normalize.css
├── _functions.scss
├── _mixins.scss
├── _utilities.scss
├── _variables.scss    # 🔴变量配置, 包含全局配置和所有组件配置
├── bootstrap-grid.scss
├── bootstrap-reboot.scss
├── bootstrap.scss
├── mixins             # 各种mixin, 可复用的css代码
├── utilities          # 各种工具方法
└── vendor
    └── _rfs.scss
```

[`_variables.scss`](https://github.com/twbs/bootstrap/blob/master/scss/_variables.scss)包含了以下配置:

- 颜色系统: 调色盘配置
  - 灰阶颜色: 提供白色到黑色之间多个级别的灰阶颜色. 例如
    <img src="/images/04/gray-scale.png" width="300"/>
  - 语义颜色: 根据 UI 上面的语义, 定义各种颜色. 这个也是 CSS 开发的常见模式
    <img src="/images/04/sem-color.png" width="300"/>
- 尺寸系统: 多个级别的间距, 尺寸大小配置
- 配置开关: 全局性的配置开关, 例如是否支持圆角, 阴影
- 链接样式配置: 如颜色, 激活状态, decoration
- 排版: 字体, 字体大小, font-weight, 行高, 边框, 标题等基本排版配置
- 网格系统断点配置

bootstrap 将这些配置项有很高的参考意义. 组件可以认为是 UI 设计师 的产出, 如果你的应用有统一和规范的设计语言(参考[antd](https://ant.design/docs/spec/values-cn)), 这些配置会很有意义。样式可配置化可以让你的代码更灵活, 更稳定, 可复用性和可维护性更高. 不管对于 UI 设计还是客户端开发, 设计规范可以提高团队工作效率, 减少沟通成本.

styled-components 的 Theme 使用的是`React Context` API, 官方文档有详尽的描述, 这里就不展开了. 点击这里[了解更多](https://www.styled-components.com/docs/advanced#theming), 另外在[这里](https://www.styled-components.com/docs/api#typescript)了解如何在 Typescript 中声明 theme 类型

<br/>

#### 8. 提升开发体验

可以使用`babel-plugin-styled-components`或[`babel macro`](https://babeljs.io/blog/2017/09/11/zero-config-with-babel-macros)来支持服务端渲染、 样式压缩和提升 debug 体验. 推荐使用 macro 形式, 无需安装和配置 babel 插件. 在 create-react-app 中已内置支持:

```ts
import styled, { createGlobalStyle } from 'styled-components/macro';

const Thing = styled.div`
  color: red;
`;
```

详见[Tooling](https://www.styled-components.com/docs/tooling#babel-macro)

<br/>

#### 9. 了解 styled-components 的局限性

比较能想到的局限性是性能问题:

1. css-in-js: 需要一个 JS 运行时, 会增加 js 包体积(大约 15KB)
2. 相比原生 CSS 会有更多节点嵌套(例如 ThemeConsumer)和计算消耗. 这个对于复杂的组件树的渲染影响尤为明显
3. 不能抽取为 CSS 文件, 这通常不算问题

> 官方[benchmark](https://github.com/styled-components/styled-components/tree/master/packages/styled-components/benchmarks)

下面是基于 v4.0 基准测试对比图, 在众多 CSS-in-js 方案中, styled-components 处于中上水平:

![styled-components benchmark](/images/04/styled-benchmark.png)

<br/>

#### 10. 一些开发规范

- 避免无意义的组件名. 避免类似`Div`, `Span`这类直接照搬元素名的无意义的组件命名

<br/>

- 在一个文件中定义 styled-components 组件. 对于比较简单的组件, 一般会在同一个文件中定义 styled-components 组件就行了. 下面是典型组件的文件结构:

  ```ts
  import React, { FC } from 'react';
  import styled from 'styled-components/macro';

  // 在顶部定义所有styled-components组件
  const Header = styled.header``;
  const Title = styled.div``;
  const StepName = styled.div``;
  const StepBars = styled.div``;
  const StepBar = styled.div<{ active?: boolean }>``;
  const FormContainer = styled.div``;

  // 使用组件
  export const Steps: FC<StepsProps> = props => {
    return <>...</>;
  };

  export default Steps;
  ```

  然而对于比较复杂的页面组件来说, 会让文件变得很臃肿, 扰乱组件的主体, 所以笔者一般会像抽取到单独的`styled.tsx`文件中:

  ```ts
  import React, { FC } from 'react';
  import { Header, Title, StepName, StepBars, StepBar, FormContainer } from './styled';

  export const Steps: FC<StepsProps> = props => {
    return <>...</>;
  };

  export default Steps;
  ```

<br/>

- 考虑导出 styled-components 组件, 方便上级组件设置样式

  ```ts
  // ---Foo/index.ts---
  import * as Styled from './styled';

  export { Styled };
  // ...

  // ---Bar/index.ts----
  import { Styled } from '../Foo';

  const MyComponent = styled.div`
    & ${Styled.SomeComponent} {
      color: red;
    }
  `;
  ```

<br/>

#### 11. 其他 CSS-in-js 方案

- CSS-module
- JSS
- emotion
- glamorous

这里值得一提的是[CSS-module](https://github.com/css-modules/css-modules), 这也是社区比较流行的解决方案. 严格来说, 这不是 CSS-in-js. 有兴趣的读者可以看这篇文章[CSS Modules 详解及 React 中实践](https://zhuanlan.zhihu.com/p/20495964).

特性:

- 比较轻量, 不需要 JS 运行时, 因为他在编译阶段进行计算
- 所有样式默认都是 local, 通过导入模块方式可以导入这些生成的类名
- 可以和 CSS proprocessor 配合
- 采用非标准的语法, 例如:global, :local, :export, compose:

CSS module 同样也有外部样式覆盖问题, 所以需要通过其他手段对关键节点添加其他属性(如 data-name).

> 如果使用 css-module, 建议使用`*.module.css`来命名 css 文件, 和普通 CSS 区分开来.

扩展:

- [CSS-in-JS 101: All you need to know](https://github.com/stereobooster/css-in-js-101)

<br/>

---

<br/>

### 4️⃣ 通用的组件库不应该耦合 CSS-in-js/CSS-module 的方案

如果是作为第三方组件库形式开发, 个人觉得不应该耦合各种 CSS-in-js/CSS-module. 不能强求你的组件库使用者耦合这些技术栈, 而且部分技术是需要构建工具支持的. 建议使用原生 CSS 或者将 SCSS/Less 这些预处理工具作为增强方案

<br/>

---

<br/>

### 5️⃣ 优先使用原生 CSS

笔者的项目大部分都是使用`styled-components`, 但对于部分极致要求性能的组件, 一般我会回退使用原生 CSS, 再配合 BEM 命名规范. 这种最简单方式, 能够满足大部分需求.

<br/>

---

<br/>

### 6️⃣ 选择合适自己团队的技术栈

每个团队的情况和偏好不一样, 选择合适自己的才是最好的. 关于 CSS 方面的技术栈搭配也非常多样:

![css determination](/images/04/css-determination.png)

- **选择 CSS-in-js 方案**:
  优点: 这个方案解决了大部分 CSS 的缺陷, 灵活, 动态性强, 学习成本比较低, 非常适合组件化的场景.
  缺点: 性能相比静态 CSS 要弱, 不过这点已经慢慢在改善. 可以考虑在部分组件使用原生 CSS
- **选择 CSS 方案**:
  - **选择原生 CSS 方案**: 这种方案最简单
  - **选择 Preprocessor**: 添加 CSS 预处理器, 可以增强 CSS 的可编程性: 例如模块化, 变量, 函数, mixin.
    优点: 预处理器可以减少代码重复, 让 CSS 更好维护. 适合组织性要求很高的大型项目.
    缺点: 就是需要学习成本, 所以这里笔者建议使用标准的 cssnext 来代替 SCSS/Less 这些方案
  - **方法论**: CSS 的各种方法论旨在提高 CSS 的组织性, 提供一些架构建议, 让 CSS 更好维护.
  - **postcss**: 对 CSS 进行优化增强, 例如添加厂商前缀
  - **css-module**: 隔离 CSS, 支持暴露变量给 JS, 解决 CSS 的一些缺陷, 让 CSS 适合组件化场景.
    可选, 通过合适的命名和组织其实是可以规避 CSS 的缺陷

综上所述, CSS-in-js 和 CSS 方案各有适用场景. 比如对于组件库, 如 antd 则选择了 Preprocessor 方案; 对于一般应用笔者建议使用 CSS-in-js 方案, 它学习成本很低, 并且`There's Only One Way To Do It` 没有太多心智负担, 不需要学习冗杂的方法论, 代码相对比较可控; 另外它还支持跨平台, 在 ReactNative 下, styled-components 是更好的选择. 而 CSS 方案, 对于大型应用要做到有组织有纪律和规划化, 需要花费较大的精力, 尤其是团队成员能力不均情况下, 很容易失控

<br/>

---

<br/>

### 7️⃣ 使用 svgr 转换 svg 图标

如今 CSS-Image-Sprite 早已被 [SVG-Sprite](https://github.com/jkphl/svg-sprite) 取代. 而在 React 生态中使用[`svgr`](https://github.com/smooth-code/svgr#webpack-usage)更加方便, 它可以将 svg 文件转换为 React 组件, 也就是一个普通的 JS 模块, 它有以下优势:

- 转换为普通 JS 文件, 方便代码分割和异步加载
- 相比 svg-sprite 和 iconfont 方案更容易管理
- svg 可以通过 CSS/JS 配置, 可操作性更强; 相比 iconfont 支持多色
- 支持 svgo 压缩

基本用法:

```ts
import starUrl, { ReactComponent as Star } from './star.svg';
const App = () => (
  <div>
    <img src={starUrl} alt="star" />
    <Star />
  </div>
);
```

了解[更多](https://www.smooth-code.com/open-source/svgr/docs/webpack/)

> antd 3.9 之后使用 svg 图标[代替了 font 图标](https://ant.design/components/icon-cn/#SVG-图标) <br/>
> 对比[SVG vs Image, SVG vs Iconfont](https://aotu.io/notes/2018/11/23/SVG_vs_Image_vs_iconfont/index.html)

<br/>

---

<br/>

### 8️⃣ 结合使用 rem 和 em 等相对单位, 创建更有弹性的组件

Bootstrap v4 全面使用 rem 作为基本单位, 这使得所有组件都可以响应浏览器字体的调整:

![](/images/04/bootstrap-rem.gif)

rem 可以让整个文档可以响应 html 字体的变化, 经常用于移动端等比例还原设计稿, 详见[Rem 布局的原理解析](https://www.zhihu.com/column/p/30413803). 我个人对于觉得弹性组件来说更重要的是 em 单位, 尤其是那些比例固定组件, 例如 Button, Switch, Icon. 比如我会这样定义 svg Icon 的样式:

```css
.svg-icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
}
```

像 iconfont 一样, 外部只需要设置`font-size`就可以配置 icon 到合适的尺寸, 默认则继承当前上下文的字体大小:

```tsx
<MyIcon style={{ fontSize: 17 }} />
```

em 可以让`Switch`这类固定比例的组件的样式可以更容易的被配置, 可以配合函数将px转换为em:

<iframe src="https://codesandbox.io/embed/z67r8rpnr4?fontsize=14" title="Switch" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>


扩展:

- [Understanding and Using rem Units in CSS](https://www.sitepoint.com/understanding-and-using-rem-units-in-css/)
- [Rem 布局的原理解析](https://www.zhihu.com/column/p/30413803)

<br/>

---

<br/>

## 3. 规范

### 1️⃣ 促进建立统一的 UI 设计规范

上文已经阐述了 UI 设计规范的重要性, 有兴趣的读者可以看看这篇文章[开发和设计沟通有多难？ - 你只差一个设计规范](https://juejin.im/post/5b766ac56fb9a009aa154c27). 简单总结一下:

- 提供团队协作效率
- 提高组件的复用率. 统一的组件规范可以让组件更好管理
- 保持产品迭代过程中品牌一致性

### 2️⃣ CSS 编写规范

可以参考以下规范:

- [编码规范 by @mdo](https://codeguide.bootcss.com) bootstrap 使用的规范
- [Airbnb CSS/Sass styleguide](https://github.com/airbnb/css)
- [Aotu 实验室代码规范](https://guide.aotu.io/docs/css/code.html#CSS3浏览器私有前缀写法)
- [FEX-Team 编码规范](https://github.com/fex-team/styleguide/blob/master/css.md)

### 3️⃣ 使用stylelint进行样式规范检查

<br/>

---

<br/>

## 扩展

- [Styling and CSS](https://reactjs.org/docs/faq-styling.html)
- [Stop using CSS in JavaScript for web development](https://medium.com/@gajus/stop-using-css-in-javascript-for-web-development-fa32fb873dcc)
- [精读《请停止 css-in-js 的行为》](https://zhuanlan.zhihu.com/p/26878157)
- [MicheleBertoli/css-in-js](https://github.com/MicheleBertoli/css-in-js)
- [What to use for React styling?](https://www.javascriptstuff.com/how-to-style-react/)
- [styled-components FAQ](https://www.styled-components.com/docs/faqs)
- [Styled components V4: the good, the bad, and something completely different](https://medium.com/ansarada-thinking/styled-components-v4-the-good-the-bad-and-something-completely-different-e891139e0138)
- [Should I use CSS-in-JS?](https://reactarmory.com/answers/should-i-use-css-in-js)
- [聊聊 UI 设计规范：移动端、H5 与 Web 端](http://qinsman.com/1606_uispec/)
- [开发也能构建 UI 组件设计规范](https://juejin.im/post/5b768e18e51d45565d23e52c)
