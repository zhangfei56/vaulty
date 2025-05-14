import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { DiaryEntry } from '../../types/diary';
import { addDiaryEntry, updateDiaryEntry } from '../../store/diarySlice';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  entry?: DiaryEntry;
  onClose: () => void;
}

// 心情选项
const moodOptions = [
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'sad', label: '难过', emoji: '😢' },
  { value: 'angry', label: '生气', emoji: '😠' },
  { value: 'neutral', label: '平静', emoji: '😐' },
  { value: 'excited', label: '兴奋', emoji: '🤩' },
];

const DiaryEditor: React.FC<Props> = ({ entry, onClose }) => {
  const dispatch = useDispatch();
  const isEditing = !!entry;

  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood || '');
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('标题和内容不能为空');
      return;
    }

    const now = new Date().toISOString();

    if (isEditing && entry) {
      const updatedEntry: DiaryEntry = {
        ...entry,
        title,
        content,
        mood,
        tags,
        updatedAt: now,
      };
      dispatch(updateDiaryEntry(updatedEntry));
    } else {
      const newEntry: DiaryEntry = {
        id: uuidv4(),
        title,
        content,
        mood,
        tags,
        createdAt: now,
        updatedAt: now,
      };
      dispatch(addDiaryEntry(newEntry));
    }

    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {isEditing ? '编辑日记' : '新建日记'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              关闭
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="title">
                标题
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="日记标题"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="content">
                内容
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                rows={8}
                placeholder="今天发生了什么..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">心情</label>
              <div className="flex flex-wrap gap-3">
                {moodOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMood(option.value)}
                    className={`flex flex-col items-center p-2 rounded-md ${
                      mood === option.value
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-sm mt-1">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">标签</label>
              <div className="flex">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-l"
                  placeholder="添加标签"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-blue-500 text-white px-4 rounded-r"
                >
                  添加
                </button>
              </div>

              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full flex items-center"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-blue-400 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {isEditing ? '更新' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DiaryEditor;
