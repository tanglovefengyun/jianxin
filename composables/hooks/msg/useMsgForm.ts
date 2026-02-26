import type { UnlistenFn } from "@tauri-apps/api/event";
import type { ShallowRef } from "vue";
import type { OssConstantItemType } from "~/init/system";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readFile, stat } from "@tauri-apps/plugin-fs";

const MAX_CHAT_SECONDS = 120;
const MimeType = "audio/mp3";
/**
 * mp3音频录制Hook
 */
export function useRecording(options: { timeslice?: number, pressHandleRefName?: string } = { timeslice: 1000, pressHandleRefName: "pressHandleRef" }) {
  const { timeslice = 1000, pressHandleRefName = "pressHandleRef" } = options;
  // 变量
  const setting = useSettingStore();
  const pressHandleRef = useTemplateRef<HTMLElement>(pressHandleRefName);
  const onEndChat = createEventHook<File>();
  const mediaRecorderContext = shallowRef<MediaRecorder>(); // 录音对象
  const isChating = ref(); // 是否正在聊天
  let audioChunks: Blob[] = [];
  const theAudioFile = shallowRef<Partial<OssFile>>(); // 录音文件
  const isPalyAudio = ref(false); // 是否正在播放音频
  const palyAudioContext = ref<HTMLAudioElement>();
  const startEndTime = reactive({ // 录音时间
    startTime: 0,
    endTime: 0,
  });
  const audioTransfromTextList = ref<string[]>([]);
  const audioTransfromText = computed(() => audioTransfromTextList.value.join(""));
  const second = computed(() => {
    if (startEndTime.startTime > 0 && startEndTime.endTime > 0)
      return +((startEndTime.endTime - startEndTime.startTime) / 1000 || 0).toFixed(0);
    else
      return 0;
  });

  // 获取文件大小限制
  const fileSizeLimit = computed(() => setting.systemConstant.ossInfo?.audio?.fileSize || 20 * 1024 * 1024); // 默认限制为20MB
  // 语音转译文字物料
  const speechRecognition = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: "zh-CN",
  });

  /**
   * 转文字
   * @returns void
   */
  async function useAudioTransfromText() {
    if (!speechRecognition.isSupported)
      return ElMessage.error("当前不支持语音转文字！");
    speechRecognition.start();
    speechRecognition.recognition?.addEventListener("result", (e) => {
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results?.[i];
        if (result && result?.[0])
          audioTransfromTextList.value[i] = result?.[0].transcript;
      }
    });
  }

  /**
   * 录音长按
   */
  onLongPress(
    pressHandleRef,
    toggle,
    {
      delay: 300,
      onMouseUp: toggle,
      distanceThreshold: 20,
      modifiers: {
        stop: true,
      },
    },
  );

  /**
   * 重置
   */
  const reset = () => {
    isPalyAudio.value = false;
    palyAudioContext.value?.pause();
    audioChunks = [];
    if (theAudioFile.value) {
      theAudioFile.value.id = "";
    }
    theAudioFile.value = undefined;
    startEndTime.startTime = 0;
    startEndTime.endTime = 0;
    isChating.value = false;
    palyAudioContext.value = undefined;
    audioTransfromTextList.value = [];
  };

  // 开始录音
  function toggle() {
    if (isChating.value) {
      if (second.value < 1) {
        ElMessage.warning("录音时间过短！");
        reset();
        return;
      }
      speechRecognition.stop();
    }
    else {
      useAudioTransfromText();
    }
    isChating.value = !isChating.value;
  }

  // 播放录音
  function handlePlayAudio(type: "play" | "del" | "stop", url?: string) {
    console.log(type);

    if (!type)
      return;
    const _url = url || theAudioFile.value?.id;
    if (_url && !isPalyAudio.value && type === "play") {
      const audio = new Audio(_url);
      palyAudioContext.value = audio;
      audio.play();
      isPalyAudio.value = true;
      audio.addEventListener("ended", () => {
        isPalyAudio.value = false;
      });
    }
    else if (isPalyAudio.value && type === "stop") {
      isPalyAudio.value = false;
      palyAudioContext.value?.pause();
    }
    else if (type === "del") {
      isPalyAudio.value = false;
      palyAudioContext.value?.pause();
      reset();
    }
  }

  // 开始录音
  async function start(e: KeyboardEvent) {
    const chat = useChatStore();
    if (e.key === "t" && e.ctrlKey && !isChating.value) {
      e.preventDefault();
      isChating.value = true;
      chat.msgForm.msgType = MessageType.SOUND; // 语音
    }
    else if (e.key === "c" && e.ctrlKey && isChating.value) {
      e.preventDefault();
      isChating.value = false;
      chat.msgForm.msgType = MessageType.SOUND; // 语音
    }
  }


  // 监听是否录音
  watch(isChating, (val) => {
    if (val) {
      if (!navigator?.mediaDevices?.getUserMedia) {
        isChating.value = false;
        return ElMessage.error("设备不支持录音！");
      }
      // 重新授权
      navigator?.mediaDevices?.getUserMedia({ audio: true, video: false }).then(
        stream => resolveAudioInput(stream),
        (reason) => {
          isChating.value = false;
          if (reason.code === 0) {
            ElMessage.warning("暂无麦克风权限！");
            return;
          }
          ElMessage.warning("拒绝授权麦克风，录音功能无法使用！");
        },
      );
    }
    else {
      mediaRecorderContext.value?.stop?.();
    }
  }, {
    immediate: false,
  });

  // 解析音频输入
  function resolveAudioInput(stream: MediaStream) {
    if (mediaRecorderContext.value) { // 防止重复创建
      mediaRecorderContext.value?.stop?.();
      mediaRecorderContext.value = undefined;
    }
    const recorder = new MediaRecorder(stream, {
      audioBitsPerSecond: 128000,
      mimeType: "audio/webm",
    });
    if (!recorder) {
      ElMessage.error("设备不支持录音！");
      return;
    }
    mediaRecorderContext.value = recorder;
    // 监听录音数据
    mediaRecorderContext.value.start(timeslice);// 1秒采样率
    startEndTime.startTime = Date.now();

    mediaRecorderContext.value.addEventListener("dataavailable", (e) => {
      const blob = new Blob([e.data], { type: MimeType });
      startEndTime.endTime = Date.now();
      audioChunks.push(blob);
      if (second.value >= MAX_CHAT_SECONDS) {
        ElMessage.warning("录音时间过长！");
        mediaRecorderContext.value?.stop?.();
        speechRecognition.stop();
        return;
      }
      if (speechRecognition) {
        try {
          speechRecognition?.start(); // 开始语音转文字
        }
        catch (error) {
          console.warn(error);
        }
      }
    });

    mediaRecorderContext.value.addEventListener("stop", async (e) => {
      isChating.value = false;
      if (!audioChunks.length && second.value <= 2) {
        ElMessage.warning("录音时间过短！");
        return;
      }
      // 转化为文件上传
      const file = new File(audioChunks, `${Date.now()}.mp3`, { type: MimeType });
      console.log(`结束录音,时长：${second.value}s 文件大小：${formatFileSize(file.size)}`);
      stream.getTracks().forEach(track => track.stop());
      if (file.size > fileSizeLimit.value) {
        ElMessage.error(`文件大小超过限制，最大支持 ${formatFileSize(fileSizeLimit.value)}`);
        reset();
        return;
      }
      theAudioFile.value = {
        id: URL.createObjectURL(file),
        key: undefined,
        status: "",
        percent: 0,
        file, // 文件对象
      };
      if (!theAudioFile.value)
        return;
      const url = window.URL.createObjectURL(file);
      theAudioFile.value.id = url;
      // onEndChat.trigger(file);

      // 调用文件上传接口
      const formData = new FormData();
      const user = useUserStore();
      formData.append('file', file);
      const res = await getChatUploadFileApi(formData, user.getToken)
      const chat = useChatStore();
      chat.msgForm.content = res.data.file_url;
      chat.msgForm.voice_duration = second.value;
    });
  }

  const handleImageUpload = async (file: File, type: string) => {
    // const fileSizeLimit = 5 * 1024 * 1024; // 5MB 限制，可根据实际调整
    // const MimeTypeList = ['image/jpeg', 'image/png', 'image/webp'];

    // if (!MimeTypeList.includes(file.type)) {
    //   ElMessage.error("不支持的图片格式，请上传 JPG / PNG / WEBP 格式的图片！");
    //   return;
    // }

    // if (file.size > fileSizeLimit) {
    //   ElMessage.error(`图片大小超过限制，最大支持 ${formatFileSize(fileSizeLimit)}`);
    //   return;
    // }

    // 生成本地预览 URL
    const url = URL.createObjectURL(file);
    // theImageFile.value = {
    //   id: url,
    //   key: undefined,
    //   status: '',
    //   percent: 0,
    //   file,
    // };

    // 准备上传
    const formData = new FormData();
    const user = useUserStore();
    const ws = useWsStore();
    const chat = useChatStore();
    const localId = `local_${generateUUID()}`;
    ws.send({
      websocket_type: "message",
      data: {
        h5_local_id: localId, //本地记录id
        chat_id: chat.msgContact.chat_id, //会话id
        type, //消息类型  text:文本 image:图片 voice:语音 video:视频 file:文件
        quote_id: null, //引用消息id ，没有不传或传null
        at_user: [], //群聊是否有at用户  ,如果是at所有人，就把群聊所有人的id存入进去
        content: url,  //消息内容
        status: MessageSendStatus.SENDING,
        // voice_duration: 0,//语音时长 秒单位
        // video_duration:100,//视频时长 秒单位
        // file_size:100,//文件大小  k 单位
      },
    })
    formData.append('file', file);

    try {
      const res = await getChatUploadFileApi(formData, user.getToken);
      const chat = useChatStore();
      chat.msgForm.content = res.data.file_url; // 图片地址填入聊天内容
      // chat.msgForm.type = 'image'; // 你可以额外加上类型字段
      ElMessage.success("图片上传成功！");
    } catch (error) {
      ElMessage.error("图片上传失败！");
      console.error(error);
    }
  };


  return {
    fileSizeLimit, // 文件大小限制
    pressHandleRef, // 长按录音按钮 Ref
    isChating, // 是否正在聊天
    second, // 录音时长
    theAudioFile, // 录音文件
    audioTransfromText, // 语音转文字
    speechRecognition, // 语音转文字
    isPalyAudio, // 是否正在播放音频
    toggle, // 开始/停止录音
    start, // 开始/停止录音
    stop, // 停止录音
    reset, // 重置录音
    onEndChat: onEndChat.on,
    handlePlayAudio,
  };
}


