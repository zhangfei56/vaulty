import { TypeORMManager } from './TypeORMManager';
import { AppUsageRawEvent } from '../../entities/AppUsageRawEvent';
import { InstalledApp } from '../../entities/InstalledApp';
import { AppUsageEvent } from '../../types/app-usage.capacitor';
import { HourlyUsageStat } from '../../types/appUsage';

/**
 * 原始事件数据仓库
 * 管理从 Android 系统获取的原始事件数据
 */
export class AppUsageRawEventRepository {
  private static instance: AppUsageRawEventRepository;
  private typeormManager: TypeORMManager;

  /**
   * 获取单例实例
   */
  public static getInstance(): AppUsageRawEventRepository {
    if (!AppUsageRawEventRepository.instance) {
      AppUsageRawEventRepository.instance = new AppUsageRawEventRepository();
    }
    return AppUsageRawEventRepository.instance;
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.typeormManager = TypeORMManager.getInstance();
  }

  /**
   * 保存原始事件数据
   * @param events 原始事件数组
   */
  async saveRawEvents(events: AppUsageEvent[]): Promise<boolean> {
    try {
      const repository = await this.typeormManager.getAppUsageRawEventRepository();
      if (!repository) {
        throw new Error('AppUsageRawEvent仓库不可用');
      }

      if (events.length === 0) {
        return true;
      }

      console.log(`开始保存 ${events.length} 条原始事件数据...`);

      // 使用事务批量保存
      await this.typeormManager.executeTransaction(async (manager) => {
        const rawEvents = events.map(event => {
          const rawEvent = new AppUsageRawEvent();
          rawEvent.packageName = event.packageName;
          rawEvent.className = event.className;
          rawEvent.timestamp = event.timestamp;
          rawEvent.eventType = event.eventType;
          
          // 从时间戳生成日期字符串
          const date = new Date(event.timestamp);
          rawEvent.date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          
          return rawEvent;
        });

        await manager.save(AppUsageRawEvent, rawEvents);
      });

      console.log(`✅ 成功保存 ${events.length} 条原始事件数据`);
      return true;
    } catch (error) {
      console.error('❌ 保存原始事件数据失败:', error);
      return false;
    }
  }

