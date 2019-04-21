---
title: Rx建模入门
date: 2019/4/19
categories: 前端
---

本文介绍如何使用 Rx 的响应式编程思维来对业务逻辑进行建模, 你会了解到响应式编程的优势和业务抽象能力, 学会将现有的业务流程以数据流的方式表达出来. 你的工具库中不能少了 Rx 这件利器.

Rx 学习曲线陡峭是总所周知的, 我们接触的大部分编程语言或框架都是面向对象的. 在面对 Rx 这响应式编程的方式, 会觉得无从入手,
笔者也是 Rx 的初学者, 拜读过多次[徐飞](https://www.zhihu.com/people/sharpmaster/posts)Rx 的相关文章, 基本上都是云里雾里. 主要原因还是思维没有转换过来.

如果你不理解响应式编程的奥妙，是很难在**'面向场景编程'**时考虑到 Rx 的优势. 笔者一般遵循'面向场景编程', 即在对应的场景考虑不同的技术或框架. 可能是痛点还没有到难以忍受的地步，或许是现有应用还不够复杂，我目前为止还没接触到必须要应用 Rx 的场景.

我觉得应该反过来，采取刻意学习的方式来学习 Rx, 以流的方式来思考，再将其放在现有的场景中看是否有更简洁的解决方案或化学反应.
不得不说写 Rx 是一个比较有趣的事情。 但也要认识到 Rx 不是万金油，正如很多教程所说的 Rx 擅长复杂的异步协调，并不是所有场景都适合，一些问题有更简洁的解决方案

<br/>

## Rx 的建模过程

对于 Rx 的入门者, 可以使用下面的流程, 一步一步将业务逻辑转换为 Rx 数据流来进行表达.

```shell
流程图 -> 数据流抽象 -> 实现
```

### `① 流程图`

首先从流程图开始, 这个阶段没什么特别的, 不管是响应式编程还是其他范式, 编码之前都需要缕清业务逻辑.

这个阶段使用`流程图`来描述技术无关的事务过程, 让业务逻辑更加清晰, 也方便我们识别业务流程的主体和关键事件.

> 什么是业务逻辑? [wiki](https://en.wikipedia.org/wiki/Business_logic) 上这样定义:
> **Business logic** or domain logic is that part of the program which encodes the real-world business rules that determine how data can be created, displayed, stored, and changed. It prescribes how business objects interact with one another, and enforces the routes and the methods by which business objects are accessed and updated.
> <br/> **Business Rules** describe the operations, definitions and constraints that apply to an organization. The operations collectively form a process; every business uses these processes to form systems that get things done.

<br/>
<br/>

### `② 数据流抽象`

Rx 的世界里面*一切皆流*, 换句话说就是**面向流编程**. 和*面向对象编程*把现实世界的实体抽象为对象一样. 响应式编程将业务中的*变动实体*(_想不到更好的词, 或者变量?_)抽象为流

**(1)首先需要识别什么是*变动实体***? 变动实体一般是数据流的源头, 它驱动着业务走向. 像河流一样, 源头可能不只一个. 我认为变动实体至少具备以下特征之一:

- 它是变动的. 例如鼠标的位置, 商品的价格, 随着时间的迁移状态会进行变动
- 它是业务的'输入'. 变动实体是一个系统的输入(外部事件)或者是另一个流(衍生)的输入.
- 它是业务的参与者(或者说业务的主体).
- 它表示业务的状态. 例如一个 todo 列表, 这是一个纯状态的流

**(2)接着识别*变动实体*之间的关系**. 主体之间的关系也就是流之间的关系, 这是 Rx 建模的核心. 只有理解了主体之间的关系, 才能将主体与业务流程串联起来, 才能真正地使用数据流的方式将业务表达出来. 在[重新理解响应式编程](https://www.jianshu.com/p/c95e29854cb1)一文中对'响应式编程'的定义和笔者的理解非常契合:

> 响应式编程是一种通过异步和数据流来构建事务关系的编程模型 . 事务关系是响应式编程的核心理念, “数据流”和“异步”是实现这个核心理念的关键.

这种关系和面向对象的类关系是不一样的, 面向对象的关系一般是指依赖关系. 而**数据流之间关系, 是业务之间的实际关系**, 比如流程 b 依赖流程 a, 数据流是变动实体之间的沟通桥梁.

一般以下面的方法来构建流之间的关系:

- 分治: 将业务划分为多个模块(流), 一个大的流总是由小的流组成, 小的流职责更单一, 更容易理解和测试
- 变换: 将流映射为另外一个流. 一般用于状态变更或业务衍生(高阶流变换)
- 合并: 像河流一样, 数据流最终是需要汇聚在一起注入大海的. 拆分和合并的方式都是依赖于所要表达的业务逻辑

总的来说变动实体一般就是业务的'**输入**', 我们首先把它们确定为流, 再根据关系衍生出其他流(**输出**). 对于流本身来说, **本质上只有输入和输出的关系**:

![stream](/images/03/stream.png)

例如 increment$和decrement$就是 action$的输入, action$就是 count$的输入, 以此类推. **响应式编程将复杂业务关系转换成原始的输出/输出关系**

**(3)符合函数式编程的约束**. 一般来说, 我们说的响应式编程指的是`函数式响应式编程(Functional reactive programming FRP)`, 所以需要符合函数式的一些约束:

- `纯函数(Pure)`: 函数只是输入参数到输出结果的映射, 不要产生副作用
  - 没有共享状态: 不依赖外部变量来维护流程的状态.
  - 幂等性: 幂等性在复杂流程中很重要, 这使得整个流程可被重试
  - 没有副作用: 可预测, 可测试.
- `不可变性(Immuatability)`: 数据一旦产生, 就肯定它的值不会变化, 这有利于代码的理解. 易于并发
- `声明式(Declarative)`:
  - 函数式编程和命令式编程相比有较高的抽象级别, 他可以让你专注于定义与事件相互依存的业务逻辑, 而不是在实现细节上. 换句话说, 函数式编程定义关系, 而命令式编程定义步骤
  - 集中的逻辑. Rx 自然而然在一处定义逻辑, 避免其他范式逻辑分散在代码库的各个地方. 另外 Rx 的 Observable 通过订阅来创建资源, 通过取消订阅来释放资源, 一般开发几乎不需要去关心资源的生命周期, 例如时间器.

这个阶段将第一个阶段的流程图转换为 Rx `弹珠图(Marble Diagrams)`表示, 弹珠图可以描述流之间关系, 表现'时间'的流逝, 让复杂的数据流更容易理解

<br/>
<br/>

### `③ 实现`

这个阶段就是把弹珠图翻译为实现代码, 根据需求在 rxjs 工具箱中查找合适的操作符. 当缕清了业务逻辑, 使用数据流进行建模后,
代码实现就是一件很简单的事情了.

> 可以配合 Rxjs 官方的[操作符决策树](https://rxjs.dev/operator-decision-tree)选择合适的操作符


<br/>

---

<br/>

下面使用例子来体会 Rx 的编程思维:

## Example 1: c := a + b

这是最简单的实例, 我们期望当 a 和 b 变动时能够响应到 c, 我们按照上述的步骤对这个需求进行建模:

- `流程`:

  ![c=a+b](/images/03/process-02.png)

- `数据流抽象`: 从上可以识别出两个变动的实体 a 和 b, 所以 a 和 b 都可以视作流, 那么 c 就是 a 和 b 衍生出来的流, 表示 a 和 b 的实时加法结果, 使用弹珠图来描述三者的关系:

  ```shell
  a$: ----1------------2---------------
  b$: --2-------4------------6------8------
                \ (a + b) /
  c$: ----3-----5------6-----8------10-----
  ```

- `代码实现`: 由弹珠图可以看出, c$流的输出值就是a$和 b$输出值的实时计算结果, 也就是说c$接收来自 a$和b$ 的最新数据, 输出他们的和.
  另外由原本的两个流合并为单个流, 在 rxjs 工具箱中可以找到`combineLatest`操作符符合该场景. 代码实现如下:

  ```typescript
  const a$ = interval(1000);
  const b$ = interval(500);

  a$.pipe(combineLatest(b$))
    .pipe(map(([a, b]) => a + b))
    .subscribe(sum => console.log(sum));
  ```

<br/>

---

<br/>

## Example 2: 元素拖拽的例子

元素拖拽也是 Rx 的经典例子的的例子. 假设我们需要先移动端和桌面端都支持元素拖拽移动.

`流程图`

![](/images/03/process-01.png)

`数据流抽象`

这里使用分治的方法, 将流程进行一步步拆解, 然后使用弹珠图的形式进行描述.

由上面的流程图可以识别出来, down, move 以及 up 都是`变动实体`, 我们可以将他们视作'流'.

① down/move/up 都是抽象的事件, 在桌面端下是 mousedown/mousemove/mouseup, 移动端下对应的是
touchstart/touchmove/touchend. 我们不区分这些事件, 例如接收到 mousedown 或 touchstart 事件都认为是一个'down'事件. 所以事件监听的数据流如:

```shell
# 1
mousedown$ : ---d----------d--------
touchstart$: -s---s-----------s-----
        \(merge)/
down$      : -s-d-s--------d--s-----
```

move 和 up 事件同理

② 接下来要识别 up$, move$, down$ 三个数据流之间的关系, down 事件触发后我们才会去监听 move 和 up 事件, 也就是说由 down$可以衍生出 move$和 up$流. 在 up 事件触发后整个流程就终止. up$流决定了整个流程的生命周期的结束

使用弹珠图的描述三者的关系如下:

```shell
# 2
down$: -----d-------------------------
             \
up$  :        ----------u|
move$:        -m--m--m---|
```

③ 一个拖拽结束后还可以重新再发起拖拽, 即我们会持续监听 down 事件. 上面的流程还规定如果当前拖拽还未结束,
其他 down 事件应该被忽略, 在移动端下多点触摸是可能导致多个 down 事件触发的.

```shell
# 3
down$: ---d---d--d---------d------    # 中间两个事件因为拖拽未完成被忽略
           \                \
up$:        -----u|          ------u|
move$:      -m-mm-|          m-m-m--|
```

`实现`:

有了弹珠图后, 就是把翻译问题了, 现在就打开 rxjs 的工具箱, 找找有什么合适的工具.

首先是抽象事件的处理. 由#1 可以看出, 这就是一个数据流合并, 这个适合使用`merge`

```typescript
merge(fromEvent(el, 'touchstart'), fromEvent(el, 'mousedown'));
```

down$流的切换可以使用`exhaustMap`操作符, 这个操作符可以将输出值映射为Observable, 最后再使用exhaust操作符对Observable进行合并.
这可以满足我们'当一个拖拽未结束时, 新发起的 down$输出会被忽略, 直到拖拽完结'的需求

```typescript
down$
  .pipe(
    exhaustMap(evt => /* 转换为新的Observable流 */)
```

使用 exhaustMap 来将 down$输出值转换为move$ 流, 并在 up$ 输出后结束, 可以使用`takeUntil`操作符:

```typescript
down$
  .pipe(
    exhaustMap(evt => {
      evt.preventDefault();
      if (evt.type === 'mousedown') {
        // 鼠标控制
        const { clientX, clientY } = evt as MouseEvent;
        return mouseMove$.pipe(
          map(evt => {
            return {
              deltaX: (evt as MouseEvent).clientX - clientX,
              deltaY: (evt as MouseEvent).clientY - clientY,
            };
          }),
          takeUntil(mouseUp$),
        );
      } else {
        // 触摸事件
        const { touches } = evt as TouchEvent;
        const touch = touches[0];
        const { clientX, clientY } = touch;

        const getTouch = (evt: TouchEvent) => {
          const touches = Array.from(evt.changedTouches);
          return touches.find(t => t.identifier === touch.identifier);
        };
        const touchFilter = filter((e: Event) => !!getTouch(e as TouchEvent));

        return touchMove$.pipe(
          touchFilter,
          map(evt => {
            const touch = getTouch(evt as TouchEvent)!;
            return {
              deltaX: touch.clientX - clientX,
              deltaY: touch.clientY - clientY,
            };
          }),
          takeUntil(touchUp$.pipe(touchFilter)),
        );
      }
    }),
  )
  .subscribe(delta => {
    el.style.transform = `translate(${delta.deltaX}px, ${delta.deltaY}px)`;
  });
```

<br/>

---

<br/>

## Example 3: Todos

如果使用 rxjs 来创建 Todos 应用, 首先是`流程图`:

![](/images/03/process-03.png)

`数据流抽象`:

首先识别变动的实体, 变动的实体就是 todos 列表, 所以可以认为 todos 列表就是一个流. 它从 localStorage 中恢复
初始化状态. 由`新增`, `删除`等事件触发状态改变, 这些事件也可以视作流

```shell
add$:      --a-----a------
modify$:   ----m----------
remove$    -------r-------
complete$: ------c----c---
             \(merge)/
update$    --a-m-cra--c--- # 各种事件合并为update$流
              \(reduce)/
todos$:    i-u-u-uuu--u---- # i 为初始化数据, update$的输出将触发重新计算状态
```

todos$流会响应到 view 上, 另一方面需要持久化到本地存储. 也就是说这是一个多播流.

```shell
todos$: i-u-u-uuu--u---- #
          \(debounce)/
save$   i--u--u---u----- # 存储流, 使用debounce来避免频繁存储
```

并行渲染到页面:

```shell
todos$: i-u-u-uuu--u---- #
       \(render)/
dom$:   i--u--u---u----- # dom渲染, 假设也是流(cycle.js就是如此)
```

这个实例的数据流和 Redux 的模型非常像, add$, modify$, remove$和complete$就是 Action, todos 流会使用
类似 Reducer 的机制来处理这些 Action 生成新的 State

![redux](/images/03/redux.png)

`代码实现`:

首先 add$, modify$以及 remove$和complete$可以分别使用一个 Subject 对象来表示, 用于接收外部事件. 其实还可以简化为一个流,
它们的区别只是参数

```typescript
interface Action<T = any> {
  type: string;
  payload: T;
}

const INIT_ACTION = 'INIT'; // 初始化
const ADD_ACTION = 'ADD';
const REMOVE_ACTION = 'REMOVE';
const MODIFY_ACTION = 'MODIFY';
const COMPLETE_ACTION = 'COMPLETE';

const update$ = new Subject<Action>();

function add(value: string) {
  update$.next({
    type: ADD_ACTION,
    payload: value,
  });
}

function remove(id: string) {
  update$.next({
    type: REMOVE_ACTION,
    payload: id,
  });
}

function complete(id: string) {
  update$.next({
    type: COMPLETE_ACTION,
    payload: id,
  });
}

function modify(id: string, value: string) {
  update$.next({
    type: MODIFY_ACTION,
    payload: { id, value },
  });
}
```

创建todos$流, 对update$ 的输出进行 reduce:

```typescript
/**
 * 初始化Store
 */
function initialStore(): Store {
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value ? JSON.parse(value) : { list: [] };
}

const todos$ = update$.pipe(
  // 从INIT_ACTION 触发scan初始化
  startWith({ type: INIT_ACTION } as Action),
  // reducer
  scan<Action, Store>((state, { type, payload }) => {
    return produce(state, draftState => {
      let idx: number;
      switch (type) {
        case ADD_ACTION:
          draftState.list.push({
            id: Date.now().toString(),
            value: payload,
          });
          break;
        case MODIFY_ACTION:
          idx = draftState.list.findIndex(i => i.id === payload.id);
          if (idx !== -1) {
            draftState.list[idx].value = payload.value;
          }
          break;
        case REMOVE_ACTION:
          idx = draftState.list.findIndex(i => i.id === payload);
          if (idx !== -1) {
            draftState.list.splice(idx, 1);
          }
          break;
        case COMPLETE_ACTION:
          idx = draftState.list.findIndex(i => i.id === payload);
          if (idx !== -1) {
            draftState.list[idx].completed = true;
          }
          break;
        default:
      }
    });
  }, initialStore()),
  // 支持多播
  shareReplay(),
);

// 持久化
todos$.pipe(debounceTime(1000)).subscribe(store => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
});
```

> 更多例子: 徐飞在["RxJS 入门指引和初步应用>"](https://github.com/xufei/blog/issues/44)提到了一个"幸福人生"的例子, 挺有意思, 读者可以尝试对其进行建模

<br/>

---

<br/>


经过上述过程, 可以深刻体会到*函数响应式编程*的**优势**:

- **数据流抽象了很多现实问题**. 也就说数据流对业务逻辑的表达能力流程图基本一致. 可以说弹珠图是流程图的直观翻译, 而 Rx 代码则是弹珠图的直观翻译. 使用 Rx 以声明式形式编写代码, 可以让代码更容易理解, 因为它们接近业务流程.
- **把复杂的问题分解成简单的问题的组合**. Rx 编程本质上就是数据流的分治和合并


## 相关资料

- [重新理解响应式编程](https://www.jianshu.com/p/c95e29854cb1)
- [【响应式编程的思维艺术】响应式 Vs 面向对象](https://zhuanlan.zhihu.com/p/53009201)
- [细说业务逻辑](http://www.uml.org.cn/zjjs/201008021.asp)
- [Reactive programming](https://en.wikipedia.org/wiki/Reactive_programming)
- [RxJS 入门指引和初步应用](https://github.com/xufei/blog/issues/44)
