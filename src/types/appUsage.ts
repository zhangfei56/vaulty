/**
 * 应用使用事件类型
 */
export enum AppUsageEventType {
  ACTIVITY_RESUMED = 'ACTIVITY_RESUMED', // 应用进入前台
  ACTIVITY_PAUSED = 'ACTIVITY_PAUSED', // 应用退出前台
}

/**
 * 应用使用事件
 */
export interface AppUsageEvent {
  packageName: string; // 应用包名
  eventType: 'ACTIVITY_RESUMED' | 'ACTIVITY_PAUSED';
  timestamp: number; // 事件发生的时间戳
  className?: string;
}

/**
 * 应用信息
 */
export interface AppInfo {
  packageName: string; // 应用包名
  appName: string; // 应用名称
  versionName: string; // 版本名称
  versionCode: number; // 版本号
  firstInstallTime: number; // 首次安装时间
  lastUpdateTime: number; // 最后更新时间
  icon?: string; // 应用图标(base64)
  isSystemApp: boolean;
}

/**
 * 应用使用记录
 */
export interface AppUsageRecord {
  id?: number;
  packageName: string; // 应用包名
  appName: string; // 应用名称
  startTime: number; // 开始使用的时间戳
  endTime: number; // 结束使用的时间戳
  duration: number; // 使用时长(毫秒)
  date: string; // 日期(YYYY-MM-DD)
  icon?: string;
}

/**
 * 应用使用统计
 */
export interface AppUsageStat {
  packageName: string; // 应用包名
  appName: string; // 应用名称
  totalDuration: number; // 总使用时长(毫秒)
  usageCount: number; // 使用次数
  lastUsed: number; // 最后使用的时间戳
  icon?: string; // 应用图标(base64)
}

/**
 * 每日应用使用统计
 */
export interface DailyUsageStat {
  date: string; // 日期(YYYY-MM-DD)
  totalDuration: number; // 当日总使用时长(毫秒)
  apps: AppUsageStat[]; // 应用使用统计
}

export interface AppUsageStats {
  packageName: string;
  appName?: string;
  usageDuration: number; // Duration in milliseconds
  lastUsed: number; // Timestamp
  color?: string; // For chart display
}

export interface DailyAppUsage {
  date: string; // YYYY-MM-DD format
  totalUsage: number; // Total usage in milliseconds
  apps: AppUsageStats[];
}

export interface WeeklyAppUsage {
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  totalUsage: number; // Total usage in milliseconds
  dailyUsage: {
    [date: string]: number; // Date -> milliseconds
  };
  apps: AppUsageStats[];
}

export interface AppUsageSyncRequest {
  lastSyncTimestamp: number; // Last time we synced data
}

export interface AppUsageSyncResponse {
  events: AppUsageEvent[];
  success: boolean;
}
