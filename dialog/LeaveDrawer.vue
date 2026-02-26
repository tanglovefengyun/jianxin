<script lang="ts" setup>
import { onTodoContextMenu } from '../Chat/Msg/index'
const props = defineProps<{
  drawer: boolean
  leaveData: any
  loading: boolean
  type: string
}>()

const dialogPopupShow = ref(false)
const user = useUserStore()
const router = useRouter()
const setting = useSettingStore()
const fileName = ref<any>('')
const activeStep = computed(() => {
  const steps = props.leaveData.steps || []
  if (!steps.length) return 0
  const processingIndex = steps.findIndex((s: any) => s.status === 0)
  const rejectedIndex = steps.findIndex((s: any) => s.status === 2)
  const withdrawIndex = steps.findIndex((s: any) => s.status === 3)
  if (rejectedIndex !== -1) return rejectedIndex
  else if (processingIndex !== -1) return processingIndex
  else if (withdrawIndex !== -1) return withdrawIndex
  else return steps.length + 1
})

watch(
  () => props.drawer,
  (val) => {
    dialogPopupShow.value = val
  }
)

const processStatus = computed(() => {
  const steps = props.leaveData.steps || []
  if (steps.some((s: any) => s.status === 2)) return 'error'
  return 'process'
})
const approvalStatus = computed(() => {
  const steps = props.leaveData.steps
  const myIndex = steps.findIndex((item: any) => item.id === user.userInfo.id)

  if (myIndex === -1) return false // 不在审批人列表中

  const myStep = steps[myIndex]

  // 检查我前面的所有步骤是否都完成（status !== 0）
  const previousApproved = steps.slice(0, myIndex).every((step: any) => step.status !== 0)

  return myStep.status === 0 && previousApproved && (props.type === 'leave' ? props.leaveData.leave_request.status == 0 : props.leaveData.overtime_request.status == 0)
})
const reimbStatus = computed(() => {
  const steps = props.leaveData.steps
  const myIndex = steps.findIndex((item: any) => item.id === user.userInfo.id)

  if (myIndex === -1) return false // 不在审批人列表中

  const myStep = steps[myIndex]

  // 检查我前面的所有步骤是否都完成（status !== 0）
  const previousApproved = steps.slice(0, myIndex).every((step: any) => step.status !== 0)

  return myStep.status === 0 && previousApproved && props.leaveData.reimbursement_request.status == 0
})

const emit = defineEmits(['update:drawer', 'submit'])

function handleSubmit(status: number) {
  emit('submit', status)
}
const leaveTypes = ['', '事假', '产检假', '病假', '年假', '产假', '陪产假', '婚假', '丧假', '哺乳假']

const rembiTypes = ['', '部门活动经费', '办公费', '交通费', '招待费', '差旅', '其他支出']

function getLeaveType(id: number): string {
  return leaveTypes[id] || '未知类型'
}

// 撤销请假
async function handleCancel() {
  try {
    await getOaLeaveCancelApi({ leave_request_id: props.leaveData.leave_request.id }, user.getToken)
    ElMessage.success('已撤销！')
    emit('update:drawer', false)
  } catch (error) {}
}
// 撤销报销
async function handleReimbCancel() {
  try {
    await getOaReimbursementCancelApi({ reimbursement_request_id: props.leaveData.reimbursement_request.id }, user.getToken)
    ElMessage.success('已撤销！')
    emit('update:drawer', false)
  } catch (error) {}
}
// 撤销加班
async function handleOvertimeCancel() {
  try {
    await getOaOvertimeCancelApi({ overtime_request_id: props.leaveData.overtime_request.id }, user.getToken)
    ElMessage.success('已撤销！')
    emit('update:drawer', false)
  } catch (error) {}
}
// 修改请假
function handleUpdate() {
  router.push({
    path: '/workbench',
    query: {
      leave_request_id: props.leaveData.leave_request.id
    }
  })
  emit('update:drawer', false)
}

// 处理图片点击预览
function handleImagePreview(img: string) {
  if (!img) return
  useImageViewer.open({
    urlList: [img],
    index: 0,
    ctxName: 'img'
  })
}