/**
 * 文件上传（图片、视频、图片）等
 * @param refsDom 上传组件的ref对象
 * @returns
 *  imgList: 图片列表
 *  fileList: 文件列表
 *  videoList: 视频列表
 *  onSubmitImg: 图片上传回调
 *  onSubmitFile: 文件上传回调
 *  onSubmitVideo: 视频上传回调
 */
export function useFileUpload(refsDom: RefDoms = { img: "inputOssImgUploadRef", file: "inputOssFileUploadRef", video: "inputOssVideoUploadRef" }, disabled?: ShallowRef<boolean>) {
  const {
    img: imgRefName = "inputOssImgUploadRef",
    file: fileRefName = "inputOssFileUploadRef",
    video: videoRefName = "inputOssVideoUploadRef",
  } = refsDom;

  const chat = useChatStore();
  const imgList = ref<OssFile[]>([]); // 图片列表
  const fileList = ref<OssFile[]>([]); // 文件列表
  const videoList = ref<OssFile[]>([]); // 视频列表

  // 计算 computed
  const isUploadImg = computed(() => chat.msgForm.msgType === MessageType.IMG && !!imgList?.value?.filter(f => f.status === "")?.length);
  const isUploadFile = computed(() => chat.msgForm.msgType === MessageType.FILE && !!fileList?.value?.filter(f => f.status === "")?.length);
  const isUploadVideo = computed(() => chat.msgForm.msgType === MessageType.VIDEO && !!videoList?.value?.filter(f => f.status === "")?.length);

  const inputOssImgUploadRef = useTemplateRef<any>(imgRefName);
  const inputOssVideoUploadRef = useTemplateRef<any>(videoRefName);
  const inputOssFileUploadRef = useTemplateRef<any>(fileRefName); // 文件上传

  // 图片上传回调
  function onSubmitImg(key: string, pathList: string[]) {
    console.log(disabled?.value);

    if (disabled?.value === true)
      return;
    fileList.value = [];
    videoList.value = [];
    const file = imgList.value.find(f => f.key === key);
    console.log(file);

    if (!key || !file?.file) {
      return;
    }
    // const url = window.URL || window.webkitURL;
    // let width = 0;
    // let height = 0;
    // const img = new Image();
    // img.src = url.createObjectURL(file?.file);
    // img.onload = () => {
    //   width = img.width || 0;
    //   height = img.height || 0;
    // };
    chat.msgForm = {
      roomId: chat.theRoomId!,
      msgType: MessageType.IMG,
      content: chat.msgForm.content,
      body: {
        url: key,
        width: file?.width || 0,
        height: file?.height || 0,
        size: file?.file?.size,
      },
    };
    console.log(chat.msgForm, '图片上传触发');

  }

  // 文件上传回调
  function onSubmitFile(key: string, pathList: string[]) {
    if (disabled?.value === true)
      return;
    imgList.value = [];
    videoList.value = [];
    const file = fileList.value.find(f => f.key === key);
    if (key && file?.file) {
      chat.msgForm = {
        roomId: chat.theRoomId!,
        msgType: MessageType.FILE,
        content: chat.msgForm.content,
        body: {
          atUidList: chat.msgForm?.body?.atUidList,
          url: key,
          fileName: file?.file?.name,
          size: file?.file?.size,
        },
      };
    }
  }

  // 视频上传回调
  function onSubmitVideo(key: string, pathList: string[]) {
    if (disabled?.value === true)
      return;
    imgList.value = [];
    fileList.value = [];
    const file = videoList.value.find(f => f.key === key);
    if (key && file?.file) {
      chat.msgForm = {
        roomId: chat.theRoomId!,
        msgType: MessageType.VIDEO,
        content: chat.msgForm.content,
        body: {
          url: key,
          fileName: file?.file?.name,
          size: file?.file?.size,
          duration: file?.children?.[0]?.duration || 0,
          thumbUrl: file?.children?.[0]?.key || undefined,
          thumbSize: file?.children?.[0]?.thumbSize || 0,
          thumbWidth: file?.children?.[0]?.thumbWidth || 0,
          thumbHeight: file?.children?.[0]?.thumbHeight || 0,
        },
      };
    }
  }

  /**
   * 显示视频详情
   * @param e 事件对象
   * @param video 视频对象
   */
  function showVideoDialog(e: MouseEvent, video: OssFile) {
    if (disabled?.value === true)
      return;
    const thumb = video.children?.[0];
    if (!video?.key) {
      return;
    }
    mitter.emit(MittEventType.VIDEO_READY, {
      type: "play",
      payload: {
        mouseX: e.clientX,
        mouseY: e.clientY,
        url: BaseUrlVideo + video.key,
        duration: video?.duration || 0,
        thumbUrl: BaseUrlImg + thumb?.key,
        size: video.file?.size || 0,
        thumbSize: thumb?.thumbSize || 0,
        thumbWidth: thumb?.thumbWidth || 0,
        thumbHeight: thumb?.thumbHeight || 0,
      },
    });
  }

  /**
   * 粘贴上传
   * @param e 粘贴事件对象
   * @returns void
   */
  async function onPaste(e: ClipboardEvent) {
    if (disabled?.value === true)
      return;
    // 判断粘贴上传
    if (!e.clipboardData?.items?.length) {
      return;
    }
    // 拿到粘贴板上的 image file 对象
    const fileArr = Array.from(e.clipboardData.items).filter(v => v.kind === "file");
    if (!fileArr.length)
      return;

    // if (fileArr.length > 1 || fileArr.length < 0) {
    //   fileArr.length > 1 && ElMessage.warning("不支持批量上传！");
    //   return;
    // }
    for (let i = 0; i < fileArr.length; i++) {
      const item = fileArr[i];
      if (!item || item.kind !== "file") {
        continue;
      }
      const file = item.getAsFile() as any;
      const url = URL.createObjectURL(file);
      uploadFileData(file, url)

      // if (item.type.includes("image")) {
      //   const file = item.getAsFile() as any;
      //   const url = URL.createObjectURL(file);
      //   // 构建弹窗内容 HTML
      //   const content = `
      //     <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px;">
      //       ${`<img src="${url}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;" draggable="false" />`}
      //       <div style="display: flex; flex-direction: column; font-size: 14px;">
      //         <div class="mb-2"><strong></strong>${file.name}</div>
      //         <div><strong></strong>${formatFileSize(file.size)}</div>
      //       </div>
      //     </div>
      //   `

      //   try {
      //     console.log('发送图片');

      //     await ElMessageBox({
      //       title: '确认发送文件？',
      //       message: h('div', { innerHTML: content }),
      //       dangerouslyUseHTMLString: true,
      //       showCancelButton: true,
      //       confirmButtonText: '发送',
      //       cancelButtonText: '取消',
      //     })
      //     console.log(file, '粘贴文件内容');
      //     file && uploadFile("image", file);
      //   } catch {
      //     console.log('用户取消上传')
      //   }
      // }
      // else if (item.type.includes("video")) {
      //   const file = item.getAsFile() as any;
      //   // 构建弹窗内容 HTML
      //   const content = `
      //     <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px;">
      //       ${`<img src="/images/icon/DEFAULT.png" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;" draggable="false" />`}
      //       <div style="display: flex; flex-direction: column; font-size: 14px;">
      //         <div class="mb-2"><strong></strong>${file.name}</div>
      //         <div><strong></strong>${formatFileSize(file.size)}</div>
      //       </div>
      //     </div>
      //   `

      //   try {
      //     await ElMessageBox({
      //       title: '确认发送文件？',
      //       message: h('div', { innerHTML: content }),
      //       dangerouslyUseHTMLString: true,
      //       showCancelButton: true,
      //       confirmButtonText: '发送',
      //       cancelButtonText: '取消',
      //     })
      //     file && uploadFile("video", file);
      //     // 单文件
      //   } catch {
      //     console.log('用户取消上传')
      //   }
      //   // 单文件
      //   return;
      // }
      // else if (FILE_TYPE_ICON_MAP[item.type]) {
      //   const file = item.getAsFile() as any;
      //   // 构建弹窗内容 HTML
      //   const content = `
      //     <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px;">
      //       ${`<img src="/images/icon/DEFAULT.png" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;" draggable="false" />`}
      //       <div style="display: flex; flex-direction: column; font-size: 14px;">
      //         <div class="mb-2"><strong></strong>${file.name}</div>
      //         <div><strong></strong>${formatFileSize(file.size)}</div>
      //       </div>
      //     </div>
      //   `

      //   try {
      //     await ElMessageBox({
      //       title: '确认发送文件？',
      //       message: h('div', { innerHTML: content }),
      //       dangerouslyUseHTMLString: true,
      //       showCancelButton: true,
      //       confirmButtonText: '发送',
      //       cancelButtonText: '取消',
      //     })
      //     file && uploadFile("file", file);
      //     // 单文件
      //   } catch {
      //     console.log('用户取消上传')
      //   }

      //   return;
      // }
    }
  }

  /**
   * 上传文件
   *
   * @param type 文件类型
   * @param file 文件对象
   * @returns void
   */
  async function uploadFile(type: OssConstantItemType, file: File, showUrl?: string) {
    if (type === "video") {
      inputOssImgUploadRef.value?.resetInput?.();
      inputOssFileUploadRef.value?.resetInput?.();
      await inputOssVideoUploadRef.value?.onUpload({
        id: showUrl || URL.createObjectURL(file),
        key: undefined,
        status: "",
        percent: 0,
        file,
      });
      chat.msgForm.msgType = MessageType.VIDEO; // 视频
    }
    else if (type === "file") {
      if (isUploadFile.value) {
        ElMessage.warning("文件正在上传中，请稍后再试！");
        return;
      }
      inputOssImgUploadRef.value?.resetInput?.();
      inputOssFileUploadRef.value?.resetInput?.();
      fileList.value = [];
      await inputOssFileUploadRef.value?.onUpload({
        id: showUrl || URL.createObjectURL(file),
        key: undefined,
        status: "",
        percent: 0,
        file,
      });
      chat.msgForm.msgType = MessageType.FILE; // 文件
    }
    else if (type === "image") {
      inputOssImgUploadRef.value?.resetInput?.();
      inputOssFileUploadRef.value?.resetInput?.();
      await inputOssImgUploadRef.value?.onUpload({
        id: showUrl || URL.createObjectURL(file),
        key: undefined,
        status: "",
        percent: 0,
        file,
      });
      chat.msgForm.msgType = MessageType.IMG; // 图片
    }
    // else if (type === "audio") {
    //   inputOssImgUploadRef.value?.resetInput?.();
    //   inputOssFileUploadRef.value?.resetInput?.();
    //   await inputOssImgUploadRef.value?.onUpload({
    //     id: showUrl || URL.createObjectURL(file),
    //     key: undefined,
    //     status: "",
    //     percent: 0,
    //     file,
    //   });
    //   chat.msgForm.msgType = MessageType.SOUND; // 语音
    // }
  }

  // 监听拖拽上传
  const isDragDropOver = ref(false);
  const isDragOver = ref(false);
  const dragDropInfo = ref<{
    type?: "over" | "drop" | "cancel";
    position?: { x: number; y: number };
  }>({
    type: undefined,
    position: undefined,
  });
  let unlisten: UnlistenFn | undefined;
  const isListend = ref(false);
  async function listenDragDrop() {
    const setting = useSettingStore();
    unlisten?.();
    if (!setting.isDesktop || unlisten || isListend.value) {
      return;
    }
    isListend.value = true;

    unlisten = await getCurrentWebview().onDragDropEvent(async (event) => {
      if (event.payload.type === "over") {
        if (!isDragDropOver.value) {
          isDragDropOver.value = !disabled?.value;
          // const { x, y } = event.payload.position;
          // console.log(`User is dragging over ${x}, ${y}`);
        }
      }
      else if (event.payload.type === "drop") {
        if (isDragDropOver.value) {
          isDragDropOver.value = false;
          const { x, y } = event.payload.position;
          console.log(`User dropped ${x}, ${y}, ${event.payload.paths}`);
          // 获取文件
          event.payload.paths.forEach(async (path) => {
            if (await existsFile(path)) {
              if (!path) {
                return;
              }
              // 根据后缀简单判断文件类型
              const ext = path.split(".").pop();
              if (!ext) {
                ElMessage.warning("无法判断该文件类型！");
                return;
              }
              const info = await stat(path);
              if (info.isDirectory) {
                ElMessage.warning("暂不支持文件夹上传！");
                return;
              }
              const setting = useSettingStore();
              // 判断类型
              const typeInfo = getSimpleOssTypeByExtName(ext);
              if (!typeInfo?.type || typeInfo.type === "audio") { // TODO: 暂不支持音频文件直接上传
                ElMessage.warning("暂不支持该文件类型上传！");
                return;
              }
              const ossInfo = setting?.systemConstant?.ossInfo?.[typeInfo.type];
              if (!ossInfo?.fileSize) {
                return;
              }
              if (info.size > ossInfo.fileSize) { // 20MB
                ElMessage.warning(`文件大小超过限制，最大支持${formatFileSize(ossInfo.fileSize)}`);
                return;
              }
              // const url = convertFileSrc(path); // 生成本地url
              readFile(path).then((blod) => {
                const file = new File([blod], path.replaceAll("\\", "/")?.split("/").pop() || `${Date.now()}.${path.split(".").pop()}`, {
                  type: typeInfo.mineType || "application/octet-stream",
                });
                const url = URL.createObjectURL(file);
                uploadFile(typeInfo.type, file, url); // 上传文件
              });
            }
          });
        }
      }
      else {
        console.log("File drop cancelled");
        isDragDropOver.value = false;
      }
    });
  }
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver.value = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragOver.value = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver.value = false;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      // 文件大小限制：10MB
      // if (file.size > 10 * 1024 * 1024) {
      //   ElMessage.warning(`文件 ${file.name} 超过 10MB 限制`);
      //   continue;
      // }

      // 拒绝音频类型
      // if (file.type.startsWith("audio")) {
      //   ElMessage.warning("暂不支持音频上传");
      //   continue;
      // }

      const url = URL.createObjectURL(file);
      uploadFileData(file, url);
    }
  }

  // 文件大小格式化（MB，保留两位）
  function formatFileSize(size: number) {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      // 小于 1MB，显示 KB，保留 2 位小数
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      // 大于等于 1MB，显示 MB，保留 2 位小数
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  }

  async function postmessage(file: File, previewUrl: string, descValue: string) {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/');
    const getTimestamp = () => Math.floor(Date.now() / 1000)
    // theImageFile.value = {
    //   id: url,
    //   key: undefined,
    //   status: '',
    //   percent: 0,
    //   file,
    // };

    // 准备上传
    const formData = new FormData()
    const user = useUserStore()
    const ws = useWsStore()
    const chat = useChatStore()
    const chatInfoData = user.getChatInfo.filter((item: any) => item.chat_id == chat.msgContact.chat_id)[0]
    const localNewsData = {
      result: {
        chat_info: {
          id: chatInfoData.id,
          chat_type: chatInfoData.chat_type,
          disturb: chatInfoData.disturb,
          pinned_chat: chatInfoData.pinned_chat,
          portrait: chatInfoData.portrait,
          title: chatInfoData.title,
          chat_id: chat.msgContact.chat_id
        },
        timestamp: getTimestamp() + 50,
        user: {
          id: user.userInfo.id,
          nickname: user.userInfo.nickname
        },
        type: descValue ? 'text' : isImage ? 'image' : isVideo ? 'video' : 'file',
        content: descValue || (isImage ? '[图片]' : isVideo ? '[视频]' : '[文件]')
      }
    }
    const localId = `local_${generateUUID()}`
    console.log(chatInfoData)

    const localNewsData1 = {
      result: {
        id: localId,
        h5_local_id: localId,
        chat_id: chat.msgContact.chat_id,
        timestamp: getTimestamp() + 50,
        user_id: user.userInfo.id,
        chat_info: {
          id: chatInfoData.id,
          chat_type: chatInfoData.chat_type,
          disturb: chatInfoData.disturb,
          pinned_chat: chatInfoData.pinned_chat,
          portrait: chatInfoData.portrait,
          title: chatInfoData.title,
          department: {
            name: chatInfoData.department && chatInfoData.chat_type !== 'group' ? chatInfoData.department.name : ''
          },
          job: chatInfoData.chat_type !== 'group' ? chatInfoData.job : ''
        },
        user: {
          id: user.userInfo.id,
          nickname: user.userInfo.nickname,
          portrait: user.userInfo.portrait,
          department: {
            name: chatInfoData.department && chatInfoData.chat_type !== 'group' ? chatInfoData.department.name : ''
          },
          job: chatInfoData.chat_type !== 'group' ? chatInfoData.job : ''
        },
        type: descValue ? 'text' : isImage ? 'image' : isVideo ? 'video' : 'file',
        content: descValue || previewUrl,
        msg_status: 1,
        status: MessageSendStatus.SENDING
      }
    }
    ws.getChatInfo(localNewsData)
    ws.saveDataToIndexedDB(localNewsData1.result)
    await ws.getAllMessagesContent()
    chat.scrollBottom(false)
    // ws.send({
    //   websocket_type: "message",
    //   data: {
    //     local_id: null, //本地记录id
    //     chat_id: chat.msgContact.chat_id, //会话id
    //     type: uploadType, //消息类型  text:文本 image:图片 voice:语音 video:视频 file:文件
    //     quote_id: null, //引用消息id ，没有不传或传null
    //     at_user:[], //群聊是否有at用户  ,如果是at所有人，就把群聊所有人的id存入进去
    //     content: url,  //消息内容
    //     status: MessageSendStatus.SENDING,
    //     // voice_duration: 0,//语音时长 秒单位
    //     // video_duration:100,//视频时长 秒单位
    //     // file_size:100,//文件大小  k 单位
    //   },
    // })
    formData.append('file', descValue ? '' : file)
    const chatId = chat.msgContact.chat_id
    const arr = chat.atUserList?.map((item: any) => item.user_id)
    const formDataMsg = new FormData()
    formDataMsg.append('h5_local_id', localId)
    formDataMsg.append('chat_id', chatId)
    formDataMsg.append('type', descValue ? 'text' : isImage ? 'image' : isVideo ? 'video' : 'file')
    formDataMsg.append('quote_id', '0')
    formDataMsg.append(`at_user[]`, '[]')
    formDataMsg.append('content', descValue || '')
    formDataMsg.append('status', MessageSendStatus.SENDING)

    try {
      // if (file.size <= 5000000) {
      //   formDataMsg.append('file', file)
      //   const resData = await getSendMessageApi(formDataMsg, user.getToken)
      //   if (resData.code == 0) {
      //     ws.updateIndexedDBField(localId, 'status', 'success')
      //   } else {
      //     // 上传失败
      //     ws.updateIndexedDBField(localId, 'status', 'error')
      //   }
      // } else {
      //   const res = await getChatUploadFileApi(formData, user.getToken)
      //   if (res.code == 0) {
      //     formDataMsg.append('content', res.data.file_url)
      //     formDataMsg.append('file_type', res.data.file_type)
      //     const resData = await getSendMessageApi(formDataMsg, user.getToken)
      //     if (resData.code == 0) {
      //       ws.updateIndexedDBField(localId, 'status', 'success')
      //     } else {
      //       // 上传失败
      //       ws.updateIndexedDBField(localId, 'status', 'error')
      //     }
      //   }
      // }

      if (descValue) {
        const resData = await getSendMessageApi(formDataMsg, user.getToken)
        if (resData.code == 0) {
          ws.updateIndexedDBField(localId, 'status', 'success')
        } else {
          // 上传失败
          ws.updateIndexedDBField(localId, 'status', 'error')
        }
        return;
      }
      const res = await getChatUploadFileApi(formData, user.getToken)
      if (res.code == 0) {
        formDataMsg.append('content', res.data.file_url)
        formDataMsg.append('file_type', res.data.file_type)
        const resData = await getSendMessageApi(formDataMsg, user.getToken)
        if (resData.code == 0) {
          ws.updateIndexedDBField(localId, 'status', 'success')
        } else {
          // 上传失败
          ws.updateIndexedDBField(localId, 'status', 'error')
        }
      }


      // await fetch('https://syo.167890.xyz:442/msg/upload.php', {
      //   method: 'POST',
      //   body: formData,
      // });

      // const res = await getChatUploadFileApi(formData, user.getToken)
      // console.log(res)
      // // const chat = useChatStore();
      // // chat.msgForm.content = res.data.file_url; // 图片地址填入聊天内容
      // // chat.msgForm.type = 'image'; // 你可以额外加上类型字段

      // ws.send({
      //   websocket_type: 'message',
      //   data: {
      //     h5_local_id: localId, //本地记录id
      //     chat_id: chatId, //会话id
      //     type: isImage ? 'image' : 'file', //消息类型  text:文本 image:图片 voice:语音 video:视频 file:文件
      //     quote_id: null, //引用消息id ，没有不传或传null
      //     at_user: [], //群聊是否有at用户  ,如果是at所有人，就把群聊所有人的id存入进去
      //     content: res.data.file_url, //消息内容
      //     status: MessageSendStatus.SUCCESS
      //     // voice_duration: 0,//语音时长 秒单位
      //     // video_duration:100,//视频时长 秒单位
      //     // file_size:100,//文件大小  k 单位
      //   }
      // })
      // ws.deleteMessageById(localId) // 你需要在 ws 中实现这个方法
    } catch (error) {
      ElMessage.error('发送失败！')
      ws.updateIndexedDBField(localId, 'status', 'error')
      console.error(error)
    }
  }

  async function uploadFileData(file: File, previewUrl: string) {
    // if(!chat.msgContact.id) return
    // 如果是图片类型
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/');

    // 构建弹窗内容 HTML
    const content = `
  <div style="display: flex; align-items: center; gap: 16px; margin-top: 12px;">
    ${isImage ? `<img src="${previewUrl}" crossorigin="anonymous" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;" draggable="false" />` : '<img src="/images/icon/DEFAULT.png" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;" draggable="false" />'}
    <div style="display: flex; flex-direction: column; font-size: 14px;">
      <div class="mb-2"><strong>名称：</strong>${file.name}</div>
      <div><strong>大小：</strong>${formatFileSize(file.size)}</div>
    </div>
  </div>
  
  <div style="margin-top: 16px;">
    <div>
      <textarea id="msg-desc" placeholder="请输入标题/描述" rows="5"
                style="width: 268px; box-sizing: border-box; padding: 8px; border: 1px solid #dcdfe6; border-radius: 4px; outline: none; transition: border-color .2s; font-family: inherit; resize: none;"></textarea>
    </div>
  </div>
`;

    try {

      await ElMessageBox({
        title: '确认发送文件？',
        message: h('div', { innerHTML: content }),
        dangerouslyUseHTMLString: true,
        showCancelButton: true,
        confirmButtonText: '发送',
        cancelButtonText: '取消',
        // 在这里拦截点击“确认”按钮，手动获取输入值
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            const descValue = (document.getElementById('msg-desc') as HTMLTextAreaElement).value;
            if (descValue && descValue.trim().length > 0) {
              postmessage(file, previewUrl, descValue);
            }
          }
          done();
        }
      });

      postmessage(file, previewUrl, '');
    } catch {
      console.log('用户取消上传')
    }
  }

  // 生命周期
  onMounted(() => {
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    listenDragDrop()
  });
  // onActivated(listenDragDrop);
  onBeforeUnmount(() => {
    window.removeEventListener("dragover", handleDragOver);
    window.removeEventListener("dragleave", handleDragLeave);
    window.removeEventListener("drop", handleDrop);
    unlisten?.();
    unlisten = undefined;
    isListend.value = false;
  });

  return {
    imgList,
    fileList,
    videoList,
    isDragDropOver,
    isDragOver,
    uploadFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,

    isUploadImg,
    isUploadFile,
    isUploadVideo,

    inputOssVideoUploadRef,
    inputOssImgUploadRef,
    inputOssFileUploadRef,

    onSubmitImg,
    onSubmitFile,
    onSubmitVideo,
    onPaste,
    showVideoDialog,
  };
}
interface RefDoms {
  img?: string;
  file?: string;
  video?: string;
}

/**
 * 识别@用户
 * @param text 文本内容
 * @param userOptions 所有用户列表
 * @returns
 *  uidList: 识别到的@用户的uid列表
 *  atUidList: 识别到的@用户的{userId, nickName}列表
 */
export function resolveAtUsers(text: string, userOptions: AtChatMemberOption[], configs: AtConfigs = { regExp: /@\S+\(#(\S+)\)\s/g }): { atUidList: AtChatMemberOption[] } {
  const { regExp } = configs;
  if (!regExp || !text)
    throw new Error("regExp is required");
  const atUidList: AtChatMemberOption[] = [];
  const matches = text.matchAll(regExp);
  for (const match of matches) {
    // 识别@和括号直接的昵称
    if (match[1]) {
      const atUser = userOptions.find(u => u.username === match[1]);
      if (atUser)
        atUidList.push(atUser);
    }
  }
  return {
    atUidList: JSON.parse(JSON.stringify(atUidList)),
  };
}

export function formatAiReplyTxt(item: AskAiRobotOption) {
  return `/${item.nickName} `;
}

export interface AtConfigs {
  regExp?: RegExp
}

const CACHE_TIME = 5 * 60 * 1000; // 5分钟缓存时间

/**
 * 加载@用户列表
 * @returns
 *  userOptions: 所有用户列表
 *  userAtOptions: 未添加的用户列表
 *  loadUser: 加载用户列表
 */
export function useLoadAtUserList() {
  // AT @相关
  const chat = useChatStore();
  const user = useUserStore();
  const userOptions = ref<AtChatMemberOption[]>([]);
  const userAtOptions = computed(() => chat.theContact.type === RoomType.GROUP ? userOptions.value.filter(u => !chat.atUserList.find(a => a.userId === u.userId)) : []); // 过滤已存在的用户
  const userRoomMap = ref<Record<number, { time: number, list: AtChatMemberOption[] }>>({});

  /**
   * 加载@用户列表
   */
  async function loadUser() {
    if (!chat.theRoomId! || chat.theContact.type !== RoomType.GROUP)
      return;

    const roomId = chat.theRoomId!;
    const cache = userRoomMap.value[roomId];

    // 如果缓存存在且未过期,直接使用缓存
    if (cache && (Date.now() - cache.time < CACHE_TIME)) {
      userOptions.value = cache.list;
      // console.log("use cache user list");
      return;
    }

    const { data, code } = await getRoomGroupAllUser(chat.theRoomId!, user.getToken);
    if (data && code === StatusCode.SUCCESS) {
      const list = (data || []).map((u: ChatMemberSeVO) => ({
        label: u.nickName,
        value: `${u.nickName}(#${u.username})`,
        userId: u.userId,
        avatar: u.avatar,
        username: u.username,
        nickName: u.nickName,
      })).filter((u: AtChatMemberOption) => u.userId !== user.userInfo.id);

      userOptions.value = list;
      // 更新缓存
      userRoomMap.value[roomId] = {
        time: Date.now(),
        list,
      };
    }
  }

  // 加载用户
  const ws = useWsStore();
  watchDebounced(() => ws.wsMsgList.memberMsg.length, (len) => {
    if (!len)
      return;
    // 清除对应缓存
    const roomId = chat.theRoomId!;
    if (userRoomMap.value[roomId]) {
      delete userRoomMap.value[roomId];
    }
    loadUser();
  }, {
    debounce: 1000,
  });
  return {
    userOptions,
    userAtOptions,
    loadUser,
  };
}

