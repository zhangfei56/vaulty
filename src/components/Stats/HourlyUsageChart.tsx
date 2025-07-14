import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { HourlyUsageStat } from '../../types/appUsage';

interface Props {
  hourlyStats: HourlyUsageStat[];
}

const HourlyUsageChart: React.FC<Props> = ({ hourlyStats }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return '< 1分钟';
    return `${minutes}分钟`;
  };

  useEffect(() => {
    if (!chartRef.current || !hourlyStats.length) return;

    // 清除旧实例
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 准备图表数据
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const durations = hours.map((hour) => {
      const stat = hourlyStats.find((s) => s.hour === hour);
      return stat ? stat.totalDuration / 60000 : 0; // 转换为分钟
    });

    // 创建图表
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: hours.map((h) => `${h}:00`),
          datasets: [
            {
              label: '使用时长 (分钟)',
              data: durations,
              backgroundColor: hours.map((hour) => {
                // 给深夜和凌晨设置特别的颜色
                if (hour >= 0 && hour < 6) {
                  return 'rgba(75, 192, 192, 0.6)'; // 凌晨
                } else if (hour >= 23 || hour < 0) {
                  return 'rgba(153, 102, 255, 0.6)'; // 深夜
                } else if (hour >= 6 && hour < 12) {
                  return 'rgba(255, 205, 86, 0.6)'; // 上午
                } else if (hour >= 12 && hour < 18) {
                  return 'rgba(255, 99, 132, 0.6)'; // 下午
                } else {
                  return 'rgba(54, 162, 235, 0.6)'; // 晚上
                }
              }),
              borderColor: hours.map((hour) => {
                if (hour >= 0 && hour < 6) {
                  return 'rgba(75, 192, 192, 1)';
                } else if (hour >= 23 || hour < 0) {
                  return 'rgba(153, 102, 255, 1)';
                } else if (hour >= 6 && hour < 12) {
                  return 'rgba(255, 205, 86, 1)';
                } else if (hour >= 12 && hour < 18) {
                  return 'rgba(255, 99, 132, 1)';
                } else {
                  return 'rgba(54, 162, 235, 1)';
                }
              }),
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
                text: '使用时长 (分钟)',
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
              title: {
                display: true,
                text: '时间',
                font: {
                  size: 12
                }
              },
              ticks: {
                font: {
                  size: 9
                },
                maxRotation: 45,
                minRotation: 45,
                maxTicksLimit: 12 // 移动设备上只显示12个时间标签
              }
            },
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed.y;
                  return `使用时长: ${value.toFixed(1)}分钟`;
                },
              },
            },
            title: {
              display: true,
              text: '每小时使用时长',
              font: {
                size: 14
              }
            },
            legend: {
              display: false // 移动设备上隐藏图例以节省空间
            }
          },
        },
      });
    }
  }, [hourlyStats]);

  // 计算活跃时段
  const getActivePeriod = (): string => {
    if (!hourlyStats.length) return '无数据';

    // 查找使用时间最长的小时
    const maxUsageHour = hourlyStats.reduce(
      (max, current) =>
        current.totalDuration > max.totalDuration ? current : max,
      hourlyStats[0]
    );

    const hour = maxUsageHour.hour;

    // 定义时段
    if (hour >= 5 && hour < 12) {
      return '上午';
    } else if (hour >= 12 && hour < 18) {
      return '下午';
    } else if (hour >= 18 && hour < 22) {
      return '晚上';
    } else {
      return '深夜/凌晨';
    }
  };

  // 计算总使用时长
  const totalDuration = hourlyStats.reduce(
    (sum, hour) => sum + hour.totalDuration,
    0
  );

  return (
    <div className="stats-card">
      <h3 className="text-lg font-semibold mb-3">每小时使用情况</h3>

      {/* 移动设备上使用单列布局 */}
      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="bg-orange-50 p-3 rounded-md">
          <p className="text-xs text-gray-600">总使用时长</p>
          <p className="text-lg font-bold text-orange-600">
            {formatTime(totalDuration)}
          </p>
        </div>
        <div className="bg-orange-50 p-3 rounded-md">
          <p className="text-xs text-gray-600">最活跃时段</p>
          <p className="text-lg font-bold text-orange-600">
            {getActivePeriod()}
          </p>
        </div>
        <div className="bg-orange-50 p-3 rounded-md">
          <p className="text-xs text-gray-600">最高单小时使用</p>
          <p className="text-lg font-bold text-orange-600">
            {formatTime(Math.max(...hourlyStats.map((h) => h.totalDuration)))}
          </p>
        </div>
      </div>

      <div className="chart-container">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default HourlyUsageChart;
