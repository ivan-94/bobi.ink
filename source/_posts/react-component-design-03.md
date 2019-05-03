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

### 3️⃣ 使用 CSS-in-js

社区有很多 CSS 解决方案, 有个[项目(MicheleBertoli/css-in-js)](https://github.com/MicheleBertoli/css-in-js)专门罗列和对比了这些方案. 读者也可以读这篇文章([What to use for React styling?](https://www.javascriptstuff.com/how-to-style-react/))学习对 CSS 相关技术进行选型决策

社区上最流行的, 也是笔者觉得使用起来最舒服的是[`styled-components`](https://www.styled-components.com), styled-components 有下列特性:

- 自动添加厂商前缀
- 自动关键 CSS. 样式和组件绑定, 可以和组件一起进行代码分割和异步加载
- 没有类名, 通过组件名来标志样式. 自动生成唯一的类名, 保证样式的隔离性.
- 灵活的动态样式. 通过 props 和全局 theme 来动态控制样式
- 绑定组件. 隔离了 CSS 的依赖问题
- 提供了一些 CSS 预处理器的语法
- 主题机制
- 支持 react-native. 这个用起来比较爽
- 支持 stylint, 编辑器高亮和智能提示
- 符合分离展示组件和行为组件理念

> styled-components 可以基本覆盖所有 CSS 的使用场景:

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

> SCSS 也提供了很多内置工具方法, 比如颜色的处理, 尺寸的计算. styled-components 提供了一个类似的 js 库: [polished](https://github.com/styled-components/polished)来满足这部分需求, 通过 babel 插件可以在编译时转换为静态代码, 无需加入运行时.

#### 6. 绑定组件的'全局样式'

绑定组件, 当组件卸载时也会删除全局样式

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

#### 7. [主题机制](https://www.styled-components.com/docs/advanced#theming)

通过 React context 机制来控制全局配置

#### 8. 提升开发体验

可以使用`babel-plugin-styled-components`或[`babel macro`](https://babeljs.io/blog/2017/09/11/zero-config-with-babel-macros)来支持服务端渲染, 样式压缩和提升 debug 体验. 推荐使用 macro 形式, 无需安装和配置 babel 插件. 在 create-react-app 中已内置支持:

```ts
import styled, { createGlobalStyle } from 'styled-components/macro';

const Thing = styled.div`
  color: red;
`;
```

详见[Tooling](https://www.styled-components.com/docs/tooling#babel-macro)

#### 9. 了解 styled-components 的局限性

比较可能的局限性是性能问题:

1. css-in-js: 需要一个 JS 运行时, 会增加 js 包体积(大约 15KB)
2. 相比原生 CSS 会有更多节点嵌套(例如 ThemeConsumer)和计算消耗. 这个对于复杂的组件树有尤为明显

> 官方[benchmark](https://github.com/styled-components/styled-components/tree/master/packages/styled-components/benchmarks)

下面是基于 v4.0 基准测试对比图, 在众多 CSS-in-js 方案中, styled-components 处于中上水平:

![styled-components benchmark](/images/04/styled-benchmark.png)

#### 10. 一些开发规范

- 避免无意义的组件名. 避免类似`Div`, `Span`这类直接照搬元素名的无意义的组件命名
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

  然而对于比较复杂的页面组件来说, 会让文件变得很臃肿, 扰乱组件的主体, 所以笔者一般会像抽取到单独的 styled.ts 文件中:

  ```ts
  import React, { FC } from 'react';
  import { Header, Title, StepName, StepBars, StepBar, FormContainer } from './styled';

  export const Steps: FC<StepsProps> = props => {
    return <>...</>;
  };

  export default Steps;
  ```

  导出 styled-components 组件, 方便上级组件设置样式

  ```ts
  // index.ts
  import * as Styled from './styled';

  export { Styled };
  // ...
  ```

### 4️⃣ 通用的组件库不应该耦合 CSS-in-js/CSS-module 的方案

如果是作为第三方组件库形式开发, 个人觉得不应该耦合各种 CSS-in-js/CSS-module, 甚至是 SCSS/Less. 不能强求你的组件库使用者耦合这些技术栈, 而且部分技术是需要构建工具支持的. 建议使用原生 CSS

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
- [styled-components FAQ](https://www.styled-components.com/docs/faqs)
- [Styled components V4: the good, the bad, and something completely different](https://medium.com/ansarada-thinking/styled-components-v4-the-good-the-bad-and-something-completely-different-e891139e0138)
