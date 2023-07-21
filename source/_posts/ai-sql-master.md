---
title: 'AI 调教师系列开篇： MySQL 专家'
date: 2023/7/21
categories: AI
---

![cover](/images/ai-sql-master/Untitled.jpeg)

ChatGPT 在年初爆火，成为街头巷尾热议的话题。现在的 AI 应该算是目前最卷的赛道了，从卖账号、套壳客户端、 割韭菜教程、大厂争先发布自己的大模型…

作为普通开发者，搞底层大模型不是人人都能企及，下场割韭菜实在卷不过别人，追新也需要付出很多精力。眼前貌似就只有一条路，着眼于 AI 的应用层，看能不能给自己的垂直赛道赋赋能？ 或者针对个人而言，能不能利用 AI 提高工作效率？

<br>

所以我开一个新坑, 以前端开发者视角， 记录一下作为一个 「AI 调教师」在 `AI 应用层`的一些实践记录, 没有高谈阔论，就一些碎碎念。

<br>
<br>

# 一种全新的人机交互模式

今年二月份，我们就开始尝试将 ChatGPT 接入到我们的工具中，如下图：

![AI对话框](/images/ai-sql-master/Untitled.png)

<br>

就是这样的一个`对话框`，现在大家可能司空见惯了。那时候并不常见，毕竟 Microsoft Office Copilot、`ChatGPT 插件`什么的都还没发布。在当时想出这个点子的时候，我一整夜睡不着觉，第二天四五点就决定起床，肝了一天搞出这样的效果。

> 😂 不知道有没有人跟我一样，一兴奋就会睡不着觉

<br>

这是一种全新的系统交互方式，即用`自然语言`来操控整个系统。怎么操控法呢？

![指令](/images/ai-sql-master/Untitled%201.png)

<br>

- 这个对话框是全局的`常驻`的，用户可以随时通过快捷键或者悬浮按钮唤起
- 每个页面都可以扩展自己的指令，比如进入数据建模页面，就注册 `SQL 专家`、`数据建模`等指令，离开后就销毁：
  ```jsx
  // React 代码
  useEffect(() => {
    if (model.readonly) {
      return
    }

    // 注册扩展
    return registerExtension({
      key: '数据建模(测试)',
      match: '数据建模(测试)',
      type: ExtensionType.Command,
      description: '数据模型创建和修改',
      onSend(context) {
        // ... 实现
      },
    })
  }, [])
  ```

<br>

![指令系统](/images/ai-sql-master/Untitled%202.png)
指令系统

<br>

`指令`类似于现在的 `ChatGPT 插件`，用于扩展 ChatGPT 的能力边界。

对话框只是提供了 AI 对话的能力(机制)，而具体的业务、上下文信息只有页面自己最清楚，因此就让页面自己提供与 AI 对接的接口。

