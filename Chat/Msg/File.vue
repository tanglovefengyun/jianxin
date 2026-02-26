<script lang="ts" setup>
import type { FileBodyMsgVO } from '~/composables/api/chat/message'
import { DownFileStatusIconMap, downloadFile, FILE_TYPE_ICON_DEFAULT, FILE_TYPE_ICON_MAP, formatFileSize } from '~/composables/api/res/file'

/**
 * 文件消息
 */
const props = defineProps<{
  data: any
  prevMsg: any
  index: number
}>()
const { data } = toRefs(props)
const user = useUserStore()
const chat = useChatStore()
const iframeSrc = ref('')
const dialogVisible = ref(false)
// 具体
const body: Partial<FileBodyMsgVO> = props.data.message?.body || {}
const fileName = `${props?.data.content.split('/').pop() || '未知文件'}`
const setting = useSettingStore()
function onDownloadFile(url: string) {
  const item = setting.fileDownloadMap?.[url]
  if (item && item.status === FileStatus.DOWNLOADING) {
    setting.showDownloadPanel = true
    return
  }
  if (item) {
    // 存在文件则打开
    setting.openFileByDefaultApp(item)
    return
  }
  // 下载文件
  downloadFile(
    url,
    fileName,
    {
      mimeType: body?.mimeType
    },
    (val) => {}
  )
  if (setting.isDesktop) {
    nextTick(() => {
      setting.showDownloadPanel = true
    })
  }
}
function openFile(data: any) {
  console.log(data)

  if (data.file_type === 'application/pdf') {
    // 如果是 PDF 文件，直接在 iframe 中显示
    iframeSrc.value = data.content
    dialogVisible.value = true
  } else if (
    data.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    data.file_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    data.file_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    // 如果是 Office 文件，使用 Google Docs Viewer 显示
    iframeSrc.value = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(data.content)}`
    dialogVisible.value = true
  } else if (data.file_type === 'text/plain') {
    $fetch(data.content, {}).then((res) => {
      iframeSrc.value = res
      dialogVisible.value = true
    })

    // iframeSrc.value = JSON.parse(res)
    // dialogVisible.value = true
  } else {
    onDownloadFile(data.content)
  }
}

// 导出
defineExpose({
  onDownloadFileAndOpen: () => onDownloadFile(props?.data.content)
})

const fileItem = computed(() => setting.fileDownloadMap[props?.data.content])
// ctx-name="file"
</script>

<template>
  <ChatMsgTemplate :prev-msg="prevMsg" :index="index" :data="data" v-bind="$attrs">
    <template #body>
      <!-- 文件 -->
      <div
        ctx-name="file"
        :title="fileName"
        class="file max-w-14em w-fit flex flex-row-reverse cursor-pointer gap-3 p-3 shadow-sm transition-all !items-center border-default hover:border-[var(--el-color-primary)] card-default bg-color hover:shadow-lg"
        @click="openFile(data)"
      >
        <img
          ctx-name="file"
          :src="data.file_type && FILE_TYPE_ICON_MAP[data.file_type] ? FILE_TYPE_ICON_MAP[data.file_type] : FILE_TYPE_ICON_DEFAULT"
          class="file-icon h-8 w-8 object-contain"
        />
        <div ctx-name="file">
          <p ctx-name="file" class="text-overflow-2 text-sm leading-4">
            {{ fileName }}
          </p>
          <small v-if="body?.url && setting.fileDownloadMap[BaseUrlFile + body.url]?.status !== undefined" ctx-name="file" class="float-left mr-2 mt-2 text-xs op-60">
            <i :class="fileItem?.status !== undefined ? DownFileStatusIconMap[fileItem?.status] : ''" p-2 />&nbsp;{{ fileItem ? DownFileTextMap[fileItem?.status] : '' }}
          </small>
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
      <!-- 内容 -->
      <p v-if="data.message?.content?.trim()" class="msg-popper msg-wrap" ctx-name="content">
        {{ data.message.content }}
      </p>
      <el-dialog v-model="dialogVisible" title="文件预览" :width="setting.isMobileSize ? '90%' : '50%'" :append-to-body="true" :align-center="true">
        <template #header="{ close, titleId, titleClass }">
          <div class="my-header flex">
            <h4 :id="titleId" :class="titleClass">文件预览</h4>
            <el-button class="ml-2" type="primary" @click="onDownloadFile(data.content)">
              <i class="i-solar:download-minimalistic-outline"></i>
              下载
            </el-button>
          </div>
        </template>
        <iframe v-if="iframeSrc && data.file_type != 'text/plain'" :src="iframeSrc" width="100%" frameborder="0" style="height: 85vh"></iframe>
        <pre v-if="iframeSrc && data.file_type == 'text/plain'">{{ iframeSrc }}</pre>
      </el-dialog>
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
.text-overflow-2 {
  word-break: break-all;
}
.my-header {
  align-items: center;
}
</style>
