---
title: "React Concurrent Mode 抢先预览: Suspense 篇"
date: 2019/10/26
categories: 前端
---

2019.10.24, 在React Conf 2019召开首日， React 官方正式发布了Concurrent Mode的第一个早期社区预览版本, 正式和React 的大众开发者见面, 令人兴奋。

而去年的React Conf 上， React 则发布了 React Hook，同样是预览版本，这说明Concurrent Mode 很快也会走上正式的轨道上...

这个大招憋了四年多: TODO: Dan 的Twitter, **如果 React Hooks 目的是提高开发体验，那么 Concurrent Mode 则专注于提升用户体验**，它对我们的开发的影响不大，个人觉得反而有点复杂。

<br>

<!-- TOC -->

- [什么是Concurrent Mode?](#什么是concurrent-mode)
- [开启](#开启)
- [Suspense](#suspense)
- [Suspense 的实现原理](#suspense-的实现原理)
- [缓存 Suspense 的状态](#缓存-suspense-的状态)
- [并发发起请求](#并发发起请求)
- [处理竞态](#处理竞态)
- [错误处理](#错误处理)
- [Suspense 编排](#suspense-编排)
  - [过渡](#过渡)
- [CPU: Time Slicing](#cpu-time-slicing)

<!-- /TOC -->

<br>

## 什么是Concurrent Mode?

![](/images/concurrent-mode/cpu-vs-io.jpg)

**这是一个特性集合，可以让你的React 应用保持响应，可以根据用户的设备能力和网络情况优雅地调整**。 这个特性集合，它包含两个方向的优化:

<br>

**CPU 密集型(CPU-bound)**

CPU 密集型指是Reconcilation. 在Concurrent 模式下面，Reconcilation 可以被中断, 让位给高优先级的任务，让应用保持响应.

**上一周，我抢在React Conf 2019 之前发布了一篇文章[《这可能是最通俗的 React Fiber(时间分片) 打开方式》](https://juejin.im/post/5dadc6045188255a270a0f85)（机智），你要了解Concurrent Mode, 强烈建议从这篇文章开始！**

CPU 密集型的优化对现有的代码保持兼容，没有暴露新的API，主要的影响是废弃了一些生命周期方法，这个是众所周知的。

<br>

**I/O 密集型(I/O-bound)**

主要优化 React 对异步数据的处理。主要的武器是 Suspense, 还有 useTransition。通过这些机制可以做到：

- React 可以在内存中**预渲染**，等待数据到达，然后一次性渲染出来，减少中间的加载状态的显示和页面抖动/闪烁。它的假定条件时：大部分情况下，数据的加载是非常快。加载状态会让用户觉得卡顿。
- 另外利用Suspense 可以轻松实现发起‘并发’的‘数据请求’
- 避免数据竞态

<br>

所以这篇文章，我就不再深入解释 `Concurrent` 模式是什么了，以及相关的背景，本文主要内容来源于 React 官方的 [《Introducing Concurrent Mode (Experimental)》](https://reactjs.org/docs/concurrent-mode-intro.html)

<br>

## 开启

## Suspense

Suspense 这个大家应该都不陌生，在 16.5 已经有了这个Suspense 这个API, 我们通常利用它配合 `React.lazy` 实现代码分隔:

```js
const OtherComponent = React.lazy(() => import('./OtherComponent'));

function MyComponent() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <OtherComponent />
      </Suspense>
    </div>
  );
}
```

<br>

Suspense 翻译为中文的话是`等待`、`悬垂`、`悬停`的意思。**React给出了一个更规范的定义**：

**Suspense 不是一个‘数据获取库’, 而是一种提供给‘数据获取库’的`机制`，数据获取库通过这种机制告诉 React 数据还没有准备好，然后 React就会等待它完成后，才继续更新 UI**。 所以 Suspense 主要目的是在组件中异步加载数据。

<br>

也就是说，现在, 我们可以更酷地使用 Suspense，相信我，马上它就会成为你手中的利剑。它是Concurrent模式这一特性集合中的重量级角色，**它是React 提供的原生的组件异步调用原语**。

有了它你可以这样请求远程数据:

```ts
function Posts() {
  const posts = useQuery(GET_MY_POSTS)

  return (<div className="posts">
    {posts.map(i => <Post key={i.id} value={i}/>)}
  </div>)
}

function App() {
  return (<div className="app">
    <Suspense fallback={<Loader>Posts Loading...</Loader>}>
      <Posts />
    </Suspense>
  </div>)
}
```

加载依赖脚本:

```ts
function MyMap() {
  useImportScripts('//api.map.baidu.com/api?v=2.0&ak=您的密钥')

  return (<BDMap />)
}

function App() {
  return (<div className="app">
    <Suspense fallback={<Loader>地图加载中...</Loader>}>
      <MyMap />
    </Suspense>
  </div>)
}
```

仔细观察上面的代码，有两个特点：

- 1️⃣ 我们需要 `Suspense` 来包裹这些包含异步操作的组件，并给它们提供`回退(fallback)`。所谓回退就是展示加载状态。
- 2️⃣ 上面的代码获取异步资源就像同步获取似的。没错，有了 Suspense 我们可以和`async/await` 一样，用’同步‘的代码风格来处理异步请求

很神奇对不对？React 是怎么做到的？

<br>

## Suspense 的实现原理

<br>

早前就[有人剖析过 `Suspense` 的实现](https://zhuanlan.zhihu.com/p/34210780)，它利用了 React 的 `ErrorBoundary` 类似的机制来实现, 脑洞很大, 我们也来简单实现一下.

🤔 嗯... 如果是用 `ErrorBoundary` 的话，ErrorBoundary 可以用来捕获下级组件的异常，我们在做异步操作时，可以抛出一个异常，中断渲染工作，当我们完成异步操作时，再告诉React，我们已经准备好了，请继续渲染...

🤭这就能解释，为什么即没有使用 async/await 和 generator，却可以使用用同步的风格来处理异步操作, throw 可以中断代码执行的...

🤔 这个’异常‘应该跟普通的异常区分开来，同时它应该可以告诉ErrorBoundary，异常操作已经就绪了，让它继续渲染子节点...

我想流程应该是这样的:

![](/images/concurrent-mode/suspense.png)

<br>

其实，符合该场景的、现成的最好的'异常对象'是 Promise。 那就撸起袖子，加油撸代码:

```ts
export interface SuspenseProps {
  fallback: React.ReactNode
}

interface SuspenseState {
  pending: boolean
  error?: any
}

export default class Suspense extends React.Component<SuspenseProps, SuspenseState> {
  // ⚛️ 首先，记录是否处于挂载状态，因为我们不知道异步操作什么时候完成，可能在卸载之后
  // 组件卸载后就不能调用 setState 了
  private mounted = false

  // 组件状态
  public state: SuspenseState = {
    // ⚛️ 表示现在正阻塞在异步操作上
    pending: false,
    // ⚛️ 表示异步操作出现了问题
    error: undefined
  }

  public componentDidMount() {
    this.mounted = true
  }

  public componentWillUnmount() {
    this.mounted = false
  }

  // ⚛️ 使用 Error Boundary 机制捕获下级异常
  public componentDidCatch(err: any) {
    if (!this.mounted) {
      return
    }

    // ⚛️ 判断是否是 Promise, 如果不是则向上抛
    if (isPromise(err)) {
      // 设置为 pending 状态
      this.setState({ pending: true })
      err.then(() => {
        // ⚛️ 异步执行成功, 关闭pending 状态, 触发重新渲染
        this.setState({ pending: false })
      }).catch(err => {
        // ⚛️ 异步执行失败, 我们需要妥善处理该异常，将它抛给 React
        // 因为处于异步回调中，在这里抛出异常无法被 React 捕获，所以我们这里先记录下来
        this.setState({ error: err || new Error('Suspense Error')})
      })
    } else {
      throw err
    }
  }

  // ⚛️ 在这里将 异常 抛给 React
  public componentDidUpdate() {
    if (this.state.pending && this.state.error) {
      throw this.state.error
    }
  }

  public render() {
    // ⚛️ 在pending 状态时渲染 fallback
    return this.state.pending ? this.props.fallback : this.props.children
  }
}
```

<br>

⚠️ 注意，**以上代码只在`v16.6(不包括)`之前有效**. 16.6正式推出 Suspense 后，Suspense 就和普通的 ErrorBoundary 隔离开来了，所以无法在 `componentDidCatch` 中捕获到它. **当组件中抛出 Promise 异常时，React 会向上查找最近的 Suspense来处理它，如果找不到，React 会抛出错误**。

上面的代码还算好理解，对吧？ 我们先不管 React 真实的实现如何，其内部显然要复杂得多，这些复杂性并不是所有开发者都需要去关心的。通过上面简单的代码，至少我们知道 Suspense 的行为是怎样的了。现在来测试一下：

```js
function ComponentThatThrowError() {
  throw new Error('error from component')
  return <div>throw error</div>
}

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <Suspense fallback={null}> {/* Suspense 不会捕获除Promise之外的异常，所以这里会被ErrorBoundary捕获 */}
          <ComponentThatThrowError />
        </Suspense>
      </ErrorBoundary>
      <ErrorBoundary>                               {/* 如果异步操作失败，这个ErrorBoundary可以捕获异步异常 */}
        <Suspense fallback={<div>loading...</div>}> {/* 这里可以捕获ComponentThatThrowPromise 抛出的Promise，并显示loading... */}
          <ComponentThatThrowPromise />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
```

上述代码展示了Suspense的基本用法，以及Suspense的异常处理。 你可以通过这个 [CodeSandbox](https://codesandbox.io/s/react-custom-suspense-huff4?fontsize=14) 实际运行一下这个实例.

现在来看下 `ComponentThatThrowResolvedPromise`:

```js
let throwed = false

function ComponentThatThrowResolvedPromise() {
  if (!throwed) {
    throw new Promise((res, rej) => {
      setTimeout(() => {
        throwed = true
        res()
      }, 3000)
    })
  }

  return <div>throw promise.</div>
}
```

上面代码的要点是`throwed` 和 `throw new Promise`。在这个组件中，我们通过 `throw new Promise` 来中断组件渲染，Suspense会等待这个 Promise resolve 或者 reject，接着重新渲染。

**为了避免重新渲染时, 又抛出 Promise，导致死循环。这里需要使用一个缓存来表示异步操作已经就绪了，不需要再抛出异常**。

**上面通过 throwed 全局变量来缓存异步操作的状态。但是对于组件来说全局状态是 Anti-Pattern，副作用会导致组件无法被复用。另外如果缓存脱离了组件的生命周期，它会变得难以控制, 我们怎么判断缓存是否有效? 怎么让一个缓存失效？**。

当然你可以使用Redux或者其他状态管理器来维护这些缓存，但是我们不是所有状态都想放到全局状态管理器上. **能不能在组件内部缓存这些状态？答案是不行, 至少现在不可以**

由上面的自定义Suspense的实现可以看出来，当 Suspense 组件切换到pending 时，原有的组件树会被卸载，所有的组件状态都会丢失。听起来挺沮丧，看来将异步操作迁移到Suspense 还得花点心思。

<br>

## 缓存 Suspense 的状态

上面说了，我们在组件内部缓存异步操作的状态，那么现在只能放在外部了，可以考虑这些方案:

- 全局缓存, 例如全局变量、全局状态管理器(如Redux、Mobx)
- 由父级组件来缓存状态
- 使用 Context API

<br>

本文就用 Context API 作为例子，简单介绍如何缓存 `Suspense` 异步操作的状态。我们的异步状态定义如下：

```js
export enum PromiseState {
  Initial,  // 初始化状态，即首次创建
  Pending,  // Promise 处于pending 状态
  Resolved, // 正常结束
  Rejected, // 异常
}

// 我们将保存在 Context 中的状态
export interface PromiseValue {
  state: PromiseState
  value: any
}
```

创建一个 Context 专门来缓存异步状态, 为了行文简洁，我们这个Context很简单，就是一个key-value存储：

```js
interface ContextValues {
  getResult(key: string): PromiseValue
  resetResult(key: string): void
}

const Context = React.createContext<ContextValues>({} as any)

export const SimplePromiseCache: FC = props => {
  const cache = useRef<Map<string, PromiseValue> | undefined>()

  // 根据key获取缓存
  const getResult = useCallback((key: string) => {
    cache.current = cache.current || new Map()

    if (cache.current.has(key)) {
      return cache.current.get(key)!
    }

    const result = { state: PromiseState.Initial, value: undefined }

    cache.current.set(key, result)
    return result
  }, [])

  // 根据key c重置缓存
  const resetResult = useCallback((key: string) => {
    if (cache.current != null)  cache.current.delete(key)
  }, [])

  const value = useMemo(() => ({ getResult, resetResult, }), [])

  return <Context.Provider value={value}>{props.children}</Context.Provider>
}
```

后面是重头戏，我们创建一个 `usePromise` 钩子来封装 Promise, 简化繁琐的步骤:

```ts
export function usePromise<R>(prom: Promise<R>, key: string): { data: R; reset: () => void } {
  const [, setCount] = useState(0)
  const context = useContext(Context)

  // ⚛️ 监听key变化，并重新发起请求
  useEffect(
    () => {
      setCount(c => c + 1)
    },
    [key],
  )

  // ️⚛️ 异步处理
  // 从 Context 中取出缓存
  const result = context.getResult(key)
  switch (result.state) {
    case PromiseState.Initial:
      // ⚛️初始状态
      result.state = PromiseState.Pending
      result.value = prom
      prom.then(
        value => {
          if (result.state === PromiseState.Pending) {
            result.state = PromiseState.Resolved
            result.value = value
          }
        },
        err => {
          if (result.state === PromiseState.Pending) {
            result.state = PromiseState.Rejected
            result.value = err
          }
        },
      )
      // 抛出promise，并中断渲染
      throw prom
    case PromiseState.Pending:
      // ⚛️ 还处于请求状态，一个任务可能有多个组件触发，后面的渲染的组件可能会拿到Pending状态
      throw result.value
    case PromiseState.Resolved:
      // ⚛️ 已正常结束
      return {
        data: result.value,
        reset: () => {
          context.resetResult(key)
          setCount(c => c + 1)
        },
      }
    case PromiseState.Rejected:
      // ⚛️ 异常结束，抛出错误
      throw result.value
  }
}
```

上面的代码也没有特别难的地方，就是根据当前的异常请求的状态决定要抛出Promise还是返回异步请求的结果。

等不及，赶紧用起来, 首先用`SimplePromiseCache` 包裹Suspense的上级组件，以便下级组件可以获取到缓存:

```tsx
function App() {
  return (<SimplePromiseCache>
    <Suspense fallback="loading...">
      <DelayShow timeout={3000}/>
    </Suspense>
  </SimplePromiseCache>)
}
```

小试牛刀:

```tsx
function DelayShow({timeout}: {timeout: number}) {
  const { data } = usePromise(
    new Promise<number>(res => {
      setTimeout(() => res(timeout), timeout)
    }),
    'delayShow', // 缓存键
  )

  return <div>DelayShow: {data}</div>
}
```

上面代码的运行效果如下：

![](/images/concurrent-mode/usepromise.gif)

这一节展示了如何使用 Context API来对异步操作进行缓存，这可能比你想象的要复杂的点，手动去管理这些缓存是一个棘手的问题。包括 React 官方也没有给出一个完美的答案, 这个坑还是留给社区去探索吧。

不过对于普通 React 开发者来说不必过早关注这些细节，相信很快会有很多 React 数据请求相关的第三方库会跟进 Suspense。

<br>

## 并发发起请求

## 处理竞态

## 错误处理

## Suspense 编排

### 过渡

提供了多个‘复杂’的接口来实现页面的过渡

一次性刷新页面

## CPU: Time Slicing
