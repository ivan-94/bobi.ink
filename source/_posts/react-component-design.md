---
title: React组件设计实践总结
date: 2019/4/23
categories: 前端
---

## 类型检查

静态类型检查对于当今的前端项目是必不可少的, 尤其是大型项目. 它可以在开发时就避免许多类型问题, 减少低级错误的.
另外通过智能提示, 可以提高编码的效率. 对于静态类型检查的好处这里就不予赘述.

可以通过[Typescript](https://www.typescriptlang.org)和[Flow](https://flow.org), 笔者两者都用过, Typescript
则更强大一些, 可以避免很多坑, 有更好的生态(例如第三方库类型声明), 而且 VSCode 内置支持. 而对于 Flow, 连 Facebook 自己的开源项目(如 Yarn, Jest)都抛弃了它, 所以不建议入坑

> 当然 Flow 也有某些 Typescript 没有的特性: [typescript-vs-flowtype](https://github.com/niieani/typescript-vs-flowtype) <br/>
> React 组件类型检查依赖于`@types/react`和`@types/react-dom`

### 函数组件

React Hooks 出现后, 函数组件有了出镜率

- 1️⃣ 使用{ComponentName}Props 形式声明 Props 类型, 并导出
- 2️⃣ 使用`FC`(`FunctionComponent`的简写)类型来声明函数组件. 这个类型定义了默认的 props(如 children)以及一些静态属性(如 defaultProps)

  ```typescript
  import React, { FC } from 'react';

  /**
   * 声明Props类型
   */
  export interface MyComponentProps {
    className?: string;
    style?: React.CSSProperties;
  }

  export const MyComponent: FC<MyComponentProps> = props => {
    return <div>hello react</div>;
  };
  ```

- 3️⃣ 不要直接使用`export default`导出组件. 这种方式导出的组件在`React Inspector`查看时会显示`Unknown`

  ```typescript
  export default (props: {}) => {
    return <div>hello react</div>;
  };
  ```

  如果非得这么做, 请使用 function 定义

  ```typescript
  export default function Foo(props: {}) {
    return <div>xxx</div>;
  }
  ```

- 4️⃣ 默认 props 声明
  实际上截止目前对于上面的使用`FC`类型声明的函数组件并[不能完美支持 defaultProps](https://github.com/Microsoft/TypeScript/issues/27425):

  ```typescript
  import React, { FC } from 'react';

  export interface HelloProps {
    name: string;
  }

  export const Hello: FC<HelloProps> = ({ name }) => <div>Hello {name}!</div>;

  Hello.defaultProps = { name: 'TJ' };

  // ❌! missing name
  <Hello />;
  ```

  笔者一般喜欢这样子声明默认 props:

  ```typescript
  export interface HelloProps {
    name?: string; // 声明为可选属性
  }

  // 利用对象默认属性值语法
  export const Hello: FC<HelloProps> = ({ name = 'TJ' }) => <div>Hello {name}!</div>;
  ```

  如果非得使用 defaultProps, 可以这样子声明 👇. Typescript 可以推断和在函数上定义的属性, 这个特性在 Typescript [3.1](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-1.html#properties-declarations-on-functions)开始支持.

  ```typescript
  import React, { PropsWithChildren } from 'react';

  export interface HelloProps {
    name: string;
  }

  // 直接使用函数参数声明
  // PropsWithChildren 会注入children props声明, 你也可以选择直接在HelloProps显式声明
  const Hello = ({ name }: PropsWithChildren<HelloProps>) => <div>Hello {name}!</div>;

  Hello.defaultProps = { name: 'TJ' };

  // ✅ ok!
  <Hello />;
  ```

  这种方式也非常简洁, 只不过 defaultProps 的类型和组件本身的 props 没有关联性, 这会使得 defaultProps 无法得到类型约束, 所以必要时进一步显式声明 defaultProps 的类型:

  ```typescript
  Hello.defaultProps = { name: 'TJ' } as Partial<HelloProps>;
  ```

- 5️⃣ 泛型函数组件

  泛型在一下列表型或容器型的组件中比较常用, 直接使用`FC`无法满足:

  ```typescript
  import React, { PropsWithChildren } from 'react';

  export interface ListProps<T> {
    visible: boolean;
    list: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
  }

  export function List<T>(props: PropsWithChildren<ListProps<T>>) {
    return <div />;
  }

  // Test
  <List
    list={[1, 2, 3]}
    renderItem={i => {
      /*自动推断i为number类型*/
    }}
  />;
  ```

- 6️⃣ 子组件声明
  使用`Parent.Child`形式的 JSX 可以让节点父子关系更加直观, 当然也有可能让代码变得啰嗦.

  ```typescript
  import React, { PropsWithChildren } from 'react';

  export interface LayoutProps {}
  export interface LayoutHeaderProps {} // 采用ParentChildProps形式命名
  export interface LayoutFooterProps {}

  export function Layout(props: PropsWithChildren<LayoutProps>) {
    return <div className="layout">{props.children}</div>;
  }

  // 作为父组件的属性
  Layout.Header = (props: PropsWithChildren<LayoutHeaderProps>) => {
    return <div className="header">{props.children}</div>;
  };

  Layout.Footer = (props: PropsWithChildren<LayoutFooterProps>) => {
    return <div className="footer">{props.children}</div>;
  };

  // Test
  <Layout>
    <Layout.Header>header</Layout.Header>
    <Layout.Footer>footer</Layout.Footer>
  </Layout>;
  ```

- 7️⃣ Forwarding Refs

### 类组件

相比函数, 基于类的类型检查会更好理解(例如那些熟悉传统面向对象编程语言的开发者).

- 1️⃣ 继承 React.Component 或 React.PureComponent

  ```typescript
  import React from 'react';

  /**
   * 首先导出Props声明, 同样是{ComponentName}Props形式命名
   */
  export interface CounterProps {
    defaultCount: number; // 可选props, 不需要?修饰
  }

  /**
   * 组件状态, 不需要暴露
   */
  interface State {
    count: number;
  }

  /**
   * 类注释
   * 继承React.Component, 并声明Props和State类型
   */
  export class Counter extends React.Component<CounterProps, State> {
    /**
     * 默认参数
     */
    public static defaultProps = {
      defaultCount: 0,
    };

    /**
     * 初始化State
     */
    public state = {
      count: this.props.defaultCount,
    };

    /**
     * 声明周期方法
     */
    public componentDidMount() {}
    /**
     * 建议靠近componentDidMount, 资源消费和资源释放靠近在一起, 方便review
     */
    public componentWillUnmount() {}
    public componentDidCatch() {}
    public componentDidUpdate(prevProps: CounterProps, prevState: State) {}

    /**
     * 渲染函数
     */
    public render() {
      return (
        <div>
          {this.state.count}
          <button onClick={this.increment}>Increment</button>
          <button onClick={this.decrement}>Decrement</button>
        </div>
      );
    }

    /**
     * ① 组件私有方法, 不暴露
     * ② 使用类实例属性形式绑定this
     */
    private increment = () => {
      this.setState(({ count }) => ({ count: count + 1 }));
    };

    private decrement = () => {
      this.setState(({ count }) => ({ count: count - 1 }));
    };
  }
  ```

- 2️⃣ 使用`static defaultProps`定义默认 props
  Typescript [3.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#support-for-defaultprops-in-jsx)开始支持对使用 defaultProps 对 JSX props 进行推断, 在 defaultProps 中定义的 props 可以不需要'?'可选操作符修饰. 代码如上 👆

- 3️⃣ 子组件声明
  类组件可以使用静态属性形式声明子组件

  ```typescript
  export class Layout extends React.Component<LayoutProps> {
    public static Header = Header;
    public static Footer = Footer;

    public render() {
      return <div className="layout">{this.props.children}</div>;
    }
  }
  ```

  - 4️⃣ 泛型

  ```typescript
  export class List<T> extends React.Component<ListProps<T>> {
    public render() {}
  }
  ```

### (远离)高阶组件

在 React Hooks 出来之前, 高阶组件是 React 的一个重要逻辑复用方式. 相比较而言高阶组件比较重, 难以理解, 而且会造成'嵌套地狱(wrapper)'. 另外对 Typescript 类型化也不友好. 所以新项目还是建议使用 React Hooks.

一个简单的高阶组件:

```typescript
import React, { FC } from 'react';

/**
 * 忽略类型的指定属性
 */
export type Omit<T, K extends keyof T> = T extends any ? Pick<T, Exclude<keyof T, K>> : never;

/**
 * 声明注入的Props
 */
export interface ThemeProps {
  primary: string;
  secondary: string;
}

/**
 * 给指定组件注入'主题'
 */
export function withTheme<P extends ThemeProps>(Component: React.ComponentType<P>) {
  /**
   * WithTheme 自己暴露的Props
   */
  interface OwnProps {}

  /**
   * 高阶组件的props, 忽略ThemeProps, 外部不需要传递这些属性
   */
  type WithThemeProps = Omit<P, keyof ThemeProps> & OwnProps;

  /**
   * 高阶组件
   */
  const WithTheme = (props: WithThemeProps) => {
    const fakeTheme: ThemeProps = {
      primary: 'red',
      secondary: 'blue',
    };
    // ❌ 这里会报错
    return <Component {...fakeTheme} {...props} />;
  };

  WithTheme.displayName = `withTheme${Component.displayName}`;

  return WithTheme;
}
```

一般高阶组件的报错信息都很难理解:

![](/images/04/hoc-err.png)

暂时性修复上面保存可以使用`@ts-ignore`或者显式类型断言. 相关[issue](https://github.com/piotrwitek/react-redux-typescript-guide/issues/111).

使用高阶组件还有一些痛点:

- 无法完美地使用 ref.
  - 在 React.forwardRef 发布之前, 有一些库会使用 innerRef 或者 wrapperRef, 转发给封装的组件的 ref.
  - 无法推断 ref 引用组件的类型, 需要显式声明

defaultProps
高阶组件: 缺点
泛型组件: 类组件, 函数组件
声明顺序, 类型命名规范
styled-components
其他常见用法 ref event
文档化

### 扩展资料

- [piotrwitek/react-redux-typescript-guide](https://github.com/piotrwitek/react-redux-typescript-guide)

<br/>

---

<br/>

## 组件划分

### 目录划分

多入口项目

一个项目下
好处
共享资源, 一起优化
不能独立编译
workspace 模式
独立编译

不要耦合业务, 当做一个第三方 UI 库来设计

### 组件的识别

以 gzb-bn 为例

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

## Props

### 灵活的 props

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

### hooks 取代高阶组件

逻辑复用能力

高阶组件难以进行类型声明
高阶组件组件嵌套

useList 为例

### hooks 响应式编程

数据响应式

### 配置组件

### 使用 Context 在组件树中共享状态

- 动态表单+验证
- context 默认值

### class 传统用法, 继承

react-bdmap 为例

### 模态框管理

### 使用 React-router 实现响应式的页面结构

应急通信为例

### 异常处理

context 缺陷

## 状态管理

!不属于组件设计范围

TODO: 学习观察组件库设计和代码
