<script setup lang="ts">
import { appKeywords } from '@/constants/index'
import { useDefaultInit, useInit, useUmounted } from '@/init/index'
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getMessaging, getToken } from 'firebase/messaging'
import { useRoute } from 'vue-router'

const route = useRoute()
const user = useUserStore()
const setting = useSettingStore()
const isIframe = ref(false)

useHead({
  title: '简信✨',
  meta: [{ name: 'description', content: '简信 - 开启你的畅聊之旅！' }],
  htmlAttrs: { lang: 'zh' }
})

useSeoMeta({
  title: '简信✨',
  description: '简信 - 开启你的畅聊之旅！',
  keywords: appKeywords
})

// Firebase 初始化配置
const firebaseConfig = {
  apiKey: 'AIzaSyBMl43PqiJBVu6Vj8cf6YyS3xEHwV0saZI',
  authDomain: 'llxmsg.firebaseapp.com',
  projectId: 'llxmsg',
  storageBucket: 'llxmsg.firebasestorage.app',
  messagingSenderId: '420628832',
  appId: '1:420628832:web:7c7c4aecc2126761eeb605',
  measurementId: 'G-D7NEK0NS69'
}

// 初始化 Firebase（推荐只初始化一次）
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)

// 请求通知权限
function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('当前浏览器不支持通知')
    return
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('用户允许通知权限')
      } else {
        console.warn('用户拒绝通知权限')
      }
    })
  } else if (Notification.permission === 'denied') {
    console.warn('用户已拒绝通知权限')
  }
}

// 环境判断
type RuntimeEnv = 'mobile' | 'mobile-pwa' | 'desktop' | 'desktop-pwa'
function getRuntimeEnvironment(): RuntimeEnv {
  const ua = navigator.userAgent.toLowerCase()
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
  const isLikelyMobile = /mobile|android|iphone|ipad|ipod/.test(ua) && navigator.maxTouchPoints > 1 && screen.width <= 768
  return isLikelyMobile ? (isStandalone ? 'mobile-pwa' : 'mobile') : isStandalone ? 'desktop-pwa' : 'desktop'
}

onMounted(async () => {
  requestNotificationPermission()

  // 必须确保是在客户端环境 + 支持 serviceWorker
  // if (typeof window !== 'undefined' && 'serviceWorker' in navigator && setting.isMobileSize) {
  //   try {
  //     const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  //     console.log('Service Worker 注册成功')

  //     const messaging = getMessaging()
  //     const token = await getToken(messaging, {
  //       vapidKey: 'BHLJ8zwzgP-S6T5zWG48BB1AhdbK3vPufag6cuwEmeWI3eGxtkJlUds42IhashPGfKWxWdePvLrYyv4-FVBzWFA',
  //       serviceWorkerRegistration: registration
  //     })

  //     if (token) {
  //       console.log('获取 Firebase Token 成功:', token)
  //       user.firebaseToken = token
  //       await getSetFirebaseTokenApi({ firebaseToken: token }, user.getToken)
  //     } else {
  //       console.warn('未获取到 token，可能是用户未授权通知')
  //     }
  //   } catch (err) {
  //     console.error('获取 Firebase Token 失败:', err)
  //   }
  // }

  isIframe.value = typeof window !== 'undefined' && window.self !== window.top

  if (route.path === '/msg' || route.path.startsWith('/extend') || (setting.isDesktop && route.path === '/login')) {
    useDefaultInit()
  } else {
    useInit()
  }
})

onUnmounted(useUmounted)
</script>


<template>
  <main class="h-100vh flex-row-c-c">
    <div
      class="h-full w-full overflow-hidden bg-color"
      :class="{
        'sm:(w-100vw mx-a h-full) md:(w-100vw mx-a h-full)  lg:(w-100vw mx-a h-full w-100vw max-h-full) shadow-lg': !isIframe && setting.isWeb,
        'rounded-2 border-default': setting.isDesktop || !setting.isMobileSize
      }"
    >
      <!-- :class="{
        'sm:(w-100vw mx-a h-full) md:(w-100vw mx-a h-full)  lg:(w-1360px mx-a h-92vh max-w-86vw max-h-1020px) shadow-lg': !isIframe && setting.isWeb,
        'rounded-2 border-default': setting.isDesktop || !setting.isMobileSize,
      }" -->
      <NuxtLayout>
        <NuxtPage class="h-full w-full" />
      </NuxtLayout>
      <NuxtPwaManifest />
    </div>
  </main>
</template>

<style lang="scss">
// .layout-enter-active,
// .layout-leave-active,
// .page-enter-active,
// .page-leave-active {
//   transition-duration: 0.2s;
//   will-change: opacity transform;
//   transform: none;
// }
// .layout-enter-from,
// .layout-leave-to,
// .page-enter-from,
// .page-leave-to {
//   opacity: 0;
//   transform: scale(0.9);
// }
// .dark .layout-enter-from,
// .dark .layout-leave-to,
// .dark .page-enter-from,
// .dark .page-leave-to {
//   opacity: 0;
//   transform: scale(0.9) translateY(10px);
// }
html.dark .approval-divider .el-divider__text.is-center {
  background: #1b1b1b !important;
}
html.web .headerDialog {
  padding-bottom: 0px;
}
html,
body {
  overflow-x: hidden !important;
  position: relative;
}
</style>
