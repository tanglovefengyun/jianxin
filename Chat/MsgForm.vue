<script lang="ts" setup>
import type { ElForm, ElMention } from 'element-plus'
import ContextMenu from '@imengyu/vue3-context-menu'

const emit = defineEmits<{
  (e: 'submit', newMsg: ChatMessageVO): void
}>()
const user = useUserStore()
const chat = useChatStore()
const setting = useSettingStore()
const route = useRoute()
const ws = useWsStore()

// 读取@用户列表 hook
const { userOptions, userAtOptions, loadUser } = useLoadAtUserList()
const { aiOptions, loadAi } = useLoadAiList()
const isReplyAI = computed(() => chat.msgForm.content?.startsWith('/') && aiOptions.value?.length > 0)
const isReplyAT = computed(() => chat.msgForm.content?.includes('@') && chat.groupInformation.members?.length > 0 && chat.msgContact.chat_type === 'group')

const mentionList = computed(() => {
  console.log(isReplyAT.value)
  console.log(chat.groupInformation?.members)

  const members = chat.groupInformation?.members ?? []
  const role_user = members.filter((i: any) => i.role === 1 || i.role === 2).map((v: any) => v.user_id)

  // 生成基础列表
  let list = []

  if (isReplyAT.value) {
    list = members.map((item: any) => ({
      ...item,
      value: item.user.nickname
    }))

    // 如果当前用户是群主，添加“@所有人”到列表开头
    if (role_user.length > 0 && role_user.includes(user.userInfo.id)) {
      list.unshift({
        value: '所有人',
        label: '所有人',
        user: {
          nickname: '所有人',
          portrait: '/all.png' // 可替换为你默认的头像
        },
        isAll: true
      })
    }
  } else if (isReplyAI.value) {
    list = aiOptions.value
  }

  return list
})

// 表单
const isSending = ref(false)
const isDisabledFile = computed(() => !user?.isLogin || chat.theContact.selfExist === 0)
const isNotExistOrNorFriend = computed(() => chat.theContact.selfExist === isTrue.FALESE) // 自己不存在 或 不是好友  || chat.contactMap?.[chat.theRoomId!]?.isFriend === isTrue.FALESE
const isLord = computed(() => chat.theContact.type === RoomType.GROUP && chat.theContact.member?.role === ChatRoomRoleEnum.OWNER) // 群主
const isSelfRoom = computed(() => chat.theContact.type === RoomType.SELFT) // 私聊
const isAiRoom = computed(() => chat.theContact.type === RoomType.AICHAT) // 机器人
const maxContentLen = computed(() => (chat.theContact.type === RoomType.AICHAT ? 2048 : 2048)) // 对话文本长度
// 状态
const showGroupNoticeDialog = ref(false)
const showGroupTodoDialog = ref(false)
const showDialog = ref(false)
const loadInputDone = ref(false) // 用于移动尺寸动画
const loadInputTimer = shallowRef<NodeJS.Timeout>()
const inputFocus = ref(false)

// ref
const inputContentRef = useTemplateRef<InstanceType<typeof ElMention>>('inputContentRef') // 输入框
const formRef = useTemplateRef<InstanceType<typeof ElForm>>('formRef') // 表单

// hooks
const isDisableUpload = computed(() => isAiRoom.value || route.path !== '/')
// Oss上传
const {
  imgList,
  fileList,
  videoList,
  isUploadImg,
  isUploadFile,
  isUploadVideo,
  isDragDropOver,
  isDragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  onSubmitImg,
  onSubmitFile,
  onSubmitVideo,
  onPaste,
  showVideoDialog,
  inputOssImgUploadRef,
  inputOssVideoUploadRef,
  inputOssFileUploadRef
} = useFileUpload({ img: 'inputOssImgUploadRef', file: 'inputOssFileUploadRef', video: 'inputOssVideoUploadRef' }, isDisableUpload)
// 录音
const {
  isChating,
  second, // 获取录音时间
  theAudioFile,
  speechRecognition,
  audioTransfromText,
  isPalyAudio,
  pressHandleRef,
  reset: resetAudio,
  start: startAudio,
  handlePlayAudio // 播放录音
} = useRecording({ pressHandleRefName: 'pressHandleRef', timeslice: 1000 })
// computed
const isBtnLoading = computed(() => isSending.value || isUploadImg.value || isUploadFile.value || isUploadVideo.value)
const isSoundRecordMsg = computed(() => chat.msgForm.msgType === MessageType.SOUND)
const getTimestamp = () => Math.floor(Date.now() / 1000)
/**
 * 发送消息
 */
