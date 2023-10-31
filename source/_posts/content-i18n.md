---
title: '前端国际化：一种巧妙的内容多语言实现思路'
date: 2023/10/31
categories: 前端
---

![cover](/images/content-i18n/Untitled.png)

除了程序本身支持多语言，`内容多语言`也是国际化的重要部分。

本文就简单介绍一种改造现有程序以支持内容多语言的思路。我们希望对于前/后端都是最小改造，尽量不侵入已有的业务代码和底层存储、向下兼容，不影响现有的业务。

<br>

# 内容输入

说一说我的思路

![input](/images/content-i18n/Untitled%201.png)

在未改造之前，我们的`输入框`输入什么就会在数据库里面保存什么。

现在运营需要对该字段内容扩展其他语言的支持，他可以点击`切换语言悬浮窗`

![i18n-input](/images/content-i18n/Untitled%202.png)

当这个字段有了其他语言的内容后， 前端会对该字段存储内容进行**升级**，保存的结构大概如下：

```
__i18n_what_ever__(Hello, 1b9d6bcd-bbfd)
     ^                
     一个特殊的前缀
                    ^
                    原本的内容
                                 ^
                                 UUID
```

- `UUID`: 全局唯一的 ID, 可以前端生成(可以使用 uuid 库)， 或者向后端请求生成。 这个 唯一 ID 是一个哈希表的 key,  用来关联存储该字段多语言内容。
    
    ![Untitled](/images/content-i18n/Untitled%203.png)
    
- `__i18n_what_ever__()` 这个命名没有实际的意义，只是为了避免冲突，方便正则检索和替换。下文会讲到
- Hello 是默认语言的内容。

<br>
<br>
<br>

整个交互的过程如下：

![交互过程](/images/content-i18n/Untitled%204.png)

这样做的好处是可以维持原有的数据库搜索功能，对字段的大小影响也不大。后端基本不需要改造。

生成 UUID、存储多语言内容这个过程，是不是有点像文件上传？

<br>
<br>

---

<br>
<br>

至于前端的实现呢，可以编写一个`包装组件`，包装已有的 Input、Textarea、富文本组件。

![components](/images/content-i18n/Untitled%205.png)

代码示例：

```jsx
<I18nSwitcher target={Input} />
// 或者

<I18nSwitcher>
  <Input placeholder="Enter some thing" />
</I18nSwitcher>
```

`I18nSwitcher` `包装组件`会拦截`被包装控件`的  `value`/`onChange` Props, 控制它的回显和输入。

为了避免产生不必要的垃圾数据，比如你新建操作，后面又取消了。我们可以再设计一个 `I18nSwictherProvider`  组件，负责缓存子孙`待保存`的状态，最后在保存时刻统一提交。伪代码示例：

```jsx
const {Provider, flush} = useI18nSwitcherProvider()

const handleSave = async () => {
  await validate() // 表单验证
  await flush()    // 保存缓存状态
  await saveForm() // 保存表单
}

return (<Provider>
  <Form>...</Form>
</Provider>)

```

<br>
<br>
<br>
<br>

# 内容回显

内容回显则使用拦截器方案，可以在前端实现，也可以在后端实现。后端直出性能和体验都会好很多。整个过程如下：

![流程](/images/content-i18n/Untitled%206.png)

- 忽略机制。默认所有接口都会被拦截替换，但是我们前端在内容编辑时需要进行回显和切换，因此部分接口前端需要显式标记为**跳过替换，**比如在 API 请求的 URL 中添加特殊的查询字符串、或者添加特殊的 Header 来实现 。
- 源语言：即默认语言。因为 `__i18n_what_ever__(Hello, 1b9d6bcd-bbfd)` 直接内联的就是默认语言的内容了，所以在替换时可以直接跳过查找的过程

<br>
<br>
<br>

[代码实现参考](https://github.com/wakeadmin/components/tree/master/packages/components/src/fat-i18n-content)