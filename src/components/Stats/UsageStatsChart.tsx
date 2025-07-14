import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface AppUsage {
  appName: string;
  totalTimeMs: number;
  openCount: number;
  date: string;
  icon?: string; // 添加图标字段
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
    const appUsageMap = new Map<string, { time: number; count: number; icon?: string }>();

    // 过滤当前时间范围的数据
    const filteredData = filterDataByTimeRange(data, timeRange);

    filteredData.forEach((item) => {
      const existing = appUsageMap.get(item.appName);
      if (existing) {
        existing.time += item.totalTimeMs;
        existing.count += item.openCount;
      } else {
        appUsageMap.set(item.appName, {
          time: item.totalTimeMs,
          count: item.openCount,
          icon: item.icon
        });
      }
    });

    // 转换为图表数据格式
    const sortedApps = Array.from(appUsageMap.entries())
      .sort((a, b) => b[1].time - a[1].time)
      .slice(0, 8); // 移动设备上只显示前8个应用

    const labels = sortedApps.map(([appName]) => appName);
    const usageData = sortedApps.map(([, data]) => data.time / (1000 * 60)); // 转换为分钟
    const openCountData = sortedApps.map(([, data]) => data.count);
    const appIcons = sortedApps.map(([, data]) => data.icon);

    return { labels, usageData, openCountData, appIcons };
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
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '使用时长 (分钟) / 打开次数',
                font: {
                  size: 12
                }
              },
              ticks: {
                font: {
                  size: 10
                }
              }
            },
            x: {
              ticks: {
                font: {
                  size: 10
                },
                maxRotation: 45,
                minRotation: 45
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: '应用使用统计',
              font: {
                size: 16
              }
            },
            legend: {
              labels: {
                font: {
                  size: 11
                }
              }
            }
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
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '使用时间占比',
              font: {
                size: 16
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  size: 10
                },
                padding: 8
              }
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
  const { labels, usageData, appIcons } = prepareData();

  return (
    <div>
      <div className="stats-card mb-4">
        <h3 className="text-lg font-semibold mb-3">总览</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-orange-50 p-3 rounded-md">
            <p className="text-xs text-gray-600">总使用时长</p>
            <p className="text-lg font-bold text-orange-600">
              {formatTime(totalUsage)}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-md">
            <p className="text-xs text-gray-600">应用打开次数</p>
            <p className="text-lg font-bold text-orange-600">
              {data.reduce((count, item) => count + item.openCount, 0)}次
            </p>
          </div>
        </div>
      </div>

      {/* 应用图标列表 */}
      {labels.length > 0 && (
        <div className="stats-card mb-4">
          <h4 className="text-md font-semibold mb-3">主要应用</h4>
          <div className="grid grid-cols-4 gap-3">
            {labels.slice(0, 8).map((appName, index) => (
              <div key={appName} className="flex flex-col items-center">
                {appIcons[index] ? (
                  <img
                    src={appIcons[index]}
                    alt={appName}
                    className="w-10 h-10 rounded-lg mb-1"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mb-1">
                    <span className="text-gray-500 text-xs font-bold">
                      {appName.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-600 text-center truncate w-full">
                  {appName}
                </span>
                <span className="text-xs text-orange-600 font-semibold">
                  {Math.round(usageData[index])}分
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 移动设备上垂直堆叠图表 */}
      <div className="space-y-4">
        <div className="stats-card">
          <div className="chart-container-large">
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
        <div className="stats-card">
          <div className="chart-container">
            <canvas ref={pieChartRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageStatsChart;
