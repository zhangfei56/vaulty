import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import UsageStatsChart from '../components/Stats/UsageStatsChart';
import HourlyUsageChart from '../components/Stats/HourlyUsageChart';
import TopAppsList from '../components/Stats/TopAppsList';
import '../components/Stats/StatsMobile.css';

const MobileTestPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  // 模拟数据
  const mockAppUsageData = [
    {
      appName: '微信',
      totalTimeMs: 7200000, // 2小时
      openCount: 15,
      date: '2024-01-15',
    },
    {
      appName: '抖音',
      totalTimeMs: 5400000, // 1.5小时
      openCount: 8,
      date: '2024-01-15',
    },
    {
      appName: '支付宝',
      totalTimeMs: 1800000, // 30分钟
      openCount: 5,
      date: '2024-01-15',
    },
    {
      appName: '淘宝',
      totalTimeMs: 3600000, // 1小时
      openCount: 12,
      date: '2024-01-15',
    },
    {
      appName: 'QQ',
      totalTimeMs: 2700000, // 45分钟
      openCount: 20,
      date: '2024-01-15',
    },
  ];

  const mockHourlyStats = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    totalDuration: Math.floor(Math.random() * 300000) + 50000, // 1-6分钟随机
    apps: []
  }));

  const mockTopApps = [
    {
      packageName: 'com.tencent.mm',
      appName: '微信',
      totalDuration: 7200000,
      usageCount: 15,
      lastUsed: Date.now(),
      icon: undefined,
    },
    {
      packageName: 'com.ss.android.ugc.aweme',
      appName: '抖音',
      totalDuration: 5400000,
      usageCount: 8,
      lastUsed: Date.now(),
      icon: undefined,
    },
    {
      packageName: 'com.eg.android.AlipayGphone',
      appName: '支付宝',
      totalDuration: 1800000,
      usageCount: 5,
      lastUsed: Date.now(),
      icon: undefined,
    },
    {
      packageName: 'com.taobao.taobao',
      appName: '淘宝',
      totalDuration: 3600000,
      usageCount: 12,
      lastUsed: Date.now(),
      icon: undefined,
    },
    {
      packageName: 'com.tencent.mobileqq',
      appName: 'QQ',
      totalDuration: 2700000,
      usageCount: 20,
      lastUsed: Date.now(),
      icon: undefined,
    },
  ];

  return (
    <div className="py-2 px-2">
      <h1 className="text-xl font-bold mb-4 px-2">移动设备测试页面</h1>
      
      <div className="mb-4 px-2">
        <p className="text-sm text-gray-600 mb-2">
          当前平台: {Capacitor.isNativePlatform() ? '原生平台' : 'Web平台'}
        </p>
        <p className="text-sm text-gray-600">
          屏幕宽度: {window.innerWidth}px
        </p>
      </div>

      {/* 时间范围选择 */}
      <div className="mb-4 px-2">
        <div className="time-range-selector">
          <button
            onClick={() => setTimeRange('day')}
            className={`time-range-button ${timeRange === 'day' ? 'active' : ''}`}
          >
            今日
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`time-range-button ${timeRange === 'week' ? 'active' : ''}`}
          >
            本周
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`time-range-button ${timeRange === 'month' ? 'active' : ''}`}
          >
            本月
          </button>
        </div>
      </div>

      {/* 使用统计图表 */}
      <div className="mb-4 mx-2">
        <UsageStatsChart
          data={mockAppUsageData}
          timeRange={timeRange}
        />
      </div>

      {/* 每小时使用统计和应用排行 */}
      <div className="stats-grid mx-2">
        <div>
          <HourlyUsageChart hourlyStats={mockHourlyStats} />
        </div>
        <div>
          <TopAppsList
            apps={mockTopApps}
            title="今日应用使用排行"
          />
        </div>
      </div>

      {/* 响应式测试信息 */}
      <div className="mt-6 mx-2">
        <h2 className="text-lg font-semibold mb-3">响应式测试</h2>
        <div className="stats-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-xs text-gray-600">小屏幕 (手机)</p>
              <p className="text-sm font-bold text-blue-600">单列布局</p>
            </div>
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-xs text-gray-600">中等屏幕 (平板)</p>
              <p className="text-sm font-bold text-green-600">双列布局</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-md">
              <p className="text-xs text-gray-600">大屏幕 (桌面)</p>
              <p className="text-sm font-bold text-purple-600">多列布局</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileTestPage; 