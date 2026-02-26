<script lang="ts" setup>
import {
  ChatMsgAiAskMsg,
  ChatMsgAiReplyMsg,
  ChatMsgDelete,
  ChatMsgFile,
  ChatMsgImg,
  ChatMsgNotice,
  ChatMsgOaLeave,
  ChatMsgOaOvertime,
  ChatMsgOaTodo,
  ChatMsgOaReimb,
  ChatMsgOther,
  ChatMsgRecall,
  ChatMsgRTC,
  ChatMsgSound,
  ChatMsgSystem,
  ChatMsgText,
  ChatMsgVideo
} from '#components'
import { MessageType } from '@/composables/api/chat/message'
import { onMsgContextMenu } from '.'

/**
 * 消息适配器
 */
const { data, prevMsg, index } = defineProps<{
  data: any
  prevMsg?: any
  index: number
  id?: string
}>()
const map: MsgComType = {
  [MessageType.TEXT]: ChatMsgText,
  [MessageType.RECALL]: ChatMsgRecall,
  [MessageType.DELETE]: ChatMsgDelete,
  [MessageType.IMG]: ChatMsgImg,
  [MessageType.VIDEO]: ChatMsgVideo,
  [MessageType.FILE]: ChatMsgFile,
  [MessageType.SYSTEM]: ChatMsgSystem,
  [MessageType.AI_CHAT]: ChatMsgAiAskMsg,
  [MessageType.SOUND]: ChatMsgSound,
  [MessageType.RTC]: ChatMsgRTC,
  [MessageType.AI_CHAT_REPLY]: ChatMsgAiReplyMsg,
  [MessageType.GROUP_NOTICE]: ChatMsgNotice, // 群通知消息
  [MessageType.OA]: ChatMsgOaLeave, // 请假消息
  [MessageType.OVERTIME]: ChatMsgOaOvertime, // 加班消息
  [MessageType.TODO]: ChatMsgOaTodo, // 待办消息
  [MessageType.REIMB]: ChatMsgOaReimb // 报销消息
}
interface MsgComType {
  [property: number]: any
}
const msgRef =
  ref<
    InstanceType<
      | typeof ChatMsgFile
      | typeof ChatMsgImg
      | typeof ChatMsgText
      | typeof ChatMsgVideo
      | typeof ChatMsgRecall
      | typeof ChatMsgDelete
      | typeof ChatMsgSystem
      | typeof ChatMsgSound
      | typeof ChatMsgRTC
      | typeof ChatMsgAiAskMsg
      | typeof ChatMsgOther
      | null
    >
  >()
const chat = useChatStore()
const user = useUserStore()

// 右键菜单
const showTranslation = ref(false)
// 是否显示时间
const showTime = prevMsg?.timestamp && data.timestamp - prevMsg?.timestamp > 300 // 5分钟外显示时间

// 点击头像
function onClickAvatar() {
  if (!data.fromUser.userId) return
  chat.setTheFriendOpt(FriendOptType.User, {
    id: data.fromUser.userId
  })
  nextTick(() => {
    navigateTo({
      path: '/friend',
      query: {
        dis: 1
      }
    })
  })
}

function getContentType(type: any) {
  return type === 'image'
    ? 3
    : type === 'video'
    ? 6
    : type === 'file'
    ? 4
    : type === 'voice'
    ? 5
    : type === 'group_notice'
    ? 13
    : type === 'oa_leave'
    ? 14
    : type === 'oa_todo'
    ? 15
    : type === 'oa_reimbursement'
    ? 16
    : type === 'oa_overtime'
    ? 17
    : 1
}

const conponentName = computed(() => map[getContentType(data?.type) || MessageType.TEXT] || ChatMsgOther)

function getReEdit() {
  chat.msgForm.content += data.content
  mitter.emit(MittEventType.MSG_FORM, { type: 'focus' })
}

function handleLongpress(e: any) {
  e.x = e.touches[0].clientX
  e.y = e.touches[0].clientY
  onMsgContextMenu(e as any, data, msgRef.value.onDownloadFileAndOpen)
}

function onClickContextMenu(e: MouseEvent) {
  onMsgContextMenu(e as any, data, msgRef.value.onDownloadFileAndOpen)
}
</script>

<template>
  <p v-if="showTime" v-once :key="`${index}_time`" w-full py-2 text-center text-0.8em op-60>
    {{ formatFriendlyDate(data.timestamp * 1000) }}
  </p>
  <p v-if="data.msg_status === 2" :key="`${data.id}`" w-full py-2 text-center text-0.8em op-60>
    {{ data.user_id == user.userInfo.id ? '你' : data.user.nickname }} 撤回了一条消息
    <strong v-show="data.type == 'text' && data.user_id == user.userInfo.id" class="text-#5d33f6 cursor-pointer" @click="getReEdit">重新编辑</strong>
  </p>
  <p v-if="data.type === 'group_invite'" :key="`${data.id}`" w-full py-2 text-center text-0.8em op-60>
    {{ data.content }}
  </p>
  <!-- <small class="absolute top-0 p-2 sticky-box mt-2 mr-2" v-if="data.msg_status === 3" :key="`${data.id}`"
    ><i class="reply-icon i-solar:chat-round-call-bold mr-1 p-2 text-#5d33f6" /> {{ data.user.nickname }}: {{ data.content }}
  </small> -->
  <component
    v-if="data.msg_status !== 2 && data.type !== 'group_invite' && (data.type == 'text' && data.content.trim()) !== ''"
    :is="conponentName"
    :id="id"
    ref="msgRef"
    :show-translation="showTranslation"
    :prev-msg="prevMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
    @click-avatar="onClickAvatar"
    @contextmenu="onMsgContextMenu($event, data, msgRef.onDownloadFileAndOpen)"
    @click-context-menu="onClickContextMenu($event)"
  />
  <!-- v-longpress="(e: any) => handleLongpress(e)" 手机端长按显示 -->
</template>

<style lang="scss" scoped>
@use './msg.scss';

.sticky-box {
  border-radius: 0.375rem;
  background-color: rgb(255 255 255 / var(--un-bg-opacity)) /* #fff */;
  cursor: pointer;
  width: 20%;
}
</style>
