import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { MOOD_OPTIONS } from '../../types/diary';

const MoodAnalytics: React.FC = () => {
  const { entries } = useSelector((state: RootState) => state.diary);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const moodStats = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const periodEntries = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= startDate && entry.moodScore;
    });

    // 心情分布统计
    const moodDistribution = MOOD_OPTIONS.reduce((acc, mood) => {
      acc[mood.value] = periodEntries.filter(entry => entry.mood === mood.value).length;
      return acc;
    }, {} as Record<string, number>);

    // 平均心情评分
    const averageScore = periodEntries.length > 0
      ? periodEntries.reduce((sum, entry) => sum + (entry.moodScore || 5), 0) / periodEntries.length
      : 0;

    // 最好和最差的一天
    const bestDay = periodEntries.length > 0 
      ? periodEntries.reduce((best, entry) => 
          (entry.moodScore || 0) > (best.moodScore || 0) ? entry : best)
      : null;
    
    const worstDay = periodEntries.length > 0
      ? periodEntries.reduce((worst, entry) => 
          (entry.moodScore || 10) < (worst.moodScore || 10) ? entry : worst)
      : null;

    // 心情趋势（最近7天）
    const recentTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEntries = periodEntries.filter(entry => 
        entry.createdAt.split('T')[0] === dateStr
      );
      
      const dayAverage = dayEntries.length > 0
        ? dayEntries.reduce((sum, entry) => sum + (entry.moodScore || 5), 0) / dayEntries.length
        : null;

      recentTrend.push({
        date: dateStr,
        score: dayAverage,
        day: date.getDate(),
        dayName: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      });
    }

    return {
      totalEntries: periodEntries.length,
      moodDistribution,
      averageScore,
      bestDay,
      worstDay,
      recentTrend,
    };
  }, [entries, selectedPeriod]);

  const getMoodColor = (score: number) => {
    if (score >= 8) return '#10B981';
    if (score >= 6) return '#F59E0B';
    if (score >= 4) return '#EF4444';
    return '#6B7280';
  };

  const getMoodEmoji = (mood: string) => {
    const moodOption = MOOD_OPTIONS.find(option => option.value === mood);
    return moodOption?.emoji || '😐';
  };

  const getMoodLabel = (mood: string) => {
    const moodOption = MOOD_OPTIONS.find(option => option.value === mood);
    return moodOption?.label || '未知';
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📊</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">心情分析</h2>
              <p className="text-sm text-gray-500">了解你的心情变化趋势</p>
            </div>
          </div>

          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedPeriod === period
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period === 'week' ? '最近一周' : period === 'month' ? '最近一月' : '最近一年'}
              </button>
            ))}
          </div>
        </div>

        {/* 总体统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {moodStats.totalEntries}
            </div>
            <div className="text-sm text-purple-700">记录天数</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {moodStats.averageScore.toFixed(1)}
            </div>
            <div className="text-sm text-blue-700">平均心情评分</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {moodStats.bestDay ? moodStats.bestDay.moodScore : '-'}
            </div>
            <div className="text-sm text-green-700">最高心情评分</div>
          </div>
        </div>
      </div>

      {/* 心情分布 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">心情分布</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MOOD_OPTIONS.map((mood) => {
            const count = moodStats.moodDistribution[mood.value] || 0;
            const percentage = moodStats.totalEntries > 0 
              ? (count / moodStats.totalEntries * 100).toFixed(1)
              : '0';
            
            return (
              <div key={mood.value} className="text-center p-4 border border-gray-100 rounded-lg">
                <div className="text-3xl mb-2">{mood.emoji}</div>
                <div className="text-sm font-medium text-gray-700">{mood.label}</div>
                <div className="text-lg font-bold" style={{ color: mood.color }}>
                  {count}
                </div>
                <div className="text-xs text-gray-500">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 最近趋势 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">最近7天趋势</h3>
        
        <div className="relative h-40">
          <svg width="100%" height="100%" className="overflow-visible">
            {/* 网格线 */}
            {[0, 2.5, 5, 7.5, 10].map((value) => (
              <line
                key={value}
                x1="0"
                y1={`${100 - (value / 10) * 100}%`}
                x2="100%"
                y2={`${100 - (value / 10) * 100}%`}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
            ))}

            {/* 趋势线 */}
            <polyline
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={moodStats.recentTrend
                .map((item, index) => {
                  const x = (index / (moodStats.recentTrend.length - 1)) * 100;
                  const y = item.score 
                    ? 100 - (item.score / 10) * 100
                    : 50;
                  return `${x}%,${y}%`;
                })
                .join(' ')}
            />

            {/* 数据点 */}
            {moodStats.recentTrend.map((item, index) => {
              const x = (index / (moodStats.recentTrend.length - 1)) * 100;
              const y = item.score 
                ? 100 - (item.score / 10) * 100
                : 50;
              
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill={item.score ? getMoodColor(item.score) : '#E5E7EB'}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* X轴标签 */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {moodStats.recentTrend.map((item, index) => (
              <div key={index} className="text-center">
                {item.dayName}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最佳和最差的一天 */}
      {(moodStats.bestDay || moodStats.worstDay) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {moodStats.bestDay && (
            <div className="bg-green-50 rounded-xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">🌟</div>
                <h3 className="text-lg font-semibold text-green-800">最开心的一天</h3>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-green-700">
                  {new Date(moodStats.bestDay.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getMoodEmoji(moodStats.bestDay.mood || '')}</span>
                  <span className="text-sm text-green-700">
                    {getMoodLabel(moodStats.bestDay.mood || '')} ({moodStats.bestDay.moodScore}/10)
                  </span>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  {moodStats.bestDay.title}
                </div>
              </div>
            </div>
          )}

          {moodStats.worstDay && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">🤗</div>
                <h3 className="text-lg font-semibold text-blue-800">需要关怀的一天</h3>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-blue-700">
                  {new Date(moodStats.worstDay.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getMoodEmoji(moodStats.worstDay.mood || '')}</span>
                  <span className="text-sm text-blue-700">
                    {getMoodLabel(moodStats.worstDay.mood || '')} ({moodStats.worstDay.moodScore}/10)
                  </span>
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  {moodStats.worstDay.title}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 温馨提示 */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl">🐰</div>
          <h3 className="text-lg font-semibold text-purple-800">Moo的小贴士</h3>
        </div>
        
        <div className="text-sm text-purple-700 space-y-2">
          {moodStats.averageScore >= 7 ? (
            <p>你最近的心情很不错呢！继续保持这种积极的状态～ ✨</p>
          ) : moodStats.averageScore >= 5 ? (
            <p>心情还算平稳，记得多关注自己的感受，适当放松一下 🌸</p>
          ) : (
            <p>最近似乎有些低落，记得要好好照顾自己，必要时寻求帮助 💕</p>
          )}
          <p>坚持记录日记是一个很好的习惯，它能帮助你更好地了解自己的情绪变化。</p>
        </div>
      </div>
    </div>
  );
};

export default MoodAnalytics; 