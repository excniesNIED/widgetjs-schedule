import { WidgetPackage } from '@widget-js/core'

export default new WidgetPackage({
  author: 'excnies',
  description: {
    'zh-CN': '支持课程表、待办与多格式导入导出的日程组件',
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
    'zh-CN': 'Schedule',
  },
  devOptions: {
    folder: './src/widgets/',
  },
})
