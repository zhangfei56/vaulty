import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { DiaryEntry, MOOD_OPTIONS } from '../../types/diary';
import { addDiaryEntry } from '../../store/diarySlice';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onClose?: () => void;
}

const QuickMoodRecord: React.FC<Props> = ({ onClose }) => {
  const dispatch = useDispatch();
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [quickNote, setQuickNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedMood) {
      alert('请选择一个心情～');
      return;
    }

    setIsSubmitting(true);

    const selectedMoodOption = MOOD_OPTIONS.find(option => option.value === selectedMood);
    const now = new Date().toISOString();
    
    const quickEntry: DiaryEntry = {
      id: uuidv4(),
      title: `${new Date().toLocaleDateString()} 的心情记录`,
      content: quickNote || `今天的心情是${selectedMoodOption?.label}`,
      mood: selectedMood,
      moodScore: selectedMoodOption?.score || 5,
      createdAt: now,
      updatedAt: now,
    };

    dispatch(addDiaryEntry(quickEntry));
    
    // 重置表单
    setSelectedMood('');
    setQuickNote('');
    setIsSubmitting(false);
    
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🐰</div>
        <h3 className="text-lg font-semibold text-gray-800">今天心情如何？</h3>
        <p className="text-sm text-gray-500">快速记录一下吧～</p>
      </div>

      {/* 心情选择 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {MOOD_OPTIONS.slice(0, 8).map((mood) => (
          <button
            key={mood.value}
            onClick={() => setSelectedMood(mood.value)}
            className={`p-3 rounded-xl border-2 transition-all ${
              selectedMood === mood.value
                ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105'
                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-2xl mb-1">{mood.emoji}</div>
            <div className="text-xs font-medium text-gray-700">{mood.label}</div>
          </button>
        ))}
      </div>

      {/* 快速备注 */}
      <div className="mb-6">
        <textarea
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          placeholder="想说点什么吗？（可选）"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      {/* 提交按钮 */}
      <div className="flex gap-3">
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!selectedMood || isSubmitting}
          className="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? '记录中...' : '记录心情'}
        </button>
      </div>

      {selectedMood && (
        <div className="mt-4 p-3 bg-purple-50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">
              {MOOD_OPTIONS.find(m => m.value === selectedMood)?.emoji}
            </span>
            <span className="text-sm text-purple-700">
              心情评分：{MOOD_OPTIONS.find(m => m.value === selectedMood)?.score}/10
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickMoodRecord; 