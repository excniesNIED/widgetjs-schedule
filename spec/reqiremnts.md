# Schedule 组件需求规格

更新时间：2026-03-23

## 1. 目标

在当前 Widget.js 插件模板下新增一个遵守现有项目样式的 `schedule` 组件，支持：

- 桌面组件与悬浮组件两种部署形态
- 今日日程与每周日程展示
- 列表视图与周视图
- 当前进行中事件、下一事件、时间线与进度背景
- 颜色配置、手动录入、ICS/CSV/JSON 导入
- ICS/CSV/JSON 导出
- Windows 上的开始/结束提醒

本规格面向后续实现，不直接在本模板仓库中完成业务代码。

## 2. 调研结论

### 2.1 Widget.js 生态约束

- Widget.js 组件尺寸以网格为单位定义，`width/height/minWidth/maxWidth/minHeight/maxHeight` 决定组件尺寸范围。
- 默认组件同时支持桌面组件和悬浮组件，可通过 `supportDeployMode` 明确声明支持类型。
- `widget-wrapper` 是现有生态推荐容器，自动接入背景、圆角、阴影、颜色等主题变量。
- 可用主题变量包括 `--widget-color`、`--widget-background-color`、`--widget-outer-padding`、`--widget-inner-width`、`--widget-inner-height`。
- `BrowserWindowApi` 文档明确说明桌面类型组件不支持窗口移动、调整大小、最大化、最小化等窗口操作，因此窗口行为只能对悬浮组件增强，不能把桌面组件设计成“伪窗口”。
- `NotificationApi` 文档确认提供 `send`、`reminder`、`success`、`warning`、`error`、`info` 等通知能力，但文档没有明确写出“是否一定映射到 Windows 系统 Toast”；该点必须在实现阶段做真机验证。

### 2.2 现有仓库尺寸模式

- `widget-js/hotspot` 的组件尺寸高度集中在 `4x3` 与 `4x4`，最大通常放宽到 `6x6`，说明生态内偏好中等密度卡片。
- `rtugeek/itime-web` 中：
  - `todo_list` 默认 `4x4`，范围 `3x3 ~ 6x6`
  - `calendar` 默认 `4x4`，范围 `4x4 ~ 6x6`
  - `calendar_large` 默认 `8x8`，范围 `8x8 ~ 12x12`
- 结论：不应引入奇怪的新尺寸组合，优先使用已有生态已验证的 `4x3`、`4x4`、`8x8`。

### 2.3 现有实现风格

- `hotspot` 组件普遍采用“头部 + 可滚动内容区”的卡片结构，并直接依赖 `--widget-inner-width/height` 控制布局。
- `itime-web` 的待办组件采用：
  - `WidgetEditDialog + WidgetConfigOption` 的标准设置页模式
  - 头部操作区 + 滚动列表
  - `backgroundThrottling: false` 以减少计时类组件在后台被限速的问题
- `SDNUChronoSync` 已验证以下设计值得借鉴：
  - 周视图时间线
  - 当前时间指示线
  - “即将开始”高亮
  - 自定义日程卡片颜色
  - ICS 导入
  - 课程时间段映射与周视图卡片布局

### 2.4 导入与重复规则调研

- `rrule` 适合承载“每天、工作日、周末、每周、每月、每年、每 N 分钟/小时/天/月/年、自定义周几”这类重复规则，并支持 RRULE 字符串解析与序列化。
- `ical.js` 适合在浏览器侧解析 ICS，能读取 `VEVENT`、`DTSTART`、`DTEND`、`SUMMARY`、`DESCRIPTION`、`LOCATION`、`RRULE`、`EXDATE`。
- `PapaParse` 适合 CSV 批量导入与导出，支持 `header`、`skipEmptyLines`、`transformHeader`、错误明细与模板导出。

## 3. 最终尺寸策略

## 3.1 采用一个自适应组件，不拆成多个独立组件

