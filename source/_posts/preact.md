---
title: '[技术地图] preact'
date: 2019/6/2
categories: 前端
---

React 的缩略, 一窥 React 的基本原理，React 的代码库已经非常庞大，加上 Fiber 重构，很容易陷入细节的汪洋大海，这样很容易会让人失去信心。在这里找回一点自信.
关于 React 原理的文章已经很多, 本文老酒装新瓶, 为后面的文章作铺垫

<!-- TOC -->

- [基本的对象](#基本的对象)
  - [从 createElement 开始](#从-createelement-开始)
  - [Component 的实现](#component-的实现)
  - [diff 算法](#diff-算法)
    - [diffChildren](#diffchildren)
    - [diff](#diff)
    - [diffElementNodes](#diffelementnodes)
    - [diffProps](#diffprops)
  - [hooks 的实现](#hooks-的实现)
- [扩展](#扩展)

<!-- /TOC -->

## 基本的对象

我们首先来看一下基本对象的结构，方便我们后面理解程序流程。 Virtual-DOM 其实就是一颗对象树，没有什么特别的，比较核心的是`diff算法`.

你可以想象这里有一个`DOM映射器`，见名知义，这个’DOM 映射器‘的工作就是将 Virtual-DOM 树映射浏览器页面的 DOM，只不过为了提高 DOM 的操作性能，它不是每一次都全量渲染整个 Virtual-DOM 树，它支持接受两颗 Virtual-DOM 对象树(一个更新前，一个更新后), 通过 diff 算法计算出两颗 Virtual-DOM 树差异的地方，然后只应用这些差异的地方到实际的 DOM 树, 从而减少 DOM 变更的成本.

争议， 性能, jquery 精细化 DOM 操作无疑性能会更高一些，怎么用

关键在于开发方式，声明式， 数据驱动，渲染层抽象，开发效率，不需要关心 DOM 的操作细节(属性操作、事件绑定、DOM 节点变更)

![virtual-dom](/images/07/vd.png)

### 从 createElement 开始

我们知道 JSX 不过是一个语法糖，例如`<a href="/"><span>Home</span></a>`最终会转换为`h('a', { href:'/' }, h('span', null, 'Home'))`, h 在 React 下习惯是是`React.createElement`.

```js
export function createElement(type, props, children) {
  props.children = children;

  // 应用默认props
  if (type != null && type.defaultProps != null) {
    for (let i in type.defaultProps) {
      if (props[i] === undefined) props[i] = type.defaultProps[i];
    }
  }

  let ref = props.ref;
  let key = props.key;
  if (ref != null) delete props.ref;
  if (key != null) delete props.key;
  return createVNode(type, props, key, ref);
}

export function createVNode(type, props, key, ref) {
  return {
    type, // 节点的类型，有DOM元素和自定义组件，以及Fragment
    props,
    key,
    ref,
    // ... 忽略部分内置字段
    constructor: undefined,
  };
}
```

### Component 的实现

第二个基本对象是 Component，即组件，组件是一个自定义的元素类型，可以定义组件的外形(props), 有自己的生命周期和状态以及方法, 可以构造出 Virtual-DOM, 实现分治。

自定义组件是基于 Component 类实现的, 它可以定义组件生命周期函数和状态

```js
export function Component(props, context) {
  this.props = props;
  this.context = context;
}

// setState实现
Component.prototype.setState = function(update, callback) {
  // 克隆和放置下一次渲染的State
  let s =
    (this._nextState !== this.state && this._nextState) ||
    (this._nextState = assign({}, this.state));

  // 通过update函数更新
  if (typeof update !== 'function' || (update = update(s, this.props))) {
    assign(s, update);
  }

  if (this._vnode) {
    // 推入渲染回调队列, 在渲染完成后调用
    if (callback) this._renderCallbacks.push(callback);
    // 放入异步调度队列
    enqueueRender(this);
  }
};
```

enqueueRender 将组件放进一个异步的批执行队列中，这样可以归并频繁的 setState 调用，另外有利于批量操作 DOM，实现也非常简单:

```js
let q = [];
// 异步调度器，用于异步执行一个回调
const defer =
  typeof Promise == 'function'
    ? Promise.prototype.then.bind(Promise.resolve()) // micro task
    : setTimeout; // 回调到setTimeout

function enqueueRender(c) {
  // 不需要重复推入已经在队列的Component
  if (!c._dirty && (c._dirty = true) && q.push(c) === 1) {
    defer(process);
  }
}

// 批量清空队列, 调用Component的forceUpdate
function process() {
  let p;
  // 排序队列，从低层的组件优先更新?
  q.sort((a, b) => b._depth - a._depth);
  while ((p = q.pop())) {
    if (p._dirty) p.forceUpdate(false); // false表示不要强制更新，即不要忽略shouldComponentUpdate
  }
}
```

Ok, 上面的代码可以看出 setState 本质上是调用 forceUpdate 进行组件重新渲染的，来看看 forceUpdate 的实现:

```js
// callback放置渲染完成后的回调
Component.prototype.forceUpdate = function(callback) {
  let vnode = this._vnode,
    dom = this._vnode._dom,
    parentDom = this._parentDom;

  // 已挂载过
  if (parentDom) {
    const force = callback !== false;

    let mounts = [];
    // 调用diff对当前组件进行重新渲染和VirtualDOM比对
    // 暂且忽略这些参数
    dom = diff(
      parentDom,
      vnode,
      vnode,
      this._context,
      parentDom.ownerSVGElement !== undefined,
      null,
      mounts,
      this._ancestorComponent,
      force,
      dom,
    );
    if (dom != null && dom.parentNode !== parentDom) {
      parentDom.appendChild(dom);
    }
    commitRoot(mounts, vnode);
  }
  if (callback) callback();
};
```

render 方法

### diff 算法

React 将这个过程称为 reconciliation
differantiate,
preact 的实现将 diff 和 DOM 杂糅在一起

在深入查看 diff 程序之前，先看一下基本的对象类型

就是构造一颗 VNode 节点树，然后映射到 DOM。我们先来看下 VNode 的外形:

```js
type ComponentFactory<P> = preact.ComponentClass<P> | FunctionalComponent<P>;

interface VNode<P = {}> {
  // 节点类型, 内置DOM元素为string类型，而自定义组件则是Component类型，preact中函数组件只是特殊的Component类型
  type: string | ComponentFactory<P> | null;
  props: P & { children: ComponentChildren } | string | number | null;
  key: Key
  ref: Ref<any> | null;

  /**
   * 内部缓存信息
   */
  // 子节点
  _children: Array<VNode> | null;
  // 关联的DOM节点, 对于Fragment来说第一个子节点
  _dom: PreactElement | Text | null;
  // Fragment, 或者组件返回Fragment的最后一个DOM子节点，
  _lastDomChild: PreactElement | Text | null;
  // Component实例
  _component: Component | null;
}
```

```tsx
export interface Component<P = {}, S = {}> extends StaticLifecycle<P, S> {
  constructor: preact.ComponentType<P>;
  state: S;
  // 指向渲染结果的根VNode
  base?: PreactElement;

  /**
   * 内部状态
   */
  _dirty: boolean;
  // 放置渲染回调, 比如setState传入的回调函数. 在组件挂载或更新后会批量执行这些回调
  _renderCallbacks: Array<() => void>;
  _context?: any;
  // 当前关联的VNode对象
  _vnode?: VNode<P> | null;
  _nextState?: S | null;
  _depth?: number;
  // 指向父DOM。用于Fragment或返回数组的组件
  _parentDom?: PreactElement | null;
  _prevVNode?: VNode | null;
  // 直接父组件，即渲染当前组件实例的父Component
  _ancestorComponent?: Component<any, any>;
  _processingException?: Component<any, any> | null;
  _pendingError?: Component<any, any> | null;
}
```

preact 目录页非常清晰
diff 算法的构成
![]diff 结构图

#### diffChildren

先从最简单的开始, diffChildren

> 注意：代码有所简化，忽略掉 svg、replaceNode、context 等特性

<!-- prettier-ignore-start -->
```jsx
export function diffChildren(
  parentDom,      // children的父DOM元素
  newParentVNode, // children的新父VNode
  oldParentVNode, // children的旧父VNode，diffChildren主要比对这两个Vnode的children
  mounts,         // 保存在这次比对过程中被挂载的组件实例，在比对后，会触发这些组件的componentDidMount生命周期函数
  ancestorComponent, // children的直接父'组件', 即渲染(render)VNode的组件实例
  oldDom,         // 当前挂载的DOM，对于diffChildren来说，oldDom一开始指向第一个子节点
) {
  let childVNode, i, j, oldVNode, newDom, sibDom;
  let newChildren = newParentVNode._children || toChildArray(newParentVNode.props.children, (newParentVNode._children = []), coerceToVNode, true,);
  let oldChildren = (oldParentVNode && oldParentVNode._children) || EMPTY_ARR;
  // ...

  // ⚛️遍历新children
  for (i = 0; i < newChildren.length; i++) {
    childVNode = newChildren[i] = coerceToVNode(newChildren[i]); // 规范化VNode
    if (childVNode == null) continue

    // ⚛️查找oldChildren中是否有对应的元素，如果找到则通过设置为undefined，从oldChildren中移除
    // 如果没有找到则保持为null
    oldVNode = oldChildren[i];
    for (j = 0; j < oldChildrenLength; j++) {
      oldVNode = oldChildren[j];
      if (
        oldVNode &&
        childVNode.key == oldVNode.key &&
        childVNode.type === oldVNode.type
      ) {
        oldChildren[j] = undefined;
        break;
      }
      oldVNode = null; // 没有找到任何旧node，表示是一个新的
    }

    // ⚛️ 递归比对VNode, 应用旧元素到新元素. 暂时还没append到DOM
    newDom = diff(parentDom, childVNode, oldVNode, mounts, ancestorComponent, null, oldDom);

    // vnode没有被diff卸载掉
    if (newDom != null) {
      if (childVNode._lastDomChild != null) {
        // ⚛️当前VNode是Fragment类型
        // 只有Fragment或组件返回Fragment的Vnode会有非null的_lastDomChild, 从Fragment的结尾的DOM树开始比对:
        // <A>                               <A>
        //  <>                                 <>   👈 Fragment类型，diff会递归比对它的children，所以最后我们只需要将newDom指向比对后的最后一个子节点即可
        //    <a>a</a>           <- diff ->      <b>b</b>
        //    <b>b</b>                           <a>a</a> ----+
        //  </>                                </>             \
        //                                     <div>x</div>     👈oldDom会指向这里
        // </A>                              </A>
        newDom = childVNode._lastDomChild;
      } else if (oldVNode == null || newDom != oldDom || newDom.parentNode == null) {
        // ⚛️ newDom和当前oldDom不匹配，尝试新增或修改位置
        outer: if (oldDom == null || oldDom.parentNode !== parentDom) {
          // ⚛️oldDom指向了结尾, 即后面没有更多元素了，直接插入即可
          // 一般首次渲染会调用到这里
          parentDom.appendChild(newDom);
        } else {
          // 这里是一个优化措施，去掉也不会影响正常程序. 为了便于理解可以忽略这段代码
          // 这段代码可以减少insertBefore的调用频率
          for (
            sibDom = oldDom, j = 0;
            (sibDom = sibDom.nextSibling) && j < oldChildrenLength;
            j += 2
          ) {
            if (sibDom == newDom) {
              break outer;
            }
          }

          // ⚛️insertBefore() 将newDom移动到oldDom之前 
          parentDom.insertBefore(newDom, oldDom);
        }
      }
      // ⚛️其他情况，newDom === oldDOM不需要处理

      // ⚛️ oldDom指向下一个DOM节点
      oldDom = newDom.nextSibling;
    }
  }

  // ⚛️ 卸载掉没有被置为undefined的元素
  for (i = oldChildrenLength; i--; ) {
    if (oldChildren[i] != null) unmount(oldChildren[i], ancestorComponent);
  }
}
```
<!-- prettier-ignore-end -->

![] 配图理解

#### diff

diff 用于比对单个 VNode 节点, diff 函数比较冗长, 但是这里面并没有特别复杂逻辑，主要是一些自定义组件生命周期的处理。所以先上流程图，代码不感兴趣可以跳过

```jsx
export function diff(
  parentDom, // 父DOM节点
  newVNode, // 新Vnode
  oldVNode,
  mounts, // 存放已挂载的组件
  ancestorComponent, // 直接父组件
  force, // 是否强制更新, 为true将忽略掉shouldComponentUpdate
  oldDom, // 当前挂载的DOM节点
) {
  // 两个节点不匹配，移除掉旧节点
  if (
    oldVNode == null ||
    newVNode == null ||
    oldVNode.type !== newVNode.type ||
    oldVNode.key !== newVNode.key
  ) {
    if (oldVNode != null) unmount(oldVNode, ancestorComponent);
    if (newVNode == null) return null;
    oldVNode = EMPTY_OBJ;
  }
  //...
  try {
    outer: if (oldVNode.type === Fragment || newType === Fragment) {
      // ⚛️ Fragment类型，使用diffChildren进行比对
      diffChildren(
        parentDom,
        newVNode,
        oldVNode,
        mounts,
        ancestorComponent,
        oldDom,
      );

      // ⚛️记录Fragment的起始DOM和结束DOM
      let i = newVNode._children.length;
      if (i && (tmp = newVNode._children[0]) != null) {
        newVNode._dom = tmp._dom;
        while (i--) {
          tmp = newVNode._children[i];
          if (
            (newVNode._lastDomChild = tmp && (tmp._lastDomChild || tmp._dom))
          ) {
            break;
          }
        }
      }
    } else if (typeof newType === 'function') {
      // ⚛️自定义组件类型
      if (oldVNode._component) {
        // ⚛️ ️已经存在组件实例
        c = newVNode._component = oldVNode._component;
        newVNode._dom = oldVNode._dom;
      } else {
        // ⚛️初始化组件实例
        if (newType.prototype && newType.prototype.render) {
          // ⚛️类组件
          newVNode._component = c = new newType(newVNode.props, cctx); // eslint-disable-line new-cap
        } else {
          // ⚛️函数组件
          newVNode._component = c = new Component(newVNode.props, cctx);
          c.constructor = newType;
          c.render = doRender;
        }
        c._ancestorComponent = ancestorComponent;
        c.props = newVNode.props;
        if (!c.state) c.state = {};
        isNew = c._dirty = true;
        c._renderCallbacks = [];
      }

      c._vnode = newVNode;

      if (c._nextState == null) {
        c._nextState = c.state;
      }

      // ⚛️getDerivedStateFromProps 生命周期方法
      if (newType.getDerivedStateFromProps != null) {
        assign(
          c._nextState == c.state
            ? (c._nextState = assign({}, c._nextState)) // 惰性拷贝
            : c._nextState,
          newType.getDerivedStateFromProps(newVNode.props, c._nextState),
        );
      }

      if (isNew) {
        // ⚛️ 调用挂载前的一些生命周期方法
        if (
          newType.getDerivedStateFromProps == null &&
          c.componentWillMount != null
        )
          // ⚛️ componentWillMount
          c.componentWillMount();
        // ⚛️ componentDidMount
        // 将组件推入mounts数组，在整个组件树diff完成后批量调用, 他们在commitRoot方法中被调用
        // 按照先进后出(栈)的顺序调用, 即子组件的componentDidMount会先调用
        if (c.componentDidMount != null) mounts.push(c);
      } else {
        // ⚛️ 调用重新渲染相关的一些生命周期方法
        // ⚛️ componentWillReceiveProps
        if (
          newType.getDerivedStateFromProps == null &&
          force == null &&
          c.componentWillReceiveProps != null
        ) {
          c.componentWillReceiveProps(newVNode.props, cctx);
        }

        // ⚛️ shouldComponentUpdate
        if (
          !force &&
          c.shouldComponentUpdate != null &&
          c.shouldComponentUpdate(newVNode.props, c._nextState, cctx) === false
        ) {
          // shouldComponentUpdate返回false，取消渲染更新
          c.props = newVNode.props;
          c.state = c._nextState;
          c._dirty = false;
          newVNode._lastDomChild = oldVNode._lastDomChild;
          break outer;
        }

        // ⚛️ componentWillUpdate
        if (c.componentWillUpdate != null) {
          c.componentWillUpdate(newVNode.props, c._nextState, cctx);
        }
      }

      // ⚛️至此props和state已经确定下来，缓存和更新props和state准备渲染
      oldProps = c.props;
      oldState = c.state;
      c.props = newVNode.props;
      c.state = c._nextState;
      let prev = c._prevVNode || null;
      c._dirty = false;

      // ⚛️渲染
      let vnode = (c._prevVNode = coerceToVNode(c.render(c.props, c.state)));

      // ⚛️getSnapshotBeforeUpdate
      if (!isNew && c.getSnapshotBeforeUpdate != null) {
        snapshot = c.getSnapshotBeforeUpdate(oldProps, oldState);
      }

      // ⚛️组件层级，会影响更新的优先级
      c._depth = ancestorComponent ? (ancestorComponent._depth || 0) + 1 : 0;
      // ⚛️递归diff渲染结果
      c.base = newVNode._dom = diff(
        parentDom,
        vnode,
        prev,
        mounts,
        c,
        null,
        oldDom,
      );

      if (vnode != null) {
        newVNode._lastDomChild = vnode._lastDomChild;
      }
      c._parentDom = parentDom;
      // ⚛️应用ref
      if ((tmp = newVNode.ref)) applyRef(tmp, c, ancestorComponent);
      // ⚛️调用renderCallbacks，即setState的回调
      while ((tmp = c._renderCallbacks.pop())) tmp.call(c);

      // ⚛️componentDidUpdate
      if (!isNew && oldProps != null && c.componentDidUpdate != null) {
        c.componentDidUpdate(oldProps, oldState, snapshot);
      }
    } else {
      // ⚛️比对两个DOM元素
      newVNode._dom = diffElementNodes(
        oldVNode._dom,
        newVNode,
        oldVNode,
        mounts,
        ancestorComponent,
      );

      if ((tmp = newVNode.ref) && oldVNode.ref !== tmp) {
        applyRef(tmp, newVNode._dom, ancestorComponent);
      }
    }
  } catch (e) {
    // ⚛️捕获渲染错误，传递给上级组件的didCatch生命周期方法
    catchErrorInComponent(e, ancestorComponent);
  }

  return newVNode._dom;
}
```

#### diffElementNodes

比对两个 DOM 元素

```js
function diffElementNodes(dom, newVNode, oldVNode, mounts, ancestorComponent) {
  // ...
  // ⚛️创建DOM节点
  if (dom == null) {
    if (newVNode.type === null) {
      // ⚛️文本节点, 没有属性和子级，直接返回
      return document.createTextNode(newProps);
    }
    dom = document.createElement(newVNode.type);
  }

  if (newVNode.type === null) {
    // ⚛️文本节点更新
    if (oldProps !== newProps) {
      dom.data = newProps;
    }
  } else {
    if (newVNode !== oldVNode) {
      // newVNode !== oldVNode 这说明是一个静态节点
      let oldProps = oldVNode.props || EMPTY_OBJ;
      let newProps = newVNode.props;

      // ⚛️ dangerouslySetInnerHTML处理
      let oldHtml = oldProps.dangerouslySetInnerHTML;
      let newHtml = newProps.dangerouslySetInnerHTML;
      if (newHtml || oldHtml) {
        if (!newHtml || !oldHtml || newHtml.__html != oldHtml.__html) {
          dom.innerHTML = (newHtml && newHtml.__html) || '';
        }
      }
      // ⚛️递归比对子元素
      diffChildren(
        dom,
        newVNode,
        oldVNode,
        context,
        mounts,
        ancestorComponent,
        EMPTY_OBJ,
      );
      // ⚛️递归比对DOM属性
      diffProps(dom, newProps, oldProps, isSvg);
    }
  }

  return dom;
}
```

#### diffProps

```jsx
export function diffProps(dom, newProps, oldProps, isSvg) {
  let i;
  const keys = Object.keys(newProps).sort();
  // ⚛️比较并设置属性
  for (i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (
      k !== 'children' &&
      k !== 'key' &&
      (!oldProps ||
        (k === 'value' || k === 'checked' ? dom : oldProps)[k] !== newProps[k])
    ) {
      setProperty(dom, k, newProps[k], oldProps[k], isSvg);
    }
  }

  // ⚛️清空属性
  for (i in oldProps) {
    if (i !== 'children' && i !== 'key' && !(i in newProps)) {
      setProperty(dom, i, null, oldProps[i], isSvg);
    }
  }
}
```

diffProps 实现比较简单，就是遍历一下属性有没有变动，有变动则通过 setProperty 设置属性。对于失效的 props 也会通过 setProperty 清空。这里面相对比较复杂的是 setProperty. 这里涉及到事件的处理:

```js
function setProperty(dom, name, value, oldValue, isSvg) {
  if (name === 'style') {
    // ⚛️样式设置
    const set = assign(assign({}, oldValue), value);
    for (let i in set) {
      // 样式属性没有变动
      if ((value || EMPTY_OBJ)[i] === (oldValue || EMPTY_OBJ)[i]) continue;
      dom.style.setProperty(
        i[0] === '-' && i[1] === '-' ? i : i.replace(CAMEL_REG, '-$&'),
        value && i in value
          ? typeof set[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false
            ? set[i] + 'px'
            : set[i]
          : '', // 清空
      );
    }
  } else if (name[0] === 'o' && name[1] === 'n') {
    // ⚛️事件绑定
    let useCapture = name !== (name = name.replace(/Capture$/, ''));
    let nameLower = name.toLowerCase();
    name = (nameLower in dom ? nameLower : name).slice(2);
    if (value) {
      // ⚛️首次添加事件, 注意这里是eventProxy为事件处理器
      // preact统一将所有事件处理器收集在dom._listeners对象中，统一进行分发
      // function eventProxy(e) {
      //   return this._listeners[e.type](options.event ? options.event(e) : e);
      // }
      if (!oldValue) dom.addEventListener(name, eventProxy, useCapture);
    } else {
      // 移除事件
      dom.removeEventListener(name, eventProxy, useCapture);
    }
    // 保存事件队列
    (dom._listeners || (dom._listeners = {}))[name] = value;
  } else if (name !== 'list' && name !== 'tagName' && name in dom) {
    // ⚛️DOM对象属性
    dom[name] = value == null ? '' : value;
  } else if (
    typeof value !== 'function' &&
    name !== 'dangerouslySetInnerHTML'
  ) {
    // ⚛️DOM元素属性
    if (value == null || value === false) {
      dom.removeAttribute(name);
    } else {
      dom.setAttribute(name, value);
    }
  }
}
```

ok 支持 Diff 算法介绍完毕，其实这里面的逻辑并不是特别复杂, 当然 preact 是一个极度精简的框架，react 复杂度要高得多，尤其 React Fiber 重构之后。你也可以把 preact 当做 react 的历史回顾，有兴趣再深入了解 React 的最新架构。

### hooks 的实现

[React hooks: not magic, just arrays](https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e)这篇文章已经揭示了 hooks 不过是基于数组实现。preact 也实现了 hooks 机制，让我们来体会体会.

hooks 功能本身是没有集成在 preact 代码库内部的，而是通过`preact/hooks`导入

```jsx
import { h } from 'preact';
import { useEffect } from 'preact/hooks';
function Foo() {
  useEffect(() => {
    console.log('mounted');
  }, []);
  return <div>hello hooks</div>;
}
```

preact 提供了`options`对象对 preact 进行扩展，options 类似于生命周期钩子，在 diff 过程中被调用(为了行文简洁，上面的代码我忽略掉了)。例如:

```jsx
export function diff(/*...*/) {
  // ...
  if ((tmp = options.diff)) tmp(newVNode);

  try {
    outer: if (oldVNode.type === Fragment || newType === Fragment) {
      // Fragment diff
    } else if (typeof newType === 'function') {
      // 自定义组件diff
      // start render
      if ((tmp = options.render)) tmp(newVNode);
      try {
        // ..
        c.render(c.props, c.state, c.context),
      } catch (e) {
        if ((tmp = options.catchRender) && tmp(e, c)) return;
        throw e;
      }
    } else {
      // DOM element diff
    }
    if ((tmp = options.diffed)) tmp(newVNode);
  } catch (e) {
    catchErrorInComponent(e, ancestorComponent);
  }
  return newVNode._dom;
}
// ...
```

先从 useState 开始:

```js
export function useState(initialState) {
  // ⚛️OK只是数组，没有Magic，每个hooks都会递增currenIndex, 从当前组件中取出状态
  const hookState = getHookState(currentIndex++);
  if (!hookState._component) {
    // ⚛️ 初始化
    hookState._component = currentComponent; // 当前组件实例
    hookState._value = [
      // ⚛️state
      typeof initialState === 'function' ? initialState() : initialState,
      // ⚛️dispatch
      value => {
        const nextValue = typeof value === 'function' ? value(hookState._value[0]) : value
        if (hookState._value[0] !== nextValue) {
          hookState._value[0] = nextValue;
          // 状态强制更新
          hookState._component.setState({});
        }
      },
    ];
  }

  return hookState._value; // [state, dispatch]
}
```

深入了解`getHookState`

```js
import { options } from 'preact';

let currentIndex;
let currentComponent;

// ⚛️render 钩子, 在组件开始渲染之前调用
// 因为preact是同步递归向下渲染的，而且Javascript是单线程的，所以可以安全地引用当前正在渲染的组件实例
options.render = vnode => {
  currentComponent = vnode._component; // 保存当前正在渲染的组件
  currentIndex = 0; // 开始渲染时index重置为0

  // 暂时忽略，下面讲到useEffect就能理解
  // 清空上次渲染未处理的Effect(useEffect)，只有在快速重新渲染时才会出现这种情况，一般在异步队列中被处理
  if (currentComponent.__hooks) {
    currentComponent.__hooks._pendingEffects = handleEffects(
      currentComponent.__hooks._pendingEffects,
    );
  }
};

// ⚛️no magic!, 只是一个数组, 状态保存在_list数组中
function getHookState(index) {
  const hooks =
    currentComponent.__hooks ||
    (currentComponent.__hooks = {
      _list: [], // 放置状态
      _pendingEffects: [], // 放置待处理的effect，由useEffect保存
      _pendingLayoutEffects: [], // 放置待处理的layoutEffect，有useLayoutEffect保存
    });

  if (index >= hooks._list.length) {
    hooks._list.push({});
  }
  return hooks._list[index];
}
```

再看看 useEffect 和 useLayoutEffect, useEffect 和 useLayouteEffect 只是触发 effect 的时机不一样，useEffect 在完成渲染后触发，而 useLayoutEffect 在 diff 完成后触发:

```js
export function useEffect(callback, args) {
  const state = getHookState(currentIndex++);
  if (argsChanged(state._args, args)) {
    state._value = callback;
    state._args = args;
    currentComponent.__hooks._pendingEffects.push(state); // 推进_pendingEffects队列
    afterPaint(currentComponent);
  }
}

export function useLayoutEffect(callback, args) {
  const state = getHookState(currentIndex++);
  if (argsChanged(state._args, args)) {
    state._value = callback;
    state._args = args;
    currentComponent.__hooks._pendingLayoutEffects.push(state); // 推进_pendingLayoutEffects队列
  }
}
```

看看如何触发 effect:

```js
// 这是一个类似于上面提到的异步队列
afterPaint = component => {
  if (
    !component._afterPaintQueued && // 避免组件重复推入
    (component._afterPaintQueued = true) &&
    afterPaintEffects.push(component) === 1 // 开始调度
  ) {
    requestAnimationFrame(scheduleFlushAfterPaint);
  }
};

function scheduleFlushAfterPaint() {
  setTimeout(flushAfterPaintEffects);
}

function flushAfterPaintEffects() {
  afterPaintEffects.some(component => {
    component._afterPaintQueued = false;
    if (component._parentDom) {
      component.__hooks._pendingEffects = handleEffects(
        component.__hooks._pendingEffects,
      );
    }
  });
  afterPaintEffects = [];
}

function handleEffects(effects) {
  // 先清除后调用effect
  effects.forEach(invokeCleanup);
  effects.forEach(invokeEffect);
  return [];
}

function invokeCleanup(hook) {
  if (hook._cleanup) hook._cleanup();
}

function invokeEffect(hook) {
  const result = hook._value();
  if (typeof result === 'function') hook._cleanup = result;
}
```

再看看如何触发 LayoutEffect:

```js
// 很简单，在diff完成后触发
options.diffed = vnode => {
  const c = vnode._component;
  if (!c) return;
  const hooks = c.__hooks;
  if (hooks) {
    hooks._pendingLayoutEffects = handleEffects(hooks._pendingLayoutEffects);
  }
};
```

👌，hooks基本原理基本了解完毕

## 扩展

- [Preact：Into the void 0（译）](https://juejin.im/entry/59b9284a5188257e6571b9b4)
- [Virtual DOM 的内部工作原理](https://www.w3cplus.com/javascript/the-inner-workings-of-virtual-dom.html)
