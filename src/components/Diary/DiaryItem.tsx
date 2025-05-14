import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { DiaryEntry } from '../../types/diary';
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

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'happy':
        return '😊';
      case 'sad':
        return '😢';
      case 'angry':
        return '😠';
      case 'neutral':
        return '😐';
      case 'excited':
        return '🤩';
      default:
        return '';
    }
  };

  if (isEditing) {
    return <DiaryEditor entry={entry} onClose={() => setIsEditing(false)} />;
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg mb-2 flex items-center">
            {entry.title}
            {entry.mood && (
              <span className="ml-2">{getMoodEmoji(entry.mood)}</span>
            )}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {formatDate(entry.createdAt)}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 hover:text-blue-600"
          >
            编辑
          </button>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-600"
          >
            删除
          </button>
        </div>
      </div>

      <div
        className={`text-gray-700 ${!expanded && entry.content.length > 300 ? 'line-clamp-3' : ''}`}
      >
        {entry.content}
      </div>

      {entry.content.length > 300 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-500 text-sm mt-2 hover:underline"
        >
          {expanded ? '收起' : '展开全文'}
        </button>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiaryItem;
