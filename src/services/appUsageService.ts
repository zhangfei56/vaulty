import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  AppInfo,
  AppUsageEvent,
  AppUsagePlugin,
} from '../types/app-usage.capacitor';
import {
  AppUsageStat,
  DailyUsageStat,
  HourlyUsageStat,
} from '../types/appUsage';
import { AppUsageRepository } from './data-source/AppUsageRepository';
import { mockDataService } from './mockDataService';

// 注册 Capacitor 插件
const AppUsage = registerPlugin<AppUsagePlugin>('AppUsage');

// App 使用会话数据结构
export interface AppUsageSession {
  packageName: string;
  appName: string;
  startTime: number;
  endTime: number;
  duration: number;
  icon?: string;
}

// 应用使用报告数据结构
export interface AppUsageReport {
  startTime: number;
  endTime: number;
  totalUsageTime: number;
  sessions: AppUsageSession[];
  appsSummary: {
    packageName: string;
    appName: string;
    totalTime: number;
    launchCount: number;
    icon?: string;
  }[];
}

/**
 * 应用使用情况统计服务
 */
class AppUsageService {
  // 应用信息缓存
  private appInfoCache: Map<string, AppInfo> = new Map();

  // 数据仓库
  private repository: AppUsageRepository;

  constructor() {
    this.repository = AppUsageRepository.getInstance();
  }

  /**
   * 检查当前平台是否支持应用使用情况统计
   */
  isSupported(): boolean {
    return (
      Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
    );
  }

