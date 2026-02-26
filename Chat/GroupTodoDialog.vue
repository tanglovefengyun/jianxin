<script lang="ts" setup>
import type { UploadFile, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
/**
 * 群通知弹窗
 */
const props = defineProps<{
  show: boolean | undefined | null
  type: string
}>()
const emit = defineEmits<{
  (e: 'update:show', value: boolean | undefined | null): void
  (e: 'submit', value: ChatMessageDTO): void
}>()
const isShow = computed({
  get: () => props.show !== undefined && props.show === true,
  set: (value) => emit('update:show', value)
})

// 消息群通知
const chat = useChatStore()
const user = useUserStore()
const checkAll = ref(false)
const indeterminate = ref(false)
const cities = ref<any>([])
const todoFormRef = ref()
const todoForm = reactive<any>({
  describe: '',
  type: '',
  file: [],
  inform_user_id: []
})
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
function handleCheckAll(val: any) {
  indeterminate.value = false
  if (val) {
    todoForm.inform_user_id = chat.groupInformation.members.map((_: any) => _.user.id)
  } else {
    todoForm.inform_user_id = []
  }
}
watch(
  () => todoForm.inform_user_id,
  (val: any) => {
    console.log(val)

    if (val.length === 0) {
      checkAll.value = false
      indeterminate.value = false
    } else if (val.length === chat.groupInformation.members.length) {
      checkAll.value = true
      indeterminate.value = false
    } else {
      indeterminate.value = true
    }
  },
  { deep: true }
)
// 群通知
async function addMsg() {
  todoFormRef?.value?.validate(async (valid: boolean) => {
    if (!valid) return
    // 请求
    try {
      const arr = todoForm.file.map((item: any) => {
        return item.url
      })
      todoForm.group_id = chat.groupInformation.id
      const res = await getOaTodoSubmitApi({ ...todoForm, file: arr }, user.getToken)
      emit('update:show', false)
      todoForm.describe = ''
      todoForm.type = ''
      todoForm.file = []
      todoForm.inform_user_id = []
    } catch (error) {}
  })
}
const isUploading = ref(false) // 上传状态标志
const pendingFiles = ref<any>([]) // 明确类型为 UploadFile[]
const uploadTimeout = ref() // 防抖定时器类型
function preloadImages(urls: string[]) {
  todoForm.file = urls.map(
    (url, index) =>
      ({
        name: `image-${index}`,
        url,
        uid: Date.now() + index // 手动生成 uid
      } as UploadFile)
  ) as any
}
// 自定义上传逻辑
async function customUpload() {
  if (isUploading.value || pendingFiles.value.length === 0) return

  isUploading.value = true

  // 复制当前待上传文件，然后清空队列
  const filesToUpload = [...pendingFiles.value]
  pendingFiles.value = []

  const formData = new FormData()
  filesToUpload.forEach(({ file }) => {
    formData.append('files[]', file.raw)
  })

  try {
    const res = await getUploadFileApi(formData, user.getToken)
    const urls = res.data.file_url

    // 替换 loadingFile 为真正的图片
    urls.forEach((url: string, index: number) => {
      const { loadingFile } = filesToUpload[index]
      Object.assign(loadingFile, {
        url,
        status: 'success'
      })
    })

    ElMessage.success('上传成功')
  } catch (error) {
    // 失败时清除 loading 图片
    filesToUpload.forEach(({ loadingFile }) => {
      const idx = todoForm.file.indexOf(loadingFile)
      if (idx !== -1) todoForm.file.splice(idx, 1)
    })
    ElMessage.error('上传失败')
  } finally {
    isUploading.value = false
    // 检查是否还有待上传文件，有则继续上传
    if (pendingFiles.value.length > 0) {
      customUpload()
    }
  }
}

function handleFileChange(file: UploadFile, fileList: any[]) {
  // 插入一个 loading 状态的占位图
  const loadingFile = {
    name: file.name,
    status: 'uploading',
    url: 'loading.gif',
    uid: file.uid,
    percentage: 0
  } as UploadFile

  todoForm.file.push(loadingFile)

  // 添加到待上传队列
  pendingFiles.value.push({ file, loadingFile })

  // 只在最后一个文件变化时触发上传
  if (fileList.every((f) => f.uid !== file.uid || f.status === 'ready')) {
    customUpload()
  }
}
function finishTodo() {
  emit('submit', todoForm)
  isShow.value = false
}

function closeDialog() {
  todoForm.describe = ''
  todoForm.type = ''
  todoForm.file = []
  todoForm.inform_user_id = []
}
</script>

<template>
  <DialogPopup v-model="isShow" :duration="300" :zIndex="1000" destroy-on-close content-class="rounded-2 p-4 w-fit border-default-2 dialog-bg-color" @close="closeDialog">
    <template #title>
      <div class="flex-row-c-c mb-5">
        <i i-solar:check-square-broken p-2 />
        <span ml-2>{{ !type ? '群待办' : '完成待办' }}</span>
      </div>
    </template>
    <el-form label-width="80px" class="leave-form-wrapper" ref="todoFormRef" :model="todoForm" :rules="todoRules" v-if="!type">
      <!-- <el-form-item label="费用发生日期" prop="startTime">
                    <el-date-picker v-model="reimburseForm.startTime" type="date" placeholder="请选择日期" style="width: 100%" />
                  </el-form-item> -->

      <el-form-item label="待办类型" prop="type" class="w-20rem">
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

      <el-form-item label="待办事项" prop="describe" class="w-20rem">
        <el-input v-model="todoForm.describe" type="textarea" placeholder="请填写待办事项" :rows="3" />
      </el-form-item>

      <el-form-item label="图片上传">
        <div v-loading="isUploading">
          <el-upload
            :file-list="todoForm.file"
            multiple
            :auto-upload="false"
            :http-request="customUpload"
            :on-change="handleFileChange"
            :show-file-list="true"
            list-type="picture-card"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </div>
      </el-form-item>
      <el-form-item label="通知用户" prop="inform_user_id" class="w-20rem">
        <el-select
          v-model="todoForm.inform_user_id"
          multiple
          clearable
          collapse-tags
          placeholder="请选择通知人员"
          popper-class="custom-header"
          :max-collapse-tags="3"
          tag-type="primary"
          filterable
        >
          <template #header>
            <el-checkbox v-model="checkAll" :indeterminate="indeterminate" @change="handleCheckAll"> All </el-checkbox>
          </template>
          <el-option v-for="item in chat.groupInformation.members" :key="item.user.id" :label="item.user.nickname" :value="item.user.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-form label-width="80px" class="leave-form-wrapper" ref="todoFormRef" :model="todoForm" :rules="todoRules" v-else>
      <el-form-item label="完成备注" class="w-20rem">
        <el-input v-model="todoForm.describe" type="textarea" placeholder="请填写完成备注" :rows="3" />
      </el-form-item>

      <el-form-item label="图片上传">
        <div v-loading="isUploading">
          <el-upload
            :file-list="todoForm.file"
            multiple
            :limit="9"
            :auto-upload="false"
            :http-request="customUpload"
            :on-change="handleFileChange"
            :show-file-list="true"
            list-type="picture-card"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex-row-c-c">
        <el-button class="mr-4 w-5rem" @click="isShow = false"> 取消 </el-button>
        <el-button v-if="!type" class="w-5rem" type="primary" @click="addMsg"> 确认 </el-button>
        <el-button v-else class="w-5rem" type="primary" @click="finishTodo"> 确认 </el-button>
      </div>
    </template>
  </DialogPopup>
</template>

<style lang="scss" scoped>
.text-input {
  :deep(.el-textarea__inner) {
    resize: none;
    caret-color: var(--el-color-primary);
    --at-apply: '!shadow-none !outline-none bg-light-500 dark:bg-dark-7';
  }
}
:deep(.custom-header) {
  z-index: 4000 !important;
}
:deep(.el-upload--picture-card) {
  width: 4.5rem;
  height: 4.5rem;
}
:deep(.el-upload-list__item) {
  width: 4.5rem;
  height: 4.5rem;
}
:deep(.el-upload-list) {
  display: flex;
  flex-wrap: wrap;
  width: 15rem;
}
:deep(.el-upload-list__item.is-uploading) {
  background: #000;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: url('/loading.gif') center center no-repeat;
    background-size: 50% 50%;
    opacity: 0.7;
  }
}
</style>

