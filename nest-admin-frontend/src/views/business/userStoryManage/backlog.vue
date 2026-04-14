<script setup>
import { ref, onMounted } from 'vue'
import { getBacklog, assignToSprint, removeFromSprint, getStatus } from './api'
import { getList as getProjectList } from '@/views/business/projectManage/api'
import { getList as getSprintList } from '@/views/business/sprintManage/api'

const loading = ref(false)
const projectList = ref([])
const sprintList = ref([])
const backlogByProject = ref({})
const selectedProjectIds = ref([])
const statusMap = ref({})
const expandedProjects = ref([])

onMounted(async () => {
  await loadProjects()
  await loadSprints()
  await loadStatus()
  await loadBacklog()
})

async function loadProjects() {
  const res = await getProjectList({ pageNum: 1, pageSize: 100 })
  projectList.value = res.list || []
}

async function loadSprints() {
  const res = await getSprintList({ pageNum: 1, pageSize: 100 })
  sprintList.value = res.list || []
}

async function loadStatus() {
  const res = await getStatus()
  statusMap.value = res.data || {}
}

async function loadBacklog() {
  loading.value = true
  try {
    const res = await getBacklog(selectedProjectIds.value)
    const stories = res.list || []
    
    backlogByProject.value = {}
    for (const story of stories) {
      const projectId = story.projectId
      if (!backlogByProject.value[projectId]) {
        backlogByProject.value[projectId] = []
      }
      backlogByProject.value[projectId].push(story)
    }
  } finally {
    loading.value = false
  }
}

async function handleProjectToggle(projectId) {
  const idx = expandedProjects.value.indexOf(projectId)
  if (idx === -1) {
    expandedProjects.value.push(projectId)
  } else {
    expandedProjects.value.splice(idx, 1)
  }
}

async function handleAssignToSprint(storyId, sprintId) {
  try {
    await assignToSprint(storyId, sprintId)
    $sdk.msgSuccess('分配成功')
    await loadBacklog()
  } catch (e) {
    $sdk.msgError(e.message || '分配失败')
  }
}

async function handleRemoveFromSprint(storyId) {
  try {
    await removeFromSprint(storyId)
    $sdk.msgSuccess('已从Sprint移除')
    await loadBacklog()
  } catch (e) {
    $sdk.msgError(e.message || '操作失败')
  }
}

function getProjectName(projectId) {
  const project = projectList.value.find(p => p.id === projectId)
  return project?.name || projectId
}

function getSprintName(sprintId) {
  const sprint = sprintList.value.find(s => s.id === sprintId)
  return sprint?.name || sprintId
}
</script>

<template>
  <div class="Gcard">
    <div class="page-header">
      <h2>产品待办列表（Backlog）</h2>
    </div>

    <el-alert type="info" :closable="false" class="mb20">
      <template #title>
        <span>选择项目查看待办列表，支持将用户故事从待办拖拽到 Sprint</span>
      </template>
    </el-alert>

    <el-checkbox-group v-model="selectedProjectIds" class="mb20">
      <el-checkbox
        v-for="project in projectList"
        :key="project.id"
        :label="project.id"
        @change="loadBacklog"
      >
        {{ project.name }}
      </el-checkbox>
    </el-checkbox-group>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>待办用户故事</span>
            <el-badge :value="Object.values(backlogByProject).flat().length" class="ml10" />
          </template>
          
          <div v-loading="loading">
            <div v-for="project in projectList" :key="project.id" class="project-section">
              <template v-if="selectedProjectIds.includes(project.id)">
                <div class="project-header" @click="handleProjectToggle(project.id)">
                  <el-icon :class="{ expanded: expandedProjects.includes(project.id) }">
                    <ArrowRight />
                  </el-icon>
                  <span class="project-name">{{ project.name }}</span>
                  <el-badge :value="backlogByProject[project.id]?.length || 0" />
                </div>

                <div v-show="expandedProjects.includes(project.id)" class="story-list">
                  <div
                    v-for="story in backlogByProject[project.id]"
                    :key="story.id"
                    class="story-item"
                  >
                    <div class="story-info">
                      <el-tag size="small" type="info" class="mr10">{{ story.storyPoints || 0 }}点</el-tag>
                      <span class="story-title">{{ story.title }}</span>
                    </div>
                    <div class="story-actions">
                      <el-select
                        placeholder="分配到Sprint"
                        size="small"
                        style="width: 150px"
                        @change="(sprintId) => handleAssignToSprint(story.id, sprintId)"
                      >
                        <el-option
                          v-for="sprint in sprintList"
                          :key="sprint.id"
                          :label="sprint.name"
                          :value="sprint.id"
                        />
                      </el-select>
                    </div>
                  </div>
                  <div v-if="!backlogByProject[project.id]?.length" class="empty-tip">
                    暂无待办故事
                  </div>
                </div>
              </template>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>未来 Sprint</template>
          
          <div v-for="sprint in sprintList" :key="sprint.id" class="sprint-section">
            <div class="sprint-header">
              <span class="sprint-name">{{ sprint.name }}</span>
              <el-tag size="small" type="info">{{ sprint.status === '1' ? '计划中' : sprint.status === '2' ? '进行中' : '已完成' }}</el-tag>
            </div>
            <div class="sprint-info">
              <span>时间：{{ sprint.startDate }} ~ {{ sprint.endDate }}</span>
              <span>承诺：{{ sprint.committedPoints || 0 }} 点</span>
            </div>
          </div>
          
          <el-empty v-if="!sprintList.length" description="暂无Sprint" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.mb20 {
  margin-bottom: 20px;
}

.ml10 {
  margin-left: 10px;
}

.project-section {
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  cursor: pointer;
}

.project-header .el-icon {
  transition: transform 0.3s;
}

.project-header .el-icon.expanded {
  transform: rotate(90deg);
}

.project-name {
  flex: 1;
  font-weight: 600;
  color: #303133;
}

.story-list {
  padding: 8px;
}

.story-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.story-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.story-title {
  font-size: 14px;
  color: #606266;
}

.story-actions {
  display: flex;
  gap: 8px;
}

.mr10 {
  margin-right: 10px;
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.sprint-section {
  padding: 12px;
  margin-bottom: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.sprint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sprint-name {
  font-weight: 600;
  color: #303133;
}

.sprint-info {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}
</style>