/**
 * 处理@删除
 * @param context 文本内容
 * @param pattern 正则
 * @param prefix 前缀
 * @returns 是否匹配删除
 */
export function checkAtUserWhole(context: string | undefined | null, pattern: string, prefix: string) {
  const chat = useChatStore();
  console.log(chat.atUserList);
  console.log(pattern);
  console.log(prefix);
  if (prefix !== "@")
    return false;
  // const atUserListOpt = chat.atUserList.map((u: any) => ({ 
  //   ...u,
  //   label: `${u.nickname} `,
  //   value: u.userId,
  // }));
  console.log(chat.atUserList);
  console.log(pattern);

  if (pattern) {
    // const user = atUserListOpt.find(u => u.label === pattern.trim());
    // console.log();
    // if (user)
    chat.removeAtByUsername(pattern);
  }
  return true;
}

/**
 * 加载/AI列表
 * @returns
 *  aiOptions: 所有AI列表
 *  loadAi: 加载AI列表
 */
export function useLoadAiList() {
  const chat = useChatStore();
  const user = useUserStore();
  const aiOptions = ref<AskAiRobotOption[]>([]);
  const aiRoomMap = ref<Record<number, { time: number, isLoading: boolean, list: AskAiRobotOption[] }>>({});

  /**
   * 加载AI列表
   */
  async function loadAi(roomId?: number) {
    aiOptions.value = [];
    if (!roomId)
      return;

    const cache = aiRoomMap.value[roomId];
    if (chat.contactMap[roomId]?.type !== RoomType.GROUP) { // 单聊不查询
      return;
    }

    // 如果缓存存在且未过期,直接使用缓存
    if (cache && (Date.now() - cache.time < CACHE_TIME)) {
      aiOptions.value = cache.list;
      // console.log("use cache ai list");
      return;
    }

    const { data, code } = await getAiRobotListByRoomId(roomId, user.getToken);
    if (data && code === StatusCode.SUCCESS) {
      const list = (data || []).map((u: RobotUserVO) => ({
        label: u.nickname,
        value: u.nickname,
        userId: u.userId,
        avatar: u.avatar,
        username: u.username,
        nickName: u.nickname,
        aiRobotInfo: u,
      }));

      // 更新缓存
      aiRoomMap.value[roomId] = {
        time: Date.now(),
        list,
        isLoading: false,
      };
      aiOptions.value = [
        // {
        //   label: "AI风暴",
        //   value: "AI风暴",
        //   userId: "AI风暴",
        //   avatar: "",
        //   username: "AI风暴",
        //   nickName: "AI风暴",
        //   aiRobotInfo: undefined,
        // }, // 问答全部
        ...list,
      ];
    }
  }

  return {
    aiOptions,
    loadAi,
  };
}