async function handleSubmit() {
  // if (isSending.value)
  //   return;
  formRef.value?.validate(async (action: boolean) => {
    if (!action || !chat.msgForm.content.trim()) return
    const localId = `local_${generateUUID()}`
    // ws.send({
    //   websocket_type: 'message',
    //   data: {
    //     h5_local_id: localId, //本地记录id
    //     chat_id: chat.msgContact.chat_id, //会话id
    //     type: 'text', //消息类型  text:文本 image:图片 voice:语音 video:视频 file:文件
    //     quote_id: chat.replyMsg?.id, //引用消息id ，没有不传或传null
    //     at_user: chat.atUserList?.map((item: any) => item.user_id), //群聊是否有at用户  ,如果是at所有人，就把群聊所有人的id存入进去
    //     content: chat.msgForm.content, //消息内容
    //     status: MessageSendStatus.SENDING
    //     // voice_duration:100,//语言时长 秒单位
    //     // video_duration:100,//视频时长 秒单位
    //     // file_size:100,//文件大小  k 单位
    //   }
    // })
    // chat.msgForm.content = ''
    // chat.atUserList = []
    // chat.replyMsg = null
    // const localId = `local_${generateUUID()}`
    const chatInfoData = user.getChatInfo.filter((item: any) => item.chat_id == chat.msgContact.chat_id)[0]
    // const localNewsData = {
    //   result: {
    //     chat_info: {
    //       id: chatInfoData.id,
    //       chat_type: chatInfoData.chat_type,
    //       disturb: chatInfoData.disturb,
    //       pinned_chat: chatInfoData.pinned_chat,
    //       portrait: chatInfoData.portrait,
    //       title: chatInfoData.title,
    //       chat_id: chat.msgContact.chat_id
    //     },
    //     timestamp: getTimestamp() + 10,
    //     user: {
    //       id: user.userInfo.id,
    //       nickname: user.userInfo.nickname
    //     },
    //     type: 'text',
    //     content: chat.msgForm.content
    //   }
    // }
    const localNewsData1 = {
      result: {
        id: localId,
        h5_local_id: localId,
        chat_id: chat.msgContact.chat_id,
        timestamp: getTimestamp() + 50,
        user_id: user.userInfo.id,
        chat_info: {
          id: chatInfoData.id,
          chat_type: chatInfoData.chat_type,
          disturb: chatInfoData.disturb,
          pinned_chat: chatInfoData.pinned_chat,
          portrait: chatInfoData.portrait,
          title: chatInfoData.title,
          department: {
            name: chatInfoData.department && chatInfoData.chat_type !== 'group' ? chatInfoData.department.name : ''
          },
          job: chatInfoData.chat_type !== 'group' ? chatInfoData.job : ''
        },
        user: {
          id: user.userInfo.id,
          nickname: user.userInfo.nickname,
          portrait: user.userInfo.portrait,
          department: {
            name: chatInfoData.department && chatInfoData.chat_type !== 'group' ? chatInfoData.department.name : ''
          },
          job: chatInfoData.chat_type !== 'group' ? chatInfoData.job : ''
        },
        type: 'text',
        content: chat.msgForm.content,
        msg_status: 1,
        status: MessageSendStatus.SENDING
      }
    }
    // ws.getChatInfo(localNewsData)
    ws.saveDataToIndexedDB(localNewsData1.result)
    await ws.getAllMessagesContent()
    chat.scrollBottom(false)
    const formData = new FormData()
    const arr = chat.atUserList?.map((item: any) => item.user_id)
    formData.append('h5_local_id', localId)
    formData.append('chat_id', chat.msgContact.chat_id)
    formData.append('type', 'text')
    formData.append('quote_id', chat.replyMsg?.id || 0)
    // 遍历数组，将每个元素添加为独立字段
    arr.length > 0
      ? arr.forEach((userId: any, index) => {
          formData.append(`at_user[]`, userId)
        })
      : formData.append(`at_user[]`, '[]')
    formData.append('content', chat.msgForm.content)
    // const mapData = {
    //   h5_local_id: localId, //本地记录id
    //   chat_id: chat.msgContact.chat_id, //会话id
    //   type: 'text', //消息类型  text:文本 image:图片 voice:语音 video:视频 file:文件
    //   quote_id: chat.replyMsg?.id, //引用消息id ，没有不传或传null
    //   at_user: chat.atUserList?.map((item: any) => item.user_id), //群聊是否有at用户  ,如果是at所有人，就把群聊所有人的id存入进去
    //   content: chat.msgForm.content, //消息内容
    //   status: MessageSendStatus.SENDING
    // }
    chat.msgForm.content = ''
    chat.atUserList = []
    chat.replyMsg = null
    try {
      const res = await getSendMessageApi(formData, user.getToken)
      if (res.code == 0) {
        console.log(res)
        ws.updateIndexedDBField(localId, 'status', 'success')
        ws.getAllMessagesContent()
      } else {
        // 上传失败
        ws.updateIndexedDBField(localId, 'status', 'error')
        ws.getAllMessagesContent()
      }
      // ws.deleteMessageById(localId) // 你需要在 ws 中实现这个方法
    } catch (error) {
      ElMessage.error('上传失败！')
      console.error(error)
      ws.updateIndexedDBField(localId, 'status', 'error')
      ws.getAllMessagesContent()
    }
    // ws.send({
    //   websocket_type: 'message',
    //   data: {
    //     h5_local_id: localId, //本地记录id
    //     chat_id: chat.msgContact.chat_id, //会话id
    //     type: 'text', //消息类型  text:文本 image:图片 voice:语音 video:视频 file:文件
    //     quote_id: chat.replyMsg?.id, //引用消息id ，没有不传或传null
    //     at_user: chat.atUserList?.map((item: any) => item.user_id), //群聊是否有at用户  ,如果是at所有人，就把群聊所有人的id存入进去
    //     content: chat.msgForm.content, //消息内容
    //     status: MessageSendStatus.SENDING
    //     // voice_duration:100,//语言时长 秒单位
    //     // video_duration:100,//视频时长 秒单位
    //     // file_size:100,//文件大小  k 单位
    //   }
    // })
    // if (chat.msgForm.msgType === MessageType.TEXT && (!chat.msgForm.content || chat.msgForm.content?.trim().length > maxContentLen.value))
    //   return;
    // // 发送请求
    // await onSubmit().finally(() => {
    //   isSending.value = false;
    // });
  })
}

/**
 * 发送文件消息
 */
async function handleFileSubmit(type: string) {
  // if (isSending.value)
  //   return;
  // formRef.value?.validate(async (action: boolean) => {
  //   if (!action || chat.msgForm.content === '')
  //     return;
  if (chat.msgForm.content === '') return
  const localId = `local_${generateUUID()}`
  ws.send({
    websocket_type: 'message',
    data: {
      h5_local_id: localId, //本地记录id
      chat_id: chat.msgContact.chat_id, //会话id
      type, //消息类型  text:文本 image:图片 voice:语音 video:视频 file:文件
      quote_id: null, //引用消息id ，没有不传或传null
      at_user: [], //群聊是否有at用户  ,如果是at所有人，就把群聊所有人的id存入进去
      content: chat.msgForm.content, //消息内容
      voice_duration: type === 'voice' ? chat.msgForm.voice_duration : 0 //语音时长 秒单位
      // video_duration:100,//视频时长 秒单位
      // file_size:100,//文件大小  k 单位
    }
  })
  handlePlayAudio('del')
}

const onMentionEnter = () => {
  const dropdown = document.querySelector('.at-select') as HTMLElement | null

  const isDropdownOpen = dropdown !== null && dropdown.offsetParent !== null

  if (isDropdownOpen) {
    return // 用户正在选择 mention 项
  }

  handleSubmit() // 否则执行发送
}

async function onSubmit() {
  const formDataTemp = JSON.parse(JSON.stringify(chat.msgForm))
  if (chat.msgForm.content) {
    if (document.querySelector('.at-select'))
      // enter冲突at选择框
      return

    if (chat.theContact.type === RoomType.GROUP) {
      // 处理 @用户
      const { atUidList } = resolveAtUsers(formDataTemp.content, userOptions.value)
      if (atUidList?.length) {
        chat.atUserList = [...atUidList]
        formDataTemp.body.atUidList = [...new Set(atUidList)]
      }
    }

    // 处理 AI机器人 TODO: 可改为全体呼叫
    const { replaceText, aiRobitUidList } = resolteAiReply(formDataTemp.content, aiOptions.value, chat.askAiRobotList)
    if (aiRobitUidList.length > 0) {
      if (!replaceText) return false
      formDataTemp.content = replaceText
      formDataTemp.body = {
        // userId: aiRobitUidList?.[0],
        // modelCode: 1,
        userIds: aiRobitUidList.length > 0 ? aiRobitUidList : undefined,
        businessCode: AiBusinessType.TEXT
      } as AiChatBodyDTO
      formDataTemp.msgType = MessageType.AI_CHAT // 设置对应消息类型
    }
  }
  // 图片
  if (formDataTemp.msgType === MessageType.IMG) {
    if (isUploadImg.value) {
      ElMessage.warning('图片正在上传中，请稍等！')
      return false
    }
    if (imgList.value.length > 1) {
      await multiSubmitImg()
      return false
    }
  }
  // 文件
  if (formDataTemp.msgType === MessageType.FILE && isUploadFile.value) {
    ElMessage.warning('文件正在上传中，请稍等！')
    return false
  }
  // 视频
  if (formDataTemp.msgType === MessageType.VIDEO && isUploadVideo.value) {
    ElMessage.warning('视频正在上传中，请稍等！')
    return false
  }
  // 开始提交
  isSending.value = true
  // 1) 语音消息
  if (formDataTemp.msgType === MessageType.SOUND) {
    await onSubmitSound((key) => {
      formDataTemp.body.url = key
      formDataTemp.body.translation = audioTransfromText.value
      formDataTemp.body.second = second.value
      submitToQueue(formDataTemp)
    })
    return true
  }
  // 2) AI私聊
  if (isAiRoom.value) {
    const content = formDataTemp.content?.trim()
    if (!content) return false
    if (!chat.theContact?.targetUid) {
      ElMessage.error('房间信息不完整！')
      return false
    }
    await submitToQueue({
      roomId: chat.theRoomId!,
      msgType: MessageType.AI_CHAT, // AI消息
      content,
      body: {
        userIds: [chat.theContact?.targetUid],
        businessCode: AiBusinessType.TEXT
      } as AiChatBodyDTO
    })
    return true
  }
  // 3) 普通消息
  await submitToQueue(formDataTemp)
  return true
}

/**
 * 将消息提交到队列
 */
