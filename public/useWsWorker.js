/**
 * 完全自动心跳 / 自动重连（无死循环） WebSocket Worker
 */

let wsHandler = null;

// 心跳
let heartbeatTimer = null;
let lastHeartbeatTime = new Date();
const HEARTBEAT_INTERVAL = 5000; 
const PONG_TIMEOUT = HEARTBEAT_INTERVAL * 2 + 2000;

// 重连
let reconnectTimer = null;
const RECONNECT_DELAY = 3000;

let BaseWSUrl = "";
let isTauriEnv = false;

// ---------------- 工具 ----------------

function sendLog(msg) {
  self.postMessage({ type: "log", data: msg });
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

// 只允许一个地方负责重连
function scheduleReconnect(url, initData) {
  if (reconnectTimer) return; // 已在等待重连，不重复
  
  sendLog(`⏳ 等待 ${RECONNECT_DELAY}ms 后重连...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    sendLog("🔄 自动重连中...");
    
    // 如果只是通知主线程，不需要 data
    self.postMessage({ type: "reconnect" });
    // 或者需要传信息就传一个真正存在的对象，例如：
    // self.postMessage({ type: "reconnect", data: { url, initData } });

    connect(url, isTauriEnv, initData);
  }, RECONNECT_DELAY);
}


// ---------------- 心跳 ----------------

function startHeartbeatMonitor(url, initData) {
  clearInterval(heartbeatTimer);

  heartbeatTimer = setInterval(() => {
    const now = Date.now();
    const elapsed = now - lastHeartbeatTime;

    // 心跳超时
    if (elapsed > PONG_TIMEOUT) {
      sendLog(`💔 心跳超时(${elapsed}ms)，准备重连`);
      stopHeartbeatMonitor();
      safeClose();     // 关闭但不触发 onclose 重连
      scheduleReconnect(url, initData);
      return;
    }

    // 发送 ping
    sendPing();

  }, HEARTBEAT_INTERVAL);

  sendLog("⏳ 心跳已启动");
}

function stopHeartbeatMonitor() {
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function sendPing() {
  send(JSON.stringify({ websocket_type: "ping" }));
  sendLog("➡️ PING");
}

// ---------------- WebSocket 连接 ----------------

function connect(url, isTauri, initData) {
  stopHeartbeatMonitor();
  safeClose();
  clearReconnectTimer();

  try {
    wsHandler = new WebSocket(url);

    wsHandler.onopen = () => {
      self.postMessage({ type: "open" });
      lastHeartbeatTime = Date.now();
      startHeartbeatMonitor(url, initData);

      // 发送初始数据
      send(
        JSON.stringify({
          websocket_type: "open",
          data: initData,
        })
      );
    };

    wsHandler.onmessage = (event) => {
      const text = event.data;
      
      
      // if(JSON.parse(text).data.type == 'message'){
      //   console.log(JSON.parse(text))
      // }
      // 判断 PONG
      try {
        const msg = JSON.parse(text);
        if (msg.code === 0 && msg.data.type === "message") {
          initData.last_timestamp = msg.data.result.timestamp; // 更新闭包内的引用
        }
        if (msg.code === 0 && msg.data?.type === "pong") {
          lastHeartbeatTime = Date.now();
          sendLog("💚 PONG");
        }else if(msg.code === 0 && msg.data?.type !== "pong"){
          self.postMessage({ type: "message", data: text });
        }
      } catch (e) {}
    };

    wsHandler.onerror = () => {
      sendLog("❌ WS error");
      // 不直接重连，交给 onclose
    };

    wsHandler.onclose = () => {
      stopHeartbeatMonitor();
      wsHandler = null;
      self.postMessage({ type: "close" });

      // 主动关闭不重连（safeClose 使用）
      if (manuallyClosed) {
        manuallyClosed = false;
        return;
      }

      scheduleReconnect(url, initData);
    };

    sendLog(`🔌 连接中：${url}`);

  } catch (err) {
    sendLog("连接异常：" + err.message);
    scheduleReconnect(url, initData);
  }
}

// ---------------- 发送消息 ----------------

function send(data) {
  if (wsHandler && wsHandler.readyState === WebSocket.OPEN) {
    wsHandler.send(data);
  } else {
    sendLog("❌ 连接未打开");
  }
}

// ---------------- 关闭 ----------------

// 用于标记是否是手动关闭（不触发重连）
let manuallyClosed = false;

function safeClose() {
  if (wsHandler) {
    try {
      manuallyClosed = true;
      wsHandler.close(1000, "manual close");
      wsHandler = null;
    } catch (e) {}
  }
}

// ---------------- 主线程消息 ----------------

self.onmessage = function (event) {
  const { command, url, isTauri, data, initData } = event.data;

  switch (command) {
    case "init":
      BaseWSUrl = url;
      isTauriEnv = isTauri;
      break;

    case "connect":
      connect(url, isTauri, initData);
      break;

    case "send":
      send(data);
      break;

    case "close":
      stopHeartbeatMonitor();
      clearReconnectTimer();
      safeClose();
      break;
  }
};
