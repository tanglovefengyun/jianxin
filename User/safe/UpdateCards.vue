<script lang="ts" setup>
const user = useUserStore()
const showMarkPhone = ref(true)

/**
 * 重新加载用户信息
 */
const isLoading = ref<boolean>(false)
async function reloadUserInfo() {
  isLoading.value = true
  if (await user.loadUserWallet(user.getToken)) {
    ElMessage.success('刷新成功🎉')
  }
  setTimeout(() => {
    isLoading.value = false
  }, 300)
}
// 展示表单
const form = ref({
  showUpdatePwd: false,
  showUpdatePhone: false,
  showUpdateEmail: false
})

function getModifySignature() {
  ElMessageBox.prompt('请输入新的个性签名', '修改签名', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputType: 'textarea', // 👈 关键点：切换为 textarea
    inputValue: ''
  })
    .then(async ({ value }) => {
      // 处理确认后的 value（textarea 内容）
      console.log('输入内容：', value)
      await getUserUpdateSignatureApi({ signature: value }, user.getToken)
      const res = await getUserInfo(user.getToken)
      if (res.code === StatusCode.SUCCESS1) {
        user.userInfo = res.data as UserInfoVO
      }
    })
    .catch(() => {
      // 用户点击取消或关闭
    })
}
</script>

<template>
  <div class="flex flex-col">
    <div my-4 block text-sm>
      <i i-solar:shield-check-broken mr-2 p-2.5 />
      修改信息
    </div>
    <!-- 用户信息 -->
    <div v-loading="isLoading" class="group flex flex-col p-4 card-default border-default-hover" flex flex-1 flex-col>
      <div class="flex items-center">
        <CardAvatar class="h-12 w-12 rounded-1/2 border-default-2 card-default" :src="user.userInfo.portrait" />
        <strong class="ml-3 block">{{ user.userInfo.username }}</strong>
        <!-- <i
          opacity-0
          transition-300
          group-hover:opacity-100
          class="i-solar:refresh-outline ml-a cursor-pointer bg-[var(--el-color-info)] px-3 transition-300 hover:rotate-180"
          @click="reloadUserInfo"
        /> -->
      </div>
      <!-- 密码 -->
      <div ml-1 mt-6 flex-row-bt-c>
        <small>
          密&emsp;码：
          <small opacity-80>************</small>
        </small>
        <small class="cursor-pointer transition-300 hover:text-[var(--el-color-primary)]" @click="form.showUpdatePwd = true"> 修改密码 </small>
      </div>
      <!-- 手机号 -->
      <div ml-1 mt-6 flex-row-bt-c>
        <small>
          手机号：
          <small opacity-80 :class="{ 'text-red-5': !user.userInfo.phone }">
            {{ (showMarkPhone ? user.markPhone : user.userInfo.phone) || '还未绑定' }}
          </small>
        </small>
        <!-- <small
          class="cursor-pointer transition-300 hover:text-[var(--el-color-primary)]"
          @click="form.showUpdatePhone = true"
        >
          {{ user.userInfo.phone ? "修改手机号" : "绑定" }}
        </small> -->
      </div>
      <!-- 密码 -->
      <div ml-1 mt-6 flex-row-bt-c>
        <small>
          个性签名：
          <small opacity-80>{{ user.userInfo.signature }}</small>
        </small>
        <small class="cursor-pointer transition-300 hover:text-[var(--el-color-primary)]" @click="getModifySignature"> 修改签名 </small>
      </div>
      <!-- <div ml-1 mt-6 flex-row-bt-c>
        <small>
          部门：
          <small
            opacity-80
            :class="{ 'text-red-5': !user.userInfo.phone }"
          >
            {{ user.userInfo.department.name || "未知" }}
          </small>
        </small>
      </div> -->
      <!-- 邮箱 -->
      <!-- <div
        ml-1 mt-6 flex-row-bt-c
      >
        <small>
          邮&emsp;箱：
          <small
            opacity-80
            :class="{ 'text-red-5': !user.userInfo.email }"
          >
            {{ user.userInfo.email || "还未绑定" }}
          </small>
        </small>
        <small
          class="cursor-pointer transition-300 hover:text-[var(--el-color-primary)]"
          @click="form.showUpdateEmail = true"
        >
          {{ user.userInfo.email ? "修改邮箱" : "绑定" }}
        </small>
      </div> -->
      <div mt-a w-full>
        <!-- 退出 -->
        <ElDivider class="dark:opacity-20" />
        <div mb-1 flex-row-bt-c justify-end>
          <!-- <el-text
            style="margin-left: 1rem"
            class="cursor-pointer transition-300 hover:text-[var(--el-color-primar)y]"
            @click.stop="navigateTo('/user')"
          >
            编辑资料
          </el-text> -->
          <el-text style="margin-left: 1rem" class="cursor-pointer transition-300 hover:text-[var(--el-color-primar)y]" type="danger" @click="user.exitLogin"> 退出登录 </el-text>
        </div>
      </div>
    </div>
    <Teleport to="body">
      <UserSafeDialog v-model="form" />
    </Teleport>
  </div>
</template>

<style scoped lang="scss"></style>
