---
title: "[实战] 为了学好 React Hooks, 我抄了 Vue Composition API, 真香"
date: 2019/11/04
categories: 前端
---

[前几篇文章](https://juejin.im/post/5dadc6045188255a270a0f85)都在讲 React 的 Concurrent 模式, 很多读者都看懵了，这一篇来点轻松的，蹭了一下 Vue 3.0 的热度。讲讲如何在 React 下实现 [`Vue Composition API`](https://vue-composition-api-rfc.netlify.com/#type-issues-with-class-api)(下面简称**VCA**)，只是个玩具，别当真。

实现 'React' Composition API？看起来很吊，确实也是，通过本文你可以体会到这两种思想的碰撞, 你可以深入学习三样东西：`React Hooks`、`Vue Composition API`、[`Mobx`](https://mobx.js.org/refguide/api.html)。篇幅很长(主要是代码)，当然干货也很多。

<br>

**目录**

<br>



- [对比 React Hooks 和 Vue Composition API](#对比-react-hooks-和-vue-composition-api)
  - [基本 API 类比](#基本-api-类比)
- [API 设计概览](#api-设计概览)
- [响应式数据和 ref](#响应式数据和-ref)
  - [关于 Vue Composition API ref](#关于-vue-composition-api-ref)
  - [为什么需要 ref?](#为什么需要-ref)
  - [ref 和 useRef](#ref-和-useref)
- [生命周期方法](#生命周期方法)
- [watch](#watch)
- [包装 Props 为响应式数据](#包装-props-为响应式数据)
- [支持 Context 注入](#支持-context-注入)
- [跟踪组件依赖并触发重新渲染](#跟踪组件依赖并触发重新渲染)
- [forwardRef 处理](#forwardref-处理)
- [总结](#总结)
- [参考/扩展](#参考扩展)



<br>

Vue Composition API 是 Vue 3.0 的一个重要特性，和 React Hooks 一样，这是一种非常棒的**逻辑组合/复用机制**。尽管初期受到不少[争议](https://juejin.im/post/5d0f64d4f265da1b67211893)，**我个人还是比较看好这个 API 提案，因为确实解决了 Vue 以往的很多痛点**, 这些痛点在它的[ RFC 文档](https://vue-composition-api-rfc.netlify.com/#motivation)中说得很清楚。动机和 React Hooks 差不多，无非就是三点:

<br>

- ① 逻辑组合和复用
- ② 更好的类型推断。完美支持 Typescript
- ③ Tree-shakable 和 代码压缩友好

<br>

如果你了解 React Hooks 你会觉得 VCA 身上有很多 Hooks 的影子, 毕竟官方也承认 React Hooks 是 VCA 的主要灵感来源，但是 Vue 没有完全照搬 React Hooks，而是基于自己的数据响应式机制，创建出了自己特色的逻辑复用原语, 辨识度也是非常高的。

<br>
<br>

## 对比 React Hooks 和 Vue Composition API

对于 React 开发者来说, VCA 还解决了 React Hooks 的一些有点稍微让人难受、新手不友好的问题。这是驱动我写这篇文章原因之一，来尝试把 VCA 抄过来, 除了学习 VCA，还可以加深对 React Hooks 的理解。

VCA 官方 RFC 文档已经很详细列举了它和 React Hooks 的差异:

<br>

**① 总的来说，更符合惯用的 JavaScript 代码直觉**。这主要是 Immutable 和 Mutable 的数据操作习惯的不同。

```js
// Vue: 响应式数据, 更符合 JavaScript 代码的直觉, 就是普通的对象操作
const data = reactive({count: 1})
data.count++

// React: 不可变数据, JavaScript 原生不支持不可变数据，因此数据操作会 verbose 一点
const [count, setCount] = useState(1)
setCount(count + 1)
setCoung(c => c + 1)

// React: 或者使用 Reducer, 适合进行一些复杂的数据操作
const initialState = {count: 0, /* 假设还有其他状态 */};

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {...state, count: state.count + 1};
    case 'decrement':
      return {...state, count: state.count - 1};
    default:
      return state
  }
}
const [state, dispatch] = useReducer(reducer, initialState)
dispatch({type: 'increment'})
```

<br>

不过, 不能说可变数据就一定好于不可变数据, 反之亦然。 **不可变数据也给 React 发挥和优化的空间, 尤其在 Concurrent 模式下, 不可变数据可以更好地被跟踪和 reduce**。 例如:

```js
// React
const [state, setState] = useState(0)
const [startTransition] = useTransition()

setState(1)              // 高优先级变更
startTransition(() => {  // 低优先级状态变更
  setState(2)
})
```

<br>

React 中状态变更可以有不同的优先级，实际上这些变更会放入一个队列中，界面可能先显示 `1`, 然后才是 `2`。**你可以认为这个队列就是这个状态的历史快照，由 React 来调度进行状态的前进，有点类似于 Redux 的'时间旅行'**。如果是可变数据，实现这种‘时间旅行’会相对比较麻烦。

<br>

---

<br>

**② 不关心调用顺序和条件化**。React Hooks [基于数组实现](https://juejin.im/post/5cfa29e151882539c33e4f5e)，每次重新渲染必须保证调用的顺序，否则会出现数据错乱。VCA 不依赖数组，不存在这些限制。

```js
// React
function useMyHooks(someCondition, antherCondition) {
  if (someCondition) {
    useEffect(() => {/* ... */}, []) // 💥
  }

  if (anotherCondition) {
    return something      // 提前返回 💥
  }

  const [someState] = useState(0)
}
```

<br>

---

<br>

**③ 不用每次渲染重复调用，减低 GC 的压力**。 每次渲染所有 Hooks 都会重新执行一遍，这中间可能会重复创建一些临时的变量、对象以及闭包。而 VCA 的setup 只调用一次。

```js
// React
function MyComp(props) {
  const [count, setCount] = useState(0)
  const add = () => setCount(c => c+1)  // 这些内联函数每次渲染都会创建
  const decr = () => setCount(c => c-1)

  useEffect(() => {
    console.log(count)
  }, [count])

  return (<div>
    count: {count}
    <span onClick={add}>add</span>
    <span onClick={decr}>decr</span>
  </div>)
}
```

<br>

---

<br>

**④ 不用考虑 useCallback/useMemo 问题**。 因为问题 ③ , 在 React 中，为了避免子组件 diff 失效导致无意义的重新渲染，我们几乎总会使用 useCallback 或者 useMemo 来缓存传递给下级的事件处理器或对象。

VCA 中我们可以安全地引用对象，随时可以存取最新的值。

```js
// React
function MyComp(props) {
  const [count, setCount] = useState(0)
  const add = useCallback(() => setCount(c => c+1), [])
  const decr = useCallback(() => setCount(c => c-1), [])

  useEffect(() => {
    console.log(count)
  }, [count])

  return (<SomeComplexComponent count={count} onAdd={add} onDecr={decr}/>)
}

// Vue: 没有此问题, 通过对象引用存取最新值
createComponent({
  setup((props) => {
    const count = ref(0)
    const add = () => count.value++
    const decr = () => count.value--
    watch(count, c => console.log(c))

    return () => <SomeComplexComponent count={count} onAdd={add} onDecr={decr}/>
  })
})
```

<br>

---

<br>

**⑤ 不必手动管理数据依赖**。在 React Hooks 中，使用 `useCallback`、`useMemo`、`useEffect` 这些 Hooks，都需要手动维护一个数据依赖数组。当这些依赖项变动时，才让缓存失效。

这往往是新手接触 React Hooks 的第一道坎。你要理解好闭包，理解好 Memoize 函数 ，才能理解这些 Hooks 的行为。这还不是问题，问题是这些数据依赖需要开发者手动去维护，很容易漏掉什么，导致bug。

```js
// React
function MyComp({anotherCount, onClick}) {
  const [count, setState] = useState(0)

  const handleClick = useCallback(() => {
    onClick(anotherCount + count)
  }, [count]) // 🐞漏掉了 antherCount 和 onClick
}
```

因此 React 团队开发了 [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)插件，辅助检查 React Hooks 的用法, 可以避免漏掉某些依赖。不过这个插件太死了，搞不好要写很多 `//eslint-disable-next-line` 😂

VCA 由于不存在 ④ 问题，当然也不存在 ⑤问题。 Vue 的响应式机制可以自动、精确地跟踪数据依赖，而且基于对象引用的不变性，我们不需要关心闭包问题。

<br>

---

<br>

如果你长期被这些问题困扰，你会觉得 VCA 很有吸引力。而且它简单易学, 这简直是 Vue 开发者的‘福报‘啊！ 是不是也想自己动手写一个？把 VCA 搬到 React 这边来，解决这些问题？那请继续往下读

<br>
<br>

### 基本 API 类比

首先，你得先了解 React Hooks 和 VCA。最好的学习资料是它们的官方文档。下面简单类比一下两者的 API:

<br>

|         | React Hooks                                  |  Vue Composition API                   |
|---------|----------------------------------------------|-----------------------------------------|
|状态      | `const [value, setValue] = useState(0)` <br> `useReducer`     | `const state = reactive({value: 0})` <br> `ref(0)` |
|状态变更   | `setValue(1)` <br> `setValue(n => n + 1)` <br> `dispatch`     | `state.value = 1` <br> `state.value++` |
|状态衍生   | `useMemo(() => derived, [deps])`     | `computed(() => derived)` |
|对象引用   | `const foo = useRef(0);` <br> `foo.current = 1` | `const foo = ref(0)` <br> `foo.value = 1`|
|挂载      | `useEffect(() => {/*挂载*/}, [])`                          | `onBeforeMount(() => {/*挂载前*/})` <br> `onMounted(() => {/*挂载后*/})`|
|卸载      | `useEffect(() => () => {/*卸载*/}}, [])`  | `onBeforeUnmount(() => {/*卸载前*/})` <br> `onUnmounted(() => {/*卸载后*/})`|
|重新渲染      | `useEffect(() => {/*更新*/})`                | `onBeforeUpdate(() => {/*更新前*/})` <br> `onUpdated(() => {/*更新后*/})`|
|异常处理   | 目前只有类组件支持(`componentDidCatch`, <br> `static getDerivedStateFromError`) | `onErrorCaptured((err) => {/*异常处理*/})`|
|依赖监听  | `useEffect(() => {/*依赖更新*/}, [deps])` | `const stop = watch(() => {/*自动检测数据依赖, 更新...*/})`|
|依赖监听 + 清理  | `useEffect(() => {/*...*/; return () => {/*清理*/}}, [deps])` | `watch(() => [deps], (newVal, oldVal, clean) => {/*更新*/; clean(() => {/* 清理*/})})`|
|Context 注入 | `useContext(YouContext)` | `inject(key)` <br> `provider(key, value)`|

<br>

对比上表，我们发现两者非常相似，每个功能都可以在对方身上找到等价物。 React Hooks 和 VCA 的主要差别如下:

<br>

- **数据方面**。`Mutable` vs `Immutable`，`Reactive` vs `Diff`。
- **更新响应方面**。React Hooks 和其组件思维一脉相承，它依赖数据的比对来确定依赖的更新。而Vue 则基于自动的依赖订阅。这点可以通过对比 useEffect 和 watch 体会。
- **生命周期钩子**。React Hooks 已经弱化了组件生命周期的概念，类组件也废弃了`componentWillMount`、 `componentWillUpdate`、   `componentWillReceiveProps` 这些生命周期方法。 一则我们确实不需要这么多生命周期方法，React 做了减法；二则，Concurrent 模式下，Reconciliation 阶段组件可能会被重复渲染，这些生命周期方法不能保证只被调用一次，如果在这些生命周期方法中包含副作用，会导致应用异常, 所以废弃会比较好。Vue Composition API 继续沿用 Vue 2.x 的生命周期方法.

<br>

其中第一点是最重要的，也是最大的区别(思想)。这也是为什么 VCA 的 'Hooks' 只需要初始化一次，不需要在每次渲染时都去调用的主要原因: **基于Mutable 数据，可以保持数据的引用，不需要每次都去重新计算**。

<br>
<br>

## API 设计概览

先来看一下，我们的玩具(随便取名叫**mpos**吧)的大体设计:

```js
// 就随便取名叫 mpos 吧
import {
  reactive,
  box,
  createRef,
  computed,
  inject,
  watch,
  onMounted,
  onUpdated,
  onUnmount,
  createComponent,
  Box
} from 'mpos'
import React from 'react'

export interface CounterProps {
  initial: number;
}

export const MultiplyContext = React.createContext({ value: 0 });

// 自定义 Hooks
function useTitle(title: Box<string>) {
  watch(() => document.title = title.value)
}

// createComponent 创建组件
export default createComponent<CounterProps>({
  // 组件名
  name: 'Counter',
  // ⚛️ 和 Vue Composition API 一样的setup，只会被调用一次
  // 接受组件的 props 对象, 这也是响应式对象, 可以被watch，可以获取最新值
  setup(props) {
    /**
     * ⚛️创建一个响应式数据
     */
    const data = reactive({ count: props.initial, tick: 0 });

    /**
     * ⚛️等价于 Vue Composition API 的 ref
     * 由于reactive 不能包装原始类型，box 可以帮到我们
     */
    const name = box('kobe')
    name.set('curry')
    console.log(name.get()) // curry

    /**
     * ⚛️衍生数据计算
     */
    const derivedCount = computed(() => data.count * 2);
    console.log(derivedCount.get()) // 0

    /**
     * ⚛️等价于 React.createRef()，用于引用Virtual DOM 节点
     */
    const containerRef = createRef<HTMLDivElement>();

    /**
     * ⚛️依赖注入，获取 React.Context 值, 类似于 useContext，只不过返回一个响应式数据
     */
    const ctx = inject(MultiplyContext);

    /**
     * ⚛️可以复合其他 Hooks，实现逻辑组合
     */
    useTitle(computed(() => `title: ${data.count}`))
    const awesome = useYourImagination()

    /**
     * ⚛️生命周期方法
     */
    onMounted(() => {
      console.log("mounted", container.current);

      // 支持类似 useEffect 的方式，返回一个函数，这个函数会在卸载前被调用
      // 因为一般资源获取和资源释放逻辑放在一起，代码会更清晰
      return () => {
        console.log("unmount");
      }
    });

    onUpdated(() => {
      console.log("update", data.count, props);
    });

    // 注意这里是 onUnmount，而 VCA 是 onUnmounted
    onUnmount(() => {
      console.log("unmount");
    });

    /**
     * ⚛️监听数据变动, 类似于 useEffect
     * 返回一个disposer，可以用于显式取消监听，默认会在组件卸载时自动取消
     */
    const stop = watch(
      () => [data.count], // 可选
      ([count]) => {
        console.log("count change", count);

        // 副作用
        const timer = setInterval(() => data.tick++, count)

        // 副作用清理（可选）, 和useEffect 保持一致，在组件卸载或者当前函数被重新调用时，调用
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

    /**
     * ⚛️方法，不需要 useCallback，永久不变
     */
    const add = () => {
      data.count++;
    };

    /**
     * ⚛️返回一个渲染函数
     */
    return () => {
      // 在这里你也可以调用 React Hooks, 就跟普通函数组件一样
      useEffect(() => {
        console.log('hello world')
      }, [])

      return (
        <div className="counter" onClick={add} ref={containerRef}>
          {data.count} : {derivedCount.get()} : {data.tick}
        </div>
      );
    }
  },
})
```

<br>

我不打算完全照搬 VCA，因此略有简化和差异。以下是实现的要点:

- ① 如何确保 setup 只初始化一次?
- ② 因为 ①，我们需要将 Context、Props 这些对象进行包装成响应式数据, 确保我们总是可以拿到最新的值，避免类似 React Hook 的闭包问题.
- ③ 生命周期钩子, watch 如何绑定到组件上？我们要实现一个调用上下文
- ④ watch 数据监听和释放
- ④ Context 支持, inject 怎么实现？
- ⑤ 如何触发组件重新渲染?

<br>

我们带着这些问题，一步一步来实现这个 **'React Composition API'**

<br>
<br>

## 响应式数据和 ref

如何实现数据的响应式？不需要我们自己去造轮子，现成最好库的是 [`MobX`](https://mobx.js.org/refguide/observable.html)。

`reactive` 和 `computed` 以及 `watch` 都可以在 Mobx 中找到等价的API。以下是 Mobx API 和 VCA 的对照表:

<br>

|  Mobx                            | Vue Composition API | 描述 |
|-----------------------------------|---------------------|------|
|  observable(object/map/array/set) | reactive()          | 转换响应式对象 |
|  box(原始类型)                      | ref()               | 转换原始类型为响应式对象 |
|  computed() + 返回 box 类型 | computed() + 返回 ref 类型 | 响应式衍生状态计算 |
|  autorun(), reaction()            | watch()             | 监听响应式对象变动 |

<br>

所以我们不需要自己去实现这些 API, 简单设置个别名:

```js
// mpos.ts

import { observable, computed, isBoxedObservable } from 'mobx'

export type Box<T> = IObservableValue<T>
export type Boxes<T> = {
  [K in keyof T]: T[K] extends Box<infer V> ? Box<V> : Box<T[K]>
}

export const reactive = observable
export const box = reactive.box        // 等价于 VCA 的 ref
export const isBox = isBoxedObservabl
export { computed }

// 等价于 VCA 的 toRefs, 见下文
export function toBoxes<T extends object>(obj: T): Boxes<T> {
  const res: Boxes<T> = {} as any
  Object.keys(obj).forEach(k => {
    if (isBox(obj[k])) {
      res[k] = obj[k]
    } else {
      res[k] = {
        get: () => obj[k],
        set: (v: any) => (obj[k] = v),
      }
    }
  })

  return res
}
```

<br>

下面是它们的简单用法介绍(详细用法见[官方文档](https://mobx.js.org/refguide/observable.html))

```js
import { reactive, box, computed } from 'mpos'

/**
 * ⚛️ reactive 可以用于转换 Map、Set、数组、对象为响应式数据
 */
const data = reactive({foo: 'bar'})
data.foo = 'baz'

// reactive 内部使用Proxy 实现数据响应，他会返回一个新的对象，不会影响原始对象
const initialState = { firstName: "Clive Staples", lastName: "Lewis" }
const person = reactive(initialState)
person.firstName = 'Kobe'
person.firstName // "Kobe"
initialState.firstName // "Clive Staples"

// 转换数组
const arr = reactive([])
arr.push(1)
arr[0]

/**
 * ⚛️ 一般情况下都使用reactive，如果你要转换原始类型为响应式数据
 * 或者进行数据传递，可以用 box
 */
const temperature = box(20)
temperature.set(37)
temperature.get() // 37


/**
 * ⚛️ 衍生数据计算, 它们也具有响应特性。
 */
const fullName = computed(() => `${person.firstName} ${person.lastName}`)
fullName.get() // "Kobe Lewis"
```

<br>
<br>

### 关于 Vue Composition API ref

上面说了，**VCA 的 ref 函数等价于 Mobx 的 box 函数**。可以将原始类型包装为'响应式数据'(本质上就是创建一个reactive对象，监听getter/setter方法), 因此 ref 也被 称为**包装对象**(Mobx 的 box 命名更贴切):

```js
// Vue

const count = ref(0)
console.log(count.value) // 0
```

<br>

你可以这样理解, ref 内部就是一个 `computed` 封装(当然是假的):

```js
// Vue

function ref(value) {
  const data = reactive({value})
  return computed({
    get: () => data.value,
    set: val => data.value = val
  })
}

// 或者这样理解也可以
function ref(value) {
  const data = reactive({value})
  return {
    get value() { return data.value },
    set value(val) { data.value = val }
  }
}
```

<br>

只不过它们需要通过 `value` 属性来存取值，有时候代码显得有点啰嗦。**因此 VCA 在某些地方支持对 ref 对象进行`自动解包(Unwrap, 也称自动展开)`**, 不过目前自动解包，仅限于读取。 例如:

```jsx
// 1️⃣ 作为reactive 值时
const state = reactive({
  count                  // 可以赋值给 reactive 属性
})
console.log(state.count) // 0 等价于 state.count.value

// 自动展开有时候会让人困惑，这里有个陷阱，会导致原有的 ref 对象被覆盖
state.count = 1          // 被覆盖掉了, count 属性现在是 1, 而不是 Ref<count>
console.log(count.value) // 0

// 2️⃣ 传递给模板时，模板可以自动解包
//  
// <button @click="increment">{{ count }}</button>
// 等价于
// <button @click="increment">{{ count.value }}</button>
//

// 3️⃣ 支持直接 watch
watch(count, (cur, prev) => { // 等价于 watch(() => count.value, (cur, prev) => {})
  console.log(cur) // 直接拿到的是 ref 的值，所以不需要 cur.value 这样获取
})
```

<br>

另外 VCA 的 computed 实际上就是返回 ref 对象:

```js
const double = computed(() => state.count * 2)
console.log(double.value) // 2
```

<br>

🤔 VSA 和 Mobx 的 API 惊人的相似。想必 Vue 不少借鉴了 Mobx.

<br>
<br>

### 为什么需要 ref?

响应式对象有一个广为人知的陷阱，如果你对响应式对象进行解构、展开，或者将具体的属性传递给变量或参数，那么可能会导致响应丢失。 看下面的例子, 思考一下响应是怎么丢失的:

```js
const data = reactive({count: 1})

// 解构, 响应丢失了.
// 这时候 count 只是一个普通的、值为1的变量.
// reactive 对象变动不会传导到 count
// 修改变量本身，更不会影响到原本的reactive 对象
let { count } = data
```

<br>

因为 Javascript **原始值**是**按值传递**的，这时候传递给变量、对象属性或者函数参数，引用就会丢失。**为了保证 ‘安全引用’, 我们才需要用'对象'来包裹这些值，我们总是可以通过这个对象获取到最新的值**:

![](https://bobi.ink/images/react-composition/pass-by-reference-vs-pass-by-value-animation.gif)

<br>

关于 VCA 的 ref，还有 [`toRefs`](https://vue-composition-api-rfc.netlify.com/api.html#torefs) 值得提一下。 **toRefs 可以将 reactive 对象的每个属性都转换为 ref 对象，这样可以实现对象被解构或者展开的情况下，不丢失响应**:

```js
// Vue 代码

// 使用toRefs 转换
const state = reactive({count: 1})
const stateRef = toRefs(state) // 转换成了 Reactive<{count: Ref<state.count>}>

// 这时候可以安全地进行解构和传递属性
const { count } = stateRef

count.value    // 1
state.count    // 1 三者指向同一个值
stateRef.count.value // 1

state.count++ // 更新源 state
count.value   // 2 响应到 ref
```

<br>

简单实现一下 toRefs, 没什么黑魔法:

```js
// Vue 代码

function toRefs(obj) {
  const res = {}
  Object.keys(obj).forEach(key => {
    if (isRef(obj[key])) {
      res[key] = obj[key]
    } else {
      res[key] = {
        get value() {
          return obj[key]
        },
        set value(val) {
          obj[key] = val
        }
      }
    }
  })

  return res
}
```

<br>

toRefs 解决 reactive 对象属性值解构和展开导致响应丢失问题。配合**自动解包**，不至于让代码变得啰嗦(尽管有限制).

<br>

 **对于 VCA 来说，① ref 除了可以用于封装原始类型，更重要的一点是：② 它是一个'规范'的数据载体，它可以在 Hooks 之间进行数据传递；也可以暴露给组件层，用于引用一些对象，例如引用DOM组件实例**。

举个例子, 下面的 `useOnline` Hook, 这个 Hooks 只返回一个状态:

```js
// Vue 代码

function useOnline() {
  const online = ref(true)

  online.value = navigator.onLine

  const handleOnline = () => (online.value = true)
  const handleOffline = () => (online.value = false)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  // 返回一个 ref
  // 如果这时候返回一个 reactive 对象，会显得有点奇怪
  return online
}
```

<br>

如果 useOnline 返回一个 reactive 对象, 会显得有点怪:

```js
// Vue 代码

// 这样子？ online 可能会丢失响应
const { online } = useOnline() // 返回 Reactive<{online: boolean}>

// 怎么确定属性命名？
const online = useOnline()
watch(() => online.online)

// 所以我们需要规范，这个规范可以帮我们规避陷阱，也统一了使用方式
// 更规范的返回一个 ref，使用 value 来获取值
watch(() => online.value)
// 可以更方便地进行监听
wacth(online, (ol) => {
  // 直接拿到 online.value
})
```

<br>

再看另一个返回多个值的例子:

```js
// Vue 代码

function useMousePosition() {
  const pos = reactive({x: 0, y: 0})
  const update = e => {
    pos.x = e.pageX
    pos.y = e.pageY
  }
  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))
  // 返回多个值，可以使用 toRefs 批量转换
  return toRefs(pos)
}

// 使用
function useMyHook() {
  // 安全地使用解构表达式
  const { x, y } = useMousePosition()

  // ... do something

  // 安全地输出
  return { x, y }
}
```

<br>

**因此官方也推荐使用 ref 对象来进行数据传递，同时保持响应的传导**。就到这吧，不然写着写着就变成 VCA 的文档了🌚。

<br>
<br>

### ref 和 useRef

VCA ref 这个命名会让 React 开发者将其和 `useRef` 联想在一起。的确，VCA 的 ref 在结构、功能和职责上跟 React 的 useRef 很像。例如 [ref 也可以用于引用 Virtual DOM的节点实例](https://vue-composition-api-rfc.netlify.com/api.html#template-refs):

```js
// Vue 代码
export default {
  setup() {
    const root = ref(null)

    // with JSX
    return () => <div ref={root}/>
  }
}
```

<br>

为了避免和现有的 useRef 冲突，而且在我们也不打算实现 ref 自动解包诸如此类的功能。因此在我们会沿用 Mobx 的 box 命名，对应的还有isBox, toBoxes 函数。

<br>

那怎么引用 Virtual DOM 节点呢？ 我们可以使用 React 的 [`createRef()`](https://reactjs.org/docs/react-api.html#reactcreateref) 函数：

```js
// React 代码
import { createRef } from 'react'

createComponent({
  setup(props => {
    const containerRef = createRef()

    // ...

    return () => <div className="container" ref={containerRef}>?...?</div>
  })
})
```

<br>
<br>

## 生命周期方法

接下来看看怎么实现 useMounted 这些生命周期方法。这些方法是全局、通用的，怎么关联到具体的组件上呢？

这个可以借鉴 React Hooks 的实现，当 setup() 被调用时，在一个全局变量中保存当前组件的上下文，生命周期方法再从这个上下文中存取信息。

来看一下 initial 的大概实现:

```js
// ⚛️ 全局变量, 表示当前正在执行的 setup 的上下文
let compositionContext: CompositionContext | undefined;

/**
 * initial 方法接受一个 setup 方法， 返回一个 useComposition Hooks
 */
export function initial<Props extends object, Rtn, Ref>(
  setup: (props: Props) => Rtn,
) {
  return function useComposition(props: Props, ref?: React.RefObject<Ref>): Rtn {
    // ⚛️ 使用 useRef 用来保存当前的上下文信息。 useRef，可以保证引用不变
    const context = useRef<CompositionContext | undefined>();

    // 如果当前上下文为空，则开始初始化
    // ⚛️ 我们这样实现了 setup 只被调用一次!
    if (context.current == null) {
      // 创建 Composition 上下文
      const ctx = (context.current = createCompositionContext(props));

      // ⚛️ 进入当前组件的上下文作用域
      const prevCtx = compositionContext;
      compositionContext = ctx;

      // ⚛️ **调用 setup, 并缓存返回值**
      ctx._instance = setup(ctx._props);

      // ⚛️ 离开当前组件的上下文作用域, 恢复
      compositionContext = prevCtx;
    }

    // ... 其他，下文展开

    // 返回 setup 的返回值
    return context.current._instance!;
  };
}
```

<br>

Ok，现在生命周期方法实现原理已经浮出水面, 当这些方法被调用时，只是简单地在 compositionContext 中注册回调, 例如:

```js
export function onMounted(cb: () => any) {
  // ⚛️ 获取当前上下文
  const ctx = assertCompositionContext();
  // 注册回调
  ctx.addMounted(cb);
}

export function onUnmount(cb: () => void) {
  const ctx = assertCompositionContext();
  ctx.addDisposer(cb);
}

export function onUpdated(cb: () => void) {
  const ctx = assertCompositionContext();
  ctx.addUpdater(cb);
}
```

<br>

assertCompositionContext 获取 compositionContext，如果不在 `setup` 作用域下调用则抛出异常.

```js
function assertCompositionContext(): CompositionContext {
  if (compositionContext == null) {
    throw new Error(`请在 setup 作用域使用`);
  }

  return compositionContext;
}
```

<br>

看一下 CompositionContext 接口的外形:

```js
interface CompositionContext<P = any, R = any> {
  // 添加挂载回调
  addMounted: (cb: () => any) => void;
  // 添加重新渲染回调
  addUpdater: (cb: () => void) => void;
  // 添加卸载回调
  addDisposer: (cb: () => void) => void;
  // 注册 React.Context 下文会介绍
  addContext: <T>(ctx: React.Context<T>) => T;
  // 添加通过ref暴露给外部的对象, 下文会介绍
  addExpose: (value: any) => void

  /** 私有属性 **/
  // props 引用
  _props: P;
  // 表示是否已挂载
  _isMounted: boolean;
  // setup() 的返回值
  _instance?: R;
  _disposers: Array<() => void>;
  _mounted: Array<() => any>;
  _updater: Array<() => void>;
  _contexts: Map<React.Context<any>, { value: any; updater: () => void }>
  _exposer?: () => any
}
```

<br>

`addMounted`、`addUpdater` 这些方法实现都很简单, 只是简单添加到队列中:

```js
function createCompositionContext<P, R>(props: P): CompositionContext<P, R> {
  const ctx = {
    addMounted: cb => ctx._mounted.push(cb),
    addUpdater: cb => ctx._updater.push(cb),
    addDisposer: cb => ctx._disposers.push(cb),
    addContext: c => {/* ...  */} ,
    _isMounted: false,
    _instance: undefined,
    _mounted: [],
    _updater: [],
    _disposers: [],
    _contexts: new Map(),
    _props: observable(props, {}, { deep: false, name: "props" })
    _exposer: undefined,
  };

  return ctx;
}
```

<br>

关键实现还是得回到 initial 方法中:

```js
export function initial<Props extends object, Rtn, Ref>(
  setup: (props: Props) => Rtn,
) {
  return function useComposition(props: Props, ref?: React.RefObject<Ref>): Rtn {
    const context = useRef<CompositionContext | undefined>();

    if (context.current == null) {
      // 初始化....
    }

    // ⚛️ 每次重新渲染, 调用 onUpdated 生命周期钩子
    useEffect(() => {
      const ctx = context.current;
      // 首次挂载时不调用
      if (ctx._isMounted) executeCallbacks(ctx._updater);
    });

    // ⚛️ 挂载
    useEffect(() => {
      const ctx = context.current;
      ctx._isMounted = true;

      // ⚛️ 调用 useMounted 生命周期钩子
      if (ctx._mounted.length) {
        ctx._mounted.forEach(cb => {
          // ⚛️ useMounted 如果返回一个函数，则添加到disposer中，卸载前调用
          const rt = cb();
          if (typeof rt === "function") {
            ctx.addDisposer(rt);
          }
        });
        ctx._mounted = EMPTY_ARRAY; // 释放掉
      }

      // ⚛️ 调用 onUnmount 生命周期钩子
      return () => executeCallbacks(ctx._disposers);
    }, []);

    // ...
  };
}
```

<br>

没错，这些生命周期方法，最终还是用 useEffect 来实现。

<br>
<br>

## watch

接下来看看 watch 方法的实现。watch 估计是除了 reactive 和 ref 之外调用的最频繁的函数了。

watch 方法可以通过 Mobx 的 `authrun` 和 `reaction` 方法来实现。我们进行简单的封装，让它更接近 Vue 的watch 函数的行为。

这里有一个要点是: watch 即可以在setup 上下文中调用，也可以裸露调用。在setup 上下文调用时，支持组件卸载前自动释放监听。 如果裸露调用，则需要开发者自己来释放监听:

```js
/**
 * 在 setup 上下文中调用，watch 会在组件卸载后自动解除监听
 */
function useMyHook() {
  const data = reactive({count: 0})
  watch(() => console.log('count change', data.count))

  return data
}

/**
 * 裸露调用，需要手动管理资源释放
 */
const stop = watch(() => someReactiveData, (data) => {/* reactiveData change */})
dosomething(() => {
  // 手动释放
  stop()
})

/**
 * 另外watch 回调内部也可以获取到 stop 方法
 */ 
wacth((stop) => {
  if (someReactiveData === 0) {
    stop()
  }
})
watch(() => someReactiveData, (data, stop) => {/* reactiveData change */})
```

<br>

另外 watch 的回调支持返回一个函数，用来释放副作用资源，这个行为和 useEffect 保持一致。VCA 的 watch 使用onClean 回调来释放资源，因为考虑到 async/await 函数。

```js
useEffect(() => {
  const timer = setInterval(() => {/* do something*/}, time)
  return () => {
    clearInterval(timer)
  }
}, [time])

// watch
watch(() => {
  const timer = setInterval(() => {/* do something*/}, time)
  return () => {
    clearInterval(timer)
  }
})
```

<br>

看看实现代码:

```js
import {reaction, autorun} from 'mobx'
export type WatchDisposer = () => void;

export function watch(view: (stop: WatchDisposer) => any, options?: IAutorunOptions): WatchDisposer;
export function watch<T>(expression: () => T, effect: (arg: T, stop: WatchDisposer) => any, options?: IReactionOptions): WatchDisposer;
export function watch(expression: any, effect: any, options?: any): WatchDisposer {
  // 放置 autorun 或者 reactive 返回的释放函数
  let nativeDisposer: WatchDisposer;
  // 放置上一次 watch 回调返回的副作用释放函数
  let effectDisposer: WatchDisposer | undefined;
  // 是否已经释放
  let disposed = false;

  // 封装释放函数，支持被重复调用
  const stop = () => {
    if (disposed) return;
    disposed = true;
    if (effectDisposer) effectDisposer();
    nativeDisposer();
  };

  // 封装回调方法
  const effectWrapper = (effect: (...args: any[]) => any, argnum: number) => (
    ...args: any[]
  ) => {
    // 重新执行了回调，释放上一个回调返回的释放方法
    if (effectDisposer != null) effectDisposer();
    const rtn = effect.apply(null, args.slice(0, argnum).concat(stop));
    effectDisposer = typeof rtn === "function" ? rtn : undefined;
  };

  if (typeof expression === "function" && typeof effect === "function") {
    // reaction
    nativeDisposer = reaction(expression, effectWrapper(effect, 1), options);
  } else {
    // autorun
    nativeDisposer = autorun(effectWrapper(expression, 0));
  }

  // 如果在 setup 上下文则添加到disposer 队列，在组件卸载时自动释放
  if (compositionContext) {
    compositionContext.addDisposer(stop);
  }

  return stop;
}
```

<br>

DONE!

<br>
<br>

## 包装 Props 为响应式数据

React 组件每次重新渲染都会生成一个新的 Props 对象，所以无法直接在 setup 中使用，我们需要将其转换为一个可以安全引用的对象，然后在每次重新渲染时更新这个对象。

```js
import { set } from 'mobx'

export function initial<Props extends object, Rtn, Ref>(setup: (props: Props) => Rtn) {
  return function useComposition(props: Props, ref?: React.RefObject<Ref>): Rtn {
    const context = useRef<CompositionContext | undefined>();

    // 初始化
    if (context.current == null) {
      // ⚛️ createCompositoonContext 会将props 转换为一个响应式数据, 而且这里是浅层转换
      // _props: observable(props, {}, { deep: false, name: "props" })
      const ctx = (context.current = createCompositionContext(props));
      const prevCtx = compositionContext;
      compositionContext = ctx;
      ctx._instance = setup(ctx._props);
      compositionContext = prevCtx;
    }

    // ...

    // ⚛️ 每次重新渲染时更新, props 属性
    set(context.current._props, props);

    return context.current._instance!;
  };
}
```

<br>
<br>

## 支持 Context 注入

和 VCA 一样，我们通过 `inject` 支持依赖注入，不同的是我们的 `inject` 方法接收一个 [`React.Context`](https://reactjs.org/docs/context.html#contextprovider) 对象。`inject` 可以从 Context 对象中推断出注入的类型。

另外受限于 React 的 Context 机制，我们没有实现 provider 函数，用户直接使用 Context.Provider 组件即可。

实现 Context 的注入还是得费点事，我们会利用 React 的 [`useContext`](https://reactjs.org/docs/hooks-reference.html#usecontext) Hook 来实现，因此必须保证 `useContext` 的调用顺序。

和生命周期方法一样，调用 inject 时，将 Context 推入队列中, 只不过我们会立即调用一次 useContext 获取到值:

```js
export function inject<T>(Context: React.Context<T>): T {
  const ctx = assertCompositionContext();
  // ⚛️ 马上获取值
  return ctx.addContext(Context);
}
```

<br>

为了避免重复的 useContext 调用, 同时保证插入的顺序，我们使用 [`Map`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map) 来保存 Context 引用:

```js
function createCompositionContext<P, R>(props: P): CompositionContext<P, R> {
  const ctx = {
    _isMounted: false,
    // ⚛️ 使用 Map 保存
    _contexts: new Map(),
    // ...

    // ⚛️ 注册Context
    addContext: c => {
      // ⚛️ 已添加
      if (ctx._contexts.has(c)) {
        return ctx._contexts.get(c)!.value
      }

      // ⚛️ 首次使用立即调用 useContext 获取 Context 的值
      let value = useContext(c)
      // ⚛️ 和 Props 一样转换为 响应式数据, 让 setup 可以安全地引用
      const wrapped = observable(value, {}, { deep: false, name: "context" })

      // ⚛️ 插入到队列
      ctx._contexts.set(c, {
        value: wrapped,
        // ⚛️ 更新器，这个会在组件挂载之后的每次重新渲染时调用
        // 我们需要保证 useContext 的调用顺序
        updater: () => {
          // ⚛️ 依旧是调用 useContetxt 重新获取 Context 值
          const newValue = useContext(c)
          if (newValue !== value) {
            set(wrapped, newValue)
            value = newValue
          }
        },
      })

      return wrapped as any
    },
    // ....
  };

  return ctx;
}
```

<br>

回到 setup 函数，我们必须保证每一次渲染时都按照一样的次序调用 useContext：

```js
export function initial<Props extends object, Rtn, Ref>(
  setup: (props: Props) => Rtn,
) {
  return function useComposition(props: Props, ref?: React.RefObject<Ref>): Rtn {
    const context = useRef<CompositionContext | undefined>()

    // 初始化
    if (context.current == null) {
      const ctx = (context.current = createCompositionContext(props))
      const prevCtx = compositionContext
      compositionContext = ctx
      ctx._instance = setup(ctx._props)
      compositionContext = prevCtx
    }

    // ⚛️ 一定要在其他 React Hooks 之前调用
    // 因为在 setup 调用的过程中已经调用了 useContext，所以只在挂载之后的重新渲染中才调用更新
    if (context.current._contexts.size && context.current._isMounted) {
      for (const { updater } of context.current._contexts.values()) {
        updater()
      }
    }

    // ...
  }
}
```

<br>

DONE!

<br>
<br>

## 跟踪组件依赖并触发重新渲染

基本接口已经准备就绪了，现在如何和 React 组件建立关联，在响应式数据更新后触发组件重新渲染?

Mobx 有一个库可以用来绑定 React 组件, 它就是 [`mobx-react-lite`](https://github.com/mobxjs/mobx-react-lite), 有了它, 我们可以监听响应式变化并触发组件重新渲染。用法如下：

```js
import { observer } from 'mobx-react-lite'
import { initial } from 'mpos'

const useComposition = initial((props) => {/* setup */})

const YouComponent = observer(props => {
  const state = useComposition(props)
  return <div>{state.data.count}</div>
})
```

<br>

How it work? 如果这样一笔带过，估计很多读者会很扫兴，自己写一个 `observer` 也不难。我们可以参考 [mobx-react](https://github.com/mobxjs/mobx-react) 或者 mobx-react-lite 的实现。

它们都将渲染函数放在 `track` 函数的上下文下，track函数可以跟踪渲染函数依赖了哪些数据，当这些数据变动时，强制进行组件更新:

```js
import React, { FC , useRef, useEffect } from 'react'
import { Reaction } from 'mobx'

export function createComponent<Props extends {}, Ref = void>(options: {
  name?: string
  setup: (props: Props) => () => React.ReactElement
  forwardRef?: boolean
}): FC<Props> {
  const { setup, name, forwardRef } = options
  // ⚛️ 创建 useComposition Hook
  const useComposition = initial(setup)

  const Comp = (props: Props, ref: React.RefObject<Ref>) => {
    // 用于强制更新组件, 实现很简单，就是递增 useState 的值
    const forceUpdate = useForceUpdate()
    const reactionRef = useRef<{ reaction: Reaction, disposer: () => void } | null>(null)

    const render = useComposition(props, forwardRef ? ref : null)

    // 创建跟踪器
    if (reactionRef.current == null) {
      reactionRef.current = {
        // ⚛️ 在依赖更新时，调用 forceUpdate 强制重新渲染
        reaction: new Reaction(`observer(${name || "Unknown"})`, () =>  forceUpdate()),
        // 释放跟踪器
        disposer: () => {
          if (reactionRef.current && !reactionRef.current.reaction.isDisposed) {
            reactionRef.current.reaction.dispose()
            reactionRef.current = null
          }
        },
      }
    }

    useEffect(() => () => reactionRef.current && reactionRef.current.disposer(), [])

    let rendering
    let error

    // ⚛️ 将 render 函数放在track 作用域下，收集 render 函数的数据依赖
    reactionRef.current.reaction.track(() => {
      try {
        rendering = render(props, inst)
      } catch (err) {
        error = err
      }
    })

    if (error) {
      reactionRef.current.disposer()
      throw error
    }

    return rendering
  }
  // ...
}
```

<br>

接着，我们将 Comp 组件包裹在 React.memo 下，避免不必要重新渲染:

```js
export function createComponent<Props extends {}, Ref = void>(options: {
  name?: string
  setup: (props: Props) => () => React.ReactElement
  forwardRef?: boolean
}): FC<Props> {
  const { setup, name, forwardRef } = options
  // 创建 useComposition Hook
  const useComposition = initial(setup)

  const Comp = (props: Props, ref: React.RefObject<Ref>) => {/**/}

  Comp.displayName = `Composition(${name || "Unknown"})`

  let finalComp
  if (forwardRef) {
    // 支持转发 ref
    finalComp = React.memo(React.forwardRef(Comp))
  } else {
    finalComp = React.memo(Comp)
  }

  finalComp.displayName = name

  return finalComp
}
```

<br>
<br>

## forwardRef 处理

最后一步了，有些时候我们的组件需要通过 ref 向外部暴露一些状态和方法。在Hooks 中我们使用 `useImperativeHandle` 来实现:

```js
function FancyInput(props, ref) {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    }
  }));
  return <input ref={inputRef} ... />;
}
FancyInput = forwardRef(FancyInput);
```

<br>

在我们的玩具中，我们自定义一个新的函数 `expose` 来暴露我们的公开接口：

```js
function setup(props) {
  expose({
    somePublicAPI: () => {}
  })

  // ...
}
```

<br>

实现如下：

```js
export function expose(value: any) {
  const ctx = assertCompositionContext();
  ctx.addExpose(value);
}
```

<br>

关键是 useComposition 的处理:

```js
export function initial<Props extends object, Rtn, Ref>(
  setup: (props: Props) => Rtn,
) {
  return function useComposition(props: Props, ref?: React.RefObject<Ref>): Rtn {
    const context = useRef<CompositionContext | undefined>()
    if (context.current == null) {
      // 初始化...
    }

    // ... useContext

    // ⚛️ 如果传递了ref 且 调用了 expose 函数
    // 则使用useImperativeHandle 暴露给 ref
    if (ref && context.current._exposer != null) {
      // 只在 _exposer 变动后更新
      useImperativeHandle(ref, context.current._exposer, [context.current._exposer]);
    }
```

<br>

🎉🎉 搞定，**所有代码都在这个 [CodeSandbox](https://codesandbox.io/s/mobx-vue-composition-api-ft9mv?fontsize=14) 中，大家可以自行体验**. 🎉🎉 

<br>
<br>

## 总结

最后，这只是一个玩具🎃！整个过程也不过百来行代码。

就如标题所说的，通过这个玩具，学到很多奇淫巧技，你对 React Hooks 以及 Vue Composition API 的了解应该更深了吧？ **之所以是个玩具，是因为它还有一些缺陷，不够 ’React‘, 又不够 'Vue'！只能以学习的目的自个玩玩! 而且搞这玩意, 搞不好可能在两个社区都会被喷**。所以我话就撂这了，你们就不要在评论区喷了。

<br>

如果你了解过 [React Concurrent 模式](https://juejin.im/post/5dadc6045188255a270a0f85#heading-13)，你会发现这个架构是 React 自身的状态更新机制是深入绑定的。React 自身的setState 状态更新粒度更小、可以进行优先级调度、Suspense、可以通过 useTransition + Suspense 配合进入 Pending 状态、在'平行宇宙'中进行渲染。 **React 自身的状态更新机制和组件的渲染体系是深度集成**。

因此我们现在监听响应式数据，然后粗暴地 `forceUpdate`，会让我们丢失部分 React Concurrent 模式带来的红利。除此之外、开发者工具的集成、生态圈、Benchmark...

说到生态圈，如果你将这个玩具的 API 保持和 VCA 完全兼容，那么以后 Vue 社区的 Hooks 库也可以为你所用，想想脑洞挺大。

<br>

**搞这一套还不如直接上 Vue 是吧**？毕竟 Vue 天生集成响应式数据，跟 React 的不可变数据一样, **Vue 的响应式更新机制和其组件渲染体系是深度集成的**。 整个工作链路自顶向下, 从数据到模板、再到底层组件渲染, 对响应式数据有更好、更高效地融合。

尽管如此，React 的灵活性、开放、多范式编程方式、创造力还是让人赞叹。(仅代表我作为React爱好者的立场)

<br>

**另外响应式机制也不是完全没有心智负担**，最起码你要了解响应式数据的原理，知道什么可以被响应，什么不可以：

```js
// 比如不能使用解构和展开表达式
function useMyHook() {
  // 将count 拷贝给(按值传递) count变量，这会导致响应丢失，下游无法响应count 的变化
  const { count } = reactive({count: 0})

  return { count }
}
```

还有响应式数据转换成本，诸如此类的，网上也有大量的资料, 这里就不赘述了。 关于响应式数据需要注意的东西可以参考这些资料:

- [Vue Composition API Drawbacks](https://vue-composition-api-rfc.netlify.com/#plugin-development)
- [What does MobX react to?](https://mobx.js.org/best/react.html)
- [Vue: 深入响应式原理](https://cn.vuejs.org/v2/guide/reactivity.html)

除此之外，你有时候会纠结什么时候应该使用 reactive，什么时候应该使用 ref...

没有银弹，没有银弹。

<br>

最后的最后， **useYourImagination**, React Hooks 早已在 React 社区玩出了花🌸，Vue Composition API 完全可以将这些模式拿过来用，两个从结构和逻辑上都是差不多的，只不过换一下 'Mutable' 的数据操作方式。安利 [2019年了，整理了N个实用案例帮你快速迁移到React Hooks](https://juejin.im/post/5d594ea5518825041301bbcb)


<br>

我是荒山，觉得文章可以，请点个赞，下篇文章见！

<br>
<br>

## 参考/扩展

- [**🎉本文源码：CodeSandbox**](https://codesandbox.io/s/mobx-vue-composition-api-ft9mv?fontsize=14)
- [**Vue Composition API RFC**](https://vue-composition-api-rfc.netlify.com/)
- [Vue Function-based API RFC 中文](https://zhuanlan.zhihu.com/p/68477600) 有点过时，不影响理解
- [@vue/composition-api](https://github.com/vuejs/composition-api)
- [Mobx](https://mobx.js.org/)
- [awesome-vue-composition-api](https://github.com/kefranabg/awesome-vue-composition-api)
- [Vue Composition API CodeSandbox Playground](https://codesandbox.io/s/github/nuxt/typescript/tree/master/examples/composition-api/minimal)
- [精读《Vue3.0 Function API》](https://zhuanlan.zhihu.com/p/71667382)

<br>

![](https://bobi.ink/images/sponsor.jpg)
