import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import TodoList from '../components/Todo/TodoList';
import TodoEditor from '../components/Todo/TodoEditor';

const TodoPage: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { todos, loading } = useSelector((state: RootState) => state.todo);

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">待办事项</h1>
        <button
          onClick={() => setIsEditorOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
        >
          新建任务
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <p>加载中...</p>
        </div>
      ) : todos.length > 0 ? (
        <TodoList todos={todos} />
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            暂无待办任务，点击"新建任务"开始规划吧
          </p>
        </div>
      )}

      {isEditorOpen && <TodoEditor onClose={() => setIsEditorOpen(false)} />}
    </div>
  );
};

export default TodoPage;
