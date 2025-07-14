import 'reflect-metadata';
import { DataSource, Repository, ObjectLiteral } from 'typeorm';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { AppUsageRecord } from '../../entities/AppUsageRecord';
import { AppUsageSync } from '../../entities/AppUsageSync';
import { Diary } from '../../entities/Diary';
import { Todo } from '../../entities/Todo';
import { InstalledApp } from '../../entities/InstalledApp';
import { AppUsageRawEvent } from '../../entities/AppUsageRawEvent';
import { AppUsageHourlyStats } from '../../entities/AppUsageHourlyStats';

/**
 * TypeORM 数据源管理器 - 单例模式
 * 负责管理 TypeORM 数据源连接，提供统一的数据库访问接口
 * 主要用于原生环境，Web环境使用SimpleWebDatabase
 */
export class TypeORMManager {
  private static instance: TypeORMManager;
  private static sqliteConnection: SQLiteConnection | null = null;
  private static isInitializing = false;
  private dataSource: DataSource | null = null;
  private isInitialized = false;
  private isWeb = false;
  private dbName = 'vaulty_native.db';

  /**
   * 重置连接状态（用于解决连接冲突）
   */
  public static async resetConnectionState(): Promise<void> {
    if (TypeORMManager.sqliteConnection) {
      try {
        const dbName = 'vaulty_native.db';
        const isConnExists = await TypeORMManager.sqliteConnection.isConnection(dbName, false);
        if (isConnExists) {
          console.log('清理现有连接状态...');
          await TypeORMManager.sqliteConnection.closeConnection(dbName, false);
        }
      } catch (error) {
        console.log('清理连接状态时出现错误（可忽略）:', error);
      }
    }
    TypeORMManager.sqliteConnection = null;
    TypeORMManager.isInitializing = false;
    
    if (TypeORMManager.instance) {
      TypeORMManager.instance.isInitialized = false;
      TypeORMManager.instance.dataSource = null;
    }
    
    console.log('连接状态已重置');
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): TypeORMManager {
    if (!TypeORMManager.instance) {
      TypeORMManager.instance = new TypeORMManager();
    }
    return TypeORMManager.instance;
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.isWeb = !Capacitor.isNativePlatform();
  }

