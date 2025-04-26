@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: 配置仓库路径
set "repo_path=D:\BlogFile\hugo\cheems-blog"

:: 生成ISO格式日期（示例：2024-05-26 15:30:45）
for /f "tokens=2 delims==" %%a in ('wmic os get localtime /value') do set "datetime=%%a"
set "commit_date=!datetime:~0,4!-!datetime:~4,2!-!datetime:~6,2! !datetime:~8,2!:!datetime:~10,2!:!datetime:~12,2!"

:: 进入仓库目录
pushd "%repo_path%" 2>nul || (
    echo 错误：仓库路径不存在或无法访问
    pause
    exit /b 1
)

:: 执行Git操作
git add . 
if %errorlevel% neq 0 (
    echo [错误] 添加文件失败
    goto :cleanup
)

git commit -m "vault backup: %commit_date%"
if %errorlevel% neq 0 (
    echo [警告] 没有需要提交的改动 || echo.
)

git push origin main
if %errorlevel% neq 0 (
    echo [错误] 推送失败
    goto :cleanup
)

:cleanup
popd
echo 操作已完成，按任意键关闭...
pause >nul