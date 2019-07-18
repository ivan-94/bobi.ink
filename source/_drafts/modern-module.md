---
title: "现代script的加载"
date: 2019/7/17
categories: 前端
---

前置知识: [如何在生产环境中部署ES2015+](https://jdc.jd.com/archives/4911)

> Serving the right code to the right browsers can be tricky. Here are some options.

> 给正确的浏览器配备正确代码是一件棘手的事情。本文会介绍几种方式

Serving modern code to modern browsers can be great for performance. Your JavaScript bundles can contain more compact or optimized modern syntax, while still supporting older browsers.

给现代浏览器伺服现代的代码可以对性能有很大的帮助。你的Javascript包只需包含紧凑和优化的现代语法，同时保持对就浏览器的支持

The tooling ecosystem has consolidated on using the module/nomodule pattern for declaratively loading modern VS legacy code, which provides browsers with both sources and lets them decide which to use:

现有的工具生态系统在`module/nomodule模式`上整合的， 它使用声明式地加载现代和传统代码，即给浏览器提供两个源代码，让它来决定用哪个

```html
<script type="module" src="/modern.js"></script>  
<script nomodule src="/legacy.js"></script>  
```

Unfortunately, it's not quite that straightforward. The HTML-based approach shown above triggers over-fetching of scripts in Edge and Safari.

现实是骨感的，没我们想象地那么简单直接。上面基于HTML的方式在Edge和Safari会触发两次请求!

## What can we do?

What can we do? We want to deliver two compile targets depending on the browser, but a couple older browsers don't quite support the nice clean syntax for doing so.

怎么办？我们想根据浏览器来传输两个编译文件，但是一些旧浏览器并不能优雅地支持。

First, there's the Safari Fix. Safari 10.1 supports JS Modules not the nomodule attribute on scripts, which causes it to execute both the modern and legacy code (yikes!). Thankfully, Sam found a way to use a non-standard beforeload event supported in Safari 10 & 11 to polyfill nomodule.

首先，有Safari修复程序。 Safari 10.1开始支持JS模块, 但不支持nomodule属性，这使得它可以执行现代和遗留代码（yikes！）。值得庆幸的是，Sam还找到了一种方法，可以使用Safari 10和11中非标准的beforeload事件来polyfill nomodule.

## Option 1: Load Dynamically

We can circumvent these issues by implementing a tiny script loader, similar to how LoadCSS works. Instead of relying on browsers to implement both ES Modules and the nomodule attribute, we can attempt to execute a Module script as a "litmus test", then use the result of that test to choose whether to load modern or legacy code.

我们可以实现一个小型script加载器来规避这些问题，工作原理类似于LoadCSS。只不过这里依靠浏览器的ES Module和nomodule属性，首先我们尝试执行一个模块script进行石蕊试验, 然后用这个试验的结果来选择加载现代代码还是传统代码

```html
<!-- use a module script to detect modern browsers: -->  
<!-- 使用一个模块script来检测现代浏览器 -->  
<script type=module>  
  self.modern = true
</script>

<!-- now use that flag to load modern VS legacy code: -->  
<!-- 现在根据这个检测结果来决定加载现代代码还是传统代码: -->  
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

However, this solution requires waiting until our first "litmus test" module script has run /before it can inject the correct script. This is because `<script type=module>` is always asynchronous. There is a better way!

然而，这个解决方案必须等待‘石蕊试验’模块script执行完成才能注入正确的script。这是因为`<script type=module>`始终是异步的，别无它法。

A standalone variant of this can be implemented by checking if the browser supports nomodule. This would mean browsers like Safari 10.1 are treated as legacy even though they support Modules, but that might be a good thing. Here's the code for that:

另一种实现方式是检查浏览器是否支持`nomodule`, 不过这意味着像Safari 10.1这些支持模块的浏览器也会被当做传统浏览器，也许这是好事，代码如下:

```js
var s = document.createElement('script')  
if ('noModule' in s) {  // notice the casing  
  s.type = 'module'
  s.src = '/modern.js'
}
else  
  s.src = '/legacy.js'
}
document.head.appendChild(s)  
```

This can be quickly rolled into a function that loads modern or legacy code, and also ensures both are loaded asynchronously:

把它们封装成函数来加载现代代码和传统代码，并确保传统代码也是异步加载的(和模块代码保持一致)

```html
<script>  
  $loadjs("/modern.js","/legacy.js")
  function $loadjs(src,fallback,s) {
    s = document.createElement('script')
    if ('noModule' in s) s.type = 'module', s.src = src
    else s.async = true, s.src = fallback
    document.head.appendChild(s)
  }
