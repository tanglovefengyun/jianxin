<script lang="ts" setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'

const user = useUserStore()
const setting = useSettingStore()
const chat = useChatStore()
const ws = useWsStore()
const offset = computed(() => (setting.isMobileSize ? -730 : -678))

const { pageInfo, isLoading, isReload, msgList, scrollbarRef, syncMessages, loadData, reload, onScroll, init } = useMessageList()

init()

// 消息同步状态
const isSyncing = ref(false)
const showDialog = ref(false)
// 分页显示逻辑
const pageSize = 10
const currentMessageCount = ref(pageSize)

// 获取当前聊天的全部消息
const allMessages = computed(() => {
  // ws.getAllMessagesContent()
  console.log(
    '获取全部消息:',
    ws.messagesList.filter((item: any) => item.chat_id == chat.chatId).sort((a: any, b: any) => a.timestamp - b.timestamp)
  )
  return ws.messagesList.filter((item: any) => item.chat_id == chat.chatId).sort((a: any, b: any) => a.timestamp - b.timestamp) // 升序排序
})

// 实际显示的消息（分页控制）
const filteredMessages = computed(() => {
  const start = Math.max(0, allMessages.value.length - currentMessageCount.value)
  // console.log(allMessages.value.slice(start), 'data.status')
  return allMessages.value.slice(start)
})

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

// 监听窗口变化 & 消息变化自动滚动到底部
watch(
  () => setting.isMobileSize,
  (val, oldVal) => {
    if (val !== oldVal) {
      nextTick(() => {
        chat.scrollBottom(false)
      })
    }
  },
  { immediate: true }
)

watch(
  () => chat.chatId,
  () => {
    nextTick(() => {
      console.log(chat.newChatMessage, 'newChatMessage.value')
      chat.newChatMessage = []
      currentMessageCount.value = 10
      chat.scrollBottom(false)
      chat.allMsg = false
    })
  },
  { immediate: true }
)
watch(
  () => allMessages.value.length,
  () => {
    if (allMessages.value.length > 0) {
      nextTick(() => {
        if (allMessages.value[allMessages.value.length - 1].user_id == user.userInfo.id || chat.isScrollBottom) {
          chat.scrollBottom(false)
        } else {
          const obj = allMessages.value[allMessages.value.length - 1]
          chat.newChatMessage.push(obj as never)
          console.log(chat.newChatMessage, 'newChatMessage.value')
        }
      })
    }
  }
)

const allErrorMessages = computed(() => allMessages.value.filter((item: any) => item.msg_status === 3))
const lastErrorMsg = computed(() => {
  return [...allErrorMessages.value].sort((a, b) => a.timestamp - b.timestamp).at(-1)
})

function getRemoveSticky(row: any) {
  ws.updateIndexedDBField(row.h5_local_id, 'msg_status', 1)
  ws.getAllMessagesContent()
}

// 初始化 WebSocket 重连监听
onMounted(() => {
  mitter.on(MittEventType.WS_SYNC, ({ lastDisconnectTime, reconnectTime }) => {
    console.log(`消息同步中，时间：${reconnectTime - lastDisconnectTime}ms`)
    syncMessages()
  })
})

// 清理事件监听
onBeforeUnmount(() => {
  mitter.off(MittEventType.WS_SYNC)
})

// 暴露方法
defineExpose({
  reload,
  syncMessages
})
</script>

