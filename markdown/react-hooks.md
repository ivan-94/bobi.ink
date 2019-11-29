---
title: "2019年了，整理了N个实用案例帮你快速迁移到React Hooks(收藏慢慢看系列)"
date: 2019/8/10
categories: 前端
---

<br>

![](https://bobi.ink/images/react-hooks/cover.png)

<br>

在[React Conf 2018](https://www.youtube.com/channel/UCz5vTaEhvh7dOHEyd1efcaQ)宣布React Hooks后，我第一时间开始尝试使用React Hooks，现在新项目基本不写Class组件了。对我来说，它确实让我的开发效率提高了很多，改变了已有的组件开发思维和模式.

我在[React组件设计实践总结04 - 组件的思维](https://juejin.im/post/5cdc2f54e51d453b0c35930d#heading-3)中已经总结过**React Hooks的意义，以及一些应用场景**。

那这篇文章就完全是介绍**React Hooks的应用实例**，列举了我使用React Hooks的一些实践。 希望通过这些案例，可以帮助你快速熟练，并迁移到React Hooks开发模式. 

> **文章篇幅很长，建议收藏不看, 至少看看目录吧**

<br>

把之前文章整理的`React Hooks应用场景`总结拿过来, 本文基本按照**这个范围进行组织**:

![](https://bobi.ink/images/react-hooks/apply.png)

<br>

**如果你想要了解React Hooks的原理可以阅读这些文章**:

- [React hooks: not magic, just arrays](https://link.juejin.im/?target=https%3A%2F%2Fmedium.com%2F%40ryardley%2Freact-hooks-not-magic-just-arrays-cd4f1857236e)
- [从Preact中了解组件和hooks基本原理](https://juejin.im/post/5cfa29e151882539c33e4f5e#heading-8)

<br>

**目录索引**



- [**1. 组件状态**](#1-组件状态)
  - [1-1 useSetState 模拟传统的setState](#1-1-usesetstate-模拟传统的setstate)
  - [1-2 useReducer Redux风格状态管理](#1-2-usereducer-redux风格状态管理)
  - [1-3 useForceUpdate 强制重新渲染](#1-3-useforceupdate-强制重新渲染)
  - [1-4 useStorage 简化localStorage存取](#1-4-usestorage-简化localstorage存取)
  - [1-5 useRefState 引用state的最新值](#1-5-userefstate-引用state的最新值)
    - [1-5-1 每次重新渲染都创建闭包会影响效率吗?](#1-5-1-每次重新渲染都创建闭包会影响效率吗)
  - [1-6 useRefProps 引用最新的Props](#1-6-userefprops-引用最新的props)
  - [1-7 useInstance ‘实例’变量存取](#1-7-useinstance-实例变量存取)
  - [1-9 usePrevious 获取上一次渲染的值](#1-9-useprevious-获取上一次渲染的值)
  - [1-10 useImmer 简化不可变数据操作](#1-10-useimmer-简化不可变数据操作)
  - [1-11 封装'工具Hooks'简化State的操作](#1-11-封装工具hooks简化state的操作)
    - [1-11-1 useToggle 开关](#1-11-1-usetoggle-开关)
    - [1-11-2 useArray 简化数组状态操作](#1-11-2-usearray-简化数组状态操作)
- [**2. 模拟生命周期函数**](#2-模拟生命周期函数)
  - [2-1 useOnMount 模拟componentDidMount](#2-1-useonmount-模拟componentdidmount)
  - [2-2 useOnUnmount 模拟componentWillUnmount](#2-2-useonunmount-模拟componentwillunmount)
  - [2-3 useOnUpdate 模拟componentDidUpdate](#2-3-useonupdate-模拟componentdidupdate)
- [**3. 事件处理**](#3-事件处理)
  - [3-1 useChange 简化onChange表单双向绑定](#3-1-usechange-简化onchange表单双向绑定)
  - [3-2 useBind 绑定回调参数](#3-2-usebind-绑定回调参数)
  - [3-3 自定义事件封装](#3-3-自定义事件封装)
    - [3-3-1 useActive](#3-3-1-useactive)
    - [3-3-2 useTouch 手势事件封装](#3-3-2-usetouch-手势事件封装)
    - [3-3-3 useDraggable 拖拽事件封装](#3-3-3-usedraggable-拖拽事件封装)
    - [3-3-4 react-events 面向未来的高级事件封装](#3-3-4-react-events-面向未来的高级事件封装)
  - [3-4 useSubscription 通用事件源订阅](#3-4-usesubscription-通用事件源订阅)
  - [3-5 useObservable Hooks和RxJS优雅的结合(rxjs-hooks)](#3-5-useobservable-hooks和rxjs优雅的结合rxjs-hooks)
  - [3-6 useEventEmitter 对接eventEmitter](#3-6-useeventemitter-对接eventemitter)
- [**4. Context的妙用**](#4-context的妙用)
  - [4-1 useTheme 主题配置](#4-1-usetheme-主题配置)
  - [4-2 unstated 简单状态管理器](#4-2-unstated-简单状态管理器)
  - [4-3 useI18n 国际化](#4-3-usei18n-国际化)
  - [4-4 useRouter 简化路由状态的访问](#4-4-userouter-简化路由状态的访问)
  - [4-5 react-hook-form Hooks和表单能擦出什么火花?](#4-5-react-hook-form-hooks和表单能擦出什么火花)
- [**5. 副作用封装**](#5-副作用封装)
  - [5-1 useTimeout 超时修改状态](#5-1-usetimeout-超时修改状态)
  - [5-2 useOnlineStatus 监听在线状态](#5-2-useonlinestatus-监听在线状态)
- [**6. 副作用衍生**](#6-副作用衍生)
  - [6-1 useTitle 设置文档title](#6-1-usetitle-设置文档title)
  - [6-2 useDebounce](#6-2-usedebounce)
  - [6-3 useThrottle](#6-3-usethrottle)
- [**7. 简化业务逻辑**](#7-简化业务逻辑)
  - [7-1 usePromise 封装异步请求](#7-1-usepromise-封装异步请求)
  - [7-2 usePromiseEffect 自动进行异步请求](#7-2-usepromiseeffect-自动进行异步请求)
  - [7-3 useInfiniteList 实现无限加载列表](#7-3-useinfinitelist-实现无限加载列表)
  - [7-4 usePoll 用hook实现轮询](#7-4-usepoll-用hook实现轮询)
  - [7-5 业务逻辑抽离](#7-5-业务逻辑抽离)
- [**8. 开脑洞**](#8-开脑洞)
  - [8-1 useScript: Hooks + Suspend = ❤️](#8-1-usescript-hooks--suspend--❤️)
  - [8-2 useModal 模态框数据流管理](#8-2-usemodal-模态框数据流管理)
- [**React Hooks 技术地图**](#react-hooks-技术地图)
- [总结](#总结)



<br>

## **1. 组件状态**

React提供了一个很基本的组件状态设置Hook:

```js
const [state, setState] = useState(initialState);
```

[useState](https://zh-hans.reactjs.org/docs/hooks-reference.html#usestate)返回**一个state，以及更新state的函数**. setState可以接受一个新的值，会触发组件重新渲染.

> **React会确保setState函数是稳定的，不会在组件重新渲染时改变**。下面的useReducer的dispatch函数、useRef的current属性也一样。
> **这就意味着setState、dispatch、ref.current, 可以安全地在useEffect、useMemo、 useCallback中引用**

<br>

### 1-1 useSetState 模拟传统的setState

useState和Class组件的setState不太一样.

Class组件的state属性一般是一个对象，调用setState时，会浅拷贝到state属性, 并触发更新, 比如:

```js
class MyComp extends React.Component {
  state = {
    name: '_sx_',
    age: 10
  }

  handleIncrementAge = () => {
    // 只更新age
    this.setState({age: this.state.age + 1})
  }

  // ...
}
```

<br>

而**useState会直接覆盖state值**。为了实现和setState一样的效果, 可以这样子做:

```ts
const initialState = {name: 'sx', age: 10}
const MyComp: FC = props => {
  const [state, setState] = useState(initialState)
  const handleIncrementAge = useCallback(() => {
    // setState方法支持接收一个函数，通过这个函数可以获取最新的state值
    // 然后使用...操作符实现对象浅拷贝
    setState((prevState) => ({...preState, age: prevState.age + 1}) )
  }, [])
  // ...
}
```

<br>

Ok，现在把它封装成通用的hooks，在其他组件中复用。这时候就体现出来Hooks强大的逻辑抽象能力：**Hooks 旨在让组件的内部逻辑组织成可复用的更小单元，这些单元各自维护一部分组件‘状态和逻辑’**

看看我们的`useSetState`, 我会使用Typescript进行代码编写:

```js
function useSetState<S extends object>(
  initalState: S | (() => S),
): [S, (state: Partial<S> | ((state: S) => Partial<S>)) => void] {
  const [_state, _setState] = useState<S>(initalState)

  const setState = useCallback((state: Partial<S> | ((state: S) => Partial<S>)) => {
    _setState((prev: S) => {
      let nextState = state
      if (typeof state === 'function') {
        nextState = state(prev)
      }

      return { ...prev, ...nextState }
    })
  }, [])

  return [_state, setState]
}

// ------
// EXAMPLE
// ------
export default function UseSetState() {
  const [state, setState] = useSetState<{ name: string; age: number }>({ name: 'sx', age: 1 })

  const incrementAge = () => {
    setState(prev => ({ age: prev.age + 1 }))
  }

  return (
    <div onClick={incrementAge}>
      {state.name}: {state.age}
    </div>
  )
}
```

> hooks命名以`use`为前缀

<br>

[⤴️回到顶部](#)

### 1-2 useReducer Redux风格状态管理

如果组件状态比较复杂，推荐使用useReducer来管理状态。如果你熟悉Redux，会很习惯这种方式。

```js
// 定义初始状态
const initialState = {count: 0};

// 定义Reducer
// ruducer接受当前state，以及一个用户操作，返回一个'新'的state
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1};
    case 'decrement':
      return {count: state.count - 1};
    default:
      throw new Error();
  }
}

// --------
// EXAMPLE
// --------
function Counter() {
  // 返回state，以及dispatch函数
  // dispatch函数可以触发reducer执行，给reducer传递指令和载荷
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({type: 'increment'})}>+</button>
      <button onClick={() => dispatch({type: 'decrement'})}>-</button>
    </>
  );
}
```

了解更多reducer的思想可以参考[Redux文档](https://redux.js.org/basics/reducers)

<br>

[⤴️回到顶部](#)

### 1-3 useForceUpdate 强制重新渲染

Class组件可以通过`forceUpdate`实例方法来触发强制重新渲染。使用useState也可以模拟相同的效果：

```ts
export default function useForceUpdate() {
  const [, setValue] = useState(0)
  return useCallback(() => {
    // 递增state值，强制React进行重新渲染
    setValue(val => (val + 1) % (Number.MAX_SAFE_INTEGER - 1))
  }, [])
}

// -------
// EXAMPLE
// -------
function ForceUpdate() {
  const forceUpdate = useForceUpdate()
  useEffect(() => {
    somethingChange(forceUpdate)
  }, [])
}
```

<br>

[⤴️回到顶部](#)

### 1-4 useStorage 简化localStorage存取

通过自定义Hooks，可以将状态代理到其他数据源，比如localStorage。 下面案例展示如果使用Hooks封装和简化localStorage的存取:

```ts
import { useState, useCallback, Dispatch, SetStateAction } from 'react'

export default function useStorage<T>(
  key: string,
  // 默认值
  defaultValue?: T | (() => T),
  // 是否在窗口关闭后保持数据
  keepOnWindowClosed: boolean = true,
): [T | undefined, Dispatch<SetStateAction<T>>, () => void] {
  const storage = keepOnWindowClosed ? localStorage : sessionStorage

  // 尝试从Storage恢复值
  const getStorageValue = () => {
    try {
      const storageValue = storage.getItem(key)
      if (storageValue != null) {
        return JSON.parse(storageValue)
      } else if (defaultValue) {
        // 设置默认值
        const value = typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue
        storage.setItem(key, JSON.stringify(value))
        return value
      }
    } catch (err) {
      console.warn(`useStorage 无法获取${key}: `, err)
    }

    return undefined
  }

  const [value, setValue] = useState<T | undefined>(getStorageValue)

  // 更新组件状态并保存到Storage
  const save = useCallback<Dispatch<SetStateAction<T>>>(value => {
    setValue(prev => {
      const finalValue = typeof value === 'function' ? (value as (prev: T | undefined) => T)(prev) : value
      storage.setItem(key, JSON.stringify(finalValue))
      return finalValue
    })
  }, [])

  // 移除状态
  const clear = useCallback(() => {
    storage.removeItem(key)
    setValue(undefined)
  }, [])

  return [value, save, clear]
}

// --------
// EXAMPLE
// --------
function Demo() {
  // 保存登录状态
  const [use, setUser, clearUser] = useStorage('user')
  const handleLogin = (user) => {
    setUser(user)
  }

  const handleLogout = () => {
    clearUser()
  }

  // ....
}
```

<br>

[⤴️回到顶部](#)

### 1-5 useRefState 引用state的最新值

<br>

![](https://bobi.ink/images/react-hooks/vue-api.png)

<br>

上图是今年六月份[VueConf](https://vue.w3ctech.com)，尤雨溪的Slide截图，他对比了Vue最新的[FunctionBase API](https://zhuanlan.zhihu.com/p/68477600)和React Hook. 它**指出React Hooks有很多问题**:

- 每个Hooks在组件每次渲染时都执行。也就是说每次渲染都要重新创建闭包和对象
- 需要理解闭包变量
- 内容回调/对象会导致纯组件props比对失效, 导致组件永远更新

<br>

闭包变量问题是你掌握React Hooks过程中的重要一关。闭包问题是指什么呢？举个简单的例子, Counter:

```js
function Counter() {
  const [count, setCount] = useState(0)
  const handleIncr = () => {
    setCount(count + 1)
  }

  return (<div>{count}: <ComplexButton onClick={handleIncr}>increment</ComplexButton></div>)
}
```

假设ComplexButton是一个非常复杂的组件，每一次点击它，我们会递增count，从而触发组将重新渲染。**因为Counter每次渲染都会重新生成handleIncr，所以也会导致ComplexButton重新渲染，不管ComplexButton使用了`PureComponent`还是使用`React.memo`包装**。

<br>

为了解决这个问题，**React也提供了一个`useCallback` Hook, 用来‘缓存’函数, 保持回调的不变性**. 比如我们可以这样使用:

```js
function Counter() {
  const [count, setCount] = useState(0)
  const handleIncr = useCallback(() => {
    setCount(count + 1)
  }, [])

  return (<div>{count}: <ComplexButton onClick={handleIncr}>increment</ComplexButton></div>)
}
```

上面的代码是有bug的，不过怎么点击，count会一直显示为1！

再仔细阅读useCallback的文档，useCallback支持第二个参数，当这些值变动时更新缓存的函数, **useCallback的内部逻辑大概是这样的**：

```js
let memoFn, memoArgs
function useCallback(fn, args) {
  // 如果变动则更新缓存函数
  if (!isEqual(memoArgs, args)) {
    memoArgs = args
    return (memoFn = fn)
  }
  return memoFn
}
```

Ok, 现在理解一下为什么会一直显示1？

![](https://bobi.ink/images/react-hooks/usecallback.png)

首次渲染时缓存了闭包，这时候闭包捕获的count值是0。在后续的重新渲染中，因为useCallback第二个参数指定的值没有变动，handleIncr闭包会永远被缓存。这就解释了为什么每次点击，count只能为1.

解决办法也很简单，让我们在count变动时，让useCallback更新缓存函数:

```ts
function Counter() {
  const [count, setCount] = useState(0)
  const handleIncr = useCallback(() => {
    setCount(count + 1)
  }, [count])

  return (<div>{count}: <ComplexButton onClick={handleIncr}>increment</ComplexButton></div>)
}
```

<br>

如果useCallback依赖很多值，你的代码可能是这样的：`useCallback(fn, [a, b, c, d, e])`. 反正我是无法接受这种代码的，很容易遗漏, 而且可维护性很差，尽管通过[ESLint插件](https://www.npmjs.com/package/eslint-plugin-react-hooks)可以检查这些问题**。

<br>

其实通过[`useRef`](https://reactjs.org/docs/hooks-reference.html#useref) Hook，可以让我们像Class组件一样保存一些‘实例变量’, React会保证useRef返回值的稳定性，我们可以在组件任何地方安全地引用ref。

基于这个原理，我们尝试封装一个`useRefState`, 它在useState的基础上扩展了一个返回值，用于获取state的最新值:

<br>

```ts
import { useState, useRef, useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react'

function useRefState(initialState) {
  const ins = useRef()

  const [state, setState] = useState(() => {
    // 初始化
    const value = typeof initialState === 'function' ? initialState() : initialState
    ins.current = value
    return value
  })

  const setValue = useCallback(value => {
    if (typeof value === 'function') {
      setState(prevState => {
        const finalValue = value(prevState)
        ins.current = finalValue
        return finalValue
      })
    } else {
      ins.current = value
      setState(value)
    }
  }, [])

  return [state, setValue, ins]
}
```

<br>

使用示例:

```ts
function Counter() {
  const [count, setCount, countRef] = useRefState(0)
  const handleIncr = useCallback(() => {
    setCount(countRef.current + 1)
  }, [])

  useEffect(() => {
    return () => {
      // 在组件卸载时保存当前的count
      saveCount(countRef.current)
    }
  }, [])

  return (<div>{count}: <ComplexButton onClick={handleIncr}>increment</ComplexButton></div>)
}
```

> [`useEffect`](https://reactjs.org/docs/hooks-reference.html#useeffect)、[`useMemo`](https://reactjs.org/docs/hooks-reference.html#usememo)和`useCallback`一样存在闭包变量问题，它们和useCallback一个支持指定第二个参数，当这个参数变化时执行副作用。

<br>

[⤴️回到顶部](#)

#### 1-5-1 每次重新渲染都创建闭包会影响效率吗?

函数组件和Class组件不一样的是，函数组件将所有状态和逻辑都放到一个函数中, 每一次重新渲染会重复创建大量的闭包、对象。而传统的Class组件的render函数则要简洁很多，一般只放置JSX渲染逻辑。相比大家都跟我一样，会怀疑函数组件的性能问题

我们看看官方是怎么回应的：

![](https://bobi.ink/images/react-hooks/fn-perf.png)

<br>

我在SegmentFault的[**react function组件与class组件性能问题**](https://segmentfault.com/q/1010000019644156/a-1020000019706666)也进行了详细的回答, 结论是:

> 目前而言，实现同样的功能，类组件和函数组件的效率是不相上下的。但是函数组件是未来，而且还有优化空间，React团队会继续优化它。而类组件会逐渐退出历史

为了提高函数组件的性能，可以在这些地方做一些**优化**:

- 能否将函数提取为静态的

  ```js
  // 1️⃣例如将不依赖于组件状态的回调抽取为静态方法
  const goback = () => {
    history.go(-1)
  }

  function Demo() {
    //const goback = () => {
    //  history.go(-1)
    //}
    return <button onClick={goback}>back</button>
  }

  // 2️⃣ 抽离useState的初始化函数
  const returnEmptyObject = () => Object.create(null)
  const returnEmptyArray = () => []
  function Demo() {
    const [state, setState] = useState(returnEmptyObject)
    const [arr, setArr] = useState(returnEmptyArray)
    // ...
  }
  ```

- 简化组件的复杂度，动静分离
- 再拆分更细粒度的组件，这些组件使用React.memo缓存

<br>
<br>

[⤴️回到顶部](#)

### 1-6 useRefProps 引用最新的Props

现实项目中也有很多这种场景: 我们想**在组件的任何地方获取最新的props值**，这个同样可以通过useRef来实现：

```js
export default function useRefProps<T>(props: T) {
  const ref = useRef<T>(props)
  // 每次重新渲染设置值
  ref.current = props

  return ref
}

// ---------
// EXAMPLE
// ---------
function MyButton(props) {
  const propsRef = useRefProps(props)

  // 永久不变的事件处理器
  const handleClick = useCallback(() => {
    const { onClick } = propsRef.current
    if (onClick) {
      onClick()
    }
  }, [])

  return <ComplexButton onClick={handleClick}></ComplexButton>
}
```

<br>

[⤴️回到顶部](#)

### 1-7 useInstance ‘实例’变量存取

```ts
function isFunction<T>(initial?: T | (() => T)): initial is () => T {
  return typeof initial === 'function'
}

function useInstance<T extends {}>(initial?: T | (() => T)) {
  const instance = useRef<T>()
  // 初始化
  if (instance.current == null) {
    if (initial) {
      instance.current = isFunction(initial) ? initial() : initial
    } else {
      instance.current = {} as T
    }
  }

  return instance.current
}

// ---------
// EXAMPLE
// ---------
function Demo() {
  const inst = useInstance({ count: 1 })
  const update = useForceUpdate()
  useEffect(() => {
    const timer = setInterval(() => {
      // 像类组件一样，进行‘实例变量’存储
      // 在函数组件的任意地方引用
      // 只不过更新这些数据不会触发组件的重新渲染
      inst.count++
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      count: {inst.count}
      <button onClick={update}>刷新</button>
    </div>
  )
}
```

> 注意不要滥用

<br>

[⤴️回到顶部](#)

### 1-9 usePrevious 获取上一次渲染的值

在Class组件中，我们经常会在`shouldComponentUpdate`或`componentDidUpdate`这类生命周期方法中对props或state进行比对，来决定做某些事情，例如重新发起请求、监听事件等等.

Hooks中我们可以使用useEffect或useMemo来响应状态变化，进行状态或副作用衍生. 所以上述比对的场景在Hooks中很少见。但也不是不可能，React官方案例中就有一个`usePrevious`:

```ts
function usePrevious(value) {
  const ref = useRef();
  // useEffect会在完成这次'渲染'之后执行
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// --------
// EXAMPLE
// --------
const calculation = count * 100;
const prevCalculation = usePrevious(calculation);
```

<br>

[⤴️回到顶部](#)

### 1-10 useImmer 简化不可变数据操作

这个案例来源于[use-immer](https://github.com/immerjs/use-immer), 结合[immer.js](https://github.com/mweststrate/immer)和Hooks来简化不可变数据操作, 看看代码示例:

```js
const [person, updatePerson] = useImmer({
  name: "Michel",
  age: 33
});

function updateName(name) {
  updatePerson(draft => {
    draft.name = name;
  });
}

function becomeOlder() {
  updatePerson(draft => {
    draft.age++;
  });
}
```

实现也非常简单:

```ts
export function useImmer(initialValue) {
  const [val, updateValue] = useState(initialValue);
  return [
    val,
    useCallback(updater => {
      updateValue(produce(updater));
    }, [])
  ];
}
```

**简洁的Hooks配合简洁的Immer，简直完美**

<br>

[⤴️回到顶部](#)

### 1-11 封装'工具Hooks'简化State的操作

Hooks只是普通函数，所以可以灵活地自定义。下面举一些例子，利用自定义Hooks来简化常见的数据操作场景

<br>

#### 1-11-1 useToggle 开关

实现boolean值切换

```ts
function useToggle(initialValue?: boolean) {
  const [value, setValue] = useState(!!initialValue)
  const toggler = useCallback(() => setValue(value => !value), [])

  return [value, toggler]
}

// --------
// EXAMPLE
// --------
function Demo() {
  const [enable, toggleEnable] = useToggle()

  return <Switch value={enable} onClick={toggleEnable}></Switch>
}
```

<br>

[⤴️回到顶部](#)

#### 1-11-2 useArray 简化数组状态操作

```ts
function useArray<T>(initial?: T[] | (() => T[]), idKey: string = 'id') {
  const [value, setValue] = useState(initial || [])
  return {
    value,
    setValue,
    push: useCallback(a => setValue(v => [...v, a]), []),
    clear: useCallback(() => setValue(() => []), []),
    removeById: useCallback(id => setValue(arr => arr.filter(v => v && v[idKey] !== id)), []),
    removeIndex: useCallback(
      index =>
        setValue(v => {
          v.splice(index, 1)
          return v
        }),
      [],
    ),
  }
}

// ---------
// EXAMPLE
// ---------
function Demo() {
  const {value, push, removeById} = useArray<{id: number, name: string}>()
  const handleAdd = useCallback(() => {
    push({id: Math.random(), name: getName()})
  }, [])

  return (<div>
    <div>{value.map(i => <span key={i.id} onClick={() => removeById(i.id)}>{i.name}</span>)}</div>
    <button onClick={handleAdd}>add</button>
  </div>)
}
```

限于篇幅，其他数据结构, 例如Set、Map, 就不展开介绍了，读者可以自己发挥想象力.

<br>
<br>

[⤴️回到顶部](#)

## **2. 模拟生命周期函数**

组件生命周期相关的操作依赖于`useEffect` Hook. **React在函数组件中刻意淡化了组件生命周期的概念，而更关注‘数据的响应’**.

`useEffect`名称意图非常明显，就是**专门用来管理组件的副作用**。和useCallback一样，useEffect支持传递第二个参数，告知React在这些值发生变动时才执行父作用. 原理大概如下:

```js
let memoCallback = {fn: undefined, disposer: undefined}
let memoArgs
function useEffect(fn, args) {
  // 如果变动则执行副作用
  if (args == null || !isEqual(memoArgs, args)) {
    memoArgs = args
    memoCallback.fn = fn

    // 放进队列等待调度执行
    pushIntoEffectQueue(memoCallback)
  }
}

// 副作用执行
// 这个会在组件完成渲染，在布局(layout)和绘制(paint)之后被执行
// 如果是useLayoutEffect, 执行的时机会更早一些
function queueExecute(callback) {
  // 先执行清理函数
  if (callback.disposer) {
    callback.disposer()
  }
  callback.disposer = callback.fn()
}
```

<br>

关于useEffect官网有详尽的[描述](https://zh-hans.reactjs.org/docs/hooks-reference.html#useeffect); Dan Abramov也写了一篇[useEffect 完整指南](https://overreacted.io/zh-hans/a-complete-guide-to-useeffect/), 推荐👍。

<br>

[⤴️回到顶部](#)

### 2-1 useOnMount 模拟componentDidMount

```ts
export default function useOnMount(fn: Function) {
  useEffect(() => {
    fn()
  }, []) // 第二个参数设置为[], 表示不必对任何数据， 所以只在首次渲染时调用
}

// ---------
// EXAMPLE
// ---------
function Demo() {
  useOnMount(async () => {
    try {
      await loadList()
    } catch {
      // log
    }
  })
}
```

<br>

**如果需要在挂载/状态更新时请求一些资源、并且需要在卸载时释放这些资源，还是推荐使用useEffect，因为这些逻辑最好放在一起, 方便维护和理解**:

```js
// 但是useEffect传入的函数不支持async/await(返回Promise)
useEffect(() => {
  // 请求资源
  const subscription = props.source.subscribe();

  // 释放资源
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

<br>

[⤴️回到顶部](#)

### 2-2 useOnUnmount 模拟componentWillUnmount

```ts
export default function useOnUnmount(fn: Function) {
  useEffect(() => {
    return () => {
        fn()
    }
  }, [])
}
```

<br>

[⤴️回到顶部](#)

### 2-3 useOnUpdate 模拟componentDidUpdate

```ts
function useOnUpdate(fn: () => void, dep?: any[]) {
  const ref = useRef({ fn, mounted: false })
  ref.current.fn = fn

  useEffect(() => {
    // 首次渲染不执行
    if (!ref.current.mounted) {
      ref.current.mounted = true
    } else {
      ref.current.fn()
    }
  }, dep)
}

// -----------
// EXAMPLE
// -----------
function Demo(props) {
  useOnUpdate(() => {
    dosomethingwith(props.a)
  }, [props.a])

  return <div>...</div>
}
```

<br>

其他生命周期函数的模拟:

- `shouldComponentUpdate` - React.memo包裹组件
- `componentDidCatch` - 暂不支持

<br>
<br>

[⤴️回到顶部](#)

## **3. 事件处理**

### 3-1 useChange 简化onChange表单双向绑定

表单值的双向绑定在项目中非常常见，通常我们的代码是这样的:

```ts
function Demo() {
  const [value, setValue] = useState('')

  const handleChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(evt => {
    setValue(evt.target.value)
  }, [])

  return <input value={value} onChange={handleChange} />
}
```

如果需要维护多个表单，这种代码就会变得难以接受。幸好有Hooks，我们可以简化这些代码:

```ts
function useChange<S>(initial?: S | (() => S)) {
  const [value, setValue] = useState<S | undefined>(initial)
  const onChange = useCallback(e => setValue(e.target.value), [])

  return {
    value,
    setValue,
    onChange,
    // 绑定到原生事件
    bindEvent: {
      onChange,
      value,
    },
    // 绑定到自定义组件
    bind: {
      onChange: setValue,
      value,
    },
  }
}

// ----------
// EXAMPLE
// ----------
function Demo() {
  const userName = useChange('')
  const password = useChange('')

  return (
    <div>
      <input {...userName.bindEvent} />
      <input type="password" {...password.bindEvent} />
    </div>
  )
}
```

<br>

[⤴️回到顶部](#)

### 3-2 useBind 绑定回调参数

绑定一些回调参数，并利用useMemo给下级传递一个缓存的回调, 避免重新渲染:

```ts
function useBind(fn?: (...args: any[]) => any, ...args: any[]): (...args: any[]) => any {
  return useMemo(() => {fn && fn.bind(null, ...args)}, args)
}

// ---------
// EXAMPLE
// ---------
function Demo(props) {
  const {id, onClick} = props
  const handleClick = useBind(onClick, id)

  return <ComplexComponent onClick={handleClick}></ComplexComponent>
}

// 等价于
function Demo(props) {
  const {id, onClick} = props
  const handleClick = useCallback(() => onClick(id), [id])

  return <ComplexComponent onClick={handleClick}></ComplexComponent>
}
```

<br>

[⤴️回到顶部](#)

### 3-3 自定义事件封装

Hooks也可以用于封装一些高级事件或者简化事件的处理，比如拖拽、手势、鼠标Active/Hover等等；

<br>

#### 3-3-1 useActive

举个简单的例子, useActive, 在鼠标按下时设置状态为true，鼠标释放时恢复为false:

```ts
function useActive(refEl: React.RefObject<HTMLElement>) {
  const [value, setValue] = useState(false)
  useEffect(() => {
    const handleMouseDown = () => {
      setValue(true)
    }
    const handleMouseUp = () => {
      setValue(false)
    }

    // DOM 事件监听
    if (refEl && refEl.current) {
      refEl.current.addEventListener('mousedown', handleMouseDown)
      refEl.current.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      if (refEl && refEl.current) {
        refEl.current.removeEventListener('mousedown', handleMouseDown)
        refEl.current.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [])

  return value
}

// ----------
// EXAMPLE
// ----------
function Demo() {
  const elRef = useRef(null)
  const active = useActive(inputRef)

  return (<div ref={elRef}>{active ? "Active" : "Nop"}</div>)
}
```

<br>

[⤴️回到顶部](#)

#### 3-3-2 useTouch 手势事件封装

更复杂的自定义事件, 例如手势。限于篇幅就不列举它们的实现代码，我们可以看看它们的Demo:

```ts
function Demo() {
  const {ref} = useTouch({
    onTap: () => { /* 点击 */ },
    onLongTap: () => { /* 长按 */ },
    onRotate: () => {/* 旋转 */}
    // ...
  })

  return (<div className="box" ref={ref}></div>)
}
```

useTouch的实现可以参考[useTouch.ts](https://github.com/GDJiaMi/hooks/blob/master/src/useTouch.ts)

<br>

[⤴️回到顶部](#)

#### 3-3-3 useDraggable 拖拽事件封装

拖拽也是一个典型的自定义事件, 下面这个例子来源于[这里](https://stackblitz.com/edit/usedraggable)

```ts
function useDraggable(ref: React.RefObject<HTMLElement>) {
  const [{ dx, dy }, setOffset] = useState({ dx: 0, dy: 0 })

  useEffect(() => {
    if (ref.current == null) {
      throw new Error(`[useDraggable] ref未注册到组件中`)
    }
    const el = ref.current

    const handleMouseDown = (event: MouseEvent) => {
      const startX = event.pageX - dx
      const startY = event.pageY - dy

      const handleMouseMove = (event: MouseEvent) => {
        const newDx = event.pageX - startX
        const newDy = event.pageY - startY
        setOffset({ dx: newDx, dy: newDy })
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener(
        'mouseup',
        () => {
          document.removeEventListener('mousemove', handleMouseMove)
        },
        { once: true },
      )
    }

    el.addEventListener('mousedown', handleMouseDown)

    return () => {
      el.removeEventListener('mousedown', handleMouseDown)
    }
  }, [dx, dy])

  useEffect(() => {
    if (ref.current) {
      ref.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`
    }
  }, [dx, dy])
}

// -----------
// EXAMPLE
// -----------
function Demo() {
  const el = useRef();
  useDraggable(el);

  return <div className="box" ref={el} />
}
```

可运行[例子](https://stackblitz.com/edit/usedraggable)

<br>

[⤴️回到顶部](#)

#### 3-3-4 react-events 面向未来的高级事件封装

我在[<谈谈React事件机制和未来(react-events)>](https://juejin.im/post/5d44e3745188255d5861d654)介绍了`React-Events`这个**实验性**的API。当这个API成熟后，我们可以基于它来实现更优雅的高级事件的封装：

```js
import { PressResponder, usePressListener } from 'react-events/press';

const Button = (props) => (
  const listener = usePressListener({  // ⚛️ 通过hooks创建Responder
    onPressStart,
    onPress,
    onPressEnd,
  })

  return (
    <div listeners={listener}>
      {subtrees}
    </div>
  );
);
```

<br>

[⤴️回到顶部](#)

### 3-4 useSubscription 通用事件源订阅

React官方维护了一个[use-subscription](https://github.com/facebook/react/tree/master/packages/use-subscription)包，支持使用Hooks的形式来监听事件源. 事件源可以是DOM事件、RxJS的Observable等等.

先来看看使用示例:

```js
// 监听rxjs behaviorSubject
function Demo() {
  const subscription = useMemo(
    () => ({
      getCurrentValue: () => behaviorSubject.getValue(),
      subscribe: callback => {
        // 当事件触发时调用callback
        const subscription = behaviorSubject.subscribe(callback);
        // 和useEffect一样，返回一个函数来取消订阅
        return () => subscription.unsubscribe();
      }
    }),
    // 在behaviorSubject变化后重新订阅
    [behaviorSubject]
  );

  const value = useSubscription(subscription);

  return <div>{value}</div>
}
```

现在来看看实现:

```ts
export function useSubscription<T>({
  getCurrentValue,
  subscribe,
}: {
  // 获取当前值
  getCurrentValue?: () => T
  // 用于订阅事件源
  subscribe: (callback: Function) => () => void
}): T {
  const [state, setState] = useState(() => ({ getCurrentValue, subscribe, value: getCurrentValue() }))
  let valueToReturn = state.value

  // 更新getCurrentValue和subscribe
  if (state.getCurrentValue !== getCurrentValue || state.subscribe !== subscribe) {
    valueToReturn = getCurrentValue()
    setState({ getCurrentValue, subscribe, value: valueToReturn })
  }

  useEffect(() => {
    let didUnsubscribe = false
    const checkForUpdates = () => {
      if (didUnsubscribe) {
        return
      }

      setState(prevState => {
        // 检查getCurrentValue和subscribe是否变动
        // setState时如果返回值没有变化，则不会触发重新渲染
        if (prevState.getCurrentValue !== getCurrentValue || prevState.subscribe !== subscribe) {
          return prevState
        }
        // 值没变动
        const value = getCurrentValue()
        if (prevState.value === value) {
          return prevState
        }

        return { ...prevState, value }
      })
    }
    const unsubscribe = subscribe(checkForUpdates)
    checkForUpdates()

    return () => {
      didUnsubscribe = true
      unsubscribe()
    }
  }, [getCurrentValue, subscribe])

  return valueToReturn
}
```

实现也不复杂，甚至可以说有点啰嗦.

<br>

[⤴️回到顶部](#)

### 3-5 useObservable Hooks和RxJS优雅的结合(rxjs-hooks)

如果要配合RxJS使用，LeetCode团队封装了一个[rxjs-hooks](https://github.com/LeetCode-OpenSource/rxjs-hooks/blob/master/README.md)库，用起来则要优雅很多, 非常推荐:

```ts
function App() {
  const value = useObservable(() => interval(500).pipe(map((val) => val * 3)));

  return (
    <div className="App">
      <h1>Incremental number: {value}</h1>
    </div>
  );
}
```

<br>

[⤴️回到顶部](#)

### 3-6 useEventEmitter 对接eventEmitter

我在[React组件设计实践总结04 - 组件的思维](https://juejin.im/post/5cdc2f54e51d453b0c35930d#heading-3)这篇文章里面提过：**自定义 hook 和函数组件的代码结构基本一致, 所以有时候hooks 写着写着原来越像组件, 组件写着写着越像 hooks. 我觉得可以认为组件就是一种特殊的 hook, 只不过它输出 Virtual DOM**

Hooks跟组件一样，是一个逻辑和状态的聚合单元。可以维护自己的状态、有自己的'生命周期'.

`useEventEmitter`就是一个典型的例子，可以独立地维护和释放自己的资源:

```ts
const functionReturnObject = () => ({})
const functionReturnArray = () => []

export function useEventEmitter(emmiter: EventEmitter) {
  const disposers = useRef<Function[]>([])
  const listeners = useRef<{ [name: string]: Function }>({})

  const on = useCallback(<P>(name: string, cb: (data: P) => void) => {
    if (!(name in listeners.current)) {
      const call = (...args: any[]) => {
        const fn = listeners.current[name]
        if (fn) {
          fn(...args)
        }
      }
      // 监听eventEmitter
      emmiter.on(name, call)
      disposers.current.push(() => {
        emmiter.off(name, call)
      })
    }

    listeners.current[name] = cb
  }, [])

  useEffect(() => {
    // 资源释放
    return () => {
      disposers.current.forEach(i => i())
    }
  }, [])

  return {
    on,
    emit: emmiter.emit,
  }
}


// ---------
// EXAMPLE
// ---------
function Demo() {
  const { on, emit } = useEventEmitter(eventBus)

  // 事件监听
  on('someEvent', () => {
    // do something
  })

  const handleClick = useCallback(() => {
    // 事件触发
    emit('anotherEvent', someData)
  }, [])

  return (<div onClick={handleClick}>...</div>)
}
```

<br>
<br>

更多脑洞：

- [use-socketio](https://github.com/mfrachet/use-socketio)

<br>

[⤴️回到顶部](#)

## **4. Context的妙用**

通过[`useContext`](https://reactjs.org/docs/hooks-reference.html#usecontext)可以方便地引用Context。不过需要注意的是如果上级`Context.Provider`的value变化，使用useContext的组件就会被强制重新渲染。

### 4-1 useTheme 主题配置

原本需要使用高阶组件注入或Context.Consumer获取的Context值，现在变得非常简洁：

```ts
/**
 * 传统方式
 */
// 通过高阶组件注入
withTheme(MyComponent)

// 获取利用Context.Consumer
const MyComponentWithTheme = (props) => {
  return (<ThemeContext.Consumer>
    {value => <MyComponent theme={value} {...props}></MyComponent>}
  </ThemeContext.Consumer>)
}
```

Hooks方式

```ts
import React, { useContext, FC } from 'react'

const ThemeContext = React.createContext<object>({})

export const ThemeProvider: FC<{ theme: object }> = props => {
  return <ThemeContext.Provider value={props.theme}>{props.children}</ThemeContext.Provider>
}

export function useTheme<T extends object>(): T {
  return useContext(ThemeContext)
}

// ---------
// EXAMPLE
// ---------
const theme = {
  primary: '#000',
  secondary: '#444',
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div>...</div>
    </ThemeProvider>
  )
}

const Button: FC = props => {
  const t = useTheme<typeof theme>()
  const style = {
    color: t.primary,
  }
  return <button style={style}>{props.children}</button>
}
```

<br>

[⤴️回到顶部](#)

### 4-2 unstated 简单状态管理器

Hooks + Context 也可以用于实现简单的状态管理。

我在[React组件设计实践总结05 - 状态管理](https://juejin.im/post/5ce3ee436fb9a07f070e0220#heading-2)就提到过[unstated-next](https://link.juejin.im/?target=https%3A%2F%2Fgithub.com%2Fjamiebuilds%2Funstated-next)， 这个库只有主体代码十几行，**利用了React本身的机制来实现状态管理**.

先来看看使用示例

```ts
import React, { useState } from "react"
import { createContainer } from "unstated-next"

function useCounter(initialState = 0) {
  let [count, setCount] = useState(initialState)
  let decrement = () => setCount(count - 1)
  let increment = () => setCount(count + 1)
  return { count, decrement, increment }
}

let Counter = createContainer(useCounter)

function CounterDisplay() {
  let counter = Counter.useContainer()
  return (
    <div>
      <button onClick={counter.decrement}>-</button>
      <span>{counter.count}</span>
      <button onClick={counter.increment}>+</button>
    </div>
  )
}
```

看看它的源码:

```ts
export function createContainer(useHook) {
  // 只是创建一个Context
	let Context = React.createContext(null)

	function Provider(props) {
		let value = useHook(props.initialState)
		return <Context.Provider value={value}>{props.children}</Context.Provider>
	}

	function useContainer() {
    // 只是使用useContext
		let value = React.useContext(Context)
		if (value === null) {
			throw new Error("Component must be wrapped with <Container.Provider>")
		}
		return value
	}

	return { Provider, useContainer }
}

export function useContainer(container) {
	return container.useContainer()
}
```

到这里，你会说，我靠，就这样? 这个库感觉啥事情都没干啊?

需要注意的是, **Context不是万金油，它作为状态管理有一个比较致命的缺陷**，我在[浅谈React性能优化的方向](https://juejin.im/post/5d045350f265da1b695d5bf2#heading-14)文章中也提到了这一点:
**它是可以穿透React.memo或者shouldComponentUpdate的比对的，也就是说，一旦 Context 的 Value 变动，所有依赖该 Context 的组件会全部 forceUpdate**

所以如果你打算使用Context作为状态管理，一定要注意规避这一点. 它可能会导致组件频繁重新渲染.

<br>

其他状态管理方案:

- [easy-peasy](https://github.com/ctrlplusb/easy-peasy)
- [react-hooks-global-state](https://github.com/dai-shi/react-hooks-global-state)

<br>

[⤴️回到顶部](#)

### 4-3 useI18n 国际化

I18n是另一个Context的典型使用场景。[react-intl](https://github.com/formatjs/react-intl/blob/master/docs/API.md#useintl-hook-currently-available-in-300-beta)和[react-i18next](https://react.i18next.com/latest/usetranslation-hook)都与时俱进，推出了自己的Hook API, **基本上原本使用高阶组件(HOC)实现的功能都可以用Hooks代替，让代码变得更加简洁**:

```js
import React from 'react';
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t, i18n } = useTranslation();

  return <p>{t('my translated text')}</p>
}
```

<br>

[⤴️回到顶部](#)

### 4-4 useRouter 简化路由状态的访问

React Hooks 推出已经接近一年，ReactRouter竟然还没有正式推出Hook API。不过它们也提上了计划 —— [The Future of React Router and @reach/router](https://reacttraining.com/blog/reach-react-router-future/)，5.X版本会推出Hook API. 我们暂时先看看一些代码示例:

```js
function SomeComponent() {
  // 访问路由变量
  const { userId } = useParams()
  // ...
}

function usePageViews() {
  // 访问location对象
  // 原本对于非路由组件，需要访问路由信息需要通过withRouter高阶组件注入
  const { location } = useLocation()
  useEffect(() => {
    ga('send', 'pageview', location.pathname)
  }, [location])
}
```

再等等吧!

<br>

[⤴️回到顶部](#)

### 4-5 react-hook-form Hooks和表单能擦出什么火花?

[react-hook-form](https://github.com/react-hook-form/react-hook-form)是Hooks+Form的典型案例，比较符合我理想中的表单管理方式:

```js
import React from 'react';
import useForm from 'react-hook-form';

function App() {
  const { register, handleSubmit, errors } = useForm(); // initialise the hook
  const onSubmit = data => {
    console.log(data);
  }; // callback when validation pass

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input name="firstname" ref={register} /> {/* register an input */}
      
      <input name="lastname" ref={register({ required: true })} />
      {errors.lastname && 'Last name is required.'}
      
      <input name="age" ref={register({ pattern: /\d+/ })} />
      {errors.age && 'Please enter number for age.'}
      
      <input type="submit" />
    </form>
  );
}
```

<br>

[⤴️回到顶部](#)

<br>

## **5. 副作用封装**

我们可以**利用Hooks来封装或监听组件外部的副作用，将它们转换为组件的状态**。

<br>

### 5-1 useTimeout 超时修改状态

useTimeout由用户触发，在指定时间后恢复状态. 比如可以用于'短期禁用'按钮, 避免重复点击:

```ts
function Demo() {
  const [disabled, start] = useTimeout(5000)
  const handleClick = () => {
    start()
    dosomething()
  }

  return <Button onClick={handleClick} disabled={disabled}>点我</Button>
}
```

实现:

```ts
function useTimeout(ms: string) {
  const [ready, setReady] = useState(false)
  const timerRef = useRef<number>()

  const start = useCallback(() => {
    clearTimeout(timerRef.current)
    setReady(true)
    timerRef.current = setTimeout(() => {
      setReady(false)
    }, ms)
  }, [ms])

  const stop = useCallback(() => {
    clearTimeout(timerRef.current)
  }, [])

  useOnUnmount(stop)

  return [ready, start, stop]
}
```

<br>

[⤴️回到顶部](#)

### 5-2 useOnlineStatus 监听在线状态

副作用封装一个比较典型的案例就是监听主机的在线状态：

```ts
function getOnlineStatus() {
  return typeof navigator.onLine === 'boolean' ? navigator.onLine : true
}

function useOnlineStatus() {
  let [onlineStatus, setOnlineStatus] = useState(getOnlineStatus())

  useEffect(() => {
    const online = () => setOnlineStatus(true)
    const offline = () => setOnlineStatus(false)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)

    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  return onlineStatus
}

// --------
// EXAMPLE
// --------
function Demo() {
  let onlineStatus = useOnlineStatus();
  return (
    <div>
      <h1>网络状态: {onlineStatus ? "在线" : "离线"}</h1>
    </div>
  );
}
```

<br>

还有很多案例, 这里就不一一列举，读者可以自己尝试去实现，比如:

- useDeviceOrientation 监听设备方向
- useGeolocation 监听GPS坐标变化
- useScrollPosition 监听滚动位置
- useMotion 监听设备运动
- useMediaDevice 监听媒体设备
- useDarkMode 夜间模式监听
- useKeyBindings 监听快捷键
- ....

<br>

[⤴️回到顶部](#)

<br>

## **6. 副作用衍生**

**和`副作用封装`相反，副作用衍生是指当组件状态变化时，衍生出其他副作用. 两者的方向是相反的**.

副作用衍生主要会用到useEffect，使用useEffect来响应状态的变化.

### 6-1 useTitle 设置文档title

useTitle是最简单的，当给定的值变化时，更新`document.title`

```ts
function useTitle(t: string) {
  useEffect(() => {
    document.title = t
  }, [t])
}

// --------
// EXAMPLE
// --------
function Demo(props) {
  useTitle(props.isEdit ? '编辑' : '新增')
  // ....
}
```

<br>

[⤴️回到顶部](#)

### 6-2 useDebounce

再来个复杂一点的，useDebounce：当某些状态变化时，它会延迟执行某些操作：

```ts
function useDebounce(fn: () => void, args?: any[], ms: number = 100, skipMount?: boolean) {
  const mounted = useRef(false)
  useEffect(() => {
    // 跳过挂载执行
    if (skipMount && !mounted.current) {
      mounted.current = true
      return undefined
    }

    const timer = setTimeout(fn, ms)

    return () => {
      // 如果args变化，先清除计时器
      clearTimeout(timer)
    }
  }, args)
}

// -----------
// EXAMPLE
// -----------
const returnEmptyArray = () => []
function Demo() {
  const [query, setQuery] = useState('')
  const [list, setList] = useState(returnEmptyArray)

  // 搜索
  const handleSearch = async () => {
    setList(await fetchList(query))
  }

  // 当query变化时执行搜索
  useDebounce(handleSearch, [query], 500)

  return (<div>
    <SearchBar value={query} onChange={setQuery} />
    <Result list={list}></Result>
  </div>)
}
```

<br>

[⤴️回到顶部](#)

### 6-3 useThrottle

同理可以实现useThrottle, 下面的例子来源于[react-use](https://github.com/streamich/react-use/blob/master/src/useThrottleFn.ts):

```ts
const useThrottleFn = <T>(fn: (...args: any[]) => T, ms: number = 200, args: any[]) => {
  const [state, setState] = useState<T>(null as any);
  const timeout = useRef<any>(null);
  const nextArgs = useRef(null) as any;
  const hasNextArgs = useRef(false) as any;

  useEffect(() => {
    if (!timeout.current) {
      setState(fn(...args));
      const timeoutCallback = () => {
        if (hasNextArgs.current) {
          hasNextArgs.current = false;
          setState(fn(...nextArgs.current));
          timeout.current = setTimeout(timeoutCallback, ms);
        } else {
          timeout.current = null;
        }
      };
      timeout.current = setTimeout(timeoutCallback, ms);
    } else {
      nextArgs.current = args;
      hasNextArgs.current = true;
    }
  }, args);

  useOnUnmount(() => {
    clearTimeout(timeout.current);
  });

  return state;
};
```

<br>

[⤴️回到顶部](#)

<br>

## **7. 简化业务逻辑**

**80%的程序员80%的时间在写业务代码**. 有了Hooks，React开发者如获至宝. 组件的代码可以变得很精简，且这些Hooks可以方便地在组件之间复用:

![](https://bobi.ink/images/react-hooks/hooks-transform.png)

<br>

下面介绍，如何利用Hooks来简化业务代码

### 7-1 usePromise 封装异步请求

第一个例子，试试封装一下promise，简化简单页面异步请求的流程. 先来看看usePromise的使用示例，我理想中的usePromise应该长这样:

```tsx
function Demo() {
  const list = usePromise(async (id: string) => {
    return fetchList(id)
  })

  return (<div>
    {/* 触发请求 */}
    <button onClick={() => list.callIgnoreError('myId')}>Get List</button>
    {/* 错误信息展示和重试 */}
    {!!list.error && <ErrorMessage error={list.error} retry={list.retry}>加载失败:</ErrorMessage>}
    {/* 加载状态 */}
    <Loader loading={list.loading}>
      {/* 请求结果 */}
      <Result value={list.value}></Result>
    </Loader>
  </div>)
}
```

<br>

usePromise是我用得比较多的一个Hooks，所以我把它完整的代码，包括Typescript注解都贴出来，供大家参考参考:

```ts
// 定义usePromise的返回值
export interface Res<T, S> {
  loading: boolean
  error?: Error
  value?: S
  setValue: (v: S) => void
  call: T
  callIgnoreError: T
  reset: () => void
  retry: () => void
}

// 定义usePromise 参数
export interface UsePromiseOptions {
  // 如果promise正在加载中则跳过，默认为true
  skipOnLoading?: boolean
}

// 👇 下面是一堆Typescript函数重载声明，为了方便Typescript推断泛型变量. 小白可以跳过
function usePromise<T>(action: () => Promise<T>, option?: UsePromiseOptions): Res<() => Promise<T>, T>
function usePromise<T, A>(action: (arg0: A) => Promise<T>, option?: UsePromiseOptions): Res<(arg0: A) => Promise<T>, T>
function usePromise<T, A, B>(action: (arg0: A, arg1: B) => Promise<T>, option?: UsePromiseOptions): Res<(arg0: A, arg1: B) => Promise<T>, T>
function usePromise<T, A, B, C>( action: (arg0: A, arg1: B, arg2: C) => Promise<T>, option?: UsePromiseOptions): Res<(arg0: A, arg1: B, arg2: C) => Promise<T>, T>
function usePromise<T, A, B, C, D>(action: (arg0: A, arg1: B, arg2: C, arg3: D) => Promise<T>, option?: UsePromiseOptions): Res<(arg0: A, arg1: B, arg2: C, arg3: D) => Promise<T>, T>
function usePromise(action: (...args: any[]) => Promise<any>, option?: UsePromiseOptions): Res<(...args: any) => Promise<any>, any>
// 👆 上面是一堆Typescript函数重载声明，可以跳过

/**
 * 接受一个action，用于执行异步操作
 */
function usePromise(
  action: (...args: any[]) => Promise<any>,
  option: UsePromiseOptions = { skipOnLoading: true },
): Res<(...args: any) => Promise<any>, any> {
  const actionRef = useRefProps(action)
  const optionRef = useRefProps(option)
  const [loading, setLoading, loadingRef] = useRefState(false)
  const taskIdRef = useRef<number>()
  const argsRef = useRef<any[]>()
  const [value, setValue] = useState()
  const [error, setError, errorRef] = useRefState<Error | undefined>()

  const caller = useCallback(async (...args: any[]) => {
    argsRef.current = args
    if (loadingRef.current && optionRef.current.skipOnLoading) {
      return
    }
    const taskId = getUid()
    taskIdRef.current = taskId

    // 已经有新的任务在执行了，什么都不做
    const shouldContinue = () => {
      if (taskId !== taskIdRef.current) {
        return false
      }
      return true
    }

    try {
      setLoading(true)
      setError(undefined)
      const res = await actionRef.current(...args)

      if (!shouldContinue()) return
      setValue(res)
      return res
    } catch (err) {
      if (shouldContinue()) {
        setError(err)
      }
      throw err
    } finally {
      if (shouldContinue()) {
        setLoading(false)
      }
    }
  }, [])

  // 不抛出异常
  const callIgnoreError = useCallback(
    async (...args: any[]) => {
      try {
        return await caller(...args)
      } catch {
        // ignore
      }
    },
    [caller],
  )

  const reset = useCallback(() => {
    setLoading(false)
    setValue(undefined)
    setError(undefined)
  }, [])

  // 失败后重试
  const retry = useCallback(() => {
    if (argsRef.current && errorRef.current) {
      return callIgnoreError(...argsRef.current)
    }
    throw new Error(`not call yet`)
  }, [])

  return {
    loading,
    error,
    call: caller,
    callIgnoreError,
    value,
    setValue,
    reset,
    retry,
  }
}
```

<br>

[⤴️回到顶部](#)

### 7-2 usePromiseEffect 自动进行异步请求

很多时候，我们是在组件一挂载或者某些状态变化时自动进行一步请求的，我们在usePromise的基础上，结合useEffect来实现自动调用:

```ts
// 为了缩短篇幅，这里就不考虑跟usePromise一样的函数重载了
export default function usePromiseEffect<T>(
  action: (...args: any[]) => Promise<T>,
  args?: any[],
) {
  const prom = usePromise(action)

  // 使用useEffect监听参数变动并执行
  useEffect(() => {
    prom.callIgnoreError.apply(null, args)
  }, args)

  return prom
}

// ---------
// EXAMPLE
// ---------
function Demo(props) {
  // 在挂载或者id变化时请求
  const list = usePromiseEffect((id) => fetchById(id), [id])

  // 同usePromise
}
```

看到这里，应该惊叹Hooks的抽象能力了吧！😸

<br>

[⤴️回到顶部](#)

### 7-3 useInfiniteList 实现无限加载列表

这里例子在之前的文章中也提及过

```ts
export default function useInfiniteList<T>(
  fn: (params: { offset: number; pageSize: number; list: T[] }) => Promise<T[]>,
  pageSize: number = 20,
) {
  const [list, setList] = useState<T[]>(returnEmptyArray)
  // 列表是否全部加载完毕
  const [hasMore, setHasMore, hasMoreRef] = useRefState(true)
  // 列表是否为空
  const [empty, setEmpty] = useState(false)
  const promise = usePromise(() => fn({ list, offset: list.length, pageSize }))

  const load = useCallback(async () => {
    if (!hasMoreRef.current) {
      return
    }
    const res = await promise.call()
    if (res.length < pageSize) {
      setHasMore(false)
    }

    setList(l => {
      if (res.length === 0 && l.length === 0) {
        setEmpty(true)
      }

      return [...l, ...res]
    })
  }, [])

  // 清空列表
  const clean = useCallback(() => {
    setList([])
    setHasMore(true)
    setEmpty(false)
    promise.reset()
  }, [])

  // 刷新列表
  const refresh = useCallback(() => {
    clean()
    setTimeout(() => {
      load()
    })
  }, [])

  return {
    list,
    hasMore,
    empty,
    loading: promise.loading,
    error: promise.error,
    load,
    refresh,
  }
}
```

<br>

使用示例:

```ts
interface Item {
  id: number
  name: string
}
function App() {
  const { load, list, hasMore, refresh } = useInfiniteList<Item>(async ({ offset, pageSize }) => {
    const list = []
    for (let i = offset; i < offset + pageSize; i++) {
      if (i === 200) {
        break
      }
      list.push({ id: i, name: `${i}-----` })
    }
    return list
  })

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="App">
      <button onClick={refresh}>Refresh</button>
      {list.map(i => (
        <div key={i.id}>{i.name}</div>
      ))}
      {hasMore ? <button onClick={load}>Load more</button> : <div>No more</div>}
    </div>
  )
}
```

<br>

[⤴️回到顶部](#)

### 7-4 usePoll 用hook实现轮询

下面使用Hooks实现一个定时轮询器

```ts
export interface UsePollOptions<T> {
  /**
   * 决定是否要继续轮询
   * @param arg 上一次轮询返回的值
   */
  condition: (arg?: T, error?: Error) => Promise<boolean>
  /**
   * 轮询操作
   */
  poller: () => Promise<T>
  onError?: (err: Error) => void
  /**
   * 轮询间隔. 默认 5000
   */
  duration?: number
  /**
   * 监听的参数，当这些参数变化时，重新检查轮询条件，决定是否继续轮询
   */
  args?: any[]
  /**
   * 是否立即轮询
   */
  immediately?: boolean
}

/**
 * 实现页面轮询机制
 */
export default function usePoll<T = any>(options: UsePollOptions<T>) {
  const [polling, setPolling, pollingRef] = useRefState(false)
  const [error, setError] = useState<Error>()
  const state = useInstance<{ timer?: number; unmounted?: boolean }>({})
  const optionsRef = useRefProps(options)

  const poll = useCallback(async (immediate?: boolean) => {
    // 已经卸载，或其他轮询器正在轮询
    if (state.unmounted || pollingRef.current) return
    setPolling(true)
    state.timer = window.setTimeout(
      async () => {
        if (state.unmounted) return
        try {
          let res: T | undefined
          let error: Error | undefined
          setError(undefined)

          try {
            res = await optionsRef.current.poller()
          } catch (err) {
            error = err
            setError(err)
            if (optionsRef.current.onError) {
              optionsRef.current.onError(err)
            }
          }
          // 准备下一次轮询
          if (!state.unmounted && (await optionsRef.current.condition(res, error))) {
            setTimeout(poll)
          }
        } finally {
          !state.unmounted && setPolling(false)
        }
      },
      immediate ? 0 : optionsRef.current.duration || 5000,
    )
  }, [])

  useOnUpdate(
    async () => {
      if (await optionsRef.current.condition()) poll(options.immediately)
    },
    options.args || [],
    false,
  )

  useOnUnmount(() => {
    state.unmounted = true
    clearTimeout(state.timer)
  })

  return { polling, error }
}
```

使用示例:

```ts
function Demo() {
  const [query, setQuery] = useState(')
  const [result, setResult] = useState<Result>()
  usePoll({
    poller: await() => {
      const res =await fetch(query)
      setResult(res)
      return res
    }
    condition: async () => {
      return query !== ''
    },
    args: [query],
  })

  // ...
}
```

<br>

[⤴️回到顶部](#)

### 7-5 业务逻辑抽离

通过上面的案例可以看到, Hooks非常适合用于抽离重复的业务逻辑。

在[React组件设计实践总结02 - 组件的组织](https://juejin.im/post/5cd8fb916fb9a03218556fc1#heading-6)介绍了容器组件和展示组件分离，Hooks时代，**我们可以自然地将逻辑都放置到Hooks中，实现逻辑和视图的分离**。

抽离的后业务逻辑可以复用于不同的'展示平台', 例如 web 版和 native 版:

```shell
Login/
  useLogin.ts   // 将所有逻辑都抽取到Hooks中
  index.web.tsx // 只保留视图
  index.tsx
```

<br>
<br>

[⤴️回到顶部](#)

## **8. 开脑洞**

一些奇奇怪怪的东西，不知道怎么分类。作者想象力非常丰富!

### 8-1 useScript: Hooks + Suspend = ❤️

这个案例来源于[the-platform](https://github.com/palmerhq/the-platform#usescript), 使用script标签来加载外部脚本:

```ts
// 注意: 这还是实验性特性
import {createResource} from 'react-cache'

export const ScriptResource = createResource((src: string) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(script);
    script.onerror = reject;
    document.body.appendChild(script);
  });
});


function useScript(options: { src: string }) {
  return ScriptResource.read(src);
}
```

<br>

使用示例:

```ts
import { useScript } from 'the-platform';

const Example = () => {
   useScript({ src: 'bundle.js' });
  // ...
};

// Suspend
function App() {
  return <Suspense fallback={'loading...'}><Example></Example></Suspense>
}
```

同理还可以实现

- [useStylesheet](https://github.com/palmerhq/the-platform/blob/master/src/Stylesheet.tsx) 用于加载样式表
- [fetch-suspense](https://github.com/CharlesStover/fetch-suspense)

<br>

[⤴️回到顶部](#)

### 8-2 useModal 模态框数据流管理

我在[React组件设计实践总结04 - 组件的思维](https://juejin.im/post/5cdc2f54e51d453b0c35930d#heading-6)也举到一个使用`Hooks + Context`来巧妙实现模态框管理的例子。

先来看看如何使用Context来渲染模态框, 很简单, ModalContext.Provider给下级组件暴露一个render方法，通过这个方法来传递需要渲染的模态框组件和props:

```ts
// 模态框组件要实现的接口
export interface BaseModalProps {
  visible: boolean
  onHide: () => void
}

interface ModalContextValue {
  render(Component: React.ComponentType<any>, props: any): void
}

const Context = React.createContext<ModalContextValue>({
  render: () => {
    throw new Error("useModal 必须在ModalRenderer 下级")
  },
})

// 模态框渲染器
const ModalRenderer: FC<{}> = props => {
  const [modal, setModal] = useState<
    | { Comp: React.ComponentType<any>; props: any; visible?: boolean }
    | undefined
  >()

  const hide = useCallback(() => {
    setModal(prev => prev && { ...prev, visible: false })
  }, [])

  // 由下级组件调用，传递需要渲染的组件和props
  const render = useCallback<ModalContextValue["render"]>((Comp, props) => {
    setModal({ Comp, props, visible: true })
  }, [])

  const value = useMemo(() => ({render}), [])

  return (
    <Context.Provider value={value}>
      {props.children}
      <div className="modal-container">
        {/*模态框渲染 */}
        {!!modal &&
          React.createElement(modal.Comp, {
            ...modal.props,
            visible: modal.visible,
            onHide: hide,
          })}
      </div>
    </Context.Provider>
  )
}
```

再看看Hooks的实现, 也很简单，就是使用useContext来访问ModalContext， 并调用render方法:

```ts
export function useModal<P extends BaseModalProps>(
  Modal: React.ComponentType<P>,
) {
  const renderer = useContext(Context)

  return useCallback(
    (props: Omit<P, keyof BaseModalProps>) => {
      renderer.render(Modal, props || {})
    },
    [Modal],
  )
}
```

应用示例:

```ts
const MyModal: FC<BaseModalProps & { a: number }> = props => {
  return (
    <Modal visible={props.visible} onOk={props.onHide} onCancel={props.onHide}>
      {props.a}
    </Modal>
  )
}

const Home: FC<{}> = props => {
  const showMyModal = useModal(MyModal)

  const handleShow = useCallback(() => {
    // 显示模态框
    showMyModal({
      a: 123,
    })
  }, [])

  return (
    <div>
      showMyModal: <button onClick={handleShow}>show</button>
    </div>
  )
}
```

可运行的完整示例可以看[这里](https://codesandbox.io/s/lryom9617l?fontsize=14)

<br>

[⤴️回到顶部](#)

## **React Hooks 技术地图**

**全家桶和Hooks的结合**:

- [Redux + Hooks](https://react-redux.js.org/api/hooks)
- [Mobx + Hooks](https://github.com/mobxjs/mobx-react-lite)
- [ReactSpring + Hooks](https://www.react-spring.io/docs/hooks/basics)
- [Appoll](https://www.apollographql.com/docs/react/api/react-hooks/)
- [react-i18next](https://react.i18next.com/latest/usetranslation-hook)
- [react-router](https://reacttraining.com/blog/reach-react-router-future/) Come in soon

<br>

**一些有趣的Hooks集合**:

- [the-platform](https://github.com/palmerhq/the-platform#usescript)
- [react-use](https://github.com/streamich/react-use)
- [rehooks/ideas](https://github.com/rehooks/ideas/issues) 一起开脑洞
- [react-hanger](https://github.com/kitze/react-hanger)

<br>

**Awesome**

- [Awesome React Hooks](https://github.com/rehooks/awesome-react-hooks)
- [Hooks.Guide](https://www.hooks.guide/rehooks/useComponentSize)
- [useHooks](https://usehooks.com/)

<br>

**FAQ**

- [官方Hooks FAQ](https://zh-hans.reactjs.org/docs/hooks-faq.html) 可以解答大部分的疑问

<br>
<br>

## 总结

本文篇幅很长、代码很多。能滑到这里相当不容易, 给你点个赞。

你用React Hook遇到过什么问题？ 开过什么脑洞，下方评论告诉我.

欢迎关注我, 和我交流. 我有社恐, 但想多交些圈内朋友(`atob('YmxhbmstY2FybmV5')`, 备注掘金，我不喝茶，近期也不换工作)

本文完!
