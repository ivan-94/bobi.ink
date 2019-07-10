---
title: "前端测试的方方面面"
date: 2019/7/10
categories: 前端
---




## 测试的方法

- 白盒
- 黑盒
- 灰盒
- 冒烟

---

## 测试的进程

- Alpha
- Beta
- Gamma

---

## 测试的阶段

软件的生命周期

不同阶段关注点不一样, 环环相扣

开发者 <-----> 用户
白盒 <-------> 黑盒

单元测试：对软件的基本‘单元’的实现进行验证
集成测试: 将软件各个模块、子系统组合起来，检查这些模块之间的接口是否正确
系统测试: 功能测试主要针对包括功能可用性、功能实现程度方面测试。包含功能性测试和非功能性测试: 
 (功能测试和非功能测试) gui

验收测试: 验收通过后上线
上线后的真实用户测试呢 A/B测试

跨域阶段的测试，回归测试


流程图

---

## 持续集成和测试的工作流

## lint, 分析工具，监控, 测试的区别

## 单元测试

开发者接触最多的一个测试级别. 单元测试(Unit Testing)又称为模块测试

### 单元的定义

### 为什么测试

### 测试的方法论

- TDD
- BDD

### 测试的工具

### 测试检验

测试覆盖率

### 面向前端的单元测试

#### 前端测试框架

- 框架
  - Intern
  - Jest
- 断言库
- 模拟/插槽以及辅助测试工具
  - http 模拟
- 管理

#### 测试的环境

- Headless Browsers
- Browser Automation

#### 组件测试


### 最佳实践

如何写更好测试代码

---


## 集成测试

- nightWatch

- 持续集成
  - github-ci
  - gitlab-ci
  - Jenkins

---

## 系统测试

### E2E测试

属于系统测试吗？

模拟用户操作

- Cypress

- [What Is End To End Testing And How To Perform It (Quick Guide)](https://www.softwaretestinghelp.com/what-is-end-to-end-testing/)



### UI测试

### UI回归测试

快照测试, UI快照

- BackstopJS


### 可用性测试

Monkey Test

例如死链检测

#### 兼容测试

跨浏览器，跨平台，跨设备

### 性能测试

lighthouse 算不算测试，它只是一个



Performance Testing:
- benchmark.js
- jsperf.com

### 安全测试


## 冒烟测试


- [软件测试](https://en.wikipedia.org/wiki/Software_testing)