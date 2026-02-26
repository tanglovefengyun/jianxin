<script lang="ts" setup>
const chat = useChatStore()
const ws = useWsStore()
const user = useUserStore()

const companyList = ref<any>([])

function toggleView(type: FriendOptType, data: any = {}) {
  chat.setTheFriendOpt(type, data)
  // 消费消息
  ws.wsMsgList.applyMsg.splice(0)
}
const route = useRoute()
const activeNames = useLocalStorage(`${route.fullPath}_activeNames`, {
  arr: ['2']
})

async function getData() {
  const res = await getCompanyListApi(user.getToken)
  console.log(res)
  companyList.value = res.data
}

onMounted(() => {
  getData()
})
onActivated(() => {
  getData()
})
</script>

<template>
  <div class="border-0 transition-200 transition-width" v-bind="$attrs">
    <slot name="top">
      <div class="card-item border-0 border-b-1px pb-4 border-default-b">
        <div class="hover:bg-transparent">
          <ChatFriendApplySearch @submit="(val: any) => chat.setTheFriendOpt(FriendOptType.User, val)" />
        </div>
      </div>
    </slot>
    <el-scrollbar height="calc(100% - 3.8rem)" wrap-class="pb-10" class="scrollbar">
      <div class="card-item border-default-2-b">
        <small pb-2 pt-4 op-90>组织架构</small>
        <div
          class="item"
          v-for="(item, index) in companyList"
          :key="index"
          :class="{ focus: chat.theFriendOpt.data.id === item.id }"
          @click="toggleView(FriendOptType.NewFriend, item)"
        >
          <el-badge :value="chat.applyUnReadCount" :hidden="!chat.applyUnReadCount" :max="99">
            <!-- <div class="avatar-icon bg-theme-warning">
              <i i-solar:user-plus-bold bg-light p-3 />
            </div> -->
            <img class="avatar-icon bg-theme-warning" :src="item.logo" style="background-color: transparent" />
          </el-badge>
          <small>{{ item.name }}</small>
        </div>
      </div>
      <!-- <div class="card-item">
        <small pb-2 pt-4 op-90>AI 机器人</small>
        <div class="item" :class="{ focus: chat.theFriendOpt.type === FriendOptType.AiRobot }" @click="toggleView(FriendOptType.AiRobot)">
          <div class="avatar-icon bg-theme-primary">
            <i i-ri:robot-2-line class="ai-icon" />
          </div>
          <small>探索机器人</small>
        </div>
      </div> -->
      <el-collapse v-model="activeNames.arr">
        <!-- 群聊 -->
        <el-collapse-item name="1" title="群聊">
          <ChatFriendGroupList type="group" />
        </el-collapse-item>
        <!-- 好友 -->
        <!-- <el-collapse-item name="2" title="好友">
          <ChatFriendGroupList type="friend" />
        </el-collapse-item> -->
      </el-collapse>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.avatar-icon {
  --at-apply: 'h-2.4rem  flex-row-c-c rounded-6px w-2.4rem shadow-sm border-default';
}
.card-item {
  --at-apply: 'flex flex-col';

  .ai-icon {
    --at-apply: 'mx-0.5em pt-2px h-1.4em w-1.4em text-light';
  }
  .item {
    --at-apply: 'tracking-1px flex items-center gap-4 p-2 cursor-pointer rounded-6px mb-2 hover:(bg-menu-color) ';
    &.focus {
      --at-apply: '!bg-menu-color';
    }
  }
}
:deep(.el-scrollbar) {
  .el-scrollbar__bar.is-vertical {
    display: none;
  }
}
:deep(.el-collapse) {
  --at-apply: 'border-default-t';

  .el-collapse-item__header {
    --at-apply: 'h-3em';
  }
  .el-collapse-item__header:not(.is-active) {
    --at-apply: 'border-default-b';
  }
  .el-collapse-item__content {
    padding: 0;
  }
  .el-collapse-item__wrap {
    --at-apply: 'border-default-b';
  }
}
</style>
