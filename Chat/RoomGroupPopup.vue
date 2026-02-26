<script lang="ts" setup>
import { ChatRoomRoleEnum } from '~/composables/api/chat/room'
import type { UploadFile, UploadFiles, UploadProps } from 'element-plus/es/components/upload'

type EditFormItems = 'name' | 'notice' | ''

// store
const chat = useChatStore()
const setting = useSettingStore()
const user = useUserStore()
const store = useUserStore()
const isLoading = ref(false)
const avatatRef = useTemplateRef('avatatRef')
const formData = new FormData()
// ref
// const searchInputRef = useTemplateRef("searchInputRef");
const noticeInputRef = useTemplateRef('noticeInputRef')
const nameInputRef = useTemplateRef('nameInputRef')

// data
const editFormFieldRaw = ref<EditFormItems>('')
const editFormField = computed<EditFormItems>({
  get() {
    return editFormFieldRaw.value
  },
  set(val) {
    editFormFieldRaw.value = val
    nextTick(() => {
      if (val === 'notice' && noticeInputRef.value) noticeInputRef?.value?.focus()
      else if (val === 'name' && nameInputRef.value) nameInputRef?.value?.focus()
    })
  }
})

const {
  showSearch,
  isTheGroupOwner,
  isNotExistOrNorFriend,
  theContactClone,
  searchUserWord,
  imgList,
  isLord,
  vMemberList,
  inputOssFileUploadRef,
  containerProps,
  wrapperProps,
  onSubmitImages,
  toggleImage,
  submitUpdateRoom,
  onScroll,
  scrollTo,
  onMemberContextMenu,
  onExitOrClearGroup
} = useRoomGroupPopup({
  editFormField
})
// 邀请进群
function showJoinGroup() {
  chat.inviteMemberForm = {
    show: true,
    roomId: chat.theRoomId!,
    uidList: []
  }
}

const isPin = computed(() => !!chat.theContact?.pinTime)
const isPinLoading = ref(false)
async function changIsPin() {
  isPinLoading.value = true
  try {
    const val = isPin.value ? isTrue.FALESE : isTrue.TRUE
    await chat.setPinContact(chat.theRoomId!, val)
    return !!val
  } finally {
    isPinLoading.value = false
  }
}
const shieldStatus = computed(() => chat.theContact?.shieldStatus === isTrue.TRUE)
const shieldStatusLoading = ref(false)
async function changShieldStatus() {
  shieldStatusLoading.value = true
  try {
    const val = chat.theContact?.shieldStatus === isTrue.TRUE ? isTrue.FALESE : isTrue.TRUE
    await chat.setShieldContact(chat.theRoomId!, val)
    return !!val
  } finally {
    shieldStatusLoading.value = false
  }
}
const copySuccess = ref(false)
async function copyGroupId() {
  try {
    await navigator.clipboard.writeText(chat.groupInformation.id)
    copySuccess.value = true
    setTimeout(() => (copySuccess.value = false), 1500)
  } catch (err) {
    console.error('复制失败:', err)
  }
}
const imageTypeList = ref<string[]>(['image/png', 'image/jpg', 'image/jpeg', 'image/svg'])
// ✅ 不再全局复用 formData！

const beforeUpload: UploadProps['beforeUpload'] = (rawFile: File) => {
  isLoading.value = true

  if (!imageTypeList.value.includes(rawFile.type)) {
    isLoading.value = false
    ElMessage.error('文件格式不是图片格式!')
    return false
  }

  if (rawFile.size / 1024 / 1024 > 20) {
    isLoading.value = false
    ElMessage.error('头像需要小于20MB!')
    return false
  }

  // 返回 true 表示允许上传
  return true
}

