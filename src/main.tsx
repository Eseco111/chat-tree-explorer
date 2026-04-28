import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { useTreeStore } from './store/useTreeStore';
useTreeStore.getState().initFromStorage();

// window.__store = useTreeStore;   // 临时暴露

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
