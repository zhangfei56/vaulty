import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import CalendarOverview from '../components/Calendar/CalendarOverview';

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { entries } = useSelector((state: RootState) => state.diary);
  const { todos } = useSelector((state: RootState) => state.todo);

  // 合并日记和待办事项数据，供日历组件使用
  const calendarData = {
    diaryEntries: entries,
    todos: todos,
  };

  const handlePrevMonth = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold mb-6">日历总览</h1>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="bg-purple-100 text-purple-600 px-3 py-1 rounded-md hover:bg-purple-200"
        >
          上个月
        </button>
        <h2 className="text-xl font-medium">
          {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
        </h2>
        <button
          onClick={handleNextMonth}
          className="bg-purple-100 text-purple-600 px-3 py-1 rounded-md hover:bg-purple-200"
        >
          下个月
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <CalendarOverview date={currentDate} data={calendarData} />
      </div>
    </div>
  );
};

export default CalendarPage;
