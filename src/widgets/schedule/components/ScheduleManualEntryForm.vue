<script setup lang="ts">
import { computed, reactive } from 'vue'
import { combineDateAndTime } from '../model/date'
import { normalizeWeeksExpression } from '../model/recurrence'
import type {
  ScheduleEventRecord,
  ScheduleRecurrenceType,
} from '../model/types'

const props = defineProps<{
  defaultColor: string
}>()

const emit = defineEmits<{
  submit: [payload: Partial<ScheduleEventRecord>]
}>()

const today = new Date().toISOString().slice(0, 10)
const recurrenceOptions: Array<{ label: string, value: ScheduleRecurrenceType }> = [
  { label: '单次', value: 'none' },
  { label: '每天', value: 'daily' },
  { label: '工作日', value: 'weekdays' },
  { label: '周末', value: 'weekend' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每年', value: 'yearly' },
  { label: '每 N 分钟', value: 'every_n_minutes' },
  { label: '每 N 小时', value: 'every_n_hours' },
  { label: '每 N 天', value: 'every_n_days' },
  { label: '每 N 月', value: 'every_n_months' },
  { label: '每 N 年', value: 'every_n_years' },
  { label: '自定义 RRULE', value: 'custom' },
]

const form = reactive({
  title: '',
  date: today,
  startTime: '08:00',
  endTime: '',
  recurrenceType: 'none' as ScheduleRecurrenceType,
  recurrenceInterval: 1,
  weekdays: [] as number[],
  weeks: '',
  recurrenceRRule: '',
  description: '',
  location: '',
  color: props.defaultColor,
})

const showInterval = computed(() =>
  [
    'every_n_minutes',
    'every_n_hours',
    'every_n_days',
    'every_n_months',
    'every_n_years',
  ].includes(form.recurrenceType),
)

function reset() {
  form.title = ''
  form.date = today
  form.startTime = '08:00'
  form.endTime = ''
  form.recurrenceType = 'none'
  form.recurrenceInterval = 1
  form.weekdays = []
  form.weeks = ''
  form.recurrenceRRule = ''
  form.description = ''
  form.location = ''
  form.color = props.defaultColor
}

function onSubmit() {
  if (!form.title.trim()) {
    return
  }

  emit('submit', {
    title: form.title.trim(),
    startAt: combineDateAndTime(form.date, form.startTime),
    endAt: form.endTime ? combineDateAndTime(form.date, form.endTime) : undefined,
    timeMode: form.endTime ? 'range' : 'point',
    recurrenceType: form.recurrenceType,
    recurrenceInterval: showInterval.value ? form.recurrenceInterval : 1,
    recurrenceWeekdays: form.weekdays.length > 0 ? form.weekdays : undefined,
    recurrenceWeeks: normalizeWeeksExpression(form.weeks),
    recurrenceRRule: form.recurrenceType === 'custom' ? form.recurrenceRRule.trim() : undefined,
    description: form.description.trim() || undefined,
    location: form.location.trim() || undefined,
    color: form.color,
  })

  reset()
}
</script>

<template>
  <div class="manual-form">
    <div class="grid two">
      <label>
        <span>日程名</span>
        <el-input v-model="form.title" placeholder="例如：高等数学 / 项目站会" />
      </label>
      <label>
        <span>颜色</span>
        <el-color-picker v-model="form.color" />
      </label>
    </div>

    <div class="grid three">
      <label>
        <span>日期</span>
        <el-input v-model="form.date" type="date" />
      </label>
      <label>
        <span>开始时间</span>
        <el-input v-model="form.startTime" type="time" />
      </label>
      <label>
        <span>结束时间</span>
        <el-input v-model="form.endTime" type="time" />
      </label>
    </div>

    <div class="grid two">
      <label>
        <span>重复</span>
        <el-select v-model="form.recurrenceType">
          <el-option
            v-for="option in recurrenceOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </label>
      <label v-if="showInterval">
        <span>重复间隔</span>
        <el-input-number v-model="form.recurrenceInterval" :min="1" :max="365" />
      </label>
    </div>

    <div class="grid two">
      <label>
        <span>周几</span>
        <el-select v-model="form.weekdays" multiple placeholder="仅周课表使用">
          <el-option label="周一" :value="1" />
          <el-option label="周二" :value="2" />
          <el-option label="周三" :value="3" />
          <el-option label="周四" :value="4" />
          <el-option label="周五" :value="5" />
          <el-option label="周六" :value="6" />
          <el-option label="周日" :value="7" />
        </el-select>
      </label>
      <label>
        <span>周次</span>
        <el-input v-model="form.weeks" placeholder="例如：1-16、1-15单、2,4,6" />
      </label>
    </div>

    <label v-if="form.recurrenceType === 'custom'">
      <span>RRULE</span>
      <el-input v-model="form.recurrenceRRule" placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR" />
    </label>

    <label>
      <span>地点</span>
      <el-input v-model="form.location" placeholder="可选" />
    </label>

    <label>
      <span>详细描述</span>
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="2"
        placeholder="可写课程信息、会议链接、备注"
      />
    </label>

    <div class="actions">
      <el-button type="primary" @click="onSubmit">
        添加日程
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.manual-form {
  display: grid;
  gap: 0.8rem;
}

.grid {
  display: grid;
  gap: 0.8rem;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 0.35rem;
}

label span {
  font-size: 0.82rem;
  color: #405160;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .grid.two,
  .grid.three {
    grid-template-columns: 1fr;
  }
}
</style>