<template>
  <el-scrollbar ref="scrollbarRef" class="max-w-full flex-1" height="100%" wrap-class="px-0 shadow-inner-bg" view-class="pb-16 pt-4" @scroll="handleScroll">
    <div v-bind="$attrs" class="msg-list px-1 op-0 sm:px-2" :class="{ 'op-100  transition-(200 property-opacity)': !isReload }">
      <!-- <div
        v-if="allErrorMessages.length === 1"
        data-fade
        style="--anima: latter-slice-bottom"
        class="absolute top-2 z-2 flex-row-c-c w-10vw rounded p-2 shadow-lg bg-color-br text-mini cursor-pointer"
        @click="chat.scrollReplyMsg(lastErrorMsg.id || 0, lastErrorMsg.content, false)"
      >
        <i class="reply-icon i-solar:chat-round-call-bold mr-2 p-2 text-#5d33f6" />
        <div class="flex items-center justify-between overflow-hidden flex-1">
          <span class="truncate-text">{{ lastErrorMsg?.user.nickname }}: {{ resolveMsgReplyText(lastErrorMsg) }}</span>
          <span class="ml-1 shrink-0 text-red-500" @click.stop="getRemoveSticky(lastErrorMsg)">移除</span>
        </div>
      </div> -->

      <div
        data-fade
        style="--anima: latter-slice-bottom"
        class="absolute top-2 z-2 flex-row-c-c rounded p-2 shadow-lg bg-color-br text-mini cursor-pointer"
        :class="setting.isMobileSize ? 'w-10rem' : 'w-20rem'"
        @click="showDialog = true"
        v-if="allErrorMessages.length > 0"
      >
        <i class="reply-icon i-solar:chat-round-call-bold mr-2 p-2 text-#5d33f6" />
        <div class="flex items-center justify-between overflow-hidden flex-1">
          <span class="truncate-text">{{ lastErrorMsg?.user.nickname }}: {{ resolveMsgReplyText(lastErrorMsg) }}</span>
          <span class="ml-1 shrink-0">共{{ allErrorMessages.length }}条</span>
        </div>
      </div>

      <!-- <el-tooltip v-else-if="allErrorMessages.length > 1" class="box-item" trigger="click" content="Bottom Center prompts info" placement="bottom" popper-style="padding: 0 4px">
        <template #default>
          <div data-fade style="--anima: latter-slice-bottom" class="absolute top-2 z-2 flex-row-c-c w-10vw rounded p-2 shadow-lg bg-color-br text-mini cursor-pointer">
            <i class="reply-icon i-solar:chat-round-call-bold mr-2 p-2 text-#5d33f6" />
            <div class="flex items-center justify-between overflow-hidden flex-1">
              <span class="truncate-text">{{ lastErrorMsg?.user.nickname }}: {{ resolveMsgReplyText(lastErrorMsg) }}</span>
              <span class="ml-1 shrink-0">共{{ allErrorMessages.length }}条</span>
            </div>
          </div>
        </template>

        <template #content>
          <div
            v-for="item in allErrorMessages"
            :key="item.id"
            data-fade
            style="--anima: latter-slice-bottom"
            class="flex-row-c-c w-10vw rounded p-2 shadow-lg bg-color text-mini cursor-pointer mb-1 mt-1"
            @click="chat.scrollReplyMsg(item.id || 0, item.content, false)"
          >
            <i class="reply-icon i-solar:chat-round-call-bold mr-2 p-2 text-#5d33f6" />
            <div class="flex items-center justify-between overflow-hidden flex-1 text-black dark:text-white">
              <span class="truncate-text">{{ item.user.nickname }}: {{ resolveMsgReplyText(item) }}</span>
              <span class="ml-1 shrink-0 text-red-500" @click.stop="getRemoveSticky(item)">移除</span>
            </div>
          </div>
        </template>
      </el-tooltip> -->

      <ListDisAutoIncre :auto-stop="false" :delay="800" :threshold-height="200" :immediate="false" :no-more="currentMessageCount >= allMessages.length" :loading="false">
        <template #load>
          <div class="flex-row-c-c py-2 op-80 text-mini"> &nbsp; </div>
        </template>

        <ChatMsgMain
          v-for="(msg, i) in chat.allMsg ? allMessages : filteredMessages"
          :id="`chat-msg-${msg.id}`"
          :key="msg.id"
          :index="i"
          :data="msg"
          :prev-msg="filteredMessages[i - 1] || {}"
        />
      </ListDisAutoIncre>
    </div>

    <dialogChatStickyDialog v-model:visible="showDialog" />

    <ChatForwardDialog v-model:modelValue="chat.forwardMsg" />
  </el-scrollbar>
</template>

<style lang="scss" scoped>
.shadow-inner-bg {
  box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 8px inset, rgba(0, 0, 0, 0.1) 0px -2px 8px inset;
}
.isReload {
  .animate {
    animation: none !important;
  }
}
.truncate-text {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
