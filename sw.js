/* Word Woods service worker: works offline, always prefers the newest files when online */
var CACHE='ww-cache-v1';
var CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin===self.location.origin){
    /* our own files: network first, fall back to the saved copy when offline */
    e.respondWith(
      fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){c.put(req,copy)});
        return res;
      }).catch(function(){
        return caches.match(req).then(function(r){return r||caches.match('./index.html')});
      })
    );
  }else if(/(^|\.)(googleapis|gstatic)\.com$/.test(url.hostname)){
    /* fonts: saved copy first */
    e.respondWith(
      caches.match(req).then(function(r){
        return r||fetch(req).then(function(res){
          var copy=res.clone();
          caches.open(CACHE).then(function(c){c.put(req,copy)});
          return res;
        });
      })
    );
  }
});
