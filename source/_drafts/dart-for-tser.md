---
title: "写给Typescripter的Dart教程"
date: 2019/7/15
categories: 前端
---

> 基于Dart 2.4 + Typescript 3.5

<!-- TOC -->autoauto- [基本类型](#基本类型)auto- [操作符与表达式](#操作符与表达式)auto  - [操作符](#操作符)auto- [控制流](#控制流)auto- [函数](#函数)auto  - [**函数参数**](#函数参数)auto  - [函数返回值](#函数返回值)auto  - [函数是第一公民](#函数是第一公民)autoauto<!-- /TOC -->

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
| Symbol | symbol | 用于表示操作符或标识符 | `#+`(操作符)、`#radix`(标识符), `#1`(❌不是标识符) | TODO: 差异 |

数组

```dart
var list = [1, 2, 3];
assert(list.length == 3);
assert(list[1] == 2);
```

## 操作符与表达式

### 操作符

Dart和Javascript的操作符基本一致, 所以这里只将Dart中比较特殊的或者行为不太一样的操作符。

| Dart |    | Javascript |             |
|------|----|------------|-------------|
| ~/   | 相除并返回int <br> `10/3` => 3.333..<br> `10~/3` => 3 | 没有类似操作符 | `Math.floor(10/3)` |
| == | 判断两个对象是否'相等' <br> 相等的概念是根据对象类型来决定的，也就是Dart支持操作符重载，对象类型可以实现自定义的相等逻辑。 <br> 如果要判断两个对象内存地址相同，用`identical`函数 | === | Javascript的相等操作符比较混乱，`==`是一个宽松版的相等, 会有各种奇怪行为, 比如`'' == 0`, 而`===`则表示两个对象完全相等(内存地址一样) |
| as | 类型转换(Typecast) | 类型断言(Type Assertions) | 两者意思都是一样的，就是‘纠正’编译器的类型判断，不会进行‘运行时’类型转换。 `(emp as Person).firstName = 'Bob';`
| as | 设置库前缀 <br> `import 'package:lib2/lib2.dart' as lib2;`| 模块语句中也存在类似的语法 | `import * as Foo from 'foo'` |
| is | TODO: `obj is T` 表示是否实现了T接口(类) | instanceof | Javascript本身没有‘类’或‘接口’的概念，只有基于原型的'继承'，instanceof主要通过原型链来检查一个对象是否是指定类型的实例 |
| is!| 和is相反 | !(obj instanceof T) | Javascript中类似于`in`或`instanceof`这些操作符取反都需要括号包裹，而Dart的`is!`则优雅一点 |
| ?? | 测试对象是否为null，如果是null则回退到默认值 <br> `name ?? 'Guest'` | | `name || 'Guest'` 或 `name == null ? 'Guest' : name` |
| ??= | `name ??= 'Guest'` 和 `name = name ?? 'Guest'`等价 | | `name = name || 'Guest'` |
| ?. | 条件成员访问, 访问成员前先判断对象是否为null<br> `foo?.bar` | ?. | Typescript未来也将支持，[Optional Chaining](https://github.com/tc39/proposal-optional-chaining)目前是stage 3阶段 |

**`..`级联操作符**

这个语法糖很甜，它允许你对一个对象做一系列的操作，例如赋值、函数调用、字段访问. 最后返回这个对象

严格来说这不是一个操作符。形式上这个有点像我们常用的链式调用，但是更加强大:

```dart
querySelector('#confirm') // Get an object.            // const button = querySelector('#confirm')
  ..text = 'Confirm' // Use its members.               // button.text = 'Confirm'
  ..classes.add('important')                          // button.classes.add('important')
  ..onClick.listen((e) => window.alert('Confirmed!')); // button.onClick.listen(e => window.alert('Confirmed!'));
```

<br>

## 控制流

## 函数

**基本形式**

```dart
ReturnType name(ParamType param) { // function name(param: ParamType): ReturnType {
  return something;                //  return something
}                                  // }
```

函数的返回值和参数值的类型注释是可选的，Dart默认使用dynamic类型.

**'箭头'函数**

Dart函数支持省略'函数体的花括号', 形式如下:

```dart
// 省略函数体花括号
bool isNoble(int atomicNumber) => _nobleGases[atomicNumber] != null; //
// 更接近JS的箭头函数
var compare = (int a, int b) => a > b; // let compare = (a: number, b: number) => a > b

// 注意, '=>' 的语法主要用于简化返回语句，它不能像Javascript一样携带函数体，只能携带表达式
var compare = (int a, int b) => {return a > b}; // ❌，箭头函数箭头后面只能跟表达式
// TODO: 返回值怎么声明
var compare = (int a, int b) {return a > b};    // ✅ 去掉箭头后可以携带函数体
```

### **函数参数**

***🆕命名参数**

dart支持命名参数, 对Typescript来说只是对象+展开操作符的语法糖:

```dart
void enableFlags(String name, {bool bold, bool hidden}) {...} // function enableFlags(name: string, {bold, hidden}: {bold?: boolean, hidden?: boolean} = {}) {...}
```

- ① 命名参数默认是可选的
- ② 命名参数只能是最后一个参数

必传的命名参数:

TODO: 怎么导入meta模块

```dart
Scrollbar({Key key, @required Widget child})
```

命名参数调用：可以省略花括号

```dart
enableFlags('name', bold: true, hidden: false); // enableFlags('name', {bold: true, hidden: false});
```

***可选参数**

使用方括号包含说明参数可选

```dart
String foo(String bar, [String baz, int bazz]) // foo(bar: string, baz?: string): string
```

- 可选参数只能在最后，且在命名参数之前

***默认值**

```dart
// 命名参数
void enableFlags({bool bold = false, bool hidden = false}) {...}  // function enableFlags({bold = false, hidden = false}: {bold?: boolean, hidden?: boolean} = {}) {...}
// 普通变量
String say(String from, String msg, [String device = 'carrier pigeon', String mood]) {...} // function say(from: string, msg: string, device: string = 'carrier pigeon', mood?: string) {}
```


### 函数返回值

如果没有显式声明返回值类型， 默认为void。

另外Dart和Javascript一样，函数没有显式使用`return`语句，默认返回null

```dart
foo() {}                // function foo() {}

assert(foo() == null);
```

### 函数是第一公民

和Javascript一样，Dart的函数也是第一公民，可以通过函数传递、赋给变量:

```dart
void printElement(int element) {        // function printElement(element: number) {
  print(element);
}

var list = [1, 2, 3];

// 作为函数参数
list.forEach(printElement);

// 赋值给变量
var loudify = (msg) => '!!! ${msg.toUpperCase()} !!!'; // const loudify = msg => `!!! ${msg.toUpperCase()} !!!`
```

一样支持闭包

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
