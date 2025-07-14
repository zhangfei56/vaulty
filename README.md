# Vaulty - 私人数据管理应用

一个基于React + TypeScript + Capacitor的跨平台应用，用于管理个人数据、使用统计和日记。

## 功能特性

- 📊 应用使用统计和分析
- 📝 个人日记管理
- ✅ 待办事项管理
- 📱 跨平台支持（Web、Android、iOS）
- 🔒 本地数据存储，保护隐私

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI框架**: Tailwind CSS + Ionic
- **状态管理**: Redux Toolkit
- **数据库**: TypeORM + SQLite (原生) / localStorage (Web)
- **跨平台**: Capacitor
- **图表**: Chart.js + React-Chartjs-2

## 开发环境设置

### 前置要求

- Node.js 18+
- npm 或 yarn
- Android Studio (用于Android开发)
- Xcode (用于iOS开发，仅macOS)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 构建和部署

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## Capacitor 跨平台开发

### Android 开发

```bash
# 构建并同步到Android平台
npm run capacitor:sync:android

# 或者使用脚本
npm run android:build

# 打开Android Studio
npm run capacitor:open:android
```

### iOS 开发 (仅macOS)

```bash
# 添加iOS平台 (首次)
npm run capacitor:add:ios

# 构建并同步到iOS平台
npm run capacitor:sync:ios

# 打开Xcode
npm run capacitor:open:ios
```

### 通用同步

```bash
# 同步所有平台
npm run capacitor:sync
```

## 项目结构

```
src/
├── components/          # React组件
│   ├── Stats/          # 统计相关组件
│   ├── Diary/          # 日记相关组件
│   └── Todo/           # 待办事项组件
├── pages/              # 页面组件
├── services/           # 服务层
│   ├── data-source/    # 数据源管理
│   └── appUsageService.ts
├── store/              # Redux状态管理
├── types/              # TypeScript类型定义
└── utils/              # 工具函数

android/                # Android平台代码
ios/                    # iOS平台代码 (如果存在)
```

## 数据库架构

### Web环境
- 使用localStorage存储数据
- SimpleWebDatabase类提供统一接口
- 自动生成模拟数据用于演示

### 原生环境
- TypeORM + SQLite数据库
- 支持复杂的查询和关系
- 自动同步和备份

## 开发指南

### 添加新功能

1. 在`src/components/`中创建组件
2. 在`src/pages/`中添加页面
3. 在`src/services/`中实现业务逻辑
4. 在`src/store/`中管理状态
5. 更新路由配置

### 数据库操作

```typescript
// Web环境
import { SimpleWebDatabase } from './services/data-source/SimpleWebDatabase';
const db = SimpleWebDatabase.getInstance();
await db.initialize();

// 原生环境
import { AppUsageRepository } from './services/data-source/AppUsageRepository';
const repo = AppUsageRepository.getInstance();
```

### 平台检测

```typescript
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // 原生平台代码
} else {
  // Web平台代码
}
```

## 故障排除

### 常见问题

1. **Capacitor同步失败**
   - 确保已运行`npm run build`
   - 检查`capacitor.config.ts`中的`webDir`配置
   - 确保`dist`目录存在

2. **TypeORM错误**
   - Web环境使用SimpleWebDatabase
   - 原生环境确保SQLite插件正确安装

3. **构建错误**
   - 检查TypeScript类型错误
   - 确保所有依赖已安装

### 调试技巧

```bash
# 查看详细构建信息
npm run build --verbose

# 检查Capacitor配置
npx cap doctor

# 清理并重新安装
rm -rf node_modules dist
npm install
npm run build
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License 