import type { Message as BackMessage } from "@tauri-apps/plugin-websocket";
import type { WsSendMsgDTO } from "~/types/chat/WsType";
// 移除 BackWebSocket 引用
// import BackWebSocket from "@tauri-apps/plugin-websocket"; 
import { WsMsgType, WsStatusEnum } from "~/types/chat/WsType";

const WS_SYNC_DELAY = 200;

// Worker 引用 (在 useWsCore.ts 中管理，这里只是声明类型)
let wsWorker: Worker | undefined = undefined;

/**
 * 注入 Worker 实例，由 useWsCore.ts 调用
 */
export function setWsWorker(worker: Worker | undefined) {
  wsWorker = worker;
}

/**
 * WebSocket核心Hook
 * 提供WebSocket基础功能 (通过 Worker 代理实现)
 */
export function useWebSocket() {
  // webSocketHandler 仅用于 Worker 状态的占位符/标识
  const webSocketHandler = ref<any | null>(null);
  const user = useUserStore();
  // fullWsUrl 逻辑不变
  const fullWsUrl = computed(() => `${BaseWSUrl}`);
  const status = ref<WsStatusEnum>(WsStatusEnum.CLOSE);
  const lastDisconnectTime = ref<number>(0);
  const connectTime = ref<number>(0);
  const ws = useWsStore(); // 假设 useWsStore 实例可以访问

  // 辅助函数：向 Worker 发送指令
  function sendCommandToWorker(command: string, data: any = {}) {
    if (wsWorker) {
      wsWorker.postMessage({ command, ...data });
    }
  }

  function fetchWsChat() {
    connectTime.value = Date.now();
    console.log(`ws connectTime:${connectTime.value} lastDisconnectTime:${lastDisconnectTime.value} delay:${connectTime.value - lastDisconnectTime.value}`);

    if (lastDisconnectTime.value > 0 && (connectTime.value - lastDisconnectTime.value) >= WS_SYNC_DELAY) {
      mitter.emit(MittEventType.WS_SYNC, {
        lastDisconnectTime: lastDisconnectTime.value,
        reconnectTime: connectTime.value,
      });
    }
  }

  /**
   * 处理Worker返回的 WebSocket 事件 (open, close, error)
   */
  const handleWorkerEvent = (eventType: "open" | "close" | "error" | "message" | "reconnect", data: any, call?: () => any) => {
    switch (eventType) {
      case "open":
        status.value = WsStatusEnum.OPEN;
        webSocketHandler.value = true; // 标记连接已打开
        ws.open_message_push_success = 1;
        fetchWsChat();
        call?.();
        break;
      case "close":
        status.value = data === 1000 ? WsStatusEnum.SAFE_CLOSE : WsStatusEnum.CLOSE;
        webSocketHandler.value = null;
        lastDisconnectTime.value = Date.now();
        break;
      case "error":
        status.value = WsStatusEnum.CLOSE;
        webSocketHandler.value = null;
        lastDisconnectTime.value = Date.now();
        break;
      case "reconnect":
        status.value = WsStatusEnum.CONNECTION;
        webSocketHandler.value = null;
        lastDisconnectTime.value = Date.now();
        break;
      case "message":
        // 业务消息将由 useWsCore.ts 监听和处理
        break;
    }
  };

  /**
   * 初始化浏览器原生WebSocket (现在是 Worker 代理)
   */
  async function initBrowserWebSocket(url: string, call: () => any) {
    if (wsWorker) {
      // 监听 Worker 的 open 事件，执行回调和初始化消息发送
      const openListener = (e: MessageEvent) => {
        if (e.data.type === "open") {
          handleWorkerEvent("open", null, call);
          wsWorker?.removeEventListener('message', openListener);
        }
      };
      wsWorker.addEventListener('message', openListener);
    }

    const latestMessage = await ws.getLatestMessage();
    const last_timestamp = (latestMessage as { timestamp: number })?.timestamp || null;

    status.value = WsStatusEnum.CONNECTION;

    sendCommandToWorker('connect', {
      url,
      isTauri: false,
      initData: {
        authorization: user.getToken || localStorage.getItem('authorization'),
        last_timestamp: localStorage.getItem('currentTime') || last_timestamp || null,
      }
    });

    // 返回一个假句柄，表示 Worker 正在处理
    webSocketHandler.value = true;
    return true;
  }

  /**
   * 初始化Tauri WebSocket (现在是 Worker 代理)
   */
  async function initTauriWebSocket(url: string, call: () => any) {
    if (wsWorker) {
      const openListener = (e: MessageEvent) => {
        if (e.data.type === "open") {
          handleWorkerEvent("open", null, call);
          wsWorker?.removeEventListener('message', openListener);
        }
      };
      wsWorker.addEventListener('message', openListener);
    }

    status.value = WsStatusEnum.CONNECTION;

    sendCommandToWorker('connect', {
      url,
      isTauri: true,
      initData: {
        // Tauri 连接的初始化数据
        authorization: user.getToken || localStorage.getItem('authorization'),
      }
    });

    // 返回一个假句柄，表示 Worker 正在处理
    webSocketHandler.value = true;
    return true;
  }

  /**
   * 处理Tauri WebSocket错误 (现在由 Worker 报告)
   */
  function handleTauriWsError(msg: BackMessage): boolean {
    // 逻辑简化：如果 Worker 报告了 close/error，主线程会更新状态，不再需要单独处理
    return false;
  }

  /**
   * 关闭WebSocket连接 (通过 Worker 代理)
   */
  async function closeConnection() {
    sendCommandToWorker('close');
  }

  /**
   * 移除事件监听器 (不再需要移除原生的，Worker 内部会处理)
   */
  function removeEventListeners() {
    // 主线程不再有原生的事件监听器
  }

  function resetWs() {
    status.value = WsStatusEnum.CLOSE;
    sendCommandToWorker('close');
    webSocketHandler.value = null;
    lastDisconnectTime.value = Date.now();
    mitter.emit(MittEventType.CHAT_WS_RELOAD);
  }

  /**
   * 发送消息 (通过 Worker 代理)
   */
  const messageTimeoutMap = new Map<string, ReturnType<typeof setTimeout>>()
  function send(dto: any) {
    if (status.value === WsStatusEnum.OPEN && webSocketHandler.value) {
      sendCommandToWorker('send', { data: JSON.stringify(dto) });

      // ... 消息超时逻辑不变，但需要确保 handleMessage 能被 Worker 的消息触发
    }
  }

  // 假设你在这里收到消息（ws.onmessage）：
  function handleMessage(id: any) {
    if (id && messageTimeoutMap.has(id)) {
      clearTimeout(messageTimeoutMap.get(id)!)
      messageTimeoutMap.delete(id)
      console.log(`消息已响应: ${id}`)
    }
  }

  /**
   * 发送心跳包 (通过 Worker 代理)
   */
  function sendHeart() {
    // Worker 已经在其内部发送 ping 包，这里改为处理主线程的倒计时逻辑
    // Worker 发送 'heart_sent' 指令到主线程
    const timer = useTimerStore();
    const ws = useWsStore();

    // 启动超时倒计时
    timer.startTimer(() => {
      console.log('心跳倒计时超时，发起重连', new Date().toLocaleTimeString());
      ws.reload();
    }, 3000); // 3s未收到心跳回复 自动重连
  }

  return {
    webSocketHandler,
    status,
    fullWsUrl,
    lastDisconnectTime,
    connectTime,
    initBrowserWebSocket,
    initTauriWebSocket,
    handleTauriWsError,
    closeConnection,
    removeEventListeners,
    send,
    sendHeart,
    handleMessage,
    handleWorkerEvent, // 暴露给 useWsCore.ts 用于监听 Worker 事件
  };
}