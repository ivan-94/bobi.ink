---
title: 浅谈React性能优化的方向
date: 2019/6/14
categories: 前端
---

<!-- TOC -->

- [减少渲染的节点](#减少渲染的节点)
  - [1️⃣ 减少不必要的嵌套](#1️⃣-减少不必要的嵌套)
  - [2️⃣ 虚拟列表](#2️⃣-虚拟列表)
  - [3️⃣ 惰性渲染](#3️⃣-惰性渲染)
- [避免重新渲染](#避免重新渲染)
  - [**1️⃣ 简化 props**](#1️⃣-简化-props)
  - [2️⃣**不变的事件处理器**](#2️⃣不变的事件处理器)
  - [3️⃣**不可变数据**](#3️⃣不可变数据)
  - [4️⃣**简化 state**](#4️⃣简化-state)
  - [5️⃣**使用[recompose](https://github.com/acdlite/recompose) 精细化比对**.](#5️⃣使用recomposehttpsgithubcomacdliterecompose-精细化比对)
- [精细化渲染](#精细化渲染)
  - [1️⃣ 响应式数据的精细化渲染](#1️⃣-响应式数据的精细化渲染)
  - [2️⃣ 不要滥用 Context](#2️⃣-不要滥用-context)
- [扩展](#扩展)

<!-- /TOC -->

<br/>

从内部的一个项目优化进行总结, 小技巧

## 减少渲染的节点

从量上下功夫，减少节点渲染的数量可以显著的提高组件渲染性能。

### 1️⃣ 减少不必要的嵌套

<center>
 <img src="/images/09/styled-components.png" />
</center>

我们团队是重度的 `styled-components` 用户，其实大部分情况下我们都不需要这个玩意，比如在需要重度性能优化的场景。除了性能问题，另外一个困扰我们的是它带来的节点嵌套地狱(如上图)。所以我们需要理性地选择一些工具，比如使用原生的 CSS，减少 React 运行时的负担.

一般不必要的节点嵌套都是使用高阶组件导致的，所以不要滥用高阶组件.

<br/>

### 2️⃣ 虚拟列表

虚拟列表是常见的长列表优化方式，它优化的本质也是减少渲染的节点。虚拟列表只渲染当前视口可见元素.

<center>
 <img src="/images/09/vl.png" width="500" />
</center>

虚拟列表渲染性能对比:

<center>
 <img src="/images/09/vl-compare.png" width="500" />
</center>

虚拟列表常用于一下组件场景:

- 无限滚动列表，grid, 表格，下拉列表，spreadsheets
- 无限切换的日历或轮播图
- 无限嵌套的组件树
- 聊天窗，数据流(feed), 时间轴
- 等等

相关组件方案:

- [react-virtualized](https://github.com/bvaughn/react-virtualized)
- [react-window](https://github.com/bvaughn/react-window) 更轻量的 react-virtualized, 同出一个作者
- [更多](https://github.com/bvaughn/react-virtualized#friends)

扩展：

- [Creating more efficient React views with windowing](https://bvaughn.github.io/forward-js-2017/#/0/0)
- [Rendering large lists with react-window](https://addyosmani.com/blog/react-window/)

<br/>

### 3️⃣ 惰性渲染

惰性渲染的初衷本质上和虚表一样，也就是说我们只在必要时才去渲染对应的节点。

举个典型的例子，我们常用 Tab 组件，我们没有必要一开始就将所有 Tab 的 panel 都渲染出来，而是等到该 Tab 被激活时才去惰性渲染。

还有很多场景会用到惰性渲染，例如模态弹窗，下拉列表，折叠组件等等。这里就不举具体的代码例子了，留给读者去思考.

<br/>
<br/>

## 避免重新渲染

减少不必要的重新渲染也是 React 组件性能优化的重要方向. 为了避免不必要的组件渲染需要在做到两点:

1. 保证组件纯粹性。即控制组件的副作用，如果组件有副作用则无法安全的避免重新渲染
2. 通过`shouldComponentUpdate`生命周期函数来比对 state 和 props, 确定是否要重新渲染。对于函数组件可以使用`React.memo`包装

<br/>

另外这些措施也可以帮助你更容易地优化组件重新渲染:

<br/>

### **1️⃣ 简化 props**

① 如果一个组件的 props 太复杂一般意味着这个组件已经违背了‘单一职责’，首先应该尝试对组件进行拆解。② 另外复杂的 props 也会变得难以维护, 比如会影响`shallowCompare`效率, 还会让组件的变动变得难以预测和调试.

下面是一个典型的例子, 为了判断列表当前的激活状态，这里传入了一个当前激活的 id:

  <center>
    <img src="/images/09/list.png" width="500" />
  </center>

这是一个非常糟糕的设计，一旦激活 id 变动，所有列表项都会重新刷新. 更好的解决办法是使用类似`actived`这样的布尔值 prop. 状态值现在只有两种情况，也就是说激活 id 的变动，最多只有两个组件需要重新渲染.

简化后的 props 更容易理解, 且可以提供组件缓存的命中率.

  <br/>

### 2️⃣**不变的事件处理器**

①**避免使用箭头函数形式的事件处理器**, 例如:

```jsx
<ComplexComponent onClick={evt => onClick(evt.id)} otherProps={values} />
```

比如 ComplexComponent 是一个复杂的 PureComponent, 这里使用箭头函数，每次渲染时都会创建一个新的事件处理器，这会导致 ComplexComponent 始终会被重新渲染.

  <br/>

② 即使现在使用`hooks`，我依然会**使用`useCallback`来包装事件处理器**，尽量给下级组件暴露一个静态的函数:

```jsx
const handleClick = useCallback(() => {
  /**/
}, []);

return <ComplexComponent onClick={handleClick} otherProps={values} />;
```

但是如果`useCallback`依赖于很多状态，你的`useCallback`可能会变成这样:

```jsx
const handleClick = useCallback(() => {
  /*...*/
}, [foo, bar, baz, bazz, bazzzz]);
```

这种写法实在让人难以接受，这时候谁还管什么函数式非函数式的。我是这样处理的:

```jsx
function useRefProps<T>(props: T) {
  const ref = useRef < T > props;
  // 每次渲染更新props
  useEffect(() => {
    ref.current = props;
  });
}

function MyComp(props) {
  const propsRef = useRefProps(props);

  // 现在handleClick是始终不变的
  const handleClick = useCallback(() => {
    const { foo, bar, baz, bazz, bazzzz } = propsRef.current;
    // do something
  }, []);
}
```

③**更方便事件处理器静态化的 Event Props**. 有时候我们会被逼的不得不使用箭头函数来作为事件处理器：

```jsx
<List>
  {list.map(i => (
    <Item key={i.id} onClick={() => handleDelete(i.id)} value={i.value} />
  ))}
</List>
```

上面的 onClick 是一个糟糕的实现，它没有携带任何信息来标识事件来源，所以这里只能使用闭包形式，更好的设计可能是这样的:

```js
// onClick传递事件来源信息
const handleDelete = useCallback((id: string) => {
  /*删除操作*/
}, []);

return (
  <List>
    {list.map(i => (
      <Item key={i.id} id={i.id} onClick={handleDelete} value={i.value} />
    ))}
  </List>
);
```

如果是第三方组件或者 DOM 组件呢? 实在不行，看能不能传递`data-*`属性:

```js
const handleDelete = useCallback(event => {
  const id = event.dataset.id;
  /*删除操作*/
}, []);

return (
  <ul>
    {list.map(i => (
      <li key={i.id} data-id={i.id} onClick={handleDelete} value={i.value} />
    ))}
  </ul>
);
```

  <br/>

### 3️⃣**不可变数据**

不可变数据可以让状态变得可预测，也让 shouldComponentUpdate '浅比较'变得更可靠和高效. 笔者在[React 组件设计实践总结 04 - 组件的思维](https://juejin.im/post/5cdc2f54e51d453b0c35930d#heading-8)介绍过不可变数据，有兴趣读者可以看看.

### 4️⃣**简化 state**

**不是所有状态都应该放在组件的 state 中**. 例如缓存数据。按照我的原则是：如果需要组件响应它的变动, 或者需要渲染到视图中的数据才应该放到 state 中。这样可以避免不必要的数据变动导致组件重新渲染.

### 5️⃣**使用[recompose](https://github.com/acdlite/recompose) 精细化比对**.

尽管 hooks 出来后，recompose 宣称不再更新了，但还是不影响我们使用 recompose 来控制`shouldComponentUpdate`方法, 它提供了以下方法来精细控制应该比较哪些 props:

```ts
 /* 相当于React.memo */
 pure()
 /* 自定义比较 */
 shouldUpdate(test: (props: Object, nextProps: Object) => boolean): HigherOrderComponent
 /* 只比较指定key */
 onlyUpdateForKeys( propKeys: Array<string>): HigherOrderComponent
```

可能还不能满足复杂的需求，你可以再扩展一下，比如`omitUpdateForKeys`忽略比对某些 key.

<br/>
<br/>

## 精细化渲染

所有精细化渲染指的是**只有一个数据来源导致组件重新渲染**, 比如说 A 只依赖于 a 数据，那么只有在 a 数据变动时才渲染 A。

Vue 和 Mobx 宣称自己性能好的一部分原因是它们的'响应式系统', **它允许我们定义一些‘响应式数据’，当这些响应数据变动时，依赖这些响应式数据视图就会重新渲染**. 来看看 Vue 官方是如何描述的:

<center>
  <img src="/images/09/vue-compare.png" />
</center>

### 1️⃣ 响应式数据的精细化渲染

**大部分情况下，响应式数据可以实现视图精细化的渲染, 但它还是不能避免开发者写出低效的程序**. **本质上还是因为组件违背‘单一职责’**.

举个例子，现在有一个 MyComponent 组件，依赖于 A、B、C 三个数据源，各自独立渲染不同的子树。现在的问题是什么呢？只要 A、B、C 任意一个变动，那么 MyComponent 整个就会重新渲染:

<center>
  <img src="/images/09/my-component1.png" width="300" />
</center>

更好的做法是让组件的职责更单一，精细化地依赖响应式数据，或者说对响应式数据进行‘隔离’. 如下图, A、B、C 都抽取各自的组件中了，现在 A 变动只会渲染 A 组件本身，而不会影响父组件和 B、C 组件:

<center>
  <img src="/images/09/my-component1.png"  width="380"/>
</center>

举一个典型的例子，列表渲染:

```jsx
import React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

const initialList = [];
for (let i = 0; i < 10; i++) {
  initialList.push({ id: i, name: `name-${i}`, value: 0 });
}

const store = observable({
  list: initialList,
});

export const List = observer(() => {
  const list = store.list;
  console.log('List渲染');
  return (
    <div className="list-container">
      <ul>
        {list.map((i, idx) => (
          <div className="list-item" key={i.id}>
            {/* 假设这是一个复杂的组件 */}
            {console.log('render', i.id)}
            <span className="list-item-name">{i.name} </span>
            <span className="list-item-value">{i.value} </span>
            <button
              className="list-item-increment"
              onClick={() => {
                i.value++;
                console.log('递增');
              }}
            >
              递增
            </button>
            <button
              className="list-item-increment"
              onClick={() => {
                if (idx < list.length - 1) {
                  console.log('移位');
                  let t = list[idx];
                  list[idx] = list[idx + 1];
                  list[idx + 1] = t;
                }
              }}
            >
              下移
            </button>
          </div>
        ))}
      </ul>
    </div>
  );
});
```

上述的例子是存在性能问题的，单个 list-item 的递增和移位都会导致整个列表的重新渲染:

<center>
  <img src="/images/09/list-demo.png"  width="380"/>
</center>

原因大概能猜出来吧? 对于 Vue 或者 Mobx 来说，**一个组件的渲染函数就是一个依赖收集的上下文**。上面 List 组件渲染函数内访问了所有的列表项，那么 Vue 或 Mobx 就会认为你这个组件依赖于所有的列表项，这样就导致，只要任意一个列表项的属性值变动就会重新渲染整个 List 组件。

解决办法也很简单，就是隔离抽取到单一职责的组件中。**对于 Vue 或 Mobx 来说，越细粒度的组件，可以收获更高的性能优化效果**:

```jsx
export const ListItem = observer(props => {
  const { item, onShiftDown } = props;
  return (
    <div className="list-item">
      {console.log('render', item.id)}
      {/* 假设这是一个复杂的组件 */}
      <span className="list-item-name">{item.name} </span>
      <span className="list-item-value">{item.value} </span>
      <button
        className="list-item-increment"
        onClick={() => {
          item.value++;
          console.log('递增');
        }}
      >
        递增
      </button>
      <button className="list-item-increment" onClick={() => onShiftDown(item)}>
        下移
      </button>
    </div>
  );
});

export const List = observer(() => {
  const list = store.list;
  const handleShiftDown = useCallback(item => {
    const idx = list.findIndex(i => i.id === item.id);
    if (idx !== -1 && idx < list.length - 1) {
      console.log('移位');
      let t = list[idx];
      list[idx] = list[idx + 1];
      list[idx + 1] = t;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  console.log('List 渲染');

  return (
    <div className="list-container">
      <ul>
        {list.map((i, idx) => (
          <ListItem key={i.id} item={i} onShiftDown={handleShiftDown} />
        ))}
      </ul>
    </div>
  );
});
```

效果很明显, list-item 递增只会重新渲染本身; 而移位只会重新渲染 List， 因为列表项没有变动, 所以下级 list-item 也不需要重新渲染:

<center>
  <img src="/images/09/list-demo2.png"  width="380"/>
</center>

### 2️⃣ 不要滥用 Context

笔者也看过不少滥用 Context API 的例子。说到底还是没有处理好‘状态的作用域问题’.

首先要理解 Context API 的更新特点，**它是可以穿透`React.memo`或者`shouldComponentUpdate`的比对的，也就是说，一旦 Context 的 Value 变动，所有依赖该 Context 的组件会全部 forceUpdate**.

**这个和 Mobx 和 Vue 的响应式系统不同，Context API 并不能细粒度地检测哪些组件依赖哪些状态，所以说上节提到的‘精细化渲染’组件模式，在 Context 这里就成为了‘反模式’**. 所以说使用 Context API 要遵循一下原则:

<br/>

- **明确状态作用域, Context 只放置必要的，关键的，被大多数组件所共享的状态**。比较典型的是鉴权状态

  举一个简单的例子:

  <center>
    <img src="/images/09/use-context1.png" width="400"/>
  </center>

  <center>
    <img src="/images/09/use-context2.png" width="650"/>
  </center>

- **粗粒度地订阅 Context**

  如下图. 细粒度的 Context 订阅会导致不必要的重新渲染, 所以这里推荐粗粒度的订阅，比如在父级订阅 Context，然后再通过 props 传递给下级。

  <center>
    <img src="/images/09/context-vs-props.png" width="600"/>
  </center>

<br/>

另外程墨 Morgan 在[避免 React Context 导致的重复渲染](https://zhuanlan.zhihu.com/p/50336226)一文中也提到 ContextAPI 的一个陷阱:

```jsx
<Context.Provider
  value={{ theme: this.state.theme, switchTheme: this.switchTheme }}
>
  <div className="App">
    <Header />
    <Content />
  </div>
</Context.Provider>
```

上面的组件会在 state 变化时重新渲染整个组件树，至于为什么留给读者去思考。所以我们一般都不会裸露地使用 Context.Provider, 而是封装为独立的 Provider 组件:

```jsx
export function ThemeProvider(props) {
  const [theme, switchTheme] = useState(redTheme);
  return (
    <Context.Provider value={{ theme, switchTheme }}>
      {props.children}
    </Context.Provider>
  );
}

// 顺便暴露useTheme, 让外部必须直接使用Context
export function useTheme() {
  return useContext(Context)
}
```

现在theme变动就不会重新渲染整个组件树，因为props.children由外部传递进来，并没有发生变动。

## 扩展

利用好 React 性能分析工具
react freeze
