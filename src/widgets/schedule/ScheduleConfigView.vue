<script setup lang="ts">
import { useWidget, WidgetConfigOption, WidgetEditDialog } from '@widget-js/vue3'
import { computed, nextTick, ref } from 'vue'
import ScheduleManualEntryForm from './components/ScheduleManualEntryForm.vue'
import { useScheduleImportExport } from './composables/useScheduleImportExport'
import { ensureSystemNotificationPermission } from './composables/useScheduleNotifications'
import { useScheduleStore } from './composables/useScheduleStore'
import { dayjs } from './model/date'
import {
  getToastDurationSeconds,
  shouldShowToastDurationInput,
  toToastDurationMilliseconds,
} from './model/notification-settings'
import type { ScheduleEventRecord, ScheduleNotificationType, ScheduleWidgetSettings } from './model/types'

const { widgetParams, save } = useWidget()
const activeTab = ref('schedule')
const widgetConfigOption = new WidgetConfigOption({
  title: 'Schedule 设置',
  theme: {
    backgroundColor: true,
    borderRadius: true,
    color: true,
    dividerColor: true,
  },
})

const {
  sortedEvents,
  settings,
  importEvents,
  upsertEvent,
  removeEvent,
  clearAll,
  updateSettings,
} = useScheduleStore()

const { importByFile, exportByType, downloadExample } = useScheduleImportExport()
const importMessage = ref('')
const importError = ref('')
const fileInput = ref<HTMLInputElement>()
const editingEvent = ref<ScheduleEventRecord | null>(null)
const editSectionRef = ref<HTMLElement>()

const showToastSettings = computed(() =>
  shouldShowToastDurationInput(settings.value.notificationTypes ?? []),
)

const notificationTypeOptions: Array<{ label: string, value: ScheduleNotificationType }> = [
  { label: 'Toast 弹窗', value: 'toast' },
  { label: '系统通知', value: 'system' },
]

async function handleNotificationTypeChange(types: ScheduleNotificationType[]) {
  updateSettings({ notificationTypes: types })

  if (types.includes('system')) {
    const permission = await ensureSystemNotificationPermission()
    if (permission === 'denied') {
      importError.value = '系统通知权限已被拒绝，请在系统设置中开启通知权限。'
    }
  }
}

async function handleNotificationSettingChange(
  key: 'notifyOnAlarm' | 'notifyOnStart' | 'notifyOnEnd',
  value: boolean,
) {
  updateSettings({
    [key]: value,
  } as Partial<ScheduleWidgetSettings>)

  if (!value) {
    return
  }

  if (settings.value.notificationTypes?.includes('system')) {
    const permission = await ensureSystemNotificationPermission()
    if (permission === 'denied') {
      importError.value = '系统通知权限已被拒绝，请在系统设置中开启通知权限。'
    }
  }
}

function handleToastDurationChange(value: number | undefined) {
  if (!value) {
    return
  }

  updateSettings({
    toastDuration: toToastDurationMilliseconds(value),
  })
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return
  }

  importError.value = ''
  importMessage.value = ''

  try {
    const result = await importByFile(file)
    importEvents(result.events)
    importMessage.value = `已导入 ${result.events.length} 条事件`
    if (result.errors.length > 0) {
      importError.value = result.errors.map(error => error.message).join('；')
    }
  }
  catch (error) {
    importError.value = error instanceof Error ? error.message : '导入失败'
  }
  finally {
    target.value = ''
  }
}

function triggerImport() {
  fileInput.value?.click()
}

function handleManualSubmit(payload: Partial<ScheduleEventRecord>) {
  upsertEvent(payload)
  editingEvent.value = null
  importMessage.value = payload.id ? '已更新日程' : '已添加新日程'
}

