import { TypeORMManager } from './TypeORMManager';
import { AppUsageHourlyStats } from '../../entities/AppUsageHourlyStats';
import { AppUsageRawEvent } from '../../entities/AppUsageRawEvent';
import { InstalledApp } from '../../entities/InstalledApp';
import { HourlyUsageStat } from '../../types/appUsage';

/**
 * 小时级统计数据仓库
 * 管理预聚合的每小时统计数据
 */
export class AppUsageHourlyStatsRepository {
  private static instance: AppUsageHourlyStatsRepository;
  private typeormManager: TypeORMManager;

  /**
   * 获取单例实例
   */
  public static getInstance(): AppUsageHourlyStatsRepository {
    if (!AppUsageHourlyStatsRepository.instance) {
      AppUsageHourlyStatsRepository.instance = new AppUsageHourlyStatsRepository();
    }
    return AppUsageHourlyStatsRepository.instance;
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.typeormManager = TypeORMManager.getInstance();
  }

  /**
   * 从原始事件数据聚合生成小时统计数据
   * @param date 要聚合的日期 (YYYY-MM-DD)
   */
  async aggregateHourlyStats(date: string): Promise<boolean> {
    try {
      const rawEventRepository = await this.typeormManager.getAppUsageRawEventRepository();
      const installedAppRepository = await this.typeormManager.getInstalledAppRepository();
      const hourlyStatsRepository = await this.typeormManager.getAppUsageHourlyStatsRepository();
      
      if (!rawEventRepository || !installedAppRepository || !hourlyStatsRepository) {
        throw new Error('所需的数据仓库不可用');
      }

      console.log(`开始聚合日期 ${date} 的小时统计数据...`);

      // 获取该日期的所有原始事件
      const events = await rawEventRepository.find({
        where: { date },
        order: { timestamp: 'ASC' },
      });

      if (events.length === 0) {
        console.log(`日期 ${date} 没有原始事件数据`);
        return true;
      }

      // 获取应用信息
      const installedApps = await installedAppRepository.find({
        where: { isDeleted: false }
      });
      
      const appInfoMap = new Map<string, InstalledApp>();
      installedApps.forEach(app => {
        appInfoMap.set(app.packageName, app);
      });

      // 处理事件，按小时聚合
      const hourlyAppStats = new Map<string, Map<string, { duration: number; count: number; appName: string; icon?: string }>>();
      
      // 初始化24小时的统计结构
      for (let hour = 0; hour < 24; hour++) {
        hourlyAppStats.set(hour.toString(), new Map());
      }

      // 处理事件数据
      const appResumeEvents: Map<string, number> = new Map();
      
      for (const event of events) {
        if (event.eventType === 'ACTIVITY_RESUMED') {
          appResumeEvents.set(event.packageName, event.timestamp);
        } else if (event.eventType === 'ACTIVITY_PAUSED') {
          const startTime = appResumeEvents.get(event.packageName);
          if (startTime) {
            const duration = event.timestamp - startTime;
            
            if (duration > 0) {
              const appInfo = appInfoMap.get(event.packageName);
              const appName = appInfo?.appName || this.getDisplayNameFromPackage(event.packageName);
              const appIcon = appInfo?.icon;
              
              // 计算会话跨越的小时数并按比例分配
              const startHour = new Date(startTime).getHours();
              const endHour = new Date(event.timestamp).getHours();
              
              if (startHour === endHour) {
                // 同一小时内的使用
                this.addToHourlyStats(hourlyAppStats, startHour, event.packageName, duration, appName, appIcon);
              } else {
                // 跨小时使用，按比例分配
                this.distributeAcrossHours(hourlyAppStats, startTime, event.timestamp, duration, event.packageName, appName, appIcon);
              }
            }
            
            appResumeEvents.delete(event.packageName);
          }
        }
      }

      // 使用事务保存聚合数据
      await this.typeormManager.executeTransaction(async (manager) => {
        // 先删除该日期的现有数据
        await manager.delete(AppUsageHourlyStats, { date });
        
        // 保存新的聚合数据
        const statsToSave: AppUsageHourlyStats[] = [];
        
        for (let hour = 0; hour < 24; hour++) {
          const hourStats = hourlyAppStats.get(hour.toString())!;
          
          for (const [packageName, stats] of hourStats.entries()) {
            const hourlyStatsEntity = new AppUsageHourlyStats();
            hourlyStatsEntity.date = date;
            hourlyStatsEntity.hour = hour;
            hourlyStatsEntity.packageName = packageName;
            hourlyStatsEntity.appName = stats.appName;
            hourlyStatsEntity.totalDuration = stats.duration;
            hourlyStatsEntity.usageCount = stats.count;
            hourlyStatsEntity.icon = stats.icon;
            
            statsToSave.push(hourlyStatsEntity);
          }
        }
        
        if (statsToSave.length > 0) {
          await manager.save(AppUsageHourlyStats, statsToSave);
        }
      });

      console.log(`✅ 成功聚合日期 ${date} 的小时统计数据，共 ${hourlyAppStats.size * 24} 条记录`);
      return true;
    } catch (error) {
      console.error(`❌ 聚合日期 ${date} 的小时统计数据失败:`, error);
      return false;
    }
  }

