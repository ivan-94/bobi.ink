---
title: "如何学一门新语言，以 Dart 为例"
date: 2019/11/23
categories: 前端
---

世界上没有一种可以各个领域通吃的语言，为了应对不同的场景和需求，我们摆脱不了要学习一门新的语言。最近准备入坑 `Flutter`(技术储备)，学了点 Dart, 一点心得分享给大家。

<br>

**大纲**



- [介绍](#介绍)
  - [1. 假定前提](#1-假定前提)
  - [2. 基本原则](#2-基本原则)
  - [3. 基本姿势](#3-基本姿势)
- [已有的语言认知](#已有的语言认知)
- [建立标签云](#建立标签云)
- [刻意学习，以 Dart 为例](#刻意学习以-dart-为例)
  - [① 2018 最坑人语言?](#①-2018-最坑人语言)
  - [② 针对客户端优化](#②-针对客户端优化)
  - [③ 面向对象](#③-面向对象)
  - [④ 操作符](#④-操作符)
  - [⑤ const/final 与静态数据](#⑤-constfinal-与静态数据)
  - [⑥ 类型系统](#⑥-类型系统)
  - [⑦ 异步异步](#⑦-异步异步)
  - [⑧ 元编程](#⑧-元编程)
- [实践](#实践)
- [深入了解这门语言](#深入了解这门语言)
- [总结](#总结)
- [扩展](#扩展)



<br>

## 介绍

### 1. 假定前提

我想看这篇文章的应该都是程序员了吧？都有自己熟悉的语言，这就好办了，我们可以复用已有的认知去快速学习一门新语言。如果你是小白，这篇文章可能不适合你

<br>

### 2. 基本原则

- **确定语言的定位和场景**。别再说 PHP 是最好的语言了，大家都知道。每一门语言都有自己定位和适用场景，为了解决不同的问题。**所以学习一门语言的时候，首先要了解语言的定位和领域，这样你才能明白为什么语言设计者设计某个特性的动机**。例如:

  - `JavaScript`：浏览器脚本语言霸主, 写前端肯定绕不开 JavaScript 啦。一门十几天搞出来的语言，就不要问 `[] == ![] // true` 是什么动机了, 不要学这些糟粕。
  - `Dart`： 针对客户端('Flutter')优化语言, 当初号称要取代 JavaScript, 官方自己的定位就是客户端
  - `Go`： 据说是 `C++` 编译速度慢倒逼出来的语言。所以你可以站在 C++ 的对立面去思考它的设计：例如 简单的语法、高速编译、垃圾回收、高性能、高并发。半数是为了解决 C++ 的问题。适用于服务器编程、分布式、网络编程、云平台。
  - `Rust`： 系统编程语言，`C/C++` 最有力的挑战者

  <br>

  当然，也有一些语言只有在特定平台或场景才能使用，这种没办法，这属于**商业壁垒**。例如

  - `Swift/Objective-C` 基本只能用于 Apple 平台，尽管 Swift 开源，也可以跑在 Linux 上，但除了 Apple 应用开发，很少看到 Swift 的身影
  - `C#` 和 Swift 类似

  <br>

- **不要陷入语言的语法细节，剥离掉语法糖**。学习新语言，可以暂时忽略掉语法的细节, 切换到上帝视角

- **基于原有的认知，横向进行比较**。正常来说编程语言 80% 概念或范式是通用的，这就是为什么你熟悉一门语言，可以快速入门其他语言。

- **打破认知**。另外 20% 包含该门语言独有的特性和思想, 这才是我们需要关注的核心。

<br>

### 3. 基本姿势

- **确定自己要解决的问题/场景**。 我们学一门语言一般不是为了学习语言而学习。首先你应该有需要解决场景和问题，接着带着这些问题对编程语言进行选型，确定多个语言候选者。
- **思考这些语言是怎么解决你的问题的？** 这就是'打破认知'的过程, 分析一下这些候选者优缺点
- **确定要学习这门语言了？** 下文会按照这个步骤展开
  + **建立标签云**。收集这门语言的 20% 独有特性/思想, 例如 Killer Feature、槽点、吹点，针对性刻意进行学习。
  + **粗略过一下官方文档**。 也就是那80%，对基本语法有个基本的印象，类比自己熟悉的语言，可以快速理解。
  + **开始实践**。现在你这门语言建立初步的印象了。趁热开始实践，比如可以跟着官方入门教程。一边实践一边查阅文档，很快就能熟练起来
  + **深入了解这门语言**

<br>
<br>

## 已有的语言认知

下面是常见编程语言的构成图谱，对照一下，这些概念是否都知道? 是否真的了解你用来吃饭的家伙?

<br>

![](https://bobi.ink/images/learn-lang/langmind.png)

<br>

没看懂？看来你没学过一门真正(复杂)的语言，如 `Scala`、`C嘎嘎`，`Rust`。😺 翻过这些大山，其他的就是一览众山小了。太难了

小孩子才做选择，牛逼(有精力)的人是全都要。你也可以学几门比较有代表性语言。参考[《七天七语言》](https://book.douban.com/subject/10555435/)开始点技能树:

- **按市场划分**:
  + 通用类型语言(用来吃饭的)。 例如 Java、JavaScript、Python、C/C++、Go、PHP、Objective-C/Swift(iOS开发者, 严格说不算‘通用’)
  + 符合自己口味的小众语言。Rust、Elixir、Ruby、Kotlin、Clojure、OCaml...

- **按范式划分**:
  + 面向对象: 例如 Ruby、Java、Python...
  + 多范式: 例如 JavaScript、Scala、Rust...
  + 函数式: 例如 Lisp(例如Clojure)、Erlang、Haskell...
  + 过程式: 例如 C、Go(可以算是面向对象、Whatever)
  + 原型语言: Io，好小众

- **其他划分方式**:
  + 类型: 强类型、弱类型; 静态类型、动态类型
  + 执行方式: 静态语言、脚本语言
  + 系统层次: 系统编程语言、应用语言

<br>
<br>

## 建立标签云

上文说了，80% 的知识是可以复用的，我们要针对另外 20% 该语言独有的特性和思想进行刻意学习。我这里介绍一个方法是建立一个标签云。**这个标签云是对这门语言的一些关键描述**。 例如它的主要特性、优点、吐槽点。

这些关键描述对我们快速了解一门语言有很大的帮助, **这个标签云其实代表的就是你对这门语言的基本印象**。 换句话说，你学了一门语言，但没怎么用，过一段时间就忘光了所有语法细节，但是这门语言的基本印象会长久停留在你脑海中。我想这些印象就是这门语言的精髓所在吧！

那么怎么收集这个标签云?

- 打开官网。看官方怎么描述自己的语言、有哪些主要特性、定位是什么。
- 也可以通过 Wiki 看看这门语言的系统的描述和定义
- 知乎。看别人怎么吹或者吐槽这门语言的
- 道听途说
- 快速预览官方指南。找亮点

随便举几个例子。 Dart 语言:

![](https://bobi.ink/images/learn-lang/dart.png)

> 标签云使用 [WordClouds](https://www.wordclouds.com) 生成

<br>

Go 语言：

![](https://bobi.ink/images/learn-lang/go.png)

<br>

Javascript:

![](https://bobi.ink/images/learn-lang/javascript.png)

<br>

Elixir:

![](https://bobi.ink/images/learn-lang/elixir.png)

<br>
<br>

## 刻意学习，以 Dart 为例

接着带着这些问题针对性地去学习这门语言, 这里以Dart 为例，因为这两天正好在学 Dart，准备入坑 Flutter，我自己对 Dart 没什么好感。

学习方法, 永远是 **What / Why / How**: 是什么，为什么这么设计，具体怎么做?

### ① 2018 最坑人语言?

没有 Flutter 这门语言确实要挂了。编程语言也要看爹

<br>

### ② 针对客户端优化

这是官方自己的定位。

针对客户端优化主要体现在`开发体验`和`运行性能`上面

- `JIT`(Just in Time) 快速编译生效，这是 Hot reload 基础。**Hot reload 可以让 Flutter 接近 Web 的开发体验**
- `AOT`(Ahead of Time) 生成高效原生代码。可以得到更快的运行速度和启动速度
- 另外一层意思是，Dart 这门语言和 JavaScript 非常相似。比如语法、单线程/事件循环、事件驱动、async/await、Isolate、Generator、Future/Stream、collection if/for 可以媲美JSX
- 支持编译到JavaScript。浏览器是重要的客户端，不支持 JavaScript 还敢说客户端优化？

<br>

### ③ 面向对象

语法和 Java 很像，有一些语法糖挺甜的。

- 没有关键字区分 class 和 interface，可以说 class 就是 interface

- `Mixins`。前端对 Mixin 的概念应该都不陌生，毕竟这么多人用 Vue?

- 操作符重载。Javascript 不支持操作符重载。所以对前端来说算是一个新东西。 不过个人不推荐，JavaScript 没有操作符重载不也用得挺爽？ 而且操作符的语义不明确，会徒增心智负担，这时候还不如使用定义良好的方法。**有意义的名称比符号要好记忆**。

- `new` 可选。在某些场景让代码更简洁，比如 Flutter 组件声明。算是弥补没有 JSX 之痛吧。

  ```dart
  void main() {
    runApp(
      Center(
        child: Text(
          'Hello, world!',
          textDirection: TextDirection.ltr,
        ),
      ),
    );
  }
  ```

- `Callable Classes`。语法糖，没想到有什么应用场景。

  ```dart
  class WannabeFunction {
    call(String a, String b, String c) => '$a $b $c!';
  }

  var wf = new WannabeFunction();
  var out = wf("Hi","there,","gang"); // 🍬
  ```

  我直接 `wf.call` 也不麻烦吧? 灵感来自JavaScript？ JavaScript 的函数也是一个对象，可以有自己属性

<br>

### ④ 操作符

Dart 也有一些有趣的操作符/表达式，来看看有多甜：

- **级联操作符(Cascade Notation)**。级联操作符是一个很甜的语法糖。不说废话，看代码:

  ```dart
  querySelector('#confirm') // Get an object.
  ..text = 'Confirm' // 🍬 甜点，这是类 jQuery 的串行调用的增强版
  ..classes.add('important')
  ..onClick.listen((e) => window.alert('Confirmed!'));
  ```

  等价于:

  ```dart
  var button = querySelector('#confirm');
  button.text = 'Confirm';
  button.classes.add('important');
  button.onClick.listen((e) => window.alert('Confirmed!'));
  ```

<br>

- **容器操作符(Collection Operators)**。这个语法糖也会比较甜，前期用 Dart 来描述 Flutter 的视图是一件很痛苦的事情。Dart 陆续添加了一些甜点，如`展开操作符`、`Collection if/for`, 再加上`命名函数参数`和 `new可选`，表达力已经很接近 JSX 了

  ```dart
  [0, ...list];
  [0, ...?list]; // 支持识别null的展开操作符

  // collection if
  var nav = [
    'Home',
    'Furniture',
    'Plants',
    if (promoActive) 'Outlet'
  ];

  // collection for
  var listOfStrings = [
    '#0',
    for (var i in listOfInts) '#$i'
  ];
  ```

  <br>

  ![](https://bobi.ink/images/learn-lang/flutter-code.png)

<br>

### ⑤ const/final 与静态数据

在 dart 中 const/final 使用的地方非常多，可以用于修饰变量、实例变量、对象创建。

> 注意：静态数据和不可变数据是不同的概念

- 变量修饰

```dart
final name = 'Bob';
const bar = 100000;
const foo = [];
const baz = [];

console.log(foo == baz); // true 编译时常量
```

const 将被视为'编译时'常量。相对final 有所优化

<br>

- 修饰对象创建

```dart
var foo = const [];
```

const 修饰变量创建，Dart 会默认以 const 的上下文来实例化对象:

```dart
const primaryColors = [
  Color("red", [255, 0, 0]),
  Color("green", [0, 255, 0]),
  Color("blue", [0, 0, 255]),
];
```

primaryColor被修饰 const 修饰，那么其下的对象创建都隐式使用 const 修饰。上面的代码等价于:

```dart
const primaryColors = const [
  const Color("red", const [255, 0, 0]),
  const Color("green", const [0, 255, 0]),
  const Color("blue", const [0, 0, 255]),
];
```

**Dart 内置的容器对象默认支持const**。 对于自定义类，需要类提供**const构造方法**, 而且所有实例都必须使用final修饰。

```dart
class ImmutablePoint {
  static final ImmutablePoint origin =
      const ImmutablePoint(0, 0);
  // 所有实例变量都必须用final修饰
  final num x, y;
  // const 构造方法
  const ImmutablePoint(this.x, this.y);
}
```

<br>

### ⑥ 类型系统

- 名义类型。没有Duck Duck Duck 🦆🦆🦆

- Sound Type System(soundness，严格类型系统)。即**静态类型+运行时检查**, 比如一个变量静态类型为 String，如果将int赋值给它，编译器会报错。但是通过某些手段，我们可以绕过编译器检查，例如强制类型转换。Sound Type System 可以在运行时进行类型检查，不会放过这些错误。

  ```dart
  main(List<String> args) {
    int a;
    a = "1" as int; // 绕过了静态类型检查, 但是运行会报错
  }
  ```

  好处:

  + 代码更健壮
  + 有利于AOT
  + 尽可能消灭bug，编译阶段的漏网之鱼，也会被检测出来，不要抱着侥幸心理。

- dynamic：可以视作是any类型吧？尽量避免使用

<br>

### ⑦ 异步异步

Future/Stream、async/await、Generator。不必多说，熟悉 JavaScript 一看就懂

<br>

### ⑧ 元编程

- MetaData。和Java的注解差不多。顾名思义，MetaData就是给你的代码提供更多的信息。可以用于提示编译器，在运行时通过反射库也可以获取到MetaData信息。

  ```dart
  class SmartTelevision extends Television {
    @override
    void turnOn() {...}
    // ···
  }
  ```

- `noSuchMethod()`。类似于 Ruby 的 method_missing。 当未找到属性或者方法时被调用，可以实现一些动态属性或方法。元编程神器。在 JavaScript 中可以通过Proxy 实现相同的效果。

<br>
<br>

说实话，Dart 没有什么多少让人眼前一亮的特性。在它身上你可以看到许多其他语言的影子、例如Java、JavaScript、Swift... 这也无可厚非，现代编程语言确实长得越来越像。

好处是它特别容易上手，坏处是除了 Flutter 绑定之外，我找不到其他可以用它的理由。

<br>
<br>

## 实践

借助已有的经验，很快就可以入门，这时候能马上上手去写是最好的。

可以从Hello World 开始, 或者也可以从官方的入门教程开始。Dart 的话。

hello world !

```dart
void main(List<String> args) {
  print('Hello, World!');
}
```

通过最简单的 hello world 也可以获知一些关键信息:

- 类似 C 的前缀式类型声明。
- main 程序入口
- 分号不能省略
- 标准库。print 来源于 `dart:core` 这个包是全局的
- List 数组
- 泛型
- ...

<br>

Flutter 搞起来！

<br>
<br>

## 深入了解这门语言

如果你喜欢这门语言，想要让你们的关系进一步发展，你就要深入了解它：

- 了解它的最佳实践
- 阅读它的语言规范
- 造轮子。比如写个静态网页生成器; 如果是面向对象语言，可以实现几个常见的设计模式
- 学习标准库
- 了解实现原理
- 了解性能分析和优化

<br>
<br>

## 总结

编程语言也有三重境界:

**看山是山，看山不是山，看山还是山**

- ① 我用的语言就是最好的语言，如 PHP，很牛逼
- ② 所有语言都差不多，本质都是一样
- ③ 回归到语言，语言不过是个工具。就像画家的画笔，不过是实现自己想法的一个工具。这个阶段，我们不再争执什么是最好的语言，而且为了不同的绘制效果选择不同的画笔。

只要能解决我们需要解决的问题，编程语言从来不是门槛，或者说它是最容易被克服的问题。就像别人吐槽 Flutter 用 Dart 而不用JavaScript一样。

<br>
<br>

## 扩展

- [七周七语言](https://book.douban.com/subject/10555435/)
- [Wiki: Comparison of programming languages](https://en.wikipedia.org/wiki/Comparison_of_programming_languages)
- [Dart 官方文档](https://dart.dev/guides/language/language-tour#libraries-and-visibility)
