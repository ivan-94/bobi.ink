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

- 抹平浏览器之间的兼容性问题。 这是最原始的动机，React根据[W3C 规范](https://www.w3.org/TR/DOM-Level-3-Events/)来定义这些合成事件, 避免了浏览器之间的差异。 另外React还会试图通过其他相关事件来模拟一些低版本不兼容的事件, 这才是‘合成’的本来意思吧？。
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
  - **EnterLeaveEventPlugin** - mouseEnter/mouseLeave和pointerEnter/pointerLeave这两个事件比较特殊, 和\*over/\*leave事件相比它们不会冒泡。所以无法全局进行订阅，ReactDOM使用\*over/\*out事件来模拟这些\*enter/\*leave。所以当你使用onMouseEnter时会发现他是支持冒泡的。两者的区别可以查看这个[DEMO](TODO:)
  - **ChangeEventPlugin** - change事件是React的一个自定义事件，旨在规范化表单元素的变动事件。

    它支持这些元素: input, textarea, select 

  - **SelectEventPlugin** - 和change事件一样，React为表单元素规范化了select(选择范围变动)事件，适用于input、textarea、contentEditable元素.
  - **BeforeInputEventPlugin** - beforeinput事件以及[composition](https://developer.mozilla.org/zh-CN/docs/Web/Events/compositionstart)事件处理。

  本文主要会关注SimpleEventPlugin的实现，有兴趣的读者可以自己阅读React的源代码.

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

SimplePlugin将事件类型划分成了三类, 对应不同的优先级(优先级由低到高):

- **DiscreteEvent** 离散事件. 例如blur、focus、 click、 submit、 touchStart. 这些事件都是离散触发的
- **UserBlockingEvent** 用户阻塞事件. 例如touchMove、mouseMove、scroll、drag、dragOver等等。这些事件会'阻塞'用户的交互。
- **ContinuousEvent** 可连续事件。例如load、error、loadStart、abort、animationEnd. 这个优先级最高，也就是说它们是同步执行的，这就是Continuous的意义，即可连续的执行，不被打断.

可能要先了解一下React调度(Schedule)的优先级，才能理解这三种事件类型的区别。截止到本文写作时，React有5个优先级级别:

- `Immediate` - 这个优先级的任务会同步执行, 或者说要马上执行且不能中断
- `UserBlocking` 这些任务一般是用户交互的结果, 需要即时得到反馈 .
- `Normal` (5s timeout) 应对哪些不需要立即感受到的任务，例如网络请求
- `Low` (10s timeout) 这些任务可以放后，但是最终应该得到执行. 例如分析通知
- `Idle` (no timeout) 一些没有必要做的任务 (e.g. 比如隐藏的内容).

目前ContinuousEvent对应的是Immediate优先级，而DiscreteEvent和UserBlockingEvent对应的是UserBlocking。

本文不会深入React Fiber架构的细节，有兴趣的读者可以阅读文末的扩展阅读列表.

<br>

## 实现细节

现在开始进入文章整体，React是怎么实现事件机制？主要分为两个部分**绑定**和**分发**.

### 事件是如何绑定的？

为了避免后面绕晕了，有必要先了解一下React事件机制中的插件协议。

每个插件的结构如下:

```ts
export type EventTypes = {[key: string]: DispatchConfig};

export type PluginModule<NativeEvent> = {
  eventTypes: EventTypes,
  extractEvents: (
    topLevelType: TopLevelType,
    targetInst: null | Fiber,
    nativeEvent: NativeEvent,
    nativeEventTarget: EventTarget,
  ) => ?ReactSyntheticEvent,
  tapMoveThreshold?: number,
};
```

**eventTypes**声明该插件负责的事件类型, 它通过`DispatchConfig`来描述:

```ts
export type DispatchConfig = {
  dependencies: Array<TopLevelType>, // 依赖的原生事件，表示关联这些事件的触发. ‘简单事件’一般只有一个，复杂事件如onChange会监听多个, 如下图
  phasedRegistrationNames?: {    // 两阶段props事件注册名称, React会根据这些名称在组件实例中查找对应的props事件处理器
    bubbled: string,             // 冒泡阶段, 如onClick
    captured: string,            // 捕获阶段，如onClickCapture
  },
  registrationName?: string      // props事件注册名称, 比如onMouseEnter这些不支持冒泡的事件类型，只会定义  registrationName，不会定义phasedRegistrationNames
  eventPriority: EventPriority,  // 事件的优先级，上文已经介绍过了
};
```

看一下示例:

![](/images/react-event/dispatch-config.png)

上面列举了三个典型的EventPlugin：

- SimplePlugin: 简单事件最好理解，它们的行为都比较通用，没有什么Trick, 例如不支持事件冒泡、不支持在Document上绑定等等，和原生DOM事件是一一对应的关系，比较好处理.
- EnterLeaveEventPlugin: 从上图可以看出来，mouseEnter和mouseLeave依赖的是mouseout和mouseover事件。也就是说\*Enter/\*Leave事件在React中是通过\*over/\*out事件来模拟的。这样做的好处是可以在document上面进行委托监听，还有避免enter/leave一些奇怪而不实用的行为。
- ChangeEventPlugin: onChange是React的一个自定义事件，可以看出它依赖了多种原生DOM事件类型来模拟onChange事件.

<br>

每个插件还会定义extractEvents方法，这个方法接受事件名称、原生DOM事件对象、事件触发的DOM元素以及React组件实例, 返回一个合成事件对象，如果返回空则表示不作处理. 关于extractEvents的细节，会在下一节阐述.

在ReactDOM启动时就会向EventPluginHub注册这些插件：

```js
EventPluginHubInjection.injectEventPluginsByName({
  SimpleEventPlugin: SimpleEventPlugin,
  EnterLeaveEventPlugin: EnterLeaveEventPlugin,
  ChangeEventPlugin: ChangeEventPlugin,
  SelectEventPlugin: SelectEventPlugin,
  BeforeInputEventPlugin: BeforeInputEventPlugin,
});
```

Ok, 回到正题，事件是怎么绑定的呢？ 打个断点看一下调用栈:

![](/images/react-event/listento.png)

前面关于React树如何更新和渲染就不在本文的范围内了，从上面的调用栈可以看出React在props初始化和更新时会进行事件绑定。这里先看一下流程图，忽略杂乱的跳转：

![](/images/react-event/binding.png)

- 在props初始化和更新时会进行事件绑定。首先React会判断元素是否是媒体类型，媒体类型的事件是无法在Document监听的，所以会直接在元素上进行绑定
- 反之就在Document上绑定. 这里面需要两个信息，一个就是上文提到的'事件依赖列表', 比如onMouseEnter依赖mouseover/mouseout; 第二个是ReactBrowserEventEmitter维护的已订阅事件表。事件处理器只需在Document订阅一次，所以相比在每个元素上订阅事件会节省很多资源. 代码大概如下:

```ts
export function listenTo(
  registrationName: string,           // 注册名称，如onClick
  mountAt: Document | Element | Node, // 组件树容器，一般是Document
): void {
  const listeningSet = getListeningSetForElement(mountAt);             // 已订阅事件表
  const dependencies = registrationNameDependencies[registrationName]; // 事件依赖

  for (let i = 0; i < dependencies.length; i++) {
    const dependency = dependencies[i];
    if (!listeningSet.has(dependency)) {                               // 未订阅
      switch (dependency) {
        // ... 特殊的事件监听处理
        default:
          const isMediaEvent = mediaEventTypes.indexOf(dependency) !== -1;
          if (!isMediaEvent) {
            trapBubbledEvent(dependency, mountAt);                     // 设置事件处理器
          }
          break;
      }
      listeningSet.add(dependency);                                    // 更新已订阅表
    }
  }
}
```

- 接下来就是根据事件的**优先级**和**阶段**(是否是capture)来设置事件处理器:

```ts
function trapEventForPluginEventSystem(
  element: Document | Element | Node,
  topLevelType: DOMTopLevelEventType,
  capture: boolean,
): void {
  let listener;
  switch (getEventPriority(topLevelType)) {
    case DiscreteEvent:
      listener = dispatchDiscreteEvent.bind(
        null,
        topLevelType,
        PLUGIN_EVENT_SYSTEM,
      );
      break;
    case UserBlockingEvent:
      listener = dispatchUserBlockingUpdate.bind(
        null,
        topLevelType,
        PLUGIN_EVENT_SYSTEM,
      );
      break;
    case ContinuousEvent:
    default:
      listener = dispatchEvent.bind(null, topLevelType, PLUGIN_EVENT_SYSTEM);
      break;
  }

  const rawEventName = getRawEventName(topLevelType);
  if (capture) {
    addEventCaptureListener(element, rawEventName, listener);
  } else {
    addEventBubbleListener(element, rawEventName, listener);
  }
}
```


事件绑定有

### 事件是如何分发的？

事件处理器怎么释放

ResponderSystem

## 扩展阅读

- [input事件中文触发多次问题研究](https://segmentfault.com/a/1190000013094932)
- [完全理解React Fiber](http://www.ayqy.net/blog/dive-into-react-fiber/)
- [Lin Clark – A Cartoon Intro to Fiber – React Conf 2017](https://www.youtube.com/watch?v=ZCuYPiUIONs)
- [Scheduling in React](https://philippspiess.com/scheduling-in-react/)