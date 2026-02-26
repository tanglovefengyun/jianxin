import type { UserInfoVO, UserWallet } from "../api/user/info";
import { acceptHMRUpdate, defineStore } from "pinia";
import { toLogout } from "../api/user";
import { getUserInfo } from "../api/user/info";
import { getUserWallet } from "../api/user/wallet";

// @unocss-include
// https://pinia.web3doc.top/ssr/nuxt.html#%E5%AE%89%E8%A3%85
export const useUserStore = defineStore(
  USER_STORE_KEY,
  () => {
    // token
    const token = ref<string>("");
    const todo = ref('');
    const leave = ref('');
    const reimb = ref('');
    const overtime = ref('');
    const firebaseToken = ref('');
    const regId = ref<string>('');
    // 是否登录
    const isLogin = ref<boolean>(false);
    // 是否打开登录
    const showLoginAndRegister = ref<"login" | "register" | "">("");
    const showUpdatePwd = ref<boolean>(false);
    // 钱包信息
    const userWallet = ref<UserWallet>({
      userId: "",
      balance: 0,
      recharge: 0,
      spend: 0,
      points: 0,
      updateTime: "",
      createTime: "",
    });
    // 用户个人信息
    const userInfo = ref<UserInfoVO>({
      id: "",
      username: "",
      email: "",
      phone: "",
      nickname: "",
      gender: Gender.BOY,
      avatar: "",
      birthday: "",
      createTime: "",
      slogan: "",
      updateTime: "",
      lastLoginTime: "",
      status: UserStatus.FALESE,
      isEmailVerified: 0,
      isPhoneVerified: 0,
      role: 0,
      signature: ""
    });
    const isOnLogining = ref<boolean>(false);
    const userId = computed(() => userInfo.value.id);
    const markPhone = computed(() => userInfo.value?.phone?.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") || "");

    const chatInfo = ref()


    const getToken = computed({
  get() {
    const localToken = token.value || localStorage.getItem('authorization') || "";

    if (!localToken) {
      showLoginAndRegister.value = "login";
    }

    return localToken;
  },
  set(value: string) {
    token.value = value;
    localStorage.setItem("authorization", value); // 可选：同步回 localStorage
  },
});

  const getUnprocessedTodo = computed({
    get() {
      const localTodo = todo.value || localStorage.getItem('oa_todo_dispose') || "";

      return localTodo;
    },
    set(value: string) {
      todo.value = value;
      localStorage.setItem("oa_todo_dispose", value); // 可选：同步回 localStorage
    },
  });

  const getUnprocessedLeave = computed({
    get() {
      const localLeave = leave.value || localStorage.getItem('oa_leave_dispose') || "";

      return localLeave;
    },
    set(value: string) {
      leave.value = value;
      localStorage.setItem("oa_leave_dispose", value); // 可选：同步回 localStorage
    },
  });

  const getUnprocessedReimb = computed({
    get() {
      const localReimb = reimb.value || localStorage.getItem('oa_reimbursement_dispose') || "";

      return localReimb;
    },
    set(value: string) {
      reimb.value = value;
      localStorage.setItem("oa_reimbursement_dispose", value); // 可选：同步回 localStorage
    },
  });

  const getUnprocessedOvertime = computed({
    get() {
      const localOvertime = overtime.value || localStorage.getItem('oa_overtime_dispose') || "";

      return localOvertime;
    },
    set(value: string) {
      overtime.value = value;
      localStorage.setItem("oa_overtime_dispose", value); // 可选：同步回 localStorage
    },
  });

  // const getChatInfo = computed({
  //   get() {
  //     const chatInfoData = chatInfo.value || localStorage.getItem('chat_info') || "";
  //     console.log('chatInfoData', chatInfoData);
      
  //     // if (!chatInfoData) {
  //     //   showLoginAndRegister.value = "login";
  //     // }
  //     if(chatInfoData){
  //       return typeof chatInfoData === 'string' ? JSON.parse(chatInfoData) : chatInfoData;
  //     }else{
  //       return {}
  //     }
      
  //   },
  //   set(value: any) {
  //     chatInfo.value = value;
  //     localStorage.setItem("chat_info", JSON.stringify(value)); // 可选：同步回 localStorage
  //   },
  // });

const getChatInfo = computed({
  get() {
    const userId = userInfo?.value.id;
    if (!userId) return [];

    const key = `chat_info_${userId}`;
    let chatInfoData = chatInfo.value || localStorage.getItem(key) || "";

    if (!chatInfoData) {
      const oldData = localStorage.getItem("chat_info");
      if (oldData) {
        // localStorage.setItem(key, oldData); // 复制旧数据到新key
        // chatInfoData = oldData;
        // 不用旧的数据 直接删除原来的数据重新推送
        localStorage.removeItem('chat_info')
      }
    }

    console.log("chatInfoData", chatInfoData);

    if (chatInfoData) {
      return typeof chatInfoData === "string"
        ? JSON.parse(chatInfoData)
        : chatInfoData;
    } else {
      return [];
    }
  },
  set(value: any) {
    const userId = userInfo?.value.id;
    if (!userId) return;

    const key = `chat_info_${userId}`;
    chatInfo.value = value;
    localStorage.setItem(key, JSON.stringify(value));
  },
});


    function getTokenFn() {
      return token.value?.trim();
    }
    /**
     * 加载用户钱包信息
     * @param token 用户token
     */
    const loadUserWallet = async (token: string): Promise<boolean> => {
      const wallet = await getUserWallet(token);
      if (wallet.code === StatusCode.SUCCESS) {
        userWallet.value = wallet.data as UserWallet;
        return true;
      }
      else {
        return false;
      }
    };

    /**
     * 用户登录
     * @param t t
     */
    const onUserLogin = async (t: any, saveLocal?: boolean, redirectTo?: string, callback?: (data: UserInfoVO) => void) => {
      const res = await getUserInfo(t.authorization);
      if (res.code === StatusCode.SUCCESS1) {
        userInfo.value = res.data as UserInfoVO;
        isLogin.value = true;
        token.value = t.authorization;
        if(t.authorization){
          localStorage.setItem('authorization', t.authorization)
        }
        callback && callback(res.data);
        if (redirectTo)
          await navigateTo(redirectTo);
      }
      else {
        callbackUserExit(t);
      }
    };

    // 退出登录
    function exitLogin() {
      ElMessageBox.confirm("是否确认退出登录？", "退出登录", {
        confirmButtonText: "确认退出",
        confirmButtonClass: "el-button--danger",
        lockScroll: false,
        center: true,
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          callbackUserExit(token.value);
          // if (document)
          //   ElMessage.success("退出成功！");
        })
        .catch(() => { });
    }

    /**
     * 加载用户信息
     * @param token 用户token
     */
    const loadUserInfo = async (token: string): Promise<boolean> => {
      const user = await getUserInfo(token);
      if (user.code === StatusCode.SUCCESS) {
        userInfo.value = user.data;
        return true;
      }
      else {
        return false;
      }
    };

    /**
     * 用户确认状态
     */
    const onCheckLogin = () => {
      if (token.value)
        return onUserLogin(token.value);
      else
        return false;
    };
    /**
     * 退出登录
     * @param t token
     */
    async function callbackUserExit(t?: string) {
      // try {
      //   if (t)
      //     await toLogout(t);
      // }
      // catch (error) {
      //   console.log(error);
      // }
      // finally {
        // 退出登录
        clearUserStore();
        useChatStore().resetStore();
        useWsStore().resetStore();
        const chat = useChatStore();
        chat.msgContact.id = null;
        chat.theRoomId = undefined;
        await nextTick();
        await navigateTo("/login");
      }
    // }
    /**
     * 清空store缓存
     */
    function clearUserStore() {
      token.value = "";
      isOnLogining.value = false;
      isLogin.value = false;
      userWallet.value = {
        userId: "",
        balance: 0,
        recharge: 0,
        spend: 0,
        points: 0,
        updateTime: "",
        createTime: "",
      };
      userInfo.value = {
        id: "",
        username: "",
        email: "",
        phone: "",
        nickname: "",
        gender: Gender.BOY,
        avatar: "",
        birthday: "",
        createTime: "",
        updateTime: "",
        slogan: "",
        lastLoginTime: "",
        status: UserStatus.FALESE,
        isEmailVerified: 0,
        isPhoneVerified: 0,
        role: 0,
        signature: ""
      };
    }
    return {
      // state
      token,
      isLogin,
      showUpdatePwd,
      showLoginAndRegister,
      userInfo,
      userId,
      markPhone,
      userWallet,
      firebaseToken,
      regId,
      isOnLogining,
      // actions
      onUserLogin,
      onCheckLogin,
      callbackUserExit,
      exitLogin,
      clearUserStore,
      loadUserWallet,
      loadUserInfo,
      // getter
      getToken,
      getTokenFn,
      getChatInfo,
      getUnprocessedTodo,
      getUnprocessedLeave,
      getUnprocessedReimb,
      getUnprocessedOvertime
    };
  },
  {
    // https://prazdevs.github.io/pinia-plugin-persistedstate/frameworks/nuxt-3.html
    persist: {
      storage: piniaPluginPersistedstate.localStorage(),
    },
  },
);
if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot));
