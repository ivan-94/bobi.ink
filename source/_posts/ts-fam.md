---
title: "Typescript版图解Functor , Applicative 和 Monad"
date: 2019/8/22
categories: 前端
---

- [Swift Functors, Applicatives, and Monads in Pictures](http://www.mokacoding.com/blog/functor-applicative-monads-in-pictures/)
- [Functor、Applicative 和 Monad](http://blog.leichunfeng.com/blog/2015/11/08/functor-applicative-and-monad/)
- [Your easy guide to Monads, Applicatives, & Functors](https://medium.com/@lettier/your-easy-guide-to-monads-applicatives-functors-862048d61610)
- [Functors, Applicatives, And Monads In Pictures](http://adit.io/posts/2013-04-17-functors,_applicatives,_and_monads_in_pictures.html#translations)
- [Playground](https://codesandbox.io/s/functors-applicatives-and-monads-in-pictures-p753n)

这是一个简单的值:

![](/images/ts-fam/value.png)

例如

```ts
1        // number
'string' // string
```

我们都知道怎么加一个函数应用到这个值上边:

![](/images/ts-fam/value_apply.png)

```ts
const add3 = (val: number) => val + 3
console.log(add3(2)) // 5
```

很简单了. 我们来扩展一下, 让任意的值是在一个**上下文(context)**当中. 现在的情况你可以想象一个可以把值放进去的盒子:

![](/images/ts-fam/value_and_context.png)

现在你**把一个函数应用到这个值的时候, 根据其上下文你会得到不同的结果**. 这就是 `Functor`, `Applicative`, `Monad`, `Arrow` 之类概念的基础. 

`Maybe` 就是一个典型的数据类型, 它定义了两种相关的‘上下文’:

![](/images/ts-fam/context.png)

原文基于Haskell，它的Maybe类型有两个上下文Just(蓝色盒子)和None(红色空盒子)。仿造Haskell在Typescript中我们可以使用`可选类型(Optional)`来表示:

```ts
type Maybe<T> = Just<T> | typeof Nothing // NonNullable对应 Just，None 对应Nothing
```

Just和Nothing的基本结构:

```ts
class Just<T> {
  public static of<T>(val: T) {
    return new Just(val)
  }
  public constructor(public val: T) {}
}

class Nothing {}
```

说实在这个实现有点挫, 但是为了更加贴切原文意思，暂且使用这个实现。之前考虑过的一个版本是这样的:

```ts
type Optional<T> = NonNullable<T> | nul
let a: Optional<number> = 1;
a = null;
```

很快我们会看到对一个 Just<a> 和一个 Nothing 来说, 函数应用有何不同. 首先我们来说 Functor!

> 之前的版本

## Functor

当一个值被封装在一个上下文里, 你就不能拿普通函数来应用:

![](/images/ts-fam/no_fmap_ouch.png)

```ts
declare let a: Just<number>;

const add3 = (v: number) => v + 3
add3(a) // ❌ 类型“Just<number>”的参数不能赋给类型“number”的参
```

就在这里 `fmap` 出现了. fmap 翩翩而来，从容应对上下文(fmap is from the street, fmap is hip to contexts). fmap 知道怎样将一个函数应用到一个包装在上下文的值上. 你可以对任何一个类型为 Functor 的类型使用 fmap.

比如说, 想一下你想把 add3 应用到 Just 2. 用 fmap:

```ts
Just.of(2).fmap(add3) // Just 5
```

![](/images/ts-fam/fmap_apply.png)

嘭！ fmap 向我们展示了它的成果。 但是 fmap 怎么知道如何应用该函数的呢？

## 究竟什么是 Functor 呢？

在 Haskell 中 [Functor](https://learnyoua.haskell.sg/content/zh-cn/ch03/type-and-typeclass.html#typeclasses%E5%85%A5%E9%97%A8) 是一个类型类。 其定义如下：

![](/images/ts-fam/functor_def.png)

在Typescript中， 一个Functor认为是**定义了fmap的任意类型**. 看看fmap是如何工作的:

![](/images/ts-fam/fmap_def.png)

1. fmap 接受一个函数，例如add3
2. 接受一个functor类型的 fa, 例如Just 2
3. 返回一个functor类型的 fb， **fa和fb的包装上下文类型一样**, 例如fa是Just, 那么fb也是Just; 反之fa是Nothing，fb也是Nothing; 

换句话说fmap

所以我们可以这么做：

```ts
Just.of(2).fmap(add3) // Just 5
```

而 fmap 神奇地应用了这个函数，因为 Maybe 是一个 Functor。 它指定了 fmap 如何应用到 Just 上与 Nothing 上:

```ts
class Just<T> {
  // ...
  // 实现fmap
  public fmap<U>(fn: (val: T) => U) {
    return Just.of(fn(this.val))
  }
}

class Nothing {
  public static fmap(fn: Function) {
    return Nothing
  }
}
```

当我们写 `Maybe.Just(2).fmap(add3)` 时，这是幕后发生的事情：

![](/images/ts-fam/fmap_just.png)

那么然后，就像这样，fmap，请将 add3 应用到 Nothing 上如何？

![](/images/ts-fam/fmap_nothing.png)

```ts
Nothing.fmap(add3) // Nothing
```

![](/images/ts-fam/bill.png)

就像《黑客帝国》中的 Morpheus，fmap 知道都要做什么；如果你从 Nothing 开始，那么你会以 Nothing 结束！ fmap 是禅。 现在它告诉我们了 Maybe 数据类型存在的意义。 例如，这是在一个没有 Maybe 的语言中处理一个数据库记录的方式, 比如Javascript:

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
findPost(1).fmap(getPostTitle)
```

如果 findPost 返回一篇文章，我们就会通过 getPostTitle 获取其标题。 如果它返回 Nothing，我们就也返回 Nothing！ 较之前简洁了一点

> 原文还有定义了一个fmap的重载操作符版本，因为JavaScript不支持操作符重载，所以这里简单带过
> 
> ```
> getPostTitle <$> findPost(1) // 使用操作符重载<$> 来简化fmap
> ```

再看一个示例：如果将一个函数应用到一个 Array（Haksell 中是 List）上会发生什么？

![](/images/ts-fam/fmap_list.png)

Array 也是 functor！

```ts
[1, 2, 3].map(add3) // [4, 5, 6]. fa是Array，输出fb也是Array，符合Functor的定义
```

好了，好了，最后一个示例：如果将一个函数应用到另一个函数上会发生什么？

```ts
// 因为受限语言，这里使用一个函数，而不是将fmap作为一个方法，懂就行了
fmap(x => x +1, y => y + 3) // ?
```

这是一个函数：

![](/images/ts-fam/function_with_value.png)

这是一个应用到另一个函数上的函数：

![](/images/ts-fam/fmap_function.png)

其结果是又一个函数！

```ts
function fmap<T, U, R>(fn: (a: T) => U, transform: (b: U) => R): (a: T) => R {
  return (val: T) => transform(fn(val));
}
```

所以函数也是 Functor！ 对一个函数使用 fmap，其实就是函数组合(compose)！ 也就是说: `f.fmap(g) == compose(f, g)`

### Functor总结

通过上面的例子，可以知道Functor其实并没有那么难以理解, 一个Functor就是：

```
<Functor a>.fmap(fn: (v: T) => U): <Functor b>
```

`Functor会定义一个‘fmap’，这个fmap接受一个函数fn，fn接收的是具体的值，返回另一个具体的值，例如上面的add3. **fmap决定如何来应用fn到源Functor(a)**， fmap返回一个新的Functor(b)`。 也就是fmap的源和输出的值‘上下文’类型是一样的。比如

- `Just -> fmap -> Just`
- `Nothing -> fmap -> Nothing`
- `Maybe -> fmap -> Maybe`
- `Array -> fmap -> Array`

<br>

## Applicative

现在练到二重天了。 Applicative 又提升了一个层次。

对于 Applicative，我们的值依然和 Functor 一样包装在一个上下文中

![](/images/ts-fam/value_and_context.png)

不一样的是，我们将Functor中的函数(例如add3)也包装在一个上下文中！

![](/images/ts-fam/function_and_context.png)

嗯。 我们继续深入。 Applicative 并没有开玩笑。不像Haskell，Typescript并没有内置方式来处理Applicative。我们可以给需要支持Applicative的类型定义一个apply函数。apply函数知道怎么将`包装在上下文的函数`应用到一个`包装在上下文的值`：

```ts
class None {
  public static apply(fn: any): Nothing {
    return None;
  }
}

const isNothing = (val: any): val is Nothing => {
  return val === None;
};

class Just<T> {
  // 使用方法重载，让Typescript更好推断
  // 如果值和函数都是Just类型，结果也是Just类型
  public apply<U>(fn: Just<(a: T) => U>): Just<U>;
  // 如果函数是Nothing类型，结果是Nothing. 严格上apply只应该接收同一个上下文类型的函数，即Just
  public apply<U>(fn: Nothing): Nothing;
  // 如果值和函数都是Maybe类型, 返回一个Maybe类型 
  public apply<U>(fn: Maybe<(a: T) => U>): Maybe<U> {
    if (!isNothing(fn)) {
      return Just.of(fn.value(this.value));
    }
    return None;
  }
}
```

再来看看数组:

```ts
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

在Haskell中，使用<*>来表示apply操作: `Just (+3) <*> Just 2 == Just 5`. Typescript不支持操作符重载，所以忽略.

Just类型的Applicative应用图解：

![](/images/ts-fam/applicative_just.png)

数组类型的Applicative应用图解：

![](/images/ts-fam/applicative_list.png)

```ts
const num: number[] = [1, 2, 3]
console.log(num.apply([multiply2, add3]))
// [2, 4, 6, 4, 5, 6]
```

这里有 Applicative 能做到而 Functor 不能做到的事情。 如何将一个接受两个参数的函数应用到两个已包装的值上？

```ts
// 一个支持两个参数的Curry型加法函数
const curriedAddition = (a: number) => (b: number) => a + b

Just.of(5).fmap(curriedAddition) // 返回 `Just.of((b: number) => 5 + b)`
// Ok 继续
Just.of((b: number) => 5 + b).fmap(Just.of(4))  // ❌不行了，报错了，Functor没办法处理包装上下文
```

但是Applicative可以：

```ts
Just.of(5).fmap(curriedAddition) // 返回 `Just.of((b: number) => 5 + b)`
// ✅当当当
Just.of((b: number) => 5 + b).apply(Just.of(3)) // Just.of(8)
```

这时候Applicative 把 Functor 推到一边。 “大人物可以使用具有任意数量参数的函数，”它说。 “装备了 <$>(fmap) 与 <*>(apply) 之后，我可以接受具有任意个数未包装值参数的任意函数。 然后我传给它所有已包装的值，而我会得到一个已包装的值出来！ 啊啊啊啊啊！”

```ts
Just.of(5).fmap(curriedAddition).apply(Just.of(3)) // 返回 `Just.of(8)`
```

### Applicative总结

我们重申一个Applicative的定义, 如果Functor要求实现fmap的话，Applicative就是要求实现apply，apply符合以下定义:

```
// 这是Functor的fmap定义
<Functor a>.fmap(fn: (v: T) => U): <Functor b>

// 这是Applicative的apply定义，和上面对比，fn变成了一个包装在上下文的函数
<Functor a>.apply(fn: <Functor (v: T) => U>): <Functor b>
```

<br>

## Monad

终于练到三重天了！