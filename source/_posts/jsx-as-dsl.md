---
title: "JSX AS DSL: 写个 Mock 服务器"
date: 2019/11/29
categories: 前端
---

这几天打算写一个简单的 API Mock 服务器。我在思考如何用简洁、灵活且方便的方式来满足各种 Mock API 配置需求。

<br>

## 现有的方案

先来看看现在常见的前端工具是怎么进行配置的。

### 配置文件形式

**JSON?**

JSON 是一种非常简单的数据表述, 没有任何学习成本，解析也非常方便。但是它有非常多致命的缺陷，比如不支持注释、冗余、数据结构单一。

**YAML?**

相比 JSON 语法要简洁很多、可读性也比较强。作为一个配置文件形式非常优秀

**还是其他配置文件形式...**

通常这些配置文件都是语言无关的，所以不会包含特定语言的元素。换句话说配置文件形式数据是静态的。 所以灵活性、扩展性比较差。只适合简单的配置场景。

举个简单例子，这些配置文件不支持函数。我们的 Mock 服务器可能会直接通过一个函数来动态处理请求，所以配置文件在这里并不适用。

<br>

### 编程语言与 DSL

我们需要回到编程语言本身，利用它的编程能力，实现配置文件无法实现的更强大的功能。

但是单纯使用编程语言，命令式的过程描述过于繁琐。所以我们最好针对某一个具体领域的问题进行简化和抽象，给用户提供一个友好的用户界面，让他们声明式地描述他们的领域问题。我们要减少用户对底层细节的依赖，但是同时保持灵活的扩展能力。

没错，我说的就是[**DSL(Domain-specific languages)**](https://zh.wikipedia.org/wiki/领域特定语言):

> DSL 是一种用于描述特定应用领域的计算机语言。DSL 在计算机领域有非常广泛的应用，例如描述Web页面的HTML、数据库查询语言 SQL、正则表达式。
> 相对应的是通用类型语言(GPL, General-Purpose Language)，例如Java、C++、JavaScript。它们可以用于描述任意的领域逻辑，它们是[图灵完备](https://en.wikipedia.org/wiki/Turing_completeness)的。

<br>

我个人认为 DSL 应该具备这些特性：

- 专注于特定领域。也就是说它的目的非常明确，从而比通用类型语言要简单很多，但是它的边界有时候并不好把握。
- 组织性。它应该方面组织和描述领域问题，关于组织性，配置文件组织性就非常好，比如 JSON，它可以很容易地描述数据结构，没有什么心智负担。另一个典型的例子是单元测试框架，例如 jest，它们使用 describe、it、expect 这些元件，让单元测试更好的组织起来。
- 可读性。它必须是人类可读的、容易理解的。
- 声明式。声明式优于过程式、描述 What 而不是 How。
- 扩展性。很多 DSL 一开始并不关注这一点，因为一开始问题可能并不复杂。问题的领域不是静态不变的，它可能会变大，这时候 DSL 的扩展能力就很关键了。 就比如 HTML，随着前端开发越来越复杂，原有的元素和功能集合已经无法满足需求，所以衍生除了很多组件或者自定义元素方案。不过原本的DSL 也可以选择保持不变，在这个基础之上再套一层，CSS vs SASS、HTML vs React 就是这样的例子。

<br>

**怎么创建 DSL？**

从头开发一门新语言？No! 成本太高了

一种更优雅的方式是在通用编程语言的基础上进行减法/封装抽象。当然不是所有类型语言都有这个'能力', 比如 Java、C/C++ 就不行，它们的语法太 Verbose 了。但是 Groovy、Ruby、Scala、还有 Elixir 这些语言就可以方面地创建出‘DSL’, 而且它们大部分是动态语言。

它们有的借助宏、有的天生语法就非常适合作为 DSL、有的具备非常强的动态编程能力... 这些因素促就了它们适合作为 DSL 的母体(宿主)。

我们通常也将这种 DSL 称为 Embedded DSL(嵌入式 DSL) 或者 内部 DSL。好处是省去了实现一门语言的复杂性(Parse->Transform->Generate)。

<br>

举两个非常典型的例子:

Java 开发者常用的 [Gradle](https://gradle.org)，基于 Groovy:

```groovy
plugins {
    id 'java-library'
}

repositories {
    jcenter()
}

dependencies {
    api 'org.apache.commons:commons-math3:3.6.1'

    implementation 'com.google.guava:guava:27.0.1-jre'

    testImplementation 'junit:junit:4.12'
}
```

<br>

还有 CocoaPods, 基于 Ruby:

```ruby
source 'http://source.git'
platform :ios, '8.0'

target 'Demo' do
    pod 'AFNetworking'
    pod 'SDWebImage'
    pod 'Masonry'
    pod "Typeset"
    pod 'BlocksKit'
    pod 'Mantle'
    pod 'IQKeyboardManager'
    pod 'IQDropDownTextField'
end
```

<br>

具体的实现细节不在本文的范围之内，还是聊回 JavaScript。

<br>
<br>

## 如何用 JavaScript 来组织描述领域问题？

## 扩展

- [DSL 的误区](https://www.yinwang.org/blog-cn/2017/05/25/dsl)
- [谈谈 DSL 以及 DSL 的应用（以 CocoaPods 为例）](https://draveness.me/dsl)