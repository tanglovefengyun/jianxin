import type { Result } from "@/types/result";

/**
 * 账号密码登录
 * @param username 用户名/手机号/邮箱
 * @param password 密码
 * @returns promise
 */
export function toLoginByPwd(username: string, password: string) {
  // 管理员
  // if (isAdmin) {
  //   return useHttp.post<Result<string>>("/admin/login/pwd", {
  //     username,
  //     password,
  //   });
  // }
  // 用户
  return useHttp.post<Result<string>>("/user/login/pwd/all", { username, password });
}
/**
 * 邮箱登录
 * @param email 邮箱
 * @param code
 */
export function toLoginByEmail(email: string, code: string) {
  return useHttp.post<Result<string>>("/user/login/email", { email, code });
}

/**
 * 手机号登录
 * @param phone 邮箱
 * @param code
 * @returns promise
 */
export function toLoginByPhone(phone: string, password: string, registration_id: string): Promise<Result<string>> {
  return useHttp.post<Result<string>>("/api/user/login", { phone, password, registration_id, terminal: 'h5' });
}

// export function toLoginByPhone(phone: string, password: string): Promise<Result<string>> {
//   const isPWA =
//     window.matchMedia?.('(display-mode: standalone)').matches ||
//     (window.navigator as any).standalone === true; // 兼容 iOS PWA

//   const userAgent = isPWA ? 'pwa' : '';

//   return useHttp.post<Result<string>>("/api/user/login", isPWA ? {
//     phone,
//     password,
//     terminal: 'h5',
//     'user-agent': userAgent,
//   } : {
//     phone,
//     password,
//     terminal: 'h5',
//   });
// }

/**
 * 重置密码
 */
export function getUserChangePassword(old_password: string, new_password: string, token: string): Promise<Result<string>> {
  return useHttp.post<Result<string>>("/api/user/changePassword", { old_password, new_password },{ headers: { Authorization: token } },);
}


/**
 * 设置消息推送id
 */
export function setRegistrationId(registration_id: string, token: string): Promise<Result<string>> {
  return useHttp.post<Result<string>>("/api/user/setRegistrationId", { registration_id },{ headers: { Authorization: token } },);
}


/**
 * 登录-获取验证码
 * @param key 邮箱/手机号
 * @returns data
 */
export function getLoginCodeByType(key: string, type: DeviceType): Promise<Result<string>> {
  return useHttp.get<Result<string>>(`/user/login/code/${key}`, { type });
}
export enum DeviceType {
  PHONE = 0,
  EMAIL = 1,
}
/**
 * 注册-获取验证码
 * @param key 邮箱/手机号
 * @returns data
 */
export function getRegisterCode(key: string, type: DeviceType): Promise<Result<string>> {
  return useHttp.get<Result<string>>(`/user/register/code/${key}`, { type });
}


/**
 * 注册
 * @param dto
 */
export function toRegister(dto: RegisterUser): Promise<Result<string>> {
  return useHttp.post<Result<string>>("/user/register", dto);
}


/**
 * 注册（免密码）
 * @param dto
 */
export function toRegisterV2(dto: RegisterUser): Promise<Result<string>> {
  return useHttp.post<Result<string>>("/user/register/v2", dto);
}
export interface RegisterUser {
  username: string
  type: number | DeviceType
  password?: string
  secondPassword?: string
  code?: string
  phone?: string
  email?: string
}

/**
 * 退出当前设备登录
 * @param token 用户token
 * @returns Resutl
 */
export function toLogout(token: string): Promise<Result<string>> {
  return useHttp.post("/api/user/logout", {}, {
    headers: {
      Authorization: token,
    },
  });
}


/**
 * 退出登录（全部设备）
 * @param token 用户token
 * @returns Resutl
 */
export function toLogoutAll(token: string): Promise<Result<string>> {
  return useHttp.deleted("/user/exit/all", {}, {
    headers: {
      Authorization: token,
    },
  });
}


