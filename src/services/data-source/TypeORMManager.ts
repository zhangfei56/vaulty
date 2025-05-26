import 'reflect-metadata';
import { DataSource, Repository, ObjectLiteral } from 'typeorm';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { AppUsageRecord } from '../../entities/AppUsageRecord';
import { AppUsageSync } from '../../entities/AppUsageSync';
import { Diary } from '../../entities/Diary';
import { Todo } from '../../entities/Todo';

/**
 * TypeORM 数据源管理器 - 单例模式
 * 负责管理 TypeORM 数据源连接，提供统一的数据库访问接口
 * 支持Web环境和原生环境
 */
export class TypeORMManager {
  private static instance: TypeORMManager;
  private static sqliteConnection: SQLiteConnection | null = null;
  private static isInitializing = false;
  private dataSource: DataSource | null = null;
  private isInitialized = false;
  private isWeb = false;

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
      console.log(
        `初始化TypeORM数据源 - 环境: ${this.isWeb ? 'Web' : 'Native'}`
      );

      if (this.isWeb) {
        // Web环境配置 - 使用 sql.js
        this.dataSource = new DataSource({
          type: 'sqljs',
          location: 'vaulty_web.db',
          autoSave: true,
          entities: [AppUsageRecord, AppUsageSync, Diary, Todo],
          synchronize: true,
          logging: ['error', 'warn'],
        } as any);
      } else {
        // 原生环境配置 - 使用 Capacitor SQLite
        const dbName = 'vaulty_native.db';

        // 如果还没有 SQLite 连接，创建一个
        if (!TypeORMManager.sqliteConnection) {
          TypeORMManager.sqliteConnection = new SQLiteConnection(
            CapacitorSQLite
          );
          await TypeORMManager.sqliteConnection.copyFromAssets();
        } else {
          console.log('使用现有的 SQLite 连接实例');
        }

        this.dataSource = new DataSource({
          type: 'capacitor',
          driver: TypeORMManager.sqliteConnection,
          database: dbName,
          entities: [AppUsageRecord, AppUsageSync, Diary, Todo],
          synchronize: true,
          logging: ['error', 'warn'],
        } as any);
      }

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
        const dbName = 'vaulty_native.db';
        await TypeORMManager.sqliteConnection.closeConnection(dbName, false);
        TypeORMManager.sqliteConnection = null;
        console.log('Capacitor SQLite 连接已关闭');
      } catch (error) {
        console.log('关闭 Capacitor SQLite 连接失败:', error);
      }
    }
  }

  /**
   * 重置数据库（仅用于开发/测试）
   */
  async resetDatabase(): Promise<void> {
    const dataSource = await this.getDataSource();
    if (!dataSource) {
      throw new Error('TypeORM数据源不可用');
    }

    try {
      // 清空所有表
      await dataSource.getRepository(AppUsageRecord).clear();
      await dataSource.getRepository(AppUsageSync).clear();
      await dataSource.getRepository(Diary).clear();
      await dataSource.getRepository(Todo).clear();

      console.log('数据库已重置');
    } catch (error) {
      console.error('重置数据库失败:', error);
      throw error;
    }
  }

  /**
   * 同步数据库结构
   */
  async synchronizeDatabase(): Promise<void> {
    const dataSource = await this.getDataSource();
    if (!dataSource) {
      throw new Error('TypeORM数据源不可用');
    }

    try {
      await dataSource.synchronize();
      console.log('数据库结构同步完成');
    } catch (error) {
      console.error('数据库结构同步失败:', error);
      throw error;
    }
  }
}
