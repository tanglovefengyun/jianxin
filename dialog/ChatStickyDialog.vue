<template>
  <el-dialog
    v-model="props.visible"
    width="600px"
    :title="dialogTitle"
    append-to="#__nuxt"
    class="wechat-chat-dialog"
    destroy-on-close
    @close="emit('update:visible', false)"
    :z-index="1000"
    header-class="headerDialog"
  >
    <el-scrollbar
      v-if="allMessages.length > 0"
      ref="scrollbarRef"
      class="max-w-full flex-1 chat-list"
      height="100%"
      wrap-class="px-0 shadow-inner-bg"
      view-class="pb-8 pt-4"
      @scroll="handleScroll"
    >
      <div v-for="(msg, index) in allMessages" :key="msg.id" class="chat-history">
        <div class="avatar">
          <img class="avatar-img" :src="msg.user.portrait" alt="avatar" />
          <div class="data-box">
            <span class="block mb-1" style="line-height: 1">{{ msg.user.nickname }}</span>
            <pre v-if="msg.type === 'text'" class="text-break font-ziti" v-html="formatMessage(msg.content)"></pre>
            <!-- <p v-if="msg.type == 'text'" class="text-break">{{ msg.content }}</p> -->
            <img v-else-if="msg.type == 'image'" class="data-img" :src="msg.content" @click="handleImagePreview(msg.content)" />
            <div
              v-else-if="msg.type == 'video'"
              class="relative cursor-pointer border-default-2 card-default hover:shadow transition-shadow overflow-hidden rounded-md img-tab"
              @click.stop="showVideoDetail($event, msg.content)"
              title="点击播放视频"
            >
              <video :src="msg.content" muted preload="metadata" playsinline class="w-full h-full object-cover pointer-events-none"></video>

              <!-- 播放按钮 -->
              <div class="play-btn absolute h-12 w-12 flex-row-c-c rounded-full absolute">
                <i i-solar:alt-arrow-right-bold ml-1 p-4 />
              </div>
            </div>
            <div
              v-else-if="msg.type == 'file'"
              ctx-name="file"
              :title="`${msg?.content.split('/').pop() || '未知文件'}`"
              class="file max-w-14em w-fit flex flex-row-reverse cursor-pointer gap-3 p-3 shadow-sm transition-all !items-center border-default hover:border-[var(--el-color-primary)] card-default bg-color hover:shadow-lg"
            >
              <img
                ctx-name="file"
                :src="msg.file_type && FILE_TYPE_ICON_MAP[msg.file_type] ? FILE_TYPE_ICON_MAP[msg.file_type] : FILE_TYPE_ICON_DEFAULT"
                class="file-icon h-8 w-8 object-contain"
              />

              <div ctx-name="file">
                <p ctx-name="file" class="text-overflow-2 text-sm leading-4 text-break">
                  {{ msg?.content.split('/').pop() || '未知文件' }}
                </p>
              </div>
            </div>
            <p v-else-if="msg.type == 'oa_leave' || msg.type == 'oa_todo' || msg.type == 'oa_reimbursement' || msg.type == 'oa_overtime'" class="text-break">[OA审批]</p>
            <p v-else-if="msg.type == 'group_notice'" class="text-break">[群公告]</p>
          </div>
        </div>
        <div class="date-box">
          <small>{{ formatFriendlyDate(msg.timestamp * 1000) }}</small>
          <small class="posation-small" @click="getRemoveSticky(msg)">移除</small>
        </div>
      </div>
    </el-scrollbar>
    <template v-else>
      <el-empty description="暂无置顶消息" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