组件名：`schedule`

原因：

- 用户要求是“一个 schedule 组件”
- 现有 Widget.js 模板按单组件目录组织最自然
- 通过最小/默认/最大网格范围即可覆盖 3 种显示密度

## 3.2 选定 3 个有效尺寸档位

实际元数据定义：

- 默认尺寸：`4x4`
- 最小尺寸：`4x3`
- 最大尺寸：`8x8`

对应三个有效布局档：

1. `4x3`：紧凑视图
   - 只显示“当前/下一事件 + 简化周视图”或“紧凑列表”
   - 适合悬浮小卡

2. `4x4`：待办尺寸，必选
   - 作为默认布局
   - 优先承载“今日列表视图”
   - 同时可切换到简化周视图

3. `8x8`：扩展周视图
   - 展示完整周视图、时间线、更多卡片细节
   - 适合桌面固定摆放

不采用更多尺寸的原因：

- `hotspot` 与 `itime-web` 都没有把核心组件做成很多离散尺寸
- 过多尺寸会显著增加布局测试矩阵
- `4x3 / 4x4 / 8x8` 已覆盖“紧凑 / 待办 / 周视图”三类核心场景

## 4. 组件范围

本期只做一个 Widget 组件，不做独立后台守护进程组件。

组件需支持：

- `DeployMode.NORMAL`
- `DeployMode.OVERLAP`

本期不要求支持：

- `DeployMode.BACKGROUND`
- `DeployMode.TRAY`

原因：

- 用户明确要求桌面与悬浮框
- 后台组件会引入额外生命周期与提醒调度复杂度

## 5. 信息架构

组件目录应遵循模板风格：

```text
src/widgets/schedule/
  Schedule.widget.ts
  ScheduleWidgetRoutes.ts
  ScheduleWidgetView.vue
  ScheduleConfigView.vue
  components/
  composables/
  importers/
  model/
```

建议包含的核心文件职责：

- `Schedule.widget.ts`：组件元数据、尺寸、部署模式、配置页路径
- `ScheduleWidgetView.vue`：主视图入口，按尺寸和模式切换子布局
- `ScheduleConfigView.vue`：设置页、颜色配置、导入导出入口、手动添加入口
- `model/`：事件、重复规则、设置项定义
- `importers/`：ICS、CSV、JSON 导入解析
- `exporters/`：ICS、CSV、JSON 导出序列化
- `components/`：周视图、列表项、时间线、空状态、导入面板

## 6. 数据模型

## 6.1 Event 数据结构

每条日程归一化为：

```ts
interface ScheduleEventRecord {
  id: string
  title: string
  description?: string
  location?: string
  source: 'manual' | 'ics' | 'csv' | 'json'
  timeMode: 'point' | 'range'
  startAt: string
  endAt?: string
  timezone?: string
  allDay?: boolean
  recurrenceType:
    | 'none'
    | 'daily'
    | 'weekdays'
    | 'workdays'
    | 'weekend'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'every_n_minutes'
    | 'every_n_hours'
    | 'every_n_days'
    | 'every_n_months'
    | 'every_n_years'
    | 'custom'
  recurrenceInterval?: number
  recurrenceWeekdays?: number[]
  recurrenceWeeks?: string
  recurrenceRRule?: string
  exdates?: string[]
  color?: string
  progressColor?: string
  createdAt: string
  updatedAt: string
}
```

说明：

- `recurrenceType` 用于 UI 展示与手动创建
- `recurrenceRRule` 用于统一计算实例展开
- `recurrenceWeeks` 用于保存“第 1-16 周、1-8 单周、2-16 双周”这类课表语义
- `timeMode=point` 时表示单时间点事件；`range` 时表示时间范围事件

## 6.2 运行态实例

视图层不直接渲染原始记录，而是先展开为 occurrence：

