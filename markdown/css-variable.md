---
title: "[译] 不要错过CSS变量"
date: 2019/7/6
categories: 前端,CSS
---

原文链接: [Don't miss out on css variables](https://dev.to/timdeschryver/don-t-miss-out-on-css-variables-4708)

当我第一次听说[CSS变量](https://www.w3.org/TR/css-variables/)时，我是有点怀疑的。scss、sass、less和stylus这些CSS预处理器都有变量机制，为什么还要使用它？过了几年，我发现越来越多的人开始讨论和使用它，我觉得我像错过了什么…… 虽然花费了一点功夫，但在使用后，我确实被它吸引住了。这篇文章我会阐述到底是什么推动我进一步去探索CSS变量，并在实际项目中使用它。

## 用法

在选择器里面声明变量，变量名以`--`作为前缀:

```css
div {
  --bgColor: deeppink;
}
```


一个流行的方式是在`:root`选择器中定义变量，这相当于定于全局变量:

```css
:root {
  --bgColor: teal;
}
```

通过`var()`函数来引用变量:

```css
div {
  background: var(--bgColor);
}
```

`var()`函数还可以接受一个参数，用作变量的默认值，当变量未定义时回退到这个默认值:

```css
header {
  background: var(--bgColor);
  color: var(--color, beige);
}
```

上面代码的运行结果如下:

![](https://bobi.ink/images/css-variable/01.png)

## 主题

利用CSS变量，可以很容易地实现主题机制.

在body元素上为不同的主题创建不同的类名，并声明变量:

```css
body.sunrise {
  --background-color: #fff;
  --text-color: #333;
}

body.sunset {
  --background-color: #333;
  --text-color: #fff;
}
```

使用这些变量:

```css
html,
body {
  background: var(--background-color);
  color: var(--text-color);
}
```

现在切换body元素的类名到sunrise或sunse，CSS变量会叠层应用到所有选择器. 效果如下:

![](https://bobi.ink/images/css-variable/01.gif)

## Javascript API

This is, in my opinion, the best part. CSS variables have a JavaScript API to get and set variables.
我觉得这是CSS变量最好的部分——CSS变量可以通过Javascript API来获取和设置。SCSS/Less这些预处理器的变量可做不到(部分预处理器已支持编译到到CSS变量)。

通过[`getPropertyValue`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/getPropertyValue)方法来获取变量:

```js
getComputedStyle(document.documentElement).getPropertyValue('--color')
```

如果要获取具体元素的的变量值, 先通过[`querySelector`](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)获取元素：

```js
getComputedStyle(document.querySelector('h1')).getPropertyValue('--color')
```

通过[`style.setProperty`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/setProperty)来设置变量值：

```js
document.documentElement.style.setProperty('--color', 'red')
```

设置具体元素的变量值:

```js
document.querySelector('h1').style.setProperty('--color', 'blue')
```

这个API提供了一个简洁的方式来使用CSS变量.

我在几天前通过David K的XState DEMO接触到了这个使用场景: 当用户通过鼠标拖拽, 他使用CSS变量来创建一个选择框，这个选择框通过CSS变量来设置四个边角位置(基于鼠标的开始位置和当前位置):

```css
.selectbox {
  left: calc(var(--mouse-x1));
  top: calc(var(--mouse-y1));
  width: calc((var(--mouse-x2) - var(--mouse-x1)));
  height: calc((var(--mouse-y2) - var(--mouse-y1)));

  color: rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.1);
  border: 2px solid currentColor;
  position: absolute;
  transition: opacity 0.3s ease-in-out;
}
```

在mouse事件处理器中更新CSS变量：

```js
document.documentElement.style.setProperty(
  '--mouse-x1',
  ctx.selectArea.x1 + 'px',
)
document.documentElement.style.setProperty(
  '--mouse-y1',
  ctx.selectArea.y1 + 'px',
)
document.documentElement.style.setProperty(
  '--mouse-x2',
  ctx.selectArea.x2 + 'px',
)
document.documentElement.style.setProperty(
  '--mouse-y2',
  ctx.selectArea.y2 + 'px',
)
```

![](https://bobi.ink/images/css-variable/02.gif)

## 最后

如果你像我一样觉得CSS变量没有用，或者压根不知道它的存在，我希望这篇文章可以为你开启一扇门，来探索它的使用场景。

Javascript API让我踩了不少坑，但是它确实让我开了眼界，我期待未来更多人使用它

## 扩展

- [使用CSS变量](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)
- [Caniuse: CSS Variables (Custom Properties)](https://caniuse.com/#feat=css-variables)