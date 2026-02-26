import { setRegistrationId } from "~/composables/api/user/index"

export default defineNuxtPlugin(() => {
  if (process.server) return; // SSR 跳过

  const user = useUserStore();

  // 动态加载 SDK
  const script = document.createElement('script');
  script.src = '/sdk/webSdk.produce.min.3.3.2.js';
  script.async = true;

  script.onload = () => {
    console.log('✅ EngageLab SDK loaded.');

    window.MTpushInterfaceReady = () => {
      const randomUid = () => {
        const keyStr = 'mtWebPushRandomUid';
        let uid = localStorage.getItem(keyStr);
        if (!uid) {
          uid = Date.now().toString(36) + Math.floor(Math.random() * 10000000).toString(36);
          localStorage.setItem(keyStr, uid);
        }
        return uid;
      };

      // 事件监听
      MTpushInterface?.mtPush.onDisconnect(() => console.log('🧨 连接断开'));
      MTpushInterface?.onMsgReceive((msgData) => console.log('📩 收到推送消息:', msgData));

      // 初始化
      MTpushInterface?.init({
        appkey: '307f97c637ba453d0fd351ab',
        user_str: randomUid(),
        swUrl: '/sw.produce.min.3.3.2.js',

        fail(err) {
          console.error('❌ 推送初始化失败', err);
        },
        success(data) {
          console.log('✅ 推送初始化成功', data);
        },
        webPushcallback(code, tip) {
          console.log('🔔 通知权限状态:', code, tip);
        },

        async canGetInfo(data) {
          try {
            const regId = MTpushInterface?.getRegistrationID();
            user.regId = regId as string;
            if (!regId) {
              console.warn('⚠️ 未获取到 RegId');
              return;
            }

            console.log('🎯 得到 RegId:', regId);

            // 优先使用 composable 接口
            const res = await setRegistrationId(regId, user.getToken);
            if (res?.code === 0) {
              console.log('✅ RegId 上报成功:', res);
            } else {
              console.warn('⚠️ 后端未返回成功状态:', res);
            }

          } catch (error) {
            console.error('❌ RegId 上报失败:', error);
          }
        },

        custom: (requestPermission) => {
          // 自定义提示时手动触发权限请求
          requestPermission();
        }
      });
    };

    // 触发 SDK 初始化
    if (typeof window.MTpushInterfaceReady === 'function') {
      window.MTpushInterfaceReady();
    }
  };

  document.head.appendChild(script);
});
