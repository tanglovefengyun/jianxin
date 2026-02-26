<script lang="ts" setup>
import { appKeywords } from '@/constants/index'
import { ElMessage } from 'element-plus'
import type { UploadFile, FormInstance, FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
const route = useRoute()
const router = useRouter()

const chat = useChatStore()
const user = useUserStore()
const activeName = ref(1)
const activeReimbursementName = ref(1)
const activeTodoName = ref(1)
const ruleForm = reactive({
  leave_type: '',
  start_time: '',
  end_time: '',
  reason: '',
  file: []
})
const reimburseForm = reactive({
  reimbursement_type: '',
  date: '',
  money: '',
  reason: '',
  file: []
})
const todoForm = reactive<any>({
  describe: '',
  type: '',
  file: [],
  inform_user_id: []
})
const overtimeForm = reactive({
  start_time: '',
  end_time: '',
  reason: ''
})
const props = { multiple: true, label: 'name', value: 'id', children: 'data' }
const options = ref([])

const cities = ref([
  {
    value: 'Beijing',
    label: 'Beijing'
  },
  {
    value: 'Shanghai',
    label: 'Shanghai'
  },
  {
    value: 'Nanjing',
    label: 'Nanjing'
  },
  {
    value: 'Chengdu',
    label: 'Chengdu'
  },
  {
    value: 'Shenzhen',
    label: 'Shenzhen'
  },
  {
    value: 'Guangzhou',
    label: 'Guangzhou'
  }
])
const checkAll = ref(false)
const indeterminate = ref(false)
const tableDataParams = ref({
  page: 1,
  page_size: 17
})
const tableOvertimeDataParams = ref({
  page: 1,
  page_size: 17
})
const reimbursementApprovalListParams = ref({
  page: 1,
  page_size: 17
})
const reimbursementMyListParams = ref({
  page: 1,
  page_size: 17
})
const tableApproDataParams = ref({
  page: 1,
  page_size: 17,
  status: ''
})
const tableApproovertimerParams = ref({
  page: 1,
  page_size: 17
})
const loading = ref(false)
const approvalLoading = ref(false)
const ruleFormRef = ref()
const reimburseFormRef = ref()
const todoFormRef = ref()
const overtimeFormRef = ref()
const tableData = ref([])
const tableOvertimeData = ref([])
const approvaltableOvertimeData = ref([])
const approvalovertimeTotality = ref(0)
const overtimeTotality = ref(0)
const tableApproData = ref([])
const tableReimbursementMyList = ref([])
const tableReimbursementApprovalList = ref([])
const totality = ref(0)
const approTotality = ref(0)
const approovertimerTotality = ref(0)
const reimbursementApprovalListTotality = ref(0)
const reimbursementMyListTotality = ref(0)
const drawer = ref(false)
const type = ref('leave')
const leaveData = ref<any>({
  leave_request: {},
  cc_user: [],
  steps: []
})
const btnLoading = ref(false)
const showGroupTodoDialog = ref(false)
const handleLoading = ref(false)

async function handleSubmit(formEl: FormInstance) {
  if (!formEl) return
  await formEl.validate(async (valid: any, fields: any) => {
    if (valid) {
      const arr = ruleForm.file.map((item: any) => {
        return item.url
      })
      console.log(arr)
      if (route.query.leave_request_id) {
        await getOaLeaveUpdateApi({ ...ruleForm, file: arr, leave_request_id: route.query.leave_request_id }, user.getToken)
        router.replace({
          path: route.path, // 保持当前路径
          query: {} // 不带 done 参数的新 query
        })
      } else {
        await getOaLeaveRequestApi({ ...ruleForm, file: arr }, user.getToken)
      }
      chat.showTheFriendPanel = false
      ruleForm.leave_type = ''
      ruleForm.start_time = ''
      ruleForm.end_time = ''
      ruleForm.reason = ''
      ruleForm.file = []
      ElMessage.success('提交成功！')
    } else {
      console.log('error submit!', fields)
    }
  })
}
async function handleOvertimeSubmit(formEl: FormInstance) {
  if (!formEl) return
  await formEl.validate(async (valid: any, fields: any) => {
    if (valid) {
      // if (route.query.leave_request_id) {
      //   await getOaOvertimeUpdateApi({ ...overtimeForm, leave_request_id: route.query.leave_request_id }, user.getToken)
      //   router.replace({
      //     path: route.path, // 保持当前路径
      //     query: {} // 不带 done 参数的新 query
      //   })
      // } else {
      const res = await getOaOvertimeRequestApi({ ...overtimeForm }, user.getToken)
      // }
      if (res.code == 0) {
        chat.showTheFriendPanel = false
        overtimeForm.start_time = ''
        overtimeForm.end_time = ''
        overtimeForm.reason = ''
        ElMessage.success('提交成功！')
      }
    } else {
      console.log('error submit!', fields)
    }
  })
}
async function handleTodoSubmit(formEl: FormInstance) {
  if (!formEl) return
  handleLoading.value = true
  await formEl.validate(async (valid: any, fields: any) => {
    if (valid) {
      const arr = todoForm.file.map((item: any) => {
        return item.url
      })
      console.log(arr)
      const res = await getOaTodoSubmitApi({ ...todoForm, file: arr }, user.getToken)
      if (res.code == 0) {
        chat.showTheFriendPanel = false
        todoForm.describe = ''
        todoForm.file = []
        todoForm.inform_user_id = []
        ElMessage.success('提交成功！')
      }
      handleLoading.value = false
    } else {
      console.log('error submit!', fields)
      handleLoading.value = false
    }
  })
}
async function handleReimbursementSubmit(formEl: FormInstance) {
  if (!formEl) return
  await formEl.validate(async (valid: any, fields: any) => {
    if (valid) {
      const arr = reimburseForm.file.map((item: any) => {
        return item.url
      })
      console.log(arr)
      const res = await getOaReimbursementRequestApi({ ...reimburseForm, file: arr }, user.getToken)
      if (res.code == 0) {
        chat.showTheFriendPanel = false
        reimburseForm.reimbursement_type = ''
        reimburseForm.file = []
        reimburseForm.date = ''
        reimburseForm.money = ''
        reimburseForm.reason = ''
        ElMessage.success('提交成功！')
      }
    } else {
      console.log('error submit!', fields)
    }
  })
}
const todoRules = reactive({
  describe: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  type: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  inform_user_id: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ]
})
const rules = reactive({
  leaveType: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  leave_type: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  startTime: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  start_time: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  endTime: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  end_time: [
    { required: true, message: '请选择结束时间', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        const start = new Date(ruleForm.start_time)
        const end = new Date(value)
        if (end <= start) {
          return callback(new Error('结束时间必须大于开始时间'))
        }
        return callback()
      },
      trigger: 'change'
    }
  ],
  reason: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  duration: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  reimbursement_type: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  date: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ],
  money: [
    {
      required: true,
      message: '必填',
      trigger: 'change'
    }
  ]
})
useSeoMeta({
  title: '工作台 - 简信',
  description: '工作台 - 简信！',
  keywords: appKeywords
})
const theFriendOpt = computed({
  get: () => chat.theFriendOpt,
  set: (val) => {
    chat.theFriendOpt = val
  }
})
const { history, undo, clear } = useRefHistory(theFriendOpt, {
  deep: true,
  capacity: 10
})
async function clearHistory() {
  chat.showTheFriendPanel = false
  clear?.()
}
const isEmptyPanel = computed(() => chat.theFriendOpt.type !== FriendOptType.Empty)
const leaveInfo = ref<any>({
  leave_type: {},
  steps: [],
  cc_user: []
})
const overtimeInfo = ref<any>({
  steps: []
})
const reimbursemenInfo = ref<any>({
  reimbursement_type: {},
  steps: []
})
// 初始化请假
async function getAskForLeave() {
  getLeaveMyList()
  chat.setTheFriendOpt(1, {})
  const res = await getOaLeaveInitApi(user.getToken)
  console.log(res)
  leaveInfo.value = res.data
}
// 初始化加班
async function getAskForOvertime() {
  getOvertimeMyList()
  chat.setTheFriendOpt(3, {})
  const res = await getOaOvertimeInitApi(user.getToken)
  console.log(res)
  overtimeInfo.value = res.data
}
// 初始化报销
async function getAskForReimburse() {
  getReimbursementMyList()
  chat.setTheFriendOpt(4, {})
  const res = await getOaReimbursementInitApi(user.getToken)
  console.log(res)
  reimbursemenInfo.value = res.data
}
// 初始化待办
async function getAskForTodo() {
  getTodoList()
  chat.setTheFriendOpt(2, {})
}
function getTabs(e: any) {
  console.log(e)

  if (e == 1) {
    getLeaveMyList()
  } else if (e == 2) {
    getLeaveApprovalList()
  }
}
function getOvertimeTabs(e: any) {
  console.log(e)

  if (e == 1) {
    getOvertimeMyList()
  } else if (e == 2) {
    getOvertimeApprovalList()
  }
}
function getTabsReimbursement(e: any) {
  console.log(e)

  if (e == 1) {
    getReimbursementMyList()
  } else if (e == 2) {
    getReimbursementApprovalList()
  }
}
function getTodoTabs(e: any) {
  if (e == 1) {
    getTodoList()
  }
}

