<script lang="ts" setup>
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

const unReadContactList = ref<ChatContactDetailVO[]>([])
const channel = new BroadcastChannel('main_channel')
const applyUnReadCount = ref(0)
const unreadCount = computed(() => unReadContactList.value?.reduce((acc, cur) => acc + cur.unreadCount, 0) || 0 + applyUnReadCount.value)
const showScrollbar = computed(() => unReadContactList.value.length > 0 || applyUnReadCount.value > 0)
const appWindow = WebviewWindow.getCurrent()
// 监听消息
async function handleReadMessage(p: ChatContactDetailVO) {
  // 标记已读
  channel.postMessage({ type: 'readContact', data: JSON.parse(JSON.stringify(p)) })
  unReadContactList.value = unReadContactList.value.filter((item) => item.roomId !== p.roomId)
}

// 全部已读
async function readAllContact() {
  channel.postMessage({ type: 'readAllContact' })
  unReadContactList.value = []
}

// 处理好友申请点击事件
async function handleFriendApply() {
  // 发送消息到主窗口，打开好友申请页面
  channel.postMessage({ type: 'openFriendApply' })
  // 隐藏当前窗口
  appWindow.hide()
}

const user = useUserStore()
const ws = useWsStore()
const applyUnReadCountKey = computed(() => `applyUnReadCount_${user.userId}`)
onMounted(() => {
  // 监听localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === `chat_info_${user.userId}`) user.getChatInfo = JSON.parse(e.newValue || '[]')
  })
  // 主动获取
  try {
    user.getChatInfo = localStorage.getItem(`chat_info_${user.userId}`) ? JSON.parse(localStorage.getItem(`chat_info_${user.userId}`) || '[]') : []
  } catch (error) {
    console.warn(error)
  }
})

// 隐藏窗口
function handleMouseLeave() {
  appWindow.hide()
}

watch(
  () => appWindow,
  () => {
    user.getChatInfo = localStorage.getItem('chat_info_4') ? JSON.parse(localStorage.getItem('chat_info_4') || '[]') : []
  },
  { immediate: true }
)

const totalUnread = computed(() => {
  if (user.getChatInfo && user.getChatInfo.length > 0) {
    return user.getChatInfo.reduce((sum: number, item: any) => {
      console.log(item.unreadMsg, 'item.unreadMsg')

      return sum + (+item.unreadMsg || 0)
    }, 0)
  } else {
    return 0
  }
})

const newChatMessage = computed(() => {
  if (user.getChatInfo && user.getChatInfo.length > 0) {
    return user.getChatInfo.filter((item: any) => {
      return item.unreadMsg && item.unreadMsg > 0
    })
  } else {
    return []
  }
})

onBeforeUnmount(() => {
  channel.close()
  window.removeEventListener('storage', () => {})
})

definePageMeta({
  key: (route) => route.fullPath
})
</script>

<template>
  <div class="h-100vh overflow-hidden text-0.8rem" @mouseleave="handleMouseLeave">
    <NuxtLayout>
      <main class="h-100vh flex flex-col justify-between gap-3 truncate p-3">
        <div class="border-0 border-b-1px pb-2 border-default"> 新消息 ({{ totalUnread }}) </div>
        <el-scrollbar v-if="newChatMessage.length > 0" height="70vh" wrap-class="pb-4">
          <!-- 好友申请 -->
          <div
            v-if="applyUnReadCount > 0"
            title="查看好友申请"
            class="group w-full flex cursor-pointer gap-2 rounded bg-white p-2 shadow-sm transition-all !items-center dark:bg-dark-7 hover:(bg-[var(--el-color-primary)] text-light shadow-lg)"
            @click="handleFriendApply"
          >
            <div class="h-8 w-8 flex-row-c-c rounded-1 bg-theme-warning">
              <i i-solar:user-plus-bold bg-light p-2 />
            </div>
            <div class="flex flex-1 flex-col justify-between gap-1 truncate px-1">
              <p class="truncate"> 新的好友申请 </p>
              <p flex-row-bt-c gap-2 truncate op-60>
                <small truncate> 您有新的好友申请待处理 </small>
              </p>
            </div>
            <el-badge :value="applyUnReadCount" class="ml-1" />
          </div>
          <!-- 消息 -->
          <div
            v-for="p in newChatMessage"
            :key="p.id"
            title="读消息"
            class="group w-full flex cursor-pointer gap-2 rounded bg-white p-2 shadow-sm transition-all !items-center dark:bg-dark-7 hover:(bg-[var(--el-color-primary)] text-light shadow-lg)"
            @click="handleReadMessage(p)"
          >
            <CardElImage :src="p.portrait" fit="cover" class="h-8 w-8 rounded-1 object-cover card-default" />
            <div class="flex flex-1 flex-col justify-between gap-1 truncate px-1">
              <p class="truncate">
                {{ p.name || p.title }}
              </p>
              <p flex-row-bt-c gap-2 truncate op-60>
                <small truncate>
                  {{
                    p.msg_status === 2
                      ? '撤回了一条消息'
                      : p.type === 'voice'
                      ? '[语音]'
                      : p.type === 'image'
                      ? '[图片]'
                      : p.type === 'video'
                      ? '[视频]'
                      : p.type === 'file'
                      ? '[文件]'
                      : p.type === 'group_notice'
                      ? '[群公告]'
                      : p.type === 'oa_leave'
                      ? '[OA审批]'
                      : p.type === 'oa_todo'
                      ? '[待办事项]'
                      : p.type === 'oa_reimbursement'
                      ? '[报销审批]'
                      : p.type === 'oa_overtime'
                      ? '[加班审批]'
                      : p.content
                  }}
                </small>
              </p>
            </div>
            <el-badge :value="p.unreadMsg" class="ml-1" />
          </div>
        </el-scrollbar>

        <!-- <small v-if="unReadContactList.length || applyUnReadCount > 0" class="border-0 border-t-1px pt-2 text-right btn-info border-default" @click="readAllContact()">
          忽略全部
        </small> -->
        <!-- 没有消息 -->
        <div v-else class="flex-row-c-c flex-1 flex-col text-center op-70">
          <i i-solar:chat-dots-line-duotone class="mb-2 h-6 w-6" />
          <small class="text-sm"> 暂无新消息 </small>
        </div>
      </main>
    </NuxtLayout>
  </div>
</template>

<style scoped lang="scss">
.mains {
  --at-apply: 'grid grid-cols-1 pl-2rem pr-4rem sm:(grid-cols-[2fr_1fr] px-4rem)';
}
</style>
