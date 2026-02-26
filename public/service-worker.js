// /public/service-worker.js

self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/logo192x192.png',
    // badge: '/icons/badge.png',
    data: { url: event.data.json().url }, // 存储通知中用到的 URL
  };

  event.waitUntil(
    self.registration.showNotification('新的消息', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.preventDefault(); // 阻止默认行为

  const url = event.notification.data.url; // 获取通知中存储的 URL

  // 判断是否是 PWA，如果是就打开 PWA，否则打开普通链接
  if (isPWA()) {
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const client = clients.find(client => client.url.includes('pwa://your-app-path'));
      if (client) {
        client.focus(); // 聚焦到现有窗口
      } else {
        self.clients.openWindow('/path-to-pwa'); // 打开 PWA
      }
    });
  } else {
    // 不是 PWA，直接打开 URL
    event.waitUntil(clients.openWindow(url));
  }

  event.notification.close(); // 关闭通知
});

// 判断是否为 PWA
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}
