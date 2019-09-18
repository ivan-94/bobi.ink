---
title: "自定义React渲染器 之 深入解耦 Remax(用React写小程序)"
date: 2019/9/15
categories: 前端
---

上个月蚂蚁金服前端发布了一个新的应用`Remax`, 口号是**使用真正的、完整的React来开发小程序**，对于原本的React开发者来说'Learn once, write anywhere', 和ReactNative开发体验差不多；**而对于小程序来说则是全新的开发体验**。

Taro号称是‘类React’的开发方案，但是它是使用静态编译的方式实现，[meck](https://www.zhihu.com/people/meck)在它的[Remax - 使用真正的 React 构建小程序](https://zhuanlan.zhihu.com/p/79788488)文章中也提到了这一点: `所谓静态编译，就是使用工具把代码语法分析一遍，把其中的 JSX 部分和逻辑部分抽取出来，分别生成小程序的模板和 Page 定义。` 这种方案实现起来比较复杂，且运行时并没有React存在。

![](/images/remax/01.png)

相比而言，Remax的解决方案就简单很多，它不过就是新的React渲染器.

> 因为Remax还在初期阶段，代码比较简单，感兴趣的可以去[github](https://github.com/remaxjs/remax)观摩贡献

> 可以通过 CodeSandbox 游乐场试玩自定义Renderer: [![Edit react-custom-renderer](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/react-custom-renderer-mm9kl?fontsize=14)

<br>

<br>

## 关于React的一些基本概念

在深入阅读本文之前，先要确保理解一下几个基本概念:

- **Element**: 我们可以通过`JSX`或`React.createElement`来创建Element，用来描述我们要创建的视图节点。比如:

    ```jsx
    <button class='button button-blue'>
      <b>
        OK!
      </b>
    </button>
    ```

    jsx会被编译为:

    ```js
    {
      type: 'button',
      props: {
        className: 'button button-blue',
        children: {
          type: 'b',
          props: {
            children: 'OK!'
          }
        }
      }
    }
    ```

    也就是说**Element就是一个普通的对象，描述用户创建的节点类型、props以及children**。这些Elements组合成树，描述用户界面

    <br>

- **Component**: 可以认为是Element的类型，它有两种类型：
  - **Host Component**: 宿主组件，这是由渲染的平台提供的‘内置’组件，例如React DOM平台下面的DOM节点，如`div`、`span`. 这些组件类型为字符串
  - **Composite Component**: 复合组件，这是一种用户自定义的组件封装单位。通常包含自定义的逻辑、状态以及输出Element树。复合类型可以为类或函数

    ```jsx
    const DeleteAccount = () => (
      <div>
        <p>Are you sure?</p>
        <DangerButton>Yep</DangerButton>
        <Button color='blue'>Cancel</Button>
      </div>
    );
    ```

    <br>

- **Instance**: 当React开始渲染一个Element时，会根据组件类型为它创建一个‘实例’，例如类组件，会调用new操作符实例化。这个实例会一直引用，直到Element从Element Tree中被移除。
  
    `首次渲染`: React会实例化一个MyButton实例，调用挂载相关的生命周期方法，并执行render方法，渲染下级

    ```jsx
    render(<MyButton>foo</MyButton>, container)
    ```

    `更新`: 因为组件类型没有变化，React不会再实例化，这个属于‘节点更新’，React会执行更新相关的生命周期方法，如shouldComponentUpdate。如果需要更新则再次执行render方法

    ```jsx
    render(<MyButton>bar</MyButton>, container)
    ```

    `卸载`: 组件类型不一样了, 原有的MyButton被替换. MyButton的实例将要被销毁，React会执行卸载相关的生命周期方法，如componentWillUnmount

    ```jsx
    render(<button>bar</button>, container)
    ```

    <br>

- **Reconciler** & **Renderer**: Reconciler和Renderer的关系可以通过下图缕清楚. Reconciler的职责是维护VirtualDOM树，内部实现了Diff/Fiber算法，决定什么时候更新、以及要更新什么；而Renderer负责具体平台的渲染工作，它会提供宿主组件、处理事件等等。例如ReactDOM就是一个渲染器，负责DOM节点的渲染和DOM事件处理。

  ![](/images/remax/02.png)

  <br>

- **Fiber的两个阶段**: React 使用了Fiber架构之后，更新过程被分为两个阶段(Phase)
    - **协调阶段(Reconciliation Phase)** 这个阶段React会找出需要更新的节点。这个阶段是可以被打断的，比如有优先级更高的事件要处理时。
    - **提交阶段(Commit Phase)** 将上一个阶段计算出来的需要处理的**副作用(Effects)**一次性执行了。这个阶段必须同步执行，不能被打断

    如果按照render为界，可以将生命周期函数按照两个阶段进行划分：

    - 协调阶段
      - constructor
      - componentWillMount 废弃
      - componentWillReceiveProps 废弃
      - static getDerivedStateFromProps
      - shouldComponentUpdate
      - componentWillUpdate 废弃
      - render
      - getSnapshotBeforeUpdate()
    - 提交阶段
      - componentDidMount
      - componentDidUpdate
      - componentWillUnmount

<br>

本文的主题就是如何自定义Renderer. 大部分核心的工作已经在Reconciler完成，好在React的架构和模块划分还比较清晰，React官方也暴露了一些仓库，比较友好的支持第三方自定义渲染器。这极大简化了我们开发Renderer的难度。

<br>

## 自定义React渲染器

React官方仓库暴露了一些库供开发者来扩展自定义渲染器：

- [react-reconciler](https://github.com/facebook/react/tree/master/packages/react-reconciler) - 这是React的协调器, 这是React的核心所在。我们主要通过它来自定义渲染器。
- [scheduler](https://github.com/facebook/react/tree/master/packages/scheduler) - 合作调度器的一些API。

> 需要注意的是，这些包还是实验性的，主要React团队内部在用，API可能不太稳定。另外，没有文档，你可以看源代码，或者其他渲染器实现

创建一个自定义渲染器只需两步:

![](/images/remax/04.png)

第一步: 实现宿主配置，这是react-reconciler要求宿主提供的一些适配器方法和配置项。比如创建节点实例、添加和移除节点、提交修改等等

```js
const Reconciler = require('react-reconciler');

const HostConfig = {
  // ... 实现适配器方法和配置项
};
```

第二步：实现渲染方法

```js
// 创建Reconciler实例, 并将HostConfig传递给Reconciler
const MyRenderer = Reconciler(HostConfig);

/**
 * 假设和ReactDOM一样，接收三个参数
 * render(<MyComponent />, container, () => console.log('rendered'))
 */
export function render(element, container, callback) {
  // 创建根容器
  if (!container._rootContainer) {
    container._rootContainer = ReactReconcilerInst.createContainer(container, false);
  }

  // 更新根容器
  return ReactReconcilerInst.updateContainer(element, container._rootContainer, null, callback);
}
```

容器是根Fiber节点(FiberRoot)，根节点是整个组件树的入口，也是组件树挂载目标，将会被Reconciler用来管理所有节点的更新。关于Fiber架构的一些细节可以看这篇文章[\[译\]深入React fiber架构及源码](https://zhuanlan.zhihu.com/p/57346388)

<br>

## HostConfig 渲染器适配器

HostConfig支持非常多的参数，完整列表可以看[这里](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/forks/ReactFiberHostConfig.custom.js). 下面是一些自定义渲染器必须提供的参数：

```tsx
interface HostConfig {
  /**
   * 用于分享一些上下文信息
   */
  // 获取根容器的上下文信息, 只在根节点调用一次
  getRootHostContext(rootContainerInstance: Container): HostContext;
  // 获取子节点的上下文信息, 每遍历一个节点都会调用一次
  getChildHostContext(parentHostContext: HostContext, type: Type, rootContainerInstance: Container): HostContext;


  /**
   * 节点实例的创建
   */
  // 普通节点实例创建，例如DOM的Element类型
  createInstance(type: Type, props: Props, rootContainerInstance: Container, hostContext: HostContext, internalInstanceHandle: OpaqueHandle,): Instance;
  // 文本节点的创建，例如DOM的Text类型
  createTextInstance(text: string, rootContainerInstance: Container, hostContext: HostContext, internalInstanceHandle: OpaqueHandle): TextInstance;
  // 决定是否要处理子节点/子文本节点. 如果不想创建则返回true. 例如ReactDOM中使用dangerouslySetInnerHTML, 这时候子节点会被忽略
  shouldSetTextContent(type: Type, props: Props): boolean;

  /**
   * 节点树构建
   */
  // 如果节点在*未挂载*状态下，会调用这个来添加子节点
  appendInitialChild(parentInstance: Instance, child: Instance | TextInstance): void;
  // **下面都是副作用(Effect)，在’提交‘阶段被执行**
  // 添加子节点
  appendChild?(parentInstance: Instance, child: Instance | TextInstance): void;
  // 添加子节点到容器节点(根节点)
  appendChildToContainer?(container: Container, child: Instance | TextInstance): void;
  // 插入子节点
  insertBefore?(parentInstance: Instance, child: Instance | TextInstance, beforeChild: Instance | TextInstance): void;
  // 插入子节点到容器节点(根节点)
  insertInContainerBefore?(container: Container, child: Instance | TextInstance, beforeChild: Instance | TextInstance,): void;
  // 删除子节点
  removeChild?(parentInstance: Instance, child: Instance | TextInstance): void;
  // 从容器节点(根节点)中移除子节点
  removeChildFromContainer?(container: Container, child: Instance | TextInstance): void;

  /**
   * 节点挂载
   */
  // 在完成所有子节点初始化时(所有子节点都appendInitialChild完毕)时被调用, 如果返回true，则commitMount将会被触发
  // ReactDOM通过这个属性和commitMount配置实现表单元素的autofocus功能
  finalizeInitialChildren(parentInstance: Instance, type: Type, props: Props, rootContainerInstance: Container, hostContext: HostContext): boolean;
  // 和finalizeInitialChildren配合使用，commitRoot会在’提交‘完成后(resetAfterCommit)执行, 也就是说组件树渲染完毕后执行
  commitMount?(instance: Instance, type: Type, newProps: Props, internalInstanceHandle: OpaqueHandle): void;

  /**
   * 节点更新
   */
  // 准备节点更新. 如果返回空则表示不更新，这时候commitUpdate则不会被调用
  prepareUpdate(instance: Instance, type: Type, oldProps: Props, newProps: Props, rootContainerInstance: Container, hostContext: HostContext,): null | UpdatePayload;
  // **下面都是副作用(Effect)，在’提交‘阶段被执行**
  // 文本节点提交
  commitTextUpdate?(textInstance: TextInstance, oldText: string, newText: string): void;
  // 普通节点提交
  commitUpdate?(instance: Instance, updatePayload: UpdatePayload, type: Type, oldProps: Props, newProps: Props, internalInstanceHandle: OpaqueHandle): void;
  // 重置普通节点文本内容, 这个需要和shouldSetTextContent(返回true时)配合使用，
  resetTextContent?(instance: Instance): void;

  /**
   * 提交
   */
  // 开始’提交‘之前被调用，比如这里可以保存一些状态，在’提交‘完成后恢复状态。比如ReactDOM会保存当前元素的焦点状态，在提交后恢复
  // 执行完prepareForCommit，就会开始执行Effects(节点更新)
  prepareForCommit(containerInfo: Container): void;
  // 和prepareForCommit对应，在提交完成后被执行
  resetAfterCommit(containerInfo: Container): void;


  /**
   * 调度
   */
  // This function is used by the reconciler in order to calculate current time for prioritising work. In case of react-dom, it uses performace.now if available or it falls back to Date.now Hence, lets just keep it as Date.now for our custom renderer.
  // 这个函数将被Reconciler用来计算当前时间, 比如计算任务剩余时间 
  // ReactDOM中会优先使用Performance.now, 普通场景用Date.now即可
  now(): number;
  // 自定义计时器
  setTimeout(handler: (...args: any[]) => void, timeout: number): TimeoutHandle | NoTimeout;
  // 取消计时器
  clearTimeout(handle: TimeoutHandle | NoTimeout): void;
  // 表示一个空的计时器，见👆clearTimeout的签名
  noTimeout: NoTimeout;

  // ? 功能未知
  shouldDeprioritizeSubtree(type: Type, props: Props): boolean;
  // 废弃
  scheduleDeferredCallback(callback: () => any, options?: { timeout: number }): any;
  // 废弃
  cancelDeferredCallback(callbackID: any): void;


  /**
   * 功能开启
   */
  // 开启节点修改，一般渲染器都会开启，不然无法更新节点
  supportsMutation: boolean;
  // 开启持久化 ?
  supportsPersistence: boolean;
  // 开启hydrate，一般用于服务端渲染
  supportsHydration: boolean;

  /**
   * 杂项
   */
  // 获取可公开的节点实例，即你愿意暴露给用户的节点信息，用户通过ref可以获取到这个对象。一般自定义渲染器原样返回即可, 除非你想有选择地给用户暴露信息
  getPublicInstance(instance: Instance | TextInstance): PublicInstance;

  // ... 还有很多参数，由于一般渲染器不会用到，暂时不讲了
}
```

<br>

如果按照Fiber的两个阶段来划分的话，接口分类是这样的:

| **协调阶段**  | **开始提交** |**提交阶段**  | **提交完成**|
|-------------------------|----------------|--------------------------|-----------------|
| createInstance          | prepareCommit  | appendChild              | resetAfterCommit|
| createTextInstance      |                | appendChildToContainer   | commitMount     |
| shouldSetTextContent    |                | insertBefore             |                 |
| appendInitialChild      |                | insertInContainerBefore  |                 |
| finalizeInitialChildren |                | removeChild              |                 |
| prepareUpdate           |                | removeChildFromContainer |                 |
|                         |                | commitTextUpdate         |                 |
|                         |                | commitUpdate             |                 |
|                         |                | resetTextContent         |                 |


<br>

通过上面可以知道，HostConfig配置比较丰富，涉及节点操作、挂载、更新、调度、以及各种生命周期钩子, 可以控制渲染器的各种行为. 

看得有点蒙圈？没关系, 你暂时没有必要了解所有的参数，下面会一点一点展开，解释这些功能。最后再回来看这里。

<br>

## 宿主组件

React中有两种组件类型，一种是`宿主组件(Host Component)`, 另一种是`复合组件(CompositeComponent)`. `宿主组件`是平台提供的，例如`ReactDOM`平台提供了`div`、`span`、`h`1...等组件，这些组件通常是字符串类型，直接渲染为平台下面的视图节点。而`复合组件`，也称为`自定义组件`，用于组合其他`复合组件`和`宿主组件`，通常是类或函数。

渲染器不需要关心`复合组件`的处理: React组件树最终渲染出来的是一颗`宿主组件树`, 将它交给渲染器。在Remax中，定义了很多微信小程序特定的`宿主组件`，比如我们可以这样子使用它们:

```ts
function MyComp() {
  return <view><text>hello world</text></view>
}
```

`react-reconciler`会调用`HostConfig`的`createInstance`和`createTextInstance`来创建`宿主组件`的实例，所以自定义渲染器必须实现这两个方法. 看看`Remax`是怎么做的：

```js
const HostConfig = {
  // 创建宿主组件实例
  createInstance(type: string, newProps: any, container: Container) {
    const id = generate();
    // 预处理props, remax会对事件类型Props进行一些特殊处理
    const props = processProps(newProps, container, id);
    return new VNode({
      id,
      type,
      props,
      container,
    });
  },

  // 创建宿主组件文本节点实例
  createTextInstance(text: string, container: Container) {
    const id = generate();
    const node = new VNode({
      id,
      type: TYPE_TEXT,
      props: null,
      container,
    });
    node.text = text;
    return node;
  },

  // 判断是否需要创建TextInstance。如果返回true则不创建
  // 有一些场景是不需要创建文本节点的，而是由父节点内部消化。
  // 举个例子，在ReactDOM中，如果某个节点设置了dangerouslySetInnerHTML，那么它的children将被忽略，
  // 这时候 shouldSetTextContent则应该返回true
  shouldSetTextContent(type, nextProps) {
    return false
  }
}

```

在React DOM中上面两个方法分别会通过`document.createElement`和`document.createTextNode`来创建宿主组件(即DOM节点)。Remax用于小程序，在逻辑进程中是无法进行实际的渲染，所以在逻辑进程中需要创建一个虚拟节点，构成一颗镜像树，然后再同步到渲染进程中:

![](/images/remax/03.png)

<br>

## 构建镜像树

构建出完整的节点树需要实现HostConfig的`appendInitialChild`、`appendChild`、`insertBefore`等方法：

```js
const HostConfig = {
  // ...

  // 支持节点修改
  supportsMutation: true,

  // 用于初始化(首次)时添加子节点
  appendInitialChild: (parent: VNode, child: VNode) => {
    parent.appendChild(child, false);
  },

  // 添加子节点
  appendChild(parent: VNode, child: VNode) {
    parent.appendChild(child, false);
  },

  // 插入子节点
  insertBefore(parent: VNode, child: VNode, beforeChild: VNode) {
    parent.insertBefore(child, beforeChild, false);
  },

  // 删除节点
  removeChild(parent: VNode, child: VNode) {
    parent.removeChild(child, false);
  },

  // 添加节点到容器节点，一般情况我们不需要和appendChild特殊区分
  appendChildToContainer(container: any, child: VNode) {
    container.appendChild(child);
    child.mounted = true;
  },

  // 插入节点到容器节点
  insertInContainerBefore(container: any, child: VNode, beforeChild: VNode) {
    container.insertBefore(child, beforeChild);
  },

  // 从容器节点移除节点
  removeChildFromContainer(container: any, child: VNode) {
    container.removeChild(child);
  },
}
```

Remax通过VNode来模拟需要渲染的宿主节点，它的结构如下：

```js
export default class VNode {
  id: number;
  container: Container;
  children: VNode[];
  mounted = false;
  type: string | symbol;
  props?: any;
  parent: VNode | null = null;
  text?: string;
  appendChild(node: VNode, immediately: boolean)
  removeChild(node: VNode, immediately: boolean)
  insertBefore(newNode: VNode, referenceNode: VNode, immediately: boolean)
  // 触发同步到渲染进程
  update()
  path(): Path
  isMounted(): boolean
}
```

通过HostConfig配置的方法，我们现在可以插入和删除节点了。那什么时候应该将更新提交到渲染进程呢？react-reconciler也提供了这些方法，当这些钩子被触发时，我们就可以将‘镜像树’同步到小程序的渲染进程：

<br>

## 渲染提交与更新

从挂载到更新，react-reconciler都提供了相应的钩子，配置渲染和行为.

挂载相关的配置有:

![](/images/remax/05.png)

更新相关的配置有:

![](/images/remax/06.png)

```js
const HostConfig = {
  /**
   * 挂载相关
   */
  finalizeInitialChildren: () => false,
  prepareForCommit: () => {},
  resetAfterCommit: () => {},
  commitMount: () => {},

  /**
   * 更新相关
   */
  // 在这里比对props，如果props没有变化则不进行更新，这和shouldComponentUpdate差不多
  // 返回true表示更新该节点
  prepareUpdate(node: VNode, type: string, oldProps: any, newProps: any) {
    oldProps = processProps(oldProps, node.container, node.id);
    newProps = processProps(newProps, node.container, node.id);
    if (!shallowequal(newProps, oldProps)) {
      return true;
    }
    return null;
  },
  // 提交节点更新
  commitUpdate(
    node: VNode,
    updatePayload: any,
    type: string,
    oldProps: any,
    newProps: any
  ) {
    node.props = processProps(newProps, node.container, node.id);
    node.update();
  },
  // 提交文本节点更新
  commitTextUpdate(node: VNode, oldText: string, newText: string) {
    if (oldText !== newText) {
      node.text = newText;
      // 更新节点
      node.update();
    }
  },

}
```

回顾一下自定义渲染器各种方法调用的流程, 首先看一下挂载的流程:

假设我们的组件结构如下:

```jsx
const container = new Container()
const MyComp = () => {
  return (
    <div>
      <span>hello world</span>
    </div>
  )
}

render(
  <div className="root">
    <MyComp />
    <span>--custom renderer</span>
  </div>,
  container,
  () => {
    console.log("rendered")
  },
)
```

组件的结构如下(左图)，但对于渲染器来说，结构是右图。自定义组件是React层级的东西，渲染器只需要关心最终需要渲染的视图结构, 也就是说只关心宿主组件:

![](/images/remax/tree-compare.png)

挂载会经历以下流程:

![](/images/remax/mount.png)

通过上面的流程图，可以很清晰看到每个构造的调用时机。同理，我们来看一下节点更新时的流程. 在此之前，我们稍微改造一下上面的程序，让它定时更新:

```jsx
const MyComp = () => {
  const [count, setCount] = useState(1)
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1)
    }, 10000)

    return () => clearInterval(timer)
  }, [])
  const isEven = count % 2 === 0
  console.log("rendering MyComp")

  return (
    <div className="mycomp" style={{ color: isEven ? "red" : "blue" }}>
      {isEven ? <div>even</div> : null}
      <span className="foo">hello world {count}</span>
    </div>
  )
}
```

下面是更新的流程:

![](/images/remax/update.png)

当MyComp的count由1变为2时，MyComp会被重新渲染，这时候新增了一个div节点(红色虚框), 另外`hello world 1`也变成了`hello world 2`. 

新增的节点创建流程和挂载时一样，只不过它不会立即插入到父节点中，而是先放到Effect链表中，在`提交阶段`一次性来执行。同理`hello world {count}`文本节点的更新、以及其他节点的Props更新都是放到Effect链表中，最后时刻才更新. 如上图的`insertBefore`、`commitTextUpdate`、`commitUpdate`.

另外一个比较重要的是`prepareUpdate`钩子，你可以在这里告诉Reconciler，节点是否需要更新，如果需要更新则返回true，这样`commitUpdate`才会被触发。

<br>

## 同步到渲染进程

React自定义渲染器差不多就这样了，接下来就是平台相关的事情了。Remax目前的做法是在树结构变更或者节点更新提交时触发更新，通过小程序Page对象的setData方法将`更新指令`传递给渲染进程; 渲染进程侧再通过[`WXS`](https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxs/)机制，将`更新指令`恢复到树中. 最后再通过模板，将树递归渲染出来 整体的过程如下:

![](/images/remax/07.png)

先来看看逻辑进程侧是如何推送更新指令的：

```js
// 在根容器上管理更新
export default class Container {
  // ...
  requestUpdate(
    path: Path,
    start: number,
    deleteCount: number,
    immediately: boolean,
    ...items: RawNode[]
  ) {
    const update: SpliceUpdate = {
      path, // 更新节点的树路径
      start, // 更新节点在children中的索引
      deleteCount,
      items, // 当前节点的信息
    };
    if (immediately) {
      this.updateQueue.push(update);
      this.applyUpdate();
    } else {
      // 放入更新队列，延时收集更新
      if (this.updateQueue.length === 0) {
        setTimeout(() => this.applyUpdate());
      }
      this.updateQueue.push(update);
    }
  }

  applyUpdate() {
    const action = {
      type: 'splice',
      payload: this.updateQueue.map(update => ({
        path: stringPath(update.path),
        start: update.start,
        deleteCount: update.deleteCount,
        item: update.items[0],
      })),
    };

    // 通过setData通知渲染进程
    this.context.setData({ action });
    this.updateQueue = [];
  }
}
```

逻辑还是比较清楚的，即将需要更新的节点(包含节点路径、节点信息)推入更新队列，然后触发`setData`通知到渲染进程。

渲染进程侧，则需要通过`WXS`机制，相对应地将`更新指令`恢复到`渲染树`中：

```js
// 渲染树
var tree = {
  root: {
    children: [],
  },
};

// 将指令应用到渲染树
function reduce(action) {
  switch (action.type) {
    case 'splice':
      for (var i = 0; i < action.payload.length; i += 1) {
        var value = get(tree, action.payload[i].path);
        if (action.payload[i].item) {
          value.splice(
            action.payload[i].start,
            action.payload[i].deleteCount,
            action.payload[i].item
          );
        } else {
          value.splice(action.payload[i].start, action.payload[i].deleteCount);
        }
        set(tree, action.payload[i].path, value);
      }
      return tree;
    default:
      return tree;
  }
}
```

<br>

OK, 接着开始渲染, Remax采用了模板的形式进行渲染:

```xml
<wxs src="../../helper.wxs" module="helper" />
<import src="../../base.wxml"/>
<template is="REMAX_TPL" data="{{tree: helper.reduce(action)}}" />
```

Remax为每个组件类型都生成了一个template，动态递归渲染整颗树:

```xml
<template name="REMAX_TPL">
  <block wx:for="{{tree.root.children}}" wx:key="{{id}}">
    <template is="REMAX_TPL_1_CONTAINER" data="{{i: item}}" />
  </block>
</template>

<wxs module="_h">
  module.exports = {
  v: function(value) {
  return value !== undefined ? value : '';
  }
  };
</wxs>

<!-- 按照层级生成模板 -->
<% for (var i = 1; i <= depth; i++) { %>
<%var id = i; %>
<!-- 生成组件模板 -->
<% for (let component of components) { %>
<%- include('./component.ejs', {
        props: component.props,
        id: component.id,
        templateId: id,
      }) %>
<% } %>
<template name="REMAX_TPL_<%=id%>_plain-text" data="{{i: i}}">
  <block>{{i.text}}</block>
</template>
<!--  把动态选择模板的逻辑放入一个模板内，可以提升性能问题 -->
<template name="REMAX_TPL_<%=id%>_CONTAINER" data="{{i: i}}">
  <template is="{{'REMAX_TPL_<%=id%>_' + i.type}}" data="{{i: i}}" />
</template>
<% } %>
```

限于小程序的渲染机制，以下因素可能会影响渲染的性能:

- 进程IPC。更新指令通过IPC通知到渲染进程，频繁更新可能会影响性能. ReactNative中涉及到Native和JS引擎之间的通信，也是存在这个问题的。所以小程序才有了WXS这些方案，用来处理复杂的视图交互问题，比如动画。未来Remax也需要考虑这个问题
- react-reconciler这一层以及进行了diff，到渲染进程可能需要重复再做一遍？基于template的方案，局部更新是否会导致页面级别重新渲染？

## 总结

本文以Remax为例，科普一个React自定义渲染器是如何运作的。对于Remax，目前还处于开发阶段，很多功能还不完善。至于[性能如何](https://github.com/remaxjs/remax/issues/156)，笔者还不好做评论，可以看官方给出的初步[基准测试](https://github.com/remaxjs/benchmark)。有能力的同学，可以参与代码贡献或者Issue讨论。

<br>

## 扩展阅读

- [Remax - 使用真正的 React 构建小程序](https://zhuanlan.zhihu.com/p/79788488)
- [React Fiber是什么](https://zhuanlan.zhihu.com/p/26027085)
- [Hello World Custom React Renderer - Shailesh - Medium](https://medium.com/@agent_hunt/hello-world-custom-react-renderer-9a95b7cd04bc)
- [⚛️👆 Part 1/3 - Beginners guide to Custom React Renderers. How to build your own renderer from scratch?](https://blog.atulr.com/react-custom-renderer-1/) 这系列文章很棒
- [谜之wxs，uni-app如何用它大幅提升性能](https://zhuanlan.zhihu.com/p/82741561)
- [全新重构，uni-app实现微信端性能翻倍](https://zhuanlan.zhihu.com/p/59787245)
- [浅谈小程序运行机制](https://www.zhihu.com/search?type=content&q=小程序原理)
