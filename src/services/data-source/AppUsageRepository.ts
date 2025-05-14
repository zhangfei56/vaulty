import { AppUsageStat, DailyUsageStat } from '../../types/appUsage';
import { DatabaseManager } from './DatabaseManager';

/**
 * 应用使用数据仓库
 * 专门负责处理应用使用统计相关的数据库操作
 */
export class AppUsageRepository {
  private static instance: AppUsageRepository;
  private dbManager: DatabaseManager;

  /**
   * 获取单例实例
   */
  public static getInstance(): AppUsageRepository {
    if (!AppUsageRepository.instance) {
      AppUsageRepository.instance = new AppUsageRepository();
    }
    return AppUsageRepository.instance;
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.initializeTables();
  }

  /**
   * 初始化所需表
   */
  private async initializeTables(): Promise<void> {
    // 创建应用使用记录表
    const queryCreateAppUsageTable = `
      CREATE TABLE IF NOT EXISTS app_usage_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packageName TEXT NOT NULL,
        appName TEXT NOT NULL,
        startTime INTEGER NOT NULL,
        endTime INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        date TEXT NOT NULL,
        icon TEXT
      );
    `;

    const queryCreateSyncTable = `
      CREATE TABLE IF NOT EXISTS app_usage_sync (
        id INTEGER PRIMARY KEY,
        last_sync INTEGER NOT NULL
      );
    `;

    await this.dbManager.execute(queryCreateAppUsageTable);
    await this.dbManager.execute(queryCreateSyncTable);
  }

