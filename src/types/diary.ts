export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  mood?: string;
  moodScore?: number; // 心情评分 1-10
  weather?: string;
  location?: string;
  activities?: string[]; // 活动标签
  images?: string[]; // 图片URLs
  audioUrl?: string; // 语音记录URL
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isPrivate?: boolean; // 是否私密
  color?: string; // 主题色彩
}

export interface MoodStats {
  date: string;
  score: number;
  mood: string;
}

export interface WeeklyMoodData {
  week: string;
  averageScore: number;
  entries: MoodStats[];
}

export interface MonthlyMoodData {
  month: string;
  averageScore: number;
  weeks: WeeklyMoodData[];
}

// 心情选项
export const MOOD_OPTIONS = [
  { value: 'happy', label: '开心', emoji: '😊', color: '#FFD93D', score: 8 },
  { value: 'excited', label: '兴奋', emoji: '🤩', color: '#FF6B6B', score: 9 },
  { value: 'calm', label: '平静', emoji: '😌', color: '#4ECDC4', score: 7 },
  { value: 'neutral', label: '一般', emoji: '😐', color: '#95A5A6', score: 5 },
  { value: 'tired', label: '疲惫', emoji: '😴', color: '#9B59B6', score: 4 },
  { value: 'sad', label: '难过', emoji: '😢', color: '#3498DB', score: 3 },
  { value: 'angry', label: '生气', emoji: '😠', color: '#E74C3C', score: 2 },
  { value: 'anxious', label: '焦虑', emoji: '😰', color: '#F39C12', score: 3 },
];

// 天气选项
export const WEATHER_OPTIONS = [
  { value: 'sunny', label: '晴天', emoji: '☀️' },
  { value: 'cloudy', label: '多云', emoji: '☁️' },
  { value: 'rainy', label: '雨天', emoji: '🌧️' },
  { value: 'snowy', label: '雪天', emoji: '❄️' },
  { value: 'windy', label: '大风', emoji: '💨' },
  { value: 'foggy', label: '雾天', emoji: '🌫️' },
];

// 活动标签
export const ACTIVITY_OPTIONS = [
  { value: 'work', label: '工作', emoji: '💼', color: '#3498DB' },
  { value: 'study', label: '学习', emoji: '📚', color: '#9B59B6' },
  { value: 'exercise', label: '运动', emoji: '🏃‍♂️', color: '#E74C3C' },
  { value: 'travel', label: '旅行', emoji: '✈️', color: '#1ABC9C' },
  { value: 'food', label: '美食', emoji: '🍽️', color: '#F39C12' },
  { value: 'friends', label: '朋友', emoji: '👥', color: '#E67E22' },
  { value: 'family', label: '家人', emoji: '👨‍👩‍👧‍👦', color: '#E91E63' },
  { value: 'hobby', label: '爱好', emoji: '🎨', color: '#9C27B0' },
  { value: 'relax', label: '放松', emoji: '🧘‍♀️', color: '#4CAF50' },
  { value: 'shopping', label: '购物', emoji: '🛍️', color: '#FF5722' },
];
