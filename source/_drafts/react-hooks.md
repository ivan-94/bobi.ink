---
title: "2019年了，整理了N个应用案例帮你快速迁移到React Hooks"
date: 2019/8/10
categories: 前端
---

在[React Conf 2018](https://www.youtube.com/channel/UCz5vTaEhvh7dOHEyd1efcaQ)宣布React Hooks后，我就开始尝试使用React Hooks，现在新项目基本不写Class Component了。对我来说，它确实让我的开发效率提高了很多，它改变了已有的组件开发思维和模式. 

我在[React组件设计实践总结04 - 组件的思维](https://juejin.im/post/5cdc2f54e51d453b0c35930d#heading-3)中已经总结过React Hooks的意义，以及一些应用场景。那这篇文章就完全是React Hooks的应用实例，列举了我使用React Hooks的一些实践。

希望通过这些案例，可以帮助你快速迁移到React Hooks

把之前文章的React Hooks应用场景总结拿过来:

![](/images/react-hooks/apply.png)

<br>

如果你想要了解React Hooks的原理可以阅读这些文章:

- [React hooks: not magic, just arrays](https://link.juejin.im/?target=https%3A%2F%2Fmedium.com%2F%40ryardley%2Freact-hooks-not-magic-just-arrays-cd4f1857236e)
- [从Preact中了解组件和hooks基本原理](https://juejin.im/post/5cfa29e151882539c33e4f5e#heading-8)

<br>

**目录索引**

<!-- TOC -->

- [组件状态](#组件状态)
  - [useSetState 模拟传统的setState](#usesetstate-模拟传统的setstate)
  - [useReducer Redux风格状态管理](#usereducer-redux风格状态管理)
  - [useForceUpdate 强制重新渲染](#useforceupdate-强制重新渲染)
  - [useStorage 简化localStorage存取](#usestorage-简化localstorage存取)
  - [useRefState 引用state的最新值](#userefstate-引用state的最新值)
  - [useRefProps 引用最新的Props](#userefprops-引用最新的props)
    - [每次重新渲染都创建闭包会影响效率吗？](#每次重新渲染都创建闭包会影响效率吗)
  - [封装'工具'Hooks简化State的操作](#封装工具hooks简化state的操作)
    - [useToggle 开关](#usetoggle-开关)
    - [useArray](#usearray)
- [模拟生命周期函数](#模拟生命周期函数)
  - [useOnMount 模拟componentDidMount](#useonmount-模拟componentdidmount)
  - [useOnUnmount 模拟componentWillUnmount](#useonunmount-模拟componentwillunmount)
  - [useOnUpdate 模拟componentDidUpdate](#useonupdate-模拟componentdidupdate)
    - [useQuery](#usequery)
- [props处理](#props处理)
  - [获取上一个Props](#获取上一个props)
  - [useWhyUpdate](#usewhyupdate)
- [事件处理](#事件处理)
  - [useChange 简化onChange表单双向绑定](#usechange-简化onchange表单双向绑定)
  - [自定义事件封装](#自定义事件封装)
    - [useActive](#useactive)
    - [useTouch 手势事件封装](#usetouch-手势事件封装)
    - [useDraggable 拖拽事件封装](#usedraggable-拖拽事件封装)
    - [useListener react-events 面向未来的高级事件封装](#uselistener-react-events-面向未来的高级事件封装)
  - [useSubscription 通用事件源订阅](#usesubscription-通用事件源订阅)
  - [useObservable Hooks和RxJS优雅的尝试(rxjs-hooks)](#useobservable-hooks和rxjs优雅的尝试rxjs-hooks)
- [Context的妙用](#context的妙用)
  - [简单状态管理](#简单状态管理)
  - [useTheme](#usetheme)
  - [useI18n](#usei18n)
  - [useRouter](#userouter)
- [副作用封装](#副作用封装)
  - [useTitle](#usetitle)
  - [useNetworkStatus](#usenetworkstatus)
  - [useDebounce](#usedebounce)
- [简化业务逻辑](#简化业务逻辑)
  - [usePromise封装异步请求](#usepromise封装异步请求)
  - [usePromiseOnMount](#usepromiseonmount)
  - [useList](#uselist)
  - [业务逻辑抽离](#业务逻辑抽离)
- [React Hooks的生态](#react-hooks的生态)
- [扩展](#扩展)

<!-- /TOC -->

<br>

## 组件状态

React提供了一个基本的组件状态设置Hooks:

```js
const [state, setState] = useState(initialState);
```

[useState](https://zh-hans.reactjs.org/docs/hooks-reference.html#usestate)返回**一个state，以及更新state的函数**. setState接受一个新的值，并触发组件重新渲染.

> React会确保setState函数是稳定的，不会在组件重新渲染时改变。下面的useReducer的dispatch函数也一样。
> 这就意味着，可以安全地在useEffect、useCallback中使用

<br>

### useSetState 模拟传统的setState

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

而useState会直接覆盖state值。为了实现和setState一样的效果, 可以这样子做:

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

### useReducer Redux风格状态管理

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

了解更多reducer的思想可以参考[Redux文档](TODO:)

<br>

### useForceUpdate 强制重新渲染

Class组件可以通过forceUpdate实例方法来触发强制重新渲染。使用useState也可以模拟相同的效果：

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

### useStorage 简化localStorage存取

通过自定义Hooks，可以将状态代理到其他数据源，比如localStorage。 下面展示如果使用Hooks封装和简化localStorage的存取:

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

### useRefState 引用state的最新值

![](/image/react-hooks/vue-api.png)

上图是今年六月份VueConf，尤雨溪的Slide截图，他对比了Vue最新的FunctionBase API和React Hook. React Hooks有很多问题, 比如:

- 每个Hooks在组件每次渲染时都执行。也就是说每次渲染都要重新创建很多闭包和对象
- 需要理解闭包变量

首先闭包变量问题是你掌握React Hooks过程中的重要一关。闭包问题是指什么呢？举个简单的例子, Counter:

```tsx
function Counter() {
  const [count, setCount] = useState(0)
  const handleIncr = () => {
    setCount(count + 1)
  }

  return (<div>{count}: <ComplexButton onClick={handleIncr}>increment</ComplexButton></div>)
}
```

假设ComplexButton是一个非常复杂的组件，每一次点击它，我们会递增count，从而触发组将重新渲染。**因为Counter每次渲染都会重新生成handleIncr，所以也会导致ComplexButton重新渲染，不管ComplexButton使用了`PureComponent`还是使用`React.memo`包装**。

为了解决这个问题，React也提供了一个`useCallback` Hook, 用来‘缓存’函数. 比如我们可以这样使用:

```tsx
function Counter() {
  const [count, setCount] = useState(0)
  const handleIncr = useCallback(() => {
    setCount(count + 1)
  }, [])

  return (<div>{count}: <ComplexButton onClick={handleIncr}>increment</ComplexButton></div>)
}
```

上面的代码是有bug的，不过怎么点击，count会一直显示为1！再仔细阅读useCallback的文档，useCallback支持第二个参数，当这些值变动时更新缓存的函数, useCallback的内部逻辑大概是这样的：

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

![](/images/react-hooks/usecallback.png)

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

如果useCallback依赖很多值，这时候代码可能是这样的：`useCallback(fn, [a, b, c, d, e])`. 反正我是无法接受这种代码的，而且可维护性很差，尽管通过ESLint插件可以检查这些问题。

<br>

通过`useRef` Hook，可以让我们像Class组件一样保存一些‘实例变量’, 可以在任何缓存的闭包里面安全地引用最新的值。基于这个原理，我们尝试封装一个`useRefState`, 它在useState的基础上扩展了一个返回值，用于获取state的最新值:

```ts
import { useState, useRef, useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react'

function useRefState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>, MutableRefObject<S>]
function useRefState<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>,
  MutableRefObject<S | undefined>
]
function useRefState<S>(
  initialState?: S | (() => S),
): [S | undefined, Dispatch<SetStateAction<S | undefined>>, MutableRefObject<S | undefined>] {
  const ins = useRef<S>()

  const [state, setState] = useState<S | undefined>(() => {
    // 初始化
    const value = typeof initialState === 'function' ? (initialState as () => S)() : initialState
    ins.current = value
    return value
  })

  const setValue = useCallback((value: SetStateAction<S | undefined>) => {
    if (typeof value === 'function') {
      setState(prevState => {
        const finalValue = (value as (prevState: S|undefined) => S)(prevState)
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

useEffect和useCallback一样存在闭包变量问题，所以它和useCallback一个支持指定第二个参数，当这个参数变化时执行副作用。

React会保证useRef返回值的稳定性，可以在组件的任意地方安全地引用.

<br>

### useRefProps 引用最新的Props

现实项目中也有有这种场景，我们需要获取最新的props值，这个同样可以通过useRef来实现：

```js
export default function useRefProps<T>(props: T) {
  const ref = useRef<T>(props)
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
<br>

#### 每次重新渲染都创建闭包会影响效率吗？

函数组件和Class组件不一样的是，每一次重新渲染会重复创建大量的闭包、数组和对象。而传统的Class组件的render函数则要简洁很多，一般只放置JSX。

我们看看官方是怎么回应的：

![](/images/react-hooks/fn-perf.png)

我在SegmentFault的[react function组件与class组件性能问题](https://segmentfault.com/q/1010000019644156/a-1020000019706666)进行了详细的回答, 结论是:

> 我刚开始写React hooks时也有这个顾虑，函数式组件每次渲染里面的闭包都要重新创建，不会很耗性能吗？ 类组件的方法是静态不变的，那是否在这点上类组件性能更好一点？
>
> 上面的答案其实已经说得很明白了，目前而言，实现同样的功能，类组件和函数组件的效率是不相上下的。但是函数组件是未来，而且还有优化空间，React团队会继续优化它。而类组件会逐渐退出历史

为了提高函数组件的性能，可以在这些地方做一些优化:

- 能否将函数提取为静态的
- 简化组件的复杂度，动静分离
- 再拆分更细粒度的组件，这些组件都使用React.memo缓存

<br>

### 封装'工具'Hooks简化State的操作

Hooks只是普通函数，所以可以灵活地自定义。下面举一些例子，利用自定义Hooks来简化常见的数据操作场景. 

<br>

#### useToggle 开关

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

#### useArray

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

限于篇幅，就不展开更多了，读者可以自己发挥想象力.

## 模拟生命周期函数

组件生命周期相关的操作依赖于`useEffect` Hook. React在函数组件中刻意淡化了组件生命周期的概念，而更关注‘数据的响应’.

`useEffect`名称意图非常明显，就是专门用来管理组件的副作用。和useCallback一样，useEffect支持传递第二个参数，告知React在这些值发生变动时才执行父作用. 原理大概如下:

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

// 队列执行
// 这个会在组件完成渲染，在布局(layout)和绘制(paint)之后被执行
// 如果是useLayoutEffect, 执行的时机会更早一些
function queueExecute(callback) {
  // 执行清理函数
  if (callback.disposer) {
    callback.disposer()
    callback.disposer = undefined
  }
  callback.disposer = callback.fn()
}
```

关于useEffect官网有详尽的[描述](https://zh-hans.reactjs.org/docs/hooks-reference.html#useeffect); Dan Abramov也写了一篇[useEffect 完整指南](https://overreacted.io/zh-hans/a-complete-guide-to-useeffect/), 推荐👍。

<br>

### useOnMount 模拟componentDidMount

```ts
export default function useOnMount(fn: Function) {
  useEffect(() => {
    fn()
  }, []) // 第二个参数设置为[], 表示只在首次渲染时调用
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

如果需要在挂载请求一些资源、并且需要在卸载时释放这些资源，还是推荐使用useEffect，这些逻辑最好放在一起, 方便维护和理解:

```js
// 但是useEffect传入的函数不支持async/await(返回Promise)
useEffect(() => {
  const subscription = props.source.subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

<br>

### useOnUnmount 模拟componentWillUnmount

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

### useOnUpdate 模拟componentDidUpdate

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

#### useQuery

## props处理

### 获取上一个Props
### useWhyUpdate

<br>
<br>

## 事件处理

### useChange 简化onChange表单双向绑定

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

### 自定义事件封装

Hooks也可以用于封装一些高级事件或者简化事件的处理，比如拖拽、手势、鼠标激活等等；

#### useActive

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

#### useTouch 手势事件封装

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

#### useDraggable 拖拽事件封装

拖拽也是一个典型的自定义事件

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

<br>

#### useListener react-events 面向未来的高级事件封装

我在[<谈谈React事件机制和未来(react-events)>](https://juejin.im/post/5d44e3745188255d5861d654)介绍了React-Events**实验性**的API。当这个API成熟后，我们可以基于它来实现更优雅的高级事件的封装：

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
<br>

### useSubscription 通用事件源订阅

React官方维护了一个use-subscription包，支持使用Hooks的形式来监听事件源. 事件源可以是DOM事件、RxJS的Observable等等.

先来看看使用示例:

```js
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

### useObservable Hooks和RxJS优雅的尝试(rxjs-hooks)

如果要配置RxJS使用，LeetCode团队封装了一个[rxjs-hooks](https://github.com/LeetCode-OpenSource/rxjs-hooks/blob/master/README.md)库，用起来则要优雅很多, 非常推荐:

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

## Context的妙用

### 简单状态管理
unstaged

### useTheme
### useI18n

### useRouter


## 副作用封装

### useTitle
### useNetworkStatus
### useDebounce

## 简化业务逻辑

### usePromise封装异步请求
### usePromiseOnMount
### useList
### 业务逻辑抽离

## React Hooks的生态

redux
react-spring
react-router
mobx
appoll

## 扩展

![Awesome React Hooks](https://github.com/rehooks/awesome-react-hooks)