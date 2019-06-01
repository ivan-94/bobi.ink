---
title: React组件设计实践总结04 - 组件的思维
date: 2019/5/15
categories: 前端
---

在 React 的世界里”**一切都是组件**“， 组件可以映射作函数式编程中的函数，React 的组件和函数一样的灵活的特性不仅仅可以用于绘制 UI，还可以用于封装业务状态和逻辑，或者非展示相关的副作用, 再通过组合方式组成复杂的应用. 本文尝试解释用 React 组件的思维来处理常见的业务开发场景.

**系列目录**

- [01 类型检查](/2019/05/10/react-component-design-01/)
- [02 组件的组织](/2019/05/11/react-component-design-02/)
- [03 样式的管理](/2019/05/14/react-component-design-03/)
- [04 组件的思维](/2019/05/15/react-component-design-04/)
- 05 状态管理 待更新

<br/>

**目录**

<!-- TOC -->

- [1. 高阶组件](#1-高阶组件)
- [2. Render Props](#2-render-props)
- [3. 使用组件的方式来抽象业务逻辑](#3-使用组件的方式来抽象业务逻辑)
- [4. hooks 取代高阶组件](#4-hooks-取代高阶组件)
- [5. hooks 实现`响应式`编程](#5-hooks-实现响应式编程)
- [6. 类继承也有用处](#6-类继承也有用处)
- [7. 模态框管理](#7-模态框管理)
- [8. 使用 Context 进行依赖注入](#8-使用-context-进行依赖注入)
- [9. 不可变的状态](#9-不可变的状态)
- [10. React-router: URL 即状态](#10-react-router-url-即状态)
- [11. 组件规范](#11-组件规范)
- [扩展](#扩展)

<!-- /TOC -->

<br/>

---

<br/>

## 1. 高阶组件

在很长一段时期里，高阶组件都是增强和组合 React 组件的最流行的方式. 这个概念源自于函数式编程的高阶函数. 高阶组件可以定义为: **高阶组件是函数，它接收原始组件并返回原始组件的增强/填充版本**:

```ts
const HOC = Component => EnhancedComponent;
```

首先要明白我们**为什么需要高阶组件**:

React 的[文档](https://react.docschina.org/docs/higher-order-components.html)说的非常清楚, **高阶组件是一种用于复用组件逻辑模式**. 最为常见的例子就是 redux 的`connect`和 react-router 的 `withRouter`. 高阶组件最初用于取代 mixin(了解[React Mixin 的前世今生](https://zhuanlan.zhihu.com/p/20361937)). 总结来说就是两点:

- 逻辑复用. 把一些通用的代码逻辑提取出来放到高阶组件中, 让更多组件可以共享
- 分离关注点. 在之前的章节中提到"逻辑和视图分离"的原则. 高阶组件可以作为实现该原则的载体. 我们一般将行为层或者业务层抽取到高阶组件中来实现, 让展示组件只关注于 UI

高阶组件的一些**实现方法**主要有两种:

- `属性代理(Props Proxy)`: 代理传递给被包装组件的 props, 对 props 进行操作. 这种方式用得最多. 使用这种方式可以做到:

  - 操作 props
  - 访问被包装组件实例
  - 提取 state
  - 用其他元素包裹被包装组件

- `反向继承(Inheritance Inversion)`: 高阶组件继承被包装的组件. 例如:

  ```ts
  function myhoc(WrappedComponent) {
    return class Enhancer extends WrappedComponent {
      render() {
        return super.render();
      }
    };
  }
  ```

  可以实现:

  - 渲染劫持: 即控制被包装组件的渲染输出.
  - 操作 state: state 一般属于组件的内部细节, 通过继承的方式可以暴露给子类. 可以增删查改被包装组件的 state, 除非你知道你在干什么, 一般不建议这么做.

实际上高阶组件能做的不止上面列举的, 高阶组件非常灵活, 全凭你的想象力. 读者可以了解 [recompose](https://github.com/acdlite/recompose/blob/master/docs/API.md)这个库, 简直把高阶组件玩出花了.

总结一下高阶组件的**应用场景**:

- 操作 props: 增删查改 props. 例如转换 props, 扩展 props, 固定 props, 重命名 props
- 依赖注入. 注入 context 或外部状态和逻辑, 例如 redux 的 connnect, react-router 的 withRouter. 旧 context 是实验性 API, 所以很多库都不会将 context 保留出来, 而是通过高阶组件形式进行注入
- 扩展 state: 例如给函数式组件注入状态
- 避免重复渲染: 例如 React.memo
- 分离逻辑, 让组件保持 dumb

> 高阶组件相关文档在网上有很多, 本文不打算展开描述. 深入了解[高阶组件](https://zhuanlan.zhihu.com/p/24776678)

高阶组件的一些**规范**:

- 包装显示名字以便于调试

  ```ts
  function withSubscription(WrappedComponent) {
    class WithSubscription extends React.Component {
      /* ... */
    }
    WithSubscription.displayName = `WithSubscription(${getDisplayName(WrappedComponent)})`;
    return WithSubscription;
  }

  function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || 'Component';
  }
  ```

- 使用 React.forwardRef 来转发 ref
- 使用'高阶函数'来配置'高阶组件', 这样可以让高阶组件的组合性最大化. Redux 的 connect 就是典型的例子

  ```ts
  const ConnectedComment = connect(
    commentSelector,
    commentActions,
  )(Comment);
  ```

  当使用 compose 进行组合时就能体会到它的好处:

  ```ts
  // 🙅 不推荐
  const EnhancedComponent = withRouter(connect(commentSelector)(WrappedComponent));

  // ✅ 使用compose方法进行组合
  // compose(f, g, h) 和 (...args) => f(g(h(...args)))是一样的
  const enhance = compose(
    // 这些都是单独一个参数的高阶组件
    withRouter,
    connect(commentSelector),
  );

  const EnhancedComponent = enhance(WrappedComponent);
  ```

- 转发所有不相关 props 属性给被包装的组件

  ```ts
  render() {
    const { extraProp, ...passThroughProps } = this.props;
    // ...
    return (
      <WrappedComponent
        injectedProp={injectedProp}
        {...passThroughProps}
      />
    );
  }
  ```

- 命名: 一般以 with\*命名, 如果携带参数, 则以 create\*命名

<br/>

---

<br/>

## 2. Render Props

Render Props(Function as Child) 也是一种常见的 react 模式, 比如官方的 [Context API](https://reactjs.org/docs/context.html) 和 [react-spring](https://www.react-spring.io) 动画库. 目的高阶组件差不多: 都是为了分离关注点, 对组件的逻辑进行复用; 在使用和实现上比高阶组件要简单, 在某些场景可以取代高阶组件. 官方的定义是:

> **是指一种在 React 组件之间使用一个值为函数的 prop 在 React 组件间共享代码的简单技术**

React 并没有限定任何 props 的类型, 所以 props 也可以是函数形式. 当 props 为函数时, 父组件可以通过函数参数给子组件传递一些数据进行动态渲染. 典型代码为:

```ts
<FunctionAsChild>{() => <div>Hello,World!</div>}</FunctionAsChild>
```

使用示例:

```ts
<Spring from={{ opacity: 0 }} to={{ opacity: 1 }}>
  {props => <div style={props}>hello</div>}
</Spring>
```

某种程度上, 这种模式相比高阶组件要简单很多, 不管是实现还是使用层次. 缺点也很明显:

- 可读性差, 尤其是多层嵌套情况下
- 组合性差. 只能通过 JSX 一层一层嵌套, 一般不宜多于一层
- 适用于动态渲染. 因为局限在 JSX 节点中, 当前组件是很难获取到 render props 传递的数据. 如果要传递给当前组件还是得通过 props, 也就是通过高阶组件传递进来

再开一下脑洞. 通过一个 Fetch 组件来进行接口请求:

```ts
<Fetch method="user.getById" id={userId}>
  {({ data, error, retry, loading }) => (
    <Container>
      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorMessage error={error} retry={retry} />
      ) : data ? (
        <Detail data={data} />
      ) : null}
    </Container>
  )}
</Fetch>
```

在 React Hooks 出现之前, 为了给函数组件(或者说 dumb component)添加状态, 通常会使用这种模式. 比如 [react-powerplug](https://github.com/renatorib/react-powerplug)

> 官方[文档](https://react.docschina.org/docs/render-props.html)

<br/>

---

<br/>

## 3. 使用组件的方式来抽象业务逻辑

大部分情况下, 组件表示是一个 UI 对象. 其实组件不单单可以表示 UI, 也可以用来抽象业务对象, 有时候抽象为组件可以巧妙地解决一些问题.

举一个例子: 当一个审批人在审批一个请求时, 请求发起者是不能重新编辑的; 反之发起者在编辑时, 审批人不能进行审批. 这是一个锁定机制, 后端一般使用类似心跳机制来维护这个'锁', 这个锁可以显式释放，也可以在超过一定时间没有激活时自动释放，比如页面关闭. 所以前端通常会使用轮询机制来激活锁.

一般的实现:

```ts
class MyPage extends React.Component {
  public componentDidMount() {
    // 根据一些条件触发, 可能还要监听这些条件的变化，然后停止加锁轮询. 这个逻辑实现起来比较啰嗦
    if (someCondition) {
      this.timer = setInterval(async () => {
        // 轮询
        tryLock();
        // 错误处理，可以加锁失败...
      }, 5000);
    }
  }

  public componentWillUnmount() {
    clearInterval(this.timer);
    // 页面卸载时显式释放
    releaseLock();
  }

  public componentDidUpdate() {
    // 监听条件变化，开始或停止锁定
    // ...
  }
}
```

随着功能的迭代, MyPage 会变得越来越臃肿, 这时候你开始考虑将这些业务逻辑抽取出去. 一般情况下通过高阶组件或者 hook 来实现, 但都不够灵活, 比如**条件锁定这个功能实现起来就比较别扭**.

有时候考虑将业务抽象成为组件, 可能可以巧妙地解决我们的问题, 例如 Locker:

```tsx
/**
 * 锁定器
 */
const Locker: FC<{ onError: err => boolean, id: string }> = props => {
  const {id, onError} = props
  useEffect(() => {
    let timer
    const poll = () => {
      timer = setTimeout(async () => {
        // ...
        // 轮询，处理异常等情况
      }, 5000)
    }

    poll()

    return () => {
      clearTimeout(timer)
      releaseLock()
    }
  }, [id])

  return null
};
```

使用 Locker

```ts
render() {
  return (<div>
    {someCondition && <Locker id={this.id} onError={this.handleError}></Locker>}
  </div>)
}
```

这里面有一个要点：我们将一个业务抽象为了一个组件后，业务逻辑有了和组件一样的生命周期。**现在组件内部只需关心自身的逻辑，比如只关心资源请求和释放(即 How)，而何时进行，什么条件进行(即 When)则由父级来决定**, 这样就符合了单一职责原则。 上面的例子父级通过 JSX 的条件渲染就可以动态控制锁定, 比之前的实现简单了很多

<br/>

---

<br/>

## 4. hooks 取代高阶组件

个人觉得 hooks 对于 React 开发来说是一个革命性的特性, 它改变了开发的思维和模式. 首先要问一下, "它解决了什么问题? 带来了什么新的东西?"

hooks 首先是要解决高阶组件或者 Render Props 的痛点的. 官方在'**动机**'上就说了:

- 1. **很难在组件之间复用状态逻辑**:

  - 问题: React 框架本身并没有提供一种将可复用的逻辑注入到组件上的方式/原语. RenderProps 和高阶组件只是'模式层面(或者说语言层面)'的东西:
  - 此前的方案: 高阶组件和 Render Props。**这些方案都是基于组件本身的机制**
    - 高阶组件和 Render Props 会造成多余的节点嵌套. 即 Wrapper hell
    - 需要调整你的组件结构, 会让代码变得笨重, 且难以理解
    - 高阶组件复杂, 难以理解
    - 此前高阶组件也要 ref 转发问题等等
  - hooks 如何解决:

    - 将状态逻辑从组件中脱离, 让他可以被单独的测试和复用.
    - hooks 可以在组件之间共享, 不会影响组件的结构

    <br/>

- 2. **复杂的组件难以理解**: 复杂组件的特点是有一大堆分散的状态逻辑和副作用. 例如每个生命周期函数常常包含一些互不相关的逻辑, 这些互不相关的逻辑会慢慢变成面条式的代码, 但是你发现很难再对它们进行拆解, 更别说测试它们

  - 问题:
    - 实际情况，我们很难将这些组件分解成更小的组件，因为状态到处都是。测试它们也很困难。
    - 经常导致过分抽象, 比如 redux, 需要在多个文件中跳转, 需要很多模板文件和模板代码
  - 此前的解决方法: 高阶组件和 Render Props 或者状态管理器. 分割抽离逻辑和 UI, 切割成更小粒度的组件
  - hooks 如何解决: Hooks 允许您根据相关部分(例如设置订阅或获取数据)将一个组件分割成更小的函数，而不是强制基于生命周期方法进行分割。你还可以选择使用一个 reducer 来管理组件的本地状态，以使其更加可预测

    <br/>

- 3. 基于 class 的组件对机器和用户都不友好:

  - 问题:
    - 对于人: 需要理解 this, 代码冗长
    - 对于机器: 不好优化
  - hooks 如何解决: 函数式组件
  - 新的问题: 你要了解闭包

<br/>

Hooks 带来的**新东西**: **hook 旨在让组件的内部逻辑组织成可复用的更小单元，这些单元各自维护一部分组件‘状态和逻辑’**。

<img alt="migrate to hooks" src="https://bobi.ink/images/04/hooks-transform.png" width="800" />
图片来源于twitter([@sunil Pai](https://twitter.com/threepointone/status/1056594421079261185/photo/1?ref_src=twsrc%5Etfw%7Ctwcamp%5Etweetembed%7Ctwterm%5E1056594421079261185&ref_url=https%3A%2F%2Fmedium.com%2Fmedia%2Fe55e7bcbf2d4912af7e539a2646388e2%3FpostId%3Dfdbde8803889))

- **一种新的组件编写方式**. 和此前基于 class 或纯函数组件的开发方式不太一样, hook 提供了更简洁的 API 和代码复用机制, 这使得组件代码变得更简短. 例如 👆 上图就是迁移到 hooks 的代码结构对比, 读者也可以看这个演讲([90% Cleaner React](https://www.youtube.com/watch?v=wXLf18DsV-I)).
  <br/>
- **更细粒度的状态控制(useState)**. 以前一个组件只有一个 setState 集中式管理组件状态, **现在 hooks 像组件一样, 是一个逻辑和状态的聚合单元. 这意味着不同的 hook 可以维护自己的状态**.
  <br/>
- **不管是 hook 还是组件，都是普通函数**.

  - **从某种程度上看组件和 hooks 是同质的(都包含状态和逻辑)**. 统一使用函数形式开发, 这使得你不需要在类、高阶组件或者 renderProps 上下文之间切换, 降低项目的复杂度. 对于 React 的新手来说，各种高阶组件、render props 各种概念拉高了学习曲线
  - **函数是一种最简单的代码复用单元, 最简单也意味着更灵活**。相比组件的 props，函数的传参更加灵活； 函数也更容易进行组合, hooks 组合其他 hook 或普通函数来实现复杂逻辑.
  - **本质上讲，hooks 就是给函数带来了状态的概念**
    <br/>

- **高阶组件之间只能简单嵌套复合(compose), 而多个 hooks 之间是平铺的, 可以定义更复杂的关系(依赖)**.
  <br/>
- **更容易进行逻辑和视图分离**. hooks 天然隔离 JSX, 视图和逻辑之间的界限比较清晰, 这使得 hooks 可以更专注组件的行为.
  <br/>
- **淡化组件生命周期概念, 将本来分散在多个生命周期的相关逻辑聚合起来**
  <br/>
- **一点点'响应式编程'的味道**, 每个 hooks 都包含一些状态和副作用，这些数据可以在 hooks 之间传递流动和响应， 见下文
  <br/>
- **跨平台的逻辑复用**. 这是我自己开的脑洞, React hooks 出来之后[尤雨溪](https://github.com/yyx990803)就推了一个[vue-hooks](https://github.com/yyx990803/vue-hooks)试验项目, 如果后面发展顺利, hooks 是可能被用于跨框架复用?

<br/>

一个**示例**: 无限加载列表

<iframe src="https://codesandbox.io/embed/rwq4opm70n?codemirror=1&fontsize=14&view=editor" title="useList" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

</br>

一般 hooks 的基本代码结构为:

```ts
function useHook(options) {
  // ⚛️states
  const [someState, setSomeState] = useState(initialValue);
  // ⚛️derived state
  const computedState = useMemo(() => computed, [dependencies]);

  // ⚛️refs
  const refSomething = useRef();

  // ⚛️side effect
  useEffect(() => {}, []);
  useEffect(() => {}, [dependencies]);

  // ⚛️state operations
  const handleChange = useCallback(() => {
    setSomeState(newState)
  }, [])

  // ⚛️output
  return <div>{...}</div>
}
```

自定义 hook 和函数组件的代码结构基本一致, 所以有时候**hooks 写着写着原来越像组件, 组件写着写着越像 hooks. 我觉得可以认为组件就是一种特殊的 hook, 只不过它输出 Virtual DOM**.

<br/>

一些**注意事项**:

- 只能在组件顶层调用 hooks。不要在循环，控制流和嵌套的函数中调用 hooks
- 只能从 React 的函数组件中调用 hooks
- 自定义 hooks 使用 use\*命名

<br/>

总结 hooks 的**常用场景**:

- **副作用封装和监听**: 例如 useWindowSize(监听窗口大小)，useOnlineStatus(在线状态)
- **副作用衍生**: useEffect, useDebounce, useThrottle, useTitle, useSetTimeout
- **DOM 事件封装**：useActive，useFocus, useDraggable, useTouch
- **获取 context**
- **封装可复用逻辑和状态**: useInput, usePromise(异步请求), useList(列表加载)
  - 取代高阶组件和 render Props. 例如使用 useRouter 取代 withRouter, useSpring 取代旧的 Spring Render Props 组件
  - 取代容器组件
  - 状态管理器: use-global-hook, unstated
- **扩展状态操作**: 原始的 useState 很简单，所以有很大的扩展空间，例如 useSetState(模拟旧的 setState), useToggle(boolean 值切换)，useArray, useLocalStorage(同步持久化到本地存储)
- 继续开脑洞...: hooks 的探索还在[继续](https://usehooks.com/)

学习 hooks:

- [官方文档](https://react.docschina.org/docs/hooks-overview.html)
- [一篇看懂 React Hooks](https://zhuanlan.zhihu.com/p/50597236)
- [React Today and Tomorrow and 90% Cleaner React With Hooks](https://www.youtube.com/watch?v=dpw9EHDh2bM)
- [hook-guide](https://www.hooks.guide/)
- [精读《怎么用 React Hooks 造轮子》](https://zhuanlan.zhihu.com/p/50274018)
- [Making Sense of React Hooks](https://medium.com/@dan_abramov/making-sense-of-react-hooks-fdbde8803889)
- [React hooks: not magic, just arrays](https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e)

<br/>

---

<br/>

## 5. hooks 实现`响应式`编程

`Vue`的非侵入性[响应式系统](https://cn.vuejs.org/v2/guide/reactivity.html)是其最独特的特性之一, 可以按照 Javascript 的数据操作习惯来操作组件状态， 然后自动响应到页面中. 而 React 这边则提供了 setState, 对于复杂的组件状态, setState 会让代码变得的又臭又长. 例如:

```ts
this.setState({
  pagination: {
    ...this.state.pagination,
    current: defaultPagination.current || 1,
    pageSize: defaultPagination.pageSize || 15,
    total: 0,
  },
});
```

后来有了[mobx](https://cn.mobx.js.org), 基本接近了 Vue 开发体验:

```ts
@observer
class TodoView extends React.Component {
  private @observable loading: boolean;
  private @observable error?: Error;
  private @observable list: Item[] = [];
  // 衍生状态
  private @computed get completed() {
    return this.list.filter(i => i.completed)
  }

  public componentDidMount() {
    this.load();
  }

  public render() {
    /// ...
  }

  private async load() {
    try {
      this.error = undefined
      this.loading = true
      const list = await fetchList()
      this.list = list
    } catch (err) {
      this.error = err
    } finally {
      this.loading = false
    }
  }
}
```

其实 mobx 也有挺多缺点:

- 代码侵入性. 所有需要响应数据变动的组件都需要使用 observer 装饰, 属性需要使用 observable 装饰, 以及数据操作方式. 对 mobx 耦合较深, 日后切换框架或重构的成本很高
- 兼容性. mobx v5 后使用 Proxy 进行重构, Proxy 在 Chrome49 之后才支持. 如果要兼容旧版浏览器则只能使用 v4, v4 有一些[坑](https://cn.mobx.js.org/#mobx-4-vs-mobx-5), 这些坑对于不了解 mobx 的新手很难发现:

  - Observable 数组并非真正的数组. 比如 antd 的 Table 组件就不认 mobx 的数组, 需要传入到组件之间使用 slice 进行转换
  - 向一个已存在的 observable 对象中添加属性不会被自动捕获

<br/>

于是 hooks 出现了, 它让组件的状态管理变得更简单直接, 而且它的思想也很接近 mobx 响应式编程哲学:

![mobx](https://bobi.ink/images/04/mobx.png)

<br>

1. 简洁地声明状态

**状态** 是驱动应用的数据. 例如 UI 状态或者业务领域状态

```ts
function Demo() {
  const [list, setList] = useState<Item[]>([]);
  // ...
}
```

2. 衍生

任何 源自状态并且不会再有任何进一步的相互作用的东西就是衍生。包括用户视图, 衍生状态, 其他副作用

```ts
function Demo(props: { id: string }) {
  const { id } = props;
  // 取代mobx的observable: 获取列表, 在挂载或id变动时请求
  const [value, setValue, loading, error, retry] = usePromise(
    async id => {
      return getList(id);
    },
    [id],
  );

  // 衍生状态: 取代mobx的computed
  const unreads = useMemo(() => value.filter(i => !i.readed), [value]);

  // 衍生副作用: value变动后自动持久化
  useDebounce(
    () => {
      saveList(id, value);
    },
    1000,
    [value],
  );

  // 衍生视图
  return <List data={value} onChange={setValue} error={error} loading={loading} retry={retry} />;
}
```

<img src="https://bobi.ink/images/04/hook-stream.png" width="400" />

所以说 hook 是一个革命性的东西, 它可以让组件的状态数据流更加清晰. 换做 class 组件, 我们通常的做法可能是在 `componentDidUpdate`生命周期方法中进行数据比较, 然后命令式地触发一些方法. 比如 id 变化时触发 getList, list 变化时进行 saveList.

**hook 似乎在淡化组件生命周期的概念, 让开发者更专注于状态的关系, 以数据流的方式来思考组件的开发**. [Dan Abramov](https://mobile.twitter.com/dan_abramov)在[编写有弹性的组件](https://overreacted.io/zh-hans/writing-resilient-components/)也提到了一个原则"不要阻断数据流", 证实了笔者的想法:

> 无论何时使用 props 和 state，请考虑如果它们发生变化会发生什么。在大多数情况下，组件不应以不同方式处理初始渲染和更新流程。这使它能够适应逻辑上的变化。

读者可以看一下[awesome-react-hooks](https://github.com/rehooks/awesome-react-hooks), 这些开源的 hook 方案都挺有意思. 例如[rxjs-hooks](https://github.com/LeetCode-OpenSource/rxjs-hooks), 巧妙地将 react hooks 和 rxjs 结合的起来:

```ts
function App(props: { foo: number }) {
  // 响应props的变动
  const value = useObservable(inputs$ => inputs$.pipe(map(([val]) => val + 1)), 200, [props.foo]);
  return <h1>{value}</h1>;
}
```

<br/>

---

<br/>

## 6. 类继承也有用处

就如 react 官方文档说的: "我们的 React 使用了数以千计的组件，然而却还未发现任何需要推荐你使用继承的情况。", React 偏向于函数式编程的组合模式, 面向对象的继承实际的应用场景很少.

当我们需要将一些传统的第三方库转换成 React 组件库时, 继承就可能派上用场. 因为这些库大部分是使用面向对象的范式来组织的, 比较典型的就是地图 SDK. 以[百度地图](http://lbsyun.baidu.com/cms/jsapi/reference/jsapi_reference_3_0.html)为例:

![baidu overlay](https://bobi.ink/images/04/overlay.png)

百度地图有各种组件类型: controls, overlays, tileLayers. 这些类型都有多个子类, 如上图, overlay 有 Label, Marker, Polyline 等这些子类, 且这些子类有相同的生命周期, 都是通过 addOverlay 方法来渲染到地图画布上. 我们可以通过继承的方式将他们生命周期管理抽取到父类上, 例如:

```ts
// Overlay抽象类, 负责管理Overlay的生命周期
export default abstract class Overlay<P> extends React.PureComponent<OverlayProps & P> {
  protected initialize?: () => void;
  // ...
  public componentDidMount() {
    // 子类在constructor或initialize方法中进行实例化
    if (this.initialize) {
      this.initialize();
    }

    if (this.instance && this.context) {
      // 渲染到Map画布中
      this.context.nativeInstance!.addOverlay(this.instance);
      // 初始化参数
      this.initialProperties();
    }
  }

  public componentDidUpdate(prevProps: P & OverlayProps) {
    // 属性更新
    this.updateProperties(prevProps);
  }

  public componentWillUnmount() {
    // 组件卸载
    if (this.instance && this.context) {
      this.context.nativeInstance!.removeOverlay(this.instance);
    }
  }
  // ...
  // 其他通用方法
  private forceReloadIfNeed(props: P, prevProps: P) {
    ...
  }
}
```

子类的工作就变得简单很多, 声明自己的属性/事件和实例化具体类:

```ts
export default class Label extends Overlay<LabelProps> {
  public static defaultProps = {
    enableMassClear: true,
  };

  public constructor(props: LabelProps) {
    super(props);
    const { position, content } = this.props;
    // 声明支持的属性和回调
    this.extendedProperties = PROPERTIES;
    this.extendedEnableableProperties = ENABLEABLE_PROPERTIES;
    this.extendedEvents = EVENTS;

    // 实例化具体类
    this.instance = new BMap.Label(content, {
      position,
    });
  }
}
```

> 代码来源于 [react-bdmap](https://github.com/ivan-94/react-bdmap)

当然这个不是唯一的解决方法, 使用高阶组件和 hooks 同样能够实现. 只不过对于原本就采用面向对象范式组织的库, 使用继承方式会更加好理解

<br/>

---

<br/>

## 7. 模态框管理

![modal demo](https://bobi.ink/images/04/modal-demo.png)

模态框是应用开发中使用频率非常高组件，尤其在中后台管理系统中. 但是在 React 中用着并不是特别爽, 典型的代码如下:

```tsx
const Demo: FC<{}> = props => {
  // ...
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState();
  const handleCancel = () => {
    setVisible(false);
  };

  const prepareEdit = async (item: Item) => {
    // 加载详情
    const detail = await loadingDeatil(item.id);
    setEditing(detail);
    setVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validate();
      // 保存
      await save(editing.id, values);
      // 隐藏
      setVisible(false);
    } catch {}
  };

  return;
  <>
    <Table
      dataSource={list}
      columns={[
        {
          text: '操作',
          render: item => {
            return <a onClick={() => prepareEdit(item)}>编辑</a>;
          },
        },
      ]}
    />
    <Modal visible={visible} onOk={handleOk} onCancel={handleHide}>
      {/* 表单渲染 */}
    </Modal>
  </>;
};
```

上面的代码太丑了， 不相关逻辑堆积在一个组件下 ，不符合单一职责. 所以我们要将模态框相关代码抽取出去, 放到 EditModal 中:

```tsx
const EditModal: FC<{ id?: string; visible: boolean; onCancel: () => void; onOk: () => void }> = props => {
  // ...
  const { visible, id, onHide, onOk } = props;
  const detail = usePromise(async (id: string) => {
    return loadDetail(id);
  });

  useEffect(() => {
    if (id != null) {
      detail.call(id);
    }
  }, [id]);

  const handleOk = () => {
    try {
      const values = await form.validate();
      // 保存
      await save(editing.id, values);
      onOk();
    } catch {}
  };

  return (
    <Modal visible={visible} onOk={onOk} onCancel={onCancel}>
      {detail.value &&
        {
          /* 表单渲染 */
        }}
    </Modal>
  );
};

/**
 * 使用
 */
const Demo: FC<{}> = props => {
  // ...
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<string | undefined>(undefined);
  const handleHide = () => {
    setVisible(false);
  };

  const prepareEdit = async (item: Item) => {
    setEditing(item.id);
    setVisible(true);
  };

  return;
  <>
    <Table
      dataSource={list}
      columns={[
        {
          text: '操作',
          render: item => {
            return <a onClick={() => prepareEdit(item)}>编辑</a>;
          },
        },
      ]}
    />
    <EditModal id={editing} visible={visible} onOk={handleHide} onCancel={handleHide}>
      {' '}
    </EditModal>
  </>;
};
```

现在编辑相关的逻辑抽取到了 EditModal 上，但是 Demo 组件还要维护模态框的打开状态和一些数据状态。一个复杂的页面可能会有很多模态框，这样的代码会变得越来越恶心， 各种 xxxVisible 状态满天飞. 从实际开发角度上将，模态框控制的最简单的方式应该是这样的：

```tsx
const handleEdit = item => {
  EditModal.show({
    // 🔴 通过函数调用的方式出发弹窗. 这符合对模态框的习惯用法, 不关心模态框的可见状态. 例如window.confirm, wx.showModal().
    id: item.id, // 🔴 传递数据给模态框
    onOk: saved => {
      // 🔴 事件回调
      refreshList(saved);
    },
    onCancel: async () => {
      return confirm('确认取消'); // 控制模态框是否隐藏
    },
  });
};
```

这种方式在社区上也是有争议的，有些人认为这是 React 的反模式，[@欲三更](https://www.zhihu.com/people/yu-san-geng)在[Modal.confirm 违反了 React 的模式吗？](https://zhuanlan.zhihu.com/p/54492049)就探讨了这个问题。 以图为例：

![modal confirm](https://bobi.ink/images/04/modal-confirm.jpg)

红线表示时间驱动(或者说时机驱动), 蓝线表示数据驱动。欲三更认为“哪怕一个带有明显数据驱动特色的 React 项目，也存在很多部分不是数据驱动而是事件驱动的. 数据只能驱动出状态，只有时机才能驱动出行为, 对于一个时机驱动的行为，你非得把它硬坳成一个数据驱动的状态，你不觉得很奇怪吗?”. 他的观点正不正确笔者不做评判, 但是某些场景严格要求‘数据驱动’，可能会有很多模板代码，写着会很难受.

So 怎么实现?

可以参考 antd [Modal.confirm](https://github.com/ant-design/ant-design/blob/master/components/modal/confirm.tsx)的实现, 它使用`ReactDOM.render`来进行外挂渲染，也有人使用[Context API](https://medium.com/@BogdanSoare/how-to-use-reacts-new-context-api-to-easily-manage-modals-2ae45c7def81)来实现的. 笔者认为比较接近理想的(至少 API 上看)是[react-comfirm](https://github.com/haradakunihiko/react-confirm)这样的:

```tsx
/**
 * EditModal.tsx
 */
import { confirmable } from 'react-confirm';
const EditModal = props => {
  /*...*/
};

export default confirmable(EditModal);

/**
 *  Demo.tsx
 */
import EditModal from './EditModal';

const showEditModal = createConfirmation(EditModal);

const Demo: FC<{}> = props => {
  const prepareEdit = async (item: Item) => {
    showEditModal({
      id: item.id, // 🔴 传递数据给模态框
      onOk: saved => {
        // 🔴 事件回调
        refreshList(saved);
      },
      onCancel: async someValues => {
        return confirm('确认取消'); // 控制模态框是否隐藏
      },
    });
  };

  // ...
};
```

使用`ReactDOM.render`外挂渲染形式的缺点就是无法访问 Context，所以还是要妥协一下，结合 Context API 来实现示例：

<iframe src="https://codesandbox.io/embed/lryom9617l?autoresize=1&fontsize=14" title="useModal" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"></iframe>

扩展

- [Modal.confirm](https://github.com/ant-design/ant-design/blob/master/components/modal/confirm.tsx)
- [Modal.confirm 违反了 React 的模式吗？](https://zhuanlan.zhihu.com/p/54492049)
- [使用 render props 抽象 Modal 组件的状态](https://www.zhihu.com/search?type=content&q=react%20modal)
- [react-confirm](https://github.com/haradakunihiko/react-confirm)
- [How to use React’s new Context API to easily manage modals](https://medium.com/@BogdanSoare/how-to-use-reacts-new-context-api-to-easily-manage-modals-2ae45c7def81) 基于 Context 的方案

<br/>

---

<br/>

## 8. 使用 Context 进行依赖注入

Context 为组件树提供了一个传递数据的方法，从而避免了在每一个层级手动的传递 props 属性.

Context 在 React 应用中使用非常频繁, 新的[Context API](https://react.docschina.org/docs/context.html#when-to-use-context)也非常易用. Context 常用于以下场景:

- **共享那些被认为对于一个'组件树'而言是“全局”的数据**. 如当前认证的用户, 主题, i18n 配置, 表单状态
- **组件配置**. 配置组件的行为, 如 antd 的 ConfigProvider
- **跨组件通信**. 不推荐通过'事件'进行通信, 而是通过'状态'进行通信
- **依赖注入**
- **状态管理器**. Context 经过一些封装可以基本取代 Redux 和 Mobx 这些状态管理方案. 后续有专门文章介绍

Context 的作用域是子树, 也就是说一个 Context Provider 可以应用于多个子树, 子树的 Provider 也可以覆盖父级的 Provider 的 value. 基本结构:

```tsx
import React, {useState, useContext} from 'react'

export inteface MyContextValue {
  state: number
  setState: (state: number) => void
}

const MyContext = React.createContext<MyContextValue>(
  {
    state: 1,
    // 设置默认值, 抛出错误, 必须配合Provider使用
    setState: () => throw new Error('请求MyContextProvider组件下级调用')
  }
)

export const MyContextProvider: FC<{}> = props => {
  const [state, setState] = useState(1)
  return <MyContext.Provider value={{state, setState}}>{props.children}</MyContext.Provider>
}

export function useMyContext() {
  return useContext(MyContext)
}

export default MyContextProvider
```

> Context 默认值中的方法应该抛出错误, 警告不规范的使用

扩展：

- [避免 React Context 导致的重复渲染](https://zhuanlan.zhihu.com/p/50336226)

<br/>

---

<br/>

## 9. 不可变的状态

对于函数式编程范式的 React 来说，不可变状态有重要的意义.

- 不可变数据具有可预测性。 可不变数据可以让应用更好调试，对象的变更更容易被跟踪和推导.
  就比如 Redux, 它要求只能通过 dispatch+reducer 进行状态变更，配合它的 Devtool 可以很好的跟踪状态是如何被变更的. 这个特性对于大型应用来说意义重大，因为它的状态非常复杂，如果不加以组织和约束，你不知道是哪个地方修改了状态， 出现 bug 时很难跟踪.

  所以说对于严格要求单向数据流的状态管理器(Redux)来说，不可变数据是基本要求，它要求整个应用由一个单一的状态进行映射，不可变数据可以让整个应用变得可被预测.

- 不可变数据还使一些复杂的功能更容易实现。避免数据改变，使我们能够安全保留对旧数据的引用，可以方便地实现撤销重做，或者时间旅行这些功能
- 可以精确地进行重新渲染判断。可以简化 shouldComponentUpdate 比较。

实现不可变数据的流行方法:

- [immer](https://github.com/immerjs/immer)
- [Immutable.js](https://github.com/immutable-js/immutable-js)

笔者比较喜欢 immer，没有什么心智负担, 按照 JS 习惯的对象操作方式就可以实现不可变数据。

<br/>

---

<br/>

## 10. React-router: URL 即状态

<center>
 <img src="https://bobi.ink/images/04/static-router.png" width="300" />
</center>

传统的路由主要用于区分页面, 所以一开始前端路由设计也像后端路由(也称为**静态路由**)一样, 使用对象配置方式, 给不同的 url 分配不同的页面组件, 当应用启动时, 在路由配置表中查找匹配 URL 的组件并渲染出来.

React-Router v4 算是一个真正意义上符合*组件化*思维的路由库, React-Router 官方称之为‘动态路由’, 官方的解释是"指的是在应用程序渲染时发生的路由，而不是在运行应用程序之外的配置或约定中发生的路由", 具体说, `<Route/>`变成了一个普通 React 组件, 它在渲染时判断是否匹配 URL, 如果匹配就渲染指定的组件, 不匹配就返回 null.

这时候 URL 意义已经不一样了, **URL 不再是简单的页面标志, 而是应用的状态**; **应用构成也不再局限于扁平页面, 而是多个可以响应 URL 状态的区域(可嵌套)**. 因为思维转变很大, 所以它刚出来时并不受青睐. 这种方式更加灵活， 所以选择 v4 不代表放弃旧的路由方式, 你完全可以按照[旧的方式](https://react-router.docschina.org/core/guides/static-routes)来实现页面路由.

举个应用实例: 一个应用由三个区域组成: 侧边栏放置多个入口, 点击这些入口会加载对应类型的列表, 点击列表项需要加载详情. 三个区域存在级联关系

![router demo](https://bobi.ink/images/04/router-demo.png)

首先设计能够表达这种级联关系的 URL, 比如`/{group}/{id}`, URL 设计一般遵循[REST 风格](https://ruby-china.github.io/rails-guides/v5.0/routing.html#嵌套资源), 那么应用的大概结构是这样子:

```tsx
// App
const App = () => {
  <div className="app">
    <SideBar />
    <Route path="/:group" component={ListPage} />
    <Route path="/:group/:id" component={Detail} />
  </div>;
};

// SideBar
const Sidebar = () => {
  return (
    <div className="sidebar">
      {/* 使用NavLink 在匹配时显示激活状态 */}
      <NavLink to="/message">消息</NavLink>
      <NavLink to="/task">任务</NavLink>
      <NavLink to="/location">定位</NavLink>
    </div>
  );
};

// ListPage
const ListPage = props => {
  const { group } = props.match.params;
  // ...

  // 响应group变化, 并加载指定类型列表
  useEffect(() => {
    load(group);
  }, [group]);

  // 列表项也会使用NavLink, 用于匹配当前展示的详情, 激活显示
  return <div className="list">{renderList()}</div>;
};

// DetailPage
const DetailPage = props => {
  const { group, id } = props.match.params;
  // ...

  // 响应group和id, 并加载详情
  useEffect(() => {
    loadDetail(group, id);
  }, [group, id]);

  return <div className="detail">{renderDetail()}</div>;
};
```

扩展

- [React Router 哲学](https://react-router.docschina.org/core/guides/philosophy)
- [聊聊 React Router v4 的设计思想](https://juejin.im/post/5986d1456fb9a03c3f405bd2)

<br/>

---

<br/>

## 11. 组件规范

- 开启严格模式: 开启 StrictMode，尽早发现潜在问题和不规范用法
- 第三方开发规范:
  - [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react#ordering)
  - [React bits](https://vasanthk.gitbooks.io/react-bits/patterns/30.component-switch.html)
  - [react-in-patterns](https://github.com/krasimir/react-in-patterns)

## 扩展

- [recompose](https://github.com/acdlite/recompose/blob/master/docs/API.md)
- [编写有弹性的组件](https://overreacted.io/zh-hans/writing-resilient-components/)
