<script lang="ts" setup>
import type { ChatContactVO } from '@/composables/api/chat/contact'
import { RoomType } from '@/composables/api/chat/contact'
import ContextMenu from '@imengyu/vue3-context-menu'
import { itemFromKind } from '@tauri-apps/api/menu'

const props = defineProps<{
  dto?: ContactPageDTO
}>()
interface Item {
  chat_id: number
  chat_type: string
  content: string
  disturb: number
  id: number
  pinned_chat: number
  portrait: string
  timer: number
  title: string
}
const chatInfoList = ref<Item[]>([])
const dialogVisible = ref(false)
const selectedGroups = ref()
const selectedGroupsName = ref()
const chatId = ref()
const options = ref<any>([
  // { value: 'groupA', label: '分组A' },
  // { value: 'groupB', label: '分组B' },
  // { value: 'groupC', label: '分组C' }
])
const isLoading = ref<boolean>(false)
const setting = useSettingStore()
const user = useUserStore()
const chat = useChatStore()
const ws = useWsStore()
const isReload = ref(false)
const visiblePopper = ref(false)
const pageInfo = ref({
  cursor: undefined as undefined | string,
  isLast: false,
  size: 20
})
const historyContactId = useLocalStorage<number | undefined>(`${user.userId}-history-contact-id`, undefined)
const isLoadRoomMap: Record<number, boolean> = {}
// 滚动顶部触发
const scrollbarRef = useTemplateRef('scrollbarRef')
const isScrollTop = ref(true)
function onScroll(e: { scrollTop: number; scrollLeft: number }) {
  isScrollTop.value = e.scrollTop === 0
}
async function handleConfirm() {
  const arr = options.value.map((item: any) => item.value)
  if (arr.includes(selectedGroups.value)) {
    await getOrganizeChatMoveApi(
      {
        id: selectedGroups.value,
        chat_id: chatId.value
      },
      user.getToken
    )
  } else {
    const res = await getOrganizeCreateApi(
      {
        name: selectedGroupsName.value
      },
      user.getToken
    )
    await getOrganizeChatMoveApi(
      {
        id: res.data.id,
        chat_id: chatId.value
      },
      user.getToken
    )
    getGroupOptions()
    selectedGroups.value = res.data.id
    console.log(selectedGroups.value)
  }
  // const groupList = localStorage.getItem('groupList')
  // const arr = groupList ? JSON.parse(groupList) : []

  // const index1 = arr.findIndex((item: any) => item.value === selectedGroups.value)

  // const newItem = {
  //   value: selectedGroups.value,
  //   label: selectedGroups.value
  // }

  // if (index1 !== -1) {
  //   // 替换已有项
  //   arr[index1] = newItem
  // } else {
  //   // 新增项
  //   arr.push(newItem)
  // }

  // localStorage.setItem('groupList', JSON.stringify(arr))
  // options.value = arr

  dialogVisible.value = false
  const chat = user.getChatInfo.find((i: any) => i.chat_id == chatId.value)
  if (!chat) return ElMessage.error('找不到对应聊天记录')
  console.log(chat)
  // const stored = localStorage.getItem('chat_info')
  // const chat_info = stored ? JSON.parse(stored) : []
  const index = user.getChatInfo.findIndex((existingItem: any) => existingItem.chat_id == chatId.value)
  user.getChatInfo[index].grouping = selectedGroups.value
  // localStorage.setItem('chat_info', JSON.stringify(chat_info))
  user.getChatInfo = user.getChatInfo
}
/**
 * 加载会话列表
 */
async function loadData(dto?: ContactPageDTO) {
  // if (isLoading.value || pageInfo.value.isLast)
  //   return;
  // isLoading.value = true;
  // const { data } = await getChatContactPage({
  //   pageSize: pageInfo.value.size,
  //   cursor: pageInfo.value.cursor,
  // }, user.getToken);
  // if (!data) {
  //   return;
  // }
  // if (data && data.list) {
  //   for (const item of data.list) {
  //     chat.refreshContact(item);
  //   }
  // }
  // pageInfo.value.isLast = data.isLast;
  // pageInfo.value.cursor = data.cursor || undefined;
  // isLoading.value = false;
  return []
}

// 刷新
async function reload(size: number = 20, dto?: ContactPageDTO, isAll: boolean = true, roomId?: number) {
  if (isReload.value) return
  isReload.value = true
  if (isAll) {
    pageInfo.value = {
      cursor: undefined,
      isLast: false,
      size
    }
    if (setting.isMobileSize) {
      // 移动端
      setting.isOpenGroupMember = false // 关闭群成员列表
      setting.isOpenContactSearch = true // 打开搜索框
    }
    // const list = await loadData(dto || props.dto);
    await loadData(dto || props.dto)
    // 默认加载首个会话
    if (!setting.isMobileSize && historyContactId.value && chat.contactMap[historyContactId.value]) {
      chat.setContact(chat.contactMap[historyContactId.value])
    }
  } else if (roomId) {
    // 刷新某一房间
    refreshItem(roomId)
  }
  nextTick(() => {
    isReload.value = false
  })
}

