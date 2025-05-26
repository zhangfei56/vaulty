import {
  AppUsageStat,
  DailyUsageStat,
  HourlyUsageStat,
} from '../../types/appUsage';
import { TypeORMManager } from './TypeORMManager';
import { AppUsageRecord } from '../../entities/AppUsageRecord';
import { AppUsageSync } from '../../entities/AppUsageSync';

/**
 * 应用使用数据仓库
 * 使用 TypeORM 处理所有数据库操作
 * 支持Web环境和原生环境
 */
export class AppUsageRepository {
  private static instance: AppUsageRepository;
  private typeormManager: TypeORMManager;

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
    this.typeormManager = TypeORMManager.getInstance();
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
      if (records.length === 0) {
        return true;
      }

      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      // 使用事务批量插入记录
      await this.typeormManager.executeTransaction(async (manager) => {
        const entities = records.map((record) => {
          const entity = new AppUsageRecord();
          entity.packageName = record.packageName;
          entity.appName = record.appName;
          entity.startTime = record.startTime;
          entity.endTime = record.endTime;
          entity.duration = record.duration;
          entity.date = record.date;
          entity.icon = record.icon || undefined;
          return entity;
        });

        await manager.save(AppUsageRecord, entities);
      });

      console.log(`成功保存 ${records.length} 条应用使用记录`);
      return true;
    } catch (error) {
      console.error('保存应用使用记录失败:', error);
      return false;
    }
  }

  /**
   * 获取最后一次同步时间
   */
  async getLastSyncTime(): Promise<number> {
    try {
      const repository = await this.typeormManager.getAppUsageSyncRepository();
      if (!repository) {
        throw new Error('AppUsageSync仓库不可用');
      }

      const lastSync = await repository.findOne({
        order: { id: 'DESC' },
      });

      if (lastSync) {
        return lastSync.lastSync;
      } else {
        // 如果没有记录，返回24小时前并保存
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
      const repository = await this.typeormManager.getAppUsageSyncRepository();
      if (!repository) {
        throw new Error('AppUsageSync仓库不可用');
      }

      const syncRecord = new AppUsageSync();
      syncRecord.lastSync = timestamp;

      await repository.save(syncRecord);
      return true;
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
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      // 使用 TypeORM 的查询构建器进行分组查询
      const results = await repository
        .createQueryBuilder('record')
        .select([
          'record.packageName as packageName',
          'record.appName as appName',
          'SUM(record.duration) as totalDuration',
          'COUNT(record.id) as usageCount',
          'MAX(record.endTime) as lastUsed',
          'MAX(record.icon) as icon',
        ])
        .where('record.date >= :startDate AND record.date <= :endDate', {
          startDate,
          endDate,
        })
        .groupBy('record.packageName, record.appName')
        .orderBy('totalDuration', 'DESC')
        .getRawMany();

      return results.map((result) => ({
        packageName: result.packageName,
        appName: result.appName,
        totalDuration: Number(result.totalDuration || 0),
        usageCount: Number(result.usageCount),
        lastUsed: Number(result.lastUsed || 0),
        icon: result.icon || undefined,
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
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      // 首先获取每日总使用时间
      const dailyTotals = await repository
        .createQueryBuilder('record')
        .select([
          'record.date as date',
          'SUM(record.duration) as totalDuration',
        ])
        .where('record.date >= :startDate AND record.date <= :endDate', {
          startDate,
          endDate,
        })
        .groupBy('record.date')
        .orderBy('record.date', 'ASC')
        .getRawMany();

      if (dailyTotals.length === 0) {
        return [];
      }

      const dailyStats: DailyUsageStat[] = [];

      // 对每一天获取应用使用详情
      for (const dayTotal of dailyTotals) {
        const date = dayTotal.date;
        const totalDuration = Number(dayTotal.totalDuration || 0);

        // 获取当天的应用使用详情
        const appStats = await repository
          .createQueryBuilder('record')
          .select([
            'record.packageName as packageName',
            'record.appName as appName',
            'SUM(record.duration) as totalDuration',
            'COUNT(record.id) as usageCount',
            'MAX(record.endTime) as lastUsed',
            'MAX(record.icon) as icon',
          ])
          .where('record.date = :date', { date })
          .groupBy('record.packageName, record.appName')
          .orderBy('totalDuration', 'DESC')
          .getRawMany();

        if (appStats.length > 0) {
          const apps: AppUsageStat[] = appStats.map((result) => ({
            packageName: result.packageName,
            appName: result.appName,
            totalDuration: Number(result.totalDuration || 0),
            usageCount: Number(result.usageCount),
            lastUsed: Number(result.lastUsed || 0),
            icon: result.icon || undefined,
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
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      const result = await repository
        .createQueryBuilder()
        .delete()
        .from(AppUsageRecord)
        .where('date >= :startDate AND date <= :endDate', {
          startDate,
          endDate,
        })
        .execute();

      console.log(`清除了 ${result.affected} 条应用使用记录`);
      return true;
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
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      const result = await repository
        .createQueryBuilder('record')
        .select('SUM(record.duration)', 'totalTime')
        .where('record.date >= :startDate AND record.date <= :endDate', {
          startDate,
          endDate,
        })
        .getRawOne();

      return Number(result?.totalTime || 0);
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
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      const results = await repository
        .createQueryBuilder('record')
        .select([
          'record.packageName as packageName',
          'record.appName as appName',
          'SUM(record.duration) as totalDuration',
          'COUNT(record.id) as usageCount',
          'MAX(record.endTime) as lastUsed',
          'MAX(record.icon) as icon',
        ])
        .where('record.date >= :startDate AND record.date <= :endDate', {
          startDate,
          endDate,
        })
        .groupBy('record.packageName, record.appName')
        .orderBy('totalDuration', 'DESC')
        .limit(limit)
        .getRawMany();

      return results.map((result) => ({
        packageName: result.packageName,
        appName: result.appName,
        totalDuration: Number(result.totalDuration || 0),
        usageCount: Number(result.usageCount),
        lastUsed: Number(result.lastUsed || 0),
        icon: result.icon || undefined,
      }));
    } catch (error) {
      console.error(`获取最常用的 ${limit} 个应用失败:`, error);
      return [];
    }
  }

  /**
   * 获取每小时使用统计数据
   * @param date 查询的日期 (YYYY-MM-DD)
   */
  async getHourlyUsageStats(date: string): Promise<HourlyUsageStat[]> {
    try {
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      // 创建24小时的结果数组
      const hourlyStats: HourlyUsageStat[] = Array.from(
        { length: 24 },
        (_, hour) => ({
          hour,
          totalDuration: 0,
          apps: [],
        })
      );

      // 查询当天的所有应用使用记录
      const records = await repository.find({
        where: { date },
        order: { startTime: 'ASC' },
      });

      if (records.length === 0) {
        return hourlyStats;
      }

      // 处理每条记录，统计每小时的使用情况
      const hourAppMap: Map<number, Map<string, AppUsageStat>> = new Map();

      for (const record of records) {
        // 从时间戳中提取小时
        const startTime = Number(record.startTime);
        const date = new Date(startTime);
        const hour = date.getHours();

        if (!hourAppMap.has(hour)) {
          hourAppMap.set(hour, new Map());
        }

        const appMap = hourAppMap.get(hour)!;

        if (!appMap.has(record.packageName)) {
          appMap.set(record.packageName, {
            packageName: record.packageName,
            appName: record.appName,
            totalDuration: 0,
            usageCount: 0,
            lastUsed: 0,
            icon: record.icon || undefined,
          });
        }

        const appStat = appMap.get(record.packageName)!;
        appStat.totalDuration += Number(record.duration);
        appStat.usageCount += 1;
        appStat.lastUsed = Math.max(appStat.lastUsed, Number(record.endTime));
      }

      // 填充每小时的统计数据
      hourAppMap.forEach((appMap, hour) => {
        if (hour >= 0 && hour < 24) {
          const hourStats = hourlyStats[hour];
          const apps = Array.from(appMap.values());

          hourStats.apps = apps.sort(
            (a, b) => b.totalDuration - a.totalDuration
          );
          hourStats.totalDuration = apps.reduce(
            (sum, app) => sum + app.totalDuration,
            0
          );
        }
      });

      return hourlyStats;
    } catch (error) {
      console.error('获取每小时使用统计失败:', error);
      return [];
    }
  }

  /**
   * 获取指定日期使用时间最长的应用
   * @param date 查询的日期 (YYYY-MM-DD)
   * @param limit 返回的应用数量限制
   */
  async getDailyTopApps(
    date: string,
    limit: number = 10
  ): Promise<AppUsageStat[]> {
    try {
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      const results = await repository
        .createQueryBuilder('record')
        .select([
          'record.packageName as packageName',
          'record.appName as appName',
          'SUM(record.duration) as totalDuration',
          'COUNT(record.id) as usageCount',
          'MAX(record.endTime) as lastUsed',
          'MAX(record.icon) as icon',
        ])
        .where('record.date = :date', { date })
        .groupBy('record.packageName, record.appName')
        .orderBy('totalDuration', 'DESC')
        .limit(limit)
        .getRawMany();

      return results.map((result) => ({
        packageName: result.packageName,
        appName: result.appName,
        totalDuration: Number(result.totalDuration || 0),
        usageCount: Number(result.usageCount),
        lastUsed: Number(result.lastUsed || 0),
        icon: result.icon || undefined,
      }));
    } catch (error) {
      console.error(`获取日期 ${date} 最常用的 ${limit} 个应用失败:`, error);
      return [];
    }
  }

  /**
   * 检查指定日期是否有数据
   * @param date 日期 (YYYY-MM-DD)
   */
  async checkDateHasData(date: string): Promise<boolean> {
    try {
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      const count = await repository.count({
        where: { date },
      });

      return count > 0;
    } catch (error) {
      console.error(`检查日期 ${date} 是否有数据失败:`, error);
      return false;
    }
  }

  /**
   * 获取数据库中的日期范围
   */
  async getDateRange(): Promise<{ startDate: string; endDate: string } | null> {
    try {
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      const result = await repository
        .createQueryBuilder('record')
        .select([
          'MIN(record.date) as startDate',
          'MAX(record.date) as endDate',
        ])
        .getRawOne();

      if (result?.startDate && result?.endDate) {
        return {
          startDate: result.startDate,
          endDate: result.endDate,
        };
      }

      return null;
    } catch (error) {
      console.error('获取日期范围失败:', error);
      return null;
    }
  }

  /**
   * 获取应用使用记录总数
   */
  async getTotalRecordsCount(): Promise<number> {
    try {
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      return await repository.count();
    } catch (error) {
      console.error('获取记录总数失败:', error);
      return 0;
    }
  }

  /**
   * 获取唯一应用数量
   */
  async getUniqueAppsCount(): Promise<number> {
    try {
      const repository =
        await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      const result = await repository
        .createQueryBuilder('record')
        .select('COUNT(DISTINCT record.packageName)', 'count')
        .getRawOne();

      return Number(result?.count || 0);
    } catch (error) {
      console.error('获取唯一应用数量失败:', error);
      return 0;
    }
  }
}
