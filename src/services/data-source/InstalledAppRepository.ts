import { TypeORMManager } from './TypeORMManager';
import { InstalledApp } from '../../entities/InstalledApp';
import { AppInfo } from '../../types/app-usage.capacitor';

/**
 * 已安装应用数据仓库
 * 管理已安装应用的数据操作，包括同步、逻辑删除等
 */
export class InstalledAppRepository {
  private static instance: InstalledAppRepository;
  private typeormManager: TypeORMManager;

  /**
   * 获取单例实例
   */
  public static getInstance(): InstalledAppRepository {
    if (!InstalledAppRepository.instance) {
      InstalledAppRepository.instance = new InstalledAppRepository();
    }
    return InstalledAppRepository.instance;
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.typeormManager = TypeORMManager.getInstance();
  }

  /**
   * 同步已安装应用信息
   * @param installedApps 从系统获取的已安装应用列表
   * @param syncTime 同步时间戳
   */
  async syncInstalledApps(installedApps: AppInfo[], syncTime: number): Promise<boolean> {
    try {
      const repository = await this.typeormManager.getInstalledAppRepository();
      if (!repository) {
        throw new Error('InstalledApp仓库不可用');
      }

      console.log(`开始同步 ${installedApps.length} 个已安装应用...`);

      // 使用事务处理同步操作
      await this.typeormManager.executeTransaction(async (manager) => {
        // 1. 获取当前数据库中的所有应用（未删除的）
        const existingApps = await manager.find(InstalledApp, {
          where: { isDeleted: false }
        });

        const existingPackageNames = existingApps.map((app: InstalledApp) => app.packageName);
        const currentPackageNames = installedApps.map((app: AppInfo) => app.packageName);
        const currentPackageSet = new Set(currentPackageNames);

        // 2. 标记已删除的应用（逻辑删除）
        const deletedPackageNames: string[] = [];
        for (const packageName of existingPackageNames) {
          if (!currentPackageSet.has(packageName)) {
            deletedPackageNames.push(packageName);
          }
        }

        if (deletedPackageNames.length > 0) {
          // 使用 IN 查询来标记删除的应用
          for (const packageName of deletedPackageNames) {
            await manager.update(InstalledApp, 
              { packageName, isDeleted: false },
              { isDeleted: true, lastSyncTime: syncTime }
            );
          }
          console.log(`标记 ${deletedPackageNames.length} 个应用为已删除`);
        }

        // 3. 更新或插入当前已安装的应用
        let updatedCount = 0;
        let insertedCount = 0;

        for (const appInfo of installedApps) {
          const existingApp = existingApps.find((app: InstalledApp) => app.packageName === appInfo.packageName);

          if (existingApp) {
            // 更新现有应用
            await manager.update(InstalledApp, { id: existingApp.id }, {
              appName: appInfo.appName,
              versionName: appInfo.versionName,
              versionCode: appInfo.versionCode,
              firstInstallTime: appInfo.firstInstallTime,
              lastUpdateTime: appInfo.lastUpdateTime,
              isSystemApp: appInfo.isSystemApp,
              icon: appInfo.icon,
              isDeleted: false, // 确保未删除状态
              lastSyncTime: syncTime
            });
            updatedCount++;
          } else {
            // 检查是否是之前被删除的应用重新安装
            const deletedApp = await manager.findOne(InstalledApp, {
              where: { packageName: appInfo.packageName, isDeleted: true }
            });

            if (deletedApp) {
              // 恢复之前删除的应用
              await manager.update(InstalledApp, { id: deletedApp.id }, {
                appName: appInfo.appName,
                versionName: appInfo.versionName,
                versionCode: appInfo.versionCode,
                firstInstallTime: appInfo.firstInstallTime,
                lastUpdateTime: appInfo.lastUpdateTime,
                isSystemApp: appInfo.isSystemApp,
                icon: appInfo.icon,
                isDeleted: false,
                lastSyncTime: syncTime
              });
              updatedCount++;
            } else {
              // 插入新应用
              const newApp = new InstalledApp();
              newApp.packageName = appInfo.packageName;
              newApp.appName = appInfo.appName;
              newApp.versionName = appInfo.versionName;
              newApp.versionCode = appInfo.versionCode;
              newApp.firstInstallTime = appInfo.firstInstallTime;
              newApp.lastUpdateTime = appInfo.lastUpdateTime;
              newApp.isSystemApp = appInfo.isSystemApp;
              newApp.icon = appInfo.icon;
              newApp.isDeleted = false;
              newApp.lastSyncTime = syncTime;

              await manager.save(InstalledApp, newApp);
              insertedCount++;
            }
          }
        }

        console.log(`✅ 同步完成: 新增 ${insertedCount} 个，更新 ${updatedCount} 个，删除 ${deletedPackageNames.length} 个应用`);
      });

      return true;
    } catch (error) {
      console.error('❌ 同步已安装应用失败:', error);
      return false;
    }
  }