async function customUpload({ file }: { file: File }) {
  const formData = new FormData() // ✅ 每次上传都创建新的 FormData
  formData.append('group_id', chat.groupInformation.id)
  formData.append('image', file)

  try {
    const response = await getGroupUploadPortraitApi(formData, store.getToken)
    ElMessage.success('上传成功')

    chat.groupInformation.portrait = response.data?.portrait || URL.createObjectURL(file)
  } catch (error) {
    ElMessage.error('上传失败，请重试')
    console.error(error)
  } finally {
    isLoading.value = false

    // ✅ 可选：重置文件列表，允许重新上传
    // nextTick 是为了避免错误状态卡住上传组件
    nextTick(() => {
      ;(avatatRef.value as any)?.clearFiles?.()
    })
  }
}

async function editGroupName() {
  if (!chat.groupInformation.name) {
    ElMessage.error('群聊名称不能为空')
    return
  }
  try {
    await getGroupUpdateApi({ group_id: chat.groupInformation.id, name: chat.groupInformation.name }, store.getToken)
    ElMessage.success('修改成功!')
    chat.getGroupInformation(chat.groupInformation.id)
    nameInputRef?.value?.blur()
  } catch (error) {
    ElMessage.error('修改失败，请重试')
    console.error(error)
  }
}
function handleImagePreview(img: string) {
  if (!img) return
  useImageViewer.open({
    urlList: [img],
    index: 0,
    ctxName: 'img'
  })
}
</script>