// 同步
const isSyncing = ref(false)
async function fetchContacts() {
  // if (isLoading.value || isSyncing.value)
  //   return;
  isSyncing.value = true
  if (ws.open_message_push_success) {
    setTimeout(() => {
      isSyncing.value = false
    }, 1000)
  }
  // const { data } = await getChatContactPage({
  //   pageSize: chat.getContactList.length,
  //   cursor: null,
  // }, user.getToken);
  // if (!data) {
  //   return;
  // }
  // if (data && data.list) {
  //   for (const item of data.list) {
  //     chat.refreshContact(item);
  //   }
  // }
  // isLoading.value = false;
  // isSyncing.value = false;
}

// 刷新某一房间
async function refreshItem(roomId: number) {
  if (!roomId || isLoadRoomMap[roomId]) return
  isLoadRoomMap[roomId] = true
  try {
    const item = chat.contactMap[roomId] as ChatContactVO | undefined
    if (item?.type !== undefined && item.type !== null) return
    // if (item?.type === RoomType.GROUP) {
    //   const res = await getChatContactInfo(roomId, user.getToken, RoomType.GROUP);
    //   if (res)
    //     chat.refreshContact(res.data);
    // }
  } catch (error) {
    console.log(error)
  } finally {
    delete isLoadRoomMap[roomId]
  }
}

// 状态错误
const online = useOnline()
const isAnimateDelay = ref(false)
const showWsStatusTxt = computed(() => {
  if (!online.value) {
    return setting.isMobileSize ? '网络已断开' : '当前网络不可用'
  }
  if (ws.status !== WsStatusEnum.OPEN) {
    return ws.status === WsStatusEnum.CONNECTION ? (isAnimateDelay.value ? '' : '正在重新连接...') : '连接已断开'
  }
  if (!user.isLogin) {
    return '登录失效'
  }
  return ''
})
function handleOfflineReload() {
  if (ws.status !== WsStatusEnum.OPEN) {
    ws.reload()
  }
}

// 右键菜单
function onContextMenu(e: any, item: any) {
  e.preventDefault()
  const isPin = user.getChatInfo.filter((i: any) => i.chat_id == item.chat_id)[0].pinTime
  const isGrouping = user.getChatInfo.filter((i: any) => i.chat_id == item.chat_id)[0].grouping
  const isShield = !!chat.contactMap?.[item.roomId]?.shieldStatus
  const opt = {
    x: e.x,
    y: e.y,
    theme: setting.contextMenuTheme,
    items: [
      // 置顶功能
      {
        customClass: 'group',
        icon: isPin ? 'i-solar:pin-bold-duotone  group-hover:(i-solar:pin-outline scale-110)' : 'i-solar:pin-outline group-hover:i-solar:pin-bold-duotone',
        label: isPin ? '取消置顶' : '置顶',
        onClick: async () => {
          await getChatPinnedApi({ chat_id: item.chat_id, pinned_chat: isPin ? 0 : 1 }, user.getToken)
          // const chat = user.getChatInfo.find((i: any) => i.chat_id == item.chat_id)

          // if (!chat) return ElMessage.error('找不到对应聊天记录')

          // // 切换 pin 状态
          // chat.pinTime = chat.pinTime ? null : Date.now()

          // // 更新数组引用（视情况是否响应式需要）
          // // user.getChatInfo = [...user.getChatInfo]; // 如果是 reactive 结构，有时需要这样触发响应式更新
          // console.log(chat)
          // // const stored = localStorage.getItem('chat_info')
          // // const chat_info = stored ? JSON.parse(stored) : []
          // const index = user.getChatInfo.findIndex((existingItem: any) => existingItem.id === item.id)
          // user.getChatInfo[index] = chat
          // user.getChatInfo = user.getChatInfo.sort((a: any, b: any) => {
          //   const aPinned = a.pinTime ? 1 : 0
          //   const bPinned = b.pinTime ? 1 : 0

          //   if (aPinned !== bPinned) {
          //     return bPinned - aPinned // 有 pinTime 的排在前面
          //   }

          //   if (aPinned && bPinned) {
          //     // 都有 pinTime，按 pinTime 降序
          //     return b.timer - a.timer
          //   }

          //   // 都没有 pinTime，按 timer 降序
          //   return b.timer - a.timer
          // })
          // ElMessage.success(`已${chat.pinTime ? '置顶' : '取消置顶'}`)
        }
      },
      // 免打扰功能
      {
        customClass: 'group',
        icon: isShield ? 'i-carbon:notification-filled group-hover:i-carbon:notification' : 'i-carbon:notification-off group-hover:(i-carbon:notification-off-filled scale-110)',
        label: isShield ? '取消免打扰' : '免打扰',
        onClick: () => {
          // chat.setShieldContact(item.roomId, !isShield ? isTrue.TRUE : isTrue.FALESE)
          ElMessage.warning('预留, 敬请期待~')
        }
      },
      {
        customClass: 'group',
        icon: 'i-solar:users-group-rounded-line-duotone group-hover:(i-solar:users-group-rounded-bold-duotone scale-110)',
        label: isGrouping ? '移出分组' : '加入分组',
        // hidden: item.pinTime,
        onClick: async () => {
          console.log(item)
          getGroupOptions()
          if (item.pinTime) {
            ElMessage.warning('置顶聊天不能分组~')
            return
          }
          chatId.value = item.chat_id
          // 移出分组
          if (isGrouping) {
            await getOrganizechatRemoveApi(
              {
                id: isGrouping,
                chat_id: chatId.value
              },
              user.getToken
            )
            const chat = user.getChatInfo.find((i: any) => i.chat_id == chatId.value)
            if (!chat) return ElMessage.error('找不到对应聊天记录')
            console.log(chat)
            // const stored = localStorage.getItem('chat_info')
            // const chat_info = stored ? JSON.parse(stored) : []
            const index = user.getChatInfo.findIndex((existingItem: any) => existingItem.chat_id == chatId.value)
            user.getChatInfo[index].grouping = ''
            // localStorage.setItem('chat_info', JSON.stringify(chat_info))
            user.getChatInfo = user.getChatInfo
            return
          }

          dialogVisible.value = true
        }
      },
      {
        customClass: 'group',
        divided: 'up',
        icon: 'i-solar:trash-bin-minimalistic-outline group-btn-danger group-hover:i-solar:trash-bin-minimalistic-bold-duotone',
        label: '删除聊天',
        onClick: () => {
          console.log(item)

          chat.deleteContactConfirm(item.chat_id, () => {})
        }
      }
    ] as any
  }
  // 群聊
  if (item.type === RoomType.GROUP) {
    // 在第一个后插入
    opt.items.splice(1, 0, {
      customClass: 'group',
      icon: 'i-solar:user-speak-broken group-btn-warning group-hover:i-solar:user-speak-bold-duotone',
      label: '邀请好友',
      onClick: () => {
        chat.inviteMemberForm = {
          show: true,
          roomId: item.roomId,
          uidList: []
        }
      }
    })
  } else if (item.type === RoomType.SELFT) {
    opt.items.splice(1, 0, {
      customClass: 'group',
      icon: 'i-solar:user-outline group-btn-info group-hover:i-solar:user-bold-duotone',
      label: '联系TA',
      onClick: async () => {
        // 跳转到好友页面
        const friendId = chat.contactMap?.[item.roomId]?.targetUid
        if (!friendId) {
          await chat.reloadContact(item.roomId)
        }
        chat.setTheFriendOpt(FriendOptType.User, {
          id: chat.contactMap?.[item.roomId]?.targetUid
        })
        navigateTo({
          path: '/friend',
          query: {
            dis: 1
          }
        })
      }
    })
  }

  ContextMenu.showContextMenu(opt)
}

