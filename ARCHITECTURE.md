# Vaulty 架构设计

## 一、数据流转过程

1. **用户操作**
   - 用户在移动端界面进行操作（如添加日记、完成任务、查看统计等）。

2. **前端 UI 层（React + TailwindCSS）**
   - 组件通过 Redux Toolkit 进行状态管理。
   - UI 组件分发 action，更新全局状态。

3. **状态管理层（Redux Toolkit）**
   - Action 触发 Reducer，更新 Store。
   - Store 变化驱动 UI 重新渲染。

4. **本地数据存储（Capacitor + SQLite）**
   - 通过 Capacitor 插件与 SQLite 进行数据读写。
   - 包括日记、任务、应用事件等数据。

5. **数据可视化（Chart.js）**
   - 统计数据从 Store 获取，传递给 Chart.js 组件进行可视化展示。

6. **AI 智能建议（OpenAI API/本地模型）**
   - 前端收集用户行为、日记、任务等数据。
   - 通过 API 或本地模型接口传递数据，获取建议。
   - 建议结果展示在 UI。

7. **数据导出/备份**
   - 用户可选择导出本地数据，或进行备份。

---

## 二、推荐文件层级结构

```
vaulty/
├── public/
│   └── index.html
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── assets/
│   │   └── ...
│   ├── components/
│   │   ├── Diary/
│   │   │   ├── DiaryList.tsx
│   │   │   ├── DiaryEditor.tsx
│   │   │   └── DiaryItem.tsx
│   │   ├── Todo/
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoEditor.tsx
│   │   │   └── TodoItem.tsx
│   │   ├── Calendar/
│   │   │   └── CalendarOverview.tsx
│   │   ├── Stats/
│   │   │   └── UsageStatsChart.tsx
│   │   ├── AI/
│   │   │   └── AISuggestion.tsx
│   │   └── common/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── ...
│   ├── store/
│   │   ├── index.ts
│   │   ├── diarySlice.ts
│   │   ├── todoSlice.ts
│   │   ├── eventSlice.ts
│   │   ├── statsSlice.ts
│   │   └── aiSlice.ts
│   ├── hooks/
│   │   └── useSQLite.ts
│   ├── services/
│   │   ├── sqliteService.ts
│   │   ├── aiService.ts
│   │   └── eventService.ts
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── ...
│   ├── types/
│   │   ├── diary.ts
│   │   ├── todo.ts
│   │   ├── event.ts
│   │   └── ai.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── DiaryPage.tsx
│   │   ├── TodoPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── StatsPage.tsx
│   │   └── SettingsPage.tsx
│   └── router/
│       └── index.tsx
├── capacitor.config.ts
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

- **components/**：所有 UI 组件，按功能模块细分。
- **store/**：Redux Toolkit 的各 slice 和全局 store。
- **hooks/**：自定义 hooks，如 SQLite 操作。
- **services/**：与本地数据库、AI、事件收集等相关的服务层。
- **utils/**：工具函数。
- **types/**：TypeScript 类型定义。
- **pages/**：页面级组件。
- **router/**：路由配置。

如需进一步细化，可根据实际业务继续拆分子模块。
