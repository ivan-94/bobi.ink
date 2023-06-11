---
title: 如何实现支持跨 Vue 2/3 的组件库
date: 2023/6/11
categories: 前端
---

<br>

![Untitled](https://bobi.ink/images/component-for-vue2-3/Untitled.jpeg)

Vue 3 已经[发布](https://vue-js.com/topic/5f65624c96b2cb0032c38550)三年，我们有较多项目还停留在 Vue 2。Vue 3 的升级是比较割裂的。

我们主要做的是 `2B` 业务，项目、模块、分支都非常多，升级的成本和风险都比较高。

我们目前的策略是 “新旧并存，渐进式升级”， 旧的项目就尽量不变了，新的项目强制使用新的技术栈。利用`微前端`架构，新旧应用可以灵活地组合起来。

因此我们的业务组件库、工具库之类需要考虑兼容旧的 Vue 2 项目。这篇文章，就向大家展示我们开发跨版本组件库，其中的决策和实现过程。

<br>
<br>

## 方案决策

实现跨版本的组件都多种方案，下面列举分析几种主要方案：

<br>

**方案一：使用 Vue SFC / 模板**

单纯从外观上看 Vue 2 / 3 在模板的语法上[差别并不大](https://v3-migration.vuejs.org/zh/breaking-changes/v-model.html)。在 [Vue 2.7](https://blog.vuejs.org/posts/vue-2-7-naruto) 开始内置了对 `script setup` 也有了较好的支持。

理论上，我们可以编写一份代码，然后分别针对 2 / 3 编译两份输出。

![总体流程如上](https://bobi.ink/images/component-for-vue2-3/Untitled.png)

总体流程如上

**笔者提供了一个简单的 DEMO 来验证了这个方案的可行性，详见[这里](https://github.com/wakeadmin/cvv-sfc-demo)。**

- 优点
  - 模板是 Vue 的第一公民，不需要为了兼容不同版本改变原有的开发习惯。学习成本比较低
  - 支持静态编译，比如可以针对不同的版本进行条件编译，**优化包体积**。另外可以**保留[Vue 模板编译优化](https://cn.vuejs.org/guide/extras/rendering-mechanism.html#compiler-informed-virtual-dom)机制**。
  - 使用公开标准语法，不需要 hack 或者关心太多框架底层的差异。
- 缺点
  - 构建相对复杂，需要两份代码输出。
  - 灵活性较差。模板语法差异很小，但不以为着没有差异，当需要处理某些跨版本差异时可能会比较棘手。比如[向下透传事件、props 或者 slots](https://v3-migration.vuejs.org/zh/breaking-changes/render-function-api.html) , [v-bind.sync 废弃了](https://v3-migration.vuejs.org/zh/breaking-changes/v-bind.html) 、[template v-for key](https://v3-migration.vuejs.org/zh/breaking-changes/key-attribute.html) **、**v-model 协议变化。
  - ⚠️ 语法固化，为了兼容 Vue 2，template 语法需要停留在 Vue 3.0，这意味着后续发布的新特性可能无法使用，比如 `defineModel`，`defineOptions`。

<br>
<br>
<br>

**方案 2： 渲染函数**

Vue 2 和 Vue 3 都支持渲染函数，但是两者之间有非常大的差异。**详细的差异对比可以看笔者整理的这篇文档： [Vue 2/3 渲染函数差异以及兼容方案](https://www.notion.so/Vue-2-3-302cbe0e37794345bbfbd89e32d617db?pvs=21)**

<br>

**那 Vue 官方的 JSX 插件呢？**

Vue 2/3 JSX Babel (**[jsx-vue2](https://github.com/vuejs/jsx-vue2)、[babel-plugin-jsx](https://github.com/vuejs/babel-plugin-jsx)**)插件加了一些语法糖，来简化渲染函数的编写，但是这两个插件的语法完全是两个东西。

因此这个方案不在我们的考虑之列。

<br>
<br>
<br>

**方案 3：标准的 JSX**

那为什么不用标准的 `JSX` 呢？使用统一的 JSX 语法，转换为不同版本的渲染函数。

![Untitled](https://bobi.ink/images/component-for-vue2-3/Untitled%201.png)

使用标准的 JSX 语法，意味着：

- 不需要任何 `Babel` 插件，能够被市面上主流的编译器(如 tsc， swc，esbuild)直接处理。
  例如 Typescript
  ```json
  /** tsconfig.json */
  {
    "compilerOptions": {
      "jsx": "react-jsx",
      "jsxImportSource": "JSX 运行时名称"
    }
  }
  ```
- 在**运行时**转换到对应版本的渲染函数。
- Typescript friendly。纯 TSX，不需要额外插件(比如 `Volar`)辅助。
- 使用习惯上接近 `React`。

  ```diff
  /** 🔴 1. 事件订阅  **/
  // 🤮
  - <input vOn:click={this.newTodoText} />
  - <input vOn:click_stop_prevent={this.newTodoText} />
  // 👍 使用 on* 注册时间
  + <input onClick={this.newTodoText} />

  /** 🔴 2. 没有指令  **/
  // 🤮
  - <input v-show={this.visible} />
  - <input vModel={this.newTodoText} />
  - <input vModel_trim={this.newTodoText} />
  - <A v-model={[val, "argument", ["modifier"]]} />
  - <a v-loading={val} />;

  // 👍 没有语法糖
  + <input modelValue={val} onUpdate:modelValue={handleValChange} />
  + <input style={{display: this.visible ? 'block' : 'none' }} />
  + <a {...withDirectives([[vLoading, val]])}>

  /** 🔴 3. slots  **/
  // 🤮
  - <MyComponent>
  -   <header slot="header">header</header>
  -   <footer slot="footer">footer</footer>
  - </MyComponent>
  -
  - const scopedSlots = {
  -   header: () => <header>header</header>,
  -   footer: () => <footer>footer</footer>
  - }
  -
  - <MyComponent scopedSlots={scopedSlots} />

  // 👍 对齐 vue 3
  + const App = {
  +   setup() {
  +     const slots = {
  +       bar: () => <span>B</span>,
  +     };
  +     return () => (
  +       <A v-slots={slots}>
  +         <div>A</div>
  +       </A>
  +     );
  +   },
  + };

  ```

<br>
<br>

- 优点

  - 构建很简单，使用标准的 JSX 只需构建一次。不需要引入特定的编译器，使用 `Typescript CLI`，`esbuild` 就可以直接编译。
  - Typescript Friendly, 另外相比 `vue-tsc` 编译结果会好一点。
  - 灵活性。毋庸置疑，`JSX` 的灵活性，可操行性太强了。
  - 相对模板编译来说，可控一点(Hackable)。
  - 可以替换官方的 JSX 库，除了本文介绍的`跨版本组件库`场景，在日常 Vue 2/3 应用开发中也可以使用啊。

- 缺点
  - 使用 `JSX` 则意味着放弃[模板编译优化](https://cn.vuejs.org/guide/extras/rendering-mechanism.html#compiler-informed-virtual-dom)的机会，比如动态节点标注，预字符串化，缓存，静态提升等等。
  - 为了抹平版本之间的差异，多了一层抽象转换(主要是 Vue 2 上)，会有一些性能损耗。
  - 实现上需要熟知两个版本之间的差异性。比较 hack
  - 可读性较差，相比 `React` 简洁的 Api，Vue 上的一些特殊的框架特性，还是会让代码有些不太优雅，比如指令、Slot

后面我们选择了 `JSX` 方案，因为实现起来更简单，方案更加可控，尤其是应对后续的版本更新。

<br>
<br>
<br>

## 策略

构建跨版本的组件库，需要考虑的不仅仅是组件语法问题。Vue 2/3 从底层的 API 到渲染函数、再到应用层的组件库、路由、多语言等等，都出现了割裂。我们得兼顾这些变化。

<br>

1. **分层策略**

![Untitled](https://bobi.ink/images/component-for-vue2-3/Untitled%202.png)

我们按照引用关系进行分层：

- **`API 层`**。好在 Vue 3 大部分特性(主要是 `Composition API` 和 `defineComponent`) 已经下放到了 Vue 2，我们只需要使用 [vue-demi](https://github.com/vueuse/vue-demi) 就可以无缝使用这些核心的 API。
  相对应的，上层的组件库、适配器代码禁止直接导入 ‘vue’
- **`视图语法层`**。就如上文说的，我们会封装一个 jsx-runtime, 抹平 Vue 2/3 在渲染函数上的差异。
- **`适配器层`**。应用层的各种类库的适配。比如我们公司主要使用 element-ui, 新旧版本的差异会在 element-adapter 中处理，并暴露统一接口。
- **`组件库层`**。最后我们的组件库基于下层提供的抽象能力，实现跨版本。
- **`应用`**。上层的 Vue 2 / 3 应用。下层的适配器，会根据应用使用的 Vue 版本，动态切换适配。

<br>
<br>

**2) 新版本优先策略**

在封装适配器 或者 jsx-runtime 时，当新旧版本出现差异时，我们如何抉择？

这里采用的是“新版本优先”的策略，举一些例子：

- JSX 的语法对齐 Vue 3 的渲染函数。
- 只使用 Composition API
- 只使用 defineComponent

换句话说，如果情况允许，我们始终以 Vue 3 为基准。

<br>
<br>

**3) 短板优先策略**

短板对齐是实现兼容的基础策略，主要分两个方面：

- 削头: 并不是所有 Vue 3 的特性都能下放到 Vue 2, 比如 `Fragment`、`Teleport`、`Suspense`/`await setup`。我们只能放弃这些功能。
- 补尾：针对一些 Vue 2 的短板，需要一些额外的工作，比如 [Vue 2 响应式系统的局限性](https://cn.vuejs.org/v2/guide/reactivity.html)。

<br>
<br>

**4) 回退策略**

对于一些无法抹平的差异，可以按照不同的版本特殊处理。可以使用 vue-demi 的 `isVue2` 来分条件处理。

<br>
<br>
<br>

## 实现

### API 兼容：vue demi

[vue-demi](https://github.com/vueuse/vue-demi) 为实现跨 Vue 版本的库提供基础的支持。它的主要策略：

- `<=2.6`: 导出  `vue` + `@vue/composition-api`.
- `2.7`: 导出  `vue` ( Vue 2.7 内置支持 Composition API).
- `>=3.0`: 导出  `vue`, 模拟了 Vue 2 的`set` 、 `del` API.

vue-demi 的实现很简单，就是在 npm 的 `postinstall` 钩子中，判断当前环境安装的 vue 库版本，决定导入的库。

在我们的场景中，除了 Composition API 和一些基础类型信息还不够，我们 Fork 了 vue-demi 来扩充了一些填充物，进一步抹平一些差异。

<br>
<br>
<br>

### 渲染语法：JSX runtime 的实现

JSX runtime 的实现并不涉及太复杂的技术，主要还是处理渲染函数的繁琐 API 差异。

文章篇幅有限，这里我就不展开讲细节了。**⚠️ 完整的差异对比和应对方式可以看这里**：

<br>

[🎉Vue 2 / 3 渲染函数的差异 🎉](https://www.notion.so/Vue-2-3-302cbe0e37794345bbfbd89e32d617db?pvs=21)

<br>

简单来说，我们的 JSX 语法以 Vue 3 为基准，主要涉及事件订阅、slots、指令的转换。

<br>

![Untitled](https://bobi.ink/images/component-for-vue2-3/Untitled%203.png)

具体实现可以看[这里](https://github.com/wakeadmin/tools/tree/main/packages/h)

<br> 
<br> 
<br>

### 组件定义与 Typescript 支持

Typescript + Volar 就是一门玄学，类型‘体操’几乎占据了开发的三分之一时间。主要问题：

- Vue 2/3 类型定义和导出有细微的差别。我们的 jsx-runtime 要求一致的类型。
- JSX 的 slots 不支持类型检查。渲染函数毕竟不是 Vue 的第一公民，slots 在 JSX 下无法类型检查。
- 为了兼容 options API, `defineComponent` 类型定义和推导比较[复杂](https://github.com/vuejs/core/blob/a95e612b252ae59eaf56e0b8ddba66948d4ac20e/packages/runtime-core/src/apiDefineComponent.ts#L44)。
- 泛型组件实现比较复杂，Volar 泛型的支持也比较玄学。

<br> 
<br>

为了能够更好地定义跨版本的组件，提供更好的类型支持，我们打算简化 `defineComponent`。为了避免命名冲突，尚且命名为 `declareComponent` 吧, 这个函数有以下职责：

- 为实现跨版本支持提供必要约束。`declareComponent` 裁剪掉了 `Options API`, 只保留 setup、props、render 等属性。强制走 `Composition API`。
- 为 JSX (比如 v-slots 属性)提供更好类型检查支持
- 同时兼容 vue template 的类型检查 (`volar`)。
- 在运行时抹平一些跨版本的差异。绝大部分差异，Vue 2.7 在 `defineComponent` 方法内部已经抹平了。还有一些 `inheritAttrs` 带来的[隐式差异](https://www.notion.so/Vue-2-3-302cbe0e37794345bbfbd89e32d617db?pvs=21)，**declareComponent 直接关闭了 `inheritAttrs`** 。
- 补全短板，并且向下保持兼容。Vue 2 已经不更新了，我们想要支持一些新的特性，比如泛型。

<br>

使用示例：

```tsx
const Counter = declareComponent({
  name: 'Counter',
  // 定义 props
  props: declareProps<{
    initialValue: number
  }>(
    // ⚠️ 和 defineComponent 一样，我们还是需要显式定义 props, 否则会被当做 attrs
    ['initialValue']
  ),

  // 定义事件
  emits: declareEmits<{ change: (value: number) => void }>(),

  // 定义插槽
  // slots: declareSlots<{ foo: { a: number } }>(),

  // setup
  setup(props, { emit }) {
    const count = ref(props.initialValue)
    const handleClick = () => {
      count.value++

      emit('change', count.value)
    }

    return () => (
      <div title="count" onClick={handleClick}>
        count: {count.value}
      </div>
    )
  },
})
```

<br> 
<br>

为了实现这个目标，我们先来看下 `Volar` 是如何推断组件的类型：

<br>

大致的推导过程如下, 其次可以参考 `vue-tsc` 的编译输出或者 Vue `defineComponent` 的类型声明。

```tsx
// https://github.com/vuejs/language-tools/blob/71240c78f1a205605f4c079a299b2701250ef9be/packages/vue-component-type-helpers/index.d.ts#L5
export type ComponentProps<T> = T extends new () => { $props: infer P }
  ? NonNullable<P>
  : T extends (props: infer P, ...args: any) => any
  ? P
  : {}

export type ComponentSlots<T> = T extends new () => { $slots: infer S }
  ? NonNullable<S>
  : T extends (props: any, ctx: { slots: infer S }, ...args: any) => any
  ? NonNullable<S>
  : {}

export type ComponentEmit<T> = T extends new () => { $emit: infer E }
  ? NonNullable<E>
  : T extends (props: any, ctx: { emit: infer E }, ...args: any) => any
  ? NonNullable<E>
  : {}

export type ComponentExposed<T> = T extends new () => infer E
  ? E
  : T extends (props: any, ctx: { expose(exposed: infer E): any }, ...args: any) => any
  ? NonNullable<E>
  : {}

/**
 * Vue 2.x
 */
export type Vue2ComponentSlots<T> = T extends new () => { $scopedSlots: infer S }
  ? NonNullable<S>
  : T extends (props: any, ctx: { slots: infer S }, ...args: any) => any
  ? NonNullable<S>
  : {}
```

<br>

简单来说 `defineComponent` 方法最终输出的组件的类型外观长这样：

```tsx
type YourComponent = new (...args: any[]): {
  $props: Props 类型
  $emit: 事件类型
  $slots: 插槽类型
}
```

> 💡 那 Typescript 的 JSX 怎么对组件进行类型检查呢？这个可以参考 Typescript 的 [JSX 文档](https://www.typescriptlang.org/docs/handbook/jsx.html)，还有 Vue 的 JSX [类型定义](https://github.com/vuejs/core/blob/a95e612b252ae59eaf56e0b8ddba66948d4ac20e/packages/vue/jsx.d.ts#L3)。简单说也是从上述的 `$props` 中推导的。

<br> 
<br>

我们的 `declareComponent` 只要保持和上面的类型兼容，就可以让 `volar` 在 vue template 下进行类型检查了。

<br>

因为刨除掉了不必要的 Options API, 相比 defineComponent, 类型定义可以简化很多:

```tsx
export function declareComponent<
  Props extends {} = {},
  Emit extends {} = {},
  Expose extends {} = {},
  Slots extends {} = {}
>(
  options: SimpleComponentOptions<Props, Emit, Expose, Slots>
): DefineComponent<Props, Emit, Expose, Slots> {
  /// .. 实现忽略，简单封装 defineComponent
}

// 🔴 简化 defineComponent API, 只保留 Composition API
export type SimpleComponentOptions<
  Props extends {},
  Emit extends {},
  Expose extends {},
  Slots extends {}
> = {
  name?: string
  props?: Props
  emits?: Emit
  slots?: Slots
  expose?: Expose
  setup: (
    props: Props,
    ctx: SetupContext<Emit, DefaultSlots & Slots, Expose, Data>
  ) => Promise<RenderFunction | void> | RenderFunction | void
  inheritAttrs?: boolean
  serverPrefetch?(): Promise<any>
}

export interface ComponentInstance<
  Props extends {},
  Emit extends {},
  Expose extends {},
  Slots extends {}
> {
  // props 定义
  $props: Props &
    // 🔴 将 emit 转换为 on* 形式，方便 JSX 场景使用
    EmitsToProps<Emit> & { 'v-slots'?: Partial<VSlotType<Slots>> } & {
      // 🔴 扩展了 v-slots 的定义，方便 JSX 场景使用
      'v-children'?: VChildrenType<Slots>
    } & {
      ref?: RefType<Expose | Expose[]>
    }

  // 🔴 支持 volar 推断 slots
  $slots: VSlotType<Slots>
  // 🔴 支持 volar 推断 事件
  $emit: EmitFn<Emit>
}

// 可以对比 Vue 的 DefineComponent 看看
export interface DefineComponent<
  Props extends {},
  Emit extends {},
  Expose extends {},
  Slots extends {}
> {
  new (...args: any[]): ComponentInstance<Props, Emit, Expose, Slots>
}
```

**那怎么支持泛型组件吗？**

<br> 
<br> 
<br>

### **泛型组件**

> Volar 需要升级到最新版本。

> Volar 的泛型支持比较玄学，我建议不要随意尝试！

Vue 3.3 官方正式支持了[泛型 SFC](https://blog.vuejs.org/posts/vue-3-3) 和 defineComponent, 笔者实测 Volar 这块支持还有待改进。但是不妨碍我们进行初步的尝试。

上文的 `declareComponent` 写法是不支持泛型组件的。有两种方式可以实现泛型组件的声明，先来看一个比较简单的：

1. **类型断言**

   ```tsx
   // 🔴 使用泛型定义 props、emit 和 expose 等类型
   interface Props<T> {
     list: T[]
     filter: (item: T) => boolean
   }

   // 📢 这里要用 type
   type Emit<T> = {
     add: (item: T) => void
     change: (list: T[]) => void
   }

   type Expose<T> = {
     open: (item: T) => void
     list: T[]
   }

   type Slots<T> = {
     foo: (list: T[]) => any
   }

   const GenericBar = declareComponent({
     props: declareProps<Props<any>>([]),
     emits: declareEmits<Emit<any>>(),
     expose: declareExpose<Expose<any>>(),
     slots: declareSlots<Slots<any>>(),
     setup(props, ctx) {
       expectType<any[]>(props.list)
       ctx.emit('change', [])
       ctx.slots.foo?.([])
       ctx.expose({
         list: [],
         open() {
           // ignore
         },
       })
       return {} as any
     },
     // 🔴 重新断言，支持 泛型
   }) as new <T>(...args: any[]) => ComponentInstance<Props<T>, Emit<T>, Expose<T>, Slots<T>>

   // 测试
   ;<GenericBar
     list={[1, 2]}
     filter={(i) => {
       expectType<number>(i)
       return true
     }}
     onAdd={(i) => {
       expectType<number>(i)
     }}
     onChange={(i) => {
       expectType<number[]>(i)
     }}
     v-slots={{
       foo(i) {
         expectType<number[]>(i)
       },
     }}
   ></GenericBar>
   ```

    <br>

   上面的方式在 JSX 表现正常，**但是目前 Volar 在 vue template 并不支持。**

   > 💡 **这里也有一些冷知识。**假设 目标类型约束了 `Index Signature`, 比如 `{[key: string]: Function }`, 那么 `interface` 是无法赋值给它的：
   >
   > ```tsx
   > interface Indexed {
   >   [key: string]: Function
   > }
   >
   > interface Foo {
   >   hello: () => void
   > }
   >
   > declare let a: Indexed
   > declare let b: Foo
   >
   > a = b // 🚨 Index signature for type 'string' is missing in type 'Foo'
   > ```
   >
   > 如果使用 `type` 创建类型就可以:
   >
   > ```tsx
   > type Bar = {
   >   hello: () => void
   > }
   >
   > declare let c: Bar
   > a = c // it's work
   > ```
   >
   > 笔者推测，应该**是 interface 允许 [合并](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces)，不是静态的，因此不能安全地满足 Index Signature 的约束**。
   >
   > 了解更多：
   >
   > [How to fix "Index signature is missing in type" error?](https://stackoverflow.com/questions/60697214/how-to-fix-index-signature-is-missing-in-type-error)

	<br> 
	<br>

2. **函数形式**

   Vue 3.3 的 `defineComponent` 新增了一种[函数签名形式](https://cn.vuejs.org/api/general.html#definecomponent)：

   ```tsx
   const Comp = defineComponent(
     <T extends string | number>(props: { msg: T; list: T[] }) => {
       // 就像在 <script setup> 中一样使用组合式 API
       const count = ref(0)

       return () => {
         // 渲染函数或 JSX
         return <div>{count.value}</div>
       }
     }
     // 去掉注释，泛型会失效
     // 目前仍然需要手动声明运行时的 props
     // {
     //  props: ['msg', 'list']
     /// }
   )
   ```

   尴尬的是，Vue 组件必须显式定义 props 参数，不然会被当做 attrs 处理。所以，当你将上面的**props 参数注释去掉时，泛型就会失效了 😀** 。

   另外一件尴尬的事情是，截止目前为止，用上面语法创建的组件，在 Volar 上并不能得到很好的支持(只能正确推断 props)。

   <br>

   但使用 [SFC 泛型语法](https://cn.vuejs.org/api/sfc-script-setup.html#generics) 则会表现好一点。SFC 有什么特殊？

   我使用 vue-tsc 将组件编译了一下，大概结果如下：

   ```tsx
   declare const _default: <T>(
     // 🔴 props 类型
     __VLS_props: {
       list: T[]
       filter: (item: T) => boolean
     } & VNodeProps &
       AllowedComponentProps &
       ComponentCustomProps,

     // 🔴 context 类型
     __VLS_ctx?:
       | Pick<
           {
             props: {
               list: T[]
               filter: (item: T) => boolean
             }
             expose(exposed: { data: Ref<T[] | null | undefined> }): void
             attrs: any
             slots: {
               foo: (scope: { list: T[] }) => any
             }
             emit: {
               change: [T[]]
               foo: [T, number]
             }
           },
           'attrs' | 'emit' | 'slots'
         >
       | undefined
   ) => // 🔴 返回值
   VNode & {
     __ctx?:
       | {
           props: {
             list: T[]
             filter: (item: T) => boolean
           }
           expose(exposed: { data: Ref<T[] | null | undefined> }): void
           attrs: any
           slots: {
             foo: (scope: { list: T[] }) => any
           }
           emit: {
             change: [T[]]
             foo: [T, number]
           }
         }
       | undefined
   }
   ```

   SFC 的编译结果多出了 `__ctx` 字段，实际上 Volar 就是从 \_\_ctx 中提取了相关类型。

   <aside>
   💡 __ctx 应该是 volar 的内部实现细节，不排除后面会变动

   </aside>

   那我们现在就模仿它，重构一下 `declareComponent` 的签名:

   ```tsx
   export interface DefineComponentContext<
     Emit extends ObjectEmitsOptions = {},
     Expose extends {} = {},
     Slots extends { [key: string]: Function } = {},
     Attrs extends {} = {}
   > {
     attrs: Attrs
     slots: Slots
     emit: EmitFn<Emit>
     expose: ExposeFn<Expose>
   }

   export function declareComponent<
     Props extends {},
     Emit extends ObjectEmitsOptions = {},
     Expose extends {} = {},
     Slots extends { [key: string]: Function } = {},
     Attrs extends {} = {}
   >(
     setup: (
       props: Props,
       ctx: DefineComponentContext<Emit, Expose, Slots, Attrs>
     ) => Promise<RenderFunction | void> | RenderFunction | void,
     options?: {
       props?: Array<keyof Props> | ComponentObjectPropsOptions<Partial<Props>>
       name?: string
       inheritAttrs?: boolean
       serverPrefetch?(): Promise<any>
     }
   ): (
     props: PropsType<Props, Emit, Slots, Expose>,
     ctx: DefineComponentContext<Emit, Expose, Slots, Attrs>
   ) => VNode & {
     // 🛑
     __ctx: {
       emit: EmitFn<Emit>
       slots: Slots
       expose: ExposeFn<Expose>
       attrs: Attrs
     }
   }
   ```

   使用示例：

   ```tsx
   function Foo<T>(
     props: { list: T[]; filter: (item: T) => boolean },
     ctx: DefineComponentContext<
       { change: (list: T[]) => void; add: (item: T) => void },
       {
         open: (item: T) => void
         list: T[]
       },
       {
         foo: (list: T[]) => any
       }
     >
   ) {
     return () => {
       // render
     }
   }

   // ⚠️ props 还是要定义
   Foo.props = ['list', 'filter']

   export default declareComponent(Foo)
   ```

   目前 Volar 在泛型的支持上还有不少的坑。比如上面的示例中事件处理器的泛型变量会推断为 unknown。让子弹再飞一会吧。


<br> 
<br> 
<br> 

### element-adapter

实现的原理和 vue-demi 类似，在 postinstall 时决定使用哪个版本。项目的结构如下：

```bash
scripts/             # 和 vue-demi 一样，实现了 postinstall 和切换 CLI
  postinstall.mjs
  switch-cli.mjs
src/
  shared/
  v2/                # element-ui 导出
    components/
      Table.js
      Slide.js
      ...
  v3/                # element-plus 导出
    components/
      ...
types/               # 重新声明组件的类型信息。
  alert.d.ts
  ...
```

<br> 

大部分组件不需要特殊处理，重新导出就行：

```bash
export { Button } from 'element-ui';
```

<br> 

有一些组件参数名称发生了变化，则以 element-plus 为基准做一下调整：

```tsx
import { TimePicker as ElTimePicker } from 'element-ui'
import { h } from '@wakeadmin/h'

import { normalizeDateFormat } from '../../shared/date-format'

export const TimePicker = {
  functional: true,
  render(_, context) {
    const { format, selectableRange, valueFormat, ...other } = context.props

    // vue3 pickerOptions 提取到了全局
    other.pickerOptions = {
      ...other.pickerOptions,
      format: format && normalizeDateFormat(format),
      selectableRange,
    }

    if (valueFormat) {
      other.valueFormat = normalizeDateFormat(valueFormat)
    }

    return h(
      ElTimePicker,
      Object.assign({}, context.data, { props: other, attrs: undefined }),
      context.slots()
    )
  },
}
```

<br> 

另外，我们也会移植一些 element-plus 的新组件，比如 `TreeSelect`。

对于 icon 这类差异比较大，我们直接放弃了。可以使用外部图标库或者 SVG 组件库（参考这个[实现](https://github.com/wakeadmin/tools/tree/main/packages/icons)跨版本的 SVG 图标库）。

<br> 
<br> 
<br> 

### router-adapter

我们的组件库是可能会涉及到路由的订阅和操作。因为 vue-router API 差异并不大，处理起来会简单很多。

不管是 vue 2 还是 3，vue-router 都会在组件实例上挂载相关的 API, 我们直接获取就行：

```tsx
export interface RouteLike {
  query: Record<string, any>
  params: Record<string, any>
  hash: string
  path: string
}

export type RouteLocation =
  | string
  | {
      query?: Record<string, any>
      hash?: string
      path?: string
      name?: string
      params?: Record<string, any>
      replace?: boolean
    }

export interface RouterLike {
  push(to: RouteLocation): Promise<any>
  replace(to: RouteLocation): Promise<any>
  back(): void
  forward(): void
  go(delta: number): void
}

export function useRouter() {
  const instance = getCurrentInstance()

  if (isVue2) {
    return (instance?.proxy?.$root as { $router: RouterLike } | undefined)?.$router
  } else {
    return (instance?.root?.proxy as unknown as { $router: RouterLike })?.$router
  }
}

// ... useRoute 同理
```

<br> 

其他的库可以采取类似的策略。

<br> 
<br> 
<br> 

### 🎉 开源 🎉

借着这篇文章，我们也将相关的[程序开源了](https://github.com/wakeadmin)! 希望能帮助到大家！

- [jsx-runtime 实现](https://github.com/wakeadmin/tools/tree/main/packages/h)
- [组件库实现](https://github.com/wakeadmin/components)

欢迎 Fork Star PR

<br> 
<br> 
<br> 

## 扩展阅读

- [Vue 2/3 渲染函数差异以及兼容方案](https://www.notion.so/Vue-2-3-302cbe0e37794345bbfbd89e32d617db?pvs=21)
- [feat(types): `defineComponent()` with generics support](https://github.com/vuejs/core/pull/7963)
- [vitejs](https://cn.vitejs.dev/config/)
- https://github.com/vitejs/vite-plugin-vue
- https://github.com/vitejs/vite-plugin-vue2
- https://github.com/vuejs/babel-plugin-jsx
- https://github.com/vuejs/jsx-vue2
- https://github.com/vuejs/language-tools
- https://github.com/vuejs/vue-loader/
