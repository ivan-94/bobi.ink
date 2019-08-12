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
    - [useQuery](#usequery)
  - [useInstance](#useinstance)
  - [封装一些工具hooks](#封装一些工具hooks)
  - [获取最新的值](#获取最新的值)
- [props处理](#props处理)
  - [获取上一个Props](#获取上一个props)
  - [useWhyUpdate](#usewhyupdate)
- [简单状态管理](#简单状态管理)
- [context获取](#context获取)
  - [useTheme](#usetheme)
  - [useI18n](#usei18n)
  - [useRouter](#userouter)
- [模拟生命周期函数](#模拟生命周期函数)
- [事件处理](#事件处理)
  - [useChange](#usechange)
  - [自定义事件封装](#自定义事件封装)
  - [订阅](#订阅)
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

#### useQuery
### useInstance
### 封装一些工具hooks
  #### useToggle
  #### useArray
### 获取最新的值

闭包问题 为什么， 配图
在函数内创建闭包效率很高，几乎可以忽略不计， segmentFault回答
vue value api

## props处理

### 获取上一个Props
### useWhyUpdate


## 简单状态管理

unstaged

## context获取

### useTheme
### useI18n

### useRouter

## 模拟生命周期函数

## 事件处理

### useChange
### 自定义事件封装
  #### useFocus
  #### useDraggable
  #### useListener (react-events)

### 订阅

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