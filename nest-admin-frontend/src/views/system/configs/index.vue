<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from 'vue'
import { getList, save } from './api'
import { checkPermi } from '@/utils/permission'

const activeTab = ref('basic')
const fieldGroups = [
  { code: 'projectBasic', label: '基础组' },
  { code: 'projectMember', label: '成员组' },
  { code: 'projectPlan', label: '计划组' },
  { code: 'projectBusiness', label: '经营组' },
  { code: 'projectClosure', label: '结项组' },
  { code: 'projectKnowledge', label: '知识组' },
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
  sessionExpireMinutes: '',
  systemLogo: '',
  browserIcon: '',
  projectReminderStrategy: getDefaultReminderStrategy(),
  projectFieldPermissionMatrix: getDefaultProjectFieldPermissionMatrix(),
})
const rules = {}
const canConfigUpdate = computed(() => checkPermi(['system/configs/update']))

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

function getListFun() {
  getList().then((res) => {
    const data = res?.list?.[0] || {}
    form.value = {
      ...(data || {}),
      projectReminderStrategy: mergeReminderStrategy(data?.projectReminderStrategy),
      projectFieldPermissionMatrix: mergeProjectFieldPermissionMatrix(data?.projectFieldPermissionMatrix),
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
  }).then(() => {
    $sdk.msgSuccess()
    getListFun()
  })
}
</script>

<template>
  <div class="Gcard system-config-page">
    <div class="GcardTitle">系统配置</div>

    <el-tabs v-model="activeTab" class="system-config-tabs">
      <el-tab-pane label="基础配置" name="basic">
        <el-form ref="formRef" label-position="right" :model="form" :rules="rules" label-width="100px" class="system-config-form">
          <BaInput v-model="form.systemName" label="系统名称" prop="systemName"></BaInput>
          <BaInput v-model="form.browserTitle" label="标签页名称" prop="browserTitle"></BaInput>
          <BaInput v-model="form.sessionExpireMinutes" label="有效时间" prop="sessionExpireMinutes" type="number">
            <template #append>分钟</template>
          </BaInput>

          <el-form-item label="系统logo" prop="systemLogo">
            <upload v-model:fileUrl="form.systemLogo" type="image"></upload>
            <div class="Gtip">仅支持大小 2M 以内，png/jpg/svg 等图片类型</div>
          </el-form-item>

          <el-form-item label="标签页图标" prop="browserIcon">
            <upload v-model:fileUrl="form.browserIcon" type="image"></upload>
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
                <el-switch v-model="form.projectReminderStrategy.enabled" />
              </div>

              <div class="reminder-switch-item">
                <div>
                  <div class="reminder-switch-item__title">启用消息中心渠道</div>
                  <div class="reminder-switch-item__desc">开启后，项目异常提醒会同步到消息中心，作为待阅消息触达对应角色。</div>
                </div>
                <el-switch v-model="form.projectReminderStrategy.delivery.messageCenter" />
              </div>
            </div>
          </el-card>

          <el-card shadow="hover" class="reminder-card mt16">
            <template #header>接收角色</template>
            <div class="reminder-grid reminder-grid--roles">
              <el-checkbox v-model="form.projectReminderStrategy.roles.projectManager">项目经理</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.roles.deliveryManager">交付经理</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.roles.coreMember">核心成员</el-checkbox>
            </div>
          </el-card>

          <el-card shadow="hover" class="reminder-card mt16">
            <template #header>频率与规则</template>
            <div class="reminder-frequency-row">
              <el-form-item label="提醒频率" label-width="90px">
                <el-radio-group v-model="form.projectReminderStrategy.frequency.mode">
                  <el-radio label="realtime">实时同步</el-radio>
                  <el-radio label="interval">间隔提醒</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="form.projectReminderStrategy.frequency.mode === 'interval'" label="间隔时长" label-width="90px">
                <el-input-number v-model="form.projectReminderStrategy.frequency.hours" :min="1" :max="168" />
                <span class="reminder-inline-tip">小时</span>
              </el-form-item>
            </div>

            <div class="reminder-rule-grid">
              <el-checkbox v-model="form.projectReminderStrategy.rules.taskOverdue">任务已逾期</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.taskDueSoon">临近到期任务</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.milestoneDelayed">里程碑延期/超期</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.sprintDelayed">Sprint 节奏偏慢</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.highRisk">高风险事项未关闭</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.changePending">变更待审批</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.unplannedTask">任务未纳入执行计划</el-checkbox>
              <el-checkbox v-model="form.projectReminderStrategy.rules.closureIncomplete">结项资料待完善</el-checkbox>
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
                <el-switch v-model="form.projectReminderStrategy.trendThresholds.enabled" />
              </div>
            </div>
            <div class="reminder-rule-grid mt16">
              <el-form-item label="观察窗口">
                <el-input-number v-model="form.projectReminderStrategy.trendThresholds.windowSize" :min="3" :max="7" />
                <span class="reminder-inline-tip">连续快照周期数</span>
              </el-form-item>
              <el-form-item label="健康度下滑阈值">
                <el-input-number v-model="form.projectReminderStrategy.trendThresholds.healthDeclineStep" :min="1" :max="30" />
                <span class="reminder-inline-tip">每周期最低下降分值</span>
              </el-form-item>
              <el-form-item label="风险上升阈值">
                <el-input-number v-model="form.projectReminderStrategy.trendThresholds.riskIncreaseStep" :min="1" :max="10" />
                <span class="reminder-inline-tip">每周期最低增加数量</span>
              </el-form-item>
              <el-form-item label="成本恶化阈值">
                <el-input-number v-model="form.projectReminderStrategy.trendThresholds.costVarianceIncreaseStep" :min="0" :step="1000" />
                <span class="reminder-inline-tip">每周期最低增加金额</span>
              </el-form-item>
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
            <div class="field-permission-tip">第一版仅支持项目对象。配置结果将用于项目表单、详情页、审批页的显示与编辑态控制。</div>
          </el-card>

          <el-card shadow="hover" class="field-permission-card mt16">
            <template #header>权限矩阵</template>
            <el-table :data="matrixRows" border class="field-permission-matrix">
              <el-table-column prop="roleLabel" label="项目角色" width="150" fixed="left" />
              <el-table-column v-for="group in fieldGroups" :key="group.code" :label="group.label" min-width="160">
                <template #default="{ row }">
                  <el-select v-model="form.projectFieldPermissionMatrix.project[row.roleKey][group.code]" style="width: 100%">
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
              <div>1. 审批中项目会额外收紧基础组、经营组、结项组为只读。</div>
              <div>2. 已结项或已归档项目默认按只读处理。</div>
              <div>3. 知识组仍需叠加知识权限体系，不建议在第一版做单字段例外配置。</div>
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