const props = defineProps<{
  visible: boolean
}>()
const emit = defineEmits(['update:visible'])
const chat = useChatStore()
const ws = useWsStore()
const user = useUserStore()
// 分页显示逻辑
const pageSize = 10
const currentMessageCount = ref(pageSize)
const activeName = ref('first')
const searchKeyWords = ref('')
const scrollbarRef = ref()
const offset = ref(-678)
const dialogTitle = ref('')
const datePickerValue = ref('')
const datePickerPopover = ref(false)
// const datePickerResults = ref<any[]>([])
const disabledDate = (time: Date) => {
  return time.getTime() > Date.now()
}
// 获取当前聊天的全部消息
const allMessages = computed(() => {
  return ws.messagesList.filter((item: any) => item.chat_id == chat.chatId && item.msg_status == 3).sort((a: any, b: any) => a.timestamp - b.timestamp) // 升序排序
})
function formatMessage(text: any) {
  // 简单识别 http/https 链接
  const urlRegex = /(https?:\/\/[^\s]+)/g

  return text.replace(urlRegex, (url: any) => {
    // HTML 加样式，加点击事件
    return `<span style="text-decoration: underline; cursor: pointer;" onclick="window.open('${url}', '_blank')">${url}</span>`
  })
}

function scrollToBottom() {
  const scrollbar = scrollbarRef.value
  if (!scrollbar) return

  // 滚动到底部
  scrollbar.setScrollTop(scrollbar.wrapRef.scrollHeight)
}

// 实际显示的消息（分页控制）
const filteredMessages = computed(() => {
  const start = Math.max(0, allMessages.value.length - currentMessageCount.value)
  console.log(allMessages.value.slice(start), 'data.status')
  return allMessages.value.slice(start)
})
// 计算属性：根据选择日期过滤消息
const datePickerResults = computed(() => {
  if (!datePickerValue.value) return []

  // 获取选择日期的起始时间（00:00:00）
  const startOfDay = dayjs(datePickerValue.value).startOf('day').unix() // 秒
  const endOfDay = dayjs(datePickerValue.value).endOf('day').unix() // 秒

  return allMessages.value.filter((msg: any) => {
    return msg.timestamp >= startOfDay && msg.timestamp <= endOfDay
  })
})
// ✅ 用于保存搜索结果的响应式数组
const searchResults = ref<any[]>([])

// 监听关键词变化并过滤
watch(searchKeyWords, (keyword: any) => {
  if (!keyword.trim()) {
    searchResults.value = []
    return
  }

  const lowerKeyword = keyword.toLowerCase()
  searchResults.value = allMessages.value.filter((msg: any) => msg.type == 'text' && msg.content?.toLowerCase().includes(lowerKeyword))
})
function changeDatePicker(e: any) {
  activeName.value = 'fifth'
  if (!e) {
    activeName.value = 'first'
    datePickerPopover.value = false
  }
}

function highlightMatch(text: string, keyword: string): string {
  if (!keyword) return text
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escaped, 'gi')
  return text.replace(regex, (match) => `<span class="highlight">${match}</span>`)
}
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await nextTick(() => {
        scrollToBottom()
      })
      dialogTitle.value =
        filteredMessages.value[filteredMessages.value.length - 1].chat_info.chat_type == 'group'
          ? `${filteredMessages.value[filteredMessages.value.length - 1].chat_info.title}的置顶消息`
          : `与${filteredMessages.value[filteredMessages.value.length - 1].chat_info.title}的置顶消息`
    }
  }
)

// 滚动顶部加载更多
const loadMoreMessages = () => {
  if (currentMessageCount.value < allMessages.value.length) {
    const oldScrollHeight = scrollbarRef.value?.wrapRef?.scrollHeight || 0
    currentMessageCount.value += pageSize

    nextTick(() => {
      const newScrollHeight = scrollbarRef.value?.wrapRef?.scrollHeight || 0
      scrollbarRef.value?.setScrollTop(newScrollHeight - oldScrollHeight)
    })
  }
}

// 滚动事件监听
const handleScroll = (e: { scrollTop: number; scrollLeft: number }) => {
  const isAtBottom = e.scrollTop >= (scrollbarRef?.value?.wrapRef?.scrollHeight || 0) + offset.value
  if (isAtBottom) {
    chat.isScrollBottom = true
  } else {
    chat.isScrollBottom = false
  }
  if (e.scrollTop <= 10) {
    loadMoreMessages()
  }
}
function handleImagePreview(img: string) {
  if (!img) return
  useImageViewer.open({
    urlList: [img],
    index: 0,
    ctxName: 'img'
  })
}

