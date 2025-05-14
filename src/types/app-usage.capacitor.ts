export interface AppUsagePlugin {
  /**
   * 检查是否有使用情况统计的权限
   */
  hasUsagePermission(): Promise<{ value: boolean }>;

  /**
   * 请求使用情况统计的权限
   */
  requestUsagePermission(): Promise<{ value: boolean }>;

  /**
   * 查询应用使用事件数据
   */
  queryEvents(options: { startTime: number; endTime: number }): Promise<{
    events: AppUsageEvent[];
  }>;

  /**
   * 获取特定应用的信息
   */
  getAppInfo(options: { packageName: string }): Promise<AppInfo>;

  /**
   * 获取所有已安装应用的信息
   */
  getInstalledApps(options: { includeIcons: boolean }): Promise<{
    apps: AppInfo[];
  }>;
}

export interface AppUsageEvent {
  packageName: string;
  className: string;
  timestamp: number;
  eventType: 'ACTIVITY_RESUMED' | 'ACTIVITY_PAUSED';
}

export interface AppInfo {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  firstInstallTime: number;
  lastUpdateTime: number;
  isSystemApp: boolean;
  icon?: string; // Base64 编码的图标
}
