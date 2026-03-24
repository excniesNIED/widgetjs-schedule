# widgetjs-schedule

桌面组件 — 日程组件，支持今日列表、周视图和多格式导入导出。

基于 [Widget.js](https://widgetjs.cn) 生态开发，使用 Vue 3 + TypeScript + Vite。

## 功能

- **今日日程列表**：按时间排序展示今日事件，支持进度/倒计时背景填充
- **周视图**：一周 7 天日程卡片，支持当前时间线和事件高亮
- **多格式导入**：ICS、CSV、JSON 批量导入
- **多格式导出**：ICS、CSV、JSON 导出
- **重复规则**：支持每天、工作日、每周、每月等常见重复模式（基于 rrule）
- **通知提醒**：Toast 弹窗 + Windows 系统原生通知
- **双部署模式**：桌面组件 + 悬浮组件
- **自适应密度**：紧凑 / 标准 / 大号 三档布局

## 组件尺寸

| 档位 | 网格 | 说明 |
|------|------|------|
| 紧凑 | 4×3 | 悬浮小卡，精简列表 |
| 默认 | 4×4 | 标准列表视图 |
| 扩展 | 4×3 ~ 8×8 | 更多卡片细节 |

## 项目结构

```
src/widgets/schedule/
├── Schedule.widget.ts          # 组件元数据（名称、尺寸、路由）
├── ScheduleWidgetView.vue      # 主视图入口
├── ScheduleConfigView.vue      # 设置页
├── ScheduleWidgetRoutes.ts     # 路由定义
├── components/
│   ├── ScheduleListView.vue    # 列表视图
│   ├── ScheduleEventRow.vue    # 单条日程卡片
│   ├── ScheduleEmptyState.vue  # 空状态
│   ├── ScheduleHeader.vue      # 头部
│   ├── ScheduleWeekView.vue    # 周视图
│   └── ScheduleManualEntryForm.vue  # 手动添加表单
├── composables/
│   ├── useScheduleStore.ts     # 数据存储
│   ├── useScheduleView.ts      # 视图逻辑
│   ├── useScheduleNotifications.ts  # 通知调度
│   └── useScheduleImportExport.ts   # 导入导出
├── model/
│   ├── types.ts                # 类型定义
│   ├── occurrence.ts           # 事件实例展开
│   ├── recurrence.ts           # 重复规则
│   ├── date.ts                 # 日期工具
│   ├── format.ts               # 格式化
│   ├── list.ts                 # 列表状态计算
│   ├── refresh.ts              # 刷新调度
│   └── defaults.ts             # 默认设置
├── importers/
│   ├── ics.ts                  # ICS 导入
│   ├── csv.ts                  # CSV 导入
│   └── json.ts                 # JSON 导入
├── exporters/
│   ├── ics.ts                  # ICS 导出
│   ├── csv.ts                  # CSV 导出
│   └── json.ts                 # JSON 导出
└── __tests__/                  # 单元测试
```

## 快速开始

```bash
npm install
npm run dev
```

控制台输出 `Register widget: cn.excnies.widget.schedule` 表示组件注册成功。

在 Widget.js 客户端中访问：`#/widget/schedule`

## 构建

```bash
# 在线构建（部署到服务器）
npm run build

# 离线构建（生成 zip 包，本地导入）
npm run build:offline
```

离线构建产物在 `dist/` 目录，可直接通过 Widget.js 客户端导入 zip 文件。

## 测试与检查

```bash
npm test              # 运行测试
npm run typecheck     # 类型检查
npm run lint          # 代码检查
```

## 发布

1. 修改 `widget.package.ts` 中的 `remote` 配置：
   - `hostname`：你的服务器域名
   - `base`：部署路径前缀

2. 构建并部署 `dist/` 到静态服务器

3. 发布到组件市场：
   ```bash
   npx widget publish -k <your-token>
   ```

## 客户端下载

- [Microsoft Store](https://www.microsoft.com/store/productId/9NPR50GQ7T53)
- [widgetjs.cn](https://widgetjs.cn)

## 技术栈

- Vue 3 + TypeScript
- Vite
- @widget-js/core + @widget-js/vue3
- Element Plus
- dayjs / rrule / ical.js / papaparse
- Vitest

## License

MIT
