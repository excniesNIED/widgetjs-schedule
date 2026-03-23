import type { RouteRecordRaw } from 'vue-router'
import ScheduleWidgetRoutes from './schedule/ScheduleWidgetRoutes'

const WidgetRouter: RouteRecordRaw[] = [
  ...ScheduleWidgetRoutes,
]

export default WidgetRouter
