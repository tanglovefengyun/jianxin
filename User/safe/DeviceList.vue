<script setup lang="ts">
const timestamp = Date.now();
const platforms = [
  {
    name: 'Android',
    icon: '/images/icon/PDF.png',
    type: 'qr',
    qrImage: `https://msg.llxads.com/app-release.png?t=${timestamp}`,
  },
  // {
  //   name: 'iOS',
  //   icon: '/images/icon/PDF.png',
  //   type: 'qr',
  //   qrImage: '/images/icon/XLSX.png',
  // },
  {
    name: 'Windows',
    icon: '/images/icon/PDF.png',
    type: 'download',
    link: `https://msg.llxads.com/jianxin_x64-setup.exe?t=${timestamp}`
  }
  // {
  //   name: 'macOS',
  //   icon: '/images/icon/PDF.png',
  //   type: 'download',
  //   link: '/downloads/mac.dmg',
  // },
  // {
  //   name: 'Linux',
  //   icon: '/images/icon/PDF.png',
  //   type: 'download',
  //   link: '/downloads/linux.deb',
  // },
]
</script>

<template>
  <div class="download-wrapper">
    <h2 class="title">客户端下载</h2>
    <div class="platform-list">
      <div
        v-for="item in platforms"
        :key="item.name"
        class="platform-card"
      >
        <div :class="'icon-wrapper-' + item.name">
        </div>
        <p>{{ item.name }}</p>

        <!-- 下载类型 -->
        <a
          v-if="item.type === 'download'"
          :href="item.link"
          class="download-btn"
          download
          @click="timestamp = Date.now()"
        >
          下载
        </a>

        <!-- 二维码类型 -->
        <div v-else class="qr-hover">
          <span>扫码下载</span>
          <div class="qr-popup">
            <img :src="item.qrImage" alt="二维码" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.download-wrapper {
  text-align: center;
  padding: 2rem;

  .title {
    font-size: 1.8rem;
    margin-bottom: 4rem;
  }

  .platform-list {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    justify-content: center;
  }

  .platform-card {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    width: 120px;
    height: 120px;
    position: relative;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    background-color: #5324ff;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.05);
    }

    .icon-wrapper-Android {
      width: 40px;
      height: 40px;
      background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='40' height='40' viewBox='0 0 40 40'%3E  %3Cdefs%3E    %3Cpath id='a688108f-309f-4e18-a0dc-ed026741fa12-a' d='M0 0h33.684v18.947H0z'/%3E  %3C/defs%3E  %3Cg fill='none' fill-rule='evenodd'%3E    %3Cpath d='M0 0h40v40H0z'/%3E    %3Cg opacity='1' transform='translate(3.158 11.158)'%3E      %3Cmask id='a688108f-309f-4e18-a0dc-ed026741fa12-b' fill='%23fff'%3E        %3Cuse xlink:href='%23a688108f-309f-4e18-a0dc-ed026741fa12-a'/%3E      %3C/mask%3E      %3Cpath fill='%23FFF' d='M24.594 14.156a1.402 1.402 0 1 1-.003-2.803 1.402 1.402 0 0 1 .003 2.803m-15.504 0a1.402 1.402 0 1 1-.002-2.803 1.402 1.402 0 0 1 .002 2.803M25.097 5.72L27.9.874a.584.584 0 0 0-1.01-.583L24.05 5.2c-2.17-.989-4.608-1.54-7.21-1.54-2.6 0-5.038.552-7.209 1.54L6.794.291a.584.584 0 0 0-1.01.582l2.803 4.848C3.774 8.335.482 13.2 0 18.947h33.684C33.202 13.2 29.91 8.335 25.097 5.721' mask='url(%23a688108f-309f-4e18-a0dc-ed026741fa12-b)'/%3E    %3C/g%3E  %3C/g%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .icon-wrapper-iOS {
      width: 40px;
      height: 40px;
      background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='40' height='40' viewBox='0 0 40 40'%3E  %3Cdefs%3E    %3Cpath id='f46e5a6d-7d66-4f5f-8628-7f4ceb95844a-a' d='M0 0h27v24.104H0z'/%3E  %3C/defs%3E  %3Cg fill='none' fill-rule='evenodd' transform='translate(7 4)'%3E    %3Cg transform='translate(0 7.658)'%3E      %3Cmask id='f46e5a6d-7d66-4f5f-8628-7f4ceb95844a-b' fill='%23fff'%3E        %3Cuse xlink:href='%23f46e5a6d-7d66-4f5f-8628-7f4ceb95844a-a'/%3E      %3C/mask%3E      %3Cpath fill='%23FFF' d='M20.06.016c-2.73-.194-5.046 1.46-6.339 1.46-1.311 0-3.332-1.418-5.475-1.38-2.814.04-5.408 1.57-6.86 3.983-2.922 4.86-.745 12.06 2.102 16.004 1.392 1.927 3.053 4.098 5.235 4.02 2.1-.08 2.895-1.302 5.433-1.302 2.536 0 3.252 1.301 5.473 1.262 2.26-.04 3.692-1.967 5.075-3.904 1.6-2.237 2.257-4.403 2.296-4.517-.05-.018-4.406-1.619-4.45-6.426-.039-4.019 3.425-5.951 3.583-6.044C24.167.398 21.129.092 20.059.016z' mask='url(%23f46e5a6d-7d66-4f5f-8628-7f4ceb95844a-b)'/%3E    %3C/g%3E    %3Cpath fill='%23FFF' d='M18.375 5.07c1.16-1.342 1.94-3.21 1.725-5.07-1.669.063-3.687 1.065-4.884 2.406-1.072 1.188-2.013 3.091-1.757 4.912 1.86.138 3.758-.904 4.916-2.247z'/%3E  %3C/g%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .icon-wrapper-Windows {
      width: 40px;
      height: 40px;
      background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E  %3Cg fill='%23FFF' fill-rule='evenodd'%3E    %3Cpath d='M6.316 21.826v9.025l10.99 1.539V21.826zm12.045 0v10.712l14.463 2.026V21.826zM6.316 11.767v9.004h10.99V10.205zM32.824 8l-14.463 2.055v10.716h14.463z' opacity='1'/%3E    %3Cpath fill='none' d='M0 0h40v40H0z'/%3E  %3C/g%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .icon-wrapper-macOS {
      width: 40px;
      height: 40px;
      background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='40' height='40' viewBox='0 0 40 40'%3E  %3Cdefs%3E    %3Cpath id='f46e5a6d-7d66-4f5f-8628-7f4ceb95844a-a' d='M0 0h27v24.104H0z'/%3E  %3C/defs%3E  %3Cg fill='none' fill-rule='evenodd' transform='translate(7 4)'%3E    %3Cg transform='translate(0 7.658)'%3E      %3Cmask id='f46e5a6d-7d66-4f5f-8628-7f4ceb95844a-b' fill='%23fff'%3E        %3Cuse xlink:href='%23f46e5a6d-7d66-4f5f-8628-7f4ceb95844a-a'/%3E      %3C/mask%3E      %3Cpath fill='%23FFF' d='M20.06.016c-2.73-.194-5.046 1.46-6.339 1.46-1.311 0-3.332-1.418-5.475-1.38-2.814.04-5.408 1.57-6.86 3.983-2.922 4.86-.745 12.06 2.102 16.004 1.392 1.927 3.053 4.098 5.235 4.02 2.1-.08 2.895-1.302 5.433-1.302 2.536 0 3.252 1.301 5.473 1.262 2.26-.04 3.692-1.967 5.075-3.904 1.6-2.237 2.257-4.403 2.296-4.517-.05-.018-4.406-1.619-4.45-6.426-.039-4.019 3.425-5.951 3.583-6.044C24.167.398 21.129.092 20.059.016z' mask='url(%23f46e5a6d-7d66-4f5f-8628-7f4ceb95844a-b)'/%3E    %3C/g%3E    %3Cpath fill='%23FFF' d='M18.375 5.07c1.16-1.342 1.94-3.21 1.725-5.07-1.669.063-3.687 1.065-4.884 2.406-1.072 1.188-2.013 3.091-1.757 4.912 1.86.138 3.758-.904 4.916-2.247z'/%3E  %3C/g%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .icon-wrapper-Linux {
      width: 40px;
      height: 40px;
      background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E  %3Cg fill='%23FFF' transform='translate(4 4)'%3E    %3Cpath d='M13.848 18.392a1.58 1.58 0 0 0-.807.238c-1.583.924-2.591 1.826-3.122 2.403-.111.088-.135.39-.085.56.236.8 2.533 2.62 3.448 2.62a.616.616 0 0 0 .07-.005c1.758-.21 5.852-2.29 5.737-3.313-.043-.386-.538-.773-.921-.94-1.237-.541-2.52-.977-3.782-1.459a1.497 1.497 0 0 0-.539-.103v-.001zm3.984-.266c.219.089.438.18.655.275.177.078.363.178.546.299a.986.986 0 0 0 .188-.16c1.23-1.323 1.349-3.635.21-5.04-1.119-1.38-3.012-1.326-4.045.12-.583.815-.836 1.734-.683 2.722.043.274.07.477.102.637a179.03 179.03 0 0 0 1.506.56 1.792 1.792 0 0 1-.134-.772c.038-.819.581-1.459 1.214-1.43.633.029 1.115.716 1.078 1.534-.026.55-.282 1.014-.638 1.254h.001z'/%3E    %3Cpath d='M16 32a15.93 15.93 0 0 0 7.815-2.037c-.475-1.171-.955-2.34-1.435-3.508-.52-1.267-1.212-2.463-1.813-3.699-.087-.178-.19-.291-.307-.354-.485.644-1.311 1.276-2.522 1.94-1.181.649-2.902 1.396-4.186 1.548-.088.01-.18.016-.27.016-.83 0-1.844-.459-3.015-1.363a9.602 9.602 0 0 1-1.15-1.035c.112 1.739-.702 3.687-1.704 5.995A15.926 15.926 0 0 0 15.998 32H16zM9.387 13.99c-.86 1.268-.842 3.337.038 4.595.152.217.282.374.402.476.272-.238.599-.504.977-.784-.27-.174-.494-.531-.57-.975-.119-.675.147-1.285.592-1.363.445-.077.901.407 1.02 1.082.031.187.032.367.01.534.202-.128.411-.257.634-.388.194-.113.39-.198.59-.27.192-1.032.01-2.006-.557-2.886-.833-1.293-2.274-1.291-3.136-.02z'/%3E    %3Cpath d='M5.362 27.949c.417-.565.82-1.095 1.203-1.577.936-1.185 1.362-2.459 1.311-3.913-.092-2.598-.223-5.195-.32-7.792-.236-6.27 3.055-9.08 6.702-9.59 4.363-.61 7.933 1.172 9.602 5.05.94 2.186 1.218 4.493 1.334 6.837.062 1.26.113 2.523.219 3.78.14 1.671.79 3.142 1.732 4.532.264.39.561.815.884 1.27A15.94 15.94 0 0 0 31.999 16c0-8.837-7.164-16-16-16C7.165 0 0 7.163 0 16a15.96 15.96 0 0 0 5.362 11.95v-.001z'/%3E  %3C/g%3E%3C/svg%3E");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    p {
      margin: 0;
      font-size: 0.9rem;
    }

    .download-btn {
      margin-top: 0.5rem;
      background: white;
      color: #313131;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 0.75rem;
      text-decoration: none;

      &:hover {
        background-color: #f2f2f2;
      }
    }

    .qr-hover {
      margin-top: 0.5rem;
      position: relative;
      font-size: 0.75rem;
      cursor: pointer;

      &:hover .qr-popup {
        display: block;
      }

      .qr-popup {
        display: none;
        position: absolute;
        top: -140px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 8px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        z-index: 10;

        img {
          width: 100px;
          height: 100px;
        }
      }
    }
  }
}
</style>
