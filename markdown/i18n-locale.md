---
title: '前端国际化：语言包篇'
date: 2023/8/8
categories: 前端
---

<br>


![Untitled](%E5%89%8D%E7%AB%AF%E5%9B%BD%E9%99%85%E5%8C%96%EF%BC%9A%E8%AF%AD%E8%A8%80%E5%8C%85%E7%AF%87%200f049c986a414a98a2c51a739f9a7378/Untitled.png)

又开了个新坑，来讲讲前端国际化。

开篇之前，读者需要区分好`国际化`(i18n - internationalization)和`本地化`(l10n - localization) ， 它们是相互关联但又不同的概念：

1. 国际化（i18n）：这是一个设计和开发过程，确保产品（如软件、网站或应用）能够在不做任何修改的情况下适应不同的语言和地区。这涉及到从一开始就预留空间用于文本扩展，确保日期和时间格式可以根据地区变化，以及确保代码可以处理不同的字符集和写作系统等。
2. 本地化（L10n）：这是将产品或内容适应到特定市场的过程。这可能包括将文本翻译成本地语言，调整图像和色彩以适应本地文化，以及修改日期、电话号码和地址格式等。本地化可能还需要考虑本地法规和商业习惯。

简单来说，国际化是创建一个可以轻易本地化的产品的过程，而本地化是将产品调整以适应特定地区的过程。两者在实际产品中的边界可能比没有那么清晰，而是相辅相成，通常在大的国际化基座上进一步进行本地化,。

国际化的涉及面非常广，比如语言、文字编码、时区、书写习惯、单复数、标点符号、时间格式、货币格式、计量单位…   

