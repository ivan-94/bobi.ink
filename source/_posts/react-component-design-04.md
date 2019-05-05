---
title: React组件设计实践总结04 - 组件的思维
date: 2019/4/23
categories: 前端
---

## Props

### 灵活的 props

### 避免透传

### 通信/事件

## 组件的思维

### 使用组件的思维来抽象业务

Locker

### hooks 取代高阶组件

逻辑复用能力

高阶组件难以进行类型声明
高阶组件组件嵌套

useList 为例

### hooks 响应式编程

数据响应式

### 类继承也有用处

就如 react 官方文档说的: "我们的 React 使用了数以千计的组件，然而却还未发现任何需要推荐你使用继承的情况。", React 偏向于函数式编程的组合模式, 面向对象的继承实际的应用场景很少.

当我们需要将一些传统的第三方库转换成 React 组件库时, 继承就可以派上用场了. 因为这些库大部分是使用面向对象的范式来组织的, 比较典型的就是地图 SDK. 以[百度地图](http://lbsyun.baidu.com/cms/jsapi/reference/jsapi_reference_3_0.html)为例:

![baidu overlay](/images/04/overlay.png)

百度地图有各种组件类型: controls, overlays, tileLayers. 这些类型都有多个子类, 如上图, overlay 有 Label, Marker, Polyline 等这些子类, 这些子类有相同的生命周期, 他们都是通过 addOverlay 方法来渲染到地图画布上. 我们可以通过继承的方式将他们生命周期管理抽取到父类上, 例如:

```ts
// Overlay抽象类, 负责管理Overlay的生命周期
export default abstract class Overlay<P> extends React.PureComponent<OverlayProps & P> {
  protected initialize?: () => void;
  // ...
  public componentDidMount() {
    // 子类在constructor或initialize方法中进行实例化
    if (this.initialize) {
      this.initialize();
    }

    if (this.instance && this.context) {
      // 渲染到Map画布中
      this.context.nativeInstance!.addOverlay(this.instance);
      // 初始化参数
      this.initialProperties();
    }
  }

  public componentDidUpdate(prevProps: P & OverlayProps) {
    // 属性更新
    this.updateProperties(prevProps);
  }

  public componentWillUnmount() {
    // 组件卸载
    if (this.instance && this.context) {
      this.context.nativeInstance!.removeOverlay(this.instance);
    }
  }
  // ...
  // 其他通用方法
  private forceReloadIfNeed(props: P, prevProps: P) {
    ...
  }
}
```

子类的工作就变得简单很多, 声明自己的属性/事件和实例化具体类:

```ts
export default class Label extends Overlay<LabelProps> {
  public static defaultProps = {
    enableMassClear: true,
  };

  public constructor(props: LabelProps) {
    super(props);
    const { position, content } = this.props;
    // 声明支持的属性和回调
    this.extendedProperties = PROPERTIES;
    this.extendedEnableableProperties = ENABLEABLE_PROPERTIES;
    this.extendedEvents = EVENTS;

    // 实例化具体类
    this.instance = new BMap.Label(content, {
      position,
    });
  }
}
```

> 代码来源于 [react-bdmap](https://github.com/ivan-94/react-bdmap)

当然这个不是唯一的解决方法, 使用高阶组件和 hooks 同样能够实现. 只不过对于原本就采用面向对象范式组织的库, 使用继承方式会更加好理解

### 配置组件

### 使用 Context 在组件树中共享状态

- 动态表单+验证
- context 默认值

### 模态框管理

### 使用 React-router 实现响应式的页面结构

应急通信为例

### 异常处理

context 缺陷

## 组件规范

## 扩展

- [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react#ordering)
