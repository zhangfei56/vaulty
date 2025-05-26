import React, { useState } from 'react';
// import { useSelector } from 'react-redux';
// import { RootState } from '../store';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const SettingsPage: React.FC = () => {
  const [aiModel, setAiModel] = useState<'openai' | 'local'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const isWebPlatform = !Capacitor.isNativePlatform();

  const handleSaveSettings = () => {
    // 实现保存设置的逻辑
    alert('设置已保存');
  };

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">AI 设置</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">AI 模型选择</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="aiModel"
                    value="openai"
                    checked={aiModel === 'openai'}
                    onChange={() => setAiModel('openai')}
                  />
                  <span className="ml-2">OpenAI API</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio"
                    name="aiModel"
                    value="local"
                    checked={aiModel === 'local'}
                    onChange={() => setAiModel('local')}
                  />
                  <span className="ml-2">本地模型</span>
                </label>
              </div>
            </div>

            {aiModel === 'openai' && (
              <div>
                <label className="block text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入您的 API Key"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">应用设置</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">启用通知</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={() =>
                    setNotificationsEnabled(!notificationsEnabled)
                  }
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">深色模式</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">自动同步数据</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={() => setAutoSync(!autoSync)}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">数据管理</h2>
          <div className="space-y-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
              导出我的数据
            </button>

            <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md">
              清除所有数据
            </button>
          </div>

          {isWebPlatform && (
            <div className="border-t pt-3">
              <Link
                to="/mock-data"
                className="flex items-center justify-between text-blue-600 hover:text-blue-800"
              >
                <span>模拟数据管理</span>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  Web 开发
                </span>
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={handleSaveSettings}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
        >
          保存设置
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
