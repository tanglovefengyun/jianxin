<script lang="ts" setup>
// @ts-ignore
// import QRCode from 'qrcode'

// import { dayjs } from "element-plus";

/**
 * 消息模板（默认文本）
 * ctx-name 用于右键菜单
 */
const { data } = defineProps<{
  data: any
  prevMsg?: any
  index: number
}>()
const emit = defineEmits()

const chat = useChatStore()
const user = useUserStore()
const ws = useWsStore()
const settings = useSettingStore()
// 具体
interface TextBodyVO extends TextBodyMsgVO {
  _textTranslation?: Partial<TranslationVO>
}
const msgId = computed(() => data.message?.id as number | undefined)
const body = computed(() => data.message?.body as Partial<TextBodyVO> | undefined)
const isSelf = user?.userInfo?.id && data?.user?.id === user?.userInfo?.id
// 关闭翻译
function clearTranslation() {
  if (body?.value?._textTranslation) {
    closeTranslation(msgId.value as number, body.value._textTranslation.targetLang!)
    body.value._textTranslation = undefined
  }
}

// 状态计算只在需要时进行
const sendStatus = computed(() => {
  // if (typeof data.id === "string") {
  //   return chat.getMsgQueue(data.message.id as any)?.status;
  // }
  return undefined
})

// 计算是否需要显示回复
const showReply = computed(() => !!body.value?.reply)

// 计算是否需要显示@提醒
const showAtMe = computed(() => !!body.value?.atUidList?.length && body.value.atUidList.includes(user?.userInfo?.id))

// 计算是否需要显示翻译
const showTranslation = computed(() => !!body.value?._textTranslation)

function getUserData() {
  console.log(data)
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
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function formatContent(data: any): string {
  const urlRegex = /((https?:\/\/)[\w\-]+(\.[\w\-]+)+(?:[^\s<>"]|&\w+;)*)(?=\s|$)/gi
  return data.content.replace(urlRegex, (url: any) => {
    return `<a href="${url}" target="_blank" style="text-decoration: underline;">${escapeHtml(url)}</a>`
  })
}

const msgRef = ref<HTMLElement | null>(null)
const observer = ref<IntersectionObserver>()

// const selectedText = ref('')
// const qrCodeDataUrl = ref('')

// async function generateQRCode(text: string) {
//   try {
//     qrCodeDataUrl.value = await QRCode.toDataURL(text)
//     console.log(qrCodeDataUrl.value)
//   } catch (err) {
//     console.error('二维码生成失败:', err)
//   }
// }

// function handleMouseUp() {
//   const selection = window.getSelection()
//   const text = selection?.toString().trim()
//   console.log(text)

//   if (text) {
//     selectedText.value = text
//     generateQRCode(text)
//   }
// }

// watch(
//   () => data,
//   async (val: any) => {
//     console.log(val, 'data.status')

//     const now = Math.floor(Date.now() / 1000) // 当前时间戳（单位：秒）
//     const ts = Number(val?.timestamp) // val 中的时间戳
//     console.log(now + 50 - ts, 'data.ts')
//     if (ts && now + 50 - ts > 1 && val.status === 'sending') {
//       console.warn('消息超时超过5秒，且仍处于发送中状态')
//       // 在这里执行你的逻辑，比如：
//       await ws.updateIndexedDBField(val.id, 'status', 'error')
//       await ws.getAllMessagesContent()
//     }
//   },
//   { deep: true, immediate: true }
// )

onMounted(() => {
  // window.addEventListener('mouseup', handleMouseUp)
  // setInterval(async () => {
  //   const now = Math.floor(Date.now() / 1000)
  //   for (const msg of ws.messagesList) {
  //     const ts = Number(msg.timestamp)
  //     console.log(now + 50 - ts, 'data.ts')
  //     if (ts && now + 50 - ts > 5 && msg.status === 'sending') {
  //       console.warn('发现超时未回消息:', msg.id)
  //       await ws.updateIndexedDBField(msg.id, 'status', 'error')
  //     }
  //   }

  //   // 可选：刷新本地消息
  //   await ws.getAllMessagesContent()
  // }, 1000)
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement

          // ✅ 是我自己发的消息
          if (data.user_id !== user.userInfo.id && data.read_status != 1) {
            markMessageAsRead(data) // 已读处理逻辑
            ws.updateIndexedDBField(data.h5_local_id, 'read_status', 1)
            chat.newChatMessage = chat.newChatMessage.filter((item: any) => item.h5_local_id != data.h5_local_id)
          }
          // ✅ 如果只需要触发一次就 unobserve
          observer.value?.unobserve(el)
        }
        console.log(chat.newChatMessage, 'newChatMessage')
      })
    },
    {
      threshold: 0.5 // 元素至少露出 50% 才算进入视口
    }
  )

  nextTick(() => {
    if (msgRef.value) {
      observer.value?.observe(msgRef.value)
    }
  })
})

