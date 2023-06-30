---
title: '全新 JavaScript 装饰器实战下篇：实现依赖注入'
date: 2023/6/30
categories: 前端
---

![cover](/images/decorator-2/Untitled.jpeg)

<br>

系列文章：

- [全新 Javascript 装饰器实战上篇：用 MobX 的方式打开 Vue ](https://www.notion.so/Javascript-MobX-Vue-5e1c633167094d9784e602d66a5877f8?pvs=21)
- [全新 JavaScript 装饰器实战下篇：实现依赖注入](https://www.notion.so/JavaScript-0729df8081ec44b48f6f2e6ec7835120?pvs=21)

上一篇[文章](https://www.notion.so/Javascript-MobX-Vue-5e1c633167094d9784e602d66a5877f8?pvs=21)我们介绍了 JavaScript 最新的装饰器提案，以及它和旧版的区别。这篇文章我们将继续深入装饰器，尝试实现一个简易的依赖注入库。

<br>

谈到装饰器我们总会听到 `reflect-metadata`, 尤其是社区上的依赖注入库，比如 [inversify.js](https://github.com/inversify/InversifyJS)

<br>

![inversify.js](/images/decorator-2/Untitled.png)

<br>

**我们在上一篇文章的装饰器实现中，会直接去转换或者修改类的结构，大部分场景这并不是最佳实践。**

**大部分情况下我们应该利用装饰器来收集一些标注信息**，比如 MobX 用装饰器来标注哪些是 observable、哪些是 computed；Inversify.js 用 inject 标注哪些属性需要进行注入；Angular.js 使用 Input/Output 标记属性….

如果我们要通过装饰器来标记类的原信息，那就得来认识一下：装饰器的好搭子 `reflect-metadata` 。

<br>
<br>
<br>

## DI 库经常提及的 reflect-metadata 到底是什么？

这是一个 JavaScript 提案，但是作者并没有[将其提交到 TC39](https://github.com/rbuckton/reflect-metadata/issues/96)。它的继任者现在是 [Decorator Metadata](https://github.com/tc39/proposal-decorator-metadata)，现在已经进入了 Stage 3 阶段，Typescript 也将在 5.2 中实现这个提案。

Decorator Metadata 会在下文详细介绍，我们先来看看 reflect-metadata。

先来看看使用它能用来干啥：

```tsx
test('reflect-metadata', () => {
  const key = 'myKey'

  // 🔴 装饰器语法
  @Reflect.metadata(key, 'inClass')
  class Foo {
    @Reflect.metadata(key, 'inStaticMember')
    static staticMember = 1

    @Reflect.metadata(key, 'inMember')
    member = 2
  }

  // 🔴 上述装饰器等价于
  Reflect.defineMetadata(key, 'inClass', Foo)
  Reflect.defineMetadata(key, 'inStaticMember', Foo, 'staticMember')
  Reflect.defineMetadata(key, 'inMember', Foo.prototype, 'member')

  // 🔴 静态成员
  expect(Reflect.getMetadata(key, Foo)).toBe('inClass')
  expect(Reflect.getMetadata(key, Foo, 'staticMember')).toBe('inStaticMember')

  // 🔴 实例成员，**需要通过实例获取**
  expect(Reflect.getMetadata(key, Foo, 'member')).toBeUndefined()
  const foo = new Foo()
  expect(Reflect.getMetadata(key, foo, 'member')).toBe('inMember')
  // 或者通过原型对象获取
  expect(Reflect.getMetadata(key, Foo.prototype, 'member')).toBe('inMember')
})
```

<br>
<br>

通过上面的 「hello world」 我们可以发现：

1. 可以作为`装饰器`使用。这个表示这个提案和装饰器有不解的渊源，所以当我们谈及装饰器的时候，总会看到它的身影。
2. 元数据? 没那么高大上，就是一些 key/value 存储
3. 扩展了 Reflect API？为什么是 Reflect API?
4. 关于存储位置，类和静态成员存储在类上，实例成员存储在类的原型上(prototype)

<br>

通过上面的皮毛，我们 GET 不到它要解决痛点是啥。不就是存储一些元数据嘛，我们不需要这个 API 也可以做到，比如 MobX 的装饰器就是放在原型上的一个隐藏自定义属性上：

<br>

```tsx
export function storeAnnotation(prototype: any, key: PropertyKey, annotation: Annotation) {
  if (!hasProp(prototype, storedAnnotationsSymbol)) {
    addHiddenProp(prototype, storedAnnotationsSymbol, {
      // Inherit annotations
      ...prototype[storedAnnotationsSymbol],
    })
  }
  // ....
}
```

<br>
<br>
<br>

实际上这个概念是从其他语言借鉴的，比如下面 Java Spring 依赖注入：

```java
public class MovieRecommender {

	private final CustomerPreferenceDao customerPreferenceDao;

	@Autowired
	public MovieRecommender(CustomerPreferenceDao customerPreferenceDao) {
		this.customerPreferenceDao = customerPreferenceDao;
	}

	// ...
}
```

在 Java 中，可以通过它的 [Reflect API](https://docs.oracle.com/javase/8/docs/api/java/lang/reflect/package-summary.html) 可以获取到类的`类型信息`，比如方法、方法的参数、返回值等类型信息。

然而，JavaScript 是一门弱类型语言，没有这类信息。所以我们在实现`依赖注入`时，并不能做到像 Java 那么强大：

<br>

Java:

```java
public interface Engine {
  // ...
}

@Component
public class Car {
  @Autowired
  private Engine engine;

  public void start() {
      engine.turnOn();
  }
}
```

vs Typescript

```tsx
interface Engine {}

@injectable()
class Car {
  @inject('EngineKey')
  private engine: Engine
  start() {
    this.engine.turnOn()
  }
}
```

<br>

**Java Spring 可以自动推断类型来进行注入**，这个类型可以是接口、具体的类、抽象类等等。而现在 JavaScript 下的 DI 库，我们通常需要显式指定一个标识符，或者只能是一个具体的类(不支持接口)， 一点也不够优雅。

既然现在有了 `Typescript` ，能不能做到呢？Typescript 最终也是转换为 JavaScript ，默认情况下`类型信息`都会被裁减掉。

而 reflect-metadata 的初衷还是想将 Java/C# 这类语言的 Reflect 能力带到 JavaScript。**因此就拟定了这样一个协议， 让 Typescript 或者其他转译到 JavaScript 强类型语言，可以通过它将类型信息保留下来。**

<br>

所以我们看到 Typescript 是它的主要推动者。我们在 Typescript 中可以通过开启 `emitDecoratorMetadata` 实现装饰器类型信息的保留:

```tsx
interface Bar {}

@d
class Foo {
  @d
  static staticMember = 1

  @d
  member = 2

  @d
  method(foo: number, bar: Bar, baz: Foo): string {}

  constructor(a: Bar) {}
}
```

转换结果：

```tsx
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v)
  }
// 省略部分代码
__decorate([d, __metadata('design:type', Object)], Foo.prototype, 'member', void 0)
__decorate(
  [
    d,
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Number, Object, Foo]),
    __metadata('design:returntype', String),
  ],
  Foo.prototype,
  'method',
  null
)
__decorate([d, __metadata('design:type', Object)], Foo, 'staticMember', void 0)
Foo = __decorate([d, __metadata('design:paramtypes', [Object])], Foo)
```

我们看到大部分的类型信息都保留下来了，比如成员类型、方法的参数/返回值类型。

但是它也有局限性，比如接口等自定义类型依旧无法保留，毕竟 JavaScript 并没有这些概念。这也直接决定了依旧无法和 Java 这种「原生」强类型语言比肩。

<br>

> reflect-metadata 可能代表的是 JavaScript 作为一个新汇编语言的觉悟，但是目前的事实也证明了这条路比较难。就拿 Typescript 来说，保留的信息比较有限，而且这会让开发者的技术栈严重依赖 Typescript，另外像 esbuild、swc、babel 这些转译器也很难跟进这种特性。
> <br>
> 实际上，现在流行的 DI 库，如 `inversify`、`tsyringe` 对 Typescript `emitDecoratorMetadata` 的依赖也很小，去掉基本上不影响其有效运行。

>

<br>

总结, reflect-metadata 视图提供一个类(class)元信息的存储标准。在笔者开来，主要的愿景是为上层更高级的语言(比如 Typescript)保留静态类型信息提供一种方式。其次，普通开发者也能使用这个标准化的 API 来给类标注信息。

<br>
<br>
<br>

## Decorator Metadata

如今的 Metadata 提案已经从装饰器中分离出来，目前也进入了 Stage 3 阶段。经过重新设计的 Metadata 和 reflect-metadata 不是同一个玩意。

这个提案非常简单，就是新增了一个内置 Symbol —— `Symbol.metadata`。在装饰器的配合将元数据存储在类的 Symbol.metadata 下面:

<br>
<br>

针对装饰器协议的扩展:

```diff
type Decorator = (value: Input, context: {
  kind: string;
  name: string | symbol;
  access: {
    get?(): unknown;
    set?(value: unknown): void;
  };
  isPrivate?: boolean;
  isStatic?: boolean;
  addInitializer?(initializer: () => void): void;
+ metadata?: Record<string | number | symbol, unknown>;
}) => Output | void;
```

<br>

所有装饰器的 context 对象新增了 metadata 对象。 metadata 只是一个普通的对象，没什么特别：

```tsx
function meta(key: string) {
  return (value: unknown, context: DecoratorContext) => {
    context.metadata![key] = true
  }
}

@meta('inClass')
class Foo {
  @meta('inStaticMember')
  static staticMember = 1

  @meta('inMember')
  member = 2
}

// 类的所有装饰器共享
expect(Foo[Symbol.metadata]).toEqual({
  inStaticMember: true,
  inMember: true,
  inClass: true,
})
```

<br>
<br>

就是这么朴实且无华。因为**所有装饰器都是共享一个对象空间**，避免冲突的职责就交给开发者了。

大概有两种方式：

- 命名空间。比如单纯用字符串 key `库名称.{是否静态}.{装饰器位置}.{属性名}`，或者创建一个私有 Symbol 按嵌套的结构存储。
- 私有空间。以下是 MetaData 提案中的例子：

  ```tsx
  const PRIVATE_METADATA = new WeakMap();

  function meta(key, value) {
    return (_, context) => {
      let metadata = PRIVATE_METADATA.get(context.metadata);

      if (!metadata) {
        metadata = {};
        PRIVATE_METADATA.set(context.metadata, metadata);
      }

      metadata[key] = value;
    };
  }

  @meta('a' 'x')
  class C {
    @meta('b', 'y')
    m() {}
  }

  PRIVATE_METADATA.get(C[Symbol.metadata]).a; // 'x'
  PRIVATE_METADATA.get(C[Symbol.metadata]).b; // 'y'
  ```

<br>

Anyway，解决命名冲突有无数的办法。

> 🙋  那 `Typescript` 的 `emitDecoratorMetadata` 还支持吗？暂时看到相关的计划

<br>
<br>
<br>

## 简单理解依赖注入

现在开始实战部分，首先我们需要了解一下什么是依赖注入：

![di](/images/decorator-2/Untitled%201.png)

理解依赖注入，需要搞清楚以下几个概念：

- **接口(interface)。**接口是一个协议，或者是一个需求。这个由’甲方‘提出来，比如我们要一个手机，那么能“打电话”、”发短信”, 就是需求。接口是一个抽象的东西，并不是具体的实现。对于消费者来说它并不关心的内部细节、是怎么制造出来的。
- **实现(implements)**。满足接口需求的具体实现，比如“手机”这个接口的实现，可以是 iphone、小米手机、华为手机等等。
- **依赖注入**。依赖注入的意思就是`需求者`描述好自己的`需求`，然后由`经销商`来查找**符合需求**的`实现`，给到需求者。需求者从头到尾，不会去关心这个需求是怎么去实现的，它只关心它自己要干的事情。
- **三种角色**:
  - `需求者`。或者说`消费者`
  - `经销商`(容器)。我们也称为容器，他负责协调需求和实现。
  - `供应商`。需求的具体实现者。

<br>
<br>

可以通过一个例子(来源[这里](https://www.notion.so/wakeapp-framework-b08cb3cb5f8e49f597aa90bbb89a1641?pvs=21))来理解一下：

<br>

1. 定义需求(协议)

   首先定义需求，描述我们期望得到一个怎样的东西。

   需求通常使用 `interface` 来描述，当然，这并没有限制。你要一个类也可以、字符串、数字也可以，取决你的需求。

   比如我想要一个手机:

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
   ```

   注册你的需求和标识符的绑定关系：

   ```tsx
   declare global {
     interface DIMapper {
       'DI.IPhone': IPhone
     }
   }
   ```

2. 请求注入

   ```tsx
   class WeChat {
     // 注入请求
     @inject('DI.IPhone')
     myPhone: IPhone

     /**
      * 打电话老妈
      */
     callMom() {
       this.myPhone.call('137****110')
     }
   }
   ```

3. 实现需求

   接下来就是供应商来实现需求了。通常使用类来实现需求：

   ```jsx
   @injectable()
   class TheIPhone implements IPhone {
     call(num: string) {
       // 拨打电话流程
     }
     sendMessage(num: string, message: string) {
       // 发送短信流程
     }
   }
   ```

4. 注册实现

   ```tsx
   configureDI((registerSingletonClass) => {
     registerSingletonClass('DI.IPhone', TheIPhone)
   })
   ```

<br>
<br>

如果你理解了上面的例子，那么你已经懂依赖注入了。不过，当你接触到依赖注入的相关实现库时，还有听到这些概念：

- `容器(Container)`。 就是上文提到的`经销商`，用最简单技术术语来描述的话，他就是一个`对象池`。他负责协调`消费者`需求和`提供商`的实现。
- `作用域(Scope)`。就是对象的存活时间和活动范围
  - 存活时间：比较典型的有 singleton(单例)、request(请求， 这个一句话说不清楚，你可以类比为 「HTTP 请求」，这些对象仅在这一次 HTTP 的请求周期内有效)、transient(临时，即每次 inject 请求都创建一个新的对象)。当然，根据实际的场景还可以扩展，比如在 React 组件生命周期
  - 活动范围： 很多依赖注入库中，容器不是一个单一的对象，而是一个树状的结构，如果要限制某些对象的活动范围，或者覆盖对象的实现，可以通过 Fork 子容器的形式来实现隔离。
- `绑定(binding)`。即协议的绑定，比如上面的例子中我们使用 `DI.IPhone` 字符串来绑定协议和实现。其他编程语言可以做得更加灵活，只需要声明类型，容器会根据类型的兼容性来协调注入。

<br>

当然，一个生产级别的依赖注入实现还会涉及很多技术细节和概念，比如循环依赖、对象构造和析构、工厂、异步加载、对象生命周期管理、中间件、标签(Tagged)等等。

<br>

不过上面我们掌握的知识已经足够覆盖正常的开发场景了。

<br>
<br>

**依赖注入的好处就不多说了：**

- 解耦。面向接口编程。
- 可扩展性。每个依赖注入的点就是一个扩展点。
- 可测试性。可以让程序职责更加单一，关注真正需要关注的内容。屏蔽干扰，让核心逻辑更容易被测试。

<br>
<br>
<br>

## 继续探索 Typescript 装饰器的能力边界

在上篇[文章](https://www.notion.so/Javascript-MobX-Vue-5e1c633167094d9784e602d66a5877f8?pvs=21)中，我们提到 Typescript 对新版的装饰器有了更严格的检查。

<br>

它可以约束装饰器的位置：

```tsx
declare function injectable<T, Class extends abstract new (...args: any) => T>(): (
  value: Class,
  context: ClassDecoratorContext<Class>
) => void

@injectable()
class Foo {
  // @ts-expect-error ❌ 只能装饰类
  @injectable()
  member = 1

  // @ts-expect-error ❌ 只能装饰类
  @injectable()
  method() {}
}
```

<br>

这还不止，我们还可以对被装饰的目标值进行约束。以依赖注入的场景来看, 旧版的装饰器很难做到根据注入的标识符来约束`实现`和`注入`。现在我们很容易做到：

先来构造`注入标识符`的类型(灵感来源于 `Vue` 的 `provide/inject`)：

```tsx
export interface InjectionKey<T> extends Symbol {}
```

<br>

现在可以这样定义标识符：

```tsx
// 定义注入的协议，鸟类
interface Bird {
  fly(): void
  searchForFood(): void
  breed(): void
}

// 将接口和标识符实现绑定
const BIRD_BINDING: InjectionKey<Bird> = Symbol('Bird')
```

<br>

我们再来定义 `injectable` 装饰器：

```tsx
declare function injectable<T, Class extends abstract new (...args: any) => T>(
  // 传入 InjectionKey 类型，推断出 T 来约束 class
  key: InjectionKey<T>
): (value: Class, context: ClassDecoratorContext<Class>) => void
```

测试一下：

```tsx
// @ts-expect-error ❌ 没有履行 Bird 协议
@injectable(BIRD_BINDING)
class Eagle {}

// ✅ 履行了 Bird 协议
@injectable(BIRD_BINDING)
class Pigeon implements Bird {
  fly() {}
  searchForFood() {}
  breed() {}
}
```

我们现在可以对`实现者`的`协议履行`进行严格检查。

<br>
<br>

同理我们可以检查注入侧：

```tsx
declare function inject<T>(
  key: InjectionKey<T>
): (value: undefined, context: ClassFieldDecoratorContext<unknown, T | undefined>) => void

declare function injectAll<T>(
  key: InjectionKey<T>
): (value: undefined, context: ClassFieldDecoratorContext<unknown, T[] | undefined>) => void
```

示例：

```tsx
class Zoo {
  // @ts-expect-error ❌ 类型不匹配
  @inject(BIRD_BINDING)
  private unknown?: number

  // ✅
  @inject(BIRD_BINDING)
  private bird?: Bird

  // @ts-expect-error ❌ 类型不匹配
  @injectAll(BIRD_BINDING)
  private allBirds?: Bird

  // ✅
  @injectAll(BIRD_BINDING)
  private birds?: Bird[]
}
```

是不是很酷?！

<br>
<br>
<br>

## 实战

接下来我们把上面讲到的知识点运用起来，实现一个简易的依赖注入库。

🔴  运行环境：由于使用了较新的特性，其他构建平台暂未跟进(包括 Babel、Vite)。下面代码基于 Typescript 5.2(next) + `jest` + `ts-jest` 运行。

为了确保运行， 需要添加以下 polyfill：

```tsx
// typescript polyfill
declare global {
  interface SymbolConstructor {
    readonly metadata: unique symbol
  }

  interface Function {
    [Symbol.metadata]?: DecoratorMetadata
  }
}
// runtime polyfill
if (typeof Symbol.metadata === 'undefined') {
  // @ts-expect-error
  Symbol.metadata = Symbol('Symbol.metadata')
}
```

> 💡  在新版的装饰器中，实现依赖注入不一定要用到 Decorator Metadata, 可以看装饰器提案中的[例子](https://github.com/tc39/proposal-decorators#access-and-metadata-sidechanneling)。

<br>
<br>
<br>
<br>


### 装饰器 API

首先，我们把关键的装饰器 API 定义出来:

```tsx
// 🔴 InjectionKey 用于定义依赖注入的标识符, 可是实现标志服和协议的绑定，我们在上文介绍过了
export interface InjectionKey<T> extends Symbol {}

// 🔴 作用域类型, 作为简单示例，我们就支持两种作用域类型
export enum Scope {
  Singleton,
  Transient,
}

// 🔴 类装饰器，支持被注入的类都需要使用它来装饰
// 可以接受一个 scope，默认为 单例
export function injectable<T, Class extends abstract new (...args: any) => T>(
  key: InjectionKey<T>,
  scope?: Scope
) {
  return (value: Class, context: ClassDecoratorContext<Class>) => {
    const metadata = getOrCreateMetadata(context.metadata)

    if (metadata.injectable) {
      throw new Error('injectable is already defined')
    }

    metadata.injectable = key
    metadata.scope = scope
  }
}

// 🔴 属性装饰器, 声明注入
export function inject<T>(key: InjectionKey<T>) {
  return (value: undefined, context: ClassFieldDecoratorContext<unknown, T | undefined>) => {
    injectToField({ key, context })
  }
}

// 🔴 属性装饰器, 声明注入所有绑定
export function injectAll<T>(key: InjectionKey<T>) {
  return (value: undefined, context: ClassFieldDecoratorContext<unknown, T[] | undefined>) => {
    injectToField({ key, multiple: true, context })
  }
}
```

上述装饰器不会对类进行改造，只是利用 Decorator Metadata 进行一些标注：

```tsx
// 🔴 我们存储在类 Decorator Metadata 的数据
interface InjectionMetadata {
  // 类是否装饰了 @injectable
  injectable?: InjectionKey<unknown>
  // 作用域
  scope?: Scope
  // 类需要进行注入的属性
  injections?: Map<PropertyKey, Injection>
}

// 🔴 类属性注入信息
interface Injection {
  // 属性名
  key: InjectionKey<unknown>
  // 是否获取多个实例
  multiple?: boolean
  // 装饰器的上下文
  context: ClassFieldDecoratorContext
}

// 🔴 Decorator Metadata 的 KEY, 使用 Symbol，避免和其他库冲突
const METADATA_KEY: unique symbol = Symbol('METADATA_KEY')

// 初始化 metadata
function getOrCreateMetadata<T>(metadata: DecoratorMetadata): InjectionMetadata {
  if (metadata == null) {
    throw new Error('Decorator metadata is not defined')
  }

  return metadata[METADATA_KEY] ?? (metadata[METADATA_KEY] = {})
}

// 标记属性注入
function injectToField(injection: Injection) {
  const { context } = injection

  if (context.static === true) {
    throw new Error('inject cannot be used on static fields')
  }

  const metadata = getOrCreateMetadata(context.metadata)

  if (metadata.injections == null) {
    metadata.injections = new Map()
  }

  if (metadata.injections.has(context.name)) {
    throw new Error(`inject is already defined for ${context.name.toString()}`)
  }

  metadata.injections.set(context.name, injection)
}
```

测试驱动开发，我们先把测试用例写了，也方便读者对我们 API 的用法有基本的了解：

```tsx
// 定义协议
interface Bird {
  fly(): void
  searchForFood(): void
  breed(): void
}

interface IZoo {
  getAllBirds(): Bird[]
}

// 定义标识符，并绑定协议
const BIRD_BINDING: InjectionKey<Bird> = Symbol.for('Bird')
const ZOO_KEY: InjectionKey<IZoo> = Symbol.for('Zoo')

// ...

test('property inject', () => {
  // 🔴 使用 @injectable 标注支持注入的类
  @injectable(BIRD_BINDING)
  class MyBird {
    fly() {}
    searchForFood() {}
    breed() {}
  }

  @injectable(BIRD_BINDING)
  class MyBird2 {
    fly() {}
    searchForFood() {}
    breed() {}
  }

  @injectable(ZOO_KEY)
  class Zoo implements IZoo {
    // 🔴 获取所有 Bird 实例
    @injectAll(BIRD_BINDING)
    birds?: Bird[]

    getAllBirds() {
      return this.birds!
    }
  }

  // 🔴 注册到容器
  const container = new Container()
  container.bind(BIRD_BINDING, MyBird)
  container.bind(BIRD_BINDING, MyBird2)
  container.bind(ZOO_KEY, Zoo)

  // 测试
  const zoo = container.get(ZOO_KEY)

  expect(zoo).toBeInstanceOf(Zoo)
  expect(zoo.getAllBirds().length).toBe(2)
  expect(zoo.getAllBirds()[0]).toBeInstanceOf(MyBird)
  expect(zoo.getAllBirds()[1]).toBeInstanceOf(MyBird2)
})
```

<br>
<br>
<br>

### 容器实现

接下来就是实现容器了

```tsx
type Ctor<T = unknown> = new (...args: any) => T

export class Container {
  // 存储绑定关系
  private bindings: Map<InjectionKey<unknown>, Ctor[]> = new Map()
  // 单例对象池
  private pools: Map<Ctor, unknown> = new Map()

  // 🔴 绑定，传入 InjectionKey 和 类实现
  bind<T>(key: InjectionKey<T>, impl: new (...args: any) => T) {
    // 装饰器信息检查
    if (impl[Symbol.metadata] == null) {
      throw new Error(`No metadata found for ${impl.name}`)
    }

    const metadata = impl[Symbol.metadata]![METADATA_KEY] as InjectionMetadata | undefined

    if (metadata == null || metadata.injectable == null) {
      throw new Error(`No injectable found for ${impl.name}`)
    }

    // 存储
    if (this.bindings.has(key)) {
      this.bindings.get(key)!.push(impl)
    } else {
      this.bindings.set(key, [impl])
    }
  }

  // 🔴 获取实例
  get<T>(key: InjectionKey<T>): T {
    return this.resolve(key, false) as T
  }
  // 🔴 获取所有实例
  getAll<T>(key: InjectionKey<T>): T[] {
    return this.resolve(key, true) as T[]
  }

  /**
   * 🔴 对象查找
   */
  private resolve(key: InjectionKey<unknown>, multiple: boolean): unknown {
    const binding = this.bindings.get(key)

    if (binding == null) {
      throw new Error(`No binding found for ${key.toString()}`)
    }

    if (!multiple && binding.length > 1) {
      throw new Error(`Multiple bindings found for ${key.toString()}`)
    }

    return multiple
      ? binding.map((impl) => this.createInstance(impl))
      : this.createInstance(binding[0])
  }

  /**
   * 🔴 对象实例化
   */
  private createInstance(impl: Ctor): unknown {
    const metadata = impl[Symbol.metadata]![METADATA_KEY] as InjectionMetadata
    const { scope = Scope.Singleton, injections } = metadata

    // 单例
    if (scope === Scope.Singleton && this.pools.has(impl)) {
      return this.pools.get(impl)
    }

    // 实例化
    const instance = new impl()

    // 依赖注入，递归调用
    if (injections != null) {
      for (const injection of injections.values()) {
        const { key, context, multiple } = injection
        const value = multiple ? this.getAll(key) : this.get(key)
        // 🔴 利用新版装饰器的 access 实现注入
        context.access.set(instance, value)
      }
    }

    if (scope === Scope.Singleton) {
      this.pools.set(impl, instance)
    }

    return instance
  }
}
```

<br>

整个代码非常简单，这里对新版装饰器的妙用在于 `context.access.set(instance, value)` , 用起来非常方便，我们不需要关心属性的存储过程，比如`私有属性`。

<br>

上面的代码有一个问题没有解决，就是`循环依赖`。我们写一个测试来复现一下：

```tsx
test('cycle dependency', () => {
  const container = new Container()

  const A_KEY: InjectionKey<A> = Symbol('A')
  const B_KEY: InjectionKey<B> = Symbol('B')

  @injectable(A_KEY)
  class A {
    @inject(B_KEY)
    b?: B

    constructor() {}
  }

  @injectable(B_KEY)
  class B {
    @inject(A_KEY)
    a?: A

    constructor() {}
  }

  container.bind(A_KEY, A)
  container.bind(B_KEY, B)

  const a = container.get(A_KEY)
  expect(a).toBeInstanceOf(A)
  const b = container.get(B_KEY)
  expect(b).toBeInstanceOf(B)
  expect(a.b).toBe(b)
  expect(b.a).toBe(a)
})
```

上面的测试用例会出现`调用栈溢出`。因为 A → B 之间出现了循环依赖。这个也好办，我们新增一个缓存属性，存储正在实例化的对象，可以简单解决问题：

```diff
export class Container {
+ // 正在创建的对象
+ private creating: Map<Ctor, unknown> = new Map()

  /**
   * 对象实例化
   */
  private createInstance(impl: Ctor): unknown {
+   if (this.creating.has(impl)) {
+     return this.creating.get(impl)
+   }
    // ...
+   // 实例化
+   const instance = new impl()
+   // 缓存
+   this.creating.set(impl, instance)

+   try {
      // 依赖注入
      if (injections != null) {
        for (const injection of injections.values()) {
          const { key, context, multiple } = injection
          const value = multiple ? this.getAll(key) : this.get(key)
          context.access.set(instance, value)
        }
      }

      if (scope === Scope.Singleton) {
        this.pools.set(impl, instance)
      }
+   } finally {
+     this.creating.delete(impl)
+   }

    return instance
  }
}
```

上面就是装饰器的核心逻辑了。如果你对生产级别 DI 库感兴趣，可以深入看下扩展阅读提及的开源实现。

上面相关源码可以在[这里](https://github.com/ivan-94/decoractor-in-action/tree/new-di/src/di)找到。

<br>
<br>
<br>

## 总结

本文回顾了装饰器的老搭档 `reflect-metadata` 的历史，它的愿景给装饰器提供标准化的元数据存储服务，更长远来愿景是给 JavaScript 的上层语言提供保留静态信息的接口。

但它最终没有提交给 tc39, 现在随着新的装饰器标准的发展，已经被 `Decorator Metadata` 提案取代。`Decorator Metadata` 相比 reflect-metadata 简化很多，就是新增了 `Symbol.metadata`, 配合装饰器 context.metadata，开发者可以存储任意元数据。

接着我们继续探索了 Typescript 对装饰器类型检查的增强，可以让我们写出更安全的代码。尤其在 DI 这个场景。

最后我们将上面学到的知识融会贯通，开发了一个简易的依赖注入实现。

<br>
<br>
<br>

## 扩展阅读

- Decorator
  [https://github.com/tc39/proposal-decorators](https://github.com/tc39/proposal-decorators)
- Decorator Metadata
  [https://github.com/tc39/proposal-decorator-metadata](https://github.com/tc39/proposal-decorator-metadata)
- reflect-metadata
  [https://github.com/rbuckton/reflect-metadata](https://github.com/rbuckton/reflect-metadata)
  - [Why reflect-metadata suc\*s](https://dev.to/svehla/why-reflect-metadata-suc-s-5fal)
  - [Typescript Experimental Decorator](https://www.typescriptlang.org/docs/handbook/decorators.html)
  - [Introduction to “reflect-metadata” package and its ECMAScript proposal](https://medium.com/jspoint/introduction-to-reflect-metadata-package-and-its-ecmascript-proposal-8798405d7d88)
- DI 实现
  [https://github.com/inversify/InversifyJS](https://github.com/inversify/InversifyJS)
  [https://github.com/microsoft/tsyringe](https://github.com/microsoft/tsyringe)
  [https://github.com/midwayjs/injection](https://github.com/midwayjs/injection)
  [https://github.com/jeffijoe/awilix](https://github.com/jeffijoe/awilix)
  [https://github.com/typestack/typedi](https://github.com/typestack/typedi)
