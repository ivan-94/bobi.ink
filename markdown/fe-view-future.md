---
title: '次世代前端视图框架都在卷啥？'
date: 2023/7/2
categories: 前端
---

![state of JavaScript 2022 满意度排名](https://bobi.ink/images/fe-view-future/Untitled.png)

state of JavaScript 2022 满意度排名

上图是 [State of JavaScript](https://2022.stateofjs.com/zh-Hans/libraries/front-end-frameworks/) 2022 前端框架满意度排名。前三名分别是 `Solid`、`Svelte`、`Qwik`。我们可以称他们为次世代前端框架的三大代表，前辈是 `React`/`Angular`/`Vue`。
目前 React/Augular/Vue 还占据的主流的市场地位， 现在我们还不知道下一个五年、十年谁会成为主流，有可能前辈会被后浪拍死在沙滩上， 也有可能你大爷还是你大爷。

就像编程语言一样，尽管每年都有新的语言诞生，但是撼动主流编程语言的地位谈何容易。在企业级项目中，我们的态度会趋于保守，选型会偏向稳定、可靠、生态完善的技术，因此留给新技术的生存空间并不多。除非是革命性的技术，或者有大厂支撑，否则这些技术或框架只会停留小众圈子内。

> 比如有一点革命性、又有大厂支撑的 Flutter。


<br>

那么从更高的角度看，这些次时代的前端视图框架在卷哪些方向呢？有哪些是革命性的呢?

先说一下本文的结论：

- 整体上视图编程范式已经固化
- 局部上体验上内卷

<br>
<br>

# 视图编程范式固化

从 JQuery 退出历史舞台，再到 React 等占据主流市场。视图的编程范式基本已经稳定下来，不管你在学习什么视图框架，我们接触的概念模型是趋同的，无非是实现的手段、开发体验上各有特色：

- **数据驱动视图**。数据是现代前端框架的核心，视图是数据的映射， `View=f(State)` 这个公式基本成立。
- **声明式视图**。相较于上一代的 jQuery，现代前端框架使用声明式描述视图的结构，即描述结果而不是描述过程。
- **组件化视图**。组件是现代前端框架的第一公民。组件涉及的概念无非是 props、slots、events、ref、Context…

<br>
<br>

# 局部体验内卷

回顾一下 4 年前写的 **[浅谈 React 性能优化的方向](https://juejin.cn/post/6844903865926549511)**，现在看来依旧不过时，各大框架无非也是围绕着这些「方向」来改善。

当然，在「框架内卷」、「既要又要还要」时代，新的框架要脱颖而出并不容易，它既要服务好开发者(`开发体验`)，又要服务好客户(`用户体验`) ， 性能不再是我们选择框架的首要因素。

<br>

以下是笔者总结的，次世代视图框架的内卷方向:

- **用户体验**
  - 性能优化
    - 精细化渲染：这是次世代框架内卷的主要战场，它们的首要目的基本是实现低成本的精细化渲染
      - 预编译方案：代表有 Svelte、Solid
      - 响应式数据：代表有 Svelte、Solid、Vue、Signal(不是框架)
      - 动静分离
  - 并发(Concurrent)：React 在这个方向独枳一树。
  - 去 JavaScript：为了获得更好的首屏体验，各大框架开始「抛弃」JavaScript，都在比拼谁能更快到达用户的眼前，并且是完整可交互的形态。
- **开发体验**
  - Typescript 友好：不支持 Typescript 基本就是 ca
  - 开发工具链/构建体验: Vite、Turbopack… 开发的工具链直接决定了开发体验
  - 开发者工具：框架少不了开发者工具，从 Vue Devtools 再到 [Nuxt Devtools](https://devtools.nuxtjs.org/)，酷炫的开发者工具未来可能都是标配
  - 元框架: 毛坯房不再流行，从前到后、大而全的元框架称为新欢，内卷时代我们只应该关注业务本身。代表有 Nextjs、Nuxtjs

<br>
<br>
<br>

## 精细化渲染

<br>
<br>

### 预编译方案

React、Vue 这些以 Virtual DOM 为主的渲染方式，通常只能做到组件级别的精细化渲染。**而次世代的 Svelte、Solidjs 不约而同地抛弃了 Virtual DOM，采用静态编译的手段，将「声明式」的视图定义，转译为「命令式」的 DOM 操作**。

Svelte

```html
<script>
  let count = 0

  function handleClick() {
    count += 1
  }
</script>

<button on:click="{handleClick}">Clicked {count} {count === 1 ? 'time' : 'times'}</button>
```

编译结果：

```jsx
// ....
function create_fragment(ctx) {
  let button
  let t0
  let t1
  let t2
  let t3_value = /*count*/ (ctx[0] === 1 ? 'time' : 'times') + ''
  let t3
  let mounted
  let dispose

  return {
    c() {
      button = element('button')
      t0 = text('Clicked ')
      t1 = text(/*count*/ ctx[0])
      t2 = space()
      t3 = text(t3_value)
    },
    m(target, anchor) {
      insert(target, button, anchor)
      append(button, t0)
      append(button, t1)
      append(button, t2)
      append(button, t3)

      if (!mounted) {
        dispose = listen(button, 'click', /*handleClick*/ ctx[1])
        mounted = true
      }
    },
    p(ctx, [dirty]) {
      if (dirty & /*count*/ 1) set_data(t1, /*count*/ ctx[0])
      if (
        dirty & /*count*/ 1 &&
        t3_value !== (t3_value = /*count*/ (ctx[0] === 1 ? 'time' : 'times') + '')
      )
        set_data(t3, t3_value)
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(button)
      }

      mounted = false
      dispose()
    },
  }
}

function instance($$self, $$props, $$invalidate) {
  let count = 0

  function handleClick() {
    $$invalidate(0, (count += 1))
  }

  return [count, handleClick]
}

class App extends SvelteComponent {
  constructor(options) {
    super()
    init(this, options, instance, create_fragment, safe_not_equal, {})
  }
}

export default App
```

我们看到，简洁的模板最终被转移成了底层 DOM 操作的命令序列。

我写文章比较喜欢比喻，这种场景让我想到，编程语言对内存的操作，DOM 就是浏览器里面的「内存」：

- Virtual DOM 就是那些那些带 GC 的语言，使用运行时的方案来屏蔽 DOM 的操作细节，这个抽象是有代价的
- 预编译方案则更像 Rust，没有引入运行时 GC, 使用了一套严格的所有权和对象生命周期管理机制，让编译器帮你转换出安全的内存操作代码。
- 手动操作 DOM, 就像 C、C++ 这类底层语言，需要开发者手动管理内存

使用 Svelte/SolidJS 这些方案，可以做到修改某个数据，精细定位并修改 DOM 节点，犹如我们当年手动操作 DOM 这么精细。而 Virtual DOM 方案，只能到组件这一层级，除非你的组件粒度非常细。

<br>
<br>
<br>

### 响应式数据

和精细化渲染脱不开身的还有`响应式数据`。

React 一直被诟病的一点是当某个组件的状态发生变化时，它会以该组件为根，重新渲染整个组件子树，如果要避免不必要的子组件的重渲染，需要开发者手动进行优化(比如 `shouldComponentUpdate`、`PureComponent`、`memo`、`useMemo`/`useCallback`)  。同时你可能会需要使用不可变的数据结构来使得你的组件更容易被优化。

在 Vue 应用中，组件的依赖是在渲染过程中自动追踪的，所以系统能精确知晓哪个组件确实需要被重渲染。

近期比较火热的 signal (信号，Angular、Preact、Qwik、Solid 等框架都引入了该概念)，如果读者是 Vue 或者 MobX 之类的用户， Signal 并不是新的概念。

按 Vue 官方文档的话说：_从根本上说，信号是与 Vue 中的 ref 相同的响应性基础类型。它是一个在访问时跟踪依赖、在变更时触发副作用的值容器。_

不管怎样，响应式数据不过是`观察者模式`的一种实现。相比 React 主导的通过不可变数据的比对来标记重新渲染的范围，响应式数据可以实现更细粒度的绑定；而且响应式的另一项优势是它的可传递性(有些地方称为 `Props 下钻`(Props Drilling))。

<br>
<br>

### 动静分离

Vue 3 就是动静结合的典型代表。在我看来 Vue 深谙中庸之道，在它身上我们很难找出短板。

Vue 的模板是需要静态编译的，这使得它可以像 Svelte 等框架一样，有较大的优化空间；同时保留了 Virtual DOM 和运行时 Reactivity，让它兼顾了灵活和普适性。

基于静态的模板，Vue 3 做了很多优化，笔者将它总结为`动静分离`吧。比如静态提升、更新类型标记、树结构打平，无非都是将模板中的静态部分和动态部分作一些分离，避免一些无意义的更新操作。

更长远的看，受 SolidJS 的启发， Vue 未来可能也会退出 Vapor 模式，不依赖 Virtual DOM 来实现更加精细的渲染。

<br>
<br>
<br>

## 再谈编译时和运行时

编译时和运行时没有优劣之分， 也不能说纯编译的方案就必定是未来的趋势。

这几年除了新的编译时的方案冒出来，宣传自己是未来；也有从编译时的焦油坑里爬出来， 转到运行时方案的，这里面的典型代表就是 Taro。

Taro 2.0 之前采用的是静态编译的方案，即将 ’React‘ 组件转译为小程序原生的代码:

![Untitled](https://bobi.ink/images/fe-view-future/Untitled%201.png)

但是这个转译工作量非常庞大，JSX 的写法千变万化，非常灵活。Taro 只能采用 `穷举` 的方式对 JSX 可能的写法进行了一 一适配，这一部分工作量很大，实际上 Taro 有大量的 Commit 都是为了更完善的支持 JSX 的各种写法。这也是 Taro 官方放弃这种架构的原因。

也就是说 **Taro 也只能覆盖我们常见的 JSX 用法，而且我们必须严格遵循 Taro 规范才能正常通过。**

有非常多的局限：

- 静态的 JSX
- 不支持高阶组件
- 不支持动态组件
- 不支持操作 JSX 的结果
- 不支持 render function
- 不能重新导出组件
- 需要遵循 on*、render* 约束
- 不支持 Context、Fragment、props 展开、forwardRef
- ….

[有太多太多的约束](https://www.notion.so/Taro-React-65161e2a09f648c0ad1c69f314ff3cea?pvs=21)，这已经不是带着镣铐跳舞了，是被五花大绑了。

<br>

使用编译的方案不可避免的和实际运行的代码有较大的 `Gap`，源码和实际运行的代码存在较大的差别会导致什么？

- 比较差的 Debug 体验。
- 比较黑盒。

我们在歌颂编译式的方案，能给我们带来多大的性能提升、带来多么简洁的语法的同时。另一方面，一旦我们进行调试/优化，我们不得不跨越这层 Gap，去了解它转换的逻辑和底层实现。


这是一件挺矛盾的事情，当我们「精通」这些框架的时候，估计我们已经是一个`人肉编译器`了。

Taro 2.x 配合小程序， 这对卧龙凤雏, 可以将整个开发体验拉到地平线以下。

<br>

回到这些『次世代』框架。React/Vue/Angular 这些框架先入为主， 在它们的教育下，我们对前端视图开发的概念和编程范式的认知已经固化。

![Untitled](https://bobi.ink/images/fe-view-future/Untitled%202.png)

比如在笔者看来 Svelte 是违法直觉的。因为 JavaScript 本身并不支持这种语义。Svelte 要支持这种语义需要一个编译器，而作为一个 JavaScript 开发者，我也需要进行心智上的转换。

而 SolidJS 则好很多，目之所及都是我们熟知的东西。尽管编译后可能是一个完全不一样的东西。

> 💡 Vue 曾经也过一个名为**[响应性语法糖](https://cn.vuejs.org/guide/extras/reactivity-transform.html)**的实验性功能来探索这个方向，但最后由于**[这个原因](https://github.com/vuejs/rfcs/discussions/369#discussioncomment-5059028)**，废弃了。这是一次明智的决定

当然，年轻的次世代的前端开发者可能不这么认为，他们毕竟没有经过旧世代框架的先入为主和洗礼，他们更能接受新的开发范式，然后扛起这些旗帜，让它们成为未来主流。

总结。纯编译的方能可以带来更简洁的语法、更多性能优化的空间，甚至也可以隐藏一些跨平台/兼容性的细节。另一方面，源码和实际编译结果之间的 Gap，可能会逼迫开发者成为人肉编译器，尤其在复杂的场景，对开发者的心智负担可能是翻倍的。

对于框架开发者来说，纯编译的方案实现复杂度会更高，这也意味着，会有较高贡献门槛，间接也会影响生态。

<br>
<br>
<br>

## 去 JavaScript

除了精细化渲染，Web 应用的首屏体验也是框架内卷的重要方向，这个主要的发展脉络，笔者在 [现代前端框架的渲染模式](https://juejin.cn/post/7241027834490437669) 一文已经详细介绍，推荐大家读一下：

![Untitled](https://bobi.ink/images/fe-view-future/Untitled%203.png)

这个方向的强有力的代表主要有 Astro(Island Architecture 岛屿架构)、Next.js(React Server Component)、Qwik(Resumable 去 Hydration)。

这些框架基本都是秉承 SSR 优先，在首屏的场景，JavaScript 是「有害」的，为了尽量更少地向浏览器传递 JavaScript，他们绞尽脑汁 ：

- Astro：’静态 HTML‘优先，如果想要 SPA 一样实现复杂的交互，可以申请开启一个岛屿，这个岛屿支持在客户端进行水合和渲染。你可以把岛屿想象成一个 iframe 一样的玩意。
- React Server Component: 划分服务端组件和客户端组件，服务端组件仅在服务端运行，客户端只会看到它的渲染结果，JavaScript 执行代码自然也仅存于服务端。
- Qwik：我要直接革了水合(Hydration)的命，我不需要水合，需要交互的时候，我惰性从服务端拉取事件处理器不就可以了…

不得不说，「去 JavaScript」的各种脑洞要有意思多了。

<br>
<br>

# 总结

本文主要讲了次世代前端框架的内卷方向，目前来看还处于量变的阶段，并没有脱离现在主流框架的心智模型，因此我们上手起来基本不会有障碍。

作为普通开发者，我们可以站在更高的角度去审视这些框架的发展，避免随波逐流和无意义的内卷。

<br>
<br>

# 扩展阅读

- [新时代的 SSR 框架破局者：_qwik_](https://zhuanlan.zhihu.com/p/597473358)
- [Vue 渲染机制](https://cn.vuejs.org/guide/extras/rendering-mechanism.html)
- [Vue 深入响应式系统](https://cn.vuejs.org/guide/extras/reactivity-in-depth.html)
- [State of JavaScript](https://2022.stateofjs.com/zh-Hans/libraries/front-end-frameworks/)
- [浅谈 React 性能优化的方向](https://juejin.cn/post/6844903865926549511)
- [新兴前端框架 Svelte 从入门到原理](https://zhuanlan.zhihu.com/p/350507037)
