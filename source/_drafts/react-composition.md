---
title: "为了‘精通’ React Hooks, 我抄了 Vue Composition API"
date: 2019/11/04
categories: 前端
---

前几篇文章都讲了React 的 Concurrent 模式, 很多读者都看懵了，这一篇来点轻松的，讲讲 [`Vue Composition API`](https://vue-composition-api-rfc.netlify.com/#type-issues-with-class-api), 不，这期的主角还是 React Hooks。我们会写一个玩具，实现 'React Composition API'，看起来很吊，确实也是，通过本文你可以学到三样东西：React Hooks、Vue Composition API、Mobx。

Vue Composition API 是 Vue 3.0 的一个重要特性， 和 React Hooks 一样，是一种非常棒的逻辑复用机制。尽管初期受到不少争议，我个人还是比较看好这个 API，因为确实解决了 Vue 以往的很多[痛点](TODO:)。

如果你了解 React Hooks 你会觉得 Composition API 身上有很多 Hooks 的影子。毕竟 React Hooks 是 Composition API 的主要灵感来源，但是 Vue 没有完全照搬 Hooks，而是基于自己的响应式机制，创建出了自己的逻辑复用原语, 非常有特色, 这使得它辨识度还是非常高的。

对于 React 开发者来说, Vue Composition API 还解决了 React Hooks 的一些有点稍微让人难受、或者对新手不友好的问题。这驱动我写这篇文章，来尝试把 Vue Composition API 抄过来。

## 对比 React Hooks 和 Vue Composition API

Vue Composition API 官方文档列举和它和 React Hooks 的差异:

- ① 总的来说，更符合惯用的 JavaScript 代码直觉
- ② 不关心调用顺序和条件化。React Hooks 基于数组实现，每次重新渲染必须保证调用的顺序，否则会出现数据错乱。
- ③ 不用每次渲染时，重复调用，减低 GC 的压力。每次渲染所有 Hooks 都会重新执行一遍，这中间会重复创建一些临时的变量、对象以及函数。
- ④ 不用考虑 useCallback 问题。 因为问题 ③ , 在 React 中，为了避免子组件 diff 失效，导致无意义的重新渲染，我们几乎总会使用 useCallback 来缓存传递给下级的事件处理器。
- ⑤ 不必手动管理数据依赖。在 React Hooks 中，使用 useCallback、useMemo、useEffect 等这些 Hooks 时，都需要手动维护一个数据依赖数组。当这些依赖项变动时，让缓存失效或者重新注册副作用。对于新手来说第一关就是你要很好地理解闭包，然后你要装个 eslint 插件，避免漏掉某些依赖。
  Vue 的响应式机制可以自动、精确地跟踪数据依赖，而且基于对象引用的不变性，我们不需要关心闭包问题。

如果你长期被这些问题困扰，你会觉得 Composition API 很有吸引力。是不是也想自己动手写一个？把 Vue Composition API 搬过来，解决这些问题？

<br>

**基本 API 类比**

首先，你得了解 React Hooks 和 Vue Composition API。最好的学习资料是它们的官方文档。下面简单类比一下两者的 API:

|         | React Hooks                                  |  Vue Composition API                   |
|---------|----------------------------------------------|-----------------------------------------|
|状态      | `const [value, setValue] = useState(0)` or `useReducer`     | `const state = reactive({value: 0})` |
|状态变更   | `setValue(1)` 或 `setValue(n => n + 1)`     | `state.value = 1` or `state.value++` |
|状态衍生   | `useMemo(() => derived, [/*数据依赖*/])`     | `const derived = computed(() => {/*衍生数据*/})` |
|对象引用   | `const foo = useRef(0)` + `foo.current = 1` | `const foo = ref(0)` + `foo.value = 1`|
|挂载      | `useEffect(() => {/*挂载*/}, [])`                          | `onBeforeMount(() => {/*挂载前*/})` + `onMounted(() => {/*挂载后*/})`|
|卸载      | `useEffect(() => {/*挂载*/; return () => {/*卸载*/}}, [])`  | `onBeforeUnmount(() => {/*卸载前*/})` + `onUnmounted(() => {/*挂载后*/})`|
|重新渲染      | `useEffect(() => {/*更新*/})`                | `onBeforeUpdate(() => {/*更新前*/})` + `onUpdated(() => {/*更新后*/})`|
|异常处理   | 目前只有类组件支持(`componentDidCatch` 或 `static getDerivedStateFromError` | `onErrorCaptured((err) => {/*异常处理*/})`|
|依赖监听  | `useEffect(() => {/*依赖更新*/}, [/*数据依赖*/])` | `const stop = watch(() => {/*自动检测数据依赖, 更新...*/})`|
|依赖监听 + 清理  | `useEffect(() => {/*...*/; return () => {/*清理*/}}, [/*依赖*/])` | `watch(() => [/*依赖*/], (newVal, oldVal, clean) => {/*更新*/; clean(() => {/* 清理*/})})`|
|Context 注入 | `useContext(YouContext)` | `inject(key)` + `provider(key, value)`|

<br>

对比上表，我们发现两者非常相似，每个功能都可以在对方身上找到等价物。 React Hooks 和 Vue Composition 的差别如下:

- **数据方面**。Vue 采用的是透明的响应式数据，它可以自动监听数据依赖和响应式更新。相比 React Hooks 的 `set{State}`, Vue 直接操作数据更'符合Javascript 的代码直觉'。另外用 React , 你不能绕过不可变数据。
- **更新响应方面**。React Hooks 和其组件思维一脉相承，它依赖数据的比对来确定依赖的更新。而Vue 则基于自动的依赖订阅。这点可以通过对比 useEffect 和 watch 体会。反之 React 需要手动维护数据依赖，有时候会觉得很啰嗦，人工维护也比较容易出错(可以借助eslint)，特别是状态依赖比较复杂的情况下
- **生命周期钩子**。React Hooks 已经弱化了组件生命周期的概念，包括类组件也废弃了`componentWillMount`、`componentWillUpdate`、`componentWillReceiveProps` 这些生命周期方法。一则我们确实不需要这么多生命周期方法，React 做了减法；二则，Concurrent 模式下，Reconciliation 阶段组件可能会被重复渲染，这些生命周期方法不能保证只被调用一次，如果在这些生命周期方法中包含副作用，会导致应用异常。Vue Composition API 继续沿用 Vue 2.x 的生命周期方法.

<br>

其中第一点是最重要的，也是最大的区别。这也是为什么 Vue Composition API 的 'Hooks' 只需要初始化一次，不需要在每次渲染时都去调用的主要原因。

## API 设计

先来看一下，我们的玩具的大体设计:

```js
// 就随便取名叫 mpos 吧
import { reactive, ref, computed, inject, watch, onMounted, onUpdated, onUnmount, createComponent} from 'mpos'
import React from 'react'

export interface CounterProps {
  initial: number;
}

export const MultiplyContext = React.createContext({ value: 0 });

export default createComponent({
  // 组件名
  name: 'Counter',
  // 和 Vue Composition 一样的setup， 只会被调用一次
  // 接受组件的 props 对象, 这也是一个引用不变的响应式数据, 可以被watch，可以获取最新值
  setup: (props: CounterProps) => {
    // 创建一个响应式数据
    const data = reactive({ count: props.initial, tick: 0 });

    // 等价于 useRef，通过 container.current 获取值。可以传递给组件的ref props
    // 相比 Vue Composition 的ref 简化，只是返回一个简单的对象
    const container = ref(null);

    // 衍生数据计算, 可以通过 derivedCount.get() 获取值
    const derivedCount = computed(() => data.count * 2);

    // 获取Context 值, 类似于 useContext，只不过返回一个响应式数据
    const ctx = inject(MultiplyContext);

    /**
     * 生命周期方法
     */
    onMounted(() => {
      console.log("mounted", container.current);
    });

    onUpdated(() => {
      console.log("update", data.count, props);
    });

    onUnmount(() => {
      console.log("unmount");
    });

    /**
     * 监听数据变动, 类似于 useEffect
     * 返回一个disposer，可以用于显式取消监听，默认会在组件卸载时调用
     */
    const stop = watch(
      () => [data.count], // 可选
      ([count]) => {
        console.log("count change", count);

        // 副作用
        const timer = setInterval(() => data.tick++, count)
        // 副作用清理, 和useEffect 保持一致，在组件卸载或者当前函数被重新调用时，调用
        return () => {
          clearInterval(timer)
        }
      }
    );

    // props 是一个响应式数据
    watch(() => {
      console.log("initial change", props.initial);
    });

    // context 是一个响应式数据
    watch(
      () => [ctx.value],
      ([ctxValue], [oldCtxValue]) => {
        console.log("context change", ctxValue);
      }
    );

    // 方法，不需要 useCallback，永久不变
    const add = () => {
      data.count++;
    };

    return {
      data,
      container,
      derivedCount,
      add
    };
  },
  render: (props, state) => {
    // 组件渲染
    const {data, derivedCount, add, container } = state
    return (
      <div className="counter" onClick={add} ref={container}>
        {data.count} : {derivedCount.get()} : {data.tick}
      </div>
    );
  }
})
```

要点:

- ① 只初始化一次
- ② 因为 ①，所以要确保引用的不变性、我们需要对Context、Props 这些对象进行封装
- ③ 生命周期钩子，调用上下文
- ④ 数据监听和释放
- ④ Context 支持
- ⑤ 组件如何响应数据更新

## 响应式 API

## 生命周期函数

副作用

## watch

## Context

## 监听重新渲染

## 整合起来

## Benchmark

## 缺陷

最后，这只是一个玩具！

就如标题所说的，通过这个玩具，学到这些奇淫巧技，你对 React Hooks 的了解应该更深了吧？

React 自身的状态更新机制, 队列, 优先级调度, 开发者工具集成, concurrent Mode, 生态圈
useTransition

搞这一套还不如直接上 Vue 是吧？毕竟Vue 天生集成响应式数据，整个工作链路自顶向下, 从数据到模板、再到底层渲染, 对响应式数据有更好的融合，更加高效。尽管如此，React 的灵活性还是让人赞叹, 多范式
