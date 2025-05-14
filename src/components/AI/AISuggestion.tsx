import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AISuggestion as AISuggestionType } from '../../types/ai';
import { updateSuggestionStatus } from '../../store/aiSlice';

interface Props {
  suggestion: AISuggestionType;
}

const AISuggestion: React.FC<Props> = ({ suggestion }) => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);

  const handleStatusChange = (status: AISuggestionType['status']) => {
    dispatch(updateSuggestionStatus({ id: suggestion.id, status }));
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'productivity':
        return '⚡';
      case 'health':
        return '💪';
      case 'habit':
        return '🌱';
      case 'general':
        return '💡';
      default:
        return '💡';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-start">
        <div className="text-2xl mr-3">
          {getCategoryEmoji(suggestion.category)}
        </div>
        <div className="flex-1">
          <p className={`text-gray-800 ${!expanded && 'line-clamp-3'}`}>
            {suggestion.content}
          </p>
          {suggestion.content.length > 150 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-500 text-sm mt-1 hover:underline"
            >
              {expanded ? '收起' : '查看更多'}
            </button>
          )}
          <div className="mt-3 flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {new Date(suggestion.generatedAt).toLocaleDateString()}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleStatusChange('implemented')}
                className="text-sm px-3 py-1 bg-green-50 text-green-600 rounded-full hover:bg-green-100"
              >
                采纳
              </button>
              <button
                onClick={() => handleStatusChange('dismissed')}
                className="text-sm px-3 py-1 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100"
              >
                忽略
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISuggestion;