async function submitToQueue(formData: ChatMessageDTO = chat.msgForm, callback?: (msg: ChatMessageVO) => void) {
  const roomId = chat.theRoomId!

  // 添加到消息队列
  chat.addToMessageQueue(
    {
      ...formData,
      roomId
    },
    (msg: ChatMessageVO) => {
      // 发送信息后触发
      emit('submit', msg)
      resetForm()
      typeof callback === 'function' && callback(msg) // 执行回调
    }
  )

  // 重置表单
  resetForm()
  isSending.value = false
}

/**
 * 批量发送图片消息
 */
async function multiSubmitImg() {
  isSending.value = true
  const formTemp = JSON.parse(JSON.stringify(chat.msgForm))
  // 批量发送图片消息
  const uploadedFiles = new Set() // 用来跟踪已经上传的文件
  for (const file of imgList.value) {
    chat.msgForm = {
      roomId: chat.theRoomId!,
      msgType: MessageType.IMG, // 默认
      content: '',
      body: {
        url: file.key!,
        width: file.width || 0,
        height: file.height || 0,
        size: file?.file?.size || 0
      }
    }
    await submitToQueue(chat.msgForm) // 提交到队列
    uploadedFiles.add(file.key) // 标记文件为已上传
  }
  // 一次性移除所有已上传的文件
  imgList.value = imgList.value.filter((file) => !uploadedFiles.has(file.key))

  // 发送文本消息
  if (formTemp.content) {
    formTemp.body.url = undefined
    formTemp.body.size = undefined
    formTemp.msgType = MessageType.TEXT // 默认
    chat.msgForm = {
      ...formTemp,
      roomId: chat.theRoomId!,
      msgType: MessageType.TEXT // 默认
    }
    await submitToQueue(chat.msgForm)
  }
  isSending.value = false
}

/**
 * 发送群通知消息
 */
function onSubmitGroupNoticeMsg(formData: ChatMessageDTO) {
  const localId = `local_${generateUUID()}`
  ws.send({
    websocket_type: 'message',
    data: {
      h5_local_id: localId, //本地记录id
      chat_id: chat.msgContact.chat_id, //会话id
      type: 'group_notice', //消息类型  text:文本 image:图片 voice:语音 video:视频 file:文件
      quote_id: null, //引用消息id ，没有不传或传null
      at_user: [], //群聊是否有at用户  ,如果是at所有人，就把群聊所有人的id存入进去
      content: formData.content, //消息内容
      voice_duration: 0 //语音时长 秒单位
      // video_duration:100,//视频时长 秒单位
      // file_size:100,//文件大小  k 单位
    }
  })
}

// 发送群待办消息
function onSubmitGroupTodoMsg() {}

/**
 * 单按键触发事件
 */
function onInputExactKey(key: 'ArrowUp' | 'ArrowDown') {
  if (!setting.downUpChangeContact) {
    return
  }
  if (!chat.msgForm.content?.trim() && (key === 'ArrowUp' || key === 'ArrowDown')) {
    chat.onDownUpChangeRoom(key === 'ArrowDown' ? 'down' : 'up')
  }
}

/**
 * 发送语音
 * @param callback 上传成功回调
 */
async function onSubmitSound(callback: (key: string) => void) {
  if (!theAudioFile.value || !theAudioFile?.value?.id) {
    isSending.value = false
    return false
  }
  return await useOssUpload(OssFileType.SOUND, theAudioFile.value as OssFile, user.getToken, {
    callback(event, data, file) {
      if (event === 'error') {
        isSending.value = false
        ElMessage.error('发送语音失败，请稍后再试！')
      } else if (event === 'success') {
        callback(data)
      }
    }
  })
}

// 重置表单
function resetForm() {
  chat.msgForm = {
    roomId: chat.theRoomId!,
    msgType: MessageType.TEXT, // 默认
    content: '',
    body: {
      atUidList: []
    }
  }
  imgList.value = []
  fileList.value = []
  videoList.value = [] // 清空视频
  // store
  chat.atUserList.splice(0)
  chat.askAiRobotList.splice(0)

  // 重置上传
  inputOssImgUploadRef.value?.resetInput?.()
  inputOssFileUploadRef.value?.resetInput?.()
  inputOssVideoUploadRef.value?.resetInput?.()
  isSending.value = false
  chat.setReplyMsg({})
  resetAudio()
}

/**
 * 右键菜单
 * @param e 事件对象
 * @param key key
 * @param index 索引
 */
function onContextFileMenu(e: MouseEvent, key?: string, index: number = 0, type: OssFileType = OssFileType.IMAGE) {
  e.preventDefault()
  const textMap = {
    [OssFileType.IMAGE]: '图片',
    [OssFileType.FILE]: '文件',
    [OssFileType.VIDEO]: '视频',
    [OssFileType.SOUND]: '语音'
  } as Record<OssFileType, string>
  const opt = {
    x: e.x,
    y: e.y,
    theme: setting.contextMenuTheme,
    items: [
      {
        customClass: 'group',
        icon: 'i-solar:trash-bin-minimalistic-outline group-btn-danger',
        label: `撤销${textMap[type]}`,
        onClick: async () => {
          if (!key) return
          removeOssFile(type, key, index)
        }
      }
    ]
  }
  ContextMenu.showContextMenu(opt)
}

function removeOssFile(type: OssFileType = OssFileType.IMAGE, key?: string, index: number = 0) {
  const filesMap: Record<OssFileType, Ref<OssFile[]> | undefined> = {
    [OssFileType.IMAGE]: imgList,
    [OssFileType.FILE]: fileList,
    [OssFileType.VIDEO]: videoList,
    [OssFileType.SOUND]: undefined,
    [OssFileType.FONT]: undefined
  }
  const item = filesMap?.[type]?.value.find((f) => f.key === key)
  if (item && key) item.subscribe.unsubscribe()
  const keys = [key, ...(item?.children || []).map((f) => f.key)]
  keys.forEach((k) => k && deleteOssFile(k, user.getToken))
  ElMessage.closeAll('error')
  inputOssFileUploadRef?.value?.resetInput?.()
  inputOssImgUploadRef?.value?.resetInput?.()
  inputOssVideoUploadRef?.value?.resetInput?.()
  filesMap?.[type]?.value.splice(index, 1)
  if (filesMap?.[type]?.value?.length === 0) {
    chat.msgForm.msgType = MessageType.TEXT // 默认
    chat.msgForm.body.url = undefined
  }
}

// 移动端工具栏
const showMobileTools = ref(false)
watch(
  () => [chat.isOpenContact, isSoundRecordMsg, inputFocus],
  ([open, rcord, focus]) => {
    if (open || rcord || focus) showMobileTools.value = false
  },
  {
    immediate: true,
    deep: true
  }
)

