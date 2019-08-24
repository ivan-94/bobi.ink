---
title: "Typescript版图解Functor , Applicative 和 Monad"
date: 2019/8/22
categories: 前端
---

本文是经典的[Functors, Applicatives, And Monads In Pictures](http://adit.io/posts/2013-04-17-functors,_applicatives,_and_monads_in_pictures.html)的Typescript翻译版本。

Functor/Applicative/Monad是函数式编程中的一些比较‘基础’的概念，反正我是不认同‘基础’这个说法的，笔者也阅读过很多类似介绍Monad的文章，最后都不了了之，这些概念是比较难以理解的，而且平时编程实践中也很难会接触到这些东西。

后来拜读了[Functors, Applicatives, And Monads In Pictures](http://adit.io/posts/2013-04-17-functors,_applicatives,_and_monads_in_pictures.html), 不错，好像懂了。于是自己想通过翻译，再深入消化消化这篇文章，这里使用`Typescript`作为描述语言，对于前端来说会更好理解。

有理解不正确的地方，敬请指正. 开始吧！

<br>

这是一个简单的值:

![](https://bobi.ink/images/ts-fam/value.png)

例如这些

```ts
1        // number
'string' // string
```

大家都知道怎么将一个函数应用到这个值上面:

![](https://bobi.ink/images/ts-fam/value_apply.png)

```ts
// So easy
const add3 = (val: number) => val + 3
console.log(add3(2)) // 5
```

很简单了. 我们来扩展一下, 让任意的值是可以包装在一个**上下文(context)**当中. 现在的情况你可以想象一个可以把值放进去的盒子:

![](https://bobi.ink/images/ts-fam/value_and_context.png)

现在你**把一个函数应用到这个包装值的时候, 根据其上下文类型你会得到不同的结果**. 这就是 `Functor`, `Applicative`, `Monad`, `Arrow` 之类概念的基础. 

`Maybe` 就是一个典型的数据类型, 它定义了两种相关的‘**上下文**’, Maybe本身也是一个‘上下文’(除了值，其他类型都可以是一个上下文？):

![](https://bobi.ink/images/ts-fam/context.png)

原文基于Haskell，它的Maybe类型有两个上下文Just(蓝色盒子)和None(红色空盒子)。仿造Haskell在Typescript中我们可以使用`可选类型(Maybe)`来表示:

```ts
type Maybe<T> = Just<T> | Nothing // Just 表示值‘存在’，Nothing表示空值，类似于null、undefined的概念
```

Just和Nothing的基本结构:

```ts
// 我们只用None来取代null, 这里我们将None作为一个值，而不是一个类
export class None {}
// 对应None的类型
export type Nothing = typeof None

// 判断是否是Nothing，这里使用Typescript的 `Type Guards`
export const isNothing = (val: any): val is Nothing => {
  return val === None
}

// Just类型
export class Just<T> {
  static of<T>(val: T) {
    return new Just(val)
  }
  value: T
  constructor(value: T) {
    this.value = value
  }
}
```

使用示例:

```ts
let a: Maybe<number>;
a = None;
a = Just.of(3);
```

> 说实在这个实现有点挫, 但是为了更加贴近原文描述，暂且使用这个实现。之前考虑过的一个版本是下面这样的, 因为无法给它们扩展方法，就放弃了这个方案:
  ```ts
    type Optional<T> = NonNullable<T> | nul
    let a: Optional<number> = 1;
    a = null;
  ```

<br>

很快我们会看到对一个 `Just<a>` 和一个 Nothing 来说, 函数应用有何不同. 首先我们来看看 Functor!

<br>
<br>

## Functors

当一个值被包装在一个上下文中时, 你就不能拿普通函数来应用了:

![](https://bobi.ink/images/ts-fam/no_fmap_ouch.png)

```ts
declare let a: Just<number>;

const add3 = (v: number) => v + 3
add3(a) // ❌ 类型“Just<number>”的参数不能赋给类型“number”的参
```

这时候, 该 `fmap` 出场了. fmap 翩翩而来，从容应对上下文(fmap is from the street, fmap is hip to contexts). 还有谁? fmap 知道怎样将一个函数应用到一个包装在上下文的值上. **你可以对任何一个类型为 Functor 的类型使用 fmap**， 换句话说，Functor都定义了fmap.

比如说, 想一下你想把 add3 应用到 Just 2. 用 fmap:

```ts
Just.of(2).fmap(add3) // Just 5
```

![](https://bobi.ink/images/ts-fam/fmap_apply.png)

**💥嘭！** fmap 向我们展示了它的成果。 但是 fmap 怎么知道如何应用该函数的呢？

<br>

## 究竟什么是 Functor 呢？

在 Haskell 中 `Functor` 是一个[类型类(typeclass)](http://learnyouahaskell.com/types-and-typeclasses#typeclasses-101)。 其定义如下：

![](https://bobi.ink/images/ts-fam/functor_def.png)

在Typescript中， 一个Functor认为是**定义了fmap的任意类型**. 看看`fmap`是如何工作的:

![](https://bobi.ink/images/ts-fam/fmap_def.png)

1. 一个Functor类型的 fa, 例如Just 2
2. fa 定义了一个fmap, fmap 接受一个函数fn，例如add3
3. fmap 直到如何将fa应用到fn中， 返回一个Functor类型的 fb. **fa和fb的包装上下文类型一样**, 例如fa是Just, 那么fb也是Just; 反之fa是Nothing，fb也是Nothing;

用Typescript的函数签名描述一下：

```ts
<Functor T>.fmap<U>(fn: (val: T) => U): <Functor U>
```

所以我们可以这么做：

```ts
Just.of(2).fmap(add3) // Just 5
```

而 fmap 神奇地应用了这个函数，因为 Maybe 是一个 Functor, 它指定了 fmap 如何应用到 Just 上与 Nothing 上:

```ts
class Just<T> {
  // ...
  // 实现fmap
  fmap<U>(fn: (val: T) => U) {
    return Just.of(fn(this.value))
  }
}

class None {
  // None 接受任何函数都返回None
  static fmap(fn: any) {
    return None
  }
}
```

<br>

当我们写 `Just.of(2).fmap(add3)` 时，这是幕后发生的事情：

![](https://bobi.ink/images/ts-fam/fmap_just.png)

那么然后，就像这样，fmap，请将 add3 应用到 Nothing 上如何？

![](https://bobi.ink/images/ts-fam/fmap_nothing.png)

```ts
None.fmap(add3) // Nothing
```

![](https://bobi.ink/images/ts-fam/bill.png)

就像《黑客帝国》中的 Morpheus，fmap 知道都要做什么；如果你从 Nothing 开始，那么你会以 Nothing 结束！ fmap 是禅。

现在它告诉我们了 Maybe 数据类型存在的意义。 例如，这是在一个没有 Maybe 的语言中处理一个数据库记录的方式, 比如Javascript:

```js
let post = Post.findByID(1)
if (post != null) {
  return post.title
} else {
  return null
}
```

有了fmap后:

```ts
// 假设findPost返回Maybe<Article>
findPost(1).fmap(getPostTitle)
```

如果 findPost 返回一篇文章，我们就会通过 getPostTitle 获取其标题。 如果它返回 Nothing，我们就也返回 Nothing！ 较之前简洁了很多对吧?

> Typescript有了Optional Chaining后，处理null也可以很简洁:
 ```ts
 findPost(1)?.title // 异曲同工
 ```

> 原文还有定义了一个fmap的重载操作符版本，因为JavaScript不支持操作符重载，所以这里简单带过
 ```
 getPostTitle <$> findPost(1) // 使用操作符重载<$> 来简化fmap. 等价于上面的代码
 ```

<br>

再看一个示例：如果将一个函数应用到一个 Array（Haksell 中是 List）上会发生什么？

![](https://bobi.ink/images/ts-fam/fmap_list.png)

Array 也是 functor！

```ts
[1, 2, 3].map(add3) // [4, 5, 6]. fa是Array，输出fb也是Array，符合Functor的定义吧，所以Javascript的map就是fmap，Array就是Functor
```

<br>

好了，好了，最后一个示例：如果将一个函数应用到另一个函数上会发生什么？

```ts
const multiply3 = (v: number) => v * 3
const add3 = (v: number) => v + 3

add3.fmap(multiply3) // ❓
```

这是一个函数：

![](https://bobi.ink/images/ts-fam/function_with_value.png)

这是一个应用到另一个函数上的函数：

![](https://bobi.ink/images/ts-fam/fmap_function.png)

其结果是又一个函数！

```ts
// 仅作示例，不要模仿
interface Function {
  fmap<V, T, U>(this: (val: V) => T, fn: (val: T) => U): (val: V) => U
}
Function.prototype.fmap = function(fn) {
  return v => fn(this(v))
}
```

所以函数也是 Functor！ 对一个函数使用 fmap，其实就是函数组合(compose)！ 也就是说: `f.fmap(g)` 等价于 `compose(f, g)`

<br>

### Functor总结

通过上面的例子，可以知道Functor其实并没有那么难以理解, 一个Functor就是：

```
<Functor T>.fmap(fn: (v: T) => U): <Functor U>
```

Functor会定义一个‘fmap’操作，这个fmap接受一个函数fn，fn接收的是具体的值，返回另一个具体的值，例如上面的add3. **fmap决定如何来应用fn到源Functor(a)**， 返回一个新的Functor(b)。 也就是fmap的源和输出的值‘上下文’类型是一样的。比如

- `Just -> fmap -> Just`
- `Nothing -> fmap -> Nothing`
- `Maybe -> fmap -> Maybe`
- `Array -> fmap -> Array`

<br>
<br>

## Applicative

现在练到二重天了。 Applicative 又提升了一个层次。

对于 Applicative，我们的值依然和 Functor 一样包装在一个上下文中

![](https://bobi.ink/images/ts-fam/value_and_context.png)

不一样的是，我们**将Functor中的函数(例如add3)也包装在一个上下文中**！

![](https://bobi.ink/images/ts-fam/function_and_context.png)

嗯。 我们继续深入。 Applicative 并没有开玩笑。不像Haskell，Typescript并没有内置方式来处理Applicative。我们可以给需要支持Applicative的类型定义一个apply函数。**apply函数知道怎么将`包装在上下文的函数`应用到一个`包装在上下文的值`**：

```ts
class None {
  static apply(fn: any) {
    return None;
  }
}

class Just<T> {
  // 使用方法重载，让Typescript更好推断
  // 如果值和函数都是Just类型，结果也是Just类型
  apply<U>(fn: Just<(a: T) => U>): Just<U>;
  // 如果函数是Nothing类型，结果是Nothing.
  // 严格上apply只应该接收同一个上下文类型的函数，即Just,
  // 因为Maybe是Typescript的Union类型，没办法给它扩展方法，这里将Maybe和Just混在一起了
  apply<U>(fn: Nothing): Nothing;
  // 如果值和函数都是Maybe类型, 返回一个Maybe类型
  apply<U>(fn: Maybe<(a: T) => U>): Maybe<U> {
    if (!isNothing(fn)) {
      return Just.of(fn.value(this.value));
    }
    return None.apply(fn);
  }
}
```

<br>

再来看看数组:

```ts
// 仅作示例
interface Array<T> {
  apply<U>(fns: Array<(e: T) => U>): U[]
}

// 接收一个函数‘数组(上下文)’，返回一个应用了‘函数’的新的数组
Array.prototype.apply = function<T, U>(fns: Array<(e: T) => U>) {
  const res: U[] = []
  for (const fn of fns) {
    this.forEach(el => res.push(fn(el)))
  }
  return res
}
```

<br>

在Haskell中，使用`<*>`来表示apply操作: `Just (+3) <*> Just 2 == Just 5`. Typescript不支持操作符重载，所以忽略.

Just类型的Applicative应用图解：

![](https://bobi.ink/images/ts-fam/applicative_just.png)

数组类型的Applicative应用图解：

![](https://bobi.ink/images/ts-fam/applicative_list.png)

```ts
const num: number[] = [1, 2, 3]
console.log(num.apply([multiply2, add3]))
// [2, 4, 6, 4, 5, 6]
```

**这里有 Applicative 能做到而 Functor 不能做到的事情**。 如何将一个接受两个参数的函数应用到两个已包装的值上？

```ts
// 一个支持两个参数的Curry型加法函数
const curriedAddition = (a: number) => (b: number) => a + b

Just.of(5).fmap(curriedAddition) // 返回 `Just.of((b: number) => 5 + b)`
// Ok 继续
Just.of(4).fmap(Just.of((b: number) => 5 + b))  // ❌不行了，报错了，Functor没办法处理包装在上下文的fn
```

但是Applicative可以：

```ts
Just.of(5).fmap(curriedAddition) // 返回 `Just.of((b: number) => 5 + b)`
// ✅当当当
Just.of(3).apply(Just.of((b: number) => 5 + b)) // Just.of(8)
```

这时候Applicative 把 Functor 推到一边。 “大人物可以使用具有任意数量参数的函数，”它说。 “装备了 <$>(fmap) 与 <*>(apply) 之后，我可以接受具有任意个数未包装值参数的任意函数。 然后我传给它所有已包装的值，而我会得到一个已包装的值出来！ 啊啊啊啊啊！”

```ts
Just.of(3).apply(Just.of(5).fmap(curriedAddition)) // 返回 `Just.of(8)`
```

<br>

### Applicative总结

我们重申一个Applicative的定义, **如果Functor要求实现fmap的话，Applicative就是要求实现apply**，apply符合以下定义:

```
// 这是Functor的fmap定义
<Functor T>.fmap(fn: (v: T) => U): <Functor U>

// 这是Applicative的apply定义，和上面对比，fn变成了一个包装在上下文的函数
<Applicative T>.apply(fn: <Applicative (v: T) => U>): <Applicative U>
```

<br>
<br>

## Monad

终于练到三重天了！继续⛽加油️

如何学习 Monad 呢：

  1. 你要取得计算机科学博士学位。
  2. 然后把它扔掉，因为在本文你并不需要它！

Monad 增加了一个新的转变。

`Functor` 将一个`函数`应用到一个`已包装的值`上：

![](https://bobi.ink/images/ts-fam/fmap.png)

`Applicative` 将一个`已包装的函数`应用到一个`已包装的值`上：

![](https://bobi.ink/images/ts-fam/applicative.png)

Monad 将一个`返回已包装值的函数`应用到一个`已包装的值`上。 Monad 定义一个函数`flatMap`（在 Haskell 中是使用操作符 `>>=` 来应用Monad，读作“bind”）来做这个。

让我们来看个示例。 老搭档 Maybe 是一个 Monad：

![](https://bobi.ink/images/ts-fam/context.png)

假设 `half` 是一个只适用于偶数的函数：

```ts
// 这就是一个典型的: "返回已包装值"的函数
function half(value: number): Maybe<number> {
  if (value % 2 === 0) {
    return Just.of(value / 2)
  }
  return None
}
```

![](https://bobi.ink/images/ts-fam/half.png)

如果我们喂给它一个`已包装的值`会怎样？

![](https://bobi.ink/images/ts-fam/half_ouch.png)

我们需要使用flatMap(Haskell 中的>>=)来将我们已包装的值塞进该函数。 这是 >>= 的照片：

![](https://bobi.ink/images/ts-fam/plunger.jpg)

以下是它的工作方式：

```ts
Just.of(3).flatMap(half) // => Nothing, Haskell中使用操作符这样操作: Just 3 >>= half
Just.of(4).flatMap(half) // => Just 2
None.flatMap(half)       // => Nothing
```

内部发生了什么？我们再看看flatMap的方法签名:

```ts
// Maybe
Maybe<T>.flatMap<U>(fn: (val: T) => Maybe<U>): Maybe<U>

// Array
Array<T>.flatMap<U>(fn: (val: T) => U[]): U[]
```

![](https://bobi.ink/images/ts-fam/bind_def.png)

**Array是一个Monad**, Javascript的Array的flatMap已经正式成为标准， 看看它的使用示例:

```ts
const arr1 = [1, 2, 3, 4];
arr1.map(x => [x * 2]); 
// [[2], [4], [6], [8]]

arr1.flatMap(x => [x * 2]);
// [2, 4, 6, 8]

// only one level is flattened
arr1.flatMap(x => [[x * 2]]);
// [[2], [4], [6], [8]]
```

<br>

Maybe 也是一个 Monad：

```ts
class None {
  static flatMap(fn: any): Nothing {
    return None;
  }
}

class Just<T> {
  // 和上面的apply差不多
  // 使用方法重载，让Typescript更好推断
  // 如果函数返回Just类型，结果也是Just类型
  flatMap<U>(fn: (a: T) => Just<U>): Just<U>;
  // 如果函数返回值是Nothing类型，结果是Nothing.
  flatMap<U>(fn: (a: T) => Nothing): Nothing;
  // 如果函数返回值是Maybe类型, 返回一个Maybe类型
  flatMap<U>(fn: (a: T) => Maybe<U>): Maybe<U> {
    return fn(this.value)
  }
}

// 示例
Just.of(3).flatMap(half) // Nothing
Just.of(4).flatMap(half) // Just.of(4)
```

这是与 Just 3 运作的情况！

![](https://bobi.ink/images/ts-fam/monad_just.png)

如果传入一个 Nothing 就更简单了：

![](https://bobi.ink/images/ts-fam/monad_nothing.png)

你还可以将这些调用串联起来：

```ts
Just.of(20).flatMap(half).flatMap(half).flatMap(falf) // => Nothing
```

![](https://bobi.ink/images/ts-fam/monad_chain.png)
![](https://bobi.ink/images/ts-fam/whoa.png)

<br>

很炫酷哈！所以我们现在知道Maybe既是一个Functor、Applicative，还是一个Monad。

原文还示范了另一个例子: `IO` Monad, 我们这里就简单了解一下

![](https://bobi.ink/images/ts-fam/io.png)

IO的签名大概如下:

```ts
class IO<T> {
  val: T
  // 具体实现我们暂不关心
  flatMap(fn: (val: T) => IO<U>): IO<U>
}
```

具体来看三个函数。 getLine 没有参数, 用来获取用户输入：

![](https://bobi.ink/images/ts-fam/getLine.png)

```ts
function getLine(): IO<string>
```

readFile 接受一个字符串（文件名）并返回该文件的内容：

![](https://bobi.ink/images/ts-fam/readFile.png)

```ts
function readFile(filename: string): IO<string>
```

putStrLn 输出字符串到控制台：

![](https://bobi.ink/images/ts-fam/putStrLn.png)

```ts
function putStrLn(str: string): IO<void>
```

所有这三个函数都接受普通值（或无值）并返回一个已包装的值，即IO。 我们可以使用 flatMap 将它们串联起来！

![](https://bobi.ink/images/ts-fam/monad_io.png)

```ts
getLine().flatMap(readFile).flatMap(putStrLn)
```

太棒了！ 前排占座来看 monad 展示！我们不需要在取消包装和重新包装 IO monad 的值上浪费时间. flatMap 为我们做了那些工作!

Haskell 还为 monad 提供了语法糖, 叫做 do 表达式:

```haskell
foo = do
    filename <- getLine
    contents <- readFile filename
    putStrLn contents
```

<br>

## 总结

1. functor 是实现了 `fmap` 的数据类型。
2. applicative 是实现了 `apply` 的数据类型。
3. monad 是实现了 `flatMap` 的数据类型。
4. Maybe 实现了这三者，所以它是 functor、 applicative、 以及 monad。

这三者有什么区别呢？

![](https://bobi.ink/images/ts-fam/recap.png)

1. **functor**: 可通过 fmap 将一个`函数`应用到一个`已包装的值`上。
2. **applicative**: 可通过 apply 将一个`已包装的函数`应用到`已包装的值`上。
3. **monad**: 可通过 flatMap 将一个`返回已包装值的函数`应用到`已包装的值`上。

综合起来看看它们的签名：

```
// 这是Functor的fmap定义
<Functor T>.fmap(fn: (v: T) => U): <Functor U>

// 这是Applicative的apply定义，和上面对比，fn变成了一个包装在上下文的函数
<Applicative T>.apply(fn: <Applicative (v: T) => U>): <Applicative U>

// Monad的定义, 而接受一个函数， 这个函数返回一个包装在上下文的值
<Monad T>.flatmap(fn: (v: T) => <Monad U>): <Monad U>
```

所以，亲爱的朋友（我觉得我们现在是朋友了），我想我们都同意 monad 是一个简单且高明的主意（SMART IDEA(tm)）。 现在你已经通过这篇指南润湿了你的口哨，为什么不拉上 Mel Gibson 并抓住整个瓶子呢。 参阅《Haskell 趣学指南》的《来看看几种 Monad》。 很多东西我其实掩饰了因为 Miran 深入这方面做得很棒.

<br>

## 扩展

本文在[原文](http://adit.io/posts/2013-04-17-functors,_applicatives,_and_monads_in_pictures.html)的基础上, 参考了下列这些翻译版本，再次感谢这些作者:

- [Functors, Applicatives, And Monads In Pictures](http://adit.io/posts/2013-04-17-functors,_applicatives,_and_monads_in_pictures.html#translations) - 原文
- [Swift Functors, Applicatives, and Monads in Pictures](http://www.mokacoding.com/blog/functor-applicative-monads-in-pictures/) - Swift版本, 本文主要参考这篇文章
- [Kotlin 版图解 Functor、Applicative 与 Monad](https://hltj.me/kotlin/2017/08/25/kotlin-functor-applicative-monad-cn.html) - Kotlin版本，翻译非常棒
- [Functor, Applicative, 以及 Monad 的图片阐释](http://jiyinyiyong.github.io/monads-in-pictures/) - 中文版本，**题叶**翻译
- [Your easy guide to Monads, Applicatives, & Functors](https://medium.com/@lettier/your-easy-guide-to-monads-applicatives-functors-862048d61610) - Medium上一篇动图图解Monad的文章，写得也不错. 读完本文可以再读这篇文章
