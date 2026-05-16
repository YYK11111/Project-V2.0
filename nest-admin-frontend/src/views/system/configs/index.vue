<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { diagnoseFeishuNotify, getList, save, testFeishuNotify } from './api'
import { checkPermi } from '@/utils/permission'
import { useAppStore } from '@/stores/app'
import UserSelect from '@/components/UserSelect.vue'

const activeTab = ref('basic')
const appStore = useAppStore()
const testUserId = ref('')
const diagnoseLoading = ref(false)
const diagnoseResult = ref<any>(null)
const form = ref<any>({
  systemName: '',
  browserTitle: '',
  systemVersion: '',
  sessionExpireMinutes: '',
  defaultUserPassword: '',
  systemLogo: '',
  browserIcon: '',
  projectReminderStrategy: getDefaultReminderStrategy(),
  externalNotifyConfig: getDefaultExternalNotifyConfig(),
})
const rules = {}
const canConfigUpdate = computed(() => checkPermi(['system/configs/update']))
const isConfigReadonly = computed(() => !canConfigUpdate.value)
const externalNotifyScenes = [
  {
    key: 'workflow.approval.todo',
    label: '流程审批待办',
    category: '工作流',
    messageTypeLabel: '待办',
    supported: true,
    templateStatus: '已支持',
    description: '审批节点、加签等工作流任务生成的待办消息。',
  },
  {
    key: 'workflow.instance.cc',
    label: '流程待阅通知',
    category: '工作流',
    messageTypeLabel: '待阅',
    supported: true,
    templateStatus: '已支持',
    description: '流程抄送节点、通知节点和退回发起人消息。',
  },
  {
    key: 'project.alert',
    label: '项目提醒',
    category: '项目',
    messageTypeLabel: '待阅',
    supported: true,
    templateStatus: '已支持',
    description: '项目驾驶舱异常提醒同步到消息中心。',
  },
  {
    key: 'task.assignment',
    label: '任务指派',
    category: '任务',
    messageTypeLabel: '待办',
    supported: true,
    templateStatus: '已支持',
    description: '任务创建或分配后发送给负责人和执行人的待办。',
  },
  {
    key: 'task.status',
    label: '任务状态通知',
    category: '任务',
    messageTypeLabel: '待办/待阅',
    supported: true,
    templateStatus: '已支持',
    description: '任务开始、延期、完成通过和完成驳回等状态变化通知。',
  },
  {
    key: 'task.reminder.dueSoon',
    label: '任务即将到期',
    category: '任务',
    messageTypeLabel: '待阅',
    supported: true,
    templateStatus: '已支持',
    description: '定时扫描生成的任务临期提醒。',
  },
  {
    key: 'task.reminder.overdue',
    label: '任务已逾期',
    category: '任务',
    messageTypeLabel: '待办',
    supported: true,
    templateStatus: '已支持',
    description: '定时扫描生成的任务逾期处理提醒。',
  },
  {
    key: 'task.reminder.reportStale',
    label: '任务汇报提醒',
    category: '任务',
    messageTypeLabel: '待办',
    supported: true,
    templateStatus: '已支持',
    description: '定时扫描生成的长时间未汇报提醒。',
  },
]

function getDefaultReminderStrategy() {
  return {
    enabled: true,
    delivery: {
      messageCenter: true,
    },
    roles: {
      projectManager: true,
      deliveryManager: true,
      coreMember: false,
    },
      frequency: {
        mode: 'interval',
        hours: 24,
      },
      trendThresholds: {
        enabled: true,
        windowSize: 3,
        healthDeclineStep: 5,
        riskIncreaseStep: 1,
        costVarianceIncreaseStep: 1000,
      },
      rules: {
        taskOverdue: true,
        taskDueSoon: true,
      milestoneDelayed: true,
      sprintDelayed: true,
      highRisk: true,
      changePending: true,
      unplannedTask: true,
      closureIncomplete: true,
    },
  }
}

function getDefaultExternalNotifyConfig() {
  return {
    enabled: false,
    siteUrl: '',
    feishu: {
      enabled: false,
      appId: '',
      appSecret: '',
      baseUrl: 'https://open.feishu.cn',
      enabledScenes: ['workflow.approval.todo'],
    },
    dingtalk: {
      enabled: false,
      appKey: '',
      appSecret: '',
      baseUrl: 'https://oapi.dingtalk.com',
    },
  }
}

