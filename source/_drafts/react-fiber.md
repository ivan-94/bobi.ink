---
title: "换个角度理解 React Fiber"
date: 2019/7/10
categories: 前端
---

这个Flag立了很久，今天终于下定决心好好写一篇关于React Fiber的文章。这篇文章不会展示Fiber的源代码，会以最通俗的方式将它讲透。

Fiber 门槛很高，不理解后续React Killer Feature可能无法理解

科普

一年一度的React Conf

一不小心篇幅有点长，当小说看吧， 最浅显易懂的语言

还没有，目前异步功能在官方React也要到17才支持

伪代码

## 单核进程调度: Fiber 不是一个新的东西

![](/images/react-fiber/dos.jpg)

`DOS`是一个`单任务操作系统`, 也就说同一个时间只允许运行一个程序. [invalid s](https://www.zhihu.com/people/s.invalid)在[《在没有GUI的时代(只有一个文本界面），人们是怎么运行多个程序的？ - invalid s的回答》](https://www.zhihu.com/question/319595914/answer/683541635) 中将其称为**是一种压根没有任务调度的“残疾”操作系统**， 在这种系统中，想执行多个任务，只能等待前一个进程退出，然后再载入一个新的进程。

直到Window 3.x，他才有了真正意义的进程调度器，实现了多进程并发执行。

> 注意并发和并行不是同一个概念。

现代操作系统都是**多任务操作系统**，其中按照CPU核心数来划分，可以分为**单处理器调度**和**多处理器调度**。本文关注的是单处理器调度，因为我们要类比JavaScript的运行机制。

**说白了，为了实现进程的并发，操作系统会按照一定的调度策略，让多个进程都有被执行的机会，将CPU的执行权分配给多个进程，让它们交替执行，形成一种“同时在运行”假象, 因为CPU速度太快，人类根本感觉不到。本质上在单核的物理环境下同时只能有一个程序在运行。**

![](/images/reat-fiber/longzhu.jpg)

这让我想起了“龙珠”中的分身术(小时候看过，说错了别喷)，本质上是一个人，只不过是它运动速度太快，看起来就是分身. 这就是**并发**。

![](/images/reat-fiber/naruto.jpg)

相比火影忍者中的分身术，是物理存在的，他们可以实现同时处理多个任务，这就是**并行**。严格地讲这是`Master-Slave`架构，因为分身虽然物理存在，但应该没有独立的意志。
所以说并行是并发，而并发不一定是并行，两种不能划等号。

扯远了，接下来怎么调度就是教科书的内容了, 如果读者在大学认真学过**操作系统原理**。可以很快理解这几种单处理器进程**调度策略**(我觉随便科普一下，算送的)：

<br>

**0️⃣ 先到先得(First-Come-First-Served, FCFS)**

这是最简单的调度策略, 简单说就是没有调度。即谁先来谁就先执行，执行完毕后就执行下一个。如果中间某些进程因为I/O阻塞了，会挂起移回就绪队列(说白了就是重新排队).

`FCFS` 上面 `DOS` 的单任务操作系统没有太大的区别。也非常好理解，因为生活中到处是这样的例子:。

- FCFS 对`短进程`不利。比如饭堂排队: 在饭堂排队打饭的时候，最烦那些一个人打包好好几份的人，这些人就像`长进程`一样，霸占着CPU资源，后面排队只打一份的人会觉得很吃亏，打一份的人会觉得他们优先级应该更高，毕竟他们花的时间很短，反正你打包那么多份再等一会也是可以的，何必让后面那么多人等这么久...
- FCFS 对`I/O密集`不利。比如去ZF部分办业务，假设CPU一个窗口、I/O一个窗口。在CPU窗口好不容易排到你了，这时候发现一个不符合条件或者漏办了、需要去I/O搞一下，Ok，I/O执行完了，你又得到CPU窗口重新排队。

所以FCFS在单处理器调度中并不受欢迎。

<br>

**1️⃣ 轮转**

这是一种基于时钟的抢占策略，这也是抢占策略中最简单的一种。**即公平地给每一个进程一定的执行时间，当时间消耗完毕或者I/O阻塞，操作系统就会调度其他进程，将执行权抢占过来**。

> 操作系统会按照一定的周期触发时钟中断，在这个中断程序处理中进行抢占/切换进程
> **决策模式**: TODO

这种调度策略的要点是**确定合适的时间片长度**。太长了，进程霸占太久资源，其他进程会得不到响应(等待执行时间过长)，这时候就接近于上述`FCFS`了。太短了也不好，因为进程抢占和切换都是需要成本的、而且成本不低，太短了，时间都浪费在上下文切换上了，导致进程干不了什么实事。

所以说**时间片的长度最好符合大部分进程完成一次典型交互所需的时间**，即符合大部分进程场景折中值。

轮转策略也非常容易理解，只不过时间片长度需要伤点脑筋；另外和`FCFS`一样，轮转策略对I/O进程也不公平。

<br>

**2️⃣ 最短进程优先(Shortest Process Next, SPN)**

上面说了先到先得策略对`短进程`不公平，那么`最短进程优先`索性就让最短的进程优先机制，也就是说按照进程的预估执行时间对进程进行优先级排序，先执行完短进程，后执行长进程。

这样可以让短进程能得到较快的响应。但是怎么得到/评估进程的时间？一是让程序的提供者提供，这不太靠谱；二是有操作系统来收集进程运行数据，并对它们进程统计。比如最简单的是计算它们的平均运行时间。不管怎么说这比上面两者策略要复杂一点。

SPN的缺陷是，如果系统有大量的短进程，那么长进程可能会饥饿得不到响应。另外极端短进程可以得到更多的执行机会，但是因为它不是抢占性策略，所以还是没有解决FCFS的问题(一旦长进程得到CPU资源，得等它执行完)

<br>

**3️⃣ 最短剩余时间(Shortest Remaining Time, SRT)**

**SRT 进一步优化了SPN，增加了抢占机制**。在 SPN 的基础上，当一个进程添加到就绪队列时，操作系统会比较*刚添加的进程*和*当前正在执行的进程*的‘剩余时间’，如果刚添加的进程剩余时间更短，就会进行抢占，夺走CPU控制权。

相比轮转的抢占，SRT没有中断处理的开销。但是在SPN的基础上，操作系统需要记录进程的历史执行时间，这是新增的开销。另外长进程饥饿问题还是没有解决。

<br>

**4️⃣ 最高响应比优先(HRRN)**

为了解决长进程饥饿问题，同时提高进程的响应速率。有一种`最高响应比优先的`策略，首先了解什么是响应比:

```shell
响应比 = （等待执行时间 + 进程执行时间） / 进程执行时间
```

这种策略会选择响应最高的进程优先执行：

- 对于短进程来说，因为执行时间很短，分母很小，所以响应比比较高，会被优先执行
- 对于长进程来说，执行时间长，一开始响应比小，但是随着等待时间增长，它的优先级会越来越高，最终可以被执行

<br>

**5️⃣ 反馈法**

SPN、SRT、HRRN都需要对进程时间进行评估和统计，实现比较复杂且需要一定开销。而反馈法采取的是事后反馈的方式。这种策略下，每个进程一开始都有一样的优先级，每次被抢占(可能是长进程)，优先级就会降低一级。

举个例子: 操作系统会按照优先级划分多个队列:

```shell
队列1
队列2
...
队列N
```

新增的任务会当如队列1，队列1会按照轮转策略以一个时间片为单位进行调度。短进程可以很快得到响应，而对于长进程可能一个时间片处理不完，就会被抢占，放入队列2。

队列2会在队列1任务清空后被执行，有时候低优先级队列可能会等待很久才被执行，所以一般会给予一定的补偿，例如增加执行时间，所以队列2的轮转时间片长度是2。

反馈法仍然可能导致长进程饥饿，所以操作系统可以统计长进程的等待时间，如果等待时间超过一定的阈值，可以提高它们的优先级。

<br>

![](/images/react-fiber/process-schedule.png)

通过上文可以知道，没有一种调度策略是万能的, 它考虑很多因素:

- 响应速率。进程等待被执行的时间
- 公平性。兼顾短进程、长进程、I/O进程

这两者在某些情况下是对立的，提高了响应，可能会减低公平性，导致饥饿。短进程、长进程、I/O进程之间要取得平衡也非常难。

上面这些知识对本文来说已经足够了，现实世界的进程调度算法比教科书上说的要复杂的多，有兴趣读者可以去研究一下 `Linux` 相关的进程调度算法，这方面的资料也非常多, 例如[《Linux进程调度策略的发展和演变》](https://blog.csdn.net/gatieme/article/details/51456569)。

<br>

## 类比浏览器JavaScript执行环境

![](/images/singleroad.jpg)
<i>JavaScript 就像单行道</i>

JavaScript 是单线程运行的，而且在浏览器环境屁事非常多，它要负责页面的绘制、事件处理、JS解析和执行、静态资源处理。它是一个JavaScript，同时只能做一件事情，这个和DOS的单任务操作系统一样的，事情只能一件一件的干。要是前面有一个傻叉程序长期霸占CPU，后面什么事情都干不了，浏览器会呈现卡死的状态，这样用户体验就会非常差

![](/images/react-fiber/perf.png)

所以，React 为什么要引入Fiber架构？ 看看上面火焰图，这是React V15 下面的一个列表渲染资源消耗情况。整个渲染花费了130ms, **🔴在这里面 React 会*递归*比对需要更新的Virtual-DOM树，找出需要变动的节点，然后同步更新它们, 一气呵成。这个过程React称为 Reconcilation**.

在 Reconcilation 区间，React 会霸占着浏览器资源，这会导致用户触发的事件得不到响应，从而影响用户体验。这么说，你可能没办法体会到，通过下面两个图片来体会一下(图片来源于：[《Scheduling in React》](https://philippspiess.com/scheduling-in-react/)):

同步模式:

![](/images/react-fiber/sync-mode.gif)

<br>

优化后的异步模式:

![](/images/react-fiber/concurrent-mode.gif)

<br>

所以React 是怎么优化的？ 划重点， **🔴为了给用户制造一种应用很快的假象，我们不能让一个程序长期霸占着资源. 你可以将浏览器的渲染、布局、绘制、资源加载(例如HTML解析)、事件响应、脚本执行视作操作系统的进程，我们需要通过某些调度策略合理地分配CPU资源，从而提高浏览器的用户响应速率, 同时兼顾任务执行效率**。

**🔴所以 React 通过Fiber 架构，让自己的Reconcilation 过程变成可被中断**。 适时地让出CPU执行权，除了可以让浏览器及时地响应用户的交互，还有其他好处:

- 与其一次性操作大量 DOM 节点, 分批延时，可以得到更好的用户体验。这个在[《「前端进阶」高性能渲染十万条数据(时间分片)》](https://juejin.im/post/5d76f469f265da039a28aff7#heading-1) 以及司徒正美的[《React Fiber架构》](https://zhuanlan.zhihu.com/p/37095662) 都做了相关实验
- 司徒正美在[《React Fiber架构》](https://zhuanlan.zhihu.com/p/37095662) 也提到：**🔴给浏览器一点喘息的机会，他会对代码进行编译优化（JIT）及进行热代码优化，或者对reflow进行修正**.

这就是为什么React 需要 Fiber。

<br>

## 何为 Fiber?

对于 React 来说，Fiber 可以从两个角度理解:

### 1. 一种流程控制原语

Fiber 也称[协程](https://www.liaoxuefeng.com/wiki/897692888725344/923057403198272)、或者纤程。 笔者第一次接触这个概念是在学习Ruby的时候，Ruby就将协程称为 Fiber。后来发现很多语言都有类似的机制，例如Lua 的`Coroutine`, 还有前端开发者比较熟悉的 `ES6` 新增的[`Generator`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Generator)。

**🔴 其实协程和线程并不一样，协程本身是没有并发或者并行能力的（需要配合线程），它只是一种控制流程的让出机制**。要理解协程，你得和普通函数一起来看, 以Generator为例:

> 不要去纠结 [Processes, threads, green threads, protothreads, fibers, coroutines: what's the difference?](https://stackoverflow.com/questions/3324643/processes-threads-green-threads-protothreads-fibers-coroutines-whats-the/16375591#16375591)

普通函数执行的过程中无法**被中断和恢复**：

```js
const tasks = []
function run() {
  let task
  while (task = tasks.shift()) {
    execute(task)
  }
}
```

而 Generator 可以:

```js
const tasks = []
function * run() {
  let task

  while (task = tasks.shift()) {
    // 🔴 判断是否有高优先级事件需要处理
    // 有的话让出控制权
    if (hasHighPriorityEvent()) {
      yield
    }

    // 处理完高优先级事件后，恢复函数调用栈，继续执行...
    execute(task)
  }
}
```

<br>

React Fiber 的思想和协程的概念是契合的: *React 渲染的过程可以被中断，可以将控制权交回浏览器，让位给高优先级的任务，浏览器空闲后再恢复渲染*。

<br>

现在你应该有以下疑问:

- ① 浏览器没有抢占的条件
- ② 无法确定未来的行为，即什么时候让出？
- ③ React 那为什么不使用 Generator？

<br>

**答①: 主动让出机制**

一是浏览器中没有类似进程的概念，’任务‘之间的界限很模糊，没有上下文，不具备中断/恢复的条件。二是没有抢占的机制，我们无法中断一个正在执行的程序。

所以我们只能采用类似协程的控制权让出机制。这个和上文提到的进程调度策略都不同，它有更一个专业的名词：[**合作式调度(Cooperative Scheduling)**](https://juejin.im/post/5d12c907f265da1b6d4033c5#heading-7), 相对应的由**抢占式调度(Preemptive Scheduling)**

**这是一种契约调度，要求我们的程序和浏览器紧密结合，互相信任**。比如由浏览器给我们分配执行时间片(比如通过`requestIdleCallback`实现, 下文会介绍)，我们要按照约定在这个时间内执行完毕，并将控制权还给浏览器。

![](/images/react-fiber/cs.png)

<br>

这种调度方式很有趣，你会发现这是一种身份的对调，以前我们是老爷，想怎么执行就怎么执行，执行多久就执行多久. 现在为了我们共同的用户体验统一了战线。一切听由浏览器指挥调度，这时候我们要跟浏览器申请执行权，而且这个执行权有期限，借了后要按照约定归还给浏览器。当然你超时不还浏览器也拿你没办法 🤷‍..

<br>
<br>

---

**答②: 还是协作式调度**

上面代码示例中的 `hasHighPriorityEvent` 在目前浏览器中是无法实现的，即我们没办法判断当前是否有更高优先级的任务等待被执行。除非你把浏览器`事件循环`中的队列剖出来，且这些任务都表明了自己的优先级。

解决办法还是跟浏览器协商好，React 目前的做法是使用 `requestIdleCallback`：

```ts
window.requestIdleCallback(
  callback: (dealine: IdleDeadline) => void,
  option?: {timeout: number}
  )
```

IdleDeadline的结构如下：

```ts
interface IdleDealine {
  didTimeout: boolean // 表示任务执行是否超过约定时间
  timeRemaining(): DOMHighResTimeStamp // 任务可供执行的剩余时间
}
```

也就是说**`requestIdleCallback`让浏览器'有空'的时候就执行我们的回调，这个回调会传入一个期限，表示回调理想的执行时间, 我们最好在这个时间范围内执行完毕**。

<br>

**那浏览器什么时候有空？**

我们先来看一下浏览器在一帧(Frame，事件循环的一次循环)内可能会做什么事情:

![](/images/react-fiber/perf.png) TODO: 标记

![](/images/react-fiber/frame-life.png)
<i>图片来源: <a href="https://juejin.im/post/5ad71f39f265da239f07e862">你应该知道的requestIdleCallback</a></i>

浏览器在一帧内会依次做下列事情:

- 处理用户输入事件
- Javascript执行
- requestAnimation 调用
- 布局 Layout
- 绘制 Paint

<br>

理想的一帧时间是16ms(1000ms / 60)，如果处理完上述的任务(布局和绘制之后)，还有盈余时间，浏览器就会调用 `requestIdleCallback` 的回调。

![](/images/react-fiber/ric.png)

**但是在浏览器繁忙的时候，可能不会有盈余时间，这时候`requestIdleCallback`回调就得不到执行, 为了避免饿死，可以通过requestIdleCallback的第二个参数指定一个超时时间**。

另外不建议在`requestIdleCallback`中进行`DOM`操作，因为这可能导致样式重新计算或重新布局(比如操作DOM后马上调用 `getBoundingClientRect`)，这可能会消耗一定的时间，从而导致requestIdleCallback超时掉帧。

<br>

目前 `requestIdleCallback` 目前只有Chrome支持。所以目前 React [自己实现了一个](https://github.com/facebook/react/blob/master/packages/scheduler/src/forks/SchedulerHostConfig.default.js)。它利用[`MessageChannel`](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel) 将回调延迟到'绘制操作'之后执行:

![](/images/react-fiber/mc.png)

<br>

```js
const el = document.getElementById('root')
const btn = document.getElementById('btn')
const ch = new MessageChannel()
let pendingCallback
let startTime
let timeout

ch.port2.onmessage = function work()  {
  // 在绘制之后被执行
  if (pendingCallback) {
    const now = performance.now()
    // 通过now - startTime可以计算出requestAnimationFrame到绘制结束的执行时间
    // 通过这些数据来计算剩余时间
    // 另外还要处理超时(timeout)，避免任务被饿死
    // ...
    if (hasRemain && noTimeout) {
      pendingCallback(deadline)
    }
  }
}

// ...

function schedule(callback, timeout) {
  requestAnimationFrame(function animation() {
    // 在绘制之前被执行
    // 记录开始时间
    startTime = performance.now()
    timeout = timeout
    dosomething()
    // 调度回调到绘制结束后执行
    pendingCallback = callback
    ch.port1.postMessage('hello')
  })
}
```

<br>

**任务优先级**

上面说了，为了避免任务被饿死，可以设置一个超时时间. **这个超时时间不是死的，低优先级的可以慢慢等待, 高优先级的任务应该率先被执行**. 目前 React 预定义了 5 个优先级, 这个我在[《谈谈React事件机制和未来(react-events)》]中也介绍过:

- `Immediate`(-1) - 这个优先级的任务会同步执行, 或者说要马上执行且不能中断
- `UserBlocking`(250ms) 这些任务一般是用户交互的结果, 需要即时得到反馈
- `Normal` (5s) 应对哪些不需要立即感受到的任务，例如网络请求
- `Low` (10s) 这些任务可以放后，但是最终应该得到执行. 例如分析通知
- `Idle` (没有超时时间) 一些没有必要做的任务 (e.g. 比如隐藏的内容), 可能会被饿死

<br>
<br>

---

**答③: 太麻烦**

官方在[《Fiber Principles: Contributing To Fiber》](https://github.com/facebook/react/issues/7942) 也作出了解答。主要有两个原因：

1. Generator 不能在栈中间让出。比如你想在嵌套的函数调用中间让出, 首先你需要将这些函数都包装成Generator，另外这种栈中间的让出处理起来也比较麻烦，难以理解。除了语法开销，现有的生成器实现开销比较大，所以不如不用。
2. Generator 是有状态的, 很难在中间恢复这些状态。

> 上面理解可能有出入，建议看一下原文

说这么多，可能都没看懂，简单就是React尝试过用Generator实现，后来发现很麻烦，就放弃了。

<br>
<br>

### 2. 一个执行单元

Fiber的另外一种解读是’纤维‘: **这是一种数据结构或者说执行单元**。我们暂且不管这个数据结构长什么样，**将它视作一个执行单元，这个'执行单元'执行完毕后 React 会检查现在还有多少时间，如果没有时间就将控制权让出去**.

上面说了，React 没有使用 Generator，而是自己实现了调度让出机制。这个机制就是基于’Fiber‘这个工作单元的，它的过程如下：

假设用户调用 `setState` 更新组件时会调用更新任务放入队列中, 然后通过 `requestIdleCallback` 请求浏览器调度：

```js
updateQueue.push(updateTask);
requestIdleCallback(performWork, {timeout});
```

浏览器有空闲或者超时时就会调用`performWork`来执行任务：

```js
// 1️⃣ performWork 会拿到一个Deadline，表示剩余时间
function performWork(deadline) {
  // 2️⃣ 循环处理updateQueue中的任务
  while (updateQueue.length > 0 && deadline.timeRemaining() > ENOUGH_TIME) {
    workLoop(deadline);
  }

  // 3️⃣ 如果在本次执行中，未能将所有任务执行完毕，那就再请求浏览器调度
  if (updateQueue.length > 0) {
    requestIdleCallback(performWork);
  }
}
```

**`workLoop` 的工作大概猜到了，它会从更新队列(updateQueue)中弹出更新任务来执行，每执行完一个‘`工作单元`‘，就检查一下剩余时间是否充足，如果充足就进行执行下一个`工作单元`，反之则停止执行，保存现场，等下一次有执行权时恢复**:

```js
// 保存当前的处理现场
let nextUnitOfWork: FiberNode | undefined // 保存下一个需要处理的工作单元
let topWork: FiberNode | undefined        // 保存第一个工作单元

function workLoop(deadline: IdleDeadline) {
  // updateQueue中获取下一个或者恢复上一次中断的执行单元
  if (nextUnitOfWork == null) {
    nextUnitOfWork = topWork = getNextUnitOfWork();
  }

  // 🔴 每执行完一个执行单元，检查一次剩余时间
  // 如果被中断，下一次执行还是从 nextUnitOfWork 开始处理
  while (nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
    // 下文我们再看performUnitOfWork
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork, topWork);
  }

  // 提交工作，下文会介绍
  if (pendingCommit) {
    commitAllWork(pendingCommit);
  }
}
```

画个流程图吧！

![](/images/react-fiber/workloop.png)

<br>

## React 的Fiber改造

现在来进一步看看React 为Fiber做了哪些改造:

### 数据结构的调整

上文中提到 React 16 之前，Reconcilation 是同步的、递归执行的。也就是说这是基于函数’调用栈‘的Reconcilation算法，所以我们通常称它为`Stack Reconcilation`. 你可以通过这篇文章[《从Preact中了解React组件和hooks基本原理》](https://juejin.im/post/5cfa29e151882539c33e4f5e) 来回顾一下。

栈挺好的，代码量少，递归容易理解, 至少比React Fiber架构好理解, 它非常适合树这种嵌套数据结构的处理。只不过这种依赖于调用栈的形式不能随意中断、也很难被恢复, 另外它还不利于异步处理。如果你要恢复递归现场，可能需要从头开始, 恢复到之前的调用栈。

因此**首先我们需要对React现有的数据结构进行调整，将之前需要递归进行处理的事情分解成增量的执行单元，将递归转换成迭代**.

<br>

React 目前的做法是使用链表, 每个节点实例内部现在使用 `FiberNode`表示, 它的结构大概如下:

```js
export type Fiber = {
  // Fiber 类型信息
  tag: WorkTag,
  key: null | string,
  elementType: any,
  type: any,
  stateNode: any,

  // ⚛️ 链表结构
  // 指向父节点，或者render该节点的组件
  return: Fiber | null,
  // 指向第一个子节点
  child: Fiber | null,
  // 指向下一个兄弟节点
  sibling: Fiber | null,
}
```

用图片来展示这种关系会更直观一些：

![](/images/react-fiber/fiber-node.png)

有了这个数据结构调整，现在可以以迭代的方式来处理这些节点了。来看看 `performUnitOfWork` 的实现, 它其实就是一个深度优先的遍历：

```js
/**
 * @params fiber 当前需要处理的节点
 * @params topWork 本次更新的开始节点
 */ 
function performUnitOfWork(fiber: FiberNode, topWork: FiberNode) {
  beginWork(fiber);
  // 如果存在子节点，那么下一个待处理的就是子节点
  if (fiber.child) {
    return fiber.child;
  }

  // 没有子节点了，上溯查找兄弟节点
  let temp = fiber;
  while (temp) {
    completeWork(temp);

    // 到顶层节点了, 退出
    if (temp === topWork) {
      break
    }

    // 找到，下一个要处理的就是兄弟节点
    if (temp.sibling) {
      return temp.sibling;
    }

    // 没有, 继续上溯
    temp = temp.return;
  }
}
```

你可以配合上文的 `workLoop` 一起看，FiberNode 就是我们所说的工作单元，`performUnitOfWork` 负责对 `FiberNode` 进行操作，并按照深度遍历的顺序返回下一个FiberNode。

**因为使用了链表结构，即使处理被中断了，我们随时可以从上次未处理完的`FiberNode`继续遍历下去**。

整个迭代顺序和之前递归的一样, 下图假设在 `div.app` 进行了更新：

![](/images/react-fiber/work-order.png)

<br>

### 两个阶段的拆分

![](/images/react-fiber/fiber-reconciler.png)

如果你现在使用最新的 React 版本(v16), 使用 Chrome 的 Performance 工具，可以很清晰地看到每次渲染有两个阶段：`Reconciliation`(协调阶段) 和 `Commit`(提交阶段).

> 我在之前的多篇文章中都有提及: [《自己写个React渲染器: 以 Remax 为例(用React写小程序)》](https://juejin.im/post/5d8395646fb9a06ad16faa57)


除了Fiber 工作单元的拆分，两阶段的拆分也是一个非常重要的改造，在此之前都是一边Diff一边提交的。先来看看这两者的区别:

- **⚛️ 协调阶段**: 可以认为是 Diff 阶段, 这个阶段会找出所有节点变更，例如节点新增、删除、属性变更等等, 这些变更React 称之为'`副作用`(Effect)'. **这个阶段可以被中断**. 以下生命周期钩子在协调阶段被调用：

  - constructor
  - componentWillMount 废弃
  - componentWillReceiveProps 废弃
  - static getDerivedStateFromProps
  - shouldComponentUpdate
  - componentWillUpdate 废弃
  - render
  - getSnapshotBeforeUpdate()

**⚛️ 提交阶段**: 将上一个阶段计算出来的需要处理的**副作用(Effects)**一次性执行了。**这个阶段必须同步执行，不能被打断**. 这些生命周期钩子在提交阶段被执行:

  - componentDidMount
  - componentDidUpdate
  - componentWillUnmount


<br>

也就是说，在协调阶段如果时间片用完，React就会选择让出控制权。因为协调阶段执行的工作不会导致任何用户可见的变更，所以在这个阶段让出控制权不会有什么问题。需要注意的是：**React 不能保证协调阶段的某些生命周期钩子只被执行一次**, 例如 `componentWillMount` 可能会被调用两次. 

因此**协调阶段的生命周期钩子不应该包含副作用**，索性 React 就废弃了这些可能包含副作用的生命周期方法，例如`componentWillMount`、`componentWillMount`. v17后我们就不能再用它们了, 所以现有的应用应该尽快迁移.

<br>

现在你应该知道为什么'提交阶段'必须同步执行，不能中断的吧？ 因为我们要正确地处理各种副作用，包括DOM变更、还有你在`componentWillMount`中发起的异步请求、useEffect 中定义的副作用... 这些副作用可能是用户可以察觉到的, 不容差池。

<br>

### 副作用的收集

中间状态 副作用

两个阶段
更新节点任务

栈 vs 链表

### 优先级与调度

事件处理

requestIdleCallback

### 中断和恢复

超时终端，更新恢复/合并
双缓存技术 缓存中间状态

<br>

## 缺陷

高优先级任务太多，低优先级
无法阻止用户干傻事， 非抢占


## 轻功水上漂

## 扩展阅读

- [React Fiber 漫谈](https://blog.wuchengran.com/2018/08/16/React%20Fiber%20漫谈/)
- [你应该知道的requestIdleCallback](https://juejin.im/post/5ad71f39f265da239f07e862)
- [深入探究 eventloop 与浏览器渲染的时序问题](https://www.404forest.com/2017/07/18/how-javascript-actually-works-eventloop-and-uirendering/)
- [Accurately measuring layout on the web](https://nolanlawson.com/2018/09/25/accurately-measuring-layout-on-the-web/)
- [Fiber Principles: Contributing To Fiber](https://github.com/facebook/react/issues/7942)
- [协程](https://www.liaoxuefeng.com/wiki/897692888725344/923057403198272)
- [Scheduling in React](https://philippspiess.com/scheduling-in-react/)
- [深入剖析 React Concurrent](https://www.zhihu.com/search?type=content&q=requestIdleCallback)
- [Didact Fiber: Incremental reconciliation](https://engineering.hexacta.com/didact-fiber-incremental-reconciliation-b2fe028dcaec)