  /**
   * 保存应用使用记录
   */
  async saveAppUsageRecords(
    records: {
      packageName: string;
      appName: string;
      startTime: number;
      endTime: number;
      duration: number;
      date: string;
      icon?: string | null;
    }[]
  ): Promise<boolean> {
    try {
      // 使用事务批量插入记录
      return await this.dbManager.executeTransaction(async (db) => {
        for (const record of records) {
          await db.run(
            `INSERT INTO app_usage_records (packageName, appName, startTime, endTime, duration, date, icon) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              record.packageName,
              record.appName,
              record.startTime,
              record.endTime,
              record.duration,
              record.date,
              record.icon || null,
            ]
          );
        }
      });
    } catch (error) {
      console.error('Failed to save app usage records:', error);
      return false;
    }
  }

  /**
   * 获取最后一次同步时间
   */
  async getLastSyncTime(): Promise<number> {
    try {
      const results = await this.dbManager.executeQuery<{ last_sync: number }>(
        'SELECT last_sync FROM app_usage_sync ORDER BY id DESC LIMIT 1'
      );

      if (results && results.length > 0) {
        return results[0].last_sync;
      } else {
        // 如果没有记录，返回24小时前
        const oneDayAgo = Date.now() - 86400000;
        await this.saveLastSyncTime(oneDayAgo);
        return oneDayAgo;
      }
    } catch (error) {
      console.error('获取上次同步时间失败:', error);
      return Date.now() - 86400000; // 默认返回24小时前
    }
  }

  /**
   * 保存最后一次同步时间
   */
  async saveLastSyncTime(timestamp: number): Promise<boolean> {
    try {
      return await this.dbManager.executeRun(
        'INSERT INTO app_usage_sync (last_sync) VALUES (?)',
        [timestamp]
      );
    } catch (error) {
      console.error('保存同步时间失败:', error);
      return false;
    }
  }

  /**
   * 获取应用使用统计数据
   */
  async getUsageStats(
    startDate: string,
    endDate: string
  ): Promise<AppUsageStat[]> {
    try {
      const results = await this.dbManager.executeQuery<{
        packageName: string;
        appName: string;
        totalDuration: number;
        usageCount: number;
        lastUsed: number;
        icon: string | null;
      }>(
        `SELECT 
          packageName, 
          appName, 
          SUM(duration) as totalDuration, 
          COUNT(*) as usageCount,
          MAX(endTime) as lastUsed,
          MAX(icon) as icon
         FROM app_usage_records 
         WHERE date >= ? AND date <= ? 
         GROUP BY packageName
         ORDER BY totalDuration DESC`,
        [startDate, endDate]
      );

      return results.map((row) => ({
        packageName: row.packageName,
        appName: row.appName,
        totalDuration: row.totalDuration,
        usageCount: row.usageCount,
        lastUsed: row.lastUsed,
        icon: row.icon || undefined,
      }));
    } catch (error) {
      console.error('获取应用使用统计失败:', error);
      return [];
    }
  }

  /**
   * 获取每日使用统计数据
   */
  async getDailyUsageStats(
    startDate: string,
    endDate: string
  ): Promise<DailyUsageStat[]> {
    try {
      // 查询每日总使用时间
      const dailyTotals = await this.dbManager.executeQuery<{
        date: string;
        totalDuration: number;
      }>(
        `SELECT 
          date, 
          SUM(duration) as totalDuration
         FROM app_usage_records 
         WHERE date >= ? AND date <= ? 
         GROUP BY date
         ORDER BY date`,
        [startDate, endDate]
      );

      if (!dailyTotals || dailyTotals.length === 0) {
        return [];
      }

      // 构建每日使用统计
      const dailyStats: DailyUsageStat[] = [];

      // 对每一天查询应用使用情况
      for (const dayTotal of dailyTotals) {
        const date = dayTotal.date;
        const totalDuration = dayTotal.totalDuration;

        // 查询当天的应用使用详情
        const appStats = await this.dbManager.executeQuery<{
          packageName: string;
          appName: string;
          totalDuration: number;
          usageCount: number;
          lastUsed: number;
          icon: string | null;
        }>(
          `SELECT 
            packageName, 
            appName, 
            SUM(duration) as totalDuration, 
            COUNT(*) as usageCount,
            MAX(endTime) as lastUsed,
            MAX(icon) as icon
           FROM app_usage_records 
           WHERE date = ? 
           GROUP BY packageName
           ORDER BY totalDuration DESC`,
          [date]
        );

        if (appStats && appStats.length > 0) {
          const apps: AppUsageStat[] = appStats.map((row) => ({
            packageName: row.packageName,
            appName: row.appName,
            totalDuration: row.totalDuration,
            usageCount: row.usageCount,
            lastUsed: row.lastUsed,
            icon: row.icon || undefined,
          }));

          dailyStats.push({
            date,
            totalDuration,
            apps,
          });
        }
      }

      return dailyStats;
    } catch (error) {
      console.error('获取每日使用统计失败:', error);
      return [];
    }
  }

  /**
   * 清除指定日期范围内的应用使用记录
   */
  async clearUsageData(startDate: string, endDate: string): Promise<boolean> {
    try {
      return await this.dbManager.executeRun(
        'DELETE FROM app_usage_records WHERE date >= ? AND date <= ?',
        [startDate, endDate]
      );
    } catch (error) {
      console.error('清除应用使用数据失败:', error);
      return false;
    }
  }

  /**
   * 获取应用使用总时长
   */
  async getTotalUsageTime(startDate: string, endDate: string): Promise<number> {
    try {
      const result = await this.dbManager.executeQuery<{ totalTime: number }>(
        `SELECT SUM(duration) as totalTime 
         FROM app_usage_records 
         WHERE date >= ? AND date <= ?`,
        [startDate, endDate]
      );

      if (result && result.length > 0) {
        return result[0].totalTime || 0;
      }
      return 0;
    } catch (error) {
      console.error('获取总使用时长失败:', error);
      return 0;
    }
  }

  /**
   * 获取使用时长最长的应用
   */
  async getMostUsedApps(
    startDate: string,
    endDate: string,
    limit: number = 5
  ): Promise<AppUsageStat[]> {
    try {
      const results = await this.dbManager.executeQuery<{
        packageName: string;
        appName: string;
        totalDuration: number;
        usageCount: number;
        lastUsed: number;
        icon: string | null;
      }>(
        `SELECT 
          packageName, 
          appName, 
          SUM(duration) as totalDuration, 
          COUNT(*) as usageCount,
          MAX(endTime) as lastUsed,
          MAX(icon) as icon
         FROM app_usage_records 
         WHERE date >= ? AND date <= ? 
         GROUP BY packageName
         ORDER BY totalDuration DESC
         LIMIT ?`,
        [startDate, endDate, limit]
      );

      return results.map((row) => ({
        packageName: row.packageName,
        appName: row.appName,
        totalDuration: row.totalDuration,
        usageCount: row.usageCount,
        lastUsed: row.lastUsed,
        icon: row.icon || undefined,
      }));
    } catch (error) {
      console.error(`获取最常用的 ${limit} 个应用失败:`, error);
      return [];
    }
  }
}
