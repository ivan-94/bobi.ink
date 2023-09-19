---
title: "CodeMod 代码重构/升级必知必会"
date: 2023/9/19
categories: 前端
---

![Cover](/images/codemod/Untitled.jpeg)

`CodeMod`(Code Modification) 的应用场景非常多，我在过去几年就使用 ‘codemod‘ 升级过多个项目，节省了大量的人力成本：

- 将原生微信小程序转换到 Taro; 后面又从 Taro 2 升级到 Taro 3
- Sonar / Eslint 问题修复。
- 前端多语言自动提取
- …

除此之外，codemod 也可以用在以下场景：

- 框架升级，比如 Next.js 升级、Vue 3 升级
- 语言升级，将废弃的旧语法替换从新语法
- 代码格式化
- API 重构
- 代码检查等等

如果你有这方面的需求，那这篇文章很适合你。

<br>

---

<br>

前置知识：你需要对编译原理有基本了解，如果你感到吃力，可以看看我之前写的文章：**[深入浅出 Babel 上篇：架构和原理 + 实战](https://juejin.cn/post/6844903956905197576#heading-8)**

<br>

**编写一个代码升级/重构程序主要涉及以下环节**:

<br>

![流程](/images/codemod/Untitled.png)

<br>

这里每个环节都有很多库/方案可以选择，比如：

- **文件查找**: 可以使用 `Glob` 通配符库来查找或忽略文件，比如 [node-glob](https://github.com/isaacs/node-glob)、fast-glob、globby 等
- **AST parse**:  这个需要根据特定的语言进行选择。比如 JavaScript 可以选择 `Babel`(推荐)、`Esprima`、`Acorn`、`swc`；CSS 可以使用 `postcss`、`lightning css`；Vue SFC 可以使用其官方的 vue-template-parser 等等。更多方案，可以探索一下 [AST Explorer](https://astexplorer.net/#/KJ8AjD6maa)，这里列举了市面上主流的 Parser
- **AST Transform**: 将 AST 解析出来之后，可以根据自己的需求来改写 AST。不同语言/parser 处理规则会有较大的差异。AST parse 和 transform 可以选择一些工具来简化工作，比如 `Jscodeshift`、`gogocode`，本文接下来会深入讲解这些工具。
- **Code Generate**:  将 AST 转换为代码。**我们要尽可能地维持原有的代码格式，否则代码 Diff 会很难看。**这个阶段可以选择 `recast` 这类方案，它可以尽量维持代码的原有格式；另一种方案就是使用代码格式化工具，比如 `prettier`、`eslint`，也可以最大限度维持代码的格式。
- 写入代码: 调用 fs 写入。

将这些东西串起来，你可能还需要一些库，帮你快速编写命令行工具，例如 yargs、commander、inquirer.js

<br>

接下来我将介绍 codemod 这个领域一些主流的库，这些库都各有所长，有些提供了一整套的流程，有些则提供了更高效的 AST 查找和替换方法。

<br>
<br>

# Recast

[recast](https://github.com/benjamn/recast) 是一个知名的库，很多 CodeMod 工具都是基于它来实现的。我们通常将它作为 JavaScript 的 `AST 转换器`和**`非破坏(nondestructive)代码格式化`**工具来使用。

**简单说就是使用 recast 进行’代码生成‘可以最大程度地保持代码原本的格式**。

> 💡原理： 在解析代码生成 AST 时，Recast 使用其解析器（默认是 Esprima）收集代码的原始格式信息。当你修改 AST 时，Recast 记录了哪些部分的 AST 被修改了。最后在代码生成时，Recast 复用未修改部分的原始代码，然后只为修改过的部分生成新的代码，尽可能地保留原始格式。
> 

它的 API 也非常简单：

```jsx
import { parse, print } from "recast";
console.log(print(parse(source)).code);
```

核心 API 就两个 `parse` 和 `print`。顾名思义，也不用多介绍了。

recast 默认使用的 Parser 是 [Esprima](https://www.npmjs.com/package/esprima),  也允许用户使用其他的 Parser，比如 Babel、Acorn。

<br>

**为什么它能兼容不同的 Parser 呢？**

<br>

兼容不同的 Parser 并不是一件新鲜事，我们在使用 Eslint 时，它也支持自定义 Parser。实际上只要 AST 符合一定的标准就行。

如果深入去挖，会发现 recast 底层就是使用 [ast-types](https://github.com/benjamn/ast-types) 来对 AST 进行表示、查找、操作的。而 ast-types 又是 [Mozilla Parser API](https://udn.realityripple.com/docs/Mozilla/Projects/SpiderMonkey/Parser_API) 规范的实现。

基于 Mozilla Parser API 又发展出了 [EsTree](https://github.com/estree/estree) 这个社区标准，旨在为 ECMAScript 语法树定义一个更为正式的规范，它会随着 JavaScript 语言的演进，不断发展和扩展，以支持新的 ECMAScript 特性。

![ast standard](/images/codemod/Untitled%201.png)

如上图，目前大部分 Parser 都是基于 ESTree 标准的。因此理论上它们都支持作为 recast 的 parser。

对开发者来说，选择不同的 parser 主要基于性能、资源消耗、支持的语言特性等多个方面去权衡。

目前普适性比较强的是 Babel，原因在于支持的语言特性很多，比如 Typescript、Flow 以及最新的 ECMAScript 特性，另外它的生态也比较庞大。

<br>

---

<br>

为了方便开发者使用，recast 也将 [ast-types 的 API](https://github.com/benjamn/ast-types) 重新导出了：

```jsx
// 🔴 类型断言
const n = recast.types.namedTypes;
n.FunctionDeclaration.assert(add);

// 🔴 AST 节点构造器
const b = recast.types.builders;
ast.program.body[0] = b.variableDeclaration("var", [
  b.variableDeclarator(add.id, b.functionExpression(
    null, // Anonymize the function expression.
    add.params,
    add.body
  ))
]);

// 🔴 AST 访问器
recast.types.visit(ast, {
  // This method will be called for any node with .type "MemberExpression":
  visitMemberExpression(path) {
    // Visitor methods receive a single argument, a NodePath object
    // wrapping the node of interest.
    var node = path.node;

    if (
      n.Identifier.check(node.object) &&
      node.object.name === "arguments" &&
      n.Identifier.check(node.property)
    ) {
      assert.notStrictEqual(node.property.name, "callee");
    }

    // It's your responsibility to call this.traverse with some
    // NodePath object (usually the one passed into the visitor
    // method) before the visitor method returns, or return false to
    // indicate that the traversal need not continue any further down
    // this subtree.
    this.traverse(path);
  }
});
```

<br>
<br>
<br>

# Jscodeshift

[jscodeshift](https://github.com/facebook/jscodeshift)  是 Meta 开源的 CodeMod 工具，很多前端框架都是基于它来实现代码升级，比如 Nextjs、storybook、react、antd、vue 等，算是能见度最高的 CodeMod 方案了。

<br>

**一句话来总结 jscodeshift 就是它是一个 CodeMod Runner 和 Recast 的封装**：

- Runner：负责文件的查找、转换、生成的整个流程，还提供了 CLI 和`单元测试套件`。开发者只需要编写转换逻辑即可：
    
    ```jsx
    module.exports = function(fileInfo, api, options) {
      // transform `fileInfo.source` here
      // ...
      // return changed source
      return source;
    };
    ```
   <br>
    
- Recast 封装： jscodeshift 内部的 AST parse、transform、generate 都是基于 recast。

<br>
<br>

在我看来，jscodeshift 比较有趣的是它封装了类似 jQuery 的 AST 查找方法(主要是它的扩展方式、链式调用、集合方法)，可以简化 AST 的查找和转换：

```jsx
// 🔴 recast 原本的查找形式，访问者模式
var ast = recast.parse(src);
recast.visit(ast, {
  visitIdentifier: function(path) {
    // do something with path
    return false;
  }
});

// 🔴 jscodeshift，类似 jquery 支持链式调用
jscodeshift(src)
  .find(jscodeshift.Identifier)
  .forEach(function(path) {
    // do something with path
  });
```

其中核心类是 Collection:

```jsx
class Collection {

  /**
   * @param {Array} paths An array of AST paths
   * @param {Collection} parent A parent collection
   * @param {Array} types An array of types all the paths in the collection
   *  have in common. If not passed, it will be inferred from the paths.
   * @return {Collection}
   */
  constructor(paths, parent, types) {
    this._parent = parent;
    this.__paths = paths;
    this._types = types.length === 0 ? _defaultType : types;
  }

  filter(callback) {
    return new this.constructor(this.__paths.filter(callback), this);
  }

  forEach(callback) {
    this.__paths.forEach(
      (path, i, paths) => callback.call(path, path, i, paths)
    );
    return this;
  }

  some(callback) {}
  every(callback) {}
  map(callback, type) {}
  size() {}
  nodes() {}
  paths() }
  getAST() {  }
  toSource(options) {}
  at(index) {}
  get() {}
}
```

<br>

Collection 的内置方法不过就是一些集合操作，其余的方法都是通过 `registerMethods` 扩展的：

```jsx
// 🔴 固定类型方法
jscodeshift.registerMethods({
  logNames: function() {
    return this.forEach(function(path) {
      console.log(path.node.name);
    });
  }
}, jscodeshift.Identifier);

// 🔴 任意类型方法
jscodeshift.registerMethods({
  findIdentifiers: function() {
    return this.find(jscodeshift.Identifier);
  }
});

jscodeshift(ast).findIdentifiers().logNames();
jscodeshift(ast).logNames(); // error, unless `ast` only consists of Identifier nodes
```

<br>

jscodeshift 内部内置了很多实用的方法，比如 find、closestScope、closest、replaceWith、insertBefore、remove、renameTo 等等。

<br>

借助这些方法，可以写出比较优雅的代码(相比visitor 而言)：

```jsx
api.jscodeshift(fileInfo.source)
    .findVariableDeclarators('foo')
    .renameTo('bar')
    .toSource();
```

这些方法都没有在文档说明，建议读者直接去看源码和它的测试用例。代码并不多，非常适合练手。

<br>
<br>
<br>

# Gogocode

国内阿里妈妈开源的 [gogocode](https://gogocode.io/zh/docs/specification/basic) 用来做 codemod 也是不错的选择，它支持类似`通配符`的语法来进行 AST 树查找，比如：

```jsx
// 1️⃣ 精确查找语句
ast.find('const a = 123');
ast.find('import vue from "vue"')

// 2️⃣ 支持通配符
ast.find('const a = $_$')
ast.find(`function $_$() {}`)
ast.find('sum($_$0, $_$1)')

// 3️⃣ 多项匹配
ast.find('console.log($$$0)')
ast.find('{ text: $_$1, value: $_$2, $$$0 }')
```

<br>

不过你不能真把它当做‘`正则表达式`’，否则你照着官方文档吭哧吭哧搞起来，会踩很多坑，比较挫败。别问为什么，亲身经历。

<br>

不过，如果你理解了背后的原理，就会豁然开朗，从此就会走上阳光大道。

**当你传入一个`选择器`时，gogocode 实际上会将`选择器`也转换为 `AST`, 我们尚且称它为 `Selector AST` 吧，然后再在`源码 AST` 中查找和 `Selector AST` ‘结构吻合’的节点，并收集`匹配信息`**>

<br>

整体过程如下：

![gogocode 原理](/images/codemod/Untitled%202.png)

- 第一步： 将选择器中的`通配符`替换从`特殊字符串`，比如 gogocode 内部就是一个 g123o456g789o, 没有实际的意义，就是为了避免冲突
- 第二步：将选择器解析成 AST，即 Selector AST
- 第三步：在源码 AST 中查找吻合 Selector AST 结构的节点，在匹配的过程中，`$_$` 可以匹配任意值; 而 `$$$` 主要用于匹配序列/数组。这些匹配的信息会被反正 match 对象中，类似正则匹配的`分组捕获`。

<br>

> ⚠️  gogocode 不会去检查通配符分组是否相等，例如 `$_$1 === $_$1`  ,   你可能期望匹配两侧相等的节点，例如 `foo === foo` ,  但是 gogocode 会匹配到所有的全等表达式，例如 `1=== 2`, `foo() === bar`。

<br>

理解这个过程很关键，举一些实际的例子

<br>

示例1️⃣：

```jsx
ast.find('import Vue from "vue"')
```

选择器 parse 出来的 Selector AST 为：

![ast](/images/codemod/Untitled%203.png)

<br>

接下来， gogocode 首先会通过 `recast` 的 `visit` 函数，查找到所有的 `ImportDeclaration` 节点，然后依次递归匹配节点属性，例如：

- importKind 是否是 value?
- source 是否是字符串 vue?
- specifiers：第一项是否为 ImportDefaultSpecifier,   ImportDefaultSpecifier 的 local 是否为 Vue?
- …

<br>
<br>

示例 2️⃣：

```jsx
// 假设源代码如下，这是一个序列表达式(SequenceExpression)
(a, b, c);
```

<br>

AST 结构如下：

![ast](/images/codemod/Untitled%204.png)

我们想要匹配序列表达式中的所有成员，怎么做呢？

```jsx
ast.find('($$$)')
```

<br>

你会发现上面的选择器会将源码的所有`标识符`都匹配出来了。因为 `($$$)` 最终 parse 识别出来的不是`序列表达式`，而是 `Identifier`(`()` 在这里没有实际意义)，因此会查找出来所有的标识符。

<br>

最终解决办法是：

```jsx
ast.find('($_$, $$$)')
```

这个选择器 parse 出来就是 SequenceExpression 节点啦。

<br>
<br>
<br>

示例 3️⃣

再举一个比较反直觉的例子，假设我们想要通过 `ast.find('function $_$() {}')`  查找所有函数定义:

```jsx
function a() {}
function b() {}
(function c() {});
(function () {});
```

猜一下会匹配到哪些函数?

答案是：

```jsx
function a() {} // ✅
function b() {} // ✅
(function c() {}); // ❌
(function () {}); // ❌
```

为什么？

 
<br>

---

<br>
<br>

Ok，通过上面的讲解，你应该知道 gogocode 选择器的能力边界了。**也就是说选择器必须也是合法的 JavaScript 代码，并且它只能进行简单的结构匹配**。

<br>

另外，gogocode 的 find 方法也支持直接传入 AST 对象结构来匹配查找，如果你不想使用上面的字符串形式的选择器，或者处在歧义时，可以试试它：

```jsx
const importer = script.find({
    type: 'ImportDeclaration',
    source: {
      type: 'StringLiteral',
      value: '@wakeadmin/i18n',
    },
  });
```

<br>

因为 gogocode 底层就是 Babel 和 Recast,  如果你需要处理更复杂的场景，可以直接使用它们提供的 visit 或 traverse 等方法。

**gogocode 还提供了很多便利的 API,  还支持 Vue，可以直接去看它的文档。**

**不过文档比较一般，整个使用的过程中并不舒畅，而且遗憾的是目前开发也不活跃了。🙏**

<br>
<br>

# AST Grep

如果你比较喜欢 gogocode 这种`通配符`查找/替换的语法，那就不得不给你安利一下 **[ast-grep](https://ast-grep.github.io/guide/introduction.html)：**

```bash
$ sg --pattern '$PROP && $PROP()' --lang ts TypeScript/src # path to TS source
$ sg --pattern 'var code = $PAT' --rewrite 'let code = $PAT' --lang js
```

ast-grep 可以认为是 grep 命令的升级版，支持多种主流的编程语言，支持对代码进行查找、Lint、和重写。查找语法和上文介绍的 gogocode 差不多，通配符规则更加严谨，文档也写得很棒👍。

<br>

ast-grep 足矣满足大部分简单的代码替换工作，比如取代 VsCode、WebStorm 这些编辑器的代码查找/替换功能。

复杂的代码升级/重构，涉及到的查找规则会比较多，可能还有副作用处理(比如注入import 语句)，还是老老实实用前面介绍的方案吧。

<br>
<br>

# 总结

![金字塔分层](/images/codemod/Untitled%205.png)

其实到最后比拼的是谁能更优雅、更快捷地进行 AST 查找和转换，如上图的金字塔所示，上层的方案需要写的代码更少。如果你有更复杂的需求，也可以回退到底层 Parser 提供的 visit 访问器。

<br>


以下是一些横向对比：

|  | 定位/亮点 | Parser | 查找/转换 | 代码生成 |
| --- | --- | --- | --- | --- |
| Babel | 通用的 Javascript 编译器。主要用于转译最新的(包括实验性的) JavaScript 语言特性，并且支持 Typescript、Flow、JSX 等非标准语法 | @babel/parser | 基于 visit 访问器模式。 | @babel/generator。无法保证原代码格式 |
| recast | 非破坏性的代码生成 | 默认 https://esprima.org/, 也支持 Babel 等 estree 标准的 AST | 使用 ast-types 的 visit 方法，也是访问器模式。查找和转换的过程和 Babel 类似 | 可以保留原有代码格式 |
| jscodeshift | codemod runner、recast wrapper。 | 基于 recast | 类 jquery 方法，可扩展 | 基于 recast |
| gogocode | codemod runner、recast wrapper、AST 模式匹配 | 基于 recast，默认使用 Babel；另外还支持 Vue、html | 类 jquery 方法，支持模式匹配 | 基于 recast |
| ast-grep | AST 模式匹配和替换；rust 高性能； | [tree-sitter](https://tree-sitter.github.io/tree-sitter/), 支持多种语言 | 模式匹配 |  |

<br>
<br>
<br>

# 扩展阅读

- [ast-types](https://github.com/benjamn/ast-types)
- [gogocode](https://github.com/thx/gogocode)
- [estree](https://github.com/estree/estree)
- [Parser API](https://udn.realityripple.com/docs/Mozilla/Projects/SpiderMonkey/Parser_API)
- [AST explorer](https://astexplorer.net/#/KJ8AjD6maa)
- [nextjs-codemod](https://github.com/vercel/next.js/tree/canary/packages/next-codemod)
- [ast-grep](https://ast-grep.github.io/)