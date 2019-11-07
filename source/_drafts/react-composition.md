---
title: "为了‘精通’ React Hooks, 我抄了 Vue Composition API"
date: 2019/11/04
categories: 前端
---

前几篇文章都讲了React 的 Concurrent 模式, 很多读者都看懵了，这一篇来点轻松的，讲讲在 React 下实现 [`Vue Composition API`](https://vue-composition-api-rfc.netlify.com/#type-issues-with-class-api), 不，这期的主角还是 React Hooks, 我只不过蹭了一下 Vue 3.0 的热度。

我们会写一个玩具，实现 'React Composition API'，看起来很吊，确实也是，通过本文你可以学到三样东西：React Hooks、Vue Composition API、Mobx，还是挺多干货的。

<br>

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

    // 可以包含其他 Composition Hook，实现逻辑复用
    const awesome = useYourImagination()

    /**
     * 生命周期方法
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

我不打算照搬 Vue Composition API，因此略有简化。以下是实现的要点:

- ① 如何确保 setup 只初始化一次?
- ② 因为 ①，所以要确保引用的不变性、我们需要对Context、Props 这些对象进行封装, 我们总是可以拿到最新的值，避免类似 React Hook 的闭包问题.
- ③ 生命周期钩子, watch 如何绑定到组件上？我们要实现一个调用上下文
- ④ watch 数据监听和释放
- ④ Context 支持, inject 怎么实现？
- ⑤ 组件如何响应数据更新?

我们带着这些问题，一步一步来实现这个 'React Composition API'

<br>
<br>

## 响应式数据和 ref

如何实现数据的响应式？不需要我们自己去造轮子，现成最好库的是 [`MobX`](https://mobx.js.org/refguide/observable.html), `reactive` 和 `computed` 以及 `watch` 都可以在 mobx中找到等价的API:

```js
// mpos.ts

import { observable, computed } from 'mobx'

export const reactive = observable
export const box = reactive.box
export { computed }
```

关于它们的详细用法见[官方文档](https://mobx.js.org/refguide/observable.html)。下面是它们的简单用法介绍:

```js
import { reactive, box, computed } from 'mpos'

/**
 * reactive 可以用于转换 Map、Set、数组、对象，为响应式数据
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
 * 一般情况下都推荐使用reactive，如果你要转换原始类型为响应式数据，可以用 box
 */
const temperature = box(20)
temperature.set(37)
temperature.get() // 37


/**
 * 衍生数据计算, 它们也具有响应特性。
 */
const fullName = computed(() => `${person.firstName} ${person.lastName}`)
fullName.get() // "Kobe Lewis"
```

<br>

Vue Composition API 的 reactive 和 watch 等函数都可以和 ref 打一些配合:

```js
// Vue Composition API

// 和 reactive 配合
const count = ref(0)
console.log(count.value) // 0

const state = reactive({
  count                  // 可以赋值给 reactive 属性
})

console.log(state.count) // 0 Vue 的 reactive 支持自动解包(unwrap) ref, 相当于 state.count.value

//
// 在模板上下文中也支持自动解包
// <button @click="increment">{{ count }}</button>
// 

state.count = 1          // 被覆盖掉了 
console.log(count.value) // 1

// Vue 的 computed 也返回一个 ref
const double = computed(() => state.count * 2)
console.log(double.value) // 2

// 和 watch 配合
const count = ref(0)
watch(count, (count, prevCount) => { /* ... */ })
```

这些功能(自动解包和watch)全部不支持，个人觉得没多大必要。所以我们的 ref 和 React 的 useRef Hook 看齐，他只是简单的返回一个对象:

```js
export function ref<T>(initial: T): { current: T } {
  return {
    current: initial,
  }
}
```

![](/images/react-composition/pass-by-reference-vs-pass-by-value-animation.gif)

因为 Javascript 原始值时按值传递的，这时候传递给变量或者函数，引用就会丢失。**为了保证 ‘引用的不变性’, 我们才需要用对象来包裹这些值，我们总是可以通过这个对象获取到最新的值**。

ref 没有什么魔法， **对于我们来说 ref 只是一个数据载体，它可以在 Hooks 之间进行数据传递；也可以暴露给组件层，用于引用一些对象，例如引用DOM组件实例**。ref 只是一个规范用法，它返回的对象没什么特别的。

<br>

关于Vue Composition API 的 ref，还有 toRefs 值得提一下。toRefs 可以将reactive 对象的每个属性都转换为 ref，这样可以实现对象被解构或者展开的情况下，属性不丢失响应:

```js
// 解构，count === 1， 响应丢失了
const { count } = reactive({count: 1})

// 使用toRefs 转换
const state = reactive({count: 1})
const stateRef = toRefs(state) // 转换成了 {count: Ref<state.count>}

// 这时候可以安全地进行解构和传递属性
const { count } = stateRef
count.value // 1
state.count++ 
count.value // 2
count.value++
state.count // 3
```

toRef 解决 reactive 数据解构和展开问题, 由于我们没有实现 ref 对象的自动解包，因此 toRefs 对我们没什么实际好处，代码会更啰嗦一点, 不如直接引用 reactive 对象。

<br>
<br>

## 生命周期方法

接下来看看怎么实现 useMounted 这些生命方法。这些方法是全局、通用的，怎么关联到具体的组件上呢？

这个可以借鉴 React Hooks 的实现，当 setup 被调用时，在一个全局变量中保存当前组件的上下文，生命周期方法再从这个上下文中存取信息。来看一下 setup 的大概实现:

```js
// ⚛️ 全局变量, 表示当前正在执行的 setup 的上下文
let compositionContext: CompositionContext | undefined;

/**
 * initial 方法接受一个 setup 方法， 返回一个 useComposition Hooks
 */
export function initial<P extends object, R>(setup: (props: P) => R) {
  return function useComposition(props: P, ref?: React.RefObject<R>): R {
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

      // ⚛️ 调用 setup
      ctx._instance = setup(ctx._props);

      // ⚛️ 离开当前组件的上下文作用域
      compositionContext = prevCtx;
    }

    // ... 其他，下文展开

    // 返回 setup 的返回值
    return context.current._instance!;
  };
}
```

Ok，现在生命周期方法实现原理已经浮出水面, 当这些方法被调用时，只是简单地在 compositionContext 中注册回调, 例如:

```js
export function onMounted(cb: () => any) {
  // ⚛️ 获取当前上下文
  const ctx = getCompositionContext();
  // 注册回调
  ctx.addMounted(cb);
}

