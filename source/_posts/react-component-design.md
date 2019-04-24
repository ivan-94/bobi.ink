---
title: React组件设计实践总结
date: 2019/4/23
categories: 前端
---

## 类型检查

函数组件
defaultProps
高阶组件: 缺点
泛型组件: 类组件, 函数组件
声明顺序, 类型命名规范
styled-components
文档化

## 组件划分

### 目录划分

多入口项目

一个项目下
  好处
  共享资源, 一起优化
  不能独立编译
workspace模式
  独立编译

不要耦合业务, 当做一个第三方UI库来设计

### 组件的识别

以gzb-bn为例

### 拆分

拆分为子函数
拆分为子组件

### 模块化

### 导出

展示组件和容器组件, 展示组件避免耦合业务

### 子组件

---

## 样式

### 组件的样式应该高度可定制化

组件的样式应该是可以自由定制的, 考虑组件的各种使用场景. 所以一个好的组件必须暴露相关的样式定制接口. 至少需要支持最基本的属性`className`和`style`

```typescript
interface ButtonProps {
  className?: string
  style?: React.CSSProperties
}
```

### 避免使用 style props

style props 添加的属性不能自动增加厂商前缀, 这可能会导致兼容性问题. 如果添加厂商前缀又会让代码变得啰嗦.
所以 style 适合用于动态且比较简单的样式属性

### 使用CSS-in-js

- styled-components
  - 命名, 语义
- 下级样式配置

### 使用原生CSS

CSS-in-js不适用于高性能场景, 多余的嵌套

---


## Props

### 灵活的props

### 避免透传

### 通信/事件


### 一致化表单协议/受控模式和非受控模式

- 方便集成验证工具
- 方便动态渲染
- 方便理解

---

## 业务抽象

### 使用组件的思维来抽象业务
Locker

### hooks取代高阶组件

逻辑复用能力

高阶组件难以进行类型声明
高阶组件组件嵌套

useList为例

### hooks响应式编程

数据响应式

### 配置组件

### 使用Context在组件树中共享状态

- 动态表单+验证
- context默认值

### class传统用法, 继承

react-bdmap为例

### 模态框管理

### 使用React-router实现响应式的页面结构

应急通信为例

### 异常处理

context缺陷

## 状态管理

!不属于组件设计范围

TODO: 学习观察组件库设计和代码