import type { RouteRecordRaw } from 'vue-router'
import ScheduleWidget from './Schedule.widget'

const path = ScheduleWidget.path
const name = ScheduleWidget.name
const configPagePath = ScheduleWidget.configPagePath!.split('?')[0]!

const ScheduleWidgetRoutes: RouteRecordRaw[] = [
  {
    path,
    name,
    component: () => import('./ScheduleWidgetView.vue'),
  },
  {
    path: configPagePath,
    name: `${name}.config`,
    component: () => import('./ScheduleConfigView.vue'),
  },
]

export default ScheduleWidgetRoutes
