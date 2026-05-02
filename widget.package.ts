import { WidgetPackage } from '@widget-js/core'

export default new WidgetPackage({
  author: 'excnies',
  description: {
    'zh-CN': '支持课程表、待办与多格式导入导出的日程管理组件',
    'en-US': 'Schedule management widget with course schedules, todos, and multi-format import/export',
  },
  version: '1.0.0',
  entry: '/',
  hash: true,
  remote: {
    base: '/widgetjs-schedule',
    hostname: 'excniesnied.github.io',
  },
  homepage: '',
  name: 'cn.excnies.widget.schedule',
  title: {
    'zh-CN': '日程管理',
    'en-US': 'Schedule',
  },
  devOptions: {
    folder: './src/widgets/',
  },
})
