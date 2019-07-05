---
title: '[技术地图] 💅styled-components 💅'
date: 2019/5/29
categories: 前端
---

在[React 组件设计实践总结 03 - 样式的管理](https://juejin.im/post/5cdad9c7f265da039b08915d)一文中吹了一波 [styled-components](https://www.styled-components.com) 后，本文想深入来了解一下 styled-components 的原理. 如果你对 styled-components 还不了解，建议先阅读一下官方[文档](http://styled-components.com)或前面的文章.

> 本文基于 styled-components v4.13 版本

**目录**



- [从 Tagged Template Literals 说起](#从-tagged-template-literals-说起)
- [源码导读](#源码导读)
  - [1. 处理标签模板字面量](#1-处理标签模板字面量)
  - [2. React 组件的封装](#2-react-组件的封装)
  - [3. 样式和类名的生成](#3-样式和类名的生成)
  - [4. DOM 层操作](#4-dom-层操作)
  - [5. 总结](#5-总结)
- [技术地图](#技术地图)



<br>

---

<br>

## 从 Tagged Template Literals 说起

[**标签模板字面量(Tagged Template Literals)**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)是 ES6 新增的特性，它允许你**自定义字符串的内插(interpolation)规则**, styled-components 正是基于这个特性构建:

![](https://bobi.ink/images/06/styled-sample.png)

它的原理非常简单，所有静态字符串会被拆分出来合并成为数组, 作为第一个参数传入到目标函数，而内插(interpolation)表达式的值则会作为 rest 参数传入:

![](https://bobi.ink/images/06/tag-template.png)

**标签模板字面量相比普通的模板字面量更加灵活. 普通模板字符串会将所有内插值转换为字符串，而`标签模板字面量`则由你自己来控制**:

![](https://bobi.ink/images/06/tag-template-pros.png)

因为标签模板字符串简洁的语法和灵活性，它比较适用于作为`DSL`, 不需要在语言层面进行支持，比如前阵子[preact](https://github.com/preactjs/preact)作者开发的[htm](https://github.com/developit/htm), 口号就是"取代 JSX，而且不需要编译器支持", 通过这种方式是可以优雅地实现['你的网站或许不需要前端构建'](https://juejin.im/post/5ceacf09e51d454f73356cc4).

![](https://bobi.ink/images/06/htm.png)

另一个典型的例子就是 `jest` 的[`表格测试`](https://jestjs.io/docs/en/api#testeachtable-name-fn-timeout), 这样形式可读性更高:

![](https://bobi.ink/images/06/jest.png)

标签模板字面量的脑洞还在继续，比如可以用来写 markdown，再生成 react 组件。限于篇幅就不啰嗦了

扩展:

- [The magic behind 💅 styled-components](https://mxstbr.blog/2016/11/styled-components-magic-explained/)

<br>

---

<br>

## 源码导读

现在来看一下 styled-components 的实现。为了行文简洁，我们只关心 styled-components 的核心逻辑，所以我对源代码进行了大量的简化，比如忽略掉服务端渲染、ReactNative 实现、babel 插件等等.

### 1. 处理标签模板字面量

先从 `styled` 构造函数看起:

![](https://bobi.ink/images/06/styled-code.png)

styled 构造函数接收一个包装组件 target，而标签模板字面量则由[`css`](https://www.styled-components.com/docs/api#css)函数进行处理的. 这个函数在 styled-components 中非常常用，类似于 `SCSS` 的 `mixin` 角色. `css` 函数会标签模板字面量规范化, 例如:

![](https://bobi.ink/images/06/css.png)

 css 实现也非常简单:

![](https://bobi.ink/images/06/css-code.png)

`interleave`函数将将静态字符串数组和内插值’拉链式‘交叉合并为单个数组, 比如[1, 2] + [a, b]会合并为[1, a, 2, b]

关键在于如何将数组进行扁平化, 这个由 `flatten` 函数实现. flatten 函数会将嵌套的 css(数组形式)递归 concat 在一起，将 StyledComponent 组件转换为类名引用、还有处理 keyframe 等等. 最终剩下静态字符串和函数, 输出结果如上所示。

**实际上 styled-components 会进行两次 flatten，第一次 flatten 将能够静态化的都转换成字符串，将嵌套的 css 结构打平, 只剩下一些函数，这些函数只能在运行时(比如在组件渲染时)执行；第二次是在运行时，拿到函数的运行上下文(props、theme 等等)后, 执行所有函数，将函数的执行结果进行递归合并，最终生成的是一个纯字符串数组**. 对于标签模板字面量的处理大概都是这个过程. 看看 flatten 的实现:

![](https://bobi.ink/images/06/flatten-code.png)

总结一下标签模板字面量的处理流程大概是这样子:

![](https://bobi.ink/images/06/flatten.png)

<br>

---

<br>

### 2. React 组件的封装

现在看看如何构造出 React 组件。styled-components 通过 createStyledComponent 高阶组件将组件封装为 StyledComponent 组件:

![](https://bobi.ink/images/06/create-component.png)

createStyledComponent 是一个典型的高阶组件，它在执行期间会生成一个唯一的组件 id 和创建`ComponentStyle`对象. ComponentStyle 对象用于维护 css 函数生成的 cssRules, 在运行时(组件渲染时)得到执行的上下文后生成最终的样式和类名。

再来看看 StyledComponent 的实现, StyledComponent 在组件渲染时，将当前的 props+theme 作为 context 传递给 ComponentStyle，生成类名.

![](https://bobi.ink/images/06/StyledComponent.png)

<br>

---

<br>

### 3. 样式和类名的生成

上面看到 StyleComponent 通过 ComponentStyle 类来构造样式表并生成类名, ComponentStyle 拿到 context 后，再次调用 flatten 将 css rule 扁平化，得到一个纯字符串数组。通过使用 hash 算法生成类名, 并使用stylis 对样式进行预处理. 最后通过 StyleSheet 对象将样式规则插入到 DOM 中

![](https://bobi.ink/images/06/ComponentStyle.png)

[stylis](https://github.com/thysultan/stylis.js/blob/master/README.md)是一个 3kb 的轻量的 CSS 预处理器, styled-components 所有的 CSS 特性都依赖于它， 例如嵌套规则(`a {&:hover{}}`)、厂商前缀、压缩等等.

<br>

---

<br>

### 4. DOM 层操作

现在来看一下 StyleSheet, StyleSheet 负责收集所有组件的样式规则，并插入到 DOM 中

![](https://bobi.ink/images/06/StyleSheet.png)

看看简化版的 makeTag

![](https://bobi.ink/images/06/makeTag.png)

<br>

---

<br>

### 5. 总结

代码可能看晕了，通过流程图来梳理一下过程.

> 上一篇文章[技术地图 - vue-cli](https://juejin.im/post/5cedb26451882566477b7235)一点代码也没有罗列，只有一个流程图, 读者可能一下子就傻眼了, 不知道在说些什么; 而且这个流程图太大，在移动端不好阅读. 这期稍微改进一下，新增’源码导读‘一节，代码表达能力毫无疑问是胜于流程图的，但是代码相对比较细节琐碎，所以第一是将代码进行简化，留下核心的逻辑，第二是使用流程图表示大概的程序流程，以及流程主体之间的关系.

![](https://bobi.ink/images/06/process.png)

<br>

如上图 styled-components 主要有四个核心对象:

- **WrappedComponent**: 这是 createStyledComponent 创建的包装组件，这个组件保存的被包装的 target、并生成组件 id 和 ComponentStyle 对象
- **StyledComponent**: 这是样式组件，在它 render 时会将 props 作为 context 传递给 ComponentStyle，并生成类名
- **ComponentStyle**: 负责生成最终的样式表和唯一的类名，并调用 StyleSheet 将生成的样表注入到文档中
- **StyleSheet**: 负责管理已生成的样式表, 并注入到文档中

<br>

**styled-components 性能优化建议**

styled-components 每次渲染都会重新计算 cssRule，并进行 hash 计算出 className，如果已经对应的 className 还没插入到样式表中，则使用 stylis 进行预处理，并插入到样式表中; 

另外 styled-components 对静态 cssRule(没有任何内插函数)进行了优化，它们不会监听 ThemeContext 变化, 且在渲染时不会重新计算。

通过这些规则可以得出以下性能优化的建议:

- **静态化的 cssRule 性能是最好的**
- **降低 StyledComponent 状态复杂度**. styled-components 并不会对已有的不变的样式规则进行复用，一旦状态变化 styled-component 会生成一个全新的样式规则和类名. 这是最简单的一种实现, 避免了样式复用的复杂性，同时保持样式的隔离性, 问题就是会产生样式冗余。 例如

  ```tsx
  const Foo = styled.div<{ active: boolean }>`
    color: red;
    background: ${props => (props.active ? 'blue' : 'red')};
  `;
  ```

  active 切换之间会生成两个类名:

  ```css
  .cQAOKL {
    color: red;
    background: red;
  }
  .kklCtT {
    color: red;
    background: blue;
  }
  ```

  如果把 StyledComponent 看做是一个状态机，那么 styled-components 可能会为每一个可能的状态生成独立的样式. 如果 StyledComponent 样式很多, 而且状态比较复杂，那么会生成很多冗余的样式.

- ❌ **不要用于动画**。上面了解到 styled-component 会为每个状态生成一个样式表. 动画一般会有很多中间值，在短时间内进行变化，如果动画值通过props传入该StyledComponent来应用样式，这样会生成很多样式，性能非常差:

  ```tsx
  const Bar = styled.div<{ width: boolean }>`
    color: red;
    // 千万别这么干
    width: ${props => props.width};
  `;
  ```

  这种动画场景最好使用 style 内联样式来做

<br>

OK, 行文结束。styled-components 不过如此是吧？

<br>

---

<br>

## 技术地图

- **CSS 相关**
  - @emotion/unitless 判断属性值是否需要单位
  - css-to-react-native 将 css 转换为 ReactNative style 属性
  - ✨[stylis](https://www.npmjs.com/package/bundlesize) 轻量的 CSS 预处理器
- **React 相关**
  - @emotion/is-prop-valid 判断是否是合法的 DOM 属性
  - [hoist-non-react-statics](https://www.npmjs.com/package/hoist-non-react-statics) 提升React组件的静态属性，用于高阶组件场景
  - ✨[react-is](https://www.npmjs.com/package/react-is): 判断各种 React 组件类型
  - [react-primitives](https://github.com/lelandrichardson/react-primitives#readme) 这是一个有意思的库，这个库试图围绕着构建 React 应用提出一套理想的原语，通俗的说就是通过它可以导入不同平台的组件。
  - [react-frame-component](https://github.com/ryanseddon/react-frame-component) 将react渲染到iframe中。也是一个比较有意思的库
  - [react-live](https://www.npmjs.com/package/react-live) react实时编辑器和展示，主要用于文档
- **构建相关**
  - [bundlesize](https://github.com/siddharthkp/bundlesize#readme) 检查包大小
  - [codemod](https://github.com/codemod-js/codemod/blob/master/packages/cli/README.md) 使用babel-plugin来重写Javascript或Typescript代码， 一般用于制作升级脚本
  - ✨[microbundle](https://github.com/developit/microbundle) 一个零配置的打包器，基于Rollup，可以用于库的打包和开发, preact作者开发必属精品
