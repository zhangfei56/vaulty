import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { format, subDays } from 'date-fns';
import { AppUsageStat, DailyUsageStat } from '../types/appUsage';
import { appUsageService } from '../services/appUsageService';

// 状态接口定义
interface StatsState {
  appUsageStats: AppUsageStat[];
  dailyStats: DailyUsageStat[];
  selectedDateRange: {
    startDate: string;
    endDate: string;
  };
  totalUsageTime: number;
  mostUsedApps: AppUsageStat[];
  syncStatus: {
    lastSync: number;
    syncing: boolean;
    error: string | null;
  };
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
}

// 初始状态
const initialState: StatsState = {
  appUsageStats: [],
  dailyStats: [],
  selectedDateRange: {
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  },
  totalUsageTime: 0,
  mostUsedApps: [],
  syncStatus: {
    lastSync: 0,
    syncing: false,
    error: null,
  },
  hasPermission: false,
  loading: false,
  error: null,
};

// 异步操作：检查权限
export const checkPermission = createAsyncThunk(
  'stats/checkPermission',
  async () => {
    return await appUsageService.hasPermission();
  }
);

// 异步操作：请求权限
export const requestPermission = createAsyncThunk(
  'stats/requestPermission',
  async () => {
    return await appUsageService.requestPermission();
  }
);

// 异步操作：同步应用使用数据
export const syncAppUsageData = createAsyncThunk(
  'stats/syncAppUsageData',
  async (_, { rejectWithValue }) => {
    try {
      await appUsageService.syncAppUsageData();
      return true;
    } catch (error) {
      return rejectWithValue((error as Error).message || '同步数据失败');
    }
  }
);

// 异步操作：获取应用使用统计
export const fetchAppUsageStats = createAsyncThunk(
  'stats/fetchAppUsageStats',
  async (
    dateRange: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      const stats = await appUsageService.getUsageStats(
        dateRange.startDate,
        dateRange.endDate
      );
      return stats;
    } catch (error) {
      return rejectWithValue(
        (error as Error).message || '获取应用使用统计失败'
      );
    }
  }
);

// 异步操作：获取每日使用统计
export const fetchDailyUsageStats = createAsyncThunk(
  'stats/fetchDailyUsageStats',
  async (
    dateRange: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      const stats = await appUsageService.getDailyUsageStats(
        dateRange.startDate,
        dateRange.endDate
      );
      return stats;
    } catch (error) {
      return rejectWithValue(
        (error as Error).message || '获取每日使用统计失败'
      );
    }
  }
);

// 创建 Redux Slice
export const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setDateRange: (
      state,
      action: PayloadAction<{ startDate: string; endDate: string }>
    ) => {
      state.selectedDateRange = action.payload;
    },
    resetStats: (state) => {
      state.appUsageStats = [];
      state.dailyStats = [];
      state.totalUsageTime = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 检查权限
    builder.addCase(checkPermission.fulfilled, (state, action) => {
      state.hasPermission = action.payload;
    });
    builder.addCase(requestPermission.fulfilled, (state, action) => {
      state.hasPermission = action.payload;
    });

    // 同步应用使用数据
    builder.addCase(syncAppUsageData.pending, (state) => {
      state.syncStatus.syncing = true;
      state.syncStatus.error = null;
    });
    builder.addCase(syncAppUsageData.fulfilled, (state) => {
      state.syncStatus.syncing = false;
      state.syncStatus.lastSync = Date.now();
    });
    builder.addCase(syncAppUsageData.rejected, (state, action) => {
      state.syncStatus.syncing = false;
      state.syncStatus.error = action.payload as string;
    });

    // 获取应用使用统计
    builder.addCase(fetchAppUsageStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAppUsageStats.fulfilled, (state, action) => {
      state.loading = false;
      state.appUsageStats = action.payload;

      // 计算总使用时间
      state.totalUsageTime = action.payload.reduce(
        (total, app) => total + app.totalDuration,
        0
      );

      // 获取使用时间最长的5个应用
      state.mostUsedApps = [...action.payload]
        .sort((a, b) => b.totalDuration - a.totalDuration)
        .slice(0, 5);
    });
    builder.addCase(fetchAppUsageStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取每日使用统计
    builder.addCase(fetchDailyUsageStats.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchDailyUsageStats.fulfilled, (state, action) => {
      state.loading = false;
      state.dailyStats = action.payload;
    });
    builder.addCase(fetchDailyUsageStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// 导出 action creators
export const { setDateRange, resetStats } = statsSlice.actions;

// 导出 reducer
export default statsSlice.reducer;
