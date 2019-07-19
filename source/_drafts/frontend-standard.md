---
title: "如果我是前端团队Leader，怎么制定前端协作规范?"
date: 2019/7/19
categories: 前端
---

一个人就是规范，虽然人员的扩展，需要考虑规范，统一步伐往前走

<!-- TOC -->

- [开发工作流规范](#开发工作流规范)
  - [开发](#开发)
    - [**版本规范**](#版本规范)
    - [**代码控制系统规范**](#代码控制系统规范)
    - [**提交信息规范**](#提交信息规范)
    - [**发布工作流规范**](#发布工作流规范)
  - [构建](#构建)
  - [持续集成](#持续集成)
- [技术栈规范](#技术栈规范)
- [版本库规范](#版本库规范)
- [浏览器兼容规范](#浏览器兼容规范)
- [编码规范](#编码规范)
- [文档规范](#文档规范)
- [UI设计规范](#ui设计规范)
- [测试规范](#测试规范)
- [前后端协作规范](#前后端协作规范)
- [基础库规范](#基础库规范)
- [新成员培训/知识管理](#新成员培训知识管理)
- [示例](#示例)

<!-- /TOC -->

<br>

**什么是规范?**

规范，名词意义上：即明文规定或约定俗成的标准，如：道德规范、技术规范等。 动词意义上：是指按照既定标准、规范的要求进行操作，使某一行为或活动达到或超越规定的标准，如：规范管理、规范操作.

<br>

**为什么需要规范?**

- 降低新成员融入项目的成本, 同时也一定程度避免挖坑
- 提高开发效率、团队协作效率, 降低沟通成本
- 实现高度统一的代码风格，方便review, 另外一方面可以提高项目的可维护性
- 方便自动化

<br>

**规范包含哪些内容?**

如文章题目，前端协作规范并不单单指‘编码规范’，这个规范涉及到前端开发活动的方方面面，例如代码库的管理、前后端协作、代码规范、兼容性规范；其中不仅仅是前端团队内部的协作，一个完整的软件生命周期内，我们需要和产品/设计、后端(或者原生客户端团队)、测试进行协作, 我们需要覆盖这些内容.

下面就介绍，如果我是前端团队的Leader，我会怎么制定前端规范，这个规范需要包含哪些内容:

## 开发工作流规范
 
### 开发

#### **版本规范**

项目的版本号应该根据某些规则进行迭代，这里推荐使用[语义化版本](https://semver.org/lang/zh-CN/)规范, 规则如下:

- 主版本号：当你做了不兼容的 API 修改，
- 次版本号：当你做了向下兼容的功能性新增，
- 修订号：当你做了向下兼容的问题修正。

<br>

#### **代码控制系统规范**

大部分团队都使用git作为版本管理器，管理好代码也是一种学问。尤其是涉及多人并发协作、需要管理多个软件版本的情况下，定义良好的版本库管理规范，可以让大型项目更有组织性，也可以提高成员协作效率.

比较流行的git分支模型/工作流是[git-flow](https://www.git-tower.com/learn/git/ebook/cn/command-line/advanced-topics/git-flow), 但是大部分团队会根据自己的情况制定自己的git工作流规范, 例如我们团队的[分支规范](https://github.com/GDJiaMi/frontend-standards/blob/master/development.md#git-%E5%88%86%E6%94%AF%E6%A8%A1%E5%9E%8B)

Git 有很多工作流方式，这些工作流的选择可能依赖于项目的规模，项目的类型以及团队成员的结构. 比如一个简单的个人项目可能不需要复杂的分支划分，我们的变更都是直接提交到 master 分支。再比如开源项目，除了核心团队成员，其他贡献者是没有提交的权限的，而且我们也需要手段来验证和讨论贡献的代码是否合理。 所以对于开源项目 fork 工作流更为适合. 了解常见的工作流有利于组织或创建适合自己团队的工作流, 提交团队协作的效率:

![](/images/frontend-standard/branch.png)

- [简单的集中式](https://github.com/ivan-94/git-guide/blob/master/branch/centralized.md)
- [基于功能分支的工作流](https://github.com/ivan-94/git-guide/blob/master/branch/feature.md)
- [Fork/Pull Request 工作流](https://github.com/ivan-94/git-guide/blob/master/branch/fork.md)

<br>

#### **提交信息规范**

一个好的提交信息, 会帮助你提高项目的整体质量. 至少具有下面这些优点:

- 格式统一的提交信息可以帮助自动化生成changelog
- 版本库不只是存放代码的仓库, 也记录项目的开发记录. 这些记录应该可以帮助后来者快速地学习和回顾代码. 也应该方便其他协作者review你的代码
- 规范化提交信息可以促进提交者提交有意义的提交

社区上比较流行的提交信息规范是[Angular的提交信息规范](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit), 除此之外，这些也很不错:

- [Atom](https://github.com/atom/atom/blob/master/CONTRIBUTING.md#git-commit-messages)
- [Ember](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-ember)
- [Eslint](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-eslint)
- [JQuery](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-jquery)

这些工具可以帮助你检查提交信息和生成CHANGELOG:

- [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) - 从项目的提交信息中生成CHANGELOG和发布信息
- [commitlint](https://github.com/conventional-changelog/commitlint) - 鞍韂提交信息
- [commitizen](https://github.com/commitizen/cz-cli) - 简单的提交规范和提交帮助工具，推荐
- [standard-changelog](https://github.com/conventional-changelog/commitlint) - angular风格的提交命令行工具 

<br>

#### **发布工作流规范**

发布工作流指的是将‘软件成品’对外发布(如测试或生产)的一套流程, 只有将这套流程实现规范才有利于实现自动化. 

举个例子, 一个典型的发布工作流如下：

- 代码变更 
- 提交代码变更到远程版本库
- 程序通过CI测试(例如Travis变绿)
- 提升package.json中的版本
- 生成CHANGELOG
- 提交package.json和CHANGELOG.md文件
- 打上Tag
- 推送

如果你遵循上面的规范，那么就可以利用社区上现有的工具来自动化这个流程. 这里工具有[conventional-changelog-cli](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli)、[conventional-github-releaser](https://github.com/conventional-changelog/conventional-github-releaser). 实际上自己开发一个也不是特别难的事情.

### 构建

### 持续集成


## 技术栈规范
试点
## 版本库规范
## 浏览器兼容规范
## 编码规范
## 文档规范
## UI设计规范
## 测试规范
Review
单元测试
安全测试
性能测试
异常监控
统计分析
SEO优化测试
## 前后端协作规范
接口规范
  接口测试
文档规范
## 基础库规范

## 新成员培训/知识管理

培训手册
  产品架构与组织架构
  产品研发流程
  工作范围
  建立资源索引
  导师机制
图书库
鼓励写技术博客，建立自己的团队博客
鼓励参与开源项目
定期的专题分享

## 示例