import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import AISuggestion from '../components/AI/AISuggestion';

const Home = () => {
  const { suggestions } = useSelector((state: RootState) => state.ai);
  const latestSuggestions = suggestions
    .filter((s) => s.status === 'new')
    .slice(0, 3);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">欢迎使用 Vaulty2</h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Link
          to="/diary"
          className="bg-blue-100 p-4 rounded-lg flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-2">📝</div>
          <div className="font-medium">日记</div>
        </Link>
        <Link
          to="/todo"
          className="bg-green-100 p-4 rounded-lg flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-2">✅</div>
          <div className="font-medium">待办事项</div>
        </Link>
        <Link
          to="/calendar"
          className="bg-purple-100 p-4 rounded-lg flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-2">📅</div>
          <div className="font-medium">日历总览</div>
        </Link>
        <Link
          to="/stats"
          className="bg-orange-100 p-4 rounded-lg flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-2">📊</div>
          <div className="font-medium">使用统计</div>
        </Link>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">AI 智能建议</h2>
          {latestSuggestions.length > 0 && (
            <Link to="/settings" className="text-blue-500 text-sm">
              查看更多
            </Link>
          )}
        </div>

        {latestSuggestions.length > 0 ? (
          <div className="space-y-4">
            {latestSuggestions.map((suggestion) => (
              <AISuggestion key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
            暂无 AI 建议，请继续使用应用以获取个性化建议
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
