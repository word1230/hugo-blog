const util = require('util');
const child_process = require('child_process');
const exec = util.promisify(child_process.exec);

module.exports = async (params) => {
    const { quickAddApi } = params;

    // 1. 获取用户输入的标题
    const title = await quickAddApi.inputPrompt("请输入文章标题");
    if (!title) return;

    // 2. 生成符合 Hugo 要求的文件名（slug 格式）
    const slug = title.toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
    const fileName = `${slug}.md`;

    // 3. 获取 Hugo 项目根目录路径
    const hugoRoot = `D:\BlogFile\hugo\cheems-blog`; // 假设 Hugo 项目在 Obsidian 库上级目录的 /hugo 文件夹
    const contentPath = `content/posts/${fileName}`;

    try {
        // 4. 执行 Hugo 命令
        const { stdout, stderr } = await exec(`hugo new ${contentPath}`, { cwd: hugoRoot });

        // 5. 自动填充 Front Matter（通过模板文件更高效，此处演示代码修改）
        const file = app.vault.getAbstractFileByPath(`../hugo/${contentPath}`);
        await app.vault.modify(file, `---
title: "${title}"
date: ${new Date().toISOString()}
draft: true
---\n\n## 开始写作...`);

        new Notice(`文章创建成功：${fileName}`);
    } catch (error) {
        new Notice(`创建失败：${error.message}`);
        console.error(error);
    }
};