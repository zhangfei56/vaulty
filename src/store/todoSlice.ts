import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Todo } from '../types/todo';

interface TodoState {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  todos: [],
  loading: false,
  error: null,
};

export const todoSlice = createSlice({
  name: 'todo',
  initialState,
  reducers: {
    fetchTodoStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTodoSuccess: (state, action: PayloadAction<Todo[]>) => {
      state.todos = action.payload;
      state.loading = false;
    },
    fetchTodoError: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addTodo: (state, action: PayloadAction<Todo>) => {
      state.todos.push(action.payload);
    },
    updateTodo: (state, action: PayloadAction<Todo>) => {
      const index = state.todos.findIndex(
        (todo) => todo.id === action.payload.id
      );
      if (index !== -1) {
        state.todos[index] = action.payload;
      }
    },
    deleteTodo: (state, action: PayloadAction<string>) => {
      state.todos = state.todos.filter((todo) => todo.id !== action.payload);
    },
    toggleTodo: (state, action: PayloadAction<string>) => {
      const index = state.todos.findIndex((todo) => todo.id === action.payload);
      if (index !== -1) {
        state.todos[index].completed = !state.todos[index].completed;
      }
    },
  },
});

export const {
  fetchTodoStart,
  fetchTodoSuccess,
  fetchTodoError,
  addTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
} = todoSlice.actions;

export default todoSlice.reducer;
