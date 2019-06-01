```js
// 不带括号的函数调用将被识别为标签模板字面量
const Button = styled.button`
  background-color: papayawhip;
  border-radius: 3px;
  color: palevioletred;
`;
```

```js
function tag(strs, ...itp) {
  console.log(strs, itp);
}

tag`1${2}3${4}`; // -> [ '1', '3', '' ] [2, 4]
console.log`1${2}3${4}`; // -> ['1', '3', ''] 2 4
```

```html
<!DOCTYPE html>
<html lang="en">
  <title>htm Demo</title>
  <script type="module">
    import {
      html,
      Component,
      render,
    } from 'https://unpkg.com/htm/preact/standalone.mjs';

    class App extends Component {
      addTodo() {
        const { todos = [] } = this.state;
        this.setState({ todos: todos.concat(`Item ${todos.length}`) });
      }
      render({ page }, { todos = [] }) {
        return html`
          <div class="app">
            <${Header} name="ToDo's (${page})" />
            <ul>
              ${todos.map(
                todo => html`
                  <li>${todo}</li>
                `,
              )}
            </ul>
            <button onClick=${() => this.addTodo()}>Add Todo</button>
            <${Footer}>footer content here<//>
          </div>
        `;
      }
    }

    const Header = ({ name }) =>
      html`
        <h1>${name} List</h1>
      `;

    const Footer = props =>
      html`
        <footer ...${props} />
      `;

    render(
      html`
        <${App} page="All" />
      `,
      document.body,
    );
  </script>
</html>
```

```jsx
test.each`
  a    | b    | expected
  ${1} | ${1} | ${2}
  ${1} | ${2} | ${3}
  ${2} | ${1} | ${3}
`('returns $expected when $a is added $b', ({ a, b, expected }) => {
  expect(a + b).toBe(expected);
});
```

```jsx
// 普通字符串
const a = `Foo ${() => console.log('bar')}`; // -> Foo () => console.log('bar')

// 生成组件，根据组件props动态生成样式表
const Button = styled.button`
  // 传递一个函数, 来动态生成模板
  font-size: ${props => (props.primary ? '2em' : '1em')};
`;
```

```js
// 文件位于 src/constructors/styled.js
// 这里忽略掉styled.div这些简写形式, 它等价于styled('div')
// 简化一下，styled的实现大概为:
const styled = (tag: Target) => (...args) =>
  createStyledComponent(tag, {}, css(...args));
```

```js
export default function flatten(chunk: any, executionContext: ?Object): any {
  // 💡递归处理嵌套的css
  if (Array.isArray(chunk)) {
    const ruleSet = [];
    for (let i = 0, len = chunk.length, result; i < len; i += 1) {
      result = flatten(chunk[i], executionContext);
      if (result === null) continue;
      else if (Array.isArray(result)) ruleSet.push(...result);
      else ruleSet.push(result);
    }
    return ruleSet;
  }

  if (isFalsish(chunk)) {
    // 💡 忽略一些空值
    return null;
  }

  if (isStyledComponent(chunk)) {
    // 💡 内嵌 StyleComponent 组件，转换为类名
    return `.${chunk.styledComponentId}`;
  }

  if (isFunction(chunk)) {
    // 💡 第二步，提供了执行上下文，执行函数
    if (isStatelessFunction(chunk) && executionContext) {
      const result = chunk(executionContext);
      return flatten(result, executionContext); // 递归处理函数返回结果
    } else return chunk;
  }
  // ...

  return chunk.toString();
}
```

