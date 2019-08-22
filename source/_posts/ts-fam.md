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

现在你**把一个函数应用到这个值的时候, 根据其上下文你会得到不同的结果**. 这就是 `Functor`, `Applicative`, `Monad`, `Arrow` 之类概念的基础. `Maybe` 数据类型定义了两种相关的上下文(Maybe只是其中一个典型的、比较简单的数据类型):

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
