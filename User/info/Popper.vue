<script lang="ts" setup>
import type { UploadFile, UploadFiles, UploadProps } from 'element-plus/es/components/upload'

const { data } = defineProps<{
  data: any
  isEdit?: boolean
}>()

const user = reactive<Partial<UserInfoVO>>(data)
const store = useUserStore()
const formData = new FormData()
const ws = useWsStore()
const showMarkPhone = ref(true)
// 表单
const avatatRef = useTemplateRef('avatatRef')
const avatarUrl = computed({
  get() {
    return user?.portrait
  },
  set(val) {
    user.avatar = val
  }
})
const isLoading = ref<boolean>(false)
/**
 * 上传之前验证类型
 */
const imageTypeList = ref<string[]>(['image/png', 'image/jpg', 'image/jpeg', 'image/svg'])
const beforeUpload: UploadProps['beforeUpload'] = (rawFile: File) => {
  isLoading.value = true
  if (!imageTypeList.value.includes(rawFile.type)) {
    isLoading.value = false
    ElMessage.error('文件格式不是图片格式!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 20) {
    isLoading.value = false
    ElMessage.error('头像需要小于20MB!')
    return false
  }
  // check success
  formData.append('image', rawFile)
  return true
}
async function customUpload({ file }: { file: File }) {
  try {
    const response = await getUserUploadPortraitApi(formData, store.getToken)

    // 成功处理，比如刷新头像
    ElMessage.success('上传成功')
    data.portrait = response.data?.portrait || URL.createObjectURL(file) // 或者后端返回的新头像 URL
    isLoading.value = false // check success
    avatatRef.value?.clearFiles()
    user.avatar = data.data
    avatarUrl.value = data.data || ''
    // 如果你还有 updateSuccess 回调
    // updateSucess(response.data);
  } catch (error) {
    ElMessage.error('上传失败，请重试')
    console.error(error)
  }
}
/**
 * 更新头像
 */
const updateSucess: UploadProps['onSuccess'] = async (data: Result<string>, uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  isLoading.value = false // check success
  avatatRef.value?.clearFiles()
  user.avatar = data.data
  avatarUrl.value = data.data || ''
  ElMessage.success('更换头像成功！')
}

// 使用computed将函数转换为响应式属性
const getAgeText = computed(() => calculateAge(data.birthday))
const getConstellation = computed(() => computeConstellation(data.birthday))
const getBirthdayCount = computed(() => calculateBirthdayCount(data.birthday))
</script>

<template>
  <MenuPopper placement="right-start" transition="popper-fade" trigger="hover" :offset="4" :show-arrow="false" popper-class="!border-default !card-default-br-2">
    <template #reference>
      <div class="relative mx-a h-9 w-9 rounded-1/2 shadow card-default border-default-hover">
        <!-- <CardElImage
          :default-src="avatarUrl"
          error-class="i-solar-user-line-duotone p-2 "
          class="relative z-100 h-full w-full cursor-pointer overflow-hidden rounded-1/2" alt="头像"
        /> -->

        <img :src="data.portrait" class="relative z-100 h-full w-full cursor-pointer overflow-hidden rounded-1/2" alt="头像" />
        <UserInfoStatus
          :show-text="false"
          :status="ws.status"
          class="absolute z-101 rounded-1/2 shadow -bottom-1px -right-1px"
          dot-class="w-3  h-3 border-(2px light solid) rounded-1/2"
        />
      </div>
    </template>
    <template #default>
      <div class="card-bg-linear w-22em card-rounded-df p-6 pt-8">
        <!-- 信息 -->
        <div class="mb-5 flex gap-4 pb-5 sm:gap-6 border-default-2-b">
          <div v-loading="isLoading" class="avatar h-5em w-5em flex-row-c-c flex-shrink-0 shadow-md card-default-br">
            <!-- 上传 -->
            <el-upload
              ref="avatatRef"
              :disabled="!isEdit"
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
                <template v-if="data.portrait">
                  <img
                    alt="Design By Kiwi23333"
                    :src="data.portrait"
                    class="h-5em w-5em flex-shrink-0 overflow-hidden rounded-1/2 object-cover shadow transition-300 group-hover:filter-blur-4"
                  />
                  <i class="i-solar:camera-broken absolute p-5 text-theme-primary opacity-0 transition-300 group-hover:opacity-100" />
                </template>
                <ElIconPlus v-else size="2em" />
              </div>
            </el-upload>
          </div>
          <div truncate>
            <strong truncate text-1.1rem>{{ data.nickname }}</strong>
            <p mt-2 truncate class="text" :title="data.username">
              {{ data.username || ' - ' }}
            </p>
            <UserInfoStatus v-if="isEdit" class="mt-1 text-xs" :status="ws.status" title="状态" dot-class="w-2.8 h-2.8 rounded-full" />
          </div>
        </div>
        <!-- 详情 -->
        <div class="flex flex-col gap-4 truncate pb-6">
          <p class="text">
            <i
              mr-3
              p-2
              :class="data.sex === 1 ? 'i-tabler:gender-male text-blue' : data.sex === 2 ? 'i-tabler:gender-female text-pink' : 'i-tabler:gender-transgender text-yellow'"
            />
            <span class="mr-2 pr-2 border-default-r">
              {{ data.sex === 1 ? '男' : data.sex === 2 ? '女' : '未知' }}
            </span>
            <template v-if="data.birthday">
              <span class="mr-2 pr-2 border-default-r">
                {{ getAgeText }}
              </span>
              <span class="mr-2 pr-2 border-default-r">
                {{ data.birthday || ' - ' }}
              </span>
              <span>
                {{ getConstellation }}
              </span>
            </template>
          </p>
          <p class="text" v-if="data.department && data.job">
            <i class="i-carbon:send mr-3 p-2" />
            部门：{{ data.department.name }} - {{ data.job }}
          </p>
          <p class="text">
            <i class="i-solar:mailbox-line-duotone mr-3 p-2" />
            邮箱：{{ data.email || ' - ' }}
          </p>
          <p class="text" btn-primary title="切换隐藏" @click="showMarkPhone = !showMarkPhone">
            <i class="i-solar:phone-linear mr-3 p-2" />
            手机号：{{ data.phone ? (showMarkPhone ? data.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : data.phone) : ' - ' }}
          </p>
          <p class="text op-80">
            <i class="i-solar:user-speak-outline mr-3 p-2" />
            上次在线：
            {{ data.lastLoginTime || ' - ' }}
          </p>
        </div>
        <!-- 按钮 -->
        <div v-show="!isLoading" class="flex-row-bt-c">
          <BtnElButton
            v-if="isEdit"
            icon-class="i-solar:pen-2-line-duotone mr-2"
            style="transition: 0.2s; font-size: 0.85em; height: 2.5em; width: 10em; text-align: center; letter-spacing: 1px; --el-color-primary: var(--el-color-success)"
            plain
          >
            <!-- @click.stop="navigateTo('/user')" -->
            编辑资料&ensp;
          </BtnElButton>
          <BtnElButton
            v-if="isEdit"
            icon-class="i-solar:logout-3-broken mr-2"
            style="transition: 0.2s; font-size: 0.85em; height: 2.5em; width: 10em; text-align: center; letter-spacing: 1px"
            type="danger"
            class="shadow"
            @click.stop="store.exitLogin"
          >
            退出登录&ensp;
          </BtnElButton>
        </div>
      </div>
    </template>
  </MenuPopper>
</template>

<style scoped lang="scss">
.card-bg-linear {
  background-image: linear-gradient(160deg, #c9d7ffc9, transparent, transparent, transparent, transparent);
}
.dark {
  .card-bg-linear {
    background-image: linear-gradient(160deg, #616161c2, transparent, transparent, transparent, transparent);
  }
}
:deep(.el-loading-mask) {
  border-radius: 50%;
  overflow: hidden !important;
}
.avatar {
  width: 5em;
  height: 5em;
  border-radius: 50%;
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
