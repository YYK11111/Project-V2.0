<script>
export default {
  props: {
    title: {
      type: String,
      default: '分组',
    },
    // 接口请求
    request: {
      type: Object,
      required: true,
      default: () => ({
        get: undefined,
        add: undefined,
        update: undefined,
        del: undefined,
      }),
    },
    props: {
      type: Object,
      default: () => ({
        id: 'id',
        label: 'label',
        children: 'children',
      }),
    },
    // 是否树形结构
    isTree: {
      type: Boolean,
      default: false,
    },
    buttons: {
      type: Array,
      default: ['add', 'edit', 'del'],
    },
  },
  data() {
    return {
      groupList: [],
      activeId: 0,
      type: '',
    }
  },
  watch: {},
  computed: {
    _props() {
      return {
        id: 'id',
        label: 'label',
        children: 'children',
        ...this.props,
      }
    },
  },
  created() {
    // this.query.mediaType = this.type
    this.getTree(true)
  },
  mounted() {},
  methods: {
    addEdit(type, item = {}) {
      item &&= JSON.parse(JSON.stringify(item))
      if (this.request.add || this.request.update) {
        this.$refs.dialogRef.action(item)
      } else {
        this.$emit('action', { type, item })
        return this.$emit('addEdit', { type, item })
      }
    },
    switchGroup(item, index) {
      this.activeId = item?.[this._props.id]
      this.$emit('action', { type: this.type || 'change', item })
      this.$emit('currentChange', { type: this.type || 'change', item })
    },
    removeGroup(id) {
      this.$confirm('是否确认删除当前分组？删除后该分组下内容将移动到默认分组中，该操作不可撤销，请谨慎操作。')
        .then(() => {
          if (this.request.del) {
            this.request.del(id).then((res) => {
              this.getTree(this.activeId == id)
            })
          } else {
            return this.$emit('del', { id })
          }
        })
        .catch(() => {})
    },
    // 获取类目树
    getTree(refresh) {
      this.request.get(this.type).then(({ data, rows }) => {
        this.groupList = data = data || rows || []
        if (refresh) {
          this.switchGroup(data[0])
        }
      })
    },
  },
}
</script>

<template>
  <div class="h-[100%]">
    <div class="leftRight">
      <div class="left g-card stickyPadding">
        <div class="title">
          <div class="title-name">{{ title }}</div>
          <IconBtn v-if="buttons.includes('add')" icon="el-plus" @click="addEdit('add')">新增分组</IconBtn>
        </div>

        <template v-if="groupList?.length">
          <div class="item-list" v-if="!isTree">
            <div
              class="item"
              v-for="(item, index) in groupList"
              :class="{ active: activeId == item[_props.id] }"
              :key="item[_props.id]"
              @click="switchGroup(item, index)">
              <div class="name">
                <slot name="itemContent" v-bind="{ item }">
                  {{ item[_props.label] }}
                </slot>
              </div>
              <div class="btn" v-if="item[_props.id] != 1">
                <IconBtn v-if="buttons.includes('edit')" icon="el-edit" @click.stop="addEdit('edit', item)">
                  编辑
                </IconBtn>
                <IconBtn v-if="buttons.includes('del')" icon="el-delete" @click.stop="removeGroup(item[_props.id])">
                  删除
                </IconBtn>
              </div>
            </div>
          </div>

          <el-tree
            v-else
            ref="tree"
            style="--el-tree-node-content-height: auto"
            :node-key="_props.id"
            :default-expanded-keys="[activeId]"
            default-expand-all
            accordion
            :data="groupList"
            :props="props"
            :expand-on-click-node="true"
            @node-click="switchGroup">
            <template #default="{ node, data: item }">
              <div class="item pl0" :class="{ active: activeId == item[_props.id] }">
                <div class="name">
                  <el-icon-folder-opened v-if="!node.isLeaf" class="--Color mr5" />
                  <slot name="itemContent" v-bind="{ item }">
                    {{ item[_props.label] }}
                  </slot>
                </div>
                <div class="btn" v-if="item[_props.id] != 1">
                  <IconBtn v-if="buttons.includes('add')" icon="el-edit" @click.stop="addEdit('edit', item)">
                    编辑
                  </IconBtn>
                  <IconBtn v-if="buttons.includes('del')" icon="el-delete" @click.stop="removeGroup(item[_props.id])">
                    删除
                  </IconBtn>
                </div>
              </div>
            </template>
          </el-tree>
        </template>

        <BaEmpty v-else />
      </div>

      <div class="right">
        <div class="flex flex-col overflow-auto" v-show="activeId"><slot v-bind="{ activeId }"></slot></div>
        <BaEmpty v-if="!activeId" />
      </div>
    </div>

    <!-- 分组弹框 -->
    <BaDialog
      ref="dialogRef"
      :dynamicTitle="title"
      width="30%"
      :formProps="{ rules, 'label-position': 'top' }"
      style="--FormItemContentMaxWidth: auto"
      @confirm="
        ({ form, confirm }) => confirm(request.add, () => (getTree(!form[_props.id]), (type = 'edit')), request.update)
      ">
      <template #form="{ form }">
        <BaInput :label="`${title}名称`" :prop="_props.label" required v-model="form[_props.label]" maxlength="15">
          <div class="g-tip text-right">{{ title }}名称不能重复</div>
        </BaInput>
      </template>
    </BaDialog>
  </div>
</template>

<style lang="scss" scoped>
.leftRight {
  display: flex;
  justify-content: space-between;
  max-height: 100%;
  .left {
    flex: auto;
    margin-right: var(--Margin);
    padding-bottom: 15px;
    .title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      background: var(--BgWhite);
      .title-name {
        color: var(--FontBlack);
        font-size: 14px;
        font-weight: 600;
        // color: var(--FontBlack);
        display: flex;
        align-items: center;
      }
      .title-btn {
        cursor: pointer;
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: normal;
        color: var(--Color);
        &:hover {
          opacity: 0.8;
        }
      }
    }

    .item {
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: var(--FontBlack5);
      height: 40px;
      line-height: 40px;
      width: 100%;
      padding-left: 20px;
      .btn {
        opacity: 0;
        transition: all 0.15s;
      }
      &.active,
      &:hover {
        .name {
          transition: all 0.15s;
          color: var(--Color);
        }
      }
      &:hover {
        .btn {
          opacity: 1;
        }
      }
    }

    :deep().el-tree-node__content:hover {
      background: none;
    }

    :deep() .el-tree-node__expand-icon {
      display: none;
    }
  }

  .right {
    width: 78%;
    display: flex;
    flex-direction: column;
    flex: none;
    overflow: auto !important;
    // border-radius: var(--RadiusBig);
  }
}
</style>