```jsx
// 源码位于src/model/StyleComponnent.js
// 💡高阶组件，将应用到target.
export default function createStyledComponent(
  target: Target,
  options: Object,
  rules: RuleSet,
) {
  const isTargetStyledComp = isStyledComponent(target);
  const isClass = !isTag(target);

  const {
    displayName = generateDisplayName(target),
    // 💡生成唯一的组件id：根据displayName和一个递增的数字来计算hash. 算法是Murmurhash
    componentId = generateId(
      ComponentStyle,
      options.displayName,
      options.parentComponentId,
    ),
    ParentComponent = StyledComponent,
  } = options;
  // ...

  // 💡ComponentStyle 用于维护组件的css函数生成的rules，负责生成类名和注入样式表到DOM中
  const componentStyle = new ComponentStyle(
    // 💡实现样式扩展. 例如styled(AnotherStyledComponent), 原理很简单就是把css rules合并起来
    isTargetStyledComp ? target.componentStyle.rules.concat(rules) : rules,
    finalAttrs,
    styledComponentId,
  );

  // 💡使用React forwardRef转发ref
  let WrappedStyledComponent;
  const forwardRef = (props, ref) => (
    // 将componentStyle和target等信息通过forwardedComponent注入
    // ParentComponent 为StyledComponent组件
    <ParentComponent
      {...props}
      forwardedComponent={WrappedStyledComponent}
      forwardedRef={ref}
    />
  );

  // 💡将各种信息静态化.
  // 将这些信息以静态属性的形式保存，方便对StyledComponent组件进行识别
  WrappedStyledComponent = React.forwardRef(forwardRef);
  WrappedStyledComponent.displayName = displayName;
  WrappedStyledComponent.componentStyle = componentStyle;
  WrappedStyledComponent.styledComponentId = styledComponentId;
  WrappedStyledComponent.target = isTargetStyledComp ? target.target : target;
  WrappedStyledComponent.toString = () =>
    `.${WrappedStyledComponent.styledComponentId}`;

  // 💡提升静态属性。比如一些组件的子组件，例如Select.Option
  // 高阶组件封装后并用丢失这些信息. 主要使用hoist-non-react-statics库实现
  if (isClass) {
    hoist(WrappedStyledComponent, target, {
      attrs: true,
      componentStyle: true,
      displayName: true,
      styledComponentId: true,
      target: true,
      // ... 所有Styled component的属性不提升
    });
  }

  return WrappedStyledComponent;
}
```

```jsx
class StyledComponent extends Component<*> {
  // ...
  renderOuter() {
    // 💡 一个性能优化点，静态的样式不需要监听theme变动
    // 通过检查rule set中是否包含函数来判断是否是静态的
    if (this.props.forwardedComponent.componentStyle.isStatic)
      return this.renderInner();
    return <ThemeConsumer>{this.renderInner}</ThemeConsumer>;
  }

  renderInner(theme?: Theme) {
    // ...
    // 💡生成classname, generateAndInjectStyles这是关键
    const generatedClassName = this.generateAndInjectStyles(
      determineTheme(this.props, theme, defaultProps),
      this.props,
    );

    // ...
    const propsForElement = {};
    const computedProps = { ...this.attrs, ...this.props };
    // ... 💡props 处理
    for (key in computedProps) {
      // 💡不要将非html属性传递给html元素
      if (!isTag(target) || validAttr(key)) {
        propsForElement[key] = computedProps[key];
      }
    }
    propsForElement.ref = computedProps.forwardedRef;
    propsForElement.style = { ...this.attrs.style, ...this.props.style };

    // 合并className
    propsForElement.className = Array.prototype
      .concat(
        foldedComponentIds, // 被扩展的组件id，例如styled(Comp), 这里就是Comp的组件id
        this.props.className,
        styledComponentId, // 组件id，不关联样式，主要用于调试(通过插件可以集成组件名)
        this.attrs.className,
        generatedClassName, // 已生成的类型, 关联styled-component的样式
      )
      .filter(Boolean)
      .join(' ');

    return createElement(target, propsForElement);
  }

  // 💡注入样式并生成类名
  generateAndInjectStyles(theme: any, props: any) {
    // ...
    const className = componentStyle.generateAndInjectStyles(
      // 💡 构建执行上下文, context包含props，theme和计算后的attr对象
      this.buildExecutionContext(theme, props, attrs),
      this.styleSheet,
    );
    return className;
  }
}
```

