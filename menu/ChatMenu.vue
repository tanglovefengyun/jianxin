<script lang="ts" setup>
import { NuxtLink } from '#components'
import { useOpenExtendWind } from './extension'

defineEmits<{
  (e: 'close'): void
}>()
// 路由
const route = useRoute()
const user = useUserStore()
const ws = useWsStore()
const setting = useSettingStore()
const chat = useChatStore()

/**
 * 获取好友申请数量 (未读)
 */
async function getApplyCount() {
  // if (!user.getTokenFn())
  //   return;
  // const res = await getApplyUnRead(user.getToken);
  // if (res.code === StatusCode.SUCCESS) {
  //   chat.applyUnReadCount = res.data.unReadCount;
  // }
}
watch(
  () => route.path,
  (newVal, oldVal) => {
    if (newVal === '/friend' || oldVal === '/friend') {
      getApplyCount()
    }
  }
)
watch(
  () => ws.wsMsgList.applyMsg.length,
  (newVal, oldVal) => {
    getApplyCount()
  }
)
onMounted(() => {
  getApplyCount()
})
onActivated(() => {
  getApplyCount()
})
onDeactivated(() => {
  getApplyCount()
})

const { open: openExtendMenu } = useOpenExtendWind()
// @unocss-include
const menuList = computed<MenuItem[]>(() => {
  const isAdmin = (user.userInfo as any).type === 1

  const baseList: MenuItem[] = [
    {
      title: '聊天',
      path: '/',
      icon: 'i-solar:chat-line-broken',
      activeIcon: 'i-solar:chat-line-bold',
      tipValue: chat.unReadContactList.reduce((acc, cur) => acc + cur.unreadCount, 0)
    },
    {
      title: '好友',
      path: '/friend',
      icon: 'i-solar:users-group-rounded-line-duotone',
      activeIcon: 'i-solar:users-group-rounded-bold',
      tipValue: chat.applyUnReadCount
    },
    {
      title: '工作台',
      path: '/workbench',
      icon: 'i-solar:widget-linear',
      activeIcon: 'i-solar:widget-bold',
      tipValue: chat.applyUnReadCount
    },
    {
      title: '账号',
      path: '/user/safe',
      icon: 'i-solar:devices-outline',
      activeIcon: 'i-solar:devices-bold',
      class: 'absolute bottom-15 diabled-bg'
    },
    {
      title: '设置',
      path: '/setting',
      icon: 'i-solar:settings-linear hover:animate-spin block',
      activeIcon: 'i-solar:settings-bold hover:animate-spin block',
      class: 'absolute bottom-2 diabled-bg',
      tipValue: +setting.appUploader.isUpload,
      isDot: true
    }
  ]

  // 如果是管理员，过滤掉特定项
  return !isAdmin ? baseList.filter((item) => item.path !== '/friend' && item.path !== '/workbench') : baseList
})

const totalUnread = computed(() => {
  if (user.getChatInfo && user.getChatInfo.length > 0) {
    return user.getChatInfo.reduce((sum: number, item: any) => {
      return sum + (item.unreadMsg || 0)
    }, 0)
  } else {
    return 0
  }
})

watch(
  totalUnread,
  async (newCount: any) => {
    const nav = navigator as any

    if ('setAppBadge' in nav) {
      try {
        if (newCount > 0) {
          await nav.setAppBadge(newCount)
        } else {
          await nav.clearAppBadge()
        }
      } catch (e) {
        console.error('设置角标失败', e)
      }
    }
  },
  { immediate: true }
)

export interface MenuItem {
  title: string
  path?: string
  icon: string
  activeIcon: string
  tipValue?: any
  isDot?: boolean
  class?: string
  children?: MenuItem[]
  onClick?: (e: MouseEvent) => void
}
function scrollToFirstUnread() {
  console.log('触发双击事件')

  const chatList = user.getChatInfo
  const firstUnread = chatList.find((room: any) => room.unreadMsg > 0)
  if (firstUnread) {
    const el = document.getElementById(`contact-${firstUnread.id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}
</script>

<template>
  <div class="relative z-998 h-full flex flex-col border-default-r bg-color-2">
    <!-- 顶部 -->
    <div class="nav-padding-top-8 mx-a h-20 w-fit flex-row-c-c flex-shrink-0 border-default-b">
      <UserInfoPopper :data="user.userInfo" :is-edit="true" />
    </div>
    <!-- 菜单 -->
    <el-scrollbar height="100%" class="relative flex-1" view-class="flex flex-col gap-3 p-2">
      <component
        :is="p.path ? NuxtLink : 'div'"
        v-for="p in menuList"
        :key="p.path"
        v-loading="(p as any).loading"
        :to="p.path"
        :index="p.path"
        :element-loading-spinner="defaultLoadingIcon"
        element-loading-custom-class="text-.4em"
        :class="{
          action: route.path === p.path,
          [`${p.class}`]: p.class
        }"
        :title="p.title"
        class="group item"
        @click="(e: MouseEvent) => {
          if (p.onClick) {
            e.stopPropagation();
            p.onClick(e);
          }
        }"
        @dblclick="
          () => {
            if (p.path === '/') {
              scrollToFirstUnread()
            }
          }
        "
      >
        <el-badge
          v-if="p.path === '/workbench'"
          :value="
            (parseInt(user.getUnprocessedTodo) || 0) +
            (parseInt(user.getUnprocessedLeave) || 0) +
            (parseInt(user.getUnprocessedReimb) || 0) +
            (parseInt(user.getUnprocessedOvertime) || 0)
          "
          :hidden="
            !(
              (parseInt(user.getUnprocessedTodo) || 0) +
              (parseInt(user.getUnprocessedLeave) || 0) +
              (parseInt(user.getUnprocessedReimb) || 0) +
              (parseInt(user.getUnprocessedOvertime) || 0)
            ) || p.path !== '/workbench'
          "
          :is-dot="!!p?.isDot"
          :offset="[-2, -2]"
          :max="99"
        >
          <i class="icon p-2.6" :class="route.path === p.path ? p.activeIcon : p.icon" />
        </el-badge>
        <el-badge v-else :value="totalUnread" :hidden="!totalUnread || p.path !== '/'" :is-dot="!!p?.isDot" :offset="[-2, -2]" :max="99">
          <i class="icon p-2.6" :class="route.path === p.path ? p.activeIcon : p.icon" />
        </el-badge>
      </component>
    </el-scrollbar>
    <div
      v-if="setting.isChatFold"
      class="absolute left-0 top-0 block h-100dvh w-100vw overflow-hidden bg-[#8181811a] -z-1 md:hidden"
      style="background-color: #2222223a"
      @click="setting.isChatFold = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.icon-tip {
  position: absolute;
  right: 0;
  top: 0;
}
.item {
  --at-apply: 'card-rounded-df hover:(bg-gray-3 bg-op-30 dark:bg-dark-3 text-color-theme-primary) h-10 w-10 flex-row-c-c cursor-pointer transition-200';
  &.action {
    --at-apply: 'text-theme-primary bg-gray-4 bg-op-20 dark:bg-dark-5';
    .icon {
      --at-apply: 'text-theme-primary block';
      filter: drop-shadow(0 0 8px var(--el-color-primary));
    }
  }
  :deep(.el-badge) {
    .el-badge__content {
      font-size: 0.6em !important;
    }
  }
}
:deep(.el-scrollbar) {
  .el-scrollbar__thumb {
    --at-apply: 'bg-color-3';
  }
}
</style>
