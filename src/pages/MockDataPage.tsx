import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format, addDays, subDays } from 'date-fns';
import {
  generateMockData,
  generatePastDaysMockData,
  initMockData,
  // fetchDailyUsageStats,
  fetchHourlyUsageStats,
  fetchDailyTopApps,
} from '../store/statsSlice';
import { RootState, AppDispatch } from '../store';
import { Capacitor } from '@capacitor/core';
import HourlyUsageChart from '../components/Stats/HourlyUsageChart';
import TopAppsList from '../components/Stats/TopAppsList';

/**
 * 模拟数据管理页面
 * 仅在Web环境下使用，用于生成测试数据
 */
const MockDataPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { error, hourlyStats, dailyTopApps } = useSelector(
    (state: RootState) => state.stats
  );
  const [singleDate, setSingleDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [startDate, setStartDate] = useState<string>(
    format(subDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [pastDays, setPastDays] = useState<number>(30);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [activeTab, setActiveTab] = useState<'generate' | 'preview'>(
    'generate'
  );
  const [processingData, setProcessingData] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [generatedDatesCount, setGeneratedDatesCount] = useState<number>(0);

  // 是否在本机平台
  const isNative = Capacitor.isNativePlatform();

  // 当选择的日期变化时加载数据
  useEffect(() => {
    if (activeTab === 'preview') {
      loadDataForDate(selectedDate);
    }
  }, [selectedDate, activeTab]);

  // 加载选定日期的数据
  const loadDataForDate = async (date: string) => {
    setLoadingPreview(true);
    setPreviewError(null);

    try {
      // 短暂延迟确保数据库操作完成
      setTimeout(async () => {
        try {
          // 先检查是否有当日数据，如果没有则先生成
          console.log('加载日期数据:', date);
          await dispatch(fetchHourlyUsageStats(date)).unwrap();
          await dispatch(fetchDailyTopApps({ date, limit: 10 })).unwrap();
          setLoadingPreview(false);
        } catch (error) {
          console.error('加载预览数据失败:', error);
          setPreviewError('加载数据失败，可能是数据不存在，请先生成数据');
          setLoadingPreview(false);
        }
      }, 300);
    } catch (err) {
      console.error('加载数据失败:', err);
      setPreviewError('加载数据时出错');
      setLoadingPreview(false);
    }
  };

  // 如果是本机平台，显示不支持提示
  if (isNative) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto bg-yellow-50 p-6 rounded-lg shadow-sm">
          <h1 className="text-xl font-bold text-yellow-800 mb-4">
            不支持的平台
          </h1>
          <p className="text-yellow-700">
            模拟数据生成功能仅在Web开发环境可用，本机平台请使用真实设备数据。
          </p>
        </div>
      </div>
    );
  }

  // 生成单日模拟数据
  const handleGenerateSingleDay = async () => {
    setSuccessMessage('');
    setProcessingData(true);

    try {
      await dispatch(generateMockData(singleDate)).unwrap();
      setSuccessMessage(`已成功为 ${singleDate} 生成模拟数据`);
      setSelectedDate(singleDate);
      setGeneratedDatesCount((prev) => prev + 1);

      // 自动切换到预览标签
      setTimeout(() => {
        setActiveTab('preview');
        loadDataForDate(singleDate);
      }, 500);
    } catch (err) {
      console.error('生成数据失败:', err);
      setSuccessMessage(
        `生成数据时出错: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setProcessingData(false);
    }
  };

  // 生成日期范围内的模拟数据
  const handleGenerateDateRange = async () => {
    setSuccessMessage('');
    setProcessingData(true);

    try {
      // 逐天生成数据
      const start = new Date(startDate);
      const end = new Date(endDate);
      let currentDate = new Date(start);
      let count = 0;

      while (currentDate <= end) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        await dispatch(generateMockData(dateStr)).unwrap();
        currentDate = addDays(currentDate, 1);
        count++;
      }

      setSuccessMessage(
        `已成功为 ${startDate} 至 ${endDate} 生成模拟数据，共${count}天`
      );
      setSelectedDate(endDate);
      setGeneratedDatesCount((prev) => prev + count);

      // 自动切换到预览标签
      setTimeout(() => {
        setActiveTab('preview');
        loadDataForDate(endDate);
      }, 500);
    } catch (err) {
      console.error('生成日期范围数据失败:', err);
      setSuccessMessage(
        `生成数据时出错: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setProcessingData(false);
    }
  };

  // 生成过去N天的模拟数据
  const handleGeneratePastDays = async () => {
    setSuccessMessage('');
    setProcessingData(true);

    try {
      await dispatch(generatePastDaysMockData(pastDays)).unwrap();
      const today = format(new Date(), 'yyyy-MM-dd');
      setSuccessMessage(`已成功为过去 ${pastDays} 天生成模拟数据`);
      setSelectedDate(today);
      setGeneratedDatesCount((prev) => prev + pastDays);

      // 自动切换到预览标签
      setTimeout(() => {
        setActiveTab('preview');
        loadDataForDate(today);
      }, 500);
    } catch (err) {
      console.error('生成过去天数数据失败:', err);
      setSuccessMessage(
        `生成数据时出错: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setProcessingData(false);
    }
  };

  // 一键初始化模拟数据
  const handleInitializeAll = async () => {
    setSuccessMessage('');
    setProcessingData(true);

    try {
      await dispatch(initMockData()).unwrap();
      const today = format(new Date(), 'yyyy-MM-dd');
      setSuccessMessage('已成功初始化所有模拟数据（过去30天）');
      setSelectedDate(today);
      setGeneratedDatesCount((prev) => prev + 30);

      // 自动切换到预览标签
      setTimeout(() => {
        setActiveTab('preview');
        loadDataForDate(today);
      }, 500);
    } catch (err) {
      console.error('初始化数据失败:', err);
      setSuccessMessage(
        `生成数据时出错: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setProcessingData(false);
    }
  };

  // 将毫秒格式化为可读时间
  // const formatTimeMs = (ms: number): string => {
  //   const seconds = Math.floor(ms / 1000);
  //   const minutes = Math.floor(seconds / 60);
  //   const hours = Math.floor(minutes / 60);

  //   if (hours > 0) {
  //     return `${hours}小时${minutes % 60}分钟`;
  //   } else if (minutes > 0) {
  //     return `${minutes}分钟${seconds % 60}秒`;
  //   } else {
  //     return `${seconds}秒`;
  //   }
  // };

  // 手动刷新数据
  const handleRefreshData = () => {
    loadDataForDate(selectedDate);
  };

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">模拟数据管理</h1>

        <div className="bg-blue-50 p-4 rounded-lg mb-8">
          <h2 className="text-lg font-medium text-blue-800">提示</h2>
          <p className="text-blue-700 mt-1">
            此功能仅在Web开发环境可用，用于生成模拟的应用使用数据以便测试。
            所有生成的数据将保存在浏览器的IndexedDB中。
          </p>
          {generatedDatesCount > 0 && (
            <div className="mt-2 bg-blue-100 rounded-md p-2 text-blue-800">
              <span>本次已生成模拟数据：{generatedDatesCount}天</span>
            </div>
          )}
        </div>

        {/* 标签导航 */}
        <div className="mb-6 border-b">
          <div className="flex">
            <button
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'generate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent hover:text-blue-500'
              }`}
              onClick={() => setActiveTab('generate')}
            >
              生成数据
            </button>
            <button
              className={`px-4 py-2 border-b-2 ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent hover:text-blue-500'
              }`}
              onClick={() => {
                setActiveTab('preview');
                loadDataForDate(selectedDate);
              }}
            >
              预览数据
            </button>
          </div>
        </div>

        {successMessage && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              successMessage.includes('出错')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            <p>{successMessage}</p>
          </div>
        )}

        {error && activeTab === 'generate' && (
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <p className="text-red-700">错误: {error}</p>
          </div>
        )}

        {activeTab === 'generate' ? (
          <>
            {/* 生成数据标签内容 */}
            {/* 一键初始化 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">一键初始化</h3>
              <p className="text-gray-600 mb-4">
                快速生成过去30天的应用使用数据，适合首次测试使用。
              </p>
              <button
                onClick={handleInitializeAll}
                disabled={processingData}
                className={`px-4 py-2 rounded-md ${
                  processingData
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {processingData ? '处理中...' : '一键初始化数据'}
              </button>
            </div>

            {/* 生成单日数据 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">生成单日数据</h3>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择日期
                  </label>
                  <input
                    type="date"
                    value={singleDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <button
                  onClick={handleGenerateSingleDay}
                  disabled={processingData}
                  className={`px-4 py-2 rounded-md ${
                    processingData
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {processingData ? '处理中...' : '生成数据'}
                </button>
              </div>
            </div>

            {/* 生成日期范围数据 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">生成日期范围数据</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    max={endDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束日期
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <button
                onClick={handleGenerateDateRange}
                disabled={processingData}
                className={`px-4 py-2 rounded-md ${
                  processingData
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {processingData ? '处理中...' : '生成范围数据'}
              </button>
            </div>

            {/* 生成过去N天数据 */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-lg mb-4">生成过去N天数据</h3>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    过去天数
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={pastDays}
                    onChange={(e) => setPastDays(parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <button
                  onClick={handleGeneratePastDays}
                  disabled={processingData}
                  className={`px-4 py-2 rounded-md ${
                    processingData
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {processingData ? '处理中...' : '生成过去天数数据'}
                </button>
              </div>
            </div>
          </>
        ) : (
          // 预览数据标签内容
          <div>
            <div className="mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center mb-3 md:mb-0">
                  <label htmlFor="date-select" className="mr-2 text-gray-600">
                    选择日期:
                  </label>
                  <input
                    id="date-select"
                    type="date"
                    value={selectedDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRefreshData}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    刷新数据
                  </button>
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    返回生成
                  </button>
                </div>
              </div>
            </div>

            {loadingPreview ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  <p className="text-gray-500 mt-3">加载中...</p>
                </div>
              </div>
            ) : previewError ? (
              <div className="bg-yellow-50 p-6 rounded-lg shadow-sm text-center">
                <h4 className="font-medium text-lg text-yellow-800 mb-2">
                  数据加载出错
                </h4>
                <p className="text-yellow-700 mb-4">{previewError}</p>
                <div className="mt-2 flex justify-center gap-4">
                  <button
                    onClick={handleRefreshData}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    重试
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('generate');
                      setPreviewError(null);
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    转到生成数据
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* 展示数据预览 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 每小时使用统计 */}
                  <div>
                    <HourlyUsageChart hourlyStats={hourlyStats} />
                  </div>

                  {/* 每日应用排行 */}
                  <div>
                    <TopAppsList
                      apps={dailyTopApps}
                      title={`${selectedDate === format(new Date(), 'yyyy-MM-dd') ? '今日' : selectedDate} 应用使用排行`}
                    />
                  </div>
                </div>

                {/* 如果没有数据，显示提示 */}
                {(!hourlyStats ||
                  hourlyStats.every((h) => h.totalDuration === 0)) &&
                  (!dailyTopApps || dailyTopApps.length === 0) && (
                    <div className="bg-yellow-50 p-6 rounded-lg shadow-sm text-center">
                      <h4 className="font-medium text-lg text-yellow-800 mb-2">
                        无可用数据
                      </h4>
                      <p className="text-yellow-700">
                        选定日期没有找到任何数据，请先生成数据或选择其他日期。
                      </p>
                      <button
                        onClick={() => setActiveTab('generate')}
                        className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                      >
                        转到生成数据
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MockDataPage;