async function getLeaveApprovalList() {
  approvalLoading.value = true
  const res = await getOaLeaveApprovalListApi(tableApproDataParams.value, user.getToken)
  console.log(res)
  approvalLoading.value = false
  tableApproData.value = res.data.list
  approTotality.value = res.data.totality
}
async function getLeaveMyList() {
  loading.value = true
  const res = await getOaLeaveMyListApi(tableDataParams.value, user.getToken)
  console.log(res)
  loading.value = false
  tableData.value = res.data.list
  totality.value = res.data.totality
}
async function getOvertimeMyList() {
  loading.value = true
  const res = await getOaOvertimeMyListApi(tableOvertimeDataParams.value, user.getToken)
  console.log(res)
  loading.value = false
  tableOvertimeData.value = res.data.list
  overtimeTotality.value = res.data.totality
}
async function getReimbursementApprovalList() {
  loading.value = true
  const res = await getOaReimbursementApprovalListApi(reimbursementApprovalListParams.value, user.getToken)
  console.log(res)
  loading.value = false
  tableReimbursementApprovalList.value = res.data.list
  reimbursementApprovalListTotality.value = res.data.totality
}
async function getOvertimeApprovalList() {
  approvalLoading.value = true
  const res = await getOaOvertimeApprovalListApi(tableApproovertimerParams.value, user.getToken)
  console.log(res)
  approvalLoading.value = false
  approvaltableOvertimeData.value = res.data.list
  approvalovertimeTotality.value = res.data.totality
}
async function getReimbursementMyList() {
  loading.value = true
  const res = await getOaReimbursementMyListApi(reimbursementMyListParams.value, user.getToken)
  console.log(res)
  loading.value = false
  tableReimbursementMyList.value = res.data.list
  reimbursementMyListTotality.value = res.data.totality
}
const searchParams = ref({
  type: '',
  status: '',
  describe: '',
  start_date: '',
  end_date: '',
  page: 1,
  page_size: 17
})
const dateRange = ref([])
const todoList = ref([])
const todoTotal = ref(0)
async function getTodoList() {
  loading.value = true
  if (dateRange.value.length > 0) {
    searchParams.value.start_date = dateRange.value[0] || ''
    searchParams.value.end_date = dateRange.value[1] || ''
  }
  const res = await getOaTodoListApi(searchParams.value, user.getToken)
  console.log(dateRange.value)
  loading.value = false
  todoList.value = res.data.list
  todoTotal.value = res.data.totality
}
function resetSearch() {
  searchParams.value = {
    type: '',
    status: '',
    describe: '',
    start_date: '',
    end_date: '',
    page: 1,
    page_size: 17
  }
  dateRange.value = []
  getTodoList()
}
const isUploading = ref(false) // 上传状态标志
const pendingFiles = reactive<UploadFile[]>([]) // 明确类型为 UploadFile[]
const uploadTimeout = ref() // 防抖定时器类型

