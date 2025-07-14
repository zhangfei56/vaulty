import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  AppInfo,
  AppUsageEvent,
  AppUsagePlugin,
} from '../types/app-usage.capacitor';
import {
  AppUsageStat,
  HourlyUsageStat,
} from '../types/appUsage';
import { AppUsageRepository } from './data-source/AppUsageRepository';
import { InstalledAppRepository } from './data-source/InstalledAppRepository';
import { AppUsageRawEventRepository } from './data-source/AppUsageRawEventRepository';
import { AppUsageHourlyStatsRepository } from './data-source/AppUsageHourlyStatsRepository';
import { SimpleWebDatabase } from './data-source/SimpleWebDatabase';

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
  private webDatabase: SimpleWebDatabase;
  private installedAppRepository: InstalledAppRepository;
  private rawEventRepository: AppUsageRawEventRepository;
  private hourlyStatsRepository: AppUsageHourlyStatsRepository;

  constructor() {
    this.repository = AppUsageRepository.getInstance();
    this.webDatabase = SimpleWebDatabase.getInstance();
    this.installedAppRepository = InstalledAppRepository.getInstance();
    this.rawEventRepository = AppUsageRawEventRepository.getInstance();
    this.hourlyStatsRepository = AppUsageHourlyStatsRepository.getInstance();
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
  async getAppInfo(packageName: string, includeIcon: boolean = true): Promise<AppInfo | null> {
    // 检查缓存
    if (this.appInfoCache.has(packageName)) {
      const cachedInfo = this.appInfoCache.get(packageName)!;
      // 如果需要图标但缓存中没有，重新获取
      if (includeIcon && !cachedInfo.icon) {
        // 清除缓存，重新获取
        this.appInfoCache.delete(packageName);
      } else {
        return cachedInfo;
      }
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

          // 只记录有效的会话（持续时间大于0）
          if (duration > 0) {
            sessions.push({
              packageName: event.packageName,
              appName: this.getDisplayNameFromPackage(event.packageName),
              startTime,
              endTime: event.timestamp,
              duration,
            });
          }

          // 清除开始时间
          appResumeEvents.delete(event.packageName);
        }
      }
    }

    return sessions;
  }

  /**
   * 生成使用报告
   */
  private async generateReport(
    sessions: AppUsageSession[],
    startTime: number,
    endTime: number
  ): Promise<AppUsageReport> {
    const totalUsageTime = sessions.reduce(
      (total, session) => total + session.duration,
      0
    );

    // 按应用分组统计
    const appStats = new Map<string, { totalTime: number; launchCount: number }>();

    for (const session of sessions) {
      const existing = appStats.get(session.packageName);
      if (existing) {
        existing.totalTime += session.duration;
        existing.launchCount += 1;
      } else {
        appStats.set(session.packageName, {
          totalTime: session.duration,
          launchCount: 1,
        });
      }
    }

    const appsSummary = Array.from(appStats.entries()).map(
      ([packageName, stats]) => ({
        packageName,
        appName: this.getDisplayNameFromPackage(packageName),
        totalTime: stats.totalTime,
        launchCount: stats.launchCount,
      })
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
   * 从包名获取显示名称
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
      console.log('开始同步应用使用数据...');
      const now = Date.now();

      // 第一步：同步已安装应用信息到数据库（包含本地化名称和图标）
      console.log('正在同步已安装应用信息到数据库...');
      const installedApps = await this.getInstalledApps(true); // 包含图标
      console.log(`成功获取 ${installedApps.length} 个已安装应用信息`);

      // 将已安装应用信息保存到数据库
      const syncAppsResult = await this.installedAppRepository.syncInstalledApps(installedApps, now);
      if (!syncAppsResult) {
        throw new Error('同步已安装应用信息到数据库失败');
      }

      // 更新内存缓存
      const appInfoMap = new Map<string, AppInfo>();
      installedApps.forEach(app => {
        this.appInfoCache.set(app.packageName, app);
        appInfoMap.set(app.packageName, app);
      });

      // 第二步：获取原始事件数据
      const lastSync = await this.repository.getLastSyncTime();
      console.log(`查询原始事件数据: ${new Date(lastSync).toLocaleString()} - ${new Date(now).toLocaleString()}`);
      
      const { events } = await AppUsage.queryEvents({ startTime: lastSync, endTime: now });
      
      if (!events || events.length === 0) {
        console.log('没有新的原始事件数据需要同步');
        // 即使没有新的事件数据，也更新同步时间
        await this.repository.saveLastSyncTime(now);
        return true;
      }

      console.log(`发现 ${events.length} 条原始事件数据`);

      // 第三步：保存原始事件数据到数据库
      const saveRawEventsResult = await this.rawEventRepository.saveRawEvents(events);
      if (!saveRawEventsResult) {
        throw new Error('保存原始事件数据失败');
      }

      // 第四步：处理原始事件数据，生成使用会话记录
      const sessions = this.processEventsToSessions(events);
      
      if (sessions.length === 0) {
        console.log('没有有效的使用会话数据');
        await this.repository.saveLastSyncTime(now);
        return true;
      }

      console.log(`生成 ${sessions.length} 条使用会话记录`);

      // 第五步：将使用会话数据与数据库中的应用信息合并
      const records = sessions.map((session) => {
        const date = new Date(session.startTime);
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        // 从内存缓存中获取应用信息（已从数据库同步）
        const appInfo = appInfoMap.get(session.packageName);
        const appName = appInfo?.appName || this.getDisplayNameFromPackage(session.packageName);
        const appIcon = appInfo?.icon;

        return {
          packageName: session.packageName,
          appName: appName,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          date: dateString,
          icon: appIcon,
        };
      });

      // 第六步：保存使用记录到数据库
      console.log(`正在保存 ${records.length} 条使用记录...`);
      const saveResult = await this.repository.saveAppUsageRecords(records);

      if (!saveResult) {
        throw new Error('保存应用使用记录失败');
      }

      // 第七步：聚合小时统计数据
      const affectedDates = new Set(records.map(r => r.date));
      console.log(`正在聚合 ${affectedDates.size} 个日期的小时统计数据...`);
      
      let aggregatedDates = 0;
      for (const date of affectedDates) {
        const aggregateResult = await this.hourlyStatsRepository.aggregateHourlyStats(date);
        if (aggregateResult) {
          aggregatedDates++;
        }
      }
      
      console.log(`✅ 成功聚合 ${aggregatedDates}/${affectedDates.size} 个日期的小时统计数据`);

      // 第八步：更新同步时间
      await this.repository.saveLastSyncTime(now);

      const uniqueApps = new Set(records.map(r => r.packageName)).size;
      console.log(`✅ 同步完成: ${events.length} 条原始事件，${records.length} 条使用记录，涉及 ${uniqueApps} 个应用`);
      return true;
    } catch (error) {
      console.error('❌ 同步应用使用数据失败:', error);
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
    if (Capacitor.isNativePlatform()) {
      return await this.repository.getUsageStats(startDate, endDate);
    } else {
      // Web环境使用简单数据库
      return await this.webDatabase.getUsageStats(startDate, endDate);
    }
  }

  /**
   * 获取指定日期的每小时使用统计
   * @param date 日期 (YYYY-MM-DD)
   */
  async getHourlyUsageStats(date: string): Promise<HourlyUsageStat[]> {
    try {
      if (Capacitor.isNativePlatform()) {
        // 原生环境：优先从聚合表查询，如果没有则从原始事件计算
        console.log(`获取日期 ${date} 的每小时使用统计...`);
        
        // 1. 尝试从聚合表查询
        const aggregatedStats = await this.hourlyStatsRepository.getHourlyUsageStats(date);
        
        // 检查是否有数据
        const hasData = aggregatedStats.some(stat => stat.totalDuration > 0);
        
        if (hasData) {
          console.log(`✅ 从聚合表获取日期 ${date} 的小时统计数据`);
          return aggregatedStats;
        }
        
        // 2. 如果聚合表没有数据，尝试从原始事件计算
        console.log(`聚合表无数据，从原始事件计算日期 ${date} 的小时统计...`);
        const rawStats = await this.rawEventRepository.getHourlyUsageStats(date);
        
        // 3. 如果原始事件有数据，则同时聚合保存到聚合表
        const hasRawData = rawStats.some(stat => stat.totalDuration > 0);
        if (hasRawData) {
          console.log(`从原始事件计算出数据，同时聚合保存到聚合表...`);
          await this.hourlyStatsRepository.aggregateHourlyStats(date);
        }
        
        return rawStats;
      } else {
        // Web环境使用简单数据库
        return await this.webDatabase.getHourlyUsageStats(date);
      }
    } catch (error) {
      console.error('获取每小时使用统计失败:', error);
      return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        totalDuration: 0,
        apps: [],
      }));
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
      if (Capacitor.isNativePlatform()) {
        return await this.repository.getDailyTopApps(date, limit);
      } else {
        // Web环境使用简单数据库
        return await this.webDatabase.getDailyTopApps(date, limit);
      }
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
      return await this.webDatabase.generateDailyMockData(date);
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
      return await this.webDatabase.generatePastDaysMockData(days);
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
      await this.webDatabase.initialize();
      return true;
    } catch (error) {
      console.error('初始化模拟数据失败:', error);
      return false;
    }
  }

  /**
   * 获取应用使用统计数据（与数据库中的应用信息关联）
   * 使用INNER JOIN查询，确保只返回仍然安装的应用的统计数据
   */
  async getUsageStatsWithAppDetails(
    startDate: string,
    endDate: string
  ): Promise<AppUsageStat[]> {
    try {
      if (Capacitor.isNativePlatform()) {
        // 原生环境使用数据库关联查询
        return await this.installedAppRepository.getUsageStatsWithAppDetails(startDate, endDate);
      } else {
        // Web环境使用简单数据库
        return await this.webDatabase.getUsageStats(startDate, endDate);
      }
    } catch (error) {
      console.error('获取应用使用统计和详情失败:', error);
      return [];
    }
  }

  /**
   * 获取已安装应用的统计信息
   */
  async getInstalledAppStats(): Promise<{
    totalApps: number;
    systemApps: number;
    userApps: number;
    deletedApps: number;
  }> {
    if (Capacitor.isNativePlatform()) {
      return await this.installedAppRepository.getInstalledAppStats();
    } else {
      return {
        totalApps: 0,
        systemApps: 0,
        userApps: 0,
        deletedApps: 0
      };
    }
  }

  /**
   * 获取所有有效的已安装应用
   */
  async getActiveInstalledApps() {
    if (Capacitor.isNativePlatform()) {
      return await this.installedAppRepository.getActiveInstalledApps();
    } else {
      return [];
    }
  }

  /**
   * 清理过期的已删除应用记录
   */
  async cleanupDeletedApps(daysOld: number = 30): Promise<number> {
    if (Capacitor.isNativePlatform()) {
      return await this.installedAppRepository.cleanupDeletedApps(daysOld);
    } else {
      return 0;
    }
  }

  /**
   * 清理过期的原始事件数据
   */
  async cleanupOldRawEvents(daysOld: number = 30): Promise<number> {
    if (Capacitor.isNativePlatform()) {
      const beforeDate = new Date();
      beforeDate.setDate(beforeDate.getDate() - daysOld);
      const beforeDateString = beforeDate.toISOString().split('T')[0];
      return await this.rawEventRepository.cleanupOldEvents(beforeDateString);
    } else {
      return 0;
    }
  }

  /**
   * 清理过期的小时统计数据
   */
  async cleanupOldHourlyStats(daysOld: number = 90): Promise<number> {
    if (Capacitor.isNativePlatform()) {
      const beforeDate = new Date();
      beforeDate.setDate(beforeDate.getDate() - daysOld);
      const beforeDateString = beforeDate.toISOString().split('T')[0];
      return await this.hourlyStatsRepository.cleanupOldHourlyStats(beforeDateString);
    } else {
      return 0;
    }
  }

  /**
   * 数据维护：清理过期数据并优化存储
   * 建议定期执行（如每周执行一次）
   */
  async performDataMaintenance(): Promise<{
    deletedRawEvents: number;
    deletedHourlyStats: number;
    deletedApps: number;
    success: boolean;
  }> {
    const result = {
      deletedRawEvents: 0,
      deletedHourlyStats: 0,
      deletedApps: 0,
      success: false,
    };

    if (!Capacitor.isNativePlatform()) {
      console.log('Web环境不需要数据维护');
      result.success = true;
      return result;
    }

    try {
      console.log('开始执行数据维护...');

      // 清理过期的原始事件数据（保留30天）
      console.log('清理过期的原始事件数据...');
      result.deletedRawEvents = await this.cleanupOldRawEvents(30);

      // 清理过期的小时统计数据（保留90天）
      console.log('清理过期的小时统计数据...');
      result.deletedHourlyStats = await this.cleanupOldHourlyStats(90);

      // 清理过期的已删除应用记录（保留30天）
      console.log('清理过期的已删除应用记录...');
      result.deletedApps = await this.cleanupDeletedApps(30);

      result.success = true;
      console.log(`✅ 数据维护完成: 清理了 ${result.deletedRawEvents} 条原始事件, ${result.deletedHourlyStats} 条小时统计, ${result.deletedApps} 条应用记录`);
    } catch (error) {
      console.error('❌ 数据维护失败:', error);
      result.success = false;
    }

    return result;
  }
}

export const appUsageService = new AppUsageService();
