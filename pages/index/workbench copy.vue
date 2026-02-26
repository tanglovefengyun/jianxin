<script lang="ts" setup>
import { appKeywords, appName } from "~/constants";

useSeoMeta({
  title: `工作台 - ${appName}`,
  description: "简信！",
  keywords: appKeywords,
});
definePageMeta({
  key: route => route.path,
});

const user = useUserStore();
const setting = useSettingStore();

// 默认
const {
  isFullLoading,
  notificationTypeList,
  changeAnimateMode,
} = useSettingDefault();

const size = computed(() => {
  if (setting.settingPage?.fontSize?.value < 16) {
    return "small";
  }
  else if (setting.settingPage?.fontSize?.value >= 16 && setting.settingPage?.fontSize?.value <= 20) {
    return "default";
  }
  else if (setting.settingPage?.fontSize?.value > 20) {
    return "large";
  }
  else {
    return "default";
  }
});

const scrollbarRef = useTemplateRef("scrollbarRef");
const timer = shallowRef<NodeJS.Timeout>();
const showAnima = ref(false);
async function onHashHandle() {
  await nextTick();
  if (!document || !document.location.hash)
    return;
  const dom = document.querySelector(window.location.hash) as HTMLElement;
  if (!dom || showAnima.value)
    return;
  showAnima.value = true;
  let top = 0;
  // 获取滚动容器高度
  const wrapHeight = scrollbarRef.value?.wrapRef?.clientHeight || 0;
  // 获取目标元素相对于父容器的偏移量
  const domRect = dom.getBoundingClientRect();
  const wrapRect = scrollbarRef.value?.wrapRef?.getBoundingClientRect();
  const offsetTop = domRect.top - (wrapRect?.top || 0);
  // 计算滚动位置,使目标元素在容器中间
  top = offsetTop - (wrapHeight / 2) + (domRect.height / 2);
  clearTimeout(timer.value);
  if (top !== 0) { // 缓动
    scrollbarRef.value?.wrapRef?.scrollTo({
      top,
      behavior: "smooth",
    });
  }
  dom.classList.add("setting-hash-anim");
  timer.value = setTimeout(() => {
    dom.classList.remove("setting-hash-anim");
    timer.value = undefined;
    showAnima.value = false;
  }, 2000);
}

onActivated(onHashHandle);
onMounted(onHashHandle);
onDeactivated(() => {
  clearTimeout(timer.value);
  showAnima.value = false;
  timer.value = undefined;
});
onUnmounted(() => {
  clearTimeout(timer.value);
  showAnima.value = false;
  timer.value = undefined;
});
</script>

<template>
  <el-scrollbar
    ref="scrollbarRef"
    v-loading.fullscreen="isFullLoading"
    class="setting-page h-full w-full flex-1 pt-10 bg-color-3 sm:card-bg-color-2"
    wrap-class="h-full w-full pb-4 sm:pb-20 flex flex-1 flex-col px-4"
    element-loading-text="更新中..."
    element-loading-background="transparent"
    :element-loading-spinner="defaultLoadingIcon"
    :class="{ 'settinlink-animated': showAnima }"
  >
    <h3 flex items-center px-3 sm:px-4>
      工作台
      <i i-solar:widget-bold ml-2 inline-block p0.6em opacity-60 hover:animate-spin />
    </h3>
    <label class="title">假勤管理</label>
    <div id="theme" class="box">
      <ul>
        <li class="border-default !hover:bg-[#f8f8f8] !dark:hover:bg-[#151515]">
          <div class="icon-box icon-color-red">
            <i i-solar:clock-circle-bold ml-2 inline-block p0.6em />
          </div>
          请假
        </li>
        <li class="border-default !hover:bg-[#f8f8f8] !dark:hover:bg-[#151515]">
          <div class="icon-box icon-color-orgin">
            <i i-solar:suitcase-bold ml-2 inline-block p0.6em />
          </div>
          加班
        </li>
      </ul>
    </div>
    <label class="title">人事管理</label>
    <div id="theme" class="box">
      <ul>
        <li class="border-default !hover:bg-[#f8f8f8] !dark:hover:bg-[#151515]">
          <div class="icon-box">
            <i i-solar:wallet-bold ml-2 inline-block p0.6em />
          </div>
          报销
        </li>
      </ul>
    </div>
  </el-scrollbar>
</template>

<style scoped lang="scss">
.title {
  --at-apply: "text-0.9em block px-3 tracking-0.1em mt-4 mb-2 sm:(px-4 mt-6 mb-3) ";
}
.box {
  border: 1px solid transparent;
  --at-apply: "text-0.9em card-rounded-df bg-white dark:bg-dark shadow p-3 sm:p-4 flex flex-col gap-3";

  .inputs {
    --at-apply: "w-10rem sm:w-12rem";
  }
  .box-title{
    color: #747373;
  }
  ul{
    list-style: none;
    display: flex;
    li{
      display: flex;
      align-items: center;
      width: 20%;
      padding: 10px;
      border-radius: 10px;
      margin-right: 1rem;
      cursor: pointer;
      .icon-box{
        background: #F4F4FC;
        padding: 10px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 10px;
        i{
          color: #5d33f6;
          margin: 0;
          font-size: 1.4rem;
        }
      }
      .icon-color-orgin{
        background: #fffae9;
        i{
          color: #ffbf00;
        }
      }
      .icon-color-red{
        background: #FFF5F5;
        i{
          color: #FF7333;
        }
      }
    }
    // li:hover{
    //   background: #e8e9eb;
    // }
  }
}

:deep(.el-scrollbar__thumb) {
  background-color: transparent !important;
}

:deep(.el-segmented) {
  height: 1.8rem;
  min-height: 1.8rem;
  line-height: 1.8rem;
  // --el-segmented-padding: 2px;
  .el-segmented__item-label {
    font-size: 0.86rem;
  }
}
:deep(.select.el-select) {
  .el-select__wrapper {
    height: 1.8rem;
    min-height: 1.8rem;
    padding-top: 0;
    padding-bottom: 0;
  }
}
:deep(.el-slider__button) {
  width: 1rem;
  height: 1rem;
}
.btns {
  background-image: linear-gradient(to bottom, transparent 0%, #fff 70%);
  --at-apply: "w-full  mt-a  flex flex-col items-center gap-4 sm:flex-row static sm:(absolute p-4 bottom-0) py-6 z-1 right-0";

  :deep(.el-button) {
    span {
      font-size: 0.8rem;
    }
  }
}
.dark .btns {
  background-image: linear-gradient(to bottom, transparent 0%, #111111 70%);
}
@media screen and (max-width: 768px) {
  .btns {
    background-image: none !important;
  }
}
</style>

<style lang="scss">
.settinlink-animated {
  .setting-hash-anim {
    animation: border-shading 1s ease-in-out infinite !important;
  }
}
@keyframes border-shading {
  0% {
    border-color: transparent !important;
  }
  50% {
    border-color: var(--el-color-primary) !important;
  }
  100% {
    border-color: transparent !important;
  }
}
</style>
