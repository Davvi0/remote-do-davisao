const PREFIX='remote-davisao-';
const CACHE=PREFIX+'__BUILD_ID__';
const ASSETS=/* BUILD_ASSETS */ [];
const base=self.registration.scope;
const url=path=>new URL(path,base).href;
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['./','manifest.webmanifest','apple-touch-icon.png','icon-192.png','icon-512.png',...ASSETS].map(url))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,target=new URL(request.url);
 if(request.method!=='GET'||!request.url.startsWith(base)||target.pathname.includes('/api/'))return;
 event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}return response;}).catch(async()=>await caches.match(request)||(request.mode==='navigate'?await caches.match(url('./')):Response.error())));
});
