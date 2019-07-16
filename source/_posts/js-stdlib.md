---
title: "Javascript竟然没有标准库?"
date: 2019/7/16
categories: 前端
---

最近在SegmentFault热心解题，一个问题比较让我比较印象深刻：一个初学者试图在浏览器中导入Node.js的net模块。结果就是在控制台打印后是一个空对象。

对于有点Javascript经验的人来说，这是一个‘弱智’问题，怎么可以在浏览器端运行Node程序呢？这里经过[webpack处理](http://webpack.docschina.org/configuration/node/#其他-node-js-核心库-node-js-core-libraries-)所以变成了一个空对象，更好的处理应该是抛出异常.

对于这些刚入门Javascript的或者从其他语言切换过来的，他们压根就没有概念，比如Python、Ruby、Java、Dart这些语言都有强大的标准库，可以满足80%的开发需求，不管它在什么环境、什么平台运行，都可以统一使用这套标准库。

反过来Javascript这门十几天开发出来的，专供浏览器的语言，当初设计是根本就没有考虑标准库这些玩意，比如文件系统，网络等等。因为这个背景, Javascript很多年没有走出浏览器玩具语言这个范围，这既是劣势，也是优势, 现在没任何语言能撼动Javascript的在浏览器中的地位。我想很多人跟我当初一样将浏览器提供的Web API等于Javascript的标准库，正如当年那些把JQuery当成Javascript的人.

直到NodeJS的出现，Javascript才走出浏览器约束，延伸到服务器领域。NodeJS也定义了很多模块来支撑服务器的开发, 如fs、os、Buffer、net。但是这些不是标准的、也就是说NodeJS !== Javascript.

再到后来，学不动了，NodeJS原作者吐槽了一通NodeJS，又搞出了一个[Deno](https://deno.land), 它也会有自己标准库，会定义自己的文件系统、网络API。它的名称就是Deno，所以这些API也不可能和NodeJS兼容。Ok，现在回到文章开始那个问题，说不定哪天又有人尝试在浏览器引用Deno的模块？

## 现有的Javascript API结构

![](/images/js-stdlib/outline.png)

如上图, Javascript其实是有一层比较薄全局的、通用的、**标准的**、核心的API层，即`标准内置对象`，这是一些语言核心的内置对象，可以全局访问。关键的是这些是标准的，它们在[ECMAScript规范](https://tc39.es/ecma262/#sec-global-object)中被定义.

在这个基础之上，不同的运行环境拓展了自己的API。

标准内置对象层主要包含这些东西:

- 特殊值
  - Infinity
  - NaN
  - undefined
  - null
  - globalThis
- 函数
  - eval()
  - uneval() 
  - isFinite()
  - isNaN()
  - parseFloat()
  - parseInt()
  - decodeURI()
  - decodeURIComponent()
  - encodeURI()
  - encodeURIComponent()
- 基础对象
  - Object
  - Function
  - Boolean
  - Symbol
  - Error
  - EvalError
  - InternalError 
  - RangeError
  - ReferenceError
  - SyntaxError
  - TypeError
  - URIError
- 数值和时间
  - Number
  - BigInt
  - Math
  - Date
- 文本处理
  - String
  - RegExp
- 索引容器
  - Array
  - 'TypedArray'
- 键值容器
  - Map
  - Set
  - WeakMap
  - WeakSet
- 结构化数据
  - ArrayBuffer
  - SharedArrayBuffer 
  - Atomics 
  - DataView
  - JSON
- 控制抽象化对象
  - Promise
  - Generator
  - GeneratorFunction
  - AsyncFunction 
- 反射
  - Reflect
  - Proxy
- 国际化
  - Intl
- WebAssembly
- 其他
  - arguments


Dart 100多KB，运行时和标准库

Javascript 不等于浏览器脚本

## 标准的内置对象

浏览器、Node、Worker

我们需要标准库?

安全，npm去中心化

社区割裂

优雅的标准库，是学习的榜样，如Ruby，很多教程都是钻研标准库算法和实现， Java

网络加载
选择困难症，WebComponent的遭遇,
百花齐放，社区驱动
如何设计标准库，Javascript的主要战场还是浏览器, NodeJS已经是事实上的标准

## 标准库的语言提议

参考文献

- [Brendan Eich: JavaScript standard library will stay small](https://www.infoworld.com/article/3048833/brendan-eich-javascript-standard-library-will-stay-small.html)