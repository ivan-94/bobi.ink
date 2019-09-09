---
title: '关于React的一个V8性能瓶颈背后的故事'
date: 2019/9/7
categories: 前端
---

> 译注: 原文作者是[Mathias Bynens](https://twitter.com/mathias), 他是V8开发者，这篇文章也发布在[V8的博客](https://v8.dev/blog)上。他的[相关文章](https://mathiasbynens.be)质量非常高，如果你想了解JavaScript引擎内部是如何工作的，他的文章一定不能错过。后面我还会翻译他的其他文章，一方面是他文章质量很高，另外一方面是我想学习一下他们是怎么写文章的，通过翻译文章，让我可以更好地消化知识和模仿写作技巧, 最后奇文共赏！

原文链接: [The story of a V8 performance cliff in React](https://v8.dev/blog/react-cliff)

[之前](https://mathiasbynens.be/notes/shapes-ics)我们讨论过Javascript引擎是如何通过Shape(外形)和内联缓存(Inline Caches)来优化对象和数组的访问的, 我们还特别探讨了[Javascript引擎是如何加速原型属性访问](https://mathiasbynens.be/notes/prototypes). 这篇文章讲述**V8如何为不同的Javascript值选择最佳的内存表示(representations), 以及它是如何影响外形机制(shape machinery)的**。这些可以帮助我们解释最近React内核出现的V8性能瓶颈(Performance cliff)问题

> 如果不想看文章，可以看这个演讲： [“JavaScript engine fundamentals: the good, the bad, and the ugly”](https://www.youtube.com/watch?v=0I0d8LkDqyc)

<br>

## JavaScript 类型

每一个Javascript值都属于以下八个类型之一(目前): `Number`, `String`, `Symbol`, `BigInt`, `Boolean`, `Undefined`, `Null`, 以及 `Object`.

![](https://bobi.ink/images/react-cliff/01-javascript-types.svg)

但是有个总所周知的例外，在JavaScript中可以通过`typeof`操作符观察值的类型：

```js
typeof 42;
// → 'number'
typeof 'foo';
// → 'string'
typeof Symbol('bar');
// → 'symbol'
typeof 42n;
// → 'bigint'
typeof true;
// → 'boolean'
typeof undefined;
// → 'undefined'
typeof null;
// → 'object' 🤔
typeof { x: 42 };
// → 'object'
```

`typeof null`返回的是'`object`', 而不是'`null`', 尽管`Null`有一个自己的类型。要理解为什么，考虑将所有Javascript类型的集合分为两组：

- _对象类型_ (i.e. `Object`类型)
- _原始(primitives)类型_ (i.e. 任何非对象值)

因此, `null`可以理解为"无对象值", 而`undefined`则表示为“无值”.

> 译注：也就是，null可以理解为对象类型的'undefined'；而undefined是所有类型的'undefined'

![](https://bobi.ink/images/react-cliff/02-primitives-objects.svg)

遵循这个思路，Brendan Eich 在设计Javascript的时候受到了Java的影响，让`typeof`右侧所有值(即所有对象和null值)都返回'object'. 这就是为什么`typeof null === 'object'`的原因, 尽管规范中有一个单独的`Null`类型。

![](https://bobi.ink/images/react-cliff/03-primitives-objects-typeof.svg)

<br>

## 值的表示

Javascript引擎必须能够在内存中表示任意的Javascript值. 然而，需要注意的是，**Javascript的值类型和Javascript引擎如何在内存中表示它们是两回事**.

例如值 `42`，Javascript中是`number`类型。

```js
typeof 42;
// → 'number'
```

在内存中有很多种方式来表示类似`42`这样的整型数字:

表示   | 位
------|-----
8-bit二进制补码 | `0010 1010`
32-bit二进制补码 | `0000 0000 0000 0000 0000 0000 0010 1010`
压缩二进制编码十进制(packed binary-coded decimal (BCD)) |	`0100 0010`
32-bit IEEE-754 浮点数 | `0100 0010 0010 1000 0000 0000 0000 0000`
64-bit IEEE-754 浮点数 | `0100 0000 0100 0101 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000`

ECMAScript标准的数字类型是64位的浮点数，或者称为双精度浮点数或者Float64. 然而，这不是意味着Javascript引擎就一定要一直按照Float64表示保存数字 —— 这么做会非常低效！引擎可以选择其他内部表示，只要可被察觉的行为和Float64完全匹配就行。

实际的JavaScript应用中，大多数数字碰巧都是[合法ECMAScript数组索引](https://tc39.es/ecma262/#array-index)。即0 to 2³²−2之间的整型值.

```js
array[0]; // 最小合法的数组索引.
array[42];
array[2**32-2]; // 最大合法数组索引.
```

JavaScript引擎可以为这类数字选择最优内存表示，来优化通过索引访问数组元素的代码。为了让处理器可以执行内存访问操作，数组索引必须是[二进制补码](https://en.wikipedia.org/wiki/Two%27s_complement). 将数组索引表示为Float64实际上是一种浪费，因为引擎必须在每次有人访问数组元素时在float64和二进制补码之间来回转换

32位的二进制补码表示不仅仅对数组操作有用。一般来说，**处理器执行整型操作会比浮点型操作要快得多**。这就是为什么下一个例子中，第一个循环执行速度是第二个循环的两倍.

```js
for (let i = 0; i < 1000; ++i) {
  // fast 🚀
}

for (let i = 0.1; i < 1000.1; ++i) {
  // slow 🐌
}
```

操作符也一样。下面代码片段中，取模操作符的性能依赖于操作数是否是整型.

```js
const remainder = value % divisor;
// Fast 🚀 如果 `value` 和 `divisor` 都表示为整型,
// slow 🐌 其他情况
```

如果两个操作数都表示为整型，CPU就可以非常高效地计算结果。如果`divisor`是2的幂, V8还有额外的快速通道(fast-paths)。对于表示为浮点树的值，计算则要复杂的多，并且需要更长的时间.

因为整型操作通常都比浮点型操作要快得多，所以引擎似乎可以总是使用二进制补码来表示所有整型值和整型的计算结果。不幸的是，这会违反ECMAScript规范！ECMAScript是在Float64基础上进行标准化，因此实际上某些整数操作也可能会输出浮点数。在这种情况下，JS引擎输出正确的结果更重要。

```js
// Float64 的安全整型范围是 53 bits. 超过这个返回会失去精度,
2**53 === 2**53+1;
// → true

// Float64 支持-0, 索引 -1 * 0 必须是 -0, 但是二进制补码是没办法表示-0.
-1*0 === -0;
// → true

// Float64 可以通过除以0来得到无穷大.
1/0 === Infinity;
// → true
-1/0 === -Infinity;
// → true

// Float64 还有NaN.
0/0 === NaN;
```

尽管左侧都是整型，右侧所有值却都是浮点型。这就是为什么32位二进制补码不能正确地执行上面这些操作。所以JavaScript引擎必须特别谨慎，以确保整数操作可以适当地回退，从而输出花哨(符合规范)的Float64结果。

对于31位有符号整数范围内的小整数，V8使用一个称为`Smi`(译注: Small Integer)的特殊表示。其他非`Smi`的表示称为`HeapObject`，即指向内存中某些实体的地址。对于数字，我们使用的是一个特殊类型的`HeapObject`, 尚且称为`HeapNumber`, 用来表示不在Smi范围内的数字.

```js
 -Infinity // HeapNumber
-(2**30)-1 // HeapNumber
  -(2**30) // Smi
       -42 // Smi
        -0 // HeapNumber
         0 // Smi
       4.2 // HeapNumber
        42 // Smi
   2**30-1 // Smi
     2**30 // HeapNumber
  Infinity // HeapNumber
       NaN // HeapNumber
```

如上所示，一些JavaScript数字表示为`Smi`，而另一些则表示为`HeapNumber`. V8特意为`Smi`优化过，因为小整数在实际JavaScript程序中太常见了。`Smi`不需要在内存中额外分配专门的实体, 可以进行快速的整型操作.

这里更重要的一点是，**即使是相同Javascript类型的值，为了优化，背后可能会以完全不同的方式进行表示**。

<br>
<br>

## Smi vs. HeapNumber vs. MutableHeapNumber

下面介绍它们底层是怎么工作的。假设你有下列对象:

```js
const o = {
  x: 42,  // Smi
  y: 4.2, // HeapNumber
};
```

`x`的值`42`可以被编码为`Smi`，所以你可以在对象自己内部进行保存。另一方面，值`4.2`则需要一个单独的实体来保存，然后对象再指向这个实体.

![](https://bobi.ink/images/react-cliff/04-smi-vs-heapnumber.svg)

现在开始执行下面的Javascript片段:

```js
o.x += 10;
// → o.x 现在是 52
o.y += 1;
// → o.y 现在是 5.2
```

这种情况下，`x`的值可以被原地(in-place)更新，因为新的值`52`还是符合`Smi`的范围.

![](https://bobi.ink/images/react-cliff/05-update-smi.svg)

然而，新值`y=5.2`不符合`Smi`，且和之前的值`4.2`不一样，所以V8必须分配一个新的`HeapNumber`实体，再赋值给y。

![](https://bobi.ink/images/react-cliff/06-update-heapnumber.svg)

`HeapNumber`是不可变的，这也让某些优化成为可能。举个例子，如果我们将y的值赋给x:

```js
o.x = o.y;
// → o.x 现在是 5.2
```

...我们现在可以简单地链接到同一个HeapNumber，而不是分配一个新的.

![](https://bobi.ink/images/react-cliff/07-heapnumbers.svg)

`HeapNumbers`不可变的一个缺点是，频繁更新字段不在`Smi`范围内的值会比较慢，如下例所示:

```js
// 创建一个 `HeapNumber` 实例.
const o = { x: 0.1 };

for (let i = 0; i < 5; ++i) {
  // 创建另一个 `HeapNumber` 实例.
  o.x += 1;
}
```

第一行通过初始化值`0.1`创建一个`HeapNumber`实例。循环体将它的值改变为`1.1`、`2.1`、`3.1`、`4.1`、最后是`5.1`，这个过程总共创建了6个`HeapNumber`实例，其中5个会在循环结束后被垃圾回收。

![](https://bobi.ink/images/react-cliff/08-garbage-heapnumbers.svg)

为了避免这个问题，V8也提供了一种机制来原地更新非`Smi`数字字段作为优化。当一个数字字段保存的值超出了`Smi`的范围后，V8会在`Shape`中将这个字段标记为`Double`, 并且分配一个称为`MutableHeapNumber`实体来保存实际的值。

![](https://bobi.ink/images/react-cliff/09-mutableheapnumber.svg)

> 译注: 关于`Shape`是什么，可以阅读这篇[文章](https://mathiasbynens.be/notes/shapes-ics), 简单说`Shape`就是一个对象的‘外形’，JavaScript引擎可以通过`Shape`来优化对象的属性访问。

现在当字段的值变动时，V8不需要在分配一个新的`HeapNumber`，而是直接原地更新`MutableHeapNumber`.

![](https://bobi.ink/images/react-cliff/10-update-mutableheapnumber.svg)

然而，这种方式也有一个缺陷。因为MutableHeapNumber的值可以被修改，所以这些值不能安全传递给其他变量

![](https://bobi.ink/images/react-cliff/11-mutableheapnumber-to-heapnumber.svg)

举个例子，如果你将`o.x`赋值给其他变量`y`，你可不想下一次`o.x`变动时影响到`y`的值 —— 这违反了JavaScript规范！因此，当`o.x`被访问后，在将其赋值给`y`之前，必须将该数字重新装箱(re-boxed)成一个常规的`HeapNumber`。

对于浮点数，V8会在背后执行所有上面提到的“包装(boxing)”魔法。但是对于小整数来说，使用`MutableHeapNumber`就是浪费，因为`Smi`是更高效的表示。

```js
const object = { x: 1 };
// → 不需要‘包装’x字段

object.x += 1;
// → 直接在对象内部更新
```

为了避免低效率，对于小整数，我们必须在`Shape`上将该字段标记为`Smi`表示，只要符合小整数的范围，我们就可以简单地原地更新数字值。

![](https://bobi.ink/images/react-cliff/12-smi-no-boxing.svg)

<br>

## Shape 废弃和迁移

那么，如果一个字段初始化时是`Smi`，但是后续保存了一个超出小整数方位的值呢？比如下面这种情况，两个对象都使用相同的`Shape`，即`x`在初始化时表示为`Smi`:

```js
const a = { x: 1 };
const b = { x: 2 };
// → 对象现在将 `x`字段 表示为 `Smi`

b.x = 0.2;
// → `b.x` 现在表示为 `Double`

y = a.x;
```

一开始两个对象都指向同一个`Shape`，`x`被标记为`Smi`表示：

![](https://bobi.ink/images/react-cliff/13-shape.svg)

当`b.x`修改为`Double`表示时，V8会分配一个新的`Shape`，将`x`设置为`Double`表示，并且它会指向回`空Shape`(译注：Shape是树结构)。另外V8还会分配一个`MutableHeapNumber`来保存`x`的新值`0.2`. 接着我们更新对象`b`指向新的`Shape`，并且修改对象的`x`指向刚才分配的`MutableHeapNumber`。最后，我们标记旧的`Shape`为废弃状态，并从转换树(transition tree)中移除。这是通过将`“x”`从空`Shape`转换为新创建的`Shape`的方式来完成的。

![](https://bobi.ink/images/react-cliff/14-shape-transition.svg)

这个时候我们还不能完全将`旧Shape`删除掉，因为它还被`a`使用着，而且你不能着急遍历内存来找出所有指向`旧Shape`的对象，这种做法太低效。所以V8采用惰性方式: 对于`a`的任意属性的访问和赋值，会首先迁移到新的`Shape`。这样做, 最终可以将废弃的Shape变成‘不能到达(unreachable)’, 让垃圾回收器释放掉它。

![](https://bobi.ink/images/react-cliff/15-shape-deprecation.svg)

如果修改表示的字段不是链中的最后一个字段，则会出现更棘手的情况：

```js
const o = {
  x: 1,
  y: 2,
  z: 3,
};

o.y = 0.1;
```

这种情况，V8需要找到所谓的`分割Shape`(split shape), 即相关属性在被引入到`Shape`链之前的`Shape`。这里我们修改的是`y`，所以我们可以找到引入`y`之前的最后一个`Shape`，在上面的例子中这个`Shape`就是`x`：

![](https://bobi.ink/images/react-cliff/16-split-shape.svg)

从`分割Shape`(即x)开始，我们为y创建一个新的转换链, 它将y标记为`Double`表示，并重放(replay)之前的其他转换. 我们将对`y`应用这个新的转换链，将旧的树标记为废弃。在最后一步，我们将实例`o`迁移到新的`Shape`，现在使用一个`MutableHeapNumber`来保存`y`的值。后面新创建的对象都不会使用旧的`Shape`的路径，一旦所有旧`Shape`的引用都移除了，`Shape`树的废弃部分就会被销毁。

## 可扩展性和完整性级别转换

`Object.preventExtensions()`阻止新的属性添加到对象中, 否则它就会抛出异常。(如果你不在严格模式，它将不会抛出异常，而是什么都不干)

```js
const object = { x: 1 };
Object.preventExtensions(object);
object.y = 2;
// TypeError: Cannot add property y;
//            object is not extensible
```

`Object.seal`和`Object.preventExtensions`类似，只不过它将所有属性标记为`non-configurable`, 这意味着你不能删除它们, 或者改变它们的`Configurable`、`Enumerable`、`Writable`属性。

```js
const object = { x: 1 };
Object.seal(object);
object.y = 2;
// TypeError: Cannot add property y;
//            object is not extensible
delete object.x;
// TypeError: Cannot delete property x
```

`Object.freeze`和`Object.seal`差不多, 只不过它还会阻止已存在的属性被修改。

```js
const object = { x: 1 };
Object.freeze(object);
object.y = 2;
// TypeError: Cannot add property y;
//            object is not extensible
delete object.x;
// TypeError: Cannot delete property x
object.x = 3;
// TypeError: Cannot assign to read-only property x
```

让我们考虑这样一个具体的例子，下面两个对象都包含单个`x`属性，后者还阻止了对象扩展。

```js
const a = { x: 1 };
const b = { x: 2 };

Object.preventExtensions(b);
```

我们都知道它一开始会从空`Shape`转换为一个包含`x`(表示为Smi)的新`Shape`。当我们阻止`b`被扩展时，我们会执行一项特殊的转换，创建一个新的`Shape`并标记为'不可扩展'。这个特殊的转换不会引入任何新的属性 —— 它只是一个标记

![](https://bobi.ink/images/react-cliff/17-shape-nonextensible.svg)

注意，我们不能原地更新`x`的`Shape`，因为它还被`a`对象引用，`a`对象还是可扩展的。

<br>

## React的性能问题

让我们将上述所有东西都放在一起，用我们学到的知识来理解[最近的React Issue #14365](https://github.com/facebook/react/issues/14365). 当React团队在分析一个真实的应用时，他们发现了V8一个影响React 核心的奇怪性能问题. 下面是这个bug的简单复现:

```js
const o = { x: 1, y: 2 };
Object.preventExtensions(o);
o.y = 0.2;
```

一开始我们这个对象有两个`Smi`表示的字段。接着我们还阻止了对象扩展，最后还强制将第二个字段转换为`Double`表示。

按照我们上面描述的，这大概会创建以下东西：

![](https://bobi.ink/images/react-cliff/18-repro-shape-setup.svg)

两个属性都会被标记为`Smi`表示，最后一个转换是可扩展性转换，用于将Shape标记为不可扩展。

现在我们需要将`y`转换为`Double`表示，这意味着我们又要开始找出`分割Shape`. 在这个例子中，`分割Shape`就是引入`x`的那个`Shape`。但是V8会有点迷惑，因为`分割Shape`是可扩展的，而当前`Shape`却被标记为不可扩展。在这种情况下，V8并不知道如何正确地重放转换。所以V8干脆上放弃了尝试理解它，直接创建了一个单独的Shape，它没有连接到现有的Shape树，也没有与任何其他对象共享。可以把它想象成一个`孤儿Shape`：

![](https://bobi.ink/images/react-cliff/19-orphaned-shape.svg)

你可以想象一下，如果有很多对象都这样子有多糟糕，这会让整个`Shape`系统变得毫无用处。

在React的场景中，每个FiberNode在打开分析器时都会有好几个字段用于保存时间戳.

```js
class FiberNode {
  constructor() {
    this.actualStartTime = 0;
    Object.preventExtensions(this);
  }
}

const node1 = new FiberNode();
const node2 = new FiberNode();
```

这些字段(例如actualStartTime)被初始化为0或-1，即一开始时是`Smi`表示。后来，这些字段赋值为`performance.now()`输出的时间戳，这些时间戳实际是浮点型的。因为不符合`Smi`范围，它们需要转换为`Double`表示。恰好在这里，React还阻止了FiberNode实例的可扩展性。

上面例子的初始状态如下:

![](https://bobi.ink/images/react-cliff/20-fibernode-shape.svg)

按照我们设想的一样, 这两个实例共享了同一个Share树. 后面，当你保存真正的时间戳时，V8找到`分割Shape`就迷惑了：

![](https://bobi.ink/images/react-cliff/21-orphan-islands.svg)

V8给`node1`分配了一个新的`孤儿Shape`，`node2`同理，这样就生成了两个孤岛，每个孤岛都有自己不相交的Shape。大部分真实的React应用有上千上万个FiberNode。可以想象到，这种情况对V8的性能不是特别乐观。

幸运的是，我们在V8 [v7.4](https://v8.dev/blog/v8-release-74)修复了这个[性能问题](https://chromium-review.googlesource.com/c/v8/v8/+/1442640/), 我们也正在研究[如何降低修改字段表示的成本](https://bit.ly/v8-in-place-field-representation-changes)，以消灭剩余的性能瓶颈. 经过修复后，V8可以正确处理这种情况:

![](https://bobi.ink/images/react-cliff/22-fix.svg)

两个FiberNode实例都指向了'actualStartTime'为`Smi`的不可扩展`Shape`. 当第一次给`node1.actualStartTime`赋值时，将创建一个新的转换链，并将之前的链标记为废弃。

![](https://bobi.ink/images/react-cliff/23-fix-fibernode-shape-1.svg)

注意, 现在扩展性转换可以在新链中正确重放。

![](https://bobi.ink/images/react-cliff/24-fix-fibernode-shape-2.svg)

在赋值`node2.actualStartTime`之后，两个节点都引用到了新的Shape，转换树中废弃的部分将被垃圾回收器回收。

在Bug未修复之前，React团队通过确保FiberNode上的所有时间和时间段字段都初始化为Double表示，来缓解了这个问题：

```js
class FiberNode {
  constructor() {
    // 在一开始强制为Double表示.
    this.actualStartTime = Number.NaN;
    // 后面依旧可以按照之前的方式初始化值
    this.actualStartTime = 0;
    Object.preventExtensions(this);
  }
}

const node1 = new FiberNode();
const node2 = new FiberNode();
```

除了`Number.NaN`, 任何浮点数值都不在`Smi`的范围内, 可以用于强制`Double`表示。例如`0.000001`, `Number.MIN_VALUE`, `-0`和`Infinity`

值得指出的是，这个具体的React bug是V8特有的，一般来说，开发人员不应该针对特定版本的JavaScript引擎进行优化。不过，当事情不起作用的时候有个把柄总比没有好。

记住这些Javascript引擎背后执行的一些魔法，**如果可能，尽量不要混合类型，举个例子，不要将你的数字字段初始化为null，因为这样会丧失跟踪字段表示的所有好处**。不混合类型也可以让你的代码更具可读性：

```js
// Don’t do this!
class Point {
  x = null;
  y = null;
}

const p = new Point();
p.x = 0.1;
p.y = 402;
```

> 译注：如果你使用Typescript，应该开启strictNull模式

换句话说，编写高可读的代码，是可以提高性能的！

## 总结

我们深入讨论了下列内容：

- JavaScript 区分了‘原始类型’和‘对象类型’，typeof是一个骗子
- 即使是相同Javascript类型的值，底层可能有不同的表示
- V8尝试给你的Javascript程序的每个属性找出一个最优的表示
- 我们还讨论了V8是如何处理Shape废弃和迁移的，另外还包括扩展性转换

基于这些知识，我们总结出了一些可以帮助提升性能的JavaScript编程技巧：

- 始终按照一致的方式初始化你的对象，这样Shape会更有效
- 为字段选择合理的初始值，以帮助JavaScript引擎选择最佳的表示。

<br>
<br>

![](https://bobi.ink/images/sponsor.jpg)