import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Todo } from '../../types/todo';
import { toggleTodo, deleteTodo } from '../../store/todoSlice';
import TodoEditor from './TodoEditor';

interface Props {
  todo: Todo;
}

const TodoItem: React.FC<Props> = ({ todo }) => {
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);

  const handleToggle = () => {
    dispatch(toggleTodo(todo.id));
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这个任务吗？')) {
      dispatch(deleteTodo(todo.id));
    }
  };

  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  const getPriorityStyle = (priority?: string) => {
    if (!priority) return '';

    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const getRecurringText = (todo: Todo) => {
    if (!todo.isRecurring || !todo.recurringPattern) return null;

    const { type, interval } = todo.recurringPattern;
    let text = '';

    switch (type) {
      case 'daily':
        text = `每${interval > 1 ? interval : ''}天`;
        break;
      case 'weekly':
        text = `每${interval > 1 ? interval : ''}周`;
        if (todo.recurringPattern.daysOfWeek?.length) {
          const dayNames = [
            '周日',
            '周一',
            '周二',
            '周三',
            '周四',
            '周五',
            '周六',
          ];
          const days = todo.recurringPattern.daysOfWeek
            .map((day) => dayNames[day])
            .join('、');
          text += ` (${days})`;
        }
        break;
      case 'monthly':
        text = `每${interval > 1 ? interval : ''}月`;
        if (todo.recurringPattern.dayOfMonth) {
          text += ` (${todo.recurringPattern.dayOfMonth}号)`;
        }
        break;
    }

    return text;
  };

  if (isEditing) {
    return <TodoEditor todo={todo} onClose={() => setIsEditing(false)} />;
  }

  const isOverdue =
    todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-l-4 transition-all p-4 ${
        todo.completed
          ? 'opacity-70 border-gray-300'
          : isOverdue
            ? 'border-red-500 hover:shadow-md'
            : todo.priority === 'high'
              ? 'border-red-500 hover:shadow-md'
              : todo.priority === 'medium'
                ? 'border-yellow-500 hover:shadow-md'
                : 'border-green-500 hover:shadow-md'
      }`}
    >
      <div className="flex items-start">
        <div
          onClick={handleToggle}
          className={`mt-1 h-6 w-6 cursor-pointer rounded-full flex items-center justify-center border-2 ${
            todo.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {todo.completed && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between">
            <h3
              className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500' : isOverdue ? 'text-red-700' : 'text-gray-900'}`}
            >
              {todo.title}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(true)}
                className="px-2 py-1 text-sm rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-sm rounded-md text-red-600 hover:bg-red-50 transition-colors"
              >
                删除
              </button>
            </div>
          </div>

          {todo.description && (
            <p
              className={`mt-1 text-gray-700 ${todo.completed ? 'line-through text-gray-400' : ''}`}
            >
              {todo.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {todo.dueDate && (
              <span
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                  isOverdue
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                {formatDueDate(todo.dueDate)}
              </span>
            )}

            {todo.priority && (
              <span
                className={`text-xs px-3 py-1.5 rounded-full font-medium ${getPriorityStyle(todo.priority)}`}
              >
                {todo.priority === 'high'
                  ? '高优先级'
                  : todo.priority === 'medium'
                    ? '中优先级'
                    : '低优先级'}
              </span>
            )}

            {todo.isRecurring && (
              <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-purple-100 text-purple-700 border border-purple-200">
                {getRecurringText(todo)}
              </span>
            )}
          </div>

          {todo.tags && todo.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {todo.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full border border-gray-200"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoItem;
