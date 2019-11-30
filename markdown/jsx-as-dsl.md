---
title: 'JSX AS DSL? 写个 Mock API 服务器看看'
date: 2019/11/29
categories: 前端
---

这几天打算写一个简单的 API Mock 服务器。我视图寻找一种更简洁、方便、同时又可以灵活扩展的方式，来定义各种 Mock API。本文会深入讨论 JavaScript 的 DSL 能力以及常见的表现形式, 接着揭示 JSX 在领域问题描述的优势和潜力。当然这里可不是空谈，我们会实际写一个项目来证实这个判断。

<br>

**文章大纲**



- [1. 现有的配置方案](#1-现有的配置方案)
  - [1.1 配置文件形式](#11-配置文件形式)
  - [1.2 编程语言与 DSL](#12-编程语言与-dsl)
- [2. 如何用 JavaScript 来组织描述领域问题？](#2-如何用-javascript-来组织描述领域问题)
  - [2.1 对象形式](#21-对象形式)
  - [2.2 链式调用形式](#22-链式调用形式)
  - [2.3 ES2015 Template Tag](#23-es2015-template-tag)
  - [2.4 要不试试 JSX？](#24-要不试试-jsx)
- [3. JSX 入门](#3-jsx-入门)
  - [3.1 自定义工厂](#31-自定义工厂)
  - [3.2 Host Component vs Custom Component](#32-host-component-vs-custom-component)
  - [3.3 简单实现 createElement 工厂方法](#33-简单实现-createelement-工厂方法)
- [4. 基础组件的设计](#4-基础组件的设计)
  - [4.1 来源于 Koa 的灵感](#41-来源于-koa-的灵感)
  - [4.2 use 基础组件](#42-use-基础组件)
  - [4.3 高层组件的封装](#43-高层组件的封装)
- [5. 浅谈原理](#5-浅谈原理)
  - [5.1 '渲染'](#51-渲染)
  - [5.2 运行](#52-运行)
- [6. 总结，终于完事了](#6-总结终于完事了)
- [7. 扩展](#7-扩展)



<br>

## 1. 现有的配置方案

先来看看现在常见的前端工具是怎么进行配置的。

### 1.1 配置文件形式

**JSON?**

JSON 是一种非常简单的数据表述, 没有任何学习成本，解析也非常方便。但是它有非常多致命的缺陷，比如不支持注释、冗余、数据结构单一。

**YAML?**

相比 JSON 语法要简洁很多、可读性也比较强。作为一个配置文件形式非常优秀

**还是其他配置文件形式...**

通常这些配置文件都是语言无关的，所以不会包含特定语言的元素。换句话说配置文件形式数据是静态的。 所以灵活性、扩展性比较差。只适合简单的配置场景。

举个简单例子，这些配置文件不支持函数。我们的 Mock 服务器可能会直接通过一个函数来动态处理请求，所以配置文件在这里并不适用。

<br>

### 1.2 编程语言与 DSL

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

## 2. 如何用 JavaScript 来组织描述领域问题？

上节提到了 Groovy、Ruby ‘适合‘ 用作 DSL 母体，并不代表一定要用它们实现，只是说明它们天生具备的一些语言特性可以让实现更加便捷，或者说表现更加简洁。

Google 搜一把 ‘JavaScript DSL‘ 匹配的有效资料很少。 如果你觉得困惑那就应该回到问题本身，对于 DSL 来说，最重要的是解决领域问题，至于怎么组织以及实现形式则是次要的。所以不要去纠结 JavaScript 适不适合。

那我们就针对 Mock Server 这个具体领域，看一看 JavaScript 内部 DSL 的典型组织方式。

<br>

### 2.1 对象形式

最简单的方式是直接基于对象或者数组进行声明，实现简单又保持组织性。例如 [Umi Mock](https://umijs.org/zh/guide/mock-data.html#使用-umi-的-mock-功能) 还有 [飞冰](https://ice.work), 就是基于对象组织的:

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
<br>

### 2.2 链式调用形式

JavaScript 作为内部 DSL 的另外一种典型的形式是链式调用。

其中最出名的是 JQuery, 它让链式调用这种方式广为人知。相比啰嗦的原生 DOM 操作代码，JQuery 确实让人眼前一亮, 它帮我们屏蔽了底层 DOM 操作细节，抚平平台差异，暴露精简的 API，同时保持灵活性和扩展性。这才是它真正流行的原因，没人乐于复杂的东西。

```js
$('.awesome')
  .addClass('flash')
  .draggable()
  .css('color', 'red')
```

<br>

JQuery 这种 API 模式也影响到了其他领域，比如 [`Ruff`](https://ruff.io/zh-cn/docs/getting-started.html):

```js
$.ready(function(error) {
  if (error) {
    console.log(error)
    return
  }

  // 点亮灯
  $('#led-r').turnOn()
})
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
<br>

### 2.3 ES2015 Template Tag

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

### 2.4 要不试试 JSX？

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

看起来不错？哈？我们看到了 JSX 作为 DSL 的潜力，也把 React 的组件思维搬到了 GUI 之外的领域。

你知道我的风格，篇幅较长 ☕️ 休息一会，再往下看。

<br>
<br>

## 3. JSX 入门

如果你是 React 的开发者，JSX 应该再熟悉不过了。它不过是一个语法糖，但是它目前不是 JavaScript 标准的一部分。Babel、Typescript 都支持转译 JSX。

例如

```js
const jsx = (
  <div foo="bar">
    <span>1</span>
    <span>2</span>
    <Custom>custom element</Custom>
  </div>
)
```

会转译为:

```js
const jsx = React.createElement(
  'div',
  {
    foo: 'bar',
  },
  React.createElement('span', null, '1'),
  React.createElement('span', null, '2'),
  React.createElement(Custom, null, 'custom element')
)
```

<br>

### 3.1 自定义工厂

JSX 需要一个**工厂方法**来创建创建节点实例。默认是 `React.createElement`。我们可以通过注释配置来提示转译插件。按照习惯，自定义工厂都命名为 `h`:

```js
/* @jsx h */
/* @jsxFrag 'fragment' */
import { h } from 'somelib'

const jsx = (
  <div foo="bar">
    <span>1</span>
    <span>2</span>
    <>fragement</>
  </div>
)
```

将转译为:

```js
import { h } from 'somelib'

const jsx = h(
  'div',
  {
    foo: 'bar',
  },
  h('span', null, '1'),
  h('span', null, '2'),
  h('fragment', null, 'fragement')
)
```

<br>

### 3.2 Host Component vs Custom Component

JSX 会区分两种组件类型。小写开头的为内置组件，它们以字符串的形式传入 CreateElement; 大写开头的表示自定义组件, 作用域内必须存在该变量, 否则会报错。

```js
// 内置组件
;<div />
// 自定义组件
;<Custom />
```

<br>

### 3.3 简单实现 createElement 工厂方法

```js
export function createElement(type, props, ...children) {
  const copy = { ...(props || EMPTY_OBJECT) }
  copy.children = copy.children || (children.length > 1 ? children : children[0])

  return {
    _vnode: true,
    type,
    props: copy,
  }
}
```

<br>
<br>

## 4. 基础组件的设计

### 4.1 来源于 Koa 的灵感

大家应该比较熟悉 koa 中间件机制。

```js
// logger
app.use(async (ctx, next) => {
  await next()
  const rt = ctx.response.get('X-Response-Time')
  console.log(`${ctx.method} ${ctx.url} - ${rt}`)
})

// x-response-time
app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  ctx.set('X-Response-Time', `${ms}ms`)
})

// response
app.use(async ctx => {
  ctx.body = 'Hello World'
})
```

形象的说，它就是一个洋葱模型:

![](https://bobi.ink/images/jsx-as-dsl/koa.png)

<br>

每个中间件调用 next，进入下一级. 如果把函数的边界打破。它的样子确实像洋葱:

![](https://bobi.ink/images/jsx-as-dsl/koa-2.png)

<br>

**我发现使用 JSX 可以更直观地 表示这种洋葱结构**

![](https://bobi.ink/images/jsx-as-dsl/koa-3.png)

<br>
<br>

### 4.2 use 基础组件

于是乎，有了 `<use />` 这个基础组件。它类似于 Koa 的 `app.use`, 用于拦截请求，可以进行响应, 也可以选择进入下一层。

**来看看整体设计**。

use 正是基于上面说的，使用 JSX 来描述中间件包裹层次的基础组件。因为使用的是一种树状结构，所以要区分**兄弟中间件**和**子中间件**:

```js
<server>
  <use m={A}>
    <use m={Aa} /> <use m={Ab} />
  </use>
  <use m={B} />
  <use m={C} />
</server>
```

其中 `Aa`、`Ab` 就是 `A` 的**子中间件**。在 A 中可以调用类似 koa 的 `next` 函数，进入下级中间件匹配。

`A`、`B`、`C`之间就是兄弟中间件。当前继中间件未匹配时，就会执行下一个中间件。

乍一看，这就是 koa 和 express 的结合啊!

<br>

**再看看 Props 设计**

```js
interface UseProps {
  m: (req, res, recurse: () => Promise<boolean>) => Promise<boolean>;
  skip?: boolean;
}
```

- `m`
  - `req`、`res`：Express 的请求对象和响应对象
  - `recurse`：递归执行子级中间件, 类似 koa 的 next。返回一个`Promise<boolean>`, 它将在下级中间件执行完成后 resolve，boolean 表示下级中间件是否匹配。
  - 返回值：返回一个 `Promise<boolean>` 表示当前中间件是否匹配。如果匹配，后续的兄弟中间件将不会被执行。
- `skip`：强制跳过，我们在开发时可能会临时跳过匹配请求，这个有点像单元测试中的 skip

<br>

**看一下运行实例**

假设代码为:

```js
const cb = name => () => {
  console.log(name)
  return false
}

export default (
  <server>
    <use
      m={async (req, res, rec) => {
        console.log('A')
        if (req.path === '/user') await rec() // 如果匹配，则放行，让其递归进入内部
        console.log('end A')
        return false
      }}
    >
      <use m={cb('A-1')}>如果父级匹配，则这里会被执行</use>
      <use m={cb('A-2')}>...</use>
    </use>
    <use m={cb('B')} />
    <use m={cb('C')} />
  </server>
)
```

如果请求的是 '/'，那么打印的是 `A -> end A -> B -> C`；如果请求为 '/user', 那么打印的是 `A -> A-1 -> A-2 -> end A -> B -> C`

<br>

我们的基础组件和 Koa / Express 一样，核心保持非常小而简洁，当然它也比较低级，这样能够保证扩展性和灵活性。

**这个简单的基础组件设计就是整个框架的‘基石’**。 如果你了解 Koa 和 Express，这里没有新的东西。只是换了一种表现方式。

<br>
<br>

### 4.3 高层组件的封装

Ok, 有了 use 这个基础原语, 我可以做很多有意思的事情，使用组件化的思维封装出更高级的 API。

**① `<Log>`：打日志**

封装一个最简单的组件:

```js
export const Log: Component = props => {
  return (
    <use
      m={async (req, res, rec) => {
        const start = Date.now()
        // 进入下一级
        const rtn = await rec()
        console.log(`${req.method} ${req.path}: ${Date.now() - start}ms`)
        return rtn
      }}
    >
      {props.children}
    </use>
  )
}
```

用法:

```jsx
<server>
  <Log>
    <Get>hello world</Get>
    <Post path="/login">login sucess</Post>
    ...
  </Log>
</server>
```

<br>
<br>

**② `<NotFound>`: 404**

404 页面

```js
export const NotFound = props => {
  const { children, onNotFound } = props
  return (
    <use
      m={async (req, res, rec) => {
        const found = await rec()
        if (!found) {
          // 下级未匹配
          if (onNotFound) {
            onNotFound(req, res)
          } else {
            res.status(404)
            res.send('Not Found')
          }
        }
        return true
      }}
    >
      {children}
    </use>
  )
}
```

用法和 Log 一样。recurse 返回 false 时，表示下级没有匹配到请求。

<br>
<br>

**③ `<Catch>`: 异常处理**

```js
export const Catch: Component = props => {
  return (
    <use
      m={async (req, res, rec) => {
        try {
          return await rec()
        } catch (err) {
          res.status(500)
          res.send(err.message)
          return true
        }
      }}
    >
      {props.children}
    </use>
  )
}
```

用法和 Log 一样。捕获下级中间件的异常。

<br>
<br>

**④ `<Match>`: 请求匹配**

Match 组件也是一个非常基础的组件，其他高层组件都是基于它来实现。它用于匹配请求，并作出响应。先来看看 Props 设计：

```js
export type CustomResponder =
  | MiddlewareMatcher
  | MockType
  | boolean
  | string
  | number
  | object
  | null
  | undefined

export interface MatchProps {
  match?: (req: Request, res: Response) => boolean // 请求匹配
  headers?: StringRecord // 默认响应报头
  code?: number | string // 默认响应码
  // children 类型则比较复杂, 可以是原始类型、对象、Mock对象、自定义响应函数，以及下级中间件
  children?: ComponentChildren | CustomResponder
}
```

<br>

Match 组件主体:

```js
export const Match = (props: MatchProps) => {
  const { match, skip, children } = props
  // 对 children 进行转换
  let response = generateCustomResponder(children, props)

  return (
    <use
      skip={skip}
      m={async (req, res, rec) => {
        // 检查是否匹配
        if (match ? match(req, res) : true) {
          if (response) {
            return response(req, res, rec)
          }
          // 如果没有响应器，则将控制权交给下级组件
          return rec()
        }

        return false
      }}
    >
      {children}
    </use>
  )
}
```

限于篇幅，Match 的具体细节可以看[这里](https://github.com/ivan-94/jsxmock/blob/master/src/components/Match.tsx)

前进，前进。 `Get`、`Post`、`Delete`、`MatchByJSON`、`MatchBySearch` 都是在 `Match` 基础上封装了，这里就不展开了。

<br>
<br>

**⑤ `<Delay>`: 延迟响应**

太兴奋了，一不小心又写得老长，我可以去写小册了。Ok, 最后一个例子, 在 Mock API 会有模拟延迟响应的场景。对于我们来说实现很简单:

```js
export const Delay = (props: DelayProps) => {
  const { timeout = 3000, ...other } = props
  return (
    <use
      m={async (req, res, rec) => {
        await new Promise(res => setTimeout(res, timeout))
        return rec()
      }}
    >
      <Match {...other} />
    </use>
  )
}
```

用法：

```js
<Get path="/delay">
  {/* 延迟 5s 返回 */}
  <Delay timeout={5000}>Delay Delay...</Delay>
</Get>
```

坚持到这里不容易，你对它的原理可能感兴趣，那不妨看下去。

<br>
<br>

## 5. 浅谈原理

简单看一下实现。如果了解过 React 或者 Virtual-DOM 的实现原理。这一切就很好理解了。

### 5.1 '渲染'

这是打了引号的'渲染'。这只是一种习惯的称谓，并不是指它会渲染成 GUI。它用来展开整颗 JSX 树。对于我们来说很简单，我们没有所谓的更新或者 UI 渲染相关的东西。只需递归这个树、收集我们需要的东西即可。

我们的目的是收集到所有的中间件，以及它们的嵌套关系。我们用 Middlewares 这个树形数据结构来存储它们：

```js
export interface Middlewares {
  m: Middleware           // 中间件函数
  skip: boolean           // 是否跳过
  children: Middlewares[] // 子级中间件
}
```

渲染函数:

```js
let currentMiddlewares
export function render(vnode) {
  // ...
  // 创建根中间件
  const middlewares = (currentMiddlewares = createMiddlewares())
  // 挂载
  const tree = mount(vnode)
  // ...
}
```

<br>

挂载是一个递归的过程，这个过程中，遇到`自定义组件`我们就展开，遇到 use 组件就将它们收集到 `currentMiddlewares` 中:

```js
function mount(vnode) {
  let prevMiddlewares
  if (typeof vnode.type === 'function') {
    // 🔴自定义组件展开
    const rtn = vnode.type(vnode.props)
    if (rtn != null) {
      // 递归挂载自定义组件的渲染结果
      mount(rtn, inst)
    }
  } else if (typeof vnode.type === 'string') {
    // 内置组件
    if (vnode.type === 'use') {
      // 🔴收集中间件
      const md = createMiddlewares(inst.props.m)
      md.skip = !!inst.props.skip
      currentMiddlewares.children.push(md)

      // 保存父级中间件
      prevMiddlewares = currentMiddlewares
      currentMiddlewares = md // ⬇️推入栈，下级的中间件将加入这个列表
    } else {
      // ... 其他内置组件
    }

    // 🔴递归挂载子级节点
    mountChilren(inst.props.children, inst)

    if (vnode.type === 'use') {
      currentMiddlewares = prevMiddlewares // ⬆️弹出栈
    }
  }
}

// 🔴 子节点列表挂载
function mountChilren(children: any, parent: Instance) {
  childrenToArray(children).forEach(mount)
}
```

<br>
<br>

### 5.2 运行

现在看看怎么运行起来。我们实现了一个简单的中间件机制，相对 Koa 好理解一点：

```js
export async function runMiddlewares(req, res, current): Promise<boolean> {
  const { m, skip, children } = current
  if (skip) {
    // 跳过, 直接返回 false
    return false
  }
  // 调用中间件
  return m(req, res, async () => {
    // recurse 回调
    // 如果有下级中间件，则递归调用子级中间件
    if (children && children.length) {
      for (const child of children) {
        const matched = await runMiddlewares(req, res, child)
        if (matched) {
          // 如果其中一个兄弟中间件匹配，后续的中间件都不会被执行
          return true
        }
      }
    }

    return false // 没有下级中间件，或者没有任何下级中间件匹配
  })
}
```

很简单哈？ 就是递归递归递归

<br>
<br>

## 6. 总结，终于完事了

本文从配置文件讲到 DSL，又讲到了 JavaScript 的 DSL 表达形式和能力。最后将焦点聚集在了 JSX 上面。

我通过一个实战的案例展示了 JSX 和 React 的组件化思维，它不仅仅适用于描述用户界面，我们也看到 JSX 作为一种 DSL 的潜力和灵活性。

最后总结一下优缺点。

<br>

**✅ 优点**

- 更好的类型推断和约束。对 Typescript 友好
- 可组合性。组件封装和组合能力, 可以轻易封装高级、易于使用的接口
- Just Javascript。 本身就是 JavaScript 代码，很灵活
- 更好的组织性、媲美配置文件。JSX 语法类似于 XML，有规范的组织方式。
- 习惯。 如果你习惯 React，Vue 这类前端框架，JSX 配置方式很容易被接受和上手
- 实现简单。
- 更能直观地表现层级结构。比如表示中间件的洋葱结构
- 模块化。与生俱来，可以将接口分发到不同的文件中，然后可轻易地组合起来。

<br>

**⚠️ 缺点**

- 代码需要转译。需要 Babel 和 Typescript 转译。
- 有点 Verbose。

<br>

**灵活却有组织性**。灵活通常容易导致杂乱无章，组织性则可能意味着牺牲灵活性，两者在某种意义上面看是矛盾的。能够将两者平衡案例其实很少见，JSX 可能是一个。（我好像在吹 🐂）

<br>

代码已经在 Github 开源, 目前正处于原型阶段: [ivan-94/jsxmock](https://github.com/ivan-94/jsxmock) 欢迎 ⭐️ 和贡献。

<br>
<br>

## 7. 扩展

- [DSL 的误区](https://www.yinwang.org/blog-cn/2017/05/25/dsl)
- [谈谈 DSL 以及 DSL 的应用（以 CocoaPods 为例）](https://draveness.me/dsl)
- [JavaScript DSL 示例](https://www.phodal.com/blog/javascript-dsl-example/)
- [你是如何构建 Web 前端 Mock Server 的？](https://www.zhihu.com/question/35436669)
- [使用 svrx 实现更优雅的接口 Mock](https://docs.svrx.io/zh/blog/mock.html)

<br>

![](https://bobi.ink/images/sponsor.jpg)

<br>
