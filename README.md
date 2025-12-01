# 测试工程师常用工具箱 (QA Toolbox)

这是一个专为测试工程师 (QA) 设计的在线辅助工具站，提供了一系列日常工作中常用的工具，如 JSON 格式化、时间戳转换、URL 解析、正则测试、数据生成等。

## ✨ 功能特性

*   **数据 & 格式**: JSON 格式化/校验/对比/压缩，JSON 互转 XML/YAML/CSV。
*   **时间工具**: 时间戳与日期互转，支持多时区。
*   **HTTP & 网络**: URL 参数解析与重组。
*   **编码 & 加密**: Base64, URL 编码, HTML 实体编码。
*   **文本 & 正则**: 正则表达式实时测试与常用模板。
*   **数据生成**: 随机生成 UUID、模拟用户数据 (姓名/手机/邮箱)、随机字符串。
*   **用户体验**: 响应式设计，支持 **深色/浅色主题** 切换，支持本地收藏常用工具。

## 🚀 如何部署 (自动化版)

本项目已配置 **GitHub Actions**，你只需要上传代码，GitHub 会自动构建并发布。

### 1. 创建仓库并上传代码
1. 在 GitHub 创建新仓库（例如 `qa-toolbox`）。
2. 将本项目所有文件上传到仓库的 `main` 分支。

### 2. 配置 GitHub Pages
1. 进入仓库的 **Settings** (设置)。
2. 在左侧菜单点击 **Pages**。
3. **重要**：在 **Build and deployment** 部分：
   - 将 **Source** 改为 **GitHub Actions** (不是 "Deploy from a branch")。
   - 如果没有 "GitHub Actions" 选项，通常上传代码后稍等片刻，Action 运行成功后会自动识别。或者保持默认，等待 `.github/workflows/deploy.yml` 自动执行。

### 3. 查看部署状态
1. 点击仓库顶部的 **Actions** 标签页。
2. 你应该能看到一个名为 "Deploy to GitHub Pages" 的工作流正在运行。
3. 等待变为绿色对号（✅），点击工作流进入详情，通常会显示生成的网站链接。
4. 访问 `https://<你的用户名>.github.io/<仓库名>/`。

## 🛠️ 本地开发

如果你想在本地电脑上运行：

1. 确保安装了 [Node.js](https://nodejs.org/)。
2. 打开终端，进入项目目录。
3. 运行命令：
   ```bash
   npm install
   npm run dev
   ```
4. 浏览器访问显示的 `http://localhost:5173` 地址。

## 📄 技术栈

*   React 18
*   Vite (构建工具)
*   TypeScript
*   Tailwind CSS (CDN)
*   React Router v6
