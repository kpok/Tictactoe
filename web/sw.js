const CACHE='threefold-v5-typography';
const FILES=['./','./index.html','./styles.css','./app.js','./engine.js','./ai.js','./ai-worker.js','./icon.svg','./manifest.webmanifest','./i18n.js',...['pl','en','tl','es','pt','fr','de','it','ru','ar','hi','zh-CN','ja','ko','id','bn'].map(code=>`./locales/${code}.js`)];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('threefold-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url),base=new URL('./',self.location.href);
  if(event.request.method!=='GET'||url.origin!==base.origin||url.pathname.startsWith(`${base.pathname}api/`)||event.request.headers.has('authorization'))return;
  if(!FILES.some(file=>new URL(file,base).pathname===url.pathname))return;
  // Network-first keeps existing installations fresh. Canonical keys never store invite query strings.
  const key=event.request.mode==='navigate'?new URL('./index.html',base).href:new URL(url.pathname,url.origin).href;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(event.request);
      if(response.ok)await cache.put(key,response.clone());
      return response;
    }catch{
      const cached=await cache.match(key);
      return cached||Response.error();
    }
  })());
});
