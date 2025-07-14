import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { DiaryEntry, MOOD_OPTIONS, WEATHER_OPTIONS, ACTIVITY_OPTIONS } from '../../types/diary';
import { deleteDiaryEntry } from '../../store/diarySlice';
import DiaryEditor from './DiaryEditor';

interface Props {
  entry: DiaryEntry;
}

const DiaryItem: React.FC<Props> = ({ entry }) => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这篇日记吗？')) {
      dispatch(deleteDiaryEntry(entry.id));
    }
  };

  const getMoodInfo = (mood?: string) => {
    return MOOD_OPTIONS.find(option => option.value === mood);
  };

  const getWeatherInfo = (weather?: string) => {
    return WEATHER_OPTIONS.find(option => option.value === weather);
  };

  const getActivityInfo = (activity: string) => {
    return ACTIVITY_OPTIONS.find(option => option.value === activity);
  };

  if (isEditing) {
    return <DiaryEditor entry={entry} onClose={() => setIsEditing(false)} />;
  }

  const moodInfo = getMoodInfo(entry.mood);
  const weatherInfo = getWeatherInfo(entry.weather);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* 头部信息 */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg text-gray-800">
                {entry.title}
              </h3>
              {entry.isPrivate && (
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                  🔒 私密
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span>{formatDate(entry.createdAt)}</span>
              {entry.location && (
                <span className="flex items-center gap-1">
                  📍 {entry.location}
                </span>
              )}
            </div>

            {/* 心情和天气 */}
            <div className="flex items-center gap-4 mb-4">
              {moodInfo && (
                <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full">
                  <span className="text-lg">{moodInfo.emoji}</span>
                  <span className="text-sm text-purple-700">{moodInfo.label}</span>
                  {entry.moodScore && (
                    <span className="text-xs text-purple-600">({entry.moodScore}/10)</span>
                  )}
                </div>
              )}
              
              {weatherInfo && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                  <span className="text-lg">{weatherInfo.emoji}</span>
                  <span className="text-sm text-blue-700">{weatherInfo.label}</span>
                </div>
              )}
            </div>

            {/* 活动标签 */}
            {entry.activities && entry.activities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {entry.activities.map((activity) => {
                  const activityInfo = getActivityInfo(activity);
                  return activityInfo ? (
                    <div
                      key={activity}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                      style={{ 
                        backgroundColor: `${activityInfo.color}20`,
                        color: activityInfo.color 
                      }}
                    >
                      <span>{activityInfo.emoji}</span>
                      <span>{activityInfo.label}</span>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-blue-500 transition-colors p-2"
              title="编辑"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 transition-colors p-2"
              title="删除"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* 图片展示 */}
        {entry.images && entry.images.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-3 gap-2">
              {entry.images.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`日记图片 ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
              ))}
              {entry.images.length > 3 && (
                <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                  +{entry.images.length - 3} 张
                </div>
              )}
            </div>
          </div>
        )}

        {/* 内容 */}
        <div className="text-gray-700 leading-relaxed">
          <div
            className={`${!expanded && entry.content.length > 200 ? 'line-clamp-3' : ''}`}
          >
            {entry.content.split('\n').map((line, index) => (
              <p key={index} className={index > 0 ? 'mt-2' : ''}>
                {line}
              </p>
            ))}
          </div>

          {entry.content.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-purple-500 text-sm mt-2 hover:text-purple-600 transition-colors"
            >
              {expanded ? '收起' : '展开全文'}
            </button>
          )}
        </div>

        {/* 标签 */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 语音记录 */}
        {entry.audioUrl && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              🎵 语音记录
              <audio controls className="ml-2">
                <source src={entry.audioUrl} type="audio/mpeg" />
                您的浏览器不支持音频播放。
              </audio>
            </div>
          </div>
        )}
      </div>

      {/* 底部装饰 */}
      <div className="h-1 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200"></div>
    </div>
  );
};

export default DiaryItem;