// 点击预览播放（通知父组件或打开全屏播放器）
function showVideoDetail(e: MouseEvent, url: any) {
  if (!url) return

  mitter.emit(MittEventType.VIDEO_READY, {
    type: 'play',
    payload: {
      mouseX: e.clientX,
      mouseY: e.clientY,
      url: url,
      duration: 0,
      thumbWidth: 200,
      thumbHeight: 100
    }
  })
}

function handleClick() {}

function beforeLeaveTab(activeName: any, oldActiveName: any) {
  console.log(activeName)
  console.log(oldActiveName)
  if (activeName == 'fifth') {
    if (datePickerValue.value) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
}

// 定位到聊天位置
function getPositioning(msg: any) {
  emit('update:visible', false)
  chat.scrollReplyMsg(msg.id, msg.content, false)
}

function getRemoveSticky(row: any) {
  // ws.updateIndexedDBField(row.h5_local_id, 'msg_status', 1)
  // ws.getAllMessagesContent()
  const params = {
    chat_id: chat.msgContact.chat_id,
    id: row.id,
    status: 0
  }
  getChatMessageRecordTopApi(params, user.getToken)
}
</script>

<style scoped lang="scss">
.chat-list {
  height: 40vh;
  overflow-y: auto;
}
.chat-history {
  display: flex;
  justify-content: space-between;
  margin: 8px 0 20px 0;
  &:hover {
    .date-box {
      .posation-small {
        display: block;
      }
    }
  }
}
.avatar {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  width: 70%;
  .avatar-img {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 6px;
    margin-right: 6px;
  }
}
.date-box {
  width: 30%;
  text-align: right;
  display: flex;
  flex-direction: column;
  .posation-small {
    cursor: pointer;
    color: #ff4545;
    margin-top: 0.3rem;
    display: none;
  }
}
.data-box {
  width: 80%;
  .data-img {
    width: 100%;
    height: 10vh;
    object-fit: contain;
    object-position: left;
  }
}
.chat-list-img {
  height: calc(40vh + 40px);
  width: 100%;
  :deep(.el-scrollbar__wrap) {
    width: 100%;
  }
  :deep(.el-scrollbar__view) {
    display: flex;
    flex-wrap: wrap;
    // justify-content: center;
  }
  .chat-history-img-item {
    width: 25%;
    margin-bottom: 20px;
    .img-tab {
      width: 120px;
      height: 120px;
      object-fit: cover;
    }
  }
}
.chat-list-file {
  height: calc(40vh + 40px);
}
.play-btn {
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  border-width: 2px;
  border-color: rgb(255 255 255 / var(--un-border-opacity));
  border-style: solid;
  --un-bg-opacity: 1;
  background-color: rgb(107 114 128 / var(--un-bg-opacity)) /* #6b7280 */;
  --un-bg-opacity: 0.3;
  --un-text-opacity: 1;
  color: rgb(255 255 255 / var(--un-text-opacity)) /* #fff */;
  --un-backdrop-blur: blur(3px);
  -webkit-backdrop-filter: var(--un-backdrop-blur) var(--un-backdrop-brightness) var(--un-backdrop-contrast) var(--un-backdrop-grayscale) var(--un-backdrop-hue-rotate)
    var(--un-backdrop-invert) var(--un-backdrop-opacity) var(--un-backdrop-saturate) var(--un-backdrop-sepia);
  backdrop-filter: var(--un-backdrop-blur) var(--un-backdrop-brightness) var(--un-backdrop-contrast) var(--un-backdrop-grayscale) var(--un-backdrop-hue-rotate)
    var(--un-backdrop-invert) var(--un-backdrop-opacity) var(--un-backdrop-saturate) var(--un-backdrop-sepia);
  left: 45%;
  top: 50%;
  transform: translateX(-50%);
  transform: translateY(-50%);
}
.text-break {
  word-break: break-all;
  /* 样式区域 */
  :deep(.highlight) {
    color: #5d33f6;
    font-weight: bold;
  }
}
:deep(.el-empty) {
  width: 100%;
}
.font-ziti {
  font-family: auto;
}
</style>
