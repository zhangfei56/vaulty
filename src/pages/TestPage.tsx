import React, { useState, useEffect } from 'react';
import { SimpleWebDatabase } from '../services/data-source/SimpleWebDatabase';

const TestPage: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [hourlyStats, setHourlyStats] = useState<any[]>([]);
  const [topApps, setTopApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      try {
        const db = SimpleWebDatabase.getInstance();
        await db.initialize();
        setIsInitialized(true);
        console.log('数据库初始化成功');
      } catch (error) {
        console.error('数据库初始化失败:', error);
      }
    };

    initDb();
  }, []);

  const testGetStats = async () => {
    setLoading(true);
    try {
      const db = SimpleWebDatabase.getInstance();
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const stats = await db.getUsageStats(weekAgoStr, today);
      setStats(stats);
      console.log('获取统计成功:', stats);
    } catch (error) {
      console.error('获取统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const testGetHourlyStats = async () => {
    setLoading(true);
    try {
      const db = SimpleWebDatabase.getInstance();
      const today = new Date().toISOString().split('T')[0];
      const hourlyStats = await db.getHourlyUsageStats(today);
      setHourlyStats(hourlyStats);
      console.log('获取小时统计成功:', hourlyStats);
    } catch (error) {
      console.error('获取小时统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const testGetTopApps = async () => {
    setLoading(true);
    try {
      const db = SimpleWebDatabase.getInstance();
      const today = new Date().toISOString().split('T')[0];
      const topApps = await db.getDailyTopApps(today, 5);
      setTopApps(topApps);
      console.log('获取Top应用成功:', topApps);
    } catch (error) {
      console.error('获取Top应用失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetDatabase = () => {
    const db = SimpleWebDatabase.getInstance();
    db.reset();
    setIsInitialized(false);
    setStats([]);
    setHourlyStats([]);
    setTopApps([]);
    console.log('数据库已重置');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Web数据库测试页面</h1>
      
      <div className="mb-6">
        <p className="text-gray-600">
          数据库状态: {isInitialized ? '已初始化' : '未初始化'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testGetStats}
          disabled={!isInitialized || loading}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded"
        >
          测试获取统计
        </button>

        <button
          onClick={testGetHourlyStats}
          disabled={!isInitialized || loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded"
        >
          测试获取小时统计
        </button>

        <button
          onClick={testGetTopApps}
          disabled={!isInitialized || loading}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-4 py-2 rounded"
        >
          测试获取Top应用
        </button>

        <button
          onClick={resetDatabase}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          重置数据库
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <p>加载中...</p>
        </div>
      )}

      {stats.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">应用使用统计</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {stats.map((stat, index) => (
              <div key={index} className="border-b py-2 last:border-b-0">
                <p className="font-medium">{stat.appName}</p>
                <p className="text-sm text-gray-600">
                  使用时长: {Math.round(stat.totalDuration / 60000)}分钟
                </p>
                <p className="text-sm text-gray-600">
                  使用次数: {stat.usageCount}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hourlyStats.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">每小时使用统计</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-6 gap-2">
              {hourlyStats.map((stat, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 rounded">
                  <p className="font-medium">{stat.hour}:00</p>
                  <p className="text-sm text-gray-600">
                    {Math.round(stat.totalDuration / 60000)}分钟
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {topApps.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Top应用</h2>
          <div className="bg-white rounded-lg shadow p-4">
            {topApps.map((app, index) => (
              <div key={index} className="border-b py-2 last:border-b-0">
                <p className="font-medium">
                  {index + 1}. {app.appName}
                </p>
                <p className="text-sm text-gray-600">
                  使用时长: {Math.round(app.totalDuration / 60000)}分钟
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage; 