function onContextMenuGroup(e: MouseEvent, item: any) {
  e.preventDefault()
  const opt = {
    x: e.x,
    y: e.y,
    theme: setting.contextMenuTheme,
    items: [
      // 编辑分组
      {
        customClass: 'group',
        icon: 'i-solar:pen-line-duotone group-hover:(i-solar:pen-bold-duotone scale-110)',
        label: '编辑分组',
        onClick: () => {
          console.log(item)

          // 设置 ElMessageBox 输入框的默认值为 item.label
          ElMessageBox.prompt('请输入新的分组名称', '编辑分组', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            inputValue: item.label // 这里设置默认值为 item.label
          })
            .then(async ({ value }) => {
              await getOrganizeUpdateApi(
                {
                  id: item.value,
                  name: value
                },
                user.getToken
              )
              getGroupOptions()
            })
            .catch(() => {})
        }
      },
      // 删除分组
      {
        customClass: 'group',
        icon: 'i-solar:trash-bin-minimalistic-outline group-btn-danger group-hover:i-solar:trash-bin-minimalistic-bold-duotone',
        label: '删除分组',
        onClick: async () => {
          ElMessageBox.confirm(`是否删除 ${item.label} 分组？`, {
            title: '提示',
            center: true,
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            confirmButtonClass: 'btn-error',
            lockScroll: false,
            callback: async (action: string) => {
              if (action === 'confirm') {
                console.log(item)
                user.getChatInfo.forEach((element: any) => {
                  if (element.grouping == item.value) {
                    element.grouping = ''
                  }
                })
                console.log(user.getChatInfo)
                // if(chat.length > 0){
                //   const stored = localStorage.getItem('chat_info')
                //   const chat_info = stored ? JSON.parse(stored) : []
                //   const index = chat_info.findIndex((existingItem: any) => existingItem.chat_id == data.data.result.chat_id)
                //   chat_info[index].grouping = data.data.result.chat_info.organize.organize_id
                // localStorage.setItem('chat_info', JSON.stringify(user.getChatInfo))
                user.getChatInfo = user.getChatInfo
                // }
                await getOrganizeDeleteApi(
                  {
                    id: item.value
                  },
                  user.getToken
                )

                getGroupOptions()
              }
            }
          })
        }
      }
    ] as any
  }
  ContextMenu.showContextMenu(opt)
}

// 跳转好友页面
async function toFriendPage() {
  visiblePopper.value = false
  await nextTick()
  await navigateTo('/friend')
  setTimeout(async () => {
    chat.setTheFriendOpt(FriendOptType.Empty)
    const com = document?.getElementById?.(applyUserSearchInputDomId)
    if (com) {
      com?.focus()
    }
  }, 200)
}