export function onUnmount(cb: () => void) {
  const ctx = getCompositionContext();
  ctx.addDisposer(cb);
}

export function onUpdated(cb: () => void) {
  const ctx = getCompositionContext();
  ctx.addUpdater(cb);
}

```

getCompositionContext 获取 compositionContext，如果不在 `setup` 作用域下调用则抛出异常.

```js
function getCompositionContext(): CompositionContext {
  if (compositionContext == null) {
    throw new Error(`请在 setup 作用域使用`);
  }

  return compositionContext;
}
```

看一下 CompositionContext 接口的结构:

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
}
```

addMounted 这些方法实现都很简单, 只是简单添加到队列中:

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
  };

  return ctx;
}
```

关键实现还是得回到 initial 方法中:

```js
export function initial<P extends object, R>(setup: (props: P) => R) {
  return function useComposition(props: P, ref?: React.RefObject<R>): R {
    const context = useRef<CompositionContext | undefined>();

    if (context.current == null) {
      // 初始化....
    }

    // ⚛️ 每次重新渲染, 调用 onUpdated 生命周期钩子
    useEffect(() => {
      const ctx = context.current;
      if (ctx._isMounted) executeCallbacks(ctx._updater); // 必须在挂载后调用
    });

    useEffect(() => {
      const ctx = context.current;
      ctx._isMounted = true;
      // ⚛️ 调用 useMounted 生命周期钩子
      if (ctx._mounted.length) {
        ctx._mounted.forEach(cb => {
          // ⚛️useMounted 如果返回一个函数，则添加到disposer中，卸载前调用
          const rt = cb();
          if (typeof rt === "function") {
            ctx.addDisposer(rt);
          }
        });
        // 释放掉
        ctx._mounted = EMPTY_ARRAY;
      }

      // ⚛️ 调用 onUnmount 生命周期钩子
      return () => executeCallbacks(ctx._disposers);
    }, []);

    // ...
  };
}
```

副作用

## watch

接下来看看 watch 方法的实现。watch 估计是除了 reactive 之外调用的最频繁的函数了。

watch 方法可以通过 Mobx 的 `authrun` 和 `reaction` 方法来实现。我们进行简单的封装，让它更接近 Vue 的watch 函数的行为。这里有一个要点是: watch 即可以在setup 上下文中调用，也可以裸露调用。在setup 上下文调用时，支持组件卸载前自动释放监听。 如果裸露调用，则需要开发者自己来释放监听，避免内存泄漏:

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

另外 watch 的回调支持返回一个函数，用来释放副作用资源。这个行为和 useEffect 保持一致:

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
export type WatchDisposer = () => void;

export function watch(
  view: (stop: WatchDisposer) => any,
  options?: IAutorunOptions
): WatchDisposer;
export function watch<T>(
  expression: () => T,
  effect: (arg: T, stop: WatchDisposer) => any,
  options?: IReactionOptions
): WatchDisposer;
export function watch(
  expression: any,
  effect: any,
  options?: any
): WatchDisposer {
  // 放置 autorun 或者 reactive 返回的释放函数
  let nativeDisposer: WatchDisposer;
  // 放置上一次 watch 回调返回的释放函数
  let effectDisposer: WatchDisposer | undefined;
  // 是否已经释放
  let disposed = false;

  // 封装资源释放函数，便面被重复调用
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
    // auto run
    nativeDisposer = autorun(effectWrapper(expression, 0));
  }

  // 如果在 setup 上下文则添加到disposer 队列，在组件卸载时自动释放
  if (compositionContext) {
    compositionContext.addDisposer(stop);
  }

  return stop;
}
```

