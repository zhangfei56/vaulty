import React, { useMemo } from 'react';
import { DiaryEntry } from '../../types/diary';
import { Todo } from '../../types/todo';

interface CalendarData {
  diaryEntries: DiaryEntry[];
  todos: Todo[];
}

interface Props {
  date: Date;
  data: CalendarData;
}

const CalendarOverview: React.FC<Props> = ({ date, data }) => {
  // 获取当前月的天数数组
  const daysInMonth = useMemo(() => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();

    // 填充数组，从月初到月末
    const days = [];
    for (let i = 1; i <= daysCount; i++) {
      days.push(new Date(year, month, i));
    }

    // 确定第一天是周几，前面补空
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.unshift(null);
    }

    return days;
  }, [date]);

  // 按日期过滤数据
  const getDataForDate = (day: Date) => {
    if (!day) return { diaryEntries: [], todos: [] };

    const dateStr = day.toISOString().split('T')[0];

    // 过滤当天的日记
    const diaryEntries = data.diaryEntries.filter((entry) => {
      const entryDate = new Date(entry.createdAt).toISOString().split('T')[0];
      return entryDate === dateStr;
    });

    // 过滤当天的待办任务
    const todos = data.todos.filter((todo) => {
      if (!todo.dueDate) return false;
      const todoDate = new Date(todo.dueDate).toISOString().split('T')[0];
      return todoDate === dateStr;
    });

    return { diaryEntries, todos };
  };

  // 计算当天是否为今天
  const isToday = (day: Date | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  // 判断是否为周末
  const isWeekend = (day: Date | null) => {
    if (!day) return false;
    const dayOfWeek = day.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0是周日，6是周六
  };

  return (
    <div className="p-2 rounded-xl shadow bg-white">
      {/* 日历头部 */}
      <div className="grid grid-cols-7 mb-3">
        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
          <div
            key={day}
            className={`text-center font-medium py-3 ${
              index === 0 || index === 6
                ? 'bg-green-50 rounded-t-lg text-green-700'
                : 'text-gray-600'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历主体 */}
      <div className="grid grid-cols-7 gap-1 md:gap-1.5">
        {daysInMonth.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square bg-gray-50 rounded-lg"
              ></div>
            );
          }

          const dayData = getDataForDate(day);
          const hasEntries = dayData.diaryEntries.length > 0;
          const hasTodos = dayData.todos.length > 0;
          const hasTodosDone = dayData.todos.some((todo) => todo.completed);
          const hasTodosPending = dayData.todos.some((todo) => !todo.completed);
          const dayOfWeek = day.getDay();

          return (
            <div
              key={day.toString()}
              className={`aspect-square p-1.5 border rounded-lg overflow-hidden transition-shadow active:shadow-inner flex flex-col ${
                isToday(day)
                  ? 'bg-blue-50 border-blue-400 shadow'
                  : isWeekend(day)
                    ? 'bg-green-50 border-green-200'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-base font-medium ${
                    isToday(day)
                      ? 'text-blue-600 bg-blue-100 w-6 h-6 flex items-center justify-center rounded-full'
                      : isWeekend(day)
                        ? 'text-green-700'
                        : ''
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="flex space-x-1">
                  {hasEntries && (
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  )}
                  {hasTodosDone && (
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  )}
                  {hasTodosPending && (
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  )}
                </div>
              </div>

              <div className="text-xs space-y-1 overflow-hidden flex-1">
                {dayData.diaryEntries.slice(0, 1).map((entry) => (
                  <div
                    key={entry.id}
                    className="truncate text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"
                  >
                    📝 {entry.title}
                  </div>
                ))}

                {dayData.todos.slice(0, 2).map((todo) => (
                  <div
                    key={todo.id}
                    className={`truncate px-1.5 py-0.5 rounded ${
                      todo.completed
                        ? 'text-green-600 bg-green-50'
                        : 'text-red-600 bg-red-50'
                    }`}
                  >
                    {todo.completed ? '✓' : '○'} {todo.title}
                  </div>
                ))}

                {dayData.diaryEntries.length + dayData.todos.length > 3 && (
                  <div className="text-gray-500 text-center text-xs bg-gray-100 rounded-full px-2 py-0.5 mt-1">
                    +{dayData.diaryEntries.length + dayData.todos.length - 3}{' '}
                    更多...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <span className="w-4 h-4 rounded-full bg-blue-500 inline-block mr-2"></span>
          <span>日记</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 rounded-full bg-green-500 inline-block mr-2"></span>
          <span>已完成</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 rounded-full bg-red-500 inline-block mr-2"></span>
          <span>未完成</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarOverview;