function mergeReminderStrategy(strategy) {
  const defaults = getDefaultReminderStrategy()
  return {
    ...defaults,
    ...(strategy || {}),
    delivery: {
      ...defaults.delivery,
      ...(strategy?.delivery || {}),
    },
    roles: {
      ...defaults.roles,
      ...(strategy?.roles || {}),
    },
    frequency: {
      ...defaults.frequency,
      ...(strategy?.frequency || {}),
    },
    trendThresholds: {
      ...defaults.trendThresholds,
      ...(strategy?.trendThresholds || {}),
    },
    rules: {
      ...defaults.rules,
      ...(strategy?.rules || {}),
    },
  }
}

function mergeExternalNotifyConfig(config) {
  const defaults = getDefaultExternalNotifyConfig()
  return {
    ...defaults,
    ...(config || {}),
    feishu: {
      ...defaults.feishu,
      ...(config?.feishu || {}),
      enabledScenes: Array.isArray(config?.feishu?.enabledScenes)
        ? config.feishu.enabledScenes
        : defaults.feishu.enabledScenes,
    },
    dingtalk: {
      ...defaults.dingtalk,
      ...(config?.dingtalk || {}),
    },
  }
}

function isFeishuSceneEnabled(sceneKey) {
  return form.value.externalNotifyConfig.feishu.enabledScenes.includes(sceneKey)
}

function toggleFeishuScene(sceneKey, checked) {
  const scenes = form.value.externalNotifyConfig.feishu.enabledScenes
  if (checked && !scenes.includes(sceneKey)) {
    scenes.push(sceneKey)
  }
  if (!checked) {
    form.value.externalNotifyConfig.feishu.enabledScenes = scenes.filter((item) => item !== sceneKey)
  }
}

function getListFun() {
  getList().then((res) => {
    const data = res?.list?.[0] || {}
    form.value = {
      ...(data || {}),
      projectReminderStrategy: mergeReminderStrategy(data?.projectReminderStrategy),
      externalNotifyConfig: mergeExternalNotifyConfig(data?.externalNotifyConfig),
    }
  })
}

getListFun()

function submit() {
  if (!canConfigUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  save({
    ...form.value,
    projectReminderStrategy: mergeReminderStrategy(form.value?.projectReminderStrategy),
    externalNotifyConfig: mergeExternalNotifyConfig(form.value?.externalNotifyConfig),
  }).then(() => {
    $sdk.msgSuccess()
    appStore.sysConfig = null
    appStore.getConfig()
    getListFun()
  })
}

function testFeishu() {
  if (!canConfigUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  testFeishuNotify({
    userId: testUserId.value || undefined,
  }).then(() => {
    $sdk.msgSuccess('测试消息已发送')
  })
}

function diagnoseFeishu() {
  if (!canConfigUpdate.value) return $sdk.msgWarning('当前操作没有权限')
  diagnoseLoading.value = true
  diagnoseFeishuNotify({
    userId: testUserId.value || undefined,
  })
    .then((res) => {
      diagnoseResult.value = res?.data || res
      if (diagnoseResult.value?.success) {
        $sdk.msgSuccess('飞书配置自检通过')
      } else {
        $sdk.msgWarning('飞书配置自检未通过，请查看结果')
      }
    })
    .finally(() => {
      diagnoseLoading.value = false
    })
}

async function copyDiagnoseValue(value) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(String(value))
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败，请手动复制')
  }
}

function formatDiagnoseData(data) {
  return Object.entries(data || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => ({ key, value: String(value) }))
}
</script>

