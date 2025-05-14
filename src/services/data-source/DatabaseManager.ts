import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';

/**
 * 数据库管理器 - 单例模式
 * 负责管理SQLite连接，提供统一的数据库访问接口
 */
export class DatabaseManager {
  private static instance: DatabaseManager;

  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private dbName = 'vaulty_db';
  private isDbReady = false;

  /**
   * 获取单例实例
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.initializeDatabase();
  }

  /**
   * 初始化数据库
   */
  private async initializeDatabase(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // 创建或打开数据库
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );

      // 打开数据库连接
      await this.db.open();

      this.isDbReady = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.isDbReady = false;
    }
  }

  /**
   * 确保数据库连接就绪
   */
  async ensureDatabaseReady(): Promise<boolean> {
    if (this.isDbReady) {
      return true;
    }

    try {
      await this.initializeDatabase();
      return this.isDbReady;
    } catch (error) {
      console.error('Failed to ensure database is ready:', error);
      return false;
    }
  }

  /**
   * 获取数据库连接
   */
  async getDbConnection(): Promise<SQLiteDBConnection | null> {
    if (await this.ensureDatabaseReady()) {
      return this.db;
    }
    return null;
  }

  /**
   * 执行SQL查询
   */
  async executeQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
    if (!(await this.ensureDatabaseReady()) || !this.db) {
      return [];
    }

    try {
      const result = await this.db.query(sql, params);
      return (result.values || []) as T[];
    } catch (error) {
      console.error('Failed to execute query:', error);
      return [];
    }
  }

  /**
   * 执行SQL更新/插入/删除操作
   */
  async executeRun(sql: string, params: any[] = []): Promise<boolean> {
    if (!(await this.ensureDatabaseReady()) || !this.db) {
      return false;
    }

    try {
      await this.db.run(sql, params);
      return true;
    } catch (error) {
      console.error('Failed to execute run:', error);
      return false;
    }
  }

  /**
   * 执行不返回结果的SQL操作
   */
  async execute(sql: string): Promise<boolean> {
    if (!(await this.ensureDatabaseReady()) || !this.db) {
      return false;
    }

    try {
      await this.db.execute(sql);
      return true;
    } catch (error) {
      console.error('Failed to execute:', error);
      return false;
    }
  }

  /**
   * 执行事务操作
   */
  async executeTransaction(
    callback: (db: SQLiteDBConnection) => Promise<void>
  ): Promise<boolean> {
    if (!(await this.ensureDatabaseReady()) || !this.db) {
      return false;
    }

    try {
      await this.db.executeSet([
        { statement: 'BEGIN TRANSACTION;', values: [] },
      ]);

      try {
        await callback(this.db);

        await this.db.executeSet([{ statement: 'COMMIT;', values: [] }]);

        return true;
      } catch (error) {
        console.error('Transaction error, rolling back:', error);

        await this.db.executeSet([{ statement: 'ROLLBACK;', values: [] }]);

        return false;
      }
    } catch (error) {
      console.error('Failed to execute transaction:', error);
      return false;
    }
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.isDbReady = false;
    }
  }
}
