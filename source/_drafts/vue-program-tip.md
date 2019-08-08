---
title: "我从阅读Vue源代码中学习到的编程技巧(不会说Vue的原理)"
date: 2019/7/10
categories: 前端
---

justjavac a + b > value

## 1. 使用`Object.create(null)`

Vue在某些场景使用`Object.create(null)`取代`{}`, 先说一些两者的区别:

- `Object.create(null)` 表示对象的原型为空，这时候你在控制台看到的输出是这样的：

  ![](/images/vue-program-tip/create-null.png)

- `{}`字面量相当于`Object.create(Object.prototype)`, 在控制台输出时会看到其原型:

  ![](/images/vue-program-tip/object-literal.png)

<br>

参阅了一些资料，得出的结论如下:

- `Object.create(null)`可以创建一个纯净的对象，可以在此基础上实现完全自定义的数据结构
- 经过测试，现代浏览器, 性能方面`Object.create(null)`创建会稍微快于`{}`，可以忽略不计; 但是`for-in`遍历`{}`要快两倍，即使`{}`在遍历时加上`hasOwnProperty`判断。

所以`Object.create(null)`就只剩下第一条使用场景了。即你需要一个创建一个纯净的对象，来自定义数据结构，如Map, 可以选择它.

<br>

## 2. 全局默认值

Vue定义了这些对象和函数: `noop`、`emptyObject`、`emptyArray`、`no`、`yes`、`identity`

这些对象通常用于作为默认值，避免频繁来创建一些一次性的对象或函数。比如作为函数参数的默认值:

```js
// options是可选参数，当用户不传时，默认为空对象. 这样在获取对象属性时不至于抛出异常
function dosomething(options = emptyObject) {
  const { some, option } = options
}
```

因为是全局, 所以emptyObject和emptyArray, 需要冻结不允许变动:

```js
export const emptyObject = Object.freeze({})
```

<br>

## 3. 使用`process.env.NODE_ENV`区分运行环境

这是大型项目常用的技巧，它们需要为开发环境和生产环境提供不一样的特性。比如在开发环境输出友好的调试信息。前几天Dan abramov还专门写了一篇文章[How Does the Development Mode Work?](https://overreacted.io/how-does-the-development-mode-work/)来介绍这个.

比如，我们的代码是长这样的:

```js
if (process.env.NODE_ENV !== 'production') {
  doSomethingDev();
} else {
  doSomethingProd();
}
```

通常我们还需要借助Webpack或Rollup这些打包工具来实现这些代码的替换，比如使用Webpack的[DefinePlugin](https://www.webpackjs.com/plugins/define-plugin/):

```js
new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify(env),
})
```

打包工具转译后代码变成了：

```js
// 开发环境:
if ('development' !== 'production') { // true
  doSomethingDev(); // 👈
} else {
  doSomethingProd();
}

// 生成环境:
if ('production' !== 'production') { // false
  doSomethingDev();
} else {
  doSomethingProd(); // 👈
}
```

接下来，在生产环境我们还会对代码进行优化和压缩，比如[`terser`](https://github.com/terser-js/terser), 这些优化工具会将你的'死代码'去掉，最后生产环境的代码是这样的:

```js
doSomethingProd(); // 👈
```

回到vue中，它有一个debug.js文件是这样定义的:


```js
// 默认值都为noop
export let warn = noop
export let tip = noop
export let generateComponentTrace = noop 
export let formatComponentName = noop

if (process.env.NODE_ENV !== 'production') {
  // 在非生产环境实现它们，提供更好的调试信息
  warn = (msg, vm) => {/*...*/}
  tip = (msg, vm) => {/*...*/}
  // ...
}

```

<br>

## 4. 将O(n)循环减至O(logN)

Vue里面有一个repeat函数, 用于重复N次某个字符串. 它使用使用了二级制`>>`操作符(相当于N/2)，将循环的次数减至了`O(logN)`:

```js
const repeat = (str, n) => {
  let res = ''
  while (n) {
    if (n % 2 === 1) res += str
    if (n > 1) str += str
    n >>= 1
  }
  return res
}
```