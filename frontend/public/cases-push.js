/* QR Patient PWA notifications — iOS Home Screen or compatible Android/Desktop. */
(function () {
  'use strict';
  var C=window.CD||{}, center=!!C.code && /^\/k\//.test(location.pathname);
  var id=center?C.code:C.pub, mode=center?'center':'patient';
  if(!id)return;
  var base=(center?'/k/':'/h/')+id;
  var button=document.getElementById(center?'centerPushToggle':'patientPushToggle');
  if(!button)return;
  var keyName='qrd-push-device:'+id;
  var state={enabled:false,busy:false}, initialLabel=center?'🔔 الإشعارات':'فعّل الإشعارات';
  function mobileApple(){
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  }
  function installed(){
    return !!(navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));
  }
  function status(message){
    var el=document.getElementById('casePushMsg');
    if(!el){
      el=document.createElement('p');el.id='casePushMsg';el.className='pv3-push-feedback';
      el.setAttribute('role','status');el.setAttribute('aria-live','polite');
      (center?button.parentNode:document.getElementById('caseNotify')||button.parentNode).appendChild(el);
    }
    el.textContent=message;
  }
  function paint(){
    button.textContent=state.busy?'جاري التفعيل…':state.enabled?(center?'🔔 إيقاف الإشعارات':'🔔 الإشعارات مفعّلة'):initialLabel;
    button.disabled=state.busy;button.setAttribute('aria-pressed',String(state.enabled));
  }
  function reason(){
    if(!window.isSecureContext)return 'الإشعارات تحتاج اتصال HTTPS آمن.';
    if(mobileApple() && !installed())return 'على الآيفون: افتح الرابط من Safari، اضغط مشاركة ⬆️ ثم إضافة إلى الشاشة الرئيسية، وافتحه من الأيقونة الجديدة واضغط تفعيل الإشعارات.';
    if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))
      return 'المتصفح الحالي لا يدعم إشعارات الويب. على الآيفون يلزم iOS 16.4 أو أحدث وإضافة التطبيق للشاشة الرئيسية.';
    if(Notification.permission==='denied')return 'الإشعارات مقفولة من إعدادات الجهاز؛ اسمح بها للتطبيق من الإعدادات.';
    return '';
  }
  function keyBytes(s){
    var value=s.replace(/-/g,'+').replace(/_/g,'/');
    while(value.length%4)value+='=';
    var decoded=atob(value), a=new Uint8Array(decoded.length);
    for(var i=0;i<decoded.length;i++)a[i]=decoded.charCodeAt(i);
    return a;
  }
  function device(){try{return localStorage.getItem(keyName)||''}catch(e){return ''}}
  function storeDevice(token){try{localStorage.setItem(keyName,token)}catch(e){}}
  function clearDevice(){try{localStorage.removeItem(keyName)}catch(e){}}
  function api(path,body){
    return fetch(base+'/'+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',
      headers:body?{'Content-Type':'application/json'}:{},
      body:body?JSON.stringify(body):undefined}).then(function(r){
      return r.json().catch(function(){return {}}).then(function(data){
        if(!r.ok)throw Error(data.message||'حصلت مشكلة في تفعيل الإشعارات');
        return data;
      });
    });
  }
  async function registration(){
    /* Separate QR worker, activated before subscribing (important for iOS PWA). */
    var reg=await navigator.serviceWorker.register('/qr-sw.js',{scope:center?'/k/':'/h/'});
    if(!reg.active){
      var worker=reg.installing||reg.waiting;
      if(worker && worker.state!=='activated'){
        await new Promise(function(resolve,reject){
          var done=false;
          function finish(err){if(done)return;done=true;if(err)reject(err);else resolve();}
          worker.addEventListener('statechange',function(){
            if(worker.state==='activated')finish();
            else if(worker.state==='redundant')finish(Error('تعذر تشغيل خدمة الإشعارات'));
          });
          setTimeout(function(){finish(Error('خدمة الإشعارات لسه مش جاهزة؛ افتح التطبيق مرة تانية'));},12000);
        });
      }
    }
    return reg;
  }
  function showError(err){
    status(err && err.message ? err.message : 'مش قادر أفعّل الإشعارات دلوقتي.');
  }
  async function enable(){
    var why=reason();if(why){status(why);return;}
    state.busy=true;paint();
    try{
      var permission=await Notification.requestPermission();
      if(permission!=='granted')throw Error('لازم تسمح بالإشعارات علشان تصلك التحديثات.');
      var keys=await api('push-key'), reg=await registration();
      var existing=await reg.pushManager.getSubscription();
      if(existing){await existing.unsubscribe();}
      var sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:keyBytes(keys.key)});
      var data=await api('push-subscribe',{subscription:sub.toJSON(),deviceToken:center?undefined:device()});
      if(!center && data.deviceToken)storeDevice(data.deviceToken);
      state.enabled=true;status('✅ اتفعلت الإشعارات. هتوصلك تنبيهات بعد إضافة التطبيق للشاشة الرئيسية حتى لو مقفول.');
      /* Send an actual remote test notification to verify the push service. */
      api('push-test',center?{test:true}:{deviceToken:device()}).then(function(result){
        if(!result.ok)status('الاشتراك اتحفظ، لكن اختبار الإرسال ماوصلش. اتأكد إن إعدادات الإشعارات مسموحة للتطبيق.');
      }).catch(showError);
    }catch(e){showError(e);}
    finally{state.busy=false;paint();}
  }
  async function disable(){
    state.busy=true;paint();
    try{
      var reg=await registration(),sub=await reg.pushManager.getSubscription();
      if(sub){
        await api('push-disable',{endpoint:sub.endpoint,deviceToken:center?undefined:device()});
        await sub.unsubscribe();
      }
      if(!center)clearDevice();
      state.enabled=false;status('الإشعارات اتقفلت على الجهاز ده.');
    }catch(e){showError(e);}
    finally{state.busy=false;paint();}
  }
  button.addEventListener('click',function(){return state.enabled?disable():enable();});
  paint();
  if('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window){
    registration().then(function(reg){return reg.pushManager.getSubscription()}).then(function(sub){
      state.enabled=!!sub && Notification.permission==='granted';paint();
    }).catch(function(){});
  }
})();
