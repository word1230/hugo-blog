---
title: CI从代码规范工具开始
tags: ["CICD"]
categories: ["java","CICD"]
date: 2025-04-25 10:18:36
---
中，我们提到CI 可以帮助我们处理语法/拼写错误，这主要依靠代码规范工具来实现

代码规范工具主要分为：
1. 代码静态检查工具
2. 代码格式化工具

# 代码格式化工具

每个人的编程习惯不同，例如： 在前端开发中，是否加分号，缩进几个空格等。都是不同的风格，要统一这些， 就需要代码格式化工具来统一处理

## prettier

前端流行的是prettier ，

使用：
 1. 安装
	 npm install -D prettier # 安装prettier到devDependencies
 2.  配置
	 在项目根目录创建.prettier.json文件 写入 `{}`  ， 默认会有一套配置方案
 3. 命令行执行prettier
	npx prettier --write .

prettier 也集成到了ide中可以直接使用
如：webstorm 和vscode（插件）等

# 代码静态检查工具

作用是对源代码进行静态分析，发现一些通过规则可找出的错误


# eslint 
前端流行的代码静态检查工具

使用：
1. 安装
	npm init @eslint/config
2. 执行命令eslint./src/*/.{ts,tsx}即可开始第一次的代码静态检查





使用这两个工具即可解决拼写/语法等问题，但是目前还不能自动化，要实现自动进行检查还需要使用git hooks 来构建CI流程


# 总结

使用eslint 和 prettier 可以实现CI中的代码检查和语法检查
但是，没有实现自动化检查，下节我们使用git 让这个流程自动化
