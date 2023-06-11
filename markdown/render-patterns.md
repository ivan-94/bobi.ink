---
title: '现代前端框架的渲染模式'
date: 2023/6/5
categories: 前端
---

> 本文主要参考的内容来源是[patterns.dev](https://www.patterns.dev/)。这个网站收录了许多实用的前端设计模式，大家赶紧收藏起来！

<br>

React 发布已经十年了，笔者接触前端差不多也有十年时间了。说实话，如果没有 [Head First 系列图书](https://search.douban.com/book/subject_search?search_text=head+first&cat=1001)，我可能都没有走上编程这条道路。

<br>

![Head first](https://bobi.ink/images/render-patterns/Untitled.png)
Head first

<br>

尽管现在看来这系列图书内容可能过时了。

Head First 系列图书让我知道，原来编程也可以这么通俗易懂的，对于刚接触这个领域的同学来说，从这里可以获得很多信心和成就感。
这种风格也一直影响着我，学习和工作、传道授业过程中，我会努力把复杂的事情简化、通俗化，提炼本质。

<br>
<br>

这十年，前端渲染方式一直在演进，我觉得大概可以分为以下三个阶段：

![Untitled](https://bobi.ink/images/render-patterns/Untitled%201.png)

- 传统 SSR: 那时候前端还没有分离，在 JSP、ASP、Ruby on Rails、Django 这些 MVC 框架下，通过模板来渲染页面。jQuery 是这个阶段的主角
- 前后端分离：从 Node.js 发布，到目前为止，是前端发展最迅速的 10 年。
  前后端分离的典型代表是 Angular 和 React、Vue 等框架，我觉得，促进前后端分离的主要原因还是**随着需求的复杂化，分工精细化了**。 前端可以专注于 UI 的设计和交互逻辑。后端只需要提供 API，不需要关心前端的具体实现。
- 同构前端：这几年前端框架的发展进入的深水区，随着云原生、容器技术、Serverless、边缘计算等底层技术设施的普及，也让‘前端’生存范围延展到服务端。前端开始寻求 `UX` 和 `DX` 的平衡点

<br>
<br>
<br>

通过这篇文章，你就可以知道近些年前端渲染模式的演变。

废话不多说，直接开始吧。

<br>
<br>
<br>

## CSR - 客户端渲染

![Untitled](https://bobi.ink/images/render-patterns/Untitled%202.png)

这个我们再熟悉不过了， 即前端页面在浏览器中渲染，服务端仅仅是静态资源服务器(比如 nginx)。

初始的 HTML 文件只是一个空壳，我们需要等待 JavaScript 包加载和执行完毕，才能进行交互，白屏时间比较长。

- 优点
  - 部署简单
  - 页面过渡、功能交互友好
  - 适合复杂交互型应用程序开发
- 缺点
  - `SEO` 不友好
  - 白屏时间长
  - 可能需要复杂的状态管理。时至今日，状态管理方面的轮子还在不停地造

<br>
<br>
<br>

## SSR - 服务端渲染

![Untitled](https://bobi.ink/images/render-patterns/Untitled%203.png)

为了解决 SEO 和白屏问题，各大框架开始支持在服务端渲染 HTML 字符串。

SSR 把数据拉取放到了服务端，因为离数据源比较近，数据拉取的速度会快一点。但这也不是完全没有副作用，因为需要在服务端等待数据就绪, `TTFB(Time to First Byte)` 相比 CSR 会长一点。

SSR 只是给我们准备好了初始的数据和 HTML, 实际上和 CSR 一样，我们还是需要加载完整的`客户端程序`，然后在浏览器端重新渲染一遍(更专业的说是 `Hydration  水合/注水`)，才能让 DOM 有交互能力。

**也就说， `FCP(First Contentful Paint)` 相比 CSR 提前了, 但是 `TTI(Time to Interactive)` 并没有太多差别。只是用户可以更快地看到内容了。**

> hydration 的主要目的是挂载事件处理器、触发副作用等等

优点

- SEO 友好
- 用户可以更快看到内容了

缺点

- 部署环境要求。需要 Nodejs 等 JavaScript 服务端运行环境
- 需要包含完整的 JavaScript 客户端渲染程序，`TTI` 还有改善空间

<br>
<br>
<br>
<br>

## SSG - 静态生成

![Untitled](https://bobi.ink/images/render-patterns/Untitled%204.png)

对于完全静态的页面，比如博客，公司主页等等，也可以使用 SSG 静态渲染。

和 SSR 的区别是，SSG 是在`构建时`渲染的。

和 CSR 一样，因为是静态的，所以在服务端不需要渲染运行时，部署在静态服务器就行了。

VuePress、VitePress、Gatsby、Docusaurus 这些框架都属于 SSG 的范畴。

<br>
<br>

优点

- 相比 SSR, 因为不需要服务端运行时、数据拉取，TTFB/FCP 等都会提前。

缺点

- 和 SSR 一样，也有客户端渲染程序、需要进行 Hydrate。
  对于`内容为中心`的站点来说，实际上并不需要太多交互，客户端程序还有较大压缩的空间。
- 在构建时渲染，如果内容变更，需要重新构建，比较麻烦

<br>
<br>
<br>
<br>

## ISG - 增量静态生成

![Untitled](https://bobi.ink/images/render-patterns/Untitled%205.png)

ISG 是 SSG 的升级版。解决 SSG 内容变更繁琐问题。

ISG 依旧会在构建时预渲染页面，但是这里多出了一个`服务端运行时`，这个运行时会按照一定的过期/刷新策略(通常会使用 **[stale-while-revalidate](https://web.dev/stale-while-revalidate/)** )来重新生成页面。

<br>
<br>
<br>
<br>

## Progressive Hydration - 渐进水合

![Untitled](https://bobi.ink/images/render-patterns/Untitled%206.png)

上文提到，常规的 SSR 通常需要完整加载客户端程序(上图的 bundle.js)，水合之后才能得到可交互页面，这就导致 `TTI` 会偏晚。

最直接的解决办法就是压缩客户端程序的体积。那么自然会想到使用`代码分割`(code splitting)技术。
`渐进式水合 （Progressive Hydration ）` 就是这么来的。

如上图，我们使用`代码分割`的方式，将 Foo、Bar 抽取为`异步组件`，抽取后`主包`的体积下降了，`TTI` 就可以提前了。

而 Foo、Bar 可以按照一定的策略来按需加载和水合，比如在视口可见时、浏览器空闲时，或者交给 `React Concurrent Mode` 根据交互的优先级来加载。

React 18 官方支持了渐进式水合（官方叫 `Selective Hydration`）。

要深入了解 Progress Hydration, 可以看这个[视频](https://www.youtube.com/watch?v=k-A2VfuUROg&t=960s)。

<br>
<br>
<br>

## SSR with streaming - 流式 SSR

![Untitled](https://bobi.ink/images/render-patterns/Untitled%207.png)

这个很好理解。尤其是在最近 `ChatGPT` 这么火。ChatGPT API 有两种响应模式：普通响应、流式响应

- [renderToString](https://react.dev/reference/react-dom/server/renderToString) → 普通响应。即 SSR 会等待完整的 HTML 渲染完毕后，才给客户端发送第一个字节。
- [renderToNodeStream](https://react.dev/reference/react-dom/server/renderToNodeStream) → 流式响应。渲染多少，就发送多少。就像 ChatGPT 聊天消息一样，一个字一个字的蹦，尽管接收完整消息的时间可能差不多，用户体验却相差甚远。

浏览器能够很好地处理 HTML 流，快速地将内容呈现给用户，而不是白屏干等。

下面这张图可以更直观感受两者区别：

![来源：[https://mxstbr.com/thoughts/streaming-ssr/](https://mxstbr.com/thoughts/streaming-ssr/)](https://bobi.ink/images/render-patterns/Untitled%208.png)

来源：[https://mxstbr.com/thoughts/streaming-ssr/](https://mxstbr.com/thoughts/streaming-ssr/)

对于常规的流式 SSR，优化效果可能没有我们想象的那么明显。**因为框架还是得等数据拉取完成之后才能开始渲染**。因此，除非是比较复杂、长序列的 HTML 树，至上而下需要较长时间的渲染，否则效果并不明显。

<br>
<br>

优点

- 相比普通响应，流式响应可以提前 TTFB 和 FCP, 浏览器不用空转等待，可以连续绘制。

缺点

- **数据拉取是 TTFB/FCP 的主要阻塞原因。为了解决这个问题，下文的 `Selective Hydration` 如何巧妙地解决这个问题。**

<br>
<br>
<br>

## Selective Hydration - 选择性水合

![Untitled](https://bobi.ink/images/render-patterns/Untitled%209.png)

`选择性水合（Progressive Hydration）` 是 `渐进式水合(Progressive Hydration)` 和 `流式SSR(SSR with Streaming)` 的升级版。**主要通过选择性地跳过‘`慢组件`’，避免阻塞，来实现更快的 HTML 输出， 从而让流式响应发挥应有的作用。**

> `慢组件`通常指的是：需要异步获取数据、体积较大、或者是计算量比较复杂的组件。

比较典型的`慢组件`是异步数据获取的组件, 如下图，未开启 Selective Hydration 的情况，会等待所有异步任务完成后才开始输出，而 Selective Hydration 可以跳过这些组件，等待它们就绪后，继续输出。

![Untitled](https://bobi.ink/images/render-patterns/Untitled%2010.png)

我们可以在最新的 Next.js(当前是 13.4) 演示一下。

<details>
 <summary>没有开启 Selective Hydration 的 Demo:</summary>

```tsx
function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

/**
 * 获取关键数据
 */
function getCrucialData() {
  return delay(1000).then(() => {
    return {
      data: Math.random(),
    }
  })
}

function getData(time: number) {
  return delay(time).then(() => {
    return {
      data: Math.random(),
    }
  })
}

const Foo = async () => {
  const data = await getData(1000)

  return <div>foo: {data.data}</div>
}

const Bar = async () => {
  const data = await getData(2000)

  return <div>bar: {data.data}</div>
}

/**
 * 页面 🔴
 *
 */
export default async function WithoutSelective() {
  // 获取关键数据
  const crucialData = await getCrucialData()

  return (
    <div>
      <h1>Without Selective</h1>
      <p>This page is rendered without Selective Hydration.</p>
      <p>crucial data: {crucialData.data}</p>
      <Foo></Foo>
      <Bar></Bar>
    </div>
  )
}
```

运行结果：浏览器等待响应的时间为 3s
![Untitled](https://bobi.ink/images/render-patterns/Untitled%2011.png)
即所有`服务端组件（Server Component）` 就绪后才会有实际的内容输出。

</details>

<br>
<br>

开启 Selective Hydration 很简单，我们只需要用 Suspend 包裹起来，提示 React 这可能是一个‘慢组件’，可以跳过他：

```tsx
export default async function WithoutSelective() {
  // 获取关键数据
  const crucialData = await getCrucialData()

  return (
    <div>
      <h1>Without Selective</h1>
      <p>This page is rendered without Selective Hydration.</p>
      <p>crucial data: {crucialData.data}</p>
      <Suspense fallback="foo loading">
        <Foo></Foo>
      </Suspense>
      <Suspense fallback="bar loading">
        <Bar></Bar>
      </Suspense>
    </div>
  )
}
```

<br>

现在来看运行结果：

![Untitled](https://bobi.ink/images/render-patterns/Untitled%2012.png)

明显 TTFB 提前了！但是完整的请求时间没变。

<br>

当 Foo 和 Bar 就绪后，Next.js 会将渲染结果写入流中。怎么做到的？

<br>

看一眼 HTML 就知道了：

![Untitled](https://bobi.ink/images/render-patterns/Untitled%2013.png)

对于`慢组件`，React 会先渲染 Suspend 的 fallback 内容，并留一个插槽。

继续往下看，可以看到 Foo、Bar 的渲染结果：

![Untitled](https://bobi.ink/images/render-patterns/Untitled%2014.png)

接着将渲染结果替换掉插槽。用于后续的水合。

<br>
<br>
<br>

总之，在服务端，Selective Hydration 在 SSR With Streaming 的基础上，通过选择性地跳过一些低优先级的慢组件来优化了 TTFB(主要的，相对于 FCP 等指标也优化了)，更快地向用户呈现页面。

在客户端 Selective Hydration 的运行过程同 Progressive Hydration 。

关于 Selective Hydration 细节，可以阅读以下文章：

- [New in 18: Selective Hydration](https://github.com/reactwg/react-18/discussions/130)
- [New Suspense SSR Architecture in React 18](https://github.com/reactwg/react-18/discussions/37)

<br>
<br>
<br>
<br>

## Islands Architecture - 岛屿架构

![Untitled](https://bobi.ink/images/render-patterns/Untitled%2015.png)

近两年，**去 JavaScript 成为一波小趋势**，这其中的典型代表是 `Islands Architecture` (岛屿架构)和 `React Server Component`(RSC, React 服务端组件)。

它们主张是：**在服务端渲染，然后去掉不必要 JavaScript**

岛屿架构的主要代表是 `Astro`。如上图，Astro 在服务端渲染后，**默认情况下，在客户端侧没有客户端程序和水合的过程。而对于需要 JavaScript 增强，实现动态交互的组件，需要显式标记为岛屿。**

<br>

这有点类似 Progressive Hydration 的意思。但是还是有很大的差别：

- 岛屿是在`去 JavaScript` 这个背景下的交互增强手段。按 Astro 解释是： 你可以将‘岛屿’想象成在一片由*静态（不可交互）的 HTML* 页面中的*动态岛屿*
- 每个岛屿都是独立加载、局部水合。而 Progressive Hydration 是整棵树水合的分支，只不过延后了。
- 岛屿可以框架无关。

<br>

去 JavaScript 后，可以缓解典型的 SSR `TTI` 问题。**但是岛屿架构并不能通吃所有的场景，最擅长的是”内容为中心“的站点，即当静态的页面比重远高于动态比重时，去 JavaScript 的收益才是显著的。**

<br>
<br>
<br>

## React Server Component - React 服务端组件

![Untitled](https://bobi.ink/images/render-patterns/Untitled%2016.png)

在笔者看来，`React Server Component(RSC)` 本质上和岛屿架构的目的是一样的，都是去 JavaScript。只是实现的手段不同。

<br>

这是 Next.js 官方文档的示例图：和岛屿架构类似，对于静态的内容推荐使用 `Server Component (SC),` 而需要交互增强的，可以使用 `Client Component (CC)`。

![Untitled](https://bobi.ink/images/render-patterns/Untitled%2017.png)

<br>

顾名思义，RSC **就是只能在服务端运行的组件**。下面简单对比一下两者的区别：

|                              | Server Component                         | Client Component  |
| ---------------------------- | ---------------------------------------- | ----------------- |
| 运行环境                     | 服务端                                   | - 服务端 + 客户端 |
| - 仅客户端                   |
| JavaScript                   | 服务端组件依赖的相关程序对客户端不可见。 |
| 在这里实现了 ‘去 JavaScript’ | 需要打包分发给客户端                     |
| 水合                         | 不需要水合                               | 需要水合          |
| 支持 async                   | Y                                        | N                 |
| 支持状态(state, context)     | N                                        | Y                 |
| 支持事件、副作用             | N                                        | Y                 |

> RSC 优点类似 React Hooks 出来之前的[函数组件](https://web.archive.org/web/20170621181013/https://facebook.github.io/react/docs/components-and-props.html): 就是一个普通的函数，不能使用 hooks，没有状态，只会被调用一次。

你可以通过 [Next.js 的文档](https://nextjs.org/docs/getting-started/react-essentials)，深入学习 RSC。React 官方的[讨论组](https://github.com/reactwg/server-components/discussions)也是不错的一手学习场地。

<br>
<br>

**那么相比岛屿架构呢？**

优点

- Server Component 和 Client Component 都是 React 框架的组件，尽管有些区别，但是心智模型是统一的。
- React Server Component 是 React 框架下一体化的原生解决方案，支持和 Selective Hydration 配合使用。岛屿架构只是一个架构模式。
- 可以进行更细粒度和更灵活的组合。

缺点

- Server Component 和 Client Component 还是有较大差别，在组合、通信上也有较多限制，需要开发者规划好服务端和客户端的边界。初期有一定上手门槛。
  当然，Islands 可能也有类似的问题。

<br>
<br>
<br>

## 总结

本文篇幅较长，我给大家整理了这些渲染模式的发展历程和关系脉络

![Untitled](https://bobi.ink/images/render-patterns/Untitled%2018.png)

任何技术的迭代都是有其动机和脉络。不推荐大家面向热度编程，大部分情况下，做到‘知其然，也知其所以然’，就足够了。

<br>
<br>
<br>

## 扩展阅读

- [Pattern dev](https://www.patterns.dev/posts/react-selective-hydration)
- [Next.js](https://nextjs.org/docs/getting-started/react-essentials)
- [Next.js Incremental Static RegenerationExamples](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration)
- [reactwg/**server-components**](https://github.com/reactwg/server-components/discussions)
- **[Is 0kb of JavaScript in your Future?](https://dev.to/this-is-learning/is-0kb-of-javascript-in-your-future-48og)**
- [Islands Architecture](https://jasonformat.com/islands-architecture/)
