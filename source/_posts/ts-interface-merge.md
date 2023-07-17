---
title: 'TypeScript 接口合并， 你不知道的妙用'
date: 2023/7/17
categories: 前端
---


![Untitled](/images/ts-interface-merge/Untitled.jpeg)

<br>

# 初识

[声明合并(Declaration Merging)](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces) 是 `Typescript` 的一个高级特性，顾名思义，`声明合并`就是将相同名称的一个或多个声明合并为单个定义。

例如：

```tsx
interface Box {
  height: number;
  width: number;
}
interface Box {
  scale: number;
}
let box: Box = { height: 5, width: 6, scale: 10 };

interface Cloner {
  clone(animal: Animal): Animal;
}
interface Cloner {
  clone(animal: Sheep): Sheep;
}
interface Cloner {
  clone(animal: Dog): Dog;
  clone(animal: Cat): Cat;
}

// Cloner 将合并为
//interface Cloner {
//  clone(animal: Dog): Dog;
//  clone(animal: Cat): Cat;
//  clone(animal: Sheep): Sheep;
//  clone(animal: Animal): Animal;
//}
```

<br>

声明合并最初的设计目的是为了解决早期 `JavaScript` 模块化开发中的类型定义问题。

- 早期的 JavaScript 库基本都使用全局的`命名空间`，比如  `jQuery`  使用 `$`, `lodash` 使用 `_`。这些库通常还允许对命名空间进行扩展，比如 jQuery 很多插件就是扩展 $ 的原型方法
- 早期很多 Javascript 库也会去扩展或覆盖 JavaScript 内置对象的原型。比如古早的 RxJS 就会去 「Monkey Patching」 JavaScript 的 Array、Function 等内置原型对象。

<br>
<br>

尽管这些方案在当今已经属于「反模式」了，但是在 Typescript 2012 年发布那个年代， jQuery 还是王者。

<br>

Typescript 通过类型合并这种机制，支持将分散到不同的文件中的命名空间的类型定义合并起来，避免编译错误。

