---
title: '关于React的一个V8性能瓶颈背后的故事'
date: 2019/9/7
categories: 前端
---

原文链接: [](https://v8.dev/blog/react-cliff)

Previously, we discussed how JavaScript engines optimize object and array access through the use of Shapes and Inline Caches, and we’ve explored how engines speed up prototype property access in particular. This article describes how V8 chooses optimal in-memory representations for various JavaScript values, and how that impacts the shape machinery — all of which helps explain a recent V8 performance cliff in React core.

[之前](https://mathiasbynens.be/notes/shapes-ics)我们讨论过Javascript引擎是如何通过外形(Shapes)和内联缓存(Inline Caches)来优化对象和数组的访问的, 我们还特别探讨了[Javascript引擎是如何加速原型属性访问](https://mathiasbynens.be/notes/prototypes). 这篇文章讲述**V8如何为不同的Javascript值选择最佳的内存表示, 以及它是如何影响外形机制(shape machinery)的**。这些可以帮助我们解释最近React内核出现的V8性能瓶颈(Performance cliff)

## JavaScript 类型

Every JavaScript value has exactly one of (currently) eight different types: Number, String, Symbol, BigInt, Boolean, Undefined, Null, and Object

每一个Javascript值都属于以下八个类型之一: `Number`, `String`, `Symbol`, `BigInt`, `Boolean`, `Undefined`, `Null`, 以及 `Object`.

![](/images/react-cliff/01-javascript-types.svg)

With one notable exception, these types are observable in JavaScript through the typeof operator:

但是有个总所周知的例外，这些类型可以通过typeof操作符在javascript中观察到：

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

typeof null returns 'object', and not 'null', despite Null being a type of its own. To understand why, consider that the set of all JavaScript types is divided into two groups:

`typeof null`返回的是'`object`', 而不是'`null`', 尽管`Null`有一个自己的类型。要理解为什么，考虑将所有Javascript类型的集合分为两组：

- 对象 (i.e. Object类型)
- 原始(primitives) (i.e. 任何非对象值)

As such, null means “no object value”, whereas undefined means “no value”.

因此, `null`可以理解为"无对象值", 而`undefined`则表示为“无值”.

> 译注：也就是，null是对象类型的undefined；而undefined是所有类型的undefined？

![](/images/react-cliff/02-primitives-objects.svg)

Following this line of thought, Brendan Eich designed JavaScript to make typeof return 'object' for all values on the right-hand side, i.e. all objects and null values, in the spirit of Java. That’s why typeof null === 'object' despite the spec having a separate Null type.

遵循这个思路，Brendan Eich 在设计Javascript的时候受到了Java的影响，让typeof的右侧所有值(即所有对象和null值)都返回'object'. 这就是为什么`typeof null === 'object'`, 尽管规范有一个单独的`Null`类型。

![](/images/react-cliff/03-primitives-objects-typeof.svg)

## 值的表示

JavaScript engines must be able to represent arbitrary JavaScript values in memory. However, it’s important to note that the JavaScript type of a value is separate from how JavaScript engines represent that value in memory.

Javascript引擎必须能够在内存中表示任意的Javascript值. 然而，需要注意的是，**Javascript的值类型和Javascript引擎如何在内存中表示它们是两回事**.

The value 42, for example, has type number in JavaScript.

例如值 42，Javascript中是number类型。

```js
typeof 42;
// → 'number'
```

There are several ways to represent an integer number like 42 in memory:

在内存中有很多种方式来表示类似42这样的整型数字:

表示   | 位
------|-----
8-bit二进制补码 | `0010 1010`
32-bit二进制补码 | `0000 0000 0000 0000 0000 0000 0010 1010`
压缩二进制编码十进制(packed binary-coded decimal (BCD)) |	`0100 0010`
32-bit IEEE-754 浮点数 | `0100 0010 0010 1000 0000 0000 0000 0000`
64-bit IEEE-754 浮点数 | `0100 0000 0100 0101 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000`

ECMAScript standardizes numbers as 64-bit floating-point values, also known as double precision floating-point or Float64. However, that doesn’t mean that JavaScript engines store numbers in Float64 representation all the time — doing so would be terribly inefficient! Engines can choose other internal representations, as long as the observable behavior matches Float64 exactly.

ECMAScript标准数字类型是64位的浮点数，或者称为双精度浮点数或者Float64. 然而，这不是意味着Javascript引擎就一定要一直按照Float64表示保存数字——这么做会非常低效！引擎可以选择其他内部表示，只要可被察觉的行为和Float64完全匹配就行。

Most numbers in real-world JavaScript applications happen to be valid ECMAScript array indices, i.e. integer values in the range from 0 to 2³²−2.

实际的Javascript应用中，大多数数字碰巧都是合法ECMAScript数组索引。即0 to 2³²−2之间的整型值.

```js
array[0]; // 最小合法的数组索引.
array[42];
array[2**32-2]; // 最大合法数组索引.
```

JavaScript engines can choose an optimal in-memory representation for such numbers to optimize code that accesses array elements by index. For the processor to do the memory access operation, the array index must be available in two’s complement. Representing array indices as Float64 instead would be wasteful, as the engine would then have to convert back and forth between Float64 and two’s complement every time someone accesses an array element.

Javascript引擎可以为这类数字选择最优内存表示，来优化通过索引访问数组元素的代码。为了让处理器可以执行内存访问操作，数组索引必须是二进制补码. 将数组索引表示为Float64实际上是一种浪费，因为引擎必须在每次有人访问数组元素时在float64和二进制补码之间来回转换

The 32-bit two’s complement representation is not just useful for array operations. In general, processors execute integer operations much faster than floating-point operations. That’s why in the next example, the first loop is easily twice as fast compared to the second loop.

32位的二进制补码表示不仅仅对数组操作有用。一般来说，**处理器执行整型操作会比浮点型操作要快得多**。这就是为什么下一个例子中，第一个循环执行速度是第二个循环的两倍.

```js
for (let i = 0; i < 1000; ++i) {
  // fast 🚀
}

for (let i = 0.1; i < 1000.1; ++i) {
  // slow 🐌
}
```

The same goes for operations as well. The performance of the modulo operator in the next piece of code depends on whether you’re dealing with integers or not.

操作符也一样。下面代码片段中，取模操作符的性能依赖于操作数是否是整型.

```js
const remainder = value % divisor;
// Fast 🚀 如果 `value` 和 `divisor` 都表示为整型,
// slow 🐌 其他情况
```

If both operands are represented as integers, the CPU can compute the result very efficiently. V8 has additional fast-paths for the cases where the divisor is a power of two. For values represented as floats, the computation is much more complex and takes a lot longer.

如果两个操作数都表示为整型，CPU可以非常高效地计算结果。V8还有额外的快速通道(fast-paths)，如果`divisor`是2的幂。对于表示为浮点的值，计算要复杂的多，并且需要更长的时间.

Because integer operations generally execute much faster than floating-point operations, It would seem that engines could just always use two’s complement for all integers and all results of integer operations. Unfortunately, that would be a violation of the ECMAScript specification! ECMAScript standardizes on Float64, and so certain integer operations actually produce floats. It’s important that JS engines produce the correct results in such cases.

因为整型操作通常都比浮点型操作要快得多， 所以引擎似乎可以总是使用二进制补码来表示所有整型值和整型的计算结果。不幸的是，这会违反ECMAScript规范！ECMAscript在Float64上进行标准化，因此某些整数操作实际上会输出float。在这种情况下，JS引擎输出正确的结果更重要。

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

Even though the values on the left-hand side are integers, all the values on the right are floats. This is why none of the above operations can be performed correctly using 32-bit two’s complement. JavaScript engines have to take special care to make sure that integer operations fall back appropriately to produce the fancy Float64 results.

尽管左侧是整型，右侧所有值都是浮点型。这就是为什么32位二进制补码不能正确地执行上面这些操作。所以Javascript引擎必须特别谨慎，以确保整数操作可以适当地回退，从而输出花哨(符合规范)的Float64结果。

For small integers in the 31-bit signed integer range, V8 uses a special representation called Smi. Anything that is not a Smi is represented as a HeapObject, which is the address of some entity in memory. For numbers, we use a special kind of HeapObject, the so-called HeapNumber, to represent numbers that aren’t inside the Smi range.

对于31位有符号整数范围内的小整数，V8使用一个称为`Smi`(译注: Small Integer)的特殊表示。其他非`Smi`的表示称为`HeapObject`，即指向内存中某些实体的地址。对于数字，我们使用一个特殊类型的`HeapObject`, 称为`HeapNumber`, 用来表示不再Smi范围内的数字.

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

As the above example shows, some JavaScript numbers are represented as Smis, and others are represented as HeapNumbers. V8 is specifically optimized for Smis, because small integers are so common in real-world JavaScript programs. Smis don’t need to be allocated as dedicated entities in memory, and enable fast integer operations in general.

如上所示，一些JavaScript数字表示为`Smi`，而另一些则表示为`HeapNumber`. V8特意为Smi优化过，因为小整数在实际Javascript程序中太常见了。`Smi`不需要在内存中额外分配专门的实体, 可以进行快速的整型操作.

The important take-away here is that even values with the same JavaScript type can be represented in completely different ways behind the scenes, as an optimization.

这里更重要的一点是，**即使是相同Javascript类型的值，为了优化，背后可能会以完全不同的方式进行表示**kj。

## Smi vs. HeapNumber vs. MutableHeapNumber

Here’s how that works under the hood. Let’s say you have the following object:

下面介绍它们底层是怎么工作的。假设你有下列对象:

```js
const o = {
  x: 42,  // Smi
  y: 4.2, // HeapNumber
};
```

The value 42 for x can be encoded as Smi, so it can be stored inside of the object itself. The value 4.2 on the other hand needs a separate entity to hold the value, and the object points to that entity.

x的值42可以被编码为Smi， 所以你可以保存在对象自己内部。另一方面，值4.2则需要一个单独的实体来保存，然后对象再指向这个实体.

![](/images/react-cliff/04-smi-vs-heapnumber.svg)

Now, let’s say we run the following JavaScript snippet:

现在开始执行下面的Javascript片段:

```js
o.x += 10;
// → o.x 现在是 52
o.y += 1;
// → o.y 现在是 5.2
```

In this case, the value of x can be updated in-place, since the new value 52 also fits the Smi range.

这种情况下，x的值可以被原地更新，因为新的值52还是符合Smi的范围.

![](/images/react-cliff/05-update-smi.svg)

However, the new value of y=5.2 does not fit into a Smi and is also different from the previous value 4.2, so V8 has to allocate a new HeapNumber entity for the assignment to y.

然而，新值`y=5.2`不符合Smi，且和之前的值4.2不一样，所有V8必须分配一个新的HeapNumber实体，再赋值给y。

![](/images/react-cliff/06-update-heapnumber.svg)

HeapNumbers are not mutable, which enables certain optimizations. For example, if we assign ys value to x:

HeapNumber是不可变的，这也让某些优化成为可能。举个例子，如果我们将y的值赋给x:

```js
o.x = o.y;
// → o.x 现在是 5.2
```

…we can now just link to the same HeapNumber instead of allocating a new one for the same value.

...我们现在可以简单地链接到同一个HeapNumber，而不是分配一个新的

![](/images/react-cliff/07-heapnumbers.svg)

One downside to HeapNumbers being immutable is that it would be slow to update fields with values outside the Smi range often, like in the following example:

heapnumbers不可变的一个缺点是，频繁更新字段不在Smi范围内的值会比较慢，如下例所示

```js
// 创建一个 `HeapNumber` 实例.
const o = { x: 0.1 };

for (let i = 0; i < 5; ++i) {
  // 创建另一个 `HeapNumber` 实例.
  o.x += 1;
}
```

The first line would create a HeapNumber instance with the initial value 0.1. The loop body changes this value to 1.1, 2.1, 3.1, 4.1, and finally 5.1, creating a total of six HeapNumber instances along the way, five of which are garbage once the loop finishes.

第一行通过初始化值0.1创建一个HeapNumber实例。循环体将它的值改变为1.1、2.1、3.1、4.1、最后是5.1，这个过程总共创建了6个HeapNumber实例，其中5个会在循环结束后被垃圾回收。

![](/images/react-cliff/08-garbage-heapnumbers.svg)

To avoid this problem, V8 provides a way to update non-Smi number fields in-place as well, as an optimization. When a numeric field holds values outside the Smi range, V8 marks that field as a Double field on the shape, and allocates a so-called MutableHeapNumber that holds the actual value encoded as Float64.

为了避免这个问题，V8为了优化，也提供了一种机制来原地更新非Smi数字字段。当一个数字字段保存的值超出了Smi的范围，V8会在`Shape`中标记这个字段为`Double`字段, 并且分配一个称为`MutableHeapNumber`实体来保存实际的值。

![](/images/react-cliff/09-mutableheapnumber.svg)

> 译注: 关于Shape是什么，可以阅读这篇[文章](https://mathiasbynens.be/notes/shapes-ics), 简单说Shape就是一个对象的‘外形’，Javascript引擎可以通过Shape来优化对象的属性访问。

When your field’s value changes, V8 no longer needs to allocate a new HeapNumber, but instead can just update the MutableHeapNumber in-place.

当字段的值变动时，V8不需要在分配一个新的HeapNumber，而是直接原地更新MutableHeapNumber.

![](/images/react-cliff/10-update-mutableheapnumber.svg)

However, there’s a catch to this approach as well. Since the value of a MutableHeapNumber can change, it’s important that these are not passed around.

然而，这种方式也有一个缺陷。因为MutableHeapNumber的值可以被修改，所以这些值不能安全传递给其他变量

![](/images/react-cliff/11-mutableheapnumber-to-heapnumber.svg)

For example, if you assign o.x to some other variable y, you wouldn’t want the value of y to change the next time o.x changes — that would be a violation of the JavaScript spec! So when o.x is accessed, the number must be re-boxed into a regular HeapNumber before assigning it to y.

举个例子，如果你将`o.x`赋值给其他变量y，你可不想下一次`o.x`变动时影响到y的值——这违反了javascript规范！因此，当`o.x`被访问后，在将其赋值给y之前，必须将该数字重新装箱(re-boxed)成一个常规的HeapNumber。

For floats, V8 performs all the above-mentioned “boxing” magic behind the scenes. But for small integers it would be wasteful to go with the MutableHeapNumber approach, since Smi is a more efficient representation.

对于浮点数，V8会在背后执行所有上面提到的“包装(boxing)”魔法。但是对于小整数来说，使用MutableHeapNumber就是浪费，意味Smi是更高效的表示。

```js
const object = { x: 1 };
// → 不需要‘包装’x字段

object.x += 1;
// → 直接在对象内部更新
```

To avoid the inefficiency, all we have to do for small integers is mark the field on the shape as Smi representation, and simply update the number value in place as long as it fits the small integer range.

为了避免低效率，对于小整数，我们必须在Shape上将该字段标记为Smi表示，只要符合小整数的范围，我们就可以简单地原地更新数字值。

![](/images/react-cliff/12-smi-no-boxing.svg)

## Shape 废弃和迁移

So what if a field initially contains a Smi, but later holds a number outside the small integer range? Like in this case, with two objects both using the same shape where x is represented as Smi initially:

那么，如果一个字段初始化时是Smi，但是后续保存了一个超出小整数方位的值呢？比如下面这种情况，两个对象都使用相同的Shape，即x在初始化时表示为Smi:

```js
const a = { x: 1 };
const b = { x: 2 };
// → 对象现在将 `x`字段 表示为 `Smi`

b.x = 0.2;
// → `b.x` 现在表示为 `Double`

y = a.x;
```

This starts out with two objects pointing to the same shape, where x is marked as Smi representation:

一开始两个对象都指向同一个Shape，x被标记为Smi表示：

![](/images/react-cliff/13-shape.svg)

When b.x changes to Double representation, V8 allocates a new shape where x is assigned Double representation, and which points back to the empty shape. V8 also allocates a MutableHeapNumber to hold the new value 0.2 for the x property. Then we update the object b to point to this new shape, and change the slot in the object to point to the previously allocated MutableHeapNumber at offset 0. And finally, we mark the old shape as deprecated and unlink it from the transition tree. This is done by having a new transition for 'x' from the empty shape to the newly-created shape.

当`b.x`修改为Double表示时，V8会分配一个新的Shape，将x设置为Double表示，并且它会指向空Shape(译注：树结构)。另外V8还会分配一个MutableHeapNumber来保存x的新值0.2. 接着我们更新对象b指向新的Shape，并且修改对象的x指向刚才分配的MutableHeapNumber。最后，我们标记旧的Shape为废弃状态，并从转换树(transition tree)中移除。这是通过将“x”从空Shape转换为新创建的Shape的方式来完成的(TODO: 不是很通顺)。

![](/images/react-cliff/14-shape-transition.svg)

We cannot completely remove the old shape at this point, since it is still used by a, and it would be way too expensive to traverse the memory to find all objects pointing to the old shape and update them eagerly. Instead V8 does this lazily: any property access or assignment to a migrates it to the new shape first. The idea is to eventually make the deprecated shape unreachable and to have the garbage collector remove it.

这个时候我们还不能完全将旧Shape删除掉，因为它还被a使用着，而且你不能着急遍历内存来找出所有指向旧Shape的对象，这种做法太低效。所以V8采用惰性方式: 对于a的任意属性的访问和赋值，会首先迁移到新的Shape。这样做最终可以将废弃的Shape变成‘不能到达(unreachable)’, 让垃圾回收器释放掉。

![](/images/react-cliff/15-shape-deprecation.svg)

A trickier case occurs if the field that changes representation is not the last one in the chain:

如果修改表示的字段不是链中的最后一个字段，则会出现更棘手的情况：

```js
const o = {
  x: 1,
  y: 2,
  z: 3,
};

o.y = 0.1;
```

In that case V8 needs to find the so-called split shape, which is the last shape in the chain before the relevant property gets introduced. Here we’re changing y, so we need to find the last shape that doesn't have y, which in our example is the shape that introduced x.

这种情况，V8需要找到所谓的`分割Shape`(split shape), 即在引入相关属性到Shape链之前的最后一个Shape。这里我们修改的是y，所以我们可以找到引入y之前的最后一个Shape，在上面的例子中这个Shape就是x：

![](/images/react-cliff/16-split-shape.svg)

Starting from the split shape, we create a new transition chain for y which replays all the previous transitions, but with 'y' being marked as Double representation. And we use this new transition chain for y, marking the old subtree as deprecated. In the last step we migrate the instance o to the new shape, using a MutableHeapNumber to hold the value of y now. This way, new objects do not take the old path, and once all references to the old shape are gone, the deprecated shape part of the tree disappears.

从`分割Shape`(即x)开始，我们为y创建一个新的转换链, 它将y标记位Double表示，并重发(replay)之前的其他转换. 我们将对y使用这个新的转换链，将旧的树标记为废弃。在最后一步，我们将实例o迁移到新的Shape，现在使用一个MutableHeapNumber来保存y的值。这样新创建的对象就不会使用旧的Shape路径，一旦所有旧Shape的引用都移除了，Shape树的废弃的部分就会被销毁。

## 可扩展性和完整性级别转换

Object.preventExtensions() prevents new properties from ever being added to an object. If you try, it throws an exception. (If you’re not in strict mode, it doesn’t throw but it silently does nothing.)

`Object.preventExtensions()`阻止新的属性添加到对象中。否则它就会抛出异常。(如果你不在严格模式，它将不会抛出异常，而是什么都不干)

```js
const object = { x: 1 };
Object.preventExtensions(object);
object.y = 2;
// TypeError: Cannot add property y;
//            object is not extensible
```

Object.seal does the same as Object.preventExtensions, but it also marks all properties as non-configurable, meaning you can’t delete them, or change their enumerability, configurability, or writability.

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

Object.freeze does the same as Object.seal, but it also prevents the values of existing properties from being changed by marking them non-writable.

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

Let’s consider this concrete example, with two objects which both have a single property x, and where we then prevent any further extensions to the second object.

让我们考虑这样一个具体的例子，下面两个对象都包含单个x属性，后者阻止了对象扩展。

```js
const a = { x: 1 };
const b = { x: 2 };

Object.preventExtensions(b);
```

It starts out like we already know, transitioning from the empty shape to a new shape that holds the property 'x' (represented as Smi). When we prevent extensions to b, we perform a special transition to a new shape which is marked as non-extensible. This special transition doesn’t introduce any new property — it’s really just a marker.

我们都知道它一开始会从空Shape转换为一个包含x(表示为Smi)的新Shape。当我们阻止b被扩展是，我们会执行一项特殊的转换，创建一个新的Shape并标记位不可扩展。这个特殊的转换不会引入任何新的属性——它只是一个标记

![](/images/react-cliff/17-shape-nonextensible.svg)

Note how we can’t just update the shape with x in-place, since that is needed by the other object a, which is still extensible.

注意，我们不能原地更新x的Shape，因为它还被a对象引用，a对象还是可扩展的。

## React的性能问题

Let’s put it all together and use what we learned to understand the recent React issue #14365. When the React team profiled a real-world application, they spotted an odd V8 performance cliff that affected React’s core. Here’s a simplified repro for the bug:

让我们将上述所有东西都放在一起，用我们学到的知识来理解[最近的React Issue #14365](https://github.com/facebook/react/issues/14365). 当React团队在分析一个真实的应用时，他们发现了一个奇怪的影响react 核心的V8性能问题. 下面是这个bug的简单复现:

```js
const o = { x: 1, y: 2 };
Object.preventExtensions(o);
o.y = 0.2;
```

We have an object with two fields that have Smi representation. We prevent any further extensions to the object, and eventually force the second field to Double representation.

一开始我们这个对象有两个Smi表示的字段。接着我们还阻止了对象扩展，最后还强制将第二个字段转换为Double表示。

As we learned before, this creates roughly the following setup:

按照我们上面描述的，这大概会创建以下东西：

![](/images/react-cliff/18-repro-shape-setup.svg)

Both properties are marked as Smi representation, and the final transition is the extensibility transition to mark the shape as non-extensible.

两个属性都会被标记位Smi表示，最后一个转换是可扩展性转换，用于将Shape标记为不可扩展。

Now we need to change y to Double representation, which means we need to again start by finding the split shape. In this case, it’s the shape that introduced x. But now V8 got confused, since the split shape was extensible while the current shape was marked as non-extensible. And V8 didn’t really know how to replay the transitions properly in this case. So V8 essentially just gave up trying to make sense of this, and instead created a separate shape that is not connected to the existing shape tree and not shared with any other objects. Think of it as an orphaned shape:

现在我们需要将y转换为Double表示，这意味着我们又要开始找出`分割Shape`. 在这个例子中，分隔Shape是引入x那个Shape。但是V8会有点疑惑，因为分割Shape是可扩展的，而当前Shape却被标记为不可扩展。在这种情况下，V8并不知道如何正确地重放转换。所以V8干脆上放弃了尝试理解它，而是创建了一个单独的Shape，它没有连接到现有的Shape树，也没有与任何其他对象共享。把它想象成一个孤儿Shape：

![](/images/react-cliff/19-orphaned-shape.svg)

You can imagine it’s pretty bad if this happens to lots of objects, since that renders the whole shape system useless.

你可以想象一下，如果有很多对象都这样子有多糟糕，这会让整个Shape系统变得毫无用处。

In the case of React, here’s what happened: each FiberNode has a couple of fields that are supposed to hold timestamps when profiling is turned on.

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

These fields (such as actualStartTime) are initialized with 0 or -1, and thus start out with Smi representation. But later, actual floating-point timestamps from performance.now() are stored in these fields, causing them to go to Double representation, since they don’t fit into a Smi. On top of that, React also prevents extensions to FiberNode instances.

这些字段(例如actualStartTime)被初始化为0或-1，即一开始时是Smi表示。后来，这些字段赋值了`performance.now()`输出的时间戳，这些时间戳实际是浮点型的。因为不符合Smi范围，它们需要转换为Double表示。恰好在这里，React还阻止了FiberNode实例的可扩展性。

Initially the simplified example above looked like this:
上面例子的初始状态如下:

![](/images/react-cliff/20-fibernode-shape.svg)

There are two instances sharing a shape tree, all working as intended. But then, as you store the real timestamp, V8 gets confused finding the split shape:

按照我们设想的一样, 这两个实例共享了同一个Share树. 后面，当你保存真正的时间戳时，V8找到分割Shape就迷惑了：

![](/images/react-cliff/21-orphan-islands.svg)

V8 assigns a new orphaned shape to node1, and the same thing happens to node2 some time later, resulting in two orphan islands, each with their own disjoint shapes. Many real-world React apps don’t just have two, but rather tens of thousands of these FiberNodes. As you can imagine, this situation was not particularly great for V8’s performance.

V8给node1分配了一个新的孤儿Shape，node2同理，这样就导致两个孤岛，每个孤岛都有自己不相交的Shape。大部分真实的React应用有上千上万个FiberNode。可以想象到，这种情况对V8的性能不是特别乐观。

Luckily, we’ve fixed this performance cliff in V8 v7.4, and we’re looking into making field representation changes cheaper to remove any remaining performance cliffs. With the fix, V8 now does the right thing:

幸运的是，我们在V8 [v7.4](https://v8.dev/blog/v8-release-74)修复了这个[性能问题](https://chromium-review.googlesource.com/c/v8/v8/+/1442640/), 我们也正在研究[如何降低修改字段表示的成本](https://bit.ly/v8-in-place-field-representation-changes)，以消灭剩余的性能瓶颈. 经过修复后，V8可以正确处理这种情况:

![](/images/react-cliff/22-fix.svg)

The two FiberNode instances point to the non-extensible shape where 'actualStartTime' is a Smi field. When the first assignment to node1.actualStartTime happens, a new transition chain is created and the previous chain is marked as deprecated:

两个FiberNode实例都指向了'actualStartTime'为Smi的不可扩展Shape. 当第一次给`node1.actualStartTime`赋值时，将创建一个新的转换链，并将之前的链标记为废弃。

![](/images/react-cliff/23-fix-fibernode-shape-1.svg)

Note how the extensibility transition is now properly replayed in the new chain.

需要注意的是扩展性转换现在如何在新链中正确重放的。

![](/images/react-cliff/24-fix-fibernode-shape-2.svg)

After the assignment to node2.actualStartTime, both nodes refer to the new shape, and the deprecated part of the transition tree can be cleaned up by the garbage collector.

在赋值`node2.actualStartTime`之后，两个Node都引用到了新的Shape，转换树中废弃的部分将被垃圾回收器回收。

The React team mitigated the problem on their end by making sure that all the time and duration fields on FiberNodes start out with Double representation:

React团队通过确保FiberNode上的所有时间和时间段字段都初始化为Double表示，来缓解了这个问题：

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

Instead of Number.NaN, any floating-point value that doesn’t fit the Smi range could be used. Examples include 0.000001, Number.MIN_VALUE, -0, and Infinity.

除了`Number.NaN`, 任何浮点数值都不在Smi的范围内, 可以用于强制Double表示。例如0.000001, Number.MIN_VALUE, -0和Infinity

It’s worth pointing out that the concrete React bug was V8-specific and that in general, developers shouldn’t optimize for a specific version of a JavaScript engine. Still, it’s nice to have a handle when things don't work.

值得指出的是，这具体的React bug是V8特有的，一般来说，开发人员不应该针对特定版本的JavaScript引擎进行优化。不过，当事情不起作用的时候有个把柄总比没有好。

Keep in mind that the JavaScript engine performs some magic under the hood, and you can help it by not mixing types if possible. For example, don’t initialize your numeric fields with null, as that disables all the benefits from the field representation tracking, and it makes your code more readable:

记住这些Javascript引擎背后执行的一些魔法，如果可能，尽量不要混合类型，举个例子，不要将你的数字字段初始化为null，因为这样会跟踪丧失字段表示的所有好处，这也可以让你的代码更具可读性：

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

We’ve covered the following in this deep-dive:

我们深入讨论了下列内容：

- JavaScript distinguishes between “primitives” and “objects”, and typeof is a liar.
- JavaScript 区分了‘原始类型’和‘对象类型’，typeof是一个骗子
Even values with the same JavaScript type can have different representations behind the scenes.
- 即使是相同Javascript类型的值，底层可能有不同的表示
V8 tries to find the optimal representation for every property in your JavaScript programs.
- V8尝试给你的Javascript程序的每个属性找出一个最优的表示
We’ve discussed how V8 deals with shape deprecations and migrations, including extensibility transitions.
- 我们还讨论了V8是如何处理Shape废弃和迁移的，另外还包括扩展性转换

Based on this knowledge, we identified some practical JavaScript coding tips that can help boost performance:
基于这些知识，我们总结出了一些可以帮助提升性能的Javascript编程技巧：

Always initialize your objects in the same way, so that shapes can be effective.
- 始终按照一致的方式初始化你的对象，这样Shape会更有效
- 为字段选择合理的初始值，以帮助JavaScript引擎选择最佳的表示。
Choose sensible initial values for your fields to help JavaScript engines with representation selection.