```ts
interface ScheduleOccurrence {
  eventId: string
  occurrenceKey: string
  title: string
  description?: string
  location?: string
  startAt: string
  endAt?: string
  isOngoing: boolean
  isUpcoming: boolean
  repeatLabel: string
  colorToken: string
  progressColorToken: string
}
```

## 6.3 本地存储

最少拆成以下存储键：

- `schedule.events`
- `schedule.settings`
- `schedule.import.meta`
- `schedule.notification.log`

## 7. 视图需求

## 7.1 总体规则

- 组件必须支持 `list` 与 `week` 两种主视图
- 设置项允许指定默认视图
- 当尺寸变化时自动切换密度，不强制切换视图模式
- 所有视图顶部都要显示：
  - 今天日期
  - 当前进行中的事件，若存在
  - 下一事件，若存在

## 7.2 周视图

周视图需要参考 `SDNUChronoSync` 的时间轴卡片思路，但压缩为 Widget 卡片场景。

必须支持：

- 一周 7 天展示
- 日程卡片显示：
  - 时间
  - 日程名
- 当前时间线
- 当前进行中事件高亮
- 下一事件高亮
- 卡片内显示范围可调：
  - `3h`
  - `3 个日程`

范围规则：

- `3h`：以当前时间为中心或以“下一事件开始时间”为基准，截取 3 小时时间窗
- `3 个日程`：每列优先显示当前事件 + 后续最近 2 条事件；不足则顺延

尺寸对应策略：

- `4x3`：周视图显示精简版，只保留时间线、事件名、短时间标签
- `4x4`：周视图显示标准版，允许显示更多卡片高度
- `8x8`：周视图显示增强版，可显示地点/描述第一行

## 7.3 列表视图

列表视图聚焦“今天”。

每条列表项必须显示：

- 时间
- 日程名
- 重复情况

可选显示：

- 地点
- 简短描述

列表项背景填充支持 3 种模式：

- `none`
- `countdown`
- `progress`

规则：

- `countdown`：尚未开始时，以距离开始的剩余比例做填充
- `progress`：进行中时，以开始到结束的完成比例做填充
- 已结束事件默认降透明度，不再继续填充

## 7.4 空状态

无事件时：

- 列表视图显示“今天暂无日程”
- 周视图显示“本周暂无日程”
- 提供设置页入口文案：“去添加或导入日程”

## 8. 功能需求

## 8.1 EARS 功能需求

### FR-01 今日事件展示

当用户打开组件时，系统应展示今天的所有事件，并按开始时间升序排列。

### FR-02 多事件展示

当同一天存在多个事件时，系统应在同一组件中连续展示多个事件，而不是仅展示第一条。

### FR-03 双部署模式

当组件被安装时，系统应支持桌面组件与悬浮组件两种部署模式。

### FR-04 周视图

当用户切换到周视图时，系统应按周展示日程，并在卡片中显示时间和日程名。

### FR-05 视图时间范围调节

当用户在设置中选择 `3h` 或 `3 个日程` 时，系统应据此调整周视图的卡片显示范围。

### FR-06 当前与下一事件

当存在正在进行的事件时，系统应高亮显示该事件并绘制当前时间线。

当不存在正在进行的事件但存在下一事件时，系统应显示下一事件的开始时间与名称。

### FR-07 列表进度背景

当用户启用进度背景时，系统应在列表项背景中展示倒计时或进度填充效果。

### FR-08 开始与结束通知

当事件开始或结束时，系统应发送通知，并确保同一事件实例不会重复通知。

### FR-09 颜色配置

当用户在设置页配置卡片颜色与进度颜色时，系统应立即应用新配置并持久化保存。

### FR-10 手动添加

当用户手动添加事件时，系统应支持输入：

- 日程名
- 时间点或时间范围
- 重复规则
- 详细描述

### FR-11 ICS 导入

当用户导入 ICS 文件时，系统应解析 `VEVENT` 及其时间、描述、地点、RRULE、EXDATE，并转换为本地事件记录。