// 移动端工具栏配置
interface ToolItem {
  id: string
  icon: string
  label: string
  className?: string
  disabled?: boolean
  onClick?: () => void
}
const mobileTools = computed(() => {
  const tools: ToolItem[] = [
    {
      id: 'image',
      icon: 'i-solar:album-bold',
      label: '相册',
      disabled: isDisabledFile.value,
      onClick: () => inputOssImgUploadRef.value?.openSelector?.({ accept: 'image/*' })
    },
    // 拍摄
    {
      id: 'camera',
      icon: 'i-solar:camera-bold',
      label: '拍摄',
      disabled: isDisabledFile.value,
      onClick: () => inputOssImgUploadRef.value?.openSelector?.({ accept: 'image/*', capture: 'environment' })
    },
    {
      id: 'video',
      icon: 'i-solar:video-library-line-duotone',
      label: '视频',
      disabled: isDisabledFile.value,
      onClick: () => inputOssVideoUploadRef.value?.openSelector?.({ accept: 'video/*' })
    },
    // 录视频
    {
      id: 'video-record',
      icon: 'i-solar:videocamera-add-bold',
      label: '录视频',
      disabled: isDisabledFile.value,
      onClick: () => inputOssVideoUploadRef.value?.openSelector?.({ accept: 'video/*', capture: 'environment' })
    },
    {
      id: 'file',
      icon: 'i-solar-folder-with-files-bold',
      label: '文件',
      disabled: isDisabledFile.value,
      onClick: () => inputOssFileUploadRef.value?.openSelector?.({})
    }
  ]

  // 群主可以发送群通知
  if (isLord.value) {
    tools.push({
      id: 'notice',
      icon: 'i-carbon:bullhorn',
      label: '群通知',
      onClick: () => (showGroupNoticeDialog.value = true)
    })
  }

  // 私聊可以语音/视频通话
  if (isSelfRoom.value) {
    tools.push(
      {
        id: 'audio-call',
        icon: 'i-solar:phone-calling-bold',
        label: '语音通话',
        onClick: () => chat.openRtcCall(chat.theRoomId!, CallTypeEnum.AUDIO)
      },
      {
        id: 'video-call',
        icon: 'i-solar:videocamera-record-bold',
        label: '视频通话',
        onClick: () => chat.openRtcCall(chat.theRoomId!, CallTypeEnum.VIDEO)
      }
    )
  }

  return tools
})

// 到底部并消费消息
function setReadAndScrollBottom() {
  if (chat.theRoomId) {
    chat.setReadList(chat.theRoomId)
    chat.scrollBottom()
  }
}

function getSwitch() {
  chat.msgForm.msgType = chat.msgForm.msgType === MessageType.TEXT ? MessageType.SOUND : MessageType.TEXT
  chat.msgForm.content = ''
  handlePlayAudio('del')
}

// watch
// 房间号变化
let timer: any = 0
watch(
  () => chat.theRoomId,
  (newVal, oldVal) => {
    if (newVal === oldVal) {
      return
    }
    resetForm()
    // 加载数据
    loadUser()
    loadAi(newVal)
    // 移动端与动画兼容
    loadInputTimer.value && clearTimeout(loadInputTimer.value)
    if (!setting.isMobileSize) {
      loadInputDone.value = true
    } else {
      loadInputTimer.value = setTimeout(() => {
        loadInputDone.value = true
      }, 400)
      return
    }
    if (inputContentRef.value?.input) inputContentRef.value?.input?.focus() // 聚焦
  },
  {
    immediate: true
  }
)

