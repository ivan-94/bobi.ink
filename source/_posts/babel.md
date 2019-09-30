---
title: "国庆还有人看吗？剖析 Babel + babel-macro + 自己写个babel-macro插件"
date: 2019/10/1
categories: 前端
---

<!-- TOC -->

- [Babel 的处理流程](#babel-的处理流程)
- [Babel 的架构](#babel-的架构)
- [访问者模式](#访问者模式)
  - [节点的遍历](#节点的遍历)
  - [节点的上下文](#节点的上下文)
- [副作用](#副作用)
  - [作用域](#作用域)
- [搞一个插件呗](#搞一个插件呗)
- [既生 Plugin 何生 Macro](#既生-plugin-何生-macro)
- [扩展](#扩展)

<!-- /TOC -->

## Babel 的处理流程

TODO: 流程解析 配图

首先从源码解析(Parsing)开始，解析包含了两个步骤:

**词法解析(Lexical Analysis)**: 词法解析器(Tokenizer)在这个阶段将字符串形式的代码转换为Tokens(令牌). Tokens可以视作是一些语法片段组成的数组. 例如`for (const item of items) {}` 词法解析后的结果如下:

![](/images/babel/tokens.png)

从上图可以看，每个Token中包含了语法片段、位置信息、以及一些类型信息来描述该Token.

<br>

**语法解析(Syntactic Analysis)**: 这个阶段语法解析器(Parser)会把Tokens转换为抽象语法树(Abstract Syntax Tree，AST). 

**什么是AST**?

它就是一棵对象树，用来表示代码的语法结构，例如`console.log('hello world')`会解析成为:

![](/images/babel/ast.png)

`Program`、`CallExpression`、`Identifier`这些表示节点的类型，这些节点类型定义了一些属性来描述节点的信息。 JavaScript的语法现在也慢慢变得复杂，而且Babel还支持JSX、Flow、甚至是Typescript。可见AST树的节点类型有多少，其实我们不需要去记住这么多类型、也记不住，可以配合 [`ASTExplorer`](TODO:) 审查解析后的AST树。

AST是 Babel 转译的核心数据结构，后续的操作都依赖于AST。

<br>

接着就是**转换(Transform)**了，转换阶段会对AST进行遍历，在这个过程中对节点进行增删查改。Babel 几乎所有插件都是在这个阶段工作。

Javascript In Javascript Out, 最后还是要把 AST 转换为字符串形式的Javascript，同时这个阶段还会生成Source Map。

<br>

## Babel 的架构

我在[透过现象看本质: 常见的前端架构风格和案例](https://juejin.im/post/5d7ffad551882545ff173083) 提及过 Babel 和 Webpack 为了适应负责的定制需求和功能变化，都使用了[微内核](https://juejin.im/post/5d7ffad551882545ff173083#heading-10) 的架构风格。也就是说它们的核心都比较小，大部分功能都是通过插件进行扩展来实现的。

所以在本文的开始，简单地了解一下 Babel 的架构和一些基本概念，对后续文章内容的理解还是有帮助的。

**一图胜千言**。仔细读过我文章的朋友会发现，我的风格就是能用图片说明的就不用文字、能用文字的就不用代码。虽然我的原创文章篇幅都很长，图片还是值得看看的。

![](TODO: 基本结构)

Babel 是一个monorepo项目， 不过组织非常清晰，我们就从源码上我们能看到的模块进行一下分类， 配合上面的图让你对Babel有个大概的认识:

- 核心
  - 核心： @babel/core 这也是上面说的‘微内核’架构中的‘内核’。对于Babel来说，这个内核主要干这些事情：
    - 加载和处理配置
    - 加载插件
    - 调用Parser进行语法解析，生成AST
    - 调用Traverse遍历AST，并使用`访问者模式`应用插件对AST进行转换
    - 生成代码，包括SourceMap转换和源代码生成
  - 支撑
    - Parser:  @babel/parser 解析源代码为AST就靠它了。它已经内置支持很多语法，例如JSX、Typescript、Flow、以及最新的ECMAScript规范。目前为了执行效率，parser是[不支持扩展的](https://babeljs.io/docs/en/babel-parser#faq)，由官方进行维护。如果你要支持自定义语法，可以fork它，不过这种场景非常少。
    - Generator: @babel/generator 将AST转换为源代码，支持压缩、sourceMap
    - Traverse: @babel/traverse 实现了`访问者模式`， 对AST进行遍历，`转换插件`会通过它获取感兴趣的AST节点，并对节点继续操作。
    - 辅助
      - @babel/template 一个简单的模板引擎，用于代码模板操作。比如在生成一些辅助代码(helper)时会应用到模板
      - @babel/types AST节点构造和断言
      - @babel/helper-* 一些辅助器，用于辅助插件开发，例如简化AST操作
      - @babel/helper 辅助代码，单纯的语法转换可能无法让代码运行起来，比如低版本浏览器无法识别class关键字，这时候需要添加辅助代码，对class进行模拟。
- 插件: 打开Babel的源代码，会发现有好几种类型的‘插件’。下文会具体介绍他们的区别
  - 语法插件: @babel/plugin-syntax-* 上面说了@babel/parser 已经支持了很多Javascript语法特性，Parser也不支持扩展，因此`plugin-syntax-*`实际上只是用于开启或者配置Parser的某个功能特性。一般用户不需要关心这个，Transform插件里面已经包含了相关的syntax插件。
  - 转换插件: 用于对AST进行转换，来支持你需要的Javascript运行环境. Babel仓库将转换插件划分为两种(只是命名不一样，都是转换插件):
      - @babel/plugin-transform-*: 可以认为是文档的语言特性
      - @babel/plugin-proposal-*: 还在提议阶段的语言特性, 目前有[这些](https://babeljs.io/docs/en/next/plugins#experimental)
  - 预定义集合: @babel/presets-*: 插件集合，可以方便地对插件进行管理。 比如最新的语言特性、stage-3的特性、react、或者自定义。
- 工具
  - @babel/node Node.js CLI 通过它直接运行需要 Babel 处理的JavaScript文件
  - @babel/register Patch NodeJs 的require方法，支持导入需要Babel处理的JavaScript模块
  - @babel/cli CLI工具

## 访问者模式

AST转换器会遍历 AST 树，找出自己感兴趣的节点类型, 再进行操作. 这个过程我们操作DOM树差不多，只不过场景不太一样。AST 遍历和操作一般会使用`访问者模式`。

想象一下，Babel 有那么多插件，如果每个插件自己去遍历AST，对不同的节点进行不同的操作，维护自己的状态. 这样子不仅低效，它们的逻辑分散在各处，会让整个系统变得难以理解和调试， 最后插件之间关系就纠缠不清，乱成一锅粥。

**所以编译器操作AST一般都是使用`访问器模式`，由这个`访问者(Visitor)`来①进行统一的遍历操作，②提供节点的操作方法，③维护节点之间的关系；而转换器只需要定义自己感兴趣的节点类型，当访问者访问到对应节点时，就调用转换器的访问(visit)方法**。

### 节点的遍历

假设我们的代码如下:

```js
function hello(v) {
  console.log('hello' + v + '!')
}
```

解析后的AST结构如下:

```shell
File
  Program (program)
    FunctionDeclaration (body)
      Identifier (id)  #hello
      Identifier (params[0]) #v
      BlockStatement (body)
        ExpressionStatement ([0])
          CallExpression (expression)
            MemberExpression (callee)  #console.log
              Identifier (object)  #console
              Identifier (property)  #log
            BinaryExpression (arguments[0])
              BinaryExpression (left)
                StringLiteral (left)  #'hello'
                Identifier (right)  #v
              StringLiteral (right)  #'!'
```

访问者会以`深度优先`的顺序或者说递归地对AST进行遍历，其调用顺序如下图所示:

![](/images/babel/traver.png)

上图中`绿线`表示进入该节点，`红线`表示离开该节点。下面写一个超简单的访问者来还原上面的遍历过程:

```js
const babel = require('@babel/core')
const traverse = require('@babel/traverse').default

const ast = babel.parseSync(code)

traverse(ast, {
  enter(path) {
    console.log(`enter ${path.type}(${path.key})`)
  },
  exit(path) {
    console.log(`  exit ${path.type}(${path.key})`)
  }
})
```

<details>
<summary> 查看代码执行结果 </summary>

```shell
enter Program(program)
enter FunctionDeclaration(0)
enter Identifier(id)
  exit Identifier(id)
enter Identifier(0)
  exit Identifier(0)
enter BlockStatement(body)
enter ExpressionStatement(0)
enter CallExpression(expression)
enter MemberExpression(callee)
enter Identifier(object)
  exit Identifier(object)
enter Identifier(property)
  exit Identifier(property)
  exit MemberExpression(callee)
enter BinaryExpression(0)
enter BinaryExpression(left)
enter StringLiteral(left)
  exit StringLiteral(left)
enter Identifier(right)
  exit Identifier(right)
  exit BinaryExpression(left)
enter StringLiteral(right)
  exit StringLiteral(right)
  exit BinaryExpression(0)
  exit CallExpression(expression)
  exit ExpressionStatement(0)
  exit BlockStatement(body)
  exit FunctionDeclaration(0)
  exit Program(program)
```

</details>

当访问者进入一个节点时就会调用`enter(进入)`方法，反之离开该节点时会调用`exit(离开)`方法。一般情况下，插件不会直接使用enter方法，只会关注少数几个节点类型，所以访问者参数也可以这样声明:

```js
traverse(ast, {
  Idenfifier(path) {
    console.log(`enter Identifier`)
  },
  CallExpression(path) {
    console.log(`enter CallExpression`)
  },
  // 上面是enter的简写，如果要处理exit，也可以这样
  BinaryExpression: {
    enter(path) {},
    exit(path) {},
  },
  // 更高级的, 使用同一个方法访问多种类型的节点
  "ExportNamedDeclaration|Flow"(path) {}
})
```

**那么插件是怎么被应用的呢？**

Babel会按照插件定义的顺序，来应用访问器方法，比如你注册了多个插件，babelCore 最后传递给访问器的数据结构大概长这样：

```js
{
  Identifier: {
    enter: [plugin1XX, plugin2XX,] // 一个数组形式
  }
}
```

当进入一个节点时，这些插件会按照注册顺序被执行。大部分插件是不需要开发者关心定义的顺序的，有少数的情况需要稍微注意以下，例如`plugin-proposal-decorators`:

```js
{
  "plugins": [
    "@babel/plugin-proposal-decorators",     // 必须在plugin-proposal-class-properties之前
    "@babel/plugin-proposal-class-properties"
  ]
}
```

所有插件定义的顺序，按照惯例，应该是新的或者说实验性的插件在前面，老的/稳定的插件定义在后面。因为可能需要新的插件将AST转换后，老的插件才能识别语法（向后兼容）。下面是官方配置例子, 为了确保先后兼容，`stage-*`阶段的插件最好先执行:

```js
{
  "presets": ["es2015", "react", "stage-2"]
}
```

> 注意Preset的执行顺序相反，详见官方[文档](https://babeljs.io/docs/en/next/plugins#plugin-ordering)

<br>

### 节点的上下文

访问者在访问一个节点, 会无差别地调用 `enter` 方法， 我们怎么知道这个节点的位置呢？

通过上面的代码，读者应该可以猜出几分，每个`visit`方法都接收一个`Path`对象, 你可以将它当做一个‘上下文’对象，类似于`JQuery`的`JQuery`(`const $el = $('.el')`)对象，这里面包含了很多信息：

- 当前节点信息
- 节点的关联信息。父节点、子节点、兄弟节点等等
- 作用域信息
- 上下文信息
- 节点操作方法。节点增删查改
- 断言方法。isXXX, assertXXX

<details>
<summary> 查看它的结构 </summary>

```js
export class NodePath<T = Node> {
    constructor(hub: Hub, parent: Node);
    parent: Node;
    hub: Hub;
    contexts: TraversalContext[];
    data: object;
    shouldSkip: boolean;
    shouldStop: boolean;
    removed: boolean;
    state: any;
    opts: object;
    skipKeys: object;
    parentPath: NodePath;
    context: TraversalContext;
    container: object | object[];
    listKey: string;
    inList: boolean;
    parentKey: string;
    key: string | number;
    node: T;
    scope: Scope;
    type: T extends undefined | null ? string | null : string;
    typeAnnotation: object;
    // ... 还有很多方法，实现增删查改
}
```

</details>

你可以通过这个[手册](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-visitors)来学习怎么通过 Path 来转换 AST. 后面也会有代码示例，这里就不展开细节了

<br>

## 副作用

实际上访问者的工作比我们想象的要复杂的多，上面示范的是静态AST的遍历过程。而AST转换本身是有副作用的，比如插件将旧的节点替换了，那么访问者就没有必要再向下访问旧节点了，而是继续访问新的节点, 代码如下。

```js
traverse(ast, {
  ExpressionStatement(path) {
    const rtn = t.returnStatement(t.binaryExpression('+', t.stringLiteral('hello'), t.identifier('v')))
    path.replaceWith(rtn)
  },
}
```

上面的代码, 将`console.log('hello' + v + '!')`语句替换为`return "hello" + v;`, 下图是遍历的过程：

![](/images/babel/replace.png)

我们可以对AST进行任意的操作，比如删除父节点的兄弟节点、删除第一个子节点, 新增兄弟节点... 当这些操作污染了AST树后，访问者需要记录这些状态，维护正确的遍历顺序，从而保证转译正确的结果。

<br>

### 作用域

上下文，Path

遍历的顺序，
递归顺序

避免副作用

新增的节点，是否会触发重新遍历

作用域，递归转换

遍历的顺序

## 搞一个插件呗

深入学习如果对AST进行转换，可以看Babel Handbook

![]()

babel-plugin-import

## 既生 Plugin 何生 Macro

不是一个层级的
babel-plugin-macro本身也是插件

宏的作用

- 动态生成代码
- 在不影响代码功能的前提下进行代码增强

## 扩展

- [ASTExplorer](https://astexplorer.net/#/KJ8AjD6maa)
- [babel-handbook](https://github.com/jamiebuilds/babel-handbook)
- [generator-babel-plugin](https://github.com/babel/generator-babel-plugin)
