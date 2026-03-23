import { DeployMode, Widget, WidgetKeyword } from '@widget-js/core'

const ScheduleWidget = new Widget({
  name: 'cn.excnies.widget.schedule',
  title: { 'zh-CN': 'Schedule' },
  description: { 'zh-CN': '支持今日列表、周视图和多格式导入导出的日程组件' },
  keywords: [WidgetKeyword.RECOMMEND],
  lang: 'zh-CN',
  width: 4,
  height: 4,
  minWidth: 4,
  maxWidth: 8,
  minHeight: 3,
  maxHeight: 8,
  previewImage: '/preview_schedule.svg',
  supportDeployMode: DeployMode.NORMAL | DeployMode.OVERLAP,
  path: '/widget/schedule',
  configPagePath: '/widget/config/schedule?frame=true&transparent=false&width=760&height=720',
  browserWindowOptions: {
    backgroundThrottling: false,
  },
})

export default ScheduleWidget