DONE!

<br>
<br>

## 封装 Props 

React 组件每次重新渲染都会生成一个新的 Props 对象，所以无法直接在 setup 中使用，我们需要将其转换为一个引用不变的对象，然后在每次重新渲染时更新这个对象。

```js
import { set } from 'mobx'
export function initial<P extends object, R>(setup: (props: P) => R) {
  return function useComposition(props: P, ref?: React.RefObject<R>): R {
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

实现 Context 的注入还是得费点事，我们会利用 React 的 useContext 来实现， 我们需要保证 useContext 的调用顺序.

和生命周期方法一样，调用 inject 时，推入队列中:

```js
export function inject<T>(Context: React.Context<T>): T {
  const ctx = getCompositionContext();
  return ctx.addContext(Context);
}
```

为了保证插入的顺序，以及避免重复的 useContext 调用，我们使用 Map 来保存 Context 引用:

```js
function createCompositionContext<P, R>(props: P): CompositionContext<P, R> {
  const ctx = {
    // ...
    addContext: c => {
      // 已添加
      if (ctx._contexts.has(c)) {
        return ctx._contexts.get(c)!.value
      }

      // 使用 useContext 获取 Context 值
      let value = useContext(c)
      // 转换为 响应式数据
      const wrapped = observable(value, {}, { deep: false, name: "context" })

      // 插入到队列
      ctx._contexts.set(c, {
        value: wrapped,
        // 更新器，这个会在 React 组件每次重新渲染时被调用
        // 保证React Hooks 的调用顺序 以及 数据更新
        updater: () => {
          const newValue = useContext(c)
          if (newValue !== value) {
            set(wrapped, newValue)
            value = newValue
          }
        },
      })

      return wrapped as any
    },
    _isMounted: false,
    _contexts: new Map(),
    // ....
  };

  return ctx;
}
```

回到setup 函数，因为我们使用了 useContext，必须在每一次渲染时都保证一样的次序调用 React Hooks:

```js
export function initial<P extends object, R>(setup: (props: P) => R) {
  return function useComposition(props: P, ref?: React.RefObject<R>): R {
    const context = useRef<CompositionContext | undefined>()

    // 初始化
    if (context.current == null) {
      const ctx = (context.current = createCompositionContext(props))
      const prevCtx = compositionContext
      compositionContext = ctx
      ctx._instance = setup(ctx._props)
      compositionContext = prevCtx
    }

    // 一定要在其他 React Hooks 之前调用
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

DONE!

## 监听触发组件重新渲染

基本接口已经准备就绪了，现在如何和 React 组件建立关联，在响应式数据更新后触发组件重新渲染?

Mobx 有一个库可以用来绑定 React 组件, 它就是 mobx-react-lite, 有了它我们可以这样使用：

```js
import {observer} from 'mobx-react-lite'
import { initial } from 'mpos'

const useComposition = initial((props) => {/* setup */})

const YouComponent = observer(props => {
  const state = useComposition(props)
  return <div>{state.data.count}</div>
})
```

How it work? 如果这样一笔带过，估计很多读者会很扫兴，自己写一个 observer 也不难。我们可以参考 mobx-react 或者 mobx-react-lite 的实现。

它们都将渲染函数放在一个track 函数的作用域下，track函数可以跟踪渲染函数依赖了哪些数据，当这些数据变动时，强制进行组件更新:

```js
import { Reaction } from 'mobx'

export function createComponent<P extends object, R>(options: {
  setup: (props: P) => R
  render: (props: P, state: R) => React.ReactElement
  name?: string
  forwardRef?: boolean
}): FC<P> {
  const { setup: init, render, name, forwardRef } = options
  // 创建 useComposition Hook
  const useComposition = initial(init)

  const Comp = (props: P, ref: React.RefObject<R>) => {
    // 用于强制更新组件, 实现很简单，就是递增 useState 的值
    const forceUpdate = useForceUpdate()
    const reactionRef = useRef<{ reaction: Reaction, disposer: () => void } | null>(null)

    const inst = useComposition(props, forwardRef ? ref : null)

    // 创建跟踪器
    if (reactionRef.current == null) {
      reactionRef.current = {
        // 等依赖更新时，调用 forceUpdate 强制更新
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

    // 将 render 函数放在track 作用域下，收集 render 函数的数据依赖
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

接着，我们将 Comp 组件包裹在 React.memo 下，避免不必要重新渲染:

```js
export function createComponent<P extends object, R>(options: {
  setup: (props: P) => R
  render: (props: P, state: R) => React.ReactElement
  name?: string
  forwardRef?: boolean
}): FC<P> {
  const { setup: init, render, name, forwardRef } = options
  const useComposition = initial(init)

  const Comp = (props: P, ref: React.RefObject<R>) => {/*...*/}
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

搞定，所有代码都在这个 [CodeSandbox](TODO:) 中，大家可以自行体验.

## 整合起来

## Mobx 的更新的调度

## 缺陷

最后，这只是一个玩具！整个过程也不过百来行代码。

就如标题所说的，通过这个玩具，学到很多奇淫巧技，你对 React Hooks 的了解应该更深了吧？

之所以是个玩具，是因为它还有一些缺陷，而且不够 ’React‘！只能自个玩玩 

如果你了解过 React Concurrent 模式，你会发现它和 React 自身的状态更新机制是深入绑定的。React 自身的setState 状态更新粒度更小、可以进行优先级调度、可以通过 useTransition + Suspense 配合进入 Pending 状态, 在'平行宇宙'中进行渲染。
也就是说 React 自身的状态更新机制和组件的渲染体系是深度集成。

因此监听响应式数据，然后粗暴地forceUpdate，会让我们丢失部分 React Concurrent 模式带来的红利。除此之外、开发者工具的集成、生态圈、Benchmark 数据...

<br>

搞这一套还不如直接上 Vue 是吧？毕竟Vue 天生集成响应式数据，整个工作链路自顶向下, 从数据到模板、再到底层组件渲染, 对响应式数据有更好的融合、更加高效。

尽管如此，React 的灵活性、开放、多范式编程方式、创造力还是让人赞叹。

<br>
<br>

另外响应式机制也不是完全没有心智负担，最起码你要了解响应式数据的原理，知道什么可以被响应，什么不可以：

```js
// 比如不能使用解构和展开表达式
function useMyHook() {
  // 将count 拷贝给(按值传递) count变量，这会导致响应丢失，下游无法响应count 的变化
  const { count } = reactive({count: 0})

  return { count }
}
```

还有响应式数据转换成本，诸如此类的，网上也有大量的资料。 关于 Vue Composition API 需要注意这些东西:

- [What does MobX react to?](https://mobx.js.org/best/react.html)
- [Vue Composition API Drawbacks](https://vue-composition-api-rfc.netlify.com/#plugin-development)

除此之外，你有时候会纠结什么时候应该使用 reactive，什么时候应该使用 ref, 什么时候应该使用 toRefs 转换 reactive 数据？

没有银弹，没有银弹。

<br>
<br>

## 参考

- [@vue/composition-api](https://github.com/vuejs/composition-api)
- [Vue Composition API RFC](https://vue-composition-api-rfc.netlify.com/)
- [Mobx](https://mobx.js.org/)