  /**
   * 获取所有有效的已安装应用（未删除）
   */
  async getActiveInstalledApps(): Promise<InstalledApp[]> {
    try {
      const repository = await this.typeormManager.getInstalledAppRepository();
      if (!repository) {
        throw new Error('InstalledApp仓库不可用');
      }

      return await repository.find({
        where: { isDeleted: false },
        order: { appName: 'ASC' }
      });
    } catch (error) {
      console.error('获取已安装应用失败:', error);
      return [];
    }
  }

  /**
   * 根据包名获取应用信息
   */
  async getAppByPackageName(packageName: string): Promise<InstalledApp | null> {
    try {
      const repository = await this.typeormManager.getInstalledAppRepository();
      if (!repository) {
        throw new Error('InstalledApp仓库不可用');
      }

      return await repository.findOne({
        where: { packageName, isDeleted: false }
      });
    } catch (error) {
      console.error(`获取应用信息失败 (${packageName}):`, error);
      return null;
    }
  }

  /**
   * 获取应用使用记录和应用详情的关联查询
   * @param startDate 开始日期
   * @param endDate 结束日期
   */
  async getUsageStatsWithAppDetails(startDate: string, endDate: string) {
    try {
      const repository = await this.typeormManager.getAppUsageRecordRepository();
      if (!repository) {
        throw new Error('AppUsageRecord仓库不可用');
      }

      // 使用 SQL 查询进行 INNER JOIN
      const results = await repository
        .createQueryBuilder('usage')
        .innerJoin(InstalledApp, 'app', 'usage.packageName = app.packageName AND app.isDeleted = false')
        .select([
          'usage.packageName as packageName',
          'app.appName as appName',
          'app.icon as icon',
          'app.versionName as versionName',
          'app.isSystemApp as isSystemApp',
          'SUM(usage.duration) as totalDuration',
          'COUNT(usage.id) as usageCount',
          'MAX(usage.endTime) as lastUsed'
        ])
        .where('usage.date >= :startDate AND usage.date <= :endDate', {
          startDate,
          endDate,
        })
        .groupBy('usage.packageName, app.appName, app.icon, app.versionName, app.isSystemApp')
        .orderBy('totalDuration', 'DESC')
        .getRawMany();

      return results.map((result) => ({
        packageName: result.packageName,
        appName: result.appName,
        icon: result.icon,
        versionName: result.versionName,
        isSystemApp: Boolean(result.isSystemApp),
        totalDuration: Number(result.totalDuration || 0),
        usageCount: Number(result.usageCount),
        lastUsed: Number(result.lastUsed || 0),
      }));
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
    try {
      const repository = await this.typeormManager.getInstalledAppRepository();
      if (!repository) {
        throw new Error('InstalledApp仓库不可用');
      }

      const [totalApps, systemApps, userApps, deletedApps] = await Promise.all([
        repository.count({ where: { isDeleted: false } }),
        repository.count({ where: { isDeleted: false, isSystemApp: true } }),
        repository.count({ where: { isDeleted: false, isSystemApp: false } }),
        repository.count({ where: { isDeleted: true } })
      ]);

      return {
        totalApps,
        systemApps,
        userApps,
        deletedApps
      };
    } catch (error) {
      console.error('获取已安装应用统计失败:', error);
      return {
        totalApps: 0,
        systemApps: 0,
        userApps: 0,
        deletedApps: 0
      };
    }
  }

  /**
   * 清理过期的已删除应用记录
   * @param daysOld 删除多少天前的记录
   */
  async cleanupDeletedApps(daysOld: number = 30): Promise<number> {
    try {
      const repository = await this.typeormManager.getInstalledAppRepository();
      if (!repository) {
        throw new Error('InstalledApp仓库不可用');
      }

      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      const result = await repository
        .createQueryBuilder()
        .delete()
        .from(InstalledApp)
        .where('isDeleted = true AND lastSyncTime < :cutoffTime', { cutoffTime })
        .execute();

      const deletedCount = result.affected || 0;
      console.log(`清理了 ${deletedCount} 个过期的已删除应用记录`);
      return deletedCount;
    } catch (error) {
      console.error('清理已删除应用记录失败:', error);
      return 0;
    }
  }
} 