// 处理文件变化
function handleFileChange(file: UploadFile, fileList: any) {
  if (chat.theFriendOpt.type == 1) {
    ruleForm.file = fileList // 更新文件列表
  } else if (chat.theFriendOpt.type == 2) {
    todoForm.file = fileList // 更新文件列表
  } else if (chat.theFriendOpt.type == 4) {
    reimburseForm.file = fileList // 更新文件列表
  }

  // 检查文件是否已存在（通过文件名称和大小去重）
  const isFileExist = pendingFiles.some((existingFile: any) => existingFile.name === file.name && existingFile.size === file.size)
  if (!isFileExist) {
    pendingFiles.push(file) // 只有不存在时才添加
  }
}
function preloadImages(urls: string[]) {
  if (chat.theFriendOpt.type == 1) {
    ruleForm.file = urls.map(
      (url, index) =>
        ({
          name: `image-${index}`,
          url,
          uid: Date.now() + index // 手动生成 uid
        } as UploadFile)
    ) as any
  } else if (chat.theFriendOpt.type == 2) {
    todoForm.file = urls.map(
      (url, index) =>
        ({
          name: `image-${index}`,
          url,
          uid: Date.now() + index // 手动生成 uid
        } as UploadFile)
    ) as any
  } else if (chat.theFriendOpt.type == 4) {
    reimburseForm.file = urls.map(
      (url, index) =>
        ({
          name: url.split('/').pop(),
          url,
          uid: Date.now() + index // 手动生成 uid
        } as UploadFile)
    ) as any
  }
}
// 自定义上传逻辑
async function customUpload() {
  // 如果正在上传，直接返回
  if (isUploading.value) {
    return Promise.resolve()
  }

  // 清空之前的定时器
  if (uploadTimeout.value) {
    clearTimeout(uploadTimeout.value)
  }

  // 防抖：等待 300ms，确保所有文件都添加到 pendingFiles
  uploadTimeout.value = setTimeout(async () => {
    if (pendingFiles.length === 0) {
      return
    }

    isUploading.value = true // 标记为上传中

    const formData = new FormData()
    pendingFiles.forEach((fileWrapper: any) => {
      formData.append('files[]', fileWrapper.raw) // 添加文件到 FormData
    })

    try {
      const res = await getUploadFileApi(formData, user.getToken)
      ElMessage.success('上传成功')
      console.log(res.data)
      preloadImages(res.data.file_url) // 清空文件列表
    } catch (err) {
      ElMessage.error('上传失败')
      console.error(err)
    } finally {
      isUploading.value = false // 恢复上传状态
      uploadTimeout.value = null // 重置定时器
    }
  }, 300) // 300ms 防抖
}
const leaveTypes = [
  '', // 占位，索引从1开始
  '事假', // 1
  '产检假', // 2
  '病假', // 3
  '年假', // 4
  '产假', // 5
  '陪产假', // 6
  '婚假', // 7
  '丧假', // 8
  '哺乳假' // 9
]
const reimbTypes = ['', '部门活动经费', '办公费', '交通费', '招待费', '差旅', '其他支出']
const mapData = ref<any>({})
async function getLeaveDetails(row: any, fields: string) {
  console.log(row[fields])

  mapData.value = row
  type.value = 'leave'
  drawer.value = false // 强制先关闭，触发销毁
  await nextTick()
  drawer.value = true // 再重新打开
  btnLoading.value = true
  try {
    const res = await getOaLeaveDetailApi({ leave_request_id: row[fields] }, user.getToken)
    leaveData.value = res.data
    btnLoading.value = false
  } catch (error) {
    btnLoading.value = false
    drawer.value = false
  }
}
async function getReimbDetails(row: any, fields: string) {
  leaveData.value = {
    reimbursement_request: {},
    steps: []
  }
  mapData.value = row
  type.value = 'reimb'
  drawer.value = false // 强制先关闭，触发销毁
  await nextTick()
  drawer.value = true // 再重新打开
  btnLoading.value = true
  try {
    const res = await getOaReimbursementDetailApi({ reimbursement_request_id: row[fields] }, user.getToken)
    leaveData.value = res.data
    btnLoading.value = false
  } catch (error) {
    btnLoading.value = false
    drawer.value = false
  }
}
async function getOvertimeDetails(row: any, fields: string) {
  leaveData.value = {
    overtime_request: {},
    steps: []
  }
  mapData.value = row
  type.value = 'overtime'
  drawer.value = false // 强制先关闭，触发销毁
  await nextTick()
  drawer.value = true // 再重新打开
  btnLoading.value = true
  try {
    const res = await getOaOvertimeDetailApi({ overtime_request_id: row[fields] }, user.getToken)
    leaveData.value = res.data
    btnLoading.value = false
  } catch (error) {
    btnLoading.value = false
    drawer.value = false
  }
}
async function getTodoDetails(row: any) {
  mapData.value = row
  type.value = 'todo'
  drawer.value = false // 强制先关闭，触发销毁
  await nextTick()
  drawer.value = true // 再重新打开
  btnLoading.value = true
  try {
    const res = await getOaTodoDetailApi({ todo_id: row.id }, user.getToken)
    leaveData.value = res.data
    btnLoading.value = false
  } catch (error) {
    btnLoading.value = false
    drawer.value = false
  }
}

async function getAgree(status: number) {
  if (status === 1) {
    if (type.value == 'leave') {
      // 同意
      try {
        const res = await getOaLeaveApprovalApi({ leave_request_id: mapData.value.leave_request_id, status, remark: '' }, user.getToken)
        if (res.code == 0) {
          ElMessage.success('已同意！')
          drawer.value = false
        }
      } catch (error) {}
    } else if (type.value == 'reimb') {
      try {
        const res = await getOaReimbursementApprovalApi({ reimbursement_request_id: mapData.value.reimbursement_request_id, status, remark: '' }, user.getToken)
        if (res.code == 0) {
          ElMessage.success('已同意！')
          drawer.value = false
        }
      } catch (error) {}
    }
  } else if (status === 2) {
    // 拒绝
    if (type.value == 'leave') {
      ElMessageBox.prompt('请输入拒绝原因: ', '拒绝', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea'
      })
        .then(async ({ value }) => {
          const res = await getOaLeaveApprovalApi({ leave_request_id: mapData.value.leave_request_id, status, remark: value }, user.getToken)
          // await getOaLeaveApprovalApi({ leave_request_id: mapData.value.leave_request_id, status, remark: value }, user.getToken)
          if (res.code == 0) {
            ElMessage.success('已拒绝！')
            drawer.value = false
          }
        })
        .catch(() => {})
    } else if (type.value == 'reimb') {
      ElMessageBox.prompt('请输入拒绝原因: ', '拒绝', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea'
      })
        .then(async ({ value }) => {
          const res = await getOaReimbursementApprovalApi({ reimbursement_request_id: mapData.value.reimbursement_request_id, status, remark: value }, user.getToken)
          if (res.code == 0) {
            ElMessage.success('已拒绝！')
            drawer.value = false
          }
        })
        .catch(() => {})
    }
  } else if (status === 3) {
    // 完成待办
    showGroupTodoDialog.value = true
  } else if (status === 4) {
    ElMessageBox.confirm('是否确认撤销待办？', '撤销待办', {
      confirmButtonText: '确认',
      confirmButtonClass: 'el-button--danger',
      lockScroll: false,
      center: true,
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      await getOaTodoDoneApi({ todo_id: mapData.value.id, status: 2, remark: '' }, user.getToken)
      ElMessage.success('已撤销！')
      drawer.value = false
    })
  }
}
async function onSubmitGroupTodoMsg(formData: any) {
  await getOaTodoDoneApi({ todo_id: mapData.value.id, status: 1, remark: formData.describe, finish_file: formData.file.map((item: any) => item.url) }, user.getToken)
  ElMessage.success('已完成！')
  drawer.value = false
}
watch(
  () => todoForm.inform_user_id,
  (val: any) => {
    console.log(val)

    if (val.length === 0) {
      checkAll.value = false
      indeterminate.value = false
    } else if (val.length === cities.value.length) {
      checkAll.value = true
      indeterminate.value = false
    } else {
      indeterminate.value = true
    }
  },
  { deep: true }
)

function handleCheckAll(val: any) {
  indeterminate.value = false
  if (val) {
    todoForm.inform_user_id = cities.value.map((_) => _.value)
  } else {
    todoForm.inform_user_id = []
  }
}

function onCascaderChange(e: any) {
  // 取出每组的最后一个值
  todoForm.inform_user_id = e.map((v: any) => v.at(-1))
}
const disabledHours = () => {
  return [0] // 禁用0点
}

