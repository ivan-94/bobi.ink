---
title: "前端多学一门语言没坏处之 Elixir"
date: 2019/8/25
categories: 前端
---


- 多学一门语言

写作焦虑

基于前端、基于Javascript的角度

学习它的思想、使用场景、有趣的特性、编程哲学

基于Erlang VM
低延迟、分布式、高容错

## 平台特性(VM)

可伸缩(Scalability)

轻量的进程. 可以在一个机器上运行成千上万的实例，这实例甚至可以跨主机

高容错(Fault-tolerance)

supervisors 管理员机制

## 语言特性

函数式编程
DSL

## 有趣的语法

### 方法调用

方法调用可以省略扩展，这一点和Ruby一样：

```elixir
div(10, 2)
div 10, 2
```

上面两者是等价的，省略括号可以让语法更加简洁，让方法调用就像Shell命令一样。

### Atom类型

语言之间的基本类型都大同小异，所以笔者不打算将篇幅花在这里。但是一个比较特殊类型可以单独拎出来看看，比如Atom:

Atom类型等价于Javascript的Symbol类型。语言内部使用Atom来表示标志符。

```elixir
:apple == :apple # true
```

Javascript也有类似的东西:

```js
Symbol.for('apple') === Symbol.for('apple') // true
```

对于Elixir来说，Atom的特殊之处在于, 很多内置的字面量其实就是Atom类型:

```elixir
true == :true # true
is_boolean(:false)
is_atom(nil)
```

对于true、false、nil这些特殊字面量来说，可以将`:`前缀忽略

<br>

### 字符串

utf8 utf16 优缺点

### 不可变数据

elixir 是一个函数式编程语言，这意味着它的数据结构是不可变的(immutable). 不可变数据的好处是它可以让代码更加简洁，你可以放心地将它传递给其他函数，Elixir会保证没有人可能变动它的内存。另外不可变数据可以让并发更加安全。

**List**

例如List是不可变的：

```elixir
arr = [1, 2, true, 3]
arr2 = [1, 2, 3] ++ [4, 5, 6] # concat数据，返回一个新的List: [1, 2, 3, 4, 5, 6]
arr3 = [1, true, 2, false, 3, true] -- [true, false] # List diff
```

List不是数组、它其实是一个**链表**. List是很多函数式编程语言(例如Lisp)的基础数据结构. 如果读者读过[SICP](TODO:), 会知道Lisp可以使用cons来构建一个List：

```lisp
(cons <a1> (cons <a2> (cons <a3 (cons ..(cons <aN> nil)…)))
```

例如`(cons 1 (cons 2 (cons 3 (cons 4 nil))))`的内存结构如下:

![](/images/elixir/cons.png)

没错，就是一个链表. 等价于elixir的`[1, 2, 3, 4]`.

怎么访问List元素?

```elixir
list = [1, 2, 3]
# 获取元素0
hd(list) # 1, 获取list head; lisp这样获取(car list)
# 获取元素1
hd(tl(list)) # 2, 首先通过tl获取列表的tail，即[2, 3]; 再通过hd访问[2, 3]的head. lisp这样子获取(car (cdr list))
```

<br>

**Tuple**

Elixir还定义了一个元组类型，和列表一样可以放置任意类型：

```elixir
tuple = {:ok, "hello"}
```

和List不一样的是， 元组的元素是在内存中连续存储的，所以可以使用索引进行快速访问:

```elixir
elem(tuple, 1)    # "hello"
tuple_size(tuple) # 2
```

和List一样，Tuple也是不可变的：

```elixir
tuple = put_elem(tuple, 1, "world") # 返回一个新的Tuple
```

TODO: 对比

<br>

### 操作符

TODO:

严格的布尔值, 区分and/&&

react boolean条件

### 函数

使用函数名和函数参数来区分

### 匿名函数

使用fn、end关键字包裹

```elixir
add = fn a, b -> a + b end
add.(1, 2)       # 这是为了区分变量和命名函数
is_function(add) # true
```

## 模式匹配

在elixir中， = 其实是一个匹配操作符(match operator)

## 模块

异常处理

## 宏

## 并发

## 扩展

- [Unicode与JavaScript详解](http://www.ruanyifeng.com/blog/2014/12/unicode.html)