import { configureStore } from '@reduxjs/toolkit';
import diaryReducer from './diarySlice';
import todoReducer from './todoSlice';
import eventReducer from './eventSlice';
import statsReducer from './statsSlice';
import aiReducer from './aiSlice';

export const store = configureStore({
  reducer: {
    diary: diaryReducer,
    todo: todoReducer,
    event: eventReducer,
    stats: statsReducer,
    ai: aiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
