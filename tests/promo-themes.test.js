'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {DatabaseSync}=require('node:sqlite');
const data=fs.mkdtempSync(path.join(os.tmpdir(),'emdadx-promo-'));
let child,base,admin,cfg,db,control,cookie;
const password='Promo-Test-Only-987!';
async function request(route,body,session,method=body===undefined?'GET':'POST'){
 const r=await fetch(base+route,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(session?{Cookie:session}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await r.text();let json;try{json=JSON.parse(text);}catch(_){}
 return {status:r.status,headers:r.headers,text,json};
}
before(async()=>{
 const probe=net.createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));base='http://127.0.0.1:'+port;
 let logs='';child=spawn(process.execPath,['backend/server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,DATA_DIR:data,ADMIN_PASSWORD:password,APP_PATH:'',HOST:'127.0.0.1',PORT:String(port)},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>{logs+=b;});child.stderr.on('data',b=>{logs+=b;});
 for(let i=0;;i++){try{if((await request('/api/health')).status===200)break;}catch(_){}if(i>100||child.exitCode!==null)throw Error(logs);await new Promise(resolve=>setTimeout(resolve,50));}
 const login=await request('/api/login',{username:'admin',password});assert.equal(login.status,200);admin=login.headers.get('set-cookie').split(';')[0];
 cfg=(await request('/api/promo',undefined,admin)).json.cfg;
 const ctl=await request('/api/promo/ctl',{pass:password},admin);assert.equal(ctl.status,200);control='/promo/c/'+ctl.json.token;
 const signed=await request(control+'/login',{pass:password});assert.equal(signed.status,200);cookie=signed.headers.get('set-cookie').split(';')[0];
 db=new DatabaseSync(path.join(data,'ozarex.db'));
});
after(async()=>{if(db)db.close();if(child&&child.exitCode===null){const ended=once(child,'exit');child.kill();await ended;}fs.rmSync(data,{recursive:true,force:true});});

test('all six designs round-trip without losing slide visibility, order, actions or image controls',async()=>{
 for(const theme of ['1','2','3','4','5','6']){
  const input={...cfg,theme,slides:[{...cfg.slides[1],title:'Hidden custom slide',on:false,act:'none',fit:'contain',shade:false,posX:10,posY:90},{...cfg.slides[0],title:'Visible custom slide',on:true,art:'studio',act:'url',url:'https://example.com/service',posX:78,posY:23}],slider:{auto:false,dots:false,fx:'zoom',sec:8}};
  const saved=await request('/api/promo/cfg',{cfg:input},admin);assert.equal(saved.status,200);assert.equal(saved.json.cfg.theme,theme);
  assert.equal(saved.json.cfg.slides[0].on,false);assert.equal(saved.json.cfg.slides[0].fit,'contain');assert.equal(saved.json.cfg.slides[0].shade,false);
  assert.equal(saved.json.cfg.slides[1].title,'Visible custom slide');assert.equal(saved.json.cfg.slides[1].posX,78);assert.equal(saved.json.cfg.slides[1].posY,23);assert.equal(saved.json.cfg.slides[1].url,'https://example.com/service');
  const page=await request('/promo?pv=1');assert.equal(page.status,200);assert.ok(page.text.includes('class="pm t'+theme));assert.equal(page.text.includes(' pm-modern'),theme==='5'||theme==='6');
  const reloaded=(await request('/api/promo',undefined,admin)).json.cfg;assert.deepEqual(reloaded.slides,saved.json.cfg.slides);assert.deepEqual(reloaded.slider,saved.json.cfg.slider);
 }
});

test('authenticated draft previews and public design previews never publish config or record visits',async()=>{
 const saved=(await request('/api/promo',undefined,admin)).json.cfg;
 const views=()=>db.prepare('SELECT COALESCE(SUM(n),0) n FROM promo_view').get().n;
 const beforeViews=views();
 assert.equal((await request('/api/promo/preview',{cfg:{...saved,theme:'5'}})).status,401);
 const draft=await request('/api/promo/preview',{cfg:{...saved,theme:'5',brand:'Draft company'}},admin);
 assert.equal(draft.status,200);assert.match(draft.json.html,/class="pm t5 pm-modern"/);assert.match(draft.json.html,/"preview":true/);assert.match(draft.json.html,/Draft company/);
 const standalone=await request(control+'/api/preview',{cfg:{...saved,theme:'5'}},cookie);assert.equal(standalone.status,200);assert.match(standalone.json.html,/pm t5 pm-modern/);
 assert.equal((await request(control+'/api/preview',{cfg:saved})).status,401);
 const publicPreview=await request('/promo?pv=1&theme=5');assert.match(publicPreview.text,/pm t5 pm-modern/);
 assert.deepEqual((await request('/api/promo',undefined,admin)).json.cfg,saved);assert.equal(views(),beforeViews);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM promo_lead').get().n,0);
});

test('uploaded photos persist on slides, service cards and the extra image; reset and independent positioning work',async()=>{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6qkAAAAASUVORK5CYII=','base64');
 const image=await request('/api/promo/img',{data:'data:image/png;base64,'+png.toString('base64')},admin);assert.equal(image.status,200);const id=image.json.id;assert.match(id,/^[a-f0-9]{24}$/);
 const photo=await fetch(base+'/promo/img/'+id);assert.equal(photo.status,200);assert.deepEqual(Buffer.from(await photo.arrayBuffer()),png);
 const saved={...cfg,theme:'5',slides:[{...cfg.slides[0],img:id,posX:130,posY:-5,alt:'Custom printer'}],services:[{...cfg.services[0],img:id,alt:'Custom service'}],modern:{workImg:id,workOn:true,workAlt:'Custom extra image',steps:[]}};
 const r=await request('/api/promo/cfg',{cfg:saved},admin);assert.equal(r.status,200);assert.equal(r.json.cfg.slides[0].posX,100);assert.equal(r.json.cfg.slides[0].posY,0);assert.equal(r.json.cfg.services[0].img,id);assert.equal(r.json.cfg.modern.workImg,id);assert.deepEqual(r.json.cfg.modern.steps,[]);
 const reread=(await request('/api/promo',undefined,admin)).json.cfg;assert.equal(reread.services[0].alt,'Custom service');assert.equal(reread.slides[0].alt,'Custom printer');
 const cleared=await request('/api/promo/cfg',{cfg:{...reread,slides:[{...reread.slides[0],img:'',art:'studio-dark',fit:'contain'}],modern:{...reread.modern,workOn:false,workImg:''}}},admin);
 assert.equal(cleared.json.cfg.slides[0].img,'');assert.equal(cleared.json.cfg.slides[0].art,'studio-dark');assert.equal(cleared.json.cfg.modern.workOn,false);
});

test('new text and image settings are normalized and cannot inject markup or arbitrary image URLs',async()=>{
 const r=await request('/api/promo/cfg',{cfg:{...cfg,theme:'untrusted',slides:[{title:'</script><script>bad()</script>',img:'https://example.com/file',posX:'bad',posY:null,art:'untrusted'}],modern:{steps:[{t:'<b>Step</b>',s:'Text',ic:'untrusted'}],workImg:'../../private'} }},admin);
 assert.equal(r.status,200);assert.equal(r.json.cfg.theme,'1');assert.equal(r.json.cfg.slides[0].img,'');assert.equal(r.json.cfg.slides[0].posX,50);assert.equal(r.json.cfg.slides[0].posY,50);assert.equal(r.json.cfg.modern.workImg,'');assert.equal(r.json.cfg.modern.steps[0].ic,'check');
 const page=await request('/promo?pv=1');assert.ok(!page.text.includes('</script><script>bad()'));
});

test('lead submission, tracking, authentication, and bundled photo assets remain functional',async()=>{
 await request('/api/promo/cfg',{cfg:{...cfg,theme:'6'}},admin);
 assert.equal((await request('/api/promo/cfg',{cfg})).status,401);
 const lead=await request('/promo/lead',{name:'Test Contact',center:'Test Center',phone:'01000000000',service:'طباعة أفلام الأشعة'});assert.equal(lead.status,200);assert.equal(lead.json.ok,true);assert.match(lead.json.code,/^[A-Z0-9]{6}$/);
 const tracked=await request('/promo/track',{code:lead.json.code});assert.equal(tracked.status,200);assert.equal(tracked.json.status,'new');
 assert.equal((await request('/promo/lead',{name:'x',phone:'1'})).status,400);
 for(const file of ['studio-light.jpg','studio-dark.jpg']){const r=await fetch(base+'/promo-assets/'+file);assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/image\/jpeg/);assert.ok((await r.arrayBuffer()).byteLength>10000);}
});
