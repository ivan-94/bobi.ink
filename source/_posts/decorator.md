---
title: '全新 Javascript 装饰器实战上篇：用 MobX 的方式打开 Vue'
date: 2023/6/26
categories: 前端
---

![cover](/images/decorator/Untitled.jpeg)

去年三月份[装饰器提案](https://github.com/tc39/proposal-decorators)进入了 Stage 3 阶段，而今年三月份 Typescript 在 5.0 也正式支持了 [](https://github.com/tc39/proposal-decorators/tree/8ca65c046dd5e9aa3846a1fe5df343a6f7efd9f8)。装饰器提案距离正式的语言标准，只差临门一脚。

这也意味着旧版的装饰器(Stage 1) 将逐渐退出历史舞台。然而旧版的装饰器已经被广泛的使用，比如 MobX、Angular、NestJS… 未来较长的一段时间内，都会是新旧并存的局面。

<br>

本文将把装饰器语法带到 `Vue Reactivity API` 中，让我们可以像 MobX 一样，使用类来定义数据模型, 例如:

```tsx
class Counter {
  @observable
  count = 1

  @computed
  get double() {
    return this.count * 2
  }

  add = () => {
    this.count++
  }
}
```

<br>

在这个过程中，我们可以体会到新旧装饰器版本之间的差异和实践中的各种陷阱。

<br>
<br>

## 概览

![思维导图](/images/decorator/Untitled.png)

关于装饰器的主要 API 都在上述思维导图中，除此之外，读者可以通过下文「扩展阅读」中提及的链接来深入了解它们。

<br>
<br>

## Legacy

首先，我们使用旧的装饰器来实现相关的功能。

在 Typescript 下，需要通过 `experimentalDecorators` 来启用装饰器语法:

```tsx
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

如果使用 Babel 7 ，配置大概如下：

```tsx
{
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "version": "legacy" }]
    ["@babel/plugin-transform-class-properties", {"loose": true }]
  ]
}
```

<br>
<br>

### @observable

我们先来实现 `@observable` 装饰器，它只能作用于「`类属性成员`」，比如:

```tsx
class Counter {
  @observable
  count = 1
}