function onDownloadFile(url: string) {
  fileName.value = url.split('/').pop()
  const item = setting.fileDownloadMap?.[url]
  if (item && item.status === FileStatus.DOWNLOADING) {
    setting.showDownloadPanel = true
    return
  }
  if (item) {
    // 存在文件则打开
    setting.openFileByDefaultApp(item)
    return
  }
  // 下载文件
  downloadFile(url, fileName.value, {}, (val) => {})
  if (setting.isDesktop) {
    nextTick(() => {
      setting.showDownloadPanel = true
    })
  }
}
</script>

<template>
  <DialogPopup
    v-if="!setting.isMobileSize"
    v-model="dialogPopupShow"
    :duration="300"
    :zIndex="1000"
    :width="setting.isMobileSize ? '76%' : '30%'"
    destroy-on-close
    content-class="rounded-2 p-4 w-fit border-default-2 dialog-bg-color"
    :showClose="false"
  >
    <!-- <el-drawer
    v-model="props.drawer"
    :size="setting.isMobileSize ? '76%' : '20%'"
    append-to="#__nuxt"
    :destroy-on-close="!setting.isMobileSize"
    :z-index="1000"
    :modal-class="setting.isMobileSize ? 'backdrop-blur-4px transition-[backdrop-filter] border-default' : ''"
    :class="setting.isMobileSize ? 'rounded-l-3' : ''"
    :with-header="false"
  > -->
    <div class="leave-form" v-loading="loading" v-if="type === 'leave'">
      <h2 class="mb-4"
        >{{ leaveData.leave_request.user ? leaveData.leave_request.user.nickname : '' }}提交的{{ getLeaveType(leaveData.leave_request.leave_type) }}申请({{
          leaveData.leave_request.created_at
        }})</h2
      >
      <img v-if="leaveData.leave_request.status == 0" class="status-img" src="~/assets/images/shenpizhong.svg" alt="" />
      <img v-else-if="leaveData.leave_request.status == 1" class="status-img" src="~/assets/images/argee.svg" alt="" />
      <img v-else-if="leaveData.leave_request.status == 2" class="status-img" src="~/assets/images/reject.svg" alt="" />
      <img v-else-if="leaveData.leave_request.status == 3" class="status-img" src="~/assets/images/cancel.svg" alt="" />

      <div class="event-list">
        <div>
          <small class="mb-1 block text-gray-500">请假类型</small>
          <span>{{ getLeaveType(leaveData.leave_request.leave_type) }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">开始时间</small>
          <span>{{ leaveData.leave_request.start_time }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">结束时间</small>
          <span>{{ leaveData.leave_request.end_time }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">请假事由</small>
          <span>{{ leaveData.leave_request.reason }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">附件图片</small>
          <img
            v-for="(item, index) in leaveData.leave_request.file"
            :key="index"
            :src="item"
            class="w-20 h-20 mr-2 card-rounded-df object-cover shadow-sm card-bg-color-2"
            @click="handleImagePreview(item)"
          />
        </div>
      </div>

      <el-divider class="approval-divider">审批流程</el-divider>

      <div style="height: 220px; max-width: 600px">
        <el-steps
          v-if="leaveData.steps.length > 0"
          style="max-width: 600px"
          :active="activeStep"
          align-center
          direction="vertical"
          finish-status="success"
          :process-status="processStatus"
        >
          <el-step v-for="(item, idx) in leaveData.steps" :key="item.id">
            <template #title>
              <div class="w-full flex justify-between">
                <div>
                  第{{ idx + 1 }}级审批人
                  <p class="smail-size">
                    {{ item.status == 1 ? `(已同意) : ${item.approved_at}` : item.status == 2 ? `(已拒绝: ${leaveData.leave_request.remark}) : ${item.approved_at}` : '' }}</p
                  >
                </div>
                <div class="approval-user">
                  <img class="mb-2 h-8 w-8" :src="item.portrait" alt="" />
                  <p class="smail-size text-gray-500">{{ item.nickname }}</p>
                </div>
              </div>
            </template>
          </el-step>

          <el-step :key="'cc-user-step'">
            <template #title>
              <div class="w-full flex justify-between">
                <div>
                  抄送人
                  <p class="smail-size text-gray-500">抄送{{ leaveData.cc_user?.length || 0 }}人</p>
                </div>
                <div class="flex items-center flex-wrap">
                  <template v-for="(user, index) in leaveData.cc_user" :key="user.id">
                    <div class="flex items-center">
                      <div class="approval-user text-center">
                        <img class="h-8 w-8 rounded-full mb-1 border" :src="user.user.portrait" alt="" />
                        <p class="text-xs text-gray-500">
                          {{ user.user.nickname }}
                        </p>
                      </div>
                      <span v-if="index !== leaveData.cc_user.length - 1" class="mx-1 text-lg font-bold text-gray-400 flex items-center">+</span>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </div>

      <div class="text-center mt-6" v-if="approvalStatus">
        <el-button type="danger" @click="handleSubmit(2)">拒绝</el-button>
        <el-button type="primary" @click="handleSubmit(1)">同意</el-button>
      </div>
      <div class="text-center mt-6" v-if="leaveData.leave_request.user_id == user.userInfo.id">
        <el-button type="danger" v-if="leaveData.leave_request.status != 3" @click="handleCancel">撤销</el-button>
        <el-button type="primary" v-if="leaveData.steps.filter((item: any) => item.status == 1).length == 0" @click="handleUpdate">修改</el-button>
      </div>
    </div>
    <div class="leave-form" v-loading="loading" v-else-if="type === 'overtime'">
      <h2 class="mb-4">{{ leaveData.overtime_request.user ? leaveData.overtime_request.user.nickname : '' }}提交的加班申请({{ leaveData.overtime_request.created_at }})</h2>
      <img v-if="leaveData.overtime_request.status == 0" class="status-img" src="~/assets/images/shenpizhong.svg" alt="" />
      <img v-else-if="leaveData.overtime_request.status == 1" class="status-img" src="~/assets/images/argee.svg" alt="" />
      <img v-else-if="leaveData.overtime_request.status == 2" class="status-img" src="~/assets/images/reject.svg" alt="" />
      <img v-else-if="leaveData.overtime_request.status == 3" class="status-img" src="~/assets/images/cancel.svg" alt="" />

      <div class="event-list">
        <div>
          <small class="mb-1 block text-gray-500">开始时间</small>
          <span>{{ leaveData.overtime_request.start_time }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">结束时间</small>
          <span>{{ leaveData.overtime_request.end_time }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">加班事由</small>
          <span>{{ leaveData.overtime_request.reason }}</span>
        </div>
      </div>

      <el-divider class="approval-divider">审批流程</el-divider>

      <div style="height: 220px; max-width: 600px">
        <el-steps
          v-if="leaveData.steps.length > 0"
          style="max-width: 600px"
          :active="activeStep"
          align-center
          direction="vertical"
          finish-status="success"
          :process-status="processStatus"
        >
          <el-step v-for="(item, idx) in leaveData.steps" :key="item.id">
            <template #title>
              <div class="w-full flex justify-between">
                <div>
                  第{{ idx + 1 }}级审批人
                  <p class="smail-size">
                    {{ item.status == 1 ? `(已同意) : ${item.approved_at}` : item.status == 2 ? `(已拒绝: ${leaveData.overtime_request.remark}) : ${item.approved_at}` : '' }}</p
                  >
                </div>
                <div class="approval-user">
                  <img class="mb-2 h-8 w-8" :src="item.portrait" alt="" />
                  <p class="smail-size text-gray-500">{{ item.nickname }}</p>
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </div>

      <div class="text-center mt-6" v-if="approvalStatus">
        <el-button type="danger" @click="handleSubmit(2)">拒绝</el-button>
        <el-button type="primary" @click="handleSubmit(1)">同意</el-button>
      </div>
      <div class="text-center mt-6" v-if="leaveData.overtime_request.user_id == user.userInfo.id">
        <el-button type="danger" v-if="leaveData.overtime_request.status != 3" @click="handleOvertimeCancel">撤销</el-button>
        <!-- <el-button type="primary" v-if="leaveData.steps.filter((item: any) => item.status == 1).length == 0" @click="handleUpdate">修改</el-button> -->
      </div>
    </div>
    <div class="leave-form" v-loading="loading" v-else-if="type === 'todo'" @contextmenu="onTodoContextMenu">
      <h2 class="mb-4">{{ leaveData.user ? leaveData.user.nickname : '' }}提交的待办</h2>
      <img v-if="leaveData.status == 0" class="status-img" src="~/assets/images/daiban.svg" alt="" />
      <img v-else-if="leaveData.status == 1" class="status-img" src="~/assets/images/yibanjie.svg" alt="" />
      <img v-else-if="leaveData.status == 2" class="status-img w-14" src="~/assets/images/cancel.svg" alt="" />
      <div class="event-list">
        <div class="mb-4">
          <small class="mb-1 block text-gray-500">待办类型</small>
          <span>{{
            leaveData.type == 0
              ? '通知'
              : leaveData.type == 1
              ? '充值'
              : leaveData.type == 2
              ? '开户'
              : leaveData.type == 3
              ? '冻卡'
              : leaveData.type == 4
              ? '退款'
              : leaveData.type == 5
              ? '收款确认'
              : leaveData.type == 6
              ? '打款'
              : '未知类型'
          }}</span>
        </div>
        <div>
          <small class="mb-1 block text-gray-500">待办详情</small>
          <span>{{ leaveData.describe }}</span>
        </div>
        <br />
        <div v-if="leaveData.file && leaveData.file.length > 0" class="mb-4">
          <small class="mb-1 block text-gray-500">附件图片</small>
          <img
            v-for="(item, index) in leaveData.file"
            :key="index"
            :src="item"
            class="w-20 h-20 mr-2 card-rounded-df object-cover shadow-sm card-bg-color-2"
            @click="handleImagePreview(item)"
          />
        </div>
        <div v-if="leaveData.inform && leaveData.inform.length > 0" class="mb-4">
          <small class="mb-1 block text-gray-500">待办成员</small>
          <!-- {{ leaveData.inform.map((item: any) => item.user.nickname).join('、') }} -->
          <div class="user-box">
            <div v-for="(item, index) in leaveData.inform" :key="index">
              <img class="object-cover" :src="item.user.portrait" alt="头像" />
              <small>{{ item.user.nickname }}</small>
            </div>
          </div>
        </div>
        <div class="mb-4" v-if="leaveData.status == 1">
          <small class="mb-1 block text-gray-500">完成备注</small>
          <span>{{ leaveData.remark }}</span>
        </div>
        <div class="mb-4" v-if="leaveData.status == 1">
          <small class="mb-1 block text-gray-500">完成图片</small>
          <img
            v-for="(item, index) in leaveData.finish_file"
            :key="index"
            :src="item"
            class="w-20 h-20 mr-2 card-rounded-df object-cover shadow-sm card-bg-color-2"
            @click="handleImagePreview(item)"
          />
        </div>
      </div>
      <div class="text-center mt-6">
        <el-button v-if="leaveData.status == 0 && leaveData.inform.some((item: any) => item.user_id === user.userInfo.id)" type="primary" @click="handleSubmit(3)"
          >完成待办</el-button
        >
        <el-button v-else-if="leaveData.status == 0 && leaveData.user_id === user.userInfo.id" type="danger" @click="handleSubmit(4)">撤销</el-button>
        <el-button v-else-if="leaveData.status == 1" type="primary" disabled>已完成</el-button>
      </div>
    </div>
    <div class="leave-form" v-loading="loading" v-if="type === 'reimb'">
      <h2 class="mb-4">{{ leaveData.reimbursement_request.user ? leaveData.reimbursement_request.user.nickname : '' }}提交的报销申请</h2>
      <img v-if="leaveData.reimbursement_request.status == 0" class="status-img" src="~/assets/images/shenpizhong.svg" alt="" />
      <img v-else-if="leaveData.reimbursement_request.status == 1" class="status-img" src="~/assets/images/argee.svg" alt="" />
      <img v-else-if="leaveData.reimbursement_request.status == 2" class="status-img" src="~/assets/images/reject.svg" alt="" />
      <img v-else-if="leaveData.reimbursement_request.status == 3" class="status-img" src="~/assets/images/cancel.svg" alt="" />

      <div class="event-list">
        <div>
          <small class="mb-1 block text-gray-500">报销类型</small>
          <span>{{ rembiTypes[leaveData.reimbursement_request.reimbursement_type] }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">报销金额</small>
          <span>{{ leaveData.reimbursement_request.money }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">费用日期</small>
          <span>{{ leaveData.reimbursement_request.date }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">费用说明</small>
          <span>{{ leaveData.reimbursement_request.reason }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">报销附件</small>
          <!-- <img
            v-for="(item, index) in leaveData.reimbursement_request.file"
            :key="index"
            :src="item"
            class="w-20 h-20 mr-2 card-rounded-df object-cover shadow-sm card-bg-color-2"
            @click="handleImagePreview(item)"
          /> -->
          <div>
            <div
              v-for="(item, index) in leaveData.reimbursement_request.file"
              :key="index"
              ctx-name="file"
              title="文件"
              class="file max-w-14em mb-2 w-fit flex flex-row-reverse cursor-pointer gap-3 p-3 shadow-sm transition-all !items-center border-default hover:border-[var(--el-color-primary)] card-default bg-color hover:shadow-lg"
              @click="onDownloadFile(item)"
            >
              <img ctx-name="file" :src="FILE_TYPE_ICON_DEFAULT" class="file-icon h-8 w-8 object-contain" />
              <div ctx-name="file">
                <p ctx-name="file" class="text-overflow-2 text-sm leading-4">
                  {{ item.split('/').pop() }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-divider class="approval-divider">审批流程</el-divider>

      <div style="height: 220px; max-width: 600px">
        <el-steps
          v-if="leaveData.steps.length > 0"
          style="max-width: 600px"
          :active="activeStep"
          align-center
          direction="vertical"
          finish-status="success"
          :process-status="processStatus"
        >
          <el-step v-for="(item, idx) in leaveData.steps" :key="item.id">
            <template #title>
              <div class="w-full flex justify-between">
                <div>
                  第{{ idx + 1 }}级审批人
                  <p class="smail-size">
                    {{ item.status == 1 ? '(已同意)' : item.status == 2 ? `(已拒绝: ${leaveData.reimbursement_request.remark})` : '' }}
                  </p>
                </div>
                <div class="approval-user">
                  <img class="mb-2 h-8 w-8" :src="item.portrait" alt="" />
                  <p class="smail-size text-gray-500">{{ item.nickname }}</p>
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </div>

      <div class="text-center mt-6" v-if="reimbStatus">
        <el-button type="danger" @click="handleSubmit(2)">拒绝</el-button>
        <el-button type="primary" @click="handleSubmit(1)">同意</el-button>
      </div>
      <div class="text-center mt-6" v-if="leaveData.reimbursement_request.user_id == user.userInfo.id">
        <el-button type="danger" v-if="leaveData.reimbursement_request.status != 3" @click="handleReimbCancel">撤销</el-button>
        <!-- <el-button type="primary" v-if="leaveData.steps.filter((item: any) => item.status == 1).length == 0" @click="handleUpdate">修改</el-button> -->
      </div>
    </div>
    <!-- </el-drawer> -->
  </DialogPopup>
  <el-drawer
    v-else
    direction="btt"
    v-model="props.drawer"
    size="90%"
    append-to="#__nuxt"
    :destroy-on-close="!setting.isMobileSize"
    :z-index="1000"
    :modal-class="setting.isMobileSize ? 'backdrop-blur-4px transition-[backdrop-filter] border-default' : ''"
    :class="setting.isMobileSize ? 'rounded-3' : ''"
    class="p-4"
    :with-header="false"
  >
    <div class="leave-form" v-loading="loading" v-if="type === 'leave'">
      <h2 class="mb-4">{{ leaveData.leave_request.user ? leaveData.leave_request.user.nickname : '' }}提交的{{ getLeaveType(leaveData.leave_request.leave_type) }}申请</h2>
      <img v-if="leaveData.leave_request.status == 0" class="status-img" src="~/assets/images/shenpizhong.svg" alt="" />
      <img v-else-if="leaveData.leave_request.status == 1" class="status-img" src="~/assets/images/argee.svg" alt="" />
      <img v-else-if="leaveData.leave_request.status == 2" class="status-img" src="~/assets/images/reject.svg" alt="" />
      <img v-else-if="leaveData.leave_request.status == 3" class="status-img" src="~/assets/images/cancel.svg" alt="" />

      <div class="event-list">
        <div>
          <small class="mb-1 block text-gray-500">请假类型</small>
          <span>{{ getLeaveType(leaveData.leave_request.leave_type) }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">开始时间</small>
          <span>{{ leaveData.leave_request.start_time }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">结束时间</small>
          <span>{{ leaveData.leave_request.end_time }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">请假事由</small>
          <span>{{ leaveData.leave_request.reason }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">附件图片</small>
          <img
            v-for="(item, index) in leaveData.leave_request.file"
            :key="index"
            :src="item"
            class="w-20 h-20 mr-2 card-rounded-df object-cover shadow-sm card-bg-color-2"
            @click="handleImagePreview(item)"
          />
        </div>
      </div>

      <el-divider class="approval-divider">审批流程</el-divider>

      <div style="height: 240px; max-width: 600px">
        <el-steps
          v-if="leaveData.steps.length > 0"
          style="max-width: 600px"
          :active="activeStep"
          align-center
          direction="vertical"
          finish-status="success"
          :process-status="processStatus"
        >
          <el-step v-for="(item, idx) in leaveData.steps" :key="item.id">
            <template #title>
              <div class="w-full flex justify-between">
                <div>
                  第{{ idx + 1 }}级审批人
                  <p class="smail-size">
                    {{ item.status == 1 ? '(已同意)' : item.status == 2 ? `(已拒绝: ${leaveData.leave_request.remark})` : '' }}
                  </p>
                </div>
                <div class="approval-user">
                  <img class="mb-2 h-8 w-8" :src="item.portrait" alt="" />
                  <p class="smail-size text-gray-500">{{ item.nickname }}</p>
                </div>
              </div>
            </template>
          </el-step>

          <el-step :key="'cc-user-step'">
            <template #title>
              <div class="w-full flex justify-between">
                <div>
                  抄送人
                  <p class="smail-size text-gray-500">抄送{{ leaveData.cc_user?.length || 0 }}人</p>
                </div>
                <div class="flex items-center flex-wrap">
                  <template v-for="(user, index) in leaveData.cc_user" :key="user.id">
                    <div class="flex items-center">
                      <div class="approval-user text-center">
                        <img class="h-8 w-8 rounded-full mb-1 border" :src="user.user.portrait" alt="" />
                        <p class="text-xs text-gray-500">
                          {{ user.user.nickname }}
                        </p>
                      </div>
                      <span v-if="index !== leaveData.cc_user.length - 1" class="mx-1 text-lg font-bold text-gray-400 flex items-center">+</span>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </div>

      <div class="text-center mt-6" v-if="approvalStatus">
        <el-button type="danger" @click="handleSubmit(2)">拒绝</el-button>
        <el-button type="primary" @click="handleSubmit(1)">同意</el-button>
      </div>
      <div class="text-center mt-6" v-if="leaveData.leave_request.user_id == user.userInfo.id">
        <el-button type="danger" v-if="leaveData.leave_request.status != 3" @click="handleCancel">撤销</el-button>
        <el-button type="primary" v-if="leaveData.steps.filter((item: any) => item.status == 1).length == 0" @click="handleUpdate">修改</el-button>
      </div>
    </div>
    <div class="leave-form" v-loading="loading" v-else-if="type === 'overtime'">
      <h2 class="mb-4">{{ leaveData.overtime_request.user ? leaveData.overtime_request.user.nickname : '' }}提交的加班申请({{ leaveData.overtime_request.created_at }})</h2>
      <img v-if="leaveData.overtime_request.status == 0" class="status-img" src="~/assets/images/shenpizhong.svg" alt="" />
      <img v-else-if="leaveData.overtime_request.status == 1" class="status-img" src="~/assets/images/argee.svg" alt="" />
      <img v-else-if="leaveData.overtime_request.status == 2" class="status-img" src="~/assets/images/reject.svg" alt="" />
      <img v-else-if="leaveData.overtime_request.status == 3" class="status-img" src="~/assets/images/cancel.svg" alt="" />

      <div class="event-list">
        <div>
          <small class="mb-1 block text-gray-500">开始时间</small>
          <span>{{ leaveData.overtime_request.start_time }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">结束时间</small>
          <span>{{ leaveData.overtime_request.end_time }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">加班事由</small>
          <span>{{ leaveData.overtime_request.reason }}</span>
        </div>
      </div>

      <el-divider class="approval-divider">审批流程</el-divider>

      <div style="height: 220px; max-width: 600px">
        <el-steps
          v-if="leaveData.steps.length > 0"
          style="max-width: 600px"
          :active="activeStep"
          align-center
          direction="vertical"
          finish-status="success"
          :process-status="processStatus"
        >
          <el-step v-for="(item, idx) in leaveData.steps" :key="item.id">
            <template #title>
              <div class="w-full flex justify-between">
                <div>
                  第{{ idx + 1 }}级审批人
                  <p class="smail-size">
                    {{ item.status == 1 ? `(已同意) : ${item.approved_at}` : item.status == 2 ? `(已拒绝: ${leaveData.overtime_request.remark}) : ${item.approved_at}` : '' }}</p
                  >
                </div>
                <div class="approval-user">
                  <img class="mb-2 h-8 w-8" :src="item.portrait" alt="" />
                  <p class="smail-size text-gray-500">{{ item.nickname }}</p>
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </div>

      <div class="text-center mt-6" v-if="approvalStatus">
        <el-button type="danger" @click="handleSubmit(2)">拒绝</el-button>
        <el-button type="primary" @click="handleSubmit(1)">同意</el-button>
      </div>
      <div class="text-center mt-6" v-if="leaveData.overtime_request.user_id == user.userInfo.id">
        <el-button type="danger" v-if="leaveData.overtime_request.status != 3" @click="handleOvertimeCancel">撤销</el-button>
        <!-- <el-button type="primary" v-if="leaveData.steps.filter((item: any) => item.status == 1).length == 0" @click="handleUpdate">修改</el-button> -->
      </div>
    </div>
    <div class="leave-form" v-loading="loading" v-else-if="type === 'todo'">
      <h2 class="mb-4">{{ leaveData.user ? leaveData.user.nickname : '' }}提交的待办</h2>
      <img v-if="leaveData.status == 0" class="status-img" src="~/assets/images/daiban.svg" alt="" />
      <img v-else-if="leaveData.status == 1" class="status-img" src="~/assets/images/yibanjie.svg" alt="" />
      <img v-else-if="leaveData.status == 2" class="status-img w-14" src="~/assets/images/cancel.svg" alt="" />

      <div class="event-list">
        <div class="mb-4">
          <small class="mb-1 block text-gray-500">待办类型</small>
          <span>{{
            leaveData.type == 0
              ? '通知'
              : leaveData.type == 1
              ? '充值'
              : leaveData.type == 2
              ? '开户'
              : leaveData.type == 3
              ? '冻卡'
              : leaveData.type == 4
              ? '退款'
              : leaveData.type == 5
              ? '收款确认'
              : leaveData.type == 6
              ? '打款'
              : '未知类型'
          }}</span>
        </div>
        <div>
          <small class="mb-1 block text-gray-500">待办详情</small>
          <span>{{ leaveData.describe }}</span>
        </div>
        <br />
        <div v-if="leaveData.file && leaveData.file.length > 0" class="mb-4">
          <small class="mb-1 block text-gray-500">附件图片</small>
          <img
            v-for="(item, index) in leaveData.file"
            :key="index"
            :src="item"
            class="w-20 h-20 mr-2 card-rounded-df object-cover shadow-sm card-bg-color-2"
            @click="handleImagePreview(item)"
          />
        </div>
        <div v-if="leaveData.inform && leaveData.inform.length > 0" class="mb-4">
          <small class="mb-1 block text-gray-500">待办成员</small>
          <!-- {{ leaveData.inform.map((item: any) => item.user.nickname).join('、') }} -->
          <div class="user-box">
            <div v-for="(item, index) in leaveData.inform" :key="index">
              <img class="object-cover" :src="item.user.portrait" alt="头像" />
              <small>{{ item.user.nickname }}</small>
            </div>
          </div>
        </div>
        <div class="mb-4" v-if="leaveData.status == 1">
          <small class="mb-1 block text-gray-500">完成备注</small>
          <span>{{ leaveData.remark }}</span>
        </div>
        <div class="mb-4" v-if="leaveData.status == 1">
          <small class="mb-1 block text-gray-500">完成图片</small>
          <img
            v-for="(item, index) in leaveData.finish_file"
            :key="index"
            :src="item"
            class="w-20 h-20 mr-2 card-rounded-df object-cover shadow-sm card-bg-color-2"
            @click="handleImagePreview(item)"
          />
        </div>
      </div>
      <div class="text-center mt-6">
        <el-button v-if="leaveData.status == 0 && leaveData.inform.some((item: any) => item.user_id === user.userInfo.id)" type="primary" @click="handleSubmit(3)"
          >完成待办</el-button
        >
        <el-button v-else-if="leaveData.status == 1" type="primary" disabled>已完成</el-button>
      </div>
    </div>
    <div class="leave-form" v-loading="loading" v-if="type === 'reimb'">
      <h2 class="mb-4">{{ leaveData.reimbursement_request.user ? leaveData.reimbursement_request.user.nickname : '' }}提交的报销申请</h2>
      <img v-if="leaveData.reimbursement_request.status == 0" class="status-img" src="~/assets/images/shenpizhong.svg" alt="" />
      <img v-else-if="leaveData.reimbursement_request.status == 1" class="status-img" src="~/assets/images/argee.svg" alt="" />
      <img v-else-if="leaveData.reimbursement_request.status == 2" class="status-img" src="~/assets/images/reject.svg" alt="" />
      <img v-else-if="leaveData.reimbursement_request.status == 3" class="status-img" src="~/assets/images/cancel.svg" alt="" />

      <div class="event-list">
        <div>
          <small class="mb-1 block text-gray-500">报销类型</small>
          <span>{{ rembiTypes[leaveData.reimbursement_request.reimbursement_type] }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">报销金额</small>
          <span>{{ leaveData.reimbursement_request.money }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">费用日期</small>
          <span>{{ leaveData.reimbursement_request.date }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">费用说明</small>
          <span>{{ leaveData.reimbursement_request.reason }}</span>
        </div>
        <br />
        <div>
          <small class="mb-1 block text-gray-500">报销附件</small>
          <!-- <img
            v-for="(item, index) in leaveData.reimbursement_request.file"
            :key="index"
            :src="item"
            class="w-20 h-20 mr-2 card-rounded-df object-cover shadow-sm card-bg-color-2"
            @click="handleImagePreview(item)"
          /> -->
          <div>
            <div
              v-for="(item, index) in leaveData.reimbursement_request.file"
              :key="index"
              ctx-name="file"
              title="文件"
              class="file max-w-14em mb-2 w-fit flex flex-row-reverse cursor-pointer gap-3 p-3 shadow-sm transition-all !items-center border-default hover:border-[var(--el-color-primary)] card-default bg-color hover:shadow-lg"
              @click="onDownloadFile(item)"
            >
              <img ctx-name="file" :src="FILE_TYPE_ICON_DEFAULT" class="file-icon h-8 w-8 object-contain" />
              <div ctx-name="file">
                <p ctx-name="file" class="text-overflow-2 text-sm leading-4">
                  {{ item.split('/').pop() }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-divider class="approval-divider">审批流程</el-divider>

      <div style="height: 220px; max-width: 600px">
        <el-steps
          v-if="leaveData.steps.length > 0"
          style="max-width: 600px"
          :active="activeStep"
          align-center
          direction="vertical"
          finish-status="success"
          :process-status="processStatus"
        >
          <el-step v-for="(item, idx) in leaveData.steps" :key="item.id">
            <template #title>
              <div class="w-full flex justify-between">
                <div>
                  第{{ idx + 1 }}级审批人
                  <p class="smail-size">
                    {{ item.status == 1 ? '(已同意)' : item.status == 2 ? `(已拒绝: ${leaveData.reimbursement_request.remark})` : '' }}
                  </p>
                </div>
                <div class="approval-user">
                  <img class="mb-2 h-8 w-8" :src="item.portrait" alt="" />
                  <p class="smail-size text-gray-500">{{ item.nickname }}</p>
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </div>

      <div class="text-center mt-6" v-if="reimbStatus">
        <el-button type="danger" @click="handleSubmit(2)">拒绝</el-button>
        <el-button type="primary" @click="handleSubmit(1)">同意</el-button>
      </div>
      <div class="text-center mt-6" v-if="leaveData.reimbursement_request.user_id == user.userInfo.id">
        <el-button type="danger" v-if="leaveData.reimbursement_request.status != 3" @click="handleReimbCancel">撤销</el-button>
        <!-- <el-button type="primary" v-if="leaveData.steps.filter((item: any) => item.status == 1).length == 0" @click="handleUpdate">修改</el-button> -->
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
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
  width: 5rem;
  position: absolute;
  right: 0;
  top: 0;
}
.leave-form {
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}
.user-box {
  display: flex;
  flex-wrap: wrap;
  div {
    display: flex;
    align-items: center;
    padding: 6px;
    margin-right: 0.3rem;
    border-radius: 6px;
  }
  img {
    width: 2rem;
    height: 2rem;
    border-radius: 6px;
    margin-right: 6px;
  }
}
</style>