  /**
   * 初始化 TypeORM 数据源
   */
  private async initializeDataSource(): Promise<void> {
    if (this.isInitialized && this.dataSource?.isInitialized) {
      return;
    }

    // Web环境不使用TypeORM，直接返回
    if (this.isWeb) {
      console.log('Web环境使用SimpleWebDatabase，跳过TypeORM初始化');
      return;
    }

    // 防止并发初始化
    if (TypeORMManager.isInitializing) {
      console.log('TypeORM 正在初始化中，等待完成...');
      // 等待初始化完成
      while (TypeORMManager.isInitializing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    TypeORMManager.isInitializing = true;

    try {
      console.log('初始化TypeORM数据源 - 原生环境');

      // 原生环境配置 - 使用 Capacitor SQLite
      // 确保 SQLite 连接存在
      if (!TypeORMManager.sqliteConnection) {
        TypeORMManager.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
      }

      // 检查数据库是否存在，如果不存在则从 assets 复制
      const isDB = await TypeORMManager.sqliteConnection.isDatabase(this.dbName);
      if (!isDB) {
        console.log('从 assets 复制数据库文件...');
          await TypeORMManager.sqliteConnection.copyFromAssets();
        }

      // 让 TypeORM 完全管理连接
        this.dataSource = new DataSource({
          type: 'capacitor',
          driver: TypeORMManager.sqliteConnection,
        database: this.dbName,
        entities: [AppUsageRecord, AppUsageSync, Diary, Todo, InstalledApp, AppUsageRawEvent, AppUsageHourlyStats],
        synchronize: true, // 让 TypeORM 管理表结构
          logging: ['error', 'warn'],
        } as any);

      // 初始化数据源
      await this.dataSource.initialize();

      this.isInitialized = true;
      console.log('TypeORM数据源初始化成功');
    } catch (error) {
      console.error('TypeORM数据源初始化失败:', error);
      this.isInitialized = false;
      throw error;
    } finally {
      TypeORMManager.isInitializing = false;
    }
  }

  /**
   * 确保数据源已初始化
   */
  async ensureDataSourceReady(): Promise<boolean> {
    if (this.isWeb) {
      console.log('Web环境不使用TypeORM');
      return false;
    }

    if (this.isInitialized && this.dataSource?.isInitialized) {
      return true;
    }

    try {
      await this.initializeDataSource();
      return this.isInitialized;
    } catch (error) {
      console.error('Failed to ensure TypeORM DataSource is ready:', error);
      return false;
    }
  }

  /**
   * 获取数据源
   */
  async getDataSource(): Promise<DataSource | null> {
    if (this.isWeb) {
      return null;
    }

    if (await this.ensureDataSourceReady()) {
      return this.dataSource;
    }
    return null;
  }

  /**
   * 获取仓库
   */
  async getRepository<T extends ObjectLiteral>(
    entity: new () => T
  ): Promise<Repository<T> | null> {
    const dataSource = await this.getDataSource();
    if (!dataSource) {
      return null;
    }
    return dataSource.getRepository(entity);
  }

  /**
   * 获取应用使用记录仓库
   */
  async getAppUsageRecordRepository(): Promise<Repository<AppUsageRecord> | null> {
    return this.getRepository(AppUsageRecord);
  }

  /**
   * 获取应用使用同步仓库
   */
  async getAppUsageSyncRepository(): Promise<Repository<AppUsageSync> | null> {
    return this.getRepository(AppUsageSync);
  }

  /**
   * 获取日记仓库
   */
  async getDiaryRepository(): Promise<Repository<Diary> | null> {
    return this.getRepository(Diary);
  }

  /**
   * 获取待办事项仓库
   */
  async getTodoRepository(): Promise<Repository<Todo> | null> {
    return this.getRepository(Todo);
  }

  /**
   * 获取已安装应用仓库
   */
  async getInstalledAppRepository(): Promise<Repository<InstalledApp> | null> {
    return this.getRepository(InstalledApp);
  }

  /**
   * 获取原始事件仓库
   */
  async getAppUsageRawEventRepository(): Promise<Repository<AppUsageRawEvent> | null> {
    return this.getRepository(AppUsageRawEvent);
  }

  /**
   * 获取小时统计仓库
   */
  async getAppUsageHourlyStatsRepository(): Promise<Repository<AppUsageHourlyStats> | null> {
    return this.getRepository(AppUsageHourlyStats);
  }

  /**
   * 检查是否在Web环境
   */
  public isWebEnvironment(): boolean {
    return this.isWeb;
  }

  /**
   * 执行事务
   */
  async executeTransaction<T>(
    callback: (manager: any) => Promise<T>
  ): Promise<T> {
    const dataSource = await this.getDataSource();
    if (!dataSource) {
      throw new Error('TypeORM数据源不可用');
    }

    return await dataSource.transaction(async (manager) => {
      return await callback(manager);
    });
  }

  /**
   * 关闭数据源连接
   */
  async close(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      this.isInitialized = false;
      this.dataSource = null;
    }

    // 在原生环境中，还需要关闭 SQLite 连接
    if (!this.isWeb && TypeORMManager.sqliteConnection) {
      try {
        await this.cleanupExistingConnection();
        TypeORMManager.sqliteConnection = null;
        console.log('Capacitor SQLite 连接已关闭');
      } catch (error) {
        console.log('关闭 Capacitor SQLite 连接失败:', error);
      }
    }
  }

  /**
   * 清理现有的数据库连接
   */
  private async cleanupExistingConnection(): Promise<void> {
    if (!TypeORMManager.sqliteConnection) {
      return;
    }

    try {
      const isConnExists = await TypeORMManager.sqliteConnection.isConnection(this.dbName, false);
      if (isConnExists) {
        console.log('清理现有数据库连接...');
        await TypeORMManager.sqliteConnection.closeConnection(this.dbName, false);
        console.log('现有数据库连接已清理');
      }
    } catch (error) {
      console.log('清理连接时出现错误（可忽略）:', error);
    }
  }
}
