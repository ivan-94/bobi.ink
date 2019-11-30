---
title: 'JSX AS DSL: 写个 Mock API 服务器'
date: 2019/11/29
categories: 前端
---

这几天打算写一个简单的 API Mock 服务器。我在思考如何用简洁、灵活且方便的方式来满足各种 Mock API 配置需求。

**文章大纲**

<!-- TOC -->

- [现有的方案](#现有的方案)
  - [配置文件形式](#配置文件形式)
  - [编程语言与 DSL](#编程语言与-dsl)
- [如何用 JavaScript 来组织描述领域问题？](#如何用-javascript-来组织描述领域问题)
  - [① 对象形式](#①-对象形式)
  - [② 链式调用形式](#②-链式调用形式)
  - [③ ES2015 Template Tag](#③-es2015-template-tag)
  - [④ 要不试试 JSX？](#④-要不试试-jsx)
- [扩展](#扩展)

<!-- /TOC -->

<br>

## 现有的方案

先来看看现在常见的前端工具是怎么进行配置的。

### 配置文件形式

**JSON?**

JSON 是一种非常简单的数据表述, 没有任何学习成本，解析也非常方便。但是它有非常多致命的缺陷，比如不支持注释、冗余、数据结构单一。

**YAML?**

相比 JSON 语法要简洁很多、可读性也比较强。作为一个配置文件形式非常优秀

**还是其他配置文件形式...**

通常这些配置文件都是语言无关的，所以不会包含特定语言的元素。换句话说配置文件形式数据是静态的。 所以灵活性、扩展性比较差。只适合简单的配置场景。

举个简单例子，这些配置文件不支持函数。我们的 Mock 服务器可能会直接通过一个函数来动态处理请求，所以配置文件在这里并不适用。

<br>

### 编程语言与 DSL

我们需要回到编程语言本身，利用它的编程能力，实现配置文件无法实现的更强大的功能。

但是单纯使用编程语言，命令式的过程描述过于繁琐。所以我们最好针对某一个具体领域的问题进行简化和抽象，给用户提供一个友好的用户界面，让他们声明式地描述他们的领域问题。我们要减少用户对底层细节的依赖，但是同时保持灵活的扩展能力。

没错，我说的就是[**DSL(Domain-specific languages)**](https://zh.wikipedia.org/wiki/领域特定语言):

> DSL 是一种用于描述特定应用领域的计算机语言。DSL 在计算机领域有非常广泛的应用，例如描述 Web 页面的 HTML、数据库查询语言 SQL、正则表达式。
> 相对应的是通用类型语言(GPL, General-Purpose Language)，例如 Java、C++、JavaScript。它们可以用于描述任意的领域逻辑，它们是[图灵完备](https://en.wikipedia.org/wiki/Turing_completeness)的。

<br>

我个人认为 DSL 应该具备这些特性：

- 专注于特定领域。也就是说它的目的非常明确，从而比通用类型语言要简单很多，但是它的边界有时候并不好把握。
- 组织性。它应该方面组织和描述领域问题，关于组织性，配置文件组织性就非常好，比如 JSON，它可以很容易地描述数据结构，没有什么心智负担。另一个典型的例子是单元测试框架，例如 jest，它们使用 describe、it、expect 这些元件，让单元测试更好的组织起来。
- 可读性。它必须是人类可读的、容易理解的。
- 声明式。声明式优于过程式、描述 What 而不是 How。
- 扩展性。很多 DSL 一开始并不关注这一点，因为一开始问题可能并不复杂。问题的领域不是静态不变的，它可能会变大，这时候 DSL 的扩展能力就很关键了。 就比如 HTML，随着前端开发越来越复杂，原有的元素和功能集合已经无法满足需求，所以衍生除了很多组件或者自定义元素方案。不过原本的 DSL 也可以选择保持不变，在这个基础之上再套一层，CSS vs SASS、HTML vs React 就是这样的例子。

<br>

**怎么创建 DSL？**

从头开发一门新语言？No! 成本太高了

一种更优雅的方式是在通用编程语言的基础上进行减法/封装抽象。当然不是所有类型语言都有这个'能力', 比如 Java、C/C++ 就不行，它们的语法太 Verbose 了。但是 Groovy、Ruby、Scala、还有 Elixir 这些语言就可以方面地创建出‘DSL’, 而且它们大部分是动态语言。

它们有的借助宏、有的天生语法就非常适合作为 DSL、有的具备非常强的动态编程能力... 这些因素促就了它们适合作为 DSL 的母体(宿主)。

我们通常也将这种 DSL 称为 Embedded DSL(嵌入式 DSL) 或者 内部 DSL。好处是省去了实现一门语言的复杂性(Parse->Transform->Generate)。

<br>

举两个非常典型的例子:

Java 开发者常用的 [Gradle](https://gradle.org)，基于 Groovy:

```groovy
plugins {
    id 'java-library'
}

repositories {
    jcenter()
}

dependencies {
    api 'org.apache.commons:commons-math3:3.6.1'

    implementation 'com.google.guava:guava:27.0.1-jre'

    testImplementation 'junit:junit:4.12'
}
```

<br>

还有 CocoaPods, 基于 Ruby:

```ruby
source 'http://source.git'
platform :ios, '8.0'

target 'Demo' do
    pod 'AFNetworking'
    pod 'SDWebImage'
    pod 'Masonry'
    pod "Typeset"
    pod 'BlocksKit'
    pod 'Mantle'
    pod 'IQKeyboardManager'
    pod 'IQDropDownTextField'
end
```

<br>

具体的实现细节不在本文的范围之内，还是聊回 JavaScript。

<br>
<br>

## 如何用 JavaScript 来组织描述领域问题？

上节提到了 Groovy、Ruby ‘适合‘ 用作 DSL 母体，并不代表一定要用它们实现，只是说明它们天生具备的一些语言特性可以让实现更加便捷，或者说表现更加简洁。

Google 搜一把 ‘JavaScript DSL‘ 匹配的有效资料很少。 如果你觉得困惑那就应该回到问题本身，对于 DSL 来说，最重要的是解决领域问题，至于怎么组织以及实现形式则是次要的。所以不要去纠结 JavaScript 适不适合。

那我们就针对 Mock Server 这个具体领域，看一看 JavaScript 内部 DSL 的典型组织方式。

<br>

### ① 对象形式

最简单的方式是直接基于对象或者数组，实现简单又保持组织性。例如 [Umi Mock](https://umijs.org/zh/guide/mock-data.html#使用-umi-的-mock-功能) 还有 [飞冰](https://ice.work), 就是基于对象组织的:

```js
export default {
  // 支持值为 Object 和 Array
  'GET /api/users': { users: [1, 2] },

  // GET POST 可省略
  '/api/users/1': { id: 1 },

  // 支持自定义函数，API 参考 express@4
  'POST /api/users/create': (req, res) => {
    res.end('OK')
  },

  // 使用 mockjs 等三方库
  'GET /api/tags': mockjs.mock({
    'list|100': [{ name: '@city', 'value|1-100': 50, 'type|0-2': 1 }],
  }),
}
```

实现和使用都非常简单，简单的 API Mock 场景开箱即用，对于复杂的用法和 API 协议，也可以通过自定义函数进一步封装。

<br>

### ② 链式调用形式

JavaScript 作为内部 DSL 的另外一种典型的形式是链式调用。

其中最出名的是 JQuery, 它让链式调用这种方式广为人知。相比啰嗦的原生 DOM 操作代码，JQuery 确实让人眼前一亮, 它帮我们屏蔽了底层 DOM 操作细节，抚平平台差异，暴露精简的 API，同时保持灵活性和扩展性。这才是它真正流行的原因，没人乐于复杂的东西。

```js
$('.awesome')
  .addClass('flash')
  .draggable()
  .css('color', 'red')
```

<br>

API Mock 服务器领域也有两个这样的例子:

[Nock](https://github.com/nock/nock):

```js
const scope = nock('http://myapp.iriscouch.com')
  .get('/users/1')
  .reply(404)
  .post('/users', {
    username: 'pgte',
    email: 'pedro.teixeira@gmail.com',
  })
  .reply(201, {
    ok: true,
    id: '123ABC',
    rev: '946B7D1C',
  })
  .get('/users/123ABC')
  .reply(200, {
    _id: '123ABC',
    _rev: '946B7D1C',
    username: 'pgte',
    email: 'pedro.teixeira@gmail.com',
  })
```

<br>

还有网易云团队的 [Srvx](https://docs.svrx.io/zh/guide/route.html)

```js
get('/handle(.*)').to.handle(ctx => {
  ctx.body = 'handle'
})
get('/blog(.*)').to.json({ code: 200 })
get('/code(.*)').to.send('code', 201)
get('/json(.*)').to.send({ json: true })
get('/text(.*)').to.send('haha')
get('/html(.*)').to.send('<html>haha</html>')
get('/rewrite:path(.*)').to.rewrite('/query{path}')
get('/redirect:path(.*)').to.redirect('localhost:9002/proxy{path}')
get('/api(.*)').to.proxy('http://mock.server.com/')
get('/test(.*)').to.proxy('http://mock.server.com/', {
  secure: false,
})
get('/test/:id').to.proxy('http://{id}.dynamic.server.com/')
get('/query(.*)').to.handle(ctx => {
  ctx.body = ctx.query
})
get('/header(.*)')
  .to.header({ 'X-From': 'svrx' })
  .json({ user: 'svrx' })
get('/user').to.json({ user: 'svrx' })
get('/sendFile/:path(.*)').to.sendFile('./{path}')
```

你打开 Nock 的 README，会说，Are you killing me? 文档这么长...

<br>

### ③ ES2015 Template Tag

近年基于 ES6 Template Tag 特性引入‘新语言‘到 JavaScript 的库层出不穷。

**因为 ES6 Template Tag 本质上是字符串，所以需要 Parse 和 转换，因此更像是创建一门外部 DSL。不过! 别忘了 Compiler as Framework! 我们可以利用 Babel 插件在编译时提前将它们转换为 JavaScript 代码。**

举几个流行的例子:

[Zebu](https://github.com/modernserf/zebu): 这是一个专门用于解析 Template Tag 的小型编译器, 看看它的一些内置例子:

```js
// 范围
range`1,3 ... (10)` // [1, 3, 5, 7, 9]

// 状态机, 牛逼
const traffic = machine`
  initState: #green
  states: #green | #yellow | #red
  events: #timer
  onTransition: ${state => console.log(state)}

  #green  @ #timer -> #yellow
  #yellow @ #timer -> #red
  #red    @ #timer -> #green
`
traffic.start() // log { type: "green" }
traffic.send({ type: 'timer' }) // log { type: "yellow" }
```

<br>

Jest 表格测试:

```js
describe.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('$a + $b', ({ a, b, expected }) => {
  test(`returns ${expected}`, () => {
    expect(a + b).toBe(expected)
  })

  test(`returned value not be greater than ${expected}`, () => {
    expect(a + b).not.toBeGreaterThan(expected)
  })

  test(`returned value not be less than ${expected}`, () => {
    expect(a + b).not.toBeLessThan(expected)
  })
})
```

<br>

除此之外还有:

- [htm](https://github.com/developit/htm)
- [graphql-tag](https://github.com/apollographql/graphql-tag)
- [styled-components](http://styled-components.com)

<br>
<br>

### ④ 要不试试 JSX？

铺垫了这么多，只是前戏。上面提到这些方案，要么过于简单、要么过于复杂、要么平淡无奇。我将目光投向了 JSX，我发现它可以满足我所有的需求。

先来看看一下我们的 Mock 服务器的原型设计:

```js
import { Get, Post, mock } from 'jsxmock'

export default (
  <server port="4321">
    {/* 首页 */}
    <Get>hello world</Get>
    {/* 登录 */}
    <Post path="/login">login success</Post>
    <Get path="/json">{{ id: 1 }}</Get>
    <Get path="/mockjs">{mock({ 'id|+1': 1, name: '@name' })}</Get>
    <Get path="/user/:id">
      {(req, res) => {
        /*自定义逻辑*/
      }}
    </Get>
  </server>
)
```

<br>

嵌套匹配场景

```js
export default (
  <server>
    <Get path="/api">
      {/* 匹配 /api?method=foo */}
      <MatchBySearch key="method" value="foo">
        foo
      </MatchBySearch>
      {/* 匹配 /api?method=bar */}
      <MatchBySearch key="method" value="bar">
        bar
      </MatchBySearch>
      <BlackHole>我会吃掉任何请求</BlackHole>
    </Get>
  </server>
)
```

<br>

有点 Verbose? 进一步封装组件:

```js
const MyAwesomeAPI = props => {
  const { path = '/api', children } = props
  return (
    <Get path={path}>
      {Object.keys(children).map(name => (
        <MatchBySearch key="method" value={name}>
          {children[name]}
        </MatchBySearch>
      ))}
    </Get>
  )
}

export default (
  <server>
    <MyAwesomeAPI>{{ foo: 'foo', bar: 'bar' }}</MyAwesomeAPI>
    <MyAwesomeAPI path="/api-2">{{ hello: 'foo', world: 'bar' }}</MyAwesomeAPI>
  </server>
)
```

<br>

看起来不错？哈？我们看到了 JSX 作为 DSL 的潜力，也把React的组件思维搬到了 GUI 之外的领域。

你知道我的风格，篇幅较长 ☕️ 休息一会，再往下看。

<br>
<br>

## 扩展

- [DSL 的误区](https://www.yinwang.org/blog-cn/2017/05/25/dsl)
- [谈谈 DSL 以及 DSL 的应用（以 CocoaPods 为例）](https://draveness.me/dsl)
- [JavaScript DSL 示例](https://www.phodal.com/blog/javascript-dsl-example/)
- [你是如何构建 Web 前端 Mock Server 的？](https://www.zhihu.com/question/35436669)
- [使用 svrx 实现更优雅的接口 Mock](https://docs.svrx.io/zh/blog/mock.html)
