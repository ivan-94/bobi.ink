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

如上图, Javascript其实是有一层比较薄全局的、通用的、**标准的**、核心的API层，即`标准内置对象`，这是一些语言核心的内置对象，可以全局访问。关键的是这些是标准的，它们在[ECMAScript规范](https://tc39.es/ecma262/#sec-global-object)中被定义. 在这个基础之上，不同的运行环境拓展了自己的API。

以浏览器为例:

![](/images/js-stdlib/brw.png)

浏览器端的Web API是一个非常复杂API集合，上图总结了一下基本就包含两块东西:

- [Core DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model). DOM是一个通用的技术，不仅仅局限于浏览器，这个规范定义了结构化(structured document)文档的解析和操作规范。定义了基本的节点类型和操作方法。不局限于HTML的操作
- [HTML DOM](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM). 可以认为是Core DOM的扩展，这里面定义了各种HTML元素对象类型、扩展了元素的操作方法，另外还包含了浏览器相关的接口，如XMLHttpRequest。这一块通常也被统称为BOM

WebAPI基本概览:

![](/images/js-stdlib/webAPI.png)

如果你有留心查看MDN文档下面的规范引用，你会发现有些规范引用了[W3C](https://www.w3.org/TR/), 有些则引用了[WHATWG](https://html.spec.whatwg.org/multipage/). 到底谁说了算?

如果你掀开锅盖，就会发现这是一场闹剧. 如果前阵子有关注新闻，会看到这些标题‘WHATWG 击败 W3C，赢得 HTML 和 DOM 的控制权’、'W3C将与WHATWG合作制定最新HTML和DOM规范标准'. 大概可以猜出这两个组织之间的关系. 本文就不扯这些‘八卦’了，相关背景可以看这篇文章[WHATWG 击败 W3C，赢得 HTML 和 DOM 的控制权](https://www.infoq.cn/article/bsvFxt96DOh-SBZphBwJ)

相对而言, 语言层则由ECMAScript规范定义的，比较独立, 近些年成果也比较显著.

<br>

### 标准内置对象层主要包含这些东西

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

这些全局基本对象数量很少, 是每个JavaScript开发者必须掌握的. 只能满足很基本开发需求, 根本不能和其他语言的标准库相比. **当然这和语言的定位也有一定关系，JavaScript最初的定位就是浏览器脚本，谁知道它现在发展得这么快？**

Dart 100多KB，运行时和标准库

Javascript 不等于浏览器脚本

混乱:

没有模块化机制
globalThis

## 什么是标准库?

标准库是什么没有一个规范化的定义，按照Wiki的说法标准库就是**该语言在不同实现中都按例提供的库**, 比如Ruby官方实现和基于JVM的JRuby都应该按照规范实现标准库。我认为标准库应该有以下特征:

- 标准化的，有规范明确定义它的内容和行为
- 可以覆盖大部分使用场景
- 可选的、按需导入. 标准库不是全局的，需要通过模块导入, 非强制性使用

至于标准库需要包含什么内容，可以参考其他语言的实现，比如：

- [go](https://golang.org/pkg/)
- [ruby](http://ruby-doc.org/stdlib-2.6.3/)
- [python](https://docs.python.org/3/library/index.html)

大概分析一下，它们标准库大致都有这些内容：

- 网络协议
- 文件系统
  - 文件系统
  - 流
  - 标准输入输出
  - 二进制处理
- 算法
  - 密码算法
  - 压缩
  - 排序
  - 数学
- 数据持久化和序列化
- 数据结构, 例如树
- 调试/辅助
- 单元测试
- 命令行
- 文档处理
- 设计模式
- 国际化
- 并发执行
  - 进程
  - 线程
  - 协程

大部分语言的核心都很小(C++除外)，我们学一门语言，大部分时间是花在标准库上，但是你会发现这些标准库一般都是大同小异，这就是为什么有经验的开发者可以很快地入手一门语言.

## 我们需要标准库?

显然是需要的，但是要结合当前的背景来辩证地考虑。

有标准库有什么好处?

提供通用、最优的功能，减少第三方模块依赖
社区割裂，抚平不同运行环境的差异
安全，npm去中心化
体积很大, 网络加载、运行性能(C++实现)、解析消耗, 不能在多个应用之间被缓存
选择困难症，
优雅的标准库，是学习的榜样，如Ruby，很多教程都是钻研标准库算法和实现， Java

没有标准库有什么好处?

标准可能跟不上社区, 滞后
WebComponent的遭遇,
百花齐放，社区驱动

如何设计标准库? 标准库推进进程会有什么障碍?

Javascript的主要战场还是浏览器, 针对浏览器端和服务端分离两个标准库?
NodeJS已经是事实上的标准, 怎么兼容现有的生态

如何设计标准库，

## 标准库的语言提议


## 总结

参考文献

- [Brendan Eich: JavaScript standard library will stay small](https://www.infoworld.com/article/3048833/brendan-eich-javascript-standard-library-will-stay-small.html)
- [What if we had a great standard library in JavaScript?](https://medium.com/@thomasfuchs/what-if-we-had-a-great-standard-library-in-javascript-52692342ee3f)
- [W3C](https://www.w3.org/TR/)
- [Web API 索引](https://developer.mozilla.org/en-US/docs/Web/API)
https://javascript.info/browser-environment
https://en.wikipedia.org/wiki/WHATWG
- [HTML 5定稿了？背后还是那场闹剧](https://36kr.com/p/216973)
- [KV Storage: the Web's First Built-in Module](https://developers.google.com/web/updates/2019/03/kv-storage)
- [proposal-javascript-standard-library](https://github.com/tc39/proposal-javascript-standard-library)