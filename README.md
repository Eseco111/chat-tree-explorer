1.安装node-v24.15.0-x64.msi

2. 启动项目：npm run dev
3. 浏览器访问：http://localhost:（your port）
4. 输入你的 DeepSeek API Key 开始体验

无node_modules情况下
安装依赖：npm install
npm install react react-dom reactflow openai uuid zustand dagre react-markdown
npm install -D typescript @types/react @types/react-dom @types/uuid @types/dagre @vitejs/plugin-react vite tailwindcss postcss autoprefixer @tailwindcss/typography



提交
git add .
git commit -m "final 3.5"
查看所有版本
如果你不仅想放弃更改，还想删除所有新增的、从未被 Git 跟踪过的文件，就需要组合使用命令。

执行硬重置：此命令会将你的暂存区和工作区都恢复到最近一次提交的状态，丢弃所有未提交的更改。

bash
git reset --hard HEAD
清理未跟踪文件：这个命令会删除所有未被 Git 跟踪的文件和目录。

bash
git clean -fd

git add .
git commit -m "v3.3"  
git push origin main  

https://eseco111.github.io/chat-tree-explorer/


GIT操作

1.找到目标旧版本的 commit ID
git log --oneline

2.基于该 commit 创建并切换到新分支
git checkout -b old-version-branch a1b2c3d
或（新版 Git 推荐）：
git switch -c old-version-branch a1b2c3d

回到最新版本：
git checkout main
或
git switch main