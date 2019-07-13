---
title: "你需要知道的软件测试类型和常识"
date: 2019/7/10
categories: 前端
---

原文链接: [Types Of Software Testing: Different Testing Types With Details](https://www.softwaretestinghelp.com/types-of-software-testing/)

What are the different Types of Software Testing?
有哪些不同的软件测试类型?

We, as testers are aware of the various types of Software Testing such as Functional Testing, Non-Functional Testing, Automation Testing, Agile Testing, and their sub-types etc.

我们作为测试人员了解很多种不同的软件测试类型，例如功能测试(Functional Test)、非功能测试、自动测试、敏捷测试、以及它们的各种子类型.

Each of us would have come across several types of testing in our testing journey. We might have heard some and we might have worked on some, but not everyone has knowledge about all the testing types.

尽管在我们的测试过程中会接触多各种测试类型, 或者我们可能听说某些测试类型，但是没人敢说精通所有的测试类型.

![](/images/typeof-testing/Types-of-Testing1.jpg)

Each type of testing has its own features, advantages, and disadvantages as well. However, in this article, I have covered mostly each and every type of software testing which we usually use in our day to day testing life.

每个测试类型都有自己的特点、优势和劣势。所以我写这篇文章，科普我们今天最常用到的测试类型. 来吧!

Let’s go and have a look at them.

> 意翻，演绎扩展

## Different Types Of Software Testing


Given below is the list of some common types of Software Testing:
下面是软件测试的通用类型列表

- 功能测试类型:
  - 单元测试(Unit testing)
  - 集成测试(Integration testing)
  - 系统测试(System testing)
  - 健全性测试(Sanity testing)
  - 冒烟测试(Smoke testing)
  - 接口测试(Interface testing)
  - 回归测试(Regression testing)
  - Beta/验收测试(Beta/Acceptance testing)

- 非功能测试类型:
  - 性能测试(Performance Testing)
  - 负载测试(Load testing)
  - 压力测试(Stress testing)
  - 容量测试(Volume testing)
  - 安全测试(Security testing)
  - 兼容性测试(Compatibility testing)
  - 安装测试(Install testing)
  - 恢复测试(Recovery testing)
  - 可靠性测试(Reliability testing)
  - 可用性测试(Usability testing)
  - 一致性测试(Compliance testing)
  - 本地化测试(Localization testing)

Let's see more details about these testing types.
来看看这些测试类型的细节

![](/images/typeof-testing/Types-of-Software-Testing.jpg)

## 0) A/B测试

## 1) Alpha 测试

It is the most common type of testing used in the Software industry. The objective of this testing is to identify all possible issues or defects before releasing it into the market or to the user.

Alpha testing is carried out at the end of the software development phase but before the Beta Testing. Still, minor design changes may be made as a result of such testing. Alpha testing is conducted at the developer’s site. In-house virtual user environment can be created for this type of testing.

**[Alpha测试](https://www.softwaretestinghelp.com/what-is-alpha-testing-beta-testing/)这是软件工程中最常见的测试类型。它的目标就是尽可能地在发布到市场或交付给用户之前找出所有的问题和缺陷**。

Alpha测试一般在开发的末段且在Beta测试之前进行。在这个测试过程中会驱动开发进行一些小(minor)的设计变动. Alpha测试一般在开发者网站进行，即只对开发者或内部用户开放，可以为此类测试创建内部虚拟用户环境。

<br>

一般大型的软件项目都有规范化的软件版本周期:

![](/images/typeof-testing/alpha-testing.png)

- **Pre-alpha**: 有时候软件会在Alpha或Beta版本前先发布Pre-alpha版本, 相比Alpha和Beta，这是一个功能不完整的版本
- **Alpha**: Alpha版本功能还没完善，需要进一步测试。Alpha版本通常会送到开发软件的组织或某群体中的软件测试者作内部测试。
- **Beta**: 一般Beta版本会包含所有功能，但可能又有一些Bug，需要调试反馈。 Beta版本是软件最早对外公开的软件版本，由公众（通常为公司外的第三方开发者和业余玩家）参与测试。
- **Release Candidate(rc)**: 发布候选版本，如果没有出现问题则可发布成为正式的版本。这个版本包含完整且比较稳定的功能

举一个典型的例子, 最近把我坑得有点惨的iOS13的发布计划:

```shell
June 3: iOS 13 beta 1 and first look at WWDC 2019                 # -> WWDC后就可以装的，相当于pre-alpha或Alpha阶段吧
June 17: iOS 13 beta 2 launched for developers
June 24: iOS 13 public beta release date for adventurous testers  # -> 公开Beta版本，相当于上面说的Beta阶段
July 3: iOS 13 developer beta 3 launch with some new features     
July 8: iOS 13 public beta 2 release date
Early September 2019: iOS 13 Golden Master (final dev beta)       # -> 九月初，该发最终Beta版本，相当于进入RC阶段了
Mid-September 2019: iOS 13 likely to launch with new 2019 iPhones # -> 正式版本
```

<br>

现在很多开源项目，已经淡化了软件的版本周期，变成一种持续(Continuous)的、常态化的行为, 例如Firefox:

![](/images/typeof-testing/firefox.png)

<br>

## 2) Acceptance Testing

An acceptance test is performed by the client and verifies whether the end to end the flow of the system is as per the business requirements or not and if it is as per the needs of the end user. Client accepts the software only when all the features and functionalities work as expected.

It is the last phase of the testing, after which the software goes into production. This is also called User Acceptance Testing (UAT).

**[验收测试](https://www.softwaretestinghelp.com/what-is-acceptance-testing/)通常是部署软件之前的最后一个测试操作, 也成为交付测试, 由最终客户执行，他们会验证端到端(end to end)的系统流程是否符合业务需求，以及功能是否是满足最终用户的需求**。只有当所有的特性和功能按照期望的运行，客户才会接受软件

这是测试的最后阶段，在验收测试之后，软件将投入生产环境. 所以它也叫用户验收测试(UAT)

![](/images/typeof-testing/accept.png)

举个例子，验收测试就相当于收快递, 包裹是软件、你就是客户，是验收方，如果货物不符合你的要求，是要退货的。

<br>

## 3) Ad-hoc Testing

The name itself suggests that this testing is performed on an ad-hoc basis i.e. with no reference to the test case and also without any plan or documentation in place for such type of testing. The objective of this testing is to find the defects and break the application by executing any flow of the application or any random functionality.

Ad-hoc testing is an informal way of finding defects and can be performed by anyone in the project. It is difficult to identify defects without a test case but sometimes it is possible that defects found during ad-hoc testing might not have been identified using existing test cases.

Ad-hoc中文应该理解为临时的意思。顾名思义，这种测试是在临时基础上进行的, 有时候也成为随机测试。即没有参考测试用例、没有针对该测试的任何计划和文档。Ad-hoc测试的目的就是**通过执行随意的流程或任意的功能来找出应用的缺陷和问题**

Ad-hoc测试一种非正式的方法，可以由项目中的任何人执行。尽管没有测试用例很难识别缺陷，但是有些时候在Ad-hoc测试期间发现的缺陷可能无法使用现有的测试用例来识别, **也就是说它一般用来发现‘意外’的缺陷**.

<br>

## 4) Accessibility Testing

The aim of accessibility testing is to determine whether the software or application is accessible for disabled people or not. Here disability means deaf, color blind, mentally disabled, blind, old age and other disabled groups. Various checks are performed such as font size for visually disabled, color and contrast for color blindness etc.

**可访问性测试的目的是确定软件或应用程序是否可供残疾人使用**。残疾是指聋人，色盲，智障人士，失明者，老年人和其他残疾人群体。这里会执行各种检查，例如针对视觉残疾的字体大小测试，针对色盲的颜色和对比度测试等等。

不同平台、不同应用类型对可访问性支持情况不太一样，比如iOS相比其他操作系统则更重视可访问, 国外比国内更重视可访问性。

![](/images/typeof-testing/acs.png)

<br>

## 5) Beta Testing

Beta Testing is a formal type of software testing which is carried out by the customer. It is performed in the Real Environment before releasing the product to the market for the actual end users.

Beta testing is carried out to ensure that there are no major failures in the software or product and it satisfies the business requirements from an end-user perspective. Beta testing is successful when the customer accepts the software.

Usually, this testing is typically done by end-users or others. It is the final testing done before releasing an application for commercial purpose. Usually, the Beta version of the software or product released is limited to a certain number of users in a specific area.

So end user actually uses the software and shares the feedback to the company. Company then takes necessary action before releasing the software to the worldwide.

上文Alpha测试已经提及Beta测试, **Beta测试是一种正式的软件测试类型，在将产品发布到市场或者实际最终用户之前，由客户在真实的应用环境中执行**。

执行Beta测试目的是确保软件或产品中没有重大故障，并且满足最终用户的业务需求。当客户接受软件时，Beta测试才算通过。

通常，此类测试由最终用户或其他人完成。这是在将应用发布作为商业用途之前完成的最终测试。通常，发布的软件或产品的Beta版本仅限于特定区域中的特定数量的用户。 
所以最终用户实际使用软件后会将一些问题反馈给公司。公司可以在全面发布之前采取必要的措施。

Beta测试在正式版本之前也可能会迭代进行多次.

<br>

## 6) Back-end Testing

Whenever an input or data is entered on front-end application, it stores in the database and the testing of such database is known as Database Testing or Backend testing. There are different databases like SQL Server, MySQL, and Oracle etc. Database testing involves testing of table structure, schema, stored procedure, data structure and so on.

前端应用输入的数据，一般都会存储在数据库，所以针对数据库的这类测试称为**数据库测试或者后端测试**. 市面有不同的数据库，如SQL Server，MySQL和Oracle等。数据库测试会涉及表结构，模式，存储过程，数据结构等。

In back-end testing GUI is not involved, testers are directly connected to the database with proper access and testers can easily verify data by running a few queries on the database. There can be issues identified like data loss, deadlock, data corruption etc during this back-end testing and these issues are critical to fixing before the system goes live into the production environment

后端测试一般不会涉及GUI，测试人员通过某些手段直接连接到数据库，从而可以容易地运行一些数据库请求来验证数据。通过后端测试可以发现一些数据库问题，比如数据丢失、死锁、数据损坏。这些问题在系统投入生产环境之前进行修复至关重要

<br>

#7) Browser Compatibility Testing

It is a subtype of Compatibility Testing (which is explained below) and is performed by the testing team.

Browser Compatibility Testing is performed for web applications and it ensures that the software can run with the combination of different browser and operating system. This type of testing also validates whether web application runs on all versions of all browsers or not.

这是兼容性测试的子类型，由测试团队执行. **浏览器兼容测试主要针对Web应用，用于确保软件可以在不同浏览器或操作系统中运行; 或者验证Web应用程序是否支持在浏览器的所有版本上运行, 以确定应用最终兼容的范围**.

浏览器兼容测试是前端开发者绕不开的坑。

我们有很多策略来应对浏览器兼容性，比如渐进增强或者优雅降级, 还有制定浏览器兼容规范; 

为了抚平浏览器之间的差异，我们会使用各种特性检测工具(Modernizr), 还有各种polyfill(CSS Normaliz, polyfill/shim, css-autoprefixer); 

当然为了测试跨浏览器，还要一些辅助工具，例如[BrowserStack](https://www.browserstack.com/), 对于我们这些小团队，只能下一堆Portable 浏览器，手工测试了。

- [Cross-Browser Compatibility](http://frontend.turing.io/lessons/module-2/cross-browser-compat.html)

<br>

## 8) Backward Compatibility Testing

 It is a type of testing which validates whether the newly developed software or updated software works well with older version of the environment or not.


Backward Compatibility Testing checks whether the new version of the software works properly with file format created by older version of the software; it also works well with data tables, data files, data structure created by older version of that software. If any of the software is updated then it should work well on top of the previous version of that software.


**向后兼容测试, 用于验证新开发或更新的软件是否能在旧版本的环境中运行**。

向后兼容测试会检查新版软件是否可以正确地处理旧版本软件创建的文件格式。例如新版的Office 2016是否可以打开2012创建的文件。同理也可以检查新版本是否可以兼容旧版本软件创建的数据表、数据文件、数据结构、配置文件。 任何软件更新应该在先前版本的基础之上良好地运行

<br>

## 9) Black Box Testing

 Internal system design is not considered in this type of testing. Tests are based on the requirements and functionality.

Detailed information about the advantages, disadvantages, and types of Black box testing can be seen here.

![](/images/typeof-testing/black-box.png)

黑盒测试不考虑软件的内部系统设计，它基于需求和功能进行测试, 只关心系统的输入/输出以及功能流程。 

换句话说**黑盒测试从用户的角度出发针对软件界面、功能及外部结构进行测试，而不考虑程序内部逻辑结构**.

黑盒测试下面有很多子类，例如集成测试、系统测试、大部分非功能性测试

关于黑盒测试的优缺点，以及测试类型可以看[这里](https://www.softwaretestinghelp.com/black-box-testing/)

<br>

## 10) Boundary Value Testing

This type of testing checks the behavior of the application at the boundary level.

Boundary value Testing is performed for checking if defects exist at boundary values. Boundary value testing is used for testing a different range of numbers. There is an upper and lower boundary for each range and testing is performed on these boundary values.

If testing requires a test range of numbers from 1 to 500 then Boundary Value Testing is performed on values at 0, 1, 2, 499, 500 and 501.

**边界值测试, 测试应用处于边界条件(boundary level)的行为**。很多边界条件程序是很难考虑周到的，所以才有一个专门的测试类型来验证这种情况

边界值测试检查应用处于边界值时是否存在缺陷。边界值测试通常用于测试不同范围的数字, 每个范围都有一个上下边界，边界测试则是针对这些边界值进行测试。 比如数字范围为1-500, 那么边界值测试会在这些值上进行验证: 0、1、2、499、500、501

<br>

## 11) Branch Testing

It is a type of white box testing and is carried out during unit testing. Branch Testing, the name itself suggests that the code is tested thoroughly by traversing at every branch.

这是白盒测试的子类型，在单元测试中实施. 顾名思义，分支测试表示测试要覆盖程序的各种条件分支, 避免遗漏缺陷。分支覆盖是单元测试覆盖率的一个指标之一

<br>

## 12) Comparison Testing

Comparison of a product's strength and weaknesses with its previous versions or other similar products is termed as Comparison Testing.

比较测试，将产品的优点和弱点与旧版本或者同类(竞品)产品进行比较.

比如类似王自如这种数码评测栏目，评测一个手机或者其他数码产品时，一般会横向和友商产品进行比较，有时候也会纵向和上一代产品比较. 

还有一种比较典型的例子就是和行业的领导者比较，比如我们做IM的，会经常和微信比较: '你这个应用的启动速度怎么比微信慢这么多?'

<br>

## 13) Compatibility Testing

It is a testing type in which it validates how software behaves and runs in a different environment, web servers, hardware, and network environment. Compatibility testing ensures that software can run on a different configuration, different database, different browsers, and their versions. Compatibility testing is performed by the testing team.

这是一个大类, **兼容性测试用于验证应用在不同环境、web服务器、硬件、网络条件下的行为**。兼容性测试确保软件可以在不同的配置、不同的数据库、不同的浏览器，以及它们不同的版本下运行。兼容性测试由测试团队实施

<br>

## 14) Component Testing

It is mostly performed by developers after the completion of unit testing. Component Testing involves testing of multiple functionalities as a single code and its objective is to identify if any defect exists after connecting those multiple functionalities with each other.

[组件测试](https://www.guru99.com/component-testing.html)(此组件非GUI组件, 取组合测试可能更好理解一点)，一般也称为模块测试(Module Testing), 一般由开发者在完成单元测试后执行。组件测试将多个功能组合起来作为单一的整体进行测试，目的是发现多个功能在相互连接起来之后的缺陷。

组件测试可大可小，小到函数级别或者类级别的组合，大可以大到几个单独的页面、模块、子系统的组合。

![](/images/typeof-testing/comp.png)

举一个前端例子，将多个页面路由组合起来，测试它们的流程跳转，就属于组件测试。

<br>

## 15) End-to-End Testing

Similar to system testing, End-to-end testing involves testing of a complete application environment in a situation that mimics real-world use, such as interacting with a database, using network communications, or interacting with other hardware, applications, or systems if appropriate.

端到端测试也是一种黑盒测试类型，类似于系统测试. **端到端测试在模拟的、完整的、真实应用环境下模拟真实用户对应用进行测试，比如应用会和数据库交互、会使用网络通信、或者在适当的情况下和其他硬件、应用、系统进行交互**.

当应用是分布式系统或者需要和其他外部系统协同时，端到端测试扮演着非常重要的角色, 它可以全面检查以确保软件在不同平台和环境产品能准确地交互。端到端测试有以下目的:

- 确保应用可以和外部系统之间良好的协调。对于前端来说，是确保页面和后端之间良好协调
- 检查从源系统到目标系统的所有系统流
- 从最终用户角度验证需求
- 识别异构环境中的问题

前端也有很多自动化的端到端测试工具，比如nightwatch，通过它们可以模拟用户对页面进行操作，从而检验整个应用流程是否正常和符合需求。

因为和系统测试很相似，所以他们也被经常拿来[比较](https://www.softwaretestinghelp.com/system-vs-end-to-end-testing/)

<br>

## 16) Equivalence Partitioning


It is a testing technique and a type of Black Box Testing. During this equivalence partitioning, a set of group is selected and a few values or numbers are picked up for testing. It is understood that all values from that group generate the same output.

The aim of this testing is to remove redundant test cases within a specific group which generates the same output but not any defect.

Suppose, application accepts values between -10 to +10 so using equivalence partitioning the values picked up for testing are zero, one positive value, one negative value. So the Equivalence Partitioning for this testing is: -10 to -1, 0, and 1 to 10.

等价划分, 这是一种黑盒测试的测试技术. **通过等价划分，可以将所有的输入数据合理地划分为多个分组，我们只需在每个分组中取一个数据作为测试的输入条件, 这样可以实现用少量代表性的测试数据取得较好的测试结果**.

所以说这个测试的目的: 是在不导致缺陷的前提下，移除指定分组中的重复的用例, 简化测试的工作

![](/images/typeof-testing/part.png)

比如一个程序应用接受-10到+10之间的值，使用等价分区方法可以划分为三个分组: 0、负值、正值. 接下来的测试只需从这个三个分组中取一个成员进行测试, 而不需要-10到+10每个成员都测试一遍.

<br>

## 17) Example Testing

It means real-time testing. Example testing includes the real-time scenario, it also involves the scenarios based on the experience of the testers.

实例测试意味着实时测试。实例测试包含了实时场景、另外还涉及基于测试人员经验的场景。

> 🤔 这里不是特别能理解这个测试类型，所以贴上原文。知道的告诉我呀

<br>

## 18) Exploratory Testing

Exploratory Testing is informal testing performed by the testing team. The objective of this testing is to explore the application and looking for defects that exist in the application. Sometimes it may happen that during this testing major defect discovered can even cause system failure.

During exploratory testing, it is advisable to keep a track of what flow you have tested and what activity you did before the start of the specific flow.

An exploratory testing technique is performed without documentation and test cases.

![](/images/typeof-testing/explorer.png)

探索性测试有点类似于Ad-Hoc测试. 探索性测试是由测试团队进行的非正式测试。此测试的目的是探索应用并查找应用中存在的缺陷。像探险一样，在测试期间是有一定几率发现的重大、甚至可能导致系统故障的缺陷.

在探索性测试期间，建议跟踪记录好测试的流程、以及开始该流程之前的活动记录, 方便复现bug.

探索测试不需要任何文档和测试用例.

<br>

## 20) Functional Testing

This type of testing ignores the internal parts and focuses only on the output to check if it is as per the requirement or not. It is a Black-box type testing geared to the functional requirements of an application. For detailed information about Functional Testing click here.

功能测试是一个大类, 又称为行为测试，  **功能测试会忽略内部实现而关注组件的输出，目的是验证是否符合需求，这是一种面向功能需求的黑盒测试类型**。关于功能测试的细节请看[这里](https://www.softwaretestinghelp.com/guide-to-functional-testing/)

功能测试是相对非功能测试而言的, 功能测试需要关心功能或者业务，需要定制化；而非功能测试则是通用的，比如压力测试、负载测试，这些测试都有通用的工具来支持，很少需要定制化操作.

<br>

## 21) Graphical User Interface (GUI) Testing

The objective of this GUI testing is to validate the GUI as per the business requirement. The expected GUI of the application is mentioned in the Detailed Design Document and GUI mockup screens.

The GUI testing includes the size of the buttons and input field present on the screen, alignment of all text, tables and content in the tables.

It also validates the menu of the application, after selecting different menu and menu items, it validates that the page does not fluctuate and the alignment remains same after hovering the mouse on the menu or sub-menu.

GUI测试的目的是根据业务需求验证GUI。在详细设计文档和GUI模型(UI设计文档)中一般会提到应用期望的GUI.

GUI测试包括测试屏幕上显示的按钮和输入字段的大小、表格中所有文本、表格或内容的对齐规则等等. 如果团队有UI设计规范，还会验证是否符合设计规范

<br>

## 22) Gorilla Testing


Gorilla Testing is a testing type performed by a tester and sometimes by developer the as well. In Gorilla Testing, one module or the functionality in the module is tested thoroughly and heavily. The objective of this testing is to check the robustness of the application.

大猩猩测试是由测试人员执行的测试类型，有时也由开发人员执行。在大猩猩测试中，对模块中的一个模块或功能进行了彻底和严格的测试。原文没有说出大猩猩测试的精髓，大猩猩测试会对一个功能或模块进行重复‘上百次’的测试, 人类根本受不了这样子的测试方式，所以大猩猩测试的另一个别名是‘令人沮丧的测试(Frustrating Testing)’

这种测试的目的是检查应用程序的稳健性(robustness)

<br>

## 23) Happy Path Testing

The objective of Happy Path Testing is to test an application successfully on a positive flow. It does not look for negative or error conditions. The focus is only on the valid and positive inputs through which application generates the expected output.


**乐观路线测试**的目标是在正常流程上成功测试应用。它不会考虑各种负面或异常情况。重点只关注于验证应用在有效和合法输入的条件下生成期望的输出. 

比如银行付款，只考虑账户有钱的正常状态😂

<br>

#24) Incremental Integration Testing

Incremental Integration Testing is a Bottom-up approach for testing i.e continuous testing of an application when a new functionality is added. Application functionality and modules should be independent enough to test separately. This is done by programmers or by testers.


增量集成测试是一种自下而上的测试方法，即在添加新功能时立即集成应用程序进行连续测试。应用程序功能和模块应该足够独立，以便单独测试。这通常由程序员或测试人员完成。

<br>

#25) Install/Uninstall Testing

Installation and uninstallation testing is done on full, partial, or upgrade install/uninstall processes on different operating systems under different hardware or software environment.

安装和卸载测试是在不同硬件或软件环境下的不同操作系统上的进行完整/部分的安装、升级、卸载测试. 常用于桌面端应用

<br>

#26) Integration Testing

Testing of all integrated modules to verify the combined functionality after integration is termed as Integration Testing. Modules are typically code modules, individual applications, client and server applications on a network, etc. This type of testing is especially relevant to client/server and distributed systems.

集成测试是指将所有模块集成之后，验证合并后的功能. 模块通常是代码模块、单个应用、网络上的客户端和服务器应用等等。


![](/images/typeof-testing/ingr.png)

集成测试一般在单元测试之后，所以单元测试是集成测试的基础，没有进行单元测试的集成测试是不靠谱的。所以最简单的形式是：'把两个已经测试过的单元组合成一个组件，测试它们之间的接口'。也就是说**集成测试在单元测试的基础之上，将单元测试中独立的单元合并起来，验证它们的协调性, 合并后的组件又是一个新的‘单元’，这样逐步合并测试，最终形成完整的应用程序**。

这种类型的测试常用于B/S软件和分布式系统。

<br>

#27) Load Testing

It is a type of non-functional testing and the objective of Load testing is to check how much of load or maximum workload a system can handle without any performance degradation.


Load testing helps to find the maximum capacity of the system under specific load and any issues that cause the software performance degradation. Load testing is performed using tools like JMeter, LoadRunner, WebLoad, Silk performer etc.

它是一种非功能性测试，负载测试的目的是检查系统可以承受多少负载而不会降低性能, 或者说确定最大工作负载是多少。

负载测试有助于查找特定负载下系统的最大容量以及导致软件性能下降的任何原因。可以使用JMeter，LoadRunner，WebLoad，Silk执行程序等工具执行负载测试。

![](/images/typeof-testing/perf.png)

负载测试经常和性能测试、压力测试、稳定性等测试联系在一起。如上图(来源于淘宝性能白皮书). 其中TPS(Transation Per Second)指的是每秒钟系统可以处理的交易或事务的数量; Server Resource指的是系统资源占有.

- **性能测试**. 主要位于a-b之间. 在系统设计初期就会规划一个预期目标, 比如给定资源Ax，a点就是性能期望值。也就是说在给定固定资源Ax的情况下，如果TPS可以达到a点甚至更高，就说明系统性能达到或者好于预期. **通过性能测试可以验证系统的处理能力有没有达到预期**
- **负载测试**. 位于b-c之间。对系统不断增加并发请求，直到系统的某项或者多项指标达到安全的临界值，如上图中的c，这个c就是所谓的最大负载量。后面再增加请求压力，系统的处理能力不但不能提高，返回会下降. **通过压力测试可以得出系统最大的安全负载值**
- **压力测试**. 位于c-d之间。在超过安全负载的情况下，继续对系统增加压力，直到达到崩溃点, 即上图的c. **通过压力测试可以得出系统的最大承受能力**
- **稳定性测试**. 位于a-d之间。在a、b、c、d不同的点(代表特定的硬件、软件和网络环境)，让系统运行一段较长的时间，**检测系统在不同条件下的系统运行的稳定性**。

另外也推荐阅读<<大型网站技术架构>>这本书

<br>

## 28) Monkey Testing

Monkey testing is carried out by a tester assuming that if the monkey uses the application then how random input, values will be entered by the Monkey without any knowledge or understanding of the application.

![](/images/typeof-testing/monkey-testing.jpg)

猴子测试是由测试人员进行的，即把自己当成猴子，在没有任何知识背景或者理解应用前提下，随意输入和操作。

猴子测试的目标是通过提供随机输入值/数据来检查应用程序或系统是否崩溃。 猴子是随机执行的，没有测试用例, 也没有必要了解系统的全部功能

The objective of Monkey Testing is to check if an application or system gets crashed by providing random input values/data. Monkey Testing is performed randomly and no test cases are scripted and it is not necessary to


Monkey Testing is performed randomly and no test cases are scripted and it is not necessary to be aware of the full functionality of the system.

<br>

## 29) Mutation Testing

Mutation Testing is a type of white box testing in which the source code of one of the program is changed and verifies whether the existing test cases can identify these defects in the system. The change in the program source code is very minimal so that it does not impact the entire application, only the specific area having the impact and the related test cases should able to identify those errors in the system.

变异测试(或者说可变性测试)是一种白盒测试，这是一种和单元测试反着来的测试类型。

![](/images/typeof-testing/mut.png)

**通常单元测试的思路是通过测试用例来验证代码是否有效可靠，而变异测试是反过来. 它首先更改其中一个程序的源代码，再跑单元测试，如果单元测试通过则可能说明测试用例没有效果，或者测试用例没有覆盖到这处代码变异**. 

所以说变异测试可以反过来验证你的测试用例是否有效, 还有可以帮助我们找出一些无法被当前测试所防止的潜在错误.

<br>

## 30) Negative Testing

 Testers having the mindset of “attitude to break” and using negative testing they validate that if system or application breaks. A negative testing technique is performed using incorrect data, invalid data or input. It validates that if the system throws an error of invalid input and behaves as expected.

否定测试，和乐观路线测试相反, 它要求测试者要具有“打破”常规的态度，考虑各种异常情况, 使用各种邪恶的👿、不怀好意、不合法的操作来测试系统。否定测试会使用不正确的数据、无效数据或输入来进行验证。它验证系统是否可以识别异常情况，并按预期运行。

<br>

## 31) Non-Functional Testing

It is a type of testing for which every organization having a separate team which usually called as Non-Functional Test (NFT) team or Performance team.

Non-functional testing involves testing of non-functional requirements such as Load Testing, Stress Testing, Security, Volume, Recovery Testing etc. The objective of NFT testing is to ensure whether the response time of software or application is quick enough as per the business requirement.

It should not take much time to load any page or system and should sustain during peak load.

每个大型的组织都有一个独立的团队，通常称为非功能测试（NFT）团队或性能团队。

非功能性测试涉及测试非功能性需求，如负载测试、压力测试、安全性、容量，恢复测试等等. NFT测试的目标是确保软件或应用程序的响应时间是否满足业务需求。

例如加载任何页面或系统都不应该花费太多时间，并且在负载峰值期间应该维持良好运行状态。

<br>

## 32) Performance Testing

This term is often used interchangeably with ‘stress' and ‘load' testing. Performance Testing is done to check whether the system meets the performance requirements. Different performance and load tools are used to do this testing.

这个术语通常与“压力”和“负载”测试互换使用。[性能测试](https://en.wikipedia.org/wiki/Software_performance_testing)用于检查系统是否满足性能要求。它会使用不同的性能和负载工具来执行此测试。

[性能测试](https://www.softwaretestinghelp.com/introduction-to-performance-testing-loadrunner-training-tutorial-part-1/)这个范围比较大，**广义上的性能测试包括了上文提到的负载测试、压力测试、稳定性测试、容量测试等等。狭义的性能测试则是指在特定资源条件下，测试系统能否达到期望值, 也就是基线测试(Baseline Test).**

总结一下性能测试的类型:

- **基线测试(Baseline Test)**: 在给定的资源下，测试最佳的性能，用作后续测量的参考‘基线’。注意基线测试和基准测试是有区别的, 这么理解，基准是你想达到的，比如100短跑世界纪录，基线是你的成绩。
- **负载测试(Load Test)**: 在预期峰值的生产负载下测量系统的性能。上文负载测试已经大概介绍了
- **稳定性测试(Endurance Test)**: 在指定负载下，长时间测量系统的稳定性
- **压力测试(Stress Test)**: 测试极端条件下的系统性能

<br>

## 33) Recovery Testing

恢复测试用于验证应用或系统中崩溃或灾难中恢复的程度. 确定系统是否能够在灾难发生后继续运行。

比如应用通过网络电缆接收数据，突然断开了网络电缆的连接, 过一段时间，再插上网线, 系统应该开始恢复由于网络电缆拔出而丢失连接的数据

It is a type of testing which validates that how well the application or system recovers from crashes or disasters.

Recovery testing determines if the system is able to continue the operation after a disaster. Assume that application is receiving data through the network cable and suddenly that network cable has been unplugged.

Sometime later, plug the network cable; then the system should start receiving data from where it lost the connection due to network cable unplugged.

<br>

## 34) Regression Testing

Testing an application as a whole for the modification in any module or functionality is termed as Regression Testing. It is difficult to cover all the system in Regression Testing, so typically automation testing tools are used for these types of testing.

在修改任意模块或者功能后，将应用作为一个整体进行测试，称为回归测试。**回归测试的目的就是验证在软件原有的功能变动后是否保持完整性**. 

![](/images/typeof-testing/bug-fix.gif)

有观点认为回归测试就是回归测试是指重复执行以前的全部或部分相同的测试工作, 其实不是不无道理。而且因为局部修改而牵一发动全身的意外在平时开发中并不少见，这种意外性就是回归测试的存在的目的.

因为在回归测试中很难覆盖所有系统，通常最好使用自动化测试工具进行这些类型的测试。比如每次修改完代码，跑单元测试来确保不影响确保其他软件单元。

在前端中[组件快照测试(Snapshot Testing)](https://jestjs.io/docs/en/snapshot-testing)和一些[CSS UI测试](https://github.com/HuddleEng/PhantomCSS)，都是属于回归测试类型,它们的原理都是和上一次测试生产的结果进行比对，以确保没有意外的修改:

![](/images/typeof-testing/phantomcss.png)

<br>


## 35) Risk-Based Testing (RBT)

In Risk Based Testing, the functionalities or requirements are tested based on their priority. Risk-based testing includes testing of highly critical functionality, which has the highest impact on business and in which the probability of failure is very high.

The priority decision is based on the business need, so once priority is set for all functionalities then high priority functionality or test cases are executed first followed by medium and then low priority functionalities.

The low priority functionality may be tested or not tested based on the available time.

The Risk-based testing is carried out if there is insufficient time available to test entire software and software needs to be implemented on time without any delay. This approach is followed only by the discussion and approval of the client and senior management of the organization.

在基于风险的测试中，功能或需求将根据其优先级进行测试。基于风险的测试会优先测试高度关键的功能，因为这些功能对业务影响最大或者故障概率非常高. 而优先级由业务需求决定，因此一旦为所有功能设置了优先级，则应该首先执行高优先级功能或测试用例，然后再执行低优先级功能。 低优先级功能可以在时间充裕时测试，或者不测试。

**基于风险的测试应该在‘不够时间来测试整个应用，但是又要按时交付软件’的情况下执行**，通常还需要客户和高级管理层的讨论和批准之后才进行

<br>

## 36) Sanity Testing

Sanity Testing is done to determine if a new software version is performing well enough to accept it for a major testing effort or not. If an application is crashing for the initial use then the system is not stable enough for further testing. Hence a build or an application is assigned to fix it.

完整性测试用于确定一个新的软件版本是否可以开始进行正式的测试，如果一个应该在一开始使用时就崩溃，那么就说明系统还不够稳定，没有必要进行下一步测试。这种情况应该打回给开发，以免浪费时间

以我们公司为例:

在软件设计阶段，测试团队就会为编写冒烟测试用例; 开发在提交版本给测试之前会自己跑一下冒烟用例, 确保没有重大故障；将版本提交给测试团队后，测试团队就会先跑一下完整性测试，检查一下有没有重大的，影响测试进程的bug，如果有则退回开发，没有则进行冒烟测试，如果冒烟测试没有通过也会立即打回开发。顺利通过完整性测试和冒烟测试之后才会进入正式测试阶段。

这么做的目的之一就是为了降低测试团队的工作负担，因为他们要对接多个开发团队的测试任务。

<br>

## 37) Security Testing

It is a type of testing performed by a special team of testers. A system can be penetrated by any hacking way.

Security Testing is done to check how the software or application or website is secure from internal and external threats. This testing includes how much software is secure from the malicious program, viruses and how secure and strong the authorization and authentication processes are.

It also checks how software behaves for any hackers attack and malicious programs and how software is maintained for data security after such a hacker attack.

安全也是一个庞大的学科，而且知识每天都在更新，所以安全测试一般由特殊的安全团队执行，他们以各种黑客手段对系统进行渗透测试。

安全测试旨在确保应用或网站免受内部和外部威胁的侵害。这个测试包括预防恶意程序、病毒； 检验授权和身份验证过程的安全性。

它还会检查软件对任何黑客攻击和恶意程序的反应方式，以及在遭到黑客攻击后如何维护软件以保护数据安全

<br>

## 38) Smoke Testing

Whenever a new build is provided by the development team then the software testing team validates the build and ensures that no major issue exists.

The testing team ensures that the build is stable and a detailed level of testing is carried out further. Smoke Testing checks that no show stopper defect exists in the build which will prevent the testing team to test the application in detail.

If testers find that the major critical functionality is broken down at the initial stage itself then testing team can reject the build and inform accordingly to the development team. Smoke Testing is carried out to a detailed level of any functional or regression testing.

冒烟测试，每当开发团队提交新的构建时，软件测试团队就会先验证构建, 并确保不存在重大问题, 如果存在重大问题会直接打回开发团队.

测试团队在确保构建稳定后才会进一步执行详细的测试。 冒烟检查会检查构建中是否存在中断缺陷(stopper defect, 即影响继续测试的缺陷)，这将阻止测试团队进一步详细测试。 即如果测试人员发现主要功能不能工作，他们会拒绝这次构建，并退回给开发团队。

冒烟测试一般在回归测试或其他详细测试之前进行

<br>

## 39) Static Testing

Static Testing is a type of testing which is executed without any code. The execution is performed on the documentation during the testing phase. It involves reviews, walkthrough, and inspection of the deliverables of the project. Static testing does not execute the code instead of the code syntax, naming conventions are checked.

The static testing is also applicable for test cases, test plan, design document. It is necessary to perform static testing by the testing team as the defects identified during this type of testing are cost-effective from the project perspective.

静态测试有点类似于代码Review，在不执行任何代码的情况下执行(也就是不运行应用)，它涉及对可交付成果审查(inspection)、review和演练(walkthrough). 比如检查代码语法、命名约定、项目组织。

静态测试不仅适用于代码, 也适用于测试用例、测试计划和设计文档. 如果在静态测试阶段发现缺陷，可以将缺陷成本降到最低。比如在设计阶段就发现问题，相比到开发阶段甚至到生产环境出现问题要好解决

举前端的例子，静态测试可能包括:

- 使用Lint工具对程序进行规范检查，相关的工具有ESLint、TSLint、Stylint等, 甚至Typescript这些类型检查器也可以归到这个范畴
- 代码Review。有一些问题是无法通过Lint工具覆盖的，比如代码逻辑、异常捕获、项目组织、内存泄露等等，这些需要人工进行走查Review
- 检查代码是否与设计一致，是否符合软件需求、概要和详细设计，这不仅可以看出代码问题，也可以反过来更早发现需求或设计是否正确。

<br>

## 40) Stress Testing

This testing is done when a system is stressed beyond its specifications in order to check how and when it fails. This is performed under heavy load like putting large number beyond storage capacity, complex database queries, continuous input to the system or database load.

**通过压力测试，模拟系统受到超出其规格的压力时失败的方式和时间, 找出系统的崩溃点**. 这个测试在高负载情况下执行的，例如存取超过容量限制的数据、执行复杂的数据库查询、连续暴力输入到系统或加载到数据库。

<br>

## 41) System Testing

Under System Testing technique, the entire system is tested as per the requirements. It is a Black-box type testing that is based on overall requirement specifications and covers all the combined parts of a system.

系统测试在完整的集成系统上进行测试，也就是说**系统测试一般在集成测试之后进行，集成测试之后系统成为了一个整体，系统测试在这个基础上、在真实的运行环境中验证系统是否符合业务需求**。 这是一种黑盒型测试，基于总体需求规范，涵盖系统的所有组合部分。

系统测试其实不是一个具体的测试技术，而是一个测试阶段。 这个阶段会进行很多种测试，一般公司的测试团队的工作就集中在这一块。 一般包含:

- **功能测试**: 即上面讲的，从系统的整体上测试是否符合业务需求
- **各种非功能测试**：例如恢复测试、性能测试、压力测试、安全测试等等。

归纳一下**系统测试的目的**:

- 确保应用**作为一个整体**可以良好地运行.
- 确保应用符合业务需求
- 确保应用在真实的环境可以良好地运行。比如进行一些非功能测试，验证系统的健壮性

其实系统测试和上文说的端到端测试很像，它们要求系统作为一个整体进行测试。可以简单展开对比一下

| | 系统测试 | 端到端测试 |
|---|-----|------|
|测试范围 | 一般针对被测应用本身 | 一般针对被测应用以及其依赖的其他系统。正如其名，端到端，即从一端点到另一端点。重点关注前端、后端以及中间件之间的处理流程 |
| 测试类型 | 包含功能测试和非功能测试 | 一般涵盖所有源系统和目标系统之间的接口级别的测试 |
| 测试时机 | 一般在集成测试之后 | 一般在系统测试之后|

<br>

## 42) Unit Testing

Testing of an individual software component or module is termed as Unit Testing. It is typically done by the programmer and not by testers, as it requires a detailed knowledge of the internal program design and code. It may also require developing test driver modules or test harnesses.

**测试独立的软件单元或模块称为单元测试**。它通常由开发者完成，而不是由测试人员完成，因为它需要详细了解内部程序设计和代码。

单元测试是和我们开发者最密切相关的测试类型。它的测试对象是软件单元。**软件单元可以是一个函数/方法、一个类或者一个GUI组件等**。

这是一种白盒测试，所以要求由开发者自己进行，因为只有开发者才知道单元的内部实现。**单元测试一般会使用测试覆盖率来验证单元测试的完成度**. 

<br>

## 43) Usability Testing

Under Usability Testing, User-friendliness check is done. Application flow is tested to know if a new user can understand the application easily or not, Proper help documented if a user gets stuck at any point. Basically, system navigation is checked in this testing.

可用性测试用于检测应用的用户友好程度(User-friendliness). 它会验证新用户受可以轻松理解应用流程，如果用户陷入麻烦，测试人员要记录好并提供帮助。可以认为可用性测试是在检查系统的导航性(navigation)

<br>

## 44) Vulnerability Testing

The testing which involves identifying of weakness in the software, hardware and the network is known as Vulnerability Testing. Malicious programs, the hacker can take control of the system, if it is vulnerable to such kind of attacks, viruses, and worms.

So it is necessary to check if those systems undergo Vulnerability Testing before production. It may identify critical defects, flaws in the security.

漏洞测试，涉及识别软件、硬件和网络中的漏洞。如果漏洞容易受到攻击，或者容易受到病毒和蠕虫感染，黑客或恶意程序就可以控制系统。

因此有必要在投入生产环境之前检查这些系统是否存在漏洞。

<br>

## 45) Volume Testing

Volume testing is a type of non-functional testing performed by the performance testing team.

The software or application undergoes a huge amount of data and Volume Testing checks the system behavior and response time of the application when the system came across such a high volume of data. This high volume of data may impact the system’s performance and speed of the processing time.

容量测试是由性能测试团队执行的一种非功能测试。容量测试会检查应用程序遇到大量的数据时的系统行为和响应时间。这种大量数据可能会影响系统的性能和处理时间的速度。

<br>

## 46) White Box Testing

White Box testing is based on the knowledge about the internal logic of an application's code.

It is also known as Glass box Testing. Internal software and code working should be known for performing this type of testing. Under these tests are based on the coverage of code statements, branches, paths, conditions etc.

白盒测试基于应用程序代码的内部逻辑。它也被称为玻璃盒测试。测试人员应该知道内部软件和代码是如何工作的。上面提到的单元测试就是典型的白盒测试

<br>

## 总结

| 测试类型(执行顺序) | xxx |
|--------|-----|
| 执行人员| xx|
| 目的| xxx|
| 白盒|
|黑盒|
| 阶段 | 设计 | 开发 | 测试 | 生产

Conclusion

上面提到的软件测试类型只是测试中的一部分，实际有超过100种的测试类型，但是并非所有测试类型都会被所有项目使用，所以我这里只是列举一些比较常见的软件测试类型。

另外不同的组织中可能会有不同的定义或过程，但是基本概念在任何地方都是相同的。当项目、需求和范围发生变化时，这些测试类型、过程及其实现方法会不断演变

The above-mentioned Software Testing Types are just a part of testing. However, there is still a list of more than 100+ types of testing, but all testing types are not used in all types of projects. So I have covered some common Types of Software Testing which are mostly used in the testing life cycle.

Also, there are alternative definitions or processes used in different organizations, but the basic concept is the same everywhere. These testing types, processes, and their implementation methods keep changing as and when the project, requirements, and scope changes.
