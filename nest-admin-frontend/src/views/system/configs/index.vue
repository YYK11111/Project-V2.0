<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from 'vue'
import { getList, save, testFeishuNotify } from './api'
import { checkPermi } from '@/utils/permission'
import { useAppStore } from '@/stores/app'
import UserSelect from '@/components/UserSelect.vue'

const activeTab = ref('basic')
const appStore = useAppStore()
const testUserId = ref('')
const fieldGroups = [
  { code: 'projectBasic', label: '基础组', desc: '项目名称、类型、优先级、负责人、发起人、描述等基础字段' },
  { code: 'projectMember', label: '成员组', desc: '项目成员集合权限，控制成员表格的显示与编辑' },
  { code: 'projectPlan', label: '计划组', desc: '起止时间、基线计划、里程碑、计划时间等字段' },
  { code: 'projectBusiness', label: '经营组', desc: '客户、预算、币种、业务线、行业、来源等经营字段' },
  { code: 'projectClosure', label: '结项组', desc: '验收日期、验收说明、交付清单、遗留问题、项目复盘' },
  { code: 'projectKnowledge', label: '知识组', desc: '控制知识页签和知识动作入口，不对应项目实体普通字段' },
]
const matrixRows = [
  { roleKey: 'projectManager', roleLabel: '项目经理' },
  { roleKey: 'deliveryManager', roleLabel: '交付经理' },
  { roleKey: 'ownerRole', roleLabel: '负责人类角色' },
  { roleKey: 'member', roleLabel: '普通成员' },
  { roleKey: 'visitor', roleLabel: '访客' },
]
const form = ref<any>({
  systemName: '',
  browserTitle: '',
  systemVersion: '',
  sessionExpireMinutes: '',
  defaultUserPassword: '',
  systemLogo: '',
  browserIcon: '',
  projectReminderStrategy: getDefaultReminderStrategy(),
  projectFieldPermissionMatrix: getDefaultProjectFieldPermissionMatrix(),
  externalNotifyConfig: getDefaultExternalNotifyConfig(),
})
const rules = {}
const canConfigUpdate = computed(() => checkPermi(['system/configs/update']))
const isConfigReadonly = computed(() => !canConfigUpdate.value)

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

