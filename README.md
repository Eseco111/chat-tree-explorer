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
git commit -m "更新项目说明文档"
查看所有版本
git log --oneline --graph --all
查看目标版本
git checkout a1b2c3d
回到版本
git switch main  