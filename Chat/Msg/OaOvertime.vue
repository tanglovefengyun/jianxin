<script lang="ts" setup>
import { ElMessage } from 'element-plus'

const props = defineProps<{
  data: any
  prevMsg: Partial<ChatMessageVO>
  index: number
}>()

const drawer = ref(false)
const btnLoading = ref<boolean>(false)
const user = useUserStore()
const leaveData = ref<any>({
  overtime_request: {},
  steps: []
})
const loading = ref(false)

async function getLeaveDetails() {
  drawer.value = false // 强制先关闭，触发销毁
  await nextTick()
  drawer.value = true // 再重新打开
  btnLoading.value = true
  const res = await getOaOvertimeDetailApi({ overtime_request_id: props.data.content.overtime_request_id }, user.getToken)
  leaveData.value = res.data
  btnLoading.value = false
}

async function getAgree(status: number) {
  if (status === 1) {
    try {
      await getOaOvertimeApprovalApi({ overtime_request_id: props.data.content.overtime_request_id, status, remark: '' }, user.getToken)
      ElMessage.success('已同意！')
      drawer.value = false
    } catch (error) {}
  } else {
    ElMessageBox.prompt('请输入拒绝原因: ', '拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'textarea'
    })
      .then(async ({ value }) => {
        await getOaOvertimeApprovalApi({ overtime_request_id: props.data.content.overtime_request_id, status, remark: value }, user.getToken)
        ElMessage.success('已拒绝！')
        drawer.value = false
      })
      .catch(() => {})
  }
}
</script>

<template>
  <ChatMsgTemplate :prev-msg="prevMsg" :index="index" :data="data" v-bind="$attrs">
    <template #body>
      <div class="msg-popper group notice text-left text-0.9rem" ctx-name="content">
        <div ctx-name="content" mb-2 pb-2 text-left border-default-b text-small dark:text-gray-300>
          <i ctx-name="content" class="i-solar:verified-check-bold mr-1 p-2 text-[--el-color-warning] font-500 group-hover:animate-pulse" /> 加班审批
          <img v-if="data.content.status == 0" class="status-img w-14" src="~/assets/images/shenpizhong.svg" alt="" />
          <img v-else-if="data.content.status == 1" class="status-img w-14" src="~/assets/images/argee.svg" alt="" />
          <img v-else-if="data.content.status == 2" class="status-img w-14" src="~/assets/images/reject.svg" alt="" />
          <img v-else-if="data.content.status == 3" class="status-img w-14" src="~/assets/images/cancel.svg" alt="" />
        </div>
        <div ctx-name="content" class="msg-wrap max-w-20em min-w-14em leading-1.6em text-color">
          {{ data.content.nickname }}提交的加班申请<br />
          <small>开始时间: {{ data.content.start_time }}</small
          ><br />
          <small>结束时间: {{ data.content.end_time }}</small
          ><br />
          <small>加班事由: {{ data.content.reason }}</small>
        </div>
        <BtnElButton
          class="group-hover:opacity-100 mt-2"
          key="send"
          style="transition: 0.2s; max-width: 9em; text-align: center; letter-spacing: 1px"
          type="primary"
          @click="getLeaveDetails"
        >
          查看详情
        </BtnElButton>
      </div>

      <!-- 分离后的抽屉组件 -->
      <dialogLeaveDrawer v-model:drawer="drawer" :leave-data="leaveData" :loading="btnLoading" @submit="getAgree" type="overtime" />
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