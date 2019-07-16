---
title: "写给Typescripter的Dart教程"
date: 2019/7/15
categories: 前端
---

不同语言的定位

Dart is a client-optimized language
hot-reload
强类型
界面
跨平台，支持编译为Javascript, 支持服务端、移动端

hello world

```dart
/**
 * hello.dart
 */
void main(List<String> args) {
  print("hello world"); // 不能省略分号
}
```

执行:

```shell
dart hello.dart # hello world
```

通过hello world程序可以透露一下信息:

- main: 程序需要一个main作为程序入口
- 类型注解风格和Java类似. 不过类型注解也是可选的，支持类型推导
- 不能省略分号。在Javascript中早已习惯了不使用分号
- 支持泛型
- print：dart有标准库
- 支持顶层函数、顶层变量。不像Java所有都是类，main函数也是需要封装在类中

大部分语法特性和Javascript非常相似

AOT编译

变量

```dart
var a = 1;       // let a = 1; ①
var b = '2';     // let b = '2'; ②
String c = '12'; // let c: string = '12' ③
var d;           // let d; 或 let d: any; ④
int e;           // let e: number | null = null; ⑤
```

- ① 变量命名使用`var`
- ② 和ts一样，dart支持类型推导，所以在变量值有初始值时不需要显式声明数据类型. 所以`var a = 1`等价于`int a = 1`
- ③ Dart类型注解语法更像Java，而Typescript使用冒号注解法，这样跟接近JavaScript的语法. 声明类型后可以忽略var关键字
- ④ 如果dart无法推导出变量的类型，则默认为**dynamic类型**, dynamic 相当于Typescript的**any**
- ⑤ 对于没有初始值的变量，默认值为null。而Typescript是**严格Null类型**(可配置), 也就是说null是一个独立的类型，而不是一个简单的值, 这样可以更加安全. 换句话说在严格Null模式下, 如果一个变量是number类型，那么它就一定是数字，不能将null赋给它，变量也不需要判断是否为null.

  另外Typescript未初始化变量默认值为undefined, 而Dart没有undefined. JavaScript区分null和undefined本来就是一个拙劣的设计，大部分情况我们都会将null等价为undefined, 很多lint工具也有规则来限定只用null或只用undefined

<br>

常量

```dart
final name = 'Blob';             // const name = 'Blob';
final String nickname = 'bobi';  // const nickname: string = 'bobi';
final pets = [];                 // const pets: any[] = []

name = 'newName';                // ❌ 只能设置一次
pets.add('cat');                 // 👌 没问题
```

将final取代var来声明一个’常量', final等价于JavaScript中的const关键字, 这些常量不可以被二次赋值.

<br>

🆕编译时常量

dart还有另外一种常量类型: **编译时常量(compile-time constants)**, 它有以下特点:

- 初始化值必须能在编译时确定, 而final的初始值是任意的。所以通常它的值是一些基本类型的字面量表达式。例如`1`、`‘2’`、`['cat']`, `{}`. 不能是一些动态的表达式, 如`const int n2 = func();`. 这个跟Typescript的Enum成员值是一样的
- 值是不可变的。可以用于实现不可变数据
- 除了可以修饰常量还可以用于修饰值. 这可以让一个值不可以变


```dart
const String nickname = 'bobi';
const pets =  [];

pets.add('cat');                 // ❌ 值不能被修改

const int n2 = func();           // ❌ 值必须在编译时就能确定

// 常量初始化表达式可以引用其他常量值
const msPerSecond = 1000;
const secondsUntilRetry = 5;
const msUntilRetry = secondsUntilRetry * msPerSecond;
```

修饰值:

```dart
List<String> pets = const [];

pets.add('cat');                // ❌ 当前值不能被修改

pets = [];                      // 变量重新赋值
pets.add('cat');                // 👌 OK，当前值不是不可变数据
```

<br>

## 基本类型

| dart 类型  | Typescript类型 | 描述      | 字面量形式 | 注意 |
|-----------|----------------|----------|-----------|-----|
| int       | number         | 64bit整型 |  1、 0xDEADBEEF ||
| double       | number         | 64bit浮点型， IEEE 754标准 |  1.1、1.42e5 | |
| bool      | boolean | 布尔值 | true、false | 条件表达式只能接受bool类型，而JS很宽松 |
| String(注意大小写) | string |  UTF-16编码字符串 序列 |'单引号'、"双引号"、 '${expr}字符串内嵌表达式'、 `'字符串'+'连接'`、 `“”“三引号跨越多行”“”`| |
| List<T> | Array<T> 或T[] | 数组类型 | `[1, 2]`、`[1, '2', true]` |
| Set<T> | Set<T> | 集合类型 | `{1, 2, 3}` | JavaScript没有Set字面量形式 |
| Map<K, V> | {[key: K]: V} | 映射类型，相当于Javascript的对象| `{a: 1, 'b': 2, 3: 3}` 等价于JS的`{[a]: 1, b: 2, 3: 3}` | 严格来说更像JS中的Map类，因为JS对象属性本质是字符或Symbol |
数组

```dart
var list = [1, 2, 3];
assert(list.length == 3);
assert(list[1] == 2);
```

## 控制流

函数

- 签名
- 监听函数
- async/await
- 异常捕获

类

- 类
- 接口
- mixin

模块

标准库