### FR-12 CSV 批量导入

当用户导入 CSV 文件时，系统应按约定模板解析时间、日程名、描述、地点和周次信息，并输出成功/失败明细。

### FR-13 JSON 批量导入

当用户导入 JSON 文件时，系统应按约定的数组结构导入事件，并校验必填字段。

### FR-14 ICS 导出

当用户选择导出 ICS 时，系统应将当前事件数据转换为标准 iCalendar 内容，并保留可表达的时间、描述、地点、RRULE 与 EXDATE 信息。

### FR-15 CSV 导出

当用户选择导出 CSV 时，系统应按约定模板导出当前事件数据，并保证再次导入时字段可逆。

### FR-16 JSON 导出

当用户选择导出 JSON 时，系统应导出规范化事件数组，且导出结果应可直接再次导入。

### FR-17 周次提取

当 CSV 未显式提供周次字段但描述中包含周次文本时，系统应尝试提取周次并转换为重复规则。

### FR-18 设置页风格一致性

当用户打开设置页时，系统应沿用 Widget.js 的 `WidgetEditDialog` 和主题设置项，而不是自建完全独立的设置容器。

## 8.2 非功能需求

- 首屏渲染目标：`<= 150ms`（本地数据 200 条以内）
- 重复事件实例展开范围：
  - 列表视图：只展开当天
  - 周视图：只展开当前周
  - 导入预检：最多预展开 90 天用于冲突检查
- 通知轮询频率：
  - 进行中状态更新：30s
  - 通知检查：15s
- 组件必须遵守 Widget.js 主题色，不允许硬编码整块背景替换 `widget-wrapper`
- 组件必须在 `4x3`、`4x4`、`8x8` 三个尺寸档位下可读

## 9. 设置页需求

设置页分为 4 个分区：

1. 显示设置
   - 默认视图：`list | week`
   - 周视图范围：`3h | 3events`
   - 列表背景模式：`none | countdown | progress`
   - 是否显示当前时间线

2. 颜色设置
   - 卡片主色
   - 文字色
   - 进度条颜色
   - 正在进行高亮色
   - 即将开始高亮色

3. 主题设置
   - 使用 `WidgetConfigOption.theme`
   - 至少开启：
     - `backgroundColor`
     - `borderRadius`
     - `color`
     - `dividerColor`

4. 数据管理
   - 手动新增
   - ICS 导入
   - CSV 导入
   - JSON 导入
   - ICS 导出
   - CSV 导出
   - JSON 导出
   - 清空所有数据

## 10. 导入与导出规格

## 10.1 ICS 导入

建议实现：

- 解析库：`ical.js`
- 重复规则：优先保留 RRULE
- 字段映射：
  - `SUMMARY -> title`
  - `DESCRIPTION -> description`
  - `LOCATION -> location`
  - `DTSTART -> startAt`
  - `DTEND -> endAt`
  - `RRULE -> recurrenceRRule`
  - `EXDATE -> exdates`

导入行为：

- 若 ICS 事件为全天事件，本期转换为 `00:00 - 23:59` 的范围事件
- 若 ICS 无 `DTEND`，则导入为 `timeMode=point`
- 若 ICS 含 RRULE，但 UI 预设无法完全表达，则保留为 `recurrenceType=custom + recurrenceRRule`

## 10.2 CSV 导入

建议实现：

- 解析库：`PapaParse`
- 解析配置：
  - `header: true`
  - `skipEmptyLines: 'greedy'`
  - `transformHeader: trim + lower_snake_case`