现在是 ES Module 当道， 命名空间的模式已经不再流行。但是不妨碍 [声明合并](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#merging-interfaces) 继续发光发热，本文就讲讲它几个有趣的使用场景。

<br>
<br>
<br>

# JSX 内置组件声明

Typescript 下，内置的组件(`Host Components`) 都挂载在 `JSX` 命名空间下的 `IntrinsicElements` 接口中。例如 Vue 的 JSX 声明：

```tsx
// somehow we have to copy=pase the jsx-runtime types here to make TypeScript happy
import type {
  VNode,
  IntrinsicElementAttributes,
  ReservedProps,
  NativeElements
} from '@vue/runtime-dom'

// 🔴 全局作用域
declare global {
  namespace JSX {
    export interface Element extends VNode {}
    export interface ElementClass {
      $props: {}
    }
    export interface ElementAttributesProperty {
      $props: {}
    }
    
    // 🔴 内置组件定义
    export interface IntrinsicElements extends NativeElements {
      // allow arbitrary elements
      // @ts-ignore suppress ts:2374 = Duplicate string index signature.
      [name: string]: any
    }

    export interface IntrinsicAttributes extends ReservedProps {}
  }
}
```

<br>

我们也可以随意地扩展 IntrinsicElements，举个例子，我们开发了一些 `Web Component` 组件：

```tsx
declare global {
  namespace JSX {
    export interface IntrinsicElements {
      'wkc-header': {
        // props 定义
        title?: string;
      };
    }
  }
}
```

<br>

> 💡 上面例子中 JSX 是放在 `global` 空间下的，某些极端的场景下，比如有多个库都扩展了它，或者你即用了 Vue 又用了 React， 那么就会互相污染。
 现在 Typescript 也支持 JSX 定义的局部化，配合 [jsxImportSource](https://www.typescriptlang.org/tsconfig#jsxImportSource) 选项来开启， 参考 [Vue 的实现](https://github.com/vuejs/core/blob/main/packages/vue/jsx-runtime/index.d.ts)
> 

<br>
<br>
<br>

# Vue 全局组件声明

和 JSX 类似， Vue 全局组件、全局属性等声明也通过接口合并来实现。下面是 vue-router 的代码示例：

```tsx
declare module '@vue/runtime-core' {
  // Optional API 扩展
  export interface ComponentCustomOptions {
    beforeRouteEnter?: TypesConfig extends Record<'beforeRouteEnter', infer T>
      ? T
      : NavigationGuardWithThis<undefined>
    beforeRouteUpdate?: TypesConfig extends Record<'beforeRouteUpdate', infer T>
      ? T
      : NavigationGuard
    beforeRouteLeave?: TypesConfig extends Record<'beforeRouteLeave', infer T>
      ? T
      : NavigationGuard
  }

  // 组件实例属性
  export interface ComponentCustomProperties {
    $route: TypesConfig extends Record<'$route', infer T>
      ? T
      : RouteLocationNormalizedLoaded
    $router: TypesConfig extends Record<'$router', infer T> ? T : Router
  }

  // 🔴 全局组件
  export interface GlobalComponents {
    RouterView: TypesConfig extends Record<'RouterView', infer T>
      ? T
      : typeof RouterView
    RouterLink: TypesConfig extends Record<'RouterLink', infer T>
      ? T
      : typeof RouterLink
  }
}
```

<br>

上面我们见识了 JSX 使用 `declare global`  来挂载`全局作用域`，而 `declare module *` 则可以挂载到`具体模块的作用域`中。

<br>

另外，我们在定义 Vue Route 时，通常会使用 meta 来定义一些路由元数据，比如标题、权限信息等,  也可以通过上面的方式来实现：

<br>

```tsx
declare module 'vue-router' {
  interface RouteMeta {
    /**
     * 是否显示面包屑, 默认 false
     */
    breadcrumb?: boolean
    
    /**
     * 标题
     */
    title?: string

    /**
     * 所需权限
     */
    permissions?: string[]
  }
}
```

<br>

```tsx
export const routes: RouteRecordRaw[] = [ 
  {
    path: '/club/plugins',
    name: 'custom-club-plugins',
    component: () => import('./plugins'),
    // 现在 meta 就支持类型检查了
    meta: {
      breadcrumb: true,
    },
  },
  // ...
]
```

<br>
<br>
<br>

# 依赖注入：实现标识符和类型信息绑定

还有一个比较有趣的使用场景，即依赖注入。我们在使用 `[InversifyJS](https://github.com/inversify/InversifyJS)` 这里依赖注入库时，通常都会使用字符串或者 Symbol 来作为依赖注入的`标识符`。

```tsx
// inversify 示例
// 定义标识符
const TYPES = {
    Warrior: Symbol.for("Warrior"),
    Weapon: Symbol.for("Weapon"),
    ThrowableWeapon: Symbol.for("ThrowableWeapon")
};

@injectable()
class Ninja implements Warrior {
    @inject(TYPES.Weapon) private _katana: Weapon;
    @inject(TYPES.ThrowableWeapon) private _shuriken: ThrowableWeapon;
    public fight() { return this._katana.hit(); }
    public sneak() { return this._shuriken.throw(); }
}
```


<br>

但是这种标识符没有关联任何类型信息，无法进行类型检查和推断。

<br>

于是，笔者就想到了`接口合并`。能不能利用它来实现标识符和类型之间的绑定？答案是可以的：

我们可以声明一个全局的 `DIMapper` 接口。这个接口的 key 为依赖注入的标识符，value 为依赖注入绑定的类型信息。

```tsx
declare global {
  interface DIMapper {}
}
```

<br>

接下来，依赖注入的『供应商』，就可以用来声明标识符和注入类型的绑定关系：

```tsx
interface IPhone {
  /**
   * 打电话
   */
  call(num: string): void

  /**
   * 发短信
   */
  sendMessage(num: string, message: string): void
}

// 表示 DI.IPhone 这个标识符关联的就是 IPhone 接口类型
declare global {
  interface DIMapper {
    'DI.IPhone': IPhone
  }
}
```

<br>

我们稍微改造一下依赖注入相关方法的实现：

```tsx
/**
 * 获取所有依赖注入标识符
 */
export type DIIdentifier = keyof DIMapper;

/**
 * 计算依赖注入值类型
 */
export type DIValue<T extends DIIdentifier> = DIMapper[T];

/**
 * 注册依赖
 */
export function registerClass<I extends DIIdentifier, T extends DIValue<I>>(
  identifier: I,
  target: new (...args: never[]) => T,
): void

/**
 * 获取依赖
 */
export function useInject<I extends DIIdentifier, T extends DIValue<I>>(
  identifier: I,
  defaultValue?: T,
): T 
```

<br>

使用方法：

```tsx
class Foo {}
class MI {
  call(num: string) {}
  sendMessage(num: string, message: string) {}
}

registerClass('DI.IPhone', Foo) // ❌ 这个会报错，Foo 不符合 IPhone 接口
registerClass('DI.IPhone', MI) // ✅ OK!

const phone = useInject('DI.IPhone') // phone 自动推断为 IPhone 类型
```

> 💡 对于依赖注入，我在 [全新 JavaScript 装饰器实战下篇：实现依赖注入](https://juejin.cn/post/7250356064989397053)， 介绍了另外一种更加严格和友好的方式。
> 

<br>
<br>
<br>

# 事件订阅

同样的办法也可以用于`事件订阅`：

```tsx
declare global {
  /**
   * 声明 事件 标识符和类型的映射关系
   * @example 扩展定义
   * declare global {
   *   interface EventMapper {
   *     'Event.foo.success': ISuccessMessage
   *   }
   * }
   */
  interface EventMapper {}
}

/**
 * 事件名称
 */
export type EventName = keyof EventMapper;

/**
 * 事件参数
 */
export type EventArgument<T extends EventName> = EventMapper[T];
```

<br>
<br>

EventBus 实现：

```tsx
export class EventBus {

  /**
   * 监听事件
   */
  on<N extends EventName, A extends EventArgument<N>>(event: N, callback: (arg: A) => void) {}

  /**
   * 触发事件

   */
  emit<N extends EventName, A extends EventArgument<N>>(event: N, arg: A) {}
}
```

<br>
<br>
<br>

# 动态类型插槽

还有一个比较脑洞的例子，我之前封装过一个 Vue i18n 库，因为  Vue 2/3 差异有点大，所以我就拆了两个库来实现，如下图。`i18n` 用于  `Vue 3` + `vue-i18n@>=9`, `i18n-legacy` 用于 `Vue 2` + `vue-i18n@8`。

但是两个库大部分的实现是一致的，这些共性部分就提取到 `i18n-shared` ：

![Untitled](/images/ts-interface-merge/Untitled.png)

然而 `i18n-shared` 并不耦合 `Vue` 和 `vue-i18n` 的版本，也不可能将它们声明为依赖项， 那么它相关 API 的类型怎么办呢？

```tsx
// i18n-shared 代码片段
export interface I18nInstance {
  /**
   * vue 插件安装
   * 🔴 VueApp 是 Vue App 的实例
   */
  install(app: VueApp): void;

  // 🔴 vue-i18n 的实例
  i18n: VueI18nInstance;

  // ...

/**
 * 获取全局实例
 * @returns
 */
export function getGlobalInstance(): I18nInstance {
  if (globalInstance == null) {
    throw new Error(`请先使用 createI18n 创建实例`);
  }
  return globalInstance;
}

/**
 * 获取全局 vue i18n 实例
 */
export function getGlobalI18n(): I18nInstance['i18n'] {
  return getGlobalInstance().i18n;
}
```

<br>
<br>

这里用`泛型`也解决不了问题。

一些奇巧淫技还得是类型合并。我在这里就巧妙地使用了类型合并来创建`类型插槽。`

首先在 `i18n-shared` 下预定义一个接口：

```tsx
/**
 * 🔴 供子模块详细定义类型参数
 */
export interface I18nSharedTypeParams {
  // VueI18nInstance: vue i18n 实例类型
  // FallbackLocale
  // VueApp 应用类型
}

// 提取参数
// @ts-expect-error
type ExtraParams<T, V = I18nSharedTypeParams[T]> = V;

export type VueApp = ExtraParams<'VueApp'>;
export type VueI18nInstance = ExtraParams<'VueI18nInstance'>;
```

<br>

定义了一个接口 `I18nSharedTypeParams`，**它具体的类型由下级的库来注入**，我尚且把它命名为 “`动态类型插槽`” 吧。

现在 `i18n` 和 `i18n-legacy` 就可以根据自己的依赖环境来配置它了：

<br>
<br>

i18n-legacy:

```tsx
import VueI18n from 'vue-i18n'; // vue-i18n@8
import Vue from 'vue'; // vue@2

declare module 'i18n-shared' {
  export interface I18nSharedTypeParams {
    VueI18nInstance: VueI18n;
    VueApp: typeof Vue;
  }
}
```

<br>

i18n:

```tsx
import { VueI18n, Composer } from 'vue-i18n'; // vue-i18n@9+
import { App } from 'vue'; // vue@3

declare module 'i18n-shared' {
  interface I18nSharedTypeParams {
    VueI18nInstance: VueI18n<any, any, any> | Composer<any, any, any>;
    VueApp: App;
  }
}
```

> 💡 源码可以[看这里](https://github.com/wakeadmin/tools/blob/db3809305e5698ac31a130319f430377a0e9c1be/packages/i18n-shared/src/types.ts#L45)
> 

<br>
<br>
<br>

# 更多

当你深入了解了类型合并之后，你可能会在越来越多的地方发现它的身影。这毕竟是 TypeScript 为数不多，支持动态去扩展类型的特性。

更多的场景，读者可以开开脑洞，比如：

- `unplugin-vue-components`  Vue 组件自动导入是如何支持类型检查的？
- [unplugin-vue-router](https://github.com/posva/unplugin-vue-router) 如何实现支持类型检查的 vue-router?
- 给插件系统加上类型检查
- …