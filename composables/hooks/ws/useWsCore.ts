import type { WSUpdateContactInfoMsg } from "~/types/chat/WsType";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { sendWebNotification } from "~/composables/utils/useWebToast";
import { WsMsgBodyType, WsStatusEnum } from "~/types/chat/WsType";
import { useWebSocket, setWsWorker } from "./useWebSocket"; // 引入 setWsWorker

/**
 * WebSocket消息类型映射接口
 */
export interface WsMsgItemMap {
  newMsg: ChatMessageVO[];
  onlineNotice: WSOnlineOfflineNotify[];
  recallMsg: WSMsgRecall[];
  deleteMsg: WSMsgDelete[];
  applyMsg: WSFriendApply[];
  memberMsg: WSMemberChange[];
  tokenMsg: object[];
  rtcMsg: WSRtcCallMsg[];
  pinContactMsg: WSPinContactMsg[];
  aiStreamMsg: WSAiStreamMsg[];
  updateContactInfoMsg: WSUpdateContactInfoMsg[]
  other: object[];
}



/**
 * WebSocket Worker管理Hook
 */
export function useWsWorker() {
  const isReload = ref(false);
  const worker = shallowRef<Worker>();
  const ws = useWsStore(); // 假设 useWsStore 中包含了 useWebSocket 暴露的方法
  const user = useUserStore();

  /**
   * 初始化Web Worker
   */
  async function initWorker() {
    if (isReload.value)
      return;
    console.log('初始化了Worker', worker.value);
    isReload.value = true;

    // 清理和关闭现有连接
    worker.value?.terminate?.();
    await ws?.close?.(false);
  
    if (!user?.getToken) {
      isReload.value = false;
      // 退出登录
      return;
    }

    // 创建新Worker
    worker.value = new Worker("/useWsWorker.js");
    setWsWorker(worker.value); // 将 Worker 实例传递给 useWebSocket

    // 初始化 Worker 的环境变量
    worker.value.postMessage({
      command: 'init',
      url: 'wss://msgapi.dfmsg.top/wss/',
    });

    // 设置Worker消息处理
    setupWorkerHandlers();

    isReload.value = false;
    return worker.value;
  }

  /**
   * 设置Worker事件处理器
   */
  function setupWorkerHandlers() {
    if (!worker.value)
      return;

    // Web Worker 消息处理
    worker.value.onmessage = (e) => {
      const { type, data } = e.data;
      const { handleWorkerEvent } = useWebSocket(); // 获取 useWebSocket 的事件处理器

      // 路由 Worker 发送的事件
      switch (type) {
        case "reload":
          reload();
          break;
        case "open":
          handleWorkerEvent(type, data);
          break;
        case "close":
          handleWorkerEvent(type, data);
          break;
        case "error":
          // 连接状态事件，转发给 useWebSocket 更新状态
          handleWorkerEvent(type, data);
          break;
         case "reconnect":
          // 连接状态事件，转发给 useWebSocket 更新状态
          handleWorkerEvent(type, data);
          break;
        case "message":
          // 收到业务消息，转发给 useWsMessage 处理
          // ws.processWsMessage(JSON.parse(data)); 
          console.log(JSON.parse(data));
          ws.onMessage(data);
          break;
        case "heart_sent":
          // Worker 发送了心跳 ping 包，现在主线程启动倒计时
          ws.sendHeart(); 
          break;
        case "log":
          console.log(`[Worker Log]: ${data}`);
          break;
        default:
          break;
      }
    };

    // Web Worker 错误处理
    worker.value.onerror = (e) => {
      console.error(e);
      reload();
    };

    // Web Worker 消息错误处理
    worker.value.onmessageerror = (e) => {
      console.error(e);
      reload();
    };
  }

  /**
   * 重新加载Worker
   */
  async function reload() {
    await initWorker();

    // 初始化WebSocket连接 (此时调用的是 useWebSocket 的 Worker 代理方法)
    ws.initDefault(() => {
      // 在 Worker 的 onopen 事件中已经包含了初始化消息的发送
      setupMessageHandlers();
    });
  }

  /**
   * 设置消息处理器 ( Worker 会把消息传到主线程，由主线程处理 )
   */
  function setupMessageHandlers() {
    // ws.onMessage(); // 假设 onMessage 是一个启动消息监听的函数
  }

  /**
   * 发送状态到Worker ( Worker 启动后不再需要，因为连接/心跳逻辑在 Worker 内部 )
   */
  function sendStatusToWorker() {
    // 移除，因为 Worker 已经自行管理连接
  }

  /**
   * 清理Worker
   */
  function cleanupWorker() {
    console.log('清理了Worker', worker.value);
    worker.value?.terminate?.();
    setWsWorker(undefined); // 清理引用
    worker.value = undefined;
  }

  return {
    worker,
    isReload,
    initWorker,
    reload,
    cleanupWorker,
  };
}