  /**
   * 获取指定日期的每小时使用统计
   * @param date 日期 (YYYY-MM-DD)
   */
  async getHourlyUsageStats(date: string): Promise<HourlyUsageStat[]> {
    try {
      const repository = await this.typeormManager.getAppUsageHourlyStatsRepository();
      if (!repository) {
        throw new Error('AppUsageHourlyStats仓库不可用');
      }

      // 查询该日期的所有小时统计数据
      const hourlyStats = await repository.find({
        where: { date },
        order: { hour: 'ASC', totalDuration: 'DESC' },
      });

      // 初始化24小时的结果
      const result: HourlyUsageStat[] = Array.from(
        { length: 24 },
        (_, hour) => ({
          hour,
          totalDuration: 0,
          apps: [],
        })
      );

      // 填充数据
      for (const stat of hourlyStats) {
        const hourIndex = stat.hour;
        result[hourIndex].totalDuration += stat.totalDuration;
        
        result[hourIndex].apps.push({
          packageName: stat.packageName,
          appName: stat.appName,
          totalDuration: stat.totalDuration,
          usageCount: stat.usageCount,
          lastUsed: 0, // 聚合数据中不包含最后使用时间
          icon: stat.icon,
        });
      }

      return result;
    } catch (error) {
      console.error(`获取日期 ${date} 的每小时使用统计失败:`, error);
      return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        totalDuration: 0,
        apps: [],
      }));
    }
  }

  /**
   * 添加到小时统计中
   */
  private addToHourlyStats(
    hourlyAppStats: Map<string, Map<string, { duration: number; count: number; appName: string; icon?: string }>>,
    hour: number,
    packageName: string,
    duration: number,
    appName: string,
    icon?: string
  ) {
    const hourMap = hourlyAppStats.get(hour.toString())!;
    const existing = hourMap.get(packageName);
    
    if (existing) {
      existing.duration += duration;
      existing.count += 1;
    } else {
      hourMap.set(packageName, {
        duration,
        count: 1,
        appName,
        icon
      });
    }
  }

  /**
   * 跨小时分配使用时间
   */
  private distributeAcrossHours(
    hourlyAppStats: Map<string, Map<string, { duration: number; count: number; appName: string; icon?: string }>>,
    startTime: number,
    endTime: number,
    totalDuration: number,
    packageName: string,
    appName: string,
    icon?: string
  ) {
    const startHour = new Date(startTime).getHours();
    const endHour = new Date(endTime).getHours();
    
    // 开始小时的结束时间
    const startHourEnd = new Date(startTime);
    startHourEnd.setHours(startHour + 1, 0, 0, 0);
    
    // 结束小时的开始时间
    const endHourStart = new Date(endTime);
    endHourStart.setHours(endHour, 0, 0, 0);
    
    // 分配到开始小时
    const startHourDuration = Math.min(totalDuration, startHourEnd.getTime() - startTime);
    if (startHourDuration > 0) {
      this.addToHourlyStats(hourlyAppStats, startHour, packageName, startHourDuration, appName, icon);
    }
    
    // 分配到结束小时
    const endHourDuration = Math.min(totalDuration - startHourDuration, endTime - endHourStart.getTime());
    if (endHourDuration > 0) {
      this.addToHourlyStats(hourlyAppStats, endHour, packageName, endHourDuration, appName, icon);
    }
    
    // 分配到中间的完整小时
    const remainingDuration = totalDuration - startHourDuration - endHourDuration;
    const middleHours = Math.max(0, endHour - startHour - 1);
    
    if (middleHours > 0 && remainingDuration > 0) {
      const hourDuration = remainingDuration / middleHours;
      
      for (let hour = startHour + 1; hour < endHour; hour++) {
        this.addToHourlyStats(hourlyAppStats, hour, packageName, hourDuration, appName, icon);
      }
    }
  }

  /**
   * 从包名获取显示名称
   */
  private getDisplayNameFromPackage(packageName: string): string {
    let displayName = packageName
      .replace(/^com\./, '')
      .replace(/^android\./, '')
      .replace(/^org\./, '');

    displayName = displayName
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

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
   * 清理过期的小时统计数据
   * @param beforeDate 删除此日期之前的数据
   */
  async cleanupOldHourlyStats(beforeDate: string): Promise<number> {
    try {
      const repository = await this.typeormManager.getAppUsageHourlyStatsRepository();
      if (!repository) {
        throw new Error('AppUsageHourlyStats仓库不可用');
      }

      const result = await repository
        .createQueryBuilder()
        .delete()
        .from(AppUsageHourlyStats)
        .where('date < :beforeDate', { beforeDate })
        .execute();

      const deletedCount = result.affected || 0;
      console.log(`清理了 ${deletedCount} 条过期的小时统计记录`);
      return deletedCount;
    } catch (error) {
      console.error('清理小时统计数据失败:', error);
      return 0;
    }
  }
} 