```js
// 💡StyleSheet用于维护已生成的样式表, 负责注入到DOM
export default class ComponentStyle {
  generateAndInjectStyles(executionContext: Object, styleSheet: StyleSheet) {
    const { isStatic, componentId, lastClassName } = this;
    // 💡静态的样式不需要重复生成和注入
    if (
      isStatic &&
      typeof lastClassName === 'string' &&
      styleSheet.hasNameForId(componentId, lastClassName)
    ) {
      return lastClassName;
    }

    // 💡 ok现在拿到实际执行的上下文了，可以将👆css函数生成的ruleset进一步扁平化，即执行所有内嵌的函数,
    // 最后得到一个纯字符串数组
    const flatCSS = flatten(this.rules, executionContext, styleSheet);
    // 💡计算散列值作为类名
    const name = hasher(this.componentId + flatCSS.join(''));
    // 💡注入到样式表中
    if (!styleSheet.hasNameForId(componentId, name)) {
      // 💡到了关键一步，将纯字符串数组连接起来并去除注释，转换为正式的样式规则,
      // 这里使用stylis作为CSS的预处理器
      // 具体代码位于src/stringifyRules.js
      styleSheet.inject(
        this.componentId,
        stringifyRules(flatCSS, `.${name}`, undefined, componentId),
        name,
      );
    }

    this.lastClassName = name;
    return name;
  }
}
```

```jsx
export default class StyleSheet {
  // 💡StyleSheet一般是一个单例
  static get master(): StyleSheet {
    return master || (master = new StyleSheet().rehydrate());
  }

  // 💡inject注入样式规则. id为组件id，name为类名
  inject(id: string, cssRules: string[], name?: string) {
    // 💡获取插入的tag
    // tag是个对象, 提供了insertRules, removeRules, hasNameForId等方法, 负责最终的样式DOM操作
    const tag = this.getTagForId(id);
    tag.insertRules(id, cssRules, name);
  }

  // 💡获取和创建tag
  getTagForId(id: string): Tag<any> {
    // 💡复用缓存的tag
    const prev = this.tagMap[id];
    if (prev !== undefined && !prev.sealed) {
      return prev;
    }

    let tag = this.tags[this.tags.length - 1];
    // 💡 每个tag 可以容纳MAX_SIZE个组件
    this.capacity -= 1;
    if (this.capacity === 0) {
      // 创建新的tag
      this.capacity = MAX_SIZE;
      tag = makeTag();
      this.tags.push(tag);
    }
    return (this.tagMap[id] = tag);
  }
}
```

```js
const head = document.head;
function makeTag() {
  const el = document.createElement('style');
  head.appendChild(el);
  const names = {}; // 缓存已经添加的样式
  const markers = {}; // 缓存已创建文本标签

  // 💡创建文本标签
  const insertMarker = id => {
    const prev = markers[id];
    if (prev !== undefined) return prev;

    markers[id] = document.createTextNode(`\n/* sc-component-id: ${id} */\n`);
    names[id] = {};
    el.appendChild(markers[id]);

    return markers[id];
  };

  // 💡插入样式
  const insertRules = (id, cssRules, name) => {
    const marker = insertMarker(id);
    const cssRulesSize = cssRules.length;
    for (let i = 0; i < cssRulesSize; i += 1) {
      const separator = i === cssRulesSize - 1 ? '' : ' ';
      marker.appendData(`${cssRules[i]}${separator}`);
    }

    // 记录已插入样式
    names[id][name] = true;
  };

  //💡判断是否已经插入
  const hasNameForId = (id: string, name: string) =>
    names[id] !== undefined && names[id][name];

  return { insertRules, hasNameForId };
}
```

```js
const Foo = styled.div`
  color: red;
`;
```
