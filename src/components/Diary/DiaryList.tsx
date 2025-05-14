import React from 'react';
import { DiaryEntry } from '../../types/diary';
import DiaryItem from './DiaryItem';

interface Props {
  entries: DiaryEntry[];
}

const DiaryList: React.FC<Props> = ({ entries }) => {
  if (entries.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">尚无日记记录</p>
      </div>
    );
  }

  // 按创建日期降序排序
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedEntries.map((entry) => (
        <DiaryItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
};

export default DiaryList;
