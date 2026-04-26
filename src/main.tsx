import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

//test example
// import { createTree, appendToCurrentBranch, createBranchFrom, buildMessages, getPathTo } from './lib/tree';

// const tree = createTree();
// console.log('空树:', tree);

// let t1 = appendToCurrentBranch(tree, 'user', '第一问');
// t1 = appendToCurrentBranch(t1, 'assistant', '第一答');
// t1 = appendToCurrentBranch(t1, 'user', '第二问');
// t1 = appendToCurrentBranch(t1, 'assistant', '第二答');
// console.log('线性对话后:', t1);
// console.log('路径:', t1.currentPath);
// console.log('给LLM的:', buildMessages(t1));

// // 模拟在第一个 user 节点（id 从 currentPath[1] 获取）进行编辑
// const firstUserNodeId = t1.currentPath[1]; // 根节点后第一个用户节点
// const t2 = createBranchFrom(t1, firstUserNodeId, '修改后的第一问');
// console.log('分支后的树:', t2);
// console.log('新路径:', t2.currentPath);
// console.log('原父节点 childrenIds:', t2.nodes[firstUserNodeId].childrenIds);
// console.log('测试 getPathTo:', getPathTo(t1, t1.currentPath[1]));