---
title: '编写跨运行时的 JavaScript 程序'
date: 2023/9/12
categories: 前端
---

![Cover](https://bobi.ink/images/cross-runtime/Untitled.jpeg)

前端技术百花齐放，但割裂也是全方位的：

- 小程序。小程序是中国特色
- 视图框架： React、Vue 等视图框架割据。甚至框架大版本升级也会进一步造成割裂。前有 Angular、后有 Vue 2/3、现在 React RSC 也饱受争议
- 服务端 vs 客户端。随着 SSR 以及全栈框架的流行，前端需要考虑编写服务端/客户端的同构代码，即 Write Once, Run on Both Client and Server。那 React Server Component 的 ‘use client’、’use server’ 的写法可能会进一步加剧这种心智负担
- 浏览器兼容性。浏览器兼容性适配是每个前端开发者必备的技能，现在很多开发者都不知道那个被 IE 蹂躏的年代。
- npm、yarn、pnpm、pnpm 7、8… bun！
- Webpack、Vite…
- …

<br>
<br>

前端一年，人间三年，技术迭代之快，一般人还真的很难跟上。前端开发者似乎一直摆脱不了’兼容性‘、’跨平台‘、碎片化的这些话题。

不过也有好的一面，这恰巧说明它生命力非常旺盛，前端开发的边界也一而再地被拓宽，打脸了前端已死的论调。

在 JavaScript 运行时（Runtime）领域，近些年也诞生了若干个 Node.js 的挑战者，比如 Deno、Bun…

<br>
<br>

# Deno，Destroy Node?

Deno 和 Node.js 的创造者都是 Ryan Dahl， 如果说 Nodejs 是奥创，那个 Deno 就是为了打败奥创而发明的“幻视”。

从它的名字就可以看出，它的目标就是为了解决 Node.js 的设计缺陷。

![Deno](https://bobi.ink/images/cross-runtime/Untitled.png)

<br>

Deno 一开始主打的特性是： 安全、开箱即用的 Typescript 支持、去中心化的模块、支持标准的 [Web API](https://deno.land/manual@v1.36.4/runtime/web_platform_apis)、性能(基于 Rust)、完整的开发工具链(单元测试、格式化、检查等)

![Deno 对标法](https://bobi.ink/images/cross-runtime/Untitled%201.png)

Deno 对标法

<br>
<br>

但是仅凭这些在 Node.js 庞大的生态市场面前，就是蚍蜉撼树:

![事实对标法](https://bobi.ink/images/cross-runtime/Untitled%202.png)

事实对标法

<br>

所以，Deno 还是向现实低了头，在 Deno 1.28 开始就支持导入 npm 模块、Node.js 内置模块：

```jsx
import { readFileSync } from 'node:fs'

console.log(readFileSync('deno.json', { encoding: 'utf8' }))
```

<br>

Deno 作为一个二次创造的‘轮子’，自然在设计上、开发者体验上面要更加优秀。

除了从历史失败的设计中吸取的教训，它也从其他编程语言，譬如 Rust、Go 借鉴了一些设计和工程理念。

比如在设计方面，去中心化的模块加载、安全模型、向 Web 标准 API 看齐、开箱即用的 Typescript；

在工程化方面则体现在内置单元测试、基准测试、格式化、文档生成、打包成可执行文件。

<br>

在当前被各种‘过度’工程化蹂躏的阶段，显得难得可贵。

![Nextjs 的配置地狱](https://bobi.ink/images/cross-runtime/Untitled%203.png)

Nextjs 的配置地狱

<br>
<br>

我觉得，另外一个比较重要的亮点就是向 Web 标准 API 看齐。和浏览器兼容是 Deno 的目标之一

比如支持使用 URL 来加载模块；还有一些看起来在服务端用不上的 API，如 Location、Navigator、localStorage，甚至还有 window

![Untitled](https://bobi.ink/images/cross-runtime/Untitled%204.png)

Web 标准 API 经过更加严格的设计，在质量和稳定性上都要较高的保证。

上文我们也提到了客户端/服务端的同构应用的开发，会给开发者带来额外的心智负担，那么对齐浏览器和服务端的 API 就可以缩小这个 Gap, 降低学习成本。

<br>

还有一个重要的意义如本文标题所示 —— 跨平台。

不管是运行在浏览器、Worker、 Node.js、Deno、Bun、小程序的逻辑线程、还是各种云服务厂商提供的边缘计算运行时(`Edge Runtime`, 例如 [Vercel Edge Function](https://vercel.com/docs/functions/edge-functions)、[Cloudflare Workers](https://developers.cloudflare.com/workers/learning/how-workers-works/))、Serverless 运行时。Web 标准 API 将会是那条最低“水位线”

![Untitled](https://bobi.ink/images/cross-runtime/Untitled%205.png)

<br>

很多边缘计算/Serverless 运行时，出于轻量化和安全性考虑，仅支持部分 Web 标准 API。

![不同运行时的对比，来源 Nextjs 官网](https://bobi.ink/images/cross-runtime/Untitled%206.png)

不同运行时的对比，来源 Nextjs 官网

虽然现在各种 runtime 比较割裂， 不过我相信未来它们将走向统一的道路，谁能担此重任？

现在还不清楚，可能是 Bun、可能是 Deno，也有可能还是 Nodejs 吞并了其他竞争者，毕竟它也不是停滞不前(下文会详细介绍) 。

**但不管怎样， Web Standard API 将在这个统一的道路上扮演重要的角色**。

<br>
<br>

---

<br>
<br>

# Bun 1.0！

再看看 Bun，包子!

![07C5246A-E844-4C00-8CB8-35DFA850B9BE.jpeg](https://bobi.ink/images/cross-runtime/07C5246A-E844-4C00-8CB8-35DFA850B9BE.jpeg)

它也才发布一年多，在我落笔的此刻，它刚好也发布了 1.0 版本。

<br>

它的宣传点就是 —— 快

![Untitled](https://bobi.ink/images/cross-runtime/Untitled%207.png)

它的目的很简单，就是为了取代 Node.js，就是要提供一个更快的运行时，消灭现在复杂的开发乱象。同时尽量不影响现有的框架和程序的运行（兼容 Node.js）

用"兼容并包"来描述它最好不过，比如它同时支持 ESM 和 CommonJS，甚至允许这两个模块在一个文件中并存，而现在主流的观点是 CommonJS 是一个过时的技术。

<br>

因此除了作为运行时，开箱支持 Typescript 之外。他还将提供比 Deno 更丰富的工具链：

- 包管理器。扬言要取代 pnpm、yarn、npm
- 打包工具。拳打 Vite、脚踢 rollup、深度碾压 Webpack
- 测试运行器。Vitest、Jest 在它面前就是弟弟
- …

大有一番一统天下的架势（取代 Node、npm、webpack、jest 等）。不过是不是‘大杂烩’， 能不能吃得下这么多大饼还不确定，交给时间去验证吧！

<br>
<br>

---

<br>
<br>

# Node 变得越来越好

不管是 Deno、还是后来的搅局者 Bun。我们可以发现一些趋势：

- 除了核心的运行时，他们还花了很多精力打造一套开箱即用、开发工具链，更加注重开发体验。
- 更加注重香 Web 标准 API 对齐。

<br>
<br>

有了这些鲶鱼，Node.js 也不是等着挨打的，这不：

- 20.0
  - 内置支持 .env 文件，`node --env-file=config.env index.js`
  - 支持 await using
  - 加入了实验性的权限模型，借鉴 Deno
  - 单元测试运行器稳定了。Node 可以直接写单元测试了
  - Web Crypto API
  - 性能优化
- 19.0
  - 支持 `—watch` ，可以取代 nodemon
- 18.0
  - Web Streams API
  - 引入实验性的单元测试运行器
  - 引入实验性的 watch mode
  - 支持 `File` 类
  - 支持编译从单文件可执行文件
  - 引入 Web Crypto API
  - 引入实验性的 [ESM Loader Hooks API](https://dev.to/jakobjingleheimer/custom-esm-loaders-who-what-when-where-why-how-4i1o)
- 17.0
  - 引入实验性的 fetch
  - 支持 JSON Import assertions
  - readline 模块支持 Promise API
- 16.0
  - Timer Promise API
  - 引入实验性的 `Web Streams API`
  - 引入 Corepack
  - Importing JSON modules now requires experimental import assertions syntax
  - 新增 `util.parseArgs` 可以解析命令行参数
  - 新增 `--experimental-network-imports` 可以像 Deno 一样导入 HTTP/HTTPS 模块
- 14.0
  - 正式支持 ECMAScript Modules
  - 支持 **Top-Level Await**
  - 支持 EventTarget
  - 实验性的 AsyncLocalStorage
  - 支持 **`AbortController`  和`AbortSignal`**
- …

<br>
<br>

Node.js 正在变得更加‘现代’，尤其是近几个版本不乏有 Web API、工具链、性能优化这些更新。

所以，不管你用不用 Deno、Bun, 都要感谢它们让 Node 变得越来越好用。

与此同时，通过这些变化趋势，我们可以推测这些运行时会变得越来越同质化。卷嘛

<br>
<br>

---

<br>
<br>

# 编写跨运行时程序 —— Web Standard API

随着运行时的百花齐放, 越来越多的现代的前端‘框架’ 都避免自己和 Node.js 直接耦合。

比如 Remix、Qwik、Astro、SvelteKit…

<br>

![qwik 支持的部署平台](https://bobi.ink/images/cross-runtime/Untitled%208.png)

qwik 支持的部署平台

![SvelteKit 各种平台的适配器](https://bobi.ink/images/cross-runtime/Untitled%209.png)

SvelteKit 各种平台的适配器

<br>

![Astro 不建议你直接使用 Node.js API](https://bobi.ink/images/cross-runtime/Untitled%2010.png)

Astro 不建议你直接使用 Node.js API

<br>

在 `Next.js` 下，为了支持你的程序跑在不同的运行时上，也强加了一些约束，比如：

- Middleware 的 request、response 继承自 Request 和 Response，只能进行非常有限的逻辑处理
- Route Handler 使用的就是 Web Request / Response API
  ```jsx
  import { cookies } from 'next/headers'

  export async function GET(request: Request) {
    const cookieStore = cookies()
    const token = cookieStore.get('token')

    return new Response('Hello, Next.js!', {
      status: 200,
      headers: { 'Set-Cookie': `token=${token.value}` },
    })
  }
  ```
- page 和 layout 支持指定 runtime, 如果是 edge 只能使用[受限的 Web API](https://nextjs.org/docs/app/api-reference/edge)。Next.js 在构建时会严格检查你是否使用非法 API.
  ```jsx
  // app/page.tsx
  // ❌ fs/promises 模块找不到
  import fs from 'fs/promises'

  export const runtime = 'edge'

  export default async function Home() {
    const content = await fs.readFile('package.json', 'utf-8')
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        {content}
      </main>
    )
  }
  ```

<br>
<br>

---

<br>

**自‘[去 JavaScript](https://juejin.cn/post/7241027834490437669)’ 之后，似乎 ’去 Node.js’ 也是一波潜在的小趋势**。

<br>

而编写跨运行时的 JavaScript 程序的秘诀在于：**尽量往 Web Standard API 靠拢，比如：**

- 在设计服务端程序时，优先使用 `Request`、`Response` 、`URL`、`Blob` 这些 Web API 来响应 HTTP 请求；
- 使用 `fetch` 、`WebSocket` 进行网络请求；
- 文件系统操作可以使用 `File API`、`File System API`、`Web Stream API`；
- 使用 `Worker` 跑多线程任务；
- 还有强大的 `WebAssembly` …

<br>

当然，目前 Web API 的还是功能太弱了，毕竟不是专门为服务端设计的，很难覆盖复杂的需求。因此短期内 Node.js 还难以撼动，JavaScript 运行时领域也还会继续内卷。

<br>

期待有一天 Web Standard API 能一统天下，那时候就无所谓 Deno、Bun、还是 Node 了。

<br>
<br>
<br>

# 扩展阅读

- [Vercel Edge Runtime](https://vercel.com/docs/functions/edge-functions/edge-runtime)
- [Deno Web Platform APIs](https://deno.land/manual@v1.36.4/runtime/web_platform_apis)
- [Custom ESM loaders](https://dev.to/jakobjingleheimer/custom-esm-loaders-who-what-when-where-why-how-4i1o)
- [Nextjs Edge and Node.js Runtimes](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
