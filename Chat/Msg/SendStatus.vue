<script lang="ts" setup>
import { Loading } from '@element-plus/icons-vue'
const { status } = defineProps<{
  status: MessageSendStatus
  msgId: any
}>()
const chat = useChatStore()
const titleMap: Record<MessageSendStatus, { title: string; className?: string }> = {
  [MessageSendStatus.ERROR]: {
    title: '点击重试',
    className: 'i-solar:refresh-linear  bg-theme-danger hover:rotate-180 btn-danger'
  },
  [MessageSendStatus.PENDING]: {
    title: '待发送',
    className: 'i-solar:clock-circle-line-duotone op-60'
  },
  [MessageSendStatus.SENDING]: {
    title: '发送中...',
    className: 'i-tabler:loader-2 animate-spin op-40 will-change: transform'
  },
  [MessageSendStatus.SUCCESS]: {
    title: ''
  }
}
const types = computed(() => titleMap[status as MessageSendStatus])
</script>

<template>
  <i v-if="status && status != MessageSendStatus.SENDING" :title="types?.title" class="my-a inline-block h-4.5 w-4.5" :class="types?.className" @click="chat.retryMessage(msgId)" />
  <el-icon v-else-if="status && status == MessageSendStatus.SENDING" class="is-loading">
    <Loading />
  </el-icon>
</template>

<style lang="scss" scoped>
</style>