强烈推荐读者读一下 [基础设计专栏 - From.RED](https://www.zhihu.com/column/txtwork) 这个专栏，这里面一系列的国际化/本地化的文章都非常赞：

- [为全球设计，国际化与本地化探索：快速入门](https://zhuanlan.zhihu.com/p/29759116)
- [为全球设计，国际化与本地化探索：国际化设计](https://zhuanlan.zhihu.com/p/29780850)
- [为全球设计，国际化与本地化探索：本地化设计](https://zhuanlan.zhihu.com/p/31025276)

实际上笔者也不是特别专业，这系列文章仅是我的一些技术实践总结。作为开篇，我们先聊一聊一些比较基础的话题：前端语言包的管理。

对于语言包的管理，我们大概率会遇到以下问题：

- 语言包应该放在哪个目录？
- 全局使用一个语言包，还是分模块？
- 如果是分模块的话？粒度怎么把握?
- 怎么实现按需加载？Web 端？小程序端？
- 如果分模块组织，碎片化的语言包会不会导致多个请求？
- 如何管理和分析语言包的使用？
- 还有哪些建议？

如果进一步归纳，这些问题又可以分为三大类：

# 1. 组织语言包

## 1.1 放在哪个目录下？

通常放在 `locales`  或者 `i18n` 目录下。比如：

```bash
/src
  /locales
    zh.json
    zh-Hant.json
    en.json
    th.json
```

我们团队的规范是使用 `*.tr` 来作为语言包，例如：

```bash
/src
  /locales
    zh.tr
    zh-Hant.tr
    en.tr
    th.tr
```

`tr` 即 `translate` 的缩写， 这么做的目的主要为了和 `json` 文件区分开，方便后面的构建工具识别。

当然还有其他手段可以实现，但在本篇文章中我们统一约定使用 `.tr` 作为语言包文件。

> 💡 VSCode 中加上以下配置，可以将 tr 文件识别为 `JSON`:
> 
> 
> ```json
> // .vscode/settings.json
> {
>   "files.associations": {
>     "*.tr": "json"
>   },
> }
> ```
> 

## 1.2 全局使用一个语言包，还是分模块？

我们推荐`按照业务来聚合'实现'`，大部分情况不应该将所有的语言包一股脑放在一起，除非你的项目比较简单。换句话说，应该遵循`就近原则`，Global is Evil。

比如 MonoRepo 项目：

```bash
packages
  ├── pkgA
  |   └── i18n
  |       ├── en.tr
  |       ├── zh.tr
  |       └── ...
  ├── pkgB
  |   └── i18n
  |       ├── en.tr
  |       ├── zh.tr
  |       └── ...
  └── ...
```

**分模块的好处是维护起来相对容易，尤其是后期迁移和重构时。另外一个好处是可以根据模块按需加载。**

## 1.3 如果是分模块的话？粒度怎么把握?

为了平衡加载速度、可维护性，翻译文件不能过小、也不能过大。通常按照`业务模块`的粒度来划分。**业务模块是由一个或多个页面组成的完整的功能。**

![图片来源: [https://time.geekbang.org/column/intro/100037301](https://time.geekbang.org/column/intro/100037301)](%E5%89%8D%E7%AB%AF%E5%9B%BD%E9%99%85%E5%8C%96%EF%BC%9A%E8%AF%AD%E8%A8%80%E5%8C%85%E7%AF%87%200f049c986a414a98a2c51a739f9a7378/Untitled%201.png)

图片来源: [https://time.geekbang.org/column/intro/100037301](https://time.geekbang.org/column/intro/100037301)

如果按照 DDD 的说法，业务模块可以是一个`子域`、甚至更小粒度的`聚合`。总之这个业务模块有以下特征：

- 自包含。自给自足实现一个完整的功能闭环
- 高聚合。对外部依赖较少。

读者也不用过于纠结，实际在业务开发时，随着对需求了解的深入，你会摸索到它们的边界，或者你也可以从其他地方借鉴，比如后端服务的划分、产品需求结构的划分等等。

从代码的实现层面来看，你也可以认为`业务模块`等同于 MonoRepo 的一个`子项目`。尽管子项目内部可能会继续拆分。

---

# 2. 语言包加载

## 2.1 怎么实现按需加载？Web 端？小程序端？

**在 Web 端**，通常通过`动态导入`(Dynamic Import) 实现， 例如：

```jsx
registerBundles({
  zh: () => import('./zh.tr'),
  en: () => import('./en.tr'),
  'zh-Hant': () => import('./zh-Hant.tr'),
  th: () => import('./th.tr'),
});
```

在 Webpack 中无法识别 tr 扩展名，我们扩展一下：

```jsx
// webpack chain
chain.module.rule('translate').test(/\.tr$/).use('json').loader('json-loader').end();
```

使用 `json-loader` 来处理 tr 文件。

**小程序端呢？**

小程序端不支持`动态执行代码`, 所以无法使用`动态导入`， 解决办法就是作为静态资源提取出去，托管到`静态资源服务器` 或 `CDN`中，远程加载:

![Untitled](%E5%89%8D%E7%AB%AF%E5%9B%BD%E9%99%85%E5%8C%96%EF%BC%9A%E8%AF%AD%E8%A8%80%E5%8C%85%E7%AF%87%200f049c986a414a98a2c51a739f9a7378/Untitled%202.png)

以 `Taro` 配置为例

```jsx
// Webpack 5
const generator = {
  filename: fileLoaderOptions.name,
  publicPath: fileLoaderOptions.publicPath,
  outputPath: fileLoaderOptions.outputPath,
};

ctx.modifyWebpackChain(({ chain }) => {
  // 翻译文件提取
  const translation = chain.module.rule('translation').test(/\.tr$/);

  if (process.env.NODE_ENV === 'development') {
    // 🔴 开发环境使用 JSON 引用
    translation.type('json').end();
  } else {
    // 🔴 生产环境 使用 ’file-loader‘ 提取到 CDN 服务器
    translation.type('asset/resource').set('generator', generator).end();

    // 支持 import xx from './test.json?extra' 模式, 强制提取
    chain.module.rule('extra').resourceQuery(/extra/).type('asset/resource').set('generator', generator).end();
  }
})
```

对于开发环境，沿用 json-loader 的方式处理，生产环境则进行[资源提取](https://webpack.js.org/guides/asset-modules/)(等价 Webpack 4 的 url-loader、file-loader)。

小程序语言包声明：

```jsx
registerBundles({
  zh: require('@wakeapp/login-sdk/i18n/zh.tr'),
  'zh-Hant': require('@wakeapp/login-sdk/i18n/zh-Hant.tr'),
  en: require('@wakeapp/login-sdk/i18n/en.tr'),
  th: require('@wakeapp/login-sdk/i18n/th.tr'),
});
```

同样的思路也可以用于小程序的其他静态资源、比如图片、视频、字体等。

## 2.2 如果分模块组织，碎片化的语言包会不会导致多个请求？

![Untitled](%E5%89%8D%E7%AB%AF%E5%9B%BD%E9%99%85%E5%8C%96%EF%BC%9A%E8%AF%AD%E8%A8%80%E5%8C%85%E7%AF%87%200f049c986a414a98a2c51a739f9a7378/Untitled%203.png)

一个屎山项目可能会有很多语言包。如果不干预，就会有很多碎片化的请求, 在不支持 HTTP 2.0 的环境，这些请求会对页面性能造成较大的影响，怎么优化加载呢？

在 Web 端，可以利用 `[splitChunks](https://webpack.js.org/plugins/split-chunks-plugin/#root)` 对语言包进行合并：

```tsx
const TRANSLATE_FILE_REG = /([^./]*)\.tr$/;

function getLocale(request: string) {
  return request.match(TRANSLATE_FILE_REG)?.[1];
}    

// ... 省略部分代码

    // 翻译文件资源合并, 避免碎片化, 导致并发请求数量过多
    if (process.env.NODE_ENV === 'production') {
      const splitChunks = chain.optimization.get('splitChunks');
      if (splitChunks == null) {
        // 已禁用
        return;
      }

      const translateMerge = {
        // 只针对异步模块
        chunks: 'async',
        test: /\.tr$/,
        // 🔴 最大尺寸
        maxSize: 200 * 1024,
        name: (module: { rawRequest: string }) => {
          const request = module.rawRequest;
          if (request == null) {
            throw new Error(`[vue-cli-plugin-i18n]: failed to get locale from ${request}`);
          }
          // 🔴 按 locale 作为 key 进行合并
          return `${getLocale(request)}-tr`;
        },
        // 强制执行
        enforce: true,
      };

      chain.optimization.splitChunks({
        ...splitChunks,
        cacheGroups: {
          ...splitChunks.cacheGroups,
          translateMerge,
        },
      });
    }
```

上面的代码就是使用 splitChunks 对相同 Locale 的语言包进行合并，最大体积不超过 200kb。

小程序端暂时不支持这种方式。可以通过其他手段来弥补，比如人工避免碎片化、缓存到本地存储等等。

## 2.3 registerBundles 怎么实现？

`registerBundles` 负责对语言包进行注册、加载、合并、激活等操作：

![Untitled](%E5%89%8D%E7%AB%AF%E5%9B%BD%E9%99%85%E5%8C%96%EF%BC%9A%E8%AF%AD%E8%A8%80%E5%8C%85%E7%AF%87%200f049c986a414a98a2c51a739f9a7378/Untitled%204.png)

- 调用 `registerBundles` 会将相关语言包注册到`资源表`（Resouces）中。它可以接收对象、HTTP 链接、Promise 等
- 具体要加载哪个语言包由 i18n 库通知。i18n 库传入一个 `Locale chain`, 这是一个字符串数组。表示的是 i18n 库的`语言回退链条`， 或者说 i18n 库就是按照这个顺序到语言包中查找 key，比如当前 locale 是 '`zh-Hant-HK`’， 那么 Locale chain 就是  `['zh-Hant-HK', 'zh-Hant', 'zh']`
- 接着根据 `Locale chain` 计算出需要加载的语言包。
- 根据资源的类型选择不同的`Loader`(加载器)进行处理。比如 `HTTP Loader`、`Promise Loader`
- 当所有语言包加载就绪后，将所有结果合并成一棵树，返回给 i18n。合并时可以有优先级，比如某些语言包从后端服务中获取，我们希望它能覆盖其他语言包，优先展示。

来看一下具体代码：

```tsx
export class BundleRegister {
  private executing = false;

  private resources: { [locale: string]: Set<I18nBundle> } = {};

  private layerLinks: { [locale: string]: LayerLink } = {};

  /**
   * 缓存资源的层级
   */
  private resourceLayer: Map<I18nBundle, number> = new Map();

  private pendingQueue = new PromiseQueue<void>();

  constructor(
    private registerBundle: (locale: string, bundle: Record<string, any>) => void,
    private getLocaleChain: () => string[],
    private onBundleChange: () => void
  ) {}

  /**
   * 判断是否存在正在加载中的语言包
   */
  hasPendingBundle() {}

  /**
   * 调度语言包加载和合并
   */
  async schedulerMerge(): Promise<void> {}

  /**
   * 注册语言包
   */
  registerBundles = async (bundles: { [locale: string]: I18nBundle }, layer: number = 10): Promise<void> => {};
}
```

整个类的结构如上，构造函数需要传入三个钩子：

- registerBundle。 BundleRegister 通过它向  i18n 库提交语言包(message)
- getLocaleChain。向 i18n 获取 local chain
- onBundleChange。语言包变动事件通知

看下在 vue-i18n(9+) 下怎么对接：

```tsx
 // 🔴 初始化
 const bundleRegister = new BundleRegister(
    (loc, bundle) => {
      // 🔴 提交语言包
      const initialMessages = messages?.[loc];
      let cloneBundle = bundle;

      // 拷贝
      if (initialMessages) {
        cloneBundle = merge({}, initialMessages, cloneBundle);
      }

      vueI18nInstance.setLocaleMessage(loc, cloneBundle);
    },
    // 🔴 获取 Local chain
    getFallbackLocaleChain,
    () => {
      eventBus.emit(EVENT_MESSAGE_CHANGE);
    }
  );

  // 🔴 监听语言变动并触发 BundlerRegister 加载
  watch(
    () => unref(vueI18nInstance.locale),
    loc => {
      // 检查是否通过 setLocale 调用
      if (!SET_LOCALE_CONTEXT) {
        console.error(`[i18n] 禁止直接设置 .locale 来设置当前语言， 必须使用 setLocale()`);
      }

      eventBus.emit(EVENT_LOCALE_CHANGE, loc);
      bundleRegister.schedulerMerge();
    },
    { flush: 'sync' }
  );
```

返回来看注册细节。`registerBundles` 就是注册语言包，过程很简单：

```tsx
/**
   * 注册语言包
   */
  registerBundles = async (bundles: { [locale: string]: I18nBundle }, layer: number = 10): Promise<void> => {
    let dirty = false;
    Object.keys(bundles).forEach(k => {
      const normalizedKey = k.toLowerCase();
      // 登记到资源表
      const list = (this.resources[normalizedKey] ??= new Set());
      const bundle = bundles[k];

      const add = (b: I18nBundle) => {
        if (!list.has(b)) {
          list.add(b);
          this.resourceLayer.set(b, layer);
          dirty = true;
        }
      };

      if (Array.isArray(bundle)) {
        for (const child of bundle) {
          add(child);
        }
      } else {
        add(bundle);
      }
    });

    if (dirty) {
      // 🔴 立即调度加载
      return await this.schedulerMerge();
    }
  };
```

相对比较复杂的是 `scheduleMerge`，但也不难理解：

```tsx
  async schedulerMerge(): Promise<void> {
    // 🔴 执行中，不需要重新发起
    if (this.executing) {
      return await this.pendingQueue.push();
    }

    let queue = this.pendingQueue;

    try {
      this.executing = true;

      // 🔴 等待更多 bundle 插入，批量执行
      await Promise.resolve();

      // 🔴 下一批执行
      this.pendingQueue = new PromiseQueue();

      // 🔴 加载当前语言
      const localeChain = this.getLocaleChain();
      
      // 🔴 已经加载的语言
      let messages: { [locale: string]: Record<string, any>[] } = {};
      let task: Promise<void>[] = [];
      
      // 🔴 遍历 localeChain
      for (const locale of localeChain) {
        const resource = this.resources[locale.toLowerCase()];

        if (resource == null) {
          continue;
        }

        for (const bundle of resource.values()) {
          // 🔴 跳过已经加载
          if (isLoaded(bundle)) {
            continue;
          }
          // 🔴 layer 表示语言包的分层，或者说合并的优先级， 层数越低优先级越高
          const layer = this.resourceLayer.get(bundle) ?? DEFAULT_LAYER;

          if (typeof bundle === 'function') {
            // 🔴 异步加载函数
            task.push(
              (async () => {
                const loadedBundle = await asyncModuleLoader(bundle as I18nAsyncBundle);
                if (loadedBundle) {
                  this.setLayer(loadedBundle, layer);
                  console.debug(`[i18n] bundle loaded: `, bundle);
                  (messages[locale] ??= []).push(loadedBundle);
                }
              })()
            );
          } else if (typeof bundle === 'string') {
            // 🔴 http 链接
            task.push(
              (async () => {
                const loadedBundle = await httpLoader(bundle);

                if (loadedBundle) {
                  this.setLayer(loadedBundle, layer);
                  console.debug(`[i18n] bundle loaded: `, bundle);
                  (messages[locale] ??= []).push(loadedBundle);
                }
              })()
            );
          } else {
            // 🔴 直接就是语言包对象
            this.setLayer(bundle, layer);
            (messages[locale] ??= []).push(bundle);
          }

          setLoaded(bundle);
        }
      }

      // 🔴 并发加载
      if (task.length) {
        try {
          await Promise.all(task);
        } catch (err) {
          console.warn(`[i18n] 加载语言包失败:`, err);
        }
      }

      const messageKeys = Object.keys(messages);

      // 🔴 接下来就是将 messages 合并成一棵树
      if (messageKeys.length) {
        const messageToUpdate: { [locale: string]: LayerLink } = {};

        for (const locale of messageKeys) {
          // 🔴 LayerLink 存储了所有已经加载的语言包和他的分层信息
          const layerLink = (this.layerLinks[locale] ??= new LayerLink());

          for (const bundle of messages[locale]) {
            const layer = this.getLayer(bundle);

            layerLink.assignLayer(layer, bundle);
          }

          messageToUpdate[locale] = layerLink;
        }

        // 🔴 触发更新
        for (const locale in messageToUpdate) {
          this.registerBundle(locale, messageToUpdate[locale].flattenLayer());
        }

        this.onBundleChange();
      }
    } catch (err) {
      console.error(`[i18n] 语言包加载失败`, err);
    } finally {
      this.executing = false;
      queue.flushResolve();

      // 🔴 判断是否有新的 bundle 加进来，需要继续调度加载
      if (this.hasUnloadedBundle()) {
        // 继续调度
        this.schedulerMerge();
      } else {
        // 没有了，清空队列不需要继续等待了
        this.pendingQueue.flushResolve();
      }
    }
  }
```

这就是一个典型的异步任务执行的调度过程。相关的[源码可以看这里](https://github.com/wakeadmin/tools/tree/main/packages/i18n-shared)

# 3. 语言包管理

## 3.1 如何管理和分析语言包的使用？

那么如何提高前端国际化的开发体验呢？比如：

- 能够在编辑器回显 key 对应的中文
- 能够点击跳转到 key 定义的语言包
- 能够分析语言包是否被引用、有没有重复、缺译的情况
- 支持 key 重命名(重构)
- 能自动发现文本硬编码，并支持提取
- 支持机器翻译
- 提供协同翻译….

![Untitled](%E5%89%8D%E7%AB%AF%E5%9B%BD%E9%99%85%E5%8C%96%EF%BC%9A%E8%AF%AD%E8%A8%80%E5%8C%85%E7%AF%87%200f049c986a414a98a2c51a739f9a7378/Untitled%205.png)

🎉 还真有这么一个神器可以满足上面所有需求，那就是 VSCode 的 ****[i18n Ally](https://marketplace.visualstudio.com/items?itemName=lokalise.i18n-ally)** 插件(还是 [antfu](http://antfu.me) 大神开发的, 顶礼膜拜)！

![Untitled](%E5%89%8D%E7%AB%AF%E5%9B%BD%E9%99%85%E5%8C%96%EF%BC%9A%E8%AF%AD%E8%A8%80%E5%8C%85%E7%AF%87%200f049c986a414a98a2c51a739f9a7378/Untitled%206.png)

安装了 ****[i18n Ally](https://marketplace.visualstudio.com/items?itemName=lokalise.i18n-ally)**  后，大多数情况下是能开箱即用。以下是一些你可能需要调整的常见配置项：

1. 使用的框架。默认情况下，i18n ally 会分析项目根目录下的 package.json, 确定你使用的 i18n 框架，它支持了很多常见的 i18n 库，比如 `vue-i18n`, `react-i18next`。
    
    *💡 如果无法你发现 i18n ally 插件没有启用，那大概率就是它检测失败了, 可以在 `OUTPUT` Panel 下看的日志：*
    
    ![Untitled](%E5%89%8D%E7%AB%AF%E5%9B%BD%E9%99%85%E5%8C%96%EF%BC%9A%E8%AF%AD%E8%A8%80%E5%8C%85%E7%AF%87%200f049c986a414a98a2c51a739f9a7378/Untitled%207.png)
    
    解决办法就是显式告诉它：
    
    ```json
    // .vscode/setting.json
    {
      "i18n-ally.enabledFrameworks": ["react-i18next"]
    }
    ```
    

1. 自定义语言包检查目录。
    
    ```json
    // .vscode/setting.json
    {
      // 支持在所有嵌套的 locales、i18n 目录下发现语言包
      "i18n-ally.localesPaths": ["**/locales", "**/i18n"],
    }
    ```
    
2. 语言包配置
    
    我们上文使用的是 `.tr` 扩展名， i18n ally 并不能识别它，我们通过下面的配置来告诉它如何处理 tr 文件：
    
    ```json
    // .vscode/setting.json
    {
      // 语言包的命名规则
      "i18n-ally.pathMatcher": "{locale}.tr",
      // 语言包的 parser
      "i18n-ally.parsers.extendFileExtensions": {
        "tr": "json"
      },
    }
    ```
    
3. 其他常见配置
    
    ```json
    {
      // 源语言。主要会影响翻译，即以哪个语言为源语言翻译到其他语种。中文开发者通常设置为中文
      "i18n-ally.sourceLanguage": "zh",
      // 在编辑器内联提示的语种
      "i18n-ally.displayLanguage": "zh",
      // 语言包的组织形式，nested 表示嵌套对象模式
      "i18n-ally.keystyle": "nested"
    }
    ```
    

更多的配置可以看它的[文档](https://github.com/lokalise/i18n-ally/wiki)。

## 3.2 还有哪些建议？

### 3.2.1 统一语言标签

多语言的语言标签通常遵循 [BCP 47](https://en.wikipedia.org/wiki/IETF_language_tag)， 这是由互联网工程任务组（IETF）发布的一种语言标签规范，用于唯一标识各种语言。格式为 `lng-(script)-(Region 区域)-(Variant 变体)`，例如 zh-Hans-CN、en-US、zh-Hant 等等。

因为语言标签形式多种多样，而且不同的环境给出的结果可能都不太一样，所以建议开发者在维护语言包时统一使用语言标签，并且前后端保持统一。

以我们团队为例：

```json
en 默认英文
zh 默认简体中文
zh-Hant 默认繁体
th 默认泰文
```

同时维护一些语言标签的映射规则：

```json
{
  'zh-TW': 'zh-Hant-TW',
  'zh-HK': 'zh-Hant-HK',
  'zh-MO': 'zh-Hant-MO'
}
```

你会发现我们使用的 en、zh、zh-Hant、th 这些语言标签都是 `lng-(script)` 形式，这样兜底/命中效果会好点。

举个例子 `zh-Hant-TW` 的 `Locale chain` 是 `['zh-Hant-TW', 'zh-Hant', 'zh']` ,  会回退加载 `zh-Hant` 和 `zh` 语言包。 如果有朝一日，需要对 TW 地区做特殊的适配，我们再创建一个更具体 `zh-Hant-TW` 语言包就行了。

### 3.2.2 使用嵌套命名空间来组织语言包

建议以`业务模块`或者`团队名`称来作为`命名空间`,  避免直接将 key 暴露到全局。

```json
{
  "rule": {
    "deleteRuleTips": "删除规则后无法恢复，确定删除？",
    "newRule": "新建规则",
    "pointRule": "积分规则",
    "tiedRule": "等级规则"
  }
}
```

**下一篇，我们介绍多语言的翻译问题，敬请期待！！**

# 扩展阅读

- [如何论述设计的全球化与本土化的关系？](https://www.zhihu.com/question/51158638/answer/2378431663)
- [为全球设计，国际化与本地化探索：快速入门](https://zhuanlan.zhihu.com/p/29759116)