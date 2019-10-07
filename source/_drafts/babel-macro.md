---
title: "深入浅出 Babel 下篇：既生 Plugin 何生 Macros"
date: 2019/7/15
categories: 前端
---

既然文章谈到了宏，那么我们就深入讲讲‘宏’是什么玩意。

## 关于宏

[Wiki](https://zh.wikipedia.org/wiki/巨集)上面对‘宏’的定义是：**宏(Macro), 是一种批处理的称谓，它根据一系列的预定义规则转换一定的文本模式。`解释器`或`编译器`在遇到宏时会自动进行这一模式转换，这个转换过程被称为“宏展开(Macro Expansion)”。对于编译语言，宏展开在编译时发生，进行宏展开的工具常被称为宏展开器。**

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

这种宏很容易理解，因为它们只是纯文本替换。所以相对而言，这种形式的宏能力有限，它也不会检验语法是否合法, 使用它经常会出现问题。所以随着现代编程语言表达能力越来越强，这些语言都不推荐使用宏，而是使用语言本身的机制(如函数)来解决问题，这样更安全、更容易理解和调试. 所以反过来推导，之所以`C`语言需要宏，正是因为`C`语言的表达能力太弱了。

<br>

宏的概念

C语言的宏
函数式语言的宏

宏越强大，相比正常的程序可能就越远，比正常程序要更难以驾驭，你可能需要一定的成本去学习和理解它,  所以宏是最后的招数.

Elixir官方教程里面就有一句话：**显式好于隐式，清晰的代码优于简洁的代码(Clear code is better than concise code)**

hygiene

Elixir macros have late resolution. This guarantees that a variable defined inside a quote won’t conflict with a variable defined in the context where that macro is expanded.

## 既生 Plugin 何生 Macro

为什么使用vue-cli, 约定大于配置，团队开发工具，parser

不是一个层级的
babel-plugin-macro本身也是插件

宏的作用

- 动态生成代码
- 在不影响代码功能的前提下进行代码增强

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
