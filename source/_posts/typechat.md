---
title: 'AI 调教师：聊聊 TypeChat 以及ChatGPT 形式化输出'
date: 2023/7/24
categories: AI
---

![Untitled](/images/typechat/Untitled%201.png)

Typescript 之父(微软)在 7月 21 号发布了一个有趣的项目—— `[Typechat](https://github.com/microsoft/TypeChat)`。**旨在使用 AI 来连接自然语言和应用的 Schema / API**。说白话就是使用 Typescript 类型信息来约束 ChatGPT 输出内容的结构。

我们早已见证过 ChatGPT 的强大，如果想要对接到我们已有的软件系统，通常会要求它输出 JSON 这类形式化、结构化的数据。如果你调教过 ChatGPT 就会发现， 它的输出结果往往没那么靠谱。为了让它输出符合要求的内容，我们需要给出足够的上下文信息和示例，并且这个调教过程也比较玄学。

本文就来看看 Typechat 是如何让 ChatGPT 输出符合需求的内容

<br>

# ChatGPT 的能力和缺陷

### ChatGPT 看起来很擅长处理代码

![扮演一个 linux 终端](/images/typechat/Untitled%202.png)

扮演一个 linux 终端

<br>

![扮演一个 Javascript 执行器](/images/typechat/Untitled%203.png)

扮演一个 Javascript 执行器

<br>

![扮演 Typescript](/images/typechat/Untitled%204.png)

扮演 Typescript

<br>

这能说明 ChatGPT 的预训练集中包含了丰富的编程语言相关的内容。

<br>
<br>
<br>

## 连续对话和纠错机制

![Untitled](/images/typechat/Untitled%205.png)

众所周知， ChatGPT 生成的内容存在一定的随机性和不稳定性，很难一步到位。读者们作为开发者我们经常使用它来生成代码，应该能够体会到。

这个问题怎么解决呢？大概有以下几个方向

- 可以和 ChatGPT 连续对话，引导它，反问它、纠正它
- 给 ChatGPT 提供更详细的上下文信息
- 使用一些对话的技巧：Chain of thought, 让 ChatGPT 学习推理的过程
- 模型微调。

最后是平常心，开放地对待， AI 不是无所不能的，我们可能用尽的所有技巧， 也可能无法令人满意的答案。

<br>
<br>

## DSL 输出

如果我们想要让 AI 连接到其他生态，比如连接到软件系统、控制硬件设备、实现各种自动化流程，在现在这个阶段，我们需要让 ChatGPT 输出结构化的数据，比如 JSON、XML、或者其他常见的 DSL。

![Untitled](/images/typechat/Untitled%206.png)

就像我们开头说的 “ *Typechat 旨在使用 AI 来连接自然语言和应用的 Schema / API*”,  结合上面的流程图理解，你应该就能体会到这句话的意思。**`AI` 在这里就是一个`连接者`，让用户可以使用`自然语言`和我们的`应用系统`进行交互，AI 在这里的责任就是将`自然语言`翻译为我们应用系统能够处理的 `DSL`**。

<br>

ChatGPT 已经具备这样的能力：

![绘制 mermaid 流程图](/images/typechat/Untitled%207.png)

绘制 mermaid 流程图

<br>

![输出 JSON](/images/typechat/Untitled%208.png)

输出 JSON

<br>