// onUnmounted(() => {
//   window.removeEventListener('mouseup', handleMouseUp)
// })

function markMessageAsRead(msg: any) {
  console.log('标记为已读:', msg)
  // 你自己的接口调用逻辑
  ws.send({
    websocket_type: 'read',
    data: {
      chat_id: msg.chat_id,
      id: msg.id
    }
  })
  ws.closeNotification(msg.id)
}

const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return ''

  const date = new Date(timestamp * 1000)
  const now = new Date()

  // 1. 获取日期的零点（忽略时分秒进行对比）
  const dateZero = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  // 2. 计算天数差 (一天的毫秒数是 86400000)
  const diffDays = Math.floor((nowZero - dateZero) / (24 * 60 * 60 * 1000))

  // 3. 提取基础的时间部分
  const Y = date.getFullYear()
  const M = (date.getMonth() + 1).toString().padStart(2, '0')
  const D = date.getDate().toString().padStart(2, '0')
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')

  const timeStr = `${h}:${m}` // 时:分

  // 4. 判断返回格式
  if (diffDays === 0) {
    return `今天 ${timeStr}`
  } else if (diffDays === 1) {
    return `昨天 ${timeStr}`
  } else if (diffDays === 2) {
    return `前天 ${timeStr}`
  } else if (Y === now.getFullYear()) {
    // 同一年内，显示月-日
    return `${M}-${D} ${timeStr}`
  } else {
    // 跨年，显示完整年月日
    return `${Y}-${M}-${D} ${timeStr}`
  }
}
</script>

