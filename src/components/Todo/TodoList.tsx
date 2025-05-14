import React, { useState } from 'react';
import { Todo } from '../../types/todo';
import TodoItem from './TodoItem';

interface Props {
  todos: Todo[];
}

const TodoList: React.FC<Props> = ({ todos }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // 过滤显示的任务
  const filteredTodos = todos.filter((todo) => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // 按到期日期排序，未完成的优先
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // 首先按完成状态排序
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // 如果都没有截止日期，按创建日期排序
    if (!a.dueDate && !b.dueDate) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }

    // 如果只有一个有截止日期，有截止日期的优先
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    // 否则按截止日期排序
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const getTodoStats = () => {
    const total = todos.length;
    const completed = todos.filter((todo) => todo.completed).length;
    const active = total - completed;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, active, completionRate };
  };

  const stats = getTodoStats();

  return (
    <div className="bg-gray-50 p-5 rounded-2xl shadow-sm">
      {/* 统计信息 */}
      <div className="mb-5 grid grid-cols-4 gap-4 text-center">
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">总任务</p>
          <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">未完成</p>
          <p className="text-2xl font-bold text-red-600">{stats.active}</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">完成率</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.completionRate}%
          </p>
        </div>
      </div>

      {/* 过滤按钮 */}
      <div className="flex justify-center mb-6">
        <div
          className="inline-flex rounded-full shadow-sm bg-gray-100 p-1"
          role="group"
        >
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
              filter === 'all'
                ? 'bg-green-500 text-white shadow'
                : 'bg-transparent text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
              filter === 'active'
                ? 'bg-green-500 text-white shadow'
                : 'bg-transparent text-gray-700 hover:bg-gray-200'
            }`}
          >
            未完成
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-all ${
              filter === 'completed'
                ? 'bg-green-500 text-white shadow'
                : 'bg-transparent text-gray-700 hover:bg-gray-200'
            }`}
          >
            已完成
          </button>
        </div>
      </div>

      {sortedTodos.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75m0-3.75h3.75m-3.75 3.75h3.75M9 21h3.75m3 0h3.75m-9.75-6h3.75m3 0h3.75"
              />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">
            {filter === 'all'
              ? '尚无待办任务'
              : filter === 'active'
                ? '没有未完成的任务'
                : '没有已完成的任务'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {filter === 'all'
              ? '创建一个新任务来开始吧'
              : filter === 'active'
                ? '所有任务都已完成'
                : '完成一些任务以在此查看'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoList;
