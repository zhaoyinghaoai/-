/* 随手库 Service Worker v09
   策略：页面(navigate)走"网络优先"永远拿最新版；静态资源缓存优先保离线
   v09：与页面 v0.9 对齐（块式富媒体：文字/图片/视频穿插），cache名升版强制所有老用户触发全新安装（根治旧缓存锁死） */
const CACHE = 'suishouku-v091';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isDoc = e.request.mode === 'navigate';
  if (isDoc) {
    // 页面：先联网拿最新，离线才退回缓存
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(h => h || caches.match('./index.html')))
    );
  } else {
    // 静态资源：缓存优先，没命中再联网并写入缓存
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html')))
    );
  }
});
