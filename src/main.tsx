import 'reflect-metadata';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { TypeORMManager } from './services/data-source/TypeORMManager';

// 在原生环境中重置数据库连接状态
if (Capacitor.isNativePlatform()) {
  TypeORMManager.resetConnectionState().then(() => {
    console.log('数据库连接状态已重置，准备初始化应用');
  }).catch((error) => {
    console.log('重置数据库连接状态失败（可忽略）:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
