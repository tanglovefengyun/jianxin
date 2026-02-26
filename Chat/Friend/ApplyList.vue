<script lang="ts" setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'

const isLoading = ref<boolean>(false)
const isReload = ref<boolean>(false)
const user = useUserStore()
const chat = useChatStore()

const pageInfo = ref({
  cursor: null as null | string,
  isLast: false,
  size: 10,
  page: 0,
  total: -1
})

const list = ref<any[]>([]) // 部门列表
const memberList = ref<any[]>([]) // 成员列表
const openItemId = ref<number>() // 当前选中的部门 ID

onMounted(async () => {
  // isReload.value = true
  // await loadData(() => {
  //   isReload.value = false
  // })
})

// 加载部门数据
async function loadData(callback?: () => void) {
  if (isLoading.value || pageInfo.value.isLast) return
  pageInfo.value.page++
  isLoading.value = true

  const { data } = await getDepartmentListApi({ name: '', company_id: chat.theFriendOpt.data.id }, user.getToken)
  if (data.department) list.value = data.department

  pageInfo.value.isLast = Boolean(data.isLast)
  pageInfo.value.page = data.current || 1
  isLoading.value = false

  callback && callback()
}

// 加载指定部门的成员
async function selectDepartment(dept: any) {
  console.log(dept)

  openItemId.value = dept.id
  const { data } = await getDepartmentMembersApi(dept.id, user.getToken)
  memberList.value = data.user || []
}

// 刷新所有数据
// async function reload() {
//   pageInfo.value = {
//     cursor: null,
//     isLast: false,
//     size: 10,
//     page: 0,
//     total: -1
//   }
//   list.value = []
//   memberList.value = []
//   await loadData()
// }

// 自动刷新（收到新消息等）
watch(
  () => chat.theFriendOpt.data,
  async (newVal) => {
    if (chat.theFriendOpt.data) {
      isReload.value = true
      memberList.value = []
      await loadData(() => {
        isReload.value = false
      })
    }
  },
  { immediate: true, deep: true }
)

onBeforeUnmount(() => {
  chat.applyUnReadCount = 0
})
</script>

<template>
  <div class="flex h-full">
    <!-- 左侧：部门列表 -->
    <div class="w-1/3 border-r p-4 overflow-auto">
      <!-- 骨架屏 -->
      <template v-if="isReload">
        <div v-for="p in 10" :key="p" class="item">
          <div class="avatar-skeleton" />
          <div class="flex-1">
            <div class="skeleton-line w-3/4" />
            <div class="skeleton-line w-1/2 mt-1" />
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="p in list" :key="p.id" :class="['item', { 'bg-gray-2 dark:bg-dark-3': openItemId === p.id }]" @click.stop="selectDepartment(p)">
          <img src="~/assets/images/organize.png" alt="" class="avatar-icon" />
          <div class="flex flex-col truncate">
            <p class="truncate text-sm">{{ p.name || '未填写' }}</p>
          </div>
          <div class="ml-auto text-xs text-gray-500">{{ p.user_count }}人</div>
        </div>
      </template>
    </div>

    <!-- 右侧：部门成员 -->
    <div class="w-2/3 p-4 overflow-auto">
      <div v-if="memberList.length">
        <div v-for="member in memberList" :key="member.id" class="item member-item relative group">
          <img :src="member.portrait" class="avatar-icon" />
          <div class="flex flex-col truncate">
            <p class="truncate text-sm">{{ member.nickname }}</p>
            <p class="truncate text-xs text-gray-500 mt-1">{{ member.job || '暂无职位' }}</p>
          </div>
          <!-- 聊天按钮（悬浮显示） -->
          <!-- <button
        class="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-sm bg-primary text-white rounded px-2 py-1 shadow"
      >
        
      </button> -->
          <!-- @click="chat.toContactSendMsg('private', panelData.data)" -->
          <BtnElButton
            class="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
            key="send"
            icon-class="i-solar:chat-line-bold p-2 mr-2"
            style="transition: 0.2s; max-width: 9em; text-align: center; letter-spacing: 1px"
            type="primary"
            @click="chat.toContactSendMsg('private', member)"
          >
            发送消息&ensp;
          </BtnElButton>
        </div>
      </div>
      <div v-else class="text-gray-400 text-center mt-10">请选择左侧部门查看成员</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.avatar-icon {
  --at-apply: 'h-2.4rem w-2.4rem rounded-full bg-gray-2 object-cover mr-3';
}
.item {
  --at-apply: 'flex items-center gap-3 p-3 rounded hover:bg-op-30 transition-all cursor-pointer mb-2';
}
.avatar-skeleton {
  --at-apply: 'h-2.4rem w-2.4rem rounded-full bg-gray-1 dark:bg-dark-4 mr-3';
}
.skeleton-line {
  --at-apply: 'h-3 rounded bg-gray-1 dark:bg-dark-4';
}
.member-item {
  --at-apply: 'flex items-center gap-3 p-3 rounded transition-all cursor-pointer mb-2 relative hover:bg-gray-100 dark:hover:bg-dark-3';
}
.avatar-icon {
  --at-apply: 'h-2.4rem w-2.4rem rounded-full bg-gray-2 object-cover mr-3';
}
</style>
