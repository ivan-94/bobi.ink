---
title: '[技术地图] styled-components'
date: 2019/5/29
categories: 前端
---

在[]一文中吹了一波后，本文深入来了解一些 styled-components 的原理

> 本文基于 styled-components v4.13 版本

<!-- TOC -->

- [从 Tagged Template Literals 说起](#从-tagged-template-literals-说起)
- [源码导读](#源码导读)
  - [1. 处理标签模板字面量](#1-处理标签模板字面量)
  - [2. React 组件的封装](#2-react-组件的封装)
  - [3. 样式和类名的生成](#3-样式和类名的生成)
  - [4. DOM 层操作](#4-dom-层操作)
  - [5. 总结](#5-总结)
- [技术地图](#技术地图)

<!-- /TOC -->

## 从 Tagged Template Literals 说起

标签模板字面量(Tagged Template Literals)是 ES6 新增的特性，它允许你自定义字符串的内插(interpolation)规则, styled-components 正是基于这个特性构建:

<center>
  <img src="/images/06/styled-sample.png" width="400" />
</center>

它的原理非常简单，所有静态字符串会被拆分作为第一个参数传入到对应函数，而内插(interpolation)表达式的值则会作为 rest 参数传入:

<center>
  <img src="/images/06/tag-template.png" width="400" />
</center>

**标签模板字面量相比普通的模板字面量更加灵活，比如普通模板字符串会将所有内插值转换为字符串，而`标签模板字符串`则有你自己来控制**:

<center>
  <img src="/images/06/tag-template-pros.png" width="600" />
</center>

因为标签模板字符串简洁的语法和灵活性，它比较适用于作为`DSL`, 不需要在语言层面进行支持，比如前阵子[preact](https://github.com/preactjs/preact)作者开发的[htm](https://github.com/developit/htm), 口号就是"取代 JSX，而且不需要编译器支持":

<center>
  <img src="/images/06/htm.png" width="700" />
</center>

通过这种方式是可以优雅地实现['你的网站或许不需要前端构建'](https://juejin.im/post/5ceacf09e51d454f73356cc4).

另一个典型的例子就是 jest 的`表格测试`:

<center>
  <img src="/images/06/jest.png" width="700" />
</center>

标签模板字面量的脑洞还在继续，比如可以用来写 markdown，再生成 react 组件。限于篇幅就不啰嗦了

扩展:

- [The magic behind 💅 styled-components](https://mxstbr.blog/2016/11/styled-components-magic-explained/)

## 源码导读

### 1. 处理标签模板字面量

从 styled 构造函数开始:

<center>
  <img src="/images/06/styled-code.png" width="700" />
</center>

---

上面代码中可以看出，所有样式模板其实都是通过[`css`](https://www.styled-components.com/docs/api#css)函数进行处理的. css 函数会标签模板字符串规范化, 例如:

<center>
  <img src="/images/06/css.png" width="700" />
</center>

看看 css 实现:

<center>
  <img src="/images/06/css-code.png" width="700" />
</center>

实现也很简单，将静态字符串数组和内插值’拉链式‘交叉合并为单个数组, 比如[1, 2] + [a, b]会合并为[1, a, 2, b]

关键在于如何将数组进行扁平化, 这个由 flatten 方法实现，flatten 会将嵌套的 css(也是数组)递归 concat 在一起，将 styled-component 组件转换为类名，还有处理 keyframe 等等. 最终输出结果如上例.

**实际上 styled-components 会进行两次 flatten，第一次 flatten 将能够静态化的转换成字符串，将嵌套的 css 结构打平, 剩下一些函数，这些函数只能在运行时(比如在组件渲染时)执行；第二次是在运行时，拿到函数的运行上下文(props、theme 等等), 执行所有函数，将函数的执行结果进行递归合并，最终生成的是一个纯字符串数组**. 对于标签模板字面量的处理大概都是这个过程. 看看 flatten 的实现:

<center>
  <img src="/images/06/flatten-code.png" width="700" />
</center>

流程是这样子:

<center>
<img src="/images/06/flatten.png" width="700"/>
</center>

---

### 2. React 组件的封装

现在看看如何构造出 React 组件。styled-components 通过 createStyledComponent 高阶组件将组件封装为 StyledComponent 组件:

<center>
<img src="/images/06/create-component.png" width="800"/>
</center>

再来看看 StyledComponent 的实现:

<center>
<img src="/images/06/StyledComponent.png" width="800"/>
</center>

---

### 3. 样式和类名的生成

上面看到 StyleComponent 通过 ComponentStyle 类来构造样式表并生成类名:

<center>
<img src="/images/06/ComponentStyle.png" width="800"/>
</center>

[stylis](https://github.com/thysultan/stylis.js/blob/master/README.md)是一个 3kb 的轻量的 CSS 预处理器, styled-components 所有的 CSS 特性都依赖于它， 例如嵌套规则(`a {&:hover{}}`)、厂商前缀、压缩等等.

### 4. DOM 层操作

现在来看一下 StyleSheet

<center>
<img src="/images/06/StyleSheet.png" width="800"/>
</center>

看看简化版的 makeTag

<center>
<img src="/images/06/makeTag.png" width="800"/>
</center>

### 5. 总结

代码可能看晕了，通过流程图来梳理一下过程. 上一篇文章[技术地图 - vue-cli](https://juejin.im/post/5cedb26451882566477b7235)一点代码也没有罗列，只有一个流程图, 读者可能一下子就傻眼了, 不知道在说些什么; 而且这个流程图太大，在移动端不好阅读的问题. 这期稍微改进一下新增’源码导读‘一节，代码表达能力毫无疑问是胜于流程图的，但是代码相对比较细节琐碎，所以第一是将代码进行简化，留下核心的逻辑，第二是使用流程图表示大概的程序流程，以及流程主体之间的关系.

![](/images/06/process.png)

如上图 styled-components 主要有四个核心对象:

- **WrappedComponent**: 这是 createStyledComponent 创建的包装组件，这个组件保存的被包装的 target、并生成组件 id 和 ComponentStyle 对象
- **StyledComponent**: 这是样式组件，在它 render 时会将 props 作为 context 传递给 ComponentStyle，并生成类名
- **ComponentStyle**: 负责生成最终的样式表和唯一的类名，并调用 StyleSheet 将生成的样表注入到文档中
- **StyleSheet**: 负责管理已生成的样式表, 并注入到文档中

**styled-components 性能优化建议**

styled-components 每次渲染都会重新计算 cssRule，并进行 hash 计算出 className，如果已经对应的 className 还没插入到样式表中，则使用 stylis 进行预处理，并插入到样式表中; 另外 styled-components 对静态 cssRule(没有任何内插函数)进行优化，它们不会监听 ThemeContext 变化, 且在渲染时不会重新计算。

通过这些规则可以得出以下性能优化的建议:

- 静态化的 cssRule 性能是最好的
- 减少 props 状态复杂度. styled-components 并不会对已有的不变的样式规则进行复用，一旦状态变化 styled-component 会生成一个全新的样式规则和类名. 这是最简单的一种实现, 避免了样式复用的复杂性，保持样式的隔离性。 例如

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

- ❌ 不要用于动画。上面了解到 styled-component 会为每个状态生成一个样式表. 动画会在短时间会重新生成很多样式，性能非常差:

  ```tsx
  const Bar = styled.div<{ width: boolean }>`
    color: red;
    // 千万别这么干
    width: ${props => props.width};
  `;
  ```

  这种动画场景最好使用 style 内联样式来做

简化，忽略掉服务端渲染
如何进行优化
属性过滤
样式变动加载顺序

## 技术地图

- @emotion
