/**
 * 获取好友列表（游标）
 * @param pageSize 大小
 * @param cursor 游标
 * @param token token
 * @returns 分页
 */
export function getChatFriendPage(pageSize = 10, cursor: string | number | null, token: string) {
  return useHttp.get<Result<CursorPage<ChatUserFriendVO>>>(
    "/chat/user/friend/page",
    {
      pageSize,
      cursor,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}

/**
 * 获取好友列表（分页）
 *
 * @param page 页码
 * @param size 个数
 * @param dto 参数
 * @param token token
 * @returns 分页
 */
export function getChatFriendPageV2(page = 1, size = 10, dto: ChatUserFriendPageDTO, token: string) {
  return useHttp.post<Result<IPage<ChatUserFriendVO>>>(
    `/chat/user/friend/page/${page}/${size}`,
    dto,
    { headers: { Authorization: token } },
  );
}
// 获取群聊列表
export function getGroupListApi(name: string, token: string) {
  return useHttp.get<any>(
    `/api/group/list`,
    { name },
    { headers: { Authorization: token } },
  );
}
// 获取部门列表
export function getDepartmentListApi(params: object, token: string) {
  return useHttp.get<any>(
    `/api/department/list`,
    {
      ...params
    },
    { headers: { Authorization: token } },
  );
}
// 获取部门成员列表
export function getDepartmentMembersApi(department_id: number | string, token: string) {
  return useHttp.get<any>(
    `/api/department/user`,
    { department_id },
    { headers: { Authorization: token } },
  );
}
// 修改群名称
export function getGroupUpdateApi(data: object, token: string) {
  return useHttp.post<any>(
    `/api/group/update`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 搜索用户
export function getFriendsUserSearchApi(search: string, token: string) {
  return useHttp.get<any>(
    `/api/friends/userSearch`,
    { search },
    { headers: { Authorization: token } },
  );
}
// 获取会话id
export function getChatSessionApi(type: string, receive_id: number | string, group_id: number | string, token: string) {
  return useHttp.get<any>(
    `/api/chat/session`,
    { type, receive_id: receive_id || '', group_id: group_id || '' },
    { headers: { Authorization: token } },
  );
}
// 获取群详细信息
export function getGroupInfoApi(group_id: number | string, token: string) {
  return useHttp.get<any>(
    `/api/group/info`,
    { group_id },
    { headers: { Authorization: token } },
  );
}
// 创建群聊
export function getGroupCreateApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/group/create`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 邀请新成员
export function getGroupInviteApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/group/invite`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 标准文件上传接口
export function getChatUploadFileApi(data: FormData, token: string) {
  return useHttp.post<any>(
    `/api/chat/uploadFile`,
    data, // 不要用 `{ ...data }`，直接传 FormData
    {
      headers: {
        Authorization: token,
        // 不要设置 Content-Type 为 multipart/form-data，浏览器或库会自动加上正确的 boundary
      },
    }
  );
}
// 修改头像
export function getUserUploadPortraitApi(data: FormData, token: string) {
  return useHttp.post<any>(
    `/api/user/uploadPortrait`,
    data,
    { headers: { Authorization: token } },
  );
}
// 调用文件上传接口
export function getUploadFileApi(data: FormData, token: string) {
  return useHttp.post<any>(
    `/api/uploadFile`,
    data,
    { headers: { Authorization: token } },
  );
}
// 修改群头像
export function getGroupUploadPortraitApi(data: FormData, token: string) {
  return useHttp.post<any>(
    `/api/group/uploadPortrait`,
    data,
    { headers: { Authorization: token } },
  );
}
// 撤回消息
export function getChatMessageRecordRevocationApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/chatMessageRecord/revocation`,
    { ...data },
    { headers: { Authorization: token } },
  );
}
// 置顶消息
export function getChatMessageRecordTopApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/chatMessageRecord/top`,
    { ...data },
    { headers: { Authorization: token } },
  );
}
// 踢出群聊
export function getGroupExpelApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/group/expel`,
    { ...data },
    { headers: { Authorization: token } },
  );
}
// 退出群聊
export function getGroupQuitApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/group/quit`,
    { ...data },
    { headers: { Authorization: token } },
  );
}
// 解散群聊
export function getGroupDismissApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/group/dismiss`,
    { ...data },
    { headers: { Authorization: token } },
  );
}
// 初始化请假
export function getOaLeaveInitApi(token: string) {
  return useHttp.get<any>(
    `/api/oa/leave/init`,
    {},
    { headers: { Authorization: token } },
  );
}
// 初始化加班
export function getOaOvertimeInitApi(token: string) {
  return useHttp.get<any>(
    `/api/oa/overtime/init`,
    {},
    { headers: { Authorization: token } },
  );
}
// 请假详情
export function getOaLeaveDetailApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/leave/detail`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 加班详情
export function getOaOvertimeDetailApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/overtime/detail`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 请假申请
export function getOaLeaveRequestApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/leave/request`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 加班申请
export function getOaOvertimeRequestApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/overtime/request`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 修改加班
export function getOaOvertimeUpdateApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/overtime/update`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 审核人审批
export function getOaLeaveApprovalApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/leave/approval`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 加班审批
export function getOaOvertimeApprovalApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/overtime/approval`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 撤销请假
export function getOaLeaveCancelApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/leave/cancel`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 撤销加班
export function getOaOvertimeCancelApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/overtime/cancel`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 修改请假
export function getOaLeaveUpdateApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/leave/update`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 我的请假申请列表
export function getOaLeaveMyListApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/leave/myList`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 我的加班申请列表
export function getOaOvertimeMyListApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/overtime/myList`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 我的审批列表
export function getOaLeaveApprovalListApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/leave/approvalList`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 我的加班审批列表
export function getOaOvertimeApprovalListApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/overtime/approvalList`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 企业列表
export function getCompanyListApi(token: string) {
  return useHttp.get<any>(
    `/api/company/list`,
    {},
    { headers: { Authorization: token } },
  );
}
// 提交待办
export function getOaTodoSubmitApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/todo/submit`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 待办详情
export function getOaTodoDetailApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/todo/detail`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 完成待办
export function getOaTodoDoneApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/todo/done`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 待办列表
export function getOaTodoListApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/todo/list`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 设置firebase token
export function getSetFirebaseTokenApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/user/setFirebaseToken`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// http发送消息
export function getSendMessageApi(data: FormData, token: string) {
  return useHttp.post<any>(
    `/api/send/message`,
    data,
    { headers: { Authorization: token } },
  );
}
// http发送消息 测试formData
export function getSend1MessageApi(data: FormData, token: string) {
  return useHttp.post<any>(
    `/api/send1/message`,
    data,
    { headers: { Authorization: token } },
  );
}
// 设置群管理员
export function getGroupSetRoleApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/group/setRole`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}

// 分组列表
export function getOrganizeListApi(token: string) {
  return useHttp.get<any>(
    `/api/organize/list`,
    {},
    { headers: { Authorization: token } },
  );
}
// 创建分组
export function getOrganizeCreateApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/organize/create`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 修改分组
export function getOrganizeUpdateApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/organize/update`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 删除分组
export function getOrganizeDeleteApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/organize/delete`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 聊天室加入分组
export function getOrganizeChatMoveApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/organize/chatMove`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 移出分组
export function getOrganizechatRemoveApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/organize/chatRemove`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 获取企业/部门/人员列表
export function getCompanyUserLinkageApi(token: string) {
  return useHttp.get<any>(
    `/api/company/user/linkage`,
    {},
    { headers: { Authorization: token } },
  );
}
// 初始化报销
export function getOaReimbursementInitApi(token: string) {
  return useHttp.get<any>(
    `/api/oa/reimbursement/init`,
    {},
    { headers: { Authorization: token } },
  );
}
// 报销详情
export function getOaReimbursementDetailApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/reimbursement/detail`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 报销申请
export function getOaReimbursementRequestApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/reimbursement/request`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 报销审批
export function getOaReimbursementApprovalApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/reimbursement/approval`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 撤销报销
export function getOaReimbursementCancelApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/oa/reimbursement/cancel`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 报销审核列表
export function getOaReimbursementApprovalListApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/reimbursement/approvalList`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 报销申请列表
export function getOaReimbursementMyListApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/oa/reimbursement/myList`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 置顶消息
export function getChatPinnedApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/chat/pinned`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 修改签名
export function getUserUpdateSignatureApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/user/updateSignature`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// 查询用户信息
export function getFriendsUserInfoApi(data: any, token: string) {
  return useHttp.get<any>(
    `/api/friends/userInfo`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// HTTP批量发送消息
export function getBatchSendMessageApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/batchSend/message`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
// HTTP批量发送消息
export function getLogErrorApi(data: any, token: string) {
  return useHttp.post<any>(
    `/api/log/error`,
    {
      ...data
    },
    { headers: { Authorization: token } },
  );
}
export interface ChatUserFriendPageDTO {
  keyWord?: string;
}
/**
 * 好友VO
 */
export interface ChatUserFriendVO {
  /**
   * 好友uid
   */
  userId: string;
  nickName?: string;
  avatar?: string;

  type: UserType
  /**
   * 在线状态 1在线 0离线
   */
  activeStatus?: ChatOfflineType;
  [property: string]: any;
}


/**
 * 获取好友申请列表（游标）
 * @param page 游标
 * @param size 大小
 * @param token token
 * @returns 分页
 */
export function getChatFriendApplyPage(page = 10, size: string | number | null, token: string) {
  return useHttp.get<Result<ChatApplyPageVO<ChatUserFriendApplyVO>>>(
    "/chat/user/friend/apply/page",
    {
      page,
      size,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}


/**
 * 查询用户列表
 * @param page 页码
 * @param size 个数
 * @param dto 参数
 * @returns 分页数据
 */
export function getUserSeListByPage(page: number, size: number, dto: ChatUserInfoPageDTO, token: string) {
  return useHttp.post<Result<IPage<ChatUserSeInfoVO>>>(`/chat/user/friend/user/${page}/${size}`, { ...dto }, {
    headers: {
      Authorization: token,
    },
  });
}
export interface ChatUserSeInfoVO {
  id: string;
  username: string;
  email?: string;
  nickname: string;
  gender?: Gender;
  avatar?: string;
  createTime: string;
  updateTime: string;
}

/**
 * ChatUserInfoPageDTO
 */
export interface ChatUserInfoPageDTO {
  /**
   * 关键字（用户名、昵称、手机号、邮箱）
   */
  keyWord?: null | string;
  /**
   * 用户id
   */
  userId?: null | string;
}


/**
 * 返回数据
 *
 * PageBaseVO«ChatUserFriendApplyVO»
 */
export interface ChatApplyPageVO<T> {
  /**
   * 当前页数
   */
  current: number | null;
  /**
   * 是否最后一页
   */
  isLast: boolean | null;
  /**
   * 每页查询数量
   */
  pageSize: number | null;
  /**
   * 数据列表
   */
  records: T[];
  /**
   * 总记录数
   */
  total: number | null;
}

/**
 * 好友校验
 *
 * ChatUserFriendApplyVO
 */
export interface ChatUserFriendApplyVO {
  /**
   * 申请id
   */
  applyId: number;
  /**
   * 申请信息
   */
  msg: string;
  /**
   * 申请状态 （0-待审批，1-同意）
   */
  status: ChatApplyStatusType;
  /**
   * 申请类型 1加好友
   */
  type: number;

  createTime: number;
  /**
   * 申请人uid
   */
  userId: string;
  user: {
    id?: string;
    avatar?: string;
    slogen?: string;
    nickName?: string;
    gender?: string;
  };
}

export enum ChatApplyStatusType {
  Load = 0,
  Argee = 1,
  Reject = 2,
}


/**
 * 获取申请未读数
 * @param token token
 * @returns 数据
 */
export function getApplyUnRead(token: string) {
  return useHttp.get<Result<ChatUserFriendUnReadVO>>(
    "/chat/user/friend/apply/unread",
    {
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}

/**
 * 返回数据
 *
 * ChatUserFriendUnReadVO
 */
export interface ChatUserFriendUnReadVO {
  /**
   * 申请列表的未读数
   */
  unReadCount: number;
}

/**
 * 申请好友
 * @param dto 参数
 * @param token token
 * @returns 分页
 */
export function addFriendApply(dto: ChatUserFriendApplyDTO, token: string) {
  return useHttp.post<Result<number>>(
    "/chat/user/friend/apply",
    {
      ...dto,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}


/**
 * ChatUserFriendApplyDTO
 */
export interface ChatUserFriendApplyDTO {
  /**
   * 申请信息
   */
  msg: string;
  /**
   * 好友uid
   */
  targetUid: string;
}

/**
 * 批量判断是否是好友
 * @param dto 好友列表
 * @param token 身份
 * @return 结果
 */
export function isChatFriend(dto: ChatUserFriendCheckDTO, token: string) {
  return useHttp.post<Result<ChatUserFriendCheckVO>>(
    "/chat/user/friend/check",
    {
      ...dto,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}
/**
 * ChatUserFriendCheckDTO
 */
export interface ChatUserFriendCheckDTO {
  /**
   * 校验好友的uid
   */
  uidList: string[];
}

/**
 * 返回数据
 *
 * ChatUserFriendCheckVO
 */
export interface ChatUserFriendCheckVO {
  /**
   * 校验结果
   */
  checkedList: FriendCheck[];
}

/**
 * 是否为好友
 *
 * FriendCheck
 */
export interface FriendCheck {
  isFriend: isTrue;
  uid: string;
}

/**
 * 删除好友
 * @param targetUid 好友id
 * @param token 身份
 * @returns 参数
 */
export function deleteFriendById(targetUid: string, token: string) {
  return useHttp.deleted<Result<number>>(
    `/chat/user/friend/${targetUid}`,
    {
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}
// 好友菜单面板
export interface TheFriendOpt<T = any> {
  type: FriendOptType;
  data: T;
}

export enum FriendOptType {
  Empty = -1, // 空白
  User = 0, // 用户个人页面
  NewFriend = 1, // 添加
  Group = 2, // 群组
  AiRobot = 3, // 添加ai机器人
  GROUP_MEMBER = 4, // 群成员
}


/**
 * 同意好友申请
 * @param dto 参数
 * @param token token
 * @returns 结果
 */
export function argeeFriendApply(dto: ChatUserFriendApproveDTO, token: string) {
  return useHttp.put<Result<number>>(
    "/chat/user/friend/apply",
    {
      ...dto,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}
/**
 * 拒绝好友申请
 * @param dto 参数
 * @param token token
 * @returns 结果
 */
export function rejectFriendApply(dto: ChatUserFriendRejectDTO, token: string) {
  return useHttp.deleted<Result<number>>(
    "/chat/user/friend/apply",
    {
      ...dto,
    },
    {
      headers: {
        Authorization: token,
      },
    },
  );
}
/**
 * ChatUserFriendApproveDTO
 */
export interface ChatUserFriendApproveDTO {
  /**
   * 申请id
   */
  applyId: number;
}
/**
 * ChatUserFriendRejectDTO
 */
export interface ChatUserFriendRejectDTO {
  /**
   * 申请id
   */
  applyId: number;
}