</script>  
```

What's the trade-off? preloading.

怎么适配预加载呢(preloading)?

The trouble with this solution is that, because it's completely dynamic, the browser won't be able to discover our JavaScript resources until it runs the bootstrapping code we wrote to inject modern vs legacy scripts. Normally, browsers scan HTML as it is being streamed to look for resources they can preload. There's a solution, though it's not perfect: we can use <link rel=modulepreload> to preload the modern version of a bundle in modern browsers. Unfortunately, only Chrome supports modulepreload so far.

这个有点蛋疼，因为这是完全动态的，浏览器在没有运行我们上面的脚本之前，是没办法发现我们的Javascript资源的。因为一般浏览器会扫描HTML，然后查找它可以预加载的资源。

有一个解决办法，但是不完美：就是使用`<link rel=modulepreload>`来预加载现代版本的包，然后，目前只有Chrome支持这么做:

```html
<link rel="modulepreload" href="/modern.js">  
<script type=module>self.modern=1</script>  
<!-- etc -->  
```

Whether this technique works for you can come down to the size of the HTML document you're embedding those scripts into. If your HTML payload is as small as a splash screen or just enough to bootstrap a client-side application, giving up the preload scanner is less likely to impact performance. If you are server-rendering a lot of meaningful HTML for the browser to stream, the preload scanner is your friend and this might not be the best approach for you.


这种技术是否适用于您可以归结为您将这些脚本嵌入到的HTML文档的大小。如果您的HTML有效负载与启动屏幕一样小，或者足以引导客户端应用程序，则放弃预加载扫描程序不太可能影响性能。如果您是服务器渲染大量有意义的HTML以供浏览器流式传输，那么预加载扫描程序就是您的朋友，这可能不是您的最佳方法。

Here's what this solution might look like in prod:

```
<link rel="modulepreload" href="/modern.js">  
<script type=module>self.modern=1</script>  
<script>  
  $loadjs("/modern.js","/legacy.js")
  function $loadjs(e,d,c){c=document.createElement("script"),self.modern?(c.src=e,c.type="module"):c.src=d,document.head.appendChild(c)}
