<script lang="ts" setup>
// props
const props = defineProps<{
  data: any
  prevMsg: any
  index: number
}>()
const emit = defineEmits()
const { data } = toRefs(props)
const body = props.data
const user = useUserStore()
const chat = useChatStore()
const settings = useSettingStore()
// 视频链接
const videoUrl = body?.content || ''
const isSelf = user?.userInfo?.id && body?.user?.id === user?.userInfo?.id
// 时长格式化
const minutes = Math.floor((body?.duration || 0) / 60)
const seconds = (body?.duration || 0) % 60
const formattedDuration = body?.duration ? `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` : ''

// 点击预览播放（通知父组件或打开全屏播放器）
function showVideoDetail(e: MouseEvent) {
  if (!videoUrl) return

  mitter.emit(MittEventType.VIDEO_READY, {
    type: 'play',
    payload: {
      mouseX: e.clientX,
      mouseY: e.clientY,
      url: videoUrl,
      duration: body.duration,
      size: body.size,
      thumbSize: body.thumbSize,
      thumbWidth: 200,
      thumbHeight: 100
    }
  })
}
</script>

<template>
  <ChatMsgTemplate :prev-msg="prevMsg" :index="index" :data="data" v-bind="$attrs">
    <template #body>
      <!-- 视频封面（用video标签展示第一帧） -->
      <div class="flex" style="align-items: end">
        <i
          v-if="settings.isMobileSize"
          :style="{ order: isSelf ? 0 : 1 }"
          class="reply-icon i-solar:menu-dots-outline mr-1 p-2"
          :class="isSelf ? 'mr-2' : 'ml-2'"
          @click="$emit('clickContextMenu', $event)"
        />
        <div
          class="relative cursor-pointer border-default-2 card-default hover:shadow transition-shadow overflow-hidden rounded-md"
          style="width: 200px; height: 120px"
          @click.stop="showVideoDetail($event)"
          title="点击播放视频"
        >
          <video :src="videoUrl" muted preload="metadata" playsinline class="w-full h-full object-cover pointer-events-none"></video>

          <!-- 播放按钮 -->
          <div class="play-btn absolute h-12 w-12 flex-row-c-c rounded-full absolute">
            <i i-solar:alt-arrow-right-bold ml-1 p-4 />
          </div>

          <!-- 时长 -->
          <div v-if="formattedDuration" class="absolute bottom-1 right-2 text-white text-shadow-lg text-xs">
            {{ formattedDuration }}
          </div>
        </div>
      </div>
      <span class="read-status" v-show="data.user_id == user.userInfo.id && !data.readList">未读</span>
      <span class="read-status read" v-if="chat.msgContact.chat_type !== 'group'" v-show="data.readList && data.readList.length > 0">已读</span>
      <el-tooltip v-else placement="left" effect="dark" trigger="click" popper-class="read-tooltip">
        <!-- 触发器：span -->
        <template #default>
          <span class="read-status read" v-if="data.readList && data.readList.length > 0">
            {{ data.readList.length == chat.groupInformation.members.length - 1 ? '全部已读' : `${data.readList.length}人已读` }}
          </span>
        </template>

        <!-- Tooltip 内容：循环 readList -->
        <template #content>
          <div class="read-user-list">
            <div v-for="item in data.readList" :key="item.id" class="read-user">
              <img :src="item.portrait" alt="avater" class="avater-box" />
              <span>{{ item.nickname }}</span>
            </div>
          </div>
        </template>
      </el-tooltip>
      <!-- 附带文字 -->
      <p v-if="data.message?.content?.trim()" class="msg-popper msg-wrap">
        {{ data.message.content }}
      </p>
    </template>
  </ChatMsgTemplate>
</template>

<style scoped lang="scss">
.play-btn {
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
  --at-apply: 'text-white border-(2px solid #ffffff) bg-(gray-5 op-30) backdrop-blur-3px';
  left: 40%;
  top: 50%;
  transform: translateX(-50%);
  transform: translateY(-50%);
}
.body {
  position: relative;
  .read-status {
    font-size: 12px;
    line-height: 1;
    color: #5324ff;
    cursor: pointer;
    float: right;
  }
  .read {
    color: #9d9c9c;
  }
}
.read-user-list {
  max-height: 200px;
  overflow-y: auto;
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
</style>
