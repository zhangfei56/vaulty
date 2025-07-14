declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export interface Database {
    exec(sql: string, params?: any[]): any[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    run(sql: string, params?: any[]): void;
    get(sql: string, params?: any[]): any;
    all(sql: string, params?: any[]): any[];
  }

  export interface Statement {
    bind(params: any[]): void;
    step(): boolean;
    get(): any[];
    getColumnNames(): string[];
    reset(): void;
    free(): void;
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string;
  }): Promise<SqlJsStatic>;
} 