支持字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 日程名 |
| `date` | 否 | 单次事件日期，格式 `YYYY-MM-DD` |
| `start_time` | 是 | 开始时间，格式 `HH:mm` |
| `end_time` | 否 | 结束时间，格式 `HH:mm` |
| `repeat_type` | 否 | 见重复规则枚举 |
| `repeat_interval` | 否 | 每 N 次重复使用 |
| `weekdays` | 否 | 如 `1,3,5` 表示周一三五 |
| `weeks` | 否 | 如 `1-16`、`1-16单`、`2-16双` |
| `description` | 否 | 详细描述 |
| `location` | 否 | 地点 |
| `color` | 否 | 卡片颜色 |

周次提取规则：

- 优先读 `weeks` 列
- 若 `weeks` 为空，则从 `description`、`location` 中按正则提取：
  - `1-16周`
  - `1-8周`
  - `1-16单周`
  - `2-16双周`
  - `第1,3,5周`

若显式日期与周次同时存在：

- 单次事件优先用显式日期
- 课表型事件优先用周次 + 周几 + 时间段生成重复规则

## 10.3 JSON 导入

JSON 顶层必须为数组，每个对象至少包含：

- `title`
- `startAt`

可选字段与内部存储结构一致。

## 10.4 ICS 导出

建议实现：

- 优先输出 `VCALENDAR + VEVENT`
- 每条事件至少映射：
  - `title -> SUMMARY`
  - `description -> DESCRIPTION`
  - `location -> LOCATION`
  - `startAt -> DTSTART`
  - `endAt -> DTEND`
  - `recurrenceRRule -> RRULE`
  - `exdates -> EXDATE`

导出规则：

- `timeMode=point` 的事件导出为仅带 `DTSTART` 的事件，若运行期需要更高兼容性，可补默认持续时长
- `timeMode=range` 的事件导出为 `DTSTART + DTEND`
- 能被 RRULE 表达的重复规则必须导出为 RRULE
- 无法可靠映射到 RRULE 的复杂自定义日期，允许拆成多个 VEVENT 或多个 `RDATE`

导出目标：

- 导出的 ICS 应能被本组件重新导入
- 导出的 ICS 应尽量兼容常见日历客户端

## 10.5 CSV 导出

CSV 导出必须使用与导入一致的字段列顺序：

`title,date,start_time,end_time,repeat_type,repeat_interval,weekdays,weeks,description,location,color`

导出规则：

- 单次事件写入 `date`
- 重复事件写入 `repeat_type`、`repeat_interval`、`weekdays`、`weeks`
- `description` 与 `location` 不得被合并丢失
- `color` 输出为十六进制颜色值

导出目标：

- 导出文件应可直接再次通过 CSV 导入器导回
- 对没有 `weeks` 的普通日程，`weeks` 列允许为空

## 10.6 JSON 导出

JSON 导出直接使用规范化结构：

- 顶层为数组
- 每项字段与 `ScheduleEventRecord` 对齐
- `createdAt`、`updatedAt` 可保留

导出目标：

- 导出 JSON 必须能被 JSON 导入器无损导回
- 导出结果应保留 `recurrenceRRule`、`exdates`、`color` 等增强字段

## 11. 重复规则支持

UI 必须支持以下预设：

- 不重复
- 每天
- 周一到周五
- 工作日
- 周末
- 每周
- 每月
- 每年
- 每 `_` 分钟
- 每 `_` 小时
- 每 `_` 天
- 每 `_` 月
- 每 `_` 年
- 自定义日期

自定义日期模式要求支持：

- 直接输入日期集合
- 输入周几集合
- 输入周次范围

内部统一映射为 `rrule` 或“显式 occurrence 列表”。

## 12. 通知需求

## 12.1 通知触发点

必须支持：

- 事件开始时通知
- 事件结束时通知

可扩展但非本期必做：

- 提前 5/10/15 分钟提醒

## 12.2 去重机制

通知日志键建议为：

`occurrenceKey + triggerType`

其中：

- `triggerType = start | end`

必须持久化，避免以下场景重复通知：

- 组件刷新
- 应用重启
- 导入后重算

## 12.3 风险约束