</script>  
```

It's also be pointed out that the set of browsers supporting JS Modules is quite similar to those that support <link rel=preload>. For some websites, it might make sense to use <link rel=preload as=script crossorigin> rather than relying on modulepreload. This may have performance drawbacks, since classic script preloading doesn't spread parsing work out over time as well as modulepreload.


还要指出的是，支持JS模块的浏览器集与支持<link rel = preload>的浏览器非常相似。对于某些网站，使用<link rel = preload as = script crossorigin>而不是依赖于modulepreload可能是有意义的。这可能有性能上的缺点，因为经典脚本预加载不会随着时间的推移而扩展解析工作以及模块预加载。

## Option 2: User Agent Sniffing

I don't have a concise code sample for this since User Agent detection is nontrivial, but there's a great Smashing Magazine article about it.

我没有一个简洁的代码示例，因为用户代理检测对本文来说不重要，可以参考这篇[Smashing Magazine文章](https://www.smashingmagazine.com/2018/10/smart-bundling-legacy-code-browsers/)

Essentially, this technique starts with the same <script src=bundle.js> in the HTML for all browsers. When bundle.js is requested, the server parses the requesting browser's User Agent string and chooses whether to return modern or legacy JavaScript, depending on whether that browser is recognized as modern or not.

本质上，这种技术在每个浏览器上都使用`<script src=bundle.js>`来加载代码，当`bundle.js`被请求时，服务器会解析浏览器的用户代理，并选择返回现代代码还是传统代码，取决于浏览器是否能被识别为现代浏览器.

While this approach is versatile, it comes with some severe implications:

尽管这种方法是通用的，但它带来了一些严重的影响：

- since server smarts are required, this doesn't work for static deployment (static site generators, Netlify, etc)
- caching for those JavaScript URLs now varies based on User Agent, which is highly volatile
- UA detection is difficult and can be prone to false classification
- the User Agent string is easily spoofable and new UA's arrive daily

- 因为依赖于服务端实现，所以前端资源不能被静态部署(例如静态网站生成器(如github page)，Netlify等等)
- 现在对这些JavaScript URL的缓存会因用户代理而异，这是非常不稳定的
- UA检测很困难，容易出现误报
- 用户代理字符串很容易被欺骗，每天都有新的UA出现

One way to address these limitations is to combine the module/nomodule pattern with User Agent differentiation in order to avoid sending multiple bundle versions in the first place. This approach still reduces cacheability of the page, but allows for effective preloading, since the server generating our HTML knows whether to use modulepreload or preload.


解决这些限制的一种方法是将模块/模块模式与用户代理区分相结合，以避免首先发送多个软件包版本。这种方法仍然会降低页面的可缓存性，但允许有效的预加载，因为生成HTML的服务器知道是使用modulepreload还是preload

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

For websites already generating HTML on the server in response to each request, this can be an effective solution for modern script loading.

## Option 3: Penalize older browsers

The ill-effects of the module/nomodule pattern are seen in old versions of Chrome, Firefox and Safari - browser versions with very limited usage, since users are automatically updated to the latest version. This doesn't hold true for Edge 16-18, but there is hope: new versions of Edge will use a Chromium-based renderer that doesn't suffer from this issue.

It might be perfectly reasonable for some applications to accept this as a trade-off: you get to deliver modern code to 90% of browsers, at the expense of some extra bandwidth on older browsers. Notably, none of the User Agents suffering from this over-fetching issue have significant mobile market share - so those bytes are less likely to be coming from an expensive mobile plan or through a device with a slow processor.

If you're building a site where your users are primarily on mobile or recent browsers, the simplest form of the module/nomodule pattern will work for the vast majority of your users. Just be sure to include the Safari 10.1 fix if you have usage from slightly older iOS devices.

<!-- polyfill `nomodule` in Safari 10.1: -->  
<script type=module>  
!function(e,t,n){!("noModule"in(t=e.createElement("script")))&&"onbeforeload"in t&&(n=!1,e.addEventListener("beforeload",function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()},!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove())}(document)
</script>

<!-- 90+% of browsers: -->  
<script src=modern.js type=module></script>

<!-- IE, Edge <16, Safari <10.1, old desktop: -->  
<script src=legacy.js nomodule async defer></script>  

## Option 4: Use conditional bundles

One clever approach here is to use nomodule to conditionally load bundles containing code that isn't needed in modern browsers, such as polyfills. With this approach, the worst-case is that the polyfills are loaded or possibly even executed (in Safari 10.1), but the effect is limited to "over-polyfilling". Given that the current prevailing approach is to load and execute polyfills in all browsers, this can be a net improvement.

<!-- newer browsers won't load this bundle: -->  
<script nomodule src="polyfills.js"></script>

<!-- all browsers load this one: -->  
<script src="/bundle.js"></script>  
Angular CLI can be configured to use this approach for polyfills, as demonstrated by Minko Gechev. After reading about this approach, I realized we could switch the automatic polyfill injection in preact-cli to use it - this PR shows how easy it can be to adopt the technique.

For those using Webpack, there's a handy plugin for html-webpack-plugin that makes it easy to add nomodule to polyfill bundles.

What should you do?
The answer depends on your use-case. If you're building a client-side application and your app's HTML payload is little more than a <script>, you might find Option 1 to be compelling. If you're building a server-rendered website and can afford the caching impact, Option 2 could be for you. If you're using universal rendering, the performance benefits offered by preload scanning might be very important, and you look to Option 3 or Option 4. Choose what fits your architecture.

Personally, I tend to make the decision to optimize for faster parse times on mobile rather than the download cost on some desktop browsers. Mobile users experience parsing and data costs as actual expenses - battery drain and data fees - whereas desktop users don't tend to have these constraints. Plus, it's optimizing for the 90% - for the stuff I work on, most users are on modern and/or mobile browsers.

Further Reading

Interested in diving deeper into this space? Here's some places to start digging:

There's some great additional context on Phil's webpack-esnext-boilerplate.

Ralph implemented module/nomodule in Next.js, and is working on solving these issues there.

Thanks to Phil, Shubhie, Alex, Houssein, Ralph and Addy for the feedback.