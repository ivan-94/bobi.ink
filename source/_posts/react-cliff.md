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