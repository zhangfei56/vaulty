import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setFilter, clearFilter, togglePrivateEntries } from '../store/diarySlice';
import DiaryList from '../components/Diary/DiaryList';
import DiaryEditor from '../components/Diary/DiaryEditor';
import MoodChart from '../components/Diary/MoodChart';
import MoodAnalytics from '../components/Diary/MoodAnalytics';
import QuickMoodRecord from '../components/Diary/QuickMoodRecord';
import { MOOD_OPTIONS, WEATHER_OPTIONS, ACTIVITY_OPTIONS } from '../types/diary';

const DiaryPage: React.FC = () => {
  const dispatch = useDispatch();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showMoodChart, setShowMoodChart] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  const { entries, loading, currentFilter, showPrivateEntries } = useSelector((state: RootState) => state.diary);

  // 过滤日记条目
  const filteredEntries = entries.filter(entry => {
    // 私密日记过滤
    if (!showPrivateEntries && entry.isPrivate) return false;
    
    // 心情过滤
    if (currentFilter.mood && entry.mood !== currentFilter.mood) return false;
    
    // 天气过滤
    if (currentFilter.weather && entry.weather !== currentFilter.weather) return false;
    
    // 活动过滤
    if (currentFilter.activities && currentFilter.activities.length > 0) {
      const hasMatchingActivity = currentFilter.activities.some(activity => 
        entry.activities?.includes(activity)
      );
      if (!hasMatchingActivity) return false;
    }
    
    // 搜索文本过滤
    if (currentFilter.searchText) {
      const searchText = currentFilter.searchText.toLowerCase();
      const matchesTitle = entry.title.toLowerCase().includes(searchText);
      const matchesContent = entry.content.toLowerCase().includes(searchText);
      if (!matchesTitle && !matchesContent) return false;
    }
    
    // 日期范围过滤
    if (currentFilter.dateRange) {
      const entryDate = new Date(entry.createdAt);
      const startDate = new Date(currentFilter.dateRange.start);
      const endDate = new Date(currentFilter.dateRange.end);
      if (entryDate < startDate || entryDate > endDate) return false;
    }
    
    return true;
  });

  const handleFilterChange = (filterType: string, value: any) => {
    dispatch(setFilter({ [filterType]: value }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilter());
  };

  const hasActiveFilters = Object.keys(currentFilter).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* 头部区域 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🐰</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Moo日记
                </h1>
                <p className="text-sm text-gray-500">记录每一天的美好心情</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMoodChart(!showMoodChart)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors text-sm"
              >
                📊 心情图表
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors text-sm"
              >
                📈 心情分析
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-sm ${
                  hasActiveFilters 
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔍 筛选 {hasActiveFilters && `(${Object.keys(currentFilter).length})`}
              </button>
              <button
                onClick={() => dispatch(togglePrivateEntries())}
                className={`px-3 py-2 rounded-full transition-colors text-sm ${
                  showPrivateEntries 
                    ? 'bg-pink-100 text-pink-700 hover:bg-pink-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showPrivateEntries ? '🔓 显示私密' : '🔒 隐藏私密'}
              </button>
              <button
                onClick={() => setShowQuickRecord(!showQuickRecord)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white px-4 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                ⚡ 快速记录
              </button>
              <button
                onClick={() => setIsEditorOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                ✨ 新建日记
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 快速心情记录 */}
        {showQuickRecord && (
          <div className="mb-6">
            <QuickMoodRecord onClose={() => setShowQuickRecord(false)} />
          </div>
        )}

        {/* 心情图表 */}
        {showMoodChart && (
          <div className="mb-6">
            <MoodChart period="week" />
          </div>
        )}

        {/* 心情分析 */}
        {showAnalytics && (
          <div className="mb-6">
            <MoodAnalytics />
          </div>
        )}

        {/* 筛选面板 */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                🔍 筛选条件
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  清除所有筛选
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 搜索框 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">搜索内容</label>
                <input
                  type="text"
                  placeholder="搜索标题或内容..."
                  value={currentFilter.searchText || ''}
                  onChange={(e) => handleFilterChange('searchText', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* 心情筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">心情</label>
                <select
                  value={currentFilter.mood || ''}
                  onChange={(e) => handleFilterChange('mood', e.target.value || undefined)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">所有心情</option>
                  {MOOD_OPTIONS.map(mood => (
                    <option key={mood.value} value={mood.value}>
                      {mood.emoji} {mood.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 天气筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">天气</label>
                <select
                  value={currentFilter.weather || ''}
                  onChange={(e) => handleFilterChange('weather', e.target.value || undefined)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">所有天气</option>
                  {WEATHER_OPTIONS.map(weather => (
                    <option key={weather.value} value={weather.value}>
                      {weather.emoji} {weather.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 活动标签筛选 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">活动标签</label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_OPTIONS.map(activity => {
                  const isSelected = currentFilter.activities?.includes(activity.value);
                  return (
                    <button
                      key={activity.value}
                      onClick={() => {
                        const currentActivities = currentFilter.activities || [];
                        const newActivities = isSelected
                          ? currentActivities.filter(a => a !== activity.value)
                          : [...currentActivities, activity.value];
                        handleFilterChange('activities', newActivities.length > 0 ? newActivities : undefined);
                      }}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                        isSelected
                          ? 'text-white shadow-md transform scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={isSelected ? { 
                        backgroundColor: activity.color,
                      } : {}}
                    >
                      <span>{activity.emoji}</span>
                      <span>{activity.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 主要内容区域 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4 animate-bounce">🐰</div>
            <p className="text-gray-500">小兔子正在整理你的日记...</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                共找到 {filteredEntries.length} 篇日记
                {hasActiveFilters && ` (已筛选)`}
              </p>
            </div>
            <DiaryList entries={filteredEntries} />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-12 text-center">
            <div className="text-6xl mb-4">🐰</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {hasActiveFilters ? '没有找到匹配的日记' : '还没有日记记录'}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters 
                ? '试试调整筛选条件，或者清除所有筛选' 
                : '点击"新建日记"开始记录今天的心情吧～'
              }
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-full transition-colors"
              >
                清除筛选条件
              </button>
            ) : (
              <button
                onClick={() => setIsEditorOpen(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                ✨ 开始写日记
              </button>
            )}
          </div>
        )}
      </div>

      {/* 日记编辑器 */}
      {isEditorOpen && <DiaryEditor onClose={() => setIsEditorOpen(false)} />}
    </div>
  );
};

export default DiaryPage;
