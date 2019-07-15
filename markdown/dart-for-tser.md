---
title: "写给Typescripter的Dart教程"
date: 2019/7/6
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

基本类型

控制流

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