async function onClickContact(room: any) {
  const currentChatId = chat.msgContact?.chat_id
  console.log(room, 'roomroomroom')
  // 1. 保存当前草稿
  if (currentChatId && chat.msgForm.content) {
    chat.saveDraft(currentChatId, chat.msgForm.content)
    console.log(chat.getDraft(currentChatId), 'saveDraftcurrentChatId')
  } else if (currentChatId && !chat.msgForm.content) {
    chat.saveDraft(currentChatId, '')
  }
  console.log(room, 'roomroomroom')
  chat.isOpenContact = false
  historyContactId.value = room.id
  chat.chatId = room.chat_id
  chat.onChangeRoom(room)
  console.log(room, 'roomroomroom')

  chat.updateContact(room.id, room)
  ws.clearUnreadMsgById(room.chat_id)
  if (room.chat_type === 'group') {
    chat.groupInformation.name = ''
    await chat.getGroupInformation(room.id)
    if (chat.groupInformation.members.length === 0) {
      ws.removeChatById(room.chat_id)
      chat.theRoomId = undefined
    }
  } else {
    // 查询用户信息
    const res = await getFriendsUserInfoApi({ id: room.id }, user.getToken)
    chat.privateInfo = res.data
  }

  // 在切换聊天室的时候, 判断是否输入了内容, 如果有内容就存起来作为草稿 避免切换消失
  console.log('切换聊天室', room)
  // if(chat.msgForm.content){
  //   const draft = {
  //     ...room,
  //     content: chat.msgForm.content,
  //     type: 'draft',
  //   };
  // }
  ws.getAllMessagesContent()
  console.log(chat.getDraft(room.chat_id), 'getDraftcurrentChatId')
  if (chat.getDraft(room.chat_id)) {
    setTimeout(() => {
      chat.msgForm.content = chat.getDraft(room.chat_id)
    }, 0)
  }
}

// 监听当前选中的房间ID变化
watch(
  () => chat.theRoomId,
  (newRoomId) => {
    if (newRoomId) {
      requestAnimationFrame(() => {
        // 查找当前选中的联系人元素
        const selectedElement = document.querySelector(`#contact-${newRoomId}`)
        if (selectedElement) {
          // 检查元素是否在视图中可见
          const rect = selectedElement.getBoundingClientRect()
          const scrollContainer = scrollbarRef.value?.wrapRef
          if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect()
            // 如果元素不在视图中，则滚动到可见位置
            if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
              selectedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
              })
            }
          }
        }
      })
    }
  },
  { immediate: false }
)

watch(
  () => chat.isOpenContact,
  () => {
    console.log(chat.isOpenContact, 'isOpenContact', chat.chatId)
    if (chat.isOpenContact) {
      chat.chatId = ''
    }
  }
)

const RoomTypeTagType: Record<number, '' | 'primary' | 'info' | any> = {
  [RoomType.AICHAT]: 'warning'
}

// @unocss-include
const menuList = [
  {
    label: '添加好友',
    icon: 'i-tabler:user-plus',
    onClick: () => {
      toFriendPage()
    }
  },
  {
    label: '发起群聊',
    icon: 'i-solar:chat-round-dots-outline',
    onClick: () => {
      visiblePopper.value = false
      chat.inviteMemberForm = {
        show: true,
        roomId: undefined,
        uidList: []
      }
    }
  }
]

function getHomeMessages(val: any) {
  // 判断是否有消息类型 没有代表搜索的是人,有代表是聊天记录
  console.log(val)

  if (val.type) {
    const historyData = user.getChatInfo.filter((i: any) => i.id == val.chat_info.id)
    if (historyData.length > 0) {
      onClickContact(historyData[0])
    } else {
      if (val.chat_info.chat_type === 'group') {
        const userData = {
          ...val.chat_info,
          name: val.chat_info.title
        }
        chat.toContactSendMsg('group', userData)
      } else {
        const userData = {
          department: val.chat_info.department,
          id: val.chat_info.id,
          job: val.chat_info.job,
          nickname: val.chat_info.title,
          portrait: val.chat_info.portrait
        }
        chat.toContactSendMsg('private', userData)
      }
    }

    chat.scrollReplyMsg(val.id || 0, val.content, false)
    return
  }
  if (val.owner_id) {
    chat.toContactSendMsg('group', val)
    chat.isOpenContact = false
  } else {
    chat.toContactSendMsg('private', val)
    chat.isOpenContact = false
  }
}

async function getGroupOptions() {
  const res = await getOrganizeListApi(user.getToken)
  console.log(res)
  options.value = res.data.map((item: any) => {
    return {
      label: item.name,
      value: item.id
    }
  })
}

function getTotalUnreadMsg(groupValue: any) {
  console.log(groupValue)

  return user.getChatInfo.filter((value: any) => !value.pinTime && value.grouping == groupValue.value).reduce((sum: number, curr: any) => sum + Number(curr.unreadMsg || 0), 0)
}

reload()
onMounted(() => {
  // setTimeout(() => {
  //   isAnimateDelay.value = false
  // }, 1500)
  // const stored = localStorage.getItem("chat_info");
  // chatInfoList.value = stored ? JSON.parse(stored) : [];
  getGroupOptions()
  // const groupList = localStorage.getItem('groupList')
  // options.value = groupList ? JSON.parse(groupList) : []
  // 监听
  mitter.on(MittEventType.WS_SYNC, ({ lastDisconnectTime, reconnectTime }) => {
    // 重连
    console.log(`会话同步，时延：${reconnectTime - lastDisconnectTime}ms`)
    try {
      fetchContacts()
    } catch (error) {
      console.log(error)
      setTimeout(() => {
        fetchContacts()
      }, 300)
    }
  })
})

