---
title: "浏览器和Node中的JavaScript是如何工作的? 可视化解释"
date: 2019/8/29
categories: 前端
---

原文地址: [How JavaScript works in browser and node?](https://itnext.io/how-javascript-works-in-browser-and-node-ab7d0d09ac2f)

There are many passionate developers, working on front-end or back-end, devote their life to protect realm of JavaScript. JavaScript is very easy to understand and is a essential part of front-end development. But unlike other programming languages, it’s single threaded. That means, code execution will be done one at a time. Since code execution is done sequentially, any code that takes longer time to execute, will block anything that needs to be executed. Hence sometimes you see below screen while using Google Chrome.

有非常多满怀激情的开发者，他们搞前端或者搞后端，为JavaScript奉献自己青春和血汗。JavaScript非常容易理解语言，它无疑是前端开发中一个关键的部分。但是和其他语言不同的是， 它是单线程的，这就意味着，同一时间只能有一个代码片段在执行。因为代码执行是线性的，如果当中有任何代码执行很长时间，将会阻塞后面需要被执行的代码。因此有时候你会在Google Chrome中看到这样的界面:

![](/images/js-bs/crashed.png)

When you open a website in browser, it uses a single JavaScript execution thread. That thread is responsible to handle everything, like scrolling the web page, printing something on the web page, listen to DOM events (like when user clicks a button) and doing other things. But when JavaScript execution is blocked, browser will stop doing all those things, which means browser will simply freeze and won’t respond to anything.

当你在浏览器打开一个网站时，它会使用一个JavaScript执行线程。这个线程负责响应一切操作，比如页面滚动、页面渲染、监听DOM事件(比如用户点击按钮)等等。但是如果JavaScript执行被阻塞了，浏览器什么事情也做不了，即意味着浏览器会呈现为卡死，无法响应。

You can see that in action using below eternal while loop.

不信你就在控制台输入试试:

```js
while(true){}
```

Any code after above statement won’t be executed as while loop will loop infinitely until system is out of resources. This can also happen in infinitely recursive function call.

上面语句之后的任何代码都不会被执行，这个‘死循环’会耗尽系统资源. 无限递归调用也会出现这种情况。

![](/images/js-bs/crashed2.png)

Thanks to modern browsers, as not all open browser tabs rely on single JavaScript thread. Instead they use separate JavaScript thread per tab or per domain. In case of Google Chrome, you can open multiple tabs with different websites and run above eternal while loop. That will only freeze current tab where that code was executed but other tabs will function normally. Any tab having page opened from same domain / same website will also freeze as Chrome implements one-process-per-site policy and a process uses same JavaScript execution thread.

感谢现代浏览器，现在不是所有打开的浏览器标签页都依赖于一个JavaScript线程。而是每个标签页或者域名都会有独立的JavaScript线程。这会每个标签页之间不会互相阻塞。比如你可以在Chrome中打开多个标签页，在某个标签页下执行上面的语句，你会发现只有执行了上面语句的标签卡死，其他不受影响。

To visualize, how JavaScript executes a program, we need to understand JavaScript runtime.

<br>

## 调用栈(Call Stack)

为了可视化JavaScript 如何执行程序，我们首先要理解JavaScript运行时。

![](/images/js-bs/vis1.png)

Like any other programming language, JavaScript runtime has one stack and one heap storage. I am not going to explain much more about heap, you can read it here. What we are interested in is stack. Stack is LIFO (last in, first out) data storage which store current function execution context of a program. When our program is loaded into the memory, it starts execution from the first function call which is foo().

![](/images/js-bs/heap.png)

和其他编程语言一样，JavaScript运行时有一个栈(Stack)和一个堆(Heap)存储器。本文不会深入解释Heap，你可以看[这里](https://hashnode.com/post/does-javascript-use-stack-or-heap-for-memory-allocation-or-both-cj5jl90xl01nh1twuv8ug0bjk). 我们感兴趣的是栈，**栈是一个LIFO(后进先出)的数据结构，用来保存程序当前的函数执行上下文, 换句话说，它表示的是当前程序执行的位置. 每次开始执行一个函数，就会将该函数推入栈中，当函数返回时从栈中弹出。 当栈为空时表示没有程序正在执行。所以栈常常也称为‘调用栈’**。

Hence, first stack entry is foo(). Since foo function calls bar function, second stack entry is bar(). Since bar function calls baz function, third stack entry is baz(). And finally, baz function calls console.log, fourth stack entry is console.log('Hello from baz').

当我们的程序加载进内存时，会开始执行第一个函数，即foo。 因此第一个栈元素就是`foo()`, 因为foo函数会调用bar函数，第二个栈元素就是`bar()`; 同理bar函数会调用baz，第三个栈元素就是`baz()`. 最后，baz调用`console.log`，最后一个栈元素就是`console.log('Hello from baz')`

Until a function returns something (while function is executing), it won’t be popped out from the stack. Stack will pop entries one by one as soon as that entry (function) returns some value, and it will continue pending function executions.

栈会在函数返回(执行完毕)时弹出。然后继续执行函数调用后续的语句:

![](/images/js-bs/vis1.gif)

At each entry, state of the stack also called as stack frame. If any function call at given stack frame produces an error, JavaScript will print stack trace which is nothing but a snapshot of code execution at that stack frame.

<br>

每个元素中，栈的状态也被称为栈帧(Stack Frame). 如果在函数调用抛出错误，JavaScript会输出栈跟踪记录(Stack trace)，表示代码执行时的栈帧的快照。

```js
function baz(){
   throw new Error('Something went wrong.');
}
function bar() {
   baz();
}
function foo() {
   bar();
}
foo();
```

In above program, we threw error from baz function and JavaScript will print below stack trace to figure out what went wrong and where.

上面的程序，我们在baz中抛出错误，JavaScript会打印出栈跟中记录，指出错误发生的地方和错误信息。

![](/images/js-bs/err-msg.png)

栈的大小不是无限的。例如Chrome就会限定栈的最大为16,000帧。所以无限递归会导致Chrome抛出`Maximum Call Stack size exceeded`

![](/images/js-bs/overstack.png)

<br>

Since JavaScript is single threaded, it has only one stack and one heap. Hence, if any other program want to execute something, it has to wait until previous program is completely executed.

## 事件循环与Web API

**因为JavaScript是单线程的，所以它只有一个栈和堆**。因此，如果其他程序想要执行一些东西，需要等待上一个程序执行完毕

This is bad for any programming language but JavaScript was designed to be used as general purpose programming language, not for very complex stuff.

对比其他语言，这可能是一个糟糕的设计，但是JavaScript的定位就是通用编程语言，而不是用于非常复杂的场景

So let’s think of one scenario. What if a browser sends a HTTP request to load some data over network or to load an image to display on web page. Will browser freeze until that request is resolved? If it does, then it’s very bad for user experience.

考虑这样一个场景。假设浏览器发送一个HTTP请求到服务器，加载图片并展示到页面。浏览器会卡死等待请求完成吗？显然不会，这样用户体验太差了

Browser comes with a JavaScript engine which provides JavaScript runtime environment. For example, Google chrome uses V8 JavaScript engine, developed by them. But guess what, browser uses more than just a JavaScript engine. This is what browser under the hood looks like.

浏览器通过JavaScript引擎来提供JavaScript运行环境。比如Chrome使用V8 引擎。但是浏览器内部可不只有JavaScript引擎。下面是浏览器的底层结构：

![](/images/js-bs/underhood.png)

Looks really complex but it is very easy to understand. JavaScript runtime actually consist of 2 more components viz. event loop and callback queue. Callback queue is also called as message queue or task queue.

看起来很复杂，但是它也很好理解。JavaScript引擎需要和其他2个组件协作，即**事件循环(EventLoop)**和**回调队列(CallbackQueue)**，回调队列也被称为消息队列或任务队列。

Apart from JavaScript engine, browser contains different applications which can do variety of things like send HTTP requests, listen to DOM events, delay execution using setTimeout or setInterval, caching, database storage and much more. These features of browser help us create rich web applications.

除了JavaScript引擎，浏览器还包含了许多不同的应用来做各种各样的事情，比如HTTP请求、DOM事件监听、通过setTimeout、setInterval延迟执行、缓存、数据存储等等。这些特性可以帮助我们创建丰富的Web应用。

But think about this, if browser had to use same JavaScript thread for execution of these feature, then user experience would have been horrible. Because even when user is just scrolling the web page, there are many things going on, in the background. Hence, browser uses low level language like C++ to perform these operations and provide clean JavaScript API to work with. These APIs are known as Web APIs.

想一下，如果浏览器使用同一个JavaScript线程来处理上面这些特性，用户体验会有多糟糕。因为用户即使只是简单的滚动页面，背后是需要处理很多事情的, 单个Javascript线程压根忙不过来。因此浏览器会使用低级的语言，比如C++，来执行这些操作，并暴露简洁的JavaScript API给开发者。这些API统称为**Web API**。

These Web APIs are asynchronous. That means, you can instruct these APIs to do something in background and return data once done, meanwhile we can continue further execution of JavaScript code. While instructing these APIs to do something in background, we have to provide a callback function. Responsibility of callback function is to execute some JavaScript once Web API is done with it’s work. Let’s understand how all pieces work together.

**这些Web API通常是异步的**。这意味着，你可以命令这些API在'后台'(独立线程)去做一些事情，完成任务之后再返回数据，在此同时，Javascript引擎会继续执行剩下的JavaScript代码. 在命令这些API在后台做事情时，我们通常需要给它们提供一个回调。这个回调的职责就是在Web API完成任务后执行JavaScript代码。让我们将上述的所有东西整合起来理解一下:

So when you call a function, it gets pushed to the stack. If that function contains Web API call, JavaScript will delegate control of it to the Web API with a callback function and move to the next lines until function returns something. Once function hits return statement, that function is popped from the stack and move to the next stack entry. Meanwhile, Web API is doing it’s job in the background and remembers what callback function is associated with that job. Once job is done, Web API binds result of that job to callback function and publishes a message to message queue (AKA callback queue) with that callback. The only job of event loop is to look at callback queue and once there is something pending in callback queue, push that callback to the stack. Event loop pushes one callback function at a time, to the stack, once the stack is empty. Later, stack will execute callback function.

![](images/js-bs/webapi-call.png)

当你调用一个函数时，它会被推进栈中。如果这个函数中包含了Web API调用，JavaScript会代理Web API的调用, 通知Web API执行任务，并继续执行下一行代码直到函数返回。一旦函数到达return语句或者函数底部，这个函数就会从调用栈中弹出来。

与此同时，如果Web API在后台完成了它的工作，且有一个回调和这个工作绑定，Web API会将结果消息和回调进行绑定，并推入到消息队列中(或者成为回调队列).

**事件循环, 就像一个无限循环，它的唯一工作是检查回调队列，一旦回调队列中有待处理的任务，就将该回调推送到调用栈**。不过因为Javascript是单线程的, 事件循环一次只能推送一个回调到调用栈，栈将会执行回调函数，**一旦调用栈为空，事件循环才会将下一个回调函数推送到调用堆**。

事件循环的伪代码大概如下:

```js
while(true) {
   let task
   while(task = popCallbackQueue()) {// 弹出回调队列任务
      executeTask(task) // 执行任务, 这里面可能会触发新的Web API调用
   }

   if (hasAnyPendingTask()) {
      sleep() // 睡一觉，有新任务推送到回调队列时时再唤醒我哦
   } else {
      break // 终止程序, 没什么好干的拜拜了
   }
}
```

Let’s see how everything works step by step using setTimeout Web API. setTimeout Web API is mainly used to execute something after few seconds. This execution happens once all code in the program is done executing (when stack is empty). The syntax for setTimeout function is as below.

我们通过setTimeout Web API这个例子一步一步看看上述的一切是怎么运作的。setTimeout Web API主要用于延时执行一些操作，但是回调真正被执行需要等待当前程序执行完毕(即栈为空), 也就是说，setTimeout函数回调执行时间未必等于你指定的延时时间。setTimeout的语法如下:

```js
setTimeout(callbackFunction, timeInMilliseconds);
```

callbackFunction is a callback function which will execute after timeInMilliseconds. Let’s modify our earlier program and use this API.

callbackFunction是一个回调函数，它将会在timeInMilliseconds之后执行. 我们修改上面的代码来调用setTimeout:

```js
function printHello() {
    console.log('Hello from baz');
}
function baz() {
    setTimeout(printHello, 3000);
}
function bar() {
    baz();
}
function foo() {
    bar();
}
foo();
```

The only modification done to the program is, we delayed console.log execution by 3 seconds. In this case, stack will keep building up like foo() => bar() => baz(). Once baz starts executing and hits setTimeout API call, JavaScript will pass callback function to the Web API and move to the next line. Since, there is no next line, stack will pop baz, then bar and then foo function calls. Meanwhile, Web API is waiting for 3 seconds to pass. Once 3 seconds are passed, it will push this callback to callback queue and since stack is empty, event loop will put this callback back on the stack where execution of this callback will happen.

上面的代码延时调用了console.log. 栈还是会像之前一样，如`foo() => bar() => baz()`, 当baz开始执行并到达setTimeout时，Javascript会将回调函数传递给Web API，并且继续执行下一行。 因为这里没有下一行了，栈会弹出baz，接着弹出bar和foo。在这期间，Web API正在进行3s等待，当时间到达时，它会将回调推进回调队列中。 因为这时候调用栈为空，事件循环会将这个回调推进栈中，并执行这个回调。

Philip Robers has created a amazing online tool to visualize how JavaScript works underneath. Our above example is available at this link.

🎉🎉[Philip Robers](http://latentflip.com/)创建了一个神奇的在线工具[Loupe](http://latentflip.com/loupe/)，来可视化Javascript的底层运行。上面的实例可以查看这个[链接](http://latentflip.com/loupe/?code=ZnVuY3Rpb24gcHJpbnRIZWxsbygpIHsNCiAgICBjb25zb2xlLmxvZygnSGVsbG8gZnJvbSBiYXonKTsNCn0NCg0KZnVuY3Rpb24gYmF6KCkgew0KICAgIHNldFRpbWVvdXQocHJpbnRIZWxsbywgMzAwMCk7DQp9DQoNCmZ1bmN0aW9uIGJhcigpIHsNCiAgICBiYXooKTsNCn0NCg0KZnVuY3Rpb24gZm9vKCkgew0KICAgIGJhcigpOw0KfQ0KDQpmb28oKTs%3D!!!PGJ1dHRvbj5DbGljayBtZSE8L2J1dHRvbj4%3D)🎉🎉

![](/images/js-bs/vis2.png)

**所以说我们Javascript是单线程的，但是很多Web API的执行是多线程的。也就是说Javascript的单线程指的是‘Javascript代码’的执行是单线程**.

<br>

## Node.js

When it comes to Node.js, it has to do more because node promises more. In case of browser, we are limited to what we can do in the background. But in node, we can pretty much do most of the things in background, even it is simple JavaScript program. But, how does that work?

通过Node.js我们可以做更多的事情。那么它是怎么运作的？

Node.js uses Google’s V8 engine to provide JavaScript runtime but does not rely only on it’s event loop. It uses libuv library (written in c) to work along side V8 event loop to extend what can be done in background. Node follows same callback approach like Web APIs and works in similar fashion as the browser.

Node.js 使用Google的V8引擎来提供Javascript运行时. 它使用[libuv](https://github.com/libuv/libuv)(C++编写)来和V8的事件循环配合，扩展更多可以在后台执行的东西, 比如文件系统I/O, 网络I/O。Node遵循了浏览器Web API的类似回调风格。

![](/images/js-bs/node.png)

If you compare browser diagram with above node diagram, you can see the similarities. The entire right section looks like Web API but it also contains event queue (callback queue/message queue) and the event loop. But V8, event queue and event loop runs on single thread while worker threads are responsible to provide asynchronous I/O operation. That’s why Node.js is said to have as non-blocking event driven asynchronous I/O architecture.

如果你比较了浏览器和node的结构图，你会发现两者非常相似。右侧的部分类似于Web API，同样包含事件队列(或者称为回调队列/消息队列)和事件循环。

V8、事件循环、事件队列都在单线程中运行，最右侧还有工作线程(Worker Thread)负责提供异步的I/O操作。这就是为什么说Node.js拥有非阻塞的、事件驱动的异步I/O架构。

All of the above is explained brilliantly by Philip Roberts in 30 min video.

上面的内容都来源于[Philip Roberts](http://latentflip.com/)30min的高光[演讲](https://youtu.be/8aGhZQkoFbQ)
