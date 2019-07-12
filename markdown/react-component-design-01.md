---
title: React组件设计实践总结01 - 类型检查
date: 2019/5/10
categories: 前端
---

## 系列引言

最近准备培训新人, 为了方便新人较快入手 React 开发并编写高质量的组件代码, 我根据自己的实践经验对**React 组件设计的相关实践和规范**整理了一些文档, 将部分章节分享了出来. 由于经验有限, 文章可能会有某些错误, 希望大家指出, 互相交流.

由于篇幅太长, 所以拆分为几篇文章. 主要有以下几个主题:

- [01 类型检查](/2019/05/10/react-component-design-01/)
- [02 组件的组织](/2019/05/11/react-component-design-02/)
- [03 样式的管理](/2019/05/14/react-component-design-03/)
- [04 组件的思维](/2019/05/15/react-component-design-04/)
- [05 状态管理](/2019/05/20/react-component-design-05/)

## 类型检查

静态类型检查对于当今的前端项目越来越不可或缺, 尤其是大型项目. **它可以在开发时就避免许多类型问题, 减少低级错误的; 另外通过类型智能提示, 可以提高编码的效率; 有利于书写自描述的代码(类型即文档); 方便代码重构(配合 IDE 可以自动重构)**. 对于静态类型检查的好处这里就不予赘述, 读者可以查看这个回答[flow.js/typescript 这类定义参数类型的意义何在？](https://www.zhihu.com/question/28016252/answer/39056940).

Javascript 的类型检查器主要有[Typescript](https://www.typescriptlang.org)和[Flow](https://flow.org), 笔者两者都用过, Typescript 更强大一些, 可以避免很多坑, 有更好的生态(例如第三方库类型声明), 而且 VSCode 内置支持. 而对于 Flow, 连 Facebook 自己的开源项目(如 Yarn, Jest)都抛弃了它, 所以不建议入坑. 所以本篇文章使用 Typescript(v3.3) 对 React 组件进行类型检查声明

建议通过官方文档来[学习 Typescript](https://www.typescriptlang.org). 笔者此前也整理了 Typescript 相关的[思维导图(mindnode)](https://github.com/ivan-94/mindnodes/tree/master/语言/Typescript)

> 当然 Flow 也有某些 Typescript 没有的特性: [typescript-vs-flowtype](https://github.com/niieani/typescript-vs-flowtype)

> React 组件类型检查依赖于`@types/react`和`@types/react-dom`

> 直接上手使用试用 <br> [![Edit typescript-react-playground](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/5vx5wwmkvx?fontsize=14)

**目录**



- [系列引言](#系列引言)
- [类型检查](#类型检查)
  - [1. 函数组件](#1-函数组件)
    - [1️⃣ **使用`ComponentNameProps` 形式命名 Props 类型, 并导出**](#1️⃣-使用componentnameprops-形式命名-props-类型-并导出)
    - [2️⃣ **优先使用`FC`类型来声明函数组件**](#2️⃣-优先使用fc类型来声明函数组件)
    - [3️⃣ **不要直接使用`export default`导出组件**.](#3️⃣-不要直接使用export-default导出组件)
    - [4️⃣ **默认 props 声明**](#4️⃣-默认-props-声明)
    - [5️⃣ **泛型函数组件**](#5️⃣-泛型函数组件)
    - [6️⃣ **子组件声明**](#6️⃣-子组件声明)
    - [7️⃣ **Forwarding Refs**](#7️⃣-forwarding-refs)
    - [8️⃣ **配合高阶组件使用**](#8️⃣-配合高阶组件使用)
  - [2. 类组件](#2-类组件)
    - [1️⃣ **继承 Component 或 PureComponent**](#1️⃣-继承-component-或-purecomponent)
    - [2️⃣ **使用`static defaultProps`定义默认 props**](#2️⃣-使用static-defaultprops定义默认-props)
    - [3️⃣ **子组件声明**](#3️⃣-子组件声明)
    - [4️⃣ **泛型**](#4️⃣-泛型)
  - [3. 高阶组件](#3-高阶组件)
  - [4. Render Props](#4-render-props)
  - [5. Context](#5-context)
  - [6. 杂项](#6-杂项)
    - [1️⃣ **使用`handleEvent`命名事件处理器**.](#1️⃣-使用handleevent命名事件处理器)
    - [2️⃣ **内置事件处理器的类型**](#2️⃣-内置事件处理器的类型)
    - [3️⃣ **自定义组件暴露事件处理器类型**](#3️⃣-自定义组件暴露事件处理器类型)
    - [4️⃣ **获取原生元素 props 定义**](#4️⃣-获取原生元素-props-定义)
    - [5️⃣ **不要使用 PropTypes**](#5️⃣-不要使用-proptypes)
    - [6️⃣ **styled-components**](#6️⃣-styled-components)
    - [7️⃣ **为没有提供 Typescript 声明文件的第三方库自定义模块声明**](#7️⃣-为没有提供-typescript-声明文件的第三方库自定义模块声明)
    - [8️⃣ **为文档生成做好准备**](#8️⃣-为文档生成做好准备)
    - [9️⃣ **开启 strict 模式**](#9️⃣-开启-strict-模式)
  - [扩展资料](#扩展资料)



<br>

---

<br>

### 1. 函数组件

React Hooks 出现后, 函数组件有了更多出镜率. 由于函数组件只是普通函数, 它非常容易进行类型声明

<br>

#### 1️⃣ **使用`ComponentNameProps` 形式命名 Props 类型, 并导出**

<br>

#### 2️⃣ **优先使用`FC`类型来声明函数组件**

`FC`是`FunctionComponent`的简写, 这个类型定义了默认的 props(如 children)以及一些静态属性(如 defaultProps)

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

你也可以直接使用普通函数来进行组件声明, 下文会看到这种形式更加灵活:

```typescript
export interface MyComponentProps {
  className?: string;
  style?: React.CSSProperties;
  // 手动声明children
  children?: React.ReactNode;
}

export function MyComponent(props: MyComponentProps) {
  return <div>hello react</div>;
}
```

<br>

#### 3️⃣ **不要直接使用`export default`导出组件**.

这种方式导出的组件在`React Inspector`查看时会显示为`Unknown`

```typescript
export default (props: {}) => {
  return <div>hello react</div>;
};
```

如果非得这么做, 请使用`命名 function` 定义:

```typescript
export default function Foo(props: {}) {
  return <div>xxx</div>;
}
```

<br>

#### 4️⃣ **默认 props 声明**

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
// PropsWithChildren只是扩展了children, 完全可以自己声明
// type PropsWithChildren<P> = P & {
//    children?: ReactNode;
// }
const Hello = ({ name }: PropsWithChildren<HelloProps>) => <div>Hello {name}!</div>;

Hello.defaultProps = { name: 'TJ' };

// ✅ ok!
<Hello />;
```

这种方式也非常简洁, 只不过 defaultProps 的类型和组件本身的 props 没有关联性, 这会使得 defaultProps 无法得到类型约束, 所以必要时进一步显式声明 defaultProps 的类型:

```ts
Hello.defaultProps = { name: 'TJ' } as Partial<HelloProps>;
```

<br>

#### 5️⃣ **泛型函数组件**

泛型在一下列表型或容器型的组件中比较常用, 直接使用`FC`无法满足需求:

```typescript
import React from 'react';

export interface ListProps<T> {
  visible: boolean;
  list: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function List<T>(props: ListProps<T>) {
  return <div />;
}

// Test
function Test() {
  return (
    <List
      list={[1, 2, 3]}
      renderItem={i => {
        /*自动推断i为number类型*/
      }}
    />
  );
}
```

如果要配合高阶组件使用可以这样子声明:

```tsx
export const List = React.memo(props => {
  return <div />;
}) as (<T>(props: ListProps<T>) => React.ReactElement)
```

<br>

#### 6️⃣ **子组件声明**

使用`Parent.Child`形式的 JSX 可以让节点父子关系更加直观, 它类似于一种命名空间的机制, 可以避免命名冲突. 相比`ParentChild`这种命名方式, `Parent.Child`更为优雅些. 当然也有可能让代码变得啰嗦.

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

<br>

#### 7️⃣ **Forwarding Refs**

`React.forwardRef` 在 16.3 新增, 可以用于转发 ref, 适用于 HOC 和函数组件.

函数组件在 16.8.4 之前是不支持 ref 的, 配合 forwardRef 和 useImperativeHandle 可以让函数组件向外暴露方法

```typescript
/*****************************
 * MyModal.tsx
 ****************************/
import React, { useState, useImperativeHandle, FC, useRef, useCallback } from 'react';

export interface MyModalProps {
  title?: React.ReactNode;
  onOk?: () => void;
  onCancel?: () => void;
}

/**
 * 暴露的方法, 适用`{ComponentName}Methods`形式命名
 */
export interface MyModalMethods {
  show(): void;
}

export const MyModal = React.forwardRef<MyModalMethods, MyModalProps>((props, ref) => {
  const [visible, setVisible] = useState();

  // 初始化ref暴露的方法
  useImperativeHandle(ref, () => ({
    show: () => setVisible(true),
  }));

  return <Modal visible={visible}>...</Modal>;
});

/*******************
 * Test.tsx
 *******************/
const Test: FC<{}> = props => {
  // 引用
  const modal = useRef<MyModalMethods | null>(null);
  const confirm = useCallback(() => {
    if (modal.current) {
      modal.current.show();
    }
  }, []);

  const handleOk = useCallback(() => {}, []);

  return (
    <div>
      <button onClick={confirm}>show</button>
      <MyModal ref={modal} onOk={handleOk} />
    </div>
  );
};
```

#### 8️⃣ **配合高阶组件使用**

经常看到新手写出这样的代码:

```tsx
// Foo.tsx
const Foo: FC<FooProps> = props => {/* .. */})
export default React.memo(Foo)

// 使用
// Demo.tsx
import { Foo } from './Foo' // -> 这里面误使用命名导入语句，导致React.memo没有起作用
```

所以笔者一般这样子组织:

```tsx
// Foo.tsx
const Foo: FC<FooProps> = React.memo(props => {/* .. */}))
export default Foo
```

上面的代码还是有一个缺陷, 即你在React开发者工具看到的节点名称是这样的`<Memo(wrappedComponent)></Memo(wrappedComponent)>`, 只是因为React Babel插件无法从匿名函数中推导出displayName导致的. 解决方案是显式添加displayName:

```tsx
const Foo: FC<FooProps> = React.memo(props => {/* .. */}))
Foo.displayName = 'Foo'
export default Foo
```

<br>

---

<br>

### 2. 类组件

相比函数, 基于类的类型检查可能会更好理解(例如那些熟悉传统面向对象编程语言的开发者).

#### 1️⃣ **继承 Component 或 PureComponent**

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
   * ② 使用类实例属性+箭头函数形式绑定this
   */
  private increment = () => {
    this.setState(({ count }) => ({ count: count + 1 }));
  };

  private decrement = () => {
    this.setState(({ count }) => ({ count: count - 1 }));
  };
}
```

<br>

#### 2️⃣ **使用`static defaultProps`定义默认 props**

Typescript [3.0](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#support-for-defaultprops-in-jsx)开始支持对使用 defaultProps 对 JSX props 进行推断, 在 defaultProps 中定义的 props 可以不需要'?'可选操作符修饰. 代码如上 👆

<br>

#### 3️⃣ **子组件声明**

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

<br>

#### 4️⃣ **泛型**

```typescript
export class List<T> extends React.Component<ListProps<T>> {
  public render() {}
}
```

<br>

---

<br>

### 3. 高阶组件

在 React Hooks 出来之前, 高阶组件是 React 的一个重要逻辑复用方式. 相比较而言高阶组件比较重, 且难以理解, 容易造成`嵌套地狱(wrapper)`. 另外对 Typescript 类型化也不友好(以前会使用[Omit](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/9c1c7e78a9a2b4af8e2cda842c3693f67bb9e42d/types/react-router/index.d.ts#L137)来计算导出的 props). 所以新项目还是建议使用 React Hooks.

一个简单的高阶组件:

```typescript
import React, { FC } from 'react';

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
export function withTheme<P>(Component: React.ComponentType<P & ThemeProps>) {
  /**
   * WithTheme 自己暴露的Props
   */
  interface OwnProps {}

  /**
   * 高阶组件的props, 忽略ThemeProps, 外部不需要传递这些属性
   */
  type WithThemeProps = P & OwnProps;

  /**
   * 高阶组件
   */
  const WithTheme = (props: WithThemeProps) => {
    // 假设theme从context中获取
    const fakeTheme: ThemeProps = {
      primary: 'red',
      secondary: 'blue',
    };
    return <Component {...fakeTheme} {...props} />;
  };

  WithTheme.displayName = `withTheme${Component.displayName}`;

  return WithTheme;
}

// Test
const Foo: FC<{ a: number } & ThemeProps> = props => <div style={{ color: props.primary }} />;
const FooWithTheme = withTheme(Foo);
() => {
  <FooWithTheme a={1} />;
};
```

再重构一下:

```typescript
/**
 * 抽取出通用的高阶组件类型
 */
type HOC<InjectedProps, OwnProps = {}> = <P>(
  Component: React.ComponentType<P & InjectedProps>,
) => React.ComponentType<P & OwnProps>;

/**
 * 声明注入的Props
 */
export interface ThemeProps {
  primary: string;
  secondary: string;
}

export const withTheme: HOC<ThemeProps> = Component => props => {
  // 假设theme从context中获取
  const fakeTheme: ThemeProps = {
    primary: 'red',
    secondary: 'blue',
  };
  return <Component {...fakeTheme} {...props} />;
};
```

使用高阶组件还有一些痛点:

- 无法完美地使用 ref(这已不算什么痛点)
  - 在 React.forwardRef 发布之前, 有一些库会使用 innerRef 或者 wrapperRef, 转发给封装的组件的 ref.
  - 无法推断 ref 引用组件的类型, 需要显式声明.
- 高阶组件类型报错很难理解

<br>

---

<br>

### 4. Render Props

React 的 props(包括 children)并没有限定类型, 它可以是一个函数. 于是就有了 render props, 这是和高阶组件一样常见的模式:

```typescript
import React from 'react';

export interface ThemeConsumerProps {
  children: (theme: Theme) => React.ReactNode;
}

export const ThemeConsumer = (props: ThemeConsumerProps) => {
  const fakeTheme = { primary: 'red', secondary: 'blue' };
  return props.children(fakeTheme);
};

// Test
<ThemeConsumer>
  {({ primary }) => {
    return <div style={{ color: primary }} />;
  }}
</ThemeConsumer>;
```

<br>

---

<br>

### 5. Context

Context 提供了一种跨组件间状态共享机制

```typescript
import React, { FC, useContext } from 'react';

export interface Theme {
  primary: string;
  secondary: string;
}

/**
 * 声明Context的类型, 以{Name}ContextValue命名
 */
export interface ThemeContextValue {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

/**
 * 创建Context, 并设置默认值, 以{Name}Context命名
 */
export const ThemeContext = React.createContext<ThemeContextValue>({
  theme: {
    primary: 'red',
    secondary: 'blue',
  },
  onThemeChange: noop,
});

/**
 * Provider, 以{Name}Provider命名
 */
export const ThemeProvider: FC<{ theme: Theme; onThemeChange: (theme: Theme) => void }> = props => {
  return (
    <ThemeContext.Provider value={{ theme: props.theme, onThemeChange: props.onThemeChange }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

/**
 * 暴露hooks, 以use{Name}命名
 */
export function useTheme() {
  return useContext(ThemeContext);
}
```

<br>

---

<br>

### 6. 杂项

#### 1️⃣ **使用`handleEvent`命名事件处理器**.

如果存在多个相同事件处理器, 则按照`handle{Type}{Event}`命名, 例如 handleNameChange.

```typescript
export const EventDemo: FC<{}> = props => {
  const handleClick = useCallback<React.MouseEventHandler>(evt => {
    evt.preventDefault();
    // ...
  }, []);

  return <button onClick={handleClick} />;
};
```

<br>

#### 2️⃣ **内置事件处理器的类型**

`@types/react`内置了以下事件处理器的类型 👇

```typescript
type EventHandler<E extends SyntheticEvent<any>> = { bivarianceHack(event: E): void }['bivarianceHack'];
type ReactEventHandler<T = Element> = EventHandler<SyntheticEvent<T>>;
type ClipboardEventHandler<T = Element> = EventHandler<ClipboardEvent<T>>;
type CompositionEventHandler<T = Element> = EventHandler<CompositionEvent<T>>;
type DragEventHandler<T = Element> = EventHandler<DragEvent<T>>;
type FocusEventHandler<T = Element> = EventHandler<FocusEvent<T>>;
type FormEventHandler<T = Element> = EventHandler<FormEvent<T>>;
type ChangeEventHandler<T = Element> = EventHandler<ChangeEvent<T>>;
type KeyboardEventHandler<T = Element> = EventHandler<KeyboardEvent<T>>;
type MouseEventHandler<T = Element> = EventHandler<MouseEvent<T>>;
type TouchEventHandler<T = Element> = EventHandler<TouchEvent<T>>;
type PointerEventHandler<T = Element> = EventHandler<PointerEvent<T>>;
type UIEventHandler<T = Element> = EventHandler<UIEvent<T>>;
type WheelEventHandler<T = Element> = EventHandler<WheelEvent<T>>;
type AnimationEventHandler<T = Element> = EventHandler<AnimationEvent<T>>;
type TransitionEventHandler<T = Element> = EventHandler<TransitionEvent<T>>;
```

可以简洁地声明事件处理器类型:

```typescript
import { ChangeEventHandler } from 'react';
export const EventDemo: FC<{}> = props => {
  /**
   * 可以限定具体Target的类型
   */
  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(evt => {
    console.log(evt.target.value);
  }, []);

  return <input onChange={handleChange} />;
};
```

<br>

#### 3️⃣ **自定义组件暴露事件处理器类型**

和原生 html 元素一样, 自定义组件应该暴露自己的事件处理器类型, 尤其是较为复杂的事件处理器, 这样可以避免开发者手动为每个事件处理器的参数声明类型

自定义事件处理器类型以`{ComponentName}{Event}Handler`命名. 为了和原生事件处理器类型区分, 不使用`EventHandler`形式的后缀

```typescript
import React, { FC, useState } from 'react';

export interface UploadValue {
  url: string;
  name: string;
  size: number;
}

/**
 * 暴露事件处理器类型
 */
export type UploadChangeHandler = (value?: UploadValue, file?: File) => void;

export interface UploadProps {
  value?: UploadValue;
  onChange?: UploadChangeHandler;
}

export const Upload: FC<UploadProps> = props => {
  return <div>...</div>;
};
```

<br>

#### 4️⃣ **获取原生元素 props 定义**

有些场景我们希望原生元素扩展一下一些 props. 所有原生元素 props 都继承了`React.HTMLAttributes`, 某些特殊元素也会扩展了自己的属性, 例如`InputHTMLAttributes`. 具体可以参考[`React.createElement`](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/eafef8bd049017b3998939de2edbab5d8a96423b/types/react/index.d.ts#L203)方法的实现

```typescript
import React, { FC } from 'react';

export function fixClass<
  T extends Element = HTMLDivElement,
  Attribute extends React.HTMLAttributes<T> = React.HTMLAttributes<T>
>(cls: string, type: keyof React.ReactHTML = 'div') {
  const FixedClassName: FC<Attribute> = props => {
    return React.createElement(type, { ...props, className: `${cls} ${props.className}` });
  };

  return FixedClassName;
}

/**
 * Test
 */
const Container = fixClass('card');
const Header = fixClass('card__header', 'header');
const Body = fixClass('card__body', 'main');
const Footer = fixClass('card__body', 'footer');

const Test = () => {
  return (
    <Container>
      <Header>header</Header>
      <Body>header</Body>
      <Footer>footer</Footer>
    </Container>
  );
};
```

<br>

#### 5️⃣ **不要使用 PropTypes**

有了 Typescript 之后可以安全地约束 Props 和 State, 没有必要引入 React.PropTypes, 而且它的表达能力比较弱

<br>

#### 6️⃣ **styled-components**

styled-components 是目前最流行的`CSS-in-js`库, Typescript 在 2.9 支持泛型[`标签模板`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-9.html#generic-type-arguments-in-generic-tagged-templates). 这意味着可以简单地对 styled-components 创建的组件进行类型约束

```typescript
// 依赖于@types/styled-components
import styled from 'styled-components/macro';

const Title = styled.h1<{ active?: boolean }>`
  color: ${props => (props.active ? 'red' : 'gray')};
`;

// 扩展已有组件
const NewHeader = styled(Header)<{ customColor: string }>`
  color: ${props => props.customColor};
`;
```

了解更多[styled-components 和 Typescript](https://www.styled-components.com/docs/api#typescript)

<br>

#### 7️⃣ **为没有提供 Typescript 声明文件的第三方库自定义模块声明**

笔者一般习惯在项目根目录下(和 tsconfig.json 同在一个目录下)放置一个`global.d.ts`. 放置项目的全局声明文件

```typescript
// /global.d.ts

// 自定义模块声明
declare module 'awesome-react-component' {
  // 依赖其他模块的声明文件
  import * as React from 'react';
  export const Foo: React.FC<{ a: number; b: string }>;
}
```

了解更多[如何定义声明文件](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

<br>

#### 8️⃣ **为文档生成做好准备**

目前社区有多种 react 组件文档生成方案, 例如[`docz`](https://www.docz.site), [`styleguidist`](https://github.com/styleguidist/react-docgen-typescript)还有[storybook](https://github.com/storybooks/storybook). 它们底层都使用[react-docgen-typescript](https://github.com/styleguidist/react-docgen-typescript)对 Typescript 进行解析. 就目前而言, 它还有些坑, 而且解析比较慢. 不管不妨碍我们使用它的风格对代码进行注释:

```typescript
import * as React from 'react';
import { Component } from 'react';

/**
 * Props注释
 */
export interface ColumnProps extends React.HTMLAttributes<any> {
  /** prop1 description */
  prop1?: string;
  /** prop2 description */
  prop2: number;
  /**
   * prop3 description
   */
  prop3: () => void;
  /** prop4 description */
  prop4: 'option1' | 'option2' | 'option3';
}

/**
 * 对组件进行注释
 */
export class Column extends Component<ColumnProps, {}> {
  render() {
    return <div>Column</div>;
  }
}
```

#### 9️⃣ **开启 strict 模式**

为了真正把 Typescript 用起来, 应该始终开启 strict 模式, 避免使用 any 类型声明.

<br>

---

<br>

### 扩展资料

- [piotrwitek/react-redux-typescript-guide](https://github.com/piotrwitek/react-redux-typescript-guide)
- [TypeScript 如何完美地书写 React 中的 HOC？](https://www.zhihu.com/question/279911703)
- [Typescript 官方文档](https://www.typescriptlang.org/docs/home.html)
- [Typescript-deep-dive](https://basarat.gitbooks.io/typescript/docs/why-typescript.html)
- [Typescript 思维导图](https://github.com/ivan-94/mindnodes/tree/master/语言/Typescript)
