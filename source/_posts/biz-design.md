---
title: 'if 我是前端 Leader, 前端业务开发做不做设计？'
date: 2023/10/8
categories: 前端
---

[if 我是前端 Leader 系列](https://juejin.cn/column/7249626243124101181)已经好久没更新了，我这两三年都去哪了?

![Twitter](/images/biz-design/Untitled.png)

😂 有可能掉进了一个黑洞。不是 Byte Dance，现在国内大小公司都卷，整体行业的已经被带偏了，还有向其他行业蔓延的趋势… 真是好的不学

<br>

那我现在怎么又开始写文章了？

因为现在我不卷工作了，公司也开始的考勤打卡，我觉得挺好了，**一切按规矩办事**，到点就弹射下班。

工作只是生活的一部分而已，工作的目的本来就是为了生活过得更好不是吗？这才应该是正常的人生形态，你说是不是？ 2023 年了，梦也该醒了

<br>

![老贼](/images/biz-design/Untitled%201.png)

<br>

---

<br>

> **💥 另外，我这边也想挪坑了，Base 珠海、远程也可以，有坑位推荐的可以私信我，感激不尽**。

---

<br>
<br>

**回到正题，做业务前端开发要不要做设计呢？我觉得大部分情况不需要，简单的增删改查业务，没有必要浪费时间去做这些，只要在产品侧描述清楚就行了。**

如果业务比较复杂、涉及到多人分工和共识建立、而且项目预留的充裕的时间给开发者做预研和设计，那么做一下设计还是有必要的。

那怎么做呢？本文就介绍一下我在这方面的探索，希望能给读者提供一些借鉴。

<br>
<br>

# 0. **为什么需要设计？**

![一次做好](/images/biz-design/Untitled%202.png)

- 敏捷 DoD 有个设计环节，后端通常有设计和评审环节，这个阶段前端应该有什么产出？
- 前端专业性体现在哪里呢？
- 和 DDD 一样。 在开始开发之前，把设计工作做好，开发就是照葫芦画瓢，我们的工作更容易预测，没有惊喜。很多问题在 Code Review 阶段发现有可能已经晚了，何况我们 Code Review 还没做好？
- 设计不是一个人的事情，我们要利用集体智慧，把事情做好。 以后前端也会有一个技术评审会议。这是除 Code Review 之外，难得一次技术上的沟通和知识互换。
- 写完代码之后呢？文档呢？听说过文档驱动开发吗？设计阶段的产出就是我们的文档。

<br>
<br>
<br>

# 1. 画好业务流程图

设计的第一步是梳理业务。这个不是产品的责任吗？产品会提供 PRD、原型、用户故事等需求输入，但是下游的开发、测试还需要进一步消化，因为职责的不同，立场和关注点也是有差异的。

因此，笔者设计了一套适合前端的业务流程图绘制规范。`关注点`在于：

- 用户与 UI 的`交互流程`
- 页面或模块的`拆分`
- 页面或模块之间的`数据流`
- 以及页面或模块的`状态流转`。

<br>
<br>

## 1.1 图例和要点

![示例](/images/biz-design/Untitled%203.png)

**图例**：

<br>

![图例](/images/biz-design/Untitled%204.png)

<br>
<br>

**要点**：

- 流程图要表示业务流程的`闭环`，而不是前端的`局部交互`。
- 和传统业务流程图不太一样的是，我们的业务流程图也会关注`用户的交互流程`。
- 尽量使用`业务语言`，而不是`技术语言`。
- 使用泳道来表示业务环节由什么`容器`来承载。
- 梳理流程图时不要过度关注`技术实现细节`。

**通过流程图可以提供什么信息？**

- 熟悉业务规则，比如业务的边界条件、业务主体状态的流转规则、流程数据(通信规则)。
- 分析模块之间的依赖关系。
- 页面的状态(有限状态机)。

**无法提供什么信息？**

- 无法体现技术设计细节
- 无法体现视图的呈现细节

→ 这部分由概要设计来弥补

<br>
<br>
<br>

## 1.2 案例

> 统一使用 [draw.io](http://draw.io) 来绘制流程图。将流程图保存在项目根目录下的 docs 下，跟随代码一起存储和更新。

> 推荐 VSCode [draw.io](http://draw.io) 插件

<br>

### 案例 1： 营销拼团

![拼团.jpg](/images/biz-design/%E6%8B%BC%E5%9B%A2.jpg)

要点：

- 使用不同的泳道来表示页面
- 不是该领域的流程放在 `其他领域` 或者 `外部域` , 这些不是该业务域的核心问题。通常也不是由该业务域来实现。
- 使用子视图分离`团长`和团员的不同角色的业务
- 使用黄色标记跨泳道之间的流程，用蓝色标记角色的业务发起点。

<br>

---

<br>
<br>
<br>

### 案例 2: 优惠券

![优惠券](/images/biz-design/design-%E4%BC%98%E6%83%A0%E5%88%B8.jpg)

要点：

- 如果多个页面的业务存在重复，可以在泳道上进行一些合并，例如
  ![合并子视图](/images/biz-design/Untitled%2014.png)

<br>

---

<br>
<br>
<br>
<br>

### 案例 3： 活动预约

![活动预约流程图](/images/biz-design/%E6%B4%BB%E5%8A%A8%E9%A2%84%E7%BA%A6%E6%B5%81%E7%A8%8B%E5%9B%BE.png)

<br>
<br>
<br>

# 2. 做好概要设计

业务流程图可以梳理待开发的业务流程、业务主体状态、依赖关系等等。这里并没有包含太多前端技术设计细节，`概要设计`就是为了弥补这块的空白。

我在 [if 我是前端团队 Leader，怎么做好概要设计](https://juejin.cn/post/6844903936504119304) 讲过类似的话题，可以结合一起看吧。

<br>
<br>
<br>

## 2.1 页面/模块拆分

根据`业务需求`以及`产品原型`对业务域内的页面进行拆分。页面拆分是前端设计中最简单的一个环节，主要涉及：

- **页面路由定义**。
  - 页面命名。我们推荐使用别名导航，而不是路径导航。因为路径的可读性较差、变动的频率也更高。
  - 页面路径。
  - 分包规划。如果是小程序，则需要考虑分包的规划，分包直接影响页面路径，以及后期发布。能不放在主包的就不放在主包。
- **页面通信协议设计**。

  - 路由参数(params)。设计携带在页面 URL 上的关键参数(查询字符串)。例如商品详情页面，id 表示商品 id。
  - 通信协议。如果路由参数无法满足需要，需要在页面之间`传递大量数据`或者`引用类型值`, 则需要用到`内存通信`。

    - 输入(data)。
    - 输出(backMessage)。页面返回参数， 移动端可能需要考虑，比如一些‘选择器’页面
      <aside>
      ⚠️ **大部分场景我们不推荐使用内存通信，因为这会造成页面之间的耦合、丧失独立运行能力、且无法分享到外部。因此在审核设计时要考虑有没有必要用内存通信。**

      </aside>

- **目录规划**。**原则是按业务聚合而不是职能聚合**。我们推荐将同一个业务域下的组件、API、模型、页面都聚在一起，而不是按照功能分散在程序多处。

  ```bash
  # ❌ 按职能聚合
  /components
    /a
    /b
    /c
  /pages
    /page-a
    /page-c
  /api
  /utils

  # ✅ 按业务域聚合
  /modules
     domain-a/     # 业务模块
       components/
         /a
         /b
       page-a.tsx
       api.ts
       utils.ts
     domain-b/     # 业务模块
       components/
         /c
       page-b.tsx
       api.ts
  routes.ts # 通用注册路由，引用业务域的页面
  ```

<br>
<br>

**输出案例**：

<br>

```markdown
# 优惠券

## 页面设计

所属分包： member
```

<br>

| 页面 | 路径 | 命名 | params | data | backMessage |
| ---- | ---- | ---- | ------ | ---- | ----------- |
|      |      |      |        |      |             |

<br>
<br>

## 2.2 数据模型拆分和设计

数据模型用于放置业务逻辑和业务状态。

<br>

### 2.2.1 **业务状态机/业务主体生命周期**

通过上面的业务流程图，我们可以发现很多业务可以抽象为`有限状态机`，而前端页面无非在不同的状态下，支持不同的呈现和操作。

例如拼团详情页状态机：

<br>

![状态机](/images/biz-design/Untitled%2015.png)

**我们可以从上图抽象出三个状态(等待拼团、拼团过期、拼团成功、拼团取消)，以及挂靠在不同状态下的不同动作。**

<br>

最简单的实现是用一个状态枚举来表达它：

```tsx
enum GroupStatus {
  Pending = '等待',
  OutDated = '过期',
  Success = '成功',
  Cancelled = '取消',
}
```

<br>

在视图层，我们可以给这些状态区分不同的呈现：

```tsx
status === GroupStatus.Pending ? (
  <ButtonGroup>
    <Button>取消拼团</Button>
    <Button>分享拼团</Button>
  </ButtonGroup>
) : status === GroupStatus.OutDated || status === GroupStatus.Cancelled ? (
  <ButtonGroup>
    <Button>再次拼团</Button>
  </ButtonGroup>
) : status === GroupStatus.Success ? (
  <ButtonGroup>
    <Button>查看订单</Button>
    <Button>再次拼团</Button>
  </ButtonGroup>
) : null
```

<br>

<aside>
💡 如果不同状态下视图有较大差异，可以将每个状态抽离成单独的组件。
</aside>

<br>

模型层对应的`行为`触发时，也可以对状态进行`断言检查`(assert， 或者转换守卫 guard)：

```tsx
class GroupModel {
  status: GroupStatus
  // ...

  /**
   * 取消拼团
   */
  cancel() {
    // 状态检查
    this.assertStatus(GroupStatus.Pending, '取消拼团')
    await this.repo.cancel(this.id)

    // 状态流转
    this.status = GroupStatus.Cancelled
  }

  /**
   * 状态检查
   */
  assertStatus(status: GroupStatus, message: string) {
    if (this.status !== status) {
      throw new Error(`程序异常：只能在 ${status} 状态下，才能 ${message}`)
    }
  }
}
```

当然，对于复杂的页面，状态不会像上述的那么单一, 比如：

- 有可能存在多个`业务主体`（可以理解为业务的参与角色，比如拼图有团长、团员），且不同业务主体有不同状态和转换逻辑
- 甚至状态还可以`嵌套子状态`（复合状态 [Compound states](https://xstate.js.org/docs/zh/guides/introduction-to-state-machines-and-statecharts/#%E6%9C%80%E7%BB%88%E7%8A%B6%E6%80%81-final-state)）、[并行状态](https://xstate.js.org/docs/zh/guides/introduction-to-state-machines-and-statecharts/#%E5%A4%8D%E5%90%88%E7%8A%B6%E6%80%81-compound-states)(Parallel states)
- 状态流转规则复杂等等。

<br>
<br>

就拿发起拼团这个例子来说：

![多个嵌套状态，可以由多个状态变量来控制。](/images/biz-design/%E7%8A%B6%E6%80%81%E6%9C%BA-%E7%AC%AC_2_%E9%A1%B5.jpg)

多个嵌套状态，可以由多个状态变量来控制。

如上所示，一个复杂业务流程会涉及很多子状态，在设计阶段我们需要将 不同的主体的状态 识别出来。后期就围绕着这些状态进行开发。

<br>
<br>
<br>

**好在我们在梳理业务流程图时，已经将相关规则梳理清楚了。识别这些状态并不难。更重要的是，这是一种业务建模思维的转变。**

如果你想要深入学习和理解状态机， 或者在项目中严谨应用状态机，不妨试一下更专业的 [XState](https://xstate.js.org/docs/zh/guides/introduction-to-state-machines-and-statecharts/#%E7%8A%B6%E6%80%81-states)。

<br>
<br>

<aside>
💡 状态机学习资料：

- [产品之术：一目了然的状态机图](http://www.woshipm.com/pmd/828671.html)
- [如何绘画状态机来描述业务的变化](http://www.woshipm.com/pd/594751.html)
- [XState](https://xstate.js.org/)

</aside>

<br>
<br>

### 2.2.2 模型设计

<br>
<br>
<br>

模型(Model) 是一个核心对象，它承载了核心的业务逻辑。模型类中应该包含哪些内容呢？

![模型内容](/images/biz-design/Untitled%2016.png)

- **业务状态。即我们在上一节中识别出来的业务状态。在模型层中会为不同’主体‘创建一个状态变量，用于存放当前的状态。**

- **业务数据**。例如活动详情、当前选中数据、活动列表等等。

- **计算数据/衍生数据**。在业务数据的基础上计算出来。我们建议你不要去直接修改业务数据，而是优先基于业务数据去推断、计算你想要的数据。

- **行为**。模型就是是 数据+行为。通常行为可以总结为以下集中

  - 状态变更、流转。比如下单、发起拼团，触发业务状态之间的流转。
  - 业务数据变更。比如修改选中的商品、删除列表项。
  - 数据持久化。调用持久化层相关接口，对业务数据/状态进行持久化。

- **事件**。事件是模块解耦、实现扩展的一种重要手段。通常模型会抛出下列事件：

  - 业务状态变更。
  - 异常情况。
  - 考虑扩展点

    <aside>
    💡 **不过不是所有业务状态变更事件都应该抛出来**，因为：
    -  不是所有业务状态变更事件都能在前端捕获到。前端只是业务流程的局部，能被前端捕获的往往是由页面在界面触发的。
    -  不是所有事件抛出去都有意义。结合实际场景来看，比如需要在这个事件触发时进行埋点。
    </aside>

- **模型生命周期**。使用依赖注入框架之后，需要关心这个问题，**决定单例还是非单例**？
  原则是如果你的模型需要在整个应用生命周期中存在，则使用单例，例如登录、会员信息这些。大部分场景都应该使用非单例，跟随页面释放而释放。

<br>
<br>
<br>

### 2.2.3 输出案例

<br>

以登录 SDK 为例：

- **业务状态：**

  <br>
  ![Untitled](/images/biz-design/Untitled%2017.png)
  <br>

  - 登录状态
    - 初始化：创建会话
    - 登录中
    - 登录成功：重新登录、更新用户信息、退出登录
    - 登录失败：再次登录
      <br>

- **业务数据**：
  - 会话信息
  - 失败信息
  - 重新登录的次数
- **衍生数据**：这些信息都从会话信息中提取出来
  - 已登录？
  - 已注册？
  - 会话 id
  - 用户信息
- **行为**：
  - 创建会话
  - 重新登录
  - 退出登录
  - 等待登录成功
  - 更新用户信息
- **事件**：
  - 缓存会话恢复
  - 登录前
  - 初次登录成功
  - 登录成功
  - 登录失败
  - 会话刷新
  - 退出登录
  - 用户信息更新
- **模型生命周期**：单例

<br>
<br>

## 2.3 视图设计：组件拆分和设计

组件的拆分和设计是前端设计的重头戏，合理拆分组件，可以提高代码复用率和后期的可维护性。关于如何拆分和设计组件见 [组件设计指南](https://www.notion.so/186be8c108d34d1db4da4fd71c262795?pvs=21) 、以及 **[React 组件设计实践相关文章](https://juejin.cn/post/6844903843189243917)**

<br>
<br>

![组件设计](/images/biz-design/Untitled%2018.png)

<br>

**案例：**

NoticeBar 滚动公告栏

![NoticeBar 原型](/images/biz-design/Untitled%2019.png)

**属性**

| 属性       | 说明                                     | 类型    | 默认值  |
| ---------- | ---------------------------------------- | ------- | ------- | --- |
| mode       | 通知栏模式，可选值为 `'closeable' / 'link'`                             | string  | ''      |
| text       | 通知文本内容                             | string  | ''      |
| color      | 通知文本颜色                             | string  | #f60    |
| background | 滚动条背景                               | string  | #fff7cc |
| leftIcon   | 左侧图标名称或图片链接                   | string  | -       |
| rightIcon  | 右侧图标名称或图片链接                   | string  | -       |
| delay      | 动画延迟时间 (s)                         | number  | string  | 1   |
| speed      | 滚动速率 (px/s)                          | number  | string  | 60  |
| scrollable | 是否开启滚动播放，内容长度溢出时默认开启 | boolean | -       |
| wrap       | 是否开启文本换行，只在禁用滚动时生效     | boolean | false   |

<br>
<br>

**事件**

| 事件名  | 说明             |
| ------- | ---------------- |
| onClick | 单击通告栏时触发 |
| onClose | 关闭通告栏时触发 |

<br>
<br>

**插槽**

| 名称      | 说明               |
| --------- | ------------------ |
| children  | 通知栏内显示内容   |
| leftIcon  | 自定义左边图标内容 |
| rightIcon | 自定义右侧图标内容 |

<br>
<br>
<br>

## 2.4 扩展点设计

如果你开发的是 SDK (即面向其他开发者)，那就需要考虑扩展性问题，你的程序需要考虑各种场景的使用，比如对于 ToB 行业， 需要考虑二开、项目交付时，对你的程序进行各种粒度的定制。我在 [2B or not 2B: 多业态下的前端大泥球](https://juejin.cn/post/7257560570740047931) 这篇文章也讨论过相关的背景。。

<br>
<br>

扩展点实现方式：

- 使用[依赖注入形式](https://www.notion.so/SDK-9adb4c7dc8b74f9cb7e4ef42f6d03274?pvs=21)。依赖注入点可以由外部进行重新定义
- 事件/回调。

<br>
<br>

**案例**:

登录 SDK 扩展点

```markdown
## 暴露的扩展点

| 名称                                              | 说明                                                           | 单例 |
| ------------------------------------------------- | -------------------------------------------------------------- | ---- |
| 'DI.login.SUPPORT_QUICK_PHONE_AUTH': boolean;     | 是否支持快捷手机号码授权, 默认 true                            |
| 'DI.login.SUPPORT_QUICK_USER_INFO_AUTH': boolean; | 是否支持快捷用户授权，默认 true                                |
| 'DI.login.QUICK_PHONE_AUTH_TEXT': string;         | 手机号码快捷登录文案， 默认为手机号码快捷登录                  |
| 'DI.login.QUICK_USER_INFO_TEXT': string;          | 快捷用户信息获取, 默认为 允许授权                              |
| 'DI.login.ROUTE_PROTOCOL_DETAIL': string;         | 服务协议详情页面, 默认为 protocolDetail(命名路由)              |
| 'DI.login.MAX_RELOGIN_COUNT': number;             | 最大重新登录次数, 默认为 10                                    |
| 'DI.login.VERIFY_TIMEOUT': number;                | 发送验证码超时时间, 默认 60 秒                                 |
| 'DI.login.LOGIN_API': string;                     | 登录接口路径， 默认 /login_v3/login_v3                         |
| 'DI.login.USER_RULE_API': string;                 | 用户服务协议列表接口路径， 默认 /wk-base/c/agreement/queryList |
| 'DI.login.REGISTER_API': string;                  | 注册用户接口路径， 默认 /cs/auth/user/register/v3              |
| 'DI.login.UPDATE_USER_API': string;               | 更新用户信息接口路径， 默认 /cs/auth/vip/user/update_user      |
| 'DI.login.SEND_PHONE_VERIFICATION_API': string;   | 发送验证码接口路径， 默认 /cs/auth/user/send_register_code     |
| 'DI.login.PLATFORM': PlatformType;                | 当前平台                                                       |
| 'DI.login.Implement': ImplementProtocol;          | 平台适配实现                                                   | yes  |
| 'DI.login.LoginRepo': LoginRepo;                  | 登录接口实现                                                   | yes  |
| 'DI.login.LoginModel': LoginModel;                | 登录模型                                                       | yes  |
| 'DI.login.RegisterModel': RegisterModel;          | 注册模型                                                       | yes  |
| 'DI.login.PhoneVerifyModel': PhoneVerifyModel;    | 手机验证码模型                                                 |

<br>
<br>

## 暴露的事件

| 标识符                                                                | 描述                         |
| --------------------------------------------------------------------- | ---------------------------- |
| 'Event.login.onRecover': SessionInfo;                                 | 从缓存中恢复                 |
| 'Event.login.onBeforeLogin': undefined;                               | 登录前                       |
| 'Event.login.onSetup': SessionInfo;                                   | 首次登录完成                 |
| 'Event.login.onLogined': SessionInfo;                                 | 已鉴权，鉴权成功             |
| 'Event.login.onLoginFailed': Error;                                   | 鉴权失败                     |
| 'Event.login.onLoginComplete': { info?: SessionInfo; error?: Error }; | 登录完成，可能成功，可能失败 |
| 'Event.login.onRefreshed': SessionInfo;                               | 会话刷新成功                 |
| 'Event.login.onRefreshFailed': Error;                                 | 会话刷新失败                 |
| 'Event.login.onLogout': never;                                        | 退出登录                     |
| 'Event.login.onUpdateInfo': SessionInfo;                              | 更新信息成功                 |
| 'Event.login.onUpdatedUser': UserInfo;                                | 更新用户信息                 |
| 'Event.login.onUpdatedUserFailed': Error;                             | 更新用户信息失败             |
| 'Event.login.onBeforeRegister': RegisterOptions;                      | 注册前                       |
| 'Event.login.onRegistered': UserInfo;                                 | 注册成功                     |
| 'Event.login.onRegisterFailed': Error;                                | 鉴权失败                     |
```

<br>
<br>
<br>

# 4. 评审

<br>
<br>

当汽车到达一定的速度时，大部分的能耗用在了克服空气阻力(比如当到达 120km/h 时，大于 60%，随着速度的提升，这个比例会越来越高)。

这个适用于软件开发，随着团队规模的扩大，我们会花费大量时间用于“**达成共识**”。

这包括面对面的会议、电子邮件、即时消息、编写和阅读文档等各种形式。这是因为软件开发不仅仅是编写代码，更是需要理解业务需求、解决问题、协调任务、分享知识等。

软件开发中有很多工具 和方法论，可以帮助提升“达成共识”的效率，近些年最为出名的应该是 DDD 了，比如它强调引入领域专家来指导软件的设计、划分边界上下文、统一语言等等。

我们进行软件设计，也是出于此目的。因此一定要有评审，在这个过程中进行碰撞、纠错、最后达成共识。

<br>
<br>
<br>

# 总结

上文给做前端业务开发怎么做设计打了个样，主要脉络是：

<br>

![脉络](/images/biz-design/Untitled%2020.png)

- 业务梳理：我们定义了流程图的绘制规范。通过流程图来分析用户与 UI 的交互流程，凸显页面/模块之间的关系、状态的流转。
- 模型设计：设计视图无关的状态和行为。这里引入了状态机的概念
- 视图设计：页面、组件的拆分以及输入/输出的设计。

<br>

这些规范和观点可能并不完全适合你们的团队。为此，你们需要找出自身所面临的问题，然后采取行动，来构建出符合你们需求的设计规范。接着，在不断的迭代过程中，逐步完善和优化这些规范。

<br>

系列文章：

- [if 我是前端团队 Leader，怎么制定前端协作规范?](https://juejin.cn/post/6844903897610321934)
- [if 我是前端 Leader，谈谈前端框架体系建设](https://juejin.cn/post/6844904016200073223)
- [if 我是前端 Leader，怎么走出小微前端团队的围墙?](https://juejin.cn/post/6844904001603895304)
- [if 我是前端团队 Leader，怎么用好看板进行任务管理?](https://juejin.cn/post/6844903953939824654)
- [if 我是前端团队 Leader，怎么做好概要设计](https://juejin.cn/post/6844903936504119304)

<br>

> **💥 另外，我这边也想挪坑了，Base 珠海、远程也可以，有坑位推荐的可以私信我，感激不尽**。