由于 Widget.js `NotificationApi` 文档只说明“可发送通知”，未明确写明是否映射到 Windows 原生通知中心，因此本规格要求：

- 实现优先使用 `NotificationApi.send` 或 `NotificationApi.reminder`
- 验收必须在 Windows 真实环境验证通知是否进入系统通知中心
- 若未进入系统通知中心，则该问题记为 P0 技术缺口，必须补桥接方案后才能宣告“满足原生通知需求”

## 13. 颜色与视觉规则

默认颜色建议：

- 卡片默认背景：`#dbeafe`
- 卡片默认文字：`#1e40af`
- 进度默认色：`#3b82f6`
- 当前时间线：`#ef4444`
- 即将开始高亮：`#2563eb`

视觉规则：

- 不覆盖 `widget-wrapper` 提供的整体主题能力
- 子卡片与进度条颜色允许单独配置
- 颜色不足时回退到主题色
- 过去事件降低透明度
- 当前事件要有最强视觉层级

## 14. 错误处理

| 场景 | 行为 |
| --- | --- |
| ICS 解析失败 | 显示失败原因，不写入任何数据 |
| CSV 列缺失 | 显示缺失列名并阻止导入 |
| CSV 某行时间非法 | 跳过该行，记录行号与原因 |
| JSON 结构非法 | 阻止导入并提示“顶层必须为数组” |
| RRULE 无法映射 UI 预设 | 以 `custom` 保留，不丢失原规则 |
| 通知权限不可用 | 设置页显示警告，但组件主体继续工作 |
| 同一时刻事件过多 | 列表视图完整展示；周视图允许聚合为 `+N` |

## 15. 验收标准

### AC-01 今日列表

Given 今天存在 5 条日程  
When 用户打开组件并处于列表视图  
Then 组件应按时间顺序展示 5 条日程，并显示时间、标题、重复信息

### AC-02 周视图时间线

Given 本周存在至少 1 条进行中事件  
When 用户打开周视图  
Then 组件应显示当前时间线，并高亮进行中事件

### AC-03 范围切换

Given 用户已打开周视图  
When 用户将显示范围从 `3h` 切换为 `3events`  
Then 周视图应立即重算可见区间并刷新内容

### AC-04 尺寸适配

Given 组件尺寸分别为 `4x3`、`4x4`、`8x8`  
When 用户查看组件  
Then 三个尺寸下都不应出现核心信息不可读或操作区完全遮挡

### AC-05 ICS 导入

Given 用户导入含 RRULE 的 ICS 文件  
When 导入完成  
Then 事件应保留重复规则并可在当前周/当天正确展开

### AC-06 CSV 周次提取

Given CSV 未提供 `weeks` 列，但描述中包含 `1-16周`  
When 导入完成  
Then 系统应成功提取周次并生成相应重复规则

### AC-07 JSON 导入

Given 用户导入符合模板的 JSON  
When 导入完成  
Then 所有合法事件都应出现在组件中

### AC-08 ICS 导出

Given 当前组件中存在单次事件与重复事件  
When 用户执行 ICS 导出  
Then 生成的文件应包含标准 `VEVENT`，并保留可表达的 RRULE 信息

### AC-09 CSV 导出

Given 当前组件中存在至少 3 条不同类型事件  
When 用户执行 CSV 导出  
Then 生成的文件应符合约定列头，并能被 CSV 导入器再次导入

### AC-10 JSON 导出

Given 当前组件中存在带颜色与重复规则的事件  
When 用户执行 JSON 导出  
Then 导出结果应保留颜色、重复规则与基础时间字段，并可直接再次导入

### AC-11 通知

Given 某事件开始时间到达  
When 调度器检测到触发时刻  
Then 系统应发送一次开始通知，且同一实例不可重复发送

## 16. CSV 与 JSON 模板

本规格同时要求仓库提供：

- `refer/demo.csv`
- `refer/demo.json`

CSV 模板：

