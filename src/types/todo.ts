export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  isRecurring?: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number; // 每隔多少天/周/月
    daysOfWeek?: number[]; // 对于每周重复，指定星期几 (0-6, 0表示周日)
    dayOfMonth?: number; // 对于每月重复，指定日期
  };
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  icon?: string;
}
