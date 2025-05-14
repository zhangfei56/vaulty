import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import UsageStatsChart from '../components/Stats/UsageStatsChart';

const StatsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const { appUsageStats, loading } = useSelector(
    (state: RootState) => state.stats
  );

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-6">使用统计</h1>

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

      {loading ? (
        <div className="flex justify-center py-12">
          <p>加载中...</p>
        </div>
      ) : appUsageStats.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-4">
          <UsageStatsChart data={appUsageStats} timeRange={timeRange} />
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            暂无使用数据，继续使用应用后将在这里看到统计信息
          </p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">使用健康建议</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-700">
            根据您的使用模式，我们将在这里显示个性化的使用建议，帮助您培养更健康的数字习惯。
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