```csv
title,date,start_time,end_time,repeat_type,repeat_interval,weekdays,weeks,description,location,color
高等数学,2026-03-23,08:20,09:55,weekly,1,"1,3,5","1-16","1-16周，理科楼A302","理科楼A302","#dbeafe"
午休提醒,2026-03-23,12:30,,daily,1,,,"固定午休提醒","宿舍","#fef3c7"
项目站会,2026-03-24,10:00,10:30,weekdays,1,"1,2,3,4,5",,"工作日例会","腾讯会议","#dcfce7"
```

JSON 模板：

```json
[
  {
    "title": "高等数学",
    "source": "json",
    "timeMode": "range",
    "startAt": "2026-03-23T08:20:00+08:00",
    "endAt": "2026-03-23T09:55:00+08:00",
    "recurrenceType": "weekly",
    "recurrenceInterval": 1,
    "recurrenceWeekdays": [1, 3, 5],
    "recurrenceWeeks": "1-16",
    "description": "1-16周，理科楼A302",
    "location": "理科楼A302",
    "color": "#dbeafe"
  },
  {
    "title": "午休提醒",
    "source": "json",
    "timeMode": "point",
    "startAt": "2026-03-23T12:30:00+08:00",
    "recurrenceType": "daily",
    "recurrenceInterval": 1,
    "description": "固定午休提醒",
    "location": "宿舍",
    "color": "#fef3c7"
  }
]
```

## 17. 实施建议

优先顺序建议：

1. 先落数据模型、重复规则与 occurrence 展开
2. 再做 `4x4` 列表视图
3. 再做 `4x3` 紧凑视图
4. 最后补 `8x8` 周视图增强版
5. 导入能力按 `JSON -> CSV -> ICS` 顺序落地
6. 导出能力按 `JSON -> CSV -> ICS` 顺序落地
6. 通知最后联调，并在 Windows 真机验证

## 18. 运行、测试与发布文档

本章节基于两类信息整理：

- 当前项目根目录实际脚本与配置：`package.json`、`vite.config.ts`、`widget.package.ts`
- Widget.js 官方发布文档：
  - 组件包：<https://widgetjs.cn/guide/widget-package>
  - GitHub 发布：<https://widgetjs.cn/guide/publish/github>
  - 服务器发布：<https://widgetjs.cn/guide/publish/self-host>

### 18.1 环境要求

- Node.js：`>= 16.20.0`
- 包管理器：默认使用 `npm`
- 开发前先安装依赖：

```bash
npm install
```

### 18.2 本地运行

项目当前采用 Vite 作为开发服务器，根目录命令如下：

```bash
npm run dev
```

运行效果要求：

- 启动 Vite 开发服务
- 通过根路由进入开发入口页
- 通过 `#/widget/schedule` 访问组件页
- 通过 `#/widget/config/schedule?...` 访问设置页

### 18.3 本地预览

构建完成后可使用：

```bash
npm run preview
```

用于验证：

- 构建产物是否可在本地静态预览
- `widget.json` 与页面资源路径是否正确
- 路由在 hash 模式下是否正常跳转

### 18.4 自动化测试

项目当前测试命令：

```bash
npm test
```

说明：

- 使用 `vitest --run`
- 当前至少覆盖：
  - recurrence 展开
  - 当前/下一事件判断
  - CSV 导入与导出
  - JSON 导入与导出
  - ICS 导入与导出

开发时可使用：

```bash
npm run test:watch
```

### 18.5 类型检查

类型检查命令：

```bash
npm run typecheck
```

要求：

- 使用 `vue-tsc --noEmit`
- 发布前必须通过
- 新增 `Vue SFC`、composable、model、importer/exporter 时必须纳入检查

### 18.6 生产构建

在线构建命令：

```bash
npm run build
```

构建输出要求：

- 在 `dist/` 下生成页面资源
- 由 `@widget-js/vite-plugin-widget` 生成 `widget.json`
- `widget.json` 中的组件元数据应与 `widget.package.ts` 和 `src/widgets/**/*.widget.ts` 保持一致

