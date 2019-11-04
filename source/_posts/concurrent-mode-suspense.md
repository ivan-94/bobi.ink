---
title: "React Concurrent 模式抢先预览上篇: Suspense the world"
date: 2019/10/26
categories: 前端
---

**2019.10.24**, 在 [React Conf 2019](https://www.youtube.com/channel/UCz5vTaEhvh7dOHEyd1efcaQ) 首日， React 官方正式发布了关于 `Concurrent` 模式的第一个早期社区[预览文档](https://reactjs.org/docs/concurrent-mode-intro.html), 正式和 React 的大众开发者见面, 令人兴奋。

跟去年的 React Hooks 一样, 尽管 Concurrent 还是[实验性](https://reactjs.org/blog/2019/10/22/react-release-channels.html#experimental-channel)的, 相信这次不会等太久...

<br>

**这个大招憋了四年多**

![](/images/concurrent-mode/release.png)

<br>

**如果 React Hooks 目的是提高开发体验，那么 Concurrent 模式则专注于提升用户体验**，表面上它对我们的开发的可能影响不大，React 内部已经变了好几重天。

这系列文章主要来源于官方的[预览文档](https://reactjs.org/docs/concurrent-mode-intro.html), 专门给 React 尝鲜者准备。

这个月 Vue 3.0 源码发布，掘金相关文章像井喷一样，没理由 React 这么'大新闻'(尽管这个新闻3年前大家就知道了)... 我来带个头吧。

<br>

**🎉下篇：[React Concurrent 模式抢先预览下篇: useTransition 的平行世界](https://juejin.im/post/5dbee8e7e51d4558040f0830)**

<br>

**文章内容框架**

<!-- TOC -->

- [什么是 Concurrent 模式?](#什么是-concurrent-模式)
- [启用 Concurrent 模式](#启用-concurrent-模式)
- [什么是 Suspense?](#什么是-suspense)
- [Suspense 的实现原理](#suspense-的实现原理)
- [缓存 Suspense 的异步操作状态](#缓存-suspense-的异步操作状态)
  - [使用 Context API](#使用-context-api)
  - [将缓存状态提取到父级](#将缓存状态提取到父级)
- [并发发起请求](#并发发起请求)
- [处理竞态](#处理竞态)
- [错误处理](#错误处理)
- [Suspense 编排](#suspense-编排)
- [总结](#总结)
- [参考资料](#参考资料)

<!-- /TOC -->

<br>
<br>

## 什么是 Concurrent 模式?

![](/images/concurrent-mode/cpu-vs-io.jpg)

**这是一个特性集合，可以让你的React 应用保持响应，可以根据用户的设备能力和网络情况优雅地调整**。 这个特性集合，它包含**两个方向**的优化:

**1️⃣ CPU 密集型(CPU-bound)**

CPU 密集型指是 Reconcilation(协调或者Diff) 的优化. 在Concurrent 模式下面，Reconcilation 可以被中断, 让位给高优先级的任务，让应用保持响应.

**上一周，我抢在 React Conf 2019 之前发布了一篇文章[《🔥这可能是最通俗的 React Fiber(时间分片) 打开方式》](https://juejin.im/post/5dadc6045188255a270a0f85) 🤓，你想了解 Concurrent 模式, 强烈建议从这篇文章开始！**

CPU 密集型的优化对现有的代码保持兼容，几乎没有暴露新的API，主要的影响是废弃了一些生命周期方法，这个是众所周知的。

<br>

**2️⃣ I/O 密集型(I/O-bound)**

主要优化了 React 对异步的处理。主要的武器是 `Suspense` 以及 [`useTransition`](https://reactjs.org/docs/concurrent-mode-patterns.html):

- `Suspense` - 新的异步数据处理方式。
- `useTransition` - 提供了一种预渲染的机制，React 可以在’另一个分支'中**预渲染**，等待数据到达，然后一次性渲染出来，减少中间的加载状态的显示和页面抖动/闪烁。

<br>

这篇文章我就不再深入解释 Concurrent 模式是什么了，**本文会介绍 Suspense，计划下一篇文章会介绍 useTranstion**，敬请期待。

<br>
<br>

## 启用 Concurrent 模式

Concurrent 模式目前还是实验性的，你可以通过以下命令来安装实验版本:

```shell
npm install react@experimental react-dom@experimental
# or
yarn add react@experimental react-dom@experimental
```

上文说了，这是为尝鲜者准备的，尽管 API 应该不会有太大的变动, 不要用于生产环境。

<br>

开始 Concurrent 模式:

```js
import ReactDOM from 'react-dom';

ReactDOM.createRoot(
  document.getElementById('root')
).render(<App />);
```

<br>

另外一个要注意的是，开启Concurrent 模式后，之前 deprecated 的生命周期方法就彻底不能用了，确保你的代码已经迁移。

<br>
<br>

## 什么是 Suspense?

Suspense 这个大家应该都不陌生，在 v16.5 就已经有了这个 `Suspense` 这个API, 只不过通常利用它配合 `React.lazy` 实现代码分隔:

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

React.lazy 这是一次小小的尝试, Suspense 还有大用。 

如果将Suspense 翻译为中文的话是`等待`、`悬垂`、`悬停`的意思。**React给出了一个更规范的定义**：

**Suspense 不是一个‘数据获取库’, 而是一种提供给‘数据获取库’的`机制`，数据获取库通过这种机制告诉 React 数据还没有准备好，然后 React就会等待它完成后，才继续更新 UI**。 简单总结一下 Suspense 是 React 提供的一种异步处理的机制, 它不是一个具体的数据请求库。**它是React 提供的原生的组件异步调用原语**。它是 Concurrent 模式特性集合中的重要角色。

<br>

现在, 我们可以更酷地使用 Suspense，相信我，马上它就会成为你手中的利剑。 有了它你可以这样请求远程数据:

```js
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

<br>

加载依赖脚本:

```js
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

<br>

仔细观察上面的代码，有两个特点：

- 1️⃣ 我们需要 `Suspense` 来包裹这些包含异步操作的组件，并给它们提供`回退(fallback)`。在异步请求期间，会显示这个回退。
- 2️⃣ 上面的代码获取异步资源就跟同步调用似的。没错，有了 Suspense,  我们可以和`async/await`或者`Generator` 一样，用’同步‘的代码风格来处理异步请求

<br>

很神奇对不对？React 是怎么做到的？

<br>
<br>

## Suspense 的实现原理

早前就[有人剖析过 `Suspense` 的实现](https://zhuanlan.zhihu.com/p/34210780)，它利用了 React 的 `ErrorBoundary` 类似的机制来实现, 脑洞很大。

🤔 嗯... 如果是用 `ErrorBoundary` 的话，ErrorBoundary 可以用来捕获下级组件的异常，我们在做异步操作时，可以抛出一个异常，中断渲染工作，当我们完成异步操作时，再告诉React，我们已经准备好了，请继续渲染...

🤭这就能解释，为什么没有使用 async/await 和 Generator，却可以使用用同步的风格来处理异步操作, throw 是可以中断代码执行的...

🤔 不过这个’异常‘应该跟普通的异常区分开来，同时它应该可以通知 ErrorBoundary 异步操作已经就绪了，让它继续渲染子节点...

<br>

我想流程应该是这样的:

![](/images/concurrent-mode/suspense.png)

<br>

其实，符合该场景的、现成的最好的'异常对象'是 Promise。 那就撸起袖子，实现一个:

```js
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

> 实际上，Suspense不会去捕获异步操作的异常，也就是then和catch只是将pending设置为false。由下级组件自己选择如何去处理异常。这不过这里为了方便让大家理解 Suspense 的外在行为，将异常处理提到了这里。

<br>

⚠️ 注意，**以上代码只在`v16.6(不包括)`之前有效**. 16.6正式推出 Suspense 后，Suspense 就和普通的 ErrorBoundary 隔离开来了，所以无法在 `componentDidCatch` 中捕获到 Promise. **当组件中抛出 Promise 异常时，React 会向上查找最近的 Suspense 来处理它，如果找不到，React 会抛出错误**。

<br>

上面的代码还算好理解，对吧？ 我们先不管 React 真实的实现如何，其内部显然要复杂得多，这些复杂性并不是所有开发者都需要去关心的。通过上面简单的代码，至少我们知道 Suspense 的行为是怎样的了。现在来测试一下：

<br>

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
      <ErrorBoundary>                               {/* 如果异步操作失败，这个ErrorBoundary可以捕获异步操作的异常 */}
        <Suspense fallback={<div>loading...</div>}> {/* 这里可以捕获ComponentThatThrowPromise 抛出的Promise，并显示loading... */}
          <ComponentThatThrowPromise />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}
```

<br>

上述代码展示了 Suspense 的基本用法以及异常处理。 你可以通过这个 [CodeSandbox](https://codesandbox.io/s/react-custom-suspense-huff4?fontsize=14) 实际运行一下这个实例.

<br>

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

上面代码的要点是`throwed` 和 `throw new Promise`。在这个组件中，我们通过 `throw new Promise` 来中断组件渲染，Suspense会等待这个 Promise 就绪后，接着重新渲染。

**为了避免重新渲染时, 又抛出 Promise，导致'死循环'。这里需要使用一个'缓存'来表示异步操作已经就绪了，避免再次抛出异常**。

**上面通过 throwed 全局变量来缓存异步操作的状态。但是对于组件来说全局状态是 Anti-Pattern，副作用会导致组件无法被复用。另外如果缓存脱离了组件的生命周期，它会变得难以控制, 我们怎么判断缓存是否有效? 这个缓存的生命周期是怎样控制？**。

当然你可以使用 Redux 或者其他状态管理器来维护这些缓存，但是有时候我们都不想用状态管理器.

**能不能在组件内部缓存这些状态？答案是不行, 至少现在不可以**, 由上面的自定义 Suspense 的实现可以解释: **当 Suspense 切换到 pending 时，原有的组件树会被卸载，所有的组件状态都会丢失**。

听起来挺沮丧，看来将异步操作迁移到 Suspense 还得花点心思。

<br>
<br>

## 缓存 Suspense 的异步操作状态

上面说了，我们无法在组件内部缓存异步操作的状态，那么现在只能放在外部了，可以考虑这些方案:

- 全局缓存。 例如全局变量、全局状态管理器(如Redux、Mobx)
- 使用 Context API
- 由父级组件来缓存状态

下面会介绍后面两种

<br>

### 使用 Context API

我们先用 Context API 作为例子，简单介绍如何缓存 `Suspense` 异步操作的状态。

首先定义一下异步操作的状态有哪些：

![](/images/concurrent-mode/promise.png)
<i>其实就是Promise的状态</i>

<br>

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

<br>

现在创建一个 `React.Context` 专门来缓存异步状态, 为了行文简洁，我们这个Context很简单，就是一个 `key-value` 存储：

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

<br>

后面是重头戏，我们创建一个 `usePromise` Hooks来封装异步操作, 简化繁琐的步骤:

```js
/**
 * @params prom 接收一个Promise，进行异步操作
 * @params key 缓存键
 * @return 返回一个包含请求结果的对象，以及一个reset方法, 用于重置缓存，并重新请求
 */
export function usePromise<R>(prom: Promise<R>, key: string): { data: R; reset: () => void } {
  // 用于强制重新渲染组件
  const [, setCount] = useState(0)
  // 获取context值
  const cache = useContext(Context)

  // ⚛️ 监听key变化，并重新发起请求
  useEffect(
    () => {
      setCount(c => c + 1)
    },
    [key],
  )

  // ️⚛️ 异步处理
  // 从 Context 中取出缓存
  const result = cache.getResult(key)
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
          cache.resetResult(key)
          setCount(c => c + 1)
        },
      }
    case PromiseState.Rejected:
      // ⚛️ 异常结束，抛出错误
      throw result.value
  }
}
```

<br>

上面的代码也没有特别难的地方，就是根据当前的异常请求的状态决定要抛出 Promise 还是返回异步请求的结果。

赶紧用起来, 首先用 `SimplePromiseCache` 包裹 `Suspense` 的上级组件，以便下级组件可以获取到缓存:

```js
function App() {
  return (<SimplePromiseCache>
    <Suspense fallback="loading...">
      <DelayShow timeout={3000}/>
    </Suspense>
  </SimplePromiseCache>)
}
```

小试牛刀:

```js
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

![](/images/concurrent-mode/usePromise.gif)

<br>

这一节展示了如何通过 Context API 来对异步操作进行缓存，这可能比你想象的要复杂的点，手动去管理这些缓存确实是一个棘手的问题(**用什么作为缓存键，怎么判断缓存有效，怎么回收缓存**)。包括 React 官方也没有给出一个完美的答案, 这个坑还是留给社区去探索吧。

除非你是库的作者，对于普通 React 开发者来说不必过早关注这些细节，相信很快会有很多 React 数据请求相关的第三方库会跟进 Suspense。

> React 官方有一个实验性的库: [react-cache](https://github.com/facebook/react/tree/master/packages/react-cache), 目前采用的是 LRU 全局缓存

<br>
<br>

### 将缓存状态提取到父级

**既然无法在 Suspense 的子组件中缓存异步状态，那就提到父级组件呗，这样可以避免全局状态，不需要考虑缓存生命周期管理, 我们可以更灵活地管理这些状态，另外还可以简化下级组件逻辑**。相比 Context API，我个人觉得这是一种更普适的方式。

<br>

So，怎么做？我们基于 `usePromise`, 再创建一个 `createResource` 函数, 它不再是一个Hooks，而是创建一个**资源对象**, 函数签名如下:

```js
function createResource<R>(prom: () => Promise<R>): Resource<R>
```

<br>

`createResource` 返回一个 `Resource` 对象:

```js
interface Resource<R> {
  // 读取'资源', 在Suspense包裹的下级组件中调用, 和上文的usePromise一样的效果
  read(): R
  // ⚛️外加的好处，预加载
  preload(): void
}
```

<br>

**⚛️Resource 对象在父级组件中创建, 然后通过Props传递给下级组件，下级组件调用 `read()` 方法来读取数据。`对于下级组件来说 Resource 和普通的对象没什么区别，它察觉不出来这是一个异步请求`**。这就是这种 Suspense 的精妙之处!

另外由于 Resource 对象是在父级组件创建的，这有一个外加的好处: **我们可以在显示下级组件之前，执行 `preload()` 预先执行异步操作**。

<br>

`createResource` 实现：

```js
export default function createResource<R>(prom: () => Promise<R>): Resource<R> {
  // 缓存
  const result: PromiseValue = {
    state: PromiseState.Initial,
    value: prom,
  }

  function initial() {
    if (result.state !== PromiseState.Initial) {
      return
    }
    result.state = PromiseState.Pending
    const p = (result.value = result.value())
    p.then(
      (value: any) => {
        if (result.state === PromiseState.Pending) {
          result.state = PromiseState.Resolved
          result.value = value
        }
      },
      (err: any) => {
        if (result.state === PromiseState.Pending) {
          result.state = PromiseState.Rejected
          result.value = err
        }
      },
    )
    return p
  }

  return {
    read() {
      switch (result.state) {
        case PromiseState.Initial:
          // ⚛️初始状态
          // 抛出promise，并中断渲染
          throw initial()
        case PromiseState.Pending:
          // ⚛️ 还处于请求状态，一个任务可能有多个组件触发，后面的渲染的组件可能会拿到Pending状态
          throw result.value
        case PromiseState.Resolved:
          // ⚛️ 已正常结束
          return result.value
        case PromiseState.Rejected:
          // ⚛️ 异常结束，抛出错误
          throw result.value
      }
    },
    // 预加载
    preload: initial,
  }
}
```

<br>

`createResource` 的用法也很简单, 在父组件创建 Resource，接着通过 Props 传递给子组件。 下面展示一个Tabs组件，渲染三个子Tab，因为同时只能显示一个Tab，我们可以选择预加载那些未显示的Tab, 来提升它们的打开速度:

```js
const App = () => {
  const [active, setActive] = useState('tab1')
  // 创建 Resource
  const [resources] = useState(() => ({
    tab1: createResource(() => fetchPosts()),
    tab2: createResource(() => fetchOrders()),
    tab3: createResource(() => fetchUsers()),
  }))

  useEffect(() => {
    // 预加载未展示的Tab数据
    Object.keys(resources).forEach(name => {
      if (name !== active) {
        resources[name].preload()
      }
    })
  }, [])

  return (<div className="app">
    <Suspense fallback="loading...">
      <Tabs active={active} onChange={setActive}>
        <Tab key="tab1"><Posts resource={resources.tab1}></Posts></Tab>
        <Tab key="tab2"><Orders resource={resources.tab2}></Orders></Tab>
        <Tab key="tab3"><Users resource={resources.tab3}></Users></Tab>
      </Tabs>
    </Suspense>
  </div>)
}
```

<br>

我们随便挑一个子组件, 看一下它的实现：

```js
const Posts: FC<{resource: Resource<Post[]>}> = ({resource}) => {
  const posts = resource.read()

  return (<div className="posts">
    {posts.map(i => <PostSummary key={i.id} value={i} />)}
  </div>)
}
```

<br>

Ok, 这种方式相比 Context API 好很多了，我个人也偏向这种形式。这种模式下，因为 Resource 是由外部传入的，所以组件行为是确定的，容易被测试和复用。

<br>

不过两种各有应用场景:

- Context API 模式比较适合第三方数据请求库，比如Apollo、Relay。这种模式下，API会更加简洁、优雅。参考 [Relay 的 API](https://relay.dev/docs/en/experimental/api-reference#uselazyloadquery)
- createResource 模式则更适合普通开发者封装自己的异步操作。

<br>
<br>

## 并发发起请求

![](/images/concurrent-mode/twitter.png)

<br>

如上图，现实项目中经常会有这种场景，一个复杂的界面数据可能来源于多个接口，例如:

```js
/**
 * 用户信息页面
 */
function ProfilePage() {
  const [user, setUser] = useState(null);

  // 先拿到用户信息
  useEffect(() => {
    fetchUser().then(u => setUser(u));
  }, []);

  if (user === null) {
    return <p>Loading profile...</p>;
  }

  return (
    <>
      <h1>{user.name}</h1>
      <ProfileTimeline />
    </>
  );
}

/**
 * 用户时间线
 */ 
function ProfileTimeline() {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    fetchPosts().then(p => setPosts(p));
  }, []);

  if (posts === null) {
    return <h2>Loading posts...</h2>;
  }

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.text}</li>
      ))}
    </ul>
  );
}
```

<br>

上面的代码示例来源于官方文档。上面代码 `fetchUser` 和 `fetchPosts` 是串行加载的，我们想让页面尽快的加载出来, 解决这个问题有两个方案：

- 1️⃣ 将 fetchPosts 提到上级, 使用 `Promise.all` 并发加载
- 2️⃣ 将两者抽取成独立的组件，变成兄弟关系而不是父子关系. 这样可以被并发渲染，从而并发发起请求

<br>

首先来看一下 1️⃣:

```js
function fetchProfileData() {
  // 使用 promise all 并发加载
  return Promise.all([
    fetchUser(),
    fetchPosts()
  ]).then(([user, posts]) => {
    return {user, posts};
  })
}

const promise = fetchProfileData();
function ProfilePage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    promise.then(data => {
      setUser(data.user);
      setPosts(data.posts);
    });
  }, []);

  if (user === null) {
    return <p>Loading profile...</p>;
  }
  return (
    <>
      <h1>{user.name}</h1>
      {/* ProfileTimeline 变成了纯组件，不包含业务请求 */}
      <ProfileTimeline posts={posts} />
    </>
  );
}
```

<br>

看起来不错，然后这个方式也存在硬伤:

- ① 异步请求都要上提，然后使用 `Promise.all` 包裹，我觉得好麻烦, 复杂页面怎么办？
- ② 现在加载时间取决于 Promise.all 中执行最长的操作，说好的尽快渲染出来呢？fetchPosts 可能会加载很长，而 fetchUser 应该很快完成了，如果 fetchUser 先执行完，至少应该让用户先看到用户信息。

<br>

1️⃣方案不是特别好，来看一下2️⃣方案:

```js
function ProfilePage() {
  return (<div className="profile-page">
    <ProfileDetails />
    <ProfileTimeline />
  </div>)
}
```

<br>

2️⃣方案是没有 Suspense 之前最好的方式，ProfileDetails 负责加载用户信息，ProfileTimeline 负责加载时间线，两者并发执行，互不干扰。

但是它也是有缺点：页面加载是会有两个`加载指示符`, 能不能合并？有可能 ProfileTimeline 先完成了，这时候 ProfileDetails 还在转圈，页面会很怪...

<br>

现在有请方案 3️⃣: `Suspense` 🎉

```js
const resource = fetchProfileData();

function ProfilePage() {
  return (
    <Suspense fallback={<h1>Loading profile...</h1>}>
      <ProfileDetails />
      <Suspense fallback={<h1>Loading posts...</h1>}>
        <ProfileTimeline />
      </Suspense>
    </Suspense>
  );
}

function ProfileDetails() {
  const user = resource.user.read();
  return <h1>{user.name}</h1>;
}

function ProfileTimeline() {
  const posts = resource.posts.read();
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.text}</li>
      ))}
    </ul>
  );

```

<br>

当 React 渲染 ProfilePage 时, 它会返回 ProfileDetails 和 ProfileTimeline。

首先渲染 ProfileDetails 这时候资源未加载完毕，抛出 promise 异常，中断 ProfileDetails 的渲染。

接着 React 尝试渲染 ProfileTimeline, 同样抛出promise异常。

最后 React 找到 ProfileDetails 最近的Suspense，显示 Loading Profile...

和方案2️⃣一样，Suspense 支持并发发起请求，另外它解决了方案 2️⃣ 的一些缺陷: 加载指示符只有一个，而且如果 ProfileTimeline 率先完成，也不会显示出来。

不止于此，下文会介绍更为灵活的 Suspense 加载状态的显示策略。

<br>
<br>

## 处理竞态

**就算 Javascript 是单线程的, 也可能需要处理竞争状态，主要是因为异步操作的时序是无法被保证的**。

少卖关子，讲个实例。有这样一个组件，它依赖外部传递进来的 id 来异步获取数据:

```js
function UserInfo({id}: {id: string}) {
  const [user, setUser] = useState<User|undefined>()

  /**
   * ⚛️ 监听id变化并发起请求
   */
  useEffect(() => {
    fetchUserInfo().then(user => setUser(user))
  }, [id])

  return user == null ? <Loading /> : renderUser(user)
}
```

<br>

上面的代码有什么问题呢？假设id变化了多次，这里会发起多个请求，但是这些请求完成的顺序没办法保证，这就会导致竞态，先发起的请求可能最后才完成，这就导致页面呈现错误的数据。

<br>

怎么解决？也比较好解决，利用类似**乐观锁**的机制。我们可以保存本次请求的id，如果请求结束时 id 不一致，就说明已经有新的请求发起了:

```js
function UserInfo({id}: {id: string}) {
  const [user, setUser] = setState<User|undefined>()
  const currentId = useRef<string>()

  /**
   * ⚛️ 监听id变化并发起请求
   */
  useEffect(() => {
    currentId.current = id
    fetchUserInfo().then(user => {
      // id 不一致，说明已经有新的请求发起了, 放弃
      if (id !== currentId.current) {
        return
      }

      setUser(user)
    })
  }, [id])

  return user == null ? <Loading /> : renderUser(user)
}
```

<br>

Suspense 下面不存在竞态问题，上面的代码用 Suspense 实现如下:

```js
function UserInfo({resource}: {resource: Resource<User>}) {
  const user = resource.read()
  return renderUser(user)
}
```

<br>

我靠, 这么简洁！传递给 UserInfo 的就是一个简单的对象, 没有竞态. 

那它的上级组件呢?

```js

function createUserResource(id: string) {
  return {
    info: createResource(() => fecthUserInfo(id)),
    timeline: createResource(() => fecthTimeline(id)),
  }
}

function UserPage({id}: {id: string}) {
  const [resource, setResource] = useState(() => createUserResource(id))

  // ⚛️ 将id的监听迁移到了这里
  useEffect(() => {
    // 重新设置resource
    setResource(createUserResource(id))
  }, [id])

  return (<div className="user-page">
    <Suspense loading="Loading User...">
      <UserInfo resource={resource.info} />
      <Timeline resource={resource.timeline} />
    </Suspense>
  </div>)
}
```

<br>

异步请求被转换成了'资源对象'，在这里只不过是一个普通的对象, 通过 Props 传递, 完美解决了异步请求的竞态问题...

<br>

> **另外 Suspense 还解决一个问题**：在执行完异步操作后，我们的页面可能已经切换了，这时候通过 setState 设置组件状态，React就会抛出异常: `Can't perform a React state update on an unmounted component.`, 现在这个问题自然也解决了

<br>
<br>

## 错误处理

如果异步请求异常了怎么解决？ 我们在上文 Suspense 实现原理一节已经说了，如果异步请求失败，React 会抛出异常，我们可以通过 ErrorBoundary 机制将其捕获。

我们写一个高阶组件来简化 Suspense 和 异常处理的过程:

```js
export default function sup<P>(
  fallback: NonNullable<React.ReactNode>,
  catcher: (err: any) => NonNullable<React.ReactNode>,
) {
  return (Comp: React.ComponentType<P>) => {
    interface State {
      error?: any
    }

    class Sup extends React.Component<P, State> {
      state: State = {}

      // 捕获异常
      static getDerivedStateFromError(error: any) {
        return { error }
      }

      render() {
        return (
          <Suspense fallback={fallback}>
            {this.state.error ? catcher(this.state.error) : <Comp {...this.props} />}
          </Suspense>
        )
      }
    }

    return Sup
  }
}
```

<br>

用起来:

```js
// UserInfo.js

const UserInfo: FC<UserInfoProps> = (props) => {/* ... */}

export default sup(
  <Loading text="用户加载中..."/>,
  (err) => <ErrorMessage error={err} />
)(UserInfo)
```

<br>

减少了一些样板代码，还算比较简洁吧?。

<br>
<br>

## Suspense 编排

如果页面上有很多 Suspense, 那么多个圈在转，用户体验并不好。

但是我们又不好直接将它们合并，因为每一块加载优先级、生命周期都不一样，强行绑到一个 Suspense 也不好。例如:

```jsx
function UserPage() {
  return (<Suspense fallback="loading...">
    <UserInfo resource={infoResource} />
    <UserPost resource={postResource} />
  </Suspense>)
}
```

假设 UserPost 需要进行分页，每次点击下一页都会导致整个 `UserPage` loading... 这肯定无法接受...

<br>

**因此 Concurrent 模式引入了一个新的API `SuspenseList`, 用来对多个 Suspense 的加载状态进行编排。我们可以根据实际的场景选择加载状态的显示策略**。例如

```jsx
function Page({ resource }) {
  return (
    <SuspenseList revealOrder="forwards">
      <Suspense fallback={<h2>Loading Foo...</h2>}>
        <Foo resource={resource} />
      </Suspense>
      <Suspense fallback={<h2>Loading Bar...</h2>}>
        <Bar resource={resource} />
      </Suspense>
    </SuspenseList>
  );
}
```

<br>

假设 `Foo` 加载时间是 `5s`，而 `Bar` 加载完成时间是 `2s`。SuspenseList 的各种编排组合的效果如下:

![](/images/concurrent-mode/suspense-list.gif)
<i>可以通过这个 <a href="https://codesandbox.io/s/react-suspenselist-sk3rj?fontsize=14">CodeSandbox 示例</a> 体验 </i>

<br>

`revealOrder` 表示显示的顺序，它目前有三个可选值: `forwards`, `backwards`, `together`

- `forwards` - 由前到后显示。也就说前面的没有加载完成，后面的也不会显示. 即使后面的 Suspense 提前完成异步操作，也需要等待前面的执行完成
- `backwards` - 和forwards相反, 由后到前依次显示.
- `together` - 等所有Suspense 加载完成后一起显示

<br>

除此之外 `SuspenseList` 还有另外一个属性 `tail`, 用来控制是否要折叠这些 Suspense，它有三个值 `默认值`, `collapsed`, `hidden`

- 默认值 - 全部显示
- `collapsed` - 折叠，只显示第一个正在加载的Suspense
- `hidden` - 不显示任何加载状态

<br>

另外 SuspenseList 是可组合的，SuspenseList 下级可以包含其他 SuspenseList.

<br>
<br>

## 总结

本文的主角是 `Suspense`, 如果说 `React Hooks` 是React提供的逻辑复用原语，ErrorBoundary 是异常捕获原语，那么 Suspense 将是 React 的异步操作原语。通过Suspense + ErrorBoundary，简化了手动去处理加载状态和异常状态。

Suspense 可以理解为中断渲染、或者暂停渲染的意思。我们简单探讨了 Suspense 的实现原理，它不过是利用了 ErrorBoundary 的异常抛出机制来中断渲染，配合 Suspense 组件在异步操作完结后恢复组件的渲染。

不过组件在重新渲染(重入)时，所有状态都丢失了，无法在组件本地保存异步处理的状态，所以得向外求，将异步处理的状态缓存在全局或者上级组件。

有人会说 React 已经不纯了、不够函数式了。我不敢擅作评论，我不是虔诚的函数式编程爱好者，我觉得只要能更好的解决问题，哪种编程范式无所谓。自从 React Hooks 出来后，就没有所谓的纯函数式组件了。对于 Suspense 来说，createResource 模式也可以让一个组件的行为变得可被预测和测试。关于其他的痛点，还是要进一步实践和验证。

Suspense 让人非常兴奋，它不仅解决了一些以往异步处理的问题，还带来了新的开发方式。心急的同学可以在自己的实验项目中尝试它。

<br>
<br>

## 参考资料

- [Suspense for Data Fetching (Experimental)](https://reactjs.org/docs/concurrent-mode-suspense.html)
- [Concurrent Rendering in React - Andrew Clark and Brian Vaughn - React Conf 2018](https://www.youtube.com/watch?v=ByBPyMBTzM0)
- [React：Suspense的实现与探讨](https://zhuanlan.zhihu.com/p/34210780)
- [react-cache](https://github.com/facebook/react/blob/master/packages/react-cache/src/ReactCache.js)

<br>

![](/images/sponsor.jpg)