<template>
  <div
    class="msg flex items-start"
    :data-h5-local-id="data.h5_local_id"
    ref="msgRef"
    :class="{ self: isSelf, 'choice-mode': chat.choiceMessageState, 'cursor-pointer': chat.choiceMessageState, 'bg-#cccccc/30': chat.selectedMessages.some((item: any) => item.id === data.id) }"
    v-bind="$attrs"
    @click.stop="
      () => {
        if (chat.choiceMessageState) {
          chat.toggleMessageSelection(data)
        }
      }
    "
  >
    <div v-if="chat.choiceMessageState" :style="{ order: isSelf ? 0 : -10 }" class="px-2">
      <el-checkbox class="custom-circle-checkbox" :model-value="chat.selectedMessages.some((item: any) => item.id === data.id)" size="large" />
    </div>

    <el-popover placement="right-start" trigger="click" :width="250" popper-class="user-info-popover" :popper-style="{ zIndex: 999 }" :style="{ order: isSelf ? 2 : 1 }">
      <template #default>
        <div class="p-1">
          <div class="flex items-center gap-2 mb-3">
            <img :src="data.user.portrait" class="w-12 h-12 card-rounded-df object-cover shadow-sm card-bg-color-2" @click="handleImagePreview(data.user.portrait)" />
            <div class="font-bold text-base">{{ data.user.nickname }}</div>
          </div>
          <div class="text-sm card-bg-color-2 mb-2 p-1" style="border-radius: 0.375rem"> 部门：{{ data.user?.department?.name || '' }} </div>
          <div class="text-sm card-bg-color-2 mb-2 p-1" style="border-radius: 0.375rem"> 职位：{{ data.user?.job || '' }} </div>
          <div class="text-sm card-bg-color-2 mb-2 p-1" style="border-radius: 0.375rem">
            电话：<a :href="`tel:${data.user.phone}`">{{ data.user?.phone || '' }}</a>
          </div>
          <BtnElButton
            v-show="data.user_id !== user.userInfo.id && data.chat_info.chat_type === 'group'"
            class="group-hover:opacity-100"
            key="send"
            icon-class="i-solar:chat-line-bold p-2 mr-2"
            style="transition: 0.2s; max-width: 9em; text-align: center; letter-spacing: 1px"
            type="primary"
            @click="chat.toContactSendMsg('private', data.user)"
          >
            发送消息&ensp;
          </BtnElButton>
        </div>
      </template>

      <template #reference>
        <img :src="data.user.portrait" class="avatar h-2.4rem w-2.4rem flex-shrink-0 cursor-pointer rounded-1/2 object-cover border-default" />
      </template>
    </el-popover>

    <div class="body" :style="{ order: isSelf ? 1 : 2 }">
      <div class="flex-res">
        <small class="nickname flex-1 truncate flex" ctx-name="nickname">
          {{ data.user.nickname }}
          <span v-show="user.userInfo.role != 0 && !isSelf">({{ data.user.name }})</span>
          <span class="msg_timestamp">{{ formatTimestamp(data.timestamp) }}</span>
        </small>
        <slot name="name-after" />
        <ChatMsgSendStatus v-if="data.status && data.status == 'sending'" :status="MessageSendStatus.SENDING" :msg-id="data.id" />
        <ChatMsgSendStatus v-else-if="data.status && data.status == 'error'" :status="MessageSendStatus.ERROR" :msg-id="data.h5_local_id" />
      </div>

      <slot name="body" :send-status="sendStatus">
        <div class="flex" style="align-items: end">
          <i
            v-if="settings.isMobileSize"
            :style="{ order: isSelf ? 0 : 1 }"
            class="reply-icon i-solar:menu-dots-outline mr-1 p-2"
            :class="isSelf ? 'mr-2' : 'ml-2'"
            @click="$emit('clickContextMenu', $event)"
          />
          <p class="msg-popper msg-wrap" ctx-name="content" v-html="formatContent(data)"></p>
        </div>

        <span class="read-status" v-show="data.user_id == user.userInfo.id && !data.readList">未读</span>
        <span class="read-status read" v-if="chat.msgContact.chat_type !== 'group'" v-show="data.readList && data.readList.length > 0">已读</span>
        <el-tooltip v-else placement="left" effect="dark" trigger="click" popper-class="read-tooltip">
          <template #default>
            <span class="read-status read" v-if="data.readList && data.readList.length > 0">
              {{ data.readList.length == chat.groupInformation.members.length - 1 ? '全部已读' : `${data.readList.length}人已读` }}
            </span>
          </template>
          <template #content>
            <div class="read-user-list">
              <div v-for="item in data.readList" :key="item.id" class="read-user">
                <img :src="item.portrait" alt="avatar" class="avater-box" />
                <span
                  >{{ item.nickname }} <small>{{ formatFriendlyDate(item.timestamp * 1000) }}</small></span
                >
              </div>
            </div>
          </template>
        </el-tooltip>
      </slot>

      <small v-if="data.quote" title="点击跳转" ctx-name="reply" class="reply" @click="chat.scrollReplyMsg(data?.quote?.id || 0, data?.quote?.content, false, data?.quote?.type)">
        <i class="reply-icon i-solar:forward-2-bold-duotone mr-1 p-2" />
        {{ `${data.quote?.user?.nickname} : ${resolveMsgReplyText(data?.quote) || ''}` }}
      </small>

      <small ctx-name="atUidList" class="at-list flex-ml-a" v-if="data.at_user && data.at_user.includes(user.userInfo.id)"> 有人@我 </small>

      <div v-if="showTranslation" key="translation" ctx-name="translation" class="group translation">
        <div ctx-name="translation" class="mb-2px select-none pb-2px tracking-0.1em border-default-b dark:op-80">
          <i ctx-name="translation" class="i-solar:check-circle-bold mr-1 bg-theme-info p-2.4" />
          {{ body?._textTranslation?.tool?.label || '' }}
          <NuxtLink :to="TranslationPagePath" class="ml-1 text-theme-info op-80 hover:op-100">
            {{ translationLangMap.get(body?._textTranslation?.sourceLang) || '自动' }} -> {{ translationLangMap.get(body?._textTranslation?.targetLang) || '自动' }}
          </NuxtLink>
          <i class="i-solar:close-circle-bold-duotone float-right p-2.4 btn-danger sm:(op-0 group-hover:op-100)" @click.stop="clearTranslation" />
        </div>
        {{ body?._textTranslation?.result || '' }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './msg.scss';

.msg-wrap a {
  color: #409eff;
  text-decoration: underline;
}

.body {
  position: relative;
  .read-status {
    font-size: 12px;
    line-height: 1;
    color: #5324ff;
    cursor: pointer;
  }
  .read {
    color: #9d9c9c;
  }
  &:hover {
    .msg_timestamp {
      display: inline-block;
    }
  }
}
.read-user-list {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 6px;
}
.read-user {
  font-size: 12px;
  padding: 0 2px;
  display: flex;
  align-items: center;
  margin: 0.4rem 0;
}
.read-tooltip {
  max-width: 250px;
}
.avater-box {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  margin-right: 0.4rem;
}
.flex-res {
  align-items: center;
}
:deep(.el-loading-spinner .circular) {
  height: 1.3rem;
  width: 1.3rem;
  margin-top: 0.2rem;
}
.custom-circle-checkbox :deep(.el-checkbox__inner) {
  /* 1. 设置为圆形 */
  border-radius: 50% !important;

  /* 2. 放大尺寸 */
  width: 20px !important;
  height: 20px !important;

  /* 3. 调整内部勾选图标的大小（可选） */
  &::after {
    height: 8px !important;
    width: 4px !important;
    left: 6px !important;
    top: 3px !important;
    border-width: 2px !important;
  }
}

/* 4. 如果你想让它选中时的颜色更醒目 */
.custom-circle-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--el-color-primary) !important;
  border-color: var(--el-color-primary) !important;
}

/* 调整鼠标悬浮时的光标区域 */
.custom-circle-checkbox {
  height: auto;
  margin-right: 0;
}
.msg_timestamp {
  font-size: 0.6rem;
  color: #888;
  display: none;
  margin: 0 4px;
}
.self .msg_timestamp {
  order: -1;
}
</style>
