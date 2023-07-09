---
title: "Vue 开发的正确姿势：响应式编程思维"
date: 2023/7/9
categories: 前端
---


![Untitled](/images/vue-with-rx/Untitled.png)

写这篇文章的动机可以追溯到 3 年前， 我发现很多身边开发者并没有正确地使用 React Hooks, 所以我觉得应该把我的开发经验和思维整理下来。

尽管本文主要从 Vue 的角度出发，但是很多思维也可以用在 React Hooks 上。

从广义的的“[响应式编程(Reactive Programing)](https://en.wikipedia.org/wiki/Reactive_programming)” 上看，Vue、React、Rxjs 等框架都属于这个范畴。而狭义的响应式编程通常指的是 rxjs 这类 “面向数据[串流](https://zh.wikipedia.org/wiki/%E4%B8%B2%E6%B5%81)和变化传播的[声明式](https://zh.wikipedia.org/wiki/%E5%A3%B0%E6%98%8E%E5%BC%8F%E7%BC%96%E7%A8%8B)[编程范式](https://zh.wikipedia.org/wiki/%E7%BC%96%E7%A8%8B%E8%8C%83%E5%BC%8F)”

虽然 Vue 也是‘响应式编程’， 但是和 RxJS 是完全不一样的概念，至少RxJS 是有范式约束的，不管是编码上还是思维上面，我们都可以感受到它的强力约束，这和我们惯用的命令式编程差别很大。这也导致了它的学习门槛比较高。

为什么要牵扯到 RxJS 呢？因为它的思维对我们写好 Vue 代码很有帮助！

<br>
<br>

# 简述 RxJS

先祭上[徐飞的买房的例子](https://zhuanlan.zhihu.com/p/25383159)，感受一下 RxJS 的魅力：

```jsx
//           工资周期  ———>  工资
//                            ↓
// 房租周期  ———>  租金  ———>  收入  ———>  现金 
//                ↑           ↓ 
//             房子数量 <——— 新购房

// 挣钱是为了买房，买房是为了赚钱
const house$ = new Subject()
const houseCount$ = house$.scan((acc, num) => acc + num, 0).startWith(0)

// 工资始终不涨
const salary$ = Observable.interval(100).mapTo(2)
const rent$ = Observable.interval(3000)
  .withLatestFrom(houseCount$)
  .map(arr => arr[1] * 5)

// 一买了房，就没现金了……
const income$ = Observable.merge(salary$, rent$)
const cash$ = income$
  .scan((acc, num) => {
    const newSum = acc + num

    const newHouse = Math.floor(newSum / 100)
    if (newHouse > 0) {
      house$.next(newHouse)
    }

    return newSum % 100
  }, 0)

// houseCount$.subscribe(num => console.log(`houseCount: ${num}`))
```

<br>

如果用几个关键字来描述 RxJS 的话，我想应该是：

- 事件：观察者模式
- 序列：迭代器模式
- 流：管道模式

这几个模式我们分开去理解都没啥特别，比如 Vue 的 reactivity 数据就是观察者模式；JavaScript 的 for…of/generator 就是迭代器模式；数组的map/filter/reduce, shell 命令都符合管道模式。

RxJS  的牛逼之处就是把这三个模式优雅地组合起来了。它把事件抽象成为类似’数组’一样的序列，然后提供了丰富的操作符来变换这个序列，就像操作数组一样自然，最后通过管道将这些操作符组合起来实现复杂的功能变换。


<br>
<br>

# 为什么建议你去学习 rxjs？

至少它可以帮助你写好 Vue 代码。它可以帮你写出更简洁、结构更清晰、低耦合、更容易测试的代码，这些代码更能体现原本的交互逻辑或业务流程。

相信我，尝试换个思路，可能原本复杂的实现，会变得更加简单。

<br>

# RxJS 和 Vue Reactivity Data 有什么关联？

一些和 RxJS 相似的概念

- 响应式数据。我们用 ref 或reactive 创建的数据，可以等似于 RxJS 的 Observable。只不过响应式数据并不像 rxjs 有显式的事件发布和订阅过程，也不存在事件流(序列)。
    
    **我们可以认为Vue 数据的每次变更就相当于 RxJS 发出每次事件**。
    
- 衍生数据。我们会使用 computed 来衍生新的数据，等似于 RxJS 用操作符衍生出新的 Observable。**即 Vue 数据衍生数据，RxJS 事件衍生事件**
- 副作用。在 Vue 中， watch/watcheffects/render 相当于 RxJS 的 subscribe，RxJS 的数据流的终点通常也是副作用处理，比如将数据渲染到页面上。

<br>

RxJS 的很多东西并不能直接套用过来，但思想和原则是可以复用的。

其中一个重要的思想就是：管道变换。这是一种思维方式的转变，在以往的编程设计中，我们更多操心的是类、模块、数据结构和算法。而管道变换我们会把程序视作从输入到输出的一个变换去构思:

```bash
# “列出目录树中最长的五个文”
find . -type f | xargs wc -l | sort -n | tail -5
```

不要把数据看作是遍布整个系统的小数据池，而要把数据看作是一条浩浩荡荡的河流。

另一方面，编写 RxJS 代码一些原则，对我们编写 Vue 代码也大有裨益：

- 避免副作用。RxJS 的操作符应该是没有副作用的函数，只关注输入的数据，然后对数据进行变换，传递给下一个。
- 避免外部状态/缓存状态。外部状态也是副作用的一种，单独拎出来讲，是因为我们在 Vue 中创建外部状态太容易了，而 RxJS 则相对来说麻烦一些，毕竟外部状态和事件流显得格格不入。
    
    在 RxJS 中管道是自包含的， 所有的状态从一个操作器流向下一个操作器，而不需要外部变量：
    
    ```bash
    Observable.from([1, 2, 3, 4, 5, 6, 7, 8])
      .filter(val => val % 2)
      .map(val => val * 10);
    ```
    

<br>
<br>

# 看看你代码中的坏味道

看看你的 Vue 代码有没有这些现象，如果存在这些坏味道，说明你并没有正确使用 Vue 的 Reactivity API。

- 创建了大量的缓存状态。比如 sum，avg，temp…
- 使用了很多 `watch` / `watchEffect`…
- 冗长的 `setup` 方法或者组件代码
- 状态被随意修改，修改不属于管辖范围内的状态
- …

<br>
<br>

# 实践

## 分页

先从简单的场景开始: 分页请求。

❌ 常规的做法：

```jsx
const query = reactive({}) // 查询参数
const pagination = reactive({pageNo: 1, pageSize: 10})
const total = ref(0)
const list = ref([])
const loading = ref(false)
const error = ref()

watch([query, pagination], async () => {
  try {
    error.value = undefined
    loading.value = true
    const data = await request(`/something?${qs({...query, ...pagination})}`)
    total.value = data.total
    list.value = data.list
  } catch (err){
    error.value = err
  } finally {
    loading.value = false
  }
}, {immediate: true})
```

✅ 推荐做法：

```jsx
const query = reactive({}) // 查询参数
const pagination = reactive({pageNo: 1, pageSize: 10})

// data 包含了 list、loading、error、total 等信息
const data = useRequest(() => `/something?${qs({...query, ...pagination})}`)
```

- 自然地表达 query/pagination → data 的数据流。useRequest 更像 computed 的语义，从一个数据衍生出新的数据，不管它是同步的还是异步的。
    
    而使用 watch 会中断数据的流动，并且我们需要创建冗余缓存状态，代码看起来会比较混乱。想象一下复杂的页面，我们可能会有很多复杂、联动的异步请求，情况就会慢慢失控。
    
- `useRequest` 是啥？它封装了网络请求， useRequest 可以基于 [swrv](https://docs-swrv.netlify.app/guide.html)(swr 在 Vue 下的实现, 非官方)、或者VueUse 里面的 [computedAsync](https://vueuse.org/core/computedAsync/)、[useFetch](https://vueuse.org/core/useFetch/) 来封装。
    
    useRequest 类似于 RxJS 的 switchMap，当新的发起新的请求时，应该将旧的请求抛弃。
    
    笔者推荐使用 swr 这类库去处理网络请求，相比直接用 watch, 这类库支持数据缓存、Stale-while-revalidate 更新、还有并发竞态的处理等等。
    
<br>
<br>

## 实时搜索

第二个例子也比较简单，用户输入文本，我们debounce 发起数据请求

⚠️ 常规的实现：

```jsx
const query = ref('')

// 法一：在事件处理器加 debounce
// 如果这么实现，双向绑定到表单可能有卡顿问题
const handleQueryChange = debounce((evt) => {
  query.value = evt.target.value
}, 800)

const data = ref()

watch(query, async (q) => {
  const res = await fetchData(q)
  // FIXME: 需要处理竞态问题
  data.value = res
})

// ---------------

// 法二，在 watch 回调或者 fetchData 加上 debounce
const handleQueryChange = (evt) => {
  query.value = evt.target.value
}

watch(query, debounce(async (q) => {
  const res = await fetchData(q)
  data.value = res
}, 800))
```

RxJS  实现:

```jsx
const searchInput$ = fromEvent(searchInput, 'input').pipe(
  // 使用 debounceTime 进行防抖处理
  debounceTime(800),
  // 使用 map 将事件转换为输入框的值
  map(event => event.target.value),
  // 使用 distinctUntilChanged 进行去重处理
  distinctUntilChanged(),
  // 使用 switchMap 进行请求并转换为列表数据
  switchMap(keyword => from(searchList(keyword)))
)
```

我们使用 Vue 也可以表达类似的流程：

```jsx
const query = ref('')
const debouncedQuery = refDebounced(input, 1000)

const data = useRequest(() => `/something?${qs({query: query.value})}`)
```

refDebounce 来源于 VueUse，可以 “Debounce” 指定输入 ref 值的变动。

<br>
<br>

## 定时刷新

假设我们要在上面的分页基础上实现定时轮询的功能：

```jsx
const query = reactive({}) // 查询参数
const tick = useInterval(5000)
const pagination = reactive({pageNo: 1, pageSize: 10})

// data 包含了 list、loading、error、total 等信息
const data = useRequest(() => `/something?${qs({...query, ...pagination, _t: tick.value})}`)
```

我们看到上面的流程很自然。

现在加大难度，如果要在特定条件下终止呢？

```jsx
const query = reactive({}) // 查询参数

// 默认关闭
const {counter: tick, pause, resume} = useInterval(5000, {controls: true, immediate: false})
const pagination = reactive({pageNo: 1, pageSize: 10})

// data 包含了 list、loading、error、total 等信息
const data = useRequest(() => `/something?${qs({...query, ...pagination, _t: tick.value})}`)

// 是否轮询
const shouldPoll = computed(() => {
  return data.data?.some(i => i.expired > Date.now())
})

// 按条件开启轮训
watch(shoudPoll, (p) => p ? resume() : pause())
```

如果用 RxJS 来实现的话，代码大概如下：

```jsx

const interval$ = interval(5000);

const poll$ = interval$.pipe(
  // 查询
  switchMap(() => from(fetchData())),
  share()
);

const stop$ = poll$.pipe(
  // 终止轮询条件
  filter((i) => {
    return i.every(i => i.expired <= Date.now())
  })
);

// 将 poll$ 和 stop$ 组合在一起
poll$
  .pipe(
    // 使用 takeUntil 在 stop$ 发送事件后停止轮询
    takeUntil(stop$)
  )
  .subscribe((i) => {
    console.log(i);
  });
```

因为 RxJS 的 Observable 是惰性的，只有被 subscribe 时才会开始执行，同理停止订阅就会中断执行。

中断执行后，如果要重新发起请求，重新订阅就好了。有点异曲同工之妙吧

<br>
<br>

## 省市区选择器

再来看一个稍微复杂一点的例子，常见的省市区选择器，这是一个典型的数据联动的场景。

我们先来看一个反例吧，我们的选择器需要先选择国家或地区，然后根据它来确定行政区域的划分，接着渲染各级行政区域选择器：

```tsx
export default defineComponent({
  props: {
    modelValue: {
      type: Array as () => number[],
      default: () => [],
    },
    onChange: {
      type: Function,
      default: () => {},
    },
  },

  setup(props, { emit }) {
    const isEchoingData = ref(false);
    const regionList = ref<RegionInfoDTO[][]>([]);
    const regionUrl = ref('');
    const queryParams = ref({} as IQueryParams);

    const selectedRegion = computed<number[]>({
      get: () => props.modelValue,
      set: value => emit('update:modelValue', [...value]),
    });

    const { data: countryList } = useRequest<CountryInfoDTO>(
      () => `请求国家列表`
    );

    // 请求区域列表
    const { data: regionItems } = useRequest<RegionInfoDTO>(() => regionUrl.value);

    watch(regionItems, () => {
      regionList.value[queryParams.value.level] = regionItems.value?.data!;
    });

    const countryOptions = computed(() => {
      return countryList.value?.data.map(i => {
        return {
          label: i.name,
          value: i.id,
        };
      });
    });

    watch(queryParams, async newValue => {
      if (!Object.keys(newValue).length) return;

      const query = `&countryId=${newValue.level ? '' : newValue.value}&parentId=${
        newValue.level ? newValue.value : ''
      }&level=${newValue.level + 1}`;
      regionUrl.value = `区域请求路径${query}`;
    });

    watch(
      props.modelValue,
      async (newValue, oldValue) => {
        const newLen = newValue.length;
        const oldLen = oldValue?.length ?? 0;

        if (newLen && newLen !== oldLen) {
          const index = 0;

          queryParams.value = { value: newValue[index], level: index };
          isEchoingData.value = true;
        }
      },
      { immediate: true }
    );

    watch(
      regionList,
      newVal => {
        const len = newVal.length;
        const selectedLen = selectedRegion.value.length;

        if (isEchoingData.value && selectedLen > len) {
          if (len === selectedLen - 1) return (isEchoingData.value = false);

          queryParams.value = { value: selectedRegion.value[len], level: len };
        }
      },
      { deep: true }
    );

    const onRegionChange = (value: number, level: number) => {
      selectedRegion.value.splice(level);
      regionList.value.splice(level);
      selectedRegion.value.push(value);

      const currentRegion = regionList.value[level - 1]?.find(region => region.id === value);

      if (!currentRegion?.isLeaf) {
        queryParams.value = { value, level };
      }

      props.onChange?.([...selectedRegion.value], [...selectedRegionNames.value]);
    };

    const currentRegionPlaceholder = (index: number) => {
      return `${selectedCountry.value?.regionLevelInfos[index]?.name ?? '区域'}`;
    };

    const selectedCountry = computed(() => {
      const selectedCountryId = selectedRegion.value[0];
      const selectedCountry = countryList.value?.data.find(country => country.id === selectedCountryId);

      return selectedCountry;
    });

    const selectedRegionNames = computed(() => {
      const names = [];

      if (selectedCountry.value) {
        names.push(selectedCountry.value.name);
      }

      selectedRegion.value.slice(1).forEach((id, index) => {
        const region = regionList.value[index]?.find(region => region.id === id);
        if (region) {
          names.push(region.name);
        }
      });

      return names;
    });

    return () => (
      <FatSpace>
        <ElSelect
          modelValue={selectedRegion.value[0]}
          placeholder="请选择国家"
          onChange={val => onRegionChange(val, 0)}
          filterable
        >
          {countryOptions.value?.map(country => (
            <ElOption key={country.value} label={country.label} value={country.value} />
          ))}
        </ElSelect>

        {regionList.value.map((regions, index) => (
          <ElSelect
            key={index}
            modelValue={selectedRegion.value[index + 1]}
            placeholder={`请选择${currentRegionPlaceholder(index)}`}
            onChange={val => onRegionChange(val, index + 1)}
            filterable
          >
            {regions.map(region => (
              <ElOption key={region.id} label={region.name} value={region.id} />
            ))}
          </ElSelect>
        ))}
      </FatSpace>
    );
  },
});
```

也就 150 行左右的代码，实现的是 `国家-国家各种区域` 的选择器，比如选择了中国就会有 `中国-省-市-区` 这样的分级。

读者也没必要读懂这些代码，我看到也头大，你只需要记住，这个充斥着我们上文提到的各种坏味道：过渡依赖 watch、数据流混乱…

![Untitled](/images/vue-with-rx/Untitled%201.png)

让我们回归到业务本身，我们为什么需要不恪守这样的联动关系去组织代码呢？

可以的，一个比较重要的技巧就是自顶而下地去分析流程/数据流变换的过程。

首先从国家开始，只有用户选择了指定国家之后，我们才能获取到区域的结构信息(是省/市/区, 还是州/城市，anyway):

```tsx
export const AreaSelect2 = defineComponent({
  props: {
    // 表单值是数组格式，每一项保存的是区域的 id
    modelValue: Array as PropType<number[]>,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // 🔴 获取国家列表
    const country = useCountryList();

    // 🔴 计算当前选中的国家，我们从这里拿到行政区域结构
    const currentCountry = computed(() => {
      return country.data.value?.data?.find(i => i.id === props.modelValue?.[0]);
    });

    const handleCountryChange = (value: number) => {
      if (value !== props.modelValue?.[0]) {
        // 🛑 国家变动后，重置掉后续的数据
        emit('update:modelValue', [value]);
      }
    };

    return () => {
      return (
        <div>
          <ElSelect
            modelValue={props.modelValue?.[0]}
            placeholder="请选择国家"
            onUpdate:modelValue={handleCountryChange}
            filterable
            fitInputWidth
            loading={country.isValidating.value}
          >
            {country.data.value?.data?.map(i => {
              return <ElOption key={i.id} label={i.name} value={i.id}></ElOption>;
            })}
          </ElSelect>
          {/* 此处暂时忽略 */}
        </div>
      );
    };
  },
});
```

- Composition API 的好处是，它让组合和封装变得非常便利。如上面的代码，我们将获取国家的相关逻辑封装成 useCountryList，代码变得更加简洁易读。
- 避免中间变量。恪守 v-model 单向数据流

<br>

---

<br>

接着我们根据选中的国家来渲染后续的区域联动。

这里提醒一下读者：“不要吝啬创建组件”

我在  [React组件设计实践总结04 - 组件的思维](https://juejin.cn/post/6844903844711759880#heading-2) 中讲过：

> 大部分情况下, 组件表示是一个 UI 对象. 其实组件不单单可以表示 UI, 也可以用来抽象业务对象, 有时候抽象为组件可以巧妙地解决一些问题
> 

组件这个设计实在太好用了，笔者觉得它体现的更重要的思想是分治，而不是复用。组件一些比较重要的特性是：

- 和函数一样，它是一个封闭的、自包含的单元。父组件不应该操心它，而应该让他自我组织。
- 组件有状态。这个是和函数不一样的地方
- 组件有生命周期。这就意味着组件可以自己管理和销毁自己的资源，不会泄露出去。
    
    这是组件和 Hooks 是有本质区别的！我们使用 Hooks 也可以实现一个自我组织的、封闭的、自包含的单元，但是它的生命周期不是它决定的，而是由使用它的宿主组件决定的
    

> 关于这块的详细阐述可以看笔者的[旧文章](https://juejin.cn/post/6844903844711759880#heading-2)。
> 

所以说，我们可以创建组件来封装区域选择的逻辑，将复杂度分流出去。或者说通过 props 将数据流往下传递给子组件… 

```diff
export const AreaSelect2 = defineComponent({
  // 省略
  setup(props, { emit }) {
    // 省略

    return () => {
      return (
        <div>
          <ElSelect
           // 省略
          >
            {country.data.value?.data?.map(i => {
              return <ElOption key={i.id} label={i.name} value={i.id}></ElOption>;
            })}
          </ElSelect>
     
+          {!!currentCountry.value &&
+            currentCountry.value?.regionLevelInfos?.map((i, index) => {
+              // 父区域 id
+              const parentValue = props.modelValue?.[index];
+              // 当前区域
+              const value = props.modelValue?.[index + 1];
+              // 父区域信息
+              const parentRegion: RegionLevelDTO =
+                index === 0
+                  ? { code: currentCountry.value?.code!, name: currentCountry.value?.name! }
+                  : currentCountry.value?.regionLevelInfos?.[index - 1]!;

+              const handleChange = (nextValue: number) => {
+                if (value === nextValue) {
+                  return;
+                }

+                assert(Array.isArray(props.modelValue), 'modelValue is required');
+                // 裁剪掉当前区域后面的区域数据
+                const clone = [...props.modelValue].slice(0, index + 2);
+                clone[index + 1] = nextValue;

+                emit('update:modelValue', clone);
+              };

+              return (
+                <Section
+                  index={index}
+                  parentValue={parentValue}
+                  modelValue={value}
+                  region={i}
+                  parentRegion={parentRegion}
+                  country={currentCountry.value!}
+                  onUpdate:modelValue={handleChange}
+                />
+              );
+            })}
        </div>
      );
    };
  },
});
```

<br>

继续分流, 看看 Section 组件的实现：

```tsx
const Section = defineComponent({
  name: 'AreaSelectSection',
  props: {
    /**
     * 当前索引
     */
    index: { type: Number, required: true },

    /**
     * 区域信息
     */
    region: { type: Object as PropType<RegionLevelDTO>, required: true },

    /**
     * 当前国家
     */
    country: { type: Object as PropType<CountryInfoDTO>, required: true },

    /**
     * 父级
     */
    parentRegion: { type: Object as PropType<RegionLevelDTO>, required: true },

    /**
     * 父级的值
     */
    parentValue: Number,

    /**
     * 当前值
     */
    modelValue: Number,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // 获取区域列表
    const region = useRegion(
      computed(() => {
        return {
          countryId: props.country.id,
          level: props.index + 1,
          parentId: props.parentValue,
        };
      })
    );

    const handleChange = (value: number) => {
      emit('update:modelValue', value);
    };

    return () => {
      return (
        <ElSelect
          modelValue={props.modelValue}
          placeholder={`请选择${props.region.name}`}
          filterable
          fitInputWidth
          disabled={!props.parentValue}
          onUpdate:modelValue={handleChange}
          loading={region.isValidating.value}
          class={s.select}
        >
          {region.data.value?.data?.map(i => {
            return <ElOption key={i.id} label={i.name} value={i.id}></ElOption>;
          })}
        </ElSelect>
      );
    };
  },
});
```

可见，Section 的实现也再简单不过了。到这里，我相信很多读者已经感受到“响应式”编程的魅力了吧

<br>
<br>
<br>

# 原则和建议

1. 优先使用 `computed`，警惕 `watch`/`watchEffect` 等 API 的使用。转换思维先从克制使用 watch 开始。
2. 适当使用 `readonly`, 禁止状态被坏人修改
3. 最小化状态。避免创建‘缓存’状态，让数据自然流动，不要阻断。
4. 自顶而下，将细节/副作用分流到 hooks 或子组件中，起一个好一点的名字， 让流程看起来更清晰
5. 将 watch 转换为 computed 的语义。外观上的差别是 watch 有 callback， 而 computed 是「管道」，会衍生新的数据。比如上面 useRequest 的例子
6. 推荐使用 VueUse
7. 封装 hooks， 让各种外部的状态或副作用优雅地集成进来
8. 单向数据流，对这个有两层理解
    - 表示是一种数据流动的方向，通常和 CQRS 模式配合，比如 Redux、Vuex，只能单向的修改和查询
    - 表示一种数据管辖的范围。 通常应用只有数据的拥有者才有权限变更。进一步地讲，我们应该以组件为边界，来限定数据的管辖范围。需要变更时，通过‘事件’ 来通知拥有者。比如 严格遵循 v-model 协议。
9. 使用响应式开发思维，构造单向的数据流
    - 尽量管道化的方式去设计你的程序
    - 声明式，不要命令式
    - 拆分组件或hooks来分治数据流
    - 组件之间 props 传递也属于数据流。

 10. 使用 ref/reactive → computed → watch → handler → render 这样的顺序组织代码

🌹本文完，你的点赞是我写作的最大动力，欢迎留言转发（备注原文作者和链接）。

<br>
<br>

# 扩展阅读

- [React组件设计实践总结04 - 组件的思维](https://juejin.cn/post/6844903844711759880#heading-4)
- [RxJS](https://rxjs.dev/)
- [Comparing reactivity models - React vs Vue vs Svelte vs MobX vs Solid vs Redux](https://dev.to/lloyds-digital/comparing-reactivity-models-react-vs-vue-vs-svelte-vs-mobx-vs-solid-29m8)
- [RxJS 入门指引和初步应用](https://zhuanlan.zhihu.com/p/25383159)