/**
 * 处理/AI删除 mention
 * @param context 文本内容
 * @param pattern 正则
 * @param prefix 前缀
 * @returns 是否匹配删除
 */
export function checkAiReplyWhole(context: string | undefined | null, pattern: string, prefix: string) {
  const chat = useChatStore();
  if (prefix !== "/")
    return false;
  const atUserListOpt = chat.atUserList.map(u => ({
    ...u,
    label: `${u.nickName}(#${u.username})`,
    value: u.userId,
  }));
  if (pattern && context?.endsWith(`${prefix + pattern} `)) {
    const user = atUserListOpt.find(u => u.label === pattern.trim());
    if (user)
      chat.removeAtByUsername(user.username);
  }
  return true;
}

/**
 * 处理/AI回复
 * @param text 文本内容
 * @param aiOptions 所有AI列表
 * @returns
 *  aiReply: 识别到的/AI回复
 */
export function resolteAiReply(
  text: string,
  aiOptions: AskAiRobotOption[],
  selectedOptions: AskAiRobotOption[] = [],
  configs: AtConfigs = { regExp: /\/(\S+?)(?=\/|\s|$)/g },
): { aiRobitUidList: string[]; aiRobotList: AskAiRobotOption[]; replaceText: string } {
  const { regExp = /\/(\S+?)(?=\/|\s|$)/g } = configs;
  if (!regExp || !text)
    throw new Error("regExp is required");
  const aiRobotList: AskAiRobotOption[] = [];

  // 匹配所有以/开头的AI名称
  const matches = Array.from(text.matchAll(regExp));

  // 遍历所有匹配项
  for (const match of matches) {
    if (match && match[1]) {
      const aiRobot = aiOptions.find(u => u.nickName === match[1]);
      if (aiRobot && !aiRobotList.some(a => a.userId === aiRobot.userId)) {
        aiRobotList.push(aiRobot);
      }
    }
  }

  // 添加已选择的机器人
  selectedOptions.forEach((option) => {
    if (!aiRobotList.some(a => a.userId === option.userId)) {
      aiRobotList.push(option);
    }
  });

  // 替换所有匹配的AI昵称文本
  let replaceText = text;
  matches.forEach((match) => {
    if (match && match[0]) {
      replaceText = replaceText.replace(match[0], "").trim();
    }
  });

  return {
    aiRobitUidList: aiRobotList.map(p => p.userId),
    aiRobotList: JSON.parse(JSON.stringify(aiRobotList)),
    replaceText,
  };
}

export interface AtChatMemberOption {
  label: string
  value: string
  userId: string
  username: string
  nickName?: string
  avatar?: string
}
export interface AskAiRobotOption extends AtChatMemberOption {
  aiRobotInfo?: RobotUserVO;
}


/**
 * 好友状态
 */
export const SelfExistTextMap = {
  [RoomType.SELFT]: "已经不是好友",
  [RoomType.GROUP]: "已经不是群成员",
  [RoomType.AICHAT]: "已经被AI拉黑",
};

/**
 * 跳转到用户详情
 * @param userId 用户id
 */
export function navigateToUserDetail(userId: string) {
  console.log(userId);

  const chat = useChatStore();
  chat.setTheFriendOpt(FriendOptType.User, {
    id: userId,
  });
  navigateTo({
    path: "/friend",
    query: {
      id: userId,
      dis: 1, // 移动尺寸禁止路由拦截
    },
    replace: false,
  });
}
