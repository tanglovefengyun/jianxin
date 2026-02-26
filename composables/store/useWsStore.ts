import type { Message as BackMessage } from "@tauri-apps/plugin-websocket";
import type BackWebSocket from "@tauri-apps/plugin-websocket";
import { acceptHMRUpdate, defineStore } from "pinia";
import { useWsMessage, useWsWorker } from "~/composables/hooks/ws/useWsCore";
import { WsStatusEnum } from "~/types/chat/WsType";
import { sendNotification } from "@tauri-apps/plugin-notification";
import type Content from "~/components/Chat/Content.vue";

// @unocss-include
export const useWsStore = defineStore(
  WS_STORE_KEY,
  () => {
    const isWindBlur = ref<boolean>(false);
    const synchronousType = ref(false);
    let syncPushTimer: ReturnType<typeof setTimeout> | null = null;
    // WebSocket核心hooks
    const {
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
    } = useWebSocket();

    // 消息处理hooks processWsMessage
    const {
      wsMsgList,
      isNewMsg,
      processWsMessage,
      resetMsgList,
    } = useWsMessage();

    /**
     * 重新加载WebSocket连接
     */
    const reload = () => mitter.emit(MittEventType.CHAT_WS_RELOAD);
    const user = useUserStore();
    /**
     * 默认初始化WebSocket连接
     */
    async function initDefault(call: () => any) {
      const setting = useSettingStore();
      const user = useUserStore();
      if (!user.getToken) {
        await closeConnection();
        status.value = WsStatusEnum.SAFE_CLOSE;
        return false;
      }

      // 如果已经连接且状态为OPEN或CONNECTION，直接返回
      if (webSocketHandler.value && (status.value === WsStatusEnum.OPEN || status.value === WsStatusEnum.CONNECTION)) {
        return webSocketHandler.value;
      }
      // 根据设置选择WebSocket实现
      return setting.isUseWebsocket
        ? initBrowserWebSocket(fullWsUrl.value, call)
        : initTauriWebSocket(fullWsUrl.value, call);
    }

    function notifyNewMessage(message: string) {
      if (!("Notification" in window)) return;

      if (Notification.permission === "granted") {
        new Notification("简信", {
          body: message,
          icon: "/logo.png"
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("简信", {
              body: message,
              icon: "/logo.png"
            });
          }
        });
      }
    }

    // function getChatInfo(data: any) {
    //   // 从本地存储中获取现有的历史记录
    //   const user = useUserStore();

    //   // const stored = user.getChatInfo;
    //   const chat_info = user.getChatInfo;
    //   const chat = useChatStore();

    //     // 查找是否存在相同 id 的对象
    //   const index = chat_info.findIndex((existingItem: any) => existingItem.id === data.result.chat_info.id);

    //   const parmas = {
    //     content: data.result.content,
    //     ...data.result.chat_info,
    //     timer: data.result.timestamp * 1000,
    //     // timer: Date.now(),
    //     unreadId:  data.result.user.id, //发言用户的id
    //     unreadName:  data.result.user.nickname, //发言用户的名称
    //     type: data.result.type, // 发言的类型
    //     job: data.result.chat_info.job, // 发言的职位
    //     department: data.result.chat_info.department, // 发言的部门
    //     msg_status: data.result.msg_status,
    //     pinTime: index !== -1 ? chat_info[index].pinTime : null,
    //     grouping: index !== -1 ? chat_info[index].grouping : null,
    //   };

    //   if (index !== -1) {
    //     const old = chat_info[index];

    //     // 判断是否在当前聊天室
    //     const isCurrentChat = chat.chatId == JSON.stringify(chat_info[index].chat_id);

    //     // 不在当前聊天室并且消息有用户id
    //     const isUnread = !isCurrentChat && data.result.user.id;

    //     const newObj = {
    //       ...parmas,
    //       unreadMsg: isCurrentChat ? 0 : data.result.read_status ? 0 : (old.unreadMsg || 0) + 1,
    //       at_user: data.result.at_user?.includes(user.userInfo.id),
    //       firstUnreadMsgId: isUnread && !old.firstUnreadMsgId ? data.result.id : old.firstUnreadMsgId,
    //     };

    //     chat_info[index] = newObj;
    //   } else {
    //     const isUnread = data.result.user.id;
    //     chat_info.unshift({
    //       ...parmas,
    //       unreadMsg: isUnread && !data.result.read_status ? 1 : 0,
    //       at_user: data.result.at_user?.includes(user.userInfo.id),
    //       firstUnreadMsgId: isUnread ? data.result.id : null,
    //       // firstUnreadMsgContent: isUnread ? data.result.content : null
    //     });
    //   }

    //   // 将更新后的历史记录保存到本地存储
    //   // localStorage.setItem("chat_info", JSON.stringify(chat_info));
    //   user.getChatInfo = chat_info.sort((a: any, b: any) => {
    //     const aPinned = a.pinTime ? 1 : 0;
    //     const bPinned = b.pinTime ? 1 : 0;

    //     if (aPinned !== bPinned) {
    //       return bPinned - aPinned; // 有 pinTime 的排在前面
    //     }

    //     if (aPinned && bPinned) {
    //       // 都有 pinTime，按 pinTime 降序
    //       return b.timer - a.timer;
    //     }

    //     // 都没有 pinTime，按 timer 降序
    //     return b.timer - a.timer;
    //   });
    // }

    const open_message_push_success = ref(0);   // 推送聊天的状态
    // 定时器 & 缓存队列
    const messageBuffer: any[] = [];

    function getChatInfo(data: any) {
      // 每条消息先暂存进缓存数组
      messageBuffer.push(data);

      // 如果定时器存在，清除
      if (syncPushTimer) clearTimeout(syncPushTimer);

      // 重置定时器：200ms内无新消息才刷新 UI
      syncPushTimer = setTimeout(() => {
        // 合并缓存并刷新 UI
        mergeChatInfoBuffer();
        // 清空缓存 & 定时器
        messageBuffer.length = 0;
        syncPushTimer = null;
      }, 200);
    }

    function mergeChatInfoBuffer() {
      const user = useUserStore();
      const chat = useChatStore();
      const chat_info = user.getChatInfo;

      messageBuffer.forEach((data) => {
        const index = chat_info.findIndex((item: any) => item.id === data.result.chat_info.id);
        const params = {
          content: data.result.content,
          ...data.result.chat_info,
          timer: data.result.timestamp * 1000,
          unreadId: data.result.user.id,
          unreadName: data.result.user.nickname,
          type: data.result.type,
          job: data.result.chat_info.job,
          department: data.result.chat_info.department,
          msg_status: data.result.msg_status,
          pinTime: index !== -1 ? chat_info[index].pinTime : null,
          grouping: index !== -1 ? chat_info[index].grouping : null,
        };

        if (index !== -1) {
          const old = chat_info[index];
          const isCurrentChat = chat.chatId == JSON.stringify(chat_info[index].chat_id);
          const isUnread = !isCurrentChat && data.result.user.id;

          let unreadMsg = old.unreadMsg || 0;
          if (isCurrentChat) {
            unreadMsg = 0;
          } else if (data.result.read_status) {
            // 已读，不增加未读数
            unreadMsg = old.unreadMsg;
          } else if (data.result.user.id == user.userInfo.id) {
            // 自己发的消息，不增加未读数
            unreadMsg = old.unreadMsg;
          } else if (data.result.msg_status == 2) {
            // 消息未送达/无效，不计未读
            unreadMsg = old.unreadMsg > 0 ? old.unreadMsg - 1 : 0;
          } else {
            // 有效、未读、他人发送，增加未读数
            unreadMsg += 1;
          }

          const newObj = {
            ...params,
            unreadMsg: unreadMsg,
            at_user: data.result.at_user?.includes(user.userInfo.id),
            firstUnreadMsgId: isUnread && !old.firstUnreadMsgId ? data.result.id : old.firstUnreadMsgId,
          };

          chat_info[index] = newObj;
        } else {
          const isUnread = data.result.user.id;
          chat_info.unshift({
            ...params,
            unreadMsg: isUnread && !data.result.read_status ? 1 : 0,
            at_user: data.result.at_user?.includes(user.userInfo.id),
            firstUnreadMsgId: isUnread ? data.result.id : null,
          });
        }
      });

      // 排序并更新响应式数据
      user.getChatInfo = chat_info.sort((a: any, b: any) => {
        const aPinned = a.pinTime ? 1 : 0;
        const bPinned = b.pinTime ? 1 : 0;

        if (aPinned !== bPinned) return bPinned - aPinned;
        return b.timer - a.timer;
      });
      console.log(user.getChatInfo, 'roomroomroom');

    }



    function removeChatById(chatId: any) {
      // 获取本地存储的 chat_info
      const user = useUserStore();
      const chatInfoStr = user.getChatInfo;
      // const chatInfoStr = localStorage.getItem('chat_info');

      if (!chatInfoStr) return; // 如果不存在，直接返回
      try {
        // const chatInfo = JSON.parse(chatInfoStr);

        // 过滤掉 chat_id 匹配的项
        const updatedChatInfo = chatInfoStr.filter((item: any) => item.chat_id !== chatId);

        // 存回 localStorage
        // localStorage.setItem('chat_info', JSON.stringify(updatedChatInfo));
        user.getChatInfo = updatedChatInfo;
      } catch (e) {
        console.error('Failed to parse or update chat_info:', e);
      }
    }

    // 清除新消息
    function clearUnreadMsgById(id: string | number) {
      const user = useUserStore();

      // const stored = user.getChatInfo;
      const chat_info = user.getChatInfo;

      const index = chat_info.findIndex((item: any) => item.chat_id === id);
      if (index !== -1) {
        chat_info[index].unreadMsg = 0;
        chat_info[index].firstUnreadMsgId = 0;
        chat_info[index].at_user = false;
      }

      // 更新本地存储
      // localStorage.setItem("chat_info", JSON.stringify(chat_info));

      // 更新状态（如果你在全局 store 中维护这个列表）
      user.getChatInfo = chat_info.sort((a: any, b: any) => {
        const aPinned = a.pinTime ? 1 : 0;
        const bPinned = b.pinTime ? 1 : 0;

        if (aPinned !== bPinned) {
          return bPinned - aPinned; // 有 pinTime 的排在前面
        }

        if (aPinned && bPinned) {
          // 都有 pinTime，按 pinTime 降序
          return b.timer - a.timer;
        }

        // 都没有 pinTime，按 timer 降序
        return b.timer - a.timer;
      });
    }


    // let db: IDBDatabase | null = null;
    // const messagesList = ref<any>([])
    // function openDB(): Promise<IDBDatabase> {
    //   if (db) return Promise.resolve(db);
    //   return new Promise((resolve, reject) => {
    //     const req = indexedDB.open("myDatabase", 1);
    //     req.onupgradeneeded = () => {
    //       const d = req.result;
    //       if (!d.objectStoreNames.contains("myStore")) {
    //         d.createObjectStore("myStore", { keyPath: "h5_local_id" });
    //       }
    //     };
    //     req.onsuccess = () => {
    //       db = req.result;
    //       resolve(db);
    //     };
    //     req.onerror = () => reject(req.error);
    //   });
    // }

    // // 写入数据
    // async function saveDataToIndexedDB(data: any): Promise<void> {
    //   console.log('收到123', data);
    //   const d = await openDB();
    //   const tx = d.transaction("myStore", "readwrite");
    //   console.log(data);

    //   tx.objectStore("myStore").put(data);
    //   return new Promise((res, rej) => {
    //     tx.oncomplete = () => res();
    //     tx.onerror = () => rej(tx.error);
    //   });
    // }

    // // 通过id查询某条数据
    // async function getDataById(id: string | number): Promise<any> {
    //   const d = await openDB();
    //   const tx = d.transaction("myStore", "readonly");
    //   const store = tx.objectStore("myStore");

    //   const getReq = store.get(id);

    //   return new Promise((resolve, reject) => {
    //     getReq.onsuccess = () => {
    //       resolve(getReq.result); // 返回对象或 undefined
    //     };
    //     getReq.onerror = () => {
    //       reject(getReq.error);
    //     };
    //   });
    // }

    // // 修改indexdb数据中某条数据的某个key的值
    // async function updateIndexedDBField(id: string | number, key: string, value: any): Promise<void> {
    //   const d = await openDB();
    //   const tx = d.transaction("myStore", "readwrite");
    //   const store = tx.objectStore("myStore");

    //   const getReq = store.get(id);

    //   return new Promise((resolve, reject) => {
    //     getReq.onsuccess = () => {
    //       const record = getReq.result;
    //       if (!record) {
    //         reject(new Error(`记录 ID ${id} 不存在`));
    //         return;
    //       }

    //       record[key] = value;

    //       const updateReq = store.put(record);
    //       updateReq.onsuccess = () => resolve();
    //       updateReq.onerror = () => reject(updateReq.error);
    //     };

    //     getReq.onerror = () => reject(getReq.error);
    //   });
    // }

    // // 添加已读成员
    // async function updateDataInIndexedDB(h5_local_id: string, newReadItem: any): Promise<void> {
    //   const d = await openDB();
    //   const tx = d.transaction("myStore", "readwrite");
    //   const store = tx.objectStore("myStore");

    //   const req = store.get(h5_local_id);

    //   return new Promise((resolve, reject) => {
    //     req.onsuccess = () => {
    //       let data = req.result;

    //       if (!data) {
    //         console.warn(`未找到 h5_local_id 为 ${h5_local_id} 的数据`);
    //         resolve();
    //         return;
    //       }

    //       // ✅ 初始化 readList
    //       if (!Array.isArray(data.readList)) {
    //         data.readList = [];
    //       }

    //       // ✅ 去重：如果 readList 中没有相同 userId 才添加
    //       const alreadyExists = data.readList.some(
    //         (item: any) => item.id === newReadItem.id
    //       );

    //       if (!alreadyExists) {
    //         data.readList.push(newReadItem);
    //       }

    //       // ✅ 覆盖回 IndexedDB
    //       const updateReq = store.put(data);
    //       updateReq.onsuccess = () => resolve();
    //       updateReq.onerror = () => reject(updateReq.error);
    //     };

    //     req.onerror = () => reject(req.error);
    //   });
    // }

    // async function deleteMessageById(id: string | number) {
    //   const d = await openDB(); // 你的 IndexedDB 实例
    //   const tx = d.transaction("myStore", 'readwrite');
    //   const store = tx.objectStore('myStore');
    //   store.delete(id);
    // }

    // // 通过关键词查找聊天记录
    // async function searchInIndexedDB(keyword: string): Promise<any[]> {
    //   const dbInstance = await openDB(); // 确保数据库已打开
    //   const result: any[] = [];

    //   return new Promise((resolve, reject) => {
    //     const tx = dbInstance.transaction("myStore", "readonly");
    //     const store = tx.objectStore("myStore");
    //     const request = store.openCursor();

    //     request.onsuccess = (event) => {
    //       const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

    //       if (cursor) {
    //         const value = cursor.value;
    //         if (value.content && typeof value.content === "string" && value.content.includes(keyword)) {
    //           result.push(value);
    //         }
    //         cursor.continue(); // 继续下一个
    //       } else {
    //         resolve(result); // 遍历结束
    //       }
    //     };

    //     request.onerror = () => {
    //       reject(request.error);
    //     };
    //   });
    // }

    // async function getAllMessages(): Promise<any[]> {
    //   const d = await openDB();
    //   const tx = d.transaction("myStore", "readonly");     // ← 和写入保持一致
    //   const store = tx.objectStore("myStore");
    //   return new Promise((res, rej) => {
    //     const req = store.getAll();
    //     req.onsuccess = () => res(req.result);
    //     req.onerror   = () => rej(req.error);
    //   });
    // }

    // async function getLatestMessage() {
    //   const db = await openDB(); // 获取你的 IndexedDB 实例
    //   const tx = db.transaction("myStore", "readonly");
    //   const store = tx.objectStore("myStore");

    //   const allMessages: any[] = [];

    //   return new Promise((resolve, reject) => {
    //     const request = store.openCursor();

    //     request.onsuccess = (event: any) => {
    //       const cursor = event.target.result;
    //       if (cursor) {
    //         allMessages.push(cursor.value);
    //         cursor.continue();
    //       } else {
    //         if (allMessages.length === 0) return resolve(null);

    //         // 根据 timestamp 排序，取最新的那一条
    //         allMessages.sort((a, b) => b.timestamp - a.timestamp);
    //         resolve(allMessages[0]);
    //       }
    //     };
    //   });
    // }

    let db: IDBDatabase | null = null;
    const messagesList = ref<any>([]);

    // 打开数据库，为每个用户生成专属数据库
    function openDB(): Promise<IDBDatabase> {
      const dbName = `myDatabase_${user.userInfo.id}`; // 根据 userId 生成用户专属数据库
      return new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, 1);

        req.onupgradeneeded = (event) => {
          const d = req.result;

          // 创建用户专属表
          if (!d.objectStoreNames.contains(`myStore_${user.userInfo.id}`)) {
            d.createObjectStore(`myStore_${user.userInfo.id}`, { keyPath: "h5_local_id" });
          }

          // 如果旧表存在，记录需要迁移
          if (d.objectStoreNames.contains("myStore")) {
            console.log("检测到旧表 myStore，准备迁移");
          }
        };

        req.onsuccess = () => {
          db = req.result;
          // 检查是否需要迁移旧数据
          resolve(db);
        };
        upgradeDBVersion("myDatabase");
        req.onerror = () => reject(req.error);
      });
    }

    // 数据迁移函数
    async function migrateOldData(db: IDBDatabase): Promise<void> {
      return new Promise((resolve, reject) => {
        let oldStore;
        try {
          oldStore = db.transaction("myStore", "readonly").objectStore("myStore");
        } catch (err) {
          console.log("旧表 myStore 不存在，无需迁移");
          resolve();
          return;
        }

        const oldData: any[] = [];
        const cursorRequest = oldStore.openCursor();

        cursorRequest.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            oldData.push(cursor.value);
            cursor.continue();
          } else {
            if (oldData.length > 0) {
              // 将旧数据插入新表
              const newStore = db.transaction(`myStore_${user.userInfo.id}`, "readwrite").objectStore(`myStore_${user.userInfo.id}`);
              oldData.forEach((data) => {
                newStore.put(data);
              });
              console.log("旧数据已迁移到新表");
            }
            resolve();
          }
        };

        cursorRequest.onerror = () => reject(cursorRequest.error);
      });
    }

    // 升级数据库版本以删除旧表
    function upgradeDBVersion(dbName: string): void {
      // 在删除数据库并重新打开之前，确保已经迁移数据
      // 通过删除数据库，强制删除所有表
      indexedDB.deleteDatabase(dbName);  // 删除整个数据库，清除旧数据
    }


    // 写入数据
    class MessageDbManager {
      private queue: any[] = [];
      private isProcessing = false;
      private db: IDBDatabase | null = null;

      // 获取数据库连接（单例模式）
      private async getDb() {
        if (this.db) return this.db;
        this.db = await openDB();
        return this.db;
      }

      // 外部 WS 调用的接口
      async enqueue(data: any) {
        this.queue.push(data);
        this.processQueue();
      }

      // 循环处理队列
      private async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        try {
          const db = await this.getDb();
          const storeName = `myStore_${user.userInfo.id}`;

          // 开启一个事务，处理当前队列中的所有消息
          const tx = db.transaction(storeName, "readwrite");
          const store = tx.objectStore(storeName);

          // 批量写入：取出当前队列所有内容
          const currentBatch = this.queue.splice(0, this.queue.length);

          currentBatch.forEach(data => {
            store.put(data);
          });

          await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
          });

          console.log(`成功批量写入 ${currentBatch.length} 条消息`);
        } catch (error) {
          console.error("批量写入失败:", error);
          // 可以在这里根据错误类型决定是否把 currentBatch 重新塞回队列头部重试
        } finally {
          this.isProcessing = false;
          // 检查是否还有新来的消息需要处理
          if (this.queue.length > 0) {
            this.processQueue();
          }
        }
      }
    }
    // 全局唯一的实例
    const messageDb = new MessageDbManager();
    async function saveDataToIndexedDB(data: any, retries: number = 3): Promise<void> {
      const storeName = `myStore_${user.userInfo.id}`;
      let db: IDBDatabase | null = null;

      try {
        db = await openDB(); // 获取数据库连接

        // 开启事务
        const tx = db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        // 使用 put 写入（覆盖模式比 add 更健壮）
        store.put(data);

        return new Promise((resolve, reject) => {
          // 成功完成
          tx.oncomplete = () => {
            db?.close(); // 写入成功后及时释放连接（可选，视你的 openDB 实现而定）
            resolve();
          };

          // 写入失败
          tx.onerror = async () => {
            const err = tx.error;
            const errorDetail = {
              name: err?.name || 'UnknownError',
              message: err?.message || 'IndexedDB write failed',
              storeName: storeName,
              remainingRetries: retries
            };

            // 1. 异步上报错误日志
            getLogErrorApi(
              { content: JSON.stringify(errorDetail), message: JSON.stringify(data) },
              user.getToken
            );

            // 2. 发生错误时，务必关闭当前可能有故障的连接
            db?.close();

            // 3. 核心判断：是否进行重试
            if (retries > 0) {
              console.warn(`IndexedDB 写入失败: ${errorDetail.name}，正在进行第 ${4 - retries} 次重试...`);

              // 延迟 300ms 再重试，给底层引擎恢复时间
              await new Promise(r => setTimeout(r, 300));

              try {
                // 递归调用，重试次数减 1
                await saveDataToIndexedDB(data, retries - 1);
                resolve();
              } catch (retryErr) {
                reject(retryErr);
              }
            } else {
              // 重试次数用尽，最终抛出错误
              console.error("IndexedDB 写入最终失败，已达重试上限。");
              reject(errorDetail);
            }
          };

          // 处理事务被意外取消的情况
          tx.onabort = () => {
            db?.close();
            reject(new Error("Transaction aborted"));
          };
        });

      } catch (error) {
        // 处理 openDB 失败或 transaction 初始化失败的情况
        db?.close();
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 500));
          return saveDataToIndexedDB(data, retries - 1);
        }
        throw error;
      }
    }
    // 通过id查询数据
    async function getDataById(id: string | number): Promise<any> {
      const d = await openDB();  // 每次通过 userId 打开专属的表
      const tx = d.transaction(`myStore_${user.userInfo.id}`, "readonly");
      const store = tx.objectStore(`myStore_${user.userInfo.id}`);

      const getReq = store.get(id);
      return new Promise((resolve, reject) => {
        getReq.onsuccess = () => resolve(getReq.result);
        getReq.onerror = () => reject(getReq.error);
      });
    }

    // 修改indexdb数据中某条数据的某个key的值
    async function updateIndexedDBField(id: string | number, key: string, value: any): Promise<void> {
      const d = await openDB();
      const tx = d.transaction(`myStore_${user.userInfo.id}`, "readwrite");
      const store = tx.objectStore(`myStore_${user.userInfo.id}`);

      const getReq = store.get(id);

      return new Promise((resolve, reject) => {
        getReq.onsuccess = () => {
          const record = getReq.result;
          if (!record) {
            reject(new Error(`记录 ID ${id} 不存在`));
            return;
          }

          record[key] = value;

          const updateReq = store.put(record);
          updateReq.onsuccess = () => resolve();
          updateReq.onerror = () => reject(updateReq.error);
        };

        getReq.onerror = () => reject(getReq.error);
      });
    }

    // 添加已读成员
    async function updateDataInIndexedDB(h5_local_id: string, newReadItem: any): Promise<void> {
      const d = await openDB();  // 每次通过 userId 打开专属的表
      const tx = d.transaction(`myStore_${user.userInfo.id}`, "readwrite");
      const store = tx.objectStore(`myStore_${user.userInfo.id}`);

      const req = store.get(h5_local_id);

      return new Promise((resolve, reject) => {
        req.onsuccess = () => {
          let data = req.result;

          if (!data) {
            console.warn(`未找到 h5_local_id 为 ${h5_local_id} 的数据`);
            resolve();
            return;
          }

          // 初始化 readList
          if (!Array.isArray(data.readList)) {
            data.readList = [];
          }

          // 去重：如果 readList 中没有相同 userId 才添加
          const alreadyExists = data.readList.some((item: any) => item.id === newReadItem.id);

          if (!alreadyExists) {
            data.readList.push(newReadItem);
          }

          // 覆盖回 IndexedDB
          const updateReq = store.put(data);
          updateReq.onsuccess = () => resolve();
          updateReq.onerror = () => reject(updateReq.error);
        };

        req.onerror = () => reject(req.error);
      });
    }

    // 删除消息
    async function deleteMessageById(id: string | number) {
      const d = await openDB();  // 每次通过 userId 打开专属的表
      const tx = d.transaction(`myStore_${user.userInfo.id}`, 'readwrite');
      const store = tx.objectStore(`myStore_${user.userInfo.id}`);
      store.delete(id);
    }

    // 通过关键词查找聊天记录
    async function searchInIndexedDB(keyword: string): Promise<any[]> {
      const dbInstance = await openDB();  // 确保数据库已打开
      const result: any[] = [];

      return new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(`myStore_${user.userInfo.id}`, "readonly");
        const store = tx.objectStore(`myStore_${user.userInfo.id}`);
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;

          if (cursor) {
            const value = cursor.value;
            if (value.content && typeof value.content === "string" && value.content.includes(keyword)) {
              result.push(value);
            }
            cursor.continue(); // 继续下一个
          } else {
            resolve(result); // 遍历结束
          }
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    }

    // 获取所有消息
    async function getAllMessages(): Promise<any[]> {
      const d = await openDB();
      const tx = d.transaction(`myStore_${user.userInfo.id}`, "readonly");
      const store = tx.objectStore(`myStore_${user.userInfo.id}`);
      return new Promise((res, rej) => {
        const req = store.getAll();
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });
    }

    // 获取最新的消息
    async function getLatestMessage() {
      const db = await openDB(); // 获取你的 IndexedDB 实例
      const tx = db.transaction(`myStore_${user.userInfo.id}`, "readonly");
      const store = tx.objectStore(`myStore_${user.userInfo.id}`);

      const allMessages: any[] = [];

      return new Promise((resolve, reject) => {
        const request = store.openCursor();

        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            allMessages.push(cursor.value);
            cursor.continue();
          } else {
            if (allMessages.length === 0) return resolve(null);

            // 根据 timestamp 排序，取最新的那一条
            allMessages.sort((a, b) => b.timestamp - a.timestamp);
            resolve(allMessages[0]);
          }
        };
      });
    }


    // 刷新消息
    async function getAllMessagesContent() {
      messagesList.value = await getAllMessages();
    }

    async function shouldSendNotification(): Promise<boolean> {
      const windowApi = await import('@tauri-apps/api/window');
      const appWindow = new windowApi.Window('main'); // 注意这里是 new Window('main')
      const isFocused = await appWindow.isFocused();
      return !isFocused; // 如果未聚焦，则应该发通知
    }

    const originalTitle = document.title;
    let titleTimer: number | null = null;

    function startTitleBlink(newMsgText = '你有新消息') {
      if (titleTimer) return; // 避免重复执行
      titleTimer = window.setInterval(() => {
        document.title = document.title === originalTitle ? newMsgText : originalTitle;
      }, 700);
    }

    function stopTitleBlink() {
      if (titleTimer) {
        clearInterval(titleTimer);
        titleTimer = null;
        document.title = originalTitle;
      }
    }

    // 页面可见时，停止闪烁
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        stopTitleBlink();
      }
    });

    // Map 来存储带 ID 的通知实例
    const notificationMap = new Map<string, any>();

    function sendNotificationForm(
      idOrOptions: any,
      options?: any
    ): void {
      if (Notification.permission !== 'granted') return;

      // ✅ 传了 ID 和选项对象
      if (idOrOptions) {
        const id = idOrOptions;
        const notification = new Notification(options.title, options);
        console.log(idOrOptions, 'idOrOptions');
        // 存储进 Map，便于后续关闭
        notificationMap.set(id, notification);
        console.log(notificationMap, 'notificationMap');
        notification.onclick = function (event) {
          event.preventDefault(); // 阻止浏览器默认行为（有些浏览器会尝试打开通知相关链接）

          console.log('通知被点击了');

          // const chat = useChatStore();
          // chat.msgContact.id = id
          const win = window.open('https://msg.llxads.com', '_blank');

          // const win = window.open('https://msg.llxads.com', '_blank');
          if (win) {
            win.focus();
          } else {
            console.warn('弹窗被浏览器拦截了');
          }

          notification.close(); // 关闭通知

          // 示例：你也可以跳转页面
          // window.location.href = '/chat/' + someRoomId;
        };
        // 自动移除
        // notification.onclose = () => {
        //   notificationMap.delete(id);
        // };
      }
    }

    function closeNotification(id: any) {
      const notification = notificationMap.get(id);
      console.log(id, 'notificationid');
      console.log(notification, 'notification');
      console.log(notificationMap, 'notificationMap');

      if (notification) {
        notification.close();
        notificationMap.delete(id);
      }
    }

    /**
     * 接收消息
     */
    async function onMessage(event: any) {
      // if (!webSocketHandler.value)
      //   return;

      const setting = useSettingStore();
      if (setting.isUseWebsocket) {
        // 浏览器WebSocket实现
        // (webSocketHandler.value as WebSocket).onmessage = async (event: MessageEvent) => {
        // if (event && !event.data)
        //   return false;

        try {
          const data = JSON.parse(event) as any;
          console.log('触发了消息', data);
          if (!data.data) return
          const user = useUserStore();
          const chat = useChatStore();
          // 心跳消息
          // if (data.data.type === 'pong') {
          //   const timer = useTimerStore()
          //   timer.clearTimer()
          //   return
          // }
          // 退出登录
          if (data.data.type == 'log_out') {
            user.callbackUserExit(user.getToken)
          }
          // 收到推送完消息
          if (data.data.type == 'open_message_push_success') {
            open_message_push_success.value = 1
            return
          }
          // 置顶会话
          if (data.data.type === 'chat_pinned') {
            const chat = user.getChatInfo.find((i: any) => i.chat_id == data.data.result.chat_id)

            if (!chat) return ElMessage.error('找不到对应聊天记录')

            // 切换 pin 状态
            chat.pinTime = data.data.result.pinned_chat ? Date.now() : null;

            // 更新数组引用（视情况是否响应式需要）
            // user.getChatInfo = [...user.getChatInfo]; // 如果是 reactive 结构，有时需要这样触发响应式更新
            console.log(chat)
            // const stored = localStorage.getItem('chat_info')
            // const chat_info = stored ? JSON.parse(stored) : []
            const index = user.getChatInfo.findIndex((existingItem: any) => existingItem.chat_id === data.data.result.chat_id)
            user.getChatInfo[index] = chat
            user.getChatInfo = user.getChatInfo.sort((a: any, b: any) => {
              const aPinned = a.pinTime ? 1 : 0
              const bPinned = b.pinTime ? 1 : 0

              if (aPinned !== bPinned) {
                return bPinned - aPinned // 有 pinTime 的排在前面
              }

              if (aPinned && bPinned) {
                // 都有 pinTime，按 pinTime 降序
                return b.timer - a.timer
              }

              // 都没有 pinTime，按 timer 降序
              return b.timer - a.timer
            })
            return
          }
          // 抹除消息
          if (data.data.type == 'erase_message' && data.data.result.user_id == user.userInfo.id) {
            // 删除聊天室
            localStorage.removeItem(`chat_info_${user.userInfo.id}`)
            localStorage.removeItem(`chat_info`)
            user.getChatInfo = []
            // 删除本地数据库indexdb数据
            upgradeDBVersion(`myDatabase_${user.userInfo.id}`);
            chat.msgContact.id = null;
            chat.theRoomId = undefined;
            // localStorage.setItem('last_timestamp', data.data.result.timestamp)
          }
          if (data.data.type == 'message') {
            try {
              if (data.data.result.msg_status !== 3 && data.data.result.msg_status !== -3) {
                getChatInfo(data.data);
              }
              if (data.data.result.msg_status == 2) {
                closeNotification(data.data.result.id)
              }
              // 修改后的代码
              const atUser = data.data.result.at_user;
              data.data.result.at_user = (Array.isArray(atUser) && atUser.length > 0)
                ? atUser.map((item: any) => parseInt(item))
                : [];
              if (data.data.result && data.data.result.h5_local_id == 0) {
                data.data.result.h5_local_id = `local_${generateUUID()}`;
              }
              // await saveDataToIndexedDB(data.data.result);
              messageDb.enqueue(data.data.result);
              messagesList.value = await getAllMessages();

              if (data.data.result.chat_info?.organize) {
                const chat = user.getChatInfo.find((i: any) => i.chat_id == data.data.result.chat_id)
                if (chat) {
                  console.log(chat)
                  // const stored = localStorage.getItem('chat_info')
                  // const chat_info = stored ? JSON.parse(stored) : []
                  // 修改后的代码
                  const index = user.getChatInfo.findIndex((existingItem: any) => existingItem.chat_id == data.data.result.chat_id)
                  if (index > -1) {
                    user.getChatInfo[index].grouping = data.data.result.chat_info.organize.organize_id
                  }
                  // localStorage.setItem('chat_info', JSON.stringify(chat_info))
                  user.getChatInfo = user.getChatInfo
                }
              }
              if (open_message_push_success.value) {
                // 如果消息全部推送完了 就保存当前的时间戳
                localStorage.setItem('currentTime', data.data.result.timestamp);
                // localStorage.setItem('currentTime', Math.floor(Date.now() / 1000).toString());
              }

              if (data.data.result.user.id !== user.userInfo.id && data.data.result.msg_status != 2 && data.data.result.synchronous_push != 1) {

                if (document.hidden) {
                  sendNotificationForm(data.data.result.id, {
                    icon: data.data.result.chat_info.portrait,
                    title: data.data.result.chat_info.title,
                    body: resolveMsgReplyText(data.data.result) as any,
                    largeBody: `消息通知`,
                    number: 1,
                  });
                  startTitleBlink('🔔 你有新消息啦~');
                }
              }

            } catch (e) {
              if (data.data.result && data.data.result.h5_local_id == 0) {
                data.data.result.h5_local_id = `local_${generateUUID()}`;
              }
              // await saveDataToIndexedDB(data.data.result);
              messageDb.enqueue(data.data.result);
              messagesList.value = await getAllMessages();
              getLogErrorApi({
                content: JSON.stringify(e),
                message: JSON.stringify(data.data.result),
              },
                user.getToken);
            }
            return;
          } else if (data.data.type == 'read') {
            await updateDataInIndexedDB(data.data.result.h5_local_id, data.data.result.read_users_info)
            console.log('触发已读了notification', data.data.result);
            messagesList.value = await getAllMessages();
            return
          }
          else if (data.data.type == 'oa_workbench_statistics') {
            if (data.data.result.type == 'oa_todo_dispose') {
              user.getUnprocessedTodo = data.data.result.dispose_count
            }
            else if (data.data.result.type == 'oa_leave_dispose') {
              user.getUnprocessedLeave = data.data.result.dispose_count
            }
            else if (data.data.result.type == 'oa_reimbursement_dispose') {
              user.getUnprocessedReimb = data.data.result.dispose_count
            }
            else if (data.data.result.type == 'oa_overtime_dispose') {
              user.getUnprocessedOvertime = data.data.result.dispose_count
            }
            return
          }
          console.log('触发了消息1', data);
          if (data.data.result && data.data.result.h5_local_id == 0) {
            data.data.result.h5_local_id = `local_${generateUUID()}`;
          }
          console.log('触发了消息2');
          // await saveDataToIndexedDB(data.data.result);
          messageDb.enqueue(data.data.result);
          messagesList.value = await getAllMessages();
          // 置顶消息
          if (data.data.type === 'message' && data.data.result.msg_status === 3) {
            updateIndexedDBField(data.data.result.h5_local_id, 'msg_status', 3)
            messagesList.value = await getAllMessages();
            return
          } else if (data.data.type === 'message' && data.data.result.msg_status === -3) {
            updateIndexedDBField(data.data.result.h5_local_id, 'msg_status', 0)
            messagesList.value = await getAllMessages();
            return
          }
          if (data.data.result.user.id !== user.userInfo.id && data.data.result.msg_status != 2 && data.data.result.synchronous_push != 1) {
            const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;
            if (isTauri) {
              // tauri 环境
              shouldSendNotification().then((shouldNotify) => {
                if (shouldNotify) {
                  sendNotification({
                    icon: data.data.result.chat_info.portrait,
                    title: data.data.result.chat_info.title,
                    body: resolveMsgReplyText(data.data.result) as any,
                    largeBody: `消息通知`,
                    number: 1,
                  });
                }
              });
            } else {
              console.log(document.hidden, 'document.hidden');

              if (document.hidden) {
                sendNotificationForm(data.data.result.id, {
                  icon: data.data.result.chat_info.portrait,
                  title: data.data.result.chat_info.title,
                  body: resolveMsgReplyText(data.data.result) as any,
                  largeBody: `消息通知`,
                  number: 1,
                });
                startTitleBlink('🔔 你有新消息啦~');
              }
            }
          }
          // checkResponse(data); // 处理错误
          // if (data) {
          //   // processWsMessage(data);
          //   getChatInfo(data.data)
          // }
        }
        catch (err) {
          console.error('catch', err);

          return null;
        }
        // };
      }
      else {
        // Tauri WebSocket实现
        (webSocketHandler.value as BackWebSocket).addListener((msg: BackMessage) => {
          // 处理WebSocket错误
          if (handleTauriWsError(msg))
            return;

          // 处理关闭事件
          if (msg.type === "Close") {
            status.value = WsStatusEnum.SAFE_CLOSE;
            webSocketHandler.value = null;
            return;
          }

          // 处理文本消息
          if (msg.type === "Text" && msg.data) {
            try {
              const data = JSON.parse(String(msg.data)) as Result<WsMsgBodyVO>;
              if (data) {
                processWsMessage(data);
              }
            }
            catch (err) {
              return null;
            }
          }
          // 忽略其他类型的消息
          else if (!["Binary", "Ping", "Pong"].includes(msg.type)) {
            status.value = WsStatusEnum.SAFE_CLOSE;
            webSocketHandler.value = null;
          }
        });
      }
    }

    /**
     * 关闭WebSocket连接
     */
    async function close(isConfirm = true) {
      if (!isConfirm) {
        try {
          await closeConnection();
        }
        finally {
          // 记录断开时刻
          lastDisconnectTime.value = Date.now();
          webSocketHandler.value = null;
          status.value = WsStatusEnum.SAFE_CLOSE;
        }
        return;
      }

      // 需要确认的关闭
      ElMessageBox.confirm("是否断开会话？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        confirmButtonClass: "el-button--danger shadow border-default ",
        lockScroll: false,
        center: true,
        callback: async (res: string) => {
          if (res === "confirm") {
            if (!webSocketHandler.value)
              return;

            try {
              await closeConnection();
            }
            catch (err) {
              // 忽略错误
            }

            // 记录断开时刻
            lastDisconnectTime.value = Date.now();
            status.value = WsStatusEnum.SAFE_CLOSE;
            ElNotification.success("断开成功！");
          }
        },
      });
    }

    /**
     * 重置Store
     */
    function resetStore() {
      try {
        close(false);
        removeEventListeners();
        closeConnection();
      }
      catch (err) {
        // 忽略错误
      }
      finally {
        resetMsgList();
        status.value = WsStatusEnum.SAFE_CLOSE;
        isWindBlur.value = false;
        webSocketHandler.value = null;
        // 记录断开时刻
        lastDisconnectTime.value = Date.now();
        connectTime.value = 0;
      }
    }

    return {
      // state
      isNewMsg,
      webSocketHandler,
      status,
      isWindBlur,
      wsMsgList,
      messagesList,
      // 方法
      resetStore,
      reload,
      initDefault,
      send,
      close,
      sendHeart,
      handleMessage,
      onMessage,
      getAllMessagesContent,
      clearUnreadMsgById,
      getChatInfo,
      removeChatById,
      saveDataToIndexedDB,
      deleteMessageById,
      getLatestMessage,
      searchInIndexedDB,
      closeNotification,
      updateIndexedDBField,
      getDataById,
      synchronousType,
      open_message_push_success
    };
  },
  {
    persist: false,
  },
);

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useWsStore, import.meta.hot));

