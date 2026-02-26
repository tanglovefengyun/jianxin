<script lang="ts" setup>
/**
 * 文本消息
 */
const {
  data,
  showTranslation = false,
} = defineProps<{
  data: any
  prevMsg: any
  index: number
  showTranslation?: boolean
}>();
const user = useUserStore();
const chat = useChatStore();
// 具体
const body: Partial<SoundBodyMsgVO> = data || {};
const theSecond = ref(body.second);
const getSoundText = computed(() => {
  if (!theSecond.value)
    return "0\"";
  if (theSecond.value <= 60)
    return `${theSecond.value % 60}"`;
  else if (theSecond.value <= 3600)
    return `${Math.floor(theSecond.value / 60)}'${theSecond.value % 60}"`;
});

const getSoundTextRaw = computed(() => {
  if (!body.second)
    return "0\"";
  if (body.second <= 60)
    return `${body.second % 60}"`;
  else if (body.second <= 3600)
    return `${Math.floor(body.second / 60)}'${body.second % 60}"`;
});

// 点击播放音频
function playSound(newUrl?: string) {
  // if (chat.playSounder?.url === newUrl && chat.playSounder?.state === "play") {
  //   chat.playSounder?.audio?.pause();
  //   chat.playSounder.state = "pause";
  //   chat.playSounder.currentSecond = 0;
  //   return;
  // }
  // if (chat.playSounder?.url !== newUrl)
  //   resetPlaySounder();

  const audio = new Audio(newUrl);
  audio.play();
  chat.playSounder = {
    url: newUrl,
    state: "loading",
    currentSecond: 0,
    duration: body?.second || 0,
    audio,
  };
  theSecond.value = 0;
  audio.addEventListener("timeupdate", onTimeupdate);
  audio.addEventListener("ended", resetPlaySounder);
  audio.addEventListener("loadeddata", onLoadeddata);
  audio.addEventListener("pause", resetPlaySounder);
}
function onLoadeddata() {
  chat.playSounder.state = "play";
}
function onTimeupdate() {
  if (chat.playSounder?.state === "play") {
    const currentSecond = Math.floor(chat.playSounder.audio?.currentTime || 0);
    if (currentSecond !== chat.playSounder?.currentSecond) {
      chat.playSounder.currentSecond = currentSecond;
      theSecond.value = currentSecond;
    }
  }
}
// 重置播放器
function resetPlaySounder() {
  if (chat.playSounder) {
    chat.playSounder.audio?.pause();
    if (chat.playSounder.audio) {
      chat.playSounder.audio.src = "";
      chat.playSounder.audio.removeEventListener("timeupdate", onTimeupdate);
      chat.playSounder.audio.removeEventListener("ended", resetPlaySounder);
      chat.playSounder.audio.removeEventListener("loadeddata", onLoadeddata);
      chat.playSounder.audio.removeEventListener("pause", resetPlaySounder);
    }
    chat.playSounder.state = "stop";
    chat.playSounder.currentSecond = 0;
    chat.playSounder.audio = undefined;
    chat.playSounder.url = "";
  }
  theSecond.value = body?.second || 0;
}
</script>

<template>
  <ChatMsgTemplate
    :prev-msg="prevMsg"
    :index="index"
    :data="data"
    v-bind="$attrs"
  >
    <template #body>
      <div
        ctx-name="sound"
        class="msg-popper min-w-6em cursor-pointer hover:op-80"
        :class="{ 'animate-pulse': chat.playSounder?.url === data?.content && chat.playSounder?.state === 'play' }"
      >
        <p ctx-name="sound" @click="playSound(data?.content)">
          <i ctx-name="sound" :class="chat.playSounder?.url === data?.content && chat.playSounder?.state === 'loading' ? 'i-solar:menu-dots-bold-duotone animate-spin ' : 'i-solar:volume-loud-outline'" p-2 />
          {{ data?.voice_duration }}"
        </p>
        <small v-if="body?.translation && showTranslation" ctx-name="sound-translation" class="mt-2 block border-t-(1px #8585828e solid) pt-1.5">
          {{ body?.translation }}
        </small>
      </div>
      <span class="read-status" v-show="data.user_id == user.userInfo.id && !data.readList">未读</span>
      <span class="read-status read" v-if="chat.msgContact.chat_type !== 'group'" v-show="data.readList && data.readList.length > 0">已读</span>
        <el-tooltip
          v-else
          placement="left"
          effect="dark"
          trigger="click"
          popper-class="read-tooltip"
        >
          <!-- 触发器：span -->
          <template #default>
            <span
              class="read-status read"
              v-if="data.readList && data.readList.length > 0"
            >
              {{ data.readList.length == chat.groupInformation.members.length - 1 ? '全部已读' : `${data.readList.length}人已读` }}
            </span>
          </template>

          <!-- Tooltip 内容：循环 readList -->
          <template #content>
            <div class="read-user-list">
              <div v-for="item in data.readList" :key="item.id" class="read-user">
                <img :src="item.portrait" alt="avater" class="avater-box">
                <span>{{ item.nickname }}</span>
              </div>
            </div>
          </template>
        </el-tooltip>
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';

.body{
  position: relative;
  .read-status{
    font-size: 12px;
    line-height: 1;
    color: #5324ff;
    cursor: pointer;
    float: right;
  }
  .read{
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
.avater-box{
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  margin-right: 0.4rem;
}
</style>
