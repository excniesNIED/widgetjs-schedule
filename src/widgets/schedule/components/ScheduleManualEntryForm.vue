<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { combineDateAndTime, dayjs } from '../model/date'
import type {
  ScheduleEventRecord,
  ScheduleRecurrenceType,
} from '../model/types'

const props = defineProps<{
  editingEvent?: ScheduleEventRecord | null
}>()

const emit = defineEmits<{
  submit: [payload: Partial<ScheduleEventRecord>]
  cancelEdit: []
}>()

const today = dayjs().format('YYYY-MM-DD')
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
  recurrenceRRule: '',
  description: '',
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

const isEditing = computed(() => Boolean(props.editingEvent))

function applyEventToForm(event?: ScheduleEventRecord | null) {
  if (!event) {
    reset()
    return
  }

  form.title = event.title
  form.date = dayjs(event.startAt).format('YYYY-MM-DD')
  form.startTime = dayjs(event.startAt).format('HH:mm')
  form.endTime = event.endAt ? dayjs(event.endAt).format('HH:mm') : ''
  form.recurrenceType = event.recurrenceType
  form.recurrenceInterval = event.recurrenceInterval ?? 1
  form.recurrenceRRule = event.recurrenceRRule ?? ''
  form.description = event.description ?? ''
}

function reset() {
  form.title = ''
  form.date = today
  form.startTime = '08:00'
  form.endTime = ''
  form.recurrenceType = 'none'
  form.recurrenceInterval = 1
  form.recurrenceRRule = ''
  form.description = ''
}

watch(
  () => props.editingEvent,
  (event) => {
    applyEventToForm(event)
  },
  { immediate: true },
)

function onSubmit() {
  if (!form.title.trim()) {
    return
  }

  emit('submit', {
    id: props.editingEvent?.id,
    uid: props.editingEvent?.uid,
    title: form.title.trim(),
    startAt: combineDateAndTime(form.date, form.startTime),
    endAt: form.endTime ? combineDateAndTime(form.date, form.endTime) : undefined,
    timeMode: form.endTime ? 'range' : 'point',
    recurrenceType: form.recurrenceType,
    recurrenceInterval: showInterval.value ? form.recurrenceInterval : 1,
    recurrenceRRule: form.recurrenceType === 'custom' ? form.recurrenceRRule.trim() : undefined,
    description: form.description.trim() || undefined,
  })

  if (isEditing.value) {
    emit('cancelEdit')
  }
  else {
    reset()
  }
}

function handleCancelEdit() {
  emit('cancelEdit')
  reset()
}
</script>

<template>
  <div class="manual-form">
    <div class="form-head">
      <strong>{{ isEditing ? '编辑日程' : '手动添加' }}</strong>
      <el-button
        v-if="isEditing"
        text
        @click="handleCancelEdit"
      >
        取消编辑
      </el-button>
    </div>

    <div class="grid two">
      <label>
        <span>日程名</span>
        <el-input v-model="form.title" placeholder="例如：高等数学 / 项目站会" />
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

    <label v-if="form.recurrenceType === 'custom'">
      <span>RRULE</span>
      <el-input v-model="form.recurrenceRRule" placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR" />
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
        {{ isEditing ? '保存修改' : '添加日程' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.manual-form {
  display: grid;
  gap: 8px;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.form-head strong {
  font-size: 0.92rem;
  color: #243744;
}

.grid {
  display: grid;
  gap: 8px;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 4px;
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