function handleEdit(event: ScheduleEventRecord) {
  editingEvent.value = { ...event }
  importError.value = ''
  importMessage.value = ''
  activeTab.value = 'schedule'
  void nextTick(() => {
    editSectionRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}
</script>

<template>
  <WidgetEditDialog
    :widget-params="widgetParams"
    :option="widgetConfigOption"
    label-width="110px"
    @apply="save()"
    @confirm="save({ closeWindow: true })"
  >
    <template #custom>
      <div class="config-scroll">
        <el-tabs v-model="activeTab" type="border-card" class="config-tabs">
          <!-- 通知设置 Tab -->
          <el-tab-pane label="通知设置" name="notifications">
            <div class="config-section">
              <div class="sub-section">
                <h3>通知方式</h3>
                <p class="hint">
                  可同时选择多种通知方式
                </p>
                <div class="checkbox-group">
                  <el-checkbox-group
                    :model-value="settings.notificationTypes ?? []"
                    @change="handleNotificationTypeChange"
                  >
                    <el-checkbox
                      v-for="option in notificationTypeOptions"
                      :key="option.value"
                      :value="option.value"
                      :label="option.label"
                      border
                    />
                  </el-checkbox-group>
                </div>
                <div v-if="showToastSettings" class="toast-settings">
                  <label class="setting-item">
                    <span>显示时长 (秒)</span>
                    <el-input-number
                      :model-value="getToastDurationSeconds(settings.toastDuration)"
                      :min="1"
                      :max="10"
                      :step="1"
                      @change="handleToastDurationChange"
                    />
                  </label>
                </div>
              </div>

              <div class="sub-section">
                <h3>通知触发条件</h3>
                <div class="trigger-options">
                  <label class="switch-item">
                    <span>日程提醒</span>
                    <el-switch
                      :model-value="settings.notifyOnAlarm"
                      @change="(val: boolean) => handleNotificationSettingChange('notifyOnAlarm', val)"
                    />
                  </label>
                  <label class="switch-item">
                    <span>日程开始</span>
                    <el-switch
                      :model-value="settings.notifyOnStart"
                      @change="(val: boolean) => handleNotificationSettingChange('notifyOnStart', val)"
                    />
                  </label>
                  <label class="switch-item">
                    <span>日程结束</span>
                    <el-switch
                      :model-value="settings.notifyOnEnd"
                      @change="(val: boolean) => handleNotificationSettingChange('notifyOnEnd', val)"
                    />
                  </label>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 日程设置 Tab -->
          <el-tab-pane label="日程设置" name="schedule">
            <div class="config-section">
              <div class="sub-section">
                <h3>列表背景模式</h3>
                <div class="radio-group">
                  <el-radio-group
                    :model-value="settings.listBackgroundMode"
                    @change="(val: string) => updateSettings({ listBackgroundMode: val as any })"
                  >
                    <el-radio-button value="none">
                      无
                    </el-radio-button>
                    <el-radio-button value="countdown">
                      倒计时
                    </el-radio-button>
                    <el-radio-button value="progress">
                      进度
                    </el-radio-button>
                  </el-radio-group>
                </div>
              </div>

              <div class="sub-section">
                <h3>时间点事件默认持续时间</h3>
                <label class="setting-item">
                  <span>分钟数</span>
                  <el-input-number
                    :model-value="settings.pointEventDurationMinutes"
                    :min="1"
                    :max="60"
                    :step="1"
                    @change="(val: number) => updateSettings({ pointEventDurationMinutes: val })"
                  />
                </label>
              </div>

              <div ref="editSectionRef" class="sub-section">
                <h3>{{ editingEvent ? '编辑日程' : '手动添加' }}</h3>
                <ScheduleManualEntryForm
                  :editing-event="editingEvent"
                  @submit="handleManualSubmit"
                  @cancel-edit="editingEvent = null"
                />
              </div>

              <div class="sub-section">
                <h3>导入与导出</h3>
                <div class="import-actions">
                  <el-button @click="triggerImport">
                    导入 CSV / JSON / ICS
                  </el-button>
                  <el-button @click="exportByType('csv', sortedEvents)">
                    导出 CSV
                  </el-button>
                  <el-button @click="exportByType('json', sortedEvents)">
                    导出 JSON
                  </el-button>
                  <el-button @click="exportByType('ics', sortedEvents)">
                    导出 ICS
                  </el-button>
                  <el-button plain @click="downloadExample('csv')">
                    下载示例 CSV
                  </el-button>
                  <el-button plain @click="downloadExample('json')">
                    下载示例 JSON
                  </el-button>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".csv,.json,.ics"
                  hidden
                  @change="onFileSelected"
                >
                <p v-if="importMessage" class="message success">
                  {{ importMessage }}
                </p>
                <p v-if="importError" class="message error">
                  {{ importError }}
                </p>
              </div>
            </div>
          </el-tab-pane>

          <!-- 已保存事件 Tab -->
          <el-tab-pane label="已保存事件" name="saved">
            <div class="config-section">
              <div class="sub-section">
                <div class="section-head">
                  <h3>已保存事件</h3>
                  <el-button type="danger" plain @click="clearAll">
                    清空全部
                  </el-button>
                </div>
                <div
                  v-if="sortedEvents.length > 0"
                  class="saved-list"
                >
                  <article
                    v-for="event in sortedEvents"
                    :key="event.id"
                    class="saved-item"
                  >
                    <div class="saved-item-content">
                      <strong>{{ event.title }}</strong>
                      <span>{{ dayjs(event.startAt).format('YYYY-MM-DD HH:mm') }}</span>
                    </div>
                    <div class="saved-actions">
                      <el-button text @click="handleEdit(event)">
                        编辑
                      </el-button>
                      <el-button text type="danger" @click="removeEvent(event.id)">
                        删除
                      </el-button>
                    </div>
                  </article>
                </div>
                <p v-else class="message">
                  当前还没有日程数据。
                </p>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </WidgetEditDialog>
</template>

<style scoped>
.config-scroll {
  max-height: min(72vh, 54rem);
  overflow: auto;
  padding-right: 0.35rem;
  overscroll-behavior: contain;
}

.config-tabs {
  border: none;
}

:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-tabs__item) {
  font-size: 0.9rem;
  height: 36px;
  line-height: 36px;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}

.config-section {
  padding: 16px 0;
}

.sub-section {
  display: grid;
  gap: 16px;
}

.sub-section + .sub-section {
  padding-top: 16px;
  border-top: 1px solid #ebe6dc;
}

.sub-section h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #243744;
  font-weight: 500;
}

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: #6c7b84;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-checkbox.is-bordered) {
  padding: 8px 16px;
  border-radius: 8px;
}

.toast-settings {
  padding-top: 8px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item span {
  font-size: 0.82rem;
  color: #405160;
}

.trigger-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.switch-item span {
  font-size: 0.88rem;
  color: #243744;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.message {
  margin: 0;
  font-size: 0.82rem;
  color: #586874;
}

.message.success {
  color: #1e7d57;
}

.message.error {
  color: #a64444;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.section-head h3 {
  margin: 0;
}

.saved-list {
  display: grid;
  gap: 8px;
  max-height: 20rem;
  overflow: auto;
}

.saved-item {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f7f3ea;
}

.saved-item-content {
  display: grid;
  gap: 4px;
}

.saved-item-content strong {
  color: #243744;
  font-size: 0.88rem;
}

.saved-item-content span {
  font-size: 0.78rem;
  color: #6c7b84;
}

.saved-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-dialog__body) {
  overflow: hidden;
}

@media (max-width: 760px) {
  .section-head,
  .saved-item {
    flex-direction: column;
    align-items: stretch;
  }

  .saved-actions {
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  :deep(.el-tabs__item) {
    font-size: 0.8rem;
    padding: 0 8px;
  }
}
</style>
