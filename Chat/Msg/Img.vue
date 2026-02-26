<script lang="ts" setup>
import { getImgSize } from '.'

/**
 * 图片消息
 */
const { data } = defineProps<{
  data: any
  prevMsg: any
  index: number
}>()

const emit = defineEmits()

// 获取聊天store
const chat = useChatStore()
const user = useUserStore()
const ws = useWsStore()
const settings = useSettingStore()
const isSelf = user?.userInfo?.id && data?.user?.id === user?.userInfo?.id
// 具体
const body: Partial<ImgBodyMsgVO> & { showWidth?: string; showHeight?: string } = data.message?.body || {}
// 计算图片宽高
const { width, height } = getImgSize(body?.width, body?.height)
body.showWidth = width
body.showHeight = height

// 处理图片点击预览
function handleImagePreview() {
  if (!data.content) return

  // 获取当前房间的所有图片
  const contentList = ws.messagesList.filter((item: any) => item.chat_id == chat.chatId)
  const imgs = contentList.filter((item: any) => item.type == 'image')

  if (!imgs?.length) return
  // const currentImgUrl = BaseUrlImg + body?.url;
  const imgsUrl = imgs
    .slice()
    .sort((a: any, b: any) => a.timestamp - b.timestamp) // 时间戳降序
    .map((msg: any) => msg.content)

  console.log(imgsUrl)
  console.log(data.content)

  useImageViewer.open({
    urlList: imgsUrl,
    index: imgsUrl.indexOf(data.content),
    ctxName: 'img'
  })
}
</script>

<template>
  <ChatMsgTemplate :prev-msg="prevMsg" :index="index" :data="data" v-bind="$attrs">
    <template #body>
      <!-- 内容 -->
      <!-- <div
        v-if="data.type === 'image'"
        ctx-name="img"
        :style="{ width, height }"
        style="height: 15vh;"
        class="max-h-50vh max-w-76vw cursor-pointer shadow-sm transition-shadow md:(max-h-18rem max-w-18rem) border-default-2 card-default hover:shadow"
        @click="handleImagePreview"
      >
        <CardElImage
          :src="data.content"
          load-class="sky-loading block absolute  top-0"
          class="h-full w-full card-rounded-df"
          :alt="data.content"
          fit="contain"
          ctx-name="img"
          :preview="false"
        />
      </div> -->
      <div v-if="data.type === 'image'" ctx-name="img" class="img-wrapper">
        <i v-if="settings.isMobileSize && isSelf" class="reply-icon i-solar:menu-dots-outline mr-2 p-2" @click="$emit('clickContextMenu', $event)" />
        <img :src="data.content" class="image" :alt="data.content" ctx-name="img" @click="handleImagePreview" />
        <i v-if="settings.isMobileSize && !isSelf" class="reply-icon i-solar:menu-dots-outline ml-2 p-2" @click="$emit('clickContextMenu', $event)" />
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
      <!-- 内容 -->
      <!-- <p v-if="data?.content?.trim()" ctx-name="content" class="msg-popper msg-wrap">
        {{ data.content }}
      </p> -->
    </template>
  </ChatMsgTemplate>
</template>

<style lang="scss" scoped>
@use './msg.scss';

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
.img-wrapper {
  height: 15vh; /* 固定高度 */
  display: inline-block; /* 宽度跟随内容 */
  // overflow: hidden;
  cursor: pointer;
}

.image {
  height: 100%; /* 图片高度铺满容器 */
  width: auto;
  max-width: 45vw;
  border-radius: 0.5rem; /* card-rounded-df 替代写法 */
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1); /* hover阴影可以写js控制 */
  object-fit: contain;
}
</style>