<template>
  <div class="Gcard system-config-page">
    <div class="GcardTitle">系统配置</div>

    <el-tabs v-model="activeTab" class="system-config-tabs">
      <el-tab-pane label="基础配置" name="basic">
        <el-form ref="formRef" label-position="right" :model="form" :rules="rules" label-width="100px" class="system-config-form" :disabled="isConfigReadonly">
          <BaInput v-model="form.systemName" label="系统名称" prop="systemName" :disabled="isConfigReadonly"></BaInput>
          <BaInput v-model="form.browserTitle" label="标签页名称" prop="browserTitle" :disabled="isConfigReadonly"></BaInput>
          <BaInput v-model="form.systemVersion" label="系统版本" prop="systemVersion" :disabled="isConfigReadonly"></BaInput>
          <BaInput v-model="form.defaultUserPassword" label="默认用户密码" prop="defaultUserPassword" maxlength="30" :disabled="isConfigReadonly"></BaInput>
          <BaInput v-model="form.sessionExpireMinutes" label="有效时间" prop="sessionExpireMinutes" type="number" :disabled="isConfigReadonly">
            <template #append>分钟</template>
          </BaInput>

          <el-form-item label="系统logo" prop="systemLogo">
            <upload v-model:fileUrl="form.systemLogo" type="image" :disabled="isConfigReadonly"></upload>
            <div class="Gtip">仅支持大小 2M 以内，png/jpg/svg 等图片类型</div>
          </el-form-item>

          <el-form-item label="标签页图标" prop="browserIcon">
            <upload v-model:fileUrl="form.browserIcon" type="image" :disabled="isConfigReadonly"></upload>
            <div class="Gtip">建议使用正方形图标，支持 png/jpg/svg/ico</div>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="提醒策略" name="reminder">
        <div class="reminder-page">
          <el-card shadow="hover" class="reminder-card">
            <template #header>基础开关</template>
            <div class="reminder-grid">
              <div class="reminder-switch-item">
                <div>
                  <div class="reminder-switch-item__title">启用项目提醒</div>
                  <div class="reminder-switch-item__desc">关闭后，项目提醒既不会显示在消息中心，也不会继续同步更新。</div>
                </div>
                <el-switch v-model="form.projectReminderStrategy.enabled" :disabled="isConfigReadonly" />
              </div>

              <div class="reminder-switch-item">
                <div>
                  <div class="reminder-switch-item__title">启用消息中心渠道</div>
                  <div class="reminder-switch-item__desc">开启后，项目异常提醒会同步到消息中心，作为待阅消息触达对应角色。</div>
                </div>
                <el-switch v-model="form.projectReminderStrategy.delivery.messageCenter" :disabled="isConfigReadonly" />
              </div>
            </div>
          </el-card>

          <el-card shadow="hover" class="reminder-card mt16">
            <template #header>接收角色</template>
            <div class="reminder-grid reminder-grid--roles">
              <el-checkbox v-model="form.projectReminderStrategy.roles.projectManager" :disabled="isConfigReadonly">项目经理</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.roles.deliveryManager" :disabled="isConfigReadonly">交付经理</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.roles.coreMember" :disabled="isConfigReadonly">核心成员</el-checkbox>
            </div>
          </el-card>

          <el-card shadow="hover" class="reminder-card mt16">
            <template #header>频率与规则</template>
            <div class="reminder-frequency-row">
              <el-form-item label="提醒频率" label-width="90px">
                <el-radio-group v-model="form.projectReminderStrategy.frequency.mode" :disabled="isConfigReadonly">
                  <el-radio label="realtime">实时同步</el-radio>
                  <el-radio label="interval">间隔提醒</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="form.projectReminderStrategy.frequency.mode === 'interval'" label="间隔时长" label-width="90px">
                <el-input-number v-model="form.projectReminderStrategy.frequency.hours" :min="1" :max="168" :disabled="isConfigReadonly || form.projectReminderStrategy.frequency.mode !== 'interval'" />
                <span class="reminder-inline-tip">小时</span>
              </el-form-item>
            </div>

            <div class="reminder-rule-grid">
              <el-checkbox v-model="form.projectReminderStrategy.rules.taskOverdue" :disabled="isConfigReadonly">任务已逾期</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.taskDueSoon" :disabled="isConfigReadonly">临近到期任务</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.milestoneDelayed" :disabled="isConfigReadonly">里程碑延期/超期</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.sprintDelayed" :disabled="isConfigReadonly">Sprint 节奏偏慢</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.highRisk" :disabled="isConfigReadonly">高风险事项未关闭</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.changePending" :disabled="isConfigReadonly">变更待审批</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.unplannedTask" :disabled="isConfigReadonly">任务未纳入执行计划</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.closureIncomplete" :disabled="isConfigReadonly">结项资料待完善</el-checkbox>
            </div>
          </el-card>

          <el-card shadow="hover" class="reminder-card mt16">
            <template #header>趋势阈值</template>
            <div class="reminder-grid">
              <div class="reminder-switch-item">
                <div>
                  <div class="reminder-switch-item__title">启用趋势异常识别</div>
                  <div class="reminder-switch-item__desc">基于驾驶舱历史快照识别连续下滑、持续上升等趋势异常，并进入统一提醒与消息中心。</div>
                </div>
                <el-switch v-model="form.projectReminderStrategy.trendThresholds.enabled" :disabled="isConfigReadonly" />
              </div>
            </div>
            <div class="reminder-rule-grid mt16">
              <el-form-item label="观察窗口">
                <el-input-number v-model="form.projectReminderStrategy.trendThresholds.windowSize" :min="3" :max="7" :disabled="isConfigReadonly" />
                <span class="reminder-inline-tip">连续快照周期数</span>
              </el-form-item>
              <el-form-item label="健康度下滑阈值">
                <el-input-number v-model="form.projectReminderStrategy.trendThresholds.healthDeclineStep" :min="1" :max="30" :disabled="isConfigReadonly" />
                <span class="reminder-inline-tip">每周期最低下降分值</span>
              </el-form-item>
              <el-form-item label="风险上升阈值">
                <el-input-number v-model="form.projectReminderStrategy.trendThresholds.riskIncreaseStep" :min="1" :max="10" :disabled="isConfigReadonly" />
                <span class="reminder-inline-tip">每周期最低增加数量</span>
              </el-form-item>
              <el-form-item label="成本恶化阈值">
                <el-input-number v-model="form.projectReminderStrategy.trendThresholds.costVarianceIncreaseStep" :min="0" :step="1000" :disabled="isConfigReadonly" />
                <span class="reminder-inline-tip">每周期最低增加金额</span>
              </el-form-item>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="外部通知" name="externalNotify">
        <div class="reminder-page">
          <el-card shadow="hover" class="reminder-card">
            <template #header>总开关</template>
            <div class="reminder-switch-item">
              <div>
                <div class="reminder-switch-item__title">启用外部通知</div>
                <div class="reminder-switch-item__desc">关闭后，工作流待办不会同步发送到飞书或钉钉。</div>
              </div>
              <el-switch v-model="form.externalNotifyConfig.enabled" :disabled="isConfigReadonly" />
            </div>
            <BaInput
              v-model="form.externalNotifyConfig.siteUrl"
              class="mt16"
              label="系统访问地址"
              prop="externalNotifyConfig.siteUrl"
              :disabled="isConfigReadonly"
              placeholder="例如：https://admin.example.com" />
          </el-card>

          <el-card shadow="hover" class="reminder-card mt16">
            <template #header>飞书配置</template>
            <div class="reminder-grid">
              <div class="reminder-switch-item">
                <div>
                  <div class="reminder-switch-item__title">启用飞书通知</div>
                  <div class="reminder-switch-item__desc">启用后，工作流待办会发送到飞书用户。</div>
                </div>
                <el-switch v-model="form.externalNotifyConfig.feishu.enabled" :disabled="isConfigReadonly" />
              </div>

              <BaInput v-model="form.externalNotifyConfig.feishu.appId" label="AppId" prop="externalNotifyConfig.feishu.appId" :disabled="isConfigReadonly" />
              <BaInput v-model="form.externalNotifyConfig.feishu.appSecret" label="AppSecret" prop="externalNotifyConfig.feishu.appSecret" :disabled="isConfigReadonly" />
              <BaInput v-model="form.externalNotifyConfig.feishu.baseUrl" label="BaseUrl" prop="externalNotifyConfig.feishu.baseUrl" :disabled="isConfigReadonly" />
              <div class="external-notify-scene-panel">
                <div class="external-notify-scene-panel__head">
                  <div>
                    <div class="external-notify-scene-panel__title">消息场景</div>
                    <div class="external-notify-scene-panel__desc">按业务场景控制哪些本站消息同步发送到飞书。</div>
                  </div>
                </div>
                <el-table :data="externalNotifyScenes" size="small" class="external-notify-scene-table">
                  <el-table-column label="飞书发送" width="92">
                    <template #default="{ row }">
                      <el-switch
                        :model-value="isFeishuSceneEnabled(row.key)"
                        :disabled="isConfigReadonly || !row.supported"
                        @change="(checked) => toggleFeishuScene(row.key, checked)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="场景名称" min-width="150">
                    <template #default="{ row }">
                      <div class="external-notify-scene-table__name">{{ row.label }}</div>
                      <div class="external-notify-scene-table__desc">{{ row.description }}</div>
                    </template>
                  </el-table-column>
                  <el-table-column label="分类" prop="category" width="90" />
                  <el-table-column label="本站类型" prop="messageTypeLabel" width="100" />
                  <el-table-column label="模板状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.supported ? 'success' : 'info'" size="small" effect="plain">{{ row.templateStatus }}</el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div class="external-notify-test-row">
                <div class="external-notify-test-row__field">
                  <div class="external-notify-test-row__label">测试用户</div>
                  <UserSelect v-model="testUserId" placeholder="默认当前登录用户，可选其他用户" clearable :disabled="isConfigReadonly" />
                </div>
              <div class="external-notify-test-row__actions">
                  <el-button v-if="canConfigUpdate" :loading="diagnoseLoading" @click="diagnoseFeishu">飞书审批集成自检</el-button>
                  <el-button v-if="canConfigUpdate" @click="testFeishu">发送测试消息</el-button>
                </div>
              </div>
              <div v-if="diagnoseResult" class="feishu-diagnose-result">
                <div class="feishu-diagnose-result__title">自检结果</div>
                <div class="feishu-diagnose-result__list">
                  <div v-for="step in diagnoseResult.steps || []" :key="step.key" class="feishu-diagnose-result__item">
                    <div class="feishu-diagnose-result__meta">
                      <el-tag :type="step.success ? 'success' : 'danger'" size="small" effect="plain">{{ step.success ? '通过' : '失败' }}</el-tag>
                      <span class="feishu-diagnose-result__label">{{ step.label }}</span>
                    </div>
                    <div class="feishu-diagnose-result__message">{{ step.message }}</div>
                    <div v-if="formatDiagnoseData(step.data).length" class="feishu-diagnose-result__data">
                      <div v-for="item in formatDiagnoseData(step.data)" :key="item.key" class="feishu-diagnose-result__data-item">
                        <span class="feishu-diagnose-result__data-key">{{ item.key }}</span>
                        <span class="feishu-diagnose-result__data-value">{{ item.value }}</span>
                      </div>
                      <div class="feishu-diagnose-result__actions">
                        <el-button
                          v-if="step.data?.callbackUrl"
                          text
                          type="primary"
                          @click="copyDiagnoseValue(step.data.callbackUrl)"
                        >
                          复制回调地址
                        </el-button>
                        <el-button
                          v-if="step.data?.loginUrl"
                          text
                          type="primary"
                          @click="copyDiagnoseValue(step.data.loginUrl)"
                        >
                          复制审批免登录链接
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <el-card shadow="hover" class="reminder-card mt16">
            <template #header>钉钉配置</template>
            <div class="reminder-switch-item">
              <div>
                <div class="reminder-switch-item__title">预留钉钉接入</div>
                <div class="reminder-switch-item__desc">后续接入钉钉时可直接复用这组配置字段。</div>
              </div>
              <el-switch v-model="form.externalNotifyConfig.dingtalk.enabled" disabled />
            </div>
          </el-card>
        </div>
      </el-tab-pane>

    </el-tabs>

    <div class="system-config-page__footer">
      <el-button v-if="canConfigUpdate" type="primary" @click="submit()">保存</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.system-config-page {
  padding: 20px;
}

