# 数据源架构说明

## 概述

本项目采用双环境数据源架构：
- **原生环境（Android/iOS）**：使用 TypeORM + Capacitor SQLite
- **Web环境**：使用 SimpleWebDatabase + localStorage

## 文件结构

### 核心文件
- `SimpleWebDatabase.ts` - 统一的Web环境数据库实现
- `TypeORMManager.ts` - 原生环境的TypeORM数据源管理器
- `AppUsageRepository.ts` - 应用使用数据仓库（原生环境）

### 已删除的文件
- ~~`MockDataService.ts`~~ - 功能已整合到 SimpleWebDatabase
- ~~`WebDatabaseManager.ts`~~ - 复杂的sql.js实现，已简化

## SimpleWebDatabase 功能

### 核心功能
- **数据存储**：使用localStorage存储数据
- **Mock数据生成**：提供完整的模拟数据生成功能
- **统计查询**：支持应用使用统计、每小时统计等查询

### 主要方法
```typescript
// 初始化（自动生成过去30天的数据）
await SimpleWebDatabase.getInstance().initialize();

// 生成单日数据
await db.generateDailyMockData('2024-01-01');

// 生成过去N天数据
await db.generatePastDaysMockData(30);

// 获取使用统计
const stats = await db.getUsageStats('2024-01-01', '2024-01-31');

// 获取每小时统计
const hourlyStats = await db.getHourlyUsageStats('2024-01-01');

// 获取每日Top应用
const topApps = await db.getDailyTopApps('2024-01-01', 10);
```

### 数据结构
- **应用列表**：包含22个常用应用（微信、QQ、抖音等）
- **使用记录**：每小时3-8个应用，每次使用30秒-15分钟
- **统计数据**：自动从详细记录生成统计信息

## 使用方式

### 在服务中使用
```typescript
// appUsageService.ts
import { SimpleWebDatabase } from './data-source/SimpleWebDatabase';

const webDatabase = SimpleWebDatabase.getInstance();
await webDatabase.initialize();
```

### 在页面中使用
```typescript
// 通过 appUsageService 调用
import { appUsageService } from '../services/appUsageService';

// 生成模拟数据
await appUsageService.generateMockDataForWeb('2024-01-01');
await appUsageService.generatePastDaysMockData(30);
await appUsageService.initMockData();

// 获取统计数据
const stats = await appUsageService.getUsageStats('2024-01-01', '2024-01-31');
```

## 环境检测

```typescript
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // 使用 TypeORM + AppUsageRepository
} else {
  // 使用 SimpleWebDatabase
}
```

## 数据持久化

- **Web环境**：数据存储在浏览器的localStorage中
- **原生环境**：数据存储在SQLite数据库中

## 注意事项

1. Web环境的数据仅用于开发和测试
2. SimpleWebDatabase会在首次初始化时自动生成过去30天的模拟数据
3. 所有mock数据都是随机生成的，不代表真实使用情况
4. 清除浏览器数据会导致mock数据丢失 