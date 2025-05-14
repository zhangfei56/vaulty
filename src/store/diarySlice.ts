import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DiaryEntry } from '../types/diary';

interface DiaryState {
  entries: DiaryEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: DiaryState = {
  entries: [],
  loading: false,
  error: null,
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
      state.entries.push(action.payload);
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
  },
});

export const {
  fetchDiaryStart,
  fetchDiarySuccess,
  fetchDiaryError,
  addDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} = diarySlice.actions;

export default diarySlice.reducer;
