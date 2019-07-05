---
title: React性能测量和分析
date: 2019/6/16
categories: 前端
---

上一篇[文章](https://juejin.im/post/5d045350f265da1b695d5bf2)讲了 React 性能优化的一些方向和手段，这篇文章再补充说一下如何进行性能测量和分析, 介绍 React 性能分析的一些工具和方法.

进行任何性能优化的前提是你要找出’性能问题‘，这样才能针对性地进行优化。我觉得对于 React 的性能优化可以分两个阶段:

- **1. 分析阶段**

  - 通过分析器(Profiler)找出重新渲染的组件、重新渲染的次数、以及重新渲染耗费的资源与时间
  - 变动检测. 通过分析器我们可以知道'什么被重新渲染, 重新渲染的代价'，那么变动检测回答的问题就是： ’为什么这些进行了重新渲染?'

- **2. 优化阶段**. 优化阶段我们针对分析阶段抛出的问题进行解决，解决的方法有很多，可以参考本文的姊妹篇<[浅谈React性能优化的方向](https://juejin.im/post/5d045350f265da1b695d5bf2)>

<br>

**本文大纲**



- [分析器](#分析器)
  - [React Devtool](#react-devtool)
    - [高亮更新](#高亮更新)
    - [分析器](#分析器-1)
  - [Chrome Performance 工具](#chrome-performance-工具)
  - [其他工具](#其他工具)
- [变动检测](#变动检测)
  - [props 变动检测](#props-变动检测)
  - [mobx 变动检测](#mobx-变动检测)
  - [Context 变更检测](#context-变更检测)
  - [React Devtool 的 Interactions](#react-devtool-的-interactions)
- [扩展](#扩展)



<br>

下面本文测试的样板代码.

> 推荐点击 Preview 面板的`Open In New Window`, 或者直接点击该[链接](https://igz9h.codesandbox.io/)，在线动手实践

<iframe src="https://codesandbox.io/embed/react-performance-analyze-demo-igz9h?autoresize=1&fontsize=14" title="React-Performance-Analyze-Demo" allow="geolocation; microphone; camera; midi; vr; accelerometer; gyroscope; payment; ambient-light-sensor; encrypted-media" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

[![Edit React-Performance-Analyze-Demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-performance-analyze-demo-igz9h?fontsize=14)

<br>
<br>

## 分析器

分析哪些组件进行了渲染，以及渲染消耗的时间以及资源。主要工具有 React 官方的开发者工具以及 Chrome 的 Performance 工具。

### React Devtool

最先应该使用的肯定是官方提供的开发者工具，React v16.5 引入了新的 Profiler 功能，让分析组件渲染过程变得更加简单，而且可以很直观地查看哪些组件被渲染.

#### 高亮更新

**首先最简单也是最方便的判断组件是否被重新渲染的方式是'高亮更新(Hightlight Updates)'**.

① 开启高亮更新:

![](https://bobi.ink/images/10/hightlight-update.png)

② 运行效果如下:

![](https://bobi.ink/images/10/hightlight-update.gif)

③ 通过高亮更新，基本上可以确定哪些组件被重新渲染. 所以现在我们给 ListItem 加上 React.memo(查看 PureList 示例), 看一下效果:

![](https://bobi.ink/images/10/hightlight-update-pure.gif)

效果非常明显，现在只有递增的 ListItem 会被更新，而且当数组排序时只有 List 组件会被刷新. 所以说‘纯组件’是 React 优化的第一张牌, 也是最有效的一张牌.

<br>
<br>

#### 分析器

如果`高亮更新`无法满足你的需求，比如**你需要知道具体哪些组件被渲染、渲染消耗多少时间、进行了多少次的提交(渲染)等等**, 这时候就需要用到分析器了.

① 首先选择需要收集测量信息的节点(一般默认选中根节点，有一些应用可能存在多个组件树，这时候需要手动选择):

![](https://bobi.ink/images/10/select-profile.png)

② Ok，点击 Record 开始测量

![](https://bobi.ink/images/10/start-record.gif)

<br>

③ 看看测量的结果，先来了解一下 Profiler 面板的基本结构:

![](https://bobi.ink/images/10/profile-outline.png)

- **1️⃣ 这是一个 commit 列表**。commit 列表表示录制期间发生的 commit(可以认为是渲染) 操作，要理解 commit 的意思还需要了解 React 渲染的基本原理.

  在 v16 后 React 组件渲染会分为两个阶段，即 render 和 commit 阶段。

  - **render 阶段决定需要进行哪些变更，比如 DOM**。顾名思义, 这个阶段 React 会调用 render 函数，并将结果和上一次 render 的结果进行 diff, 计算出需要进行变更的操作队列
  - **commit 阶段**。或者称为提交阶段, 在这个阶段会执行 render 阶段 diff 出来的变更请求。比如 DOM 插入、更新、删除、排序等等。在这个阶段 React 还会调用 componentDidMount 和 componentDidUpdate 生命周期函数.

  在 v16 之前，或者在 Preact 这些'类 React' 框架中，并不区分 render 阶段和 commit 阶段，也就说这两个阶段糅合在一起，一边 diff 一边 commit。有兴趣的读者可以看笔者之前写的[从 Preact 中了解组件和 hooks 基本原理](https://juejin.im/post/5cfa29e151882539c33e4f5e)
  <br>

  切换 commit:

  ![](https://bobi.ink/images/10/profile-commit.gif)
  <br>

- **2️⃣ 选择其他图形展示形式**，例如 `Ranked 视图`，这个视图按照渲染消耗时间对组件进行排序：

  ![](https://bobi.ink/images/10/ranked.png)

  <br>

- **3️⃣ 火焰图** 这个图其实就是**组件树**，Profiler 使用颜色来标记哪些组件被重新渲染。**和 commit 列表以及 Ranked 图一样，颜色在这里是有意义的，比如灰色表示没有重新渲染；从渲染消耗的时间上看的话: `黑色 > 黄色 > 蓝色`, 通过 👆Ranked 图可以直观感受到不同颜色之间的意义**

  ![](https://bobi.ink/images/10/profile-framegraph.gif)

  <br>

- **4️⃣ 当前选中组件或者 Commit 的详情**, 可以查看该组件渲染时的 props 和 state

  ![](https://bobi.ink/images/10/profile-props.gif)

  双击具体组件可以详细比对每一次 commit 消耗的时间:

  ![](https://bobi.ink/images/10/profile-component-detail.png)

  <br>

- **5️⃣ 设置**

  另外可以通过设置，筛选 Commit，以及是否显示原生元素:

  ![](https://bobi.ink/images/10/profile-settings.png)

<br>

④ 现在使用 Profiler 来分析一下 PureList 的渲染过程:

![](https://bobi.ink/images/10/profile-demo.png)

<br>

> 关于 Profiler 的详细介绍可以看这篇官方博客<[Introducing the React Profiler](https://zh-hans.reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html)>

<br>
<br>

### Chrome Performance 工具

在 v16.5 之前，我们一般都是利用 Chrome 自带的 Performance 来进行 React 性能测量:

![](https://bobi.ink/images/10/chrome-performance.png)

<br>

React 使用标准的`User Timing API`(所有支持该标准的浏览器都可以用来分析 React)来记录操作，所以我们在 Timings 标签中查看 React 的渲染过程。React 还特意使用 emoji 标记.

相对 React Devtool 而言 Performance 工具可能还不够直观，但是它非常强大，举个例子，**如果说 React-Devtool 是[Fiddler](https://www.telerik.com/fiddler), 那么 Performance 就是[Wireshark](https://www.wireshark.org/). 使用 Performance 可以用来定位一些比较深层次的问题，这可能需要你对 React 的实现原理有一定了解, 就像使用 Wireshark 你需要懂点网络协议一样**

所以说使用 Performance 工具有以下优势:

- 可以测量分析整个渲染的过程细节. 它可以定位某些具体方法的调用过程和消耗, 方便定位一些深层次问题.
- 可以测量分析底层 DOM 的绘制、布局、合成等细节。方便定位浏览器性能问题

其实 Performance 是一个通用的性能检测工具，所以其细节不在本文讨论访问。 详细参考

- [Profiling React performance with React 16 and Chrome Devtools](https://calibreapp.com/blog/react-performance-profiling-optimization/)
- [Chrome 官方的 Performance 使用文档](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/)

<br>

### 其他工具

上面介绍的这些工具基本上已经够用了。社区上还有一些比较流行的工具，不过这些工具迟早/已经要被官方取代(招安)，而且它们也跟不上 React 的更新。

- [react-addons-perf](https://reactjs.org/docs/perf.html) React v16 不支持了，不说了。老版本可用
- [react-perf-devtool](https://github.com/nitin42/react-perf-devtool) 也不活跃了，不推荐使用

<br>

---

<br>

## 变动检测

OK, 我们通过分析工具已经知道我们的应用存在哪些问题了，诊断出了哪些组件被无意义的渲染。下一步操作就是找出组件重新渲染的元凶, 检测为什么组件进行了更新.

**我们先假设我们的组件是一个’纯组件‘，也就是说我们认为只有组件依赖的状态变更时，组件才会重新渲染**. 非纯组件没有讨论的意义，因为只要状态变更或父级变更他都会重新渲染。

**那么对于一个’纯组件‘来说，一般会有下面这些因素都可能导致组件重新渲染**:

- **props + state** 毫无疑问. 这里我们只需要关注**来源于外部的 props**. 内部 state 变动一般是人为触发的，比较容易发现
- **Mobx observable value**. 如果访问了 mobx 传进来的响应式数据，就会建立一个状态依赖关系，这个相对于 props 和 context 来说是隐式的，检测它的变动我们可能需要利用 mobx 提供的一些工具
- **Context**。 Context 的 value 的变更会强制重新渲染组件

<br>

### props 变动检测

在上一篇文章中我就建议简化 props，简单组件的 props 的变更很容易预测, 甚至你肉眼都可以察觉出来。另外如果你使用 Redux，如果严格按照 Redux 的最佳实践，配合 Redux 的开发者工具，也可以很直观地判断哪些状态发生了变更。

如果你没办法满足以上条件，可能就得依赖工具了。之前有一个[why-did-you-update](https://github.com/maicki/why-did-you-update)的库，**很可惜现在已经没怎么维护了(旧版本可以使用它)**。这个库使用猴补丁(monkey patches)来扩展 React，比对检测哪些 props 和 state 发生了变化：

![](https://bobi.ink/images/10/wdyu.png)

后面也有人借鉴 why-did-you-update 写了个[why-did-you-render](https://github.com/welldone-software/why-did-you-render). 不过笔者还是不看好这些通过猴补丁扩展 React 的实现，依赖于 React 的内部实现细节，维护成本太高了，跟不上 React 更新基本就废了.

如果你现在使用 hook 的话，自己手写一个也很简单, 这个 idea 来源于[use-why-did-you-update](https://github.com/devhubapp/devhub/blob/master/packages/components/src/hooks/use-why-did-you-update.ts):

```ts
import { useEffect, useRef } from 'react';

export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  // ⚛️保存上一个props
  const latestProps = useRef(props);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const allKeys = Object.keys({ ...latestProps.current, ...props });

    const changesObj: Record<string, { from: any; to: any }> = {};
    allKeys.forEach(key => {
      if (latestProps.current[key] !== props[key]) {
        changesObj[key] = { from: latestProps.current[key], to: props[key] };
      }
    });

    if (Object.keys(changesObj).length) {
      console.log('[why-did-you-update]', name, changesObj);
    } else {
      // 其他原因导致组件渲染
    }

    latestProps.current = props;
  }, Object.values(props));
}
```

使用:

```tsx
const Counter = React.memo(props => {
  useWhyDidYouUpdate('Counter', props);
  return <div style={props.style}>{props.count}</div>;
});
```

如果是类组件，可以在`componentDidUpdate`使用类似上面的方式来比较 props

<br>

### mobx 变动检测

排除了 props 变更导致的重新渲染，现在来看看是否是 mobx 响应式数据导致的变更. 如果你们团队不使用 mobx，可以跳过这一节。

**首先不管是 Redux 和 Mobx，我们都应该让状态的变动变得可预测**. 因为 Mobx 没有 Redux 那样固化的数据变更模式，Mobx 并不容易自动化地监测数据是如何被变更的。在 mobx 中我们使用`@action` 来标志状态的变更操作，但是它拿异步操作没办法。好在后面 mobx 推出了 `flow` API👏。

对于 Mobx 首先建议开启严格模式, 要求所有数据变更都放在@action 或 flow 中:

```jsx
import { configure } from 'mobx';
configure({ enforceActions: 'always' });
```

定义状态变更操作

```jsx
import { observable, action, flow } from 'mobx';

class CounterStore {
  @observable count = 0;

  // 同步操作
  @action('increment count')
  increment = () => {
    this.count++;
  };

  // 异步操作
  // 这是一个生成器，类似于saga的机制
  fetchCount = flow(function*() {
    const count = yield getCount();
    this.count = count;
  });
}
```

Ok 有了上面的约定，现在可以在控制台(通过 mobx-logger)或者 [Mobx 开发者工具](https://github.com/mobxjs/mobx-devtools)中跟踪 Mobx 响应式数据的变动了。

![](https://bobi.ink/images/10/mobx-devtool.png)

<br>

如果不按照规范来，出现问题会比较浪费时间, 但也不是没办法解决。Mobx 还提供了一个[trace](https://mobx.js.org/best/trace.html)函数, 用来检测为什么会执行 SideEffect:

```jsx
export const ListItem = observer(props => {
  const { item, onShiftDown } = props;
  trace();
  return <div className="list-item">{/*...*/}</div>;
});
```

运行效果(递增了 value 值):

![mobx-trace](https://bobi.ink/images/10/mobx-trace.png)

<br>

### Context 变更检测

Ok, 如果排除了 props 和 mobx 数据变更还会重新渲染，那么 100%是 Context 导致的，因为一旦 Context 数据变动，组件就会被强制渲染。笔者在[浅谈 React 性能优化的方向](https://juejin.im/post/5d045350f265da1b695d5bf2#heading-14)提到了 ContextAPI 的一些陷阱。先排除一下是否是这些原因导致的.

现在并没有合适的跟踪 context 变动的机制，我们可以采取像上文的`useWhyDidYouUpdate`一样的方式来比对 Context 的值：

```jsx
function useIsContextUpdate(contexts: object = {}) {
  const latestContexts = useRef(contexts);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const changedContexts: string[] = [];
    for (const key in contexts) {
      if (contexts[key] !== latestContexts.current[key]) {
        changedContexts.push(key);
      }
    }

    if (changedContexts.length) {
      console.log(`[is-context-update]: ${changedContexts.join(', ')}`);
    }

    latestContexts.current = contexts;
  });
}
```

用法:

```jsx
const router = useRouter();
const myContext = useContext(MyContext);

useIsContextUpdate({
  router,
  myContext,
});
```

<br>
<br>

### React Devtool 的 Interactions

这是 React Devtool 的一个实验性功能，Interactions 翻译为中文是‘交互’？这个东西目的其实就是为了跟踪‘什么导致了更新’，也就是我们上面说的变动检测。React希望提供一个通用的API给开发者或第三方工具，方便开发者直观地定位更新的原因:

![](https://bobi.ink/images/10/interaction.png)

上图表示在记录期间跟踪到了四个交互，以及交互触发的时间和耗时。因为还是一个Idea阶段，所以我们就挑选一些API代码随便看看：

```jsx
/** 跟踪状态变更 **/
import { unstable_trace as trace } from "scheduler/tracing";

class MyComponent extends Component {
  handleLoginButtonClick = event => {
    // 跟踪setState
    trace("Login button click", performance.now(), () => {
      this.setState({ isLoggingIn: true });
    });
  };

  // render ...
}

/** 跟踪异步操作 **/
import {
  unstable_trace as trace,
  unstable_wrap as wrap
} from "scheduler/tracing";

trace("Some event", performance.now(), () => {
  setTimeout(
    wrap(() => {
      // Do some async work
    })
  );
});

/** 跟踪初始化渲染 **/
trace("initial render", performance.now(), () => render(<Application />));
```

好了行文结束，如果觉得可以就点个 👍 吧

## 扩展

- [Introducing the React Profiler](https://zh-hans.reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html)
- [Profiling React performance with React 16 and Chrome Devtools.](https://calibreapp.com/blog/react-performance-profiling-optimization/)
- [Tools For Measuring React Performance - Brenda Jimenez @ ReactNYC](https://www.youtube.com/watch?v=nl8VVig_9aM)
