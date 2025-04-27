const util = require('util');
const child_process = require('child_process');
const path = require('path');
const exec = util.promisify(child_process.exec);

// Hugo配置（根据实际情况修改）
const HUGO_CONFIG = {
    exePath: path.join('D:', 'BlogFile', 'hugo', 'cheems-blog', 'hugo.exe'), // 完整hugo路径
    contentDir: path.join('content', 'post'), // 新建文章存放目录
    archetype: 'default' // 对应 archetypes/post.md 模板文件
};

module.exports = async (params) => {
    const { quickAddApi } = params;

    try {
        // 1. 获取标题并生成slug
        const title = await quickAddApi.inputPrompt("请输入文章标题");
        if (!title) throw new Error("标题不能为空");
        
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9\u4E00-\u9FA5]/gi, '') // 支持中文
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        // 2. 构建完整命令
        const hugoCmd = `"${HUGO_CONFIG.exePath}" new "${
            path.join(HUGO_CONFIG.contentDir, `${slug}.md`)
        }" --kind ${HUGO_CONFIG.archetype}`;

        // 3. 执行Hugo命令
        const { stdout, stderr } = await exec(hugoCmd, { 
            cwd: path.dirname(HUGO_CONFIG.exePath),
            windowsHide: true 
        });

        // 4. 验证文件创建
        const outputPath = path.join(
            path.dirname(HUGO_CONFIG.exePath),
            HUGO_CONFIG.contentDir,
            `${slug}.md`
        );
        
        new Notice(`文章创建成功：${outputPath}`);
        return outputPath;

    } catch (error) {
        console.error(`创建失败: ${error.message}`);
        new Notice(`创建失败: ${error.message}`);
        throw error;
    }
};