<template>
  <el-scrollbar v-if="setting.isOpenGroupMember && chat.msgContact.chat_type === 'group'" v-bind="$attrs" class="scroll relative" wrap-class="pb-20">
    <div flex-row-bt-c flex-shrink-0 flex-row truncate>
      <!-- <i
        class="i-solar:magnifer-linear block h-4.5 w-4.5 btn-info"
        @click="() => {
          showSearch = !showSearch
          if (showSearch) {
            searchInputRef?.focus?.()
          }
        }"
      /> -->
      <small class="p-1.5">群成员 ({{ chat.groupInformation.members.length }}人)</small>
      <div
        v-if="chat.groupInformation.members.filter((item: any) => item.role == 1 || item.role == 2).map((value: any) => value.user_id).includes(user.userInfo.id)"
        class="rounded-2rem p-1.5"
        @click="showJoinGroup"
      >
        <i class="block h-1.8em h-5 w-1.8em w-5 rounded-2rem btn-info border-default" i-carbon:add-large />
      </div>
    </div>
    <!-- 搜索群聊 -->
    <!-- <div
      class="header h-2em transition-height"
      :class="!showSearch ? '!h-0 overflow-y-hidden' : ''"
    >
      <ElInput
        ref="searchInputRef"
        v-model.lazy="searchUserWord"
        style="height: 2em;"
        name="search-content"
        type="text"
        clearable
        autocomplete="off"
        :prefix-icon="ElIconSearch"
        minlength="2"
        maxlength="30"
        placeholder="搜索群友"
        @blur.stop="() => searchUserWord === '' && (showSearch = false)"
        @input="scrollTo(0)"
      />
    </div> -->
    <div relative h-300px>
      <div v-bind="containerProps" class="scroll-bar relative !h-300px">
        <div v-bind="wrapperProps" class="relative" style="margin-top: 0">
          <!-- :class="p.data.activeStatus === ChatOfflineType.ONLINE ? 'live' : 'op-60 filter-grayscale filter-grayscale-100 '" -->
          <div
            v-for="p in chat.groupInformation.members || []"
            :key="p.user_id"
            class="user-card live"
            @contextmenu="onMemberContextMenu($event, p)"
            @click="setting.isMobileSize && onMemberContextMenu($event, p)"
          >
            <div class="relative flex-row-c-c" :title="p.user.nickname || '未知'">
              <!-- <CardElImage
                :default-src="p.data.avatar" fit="cover"
                error-class="i-solar-user-line-duotone p-2.5 op-80"
                class="h-2.4rem w-2.4rem flex-shrink-0 overflow-auto rounded-1/2 object-cover border-default"
              /> -->
              <img v-if="setting.isMobileSize" :src="p.user.portrait" class="h-2.4rem w-2.4rem flex-shrink-0 overflow-auto rounded-1/2 object-cover border-default" />
              <el-popover v-else placement="left-start" trigger="click" :width="250" popper-class="user-info-popover" :popper-style="{ zIndex: 9999 }">
                <!-- v-if="data.user?.department?.name && data.user.job && data.user.phone" -->
                <!-- popover 内部内容 -->
                <template #default>
                  <div class="p-1">
                    <div class="flex items-center gap-2 mb-3">
                      <img :src="p.user.portrait" class="w-12 h-12 card-rounded-df object-cover shadow-sm card-bg-color-2" @click="handleImagePreview(p.user.portrait)" />
                      <!-- <CardElImage
                        ctx-name="avatar"
                        error-class="i-solar:user-bold-duotone"
                        load-class=" "
                        :src="data.user.portrait"
                        fit="cover"
                        class="w-12 h-12 card-rounded-df object-cover shadow-sm card-bg-color-2"
                      /> -->
                      <div class="font-bold text-base">{{ p.user.nickname }}</div>
                    </div>
                    <div class="text-sm card-bg-color-2 mb-2 p-1" style="border-radius: 0.375rem">部门：{{ p.user.department.name || '' }}</div>
                    <div class="text-sm card-bg-color-2 mb-2 p-1" style="border-radius: 0.375rem">职位：{{ p.user.job || '' }}</div>
                    <div class="text-sm card-bg-color-2 mb-2 p-1" style="border-radius: 0.375rem"
                      >电话：<a :href="`tel:${p.user.phone}`">{{ p.user.phone || '' }}</a></div
                    >
                    <BtnElButton
                      v-show="p.user_id !== user.userInfo.id"
                      class="group-hover:opacity-100"
                      key="send"
                      icon-class="i-solar:chat-line-bold p-2 mr-2"
                      style="transition: 0.2s; max-width: 9em; text-align: center; letter-spacing: 1px"
                      type="primary"
                      @click="chat.toContactSendMsg('private', p.user)"
                    >
                      发送消息&ensp;
                    </BtnElButton>
                  </div>
                </template>

                <!-- 被绑定的头像 -->
                <template #reference>
                  <img :src="p.user.portrait" class="h-2.4rem w-2.4rem flex-shrink-0 overflow-auto rounded-1/2 object-cover border-default" />
                </template>
              </el-popover>
            </div>
            <small truncate
              >{{ p.user.nickname || '未填写' }}<span v-show="user.userInfo.role != 0">({{ p.user.name }})</span></small
            >
            <div class="tags ml-a block pl-1">
              <el-tag v-if="p.user_id === user.userInfo.id" class="mr-1" style="font-size: 0.6em; border-radius: 2rem" size="small" type="warning"> 我 </el-tag>
              <el-tag v-if="p.role !== null && p.role == 1" class="mr-1" style="font-size: 0.6em; border-radius: 2rem" size="small" effect="dark" type="primary"> 群主 </el-tag>
              <el-tag v-if="p.role !== null && p.role == 2" class="mr-1" style="font-size: 0.6em; border-radius: 2rem" size="small" effect="dark" type="info"> 管理员 </el-tag>
            </div>
          </div>
        </div>
        <!-- <small
        class="shadow-linear fixed bottom-0 left-0 block h-2em w-full cursor-pointer text-center"
        @click="scrollTo(chat.currentMemberList.length - 1)"
      >
        <i i-solar:alt-arrow-down-outline p-2 btn-info />
      </small> -->
      </div>
    </div>
    <div class="mt-2 w-full flex-1 overflow-y-auto border-0 border-t-1px pt-2 text-3.5 leading-1.8em border-default">
      <div relative mt-3 flex style="flex-direction: column">
        群头像
        <!-- <InputOssFileUpload
          ref="inputOssFileUploadRef"
          :is-animate="false"
          :show-edit="false"
          :disable="!isLord"
          :multiple="false"
          :limit="1"
          input-class="w-3rem mt-1 h-3rem flex-shrink-0 card-default"
          :class="!isLord ? 'cursor-no-drop' : 'cursor-pointer'"
          :upload-quality="0.3"
          :model-value="chat.groupInformation.portrait"
          @click="toggleImage"
          @error-msg="(msg:string) => {
            ElMessage.error(msg)
          }"
          @submit="onSubmitImages"
        /> -->
        <div v-loading="isLoading" class="avatar h-5em w-5em flex-row-c-c flex-shrink-0 shadow-md card-default-br">
          <!-- 上传 -->
          <el-upload
            ref="avatatRef"
            :disabled="!isTheGroupOwner"
            class="avatar-uploader"
            drag
            :http-request="customUpload"
            :limit="1"
            accept="image/*"
            :multiple="false"
            auto-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
          >
            <div class="group relative flex-row-c-c">
              <template v-if="chat.groupInformation.portrait">
                <img
                  alt="group-avatar"
                  :src="chat.groupInformation.portrait"
                  class="h-5em w-5em flex-shrink-0 overflow-hidden object-contain object-top shadow transition-300 group-hover:filter-blur-4"
                />
                <i class="i-solar:camera-broken absolute p-5 text-theme-primary opacity-0 transition-300 group-hover:opacity-100" />
              </template>
              <ElIconPlus v-else size="2em" />
            </div>
          </el-upload>
        </div>
        <!-- <img :src="chat.groupInformation.portrait" class="w-3rem mt-1 h-3rem flex-shrink-0 card-default"> -->
      </div>
      <div mt-3 class="label-item">
        群聊ID
        <div v-if="copySuccess" class="text-xs dark:op-70 text-green-500 mt-1">已复制</div>
        <div v-else class="dark:op-70 cursor-pointer" @click="copyGroupId" title="点击复制">
          {{ chat.groupInformation.id }}
        </div>
      </div>
      <div mt-3 class="label-item">
        群聊名称
        <i v-show="isLord && editFormField !== 'name'" i-solar:pen-2-bold ml-2 p-2 op-0 transition-opacity @click="editFormField = 'name'" />
        <div
          class="dark:op-70"
          @click="
            () => {
              if (isLord && editFormField !== 'name') {
                editFormField = 'name'
              }
            }
          "
        >
          <el-input
            v-if="theContactClone"
            ref="nameInputRef"
            v-model.lazy="chat.groupInformation.name"
            :disabled="!isTheGroupOwner"
            type="text"
            :maxlength="30"
            style="width: fit-content"
            placeholder="未填写"
            @focus="editFormField = 'name'"
            @keydown.enter="editGroupName"
            @blur.stop="chat.getGroupInformation(chat.groupInformation.id)"
          />
        </div>
      </div>
      <div class="label-item">
        <div mt-3>
          群公告
          <i v-show="isLord && editFormField !== 'notice'" i-solar:pen-2-bold ml-2 p-2 op-0 transition-opacity @click="editFormField = 'notice'" />
        </div>
        <textarea
          v-if="chat.groupInformation.notice"
          ref="noticeInputRef"
          v-model="chat.groupInformation.notice"
          :disabled="!isLord || editFormField !== 'notice'"
          autofocus
          :rows="8"
          :maxlength="200"
          class="scroll-bar mt-2 card-rounded-df p-3 border-default-2 bg-color"
          type="textarea"
          style="resize: none; width: 100%"
          placeholder="未填写"
          @focus="editFormField = 'notice'"
          @keydown.enter.stop="submitUpdateRoom('notice', chat.groupInformation.notice)"
          @blur="submitUpdateRoom('notice', chat.groupInformation.notice)"
        />
      </div>
      <div class="label-item mt-3">
        会话设置
        <div class="mt-2 card-rounded-df px-3 py-2 text-xs border-default-2 bg-color">
          <div mb-2 flex-row-bt-c pb-2 border-default-b>
            设为置顶
            <el-switch :model-value="isPin" size="small" :loading="isPinLoading" :before-change="changIsPin" />
          </div>
          <div flex-row-bt-c>
            消息免打扰
            <el-switch :model-value="shieldStatus" :loading="shieldStatusLoading" size="small" :before-change="changShieldStatus" />
          </div>
        </div>
      </div>
    </div>

    <!-- 退出 -->
    <btn-el-button
      v-show="!chat.contactMap[chat.theRoomId!]?.hotFlag"
      v-memo="[isNotExistOrNorFriend, isTheGroupOwner]"
      icon-class="i-solar:logout-3-broken mr-2"
      type="danger"
      plain
      class="mt-6 w-full"
      @click="onExitOrClearGroup"
    >
      <span>
        {{ isTheGroupOwner ? '解散群聊' : '退出群聊' }}
      </span>
    </btn-el-button>
    <!-- 渐变色 -->
    <div class="shadow-linear absolute bottom-0 left-0 z-1 block h-20 w-full w-full cursor-pointer text-center" />
  </el-scrollbar>
