---
title: "React Concurrent 模式抢先预览下篇: useTransition 的平行世界"
date: 2019/10/28
categories: 前端
---

接着上篇 Suspense(TODO:), 我们继续谈 React Concurrent模式。我们知道 React 内部做了翻天覆地的变化，外部也提供了许多新的API，来优化用户体验。React 官方用一篇很长的文档[《Concurrent UI Patterns 》](https://reactjs.org/docs/concurrent-mode-patterns.html) 来介绍这一方面的动机和创造。

**文章大纲**

<!-- TOC -->

- [应用场景是什么？](#应用场景是什么)
- [useTransition 登场](#usetransition-登场)
- [useTransition 原理初探](#usetransition-原理初探)
- [那 useDeferedValue 呢？](#那-usedeferedvalue-呢)
- [总结](#总结)
- [参考资料](#参考资料)

<!-- /TOC -->

本文的主角是useTransition, React 官方用’**平行宇宙**‘来比喻这个 API 的作用。What？

用 Git 分支来比喻会更好理解一点，React 可以从当前视图，即 `Master` 分支中 `Fork` 出来一个新的分支，在这个新分支上进行更新，同时 Master保持响应和更新，这两个分支就像两个平行宇宙，两者互不干扰。当新的分支准备妥当时，再合并到Master。

![](/images/concurrent-mode/suspense-branch.png)

<br>

useTransition 就是一个时光隧道, 让 Suspense 进入一个平行宇宙，在这个平行宇宙中等待异步数据就绪，当然 Suspense 也不能无限期待在平行宇宙，useTranstion 可以配置超时时间，如果超时了，就算Suspense 未就绪也会被强制拉回现实世界。回到现实世界后，React 会将 Suspense 进行合并，将结果呈现在用户面前。

<br>

## 应用场景是什么？

平行宇宙有什么用？我们不讲这种内部实现结构，有什么好处，我在《Fiber》中稍微讲过。单从 UI 上讲：

在某些 UI 交互场景，我们并不像马上将更新应用到页面上，尤其是数据未加载完成时。比如你从一个页面切换到另一个页面，新页面需要一些时间才能加载完成，我们更乐于稍微停留在上一个页面，保持一些操作响应，而不是一个什么都没有的空白页面，空转加载状态。感觉在做无谓的等待。

这种交互场景非常常见，眼前的例子就是浏览器：

![](/images/concurrent-mode/browser.gif)

还有Github

TODO: github

比如我想点击买个AirPods，浏览器会停留在上一个页面，直到下一个页面获得请求响应或者超时。另外浏览器会通过地址栏的加载指示符轻量提示请求情况。这种交互设计，比直接切换过去，展示一个空白的页面要好得多，页面可以保持用户响应, 用户也可以取消请求保持原来的页面。

当然, Tab 切换时另外一种交互场景，我们希望它马上切换过去, 否则用户会觉得点击不起作用。

平行宇宙预渲染，还有一个好处，我们假设大部分情况下，数据请求都非常快，这时候我们没有必要展示加载状态，这会导致页面闪烁和抖动。我们可以通过短暂的延时，来减少加载状态的展示频率。

<br>

## useTransition 登场

状态图: TODO: A -> B

<br>

如上图，我们先按照React 官方文档的描述来定义, 各种状态。页面加载有以下三个阶段:

- 过渡阶段(Transition)。指的是页面未就绪，等待加载关键数据的阶段。按照不同的展示策略，页面可以有以下两种状态：
  - **回退(Receded)**。指马上将页面切换过去，展示一个大大的加载指示器或者空白页面。'回退'是什么意思? 按照 React 的说法是，页面原本有内容，现在变为无内容状态，这是一种退化，或者说时间‘倒流’。
  - **待定(Pending)**。这是useTransition要达到的状态，即停留在当前页面，让当前页面保持响应。在关键数据准备就绪时进入 Skeleton 状态， 亦或者等待超时进入 Receded 状态
- 加载阶段(Loading)。指的是关键数据已经准备就绪，可以开始展示页面的骨架或者框架部分。这个阶段有一个状态:
  - **骨架(Skeleton)**。关键数据已经加载完毕，页面展示了主体的框架。
- 就绪阶段(Done)。指的是页面完全加载完毕。这个阶段有一个状态:
  - **完成(Complete)** 页面完全呈现

默认情况下，在 React 中，当我们更新状态进入一个新屏幕时，经历的是 **`Receded` -> `Skeleton` -> `Complete`** 路径。通过 `useTransition` 我们可以实现 **`Pending` -> `Skeleton` -> `Complete`**。

<br>

接下来简单模拟一个页面切换， 先来看默认情况:

```js
function A() {
  return <div className="letter">A</div>;
}

function B() {
  // ⚛️ 延迟加载2s，模拟异步数据请求
  delay("B", 2000);
  return <div className="letter">B</div>;
}

function C() {
  // ⚛️ 延迟加载4s，模拟异步数据请求
  delay("C", 4000);
  return <div className="letter">C</div>;
}

// 页面1
function Page1() {
  return <A />;
}

// 页面2
function Page2() {
  return (
    <>
      <B />
      <Suspense fallback={<div>Loading... C</div>}>
        <C />
      </Suspense>
    </>
  );
}

function App() {
  const [showPage2, setShowPage2] = useState(false);

  // 切换到页面2
  const handleClick = () =>  setShowPage2(true)

  return (
    <div className="App">
      <div>
        <button onClick={handleClick}>切换</button>
      </div>
      <div className="page">
        <Suspense fallback={<div>Loading ...</div>}>
          {!showPage2 ? <Page1 /> : <Page2 />}
        </Suspense>
      </div>
    </div>
  );
}
```

看一下运行效果:

![](demo1.gif)

点击切换后，我们会马上看到一个大大的Loading，接着2s 后 B 加载完毕，最后 C 加载完毕。这个过程就是 **`Receded` -> `Skeleton` -> `Complete`**

现在 useTransition 隆重等成 🎉，我们简单改造一下上面的代码：

```js
// ⚛️ 导入 useTransition
import React, { Suspense, useState, useTransition } from "react";

function App() {
  const [showPage2, setShowPage2] = useState(false);
  // ⚛️ useTransition 接收一个超时时间，返回一个startTransition 函数，以及一个 pending
  const [startTransition, pending] = useTransition({ timeoutMs: 10000 });

  const handleClick = () =>
    // ⚛️ 将会触发 Suspense 挂起的状态更新包裹在 startTransition 中
    startTransition(() => {
      setShowPage2(true);
    });

  return (
    <div className="App">
      <div>
        <button onClick={handleClick}>切换</button>
        {/* ⚛️ pending 表示处于待定状态, 你可以进行一些轻微的提示 */}
        {pending && <span>切换中...</span>}
      </div>
      <div className="page">
        <Suspense fallback={<div>Loading ...</div>}>
          {!showPage2 ? <Page1 /> : <Page2 />}
        </Suspense>
      </div>
    </div>
  );
}
```

<br>

useTransition Hook 有4个关键点:

- `timeoutMs`, 表示切换的超时时间，useTransition 会让 React 保持在当前页面，直到被触发 Suspense 就绪或者超时。
- `startTransition`, 将会触发页面切换(严格说是触发 Suspense 挂起)的状态更新，包裹在 `startTransition` 下，实际上 startTransition 提供了一个'更新的上下文', 下一节我们会深入探索里面的细节
- `pending`, 表示正处于待定状态。我们可以通过这个状态值，适当地给用户一下提示。
- `Suspense`, useTransition 实现过渡状态必须和 Suspense 配合，也就是 `startTransition` 中的更新必须触发任意一个 Suspense 挂起。

<br>

看一下实际的运行效果吧！

![](/demo2.gif)

这个效果完全跟本节的第一张图一样，React 会保留在当前页面，pending 状态变为true，接着 B 先就绪，界面马上切换过去。整个过程符合 **`Pending` -> `Skeleton` -> `Complete`**

startTransition 中的变更一旦触发 Suspense，这些变更影响节点，React 会暂停’提交‘这些节点的变更。所以我们界面上看到的还是旧的，React 只是在内存中维持了这些状态。

注意，React 只是暂时没有提交这些变更，不说明 React ’卡死了‘，处于Pending 状态的组件还会接收用户的响应，进行状态更新，新的状态更新也可以覆盖或终止 Pending 状态。

总结一下进入和退出 Pending 状态的条件:

- 进入Pending 状态需要将 状态更新包裹在 startTransition 下，且这些更新会触发 Suspense 挂起
- 退出 Pending 状态有三种方式: ① Suspense 就绪；② 超时；③ 被新的状态更新覆盖或者终止

<br>
<br>

## useTransition 原理初探

这一节，我们深入探索一下 useTransition，但是不会去折腾源码，而是把它当成一个黑盒，通过几个实验可以加深你对 useTransition 的理解。

useTransition 的前身是 withSuspenseConfig, [sebmarkbage](TODO:) 在今年五月份提的一个[PR](https://github.com/facebook/react/pull/15593)。从顶层的函数看，useTransition 的工作看似比较简单:

```js
function updateTransition(
  config: SuspenseConfig | void | null,
): [(() => void) => void, boolean] {
  const [isPending, setPending] = updateState(false); // 相当于useState
  const startTransition = updateCallback(             // 相当于useCallback
    callback => {
      setPending(true); // 设置 pending 为 true
      // 以低优先级调度执行
      Scheduler.unstable_next(() => {
        // ⚛️ 设置suspenseConfig
        const previousConfig = ReactCurrentBatchConfig.suspense;
        ReactCurrentBatchConfig.suspense = config === undefined ? null : config;
        try {
          // 还原 pending
          setPending(false);

          // 执行你的回调
          callback();

        } finally {
          // ⚛️ 还原suspenseConfig
          ReactCurrentBatchConfig.suspense = previousConfig;
        }
      });
    },
    [config, isPending],
  );
  return [startTransition, isPending];
}
```

看似很普通，要点在哪？

- startTransition 一开始执行就将 pending 设置为true。接着使用 unstable_next 执行回调, 降低更新的优先级，换句话说 unstable_next 里面触发的’更新‘优先级会比较低，它会让位为高优先级的更新，或者当前事务繁忙时，调度到下一空闲期再应用，也可能马上被应用。
- 要点是 `ReactCurrentBatchConfig.suspense` 的配置, 这里面会配置Suspense的超时时间。它表明这个区间触发的更新都被关联该suspenseConfig, 这些更新会根据Suspense的超时时间来计算自己的 `expiredTime`(可以视作‘优先级’)。这些更新触发的渲染(render)也会关联该 `suspenseConfig`
- 如果在渲染期间触发了 Suspense，且渲染关联了 suspenseConfig。 那么这些渲染不会被被立即提交(commit)，而是存储在内存中, 等到Suspense 超时或者Suspense就绪, 或者被其他更新覆盖时才提交到用户界面。

<br>

React 内部的实现太过复杂，我们可以做一些实验来验证这一点:

**1️⃣ 利用startTransition 来运行低优先级任务**

这个实验主要用于验证 `unstable_next` 它会让降低更新的优先级。通过下面的实验我们会观察到startTransition包裹的更新在任务繁忙的情况会稍微延迟.

实验代码:

```js
export default function App() {
  const [count, setCount] = useState(0);
  const [tick, setTick] = useState(0);
  const [startTransition, pending] = useTransition({ timeoutMs: 10000 });

  const handleClick = () => {
    setCount(count + 1);

    startTransition(() => {
      // ⚛️ 低优先级更新 tick
      setTick(t => t + 1);
    });
  };

  return (
    <div className="App">
      <h1>Hello useTransition</h1>
      <div>
        <button onClick={handleClick}>ADD + 1</button>
        {pending && <span>pending</span>}
      </div>
      <div>Count: {count}</div>
      {/* ⚛️ 这是一个复杂的组件，渲染需要一点时间，模拟繁忙的情况 */}
      <ComplexComponent value={tick} />
    </div>
  );
}
```

实验结果如下：

![](TODO:)

在连续点击的情况下，ComplexComponent 的更新会明显滞后，这说明count的优先级高于tick. 但是最后它们的结果会保持一致.

<br>

**2️⃣ startTransition 更新触发 Suspense**

```js
export default function App() {
  const [count, setCount] = useState(0);
  const [tick, setTick] = useState(0);
  const [startTransition, pending] = useTransition({ timeoutMs: 10000 });

  const handleClick = () => {
    startTransition(() => {
      setCount(c => c + 1);
      setTick(c => c + 1);
    });
  };

  return (
    <div className="App">
      <h1>Hello useTransition {tick}</h1>
      <div>
        <button onClick={handleClick}>ADD + 1</button>
        {pending && <span className="pending">pending</span>}
      </div>
      <Tick />
      <SuspenseBoundary id={count} />
    </div>
  );
}

const SuspenseBoundary = ({ id }) => {
  return (
    <Suspense fallback="Loading...">
      {/* 这里会抛出一个Promise异常，3s 后 resolved */}
      <ComponentThatThrowPromise id={id} />
    </Suspense>
  );
};

// Tick 组件每秒递增一次
const Tick = ({ duration = 1000 }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTick(tick => tick + 1);
    }, duration);
    return () => clearInterval(t);
  }, [duration]);

  return <div className="tick">tick: {tick}</div>;
};
```

![](test2) TODO:

当我们点击按钮是会递增 count 和 tick, count 会传递给 SuspenseBoundary，这个会触发 Suspense。

通过上面的结果可以知道，在startTransition 中设置的更新(携带suspenseConfig), 对应的渲染其中如果触发了Suspense，它们的渲染结果不会被立即‘提交’，而是保存在内存中。

另外你会发现 App 组件跟 SuspenseBoundary 一样也会被‘停止’(看Hello Transition 后面的tick)，因为 App 的渲染也关联了suspenseConfig。而 Tick 则每一秒递增一次，不会被阻塞。

这就说明了一旦触发了Suspense，只要关联了 suspenseConfig 的渲染都会被‘停止’提交。

<br>

**3️⃣ 将 tick 更新提出去**

在 2️⃣ 的基础上，将 setTick 提到 setTransition 中外围:

```js
export default function App() {
  const [count, setCount] = useState(0);
  const [tick, setTick] = useState(0);
  const [startTransition, pending] = useTransition({ timeoutMs: 10000 });

  console.log("App rendering with", count, tick, pending);

  const handleClick = () => {
    setTick(c => c + 1);
    startTransition(() => {
      setCount(c => c + 1);
    });
  };

  useEffect(() => {
    console.log("App committed with", count, tick, pending);
  });

  return (
    <div className="App">
      <h1>Hello useTransition {tick}</h1>
      <div>
        <button onClick={handleClick}>ADD + 1</button>
        {pending && <span className="pending">pending</span>}
      </div>
      <Tick />
      <SuspenseBoundary id={count} />
    </div>
  );
}
```

![](test3) TODO:3

现在tick会被立即更新，而 SuspenseBoundary 还会挂在 pending 状态。

我们打开控制台看一下，输出情况:

```shell
App rendering with 1 2 true   # pending 被设置为true
App rendering with 1 2 true
read  1
App committed with 1 2 true    # 进入Pending 状态之前的一次提交，我们在这里开始展示 pending 指示符

# 下面 Tick 更新了三次(3s)
# 我们注意到，每一次 React 都会重新渲染一下 App 组件，即 'ping' 一下处于 Pending 状态的组件, 检查一下是否‘就绪’(没有触发Suspense)
# 如果还触发 Suspense, 说明还要继续等待，这些重新渲染的结果不会被提交

App rendering with 2 2 false # ping, 这里count变成了2，且 pending 变成了 false
App rendering with 2 2 false # 这说明 React 在内存中渲染它们
read  2

Tick rendering with 76
Tick rendering with 76
Tick committed with 76
App rendering with 2 2 false # ping
App rendering with 2 2 false
read  2

Tick rendering with 77
Tick rendering with 77
Tick committed with 77
App rendering with 2 2 false # ping
App rendering with 2 2 false
read  2

Tick rendering with 78
Tick rendering with 78
Tick committed with 78
App rendering with 2 2 false # ping
App rendering with 2 2 false
read  2

# Promise 已经就绪了，这时候再一次重新渲染 App
# 这次没有触发 Suspense，React 会马上提交
App rendering with 2 2 false
App rendering with 2 2 false
read  2
App committed with 2 2 false
```

通过上面的日志，我们可以清晰地理解 Pending 组件的更新行为

<br>

**4️⃣ 嵌套Suspense**

在3️⃣的基础上，将SuspenseBoundary 改写为 DoubleSuspenseBoundary:

```js
const DoubleSuspenseBoundary = ({ id }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentThatThrowPromise id={id} timeout={2000} />
      <Suspense fallback={<div>Loading second...</div>}>
        <ComponentThatThrowPromise id={id + "second"} timeout={4000} />
      </Suspense>
    </Suspense>
  )
}
```

测试一下效果：

![](test4-1.gif) TODO:

首先注意观察首次挂载，**Suspense 首次挂载时不会触发延迟提交**，因此我们首先会看到 `Loading...`、接着第一个 `ComponentThatThrowPromise` 加载完毕，显示`ComponentThatThrowPromise id: 0` 和 `Loading second...`

接着我们点击按钮，这时候 DoubleSuspenseBoundary 会保持不动，等待 5s 后(也就是第二个`ComponentThatThrowPromise`加载完毕), 才提交。

理想的效果是在第一个 ComponentThatThrowPromise 就绪时就切换过来，不用等待第二个加载完毕。

感觉有点不对？我这这里想了很久, 官方文档上 [Concurrent UI Patterns (Experimental) - Wrap Lazy Features in \<Suspense\>](https://reactjs.org/docs/concurrent-mode-patterns.html#wrap-lazy-features-in-suspense) 说了，第二个`ComponentThatThrowPromise` 已经嵌套在 `Suspense` 中了，理论上应该不会阻塞提交。

回到开头的第一句话：'**Suspense 首次挂载时不会触发延迟提交**'。我们再试一下, 给 DoubleSuspenseBoundary 设置一个key，强制让它销毁重新创建:

```js
export default function App() {
  // .....
  return (
    <div className="App">
      <h1>Hello useTransition {tick}</h1>
      <div>
        <button onClick={handleClick}>ADD + 1</button>
        {pending && <span className="pending">pending</span>}
      </div>
      <Tick />
      {/* ⚛️ 这里添加key，强制重新销毁创建 */}
      <DoubleSuspenseBoundary id={count} key={count} />
    </div>
  )
}
```

试一下效果:

![](test4-2.gif) TODO:

<br

我们发现，每次点击都是`Loading...`, Pending状态没有了, 因为每次 `count` 递增, `DoubleSuspenseBoundary` 就会重新创建，不会触发延迟提交。
基于这个原理，我们可以再改造一下 `DoubleSuspenseBoundary`, 这一次，我们只给嵌套的 `Suspense` 加上key，让它们重新创建不阻塞Pending状态.

```js
const DoubleSuspenseBoundary = ({ id }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComponentThatThrowPromise id={id} timeout={2000} />
      {/* ⚛️ 我们不希望这个 Suspense 阻塞 pending 状态, 给它加个key, 让它强制重新创建 */}
      <Suspense key={id} fallback={<div>Loading second...</div>}>
        <ComponentThatThrowPromise id={id + "second"} timeout={4000} />
      </Suspense>
    </Suspense>
  );
};
```

最后的效果

![](test4-3.gif) TODO:

It's work!

<br>

**5️⃣ 可以和 Mobx 和 Redux 配合使用吗？**

我也不知道，测试一下:

```js
mport React, { useTransition, useEffect } from "react";
import { createStore } from "redux";
import { Provider, useSelector, useDispatch } from "react-redux";
import SuspenseBoundary from "./SuspenseBoundary";
import Tick from "./Tick";

const initialState = { count: 0, tick: 0 };
const ADD_TICK = "ADD_TICK";
const ADD_COUNT = "ADD_COUNT";

const store = createStore((state = initialState, action) => {
  const copy = { ...state };
  if (action.type === ADD_TICK) {
    copy.tick++;
  } else {
    copy.count++;
  }
  return copy
});

export const Page = () => {
  const { count, tick } = useSelector(({ tick, count }) => ({ tick, count }));
  const dispatch = useDispatch();
  const [startTransition, pending] = useTransition({ timeoutMs: 10000 });

  const addTick = () => dispatch({ type: ADD_TICK });
  const addCount = () => dispatch({ type: ADD_COUNT });

  const handleClick = () => {
    addTick();
    startTransition(() => {
      console.log("Start transition with count: ", count);
      addCount();
      console.log("End transition");
    });
  };

  console.log(`App rendering with count(${count}) pendig(${pending})`);

  return (
    <div className="App">
      <h1>Hello useTransition {tick}</h1>
      <div>
        <button onClick={handleClick}>ADD + 1</button>
        {pending && <span className="pending">pending</span>}
      </div>
      <Tick />
      <SuspenseBoundary id={count} />
    </div>
  );
};

export default () => {
  return (
    <Provider store={store}>
      <Page />
    </Provider>
  );
};

```

看一下运行效果:

![](/test5.gif)

<br>

What’s the problem? 整个界面都 `Pending` 了, 整个界面不单单指 `App` 这颗子树，而且 Tick 也不走了。打开控制台看到了一个警告:

```txt
Warning: Page triggered a user-blocking update that suspended.

The fix is to split the update into multiple parts: a user-blocking update to provide immediate feedback, and another update that triggers the bulk of the changes.
```

目前，Rudux 和 Mobx 的Hooks API 都采用订阅机制，如果事件触发则强制更新, 结构如下:

```js
function useSomeOutsideStore() {
  // 获取外部 store
  const store = getOutsideStore()
  const [, forceUpdate] = useReducer(s => s + 1, 0)

  // 订阅
  useEffect(() => {
    const disposer = store.subscribe(() => {
      // ⚛️ 强制更新
      forceUpdate()
    ))
    return disposer
  }, [store])
}
```

也就是说， 我们在 `startTransition` 中更新 Redux Store 时，会同步接收到订阅，然后调用 `forceUpdate`。`forceUpdate` 才是真正在 suspenseConfig 上下文中更新的状态。

我们再看一下控制台日志:

```shell
Start transition with count 0
End transition
App rendering with count(1) pendig(true)  # 这里出问题了 🔴, 你可以和实验 3️⃣ 中的日志对比一下
App rendering with count(1) pendig(true)  # 实验 3️⃣ 中这里的 count 是 0，而这里的count是1，说明没有 defer
read  1

Warning: App triggered a user-blocking update that suspended.
The fix is to split the update into multiple parts: a user-blocking update to provide immediate feedback, and another update that triggers the bulk of the changes.
Refer to the documentation for useTransition to learn how to implement this pattern.
```

通过日志可以基本上能够定位出问题，count 没有被延迟更新，所以导致同步触发了 Suspense，这也是 React 警告的原因。 由于 useTransition 目前还处于实验阶段，**如果不是 startTransition 上下文中的状态更新导致的Suspense，行为还是未确定的**。

但是最终的行为有点玄学，它会导致整个应用被‘Pending’，所有状态更新都不会被提交。这块我也没有精力深究下去，只能等待后续官方的更新，读者也可以去琢磨琢磨。

因此，暂时不推荐将会触发Suspense的状态放置在Redux或者Mobx中。

<br>
<br>

最后再重申一下， `useTransition` 要进入 `Pending` 状态要符合以下几个条件:

- 最好使用 React 本身的状态机制进行更新,  如 Hooks 或 setState, 且这些更新会触发 Suspense。
- 更新必须在`startTransition`作用域下, 这些更新会关联 `suspenseConfig`
- 这些更新触发的重新渲染中, 必须触发至少一个 `Suspense`
- 这个 `Suspense` 不是首次挂载

<br>

## 那 useDeferedValue 呢？

如果你理解了上面的内容, 那么 `useDeferedValue` 就好办了，它不过是 useTransition 的封装：

```js
function useDeferredValue<T>(
  value: T,
  config: TimeoutConfig | void | null,
): T {
  const [prevValue, setValue] = useState(value);
  const [startTransition] = useTransition(config)

  // ⚛️ useDeferredValue 只不过是监听 value 的变化，
  // 然后在 startTransition 中更新它。从而实现延迟更新的效果
  useEffect(
    () => {
      startTransition(() => {
        setValue(value);
      })
    },
    [value, config],
  );

  return prevValue;
}
```

`useDeferredValue` 只不过是使用 useEffect 监听 `value` 的变化， 然后在 startTransition 中更新它。从而实现延迟更新的效果。上文实验 1️⃣ 已经介绍过运行效果，React 会降低 startTransition 中更新的优先级， 这意味着在事务繁忙时它们会延后执行。

<br>
<br>

## 总结

我们一开始介绍了 useTransition 的应用场景, 让页面实现 **`Pending` -> `Skeleton` -> `Complete`** 的更新路径, 用户在切换页面时可以停留在当前页面，且当前页面保持响应。 相比展示一个无用的空白页面或者加载转改，这种用户体验更加友好。

当然上述的假设条件时数据加载很慢，如果数据加载很快，利用 useTransition 机制，我们实现不让用户看到加载状态，这样能避免页面页面抖动和闪烁, 看起来像没有加载的过程。

接着我们简单介绍了 useTransition 的运行原理和条件。 如果 startTransition 中的状态更新触发了 Suspense，那么对应的组件就会进入 Pending 状态。在 Pending 状态期间的所有更新都会被延迟提交。 Pending 状态会持续到 Suspense 就绪或者超时。

useTransition 必须和 Suspense 配合使用才能施展魔法。还有一个用户场景是我们可以将低优先级的更新放置到 startTransition 中。比如某个更新的成本很高，就可以选择放到 startTransition 中, 这些更新会让位高优先级的任务，另外会 React 延迟或合并一个比较复杂的更新，让页面保持响应。

<br>

Ok，关于 Concurrent 模式的介绍就先告一段落了。写这些文章耗掉了我大部分的业余时间，如果你喜欢我的文章，请多给我点赞和反馈。

<br>
<br>

## 参考资料

- [Concurrent UI Patterns](https://reactjs.org/docs/concurrent-mode-patterns.html)
- [Add withSuspenseConfig API](https://github.com/facebook/react/pull/15593)

<br>

![](/images/sponsor.jpg)
