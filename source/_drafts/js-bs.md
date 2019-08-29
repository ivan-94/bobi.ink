---
title: "可视化解释浏览器和Node中的JavaScript是如何工作的? "
date: 2019/8/29
categories: 前端
---

原文地址: [How JavaScript works in browser and node?](https://itnext.io/how-javascript-works-in-browser-and-node-ab7d0d09ac2f)

There are many passionate developers, working on front-end or back-end, devote their life to protect realm of JavaScript. JavaScript is very easy to understand and is a essential part of front-end development. But unlike other programming languages, it’s single threaded. That means, code execution will be done one at a time. Since code execution is done sequentially, any code that takes longer time to execute, will block anything that needs to be executed. Hence sometimes you see below screen while using Google Chrome.

有非常多满怀激情的开发者，他们搞前端或者搞后端，为JavaScript奉献自己青春和血汗。JavaScript非常容易理解，它无疑是前端开发中一个关键的部分。但是和其他语言不同，它是单线程的，这就意味着，同一时间只能执行一个代码。因为代码执行是线性的，如果当中有任何代码执行很长时间，将会阻塞其他需要被执行的代码。因此有时候你会在Google Chrome中看到这样的界面:

![](/images/js-bs/crashed.png)

When you open a website in browser, it uses a single JavaScript execution thread. That thread is responsible to handle everything, like scrolling the web page, printing something on the web page, listen to DOM events (like when user clicks a button) and doing other things. But when JavaScript execution is blocked, browser will stop doing all those things, which means browser will simply freeze and won’t respond to anything.

当你在浏览器打开一个网站时，它使用单个JavaScript执行线程。这个线程负责响应一切操作，比如页面滚动、页面渲染、监听DOM事件(比如用户点击按钮)等等。但是如果JavaScript执行被阻塞了，浏览器什么事情也做不了，即意味着浏览器会呈现为卡死，无法响应。

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

为了可视化JavaScript如果执行程序，我们首先要理解JavaScript运行时。

![](/images/js-bs/vis1.png)

Like any other programming language, JavaScript runtime has one stack and one heap storage. I am not going to explain much more about heap, you can read it here. What we are interested in is stack. Stack is LIFO (last in, first out) data storage which store current function execution context of a program. When our program is loaded into the memory, it starts execution from the first function call which is foo().

和其他编程语言一样，JavaScript运行时有一个Stack(栈)和一个Heap(堆)存储器。本文不会深入解释Heap，你可以看[这里](https://hashnode.com/post/does-javascript-use-stack-or-heap-for-memory-allocation-or-both-cj5jl90xl01nh1twuv8ug0bjk). 我们感兴趣的是Stack， Stack是一个LIFO(后进先出)的数据结构，用来保存程序当前的函数执行上下文。当我们的程序加载进内存时，会开始执行第一个函数，即foo。

Hence, first stack entry is foo(). Since foo function calls bar function, second stack entry is bar(). Since bar function calls baz function, third stack entry is baz(). And finally, baz function calls console.log, fourth stack entry is console.log('Hello from baz').

因此，第一个Stack元素就是`foo()`, 因为foo函数会调用bar函数，第二个Stack元素就是`bar()`; 同理bar函数会调用baz，第三个Stack元素就是`baz`. 最后，baz调用console.log，最后一个Stack元素就是`console.log('Hello from baz')`

Until a function returns something (while function is executing), it won’t be popped out from the stack. Stack will pop entries one by one as soon as that entry (function) returns some value, and it will continue pending function executions.

Stack会在函数返回时弹出。Stack会在函数返回是弹出元素，然后继续下面的函数执行。

![](/images/js-bs/vis1.gif)

At each entry, state of the stack also called as stack frame. If any function call at given stack frame produces an error, JavaScript will print stack trace which is nothing but a snapshot of code execution at that stack frame.

每个元素中，栈的状态也被称为栈帧(Stack Frame). 如果在给定栈帧中的函数调用抛出错误，JavaScript会输出栈跟踪记录(Stack trace)，表示代码执行时的栈帧的快照。

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

Since JavaScript is single threaded, it has only one stack and one heap. Hence, if any other program want to execute something, it has to wait until previous program is completely executed.

因为JavaScript是单线程的，所以它只有一个Stack和Heap。因此，如果其他程序想要执行一些东西，需要等待上一个程序执行完毕

This is bad for any programming language but JavaScript was designed to be used as general purpose programming language, not for very complex stuff.

对比其他语言，这可能是一个糟糕的设计，当时JavaScript的定位就是通用编程语言，而不是用于非常复杂的场景

So let’s think of one scenario. What if a browser sends a HTTP request to load some data over network or to load an image to display on web page. Will browser freeze until that request is resolved? If it does, then it’s very bad for user experience.

考虑这样一个场景。假设浏览器发送一个HTTP请求到服务器，加载图片并展示到页面。浏览器会卡死等待请求完成吗？显然不会，这样用户体验太差了

Browser comes with a JavaScript engine which provides JavaScript runtime environment. For example, Google chrome uses V8 JavaScript engine, developed by them. But guess what, browser uses more than just a JavaScript engine. This is what browser under the hood looks like.


浏览器使用JavaScript引擎来提供JavaScript运行环境。比如Chrome使用V8 引擎。但是浏览器内部可不只有JavaScript引擎。下面是浏览器的底层结构：

![](/images/js-bs/underhood.png.png)

Looks really complex but it is very easy to understand. JavaScript runtime actually consist of 2 more components viz. event loop and callback queue. Callback queue is also called as message queue or task queue.

看起来很复杂，但是它很好理解。JavaScript引擎需要和其他2个组件，即EventLoop(事件循环)和CallbackQueue(回调队列)，回调队列也被称为消息队列或任务队列。

Apart from JavaScript engine, browser contains different applications which can do variety of things like send HTTP requests, listen to DOM events, delay execution using setTimeout or setInterval, caching, database storage and much more. These features of browser help us create rich web applications.

除了JavaScript引擎，浏览器还包含了不同的应用来做各种各样的事情，比如HTTP请求、DOM事件监听、通过setTimeout、setInterval延迟执行、缓存、数据存储等等。这些特性帮助我们创建丰富的Web应用。

But think about this, if browser had to use same JavaScript thread for execution of these feature, then user experience would have been horrible. Because even when user is just scrolling the web page, there are many things going on, in the background. Hence, browser uses low level language like C++ to perform these operations and provide clean JavaScript API to work with. These APIs are known as Web APIs.

想一下，如果浏览器使用同一个JavaScript线程来处理上面这些特性，用户体验会有多糟糕。因为用户即使只是简单的滚动页面，背后是需要处理很多事情的。因此浏览器会使用低级的语音，比如C++，来执行这些操作，暴露简洁的JavaScript API。这些API统称为Web API。

These Web APIs are asynchronous. That means, you can instruct these APIs to do something in background and return data once done, meanwhile we can continue further execution of JavaScript code. While instructing these APIs to do something in background, we have to provide a callback function. Responsibility of callback function is to execute some JavaScript once Web API is done with it’s work. Let’s understand how all pieces work together.

这些Web API通常是异步的。这意味着，你可以命令这些API在后台去做一些事情，完成任务之后再返回数据，在此同时，我们可以继续执行剩下的JavaScript代码. 在命令这些API在后台做事情时，我们需要给它们提供一个回调。这个回调的职责就是在Web API完成任务后执行JavaScript代码。让我们将上述的所有东西整合起来理解一下:

So when you call a function, it gets pushed to the stack. If that function contains Web API call, JavaScript will delegate control of it to the Web API with a callback function and move to the next lines until function returns something. Once function hits return statement, that function is popped from the stack and move to the next stack entry. Meanwhile, Web API is doing it’s job in the background and remembers what callback function is associated with that job. Once job is done, Web API binds result of that job to callback function and publishes a message to message queue (AKA callback queue) with that callback. The only job of event loop is to look at callback queue and once there is something pending in callback queue, push that callback to the stack. Event loop pushes one callback function at a time, to the stack, once the stack is empty. Later, stack will execute callback function.

当你调用一个函数时，它会被推进栈中。如果这个函数中包含了Web API调用，JavaScript会代理Web API的调用，并继续执行下一行代码直到函数返回。一旦函数到达return语句或者函数底部，这个函数就会从Stack中弹出来。

这时候，如果Web API在后台完成了它的工作，且有一个回调和这个工作绑定，Web API会将结构和回调进行绑定，并推入到消息队列中(或者成为回调队列). 

事件循环的唯一工作是检查回调队列，一旦回调队列中有待处理的任务，就将该回调推送到栈。事件循环一次只能推送一个回调给栈，栈会执行回调函数，一旦栈为空，事件循环才会将下一个回调函数推送到堆。

Let’s see how everything works step by step using setTimeout Web API. setTimeout Web API is mainly used to execute something after few seconds. This execution happens once all code in the program is done executing (when stack is empty). The syntax for setTimeout function is as below.
