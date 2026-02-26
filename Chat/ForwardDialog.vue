<script lang="ts" setup>
/**
 * 消息转发dialog
 */
const { modelValue = false, form: formData } = defineProps<{
  modelValue?: boolean
  form?: {
    roomId: number | null | undefined
    uidList: string[]
  }
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// 会话store
const user = useUserStore()
const setting = useSettingStore()
const chat = useChatStore()
const ws = useWsStore()
const checkAll = ref(false)
const isIndeterminate = ref(false)
const btnLoading = ref(false)
const addLoading = ref(false)
const [autoAnimateRef, enable] = useAutoAnimate({})
onMounted(() => {
  enable(!setting.settingPage.isCloseAllTransition)
})

const show = computed({
  get() {
    return modelValue
  },
  set(val) {
    if (val) {
      reset()
      reload()
    } else {
      isIndeterminate.value = false
      checkAll.value = false
    }
    emit('update:modelValue', val)
  }
})

watch(
  () => modelValue,
  (val: boolean) => {
    if (val) {
      // loadData()
      user.getChatInfo.forEach((item: any) => {
        friendMaps.set(item.id, item)
      })
      filteredChatList.value = user.getChatInfo
    }
  }
)

// 好友用户列表
const isLoading = ref<boolean>(false)
const pageInfo = ref({
  size: 20,
  page: 0,
  total: -1
})
const dto = ref<any>({
  keyWord: '',
  name: ''
})
const filteredChatList = ref<any[]>([])
const friendList = ref<any[]>([])
const friendMaps = new Map<string, any>()
const filterFriendList = ref<any>([])
const imgStep = ref(false)
// 表单相关
const form = ref<{
  roomId: number | null | undefined
  avatar: string | null | undefined
  uidList: string[]
}>({
  roomId: undefined,
  avatar: undefined,
  uidList: []
})
const formRef = ref()
watch(
  () => formData,
  (val) => {
    form.value.roomId = val?.roomId
    form.value.uidList = val?.uidList || []
  }
)
const notMore = computed(() => filterFriendList.value.length === pageInfo.value.total)

function handleCheckAllChange(val: any) {
  form.value.uidList = val ? filterFriendList.value.map((item: any) => item.id) : []
  isIndeterminate.value = false
}

// 监听单选变化
async function handleCheckedCitiesChange(value: any[]) {
  const checkedCount = value.length
  const total = filterFriendList.value.length
  checkAll.value = checkedCount === total
  isIndeterminate.value = checkedCount > 0 && checkedCount < total

  const mapArr = user.getChatInfo.map((item: any) => item.id)
  const targetId = value[value.length - 1]
  const targetItem = filteredChatList.value.find((item: any) => item.id === targetId)
  if (!mapArr.includes(value[value.length - 1])) {
    if (targetItem) {
      addLoading.value = true
      const res = await getChatSessionApi('private', targetId, '', user.getToken)
      addLoading.value = false
      targetItem.chat_id = res.data.chat_id
    }
    console.log(filteredChatList.value)
  } else {
    const mapData = user.getChatInfo.filter((item: any) => item.id == value[value.length - 1])[0]
    console.log(mapData)
    if (targetItem) {
      targetItem.chat_id = mapData.chat_id
    }
  }
}
// 添加群聊
function addGroupApply() {
  formRef?.value?.validate(async (valid: boolean) => {
    // if (!form.value.avatar){
    //   ElMessage({
    //     type: "error",
    //     message: "请上传群头像!",
    //   });
    //   return;
    // }

    console.log(form.value)
    console.log(dto.value)
    // 请求
    let res
    btnLoading.value = true
    if (form.value.roomId) {
      // 1、邀请好友
      const groupData = {
        group_id: form.value.roomId,
        members: form.value.uidList
      }
      res = await getGroupInviteApi(groupData, user.getToken)
      chat.getGroupInformation(form.value.roomId)
      btnLoading.value = false
    } else {
      // 2、新建群聊
      console.log(form.value)
      const groupData = {
        name: dto.value.name,
        portrait: form.value.avatar,
        notice: '',
        members: form.value.uidList
      }
      res = await getGroupCreateApi(groupData, user.getToken)
      btnLoading.value = false
    }
    if (res.code !== 0) return

    show.value = false
    console.log(res)

    await chat.newGetGroupInformation(form.value.roomId || res.data.id, res.data.chat_id)

    chat.onChangeRoom(res.data)
    ws.getAllMessagesContent()
    const getTimestamp = () => Math.floor(Date.now() / 1000)
    const localNewsData = {
      result: {
        chat_info: {
          id: chat.groupInformation.id,
          chat_type: 'group',
          disturb: 0,
          pinned_chat: 0,
          portrait: chat.groupInformation.portrait,
          title: chat.groupInformation.name,
          chat_id: res.data.chat_id
        },
        timestamp: getTimestamp() + 10,
        user: {
          id: null,
          nickname: user.userInfo.nickname
        },
        type: null,
        content: ''
      }
    }
    ws.getChatInfo(localNewsData)
    const diff = form.value.uidList.length - (+res?.data || form.value.uidList.length)
    ElMessage({
      type: !diff ? 'success' : 'warning',
      message: !diff ? '群聊创建成功！' : `部分邀请未送达（${res.data || 0}/${form.value.uidList.length}）！`
    })
    reset()
  })
}

// 加载数据
async function loadData() {
  isLoading.value = true
  pageInfo.value.page += 1
  const { data } = await getFriendsUserSearchApi(dto.value.keyWord, user.getToken)

  if (!data) return

  // 使用搜索结果更新 UI 数据
  filteredChatList.value = data.user.filter((item: any) => item.id !== user.userInfo.id)

  // 保留 user.getChatInfo 用于内部缓存映射（如果需要）
  filteredChatList.value.forEach((item: any) => {
    friendMaps.set(item.id, item)
  })

  pageInfo.value = {
    size: 20,
    page: data.current,
    total: data.totality
  }
  isLoading.value = false
}

const getCheckList = computed(() =>
  form.value.uidList.map((item) => {
    return friendMaps.get(item) || { id: item, nickname: '未填写', avatar: '' }
  })
)

function remove(id: string) {
  form.value.uidList = form.value.uidList.filter((item) => item !== id)
}

// 上传头像
const inputOssFileUploadRef = ref()
function onSubmitImages(key: string) {
  console.log(key)

  form.value.avatar = key
}

// 重载
function reload() {
  loadData()
}

// 重载
function reset() {
  form.value = {
    roomId: undefined,
    avatar: undefined,
    uidList: []
  }
  imgStep.value = false
  friendList.value = []
  pageInfo.value = {
    size: 20,
    page: 0,
    total: -1
  }
}

// 下一步fn
async function next() {
  if (form.value.uidList.length <= 0) return ElMessage.warning('请选择成员')
  const combined = [
    ...user.getChatInfo.filter((item: any) => form.value.uidList.includes(item.id)),
    ...filteredChatList.value.filter((item: any) => form.value.uidList.includes(item.id))
  ]

  // 根据 id 去重
  const selectedUsers = Array.from(new Map(combined.map((item) => [item.id, item])).values())
  console.log(selectedUsers)
  console.log(chat.forwardData)
  if (chat.choiceMessageState) {
    for (let index = 0; index < selectedUsers.length; index++) {
      await getBatchSendMessageApi(
        {
          chat_id: selectedUsers[index].chat_id,
          messages: chat.selectedMessages
        },
        user.getToken
      )
    }
    chat.choiceMessageState = false
    chat.selectedMessages = []
    show.value = false
    form.value.uidList = []
  } else {
    for (let index = 0; index < selectedUsers.length; index++) {
      const element = selectedUsers[index]
      const formData = new FormData()
      const localId = `local_${generateUUID()}`
      formData.append('h5_local_id', localId)
      formData.append('chat_id', element.chat_id)
      formData.append('type', chat.forwardData.type)
      formData.append('quote_id', '0')
      formData.append(`at_user[]`, '[]')
      formData.append('content', chat.forwardData.content)
      await getSendMessageApi(formData, user.getToken)

      show.value = false
      form.value.uidList = []
    }
  }
}

function isDisabled(p: any) {
  if (form.value.roomId) {
    const arr = chat.groupInformation.members.map((item: any) => item.user_id).includes(p.id)
    return arr
  }
}
function debounce(fn: Function, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

const debouncedLoadData = debounce(() => {
  loadData()
}, 300)

watch(
  () => dto.value.keyWord,
  (val) => {
    if (!val) {
      filteredChatList.value = user.getChatInfo
    } else {
      debouncedLoadData()
    }
  }
)

// 暴露
defineExpose({
  form,
  reload,
  reset
})
</script>

<template>
  <DialogPopup
    v-model="show"
    :min-scale="0.96"
    :duration="300"
    destroy-on-close
    :show-close="false"
    content-class="max-w-95vw sm:w-fit shadow-lg border-default-2  rounded-2 dialog-bg-color"
    :zIndex="9999"
  >
    <template v-if="setting.isMobileSize" #title>
      <div :data-tauri-drag-region="setting.isDesktop" select-none p-4 pb-0 text-center text-sm>
        <i :class="form.roomId ? 'i-solar:users-group-rounded-bold' : 'i-solar:users-group-rounded-line-duotone'" class="mr-2 p-2.6 text-small" />
        转发消息
      </div>
    </template>
    <el-form ref="formRef" label-position="top" :model="form" class="relative overflow-hidden rounded-2">
      <div ref="autoAnimateRef">
        <div v-show="!imgStep" key="first" class="w-82vw flex flex flex-col md:w-45rem md:flex-row">
          <!-- 未选列表 -->
          <el-form-item class="left flex-1 p-4 sm:p-6">
            <template #label>
              <div class="w-full flex-row-bt-c sm:pr-1.8">
                聊天列表
                <el-input v-model.lazy="dto.keyWord" class="w-10em" size="small" placeholder="名称/手机号" clearable type="text" />
              </div>
            </template>
            <el-checkbox-group v-model="form.uidList" @change="handleCheckedCitiesChange" class="w-full card-rounded-df bg-color-2 sm:!bg-transparent">
              <div class="scroll-bar max-h-40vh min-h-40vh flex flex-col overflow-y-auto p-2 pr-0 sm:(max-h-22rem min-h-22rem p-0)">
                <ListAutoIncre :immediate="false" :auto-stop="false" :no-more="true">
                  <el-checkbox v-for="p in filteredChatList" :key="p.id" class="check-item mb-2" :value="p.id" :label="p.nickname" style="width: 100%; height: fit-content">
                    <div class="w-full flex items-center gap-2">
                      <div class="avatar-icon">
                        <!-- <CardElImage class="h-full w-full overflow-hidden rounded-6px" :src="BaseUrlImg + p.avatar" fit="cover" /> -->
                        <img :src="p.portrait" alt="" class="h-full w-full card-rounded-df object-contain shadow-sm card-bg-color-2 object-top" />
                      </div>
                      <span class="truncate text-color">{{ p.title || p.nickname || '未填写' }}</span>
                    </div>
                  </el-checkbox>
                </ListAutoIncre>
              </div>
            </el-checkbox-group>
            <!-- 第一步 -->
            <div v-if="setting.isMobileSize" key="1" class="mt-4 w-full flex justify-between">
              <el-button class="w-1/2" @click="show = false"> 取消 </el-button>
              <el-button class="w-1/2" :disabled="form.uidList.length <= 0" :type="form.roomId ? 'info' : 'warning'" @click="next()" :loading="addLoading"> 发送 </el-button>
            </div>
          </el-form-item>
          <!-- 已选列表 -->
          <el-form-item
            v-if="!setting.isMobileSize"
            label="发送给"
            prop="uidList"
            :rules="[
              {
                required: true,
                trigger: ['blur'],
                message: '群成员不能为空！'
              }
            ]"
            class="right h-fit flex-1 p-4 bg-color-2 sm:p-6"
            style="display: flex; flex-direction: column; margin: 0"
          >
            <ListTransitionGroup
              v-show="getCheckList.length > 0"
              tag="div"
              class="scroll-bar grid grid-cols-3 mt-0 max-h-200px min-h-200px w-full items-start gap-col-2 overflow-y-auto card-rounded-df sm:(grid-cols-4 max-h-300px min-h-300px)"
            >
              <div v-for="p in getCheckList" :key="p.id" class="item" :label="p.title">
                <i i-solar:close-circle-bold p-2 btn-primary class="absolute right-2px top-2px z-1" @click="remove(p.id)" />
                <div class="avatar-icon">
                  <!-- <CardElImage class="h-full w-full overflow-hidden rounded-6px" :src="BaseUrlImg + p.avatar" fit="cover" /> -->
                  <img :src="p.portrait" alt="" class="h-full w-full card-rounded-df object-contain shadow-sm card-bg-color-2 object-top" />
                </div>
                <span class="block max-w-18 truncate">{{ p.title || p.nickname || '未填写' }}</span>
              </div>
            </ListTransitionGroup>
            <!-- 空白 -->
            <div v-show="getCheckList.length <= 0" class="h-200px w-full flex-row-c-c card-rounded-df sm:h-300px text-small-50">
              <i i-solar:user-plus-broken mr-2 p-2.5 />
              <p>未选择聊天</p>
            </div>
            <!-- 第一步 -->
            <div key="1" class="w-full flex justify-center p-3 sm:justify-between">
              <el-button class="w-2/5" @click="show = false"> 取消 </el-button>
              <el-button class="w-2/5" :disabled="form.uidList.length <= 0" :type="form.roomId ? 'info' : 'warning'" @click="next()" :loading="addLoading"> 发送 </el-button>
            </div>
          </el-form-item>
        </div>
      </div>
    </el-form>
  </DialogPopup>
</template>

<style lang="scss" scoped>
:deep(.el-checkbox-group) {
  font-size: 1em;
  line-height: 1.1em;
}
:deep(.el-form-item) {
  margin: 0;
  .el-form-item__label {
    display: block;
    width: 100%;
    padding: 0;
  }
  .el-form-item__content {
    align-items: start;
  }
  .el-input {
    .el-input__wrapper {
      --at-apply: '!shadow-none !outline-none bg-light-500 dark:bg-dark-7';
    }
  }
}
:deep(.el-checkbox__inner) {
  border-radius: 4px;
  transform: scale(1.2);
  // border-radius: 1rem;
}
.avatar-icon {
  --at-apply: 'h-2.4rem card-default  w-2.4rem flex-row-c-c rounded-6px  shadow-sm border-default';
}
.item {
  --at-apply: 'flex flex-col relative items-center gap-4 px-2 pt-3.6 page-pointer rounded-6px hover:(bg-color) transition-300';
}
.check-item {
  --at-apply: 'flex items-center px-4 gap-2 page-pointer rounded-6px p-2 hover:(bg-color-3 dark:bg-dark-8) transition-300';
}
:deep(.el-checkbox.is-checked) {
  --at-apply: 'bg-color dark:bg-dark-8 sm:(bg-color-3 dark:bg-dark-8) shadow-sm';
}
.avatar {
  :deep(.el-form-item__error) {
    width: 100%;
    text-align: center;
  }
}
</style>
