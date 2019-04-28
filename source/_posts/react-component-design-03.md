---
title: React组件设计实践总结03 - 样式的管理
date: 2019/4/23
categories: 前端
---

## 样式

### 组件的样式应该高度可定制化

组件的样式应该是可以自由定制的, 考虑组件的各种使用场景. 所以一个好的组件必须暴露相关的样式定制接口. 至少需要支持最基本的属性`className`和`style`

```typescript
interface ButtonProps {
  className?: string;
  style?: React.CSSProperties;
}
```

### 避免使用 style props

style props 添加的属性不能自动增加厂商前缀, 这可能会导致兼容性问题. 如果添加厂商前缀又会让代码变得啰嗦.
所以 style 适合用于动态且比较简单的样式属性

### 使用 CSS-in-js

- styled-components
  - 命名, 语义
- 下级样式配置

### 使用原生 CSS

CSS-in-js 不适用于高性能场景, 多余的嵌套

---