function getDefaultProjectFieldPermissionMatrix() {
  return {
    project: {
      projectManager: {
        projectBasic: 'editable',
        projectMember: 'editable',
        projectPlan: 'editable',
        projectBusiness: 'editable',
        projectClosure: 'editable',
        projectKnowledge: 'editable',
      },
      deliveryManager: {
        projectBasic: 'readonly',
        projectMember: 'editable',
        projectPlan: 'editable',
        projectBusiness: 'readonly',
        projectClosure: 'editable',
        projectKnowledge: 'editable',
      },
      ownerRole: {
        projectBasic: 'readonly',
        projectMember: 'readonly',
        projectPlan: 'readonly',
        projectBusiness: 'hidden',
        projectClosure: 'readonly',
        projectKnowledge: 'editable',
      },
      member: {
        projectBasic: 'readonly',
        projectMember: 'readonly',
        projectPlan: 'readonly',
        projectBusiness: 'hidden',
        projectClosure: 'hidden',
        projectKnowledge: 'readonly',
      },
      visitor: {
        projectBasic: 'readonly',
        projectMember: 'hidden',
        projectPlan: 'hidden',
        projectBusiness: 'hidden',
        projectClosure: 'hidden',
        projectKnowledge: 'readonly',
      },
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

function mergeProjectFieldPermissionMatrix(matrix) {
  const defaults = getDefaultProjectFieldPermissionMatrix()
  return {
    ...defaults,
    ...(matrix || {}),
    project: {
      ...defaults.project,
      ...(matrix?.project || {}),
      projectManager: {
        ...defaults.project.projectManager,
        ...(matrix?.project?.projectManager || {}),
      },
      deliveryManager: {
        ...defaults.project.deliveryManager,
        ...(matrix?.project?.deliveryManager || {}),
      },
      ownerRole: {
        ...defaults.project.ownerRole,
        ...(matrix?.project?.ownerRole || {}),
      },
      member: {
        ...defaults.project.member,
        ...(matrix?.project?.member || {}),
      },
      visitor: {
        ...defaults.project.visitor,
        ...(matrix?.project?.visitor || {}),
      },
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
    },
    dingtalk: {
      ...defaults.dingtalk,
      ...(config?.dingtalk || {}),
    },
  }
}

function getListFun() {
  getList().then((res) => {
    const data = res?.list?.[0] || {}
    form.value = {
      ...(data || {}),
      projectReminderStrategy: mergeReminderStrategy(data?.projectReminderStrategy),
      projectFieldPermissionMatrix: mergeProjectFieldPermissionMatrix(data?.projectFieldPermissionMatrix),
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
    projectFieldPermissionMatrix: mergeProjectFieldPermissionMatrix(form.value?.projectFieldPermissionMatrix),
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
              <div class="external-notify-test-row">
                <div class="external-notify-test-row__field">
                  <div class="external-notify-test-row__label">测试用户</div>
                  <UserSelect v-model="testUserId" placeholder="默认当前登录用户，可选其他用户" clearable :disabled="isConfigReadonly" />
                </div>
                <el-button v-if="canConfigUpdate" @click="testFeishu">发送测试消息</el-button>
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

      <el-tab-pane label="字段组权限" name="fieldPermission">
        <div class="field-permission-page">
          <el-card shadow="hover" class="field-permission-card">
            <template #header>适用范围</template>
            <div class="field-permission-scope-row">
              <el-form-item label="业务对象" label-width="90px">
                <el-select model-value="project" disabled style="width: 220px">
                  <el-option label="项目" value="project" />
                </el-select>
              </el-form-item>
            </div>
            <div class="field-permission-tip">第一版仅支持项目对象。配置结果将用于项目表单、详情页、审批页的显示与编辑态控制；创建态字段仍以页面内建规则为主，后端状态冻结规则优先生效。</div>
          </el-card>

          <el-card shadow="hover" class="field-permission-card mt16">
            <template #header>权限矩阵</template>
            <el-table :data="matrixRows" border class="field-permission-matrix">
              <el-table-column prop="roleLabel" label="项目角色" width="150" fixed="left" />
              <el-table-column v-for="group in fieldGroups" :key="group.code" :label="group.label" min-width="160">
                <template #default="{ row }">
                  <el-select v-model="form.projectFieldPermissionMatrix.project[row.roleKey][group.code]" style="width: 100%" :disabled="isConfigReadonly">
                    <el-option label="不可见" value="hidden" />
                    <el-option label="只读" value="readonly" />
                    <el-option label="可编辑" value="editable" />
                  </el-select>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card shadow="hover" class="field-permission-card mt16">
            <template #header>规则说明</template>
            <div class="field-permission-rule-list">
              <div>1. 成员组用于控制成员集合的显示与编辑，不再混入基础组。</div>
              <div>2. 计划组覆盖起止时间、基线计划与里程碑；项目立项后会进入只读冻结。</div>
              <div>3. 审批中或已立项项目会额外收紧基础组、计划组、经营组和成员组为只读。</div>
              <div>4. 已结项或已归档项目默认按只读处理。</div>
              <div>5. 知识组只控制知识页签和知识动作入口，仍需叠加知识权限体系。</div>
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

.field-permission-page {
  max-width: 1100px;
}

.field-permission-card {
  border-radius: 14px;
}

.field-permission-scope-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.field-permission-tip {
  color: var(--el-text-color-regular);
  margin-top: 8px;
  line-height: 1.8;
}

.field-permission-rule-list {
  display: grid;
  gap: 10px;
  color: var(--el-text-color-regular);
  line-height: 1.8;
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
