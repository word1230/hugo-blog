---
title: git构建本地CI流程
date: 2025-04-26 16:26:12
tags: ["CICD"]
categories: ["java","CICD"]
---
上一节我们实现了使用代码规范工具检查代码，这一节我们使用git 将检查代码这一步融入我们的工作流中，实现自动检查


git 运行的每个阶段都暴露生命周期的调用方法，可以使用hooks文件插入我们想要执行的shell命令。
比如我们要在提交之前做一些事情， 就可以创建 .git/hooks/pre-commit文件，写入shell命令就可以在提交前执行特定操作， 如执行代码检查命令

但是一般.git 文件不会提交到远程仓库，意味着各个节点不能同步这些hook 文件
我们可以使用 husky工具
`npm install husky --save-dev
在package.json文件中添加安装脚本，手动执行npm run prepare
```
"scripts": {
    "prepare": "husky install",
}
```


那么要在提交前自动进行代码检查，只需要在hooks 文件中写入命令
```
eslint --fix
prettier --write
```