.system-config-tabs {
  margin-top: 12px;
}

.system-config-form {
  max-width: 760px;
}

.reminder-page {
  max-width: 960px;
}

.reminder-card {
  border-radius: 14px;
}

.reminder-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.reminder-grid--roles {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.reminder-switch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
}

.reminder-switch-item__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.reminder-switch-item__desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.reminder-frequency-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
}

.reminder-inline-tip {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.reminder-rule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
  margin-top: 16px;
}

.external-notify-test-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.external-notify-test-row__field {
  flex: 1 1 320px;
  min-width: 260px;
}

.external-notify-test-row__label {
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.external-notify-test-row__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.external-notify-scene-panel {
  grid-column: 1 / -1;
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--el-fill-color-extra-light);
}

.external-notify-scene-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.external-notify-scene-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.external-notify-scene-panel__desc {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.external-notify-scene-table {
  width: 100%;
}

.external-notify-scene-table__name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.external-notify-scene-table__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.feishu-diagnose-result {
  grid-column: 1 / -1;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.feishu-diagnose-result__title {
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.feishu-diagnose-result__list {
  display: grid;
  gap: 8px;
}

.feishu-diagnose-result__item {
  display: grid;
  gap: 4px;
}

.feishu-diagnose-result__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feishu-diagnose-result__label {
  font-weight: 600;
}

.feishu-diagnose-result__message {
  color: var(--el-text-color-regular);
}

.feishu-diagnose-result__data {
  display: grid;
  gap: 4px;
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-bg-color);
}

.feishu-diagnose-result__data-item {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 8px;
  font-size: 12px;
}

.feishu-diagnose-result__data-key {
  color: var(--el-text-color-secondary);
}

.feishu-diagnose-result__data-value {
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
}

.system-config-page__footer {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .reminder-grid,
  .reminder-grid--roles,
  .reminder-rule-grid {
    grid-template-columns: 1fr;
  }

  .reminder-switch-item {
    align-items: flex-start;
  }
}
</style>