如果你要求输出更复杂的数据结构，则需要使用 [Few-shot](https://learningprompt.wiki/docs/chatGPT/tutorial-extras/Few-Shot%20Prompting) Prompt 等手段，**在受限的 Token 范围内，给 ChatGPT足够的案例和上下文信息**。

除此之外，OpenAI 官方在 613 版本的 GPT 3.5 和 4 带来了`函数调用`的能力([Function Calling](https://platform.openai.com/docs/guides/gpt/function-calling)), 可以帮助开发者通过 API 方式实现类似于 ChatGPT 插件的数据交互能力。让开发者可以使用  JSON Schema 来描述你的函数接口，GPT 会根据用户的输入，决定调用哪个函数，并组装符合 Schema 要求的 JSON 数据。

以下是 OpenAI 的官方示例：

```python

    # 🔴 函数接口定义
    functions = [
        {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA",
                    },
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
                },
                "required": ["location"],
            },
        }
    ]

    # 🔴 用户输入
    messages = [{"role": "user", "content": "What's the weather like in Boston?"}]
    # 调用
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0613",
        messages=messages,
        functions=functions,
        function_call="auto",  # auto is default, but we'll be explicit
    )

    response_message = response["choices"][0]["message"]

    # 🔴 GPT 会告诉你最终需要调用哪个函数以及它的参数，也可能不会调用任何东西
    if response_message.get("function_call"):
```

gpt-3.5-turbo-0613、gpt-4-0613 针对 Function calling 这种场景做了微调，实际上这些 ‘函数’ 也是注入到 `system` prompt 里面，同样会占用请求的 Token。在旧的版本理论上也可以实现类似的效果。我会在后续的文章中专门介绍 Function calling。

<br>

实际上，Function Calling 还是不完美，比如无法保证严格按照我们给定的 JSON  Schema 输出，不支持复杂的 JSON Schema，缺乏灵活性等等。现在我们开始介绍本文的主角 —— typechat

<br>
<br>
<br>

# TypeChat

TypeChat 是微软刚发布一个有趣的项目，不同于 Function calling， 它使用 Typescript 类型来作为 「Schema」，要求 ChatGPT 返回符合这个类型定义的数据。

在 `Typechat` 中，先定义好 ChatGPT 的响应类型，即 `Schema`, 例如:

```python
type Response = {
    items: Item[];
};

type Item = {
    name: string;
    quantity: number;
    size?: string;
    notes?: string;
}
```

要求 ChatGPT 返回 JSON 格式，并符合上述的 Response 类型。接着输入用户需求：

```python
Could I get a blueberry muffin and a grande latte?
```

最后 ChatGPT 返回结果：

```python
{
  "items": [
    {
      "name": "blueberry muffin",
      "quantity": 1
    },
    {
      "name": "latte",
      "quantity": 1,
      "size": "grande"
    }
  ]
}
```

<br>

---

<br>

那么它是怎么工作的？我们在上一节对 ChatGPT 的能力做了大概的分析，你可以将它们结合起来想想：

- ChatGPT 擅长扮演“代码”执行器,  这其中也包括 Typescript
- ChatGPT 的缺点就是不稳定、随机性。解决办法就给出更多的信息、推理步骤，通过连续对话、反复纠正它。
- ChatGPT 通过给出足够的指示，可以输出‘符合’需求的结构化数据。

<br>
<br>
<br>

Typechat 就是运用了上述思路：

![Untitled](/images/typechat/Untitled%209.png)

- 将类型定义和用户需求一起投喂给 ChatGPT，要求它返回指定类型的 JSON数据
- 将返回的数据喂给 Typescript 进行检查
- 如果类型错误，将错误结果丢回 ChatGPT，重新纠正

<br>
<br>

它的 Prompt 非常简单。 请求的 Prompt：

```tsx
  function createRequestPrompt(request: string) {
        return `You are a service that translates user requests into JSON objects of type "${validator.typeName}" according to the following TypeScript definitions:\n` +
            `\`\`\`\n${validator.schema}\`\`\`\n` +
            `The following is a user request:\n` +
            `"""\n${request}\n"""\n` +
            `The following is the user request translated into a JSON object with 2 spaces of indentation and no properties with the value undefined:\n`;
   }
```

<br>

纠错 Prompt：

```tsx
function createRepairPrompt(validationError: string) {
        return `The JSON object is invalid for the following reason:\n` +
            `"""\n${validationError}\n"""\n` +
            `The following is a revised JSON object:\n`;
    }
```

<br>

翻译流程：

```tsx
async function translate(request: string) {
        let prompt = typeChat.createRequestPrompt(request);
        let attemptRepair = typeChat.attemptRepair;
        while (true) {
            const response = await model.complete(prompt);
            if (!response.success) {
                return response;
            }
            const responseText = response.data;
            const startIndex = responseText.indexOf("{");
            const endIndex = responseText.lastIndexOf("}");
            if (!(startIndex >= 0 && endIndex > startIndex)) {
                return error(`Response is not JSON:\n${responseText}`);
            }
            const jsonText = responseText.slice(startIndex, endIndex + 1);
            // 🔴 类型检查
            const validation = validator.validate(jsonText);
            if (validation.success) {
                return validation;
            }
            if (!attemptRepair) {
                return error(`JSON validation failed: ${validation.message}\n${jsonText}`);
            }
            // 🔴 修复
            prompt += `${responseText}\n${typeChat.createRepairPrompt(validation.message)}`;
            attemptRepair = false;
        }
    }
```

<br>

Typechat 与 Function calling 对比：

- Typescript 可以更简洁、灵活地定义复杂的数据类型；
- Typechat 也加入了简单的纠错机制，进一步保证结果的可靠性。

<br>

它们都改变不了 ChatGPT 的特性，结果依然不一定是可靠的。目前 Typechat  只有一轮纠正，其实际的效果、Token 消耗量等还有待验证。

<br>
<br>
<br>
<br>

# 总结

上面我们简单介绍了 ChatGPT 的一些特性和缺陷。接着引入了 Typechat，它给我们提供了一个较新的思路：使用 Typescript 类型来定义 ChatGPT 的输出结构，然后通过 Typescript 来验证输出结果，循环纠正 ChatGPT。

本文的要点：

- ChatGPT 看起来很擅长处理编程语言。比如 Typescript，这就给 Typechat 的实现奠定了基础。
- 使用 Typescript 类型作为 Schema，这本身就可以给 ChatGPT 提供较为严谨的上下文信息。
- ChatGPT 的回答是随机的、不稳定，很难做到一步到位。在实际使用中，需要通过多次对话和纠正才能得到较为完善的结果。所以 Typechat 就引入了自动纠错机制，让 ChatGPT 输出更加稳定。
- 编程语言是严苛的，具备可‘纠错性’。我们可以将代码错误信息反馈给 ChatGPT 来完善答案。Typechat 就是利用了这点，其他编程语言也可以轻松实现类似的效果，很快其他语言应该也会有类似的库出来

<br>

# 扩展阅读

- https://github.com/microsoft/TypeChat