import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Todo } from '../../types/todo';
import { addTodo, updateTodo } from '../../store/todoSlice';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  todo?: Todo;
  onClose: () => void;
}

// 可用图标列表
const availableIcons = [
  '📝',
  '📌',
  '⭐',
  '🔥',
  '⚡',
  '❗',
  '📅',
  '🏠',
  '🛒',
  '📚',
  '💼',
  '🎯',
  '💻',
  '📱',
  '🎵',
  '🍔',
  '🏋️',
  '🎮',
  '🚗',
  '✈️',
  '💰',
  '🏆',
  '🎉',
  '💡',
  '🎁',
  '📞',
  '📧',
  '🔧',
  '🎨',
  '🎥',
  '🎬',
  '🎤',
  '🎧',
  '🎵',
  '🎶',
  '🎹',
];

const TodoEditor: React.FC<Props> = ({ todo, onClose }) => {
  const dispatch = useDispatch();
  const isEditing = !!todo;

  const [title, setTitle] = useState(todo?.title || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [dueDate, setDueDate] = useState(todo?.dueDate?.split('T')[0] || '');
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | undefined
  >(todo?.priority);
  const [isRecurring, setIsRecurring] = useState(todo?.isRecurring || false);
  const [recurringType, setRecurringType] = useState<
    'daily' | 'weekly' | 'monthly'
  >(todo?.recurringPattern?.type || 'daily');
  const [interval, setInterval] = useState(
    todo?.recurringPattern?.interval || 1
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    todo?.recurringPattern?.daysOfWeek || []
  );
  const [dayOfMonth, setDayOfMonth] = useState(
    todo?.recurringPattern?.dayOfMonth || 1
  );
  const [tags, setTags] = useState<string[]>(todo?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(todo?.icon || '📝');
  const [showIconPicker, setShowIconPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('标题不能为空');
      return;
    }

    const now = new Date().toISOString();
    const dueDateFormatted = dueDate ? `${dueDate}T00:00:00.000Z` : undefined;

    // 构建循环模式
    const recurringPattern = isRecurring
      ? {
          type: recurringType,
          interval,
          ...(recurringType === 'weekly' ? { daysOfWeek } : {}),
          ...(recurringType === 'monthly' ? { dayOfMonth } : {}),
        }
      : undefined;

    // 处理标签
    const tagArray = tags
      ? tags.map((tag) => tag.trim()).filter((tag) => tag)
      : [];

    if (isEditing && todo) {
      const updatedTodo: Todo = {
        ...todo,
        title,
        description,
        dueDate: dueDateFormatted,
        priority,
        isRecurring,
        recurringPattern,
        tags: tagArray.length > 0 ? tagArray : undefined,
        icon: selectedIcon,
        updatedAt: now,
      };
      dispatch(updateTodo(updatedTodo));
    } else {
      const newTodo: Todo = {
        id: uuidv4(),
        title,
        description,
        completed: false,
        dueDate: dueDateFormatted,
        priority,
        isRecurring,
        recurringPattern,
        tags: tagArray.length > 0 ? tagArray : undefined,
        icon: selectedIcon,
        createdAt: now,
        updatedAt: now,
      };
      dispatch(addTodo(newTodo));
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

  const toggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {isEditing ? '编辑任务' : '新建任务'}
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
                标题 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-2">
                <div
                  className="relative"
                  onMouseLeave={() => setShowIconPicker(false)}
                >
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-10 h-10 flex items-center justify-center text-xl bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {selectedIcon}
                  </button>
                  {showIconPicker && (
                    <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow-lg p-2 grid grid-cols-7 gap-1 w-64">
                      {availableIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => {
                            setSelectedIcon(icon);
                            setShowIconPicker(false);
                          }}
                          className={`w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-gray-100 ${
                            selectedIcon === icon ? 'bg-blue-100' : ''
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-l"
                  placeholder="任务标题"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="description">
                描述
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                rows={3}
                placeholder="任务描述（可选）"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="dueDate">
                截止日期
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">优先级</label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === 'low'}
                    onChange={() => setPriority('low')}
                    className="form-radio text-green-600"
                  />
                  <span className="ml-2">低</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === 'medium'}
                    onChange={() => setPriority('medium')}
                    className="form-radio text-yellow-600"
                  />
                  <span className="ml-2">中</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === 'high'}
                    onChange={() => setPriority('high')}
                    className="form-radio text-red-600"
                  />
                  <span className="ml-2">高</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="priority"
                    checked={priority === undefined}
                    onChange={() => setPriority(undefined)}
                    className="form-radio text-gray-600"
                  />
                  <span className="ml-2">无</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center mb-2">
                <input
                  id="isRecurring"
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label
                  className="ml-2 block text-gray-700"
                  htmlFor="isRecurring"
                >
                  周期性任务
                </label>
              </div>

              {isRecurring && (
                <div className="ml-6 mt-2 p-4 border border-gray-200 rounded-md">
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-2">重复类型</label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="recurringType"
                          checked={recurringType === 'daily'}
                          onChange={() => setRecurringType('daily')}
                          className="form-radio text-green-600"
                        />
                        <span className="ml-2">每天</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="recurringType"
                          checked={recurringType === 'weekly'}
                          onChange={() => setRecurringType('weekly')}
                          className="form-radio text-green-600"
                        />
                        <span className="ml-2">每周</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="recurringType"
                          checked={recurringType === 'monthly'}
                          onChange={() => setRecurringType('monthly')}
                          className="form-radio text-green-600"
                        />
                        <span className="ml-2">每月</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label
                      className="block text-gray-700 mb-2"
                      htmlFor="interval"
                    >
                      间隔
                    </label>
                    <input
                      id="interval"
                      type="number"
                      min={1}
                      value={interval}
                      onChange={(e) =>
                        setInterval(
                          Math.max(1, parseInt(e.target.value, 10) || 1)
                        )
                      }
                      className="w-20 p-2 border border-gray-300 rounded"
                    />
                    <span className="ml-2">
                      {recurringType === 'daily'
                        ? '天'
                        : recurringType === 'weekly'
                          ? '周'
                          : '月'}
                    </span>
                  </div>

                  {recurringType === 'weekly' && (
                    <div className="mb-3">
                      <label className="block text-gray-700 mb-2">重复日</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          '周日',
                          '周一',
                          '周二',
                          '周三',
                          '周四',
                          '周五',
                          '周六',
                        ].map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleDayOfWeek(index)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center
                              ${
                                daysOfWeek.includes(index)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-700'
                              } hover:opacity-90`}
                          >
                            {day.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recurringType === 'monthly' && (
                    <div className="mb-3">
                      <label
                        className="block text-gray-700 mb-2"
                        htmlFor="dayOfMonth"
                      >
                        每月几号
                      </label>
                      <input
                        id="dayOfMonth"
                        type="number"
                        min={1}
                        max={31}
                        value={dayOfMonth}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          setDayOfMonth(Math.min(31, Math.max(1, value || 1)));
                        }}
                        className="w-20 p-2 border border-gray-300 rounded"
                      />
                      <span className="ml-2">号</span>
                    </div>
                  )}
                </div>
              )}
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
                  className="bg-green-500 text-white px-4 rounded-r"
                >
                  添加
                </button>
              </div>

              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-green-50 text-green-600 px-2 py-1 rounded-full flex items-center"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 text-green-400 hover:text-green-600"
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
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
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

export default TodoEditor;
