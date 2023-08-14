---
title: '前端国际化：懒人必备的自动翻译'
date: 2023/8/14
categories: 前端
---


[上一篇文章](https://juejin.cn/post/7264747090814009404)我们讲了语言包的维护，今天继续讲讲语言包的自动翻译。

<br>

# 翻译工作流

我们这里讲的自动翻译指的是`机器翻译`，虽然机器翻译未必准确，但在它可以帮助我们快速实现原型，这在项目初期确实能很大地提升开发效率。

我们可以将国际化翻译的工作流拆成以下三个阶段：

![翻译工作流](/images/i18n-translate/Untitled.png)

- 开发阶段：前端开发需要提取和维护`源语言包`(Source Language)。比如将页面中的文案提取到 zh 语言包中。接着基于`源语言`机器翻译到其他语种。
- Review 阶段：这个阶段主要的参与者是专业翻译人员。他们会根据具体的产品需求上下文、以及对目标语种的了解，对机器翻译的结果进行校对。
- 更新阶段：将校对后的语言包回写到项目中，更新和发布。

<br>
<br>
<br>

这里有几个问题:

***一） 怎么选择源语言***？

如果从翻译的效果上看，英语通常是最好的源语言，以下是 ChatGPT 给出的几个原因：

1. 广泛使用：英语是全球最广泛的工作语言和交流语言，许多国家和地区都将其作为第二语言进行学习和使用。
2. 丰富的词汇：英语的词汇数量庞大，对各种概念和现象都有准确的描述，这使得从英语翻译到其他语言时可以更准确地表达原文的意思。
3. 国际化规范：许多国际化和本地化的标准和规范，如i18n，都是基于英语的，这意味着从英语翻译到其他语言的过程可以更好地遵循这些规范。
4. 世界范围内的资源：有大量的从英语到其他语言的翻译资源，这可以帮助翻译者更好地完成工作。

然而作为英语非母语者，实施起来可能会比较麻烦: 一是从业者英语水平良莠不齐，二是我们的产品、需求、原型可能都是以中文为基准的。

因此大部分情况下，我们不得不将中文作为源语言。

<br>

---

<br>

***二）Review 阶段有什么平台或者工具来支持***？

Review 阶段的主要参与者不是开发人员，所以我们需要提供一些简单、易用的工具或平台来支撑他们的校对工作。

<br>

比如在我们公司采用的就是最为原始的烹饪方式 —— Excel 文件 ，这个下文会讲到。我们会将整个项目的语言包汇总到 Excel 中：

![Excel 文件](/images/i18n-translate/Untitled%201.png)


<br>

专业的翻译人员可以直接校对和编辑这个 Excel 文件，借助一些在线文档工具，可以实现基础的多人协同工作。

校对完毕后，回传给开发者，再同步到项目的语言包。

<br>

如果是大型项目，参与的人员会非常繁杂，工作流显然也会比较复杂，可能会涉及多团队、多角色协同… 

这时候，可以选择市面上一些更专业的工具或者 SaaS 服务， 比如：

- ⭐️ [Lokalise](https://lokalise.com/?utm_source=vscmarket&utm_campaign=i18nally&utm_medium=banner) → i18n-ally 插件目前就是他们在维护
- ****[Crowdin](https://crowdin.com/teams/engineering?utm_source=vue-i18n.intlify.dev&utm_medium=referral)****
- [Gridly](https://www.gridly.com/string-translation/?utm_source=google&utm_medium=cpc&utm_campaign=string_translation&utm_term=localize_app&gclid=Cj0KCQjwib2mBhDWARIsAPZUn_kFJc-Vq2PN2gGLv6ZK8B9ZVITN6qTjVKkR50s-VSgYGy3QjAj1q5QaApd1EALw_wcB)
- …

国际化、本地化有非常多成熟的商业化 SaaS 方案， 读者可以通过这个[榜单](https://www.g2.com/categories/software-localization-tools)找到更多选择。

不过对于中小型项目，会有中杀鸡用牛刀的感觉。

<br>
<br>

# 使用 i18n ally 插件

上一篇文章中，我们简单介绍了 [i18n-ally](https://github.com/lokalise/i18n-ally) 这个神器。它的能力远远不止这些， 现在我们继续挖掘它的能力。

## 硬编码自动识别和提取

![硬编码识别](/images/i18n-translate/Untitled%202.png)

ally 插件支持识别文件中的硬编码字符串，并支持一键提取。

<br>

它会根据当前的使用的框架来改写源文件：

![提取](/images/i18n-translate/Untitled%203.png)


<br>

只不过它默认生成的 key 有点不符合需求：

![自动生成的 key 使用拼音](/images/i18n-translate/Untitled%204.png)


<br>

笔者建议手动进行精细化的提取：

![手动提取](/images/i18n-translate/Untitled%205.png)


<br>
<br>
<br>

## 机器翻译

![机器翻译](/images/i18n-translate/Untitled%206.png)



i18n ally 插件还内置了强大的机器翻译功能：

- 支持 Google、DeepL、Libre 等机器翻译引擎。
- 可以自动识别出未翻译的 key
- 支持批量翻译
- 支持对 key 进行「重构」。这个很方便，ally 插件会自动更新语言包和相对应的源代码

<br>
<br>

## Review 系统

ally 插件也内置了建议的翻译 Review 工作流：

![review ](/images/i18n-translate/Untitled%207.png)

<br>


这种方式简易、精妙。 Review 记录会跟随着代码仓库一起迭代，可以灵活地进行版本化和分支管理。

不用处理因为`代码仓库`和 `Review 工具流`的割裂而导致的额外同步问题。

![review 记录](/images/i18n-translate/Untitled%208.png)


<br>

i18n-ally 麻雀虽小五脏俱全，足以应付中小型项目的语言包维护、翻译工作流等需求。

如果你有更复杂的需求， 也可以考虑 i18n-ally 的背后维护团队的商业化产品 —— [lokalise](https://lokalise.com/?utm_campaign=i18nally&utm_medium=banner&utm_source=vscmarket)

<br>

最后，再次膜拜 [Anthony Fu](https://antfu.me/projects)， 真奇人也。

<br>

---

<br>
<br>
<br>

# bbt 巴别塔

为了更高效地翻译和生成语言包，我们也开发了一个工具 —— [bbt](https://github.com/wakeadmin/bbt-tools)。这是一个自动化管理和翻译语言包的命令行工具。

它的工作流如下所示：

![工作流](/images/i18n-translate/Untitled%209.png)

<br>


bbt 提供了三个基础的`子命令`，分别对应工作流的三个阶段:

- **收集(bbt collect)**: 这个阶段会以`源语言`为基准，发现并整合当前项目的所有语言包，然后统一写入到 `bbt.csv` 文件中。方便下一步处理。
- **翻译(bbt translate)**： 收集到 `bbt.csv` 之后， 就可以调用 `bbt translate` 命令进行‘机器翻译’。接着，可以选择将机器翻译之后的 `bbt.csv` 发送给专业的翻译人员进行校对
- **写入(bbt write)**:  将校对/变更后的 `bbt.csv` 回写到语言包中。bbt 会以`源语言包`为基准，将 bbt.csv 的所有变更回写到语言包，并自动补全缺失的语言包和 key/value。

<br>

下面简单演示一下。关于 bbt 的安装和初始化过程，可以参考 [Github](https://github.com/wakeadmin/bbt-tools) ，这里就不赘述了。

<br>

## 收集

假设我们的项目结构如下：

![示例项目](/images/i18n-translate/Untitled%2010.png)

<br>


- 源语言是 zh
- 支持 zh、en、zh-Hant、ko 四种语言
- 包含 module-1、module-2 两个子模块和对应的`源语言包`。

<br>

接着，我们可以执行 `bbt collect` 命令来汇总语言包：

```bash
$ bbt collect
```

bbt 会以源语言包为基准，将所有的 key/value 汇总到 `bbt.csv` 中：

<br>

![Excel 文件汇总](/images/i18n-translate/Untitled%2011.png)

<br>


我们可以看到这个文件包含了一些基础的信息，比如语言包的路径、key,  以及翻译的内容。

> 💡 为什么使用 csv?  因为它是一个纯文本格式，方便在代码编辑器中修改和展示；能够被版本库记录变更历史；最后是可以方便地处理合并冲突。
> 

<br>
<br>

## 翻译

接下来就可以执行 `bbt translate` 对 CSV 进行机器翻译：

```bash
$ bbt translate
```

bbt 支持 Google、DeepL、ChatGPT(实验性) 等服务来翻译。翻译完成 `bbt.csv` 如下所示：

![bbt.csv](/images/i18n-translate/Untitled%2012.png)

<br>
<br>
<br>

## 回写

假设翻译和校对流程搞定了，bbt 支持将 `bbt.csv` 文件的内容同步回项目的语言包，只需要执行 `bbt write` 命令：

```bash
$ bbt write
```

<br>

bbt 会以源语言包的基准，补全缺失的语言包、Key/Value、更新变更的内容：

![翻译](/images/i18n-translate/Untitled%2013.png)

<br>

综上，bbt 的核心工作流围绕着`单一数据源` —— `bbt.csv` 文件展开。和 `i18n-ally` 相比， **bbt 更加擅长批量的语言包翻译和同步工作**。

<br>

两者不是取代与被取代的关系，而是一种互补关系，笔者更建议将两者结合起来，DX++

<br>
<br>
<br>

# 总结

本文简单介绍了多语言自动翻译的工作流，这个可盐可甜:

对于中小型项目，使用 [i18n-ally](https://github.com/lokalise/i18n-ally) 这个神器就可以满足基本需求，它给我们带来了很多便利的功能，让前端国际化的开发体验得到的指数级的提升。

接着我给我们团队开发的工具——  [bbt](https://github.com/wakeadmin/bbt-tools)  ，带了下货，和 `i18n-ally` 相比， bbt 更加擅长批量的语言包翻译和同步工作，可以快速根据`源语言`批量翻译和生成其他语言包。两者可以互补使用，进一步提升语言包的维护效率。

<br>
<br>

对于大型项目，涉及到复杂的多人协作、需要更专业的翻译服务、语言包管理服务，那么可以考虑市面上一些成熟的 SaaS 服务。

**最后求✨✨✨ ⭐️ —— [bbt](https://github.com/wakeadmin/bbt-tools)**