---
title: "国庆还有人看吗？就一次，深入浅出Babel"
date: 2019/10/1
categories: 前端
---

慢慢的干货，赶紧点赞呗

<!-- TOC -->

- [Babel 的处理流程](#babel-的处理流程)
- [Babel 的架构](#babel-的架构)
- [访问者模式](#访问者模式)
  - [节点的遍历](#节点的遍历)
  - [节点的上下文](#节点的上下文)
  - [副作用的处理](#副作用的处理)
  - [作用域的处理](#作用域的处理)
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

### 副作用的处理

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

我们可以对AST进行任意的操作，比如删除父节点的兄弟节点、删除第一个子节点, 新增兄弟节点... **当这些操作'污染'了AST树后，访问者需要记录这些状态，，更新Path对象表示的关联关系, 维护正确的遍历顺序，从而保证转译正确的结果**。

<br>

### 作用域的处理

访问者可以确保正确地遍历和修改节点，但是对于转换器来说，另一个比较棘手的是对作用域的处理，这个责任落在了插件开发者的头上。插件开发者必须非常谨慎地处理作用域，不能破坏现有代码的执行逻辑。

```js
const a = 1, b = 2
function add(foo, bar) {
  console.log(a, b)
  return foo + bar
}
```

比如你要将add函数的`foo`标识符修改为`a`, 你就需要**递归**遍历子树，查出`foo`标识符的所有`引用`, 然后替换它。

```js
traverse(ast, {
  // 将第一个参数名转换为a
  FunctionDeclaration(path) {
    const firstParams = path.get('params.0')
    if (firstParams == null) {
      return
    }

    const name = firstParams.node.name
    // 递归遍历，这是插件常用的模式。这样可以避免影响到外部作用域
    path.traverse({
      Identifier(path) {
        if (path.node.name === name) {
          path.replaceWith(t.identifier('a'))
        }
      }
    })
  },
})

console.log(generate(ast).code)
// function add(a, bar) {
//   console.log(a, b);
//   return a + bar;
// }
```

🤯慢着，好像没那么简单，替换成`a`之后, `console.log(a, b)`的行为就被破坏了。所以这里不能用a，得换个标识符, 如`c`. 

这就是转换器需要考虑的作用域问题，AST转换的前提是保证程序的正确性。 我们在添加一个和修改一个`引用`时，需要确保与现有的所有引用不冲突。Babel本身不能检测这类异常，只能依靠插件开发者谨慎处理好作用域绑定。

Javascript采用的是词法作用域, 也就是根据源代码的词法结构来确定作用域：

![](/images/babel/scope.png)

在词法区块(block)中，由新建的变量、函数、类、函数参数等创建的标识符，都属于这个区块作用域. 在Babel中，使用`Scope`对象来表示作用域。
我们可以通过Path对象的`scope`字段来获取当前节点的`Scope`对象. 它的结构如下:

```js
{
  path: NodePath;
  block: Node;         // 所属的词法区块节点, 例如函数节点、条件语句节点
  parentBlock: Node;   // 所属的父级词法区块节点
  parent: Scope;       // ⚛️指向父作用域
  hub: Hub;  
  bindings: { [name: string]: Binding; }; // ⚛️ 该作用域下面的所有绑定(即该作用域创建的标识符)
}
```

`Scope`对象和`Path`对象差不多，它表示了作用域之间的关联关系(通过parent指向父作用域)，收集了作用域下面的所有绑定(bindings), 另外还提供了丰富的方法来对作用域仅限操作。

我们可以通过`bindings`属性获取当前作用域下的所有绑定(即标识符)，它由`Binding`类来表示：

```js
export class Binding {
  identifier: t.Identifier;
  scope: Scope;
  path: NodePath;
  kind: "var" | "let" | "const" | "module";
  referenced: boolean;
  references: number;              // 被引用的数量
  referencePaths: NodePath[];      // ⚛️获取所有应用该标识符的节点路径
  constant: boolean;               // 是否是常量
  constantViolations: NodePath[];
}
```

通过`Binding`对象我们可以确定标识符被引用的情况。

Ok，有了`Scope`和`Binding`, 现在可以安全地进行上面例子的变量重命名操作。 为了更好地展示作用域交互，在上面代码的基础上，我们再增加一下难度：

```js
const a = 1, b = 2
function add(foo, bar) {
  console.log(a, b)
  return () => {
    const a = '1' // 新增了一个变量声明
    return a + (foo + bar)
  }
}
```

现在你要重命名函数参数`foo`, 不仅要考虑`外部的作用域`, 也要考虑下级作用域的变量声明情况，这两者都不能冲突。上面的代码作用域和标识符引用情况如下图所示:

![](/images/babel/scope2.png)

<br>

来吧，接受挑战，我们试着将函数的第一个参数重新命名:

```js
const getUid = () => {
  let uid = 0
  return () => `_${uid++}`
}

const ast = babel.parseSync(code)
traverse(ast, {
  FunctionDeclaration(path) {
    // 获取第一个参数
    const firstParam = path.get('params.0')
    if (firstParam == null) {
      return
    }

    const currentName = firstParam.node.name
    const currentBinding = path.scope.getBinding(currentName)
    const gid = getUid()
    let sname
    // 循环找出没有被占用的变量名
    while(true) {
      sname = gid()

      // 1️⃣首先看一下父作用域是否已定义了该变量
      if (path.scope.parentHasBinding(sname)) {
        continue
      }

      // 2️⃣ 检查当前作用域是否定义了变量
      if (path.scope.hasOwnBinding(sname)) {
        // 已占用
        continue
      }

      //  再检查第一个参数的当前的引用情况,
      // 如果它所在的作用域定义了同名的变量，我们也得放弃
      if (currentBinding.references > 0) {
        let findIt = false
        for (const refNode of currentBinding.referencePaths) {
          if (refNode.scope !== path.scope && refNode.scope.hasBinding(sname)) {
            findIt = true
            break
          }
        }
        if (findIt) {
          continue
        }
      }
      break
    }

    // 开始替换掉
    const i = t.identifier(sname)
    currentBinding.referencePaths.forEach(p => p.replaceWith(i))
    firstParam.replaceWith(i)
  },
})

console.log(generate(ast).code)
// const a = 1,
//       b = 2;

// function add(_0, bar) {
//   console.log(a, b);
//   return () => {
//     const a = '1'; // 新增了一个变量声明

//     return a + (_0 + bar);
//   };
// }
```

上面的例子虽然没有什么实用性，而且还有还有Bug(没考虑到label)，但是正好可以揭示了作用域处理的复杂性。

Babel的`Scope`对象其实提供了一个`generateUid`方法来生成唯一的、不冲突的标识符。我们利用这个方法再简化一下我们的代码:

```js
traverse(ast, {
  FunctionDeclaration(path) {
    const firstParam = path.get('params.0')
    if (firstParam == null) {
      return
    }
    let i = path.scope.generateUidIdentifier('_') // 也可以使用generateUid
    const currentBinding = path.scope.getBinding(firstParam.node.name)
    currentBinding.referencePaths.forEach(p => p.replaceWith(i))
    firstParam.replaceWith(i)
  },
})
```

能不能再短点!

```js
traverse(ast, {
  FunctionDeclaration(path) {
    const firstParam = path.get('params.0')
    if (firstParam == null) {
      return
    }
    let i = path.scope.generateUid('_') // 也可以使用generateUid
    path.scope.rename(firstParam.node.name, i)
  },
})
```

<details>
<summary>
  查看generateUid的实现代码
</summary>

```js
generateUid(name: string = "temp") {
  name = t
    .toIdentifier(name)
    .replace(/^_+/, "")
    .replace(/[0-9]+$/g, "");

  let uid;
  let i = 0;
  do {
    uid = this._generateUid(name, i);
    i++;
  } while (
    this.hasLabel(uid) ||
    this.hasBinding(uid) ||
    this.hasGlobal(uid) ||
    this.hasReference(uid)
  );

  const program = this.getProgramParent();
  program.references[uid] = true;
  program.uids[uid] = true;

  return uid;
}
```

</details>

非常简洁哈？作用域操作最典型的场景是代码压缩，代码压缩会对变量名、函数名等进行压缩... 然而实际上很少的插件场景需要跟作用域进行复杂的交互，所以关于作用域这一块就讲到这里。

<br>

## 搞一个插件呗

等等别走，还没完呢，这才到一半。学了上面得了知识，还是写一个玩具插件试试水吧，

现在打算模仿[babel-plugin-import](https://github.com/ant-design/babel-plugin-import), 写一个极简版插件，实现按需导入. 在这个插件中，我们会将类似这样的导入语句:

```js
import {A, B, C} from 'foo'
```

转换为:

```js
import A from 'foo/A'
import 'foo/A/style.css'
import B from 'foo/B'
import 'foo/B/style.css'
import C from 'foo/C'
import 'foo/C/style.css'
```

先通过[AST Explorer](https://astexplorer.net)看一下导入语句的AST节点结构:

![](/images/babel/import.png)

Ok，我们需要处理`ImportDeclaration`节点类型，将它的specifiers拿出来处理一下。另外如果用户使用了`默认导入`语句，我们将抛出错误，提醒用户不能使用默认导入. 开始吧!

```js
```

封装为Babel插件，并上传到npm

AST进行转换，可以看Babel Handbook

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
