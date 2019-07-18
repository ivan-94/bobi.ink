---
title: "现代脚本的加载"
date: 2019/7/17
categories: 前端
---

原文地址: [Modern Script Loading](https://jasonformat.com/modern-script-loading/), 文章作者是Preact作者[Jason Miller](https://jasonformat.com/modern-script-loading/)

<br>

![](https://bobi.ink/images/modern-module/modern-script-loading.jpg)

<br>

## 背景知识

先简单介绍一下[`模块script(Module script)`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules), 它指的是**现代浏览器支持通过`<script type=module src=main.js></script>`来加载现代的ES6模块**. 现代浏览器对ES6现代语法有良好的支持，这意味着**我们可以给这些现代浏览器提供更紧凑的‘现代代码’，一方面可以减小打包的体积，减少网络传输的带宽，另外还可以提高脚本解析的效率和运行效率**.

下图来源于[`module/nomodule pattern`](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/), 对比了**模块script**和**传统(legacy) script**的性能:

体积对比:

|Version|	Size (minified)	|Size (minified + gzipped)|
|-------|--------|-------|
|ES2015+ (main.mjs)	|80K	|21K|
|ES5 (main.es5.js)|	175K	|43K|

<br>

解析效率:

|Version	| Parse/eval time (individual runs)	| Parse/eval time (avg) |
|---------------|------------|-------------|
|ES2015+ (main.mjs) |	184ms, 164ms, 166ms|	172ms|
|ES5 (main.es5.js) |	389ms, 351ms, 360ms|	367ms|

<br>

Ok，为了兼容旧浏览器, [module/nomodule pattern](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/)这篇文章介绍了一种**module/nomodule 模式**, 简单说就是**同时提供两个script, 由浏览器来决定加载哪个文件**：

<br>

```html

<script type="module" src="main.mjs"></script>



<script nomodule src="main.es5.js"></script>
```

<br>

看起来很美好是吧? 现实是：**中间存在一些浏览器，它们可以识别`模块script`但是不认识`nomodule`属性, 这就导致了这些浏览器会同时加载这两个文件(下文统一称为‘双重加载’(over-fetching))**.

<br>
<br>

> OK，正式进入正文. 给正确的浏览器交付正确代码是一件棘手的事情。本文会介绍几种方式, 来解决上述的问题:

给现代浏览器伺服'现代的代码'对性能有很大的帮助。所以你应该针对现代浏览器提供包含更紧凑和优化的现代语法的Javascript包，同时又可以保持对旧浏览器的支持

现有的工具链的生态系统基本都是在`module/nomodule模式`上整合的，它声明式加载现代和传统代码(legacy code)，即给浏览器提供两个源代码，让它来自己来决定用哪个:

```html
<script type="module" src="/modern.js"></script>  
<script nomodule src="/legacy.js"></script>  
```

然而现实总是给你当头一棒，它没我们期望的那么简单直接。上述基于HTML的加载方式在**[Edge和Safari中会被同时加载](https://gist.github.com/jakub-g/5fc11af85a061ca29cc84892f1059fec)**!

<br>

## 怎么办?

怎么办？我们想依赖浏览器来交付不同的编译目标，但是一些旧浏览器并不能优雅地支持这种简洁的写法。

首先，Safari 在10.1开始支持JS模块, 但不支持nomodule属性。值得庆幸的是，Sam找到了一种方法，可以通过Safari 10和11中非标准的beforeload事件来模拟 nomodule, 也就是可以认为Safari 10.1开始是可以支持`module/nomodule模式`

<br>

## 选项1: 动态加载

我们可以实现一个小型script加载器来规避这个问题，工作原理类似于[LoadCSS](https://github.com/filamentgroup/loadCSS)。只不过这里需要依靠浏览器的来实现ES模块和nomodule属性.

我们首先尝试执行一个模块script进行'石蕊试验'(litmus test), 然后由这个试验的结果来决定加载现代代码还是传统代码:

```html
  
<script type=module>  
  self.modern = true
</script>

  
<script>  
  addEventListener('load', function() {
    var s = document.createElement('script')
    if (self.modern) {
      s.src = '/modern.js'
      s.type = 'module'
    }
    else {
      s.src = '/legacy.js'
    }
    document.head.appendChild(s)
  })
</script>  
```

然而，这个解决方案必须等待进行‘石蕊试验’模块script执行完成, 才能开始注入script。这是因为`<script type=module>`始终是异步的，所以别无它法(延迟到load事件后)。

另一种实现方式是检查浏览器是否支持`nomodule`, 这是方式可以避免上述的延迟加载问题, 只不过这意味着像Safari 10.1这些支持模块, 却不支持nomodule的浏览器也会被当做传统浏览器，这也许[可能](https://github.com/web-padawan/polymer3-webpack-starter/issues/33#issuecomment-474993984)是[好事](https://jasonformat.com/modern-script-loading/)(相对于两个脚本都加载以及有一些bug)，代码如下:

```js
var s = document.createElement('script')  
if ('noModule' in s) {  // 注意这里的大小写
  s.type = 'module'
  s.src = '/modern.js'
}
else  
  s.src = '/legacy.js'
}
document.head.appendChild(s)  
```

现在把它们封装成函数，并确保两种方式都统一使用异步的方式加载(上文提到模块script是异步的，而传统script不是):

```html
<script>  
  $loadjs("/modern.js","/legacy.js")
  function $loadjs(src,fallback,s) {
    s = document.createElement('script')
    if ('noModule' in s) s.type = 'module', s.src = src
    else s.async = true, s.src = fallback   // 统一使用异步方式加载
    document.head.appendChild(s)
  }
</script>  
```

<br>

看起来已经很完美了，还有什么问题呢？**我们还没考虑预加载(preloading)**

这个有点蛋疼， 因为一般浏览器只会静态地扫描HTML，然后查找它可以预加载的资源。 我们上面介绍的模块加载器是完全动态的，所以浏览器在没有运行我们的代码之前，是没办法发现我们要预加载现代还是传统的Javascript资源的。

不过有一个解决办法，就是不完美：就是使用`<link rel=modulepreload>`来预加载现代版本的包, 旧浏览器会忽略这条规则，然而目前[只有Chrome支持这么做](https://developers.google.com/web/updates/2017/12/modulepreload):

```html
<link rel="modulepreload" href="/modern.js">  
<script type=module>self.modern=1</script>  
  
```

**其实预加载这种技术是否有效，取决于嵌入你的脚本的HTML文档的大小**。

如果你的HTML载荷很小, 比如只是一个启动屏或者只是简单启动客户端应用，那么放弃预加载扫描对你的应用性能影响很小。
如果你的应用使用服务器渲染大量有意义的HTML, 并以流(stream)的方式传输给浏览器，那么预加载扫描就是你的朋友，但这也未必是最佳方法。

> 译注: 现代浏览器都支持分块编码传输，等服务端完全输出html可能有一段空闲时间，这时候可以通过预加载技术，让浏览器预先去请求资源

大概代码如下:

```html
<link rel="modulepreload" href="/modern.js">  
<script type=module>self.modern=1</script>  
<script>  
  $loadjs("/modern.js","/legacy.js")
  function $loadjs(e,d,c){c=document.createElement("script"),self.modern?(c.src=e,c.type="module"):c.src=d,document.head.appendChild(c)}
</script>  
```

还要指出的是，支持[JS模块的浏览器](https://caniuse.com/#feat=es6-module)一般也[支持](https://caniuse.com/#feat=link-rel-preload)`<link rel = preload>`。对于某些网站，相比依靠`modulepreload`, 使用`<link rel=preload as=script crossorigin>`可能更有意义。不过性能上面可能欠点，因为传统的脚本预加载不会像`modulepreload`一样随着时间的推移而去展开解析工作(`rel=preload`只是下载，不会尝试去解析脚本)。

<br>

## 选项2: 用户代理嗅探

我办法拿出一个简洁的代码示例，因为用户代理检测不在本文的范围之内，推荐阅读这篇[Smashing Magazine文章](https://www.smashingmagazine.com/2018/10/smart-bundling-legacy-code-browsers/)

本质上，**这种技术在每个浏览器上都使用`<script src=bundle.js>`来加载代码，当`bundle.js`被请求时，服务器会解析浏览器的用户代理，并选择返回现代代码还是传统代码，取决于浏览器是否能被识别为现代浏览器**.

尽管这种方法比较通用，但它也有一些严重的缺点：

- 因为依赖于服务端实现，所以前端资源不能被静态部署(例如静态网站生成器(如github page)，Netlify等等)
- 很难进行有效的缓存. 现在这些JavaScript URL的缓存会因用户代理而异，这是非常不稳定的, 而很多缓存机制只是将URL作为缓存键，现在这些缓存中间件可能就没办法工作了。
- UA检测很难，容易出现误报
- 用户代理字符串容易被篡改，而且每天都有新的UA出现

解决这些限制的一种方法就是**将`module/nomodule模式`与'用户代理区分'结合起来**，首先这可以避免单纯的`module/nomodule模式`需要发送多个软件包问题，尽管这种方法仍然会降低页面(这时候指HTML，而不是Javascript包)的可缓存性，但是它可以有效地触发预加载，因为生成HTML的服务器根据用户代理知道应该使用`modulepreload`还是`preload`:

```js
function renderPage(request, response) {  
  let html = `<html><head>...`;

  const agent = request.headers.userAgent;
  const isModern = userAgent.isModern(agent);
  if (isModern) {
    html += `
      <link rel=modulepreload href=modern.mjs>
      <script type=module src=modern.mjs></script>
    `;
  } else {
    html += `
      <link rel=preload as=script href=legacy.js>
      <script src=legacy.js></script>
    `;
  }

  response.end(html);
}
```

对于那些已经在使用服务端渲染的网站来说，用户代理嗅探是一个比较有效的解决方案

<br>

## 选项 3:不考虑旧版本浏览器

**注意这里的‘旧版本浏览器’特指那些出现双重加载的浏览器**. 对于`module/nomodule模式`支持比较差(即双重加载)的主要是一些旧版本的Chrome、Firefox和Safari. 幸运的是这部分浏览器的市场范围通常是比较窄，因为用户会自动升级到最新的版本。Edge 16-18是例外, 但还有希望： 新版本的Edge会使用基于Chromium的渲染器，可以不受该问题的影响.

对于某些应用程序来说，接受这一点妥协是完全合理的：你可以给90％的浏览器中提供现代代码，让他们获得更好的体验，而极少数旧浏览器不得不抛弃它们，它们只是付出的额外带宽(即双重加载)，并不影响功能。值得注意的是，占据移动端主要市场份额的用户代理不会有双重加载问题，所以这些流量不太可能来自于低速或者高昂流量费的手机。

如果你的网站用户主要使用移动设备或较新版本的浏览器，那么最简单的`module/nomodule`模式将适用于你的绝大多数用户, 其他用户就不考虑了，反正也是可以跑起来的, 优先考虑大多数用户的体验。

```html
  
<script type=module>  
!function(e,t,n){!("noModule"in(t=e.createElement("script")))&&"onbeforeload"in t&&(n=!1,e.addEventListener("beforeload",function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()},!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove())}(document)
</script>

  
<script src=modern.js type=module></script>

  
  
<script src=legacy.js nomodule async defer></script>  
```

<br>

## 选项 4: 使用条件包

**`nomodule`可以巧妙地用来*条件加载*那些现代浏览器不需要的代码**， 例如polyfills。通过这种方法，最坏的情况就是polyfill和bundle都会被加载(例如Safari 10.1)，但这毕竟是少数。鉴于目前通行的做法就是在所有浏览器中一致同仁地加载polyfills，相比而言, *条件polyfills*可以让大部分现代浏览器用户避免加载polyfill代码。

```html
  
<script nomodule src="polyfills.js"></script>

  
<script src="/bundle.js"></script>  
```

Angular CLI支持配置这种方式来加载polyfill, 查看[Minko Gechev的代码示例](https://blog.mgechev.com/2019/02/06/5-angular-cli-features/#conditional-polyfill-serving).
了解了这种方式之后，我决定在preact-cli中支持自动polyfill注入，你可以查看这个[PR](https://github.com/preactjs/preact-cli/pull/833/files)

如果你使用Webpack，这里有一个html-webpack-plugin[插件](https://github.com/swimmadude66/webpack-nomodule-plugin)可以方便地为polyfill包添加`nomodule`属性.

<br>

## 你应该怎么做?

答案取决于你的使用场景, 选择和你们的架构匹配的选项:
如果你的应用只是客户端渲染, 而且你的HTML不超过一个`<script>`，选项1比较合适；
如果你的应用使用服务端渲染，而且可以接受缓存问题，那么可以选择选项2；
如果你开发的是[同构应用](https://developers.google.com/web/updates/2019/02/rendering-on-the-web#rehydration)，预加载的功能可能对你很重要，这时你可以考虑选项3和4.

就我个人而言，相比考虑桌面端浏览器资源下载成本，我更倾向于优化移动设备解析时间. 移动用户体验会受到数据解析、流量费用，电池消耗等因素的影响，而桌面用户往往不需要考虑这些因素。
另外这些优化适用于90%的用户，比如我工作面对的大部分用户都是使用现代或移动浏览器的。

<br>

## 扩展阅读

有兴趣继续深入？可以从下面的文章开始挖掘：

- Phil的[webpack-esnext-boilerplate](https://github.com/philipwalton/webpack-esnext-boilerplate/issues/1)的一些附加的背景.
- Ralph[在Next.js中实现了module/nomodule](https://github.com/zeit/next.js/pull/7704), 并努力解决了上面的问题.

感谢[Phil](https://twitter.com/philwalton), [Shubhie](https://twitter.com/shubhie), [Alex](https://twitter.com/atcastle), [Houssein](https://twitter.com/hdjirdeh), [Ralph](https://twitter.com/Janicklas) 以及 [Addy](https://twitter.com/addyosmani) 的反馈.