  /**
   * 获取指定日期的每小时使用统计（从原始事件聚合）
   * @param date 日期 (YYYY-MM-DD)
   */
  async getHourlyUsageStats(date: string): Promise<HourlyUsageStat[]> {
    try {
      const repository = await this.typeormManager.getAppUsageRawEventRepository();
      if (!repository) {
        throw new Error('AppUsageRawEvent仓库不可用');
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

      // 获取指定日期的所有原始事件
      const events = await repository.find({
        where: { date },
        order: { timestamp: 'ASC' },
      });

      if (events.length === 0) {
        return hourlyStats;
      }

      // 获取已安装应用信息用于名称和图标
      const installedAppRepository = await this.typeormManager.getInstalledAppRepository();
      const installedApps = installedAppRepository ? await installedAppRepository.find({
        where: { isDeleted: false }
      }) : [];
      
      const appInfoMap = new Map<string, InstalledApp>();
      installedApps.forEach(app => {
        appInfoMap.set(app.packageName, app);
      });

      // 处理事件，计算每小时的使用时间
      const appResumeEvents: Map<string, number> = new Map();
      const hourAppDurations: Map<number, Map<string, { duration: number; count: number; appName: string; icon?: string }>> = new Map();

      // 初始化每小时的应用统计
      for (let hour = 0; hour < 24; hour++) {
        hourAppDurations.set(hour, new Map());
      }

      for (const event of events) {
        if (event.eventType === 'ACTIVITY_RESUMED') {
          // 应用进入前台
          appResumeEvents.set(event.packageName, event.timestamp);
        } else if (event.eventType === 'ACTIVITY_PAUSED') {
          // 应用退出前台
          const startTime = appResumeEvents.get(event.packageName);
          if (startTime) {
            const duration = event.timestamp - startTime;
            
            if (duration > 0) {
              // 获取应用信息
              const appInfo = appInfoMap.get(event.packageName);
              const appName = appInfo?.appName || this.getDisplayNameFromPackage(event.packageName);
              const appIcon = appInfo?.icon;
              
              // 计算会话跨越的小时数
              const startHour = new Date(startTime).getHours();
              const endHour = new Date(event.timestamp).getHours();
              
              if (startHour === endHour) {
                // 同一小时内的使用
                const hourMap = hourAppDurations.get(startHour)!;
                const existing = hourMap.get(event.packageName);
                if (existing) {
                  existing.duration += duration;
                  existing.count += 1;
                } else {
                  hourMap.set(event.packageName, {
                    duration,
                    count: 1,
                    appName,
                    icon: appIcon
                  });
                }
              } else {
                // 跨小时使用，按比例分配
                const startHourEnd = new Date(startTime);
                startHourEnd.setHours(startHour + 1, 0, 0, 0);
                
                const endHourStart = new Date(event.timestamp);
                endHourStart.setHours(endHour, 0, 0, 0);
                
                // 分配到开始小时
                const startHourDuration = Math.min(duration, startHourEnd.getTime() - startTime);
                if (startHourDuration > 0) {
                  const hourMap = hourAppDurations.get(startHour)!;
                  const existing = hourMap.get(event.packageName);
                  if (existing) {
                    existing.duration += startHourDuration;
                    existing.count += 1;
                  } else {
                    hourMap.set(event.packageName, {
                      duration: startHourDuration,
                      count: 1,
                      appName,
                      icon: appIcon
                    });
                  }
                }
                
                // 分配到结束小时
                const endHourDuration = Math.min(duration - startHourDuration, event.timestamp - endHourStart.getTime());
                if (endHourDuration > 0) {
                  const hourMap = hourAppDurations.get(endHour)!;
                  const existing = hourMap.get(event.packageName);
                  if (existing) {
                    existing.duration += endHourDuration;
                    existing.count += 1;
                  } else {
                    hourMap.set(event.packageName, {
                      duration: endHourDuration,
                      count: 1,
                      appName,
                      icon: appIcon
                    });
                  }
                }
                
                // 处理中间的完整小时
                for (let hour = startHour + 1; hour < endHour; hour++) {
                  const hourDuration = 60 * 60 * 1000; // 1小时
                  const hourMap = hourAppDurations.get(hour)!;
                  const existing = hourMap.get(event.packageName);
                  if (existing) {
                    existing.duration += hourDuration;
                    existing.count += 1;
                  } else {
                    hourMap.set(event.packageName, {
                      duration: hourDuration,
                      count: 1,
                      appName,
                      icon: appIcon
                    });
                  }
                }
              }
            }
            
            appResumeEvents.delete(event.packageName);
          }
        }
      }

      // 转换为最终结果格式
      for (let hour = 0; hour < 24; hour++) {
        const hourMap = hourAppDurations.get(hour)!;
        let totalDuration = 0;
        const apps: any[] = [];

        for (const [packageName, stats] of hourMap.entries()) {
          totalDuration += stats.duration;
          apps.push({
            packageName,
            appName: stats.appName,
            totalDuration: stats.duration,
            usageCount: stats.count,
            lastUsed: 0, // 从原始事件中无法准确获取，设为0
            icon: stats.icon,
          });
        }

        hourlyStats[hour] = {
          hour,
          totalDuration,
          apps: apps.sort((a, b) => b.totalDuration - a.totalDuration),
        };
      }

      return hourlyStats;
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
   * 删除指定日期范围的原始事件数据
   * @param beforeDate 删除此日期之前的数据
   */
  async cleanupOldEvents(beforeDate: string): Promise<number> {
    try {
      const repository = await this.typeormManager.getAppUsageRawEventRepository();
      if (!repository) {
        throw new Error('AppUsageRawEvent仓库不可用');
      }

      const result = await repository
        .createQueryBuilder()
        .delete()
        .from(AppUsageRawEvent)
        .where('date < :beforeDate', { beforeDate })
        .execute();

      const deletedCount = result.affected || 0;
      console.log(`清理了 ${deletedCount} 条过期的原始事件记录`);
      return deletedCount;
    } catch (error) {
      console.error('清理原始事件数据失败:', error);
      return 0;
    }
  }

  /**
   * 获取指定日期范围内的原始事件数据
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  async getRawEvents(startDate: string, endDate: string): Promise<AppUsageRawEvent[]> {
    try {
      const repository = await this.typeormManager.getAppUsageRawEventRepository();
      if (!repository) {
        throw new Error('AppUsageRawEvent仓库不可用');
      }

      return await repository.find({
        where: {
          date: startDate === endDate ? startDate : undefined,
        },
        order: { timestamp: 'ASC' },
      });
    } catch (error) {
      console.error('获取原始事件数据失败:', error);
      return [];
    }
  }
} 