目前的实现方式是通过 `#` 来唤起选择具体指令，未来我们会利用 ChatGPT 最新的 [Function Calling](https://platform.openai.com/docs/guides/gpt/function-calling) 实现类似 `ChatGPT 插件` 一样的自然语言调用能力。

<br>
<br>
<br>

# MySQL 专家

我们第一个接入的 `AI 的大腿`，就是给我们的`数据建模工具`接入 `AI  生成 SQL 语句`的功能：

![对话框](/images/ai-sql-master/Untitled.png)

如上图所示，我们可以使用自然语言的形式，基于我们已创建的数据模型来做以下事情：

- 生成 MySQL 建表、 增删改查语句
- 给出优化的建议
- 检查是否符合关系型数据的范式等等…

<br>

建表语句：

![建表语句](/images/ai-sql-master/Untitled%203.png)

<br>

优化建议：

![优化建议](/images/ai-sql-master/Untitled%204.png)


还有很多场景…

<br>
<br>
<br>




# Prompt 实现

几乎零成本就可以拥有一个 「MySQL 专家」。它的 Prompt 其实很简单！

<br>

首先需要将已创建的数据模型序列化，作为上下文喂给 ChatGPT, 例如：

```ruby
#会员主档
Table m_member (
  id: Long, PrimaryKey;
  tenant_id: Long; #租户id
  unique_account_id: String; #会员一账通id
  status: Integer; #会员状态
  unique_identifier_key: String; #会员唯一标识键
  unique_identifier: String; #会员唯一标识的值
  ext_json: String; #自定义扩展字段
  clubs: String; #会员所属的俱乐部
  channel: String; #渠道
)

#俱乐部会员
Table club_member_do (
  id: Long, PrimaryKey; #实体唯一标识符
  tenant_id: Long; #租户id
  club_id: Long; #俱乐部id
  unique_account_id: String; #会员一账通id
  member_no: String; #会员卡号
  level_num: Integer; #会员等级编号
  level_expired_time: DateTime; #等级过期时间
  nickname: String; #昵称
  channel: String; #渠道
  certificate_type: String; #证件类型
  certificate_no: String; #证件号码
  email: String; #邮箱
  country_code: String; #国家编码
  address: String; #详细地址信息
  ext_json: String; #扩展字段
  status: Integer; #俱乐部会员状态
)

#会员变动日志
Table m_member_operation_log (
  id: Long; #实体唯一标识符
  tenant_id: Long; #租户ID
  club_id: Long; #俱乐部Id
  unique_account_id: String; #一账通ID
  operation_type: String; #操作类型
  remark: String; #操作备注
)
```

<br>
<br>

这个 DSL 的格式无所谓，ChatGPT 自然语言的处理能力非常强，只要你给出的信息符合一定的规律，格式并不重要。

<br>

完整的 Prompt(`system`) 模板如下：

```txt
你是一个 MySQL 专家，你会根据用户给出的概念模型，创建专业、高性能 SQL 语句， 以及回答用户关于数据库的任何问题，提出建设性意见。

---

假设实体(或者表)有多个字段(或者属性), 这些字段支持以下类型:

- Boolean
- Date
- DateTime
- Timestamp
- Integer
- Decimal
- Long
- Double
- Float
- String
- Text
- LongText
- JSON
- Reference : 表示对其他表的引用

---

这是概念模型：

${conception}

---

用户输入： """${input}"""
```

<br>
<br>

这是一个很简单的 Prompt，但也揭示了我们写 Prompt 的[主要框架](https://learningprompt.wiki/docs/chatGPT/tutorial-extras/ChatGPT%20Prompt%20Framework)：

- **能力与角色**（Capacity and Role）：一上来就给它带个帽子，定义好它的角色和能力
- **洞察力**（Insight）：背景信息和上下文。即我们携带了数据模型工具中提取出来的 `模型 DSL`， 以及 DSL 的基础规则
- **指令**（Statement）：要求 ChatGPT 做什么。这个由后续的用户给出

<br>

这里我们也使用了一些[特殊符号](https://learningprompt.wiki/docs/chatGPT/tutorial-tips/%E6%8A%80%E5%B7%A75%EF%BC%9A%E4%BD%BF%E7%94%A8%E7%89%B9%E6%AE%8A%E7%AC%A6%E5%8F%B7%E6%8C%87%E4%BB%A4%E5%92%8C%E9%9C%80%E8%A6%81%E5%A4%84%E7%90%86%E7%9A%84%E6%96%87%E6%9C%AC%E5%88%86%E5%BC%80), 比如 `---` `"""` , 对文本进行分段，可以提升 AI 反馈的准确性

<br>

因为 ChatGPT 语言模型已经预训练了很多数据库相关的语料，所以回答的效果还不错，不需要太多的指示(即 `[Zero-Shot Prompting](https://learningprompt.wiki/docs/chatGPT/tutorial-extras/Zero-Shot%20Prompts)`)。

> 💡  你可以通过这个[链接试一试效果](https://sdk.vercel.ai/r/25O12Mq)

<br>
<br>
<br>

# 总结


「AI 调教师」系列的第一篇文章以一个最简单的示例开始， 这是我为数不多比较短的文章了。如果你想给已有的工具接入 AI 能力，兴许这种方式就是最好的开始，从已有的工具中提取出相关上下文信息，投喂给 AI 来实现智能问答。

下一篇文章，我们将进一步深化，讲讲如何利用 AI 来实现`数据建模`(画 ER 图)，敬请期待。同时求赞求关注求收藏，你也可以直接订阅这个专栏。

<br>
<br>

# 扩展阅读

本文用到的技巧

- [Zero-Shot Prompts](https://learningprompt.wiki/docs/chatGPT/tutorial-extras/Zero-Shot%20Prompts)
- [技巧 5：使用特殊符号指令和需要处理的文本分开](https://learningprompt.wiki/docs/chatGPT/tutorial-tips/%E6%8A%80%E5%B7%A75%EF%BC%9A%E4%BD%BF%E7%94%A8%E7%89%B9%E6%AE%8A%E7%AC%A6%E5%8F%B7%E6%8C%87%E4%BB%A4%E5%92%8C%E9%9C%80%E8%A6%81%E5%A4%84%E7%90%86%E7%9A%84%E6%96%87%E6%9C%AC%E5%88%86%E5%BC%80)
- [CRISPE Prompt Framework](https://learningprompt.wiki/docs/chatGPT/tutorial-extras/ChatGPT%20Prompt%20Framework)

学习 Prompt

- [Learning Prompt](https://learningprompt.wiki/docs/chatGPT/tutorial-basics/%E5%9F%BA%E6%9C%AC%E4%BD%BF%E7%94%A8%E5%9C%BA%E6%99%AF%20&%20%E4%BD%BF%E7%94%A8%E6%8A%80%E5%B7%A7/scenario-1-ask-questions)
- [ChatGPT Prompt Engineering for Developers](https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/)
