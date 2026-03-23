<script setup lang="ts">
import { useWidget, WidgetConfigOption, WidgetEditDialog } from '@widget-js/vue3'
import { nextTick, ref } from 'vue'
import ScheduleManualEntryForm from './components/ScheduleManualEntryForm.vue'
import { useScheduleImportExport } from './composables/useScheduleImportExport'
import { ensureSystemNotificationPermission } from './composables/useScheduleNotifications'
import { useScheduleStore } from './composables/useScheduleStore'
import { dayjs } from './model/date'
import type { ScheduleEventRecord, ScheduleWidgetSettings } from './model/types'

const { widgetParams, save } = useWidget()
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

async function handleNotificationSettingChange(key: 'notifyOnAlarm' | 'notifyOnStart' | 'notifyOnEnd') {
  const value = settings.value[key]
  updateSettings({
    [key]: value,
  } as Partial<ScheduleWidgetSettings>)

  if (!value) {
    return
  }

  const permission = await ensureSystemNotificationPermission()
  if (permission === 'denied') {
    importError.value = '系统通知权限已被拒绝，当前只能尝试走 Widget.js 应用内提醒。'
  }
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
        <section class="config-section">
          <h2>主题设置</h2>
          <div class="sub-section">
            <h3>组件设置</h3>
            <div class="row two">
              <label>
                <span>默认视图</span>
                <el-radio-group
                  v-model="settings.defaultView"
                  @change="updateSettings({ defaultView: settings.defaultView })"
                >
                  <el-radio-button value="list">
                    列表
                  </el-radio-button>
                  <el-radio-button value="week">
                    周视图
                  </el-radio-button>
                </el-radio-group>
              </label>
              <label>
                <span>周视图范围</span>
                <el-radio-group
                  v-model="settings.weekWindowMode"
                  @change="updateSettings({ weekWindowMode: settings.weekWindowMode })"
                >
                  <el-radio-button value="3events">
                    3 个日程
                  </el-radio-button>
                  <el-radio-button value="3h">
                    3 小时
                  </el-radio-button>
                </el-radio-group>
              </label>
            </div>
            <div class="row two">
              <label>
                <span>列表背景</span>
                <el-radio-group
                  v-model="settings.listBackgroundMode"
                  @change="updateSettings({ listBackgroundMode: settings.listBackgroundMode })"
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
              </label>
              <label class="switch">
                <span>显示时间线</span>
                <el-switch
                  v-model="settings.showTimeline"
                  @change="updateSettings({ showTimeline: settings.showTimeline })"
                />
              </label>
            </div>
          </div>
          <div class="sub-section">
            <h3>颜色设置</h3>
            <div class="row three">
              <label>
                <span>卡片颜色</span>
                <el-color-picker
                  v-model="settings.cardColor"
                  @change="updateSettings({ cardColor: settings.cardColor })"
                />
              </label>
              <label>
                <span>文字颜色</span>
                <el-color-picker
                  v-model="settings.textColor"
                  @change="updateSettings({ textColor: settings.textColor })"
                />
              </label>
              <label>
                <span>进度颜色</span>
                <el-color-picker
                  v-model="settings.progressColor"
                  @change="updateSettings({ progressColor: settings.progressColor })"
                />
              </label>
            </div>
            <div class="row two">
              <label>
                <span>进行中高亮</span>
                <el-color-picker
                  v-model="settings.ongoingColor"
                  @change="updateSettings({ ongoingColor: settings.ongoingColor })"
                />
              </label>
              <label>
                <span>即将开始高亮</span>
                <el-color-picker
                  v-model="settings.upcomingColor"
                  @change="updateSettings({ upcomingColor: settings.upcomingColor })"
                />
              </label>
            </div>
          </div>
        </section>

        <section class="config-section">
          <h2>日程设置</h2>
          <div class="sub-section">
            <h3>通知设置</h3>
            <div class="row three">
              <label class="switch">
                <span>提醒通知</span>
                <el-switch
                  v-model="settings.notifyOnAlarm"
                  @change="handleNotificationSettingChange('notifyOnAlarm')"
                />
              </label>
              <label class="switch">
                <span>开始通知</span>
                <el-switch
                  v-model="settings.notifyOnStart"
                  @change="handleNotificationSettingChange('notifyOnStart')"
                />
              </label>
              <label class="switch">
                <span>结束通知</span>
                <el-switch
                  v-model="settings.notifyOnEnd"
                  @change="handleNotificationSettingChange('notifyOnEnd')"
                />
              </label>
            </div>
          </div>

          <div ref="editSectionRef" class="sub-section">
            <h3>手动添加与编辑</h3>
            <ScheduleManualEntryForm
              :default-color="settings.cardColor"
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
                <div>
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
        </section>
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

.config-section {
  display: grid;
  gap: 0.9rem;
  padding: 0.4rem 0 1rem;
}

.config-section + .config-section {
  border-top: 1px solid #e6e2d7;
}

.config-section h3 {
  margin: 0;
  font-size: 1rem;
  color: #243744;
}

.config-section h2 {
  margin: 0;
  font-size: 1.06rem;
  color: #243744;
}

.sub-section {
  display: grid;
  gap: 0.9rem;
}

.sub-section + .sub-section {
  padding-top: 0.9rem;
  border-top: 1px solid #ebe6dc;
}

.row {
  display: grid;
  gap: 0.9rem;
}

.row.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.row.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 0.38rem;
}

label span {
  font-size: 0.82rem;
  color: #405160;
}

.switch {
  align-content: end;
}

.import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
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
  gap: 0.8rem;
  align-items: center;
}

.saved-list {
  display: grid;
  gap: 0.6rem;
  max-height: 16rem;
  overflow: auto;
}

.saved-item {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  padding: 0.72rem 0.82rem;
  border-radius: 0.9rem;
  background: #f7f3ea;
}

:deep(.el-dialog__body) {
  overflow: hidden;
}

.saved-item div {
  display: grid;
  gap: 0.2rem;
}

.saved-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.saved-item strong {
  color: #243744;
}

.saved-item span {
  font-size: 0.78rem;
  color: #6c7b84;
}

@media (max-width: 760px) {
  .row.two,
  .row.three {
    grid-template-columns: 1fr;
  }

  .section-head,
  .saved-item {
    flex-direction: column;
    align-items: stretch;
  }

  .saved-actions {
    justify-content: flex-end;
  }
}
</style>