离线包构建命令：

```bash
npm run build:offline
```

说明：

- 当前项目已保留 `offline` 构建脚本
- 该命令用于生成适合离线分发的构建产物
- 离线构建也必须验证 `widget.json` 是否生成

### 18.7 发布前检查清单

发布前至少执行以下顺序：

```bash
npm test
npm run typecheck
npm run build
```

发布前人工检查：

- `widget.package.ts` 中 `name`、`title`、`description`、`remote.hostname`、`remote.base`
- `Schedule.widget.ts` 中 `name`、`path`、`configPagePath`、尺寸与 `supportDeployMode`
- `public/preview_schedule.svg` 或后续替换后的预览图是否可用
- `dist/widget.json` 是否包含 `schedule` 组件

### 18.8 通过 GitHub Pages 发布

根据 Widget.js 官方文档，GitHub 发布流程应为：

1. 修改 `widget.package.ts` 中的 `remote` 配置
   - `hostname` 改为 GitHub Pages 域名
   - `base` 改为仓库名路径，如 `/widgetjs-schedule`
2. 配置 GitHub Actions，在推送后执行：

```bash
npm install
npm run build
```

3. 将 `dist/` 部署到 GitHub Pages
4. 页面可访问后，在项目根目录执行组件包发布：

```bash
widget publish -k <your-publish-token>
```

注意：

- 官方文档说明发布后仍需管理员审核，审核通过后组件包才能在客户端搜索
- GitHub Pages 路径与 `widget.package.ts.remote.base` 必须严格一致，否则 `widget.json` 与资源路径会失效

### 18.9 通过自托管服务器发布

根据 Widget.js 官方文档，自托管发布流程应为：

1. 先执行：

```bash
npm run build
```

2. 将 `dist/` 上传到静态服务器目录
3. 配置 Nginx 或其他静态服务器，使：
   - `hostname` 对应 `widget.package.ts.remote.hostname`
   - 路径前缀对应 `widget.package.ts.remote.base`
4. 配置 history fallback 到对应 `index.html`
5. 页面验证通过后，在项目根目录执行：

```bash
widget publish -k <your-publish-token>
```

### 18.10 本项目发布建议

对当前仓库，建议使用以下发布约束：

1. 开发阶段：
   - `widget.package.ts.remote.hostname = localhost`
   - `widget.package.ts.remote.base = /`
2. GitHub Pages 发布阶段：
   - 将 `hostname` 改为 `<your-github-name>.github.io`
   - 将 `base` 改为仓库名路径
3. 自托管发布阶段：
   - 将 `hostname` 改为正式域名
   - 将 `base` 改为实际部署目录
4. 每次修改 `remote` 后都必须重新构建，不能复用旧 `dist`

## 19. 研究来源

- Widget.js 组件指南：<https://widgetjs.cn/guide/widget>
- Widget.js 主题指南：<https://widgetjs.cn/guide/theme>
- Widget.js 组件包：<https://widgetjs.cn/guide/widget-package>
- Widget.js BrowserWindowApi：<https://widgetjs.cn/api/BrowserWindowApi>
- Widget.js NotificationApi：<https://widgetjs.cn/api/NotificationApi>
- Widget.js GitHub 发布：<https://widgetjs.cn/guide/publish/github>
- Widget.js 服务器发布：<https://widgetjs.cn/guide/publish/self-host>
- `widget-js/hotspot`：<https://github.com/widget-js/hotspot>
- `rtugeek/itime-web`：<https://github.com/rtugeek/itime-web>
- `HevSpecu/SDNUChronoSync`：<https://github.com/HevSpecu/SDNUChronoSync>
- Context7 `/jkbrzt/rrule`
- Context7 `/mholt/papaparse`
- Context7 `/kewisch/ical.js`
