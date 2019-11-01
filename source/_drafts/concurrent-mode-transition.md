---
title: "React Concurrent 模式抢先预览下篇: useTransition 的平行世界"
date: 2019/10/28
categories: 前端
---

接着上篇 Suspense(TODO:), 我们继续谈 React Concurrent模式。我们知道 React 内部做了翻天覆地的变化，外部也提供了许多新的API，来优化用户体验。React 官方用一篇很长的文档[《Concurrent UI Patterns 》](https://reactjs.org/docs/concurrent-mode-patterns.html) 来介绍这一方面的动机和创造。

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

比如我想点击买个AirPods，浏览器会停留在上一个页面，直到下一个页面获得请求响应或者超时。另外浏览器会通过地址栏的加载指示符轻量提示请求情况。这种交互设计，比直接切换过去，展示一个空白的页面要好得多，页面可以保持用户响应, 用户也可以取消请求保持原来的页面。

当然, Tab 切换时另外一种交互场景，我们希望它马上切换过去, 否则用户会觉得点击不起作用。

平行宇宙预渲染，还有一个好处，我们假设大部分情况下，数据请求都非常快，这时候我们没有必要展示加载状态，这会导致页面闪烁和抖动。我们可以通过短暂的延时，来减少加载状态的展示频率。

<br>

## useTransition 登场

状态图: TODO: A -> B

什么是过渡? Suspense
过渡触发, 记录触发记录的state
过渡就绪
过渡超时
过渡的边界, 这么多Suspense，哪个Suspense，子Suspense需要处理吗？

还是关于Suspense, 本文讲述的API需要和Suspense配合使用才有效果

参考浏览器的浏览体验, 页面未加载完成时，停留在当前页面，保持页面交互

可以取消吗，可以提前完成吗，过程如何？平行宇宙, 在另外一个树中预渲染，这不是简单的超时，当树切换时可以很快完成渲染

可以覆盖

好处是什么？如果数据加载很快的话，用户根本看不到加载状态，这样可以避免页面抖动和闪烁。
延迟然用户看到加载状态

## useTransition 原理初探

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

  const handleClick = () => {
    setTick(c => c + 1);

    startTransition(() => {
      setCount(c => c + 1);
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
```

![](test3) TODO:3

现在tick会被立即更新，而 SuspenseBoundary 还会挂在 pending 状态。

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
<br>

最后再总结一下， `useTransition` 要进入 `Pending` 状态要符合以下几个条件:

- 更新必须在`startTransition`中, 这些更新会关联 `suspenseConfig`
- 这些更新触发的重新渲染中, 必须触发至少一个 `Suspense`
- 这个 `Suspense` 不是首次挂载

<br>

## useDeferedValue

给state 变动设置一个比较低的优先级
通过SuspenseConfig 影响State 的expiredTime
Suspense Resolve后强制刷新页面

如果状态通过Redux 或者 Mobx维护呢？

## 参考资料

- [Add withSuspenseConfig API](https://github.com/facebook/react/pull/15593)