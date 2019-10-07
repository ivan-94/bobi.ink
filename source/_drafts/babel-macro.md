---
title: "深入浅出 Babel 下篇：既生 Plugin 何生 Macros"
date: 2019/7/15
categories: 前端
---

既然文章谈到了宏，那么我们就深入讲讲‘宏’是什么玩意。

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

现在才是正文，一下子拓展得太远了，Babel 主角的风头已经被抢了，

为什么使用vue-cli, 约定大于配置，团队开发工具，parser

不是一个层级的
babel-plugin-macro本身也是插件

宏的作用

- 动态生成代码
- 在不影响代码功能的前提下进行代码增强

必须是合法的Javascript语法

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
