import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { RootState, AppDispatch } from '../store';
import {
  fetchAppUsageStats,
  fetchHourlyUsageStats,
  fetchDailyTopApps,
  setDateRange,
  setSelectedDate,
  generateMockData,
  syncAppUsageData,
  checkPermission,
  requestPermission,
} from '../store/statsSlice';
import UsageStatsChart from '../components/Stats/UsageStatsChart';
import HourlyUsageChart from '../components/Stats/HourlyUsageChart';
import TopAppsList from '../components/Stats/TopAppsList';
import { Capacitor } from '@capacitor/core';

const StatsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const {
    appUsageStats,
    hourlyStats,
    dailyTopApps,
    loading,
    error,
    selectedDate,
    // selectedDateRange,
    hasPermission,
  } = useSelector((state: RootState) => state.stats);

  // 当日期改变时，更新数据
  useEffect(() => {
    const loadData = async () => {
      if (!Capacitor.isNativePlatform()) {
        // Web环境: 生成模拟数据
        setIsGeneratingData(true);
        try {
          await dispatch(generateMockData(selectedDate)).unwrap();
          console.log('模拟数据生成完成:', selectedDate);
        } catch (err) {
          console.error('生成模拟数据失败:', err);
        } finally {
          setIsGeneratingData(false);
        }
      } else {
        // 原生环境: 检查权限并同步真实使用数据
        setIsCheckingPermission(true);
        try {
          console.log('检查使用统计权限...');
          const hasPermissionResult =
            await dispatch(checkPermission()).unwrap();

          if (!hasPermissionResult) {
            console.log('没有权限，尝试请求权限...');
            const requestResult = await dispatch(requestPermission()).unwrap();

            if (!requestResult) {
              throw new Error('用户拒绝授予使用统计权限');
            }
          }

          console.log('权限检查通过，开始同步数据...');
        } catch (err) {
          console.error('权限检查失败:', err);
          setIsCheckingPermission(false);
          return; // 权限失败时不继续同步数据
        } finally {
          setIsCheckingPermission(false);
        }

        // 权限检查通过后，开始同步数据
        setIsSyncingData(true);
        try {
          console.log('开始同步原生使用数据...');
          await dispatch(syncAppUsageData()).unwrap();
          console.log('原生数据同步完成');
        } catch (err) {
          console.error('同步原生数据失败:', err);
        } finally {
          setIsSyncingData(false);
        }
      }

      // 获取每小时使用统计
      dispatch(fetchHourlyUsageStats(selectedDate));

      // 获取当日Top10应用
      dispatch(fetchDailyTopApps({ date: selectedDate, limit: 10 }));
    };

    // 添加短暂延迟确保数据库准备就绪
    const timer = setTimeout(() => {
      loadData();
    }, 300);

    return () => clearTimeout(timer);
  }, [dispatch, selectedDate, retryCount]);

  // 根据时间范围获取使用统计
  useEffect(() => {
    let startDate = '';
    let endDate = format(new Date(), 'yyyy-MM-dd');

    switch (timeRange) {
      case 'day':
        startDate = endDate;
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = format(weekAgo, 'yyyy-MM-dd');
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = format(monthAgo, 'yyyy-MM-dd');
        break;
    }

    dispatch(setDateRange({ startDate, endDate }));
    dispatch(fetchAppUsageStats({ startDate, endDate }));
  }, [dispatch, timeRange]);

  // 处理日期选择
  const handleDateChange = (date: string) => {
    dispatch(setSelectedDate(date));
  };

  // 数据加载失败时重试
  const handleRetry = () => {
    setRetryCount((prev) => prev + 1); // 触发重新加载
  };

  // 获取今天的日期
  const today = format(new Date(), 'yyyy-MM-dd');

  // 如果出现错误，显示错误信息和重试按钮
  if (error) {
    return (
      <div className="py-8 px-4">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            加载数据时出错
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-6">使用统计</h1>

      {/* 时间范围选择 */}
      <div className="mb-6">
        <div className="flex justify-center space-x-4 bg-white rounded-lg p-2 shadow-sm">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'day'
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            今日
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'week'
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            本周
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'month'
                ? 'bg-orange-100 text-orange-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            本月
          </button>
        </div>
      </div>

      {/* Web环境数据生成提示 */}
      {!Capacitor.isNativePlatform() && isGeneratingData && (
        <div className="bg-blue-50 p-3 rounded-lg mb-4 text-center">
          <p className="text-blue-700">正在为Web环境生成模拟数据...</p>
        </div>
      )}

      {/* 原生环境权限检查提示 */}
      {Capacitor.isNativePlatform() && isCheckingPermission && (
        <div className="bg-yellow-50 p-3 rounded-lg mb-4 text-center">
          <p className="text-yellow-700">正在检查使用统计权限...</p>
        </div>
      )}

      {/* 原生环境数据同步提示 */}
      {Capacitor.isNativePlatform() && isSyncingData && (
        <div className="bg-green-50 p-3 rounded-lg mb-4 text-center">
          <p className="text-green-700">正在同步应用使用数据...</p>
        </div>
      )}

      {/* 权限被拒绝的提示 */}
      {Capacitor.isNativePlatform() &&
        hasPermission === false &&
        !isCheckingPermission && (
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <h3 className="text-red-800 font-semibold mb-2">
              需要使用统计权限
            </h3>
            <p className="text-red-700 text-sm mb-3">
              为了显示应用使用统计，需要您授予"使用情况访问权限"。请按以下步骤操作：
            </p>
            <ol className="text-red-700 text-sm list-decimal list-inside space-y-1 mb-3">
              <li>点击下方"授予权限"按钮</li>
              <li>在设置页面中找到本应用</li>
              <li>开启"允许使用情况访问"开关</li>
              <li>返回应用重试</li>
            </ol>
            <button
              onClick={handleRetry}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
            >
              授予权限
            </button>
          </div>
        )}

      {/* 整体使用统计 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <p>加载中...</p>
        </div>
      ) : appUsageStats.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <UsageStatsChart
            data={appUsageStats.map((app) => ({
              appName: app.appName,
              totalTimeMs: app.totalDuration,
              openCount: app.usageCount,
              date: selectedDate,
            }))}
            timeRange={timeRange}
          />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center mb-6">
          <p className="text-gray-500">
            暂无使用数据，继续使用应用后将在这里看到统计信息
          </p>
          {!Capacitor.isNativePlatform() && !isGeneratingData && (
            <button
              onClick={handleRetry}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              生成模拟数据并重试
            </button>
          )}
          {Capacitor.isNativePlatform() && !isSyncingData && (
            <button
              onClick={handleRetry}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            >
              同步使用数据并重试
            </button>
          )}
        </div>
      )}

      {/* 日期选择器 - 仅在"天"视图下显示 */}
      {timeRange === 'day' && (
        <div className="mb-6">
          <div className="flex items-center justify-center bg-white rounded-lg p-3 shadow-sm">
            <label htmlFor="date-select" className="mr-2 text-gray-600">
              选择日期:
            </label>
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => handleDateChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1"
            />
          </div>
        </div>
      )}

      {/* 每小时使用统计和应用排行 */}
      {timeRange === 'day' && (
        <>
          {loading ? (
            <div className="flex justify-center py-6">
              <p>加载中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* 每小时使用统计 */}
              <div>
                <HourlyUsageChart hourlyStats={hourlyStats} />
              </div>

              {/* 每日应用排行 */}
              <div>
                <TopAppsList
                  apps={dailyTopApps}
                  title={`${selectedDate === today ? '今日' : selectedDate} 应用使用排行`}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* 使用健康建议 */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">使用健康建议</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-700">
            根据您的使用模式，我们将在这里显示个性化的使用建议，帮助您培养更健康的数字习惯。
          </p>

          {hourlyStats.some((hour) => hour.hour >= 23 || hour.hour <= 5) && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800">深夜使用提醒</h4>
              <p className="text-blue-700 text-sm mt-1">
                数据显示您有深夜或凌晨使用手机的习惯，这可能会影响您的睡眠质量。建议在睡前1小时内避免使用电子设备。
              </p>
            </div>
          )}

          {dailyTopApps.length > 0 &&
            dailyTopApps[0].totalDuration > 7200000 && (
              <div className="mt-4 bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-amber-800">
                  单应用使用时间过长
                </h4>
                <p className="text-amber-700 text-sm mt-1">
                  您在{dailyTopApps[0].appName}
                  上花费了大量时间。适当休息并分散使用时间可以减少眼睛疲劳。
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
