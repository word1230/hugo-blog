const { exec } = require('node:child_process');
const util = require('node:util');
const execPromise = util.promisify(exec);
const path = require('node:path');

// 配置仓库路径
const repoPath = path.resolve('D:/BlogFile/hugo/cheems-blog');

async function runGitCommand(command, errorMsg) {
    try {
        const { stdout } = await execPromise(command, { cwd: repoPath });
        console.log(stdout);
        return true;
    } catch (err) {
        console.error(`[错误] ${errorMsg}:`, err.stderr || err.message);
        process.exit(1);
    }
}

async function main() {
    // Step 1: git add
    await runGitCommand('git add .', '添加文件失败');

    // Step 2: git commit
    const commitMsg = `vault backup: ${new Date().toISOString()}`;
    await runGitCommand(`git commit -m "${commitMsg}"`, '提交失败');

    // Step 3: git push
    await runGitCommand('git push origin main', '推送失败');

    console.log('操作成功！');
}

main();