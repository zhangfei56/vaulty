import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface AppUsage {
  appName: string;
  totalTimeMs: number;
  openCount: number;
  date: string;
}

interface Props {
  data: AppUsage[];
  timeRange: 'day' | 'week' | 'month';
}

const UsageStatsChart: React.FC<Props> = ({ data, timeRange }) => {
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartInstance = useRef<Chart | null>(null);
  const pieChartInstance = useRef<Chart | null>(null);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 根据选择的时间范围过滤和分组数据
  const prepareData = () => {
    // 按应用名称汇总使用时长
    const appUsageMap = new Map<string, number>();
    const appOpenCountMap = new Map<string, number>();

    // 过滤当前时间范围的数据
    const filteredData = filterDataByTimeRange(data, timeRange);

    filteredData.forEach((item) => {
      const prevTime = appUsageMap.get(item.appName) || 0;
      appUsageMap.set(item.appName, prevTime + item.totalTimeMs);

      const prevCount = appOpenCountMap.get(item.appName) || 0;
      appOpenCountMap.set(item.appName, prevCount + item.openCount);
    });

    // 转换为图表数据格式
    const sortedApps = Array.from(appUsageMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // 只取前10个应用

    const labels = sortedApps.map(([appName]) => appName);
    const usageData = sortedApps.map(([, time]) => time / (1000 * 60)); // 转换为分钟
    const openCountData = labels.map((app) => appOpenCountMap.get(app) || 0);

    return { labels, usageData, openCountData };
  };

  const filterDataByTimeRange = (
    data: AppUsage[],
    range: 'day' | 'week' | 'month'
  ): AppUsage[] => {
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return data.filter((item) => new Date(item.date) >= startDate);
  };

  useEffect(() => {
    if (!barChartRef.current || !pieChartRef.current || data.length === 0)
      return;

    // 清除旧实例
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }

    const { labels, usageData, openCountData } = prepareData();

    // 创建柱状图
    const barCtx = barChartRef.current.getContext('2d');
    if (barCtx) {
      barChartInstance.current = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: '使用时长 (分钟)',
              data: usageData,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
            {
              label: '打开次数',
              data: openCountData,
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '使用时长 (分钟) / 打开次数',
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: '应用使用统计',
            },
          },
        },
      });
    }

    // 创建饼图 - 展示应用使用时间占比
    const pieCtx = pieChartRef.current.getContext('2d');
    if (pieCtx) {
      // 生成随机颜色
      const backgroundColors = labels.map(
        () =>
          `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.6)`
      );

      pieChartInstance.current = new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels,
          datasets: [
            {
              label: '使用时长',
              data: usageData,
              backgroundColor: backgroundColors,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '使用时间占比',
            },
            legend: {
              position: 'right',
            },
          },
        },
      });
    }
  }, [data, timeRange]);

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">无可用数据</p>
      </div>
    );
  }

  // 计算总使用时长
  const totalUsage = data.reduce((total, item) => total + item.totalTimeMs, 0);

  return (
    <div>
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">总览</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">总使用时长</p>
            <p className="text-xl font-bold text-orange-600">
              {formatTime(totalUsage)}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">应用打开次数</p>
            <p className="text-xl font-bold text-orange-600">
              {data.reduce((count, item) => count + item.openCount, 0)}次
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <canvas ref={barChartRef}></canvas>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <canvas ref={pieChartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default UsageStatsChart;