const disabledMinutes = (hour: any) => {
  if (hour === 0) {
    // 如果是0点，禁用所有分钟选项
    return Array.from({ length: 60 }, (_, i) => i)
  }
  return []
}
const defaultTime = new Date(2000, 1, 1, 18, 0, 0) // 只需要时间部分会被使用
onMounted(async () => {
  if (route.query.leave_request_id) {
    chat.setTheFriendOpt(1, {})
    await getAskForLeave()
    const res = await getOaLeaveDetailApi({ leave_request_id: route.query.leave_request_id }, user.getToken)
    console.log(res)
    ruleForm.leave_type = String(res.data.leave_request.leave_type)
    ruleForm.reason = res.data.leave_request.reason
    ruleForm.end_time = res.data.leave_request.end_time
    ruleForm.start_time = res.data.leave_request.start_time
    ruleForm.file = res.data.leave_request.file
  }
  const res = await getCompanyUserLinkageApi(user.getToken)
  console.log(res)
  options.value = res.data
})
</script>

<template>
  <div class="h-full w-full flex flex-1 main">
    <div class="w-full transition-all sm:(relative mx-auto w-420px border-default-r p-0) main-opertion-box">
      <h3 flex items-center pb-6>
        工作台
        <i i-solar:widget-bold ml-2 inline-block p0.6em opacity-60 hover:animate-spin />
      </h3>
      <label class="title">假勤管理</label>
      <div id="theme" class="box">
        <ul>
          <li class="border-default !hover:bg-[#f8f8f8] !dark:hover:bg-[#151515]" @click="getAskForLeave">
            <el-badge :value="parseInt(user.getUnprocessedLeave)" :hidden="!parseInt(user.getUnprocessedLeave)" :offset="[25, -10]" :max="99">
              <div class="icon-box icon-color-red">
                <i i-solar:clock-circle-bold ml-2 inline-block p0.6em />
              </div>
              请假
            </el-badge>
          </li>

          <li class="border-default !hover:bg-[#f8f8f8] !dark:hover:bg-[#151515]" @click="getAskForTodo">
            <el-badge :value="parseInt(user.getUnprocessedTodo)" :hidden="!parseInt(user.getUnprocessedTodo)" :offset="[25, -10]" :max="99">
              <div class="icon-box icon-color-orgin">
                <i i-solar:suitcase-bold ml-2 inline-block p0.6em />
              </div>
              待办
            </el-badge>
          </li>
          <li class="border-default !hover:bg-[#f8f8f8] !dark:hover:bg-[#151515]" @click="getAskForOvertime">
            <el-badge :value="parseInt(user.getUnprocessedOvertime)" :hidden="!parseInt(user.getUnprocessedOvertime)" :offset="[25, -10]" :max="99">
              <div class="icon-box icon-color-overtime">
                <i i-solar:lamp-bold-duotone ml-2 inline-block p0.6em />
              </div>
              加班
            </el-badge>
          </li>
        </ul>
      </div>
      <label class="title">人事管理</label>
      <div id="theme" class="box">
        <ul>
          <li class="border-default !hover:bg-[#f8f8f8] !dark:hover:bg-[#151515]" @click="getAskForReimburse">
            <el-badge :value="parseInt(user.getUnprocessedReimb)" :hidden="!parseInt(user.getUnprocessedReimb)" :offset="[25, -10]" :max="99">
              <div class="icon-box icon-color-orgin">
                <i i-solar:wallet-bold ml-2 inline-block p0.6em />
              </div>
              报销
            </el-badge>
          </li>
        </ul>
      </div>
    </div>
    <div
      class="bg z-1 h-full flex-1 flex-shrink-0 flex-col bg-color-3 sm:card-bg-color-2"
      :class="chat.showTheFriendPanel ? 'flex absolute sm:(p-0 relative) left-0 w-full' : 'hidden sm:flex'"
    >
      <!-- 请假 -->
      <template v-if="isEmptyPanel && chat.theFriendOpt.type == 1">
        <!-- <div
          class="i-solar:alt-arrow-left-line-duotone absolute right-18 top-6 z-1000 hidden p-2.6 sm:right-14 sm:top-11 sm:block btn-danger"
          title="关闭"
          @click="undo()"
        /> -->
        <div class="i-carbon:close absolute right-6 top-6 z-1000 block scale-110 p-2.6 sm:right-3 sm:top-11 btn-danger" title="关闭" @click="clearHistory" />
        <!-- 面板 -->
        <Transition name="page-fade" mode="out-in" appear>
          <el-tabs v-model="activeName" class="demo-tabs" @tab-change="getTabs">
            <el-tab-pane label="我发起的" :name="1">
              <el-table :data="tableData" stripe style="width: 100%" v-loading="loading" @row-click="getLeaveDetails($event, 'id')">
                <el-table-column prop="start_time" label="开始时间" width="180" align="center" />
                <el-table-column prop="end_time" label="结束时间" width="180" align="center" />
                <el-table-column prop="leave_type" label="请假类型" align="center">
                  <template #default="{ row }">
                    <span>{{ leaveTypes[row.leave_type] }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="请假事由" align="center" />
                <!-- <el-table-column prop="file" label="图片" align="center" /> -->
                <el-table-column prop="status" label="状态" align="center">
                  <template #default="{ row }">
                    <el-tag type="primary" v-if="row.status == 0">待审批</el-tag>
                    <el-tag type="success" v-else-if="row.status == 1">已审批</el-tag>
                    <el-tag type="danger" v-else-if="row.status == 2">已拒绝</el-tag>
                    <el-tag type="warning" v-else-if="row.status == 3">已撤销</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="创建时间" width="180" align="center" />
              </el-table>
              <br />
              <el-pagination
                v-model:current-page="tableDataParams.page"
                :page-size="tableDataParams.page_size"
                layout="total, prev, pager, next"
                :total="totality"
                @current-change="getLeaveMyList"
              />
            </el-tab-pane>
            <el-tab-pane label="审批记录" :name="2">
              <el-form :inline="true">
                <el-form-item label="状态">
                  <el-select style="width: 200px" v-model="tableApproDataParams.status" filterable placeholder="请选择状态">
                    <el-option label="待审批" :value="0" />
                    <el-option label="已审批" :value="1" />
                    <el-option label="已拒绝" :value="2" />
                    <el-option label="已撤销" :value="3" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :icon="Search" plain @click="getLeaveApprovalList">搜索</el-button>
                  <el-button
                    type="danger"
                    :icon="Refresh"
                    plain
                    @click="
                      () => {
                        tableApproDataParams.status = ''
                        tableApproDataParams.page = 1
                        tableApproDataParams.page_size = 17
                        getLeaveApprovalList()
                      }
                    "
                    >重置</el-button
                  >
                </el-form-item>
              </el-form>
              <br />
              <el-table :data="tableApproData" stripe style="width: 100%" v-loading="approvalLoading" @row-click="getLeaveDetails($event, 'leave_request_id')">
                <el-table-column prop="nickname" label="发起人" align="center" />
                <el-table-column prop="start_time" label="开始时间" width="160" align="center" />
                <el-table-column prop="end_time" label="结束时间" width="160" align="center" />
                <el-table-column prop="leave_type" label="请假类型" align="center">
                  <template #default="{ row }">
                    <span>{{ leaveTypes[row.leave_type] }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="请假事由" align="center" />
                <!-- <el-table-column prop="file" label="图片" align="center" /> -->
                <el-table-column prop="status" label="状态" align="center">
                  <template #default="{ row }">
                    <el-tag type="primary" v-if="row.status == 0">待审批</el-tag>
                    <el-tag type="success" v-else-if="row.status == 1">已审批</el-tag>
                    <el-tag type="danger" v-else-if="row.status == 2">已拒绝</el-tag>
                    <el-tag type="warning" v-else-if="row.status == 3">已撤销</el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <br />
              <el-pagination
                v-model:current-page="tableApproDataParams.page"
                :page-size="tableApproDataParams.page_size"
                layout="total, prev, pager, next"
                :total="approTotality"
                @current-change="getLeaveApprovalList"
              />
            </el-tab-pane>
            <el-tab-pane label="发起审批" :name="3">
              <div class="leave-form p-4">
                <h2>请假流程</h2>
                <el-form label-width="80px" class="leave-form-wrapper" ref="ruleFormRef" :model="ruleForm" :rules="rules">
                  <el-form-item label="请假类型" prop="leave_type">
                    <el-select v-model="ruleForm.leave_type" placeholder="请选择类型">
                      <el-option v-for="(value, key) in leaveInfo.leave_type" :key="key" :label="value" :value="key" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="开始时间" prop="start_time">
                    <el-date-picker
                      v-model="ruleForm.start_time"
                      type="datetime"
                      placeholder="请选择开始时间"
                      style="width: 100%"
                      format="YYYY-MM-DD HH:mm"
                      value-format="YYYY-MM-DD HH:mm"
                    />
                  </el-form-item>

                  <el-form-item label="结束时间" prop="end_time">
                    <el-date-picker
                      v-model="ruleForm.end_time"
                      type="datetime"
                      placeholder="请选择结束时间"
                      style="width: 100%"
                      format="YYYY-MM-DD HH:mm"
                      value-format="YYYY-MM-DD HH:mm"
                      :disabled-hours="disabledHours"
                      :disabled-minutes="disabledMinutes"
                      :default-time="defaultTime"
                    />
                  </el-form-item>

                  <!-- <el-form-item label="请假时长" prop="duration">
                <el-input v-model="ruleForm.duration" placeholder="请输入请假时长（小时）" disabled />
              </el-form-item> -->

                  <el-form-item label="请假事由" prop="reason">
                    <el-input v-model="ruleForm.reason" type="textarea" placeholder="请填写请假原因" :rows="3" />
                  </el-form-item>

                  <el-form-item label="图片上传">
                    <el-upload
                      v-model:file-list="ruleForm.file"
                      multiple
                      :limit="9"
                      :auto-upload="true"
                      :http-request="customUpload"
                      :on-change="handleFileChange"
                      :show-file-list="true"
                      list-type="picture-card"
                    >
                      <el-icon><Plus /></el-icon>
                    </el-upload>
                  </el-form-item>

                  <el-divider class="approval-divider">审批流程</el-divider>
                  <div style="height: 240px; width: 100%">
                    <el-steps v-if="leaveInfo.steps.length > 0" align-center direction="vertical">
                      <el-step v-for="(item, index) in leaveInfo.steps" :key="item.id">
                        <template #title>
                          <div class="w-full flex justify-between">
                            <div>
                              第{{ index + 1 }}级审批人
                              <!-- <p class="smail-size text-gray-500">1个主管审批</p> -->
                            </div>
                            <div class="approval-user">
                              <img class="mb-2 h-8 w-8" :src="item.portrait" alt="" />
                              <p class="smail-size text-gray-500">{{ item.nickname }}</p>
                            </div>
                          </div>
                        </template>
                      </el-step>
                      <!-- <el-step>
                    <template #title>
                      <div class="w-full flex justify-between">
                        <div>
                          审批人
                          <p class="smail-size text-gray-500">1个审批</p>
                        </div>
                        <div class="approval-user">
                          <img class="mb-2 h-8 w-8" src="https://msgapi.llxads.com/uploads/6/portrait/56c4716b-a27f-47c2-84fa-be5234763f3b.jpg" alt="" />
                          <p class="smail-size text-gray-500">李望</p>
                        </div>
                      </div>
                    </template>
                  </el-step> -->
                      <el-step :key="'cc_user'">
                        <template #title>
                          <div class="w-full flex justify-between">
                            <div>
                              抄送人
                              <p class="smail-size text-gray-500">抄送1人</p>
                            </div>
                            <div class="flex items-center flex-wrap">
                              <template v-for="(user, index) in leaveInfo.cc_user" :key="user.id">
                                <div class="flex items-center">
                                  <!-- 用户头像 -->
                                  <div class="approval-user text-center">
                                    <img class="h-8 w-8 rounded-full mb-1 border" :src="user.user.portrait" alt="" />
                                    <p class="text-xs text-gray-500">{{ user.user.nickname }}</p>
                                  </div>
                                  <!-- +号（非最后一个才显示） -->
                                  <span v-if="index !== 3 - 1" class="mx-1 text-lg font-bold text-gray-400 flex items-center"> + </span>
                                </div>
                              </template>

                              <!-- 添加按钮 -->
                              <div class="approval-user add-user-btn text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a]">
                                <div class="h-8 w-8 rounded-6px border border-dashed border-gray-400 flex items-center justify-center text-gray-500 text-lg mb-1"> + </div>
                                <p class="text-xs text-gray-500">添加</p>
                              </div>
                            </div>
                          </div>
                        </template>
                      </el-step>
                    </el-steps>
                  </div>
                  <div class="text-center mt-6">
                    <el-button type="primary" @click="handleSubmit(ruleFormRef)">提交</el-button>
                  </div>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </Transition>
      </template>
      <!-- 待办 -->
      <template v-else-if="isEmptyPanel && chat.theFriendOpt.type == 2">
        <div class="i-carbon:close absolute right-6 top-6 z-1000 block scale-110 p-2.6 sm:right-3 sm:top-11 btn-danger" title="关闭" @click="clearHistory" />
        <!-- 面板 -->
        <Transition name="page-fade" mode="out-in" appear>
          <el-tabs v-model="activeTodoName" class="demo-tabs" @tab-change="getTodoTabs">
            <el-tab-pane label="待办记录" :name="1">
              <el-form :inline="true">
                <el-form-item label="类型">
                  <el-select style="width: 200px" v-model="searchParams.type" filterable placeholder="请选择类型">
                    <el-option label="通知" :value="0" />
                    <el-option label="充值" :value="1" />
                    <el-option label="开户" :value="2" />
                    <el-option label="冻卡" :value="3" />
                    <el-option label="退款" :value="4" />
                    <el-option label="收款确认" :value="5" />
                    <el-option label="打款" :value="6" />
                  </el-select>
                </el-form-item>
                <el-form-item label="状态">
                  <el-select style="width: 200px" v-model="searchParams.status" filterable placeholder="请选择状态">
                    <el-option label="待完成" :value="0" />
                    <el-option label="已完成" :value="1" />
                    <el-option label="已撤销" :value="2" />
                  </el-select>
                </el-form-item>
                <el-form-item label="描述">
                  <el-input placeholder="请输入描述" v-model="searchParams.describe" clearable style="width: 200px" @keyup.enter.native="getTodoList"></el-input>
                </el-form-item>
                <el-form-item label="完成日期">
                  <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" range-separator="至" end-placeholder="结束日期" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :icon="Search" plain @click="getTodoList">搜索</el-button>
                  <el-button type="danger" :icon="Refresh" plain @click="resetSearch">重置</el-button>
                </el-form-item>
              </el-form>
              <br />
              <el-table :data="todoList" stripe style="width: 100%" v-loading="loading" @row-click="getTodoDetails($event)">
                <el-table-column prop="user[nickname]" label="发起人" align="center" />
                <el-table-column prop="type" label="待办类型" align="center">
                  <template #default="{ row }">
                    <el-tag type="primary">{{
                      row.type == 0
                        ? '通知'
                        : row.type == 1
                        ? '充值'
                        : row.type == 2
                        ? '开户'
                        : row.type == 3
                        ? '冻卡'
                        : row.type == 4
                        ? '退款'
                        : row.type == 5
                        ? '收款确认'
                        : row.type == 6
                        ? '打款'
                        : '未知类型'
                    }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="describe" label="待办事项" align="center" />
                <el-table-column prop="done[nickname]" label="完成人" align="center" />
                <el-table-column prop="created_at" label="发起时间" width="160" align="center" />
                <el-table-column prop="finish_at" label="完成时间" width="160" align="center" />
                <!-- <el-table-column prop="file" label="图片" align="center" /> -->
                <el-table-column prop="status" label="状态" align="center">
                  <template #default="{ row }">
                    <el-tag type="primary" v-if="row.status == 0">待完成</el-tag>
                    <el-tag type="success" v-else-if="row.status == 1">已完成</el-tag>
                    <el-tag type="warning" v-else-if="row.status == 2">已撤销</el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <br />
              <el-pagination
                v-model:current-page="searchParams.page"
                :page-size="searchParams.page_size"
                layout="total, prev, pager, next"
                :total="todoTotal"
                @current-change="getTodoList"
              />
            </el-tab-pane>
            <el-tab-pane label="发起待办" :name="2">
              <div class="leave-form p-4">
                <h2>待办流程</h2>
                <el-form label-width="80px" class="leave-form-wrapper" ref="todoFormRef" :model="todoForm" :rules="todoRules">
                  <!-- <el-form-item label="费用发生日期" prop="startTime">
                    <el-date-picker v-model="reimburseForm.startTime" type="date" placeholder="请选择日期" style="width: 100%" />
                  </el-form-item> -->

                  <el-form-item label="待办类型" prop="type">
                    <el-select v-model="todoForm.type" placeholder="请选择待办类型">
                      <el-option label="通知" value="0" />
                      <el-option label="充值" value="1" />
                      <el-option label="开户" value="2" />
                      <el-option label="冻卡" value="3" />
                      <el-option label="退款" value="4" />
                      <el-option label="收款确认" value="5" />
                      <el-option label="打款" value="6" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="待办事项" prop="describe">
                    <el-input v-model="todoForm.describe" type="textarea" placeholder="请填写待办事项" :rows="3" />
                  </el-form-item>

                  <el-form-item label="图片上传">
                    <el-upload
                      v-model:file-list="todoForm.file"
                      multiple
                      :limit="9"
                      :auto-upload="true"
                      :http-request="customUpload"
                      :on-change="handleFileChange"
                      :show-file-list="true"
                      list-type="picture-card"
                    >
                      <el-icon><Plus /></el-icon>
                    </el-upload>
                  </el-form-item>
                  <el-form-item label="通知用户" prop="inform_user_id">
                    <!-- <el-select
                      v-model="todoForm.inform_user_id"
                      multiple
                      clearable
                      collapse-tags
                      placeholder="请选择通知人员"
                      popper-class="custom-header"
                      :max-collapse-tags="6"
                      tag-type="primary"
                      filterable
                    >
                      <template #header>
                        <el-checkbox v-model="checkAll" :indeterminate="indeterminate" @change="handleCheckAll"> All </el-checkbox>
                      </template>
                      <el-option v-for="item in cities" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select> -->
                    <el-cascader
                      v-model="todoForm.inform_user_id"
                      style="width: 100%"
                      :options="options"
                      filterable
                      :props="props"
                      collapse-tags
                      :max-collapse-tags="6"
                      clearable
                      tag-type="primary"
                      @change="onCascaderChange"
                    />
                  </el-form-item>
                  <div class="text-center mt-6">
                    <el-button type="primary" :loading="handleLoading" @click="handleTodoSubmit(todoFormRef)">提交</el-button>
                  </div>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </Transition>
      </template>
      <!-- 加班 -->
      <template v-else-if="isEmptyPanel && chat.theFriendOpt.type == 3">
        <!-- <div
          class="i-solar:alt-arrow-left-line-duotone absolute right-18 top-6 z-1000 hidden p-2.6 sm:right-14 sm:top-11 sm:block btn-danger"
          title="关闭"
          @click="undo()"
        /> -->
        <div class="i-carbon:close absolute right-6 top-6 z-1000 block scale-110 p-2.6 sm:right-3 sm:top-11 btn-danger" title="关闭" @click="clearHistory" />
        <!-- 面板 -->
        <Transition name="page-fade" mode="out-in" appear>
          <el-tabs v-model="activeName" class="demo-tabs" @tab-change="getOvertimeTabs">
            <el-tab-pane label="我发起的" :name="1">
              <el-table :data="tableOvertimeData" stripe style="width: 100%" v-loading="loading" @row-click="getOvertimeDetails($event, 'id')">
                <el-table-column prop="start_time" label="开始时间" width="180" align="center" />
                <el-table-column prop="end_time" label="结束时间" width="180" align="center" />
                <el-table-column prop="reason" label="加班事由" align="center" />
                <!-- <el-table-column prop="file" label="图片" align="center" /> -->
                <el-table-column prop="status" label="状态" align="center">
                  <template #default="{ row }">
                    <el-tag type="primary" v-if="row.status == 0">待审批</el-tag>
                    <el-tag type="success" v-else-if="row.status == 1">已审批</el-tag>
                    <el-tag type="danger" v-else-if="row.status == 2">已拒绝</el-tag>
                    <el-tag type="warning" v-else-if="row.status == 3">已撤销</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="created_at" label="创建时间" width="180" align="center" />
              </el-table>
              <br />
              <el-pagination
                v-model:current-page="tableOvertimeDataParams.page"
                :page-size="tableOvertimeDataParams.page_size"
                layout="total, prev, pager, next"
                :total="overtimeTotality"
                @current-change="getOvertimeMyList"
              />
            </el-tab-pane>
            <el-tab-pane label="审批记录" :name="2">
              <el-table :data="approvaltableOvertimeData" stripe style="width: 100%" v-loading="approvalLoading" @row-click="getOvertimeDetails($event, 'overtime_request_id')">
                <el-table-column prop="nickname" label="发起人" align="center" />
                <el-table-column prop="start_time" label="开始时间" width="160" align="center" />
                <el-table-column prop="end_time" label="结束时间" width="160" align="center" />
                <el-table-column prop="reason" label="加班事由" align="center" />
                <!-- <el-table-column prop="file" label="图片" align="center" /> -->
                <el-table-column prop="status" label="状态" align="center">
                  <template #default="{ row }">
                    <el-tag type="primary" v-if="row.status == 0">待审批</el-tag>
                    <el-tag type="success" v-else-if="row.status == 1">已审批</el-tag>
                    <el-tag type="danger" v-else-if="row.status == 2">已拒绝</el-tag>
                    <el-tag type="warning" v-else-if="row.status == 3">已撤销</el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <br />
              <el-pagination
                v-model:current-page="tableApproovertimerParams.page"
                :page-size="tableApproovertimerParams.page_size"
                layout="total, prev, pager, next"
                :total="approvalovertimeTotality"
                @current-change="getOvertimeApprovalList"
              />
            </el-tab-pane>
            <el-tab-pane label="发起审批" :name="3">
              <div class="leave-form p-4">
                <h2>加班流程</h2>
                <el-form label-width="80px" class="leave-form-wrapper" ref="overtimeFormRef" :model="overtimeForm" :rules="rules">
                  <el-form-item label="开始时间" prop="start_time">
                    <el-date-picker
                      v-model="overtimeForm.start_time"
                      type="datetime"
                      placeholder="请选择开始时间"
                      style="width: 100%"
                      format="YYYY-MM-DD HH:mm"
                      value-format="YYYY-MM-DD HH:mm"
                    />
                  </el-form-item>

                  <el-form-item label="结束时间" prop="end_time">
                    <el-date-picker
                      v-model="overtimeForm.end_time"
                      type="datetime"
                      placeholder="请选择结束时间"
                      style="width: 100%"
                      format="YYYY-MM-DD HH:mm"
                      value-format="YYYY-MM-DD HH:mm"
                      :disabled-hours="disabledHours"
                      :disabled-minutes="disabledMinutes"
                      :default-time="defaultTime"
                    />
                  </el-form-item>

                  <el-form-item label="加班原因" prop="reason">
                    <el-input v-model="overtimeForm.reason" type="textarea" placeholder="请填写加班原因" :rows="3" />
                  </el-form-item>

                  <el-divider class="approval-divider">审批流程</el-divider>
                  <div style="height: 240px; width: 100%">
                    <el-steps v-if="overtimeInfo.steps.length > 0" align-center direction="vertical">
                      <el-step v-for="(item, index) in overtimeInfo.steps" :key="item.id">
                        <template #title>
                          <div class="w-full flex justify-between">
                            <div>
                              第{{ index + 1 }}级审批人
                              <!-- <p class="smail-size text-gray-500">1个主管审批</p> -->
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
                  <div class="text-center mt-6">
                    <el-button type="primary" @click="handleOvertimeSubmit(overtimeFormRef)">提交</el-button>
                  </div>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </Transition>
      </template>
      <!-- 报销 -->
      <template v-else-if="isEmptyPanel && chat.theFriendOpt.type == 4">
        <!-- <div
          class="i-solar:alt-arrow-left-line-duotone absolute right-18 top-6 z-1000 hidden p-2.6 sm:right-14 sm:top-11 sm:block btn-danger"
          title="关闭"
          @click="undo()"
        /> -->
        <div class="i-carbon:close absolute right-6 top-6 z-1000 block scale-110 p-2.6 sm:right-3 sm:top-11 btn-danger" title="关闭" @click="clearHistory" />
        <!-- 面板 -->
        <Transition name="page-fade" mode="out-in" appear>
          <el-tabs v-model="activeReimbursementName" class="demo-tabs" @tab-change="getTabsReimbursement">
            <el-tab-pane label="我发起的" :name="1">
              <el-table :data="tableReimbursementMyList" stripe style="width: 100%" v-loading="loading" @row-click="getReimbDetails($event, 'id')">
                <el-table-column prop="date" label="费用日期" width="160" align="center" />
                <el-table-column prop="money" label="报销金额" width="160" align="center" />
                <el-table-column prop="reimbursement_type" label="费用类型" align="center">
                  <template #default="{ row }">
                    <span>{{ reimbTypes[row.reimbursement_type] }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="费用说明" align="center" />
                <!-- <el-table-column prop="file" label="图片" align="center" /> -->
                <el-table-column prop="status" label="状态" align="center">
                  <template #default="{ row }">
                    <el-tag type="primary" v-if="row.status == 0">待审批</el-tag>
                    <el-tag type="success" v-else-if="row.status == 1">已审批</el-tag>
                    <el-tag type="danger" v-else-if="row.status == 2">已拒绝</el-tag>
                    <el-tag type="warning" v-else-if="row.status == 3">已撤销</el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <br />
              <el-pagination
                v-model:current-page="reimbursementMyListParams.page"
                :page-size="reimbursementMyListParams.page_size"
                layout="total, prev, pager, next"
                :total="reimbursementMyListTotality"
                @current-change="getLeaveMyList"
              />
            </el-tab-pane>
            <el-tab-pane label="审批记录" :name="2">
              <el-table :data="tableReimbursementApprovalList" stripe style="width: 100%" v-loading="loading" @row-click="getReimbDetails($event, 'reimbursement_request_id')">
                <el-table-column prop="nickname" label="发起人" align="center" />
                <el-table-column prop="date" label="费用日期" width="160" align="center" />
                <el-table-column prop="money" label="报销金额" width="160" align="center" />
                <el-table-column prop="reimbursement_type" label="费用类型" align="center">
                  <template #default="{ row }">
                    <span>{{ reimbTypes[row.reimbursement_type] }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="费用说明" align="center" />
                <!-- <el-table-column prop="file" label="图片" align="center" /> -->
                <el-table-column prop="status" label="状态" align="center">
                  <template #default="{ row }">
                    <el-tag type="primary" v-if="row.status == 0">待审批</el-tag>
                    <el-tag type="success" v-else-if="row.status == 1">已审批</el-tag>
                    <el-tag type="danger" v-else-if="row.status == 2">已拒绝</el-tag>
                    <el-tag type="warning" v-else-if="row.status == 3">已撤销</el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <br />
              <el-pagination
                v-model:current-page="reimbursementApprovalListParams.page"
                :page-size="reimbursementApprovalListParams.page_size"
                layout="total, prev, pager, next"
                :total="reimbursementApprovalListTotality"
                @current-change="getReimbursementApprovalList"
              />
            </el-tab-pane>
            <el-tab-pane label="发起审批" :name="3">
              <div class="leave-form p-4">
                <h2>报销流程</h2>
                <el-form label-width="120px" class="leave-form-wrapper" ref="reimburseFormRef" :model="reimburseForm" :rules="rules">
                  <el-form-item label="报销金额" prop="money">
                    <el-input v-model="reimburseForm.money" placeholder="请输入报销金额" />
                  </el-form-item>

                  <el-form-item label="费用发生日期" prop="date">
                    <el-date-picker v-model="reimburseForm.date" type="date" placeholder="请选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
                  </el-form-item>

                  <el-form-item label="费用类型" prop="reimbursement_type">
                    <el-select v-model="reimburseForm.reimbursement_type" placeholder="请选择类型">
                      <el-option v-for="(value, key) in reimbursemenInfo.reimbursement_type" :key="key" :label="value" :value="key" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="费用说明" prop="reason">
                    <el-input v-model="reimburseForm.reason" type="textarea" placeholder="请填写费用说明" :rows="3" />
                  </el-form-item>

                  <el-form-item label="附件上传">
                    <el-upload
                      v-model:file-list="reimburseForm.file"
                      class="upload-demo"
                      multiple
                      :auto-upload="true"
                      :http-request="customUpload"
                      :on-change="handleFileChange"
                      :show-file-list="true"
                      list-type="text"
                      accept=""
                    >
                      <el-button type="primary">点击上传</el-button>
                    </el-upload>
                  </el-form-item>

                  <el-divider class="approval-divider">审批流程</el-divider>
                  <div style="height: 300px; max-width: 100%">
                    <el-steps v-if="reimbursemenInfo.steps.length > 0" align-center direction="vertical">
                      <el-step v-for="(item, index) in reimbursemenInfo.steps" :key="item.id">
                        <template #title>
                          <div class="w-full flex justify-between">
                            <div>
                              第{{ index + 1 }}级审批人
                              <!-- <p class="smail-size text-gray-500">1个主管审批</p> -->
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
                  <div class="text-center mt-6">
                    <el-button type="primary" @click="handleReimbursementSubmit(reimburseFormRef)">提交</el-button>
                  </div>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </Transition>
      </template>
      <div v-else key="chat-friend-empty" class="flex-row-c-c flex-1 flex-shrink-0 card-bg-color-2">
        <div data-fades class="h-full w-full flex flex-col items-center justify-center text-gray-600 op-80 dark:(text-gray-300 op-50)">
          <i i-solar:widget-5-bold class="mb-2 h-12 w-12" />
          <small>找到你想要执行的操作吧 ☕</small>
        </div>
      </div>
    </div>

    <!-- OA详情 -->
    <dialogLeaveDrawer v-model:drawer="drawer" :leave-data="leaveData" :loading="btnLoading" @submit="getAgree" :type="type" />
    <ChatGroupTodoDialog v-model:show="showGroupTodoDialog" @submit="onSubmitGroupTodoMsg" type="finish" />
  </div>
</template>

<style scoped lang="scss">
.main {
  height: 100%;
  width: 100%;
}

.bg {
  background-image: linear-gradient(160deg, #eaf3ff 0%, transparent, transparent, transparent, transparent, transparent, transparent);
}
.dark .bg {
  background-image: linear-gradient(160deg, #262626 0%, transparent, transparent, transparent, transparent, transparent, transparent, transparent);
}
.main-opertion-box {
  padding: 1rem;
}
.box {
  padding: 10px 0;
  .inputs {
    --at-apply: 'w-10rem sm:w-12rem';
  }
  .box-title {
    color: #747373;
  }
  ul {
    list-style: none;
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    li {
      display: flex;
      align-items: center;
      width: 30%;
      padding: 10px;
      border-radius: 10px;
      cursor: pointer;
      :deep(.el-badge) {
        display: flex;
        align-items: center;
      }
      .icon-box {
        background: #f4f4fc;
        padding: 6px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        i {
          color: #5d33f6;
          margin: 0;
          font-size: 1rem;
        }
      }
      .icon-color-orgin {
        background: #fffae9;
        i {
          color: #ffbf00;
        }
      }
      .icon-color-red {
        background: #fff5f5;
        i {
          color: #ff7333;
        }
      }
      .icon-color-overtime {
        background: #f2f6ff; /* 柔和浅蓝底 */
        i {
          color: #4b6cff; /* 稍亮的蓝紫主色 */
        }
      }
    }
    .awaiting {
      width: 100%;
      .details-awaiting {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: space-between;
      }
      img {
        border-radius: 10px;
      }
    }
    // li:hover{
    //   background: #e8e9eb;
    // }
  }
  .record-ul {
    flex-direction: column;
    li {
      margin-right: 0;
      margin-bottom: 0.6rem;
      small {
        line-height: 2;
      }
      .icon-box {
        background: none;
        padding: 0;
      }
    }
  }
}
.leave-form {
  padding-top: 6rem;
  display: flex;
  flex-direction: column;
  padding: 0;
  width: 100%;
  h2 {
    margin-bottom: 1rem;
  }
}
.leave-form-wrapper {
  width: 100%;
}

.approval-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 1rem 0 2rem;

  .step {
    display: flex;
    align-items: center;
    position: relative;

    .circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: #409eff;
      color: #fff;
      text-align: center;
      line-height: 32px;
      font-weight: bold;
    }

    .label {
      margin-left: 8px;
    }

    .line {
      width: 50px;
      height: 2px;
      background-color: #ccc;
      position: absolute;
      left: 120%;
      top: 15px;
      z-index: 0;
    }
  }
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
:deep(.el-step__title.is-success) {
  color: #5d33f6;
}
:deep(.el-step__description.is-success) {
  color: #5d33f6;
}
:deep(.el-step__head.is-success) {
  color: #5d33f6;
  border-color: #5d33f6;
}
.smail-size {
  font-size: 12px;
  line-height: 1;
}
:deep(.approval-divider .el-divider__text.is-center) {
  background: #f2f2f2;
}
.approval-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 0.25rem;
}

.add-user-btn {
  margin-left: 0.5rem;
}
:deep(.el-input__wrapper) {
  background: transparent;
}
:deep(.el-select__wrapper) {
  background: transparent;
}
:deep(.el-textarea__inner) {
  background: transparent;
}
.el-upload__tip {
  line-height: 1.2;
}
:deep(.el-upload--picture-card) {
  width: 6rem;
  height: 6rem;
}
:deep(.el-tabs) {
  padding: 2rem 1rem 1rem;
}
:deep(.el-table) {
  height: 76vh;
}
.demo-tabs {
  width: 100%;
  height: 100%;
  :deep(.el-tabs__content) {
    height: 100%;
    overflow-y: auto;
    padding-right: 4px;
  }
}
.upload-demo {
  width: 20%;
}
:deep(.el-upload-list__item) {
  width: 6rem;
  height: 6rem;
}
</style>
