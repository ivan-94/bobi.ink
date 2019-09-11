---
title: "常见的前端架构风格和案例"
date: 2019/9/11
categories: 前端
---

所谓软件架构风格，是指描述某个特定应用领域中系统组织方式的惯用模式。架构风格定义一个词汇表和一组约束，词汇表中包含一些组件及连接器，约束则指出系统如何将构建和连接器组合起来。软件架构风格反映了领域中众多系统所共有的结构和语义特性，并指导如何将系统中的各个模块和子系统有机的结合为一个完整的系统

本文不是专业讨论系统架构的文章，笔者还还没到那个水平. 所以没必要纠结于什么是架构模式、什么是架构风格。在这里尚且把它们当成一个系统架构上的套路, 所谓的套路就是一些通用的、可复用的，用于应对某类问题的方式方法. 可以理解为类似“设计模式”的东西，只是解决问题的层次不一样。

直接进入正题吧

<br>

## 分层风格

> 没有什么问题是分层解决不了，如果解决不了, 就再加一层 —— 鲁迅 <br>
> 不不，原话是: `Any problem  in computer science can be solved by anther layer of indirection.`

分层架构是最常见的软件架构，你要不知道用什么架构，或者不知道怎么解决问题，那就尝试加多一层。

一个分层系统是按照层次来组织的，每一层为在其之上的层提供服务，并且使用在其之下的层所提供的服务. 分层通常可以解决什么问题？

- 隔离业务复杂度与技术复杂度的利器. 典型的例子是网络协议, 越高层越面向人类，越底层越面向机器。一层一层往上，很多技术的细节都被隐藏了，比如我们使用HTTP时，不需要考虑TCP层的握手和包传输，TCP层不需要关心IP层的寻址和路由。

  ![](/images/arch-pattern/tcp-ip-model.png)

- 分离关注点。减少跨越多层的耦合, 当一层变动时不会影响到其他层。例如我们前端项目建议拆分逻辑层和视图层，一方面可以降低逻辑和视图之间的耦合，当视图层元素变动时可以尽量减少对逻辑层的影响；另外一个好处是, 当逻辑抽取出去后，可以被不同平台的视图复用。
  
关注点分离之后，软件的结构会变得容易理解和开发, 每一层可以被复用, 可以独立测试， 其他层的接口通过模拟解决. 分层架构，也不是全是优点，比如分层的抽象可能会丢失部分效率和灵活性, 比如编程语言就有明显的层次结构，语言抽象的层次越高，一般运行效率可能会有衰减:

![](/images/arch-pattern/lang.png)

分层架构在软件领域的案例实在太多太多了，咱讲讲前端的一些分层案例：

## Virtual DOM

前端石器时代，我们页面交互和渲染，是直接通过操作DOM实现的, 有点像C/C++这类系统编程语言需要手动操纵内存. 那时候JQuery很火:

![](/images/arch-pattern/jquery.png)

后来随着软硬件性能越来越好、Web应用也越来越复杂，前端开发者的生产力也要跟上，类似JQuery这种命令式的编程方式无疑比较低效的. 尽管手动操作 DOM 可能可以达到更高的性能和灵活性，但是这样对大部分开发者来说太低效了，我们是可以接受牺牲一点性能换取更高的开发效率的.

怎么解决，再加一层吧，后来React就搞了一层VirtualDOM。我们可以声明式、组合式地构建一颗对象树。然后由React将它映射到DOM。

![](/images/arch-pattern/vd1.png)

一开始VirtualDOM这一层和DOM的关系并不纯粹，两者是耦合在一起的。后面有人想，我们有了VirtualDOM这个抽象层，那应该能搞点别的，比如渲染到移动端元素组件、PDF、Canvas、终端UI等等。VirtualDOM进行了更彻底的分层，有着这个抽象层我们可以将VirtualDOM映射到更多类似场景的软件应用中:

![](/images/arch-pattern/vd2.png)

所以说 VirtualDOM 更大的意义在于开发方式的改变: 声明式、 数据驱动, 让开发者不需要关心 DOM 的操作细节(属性操作、事件绑定、DOM 节点变更)，也就是说应用的开发方式变成了`view=f(state)`, 这对生产力的解放是有很大推动作用的.

当然VirtualDOM或者React，不是唯一，也不是第一个这样的解决方案。其他前端框架，例如Vue、Angular基本都是这样一个发展历程。

当然上面说了，分层不是银弹。我们通过ReactNative可以开发扩平台的移动应用，但是众所周知，它运行效率或者灵活性暂时是无法与原生应用比拟的。

<br>

## Taro

