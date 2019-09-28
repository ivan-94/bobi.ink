---
title: "剖析 Babel + babel-macro + 自己写个babel-macro插件"
date: 2019/10/1
categories: 前端
---

## Babel 的架构

我在[透过现象看本质: 常见的前端架构风格和案例](https://juejin.im/post/5d7ffad551882545ff173083) 提及过 Babel 和 Webpack 为了适应负责的定制需求和功能变化，都使用了[微内核](https://juejin.im/post/5d7ffad551882545ff173083#heading-10) 的架构风格。也就是说它们的核心都比较小，大部分功能都是通过插件进行扩展来实现的。

所以在本文的开始，简单地了解一下 Babel 的架构和一些基本概念，对后续文章内容的理解还是有帮助的。

**一图胜千言**。仔细读过我文章的朋友会发现，我的风格就是能用图片说明的就不用文字、能用文字的就不用代码。虽然我的原创文章篇幅都很长，图片还是值得看看的。

![](TODO: 基本结构)

TODO: 流程解析 配图

什么是AST?

它就是一棵对象树，表示代码的结构，例如`console.log('hello world')`会解析成为TODO:, 

JavaScript的语法现在也慢慢变得复杂，而且Babel还支持JSX、Flow、甚至是Typescript。可见AST树的节点类型有多少，其实我们不需要去记住这么多类型、也记不住，可以配合 [`ASTExplorer`](TODO:) 审查解析后的AST树。

怎么对它进行转换？那么多插件，如果每个插件都去遍历一遍，岂不是很低效？ TODO: 引出`访问者模式`

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
- 插件: 打开Babel的源代码，会发现有好几种类型的‘插件’。下文会具体介绍他们的区别
  - 语法
  - 转换
  - 预定义集合
  - 辅助
- 工具
  - @babel/node Node.js CLI 通过它直接运行需要 Babel 处理的JavaScript文件
  - @babel/register Patch NodeJs 的require方法，支持导入需要Babel处理的JavaScript模块
  - @babel/cli CLI工具

### 插件的类型

TODO: 插件的类型

syntax
proposal
transform

preset
helper

## 访问者模式

## 搞一个插件

## 既生 Plugin 何生 Macro?

不是一个层级的
babel-plugin-macro本身也是插件

宏的作用

- 动态生成代码
- 在不影响代码功能的前提下进行代码增强

## 扩展

- [ASTExplorer](https://astexplorer.net/#/KJ8AjD6maa)
- [generator-babel-plugin](https://github.com/babel/generator-babel-plugin)