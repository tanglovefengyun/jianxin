<script lang="ts" setup>
const chat = useChatStore()
const setting = useSettingStore()
const user = useUserStore()
const route = useRoute()
// 获取类型
const getType = computed(() => {
  let msg = ''
  switch (chat?.theContact?.type) {
    case RoomType.GROUP:
      msg = '群'
      break
    case RoomType.SELFT:
      msg = '私'
      break
    case RoomType.AICHAT:
      msg = 'AI'
      break
  }
  return msg
})

// 点击更多
function onClickMore() {
  switch (chat.msgContact.chat_type === 'group' ? 1 : 2) {
    case 1:
      console.log(chat.msgContact.chat_type)
      setting.isOpenGroupMember = !setting.isOpenGroupMember
      break
    case 2:
      break
  }
}

async function toggleContactOpen() {
  if (route.path !== '/') {
    await navigateTo('/')
    return
  }
  chat.isOpenContact = !chat.isOpenContact
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

const loading = ref(false)
const fetchedDetail = ref<any>({})

// 每次打开 Popover 前触发
async function fetchUserInfo() {
  loading.value = true
  try {
    // 假设你的接口需要当前聊天的用户 ID
    const userId = chat.msgContact.id || chat.privateInfo.id
    const res = await getFriendsUserInfoApi({ id: userId }, user.getToken)

    if (res.code == 0) {
      // 这里的字段根据你接口返回的实际结构调整
      fetchedDetail.value = res.data
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  } finally {
    // 模拟一下延迟，不然骨架屏闪太快看不见
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}
</script>

<template>
  <div :data-tauri-drag-region="setting.isDesktop" class="nav-padding-top-8 h-16 flex-row-bt-c rounded-0 pl-2 pr-4 sm:(h-20 pl-4)">
    <div :data-tauri-drag-region="setting.isDesktop" w-full flex items-center gap-3 @click="onClickMore" class="cursor-pointer">
      <!-- <CardElImage
        loading="lazy"
        :preview-src-list="[BaseUrlImg + chat?.theContact?.avatar]"
        preview-teleported
        :error-class="contactTypeIconClassMap[chat?.theContact?.type || RoomType.SELFT]"
        :alt="chat.theContact.name"
        :default-src="chat?.theContact?.avatar"
        class="h-2rem w-2rem flex-shrink-0 object-cover sm:(h-2.2rem w-2.2rem) border-default card-default"
      /> -->
      <div
        class="relative z-1000 mr-1 btn-primary"
        :class="!chat.isOpenContact ? 'flex-row-c-c animate-zoom-in animate-duration-200 sm:hidden' : 'hidden '"
        @click.stop="toggleContactOpen"
      >
        <i i-solar-alt-arrow-left-line-duotone p-3 />
      </div>
      <img
        v-if="chat.msgContact.chat_type === 'group'"
        class="h-2rem w-2rem flex-shrink-0 object-contain object-top sm:(h-2.2rem w-2.2rem) border-default card-default"
        :src="chat.msgContact.portrait || chat.groupInformation.portrait"
      />
      <el-popover v-else placement="right-start" trigger="click" :width="250" popper-class="user-info-popover" :popper-style="{ zIndex: 999 }" @before-enter="fetchUserInfo">
        <template #default>
          <div class="p-1">
            <el-skeleton :loading="loading" animated>
              <template #template>
                <div class="flex items-center gap-2 mb-3">
                  <el-skeleton-item variant="rect" style="width: 48px; height: 48px; border-radius: 6px" />
                  <el-skeleton-item variant="text" style="width: 50%" />
                </div>
                <el-skeleton-item variant="p" style="margin-bottom: 8px" />
                <el-skeleton-item variant="p" style="margin-bottom: 8px" />
                <el-skeleton-item variant="p" style="margin-bottom: 8px" />
              </template>

              <template #default>
                <div class="flex items-center gap-2 mb-3">
                  <img
                    :src="fetchedDetail.portrait"
                    class="w-12 h-12 card-rounded-df object-cover shadow-sm card-bg-color-2 cursor-pointer"
                    @click="handleImagePreview(fetchedDetail.portrait)"
                  />
                  <div class="font-bold text-base">{{ fetchedDetail.nickname }}</div>
                </div>

                <div class="text-sm card-bg-color-2 mb-2 p-1" style="border-radius: 0.375rem"> 部门：{{ fetchedDetail.department?.name || '暂无' }} </div>
                <div class="text-sm card-bg-color-2 mb-2 p-1" style="border-radius: 0.375rem"> 职位：{{ fetchedDetail.job || '暂无' }} </div>
                <div class="text-sm card-bg-color-2 mb-2 p-1" style="border-radius: 0.375rem">
                  电话：<a :href="`tel:${fetchedDetail.phone}`">{{ fetchedDetail.phone || '暂无' }}</a>
                </div>
              </template>
            </el-skeleton>
          </div>
        </template>

        <template #reference>
          <img
            class="h-2rem w-2rem flex-shrink-0 object-contain object-top sm:(h-2.2rem w-2.2rem) border-default card-default cursor-pointer"
            :src="chat.msgContact.portrait || chat.groupInformation.portrait"
          />
        </template>
      </el-popover>
      <span truncate text-sm font-500>
        {{ chat.msgContact.chat_type === 'group' ? chat.groupInformation.name || chat.msgContact.title : chat.msgContact.title || chat.msgContact.name
        }}<span v-show="user.userInfo.role != 0 && chat.msgContact.chat_type !== 'group'"
          >({{ chat.msgContact.name }}) &nbsp;<small style="color: #828385">{{ chat.privateInfo.signature || '' }}</small></span
        >
        <p text-sm font-400 style="font-size: 12px; color: #828385" v-if="chat.msgContact.chat_type !== 'group' && chat.msgContact.department && chat.msgContact.job"
          >{{ chat.msgContact.department.name || '' }} | {{ chat.msgContact.job || '' }}</p
        >
        <!-- {{ chat.msgContact.name || chat.msgContact.title || '' }} -->
      </span>
      <el-tag effect="dark" size="small" v-show="chat.msgContact.chat_type === 'group'"> 群 </el-tag>
      <!-- <span v-if="chat.theContact.type === RoomType.AICHAT" class="border-(1px  solid) rounded px-2 py-1 text-0.65rem text-light">AI生成内容，仅供参考！</span> -->
      <!-- <i
        class="ml-a flex-row-c-c grid-gap-2 btn-primary"
        transition="all  op-60 group-hover:op-100 300  cubic-bezier(0.61, 0.225, 0.195, 1.3)"
        i-solar:menu-dots-bold
        title="更多"
        p-2.2
        @click="onClickMore"
        v-show="chat.msgContact.chat_type === 'group' && chat.groupInformation.members.length > 0"
      /> -->
      <div class="ml-a flex items-center gap-1" v-if="chat.choiceMessageState">
        <el-button
          type="danger"
          plain
          size="small"
          class="!px-3"
          @click.stop="
            () => {
              chat.choiceMessageState = false
              chat.selectedMessages = []
            }
          "
        >
          <template #icon>
            <i class="i-solar:close-circle-bold text-lg" />
          </template>
          取消转发
        </el-button>

        <el-button
          type="primary"
          size="small"
          class="!px-4 shadow-sm"
          :disabled="chat.selectedMessages.length === 0"
          @click.stop="
            () => {
              chat.forwardMsg = true
            }
          "
        >
          <template #icon>
            <i class="i-solar:multiple-forward-right-line-duotone text-lg" />
          </template>
          转发消息 {{ chat.selectedMessages.length > 0 ? `(${chat.selectedMessages.length})` : '' }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// .right-item:nth-of-type(1){
//   --at-apply: "ml-a";
// }
</style>
