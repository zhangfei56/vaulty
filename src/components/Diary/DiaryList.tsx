import React from 'react';
import { DiaryEntry } from '../../types/diary';
import DiaryItem from './DiaryItem';

interface Props {
  entries: DiaryEntry[];
}

const DiaryList: React.FC<Props> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🐰</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          还没有日记记录
        </h3>
        <p className="text-gray-500">
          开始记录你的美好时光吧～
        </p>
      </div>
    );
  }

  // 按日期分组
  const groupedEntries = entries.reduce((groups, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, DiaryEntry[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => (
        <div key={date} className="space-y-4">
          {/* 日期标题 */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {new Date(date).getDate()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{date}</h3>
              <div className="h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
            </div>
            <div className="text-sm text-gray-500">
              {groupedEntries[date].length} 篇日记
            </div>
          </div>

          {/* 日记列表 */}
          <div className="space-y-4 ml-16">
            {groupedEntries[date].map((entry) => (
              <DiaryItem key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}

      {/* 底部装饰 */}
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🌸</div>
        <p className="text-gray-400 text-sm">
          所有的美好回忆都在这里了～
        </p>
      </div>
    </div>
  );
};

export default DiaryList;