**[Taro](https://taro-docs.jd.com/taro/docs/README.html) 和React一样也采用分层架构风格，只不过他们解决的问题是相反的。React加上一个分层，可以渲染到不同的视图形态；而Taro则是为了统一**: 国内现如今市面上端的形态多种多样，Web、React-Native、微信小程序...，针对不同的端去编写多套代码的成本非常高，这种需求催生了Taro这类框架的诞生. 使用 Taro，我们可以只书写一套代码, 通过编译工具可以输出到不同的端.

![](/images/arch-pattern/taro.jpg)
(图片来源: [多端统一开发框架 - Taro](https://aotu.io/notes/2018/06/07/Taro/))

<br>
<br>

## 管道和过滤器

在管道/过滤器架构风格中，每个组件都有一组输入和输出，每个组件职责都很单一, 数据输入组件，经过内部处理，然后将处理过的数据输出。所以这些组件也称为过滤器，连接器按照业务需求将组件连接起来，其形状就像‘管道’一样，这种架构风格由此得名。

![](/images/arch-pattern/pipeline.png)

这里面最经典的案例是`*unix` Shell命令，Unix的哲学就是“只做一件事，把它做好”，所以我们常用的Unix命令功能都非常单一，但是Unix Shell还有一件法宝就是管道，通过管道我们可以将命令通过`标准输入输出`串联起来实现复杂的功能:

```shell
# 获取网页，并进行拼写检查。代码来源于wiki
curl "http://en.wikipedia.org/wiki/Pipeline_(Unix)" | \
sed 's/[^a-zA-Z ]/ /g' | \
tr 'A-Z ' 'a-z\n' | \
grep '[a-z]' | \
sort -u | \
comm -23 - /usr/share/dict/words | \
less
```

另一个和Unix管道相似的例子是`ReactiveX`, 例如[RxJS](https://github.com/ReactiveX/rxjs). 很多教程将Rx比喻成河流，这个河流的开头就是一个事件源，这个事件源按照一定的频率发布事件。Ok，Rx真正强大的其实是它的操作符，有了这些操作符，你可以对这条河流[做一切可以做的事情](https://rxjs.dev/operator-decision-tree)，例如分流、节流、建大坝、转换、统计、合并、产生河流的河流....

这些操作符和Unix的命令一样，职责都很单一，只干好一件事情。但我们管道将它们组合起来的时候，就迸发了无限的能力.

```js
import { fromEvent } from 'rxjs';
import { throttleTime, map, scan } from 'rxjs/operators';

fromEvent(document, 'click')
  .pipe(
    throttleTime(1000),
    map(event => event.clientX),
    scan((count, clientX) => count + clientX, 0)
  )
  .subscribe(count => console.log(count));
```

<br>

除了上述的RxJS，管道模式在前端领域也有很多应用，主要集中在前端工程化领域。例如'老牌'的项目构建工具[gulp](https://www.gulpjs.com.cn/), Gulp使用管道化模式来处理文件类型，管道中的每一个步骤成为Transpiler(转译器), 以 NodeJS 的Stream 作为输入输出。整个过程高效而简单。

![](/images/arch-pattern/gulp.png)

不确定是否受到Gulp的影响，现代的[Webpack](https://www.webpackjs.com/)打包工具，也使用同样的模式来实现对文件的处理, 即[Loader](https://www.webpackjs.com/concepts/loaders/), Loader 用于对模块的源代码进行转换, 通过Loader的组合，可以实现复杂的文件转译需求.

```js
// webpack.config.js
module.exports = {
  ...
  module: {
    rules: [{
      test: /\.scss$/,
      use: [{
          loader: "style-loader" // 将 JS 字符串生成为 style 节点
      }, {
          loader: "css-loader" // 将 CSS 转化成 CommonJS 模块
      }, {
          loader: "sass-loader" // 将 Sass 编译成 CSS
      }]
    }]
  }
};
```

<br>

### 中间件(Middleware)

![](/images/arch-pattern/middleware.png)

如果开发过Express、Koa或者Redux, 你可能会发现中间件模式和上述的管道模式有一定的相似性，如上图。相比管道，中间件模式可以使用一个洋葱剖面来形容。和管道相比，一般的中间件实现有以下特点:

- 中间件没有显式的输入输出。这些中间件之间通常通过集中式的上下文对象来共享状态
- 有一个循环的过程。管道中，数据处理完毕后交给下游了，后面就不管了。而中间件还有一个回归的过程，当下游处理完毕后会进行回溯，所以有机会干预下游的处理结果。

我在谷歌上搜了老半天中间件，对于中间件都没有得到一个令我满意的定义. **暂且把它当作一个特殊形式的管道模式吧**。这种模式通常用于后端，它可以干净地分离出请求的不同阶段，也就是分离关注点。比如我们可以创建这些中间件：

- 日志： 记录开始时间 | 计算响应时间，输出请求日志
- 认证： 验证用户是否登录
- 授权： 验证用户是否有执行该操作的权限
- 缓存： 是否有缓存结果，有的话就直接返回 | 当下游响应完成后，再判断一下响应是否可以被缓存
- 执行： 执行实际的请求处理 | 响应

有了中间件之后，我们不需要在每个响应处理方法中都包含这些逻辑，关注好自己该做的事情。下面是Koa的示例代码:

```js
const Koa = require('koa');
const app = new Koa();

// logger

app.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// response

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);
```

<br>

简洁而不简单

## 参考文献

- [几种常见的软件架构风格介绍](https://wxs.me/2069)
- [架构风格与基于网络的软件架构设计](https://docs.huihoo.com/rest/REST_cn.pdf) REST提议者，Roy Thomas Fielding的博士论文
- [软件架构入门](http://www.ruanyifeng.com/blog/2016/09/software-architecture.html)
- [管道 (Unix)](https://zh.wikipedia.org/wiki/管道_\(Unix\))
- [redux middleware 详解](https://zhuanlan.zhihu.com/p/20597452)
