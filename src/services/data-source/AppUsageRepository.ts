import { TypeORMManager } from './TypeORMManager';
import { AppUsageRecord } from '../../entities/AppUsageRecord';
import { AppUsageSync } from '../../entities/AppUsageSync';
import { AppUsageStat } from '../../types/appUsage';

/**
 * 应用使用数据仓库
 * 使用 TypeORM 处理所有数据库操作
 * 支持原生环境的数据存储
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
} 