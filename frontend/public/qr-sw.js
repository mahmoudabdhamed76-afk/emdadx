'use strict';
/* QR Patient service worker. Separate /h/ and /k/ scopes:
   Never intercept or cache personal, medical, or center responses. */
self.addEventListener('install', function(event) { self.skipWaiting(); });
self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('push', function(event) {
  var msg={};
  try { msg=event.data ? event.data.json() : {}; } catch(e) {}
  var target=String(msg.url||self.registration.scope);
  try {
    var destination=new URL(target,self.location.origin);
    if(destination.origin!==self.location.origin || !/^\/(?:h|k)\//.test(destination.pathname))
      destination=new URL(self.registration.scope);
    target=destination.href;
  }catch(e){target=self.registration.scope;}
  event.waitUntil(self.registration.showNotification(String(msg.title||'🔔 QR Patient').slice(0,100),{
    body:String(msg.body||'في تحديث جديد على طلبك').slice(0,180),
    icon:'/icons/icon-192.png',badge:'/icons/favicon-32.png',
    tag:String(msg.tag||'qr-patient').slice(0,80),dir:'rtl',lang:'ar',
    data:{url:target},
    renotify:false
  }));
});
self.addEventListener('notificationclick',function(event){
  event.notification.close();
  var url=String(event.notification.data&&event.notification.data.url||self.registration.scope);
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    var match=list.find(function(client){return client.url===url;});
    return match?match.focus():self.clients.openWindow(url);
  }));
});