</template>

<style lang="scss" scoped>
.g-avatar {
  --at-apply: 'border-default z-1 absolute bottom-0.2em right-0.2em rounded-full block w-2 h-2 ';
}
.user-card {
  --at-apply: 'h-50px flex-shrink-0 cursor-pointer flex-row-c-c p-1.5 relative gap-2 truncate rounded-2rem filter-grayscale w-full hover:(bg-color-2 op-100)';
  .tags {
    :deep(.el-tag) {
      transition: none;
    }
  }
}

.is-grid {
  // grid-template-columns: repeat(auto-fit, minmax(3em, 1fr)); // 设置网格布局，并设置列数为自动适应，每个列的宽度为1fr（占据可用空间）
  .user-card {
    --at-apply: 'sm:mx-0 mx-a';
    width: fit-content;
  }
}

.live {
  .g-avatar {
    background-color: var(--el-color-info);
  }
  filter: none;
}
:deep(.el-scrollbar__thumb) {
  opacity: 0.5;
}
.label-item {
  :deep(.el-input) {
    .el-input__wrapper {
      background: transparent;
      box-shadow: none;
      color: inherit !important;
      padding: 0;
    }
    .el-input__inner {
      color: inherit !important;
      caret-color: var(--el-color-info);
      cursor: pointer;
    }
  }
  &:hover i {
    opacity: 1;
    cursor: pointer;
  }
}
:deep(.el-textarea) {
  .el-textarea__inner {
    color: inherit !important;
    caret-color: var(--el-color-info);
    box-shadow: none;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
    resize: none;
  }
  &.is-disabled {
    box-shadow: none;
    resize: none;
  }
}
.shadow-linear {
  // 渐变色
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%);
}
.dark .shadow-linear {
  background: linear-gradient(to bottom, rgba(31, 31, 31, 0) 0%, rgba(31, 31, 31, 1) 100%);
}

.header {
  :deep(.el-input) {
    .el-input__wrapper {
      --at-apply: '!shadow-none text-sm !outline-none input-bg-color';
    }
  }
  .icon {
    --at-apply: 'h-2rem w-2rem flex-row-c-c btn-primary-bg  input-bg-color';
  }
}
.scroll {
  :deep(.el-scrollbar__thumb) {
    display: none;
  }
}
:deep(.el-loading-mask) {
  overflow: hidden !important;
}
.avatar {
  width: 5em;
  height: 5em;
  overflow: hidden;

  :deep(.el-upload) {
    .el-upload-dragger {
      padding: 0;
      border: none;
    }
  }
}
.text {
  --at-apply: 'truncate text-xs';
}
</style>