const counter = new Counter()
expect(counter.count).toBe(1)
```

属性值可以是`原始类型`或者`对象类型`，没有限制。

为了让 Vue 的视图可以响应它的变化，我们可以使用 `ref` 来包装它。`ref` 刚好符合我们的需求，可以放置原始类型，也可以是对象, `ref` 会将其包装为 `reactive` 。

<br>

初步实现如下：

```tsx
export const observable: PropertyDecorator = function (target, propertyKey) {
  if (typeof target === 'function') {
    throw new Error('Observable cannot be used on static properties')
  }

  if (arguments.length > 2 && arguments[2] != null) {
    throw new Error('Observable cannot be used on methods')
  }

  const accessor: Initializer = (self) => {
    const value = ref()

    return {
      get() {
        return unref(value)
      },
      set(val) {
        value.value = val
      },
    }
  }

  // 定义getter /setter 长远
  Object.defineProperty(target, propertyKey, {
    enumerable: true,
    configurable: true,
    get: function () {
      // 惰性初始化
      return initialIfNeed(this, propertyKey, accessor).get()
    },
    set: function (value) {
      initialIfNeed(this, propertyKey, accessor).set(value)
    },
  })
}
```

解释一下上面的代码：

- 将装饰器的类型设置为 `PropertyDecorator`。
  > 📢 对应的类型还有： ClassDecorator、MethodDecorator、ParameterDecorator
  > <br>
  >
  > ⚠️ 旧版*装饰器使用位置上 Typescript 并没作类型检查，装饰器可以随意用在类、方法、属性各种位置上*。
  > <br>
- 可以通过 `target` 的类型，来判断装饰器作用于`静态成员`上还是`实例成员`上。如果是静态成员，target 是类本身；如果是实例成员，target 为类的`原型对象(prototype)`
- `属性装饰器`只会接收两个参数：类和属性名。因为属性在构造函数中创建, 在类定义阶段，获取不到更多信息：

  ```tsx
  class A {
    foo = 1
  }

  // transpile to
  class A {
    constructor() {
      this.foo = 1
    }
  }
  ```

- 我们定义了一个新的 `getter`/`setter` 成员, 这样外部才能透明地使用 ref, 不需要加上 `.value` 后缀
- `惰性初始化` ref。旧版的装饰器并没有提供 `addInitializer` 这样的初始化钩子，我们曲线救国，使用惰性初始化的方式：

  ```tsx
  const REACTIVE_CACHE = Symbol('reactive_cache')
  export interface ReactiveAccessor {
    get(): any
    set(value: any): void
  }

  function getReactiveCache(target: any): Record<string | symbol, any> {
    if (!hasProp(target, REACTIVE_CACHE)) {
      addHiddenProp(target, REACTIVE_CACHE, {})
    }

    return target[REACTIVE_CACHE]
  }

  export type Initializer = (target: any) => ReactiveAccessor

  export function initialIfNeed(target: any, key: string | symbol, initializer: Initializer) {
    const cache = getReactiveCache(target)
    // 如果属性未定义，就执行初始化
    if (!hasProp(cache, key)) {
      cache[key] = initializer(target)
    }

    return cache[key]
  }
  ```

      这里我们将信息缓存在 REACTIVE_CACHE 字段中，实现惰性初始化。

<br>
<br>
<br>

写个单元测试看看:

```tsx
test('base type', () => {
  class A {
    @observable
    str = 'str'

    @observable
    num = 1

    @observable
    withoutInitialValue: any
  }

  const a = new A()

  let str
  let num
  let withoutInitialValue
  // 🔴 初始值应该正常被设置
  expect(a.str).toBe('str')
  expect(a.num).toBe(1)
  expect(a.withoutInitialValue).toBe(undefined)

  // 🔴 属性的变动应该被检测
  watchSyncEffect(() => {
    str = a.str
  })
  watchSyncEffect(() => {
    num = a.num
  })
  watchSyncEffect(() => {
    withoutInitialValue = a.withoutInitialValue
  })

  a.str = 'new str'
  a.num = 2
  a.withoutInitialValue = 'withoutInitialValue'

  expect(str).toBe('new str')
  expect(num).toBe(2)
  expect(withoutInitialValue).toBe('withoutInitialValue')
})
```

<br>

💥 在较新的构建工具中(比如 vite)，上述的测试大概率无法通过！为什么？

<br>

**经过调试会发现我们在 observable 中的 `defineProperty` 并没有生效？**

<br>
<br>

通过阅读 Vite 的文档可以找到一些线索，即 Typescript 的 `[useDefineForClassFields](https://cn.vitejs.dev/guide/features.html#usedefineforclassfields)`:

> 从 Vite v2.5.0 开始，如果 TypeScript 的 target 是  `ESNext`  或  `ES2022`  及更新版本，此选项默认值则为  `true`。这与  **`[tsc` v4.3.2 及以后版本的行为](https://github.com/microsoft/TypeScript/pull/42663)**  一致。这也是标准的 ECMAScript 的运行时行为

<br>

`useDefineForClassFields` 会改变`类实例属性`的定义方式：

```tsx
class A {
  foo = 1
}

// 旧
class A {
  constructor() {
    this.foo = 1
  }
}

// 新：useDefineForClassFields
class A {
  constructor() {
    Object.defineProperty(this, 'foo', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 1,
    })
  }
}
```

这就是为什么我们装饰器内的 `defineProperty` 无法生效的原因。

<br>
<br>

解决办法：

方法 1： 显式关闭掉 useDefineForClassFields。如果是 Babel 需要配置 `@babel/plugin-transform-class-properties` 的 `loose` 为 true：

```tsx
{
  "plugins": [
    ["@babel/plugin-proposal-decorators", { "version": "legacy" }]
    ["@babel/plugin-transform-class-properties", {"loose": true }]
  ]
}
```

<br>
<br>

方法 2： 或者模仿 [MobX V6](https://www.mobxjs.com/enabling-decorators) 的 API:

```tsx
class TodoList {
  @observable todos = []

  @computed
  get unfinishedTodoCount() {
    return this.todos.filter((todo) => !todo.finished).length
  }

  constructor() {
    makeObservable(this)
  }
}
```

MobX 的 observable、computed 等装饰器只是收集了一些**`标记信息`，** 本身不会对类进行转换，真正进行转换是在 `makeObservable` 中进行的， 而 `makeObservable` 的执行时机是在所有属性都初始化完毕之后。

由于本文只关注装饰器的能力，这里就不展开了，有兴趣的读者可以看下 MobX 的源码。

<br>
<br>
<br>

### @computed

按照同样的方法，我们来实现一下 `@computed` 装饰器，MobX 的 computed 和 Vue 的 computed 概念基本一致，就是用来做衍生数据的计算。

<br>

@computed 只能应用在 `getter` 上面:

```tsx
export const computed: MethodDecorator = function (target, propertyKey, descriptor) {
  // 不支持 static
  if (typeof target === 'function') {
    throw new Error('computed cannot be used on static member')
  }

  // 必须是 getter
  if (
    descriptor == null ||
    typeof descriptor !== 'object' ||
    typeof descriptor.get !== 'function'
  ) {
    throw new Error('computed can only be used on getter')
  }

  const initialGetter = descriptor.get
  const accessor: Initializer = (self) => {
    const value = vueComputed(() => initialGetter.call(self))

    return {
      get() {
        return unref(value)
      },
      set() {
        // readonly
      },
    }
  }

  descriptor.get = function () {
    // 惰性初始化
    return initialIfNeed(this, propertyKey, accessor).get()
  }
}
```

- getter/setter/method 装饰器的用法一致。会接收 `descriptor` 作为第三个参数，我们可以对 `descriptor` 进行修改，或者返回一个新的 `descriptor`。
- 我们使用 vue 的 computed API 对 getter 函数进行简单包装。

<br>
<br>

测试一下：

```tsx
test('computed', () => {
  const count = ref(0)
  class A {
    @computed
    get double() {
      return count.value * 2
    }
  }

  const a = new A()
  let value
  watchSyncEffect(() => {
    value = a.double
  })

  expect(value).toBe(0)
  count.value++
  expect(value).toBe(2)
})
```

Ok, 没问题，可以正常运行。我们配合组件的实际场景再测试看看：

```tsx
test('render', () => {
  class A {
    @observable
    count = 1

    @computed
    get double() {
      return this.count * 2
    }
  }

  let count
  const a = new A()

  const Comp = defineComponent({
    setup() {
      watchSyncEffect(() => {
        count = a.double
      })

      return () => {
        /* ignore */
      }
    },
  })

  const { unmount } = render(Comp)

  let count2
  watchSyncEffect(() => {
    count2 = a.double
  })

  expect(count).toBe(2)
  expect(count2).toBe(2)

  a.count++
  expect(count).toBe(4)
  expect(count2).toBe(4)

  // 🔴 卸载
  unmount()

  a.count++
  expect(count).toBe(4)
  // 💥 received 4
  expect(count2).toBe(6)
})
```

<br>

上面的用例没有通过，**在组件卸载之后，@computed 装饰的 double 就失去了响应性**。Why?

<br>
<br>

解决这个问题之前，我们需要了解一下 `[effectScope](https://cn.vuejs.org/api/reactivity-advanced.html#effectscope)`, `effectScope` 创建一个 `effect 作用域`，可以捕获其中所创建的响应式副作用 (即计算属性和侦听器)，这样捕获到的副作用可以一起处理和销毁。

<br>

**Vue `setup` 就是包装在 effectScope 之下，如果我们的 computed 在 setup 下被初始化，就会被 setup 捕获，当组件卸载时就会被随之清理掉**。

<br>

我们的 `@computed` 是为全局作用域设计的，不能因为某个组件卸载而被销毁掉。为了解决这个问题，我们需要自己构造一个独立的 `悬挂 effectScope` (`Detached effectScope` )：

```diff
const accessor: Initializer = (self) => {
+   // true 标记为 detached
+   const scope = effectScope(true)
-   const value = vueComputed(() => initialGetter.call(self))
+   const value = scope.run(() => vueComputed(() => initialGetter.call(self)))

    return {
      get() {
        return unref(value)
      },
      set() {
        // readonly
      }
    }
  }
```

<br>

> 💡 watch 也会有相同的问题，读者可以自行尝试一下

<br>

💥 **会不会内存泄露？**理论上会泄露，取决于被 computed 订阅的数据源。如果该订阅源长期未释放，可能会出现内存泄露。
<br>

解决办法是将对应的`类实例`和`组件`的生命周期绑定。当组件释放时，调用类实例的释放方法，例如：

<br>

```tsx
const providerStore = <T,>(store: new () => T): T => {
  const instance = new store()
  // 将组件的 effectScope 传入实例中进行绑定
  instance.__effect_scope__ = getCurrentScope()
  return instance
}
// computed 实现调整
const scope = target.__effect_scope__ ?? effectScope(true)
// 在 setup 中调用
const store = providerStore(Store)
```

<br>
比如 `全局Store` 可以和 `Vue App` 绑定，`页面 Store` 可以和`页面组件`绑定。
<br>
🔴 **MobX computed 并没有该问题，MobX 的 computed 在`订阅者`清空时，会「`挂起`(suspend)」，清空自己的`订阅`(除非显式设置了 keepAlive)，从而可以规避这种内存泄露。详见[这里](https://github.com/mobxjs/mobx/blob/27efa3cc637e3195589874990c23d4de82c12072/packages/mobx/src/core/observable.ts%23L124)。
只能看后续 Vue 官方是否也作类似的支持了。**

<br>
<br>

---

<br>
<br>

## New

2022/3 装饰器议案正式进入 Stage 3 阶段，按照惯例，Typescript 也在 5.0 版本加入了该功能。

新版装饰器外形如下：

```tsx
type Decorator = (
  value: Input,
  context: {
    kind: string
    name: string | symbol
    access: {
      get?(): unknown
      set?(value: unknown): void
    }
    private?: boolean
    static?: boolean
    addInitializer?(initializer: () => void): void
  }
) => Output | void
```

<br>

相比旧版的装饰器，新版的 API 形式上更加统一了，并且提供了一些上下文信息，对于开发者来说更加便利。

<br>
<br>

核心的变化如下：

- 形式上更加统一，不管是什么位置，都遵循 `(value, context) ⇒ output | void`， 这个心智上更接近`管道(pipe)`, 接收一个 Value , 可以返回一个新的 Value 来**替换旧的 Value**。
  ![linux 管道](/images/decorator/Untitled%201.png)
  linux 管道

  <br>

- `context` 提供了必要的上下文信息，对开发者来说更加便利，可以快速判断装饰器的类型、是否为静态属性、私有属性等等。
- 更倾向于将装饰器当做一个纯函数(管道、转换器)来使用，尽量不包含副作用(比如修改类的结构)。

  <br>

  **为了限制副作用，装饰器基本上屏蔽了一些底层细节，比如 descriptor，构造函数、原型对象，这些在新的装饰器中基本拿不到。**

  <br>

  副作用只能在 `context.addInitializer` 中调用，但是能力也非常有限。就拿`属性装饰器`来举例，initializer 通常在 class 内置的 defineProperty 之前调用，如果你在 `initializer` 中使用了 `defineProperty`，那么将被覆盖:

  以 Typescript 的编译结果为例：

  ```tsx
  class Bar {
    @d
    foo = 1
  }

  // 编译结果：
  let Bar = (() => {
      var _a;
      let _instanceExtraInitializers_1 = [];
      let _foo_decorators;
      let _foo_initializers = [];
      return _a = class Bar {
              constructor() {
                  // 🔴 ③ 定义属性
                  Object.defineProperty(this, "foo", {
                      enumerable: true,
                      configurable: true,
                      writable: true,
                      value:
                        // 🔴 ① 先执行其他装饰器的 addInitializer 回调
                        (__runInitializers(this, _instanceExtraInitializers_1),
                          // 🔴 ② 属性装饰器的 initializer
                          __runInitializers(this, _foo_initializers, 1))
                  });
              }
          },
          (() => {
              _foo_decorators = [d];
              __esDecorate(null, null, _foo_decorators, { kind: "field", name: "foo", static: false, private: false, access: { has: obj => "foo" in obj, get: obj => obj.foo, set: (obj, value) => { obj.foo = value; } } }, _foo_initializers, _instanceExtraInitializers_1);
          })(),
          _a;
  ```

<br>

这样做的好处，笔者认为主要有以下几点:

- 性能优化：旧版的装饰器可以对 class 进行魔改，这就导致了引擎在解析完 Class 体后再去执行装饰器时，最终的 Class 结构可能发生较大的改变，导致引擎的优化无法生效（来源：[ECMAScript 双月报告：装饰器提案进入 Stage 3](https://developer.aliyun.com/article/892441)）。
- 因为旧版可能会对类的结构进行破坏性魔改，这种副作用可能导致多个装饰器组合时，有难以预期的问题。
- 更容易测试

<br>

**另外 Typescript 针对新的装饰器也提供了更严格的类型检查，比如可以约束装饰器使用的位置，旧版可以使用在任意位置，只能通过运行时进行检查**。

![Typescript 为新版装饰器提供了更严格的类型检查](/images/decorator/Untitled%202.png)

Typescript 为新版装饰器提供了更严格的类型检查

<br>

> 💡  目前装饰器还未成为正式的语言特性，不排除后面还有特性变更。

<br>

> 💡  截止至文章发布的时间，Vite 使用新版装饰器还有一些问题。本文使用 Babel + Jest 来测试相关代码。

<br>
<br>
<br>

### @observable

新版的`属性装饰器` API 如下：

```tsx
type ClassFieldDecorator = (
  value: undefined,
  context: {
    kind: 'field'
    name: string | symbol
    access: { get(): unknown; set(value: unknown): void }
    static: boolean
    private: boolean
  }
) => (initialValue: unknown) => unknown | void
```

- value 始终为 undefined，因为属性在类定义时不存在，无法获取到初始值
- context 没有 `addInitializer` 。属性装饰器的返回值是一个函数，这个实际上就是一个 `initializer`
- 访问不到类和类的原型
- 在 initializer 中也不能调用 defineProperty。原因见上文

也就是说，**属性装饰器基本上堵死了我们去改造属性的机会**…

<br>
<br>

---

<br>

且慢，跟随装饰器发布的还有一个`自动访问器`(Auto Accessor)的特性(🙂  越来越像 Java、C# 了）

自动访问器使用 `accessor` 关键字定义：

```tsx
class C {
  accessor x = 1
}
```

相当于：

```tsx
class C {
  #x = 1

  get x() {
    return this.#x
  }

  set x(val) {
    this.#x = val
  }
}
```

这有啥用？稍安勿躁，它在装饰器场景有大用，先来看下它的 API:

```tsx
type ClassAutoAccessorDecorator = (
  value: {
    get: () => unknown;
    set(value: unknown) => void;
  },
  context: {
    kind: "accessor";
    name: string | symbol;
    access: { get(): unknown, set(value: unknown): void };
    static: boolean;
    private: boolean;
    addInitializer(initializer: () => void): void;
  }
) => {
  get?: () => unknown;
  set?: (value: unknown) => void;
  init?: (initialValue: unknown) => unknown;
} | void;
```

- value 接收 getter 和 setter
- 可以返回新的 getter 和 setter
- init 可以对初始值进行**_转换_**。

<br>
<br>

它的妙用在于，我们可以「兵不血刃」(不改变结构或者新增属性)地实现拦截，看看我们 observable 的实现就知道了：

```tsx
export function observable<This, Value>(
  value: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value> | void {
  if (context.kind !== 'accessor') {
    throw new Error('observable can only be used on accessor')
  }

  if (context.static) {
    throw new Error('observable can not be used on static accessor')
  }

  return {
    init(val) {
      return ref(val)
    }
    get() {
      return (value.get.call(this) as Ref<Value>).value
    },
    set(val) {
      const ref = value.get.call(this) as Ref<Value>

      ref.value = val
    },
  }
}
```

<br>

- 通过 `context`，我们可以更方便地判断是否是静态成员、是否装饰在预期的位置
- 上述代码我们没有修改任何类的结构、新增任何属性。我们直接在 init 中将初始值转换为 ref, 相对应的 getter/setter 也作简单的改造。

<br>

很简单是不是？只不过，这个对已有的代码倾入性太大了，所有相关的属性都需要修改为 `accessor`, 但对于 API 使用者来说没什么区别：

```tsx
class A {
  @observable
  accessor obj = {
    count: 1,
  }
}
```

<br>
<br>
<br>

### @computed

Getter 装饰器和 Setter、Method 装饰器类型基本一致：

<br>

```tsx
type ClassGetterDecorator = (
  value: Function,
  context: {
    kind: 'getter'
    name: string | symbol
    access: { get(): unknown }
    static: boolean
    private: boolean
    addInitializer(initializer: () => void): void
  }
) => Function | void
```

<br>
<br>

直接来看 computed 实现：

```tsx
export function computed<This, Return, Value extends () => Return>(
  value: Value,
  context: ClassGetterDecoratorContext<This, Return>
): Value | void {
  if (context.static) {
    throw new Error('computed cannot be used on static member')
  }

  if (context.kind !== 'getter') {
    throw new Error('computed can only be used on getter')
  }

  context.addInitializer(function (this: unknown) {
    const scope = effectScope(true)

    const val = scope.run(() => vueComputed(() => value.call(this)))

    Object.defineProperty(this, context.name, {
      configurable: true,
      enumerable: false,
      get() {
        return unref(val)
      },
    })
  })
}
```

<br>
<br>

通过 `addInitializer` 来添加初始化逻辑(副作用)， this 为当前类的实例。旧版的装饰器并没有提供类似的时机，我们只能通过`惰性初始化`去模拟这种效果。

<br>

不过上面的程序也有个潜在的 BUG, 我们在新建一个 log 装饰器，组合在一起看看：

```tsx
function log(value: Function, context: ClassGetterDecoratorContext) {
  return function (this: unknown) {
    console.log('start calling...')
    return value.apply(this)
  }
}

class A {
  @observable
  accessor count = 1

  @log
  @computed
  get double() {
    return this.count * 2
  }
}
```

执行上述代码，我们会发现并没有打印 `start calling...` 邪恶的副作用…

<br>
<br>

主要原因是上述代码我们在 `addInitializer` 中引用的 ‘value’ 是类原始的 getter 值，而我们又重新用 defineProperty 覆盖了属性，导致 @log 装饰的值丢失了。

<br>

实际上在新版的装饰器中，更符合规范的用法是：**返回新的值来替换旧的值**

```tsx
const COMPUTED_CACHE: unique symbol = Symbol('computed_cache')

export function computed<This, Return, Value extends () => Return>(
  value: Value,
  context: ClassGetterDecoratorContext<This, Return>
): Value | void {
  // ...

  // 🔴 初始化缓存对象
  context.addInitializer(function (this: unknown) {
    if (!Object.prototype.hasOwnProperty.call(this, COMPUTED_CACHE)) {
      Object.defineProperty(this, COMPUTED_CACHE, {
        configurable: true,
        enumerable: false,
        value: new Map(),
      })
    }
  })

  return function (this: Object) {
    const cache = this[COMPUTED_CACHE] as Map<string | symbol, Ref<Return>>
    if (!cache.has(context.name)) {
      // 🔴 惰性初始化
      const scope = effectScope(true)

      const val = scope.run(() => vueComputed(() => value.call(this)))!

      cache.set(context.name, val)
    }

    return unref(cache.get(context.name))
  } as Value
}
```

<br>

上面的代码中，我们返回的新的函数来取代原有的 `getter`，另外在 `addInitializer` 中初始化缓存属性。我们建议在 `addInitializer` 中一次性将需要的属性都初始化完毕，避免在 getter 中动态去添加新的属性，[利好 JavaScript 引擎的优化](https://mathiasbynens.be/notes/shapes-ics)。

<br>

这样做的好处是更符合新版装饰器的心智和设计意图，也可以保证装饰器按照组合的顺序调用。

<br>
<br>

## 总结

本文主要详细对比了新版和旧版的装饰器差异，通过实战将装饰器的能力和陷阱挖掘出来。

<br>

总得来说，新版的装饰器更加统一直观、更容易入手，在能力上也克制地收敛了。不过目前社区上大量的库和框架还停留在 Stage 1 装饰器，升级和改造需要较大的成本，我们可以暂时观望观望。

<br>

下一步：装饰器比较复杂的应用是依赖注入，当前的依赖注入库都深度依赖 `reflect-metadata` 来实现。而 [Decorator Metadata](https://github.com/tc39/proposal-decorator-metadata?spm=a2c6h.12873639.article-detail.8.68bd13c4Dt6Qt7) 目前也进入了 Stage 3 阶段，很快就会和我们见面(Typescript 5.2)，届时我们再聊聊如何实现依赖注入(🐶 看你们的点赞)。


<br>
<br>

## 扩展阅读

- **[proposal-decorators](https://github.com/tc39/proposal-decorators)**
- [Typescript 5.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html) 发布日志
- [TypeScript 5.0 将支持全新的装饰器写法！](https://mp.weixin.qq.com/s/QnWez2sEWuL8j8GVDmBNTA)
- [ECMAScript 双月报告：装饰器提案进入 Stage 3](https://developer.aliyun.com/article/892441)
- [vite typescript `useDefineForClassFields`](https://cn.vitejs.dev/guide/features.html#usedefineforclassfields)
- [@babel/plugin-proposal-decorators](https://babeljs.io/docs/babel-plugin-proposal-decorators)
- Javascript 引擎优化机制:
  - [JavaScript engine fundamentals: Shapes and Inline Caches](https://mathiasbynens.be/notes/shapes-ics)
  - [JavaScript engine fundamentals: optimizing prototypes](https://mathiasbynens.be/notes/prototypes)
- [MobX](https://cn.mobx.js.org/refguide/action.html)
