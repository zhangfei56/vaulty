import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { MOOD_OPTIONS } from '../../types/diary';

interface MoodChartProps {
  period: 'week' | 'month';
}

const MoodChart: React.FC<MoodChartProps> = ({ period }) => {
  const { entries } = useSelector((state: RootState) => state.diary);

  const chartData = useMemo(() => {
    const now = new Date();
    const days = period === 'week' ? 7 : 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = entries.filter(entry => 
        entry.createdAt.split('T')[0] === dateStr && entry.moodScore
      );
      
      const averageScore = dayEntries.length > 0
        ? dayEntries.reduce((sum, entry) => sum + (entry.moodScore || 5), 0) / dayEntries.length
        : null;

      data.push({
        date: dateStr,
        day: date.getDate(),
        dayName: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
        score: averageScore,
        mood: dayEntries.length > 0 ? dayEntries[0].mood : null,
        hasEntry: dayEntries.length > 0,
      });
    }

    return data;
  }, [entries, period]);

  const getMoodColor = (score: number | null) => {
    if (!score) return '#E5E7EB';
    
    if (score >= 8) return '#10B981'; // 绿色 - 很好
    if (score >= 6) return '#F59E0B'; // 黄色 - 还好
    if (score >= 4) return '#EF4444'; // 红色 - 不好
    return '#6B7280'; // 灰色 - 很差
  };

  const getMoodEmoji = (mood: string | null) => {
    if (!mood) return '😐';
    const moodOption = MOOD_OPTIONS.find(option => option.value === mood);
    return moodOption?.emoji || '😐';
  };

  const maxScore = 10;
  const chartHeight = 200;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">心情晴雨表</h3>
        <div className="text-sm text-gray-500">
          {period === 'week' ? '最近7天' : '最近30天'}
        </div>
      </div>

      <div className="relative">
        {/* Y轴标签 */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 -ml-8">
          <span>10</span>
          <span>8</span>
          <span>6</span>
          <span>4</span>
          <span>2</span>
          <span>0</span>
        </div>

        {/* 图表区域 */}
        <div className="ml-4">
          <svg width="100%" height={chartHeight} className="overflow-visible">
            {/* 网格线 */}
            {[0, 2, 4, 6, 8, 10].map((value) => (
              <line
                key={value}
                x1="0"
                y1={chartHeight - (value / maxScore) * chartHeight}
                x2="100%"
                y2={chartHeight - (value / maxScore) * chartHeight}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
            ))}

            {/* 心情曲线 */}
            <polyline
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chartData
                .map((item, index) => {
                  const x = (index / (chartData.length - 1)) * 100;
                  const y = item.score 
                    ? chartHeight - (item.score / maxScore) * chartHeight
                    : chartHeight / 2;
                  return `${x}%,${y}`;
                })
                .join(' ')}
            />

            {/* 数据点 */}
            {chartData.map((item, index) => {
              const x = (index / (chartData.length - 1)) * 100;
              const y = item.score 
                ? chartHeight - (item.score / maxScore) * chartHeight
                : chartHeight / 2;
              
              return (
                <g key={index}>
                  <circle
                    cx={`${x}%`}
                    cy={y}
                    r="6"
                    fill={getMoodColor(item.score)}
                    stroke="white"
                    strokeWidth="2"
                    className="drop-shadow-sm"
                  />
                  {item.hasEntry && (
                    <text
                      x={`${x}%`}
                      y={y - 15}
                      textAnchor="middle"
                      className="text-lg"
                                         >
                       {getMoodEmoji(item.mood || null)}
                     </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* X轴标签 */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {chartData.map((item, index) => (
              <div key={index} className="text-center">
                <div>{period === 'week' ? item.dayName : item.day}</div>
                {item.hasEntry && (
                  <div className="w-2 h-2 bg-purple-400 rounded-full mx-auto mt-1"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 心情图例 */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">很好 (8-10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-600">还好 (6-7)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">不好 (4-5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-gray-600">很差 (1-3)</span>
        </div>
      </div>
    </div>
  );
};

export default MoodChart; 