// 回复消息
watch(
  () => chat.replyMsg?.message?.id,
  (val) => {
    chat.msgForm.body = {
      ...chat.msgForm.body,
      replyMsgId: val
    }
    nextTick(() => {
      if (inputContentRef.value?.input) inputContentRef.value?.input?.focus() // 聚焦
    })
  }
)
const formContain = ref()
function mousedownResize(e: MouseEvent) {
  const startY = e.clientY
  const startHeight = formContain.value.offsetHeight

  function onMouseMove(e: MouseEvent) {
    const newHeight = startHeight - (e.clientY - startY)
    formContain.value.style.height = newHeight + 'px'
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 生命周期
onMounted(() => {
  // 监听快捷键
  window.addEventListener('keydown', startAudio)
  !setting.isMobileSize && inputContentRef.value?.input?.focus() // 聚焦
  // At 用户
  mitter.on(MittEventType.CHAT_AT_USER, (e) => {
    if (isReplyAI.value) {
      // TODO: 待后期考虑添加引用@信息，让去理解
      ElMessage.warning('当前使用AI机器人无法@其他人')
      return
    }
    const { type, payload: userId } = e
    const user = userId ? chat.groupInformation.members.find((u: any) => u.user_id === userId) : { user: { nickname: '所有人' } } //所有人
    if (!user) {
      return ElMessage.warning('该用户不可艾特！')
    }
    if (type === 'add') {
      inputContentRef.value?.input?.focus()

      const atText = `@${user.user.nickname} `
      const currentContent = chat.msgForm.content || ''

      // 1. 如果已经存在完整的这个 @用户，直接返回不重复添加
      if (currentContent.includes(atText)) return

      // 2. 检查末尾是否正在输入这个名字 (解决输入一半或输入完名字的问题)
      // 匹配末尾是否有 @ 加 名字的一部分
      const mentionName = `@${user.user.nickname}`
      // 这里的逻辑：查找最后一次出现 '@' 的位置
      const lastAtPos = currentContent.lastIndexOf('@')

      if (lastAtPos !== -1) {
        // 获取 @ 之后的文本
        const partialName = currentContent.slice(lastAtPos)
        // 如果当前的 @文本 是目标名字的前缀（比如用户输入了 @张，或者完整输入了 @张三）
        if (mentionName.startsWith(partialName)) {
          // 将原有的部分删掉，替换为标准的 "@名字 "
          chat.msgForm.content = currentContent.slice(0, lastAtPos) + atText
          return
        }
      }

      // 3. 如果不是在末尾输入的（比如空内容或者在写别的话），直接追加
      chat.msgForm.content += atText
    } else if (type === 'remove') {
      const atIndex = chat?.msgForm?.content?.lastIndexOf?.(`@${user.user.nickname} `) ?? -1
      if (atIndex === -1 || !chat?.msgForm?.content) return
      chat.msgForm.content = chat.msgForm.content?.slice(0, atIndex) + chat.msgForm.content?.slice(atIndex + `@${user.user.nickname} `.length)
    } else if (type === 'clear') {
      //
    }
  })
  // / 询问ai机器人
  mitter.on(MittEventType.CAHT_ASK_AI_ROBOT, (e) => {
    const { type, payload: userId } = e
    const robot = aiOptions.value.find((u) => u.userId === userId)
    if (type === 'add' && robot) {
      if (robot) {
        chat.msgForm.content += `/${robot.nickName}(#${robot.username}) `
        inputContentRef.value?.input?.focus() // 聚焦
      }
    } else if (type === 'remove' && robot) {
      //
    } else if (type === 'clear') {
      //
    }
  })
  // 处理聚焦
  mitter.on(
    MittEventType.MSG_FORM,
    ({
      type
    }: // payload ={}
    MsgFormEventPlaoyload) => {
      if (type === 'focus') {
        inputContentRef.value?.input?.focus() // 聚焦
      } else if (type === 'blur') {
        inputContentRef.value?.input?.blur() // 聚焦
      }
    }
  )
})

function getPlayAudio() {
  handlePlayAudio('del')
  chat.msgForm.content = ''
}

onUnmounted(() => {
  mitter.off(MittEventType.CAHT_ASK_AI_ROBOT)
  mitter.off(MittEventType.CHAT_AT_USER)
  clearTimeout(timer)
  clearInterval(timer)
  timer = null
  loadInputTimer.value && clearTimeout(loadInputTimer.value)
  window.removeEventListener('keydown', startAudio)
})

onDeactivated(() => {
  showMobileTools.value = false
})

const emojis = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '😂',
  '🤣',
  '☺️',
  '😊',
  '😇',
  '🙂',
  '🙃',
  '😉',
  '😌',
  '😍',
  '🥰',
  '😘',
  '😗',
  '😙',
  '😚',
  '😋',
  '😛',
  '😝',
  '😜',
  '🤪',
  '🤨',
  '🧐',
  '🤓',
  '😎',
  '🤩',
  '🥳',
  '😏',
  '😒',
  '😞',
  '😔',
  '😟',
  '😕',
  '🙁',
  '☹️',
  '😣',
  '😖',
  '😫',
  '😩',
  '🥺',
  '😢',
  '😭',
  '😤',
  '😠',
  '😡',
  '🤬',
  '🤯',
  '😳',
  '🥵',
  '🥶',
  '😱',
  '😨',
  '😰',
  '😥',
  '😓',
  '🤗',
  '🤔',
  '🤭',
  '🤫',
  '🤥',
  '😶',
  '😐',
  '😑',
  '😬',
  '🙄',
  '😯',
  '😦',
  '😧',
  '😮',
  '😲',
  '🥱',
  '😴',
  '🤤',
  '😪',
  '😵',
  '🤐',
  '🥴',
  '🤢',
  '🤮',
  '🤧',
  '😷',
  '🤒',
  '🤕',
  '🤑',
  '🤠',
  '😈',
  '👿',
  '👹',
  '👺',
  '🤡',
  '💩',
  '👻',
  '💀',
  '☠️',
  '👽',
  '👾',
  '🤖',
  '🎃',
  '😺',
  '😸',
  '😹',
  '😻',
  '😼',
  '😽',
  '🙀',
  '😿',
  '😾',
  '🤝🏻',
  '🤝🏼',
  '🤝🏽',
  '🤝🏾',
  '🤝🏿',
  '❤️‍🔥',
  '❤️‍🩹',
  '💔',
  '❣️',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '🤚🏽',
  '🖐🏽',
  '✋🏽',
  '🖖🏽',
  '👌🏽',
  '🤏🏽',
  '✌🏽',
  '🤞🏽',
  '🤟🏽',
  '🤘🏽',
  '🤙🏽',
  '👈🏽',
  '👉🏽',
  '👆🏽',
  '🖕🏽',
  '👇🏽',
  '☝🏽',
  '👍🏽',
  '👎🏽',
  '✊🏽',
  '👊🏽',
  '🤛🏽',
  '🤜🏽',
  '👏🏽',
  '🙌🏽',
  '👐🏽',
  '🤲🏽',
  '🙏🏽',
  '✍🏽',
  '💅🏽',
  '🤳🏽',
  '💪🏽',
  '👀',
  '🎄',
  '🌈',
  '☀️',
  '🌤',
  '⛅️',
  '🌥',
  '☁️',
  '🌦',
  '🌧',
  '⛈',
  '🌩',
  '🌨',
  '❄️',
  '☃️',
  '🍔',
  '🍟',
  '🍕',
  '🥪',
  '🥙',
  '🧆',
  '🌮',
  '🌯',
  '🥗',
  '🎁',
  '🎈',
  '🎏',
  '🎀',
  '🎊',
  '🎉',
  '🎆'
]

// 控制 tooltip 显示
const tooltipVisible = ref(false)

// 点击 emoji 表情：插入、隐藏 tooltip
function handleEmojiClick(emoji: string) {
  tooltipVisible.value = false

  // 获取 textarea DOM
  const textarea = inputContentRef.value?.$el?.querySelector('textarea') as HTMLTextAreaElement
  if (!textarea) return

  // 获取光标位置
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const original = chat.msgForm.content || ''

  // 插入 emoji 到当前光标位置
  chat.msgForm.content = original.slice(0, start) + emoji + original.slice(end)

  // 设置光标位置并 focus
  nextTick(() => {
    textarea.focus()
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length
  })
}

watch(
  () => chat.msgForm.content,
  (newVal: any, oldVal: any) => {
    const mentionPattern = /@([^\s@]+)\s?$/
    const match = newVal.match(mentionPattern)
    if (match) {
      const selected = match[1] // 比如“张三”
      console.log('截取@:', selected)
      if (selected === '所有人') {
        chat.setAtAll(chat.groupInformation.members.filter((item: any) => item.user_id !== user.userInfo.id))
        return
      }
      const arr = chat.groupInformation.members.filter((item: any) => item.user.nickname === selected)[0]
      console.log('用户刚插入了 mention:', arr)
      chat.setAtUid(arr)
      // 你可以做其他事情，比如设置当前@的对象
    }
  }
)

function onTooltipHide() {
  tooltipVisible.value = !tooltipVisible.value
  console.log(tooltipVisible.value)
}

defineExpose({
  resetForm,
  onContextFileMenu,
  onClickOutside: () => {
    showMobileTools.value = false
  }
})
</script>

<template>
  <el-form ref="formRef" :model="chat.msgForm" v-bind="$attrs" :disabled="isDisabledFile">
    <!-- 拖拽上传遮罩 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="isDragDropOver"
          key="drag-over"
          :data-tauri-drag-region="setting.isDesktop"
          class="fixed left-0 top-0 z-3000 h-full w-full flex select-none items-center justify-center card-rounded-df backdrop-blur border-default"
        >
          <div
            class="flex-row-c-c flex-col border-(1px [--el-border-color] dashed) rounded-4 p-6 transition-all hover:(border-1px border-[--el-color-primary] border-solid) card-default-br sm:p-12 text-small !hover:text-color"
          >
            <i class="i-solar:upload-minimalistic-linear p-4" />
            <p class="mt-4 text-0.8rem sm:text-1rem"> 拖拽文件到此处上传 </p>
          </div>
        </div>
      </Transition>
    </Teleport>
    <Teleport to="main">
      <Transition name="fade">
        <div v-if="isDragOver" class="fixed left-0 top-0 z-3000 h-full w-full flex select-none items-center justify-center card-rounded-df backdrop-blur border-default">
          <!-- <div
            class="flex-row-c-c flex-col border-(1px [--el-border-color] dashed) rounded-4 p-6 transition-all hover:(border-1px border-[--el-color-primary] border-solid) card-default-br sm:p-12 text-small !hover:text-color"
          >
            <i class="i-solar:upload-minimalistic-linear p-4" />
            <p class="mt-4 text-0.8rem sm:text-1rem"> 拖拽文件到此处上传 </p>
          </div> -->
        </div>
      </Transition>
    </Teleport>
    <!-- 预览 -->
    <ChatMsgAttachview
      :img-list="imgList"
      :video-list="videoList"
      :file-list="fileList"
      :reply-msg="chat.replyMsg"
      :the-contact="chat.theContact"
      :default-loading-icon="defaultLoadingIcon"
      :context-menu-theme="setting.contextMenuTheme"
      @remove-file="removeOssFile"
      @show-video="showVideoDialog"
      @clear-reply="chat.setReplyMsg({})"
      @scroll-bottom="setReadAndScrollBottom"
    />
    <div class="form-contain" ref="formContain" :class="{ 'form-disable': chat.msgContact.chat_type === 'group' && chat.groupInformation.members.length === 0 }">
      <div class="resize-handle" @mousedown="mousedownResize"></div>
      <!-- 工具栏 TODO: AI机器人暂不支持 -->
      <template v-if="!isAiRoom">
        <div class="relative h-9 flex flex-shrink-0 items-center gap-3 px-2 sm:gap-4">
          <el-tooltip popper-style="padding: 0.2em 0.5em;" :content="!isSoundRecordMsg ? (setting.isMobileSize ? '语音' : '语音 Ctrl+T') : '键盘'" placement="top">
            <i
              :class="!isSoundRecordMsg ? 'i-solar:microphone-3-broken hover:animate-pulse' : 'i-solar:keyboard-broken'"
              class="h-6 w-6 cursor-pointer btn-primary"
              @click="getSwitch"
            />
          </el-tooltip>
          <el-tooltip popper-style="padding: 0.2em 0.5em;" placement="top" trigger="hover" v-if="setting.isMobileSize">
            <!-- 表情面板内容 -->
            <template #content>
              <div class="grid grid-cols-10 gap-4 max-w-[390px] p-2" style="height: 20vh; overflow-y: auto">
                <span v-for="emoji in emojis" :key="emoji" class="cursor-pointer text-xl hover:scale-125 transition-transform" @click="handleEmojiClick(emoji)">
                  {{ emoji }}
                </span>
              </div>
            </template>

            <i class="h-6 w-6 cursor-pointer btn-primary i-solar:smile-circle-linear hover:animate-pulse" />
          </el-tooltip>
          <!-- 语音 -->
          <template v-if="isSoundRecordMsg">
            <div v-show="!theAudioFile?.id" class="absolute-center-x">
              <BtnElButton
                ref="pressHandleRef"
                type="primary"
                class="group tracking-0.1em hover:shadow"
                :class="{ 'is-chating': isChating }"
                style="padding: 0.8rem 3rem"
                round
                size="small"
              >
                <i i-solar:soundwave-line-duotone class="icon" p-2.5 />
                <div class="text w-5rem truncate text-center transition-width group-hover:(w-6rem sm:w-8rem) sm:w-8rem">
                  <span class="chating-hidden">{{ isChating ? `正在输入 ${second}s` : setting.isMobileSize ? '语音' : '语音 Ctrl+T' }}</span>
                  <span hidden class="chating-show">停止录音 {{ second ? `${second}s` : '' }}</span>
                </div>
              </BtnElButton>
            </div>
            <div v-show="theAudioFile?.id" class="absolute-center-x">
              <i p-2.4 />
              <BtnElButton
                type="primary"
                class="group tracking-0.1em op-60 hover:op-100"
                :class="{ 'is-chating !op-100': isPalyAudio }"
                style="padding: 0.8rem 3rem"
                round
                size="small"
                @click="handlePlayAudio(isPalyAudio ? 'stop' : 'play', theAudioFile?.id)"
              >
                {{ second ? `${second}s` : '' }}
                <i :class="isPalyAudio ? 'i-solar:stop-bold' : 'i-solar:play-bold'" class="icon" ml-2 p-1 />
              </BtnElButton>
              <i i-solar:trash-bin-minimalistic-broken ml-3 p-2.4 btn-danger @click="getPlayAudio" />
            </div>
            <BtnElButton
              v-if="setting.isMobileSize"
              :disabled="!user.isLogin || isSending || isNotExistOrNorFriend"
              type="primary"
              round
              style="height: 1.8rem !important"
              class="ml-a w-3.6rem text-xs tracking-0.1em"
              :loading="isBtnLoading"
              @click="handleFileSubmit('voice')"
            >
              发送
            </BtnElButton>
          </template>
          <!-- 非语音 -->
          <template v-else>
            <div v-show="!setting.isMobileSize" class="grid cols-4 items-center gap-3 sm:flex sm:gap-4">
              <!-- 图片 -->
              <InputOssFileUpload
                ref="inputOssImgUploadRef"
                v-model="imgList"
                :multiple="true"
                :preview="false"
                :size="setting.systemConstant.ossInfo?.image?.fileSize"
                :min-size="1024"
                :limit="9"
                :disable="isDisabledFile"
                class="i-solar:album-line-duotone h-6 w-6 cursor-pointer sm:(h-5 w-5) btn-primary"
                pre-class="hidden"
                :upload-type="OssFileType.IMAGE"
                input-class="op-0 h-6 w-6 sm:(w-5 h-5) cursor-pointer "
                :upload-quality="0.5"
                @error-msg="(msg:string) => {
                  ElMessage.error(msg)
                }"
                @submit="onSubmitImg"
              />
              <!-- 视频 -->
              <InputOssFileUpload
                ref="inputOssVideoUploadRef"
                v-model="videoList"
                :multiple="false"
                :size="setting.systemConstant.ossInfo?.video?.fileSize"
                :min-size="1024"
                :preview="false"
                :limit="1"
                :disable="isDisabledFile"
                class="i-solar:video-library-line-duotone h-6 w-6 cursor-pointer sm:(h-5 w-5) btn-primary"
                pre-class="hidden"
                :upload-type="OssFileType.VIDEO"
                input-class="op-0 h-6 w-6 sm:(w-5 h-5) cursor-pointer "
                accept=".mp4,.webm,.mpeg,.flv"
                @error-msg="(msg:string) => {
                  ElMessage.error(msg)
                }"
                @submit="onSubmitVideo"
              />
              <!-- 文件 -->
              <InputOssFileUpload
                ref="inputOssFileUploadRef"
                v-model="fileList"
                :multiple="false"
                :min-size="0"
                :preview="false"
                :limit="1"
                :disable="isDisabledFile"
                class="i-solar-folder-with-files-line-duotone h-6 w-6 cursor-pointer sm:(h-5 w-5) btn-primary"
                pre-class="hidden"
                :upload-type="OssFileType.FILE"
                input-class="op-0 h-6 w-6 sm:(w-5 h-5) cursor-pointer "
                accept=""
                @error-msg="(msg:string) => {
                  ElMessage.error(msg)
                }"
                @submit="onSubmitFile"
              />
              <el-tooltip popper-style="padding: 0.2em 0.5em;" placement="top" trigger="hover">
                <!-- 表情面板内容 -->
                <template #content>
                  <div class="grid grid-cols-20 gap-4 max-w-[730px] p-2">
                    <span v-for="emoji in emojis" :key="emoji" class="cursor-pointer text-xl hover:scale-125 transition-transform" @click="handleEmojiClick(emoji)">
                      {{ emoji }}
                    </span>
                  </div>
                </template>

                <i class="h-6 w-6 cursor-pointer btn-primary i-solar:smile-circle-linear hover:animate-pulse" />
              </el-tooltip>
              <i
                class="h-6 w-6 cursor-pointer btn-primary i-solar:chat-round-dots-line-duotone hover:animate-pulse"
                @click="
                  () => {
                    showDialog = true
                  }
                "
              />
            </div>
            <!-- AI机器人选择器 -->
            <el-select
              v-if="aiOptions.length > 0"
              v-model="chat.askAiRobotList"
              placeholder="AI助手"
              size="small"
              style="width: 9rem"
              :multiple-limit="6"
              no-match-text="没有找到机器人"
              :fallback-placements="['top']"
              no-data-text="暂无机器人"
              placement="top"
              tag-type="primary"
              tag-effect="dark"
              :show-arrow="false"
              class="group ai-select text-1rem text-color"
              :class="{ 'selected-items': chat.askAiRobotList.length > 0 }"
              popper-class="w-9rem global-custom-select"
              :offset="8"
              :value-on-clear="undefined"
              clearable
              teleported
              collapse-tags
              multiple
              :max-collapse-tags="2"
            >
              <template #prefix>
                <i class="robot-select-icon" />
              </template>
              <template #label="{ value }">
                <CardAvatar class="h-5 w-5 shrink-0 rounded-1/2 bg-color" :src="BaseUrlImg + value.avatar" :title="value.label" />
              </template>
              <el-option v-for="item in aiOptions" :key="item.userId" :label="item.nickName" :value="item">
                <div class="h-full w-8em flex items-center pr-1" :title="item.label">
                  <CardAvatar class="h-6 w-6 shrink-0 rounded-1/2 border-default bg-color" :src="BaseUrlImg + item.avatar" />
                  <span class="ml-2 flex-1 truncate">{{ item.label }}</span>
                </div>
              </el-option>
            </el-select>
            <i ml-a block w-0 />
            <!-- 群通知消息 -->
            <div
              v-if="chat.msgContact.chat_type === 'group'"
              title="群待办"
              class="i-solar:check-square-broken inline-block p-3.2 transition-200 btn-primary sm:p-2.8"
              @click="showGroupTodoDialog = true"
            />
            <div
              v-if="chat.msgContact.chat_type === 'group'"
              title="群公告"
              class="i-carbon:bullhorn inline-block p-3.2 transition-200 btn-primary sm:p-2.8"
              @click="showGroupNoticeDialog = true"
            />
            <template v-if="isSelfRoom && !setting.isMobileSize">
              <!-- 语音通话 -->
              <div title="语音通话" class="i-solar:phone-calling-outline p-3 transition-200 btn-primary sm:p-2.8" @click="chat.openRtcCall(chat.theRoomId!, CallTypeEnum.AUDIO)" />
              <!-- 视频通话 -->
              <div
                title="视频通话"
                class="i-solar:videocamera-record-line-duotone p-3.2 transition-200 btn-primary sm:p-2.8"
                @click="chat.openRtcCall(chat.theRoomId!, CallTypeEnum.VIDEO)"
              />
            </template>
            <!-- 工具栏打开扩展 -->
            <span
              class="i-solar:add-circle-linear inline-block p-3 transition-200 sm:hidden btn-primary"
              :class="{ 'rotate-45': showMobileTools }"
              @click="showMobileTools = !showMobileTools"
            />
          </template>
        </div>
        <!-- 录音 -->
        <p v-if="isSoundRecordMsg" class="relative max-h-3.1rem min-h-3.1rem w-full flex-row-c-c flex-1 overflow-y-auto text-wrap sm:(h-fit max-h-full p-6) text-small">
          {{
            (isChating && speechRecognition.isSupported) || theAudioFile?.id ? audioTransfromText || '...' : `识别你的声音 🎧${speechRecognition.isSupported ? '' : '（不支持）'}`
          }}
        </p>
        <p
          v-if="chat.msgContact.chat_type === 'group' && chat.groupInformation.members.length === 0"
          class="relative max-h-3.1rem min-h-3.1rem w-full flex-row-c-c flex-1 overflow-y-auto text-wrap sm:(h-fit max-h-full p-6) text-small"
        >
          你已不在当前群聊
        </p>
      </template>
      <!-- 内容（文本） -->
      <el-form-item
        v-if="!isSoundRecordMsg"
        prop="content"
        class="input relative h-fit w-full"
        style="padding: 0; margin: 0"
        :rules="[{ min: 1, max: maxContentLen, message: `长度在 1 到 ${maxContentLen} 个字符`, trigger: `change` }]"
      >
        <el-mention
          v-if="loadInputDone"
          ref="inputContentRef"
          v-model="chat.msgForm.content"
          :options="mentionList"
          :prefix="['@']"
          popper-class="at-select border-default"
          :check-is-whole="(pattern: string, value: string) => checkAtUserWhole(chat.msgForm.content, pattern, value)"
          :rows="setting.isMobileSize ? 1 : 6"
          :maxlength="maxContentLen"
          :placeholder="aiOptions.length ? '输入 / 唤起AI助手' : ''"
          :autosize="setting.isMobileSize"
          type="textarea"
          resize="none"
          :class="{
            focused: chat.msgForm.content
          }"
          placement="top"
          autofocus
          :show-word-limit="!setting.isMobileSize"
          whole
          :offset="10"
          :popper-options="{
            placement: 'top-start'
          }"
          @focus="inputFocus = true"
          @blur="inputFocus = false"
          @paste.stop="onPaste($event)"
          @keydown.exact.enter.stop.prevent="onMentionEnter()"
          @keydown.exact.arrow-up.stop.prevent="onInputExactKey('ArrowUp')"
          @keydown.exact.arrow-down.stop.prevent="onInputExactKey('ArrowDown')"
        >
          <template #label="{ item }">
            <div class="h-full w-9rem flex items-center pr-1" :title="item.user.nickname">
              <img class="h-6 w-6 rounded-full border-default" :src="item.user.portrait" />
              <span class="ml-2 flex-1 truncate">{{ item.user.nickname }}</span>
            </div>
          </template>
        </el-mention>
        <BtnElButton
          v-if="setting.isMobileSize"
          :disabled="!user.isLogin || isSending || isNotExistOrNorFriend"
          type="primary"
          style="height: 2.2rem !important"
          class="mb-1px ml-2 mr-2 w-4.5rem"
          :loading="isBtnLoading"
          @click="handleSubmit()"
        >
          发送
        </BtnElButton>
      </el-form-item>
      <!-- 发送 -->
      <div v-if="!setting.isMobileSize" class="hidden items-end p-1 pt-0 sm:flex">
        <!-- <div v-if="chat.replyMsg?.user?.id" prop="body.replyMsgId" class="w-full text-sm">
          <div class="w-full flex animate-[300ms_fade-in] items-center p-2 shadow card-default-br border-default-hover">
            <el-tag effect="dark" size="small" class="mr-2 shrink-0"> 回复 </el-tag>
            <div class="max-w-4/5 truncate">
              {{ `${chat.replyMsg?.user?.nickname}: ${chat.replyMsg ? resolveMsgReplyText(chat.replyMsg) : '未知'}` }}
            </div>
            <div
              class="i-solar:close-circle-bold ml-a h-6 w-6 text-dark op-80 transition-200 transition-color sm:(h-5 w-5) btn-default dark:text-light hover:text-[var(--el-color-danger)]"
              @click="chat.setReplyMsg({})"
            />
          </div>
        </div> -->
        <div class="tip ml-a hidden sm:block text-mini"> Enter发送, Shift+Enter换行 </div>
        <BtnElButton
          v-if="chat.msgForm.msgType === MessageType.SOUND"
          class="group ml-a overflow-hidden tracking-0.2em shadow sm:ml-2"
          type="primary"
          round
          :disable="isNotExistOrNorFriend"
          :icon-class="isSending || isNotExistOrNorFriend ? '' : 'i-solar:chat-round-dots-linear mr-1'"
          size="small"
          :loading="!chat.msgForm.content"
          style="padding: 0.8rem; width: 6rem"
          @click="handleFileSubmit('voice')"
        >
          发送&nbsp;
        </BtnElButton>
        <BtnElButton
          v-else
          class="group ml-a overflow-hidden tracking-0.2em shadow sm:ml-2"
          type="primary"
          round
          :disable="isNotExistOrNorFriend"
          :icon-class="isSending || isNotExistOrNorFriend ? '' : 'i-solar:chat-round-dots-linear mr-1'"
          size="small"
          :loading="isBtnLoading"
          style="padding: 0.8rem; width: 6rem"
          @click="handleSubmit()"
        >
          发送&nbsp;
        </BtnElButton>
      </div>
      <div v-show="isNotExistOrNorFriend" class="absolute left-0 top-0 h-full w-full flex-row-c-c border-0 border-t-1px tracking-2px shadow backdrop-blur-4px border-default">
        <span op-80>
          <i i-solar:adhesive-plaster-bold-duotone mr-3 p-2.4 />
          {{ chat.theContact.type !== undefined && SelfExistTextMap[chat?.theContact?.type] }}
        </span>
      </div>
    </div>
  </el-form>
  <!-- 移动端菜单栏 -->
  <Transition name="slide-height">
    <div v-if="showMobileTools && !isAiRoom && setting.isMobileSize" class="w-full overflow-hidden">
      <div class="grid-container min-h-28vh flex select-none">
        <div class="grid grid-cols-4 my-a w-full gap-4 p-4">
          <div
            v-for="tool in mobileTools"
            :key="tool.id"
            class="flex-row-c-c flex-col gap-1 transition-200 hover:op-70"
            :class="[tool.className, tool.disabled ? 'op-50 pointer-events-none' : 'cursor-pointer']"
            @click="!tool.disabled ? tool.onClick?.() : undefined"
          >
            <span h-12 w-12 flex-row-c-c card-default>
              <i class="p-3" :class="[tool.icon]" />
            </span>
            <span class="text-xs">{{ tool.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <!-- 新建通知 -->
  <ChatGroupNoticeMsgDialog v-model:show="showGroupNoticeDialog" @submit="onSubmitGroupNoticeMsg" />
  <ChatGroupTodoDialog v-model:show="showGroupTodoDialog" @submit="onSubmitGroupTodoMsg" type="" />

  <dialogChatDialog v-model:visible="showDialog" />
</template>

<style lang="scss" scoped>
.form-contain {
  position: relative;
  --at-apply: 'card-bg-color sm:bg-transparent relative sm:h-62 flex flex-col justify-between overflow-hidden px-2 pb-5 border-default-t';
  box-shadow: rgba(0, 0, 0, 0.02) 0px -2px 16px;
  .tip {
    --at-apply: 'op-0';
  }
  &:hover {
    .tip {
      --at-apply: 'op-100';
    }
  }
  .resize-handle {
    position: absolute;
    top: 0;
    left: 0; /* 控制哪条边可拖动 */
    width: 100%; /* 拖拽条宽度 */
    height: 2px;
    cursor: s-resize;
    background: transparent; /* 或加点透明色方便调试 */
    z-index: 999;

    &:hover {
      background: var(--el-color-primary-light-3);
    }
  }
  :deep(.el-textarea) {
    height: 100% !important;
  }
}
.at-select {
  :deep(.el-select__wrapper),
  :deep(.el-select-v2__input-wrapper),
  :deep(.el-input__wrapper) {
    box-shadow: none !important;
    background-color: transparent;
    padding: 0;
  }
  :deep(.el-form-item__error) {
    padding-left: 1rem;
  }
}
:deep(.el-form-item__content) {
  padding: 0;
}

.input {
  --at-apply: 'flex-1';
  :deep(.el-form-item__content) {
    display: flex;
    margin-top: 0.5rem;
    .el-mention {
      width: auto;
      flex: 1;
      height: 100%;
    }
  }
  :deep(.el-input__count) {
    left: 0.8em;
    bottom: -3.5em;
    width: fit-content;
    background-color: transparent;
    transition: opacity 0.2s;
    opacity: 0;
  }
  :deep(.el-text__inner),
  :deep(.el-textarea__inner) {
    resize: none;
    box-shadow: none !important;
    height: 100%;
    background-color: transparent;
    caret-color: var(--el-color-primary);
    font-size: 1rem;
    &:hover + .el-input__count {
      opacity: 1;
    }
    &::-webkit-input-placeholder {
      font-size: 0.9em;
      line-height: 1.7em;
    }
  }
  :deep(.el-input) {
    --at-apply: 'p-2';
    .el-input__wrapper {
      box-shadow: none !important;
      outline: none !important;
      --at-apply: 'bg-color-2';
    }
    .el-input__suffix {
      display: none !important;
    }
    .el-input-group__append {
      border: none;
      outline: none;
      box-shadow: none;
      --at-apply: 'w-5em card-rounded-df px-4 ml-2 text-center bg-[var(--el-color-primary)] text-white text-center ';
    }
  }

  // 移动端尺寸下scss
  @media (max-width: 768px) {
    :deep(.el-form-item__content) {
      .el-input__count {
        left: auto;
        right: 1.2em;
        bottom: 0.8em;
      }
      .el-textarea {
        padding-left: 0.6em;
        .el-textarea__inner {
          min-height: 2.2rem !important;
          --at-apply: 'bg-light-900 dark:bg-[#111111] shadow-lg shadow-inset';
        }
      }
    }
  }
}

.ai-select {
  :deep(.el-select__wrapper) {
    --at-apply: 'rounded-4 flex-row-c-c pr-3 pl-2 h-7 min-w-9rem w-fit !border-default !sm:border-(1px solid transparent) sm:!bg-transparent !shadow-none';
    &:hover,
    &.is-hoving,
    &.is-focused {
      --at-apply: '!border-default';
    }
    .el-select__placeholder {
      --at-apply: '!text-color tracking-0.1em op-80';
    }
    .el-tag {
      --at-apply: 'text-light rounded-4 !h-fit min-h-5 w-5 p-0 bg-none border-none cursor-pointer';
      .el-tag__close {
        --at-apply: 'hidden';
      }
    }
    .in-tooltip {
      --at-apply: 'h-fit';
    }
    .el-select__tags-text {
      --at-apply: 'flex-row-c-c';
    }
    .el-select__selected-item {
      animation: latter-slice-left 0.3s both;
      &.el-select__placeholder {
        animation: none;
      }
    }
  }
  .robot-select-icon {
    --at-apply: 'text-color p-2.4 i-ri:robot-2-line';
  }

  &.selected-items {
    :deep(.el-select__wrapper) {
      --at-apply: '!border-default';
      .robot-select-icon {
        --at-apply: 'bg-theme-primary';
      }
      .el-select__prefix {
        --at-apply: 'relative';
        &::after {
          content: '';
          --at-apply: 'absolute -z-1 inset-0 rounded-full bg-theme-primary animate-ping';
        }
      }
    }
  }
}

// 语音
.is-chating {
  --at-apply: 'shadow';
  --shadow-color: var(--el-color-primary);
  --shadow-color2: var(--el-color-primary-light-3);
  outline: none !important;
  background-size: 400% 400%;
  transition: all 0.2s;
  animation: aniamte-poppup-pluse 1s linear infinite;
  background-image: linear-gradient(to right, var(--shadow-color2) 0%, var(--shadow-color) 50%, var(--shadow-color2) 100%);
  background-color: var(--shadow-color);
  border-color: var(--shadow-color);
  &:deep(.el-button) {
    outline: none !important;
  }
  &:hover .chating-hidden {
    --at-apply: 'hidden';
  }
  &:hover .chating-show {
    --at-apply: 'inline-block';
  }
  .icon {
    --at-apply: 'animate-pulse';
  }
  .text {
    --at-apply: 'w-6rem !sm:w-8rem';
  }
  &:hover {
    --at-apply: 'shadow-md';
    --shadow-color: var(--el-color-danger);
    --shadow-color2: var(--el-color-danger-light-3);
    box-shadow: 0 0 0.8rem var(--shadow-color);
    animation-play-state: paused;
    background-color: var(-shadow-color);
    border-color: var(-shadow-color);
  }
}

@keyframes aniamte-poppup-pluse {
  0% {
    box-shadow: 0 0 0.5rem var(--shadow-color);
    background-position: 0% 50%;
  }
  50% {
    box-shadow: 0 0 1.2rem var(--shadow-color);
    background-position: 100% 50%;
  }
  100% {
    box-shadow: 0 0 0.5rem var(--shadow-color);
    background-position: 0% 50%;
  }
}

.play-btn {
  background-color: #7e7e7e7a;
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  --at-apply: 'text-white  border-(2px solid #ffffff) bg-(gray-5 op-30) backdrop-blur-3px';
  .bg-blur {
    --at-apply: ' bg-(gray-5 op-30) backdrop-blur';
  }
}

// 添加高度渐变动画
.slide-height-enter-active,
.slide-height-leave-active {
  transition: all 0.3s ease;
  max-height: 28vh;
  opacity: 1;
  overflow: hidden;
}

.slide-height-enter-from,
.slide-height-leave-to {
  max-height: 0;
  opacity: 0;
}
.grid-container {
  height: auto;
  transform-origin: top;
}
.form-disable {
  pointer-events: none;
  cursor: not-allowed;
}
</style>
