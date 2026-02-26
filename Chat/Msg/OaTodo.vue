<script lang="ts" setup>
import { ElMessage } from 'element-plus'

const props = defineProps<{
  data: any
  prevMsg: Partial<ChatMessageVO>
  index: number
}>()

const showGroupTodoDialog = ref(false)
const drawer = ref(false)
const btnLoading = ref<boolean>(false)
const user = useUserStore()
const leaveData = ref<any>({
  leave_request: {},
  cc_user: [],
  steps: []
})
const loading = ref(false)

async function getLeaveDetails() {
  drawer.value = false // 强制先关闭，触发销毁
  await nextTick()
  drawer.value = true // 再重新打开
  btnLoading.value = true
  const res = await getOaTodoDetailApi({ todo_id: props.data.content.todo_id }, user.getToken)
  leaveData.value = res.data
  btnLoading.value = false
}

async function getAgree(status: number) {
  // 完成待办
  if (status == 3) {
    showGroupTodoDialog.value = true
  } else {
    ElMessageBox.confirm('是否确认撤销待办？', '撤销待办', {
      confirmButtonText: '确认',
      confirmButtonClass: 'el-button--danger',
      lockScroll: false,
      center: true,
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await getOaTodoDoneApi({ todo_id: props.data.content.todo_id, status: 2, remark: '' }, user.getToken)
      ElMessage.success('已撤销！')
      drawer.value = false
    })
  }
}

async function onSubmitGroupTodoMsg(formData: any) {
  await getOaTodoDoneApi({ todo_id: props.data.content.todo_id, status: 1, remark: formData.describe, finish_file: formData.file.map((item: any) => item.url) }, user.getToken)
  ElMessage.success('已完成！')
  drawer.value = false
}

const leaveTypes = ['', '事假', '产检假', '病假', '年假', '产假', '陪产假', '婚假', '丧假', '哺乳假']

function getLeaveType(id: number): string {
  return leaveTypes[id] || '未知类型'
}
</script>

<template>
  <ChatMsgTemplate :prev-msg="prevMsg" :index="index" :data="data" v-bind="$attrs">
    <template #body>
      <div class="msg-popper group notice text-left text-0.9rem" ctx-name="content">
        <div ctx-name="content" mb-2 pb-2 text-left border-default-b text-small dark:text-gray-300>
          <i ctx-name="content" class="i-solar:verified-check-bold mr-1 p-2 text-[--el-color-warning] font-500" /> 待办事项
          <img v-if="data.content.status == 0" class="status-img w-14" src="~/assets/images/daiban.svg" alt="" />
          <img v-else-if="data.content.status == 1" class="status-img w-14" src="~/assets/images/yibanjie.svg" alt="" />
          <img v-else-if="data.content.status == 2" class="status-img w-14" src="~/assets/images/cancel.svg" alt="" />
        </div>
        <div ctx-name="content" class="msg-wrap max-w-20em min-w-14em leading-1.6em text-color">
          {{ data.content.nickname }}提交的待办事项<br />
          <small
            >待办类型:
            {{
              data.content.type == 0
                ? '通知'
                : data.content.type == 1
                ? '充值'
                : data.content.type == 2
                ? '开户'
                : data.content.type == 3
                ? '冻卡'
                : data.content.type == 4
                ? '退款'
                : data.content.type == 5
                ? '收款确认'
                : data.content.type == 6
                ? '打款'
                : '未知类型'
            }}</small
          >
          <br />
          <small>{{ data.content.describe }}</small>
        </div>
        <BtnElButton class="mt-2" key="send" style="transition: 0.2s; max-width: 9em; text-align: center; letter-spacing: 1px" type="primary" @click="getLeaveDetails">
          查看详情
        </BtnElButton>
      </div>

      <!-- 分离后的抽屉组件 -->
      <dialogLeaveDrawer v-model:drawer="drawer" :leave-data="leaveData" :loading="btnLoading" @submit="getAgree" type="todo" />
      <ChatGroupTodoDialog v-model:show="showGroupTodoDialog" @submit="onSubmitGroupTodoMsg" type="finish" />
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';

.event-list {
  margin-top: 1rem;
}
.approval-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  img {
    border-radius: 6px;
  }
}
.smail-size {
  font-size: 12px;
  line-height: 1;
}
.status-img {
  float: right;
}
.leave-form {
  position: relative;
  .status-img {
    position: absolute;
    width: 5rem;
    right: 1rem;
    top: 1rem;
  }
}
</style>