import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DiaryEntry, WeeklyMoodData, MonthlyMoodData } from '../types/diary';

interface DiaryState {
  entries: DiaryEntry[];
  loading: boolean;
  error: string | null;
  currentFilter: {
    mood?: string;
    weather?: string;
    activities?: string[];
    dateRange?: { start: string; end: string };
    searchText?: string;
  };
  moodStats: {
    weekly: WeeklyMoodData[];
    monthly: MonthlyMoodData[];
  };
  showPrivateEntries: boolean;
}

const initialState: DiaryState = {
  entries: [], // 加载模拟数据用于演示
  loading: false,
  error: null,
  currentFilter: {},
  moodStats: {
    weekly: [],
    monthly: [],
  },
  showPrivateEntries: true,
};

export const diarySlice = createSlice({
  name: 'diary',
  initialState,
  reducers: {
    fetchDiaryStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDiarySuccess: (state, action: PayloadAction<DiaryEntry[]>) => {
      state.entries = action.payload;
      state.loading = false;
    },
    fetchDiaryError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addDiaryEntry: (state, action: PayloadAction<DiaryEntry>) => {
      state.entries.unshift(action.payload);
    },
    updateDiaryEntry: (state, action: PayloadAction<DiaryEntry>) => {
      const index = state.entries.findIndex(
        (entry) => entry.id === action.payload.id
      );
      if (index !== -1) {
        state.entries[index] = action.payload;
      }
    },
    deleteDiaryEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(
        (entry) => entry.id !== action.payload
      );
    },
    setFilter: (state, action: PayloadAction<Partial<DiaryState['currentFilter']>>) => {
      state.currentFilter = { ...state.currentFilter, ...action.payload };
    },
    clearFilter: (state) => {
      state.currentFilter = {};
    },
    updateMoodStats: (state, action: PayloadAction<{ weekly: WeeklyMoodData[]; monthly: MonthlyMoodData[] }>) => {
      state.moodStats = action.payload;
    },
    togglePrivateEntries: (state) => {
      state.showPrivateEntries = !state.showPrivateEntries;
    },
  },
});

export const {
  fetchDiaryStart,
  fetchDiarySuccess,
  fetchDiaryError,
  addDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  setFilter,
  clearFilter,
  updateMoodStats,
  togglePrivateEntries,
} = diarySlice.actions;

export default diarySlice.reducer;
