import { WidgetPackage } from '@widget-js/core'

export default new WidgetPackage({
  author: 'excnies',
  description: {
    'zh-CN': '支持课程表、待办与多格式导入导出的日程组件',
  },
  entry: '/',
  hash: true,
  remote: {
    base: '/',
    hostname: 'localhost',
    hash: true,
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
