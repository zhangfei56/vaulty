import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { format, subDays } from 'date-fns';
import {
  AppUsageStat,
  DailyUsageStat,
  HourlyUsageStat,
} from '../types/appUsage';
import { appUsageService } from '../services/appUsageService';

// 状态接口定义
interface StatsState {
  appUsageStats: AppUsageStat[];
  dailyStats: DailyUsageStat[];
  hourlyStats: HourlyUsageStat[];
  dailyTopApps: AppUsageStat[];
  selectedDateRange: {
    startDate: string;
    endDate: string;
  };
  selectedDate: string; // 当前选择的日期，用于小时统计和每日应用排行
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
  hourlyStats: [],
  dailyTopApps: [],
  selectedDateRange: {
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  },
  selectedDate: format(new Date(), 'yyyy-MM-dd'), // 默认为今天
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

// 新增：获取小时统计
export const fetchHourlyUsageStats = createAsyncThunk(
  'stats/fetchHourlyUsageStats',
  async (date: string, { rejectWithValue }) => {
    try {
      const stats = await appUsageService.getHourlyUsageStats(date);
      return stats;
    } catch (error) {
      return rejectWithValue(
        (error as Error).message || '获取每小时使用统计失败'
      );
    }
  }
);

// 新增：获取当日排行应用
export const fetchDailyTopApps = createAsyncThunk(
  'stats/fetchDailyTopApps',
  async (
    { date, limit }: { date: string; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const stats = await appUsageService.getDailyTopApps(date, limit);
      return stats;
    } catch (error) {
      return rejectWithValue(
        (error as Error).message || '获取当日应用排行失败'
      );
    }
  }
);

// 新增：为Web生成模拟数据
export const generateMockData = createAsyncThunk(
  'stats/generateMockData',
  async (date: string, { rejectWithValue }) => {
    try {
      const success = await appUsageService.generateMockDataForWeb(date);
      return { success, date };
    } catch (error) {
      return rejectWithValue((error as Error).message || '生成模拟数据失败');
    }
  }
);

// 新增：生成过去N天的模拟数据
export const generatePastDaysMockData = createAsyncThunk(
  'stats/generatePastDaysMockData',
  async (days: number = 30, { rejectWithValue }) => {
    try {
      const success = await appUsageService.generatePastDaysMockData(days);
      return { success, days };
    } catch (error) {
      return rejectWithValue(
        (error as Error).message || '生成过去天数数据失败'
      );
    }
  }
);

// 新增：一键初始化模拟数据
export const initMockData = createAsyncThunk(
  'stats/initMockData',
  async (_, { rejectWithValue }) => {
    try {
      const success = await appUsageService.initMockData();
      return { success };
    } catch (error) {
      return rejectWithValue((error as Error).message || '初始化模拟数据失败');
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
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    resetStats: (state) => {
      state.appUsageStats = [];
      state.dailyStats = [];
      state.hourlyStats = [];
      state.dailyTopApps = [];
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

    // 获取每小时使用统计
    builder.addCase(fetchHourlyUsageStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchHourlyUsageStats.fulfilled, (state, action) => {
      state.loading = false;
      state.hourlyStats = action.payload;
    });
    builder.addCase(fetchHourlyUsageStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 获取当日应用排行
    builder.addCase(fetchDailyTopApps.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDailyTopApps.fulfilled, (state, action) => {
      state.loading = false;
      state.dailyTopApps = action.payload;
    });
    builder.addCase(fetchDailyTopApps.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 生成模拟数据
    builder.addCase(generateMockData.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateMockData.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.success) {
        state.error = null;
      }
    });
    builder.addCase(generateMockData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 生成过去N天模拟数据
    builder.addCase(generatePastDaysMockData.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(generatePastDaysMockData.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.success) {
        state.error = null;
      }
    });
    builder.addCase(generatePastDaysMockData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // 初始化模拟数据
    builder.addCase(initMockData.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(initMockData.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.success) {
        state.error = null;
      }
    });
    builder.addCase(initMockData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

// 导出 action creators
export const { setDateRange, setSelectedDate, resetStats } = statsSlice.actions;

// 导出 reducer
export default statsSlice.reducer;
