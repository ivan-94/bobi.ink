---
title: "深入浅出 Babel 下篇：既生 Plugin 何生 Macros"
date: 2019/7/15
categories: 前端
---

既然文章谈到了宏，那么我们就深入讲讲‘宏’是什么玩意。

<!-- TOC -->

- [关于宏](#关于宏)
  - [文本替换式](#文本替换式)
  - [语法扩展式](#语法扩展式)
  - [Sweet.js](#sweetjs)
  - [小结](#小结)
- [既生 Plugin 何生 Macro](#既生-plugin-何生-macro)
- [如何写一个 Babel Macro](#如何写一个-babel-macro)
  - [实战](#实战)
- [扩展资料](#扩展资料)

<!-- /TOC -->

## 关于宏

[Wiki](https://zh.wikipedia.org/wiki/巨集)上面对‘宏’的定义是：**宏(Macro), 是一种批处理的称谓，它根据一系列的预定义规则转换一定的文本模式。`解释器`或`编译器`在遇到宏时会自动进行这一模式转换，这个转换过程被称为“宏展开(Macro Expansion)”。对于编译语言，宏展开在编译时发生，进行宏展开的工具常被称为宏展开器。**

你可以认为，宏就是用来生成代码的代码，它有能力进行一些句法解析和代码转换。宏大致可以分为两种: **文本替换**和**语法扩展**

### 文本替换式

相信大家或多或少有接触过宏，很多程序员第一门语言是`C/C++`, 在`C`中就有宏的概念。例如:

```c
#define MIN(X, Y) ((X) < (Y) ? (X) : (Y))
```

我们的程序使用了这个宏，就会在编译阶段被展开，例如：

```c
MIN(a + b, c + d)
```

会被展开为:

```c
((a + b) < (c + d) ? (a + b) : (c + d))
```

除了`函数宏`, `C` 中还有`对象宏`, 我们通常使用它来声明常量:

```c
#define PI 3.1214
```

![](/images/babel/c-compile.gif)

如上图，宏本质上不是`C`语言的一部分, 它由`C预处理器`提供，预处理器对源代码进行文本替换，生成‘真正’的`C`代码，再传递给编译器。

除此之外，[`GNU m4`](https://segmentfault.com/a/1190000004104696)是一个更专业/更强大/更通用的预处理器(宏展开器)。关于`m4`可以看[让这世界再多一份 GNU m4 教程](https://segmentfault.com/a/1190000004104696) 系列文章.

这种宏很容易理解，因为它们只是纯文本替换, 换句话说它就是‘文本编辑器’。所以相对而言，这种形式的宏能力有限，它也不会检验语法是否合法, 使用它经常会出现问题。

所以随着现代编程语言表达能力越来越强，这些语言都不推荐使用宏，而是使用语言本身的机制(如函数)来解决问题，这样更安全、更容易理解和调试. 所以反过来推导，之所以`C`语言需要宏，正是因为`C`语言的表达能力太弱了。

<br>

### 语法扩展式

‘真正’的宏起源于[`Lisp`](https://zh.wikipedia.org/wiki/LISP). 这个得益于Lisp语言本身的一些特性：

![](/images/babel/lisp.png)

- 它的语法非常简单。只有[S-表达式(s-expression)](https://zh.wikipedia.org/wiki/S-表达式), 一般特征为括号化的前缀表示法, 可以认为S-表达式就是Lisp的抽象语法树(AST)
- 数据即代码，S-表达式本身就是树形数据结构.

由于Lisp这种简单的语法结构，使得数据和程序之间只有一线之隔(**quote就是数据， 没有quote就是程序**), 这种`数据即程序、程序即数据`的概念，换句话说就是程序和数据之间可以灵活地转换，使得Lisp可以轻松地自定义宏. 不妨来看一下Lisp定义宏的示例：

```clj
; 使用defmacro定义一个nonsense宏, 接收一个function-name参数. 宏需要返回一个quote
; ` 表示quote，即这段‘程序’是一段‘数据’, 或者说将‘程序’转换为‘数据’. quote不会被‘求值’
; defun 定义一个函数
; , 表示unquote，即将‘数据’转换为‘程序’. unquote会进行求值
; intern 将字符串转换为symbol，即标识符
(defmacro nonsense (function-name)
  `(defun ,(intern (concat "nonsense-" function-name)) (input)
     (print (concat ,function-name input))))
```

进行宏展开：

```clj
(nonsense "apple")           ; 展开宏，创建一个nonsense-apple函数
(nonsense-apple " is good")  ; 调用刚刚创建的宏
                             ; => "apple is good"
```

<br>

**对于Lisp而言，宏有点像一个函数, 只不过这个函数必须返回一个`quoted数据`，当调用这个宏时，Lisp会使用`unquote`函数将`quoted数据`转换为`程序`。**

![](/images/lisp-macro.png)

<br>

通过上面的示例，你会感叹Lisp的宏实现竟然如此清奇，如此简单。 搞得我想跟着[题叶](http://tiye.me)学一波[Clojure](https://clojure.org)，但是后来我学了[Elixir](https://elixir-lang.org) 😂.

Lisp宏的灵活性得益于简单的语法(S-表达式可以等价于它的AST)，对于复杂语法的语言(例如Javascript)，要实现类似Lisp的宏就难得多. 因此很少有现代语言提供宏机制也是因为这个原因。

尽管如此，现在很多技术难点慢慢被解决，很多现代语言也引入类Lisp的宏机制，如[Rust](https://doc.rust-lang.org/book/ch19-06-macros.html)、[Julia](https://julialang.org), 还有Javascript的[Sweet.js](https://www.sweetjs.org/doc/tutorial)

<br>

### Sweet.js

Sweet.js 和 Rust 师出同门，所以两个的宏语法和非常接近(初期)。 不过需要注意的是官方认为Sweet.js目前仍处于实验阶段，而且Github最后提交时间停留在2年前，社区上也未见大规模的使用。所以不要在生产环境中使用它，但是不妨碍我们去学习一个现代编程语言的宏机制。

我们先使用 `Sweet.js` 来实现上面我们通过 `Lisp` 实现的`nosense`宏, 对比看更容易理解:

```js
import { unwrap, fromIdentifier, fromStringLiteral } from '@sweet-js/helpers' for syntax;

syntax nosense = function (ctx) {
  let name = ctx.next().value;
  let funcName = 'nonsense' + unwrap(name).value

  return #`function ${fromIdentifier(name, funcName)} () {
    console.log(${fromStringLiteral(name, unwrap(name).value)} + input)
  }`;
};

nosense Apple
nosenseApple(" is Good")
```

首先，Sweet.js使用`syntax`关键字来定义一个宏，其语法类似于`const`或者`let`。本质上一个宏就是一个函数，这个函数接收一个[`TransformerContext`](https://www.sweetjs.org/doc/reference#syntax-transformer)对象，你也通过这个对象获取用户传入的**语法对象(Syntax Object)数组**，最终这个宏也要返回**语法对象数组**。

什么是语法对象？语法对象是Sweet.js关于语法的内部表示。**你可以类比上文Lisp的 quoted 数据，只不过在复杂语法的语言中，没办法使用 quoted 这么简单的序列来表示语法，而使用 AST 则更复杂，开发者更难以驾驭。所以大部分实现会参考Lisp的S-表达式，取折中方案，将传入的程序转换为Tokens，再组装成类似quoted的数据结构**。

举个例子，Sweet.js 会将 `foo,bar('baz', 1)`转换成这样的数据结构:

![](/images/babel/syntaxobject.png)

从上图可知，Sweet.js 会将传入的程序解析成**嵌套的Token序列**，这个结构和Lisp的S-表达式非常相似。也就是说对于闭合的词法单元会被嵌套存储，例如上例的`('baz', 1)`.

`TransformerContext`实现了迭代器方法，所以我们通过调用它的`next()`来遍历获取语法对象。最后宏必须返回一个语法对象数组，Sweet.js 使用了类似`字符串模板`的[语法](https://www.sweetjs.org/doc/reference#syntax-templates)(称为语法模板)来简化开发，这个模板最终转换为语法对象数组。

> 需要注意的是语法模板的内嵌值只能是语法对象、语法对象序列或者TransformerContext.

> 旧版本使用了[模式匹配](https://jlongster.com/Stop-Writing-JavaScript-Compilers--Make-Macros-Instead)，和Rust语法类似，我个人更喜欢这个，不知为何废弃了
> ```js
> macro define {
>     rule { $x } => {
>         var $x
>     }
>
>     rule { $x = $expr } => {
>         var $x = $expr
>     }
> }
>
> define y;
> define y = 5;
> ```

<br>

说了这么多，类似Sweet.js`语法对象`的设计是现代编程语言为了贴近Lisp宏的一个关键技术点。我发现Elixir、Rust等语言也使用了类似的设计。 除了数据结构的设计，现代编程语言的宏机制还包含以下特性：

**卫生宏(Hygiene)**

卫生宏指的是在宏内生成的变量不会污染外部作用域，也就是说，在宏展开时，Sweet会避免宏内定义的变量和外部冲突.

举个例子，我们创建一个swap宏，交换变量的值:

```js
syntax swap = (ctx) => {
 const a = ctx.next().value
 ctx.next() // 吃掉','
 const b = ctx.next().value
 return #`
 let temp = ${a}
 ${a} = ${b}
 ${b} = temp
 `;
}

swap foo,bar
```

最终会输出为(查看[示例](https://www.sweetjs.org/browser/editor.html#//%20The%20%60syntax%60%20keyword%20is%20used%20to%20create%20and%20name%20new%20macros.%0Asyntax%20swap%20=%20(ctx)%20=%3E%20%7B%0A%20const%20a%20=%20ctx.next().value%0A%20ctx.next()%20//%20吃掉','%0A%20const%20b%20=%20ctx.next().value%0A%20return%20#%60%0A%20let%20temp%20=%20$%7Ba%7D%0A%20$%7Ba%7D%20=%20$%7Bb%7D%0A%20$%7Bb%7D%20=%20temp%0A%20%60;%0A%7D%0A%0Aswap%20foo,bar%0A)):

```js
let temp_10 = foo; // temp变量被重命名为temp_10
foo = bar;
bar = temp_10;
```

如果你想引用外部的变量，也可以。不过不建议这么做，**宏不应该假定其被展开的上下文**:

```js
syntax swap = (ctx) => {
  // ...
  return #`
  temp = ${a} // 不使用 let 声明
  ${a} = ${b}
  ${b} = temp
  `;
}
```

<br>

**模块化**

Sweet.js的宏是模块化的：

```js
'lang sweet.js';
// 导出宏
export syntax class = function (ctx) {
  // ...
};
```

导入：

```js
import { class } from './es2015-macros';

class Droid {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }

  rollWithIt(it) {
    return this.name + " is rolling with " + it;
  }
}
```

**相对Babel(编译器)来说，Sweet.js的宏是模块化的。Babel你需要在配置文件中配置各种插件和选项，尤其是团队项目构建有统一规范和程序时，项目构建脚本修改比较麻烦。而模块化的宏是源代码的一部分，而不是构建脚本的一部分，这使得它们可以被灵活地使用、重构以及废弃**。 下文介绍的`babel-plugin-macros`最大的优势就在这里, 通常我们希望构建环境是统一的、稳定的、开发人员应该专注于代码的开发，而不是如何去构建程序，正是因为代码多变性，才催生出了这些方案。

需要注意的是**宏是在编译阶段展开**的，所以无法运行用户代码，例如:

```js
let log = msg => console.log(msg); // 用户代码, 运行时被求值，所以无法被访问

syntax m = ctx => {
  // 宏函数在编译阶段被执行
  log('doing some Sweet things'); // ERROR: 未找到变量log
  // ...
};
```

<br>

Sweet.js和其他语言的宏一样，有了它你可以:

- 新增语法糖(和Sweet.js 一样甜), 实现复合自己口味的语法或者某些实验性的语言特性
- 自定义[操作符](https://www.sweetjs.org/doc/tutorial#sweet-operators), 很强大
- 消灭重复的代码，提升语言的表达能力。
- ...
- 别炫技

🤕很遗憾！Sweet.js 基本死了。所以现在当个玩具玩玩尚可，切勿用于生产环境。即使没有如此，Sweet.js这种非标准的语法、开发和调试都会比较麻烦(比如我想和Typescript配合使用).

归根到底，Sweet.js 的失败，估计是社区抛弃了它。Javascript语言表达能力越来越强，版本迭代快速，加上Babel和Typescript这些解决方案，实在拿不出什么理由来使用Sweet.js

<br>

### 小结

这一节扯得有点多，将宏的历史和分类讲了个遍。 最后的总结是Elixir官方教程里面的一句话：**显式好于隐式，清晰的代码优于简洁的代码(Clear code is better than concise code)**

能力越大、责任越大。 宏越强大，相比正常的程序可能就越远，比正常程序要更难以驾驭，你可能需要一定的成本去学习和理解它, 所以能不用宏就不用宏，**宏是最后的招数**.


<br>

## 既生 Plugin 何生 Macro

一下子扯了好远，掰回正题。既然 Babel 有了 Plugin 为什么又冒出了个 [`babel-plugin-macros`](https://github.com/kentcdodds/babel-plugin-macros)?

> 如果你尚不了解Babel Macro，可以先读一下[官方文档](https://github.com/kentcdodds/babel-plugin-macros), 另外[Creact-React-APP](https://create-react-app.dev) 已经内置

这个得从 [Create-React-App(CRA)](https://github.com/facebook/create-react-app) 说起，CRA 将所有的项目构建逻辑都封装在[`react-scripts`](https://github.com/facebook/create-react-app/tree/master/packages/react-scripts) 服务中。**这样的好处是，开发者不用再关心构建的细节, 另外构建工具的升级也变得非常方便**。直接升级 `react-scripts`即可。如果你要自己维护构建脚本，升一次级你需要升级一大堆的依赖，如果你要维护多个项目的构建脚本，那就更蛋疼了。

我在[《为什么要用vue-cli3?》](https://juejin.im/post/5d2fcaacf265da1b95708f63) 里阐述了 CRA 以及类似Vue-cli这样的工具对团队项目维护的重要性。CRA 是**强约定**的，它是按照React社区的最佳实践给你准备的，为了保护封装带来的红利，它不推荐你去配置Webpack、Babel... 所以才催生除了 babel-plugin-macros, 大家可以看这个 [Issue: RFC - babel-macros](https://github.com/facebook/create-react-app/issues/2730)

> 两年前就有了，但是国内介绍它的文章很少，估计知道的读者也是少数

**所以为 Babel 寻求一个'零配置'的机制是 `babel-plugin-macros` 诞生的主要动机**。这篇文章正好披露了这个动机：[《Zero-config code transformation with babel-plugin-macros》](https://babeljs.io/blog/2017/09/11/zero-config-with-babel-macros), 这篇文章引述了一个重要的观点："**Compilers are the New Frameworks**"

的确，**Babel 在现代的前端开发中扮演着一个很重要的角色，越来越多的框架或库会创建自己的 Babel 插件，旨在编译阶段做一些优化，来提高用户体验、开发体验以及运行时的性能**。比如:

- [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash) 将loadash转换为按需导入
- [babel-plugin-import](https://github.com/ant-design/babel-plugin-import) 上篇文章提过的这个插件，也是实现按需导入
- [babel-react-optimize](https://github.com/jamiebuilds/babel-react-optimize) 静态分析React代码，利用一定的措施优化运行效率。比如将静态的props或组件抽离为常量
- [root-import](https://github.com/entwicklerstube/babel-plugin-root-import) 将基于根目录的导入路径重写为相对路径
- [styled-components](https://www.styled-components.com/docs/tooling#babel-macro) 典型的CSS-in-js方案，利用Babel 插件来支持服务端渲染、预编译模板、样式压缩、清除死代码、提升调试体验。
- [preval](https://github.com/kentcdodds/babel-plugin-preval) 在编译时预执行代码
- [babel-plugin-graphql-tag](https://www.apollographql.com/docs/react/v2.5/recipes/babel/#using-babel-plugin-graphql-tag) 预编译GraphQL查询
- ...

上面列举的插件场景中，**不是所有插件都是通用的，它们要么是跟某一特定的框架绑定、要么用于处理特定的文件类型或数据。这些非通用的插件是最适合使用macro取代的**。

用 `preval` 举个例子:

使用插件形式: 首先要配置插件

```js
{
  "plugins": ["preval"]
}
```

代码：

```js
// 传递给preval的字符串会在编译阶段被执行
// preval插件会查找preval标识符，将字符串提取出来执行，在将执行的结果赋值给greeting
const greeting = preval`
  const fs = require('fs')
  module.exports = fs.readFileSync(require.resolve('./greeting.txt'), 'utf8')
`
```

<br>

使用Macro方式:

```js
// 首先你要显式导入
import preval from 'preval.macro'

// 和上面一样
const greeting = preval`
  const fs = require('fs')
  module.exports = fs.readFileSync(require.resolve('./greeting.txt'), 'utf8')
`
```

这两者达到的效果是一样的，但意义却不太一样。有哪些区别？

- 1️⃣ 很显然，Macro不需要配置`.babelrc`(当然babel-plugin-macros这个需要装好). 这个对于CRA这种不推荐配置构建脚本的工具来说很有帮助
- 2️⃣ **由隐式转换为了显式**。上一节就说了“显式好于隐式”。你必须在源代码中通过某些手段声明你使用了 Macro，基于插件的方式，你可能不知道`preval`这个标识符哪里来的，如何被应用？何时被应用？而且还需要其他工具的配合，例如ESlint、Typescript声明等等。
    宏由代码显式地应用，我们更明确它被应用的目的和时机，对源代码的侵入性最小。因为中间多了babel-plugin-macro 这一层，我们降低了对构建环境的耦合，让我们的代码更方便被迁移。另外，当配置出错时，Macro可以得到更好的错误提示
- 3️⃣ Macro相比Plugin 更容易被实现。因为它专注于具体的 AST 节点

有利有弊，Babel Macro 肯定也有些缺陷，例如相对于插件来说只能显式转换，且显式的Macro代码可能会比较啰嗦，不过个人觉得在某些场景利大于弊。

那么Babel Macro也是宏？相对于 Sweet.js 这些'正统'的宏机制有哪些不足？

- **首先Babel Macro必须是合法的Javascript语法**。 不支持自定义语法，也要分两面讨论，合法的Javascript语法不至于打破现有的协作链，比如可以和ESLint、Typescript正常的配合。而不能自定义语法的‘宏’，显得不太地道，不够强大。
- **再者，Babel Macro 和 Babel Plugin没有本质的区别**，相比Sweet.js提供了显式的宏语法，Babel Macro直接操作 AST 则要复杂得多，你还是需要了解一些编译原理，这把一般的开发者挡在了门外。

<br>

**总之，Babel Macro 本质上和Babel Plugin没有什么区别，它只是在Plugin 之上封装了一层(分层架构模式的强大)，创建了一个平台，让开发者可以在源代码层面显式地应用代码转换**。所以，**任何适合显式去转换的场景都适合用Babel Macro来做**：

- 特定框架、库的代码转换。如 `styled-components`
- 动态生成代码。`preval`
- 特定文件、语言的处理。例如`graphql-tag.macro`、`yaml.macro`、`svgr.macro`
- ... (查看[awesome-babel-macros](https://github.com/jgierer12/awesome-babel-macros#graphql))

<br>

## 如何写一个 Babel Macro

所以，Babel Macro是如何运作的呢？ `babel-plugin-macros` 要求开发者必须显式地导入 Macro，它会遍历匹配所有导入语句，如果导入源匹配`/[./]macro(\.js)?$/`正则，它就会认为你在启用Macro。例如下面这些导入语句都匹配正则：

```js
import foo from 'my.macro'
import { bar } from './bar/macro'
import { baz as _baz} from 'baz/macro.js'
// 不支持命名空间导入
```

Ok, 到匹配到导入语句后，`babel-plugin-macros`就会去导入你指定的 `macro` 模块或者npm包。

那么 `macro` 文件里面要包含什么内容呢？如下:

```js
const {createMacro} = require('babel-plugin-macros')

module.exports = createMacro(({references, state, babel}) => {
  // ... macro 逻辑
})
```

`macro` 文件必须导出一个由 `ceateMacro` 创建的实例, 在其回调中可以获取到一些关键对象：

- `babel` 和普通的Babel插件一样，Macro可以获取到一个 `babel-core` 对象
- `state` 这个我们也比较熟悉，Babel插件的 visitor 方法第二个参数就是它, 我们可以通过它获取一些配置信息以及保存一些状态
- `references` 获取Macro的所有引用。上一篇文章介绍了作用域，你应该还没忘记绑定和引用的概念

假设用户这样子使用你的 Macro:

```js
import foo, {bar, baz as Baz} from './my.macro' // 创建三个绑定

// 下面开始引用这些绑定
foo(1)
foo(2)

bar`by tagged Template`
;<Baz>by JSX</Baz>
```

那么你将拿到`references`结构是这样的：

```js
{
  // key 为'绑定', value 为'引用数组'
  default: [NodePath/*Identifier(foo)*/, NodePath/*Identifier(foo)*/], // 默认导出，即foo
  bar: [NodePath/*Identifier(bar)*/],
  baz: [NodePath/*JSXIdentifier(Baz)*/], // 注意key为baz，不是Baz
}
```

> [AST Explorer](https://astexplorer.net) 也支持 babel-plugin-macros，可以玩一下

接下来你就可以遍历`references`, 对这些节点进行转换，实现你想要的宏功能。开始实战

<br>

### 实战

<br>

## 扩展资料

- [Zero-config code transformation with babel-plugin-macros](https://babeljs.io/blog/2017/09/11/zero-config-with-babel-macros)
- [RFC - babel-macros](https://github.com/facebook/create-react-app/issues/2730)
- [STOP WRITING JAVASCRIPT COMPILERS! MAKE MACROS INSTEAD](https://jlongster.com/Stop-Writing-JavaScript-Compilers--Make-Macros-Instead)
- [JavaScript玩转Clojure大法之 - Macro (1)](https://blog.oyanglul.us/javascript/clojure-essence-in-javascript-macro)
- [Elixir Macro](https://elixir-lang.org/getting-started/meta/macros.html)
- [Rust 的宏](https://kaisery.gitbooks.io/rust-book-chinese/content/content/Macros%20宏.html)
- [iOS深思篇 | 宏定义](https://juejin.im/post/5cebce946fb9a07ece67aec4)
- [How does Elixir compile/execute code?](https://medium.com/@fxn/how-does-elixir-compile-execute-code-c1b36c9ec8cf)
- [让这世界再多一份 GNU m4 教程 (1)](https://segmentfault.com/a/1190000004104696)
- [宏语言为何不受欢迎](https://segmentfault.com/a/1190000004050807)
- [awesome-babel](https://github.com/babel/awesome-babel)
