import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import DiaryList from '../components/Diary/DiaryList';
import DiaryEditor from '../components/Diary/DiaryEditor';

const DiaryPage: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { entries, loading } = useSelector((state: RootState) => state.diary);

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">我的日记</h1>
        <button
          onClick={() => setIsEditorOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          新建日记
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <p>加载中...</p>
        </div>
      ) : entries.length > 0 ? (
        <DiaryList entries={entries} />
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            尚无日记记录，点击"新建日记"开始记录今天的心情吧
          </p>
        </div>
      )}

      {isEditorOpen && <DiaryEditor onClose={() => setIsEditorOpen(false)} />}
    </div>
  );
};

export default DiaryPage;
