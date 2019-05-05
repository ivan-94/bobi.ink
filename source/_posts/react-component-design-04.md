---
title: React组件设计实践总结04 - 组件的思维
date: 2019/4/23
categories: 前端
---

### 通信/事件

## 组件的思维

### 使用组件的方式来表达逻辑

大部分情况下, 我们会将 UI 转换成组件. 其实组件不单单可以表示 UI, 也可以用来表示业务逻辑, 这个可以巧妙地解决一些问题.

举一个例子: 当一个审批人在审批一个请求时, 请求发起者是不能重新编辑的; 反之发起者在编辑时, 审批人不能进行审批. 这是一个锁定机制, 后端一般使用类似心跳机制来维护这个'锁', 这个锁会有过期机制, 所以前端一般会使用轮询机制来激活锁.

一般的实现:

```ts
class MyPage extends React.Component {
  public componentDidMount() {
    // 根据一些条件触发
    if (isApprover || isEditing) {
      this.timer = setInterval(async () => {
        // 轮询
      }, 5000);
    }
  }

  public componentWillUnmount() {
    clearInterval(this.timer);
  }
}
```

随着功能的迭代, MyPage 会变得越来越臃肿, 这时候你开始考虑将这些业务逻辑抽取出去. 一般情况下通过高阶组件或者 hook, 但都不够灵活, 比如条件化锁定这个功能实现起来就比较别扭.

另一种方式就是将这些业务逻辑抽取为组件, 例如 Locker:

```ts
const Locker: FC<{ onError: err => boolean, id: string }> = props => {
  const {id, onError} = props
  useEffect(() => {
    let timer
    const poll = () => {
      timer = setTimeout(async () => {
        // ...
      }, 5000)
    }

    poll()

    return () => {
      clearTimeout(timer)
    }
  }, [id])

  return null
};
```

使用 Locker

```ts
render() {
  return (<div>
    {this.isEdting || this.isApprover && <Locker id={this.id} onError={this.handleError}></Locker>}
  </div>)
}
```

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

在 React Hooks 出现之前, 为了给函数组件(或者说 dumb component)添加状态, 通常会使用这种模式, [react-powerplug](https://github.com/renatorib/react-powerplug)就是这样一个典型的例子.

### hooks 取代高阶组件

逻辑复用能力

高阶组件难以进行类型声明
高阶组件组件嵌套

useList 为例

### hooks 实现'响应式'编程

`Vue`的非侵入性[响应式系统](https://cn.vuejs.org/v2/guide/reactivity.html)是其最独特的特性之一, 而 React 这边指提供了 setState 这个 API, 复杂组件为了保证状态的'不可变性', 代码往往会写的又臭又长. 例如:

```ts
this.setState({
  pagination: {
    ...this.state.pagination,
    current: (defaultPagination && defaultPagination.current) || 1,
    pageSize: (defaultPagination && defaultPagination.pageSize) || 15,
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

mobx 也有挺多缺点:

- 代码侵入性. 所有需要响应数据变动的组件都需要使用 observer 装饰, 属性需要使用 observable 装饰. 对 mobx 耦合较深, 日后切换框架成本很高
- 兼容性. mobx v5 后使用 Proxy 进行重构, Proxy 在 Chrome49 之后才支持. 如果要兼容旧版浏览器则只能使用 v4, v4 有一些[坑](https://cn.mobx.js.org/#mobx-4-vs-mobx-5), 这些坑对于不了解 mobx 的新手很难发现:
  - Observable 数组并非真正的数组. 比如 antd 的 Table 组件就不认 mobx 的数组, 需要传入到组件之间使用 slice 进行转换
  - 向一个已存在的 observable 对象中添加属性不会被自动捕获

于是 hooks 出现了, 它让组件的状态管理变得更简单直接, 而且它的思想也很接近 mobx 响应式编程哲学:

![mobx](/images/04/mobx.png)

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

<img src="/images/04/hook-stream.png" width="400" />

所以说 hook 是一个革命性的东西, 它可以让组件的状态数据流更加清晰. 换做 class 组件, 我们通常的做法可能是在 componentDidUpdate()生命周期方法中进行数据比较, 然后命令式地触发一些方法, 比如 id 变化时触发 getList, list 变化时进行 saveList.

hook 似乎在淡化组件生命周期的概念, 让开发者更专注于状态的关系, 以数据流的方式来思考组件的开发. [Dan Abramov](https://mobile.twitter.com/dan_abramov)在[编写有弹性的组件](https://overreacted.io/zh-hans/writing-resilient-components/)也提到了一个原则"不要阻断数据流", 证实了笔者的想法:

> 无论何时使用 props 和 state，请考虑如果它们发生变化会发生什么。在大多数情况下，组件不应以不同方式处理初始渲染和更新流程。这使它能够适应逻辑上的变化。

读者可以看一下[awesome-react-hooks](https://github.com/rehooks/awesome-react-hooks), 这些开源的 hook 方案都挺有意思. 例如[rxjs-hooks](https://github.com/LeetCode-OpenSource/rxjs-hooks), 巧妙地将 react hooke 和 rxjs 结合的起来:

```ts
function App(props: { foo: number }) {
  // 响应props的变动
  const value = useObservable(inputs$ => inputs$.pipe(map(([val]) => val + 1)), 200, [props.foo]);
  return <h1>{value}</h1>;
}
```

### 类继承也有用处

就如 react 官方文档说的: "我们的 React 使用了数以千计的组件，然而却还未发现任何需要推荐你使用继承的情况。", React 偏向于函数式编程的组合模式, 面向对象的继承实际的应用场景很少.

当我们需要将一些传统的第三方库转换成 React 组件库时, 继承就可以派上用场了. 因为这些库大部分是使用面向对象的范式来组织的, 比较典型的就是地图 SDK. 以[百度地图](http://lbsyun.baidu.com/cms/jsapi/reference/jsapi_reference_3_0.html)为例:

![baidu overlay](/images/04/overlay.png)

百度地图有各种组件类型: controls, overlays, tileLayers. 这些类型都有多个子类, 如上图, overlay 有 Label, Marker, Polyline 等这些子类, 这些子类有相同的生命周期, 他们都是通过 addOverlay 方法来渲染到地图画布上. 我们可以通过继承的方式将他们生命周期管理抽取到父类上, 例如:

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

### 配置组件

### 使用 Context 在组件树中共享状态

- 动态表单+验证
- context 默认值

### 模态框管理

### 使用 React-router 实现响应式的页面结构

应急通信为例

### 异常处理

context 缺陷

## Props

### 灵活的 props

### 避免透传

## 组件规范

## 扩展

- [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react#ordering)
- [recompose](https://github.com/acdlite/recompose/blob/master/docs/API.md)
- [编写有弹性的组件](https://overreacted.io/zh-hans/writing-resilient-components/)