const activeNames = ref(['1'])
function handleChange(val: any) {
  console.log(val)
}
function handleRoomLongPress(e: any, room: any) {
  // alert(123456789)
  console.log(e)
  e.x = e.touches[0].clientX
  e.y = e.touches[0].clientY
  onContextMenu(e as any, room)
}
function handleCollapseLongPress(e: any, room: any) {
  e.x = e.touches[0].clientX
  e.y = e.touches[0].clientY
  onContextMenuGroup(e as any, room)
}
</script>

<template>
  <div class="group main main-bg-color">
    <!-- 搜索群聊 -->
    <div
      v-if="(user.userInfo as any).type == 1"
      class="nav-padding-top-8 header home-search-box"
      :class="setting.isMobileSize && !setting.isOpenContactSearch ? '!h-0 overflow-y-hidden' : ''"
    >
      <!-- <ElInput
        id="search-contact"
        v-model.lazy="chat.searchKeyWords"
        class="mr-2 text-0.8rem hover:op-80"
        style="height: 2rem;"
        name="search-content"
        type="text"
        clearable
        autocomplete="off"
        :prefix-icon="ElIconSearch"
        minlength="2"
        maxlength="30"
        placeholder="搜索"
      /> -->
      <!-- 添加 -->
      <!-- <MenuPopper
        v-model:visible="visiblePopper"
        placement="bottom-end"
        transition="popper-fade"
        trigger="click"
        :menu-list="menuList"
      >
        <template #reference>
          <div class="icon">
            <i i-carbon:add-large p-2 />
          </div>
        </template>
      </MenuPopper> -->
      <div class="hover:bg-transparent home-search-input">
        <ChatFriendApplySearch type="home" @submit="(val: any) => getHomeMessages(val)" />
      </div>
    </div>
    <div class="relative w-full flex-row-c-c">
      <div
        v-if="isSyncing"
        data-fade
        style="--anima: latter-slice-bottom"
        class="absolute top-4 z-2 flex-row-c-c rounded px-2 py-1 text-theme-primary shadow-lg bg-color-br text-mini"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-spin select-none" viewBox="0 0 24 24">
          <g fill="none" fill-rule="evenodd">
            <path
              d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"
            />
            <path
              fill="currentColor"
              d="M12 4.5a7.5 7.5 0 1 0 0 15a7.5 7.5 0 0 0 0-15M1.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12S17.799 22.5 12 22.5S1.5 17.799 1.5 12"
              opacity=".1"
            />
            <path fill="currentColor" d="M12 4.5a7.46 7.46 0 0 0-5.187 2.083a1.5 1.5 0 0 1-2.075-2.166A10.46 10.46 0 0 1 12 1.5a1.5 1.5 0 0 1 0 3" />
          </g>
        </svg>
        &nbsp;同步中...
      </div>
      <!-- 已断开 -->
      <div v-else-if="showWsStatusTxt" class="w-full flex-row-c-c bg-[#fa5151] bg-op-10 py-4 text-xs text-theme-danger dark:bg-op-06" @click="handleOfflineReload">
        <i i-solar:link-broken-broken mr-2 p-2 />
        {{ showWsStatusTxt }}
      </div>
    </div>
    <!-- 会话列表 -->
    <el-scrollbar ref="scrollbarRef" wrap-class="w-full relative h-full" class="contact-list" @scroll="onScroll">
      <ListAutoIncre
        :immediate="false"
        :auto-stop="false"
        :is-scroll-top="isScrollTop"
        :no-more="pageInfo.isLast"
        enable-pull-to-refresh
        loading-class="op-0"
        :damping="0.7"
        :pull-distance="90"
        :pull-trigger-distance="60"
        :refresh-timeout="3000"
        :on-refresh="reload"
      >
        <!-- 添加骨架屏 -->
        <div v-if="user.getChatInfo.length === 0" key="skeleton" class="main-bg-color absolute z-2 w-full overflow-y-auto">
          <ChatContactSkeleton v-for="i in 10" :key="i" class="contact" />
        </div>
        <ListTransitionGroup
          :immediate="false"
          tag="div"
          :class="{
            reload: isReload
          }"
          class="relative"
        >
          <div
            v-for="room in user.getChatInfo.filter((item: any) => item.pinTime)"
            :id="`contact-${room.id}`"
            :key="room.id"
            class="contact"
            :class="{
              'is-checked': room.id == chat.msgContact.id
            }"
            @click="onClickContact(room)"
            @contextmenu.stop="onContextMenu($event, room)"
            v-longpress="(e: any) => handleRoomLongPress(e, room)"
          >
            <el-badge :hidden="!room.unreadMsg" :max="99" :value="room.unreadMsg" class="badge h-3em w-3em flex-shrink-0">
              <img :src="room.portrait" alt="" class="h-full w-full card-rounded-df object-contain shadow-sm card-bg-color-2 object-top" />
            </el-badge>
            <div class="flex flex-1 flex-col justify-between truncate">
              <div flex truncate>
                <p class="text truncate text-black dark:text-white">
                  {{ room.title }}
                </p>
                <span class="text ml-a w-fit flex-shrink-0 text-right text-0.7em leading-2em text-color">
                  {{ formatContactDate(room.timer) }}
                </span>
              </div>
              <p class="text mt-1 flex text-small">
                <small v-if="chat.getDraft(room.chat_id) && room.id != chat.msgContact.id" class="h-1.5em flex-1 truncate">
                  <span style="color: #ff0000">[草稿]</span> {{ chat.getDraft(room.chat_id) }}
                </small>
                <small v-else-if="room.chat_type !== 'group'" class="h-1.5em flex-1 truncate">
                  {{
                    room.msg_status === 2
                      ? '撤回了一条消息'
                      : room.type === 'voice'
                      ? '[语音]'
                      : room.type === 'image'
                      ? '[图片]'
                      : room.type === 'video'
                      ? '[视频]'
                      : room.type === 'file'
                      ? '[文件]'
                      : room.type === 'group_notice'
                      ? '[群公告]'
                      : room.type === 'oa_leave'
                      ? '[OA审批]'
                      : room.type === 'oa_todo'
                      ? '[待办事项]'
                      : room.type === 'oa_reimbursement'
                      ? '[报销审批]'
                      : room.type === 'oa_overtime'
                      ? '[加班审批]'
                      : room.content
                  }}
                </small>
                <small v-else-if="room.type" class="h-1.5em flex-1 truncate">
                  <span v-show="room.at_user" style="color: #ff0000">有人@你</span>
                  {{ room.unreadName }}:
                  {{
                    room.msg_status === 2
                      ? '撤回了一条消息'
                      : room.type === 'voice'
                      ? '[语音]'
                      : room.type === 'image'
                      ? '[图片]'
                      : room.type === 'video'
                      ? '[视频]'
                      : room.type === 'file'
                      ? '[文件]'
                      : room.type === 'group_notice'
                      ? '[群公告]'
                      : room.type === 'oa_leave'
                      ? '[OA审批]'
                      : room.type === 'oa_todo'
                      ? '[待办事项]'
                      : room.type === 'oa_reimbursement'
                      ? '[报销审批]'
                      : room.type === 'oa_overtime'
                      ? '[加班审批]'
                      : room.content
                  }}
                </small>
                <small v-if="room.pinTime" class="text i-solar:pin-bold-duotone ml-1 flex-shrink-0 overflow-hidden text-3 text-color" />
              </p>
            </div>
          </div>
        </ListTransitionGroup>
        <el-collapse v-model="activeNames" @change="handleChange">
          <el-collapse-item
            v-for="(item, index) in options"
            :key="index"
            :title="item.label"
            :name="item.value"
            @contextmenu.stop="onContextMenuGroup($event, item)"
            v-longpress="(e: any) => handleCollapseLongPress(e, item)"
          >
            <template #icon="{ isActive }">
              <span class="icon-ele ml-auto mr-2">
                {{ isActive ? '折叠' : '展开' }}
              </span>
              <el-badge
                v-if="getTotalUnreadMsg(item)"
                :hidden="!getTotalUnreadMsg(item)"
                :max="99"
                :value="getTotalUnreadMsg(item)"
                class="badge h-3em w-2em flex-shrink-0 mr-2"
              ></el-badge>
            </template>
            <div
              v-for="room in user.getChatInfo.filter((value: any) => !value.pinTime && value.grouping == item.value)"
              :id="`contact-${room.id}`"
              :key="room.id"
              class="contact"
              :class="{
                'is-checked': room.id == chat.msgContact.id
              }"
              @click="onClickContact(room)"
              @contextmenu.stop="onContextMenu($event, room)"
              v-longpress="(e: any) => handleRoomLongPress(e, room)"
            >
              <el-badge :hidden="!room.unreadMsg" :max="99" :value="room.unreadMsg" class="badge h-3em w-3em flex-shrink-0">
                <img :src="room.portrait" alt="" class="h-full w-full card-rounded-df object-contain shadow-sm card-bg-color-2 object-top" />
              </el-badge>
              <div class="flex flex-1 flex-col justify-between truncate">
                <div flex truncate>
                  <p class="text truncate text-black dark:text-white">
                    {{ room.title }}
                  </p>
                  <span class="text ml-a w-fit flex-shrink-0 text-right text-0.7em leading-2em text-color">
                    {{ formatContactDate(room.timer) }}
                  </span>
                </div>
                <p class="text mt-1 flex text-small">
                  <small v-if="chat.getDraft(room.chat_id) && room.id != chat.msgContact.id" class="h-1.5em flex-1 truncate">
                    <span style="color: #ff0000">[草稿]</span> {{ chat.getDraft(room.chat_id) }}
                  </small>
                  <small v-else-if="room.chat_type !== 'group'" class="h-1.5em flex-1 truncate">
                    {{
                      room.msg_status === 2
                        ? '撤回了一条消息'
                        : room.type === 'voice'
                        ? '[语音]'
                        : room.type === 'image'
                        ? '[图片]'
                        : room.type === 'video'
                        ? '[视频]'
                        : room.type === 'file'
                        ? '[文件]'
                        : room.type === 'group_notice'
                        ? '[群公告]'
                        : room.type === 'oa_leave'
                        ? '[OA审批]'
                        : room.type === 'oa_todo'
                        ? '[待办事项]'
                        : room.type === 'oa_reimbursement'
                        ? '[报销审批]'
                        : room.type === 'oa_overtime'
                        ? '[加班审批]'
                        : room.content
                    }}
                  </small>
                  <small v-else-if="room.type" class="h-1.5em flex-1 truncate">
                    <span v-show="room.at_user" style="color: #ff0000">有人@你</span>
                    {{ room.unreadName }}:
                    {{
                      room.msg_status === 2
                        ? '撤回了一条消息'
                        : room.type === 'voice'
                        ? '[语音]'
                        : room.type === 'image'
                        ? '[图片]'
                        : room.type === 'video'
                        ? '[视频]'
                        : room.type === 'file'
                        ? '[文件]'
                        : room.type === 'group_notice'
                        ? '[群公告]'
                        : room.type === 'oa_leave'
                        ? '[OA审批]'
                        : room.type === 'oa_todo'
                        ? '[待办事项]'
                        : room.type === 'oa_reimbursement'
                        ? '[报销审批]'
                        : room.type === 'oa_overtime'
                        ? '[加班审批]'
                        : room.content
                    }}
                  </small>
                  <small v-if="room.pinTime" class="text i-solar:pin-bold-duotone ml-1 flex-shrink-0 overflow-hidden text-3 text-color" />
                </p>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
        <ListTransitionGroup
          :immediate="false"
          tag="div"
          :class="{
            reload: isReload
          }"
          class="relative"
        >
          <!-- <div
            v-for="room in chatInfoList"
            :id="`contact-${room.id}`"
            :key="room.id"
            class="contact"
            :class="{
              'is-pin': room.pinTime,
              'is-checked': room.id === chat.theRoomId,
              'is-shield': room.shieldStatus === isTrue.TRUE,
            }"
            @contextmenu.stop="onContextMenu($event, room)"
            @click="onClickContact(room)"
          > -->

          <!-- v-for="room in user.getChatInfo.filter((item: any) => !item.pinTime && !item.grouping)" -->
          <div
            v-for="room in user.getChatInfo.filter((item: any) => !item.pinTime && !item.grouping)"
            :id="`contact-${room.id}`"
            :key="room.id"
            class="contact"
            :class="{
              'is-checked': room.id == chat.msgContact.id
            }"
            @click="onClickContact(room)"
            @contextmenu.stop="onContextMenu($event, room)"
            v-longpress="(e: any) => handleRoomLongPress(e, room)"
          >
            <!-- @contextmenu.stop="onContextMenu($event, room)"
            @click="onClickContact(room)" -->
            <el-badge :hidden="!room.unreadMsg" :max="99" :value="room.unreadMsg" class="badge h-3em w-3em flex-shrink-0">
              <!-- <CardElImage
                :default-src="room.portrait" fit="cover"
                class="h-full w-full card-rounded-df object-cover shadow-sm card-bg-color-2"
              /> -->
              <img :src="room.portrait" alt="" class="h-full w-full card-rounded-df object-contain shadow-sm card-bg-color-2 object-top" />
            </el-badge>
            <div class="flex flex-1 flex-col justify-between truncate">
              <div flex truncate>
                <p class="text truncate text-black dark:text-white">
                  {{ room.title }}
                </p>
                <span class="text ml-a w-fit flex-shrink-0 text-right text-0.7em leading-2em text-color">
                  {{ formatContactDate(room.timer) }}
                </span>
              </div>
              <p class="text mt-1 flex text-small">
                <small v-if="chat.getDraft(room.chat_id) && room.id != chat.msgContact.id" class="h-1.5em flex-1 truncate">
                  <span style="color: #ff0000">[草稿]</span> {{ chat.getDraft(room.chat_id) }}
                </small>
                <small v-else-if="room.chat_type !== 'group'" class="h-1.5em flex-1 truncate">
                  {{
                    room.msg_status === 2
                      ? '撤回了一条消息'
                      : room.type === 'voice'
                      ? '[语音]'
                      : room.type === 'image'
                      ? '[图片]'
                      : room.type === 'video'
                      ? '[视频]'
                      : room.type === 'file'
                      ? '[文件]'
                      : room.type === 'group_notice'
                      ? '[群公告]'
                      : room.type === 'oa_leave'
                      ? '[OA审批]'
                      : room.type === 'oa_todo'
                      ? '[待办事项]'
                      : room.type === 'oa_reimbursement'
                      ? '[报销审批]'
                      : room.type === 'oa_overtime'
                      ? '[加班审批]'
                      : room.content
                  }}
                </small>
                <small v-else-if="room.type" class="h-1.5em flex-1 truncate">
                  <span v-show="room.at_user" style="color: #ff0000">有人@你</span>
                  {{ room.unreadName }}:
                  {{
                    room.msg_status === 2
                      ? '撤回了一条消息'
                      : room.type === 'voice'
                      ? '[语音]'
                      : room.type === 'image'
                      ? '[图片]'
                      : room.type === 'video'
                      ? '[视频]'
                      : room.type === 'file'
                      ? '[文件]'
                      : room.type === 'group_notice'
                      ? '[群公告]'
                      : room.type === 'oa_leave'
                      ? '[OA审批]'
                      : room.type === 'oa_todo'
                      ? '[待办事项]'
                      : room.type === 'oa_reimbursement'
                      ? '[报销审批]'
                      : room.type === 'oa_overtime'
                      ? '[加班审批]'
                      : room.content
                  }}
                </small>
                <!-- <small
                  class="h-1.5em flex-1 truncate"
                  :class="{ 'text-[var(--el-color-info)] font-600': room.unreadCount && room.shieldStatus !== isTrue.TRUE }"
                >
                  {{ room.content }}
                </small> -->
                <!-- 免打扰 -->
                <!-- <small v-if="room.shieldStatus === isTrue.TRUE" class="text i-carbon:notification-off ml-1 flex-shrink-0 overflow-hidden text-3 text-small" /> -->
                <!-- 消息置顶 -->
                <small v-if="room.pinTime" class="text i-solar:pin-bold-duotone ml-1 flex-shrink-0 overflow-hidden text-3 text-color" />
              </p>
            </div>
          </div>
        </ListTransitionGroup>
        <template #done>
          <!-- <div class="my-4 w-full text-center text-mini">
             {{ pageInfo.isLast ? '没有更多了' : '' }}
          </div> -->
        </template>
      </ListAutoIncre>
    </el-scrollbar>
    <!-- <div v-else class="h-full" style="display: flex; align-items: center; justify-content: center">
      <el-progress :percentage="100" :stroke-width="15" striped striped-flow class="w-full">
        <small>消息推送中, 请耐心等待~</small>
      </el-progress>
    </div> -->
    <el-dialog v-model="dialogVisible" title="加入分组" :width="setting.isMobileSize ? '76%' : '30%'" :append-to-body="true">
      <el-select-v2
        v-model="selectedGroups"
        :options="options"
        placeholder="请选择分组或新建分组"
        style="width: 100%; margin-bottom: 20px"
        allow-create
        default-first-option
        filterable
        clearable
        :reserve-keyword="false"
        @change="
          (e) => {
            selectedGroupsName = e
          }
        "
      />

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.main {
  --at-apply: 'z-4 h-full flex flex-shrink-0 flex-col select-none overflow-hidden border-0 border-0 rounded-0 sm:(relative left-0 top-0 w-1/4 pl-0)';
}
.main-bg-color {
  --at-apply: 'sm:card-bg-color-2 bg-color-3';
}
.contact-list {
  --at-apply: 'sm:p-2 p-0';

  .contact {
    // transition: background-color 100ms ease-in-out;
    --at-apply: 'h-18 card-bg-color dark:bg-transparent flex items-center gap-3 p-4 sm:(border-transparent p-3 w-full text-color card-rounded-df mb-2 card-bg-color)  w-full text-sm  cursor-pointer  !hover:bg-[#f8f8f8] !dark:hover:bg-[#151515]';
    .text {
      --at-apply: 'transition-none';
    }

    .ai-icon {
      --at-apply: 'mx-0.5em pt-0.2em h-1.4em w-1.4em text-theme-primary dark:text-theme-info';
    }
    &.is-pin {
      --at-apply: 'bg-transparent dark:bg-dark-5 sm:(!border-default-2 shdow-sm card-bg-color)';
    }
    &.is-checked {
      --at-apply: '!sm:(bg-[var(--el-color-primary)] color-white dark:text-light  dark:bg-[var(--el-color-primary-light-3)] hover:op-90)  ';
      .text {
        --at-apply: 'sm:(color-white dark:text-light)';
      }
      .ai-icon {
        --at-apply: 'sm:!text-light';
      }
    }

    // :deep(.el-badge__content) {
    //   --at-apply: "border-none";
    // }
    &.is-shield {
      :deep(.el-badge__content) {
        --at-apply: 'bg-gray text-white border-none dark:(bg-dark-2)';
      }
    }
  }
}
.header {
  --at-apply: 'sm:(h-20 px-4) h-14 px-3 flex-row-c-c flex-shrink-0 transition-200 transition-height  card-bg-color';
  :deep(.el-input) {
    .el-input__wrapper {
      --at-apply: '!shadow-none !outline-none !input-bg-color';
    }
  }
  .icon {
    --at-apply: 'h-2rem px-2 w-2rem  !btn-primary-bg flex-row-c-c input-bg-color';
  }
}
// 影响高度变化
@media screen and (max-width: 768px) {
  .contact {
    border-top: 1px solid #7e7e7e0e !important;
    border-bottom: 1px solid transparent !important;
    border-left: 1px solid transparent !important;
    border-right: 1px solid transparent !important;
  }
}

:deep(.el-scrollbar__bar) {
  right: 1px;
  --at-apply: '!hidden sm:block';
  --el-scrollbar-bg-color: #9292928a;

  .el-scrollbar__thumb {
    width: 6px;
  }
}
.reload {
  transition: none !important;
  * {
    transition: none !important;
  }
}
.home-search-input {
  width: 100%;
}
.home-search-box {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
:deep(.el-collapse-item__header) {
  padding-left: 0.8rem;
}
:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}
:deep(.el-collapse) {
  margin-bottom: 0.5rem;
  border-radius: 0.375rem;
  overflow: hidden;
}
:deep(.el-progress) {
  display: flex;
  flex-direction: column;
  align-items: center;
  .el-progress-bar {
    width: 80%;
    margin-bottom: 1rem;
  }
}
</style>