  /**
   * 检查是否有使用情况统计的权限
   */
  async hasPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const { value } = await AppUsage.hasUsagePermission();
      return value;
    } catch (error) {
      console.error('Failed to check usage stats permission:', error);
      return false;
    }
  }

  /**
   * 请求使用情况统计的权限
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const { value } = await AppUsage.requestUsagePermission();
      return value;
    } catch (error) {
      console.error('Failed to request usage stats permission:', error);
      return false;
    }
  }

  /**
   * 获取所有已安装的应用信息
   */
  async getInstalledApps(includeIcons = false): Promise<AppInfo[]> {
    if (!this.isSupported()) {
      return [];
    }

    try {
      const { apps } = await AppUsage.getInstalledApps({ includeIcons });

      // 更新缓存
      apps.forEach((app) => {
        this.appInfoCache.set(app.packageName, app);
      });

      return apps;
    } catch (error) {
      console.error('Failed to get installed apps:', error);
      return [];
    }
  }

  /**
   * 获取指定应用的信息
   */
  async getAppInfo(packageName: string): Promise<AppInfo | null> {
    // 检查缓存
    if (this.appInfoCache.has(packageName)) {
      return this.appInfoCache.get(packageName)!;
    }

    if (!this.isSupported()) {
      return null;
    }

    try {
      const appInfo = await AppUsage.getAppInfo({ packageName });

      // 更新缓存
      this.appInfoCache.set(packageName, appInfo);

      return appInfo;
    } catch (error) {
      // 如果找不到应用，记录警告但不抛出错误
      console.warn(`无法获取应用信息: ${packageName}`, error);

      // 缓存null结果，避免重复查询
      this.appInfoCache.set(packageName, null as any);

      return null;
    }
  }

  /**
   * 获取一段时间内的应用使用报告
   */
  async getUsageReport(
    startTime: number,
    endTime: number
  ): Promise<AppUsageReport | null> {
    if (!this.isSupported() || !(await this.hasPermission())) {
      return null;
    }

    try {
      // 查询原始使用事件数据
      const { events } = await AppUsage.queryEvents({ startTime, endTime });

      // 转换为应用使用会话
      const sessions = this.processEventsToSessions(events);

      // 生成使用报告
      const report = await this.generateReport(sessions, startTime, endTime);
      return report;
    } catch (error) {
      console.error('Failed to get usage report:', error);
      return null;
    }
  }

  /**
   * 处理原始事件数据，转换为应用使用会话
   */
  private processEventsToSessions(events: AppUsageEvent[]): AppUsageSession[] {
    const sessions: AppUsageSession[] = [];
    const appResumeEvents: Map<string, number> = new Map();

    // 按时间排序
    events.sort((a, b) => a.timestamp - b.timestamp);

    for (const event of events) {
      if (event.eventType === 'ACTIVITY_RESUMED') {
        // 应用进入前台
        appResumeEvents.set(event.packageName, event.timestamp);
      } else if (event.eventType === 'ACTIVITY_PAUSED') {
        // 应用退出前台
        const startTime = appResumeEvents.get(event.packageName);
        if (startTime) {
          const duration = event.timestamp - startTime;

          // 只添加持续时间大于500毫秒的会话（排除可能的噪音数据）
          if (duration > 500) {
            sessions.push({
              packageName: event.packageName,
              appName: '', // 后续填充
              startTime,
              endTime: event.timestamp,
              duration,
            });
          }

          appResumeEvents.delete(event.packageName);
        }
      }
    }

    // 处理未配对的前台事件（可能是应用仍在前台）
    const now = Date.now();
    appResumeEvents.forEach((startTime, packageName) => {
      const duration = now - startTime;
      if (duration > 500) {
        sessions.push({
          packageName,
          appName: '',
          startTime,
          endTime: now,
          duration,
        });
      }
    });

    return sessions;
  }

  /**
   * 生成应用使用报告
   */
  private async generateReport(
    sessions: AppUsageSession[],
    startTime: number,
    endTime: number
  ): Promise<AppUsageReport> {
    // 填充应用名称和图标
    await Promise.all(
      sessions.map(async (session) => {
        try {
          const appInfo = await this.getAppInfo(session.packageName);
          if (appInfo) {
            session.appName = appInfo.appName;
            session.icon = appInfo.icon;
          } else {
            // 如果找不到应用信息，使用包名作为应用名
            session.appName = this.getDisplayNameFromPackage(
              session.packageName
            );
          }
        } catch (error) {
          // 如果获取应用信息失败，使用包名作为应用名
          console.warn(`无法获取应用信息: ${session.packageName}`, error);
          session.appName = this.getDisplayNameFromPackage(session.packageName);
        }
      })
    );

    // 计算每个应用的总使用时间和启动次数
    const appSummaryMap = new Map<
      string,
      { totalTime: number; launchCount: number; appName: string; icon?: string }
    >();

    for (const session of sessions) {
      const { packageName, appName, duration, icon } = session;

      if (!appSummaryMap.has(packageName)) {
        appSummaryMap.set(packageName, {
          totalTime: 0,
          launchCount: 0,
          appName,
          icon,
        });
      }

      const summary = appSummaryMap.get(packageName)!;
      summary.totalTime += duration;
      summary.launchCount += 1;
    }

    // 按使用时间排序
    const appsSummary = Array.from(appSummaryMap.entries()).map(
      ([packageName, summary]) => ({
        packageName,
        ...summary,
      })
    );

    appsSummary.sort((a, b) => b.totalTime - a.totalTime);

    // 计算总的使用时间
    const totalUsageTime = appsSummary.reduce(
      (sum, app) => sum + app.totalTime,
      0
    );

    return {
      startTime,
      endTime,
      totalUsageTime,
      sessions,
      appsSummary,
    };
  }

  /**
   * 从包名生成显示名称
   */
  private getDisplayNameFromPackage(packageName: string): string {
    // 移除常见的包名前缀
    let displayName = packageName
      .replace(/^com\./, '')
      .replace(/^android\./, '')
      .replace(/^org\./, '');

    // 将点号替换为空格，并将每个单词首字母大写
    displayName = displayName
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    // 处理一些特殊情况
    const specialCases: { [key: string]: string } = {
      'google.android.apps.nexuslauncher': 'Nexus Launcher',
      'google.android.gm': 'Gmail',
      'google.android.youtube': 'YouTube',
      'google.android.apps.maps': 'Google Maps',
      whatsapp: 'WhatsApp',
      'instagram.android': 'Instagram',
      'facebook.katana': 'Facebook',
      'twitter.android': 'Twitter',
    };

    for (const [key, value] of Object.entries(specialCases)) {
      if (packageName.includes(key)) {
        return value;
      }
    }

    return displayName || packageName;
  }

  /**
   * 同步应用使用数据
   * 从系统获取应用使用数据并保存到数据库
   */
  async syncAppUsageData(): Promise<boolean> {
    if (!this.isSupported() || !(await this.hasPermission())) {
      throw new Error('不支持的平台或没有足够权限');
    }

    try {
      // 获取上次同步时间
      const lastSync = await this.repository.getLastSyncTime();
      const now = Date.now();

      // 查询系统应用使用数据
      const report = await this.getUsageReport(lastSync, now);
      console.log('report', report);

      if (!report || !report.sessions.length) {
        console.log('没有新的使用数据需要同步');
        return true;
      }

      // 将会话数据转换为数据库记录格式
      const records = report.sessions.map((session) => {
        const date = new Date(session.startTime);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        return {
          packageName: session.packageName,
          appName: session.appName,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          date: dateString,
          icon: session.icon,
        };
      });

      // 保存到仓库
      const saveResult = await this.repository.saveAppUsageRecords(records);

      if (!saveResult) {
        throw new Error('保存应用使用记录失败');
      }

      // 更新同步时间
      await this.repository.saveLastSyncTime(now);

      return true;
    } catch (error) {
      console.error('同步应用使用数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取应用使用统计数据
   * 按应用分组的使用统计
   * 实现所需接口，直接委托给仓库
   */
  async getUsageStats(
    startDate: string,
    endDate: string
  ): Promise<AppUsageStat[]> {
    return await this.repository.getUsageStats(startDate, endDate);
  }

  /**
   * 获取每日使用统计数据
   * 按日期分组的使用统计
   * 实现所需接口，直接委托给仓库
   */
  async getDailyUsageStats(
    startDate: string,
    endDate: string
  ): Promise<DailyUsageStat[]> {
    return await this.repository.getDailyUsageStats(startDate, endDate);
  }

  /**
   * 获取指定日期的每小时使用统计
   * @param date 日期 (YYYY-MM-DD)
   */
  async getHourlyUsageStats(date: string): Promise<HourlyUsageStat[]> {
    try {
      return await this.repository.getHourlyUsageStats(date);
    } catch (error) {
      console.error('获取每小时使用统计失败:', error);
      return [];
    }
  }

  /**
   * 获取指定日期使用时间最长的应用
   * @param date 日期 (YYYY-MM-DD)
   * @param limit 返回的应用数量限制
   */
  async getDailyTopApps(
    date: string,
    limit: number = 10
  ): Promise<AppUsageStat[]> {
    try {
      return await this.repository.getDailyTopApps(date, limit);
    } catch (error) {
      console.error(`获取日期 ${date} 最常用的 ${limit} 个应用失败:`, error);
      return [];
    }
  }

  /**
   * 为Web环境生成模拟数据
   * @param date 要生成数据的日期 (YYYY-MM-DD)
   */
  async generateMockDataForWeb(date: string): Promise<boolean> {
    // 只在Web环境下使用模拟数据
    if (Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      return await mockDataService.generateDailyMockData(date);
    } catch (error) {
      console.error('生成模拟数据失败:', error);
      return false;
    }
  }

  /**
   * 为Web环境生成过去N天的模拟数据
   * @param days 过去的天数
   */
  async generatePastDaysMockData(days: number = 30): Promise<boolean> {
    // 只在Web环境下使用模拟数据
    if (Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      return await mockDataService.generatePastDaysMockData(days);
    } catch (error) {
      console.error(`生成过去${days}天的模拟数据失败:`, error);
      return false;
    }
  }

  /**
   * 一键初始化模拟数据
   */
  async initMockData(): Promise<boolean> {
    // 只在Web环境下使用模拟数据
    if (Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      return await mockDataService.initializeMockData();
    } catch (error) {
      console.error('初始化模拟数据失败:', error);
      return false;
    }
  }
}

export const appUsageService = new AppUsageService();
