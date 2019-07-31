---
title: "再谈React事件机制"
date: 2019/7/29
categories: 前端
---

![](/images/react-event/sample.png)

当我们在组件上定义事件处理器时，React并不会在DOM元素上直接绑定事件处理器，而是定义了一套事件系统，在这个系统上统一进行事件订阅和分发. 例如上面的e就是一个合成事件对象(SyntheticEvent), 而不是原始的DOM事件对象.

## 那为什么要自定义一套事件系统?

如果了解过Preact(笔者之前写过一篇文章[解析Preact的源码](https://juejin.im/post/5cfa29e151882539c33e4f5e))，Preact裁剪了很多React的东西，其中就是事件机制，Preact是直接在DOM元素上进行事件绑定的。

在研究一个事物之前，我首先要问为什么？了解它的动机，才有利于你对它有本质的认识。

React自定义一套事件系统的动机有以下几个:

- 抹平浏览器之间的兼容性问题。 这是最原始的动机，React根据[W3C 规范](https://www.w3.org/TR/DOM-Level-3-Events/)来定义这些合成事件, 避免了浏览器之间的差异。
- 抽象跨平台事件机制。如果VirtualDOM抽象了平台之间的UI节点，那么对应了React的合成事件机制就是为了抽象跨平台的事件机制。
- 自定义事件。 如onchange，select，input这些组件都 更好用
- React打算做更多优化。比如利用事件委托机制，大部分事件最终绑定到了document，而不是DOM节点本身，这样简化了DOM原生事件，减少了内存开销.
- React打算干预事件的分发。v16引入Fiber架构、以及后面的Concurrent Mode，React为了优化用户的交互体验，会干预事件的分发。不同类型的事件有不同的优先级，比如高优先级的事件可以中断渲染，让代码可以及时响应用户交互。

Ok, 后面我们会深入了解React的事件实现，我会尽量不贴代码，用流程图说话。

<br>

## 基本概念

**整体的架构**

![](/images/react-event/st.png)

- **ReactEventListener** - 事件处理器，在这里进行事件处理器的绑定。当DOM触发事件时，会从这里开始调度分发到React组件树
- **ReactEventEmitter** - 暴露接口给React组件层用于事件订阅
- **EventPluginHub** - 如其名，这是一个‘插件插槽’，负责管理和注册各种插件。在事件分发时，调用插件来生成合成事件
- **Plugin** - React事件系统使用了插件机制来管理不同行为的事件。这些插件会处理自己感兴趣的事件类型，并生成合成事件对象。目前ReactDOM有以下几种插件类型
  - **SimpleEventPlugin** - 简单事件, 处理一些比较通用的事件类型，例如click、input、keyDown、mouseOver、mouseOut、pointerOver、pointerOut
  - **EnterLeaveEventPlugin**
  - **ChangeEventPlugin**
  - **SelectEventPlugin**
  - **BeforeInputEventPlugin**
- **EventPropagators** 按照DOM事件传播的两个阶段，遍历React组件树，并收集所有事件处理器
- **EventBatching** 负责批量执行事件队列和事件处理器，处理事件冒泡。
- **SyntheticEvent** 这是‘合成’事件的基类，可以对应DOM的Event对象。只不过React为了减低内存损耗和垃圾回收，使用一个对象池来构建和释放事件对象， 也就是说SyntheticEvent不能用于异步引用，他在同步执行完事件处理器后就会被释放。
  
  SyntheticEvent也有子类， 和DOM事件类型一一匹配

  - SyntheticAnimationEvent
  - SyntheticClipboardEvent
  - SyntheticCompositionEvent
  - SyntheticDragEvent
  - SyntheticFocusEvent
  - SyntheticInputEvent
  - SyntheticKeyboardEvent
  - SyntheticMouseEvent
  - SyntheticPointerEvent
  - SyntheticTouchEvent
  - ....

  

**事件分类与优先级**

和Fiber优先级有关系

基本架构

<br>

## 实现细节

事件是如何绑定的？

事件是如何分发的？

事件处理器怎么释放

ResponderSystem