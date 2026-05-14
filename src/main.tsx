import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useTreeStore } from './store/useTreeStore';

// 可选：仅在开发环境暴露 store 到控制台
if (import.meta.env.DEV) {
  window.__store = useTreeStore;   // 不再需要 as any
}

// 等待 IndexedDB 初始化完成后再渲染，避免闪烁
const rootElement = document.getElementById('root')!;

useTreeStore
  .getState()
  .initFromStorage()
  .then(() => {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  })
  .catch((err) => {
    console.error('应用初始化失败:', err);
    // 即使失败也渲染一个基础界面，避免完全白屏
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });