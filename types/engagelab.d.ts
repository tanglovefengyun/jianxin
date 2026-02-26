// types/engagelab.d.ts

export {};

declare global {
  interface Window {
    MTpushInterfaceReady?: () => void;
    MTpushInterface?: {
      mtPush: {
        onDisconnect: (callback: () => void) => void;
      };
      onMsgReceive: (callback: (msgData: any) => void) => void;
      init: (config: {
        appkey: string;
        user_str: string;
        fail: (err: any) => void;
        success: (data: any) => void;
        webPushcallback?: (code: number, tip: string) => void;
        swUrl?: string;
        canGetInfo?: (data: any) => void;
        custom?: (fuc: () => void) => void;
      }) => void;
      getRegistrationID: () => string;
    };
  }

  // 允许直接使用 MTpushInterface (不加 window.)
  var MTpushInterface: Window["MTpushInterface"];
}
