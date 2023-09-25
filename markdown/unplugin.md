---
title: '使用 unplugin 编写跨平台的构建插件'
date: 2023/9/25
categories: 前端
---

![State of JS](https://bobi.ink/images/unplugin/Untitled.png)

<br>

这篇文章继续我们的‘跨平台’之旅， 之前我们聊过:

- 编写‘跨版本’ 的组件库： [如何实现支持跨 Vue 2/3 的组件库](https://juejin.cn/post/7243413934765916219)
- 编写‘跨框架’的组件：[来一瓶 Web Component 魔法胶水](https://juejin.cn/post/7263062397240377404)
- 跨平台的运行容器： [使用 Docker 实现前端应用的标准化构建、部署和运行](https://juejin.cn/post/7269668219488354361)
- [编写跨运行时的程序](https://juejin.cn/post/7277426842814709815)

<br>

今天继续来聊一下怎么编写‘跨平台’的构建插件，前端构建工具一直都是一个比较卷的赛道，毕竟它是前端工程化的重要一环，此时此刻它正在经历着新一轮的变革 —— 使用系统编程语言(如 Rust、Go) 重构。

<br>

从 Webpack、Parcel，到 Vite, 再到 Turbopack、[Rspack](https://www.rspack.dev/)、Bun… 百花齐放。

<br>

那问题又来了，新的构建工具出来，意味着又有新的“技术债”产生。

在这个技术快速发展的时代，新旧并存的局面没办法避免。作为库的开发者，我们希望我们的库能够服务更多的人，那“跨平台”是我们不得不考虑的问题。

<br>

**怎么开发一个跨平台的构建插件呢？**

首先我们要站在更高的角度审视这些构建工具，这些构建工具主要做什么工作？从它们暴露的插件 API 中抽象共性。这些构建工具目的都是一致的，无非就是:

- 文件预处理/转换。比如 sass、typescript、image、icon 等，前端需要处理的各类资源的处理
- 依赖关系处理。解析和处理模块之间的依赖关系
- 代码输出。包含代码合并、代码优化、产物输出等。

主要的差异点无非就是实现不同，进而在扩展性、构建性能上面也会有不同的表现。

<br>

接下来我们就挑两个目前比较主流的构建工具来喵喵看，我挑选的是 `Webpack` 和 `Rollup`（ Vite 也是基于 Rollup 的，两者差异不大）。

<br>
<br>

# Webpack

尽管这几年受到了 Vite 等方案的挑战，但不得不承认，Webpack 依旧是王，至少在生态和存量市场上。

<br>

Webpack 是基于`事件驱动`(Event Driven) 的`插件式`编译器。Webpack 就是一个非常典型的`微内核`架构， 可以说 Webpack 的内核就是 [`Tapable`](https://github.com/webpack/tapable)，非常小、非常优雅。非常值得我们去反复咀嚼研究

几乎所有的功能，不管是内置的、还是第三方的都是通过插件的形式实现。包括我们看到的所有的 webpack 配置， 都会被解析转换成相应的插件，而配置不过是方便用户使用的`用户界面`罢了

Webpack 通过 `Tapable Hooks` 暴露了丰富的生命周期钩子，支持开发者对编译器、模块查找、文件转换、优化、产物生成的每一个细节进行定制。

<br>

> 💡  了解 Webpack 的一些基本概念。
>
> - `Compiler`：即 Webpack 编译器本身，它从整体上管理 Webpack 的生命周期，负责处理配置、加载插件、构造核心的对象（Compilation、Resolver、Modulefactory 等），可以认为就是一个全局的管理者。
> - `Compilation`: 由 Compiler 创建，可以认为是 Webpack 的核心大脑，Webpack 的大部分工作由它完成，它包含依赖图(Dependency Graph)的构造、负责模块构造、转换、优化、资源输出等各种核心的流程。
> - `Resolver`：模块查找器，简单说就是将相对路径转换为绝对路径
> - `Module`: JavaScript 模块在 Webpack 内的表示
> - `Module Factory`：Module 构造工厂
> - `Parser`：解析 Module 为 AST, 获取模块依赖。
> - `Loader`: 负责将文件输入(比如图片、CSS、JavaScript 文件等等)转换为 Module。Loader 通常只负责无副作用的转换工作，Loader 有点类似于 Shell 命令行
> - `Plugin`: 插件，为 Webpack 扩展实际的功能

<br>

Webpack 暴露了非常丰富的 [Hooks](https://webpack.js.org/api/compiler-hooks/)，这些 Hooks 主要由两个主要的对象管理，即 `Compiler` 和 `Compilation`。怎么理解这两个对象呢？从两个角度看：

<br>

- 从构建工具的角度看， Compiler 代表的是 Webpack 构建的整体流程
- 从模块的角度看， Compilation 则负责具体模块的编译流程

<br>

下面，我整理 Compiler 和 Compilation 暴露的常用的 hooks 以及调用的顺序。可以一窥 Webpack 的运行原理。

**Compiler 生命周期**：

![Compiler](https://bobi.ink/images/unplugin/Untitled%201.png)

<br>

**Compilation 生命周期**：

![Compilation](https://bobi.ink/images/unplugin/Untitled%202.png)

<br>

这些 Hooks 的详情介绍和使用，可以参考 [Webpack 的文档](https://webpack.js.org/api/compiler-hooks/#afterenvironment)。

**我建议你去直接去看 Webpack 的源码，技巧是：搜索对应的 Hooks 是怎么被触发和消费的， 可以帮助你进一步理解它们的意义。**

<br>
<br>

# Rollup

跟 Webpack 相比，Rollup 的 hooks 更加精练。没有像 Webpack 一样区分 Compiler 和 Compillation，Loader 和 Plugin。

Webpack 暴露了很多 Hooks，有些文档上都没有提及，甚至有些连 Webpack 自己也没用上。

尽管这样子可以给开发者很大的定制空间，但对于初学者来说，就很容易被这些细节淹没。

<br>

**Rollup 构建 Hooks**:

![Build hooks](https://bobi.ink/images/unplugin/Untitled%203.png)

- `resolveId`: 用于自定义模块查找逻辑
- `load`: 用于自定义模块加载逻辑
- `transform`：可以用于转换模块
- `moduleParsed`：模块已解析

<br>
<br>
<br>
<br>

**Rollup 代码生成 Hooks**:

![Emit Hooks](https://bobi.ink/images/unplugin/Untitled%204.png)

学习 Rollup 插件的最好方式，还是去临摹别人怎么写， 先从[官方的插件](https://github.com/rollup/plugins/tree/master/packages)开始吧。

<br>
<br>
<br>
<br>

# 编写跨平台的插件

除了 Webpack、Rollup，还有很多构建工具不停地被造出来，有没有办法开发一套跨平台的插件呢？

目前最佳答案是 [unplugin](https://github.com/unjs/unplugin), 它的主要贡献者还是 [antfu](https://github.com/antfu) 大佬。

<br>

unplugin 以 Rollup 插件 API 为基准，Rollup 这套 API 非常精练，这个抽象基本可以覆盖到主流的构建工具。

![API](https://bobi.ink/images/unplugin/Untitled%205.png)

<br>

大家可以直接去看源码，代码并不多。以下是 Webpack 和 unplugin API 的映射关系：

![Webpack to Rollup](https://bobi.ink/images/unplugin/Untitled%206.png)

<br>
<br>
<br>

# 实战

接下来，是实战部分。

我在 [《前端如何破解 CRUD 的循环》](https://juejin.cn/post/7244800185024380984#heading-4)介绍了我们的组件库，示例如下：

```jsx
import { defineFatForm } from '@wakeadmin/components'
import { ElMessageBox } from 'element-plus'

export default defineFatForm<{
  // 🔴 这里的泛型变量可以定义表单数据结构
  name: string
  nickName: string
}>(({ item, form, consumer, group }) => {
  // 🔴 这里可以放置 Vue Hooks

  // 返回表单定义
  return () => ({
    // FatForm props 定义
    initialValue: {
      name: 'ivan',
      nickName: '狗蛋',
    },

    submit: async (values) => {
      await ElMessageBox.confirm('确认保存')
      console.log('保存成功', values)
    },

    // 🔴 子节点
    children: [
      item({ prop: 'name', label: '账号名' }),
      item({
        prop: 'nickName',
        label: '昵称',
      }),
    ],
  })
})
```

现在有一个问题，defineFatForm 这种写法不支持热更新，每次修改都会重刷页面，体验很差。

<br>

因此今天我们就来写一个插件，让我们的组件库 define\* 写法也支持像 Vue defineComponent 一样的热更新。

> defineComponent 的热更新实现可以参考 [@vitejs/plugin-vue-js](https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue-jsx)

<br>
<br>
<br>
<br>

## Vue 热更新初识

来简单看看 Vue 是怎么实现热更新

在 `SFC` （Single File Component）文件编译之后，Vue 插件会注入以下代码:

```jsx
// 🔴 _sfc_main 是 SFC 编译出来的 Vue Component 组件
_sfc_main.__hmrId = '模块ID'

// 🔴 注册组件记录
typeof __VUE_HMR_RUNTIME__ !== 'undefined' && __VUE_HMR_RUNTIME__.createRecord(_sfc_main.__hmrId, _sfc_main)

export const _rerender_only = true

// 🔴 vite 热更新
import.meta.hot.(mod => {
  // 🔴 当前模块更新后会触发当前回调
  if (!mod) return
  const { default: updated, _rerender_only } = mod
  if (_rerender_only) {
    // 🔴 SFC 可以支持替换 render，不会丢失状态，开发体验会更好，
    __VUE_HMR_RUNTIME__.rerender(updated.__hmrId, updated.render)
  } else {
    // 🔴 如果是 defineComponent 就这里走这里了，会触发 parent 完全重新渲染组件，状态会丢失
    __VUE_HMR_RUNTIME__.reload(updated.__hmrId, updated)
  }
})
```

Vue 内部是怎么实现 `HMR` 的呢？

- `__VUE_HMR_RUNTIME__.createRecord(模块ID, 组件)` 会将“`组件实现`”放到一个全局 Map 中，和 `模块 ID` 关联起来
- 组件挂载时，将组件实例 + 模块 ID 关联起来：
  ```jsx
  // 挂载时注册
  if (__DEV__ && instance.type.__hmrId) {
    registerHMR(instance)
  }
  ```

	<br>

  现在全局 Map 的结构类似：
  ```jsx
  const records = {
    [__hmrId]: {
      initialDef: 组件实现，
      instances: Set<[所有已渲染的组件实例]>
    }
    // ...
  }
  ```
- 组件卸载后，同理从这个 Map 中移除实例
- rerender: 更新 initialDef 和所有“组件实例” render 方法，然后 update() 所有“组件实例”
- reload：更新 initialDef, 遍历所有“组件实例”，调用“组件实例” parent 节点 的 update() 方法，重新渲染当前组件

> 源码在[这里](https://github.com/vuejs/core/blob/main/packages/runtime-core/src/hmr.ts)。来看看

<br>
<br>
<br>

## 实现

首先，快速通过 [unplugin-starter](https://github.com/unplugin/unplugin-starter) 初始化一个项目模板：

```bash
$ npx degit antfu/unplugin-starter unplugin-wakeadmin-components
```

<br>

在项目命名上，遵循 unplugin 的[规范](https://github.com/unjs/unplugin#conventions)， 使用 `unplugin-*` 的形式， Vite 下，插件用法如下：

```jsx
// vite.config.ts
import WakeadminComponents from 'unplugin-wakeadmin-components/vite'

export default defineConfig({
  plugins: [
    WakeadminComponents({
      /* options */
    }),
  ],
})
```

<br>

先来写一个 Hello world，小试牛刀。

第一步， 我们先给 `define*` 方法调用加上 `#__PURE__` 注释，避免被识别为‘副作用’，这个有利于 Tree-Shaking 和 死代码消除(Dead Code Elimination)。

<br>
<br>

读者可以在 [Terser REPL](https://try.terser.org/) 上对比一下以下代码的优化结果：

```jsx
// B 不会被清理掉
const A = defineA({})
const B = defineA({})

console.log(A)
```

```jsx
// B 会被清理掉
const A = /*#__PURE__*/ defineA({})
const B = /*#__PURE__*/ defineA({})

console.log(A)
```

<br>
<br>

现在开始写插件的实现。首先定义插件的`参数`：

```tsx
import type { ParserOptions } from '@babel/core'
import type { FilterPattern } from '@rollup/pluginutils'

export interface Options {
  /**
   * 待处理的文件，默认 会处理 .jsx、.tsx 文件
   */
  include?: FilterPattern
  exclude?: FilterPattern

  /**
   * 是否开启 defineComponent 的处理，默认 false
   */
  enabledDefineComponent?: boolean

  /**
   * babel parser 插件，默认 ['jsx']
   * 如果是 tsx 文件，会加上 typescript
   */
  parserPlugins?: ParserOptions['plugins']

  /**
   * 调试模式
   */
  debug?: boolean
}
```

<br>
<br>

接着是实现：

```tsx
import { UnpluginFactory, createUnplugin } from 'unplugin'
import { createFilter } from '@rollup/pluginutils'
import type { Options } from './types'
import babel, { PluginObj, ParserOptions } from '@babel/core'

const PLUGIN_NAME = 'unplugin-wakeadmin-components'
const t = babel.types

const DEFINE_FACTORIES = new Set(['defineFatTable', 'defineFatForm'])

function isDefineCall(node: babel.types.CallExpression) {
  return t.isIdentifier(node.callee) && DEFINE_FACTORIES.has(node.callee.name)
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options, meta) => {
  const filter = createFilter(options?.include || /\.[jt]sx$/, options?.exclude)
  const enableDefineComponent = options?.enabledDefineComponent

  if (enableDefineComponent) {
    DEFINE_FACTORIES.add('defineComponent')
  }

  const REGEXP = new RegExp(`(${Array.from(DEFINE_FACTORIES).join('|')})`, 'g')

  return {
    name: PLUGIN_NAME,
    // 🔴 配置为 pre, 在其他 loader 之前处理
    enforce: 'pre',
    // 🔴 筛选要被转换的文件
    transformInclude(id) {
      const [filepath] = id.split('?')

      return filter(id) || filter(filepath)
    },
    //  🔴 转换逻辑
    transform(code, id) {
      if (code.match(REGEXP) == null) {
        // 没有包含 define* 跳过
        return null
      }

      const plugins: PluginObj[] = []
      const parserPlugins: ParserOptions['plugins'] = ['jsx']

      if (id.endsWith('.tsx')) {
        parserPlugins.push('typescript')
      }

      if (options?.parserPlugins) {
        parserPlugins.push(...options.parserPlugins)
      }

      plugins.push({
        visitor: {
          // 🔴  为 define* 添加 #__PURE__
          CallExpression(path) {
            if (isDefineCall(path.node)) {
              path.get('callee').addComment('leading', '#__PURE__')
            }
          },
        },
      })

      const result = babel.transformSync(code, {
        sourceFileName: id,
        sourceMaps: true,
        babelrc: false,
        configFile: false,
        plugins,
        parserOpts: {
          plugins: parserPlugins,
        },
      })

      if (result?.code == null) {
        return null
      }

      return {
        code: result.code,
        map: result?.map,
      }
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
```

<br>

这里使用 Babel 来 parse 和 transform 代码。逻辑很简单，就是找到所有的函数调用，如果名称匹配到我们的 `define*` 列表，就给它添加 `#__PURE__` 注释。

如果你对 Babel 代码感到吃力，可以看我之前写的文章 [深入浅出 Babel 上篇：架构和原理 + 实战](https://juejin.cn/post/6844903956905197576)。

<br>
<br>
<br>
<br>

## 支持 HMR

接下来，我们正式添加 HMR 的逻辑。

我们需要在 JavaScript 文件中找出所有 `define*` 的“导出”， 以下形式导出我们都需要支持：

<br>

```tsx
// 命名导出
export const NamedExport = defineFatForm(/*...*/)
const AnotherNamedExport = defineFatForm(/*...*/)

// 另一种命名导出
export { AnotherNamedExport }

// 默认导出形式
export default defineFatForm(/*...*/)
```

<br>

转换后的代码类似于：

```tsx
// 命名导出
export const NamedExport = defineFatForm(/*...*/)
const AnotherNamedExport = defineFatForm(/*...*/)

// 另一种命名导出
export { AnotherNamedExport }

// 🔴 默认导出形式, 使用一个临时变量存储，方便后面 patch
const __default__ = defineFatForm(/*...*/)
export default __default__

// 🔴 注册组件实例
if (typeof __VUE_HMR_RUNTIME__ !== 'undefined') {
  NamedExport.__hmrId = 'a1203740'
  AnotherNamedExport.__hmrId = 'bad12ad2'
  __default__.__hmrId = 'x12312w32'

  __VUE_HMR_RUNTIME__.createRecord('a1203740', A)
  __VUE_HMR_RUNTIME__.createRecord('bad12ad2', AnotherNamedExport)
  __VUE_HMR_RUNTIME__.createRecord('x12312w32', __default__)
}

// 🔴 vite HMR
if (import.meta.hot) {
  import.meta.hot.accept(
    ({
      NamedExport: __NamedExport,
      AnotherNamedExport: __AnotherNamedExport,
      default: __default,
    }) => {
      __VUE_HMR_RUNTIME__.reload('a1203740', __NamedExport)
      __VUE_HMR_RUNTIME__.reload('bad12ad2', __AnotherNamedExport)
      __VUE_HMR_RUNTIME__.reload('x12312w32', __default)
    }
  )
}
```

<br>

照着上面的约定，我们来实现看看：

```tsx
// .. 省略
const DEFAULT_LOCAL_NAME = '__default__'

// 生成 hash 值
function getHash(text: string) {
  return createHash('sha256').update(text).digest('hex').substring(0, 12)
}

// 解析出来的热更新组件
interface HotComponent {
  local: string
  exported: string
  id: string
}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options, meta) => {
  // ....
  let isWebpack = meta.framework === 'webpack'
  let isVite = meta.framework === 'vite'

  const enableHMR = process.env.NODE_ENV === 'development' && (isWebpack || isVite)
  // ...

  return {
    // ...
    transform(code, id) {
      // ...
      // 🔴 记录查找到的组件
      const hotComponents: HotComponent[] = []

      // ...

      if (enableHMR) {
        // 🔴 支持热更新
        plugins.push({
          visitor: {
            // 🔴 处理命名导出
            ExportNamedDeclaration(path) {
              if (path.node.declaration && t.isVariableDeclaration(path.node.declaration)) {
                // 🔴 export const xxx = defineXXX() 形式
                const declarations = path.node.declaration.declarations
                for (const decl of declarations) {
                  if (
                    t.isIdentifier(decl.id) &&
                    decl.init &&
                    t.isCallExpression(decl.init) &&
                    isDefineCall(decl.init)
                  ) {
                    hotComponents.push({
                      local: decl.id.name,
                      exported: decl.id.name,
                      id: getHash(id + decl.id.name),
                    })
                  }
                }
              } else if (path.node.specifiers) {
                // 🔴 export { xxx } 形式
                const specifiers = path.node.specifiers
                for (const spec of specifiers) {
                  if (t.isExportSpecifier(spec)) {
                    // 查找变量定义
                    const binding = path.scope.getBinding(spec.local.name)
                    if (
                      binding &&
                      t.isVariableDeclarator(binding.path.node) &&
                      t.isCallExpression(binding.path.node.init) &&
                      isDefineCall(binding.path.node.init)
                    ) {
                      const exported = t.isIdentifier(spec.exported)
                        ? spec.exported.name
                        : spec.exported.value
                      hotComponents.push({
                        local: spec.local.name,
                        exported,
                        id: getHash(id + exported),
                      })
                    }
                  }
                }
              }
            },
            // 🔴 默认导出
            ExportDefaultDeclaration(path) {
              // export default defineXXX() 形式
              const declaration = path.node.declaration
              if (t.isCallExpression(declaration) && isDefineCall(declaration)) {
                hotComponents.push({
                  local: DEFAULT_LOCAL_NAME,
                  exported: 'default',
                  id: getHash(id + 'default'),
                })

                // 创建临时变量
                const variable = t.variableDeclaration('const', [
                  t.variableDeclarator(t.identifier(DEFAULT_LOCAL_NAME), declaration),
                ])
                const exportDefault = t.exportDefaultDeclaration(t.identifier(DEFAULT_LOCAL_NAME))
                // 替换 export default 为 export default __default__
                path.replaceWithMultiple([variable, exportDefault])
              }
            },
          },
        })
      }

      // ....

      if (hotComponents.length !== 0) {
        // 🔴 注入热更新代码
        const hmrCode = patchHotComponents(hotComponents, meta.framework, id, options?.debug)
        result.code = result.code + hmrCode
      }
      // ...
    },
  }
}

// ...
```

<br>

上面代码的主要逻辑是运用 Babel 来遍历导出语句，找出所有通过 `define*` 创建的组件。

<br>

接下来就是注入 HMR 的代码：

```tsx
function patchHotComponents(
  hotComponents: HotComponent[],
  framework: 'vite' | 'webpack',
  id: string,
  debug?: boolean
): string {
  let hmrCode = ''
  let callbackCode = ''
  const debugCode = debug ? `\n  console.log('HMR reloading for ${id}')` : ''

  for (const c of hotComponents) {
    hmrCode +=
      `\n  ${c.local}.__hmrId = ${c.local}.__wkhmr = '${c.id}'` +
      `\n  __VUE_HMR_RUNTIME__.createRecord('${c.id}', ${c.local})`
    callbackCode += `\n  __VUE_HMR_RUNTIME__.reload("${c.id}", __${c.exported})`
  }

  hmrCode = `\nif (typeof __VUE_HMR_RUNTIME__ !== 'undefined') {\n${hmrCode}\n}\n`

  if (framework === 'vite') {
    // 🔴 vite
    hmrCode += `\nif (import.meta.hot) {
  import.meta.hot.accept(({${hotComponents
    .map((c) => `${c.exported}: __${c.exported}`)
    .join(',')}}) => {${debugCode}${callbackCode}\n})
}`
  } else {
    // 🔴 webpack
    hmrCode += `\nif (module.hot) {
  // 接受自身，
  module.hot.accept()
  if (module.hot.status() !== 'idle') {
    const {${hotComponents
      .map((c) => `${c.exported}: __${c.exported}`)
      .join(', ')}} = __webpack_module__.exports
    ${debugCode}
    ${callbackCode}
  }
}`
  }

  return hmrCode
}
```

<br>

Vite 和 Webpack 的 HMR API 有点差异。

<br>

相对而言 Vite 会更直观一点，使用 `import.meta.hot.accept(callback)` 一行代码就可以搞定，只要当前模块变动，回调就会被调用，并传入新的模块信息。

<br>

而 Webpack，要接受当前模块的更新，首先要调用一下 `module.hot.accept()`，表示未来的模块更新我可以自行处理。

后面每次代码模块更新，都会重新执行模块代码，我们通过 `status === 'idle'` 来区分首次执行，还是后续的热更新重新执行，如果是热更新执行，就 reload 组件。

<br>

学废了吗？源代码在[这里](https://github.com/wakeadmin/components/tree/master/packages/unplugin/src)

<br>
<br>
<br>

# 总结

这篇文章我们走马观花讲了讲 Webpack 和 Rollup 的插件 API，接着引入了 Unplugin。

Unplugin 以 Rollup 的简练插件 API 为母版，这套 API 基本就是主流构建工具插件 API 的最小并集了，可以轻松兼容主流的平台。

接着，实战部分，我们基于 Babel 写了一个简单的 Vue HMR 插件。

如果读者想要进一步如何编写插件，可以临摹一些官方插件，再深一点，可以顺藤摸瓜看看源码。

<br>
<br>
<br>

# 扩展阅读

- [深入浅出 Babel 上篇：架构和原理 + 实战](https://juejin.cn/post/6844903956905197576)
- [Vite](https://cn.vitejs.dev/guide/api-plugin.html)
- [https://github.com/unjs/unplugin](https://github.com/unjs/unplugin)
- [Plugin API | webpack 中文文档](https://webpack.docschina.org/api/plugins/#plugin-types)
- [Rollup](https://cn.rollupjs.org/plugin-development/#watchchange)
- [How Webpack works?](https://blog.lyearn.com/how-webpack-works-236f8cc43ae7)
- [vite-plugin-vue](https://github.com/vitejs/vite-plugin-vue)
