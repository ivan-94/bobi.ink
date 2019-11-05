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

         | React Hooks                                  |  Vue Composition API
---------|----------------------------------------------|---------------------------------------
状态      | `const [value, setValue] = useState(0)`     | `const state = reactive({value: 0})`
状态变更   | `setValue(1)` 或 `setValue(n => n + 1)`     | `state.value = 1` 或 `state.value++`
对象引用   | `const foo = useRef(0)` + `foo.current = 1` | `const foo = ref(0)` + `foo.value = 1`
挂载      | `useEffect(() => {/*挂载*/}, [])`                          | `onBeforeMount(() => {/*挂载前*/})` + `onMounted(() => {/*挂载后*/})`
卸载      | `useEffect(() => {/*挂载*/; return () => {/*卸载*/}}, [])`  | `onBeforeUnmount(() => {/*卸载前*/})` + `onUnmounted(() => {/*挂载后*/})`
更新      | `useEffect(() => {/*更新*/})`                | `onBeforeUpdate(() => {/*更新前*/})` + `onUpdated(() => {/*更新后*/})`
异常处理   | 目前只有类组件支持(componentDidCatch 或 static getDerivedStateFromError) | onErrorCaptured 
响应更新  | | 
Context 注入 | |

React Hooks 弱化生命周期方法，副作用

## API 设计

实例

```js
export default createComponent({
  name: 'Counter',
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
