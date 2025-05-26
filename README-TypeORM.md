# TypeORM 集成说明

## 概述

本项目已成功从 Prisma 迁移到 TypeORM，提供了更好的跨平台支持（Web + 原生环境）。

## 架构设计

### 核心组件

1. **TypeORMManager** - 数据源管理器（单例模式）
   - 负责初始化和管理 TypeORM 数据源
   - 支持 Web 环境（sql.js）和原生环境（Capacitor SQLite）
   - 提供统一的仓库获取接口

2. **实体类（Entities）**
   - `AppUsageRecord` - 应用使用记录
   - `AppUsageSync` - 同步时间记录
   - `Diary` - 日记条目
   - `Todo` - 待办事项

3. **仓库类（Repositories）**
   - `AppUsageRepository` - 应用使用数据操作
   - `DiaryRepository` - 日记数据操作
   - `TodoRepository` - 待办事项数据操作

## 环境配置

### Web 环境
- 使用 `sql.js` 驱动
- 数据存储在浏览器的 IndexedDB 中
- 自动保存功能

### 原生环境
- 使用 `@capacitor-community/sqlite` 驱动
- 数据存储在设备本地 SQLite 数据库中

## 主要特性

### 1. 自动数据库同步
```typescript
// 实体定义会自动创建对应的数据库表
@Entity('app_usage_records')
@Index(['date'])
@Index(['packageName'])
export class AppUsageRecord {
  @PrimaryGeneratedColumn()
  id!: number;
  
  @Column({ type: 'text' })
  packageName!: string;
  // ...
}
```

### 2. 事务支持
```typescript
// 批量插入使用事务确保数据一致性
await this.typeormManager.executeTransaction(async (manager) => {
  const entities = records.map(record => {
    const entity = new AppUsageRecord();
    // 设置属性...
    return entity;
  });
  await manager.save(AppUsageRecord, entities);
});
```

### 3. 高级查询
```typescript
// 使用查询构建器进行复杂查询
const results = await repository
  .createQueryBuilder('record')
  .select([
    'record.packageName as packageName',
    'SUM(record.duration) as totalDuration',
  ])
  .where('record.date >= :startDate', { startDate })
  .groupBy('record.packageName')
  .orderBy('totalDuration', 'DESC')
  .getRawMany();
```

## 使用方法

### 1. 获取仓库实例
```typescript
const appUsageRepo = AppUsageRepository.getInstance();
const diaryRepo = DiaryRepository.getInstance();
const todoRepo = TodoRepository.getInstance();
```

### 2. 基本 CRUD 操作
```typescript
// 创建
const diary = await diaryRepo.createDiary({
  id: 'unique-id',
  title: '标题',
  content: '内容',
  mood: 'happy',
  tags: ['标签1', '标签2']
});

// 查询
const diaries = await diaryRepo.getAllDiaries(10, 0);
const diary = await diaryRepo.getDiaryById('unique-id');

// 更新
const updated = await diaryRepo.updateDiary('unique-id', {
  title: '新标题'
});

// 删除
const deleted = await diaryRepo.deleteDiary('unique-id');
```

### 3. 高级查询
```typescript
// 搜索
const results = await diaryRepo.searchDiaries('关键词');

// 日期范围查询
const diaries = await diaryRepo.getDiariesByDateRange(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// 统计查询
const stats = await appUsageRepo.getUsageStats('2024-01-01', '2024-01-31');
```

## 测试

项目包含了完整的 TypeORM 集成测试：

```typescript
// 在浏览器控制台中运行
await window.testTypeORM();
```

测试覆盖：
- 数据源初始化
- 应用使用记录的保存和查询
- 日记的创建和查询
- 待办事项的创建和查询

## 性能优化

### 1. 索引优化
- 为常用查询字段添加了索引
- 复合索引支持多字段查询

### 2. 查询优化
- 使用查询构建器避免 N+1 查询
- 分页查询支持大数据集

### 3. 事务管理
- 批量操作使用事务提高性能
- 自动回滚确保数据一致性

## 迁移说明

从 Prisma 迁移到 TypeORM 的主要变化：

1. **配置文件**
   - 删除 `prisma/schema.prisma`
   - 添加 TypeScript 装饰器配置

2. **实体定义**
   - 使用 TypeORM 装饰器替代 Prisma schema
   - 支持更灵活的字段配置

3. **查询语法**
   - 使用 TypeORM 查询构建器
   - 更接近原生 SQL 的查询方式

4. **类型安全**
   - 编译时类型检查
   - 更好的 IDE 支持

## 故障排除

### 常见问题

1. **装饰器错误**
   - 确保 `tsconfig.json` 中启用了 `experimentalDecorators` 和 `emitDecoratorMetadata`

2. **数据源初始化失败**
   - 检查 `reflect-metadata` 是否正确导入
   - 确保在应用启动时调用了数据源初始化

3. **Web 环境数据库问题**
   - 确保 `sql.js` 正确安装
   - 检查浏览器是否支持 IndexedDB

## 未来扩展

1. **数据迁移**
   - 支持数据库版本升级
   - 自动迁移脚本

2. **缓存层**
   - Redis 集成
   - 查询结果缓存

3. **数据同步**
   - 云端同步支持
   - 离线数据处理

## 总结

TypeORM 为项目提供了：
- ✅ 更好的跨平台支持
- ✅ 强类型安全
- ✅ 灵活的查询能力
- ✅ 完整的事务支持
- ✅ 优秀的性能表现

相比 Prisma，TypeORM 在浏览器环境中有更好的兼容性，同时保持了强大的 ORM 功能。 
