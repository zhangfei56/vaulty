import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AISuggestion } from '../types/ai';

interface AIState {
  suggestions: AISuggestion[];
  loading: boolean;
  error: string | null;
}

const initialState: AIState = {
  suggestions: [],
  loading: false,
  error: null,
};

export const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    fetchSuggestionsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSuggestionsSuccess: (state, action: PayloadAction<AISuggestion[]>) => {
      state.suggestions = action.payload;
      state.loading = false;
    },
    fetchSuggestionsError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addSuggestion: (state, action: PayloadAction<AISuggestion>) => {
      state.suggestions.push(action.payload);
    },
    updateSuggestionStatus: (
      state,
      action: PayloadAction<{ id: string; status: AISuggestion['status'] }>
    ) => {
      const index = state.suggestions.findIndex(
        (suggestion) => suggestion.id === action.payload.id
      );
      if (index !== -1) {
        state.suggestions[index].status = action.payload.status;
      }
    },
  },
});

export const {
  fetchSuggestionsStart,
  fetchSuggestionsSuccess,
  fetchSuggestionsError,
  addSuggestion,
  updateSuggestionStatus,
} = aiSlice.actions;

export default aiSlice.reducer;
