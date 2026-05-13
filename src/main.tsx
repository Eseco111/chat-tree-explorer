import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useTreeStore } from './store/useTreeStore';

// 临时暴露 store 给控制台调试（开发环境）
window.__store = useTreeStore;

useTreeStore.getState().initFromStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);