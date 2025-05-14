import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppEvent } from '../types/event';

interface EventState {
  events: AppEvent[];
  loading: boolean;
  error: string | null;
}

const initialState: EventState = {
  events: [],
  loading: false,
  error: null,
};

export const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    fetchEventsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchEventsSuccess: (state, action: PayloadAction<AppEvent[]>) => {
      state.events = action.payload;
      state.loading = false;
    },
    fetchEventsError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addEvent: (state, action: PayloadAction<AppEvent>) => {
      state.events.push(action.payload);
    },
    updateEvent: (state, action: PayloadAction<AppEvent>) => {
      const index = state.events.findIndex(
        (event) => event.id === action.payload.id
      );
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
  },
});

export const {
  fetchEventsStart,
  fetchEventsSuccess,
  fetchEventsError,
  addEvent,
  updateEvent,
} = eventSlice.actions;

export default eventSlice.reducer;