/**
 * 初始化WebSocket
 */
export async function useWsInit() {
  const ws = useWsStore();
  const user = useUserStore();

  // 使用Worker管理hooks
  const { reload: reloadWorker, cleanupWorker } = useWsWorker();

  // 自动重连
  const validStatus = [WsStatusEnum.OPEN, WsStatusEnum.CONNECTION];
  watchDebounced(() => !validStatus.includes(ws.status) && user.isLogin, (bool) => {
    if (bool) {
      reloadWorker();
    }
    else if (!user.isLogin) {
      console.log('收到心跳3');
      
      cleanupWorker();
      ws.close(false);
    }
  }, {
    debounce: 3000,
    deep: true,
  });

  // 初始状态检查
  if (!validStatus.includes(ws.status) && user.isLogin) {
    reloadWorker();
  }

  // 暴露给外部调用，用于刷新Web Worker状态
  mitter.off(MittEventType.CHAT_WS_RELOAD);
  mitter.on(MittEventType.CHAT_WS_RELOAD, reloadWorker);

  return {
    ws,
    reloadWorker,
  };
}

/**
 * 清理WebSocket资源
 */
export function useWSUnmounted() {
  const ws = useWsStore();
  ws?.close(false);
}

/**
 * 发送系统通知
 */
export function notification(msg: ChatMessageVO) {
  const setting = useSettingStore();
  // web 通知
  if (setting.isWeb) {
    const chat = useChatStore();
    sendWebNotification(msg.fromUser.nickName, `${msg.message.content || "消息通知"}`, {
      icon: msg.fromUser.avatar ? BaseUrlImg + msg.fromUser.avatar : "/logo.png",
      onClick: () => {
        chat.setContact(chat.contactMap[msg.message.roomId]);
      },
    });
    return;
  }
  // tauri 通知
  sendNotification({
    icon: ["android", "ios"].includes(setting.appPlatform) ? "/logo.png" : BaseUrlImg + msg.fromUser.avatar,
    title: msg.fromUser.nickName,
    body: `${msg.message.content || "消息通知"}`,
    largeBody: `${msg.message.content || "消息通知"}`,
    number: 1,
  });
}


/**
 * WebSocket消息处理Hook
 */
export function useWsMessage() {
  // 消息类型映射
  const wsMsgMap: Record<WsMsgBodyType, keyof WsMsgItemMap> = {
    [WsMsgBodyType.MESSAGE]: "newMsg",
    [WsMsgBodyType.ONLINE_OFFLINE_NOTIFY]: "onlineNotice",
    [WsMsgBodyType.RECALL]: "recallMsg",
    [WsMsgBodyType.DELETE]: "deleteMsg",
    [WsMsgBodyType.APPLY]: "applyMsg",
    [WsMsgBodyType.MEMBER_CHANGE]: "memberMsg",
    [WsMsgBodyType.TOKEN_EXPIRED_ERR]: "tokenMsg",
    [WsMsgBodyType.RTC_CALL]: "rtcMsg",
    [WsMsgBodyType.PIN_CONTACT]: "pinContactMsg",
    [WsMsgBodyType.AI_STREAM]: "aiStreamMsg",
    [WsMsgBodyType.UPDATE_CONTACT_INFO]: "updateContactInfoMsg",
  };

  // 创建空消息列表
  const emptyMsgList = (): WsMsgItemMap => ({
    newMsg: [],
    onlineNotice: [],
    recallMsg: [],
    deleteMsg: [],
    applyMsg: [],
    memberMsg: [],
    tokenMsg: [],
    rtcMsg: [],
    pinContactMsg: [],
    aiStreamMsg: [],
    updateContactInfoMsg: [],
    other: [],
  });

  // 消息列表
  const wsMsgList = ref<WsMsgItemMap>(emptyMsgList());

  // 是否有新消息
  const isNewMsg = computed(() => wsMsgList.value.newMsg.length > 0);

  const { handleNotification } = useWsNotification();
  /**
   * 处理接收到的WebSocket消息
   */
  function processWsMessage(msgData: Result<WsMsgBodyVO>) {
    // if (!msgData)
    //   return;
    console.log('收到', msgData);
    // const wsMsg = msgData.data;
    // const body = wsMsg.data;

    // // 如果消息类型在映射中存在，则处理该消息
    // if (wsMsgMap[wsMsg.type] !== undefined) {
    //   wsMsgList.value[wsMsgMap[wsMsg.type]].push(body as any);
    //   mitter.emit(resolteChatPath(wsMsg.type), body);
    // }
    // handleNotification(wsMsg);
  }

  /**
   * 重置消息列表
   */
  function resetMsgList() {
    wsMsgList.value = emptyMsgList();
  }

  return {
    wsMsgMap,
    wsMsgList,
    isNewMsg,
    processWsMessage,
    resetMsgList,
    emptyMsgList,
  };
}