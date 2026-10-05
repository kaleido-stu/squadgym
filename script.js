(()=>{
'use strict';
/* ========= helpers ========= */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAY=864e5, base=new Date(); base.setHours(12,0,0,0);
const addD=(n,d=base)=>new Date(d.getTime()+n*DAY);
const fmtD=d=>d.toLocaleDateString('ar-EG-u-nu-latn',{day:'numeric',month:'short',year:'numeric'});
const diffD=(a,b)=>Math.round((a-b)/DAY);
const N=n=>`<span class="num">${(Math.round(n*100)/100).toLocaleString('en-US')}</span>`;
const money=n=>`<span class="num">${(Math.round(n*100)/100).toLocaleString('en-US')} ج.م</span>`;
const mtxt=n=>(Math.round(n*100)/100).toLocaleString('en-US')+' ج.م';
const hhmm=d=>d.toLocaleTimeString('ar-EG-u-nu-latn',{hour:'2-digit',minute:'2-digit',hour12:true});

/* ========= data (وهمية للعرض فقط) ========= */
const BR=[{id:1,name:'فرع الزقازيق',code:'F1'},{id:2,name:'فرع العاشر',code:'F2'},{id:3,name:'فرع بلبيس',code:'F3'},{id:4,name:'فرع ههيا',code:'F4'},{id:5,name:'فرع منيا القمح',code:'F5'}];
const brName=id=>(BR.find(b=>b.id===id)||{}).name||'';
const PLANS=[
 {id:1,name:'شهري',days:30,price:450,fee:50,scope:'all',fmax:7,ftimes:1},
 {id:2,name:'3 شهور',days:90,price:1200,fee:50,scope:'all',fmax:15,ftimes:1},
 {id:3,name:'سنوي',days:365,price:3800,fee:50,scope:'all',fmax:30,ftimes:2},
 {id:4,name:'شهري صباحي',days:30,price:320,fee:50,scope:'single',window:[6,16],fmax:7,ftimes:1},
 {id:5,name:'3 مرات أسبوعيًا',days:30,price:280,fee:50,scope:'single',weekly:3,fmax:7,ftimes:1},
 {id:6,name:'تذكرة يوم',days:1,price:60,fee:0,scope:'single',fmax:0,ftimes:0},
 {id:7,name:'VIP كل الفروع',days:30,price:700,fee:50,scope:'all',fmax:10,ftimes:1}
];
const plan=id=>PLANS.find(p=>p.id===id);
const MEMBERS=[
 {id:1,no:'SG-1001',name:'أحمد سمير',phone:'01012345601',plan:1,br:1,end:18},
 {id:2,no:'SG-1002',name:'منى عادل',phone:'01012345602',plan:2,br:1,end:5},
 {id:3,no:'SG-1003',name:'كريم حسن',phone:'01012345603',plan:1,br:1,end:-3},
 {id:4,no:'SG-1004',name:'هبة محمود',phone:'01012345604',plan:3,br:1,end:200,frozen:[-4,6]},
 {id:5,no:'SG-1005',name:'يوسف إبراهيم',phone:'01012345605',plan:4,br:2,end:12},
 {id:6,no:'SG-1006',name:'سارة مصطفى',phone:'01012345606',plan:5,br:1,end:20,wk:3},
 {id:7,no:'SG-1007',name:'ندى خالد',phone:'01012345607',plan:7,br:1,end:25,last:40},
 {id:8,no:'SG-1008',name:'عمر فتحي',phone:'01012345608',plan:2,br:3,end:60},
 {id:9,no:'SG-1009',name:'مريم طارق',phone:'01012345609',plan:1,br:1,end:2},
 {id:10,no:'SG-1010',name:'محمود رضا',phone:'01012345610',plan:1,br:2,end:9},
 {id:11,no:'SG-1011',name:'دينا أشرف',phone:'01012345611',plan:3,br:1,end:140},
 {id:12,no:'SG-1012',name:'باسم نبيل',phone:'01012345612',plan:1,br:1,end:-20}
].map(m=>({...m,endD:addD(m.end),frozen:m.frozen?{from:addD(m.frozen[0]),to:addD(m.frozen[1])}:null,consent:true,last:m.last??9999,wk:m.wk||0,ftaken:m.frozen?1:0}));
const PRODUCTS=[
 {id:1,name:'مياه 600 مل',price:8,cat:'مياه',min:60},
 {id:2,name:'مياه 1.5 لتر',price:12,cat:'مياه',min:40},
 {id:3,name:'مشروب طاقة',price:40,cat:'مشروبات',min:24},
 {id:4,name:'سناكس بروتين',price:45,cat:'سناكس',min:30},
 {id:5,name:'شيكر بروتين جاهز',price:70,cat:'بروتين',min:12},
 {id:6,name:'واي بروتين 2 كجم',price:1850,cat:'بروتين',min:4},
 {id:7,name:'كرياتين 300 جم',price:900,cat:'مكملات',min:3},
 {id:8,name:'تمر وبذور',price:25,cat:'سناكس',min:20}
];
function genStock(loc){
  const s={}; PRODUCTS.forEach((p,i)=>{
    const big=loc==='C'?3:1;
    s[p.id]=[{exp:25+i*8+(loc==='C'?30:0),qty:p.min*big*2},{exp:80+i*6,qty:p.min*big}];
  });
  if(loc===1){
    s[1]=[{exp:90,qty:140}];
    s[4]=[{exp:-2,qty:3},{exp:6,qty:8},{exp:50,qty:30}];
    s[6]=[{exp:200,qty:2}];
  }
  return s;
}
const STOCK={C:genStock('C')}; BR.forEach(b=>STOCK[b.id]=genStock(b.id));

/* ========= state ========= */
const ROLES={
  OWNER:{n:'المالك / المدير العام',s:['dashboard','checkin','members','plans','pos','shift','inventory','maintenance','expenses','reports','settings']},
  BRANCH_MANAGER:{n:'مدير فرع',s:['dashboard','checkin','members','plans','pos','shift','inventory','maintenance','expenses','reports']},
  RECEPTIONIST:{n:'ريسبشن / كاشير',s:['dashboard','checkin','members','pos','shift']},
  WAREHOUSE_KEEPER:{n:'أمين المخزن المركزي',s:['inventory']},
  TECHNICIAN:{n:'فني صيانة',s:['maintenance']},
  ACCOUNTANT:{n:'محاسب (قراءة فقط)',s:['dashboard','members','plans','expenses','reports']}
};
const SCREENS={
  dashboard:{t:'لوحة التحكم',i:'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z'},
  checkin:{t:'تسجيل الدخول (Check-in)',i:'M4 7V5a1 1 0 011-1h2M17 4h2a1 1 0 011 1v2M20 17v2a1 1 0 01-1 1h-2M7 20H5a1 1 0 01-1-1v-2M8 8h3v3H8zM13 13h3v3h-3z'},
  members:{t:'المشتركون',i:'M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21c0-4 4-6 8-6s8 2 8 6'},
  plans:{t:'الباقات',i:'M4 6h16M4 12h16M4 18h10'},
  pos:{t:'الكاشير',m:'pos_finance',i:'M3 7h18v12H3zM3 11h18M7 15h3'},
  shift:{t:'الوردية',m:'pos_finance',i:'M12 8v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z'},
  inventory:{t:'المخزون والمشتريات',m:'inventory',i:'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8'},
  maintenance:{t:'صيانة الأجهزة',m:'maintenance',i:'M14.7 6.3a4 4 0 015 5L9 22l-5-5zM13 8l3 3'},
  expenses:{t:'المصروفات',m:'pos_finance',i:'M12 3v18M17 7H9.5a2.5 2.5 0 000 5h5a2.5 2.5 0 010 5H7'},
  reports:{t:'التقارير',m:'advanced_reports',i:'M4 20V10M10 20V4M16 20v-8M22 20H2'},
  settings:{t:'الإعدادات والترخيص',i:'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 00-2-1.2L14 3h-4l-.5 2.7a7 7 0 00-2 1.2l-2.4-1-2 3.4 2 1.5a7 7 0 000 2.4l-2 1.5 2 3.4 2.4-1a7 7 0 002 1.2L10 21h4l.5-2.7a7 7 0 002-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z'}
};
const MODS=[
 ['core','الأساسي (إلزامي)',true],['pos_finance','POS والمالية'],['inventory','المخزون والمشتريات'],['maintenance','الصيانة'],['advanced_reports','التقارير المتقدمة'],['notifications','الإشعارات'],['import','الاستيراد']
];
const S={
  role:'OWNER',screen:'dashboard',branch:1,navOpen:false,modsOpen:false,bellOpen:false,
  mods:{core:true,pos_finance:true,inventory:true,maintenance:true,advanced_reports:true,notifications:true,import:true},
  members:MEMBERS,scan:'',cands:null,last:null,checkins:[],simHour:new Date().getHours(),
  mq:'',mf:'all',
  tab:{pos:'prod',inv:'stock',mnt:'assets',set:'license'},
  invLoc:'branch',pq:'',cart:[],disc:0,pay:'CASH',posMember:'',posPlan:'1',approved:false,
  shift:null,shifts:[{by:'مروة سعيد',br:1,open:'أمس 07:55',cash:500,exp:3140,cnt:3140}],
  receiptNo:{1:123,2:77,3:41,4:18,5:9},sales:[],receipt:null,
  modal:null,toasts:[],
  assets:[
   {id:1,name:'جهاز الجري 1',br:1,st:'ACTIVE',bought:'2024-03-10'},
   {id:2,name:'جهاز الجري 2',br:1,st:'OUT',bought:'2024-03-10'},
   {id:3,name:'كابل كروس',br:1,st:'MAINT',bought:'2023-11-02'},
   {id:4,name:'جهاز الصدر',br:2,st:'ACTIVE',bought:'2024-06-21'},
   {id:5,name:'دراجة ثابتة',br:3,st:'ACTIVE',bought:'2025-01-15'},
   {id:6,name:'مجموعة أوزان',br:1,st:'ACTIVE',bought:'2023-05-30'}
  ],
  tickets:[
   {id:1,asset:2,desc:'السير لا يدور',st:'OPEN',tech:'',cost:0},
   {id:2,asset:3,desc:'كابل مقطوع',st:'PROG',tech:'م. وائل',cost:0},
   {id:3,asset:4,desc:'تزييت وفحص',st:'DONE',tech:'م. وائل',cost:150}
  ],
  sched:[{asset:1,task:'تزييت السير',every:30,last:-27},{asset:4,task:'فحص الكابلات',every:60,last:-61},{asset:5,task:'ضبط المقعد والدواسات',every:90,last:-20}],
  transfers:[
   {id:'T-21',br:1,items:'واي بروتين ×6، مياه 600 مل ×120',st:'REQUESTED'},
   {id:'T-20',br:2,items:'سناكس بروتين ×60',st:'DISPATCHED'},
   {id:'T-19',br:3,items:'مشروب طاقة ×48',st:'RECEIVED'}
  ],
  pos_orders:[
   {id:'PO-9',sup:'شركة النيل للمكملات',items:'واي بروتين ×20، كرياتين ×10',st:'ORDERED',recv:'0 من 30'},
   {id:'PO-8',sup:'مياه الواحة',items:'مياه 600 مل ×600',st:'PARTIAL',recv:'400 من 600'}
  ],
  expenses:[
   {d:-1,br:1,cat:'كهرباء',amt:6200,m:'تحويل بنكي'},
   {d:-3,br:1,cat:'نظافة',amt:1800,m:'كاش'},
   {d:-6,br:2,cat:'تسويق',amt:3500,m:'فيزا'},
   {d:-9,br:1,cat:'مياه',amt:950,m:'كاش'}
  ],
  notifs:[
   {t:'خصم 15% من الريسبشن مروة على اشتراك شهري',s:'فرع الزقازيق · منذ 20 دقيقة',read:false},
   {t:'سماح استثنائي للعضو SG-1003 (سبب: عطل في تحويل المحفظة)',s:'فرع الزقازيق · منذ ساعة',read:false},
   {t:'عجز 40 ج.م في تقفيل وردية أمس',s:'فرع الزقازيق · أمس',read:true}
  ],
  hourly:[0,0,0,0,0,1,4,9,14,11,7,5,6,8,7,9,15,22,28,25,17,9,4,1],
  baseRevenue:{1:12450,2:8300,3:5100,4:3900,5:2800}
};

/* ========= core logic ========= */
const A=()=>ROLES[S.role];
const canWrite=()=>S.role!=='ACCOUNTANT';
const modOn=k=>!k||S.mods[k];
const screenAllowed=k=>A().s.includes(k);
const screenLicensed=k=>modOn(SCREENS[k].m);
function toast(t){const id=Math.random();S.toasts.push({id,t});render();setTimeout(()=>{S.toasts=S.toasts.filter(x=>x.id!==id);render()},3200)}
function guard(){if(!canWrite()){toast('صلاحية قراءة فقط: دور المحاسب لا يسمح بالتعديل');return false}return true}
function notify(t,s){if(S.mods.notifications)S.notifs.unshift({t,s:(s||brName(S.branch))+' · الآن',read:false})}
function memberStatus(m){
  const today=base;
  if(m.frozen&&m.frozen.from<=today&&m.frozen.to>=today)return{k:'frozen',t:'مجمّد',c:'info'};
  const left=diffD(m.endD,today);
  if(m.noSub)return{k:'none',t:'بدون اشتراك',c:''};
  if(left<0)return{k:'expired',t:'منتهي',c:'bad'};
  if(left<=7)return{k:'expiring',t:`ينتهي خلال ${left} يوم`,c:'warn'};
  return{k:'active',t:'ساري',c:'ok'};
}
function evalCheckin(m){
  const p=plan(m.plan), left=diffD(m.endD,base), st=memberStatus(m);
  if(st.k==='none')return{r:'bad',why:'لا يوجد اشتراك',code:'NOSUB'};
  if(st.k==='frozen')return{r:'bad',why:'الاشتراك مجمّد حاليًا',code:'FROZEN',left};
  if(left<0)return{r:'bad',why:`الاشتراك انتهى منذ ${-left} يوم`,code:'EXPIRED',left};
  if(p.scope==='single'&&m.br!==S.branch)return{r:'bad',why:`الباقة خاصة بـ ${brName(m.br)}`,code:'BRANCH',left};
  if(p.window&&(S.simHour<p.window[0]||S.simHour>=p.window[1]))return{r:'bad',why:`الباقة صباحية: مسموح من ${p.window[0]}:00 حتى ${p.window[1]}:00`,code:'WINDOW',left};
  if(p.weekly&&m.wk>=p.weekly)return{r:'bad',why:`تعدّى حد الدخول الأسبوعي (${p.weekly} مرات)`,code:'WEEKLY',left};
  if(m.last<120){const t=new Date(Date.now()-m.last*60000);return{r:'dup',why:`دخل بالفعل الساعة ${hhmm(t)}`,left}}
  if(left<=7)return{r:'warn',why:'يجدد قريب',left};
  return{r:'ok',why:'اشتراك ساري',left};
}
function doCheckin(m){
  const res=evalCheckin(m); S.last={m,res,at:new Date()};
  if(res.r==='ok'||res.r==='warn'){m.last=0;m.wk++;S.hourly[new Date().getHours()]++}
  if(res.r!=='dup')S.checkins.unshift({m,res,at:new Date(),br:S.branch});
  S.scan='';S.cands=null;render();
}
function findMembers(q){
  q=q.trim().toLowerCase(); if(!q)return[];
  const exact=S.members.filter(m=>m.no.toLowerCase()===q||m.phone===q);
  if(exact.length)return exact;
  return S.members.filter(m=>m.name.includes(q)||m.no.toLowerCase().includes(q)||m.phone.includes(q));
}
function stockOf(loc,pid){return (STOCK[loc]||{})[pid]||[]}
function sellable(loc,pid){return stockOf(loc,pid).filter(b=>b.exp>=0).reduce((a,b)=>a+b.qty,0)}
function totalQty(loc,pid){return stockOf(loc,pid).reduce((a,b)=>a+b.qty,0)}
function deductFEFO(loc,pid,qty){
  const bs=stockOf(loc,pid).filter(b=>b.exp>=0).sort((a,b)=>a.exp-b.exp);
  for(const b of bs){const t=Math.min(b.qty,qty);b.qty-=t;qty-=t;if(!qty)break}
  STOCK[loc][pid]=STOCK[loc][pid].filter(b=>b.qty>0||b.exp<0);
}
function renewDates(m,p){
  const start=(!m.noSub&&m.endD>base)?m.endD:base;
  return{start,end:addD(p.days,start)};
}
function fakeQR(seed){
  let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;
  const n=21,cells=[];let r='';
  const rnd=()=>{h^=h<<13;h>>>=0;h^=h>>17;h^=h<<5;h>>>=0;return h};
  const finder=(x,y)=>(x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    let on;
    if(finder(x,y)){const fx=x<8?x:x-(n-8),fy=y<8?y:y-(n-8);on=(fx===0||fx===6||fy===0||fy===6||(fx>=2&&fx<=4&&fy>=2&&fy<=4))&&fx<7&&fy<7}
    else on=rnd()%2===0;
    if(on)r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg class="qr" viewBox="0 0 ${n} ${n}" role="img" aria-label="رمز QR تجريبي" fill="#17222B">${r}</svg>`;
}

/* ========= views ========= */
const icon=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
function demoBar(){
  return `<div class="demo">
   <b>نموذج أولي للواجهة</b><span>بيانات وهمية، ولا يوجد خادم. الغرض مراجعة الشكل وسير العمل.</span>
   <span class="sp"></span>
   <label>الدور: <select data-in="role" aria-label="تبديل الدور">${Object.entries(ROLES).map(([k,v])=>`<option value="${k}" ${k===S.role?'selected':''}>${v.n}</option>`).join('')}</select></label>
   <div class="mods"><button data-a="toggleMods" aria-expanded="${S.modsOpen}">الموديولات المرخّصة ▾</button>
    ${S.modsOpen?`<div class="mods-pop"><b>الترخيص (محاكاة)</b>${MODS.map(([k,n,lock])=>`<label><input type="checkbox" data-in="mod" data-k="${k}" ${S.mods[k]?'checked':''} ${lock?'disabled':''}> ${n}</label>`).join('')}<small>أوقف موديولًا لترى القوائم والصفحات تختفي، وصفحة "غير مرخّص" تظهر عند محاولة فتحه.</small></div>`:''}
   </div>
   <button data-a="reset">إعادة ضبط</button></div>`;
}
function nav(){
  const items=A().s.filter(k=>screenLicensed(k));
  const grp=(arr,label)=>arr.length?`${label?`<div class="sep">${label}</div>`:''}${arr.map(k=>`<button data-a="go" data-k="${k}" ${S.screen===k?'aria-current="page"':''}>${icon(SCREENS[k].i)}${SCREENS[k].t}</button>`).join('')}`:'';
  const main=items.filter(k=>['dashboard','checkin','members','plans'].includes(k));
  const ops=items.filter(k=>['pos','shift','inventory','maintenance','expenses'].includes(k));
  const mgmt=items.filter(k=>['reports','settings'].includes(k));
  return grp(main,'')+grp(ops,'العمليات')+grp(mgmt,'الإدارة');
}
function top(){
  const sh=S.shift;
  const unread=S.notifs.filter(n=>!n.read).length;
  return `<header class="top">
   <button class="burger" data-a="burger" aria-label="القائمة">☰</button>
   <h1>${SCREENS[S.screen].t}</h1>
   <label class="row muted" style="font-size:13px">الفرع الحالي
    <select class="sel" data-in="branch" aria-label="الفرع الحالي">${BR.map(b=>`<option value="${b.id}" ${b.id===S.branch?'selected':''}>${b.name}</option>`).join('')}</select></label>
   ${S.mods.pos_finance?`<span class="pill ${sh?'ok':'bad'}"><i class="dot"></i>${sh?'وردية مفتوحة':'لا توجد وردية مفتوحة'}</span>`:''}
   ${S.mods.notifications?`<button class="bell" data-a="bell" aria-label="الإشعارات">🔔${unread?`<i>${unread}</i>`:''}</button>`:''}
   ${S.bellOpen&&S.mods.notifications?`<div class="notif"><h4>الإشعارات</h4>${S.notifs.map(n=>`<div class="n" style="${n.read?'opacity:.6':''}">${esc(n.t)}<small>${esc(n.s)}</small></div>`).join('')}<div class="n"><button class="btn sm" data-a="readAll">تحديد الكل كمقروء</button></div></div>`:''}
  </header>`;
}
function locked(why){
  return `<div class="card lock"><h2>${why==='role'?'غير مسموح لك بالدخول هنا':'هذا الموديول غير مرخّص'}</h2>
  <p class="muted">${why==='role'?`دور "${A().n}" لا يملك صلاحية هذه الصفحة. الصلاحيات تُفرض في السيرفر وليس في الواجهة فقط.`:'نسخة هذا الجيم لا تشمل هذا الموديول. للحصول عليه تواصل مع المطوّر لإصدار ترخيص جديد. بياناتك محفوظة ولن تُمسح.'}</p>
  <button class="btn pri" data-a="goHome">العودة للصفحة الرئيسية</button></div>`;
}

/* ---- dashboard ---- */
function expiringList(){
  return S.members.filter(m=>{const k=memberStatus(m).k;return k==='expiring'||k==='expired'&&diffD(m.endD,base)>=-7}).sort((a,b)=>a.endD-b.endD);
}
function waLink(m,msg){return `https://wa.me/2${m.phone}?text=${encodeURIComponent(msg)}`}
function dashboard(){
  const todaySales=S.sales.filter(s=>s.br===S.branch).reduce((a,s)=>a+s.total,0);
  const rev=S.baseRevenue[S.branch]+todaySales;
  const ci=S.hourly.reduce((a,b)=>a+b,0);
  const exp=expiringList();
  const out=S.assets.filter(a=>a.st==='OUT'&&a.br===S.branch).length;
  const low=lowStock(S.branch).length;
  const showMoney=['OWNER','BRANCH_MANAGER','ACCOUNTANT'].includes(S.role)&&S.mods.pos_finance;
  const max=Math.max(...S.hourly), peakH=S.hourly.indexOf(max);
  return `<div class="strip">
   <div><small>دخول اليوم</small><b>${N(ci)}</b></div>
   ${showMoney?`<div><small>إيراد اليوم (${brName(S.branch)})</small><b>${money(rev)}</b></div>`:''}
   <div><small>اشتراكات تنتهي خلال 7 أيام</small><b>${N(exp.filter(m=>memberStatus(m).k==='expiring').length)}</b></div>
   ${S.mods.maintenance&&A().s.includes('maintenance')?`<div><small>أجهزة خارج الخدمة</small><b style="color:${out?'var(--bad)':'inherit'}">${N(out)}</b></div>`:''}
   ${S.mods.inventory&&A().s.includes('inventory')?`<div><small>أصناف تحتاج انتباه</small><b>${N(low)}</b></div>`:''}
  </div>
  <div class="grid g2">
   <div class="card"><header><h2>الدخول حسب الساعة اليوم</h2><span class="muted" style="font-size:13px">الذروة الساعة <span class="num">${peakH}:00</span></span></header>
    <div class="body"><div class="bars" role="img" aria-label="عدد الدخول لكل ساعة">${S.hourly.map((v,i)=>`<div class="${i===peakH?'pk':''}" style="height:${Math.max(2,v/max*100)}%" title="${i}:00 — ${v}"></div>`).join('')}</div>
     <div class="bl">${S.hourly.map((v,i)=>`<span>${i%3===0?i:''}</span>`).join('')}</div></div></div>
   <div class="card"><header><h2>اشتراكات هتنتهي</h2></header><div class="body" style="padding:0">
    ${exp.length?`<table><tbody>${exp.map(m=>{const st=memberStatus(m);return `<tr><td>${esc(m.name)}<br><span class="badge ${st.c}">${st.t}</span></td><td style="text-align:end"><a class="btn sm wa" target="_blank" rel="noopener" href="${waLink(m,`أهلاً ${m.name}، اشتراكك في سكواد جيم ينتهي بتاريخ ${fmtD(m.endD)}. تقدر تجدده من أي فرع.`)}">واتساب</a></td></tr>`}).join('')}</tbody></table>`:'<div class="empty">لا توجد اشتراكات قريبة من الانتهاء</div>'}
   </div></div>
  </div>
  ${S.mods.inventory&&A().s.includes('inventory')?`<div class="card" style="margin-top:16px"><header><h2>تنبيهات المخزون — ${brName(S.branch)}</h2></header><div class="body">${lowStock(S.branch).map(x=>`<div class="row" style="padding:4px 0"><span class="badge ${x.c}">${x.t}</span> ${esc(x.p.name)}</div>`).join('')||'<span class="muted">لا توجد تنبيهات</span>'}</div></div>`:''}`;
}
function lowStock(loc){
  const out=[];
  PRODUCTS.forEach(p=>{
    const q=sellable(loc,p.id);
    if(q<=p.min)out.push({p,t:`تحت الحد الأدنى (${q})`,c:'bad'});
    const bs=stockOf(loc,p.id);
    if(bs.some(b=>b.exp<0&&b.qty>0))out.push({p,t:'دفعة منتهية الصلاحية',c:'bad'});
    else if(bs.some(b=>b.exp>=0&&b.exp<=30&&b.qty>0))out.push({p,t:'تقترب من انتهاء الصلاحية',c:'warn'});
  });
  return out;
}

/* ---- check-in ---- */
function checkin(){
  const L=S.last;
  let panel;
  if(!L){panel=`<div class="res idle"><h3 style="font-size:22px;margin:0 0 6px;color:var(--ink)">جاهز للمسح</h3>امسح كارت العضوية، أو اكتب الاسم أو الموبايل أو رقم العضوية</div>`}
  else{
    const {m,res}=L,p=plan(m.plan);
    const cls=res.r, head={ok:'مسموح بالدخول',warn:'مسموح بالدخول',bad:'ممنوع الدخول',dup:'مسجّل بالفعل'}[res.r];
    panel=`<div class="res ${cls}" role="status" aria-live="polite">
     <div class="avatar" aria-hidden="true">${esc(m.name.split(' ').map(w=>w[0]).slice(0,2).join(''))}</div>
     <div><h3>${head}</h3><div class="nm">${esc(m.name)}</div>
      <div class="meta"><span class="num">${m.no}</span> · ${p.name} · ينتهي ${fmtD(m.endD)}</div>
      <div class="meta" style="margin-top:6px;font-weight:600">${esc(res.why)}${L.override?' (سماح استثنائي)':''}</div>
      ${res.r==='warn'?`<div class="yellowline">تنبيه: يجدد قريب (متبقي ${res.left} يوم)</div>`:''}
      ${res.r==='bad'&&!L.override?`<div style="margin-top:12px"><button class="btn sm" data-a="override">سماح استثنائي…</button></div>`:''}
     </div>
     ${res.left>=0&&res.r!=='bad'?`<div class="days"><b class="num">${res.left}</b><small>يوم متبقي</small></div>`:'<span></span>'}
    </div>`;
  }
  const chips=[['SG-1001','ساري'],['SG-1002','يجدد قريب'],['SG-1003','منتهي'],['SG-1004','مجمّد'],['SG-1005','فرع تاني'],['SG-1006','حد أسبوعي'],['SG-1007','دخل قبل قليل']];
  return `<div class="grid" style="gap:16px">
   <div class="card"><div class="body">
    <div class="scan"><input id="scan" type="text" data-in="scan" value="${esc(S.scan)}" placeholder="امسح الكارت أو اكتب الاسم / الموبايل" autocomplete="off" aria-label="المسح أو البحث"><button class="btn pri" data-a="scan">تسجيل</button></div>
    <div class="row" style="margin-top:10px"><span class="muted" style="font-size:13px">جرّب:</span><div class="chips">${chips.map(([c,t])=>`<button class="chip" data-a="chip" data-c="${c}">${t} <span class="num muted">${c}</span></button>`).join('')}</div>
     <span class="sp" style="flex:1"></span><label class="muted" style="font-size:13px">الساعة (محاكاة) <select class="sel" data-in="simHour">${[...Array(24).keys()].map(h=>`<option value="${h}" ${h===S.simHour?'selected':''}>${h}:00</option>`).join('')}</select></label></div>
    ${S.cands?`<div class="note" style="margin-top:10px">أكثر من نتيجة، اختر العضو:<div class="chips" style="margin-top:6px">${S.cands.map(m=>`<button class="chip" data-a="pick" data-id="${m.id}">${esc(m.name)} · ${m.no}</button>`).join('')}</div></div>`:''}
   </div></div>
   ${panel}
   <div class="card"><header><h2>آخر عمليات الدخول</h2></header><div class="tw"><table><thead><tr><th>الوقت</th><th>العضو</th><th>الفرع</th><th>النتيجة</th></tr></thead><tbody>
    ${S.checkins.length?S.checkins.slice(0,8).map(c=>`<tr><td>${hhmm(c.at)}</td><td>${esc(c.m.name)}</td><td>${brName(c.br)}</td><td><span class="badge ${c.res.r==='bad'?'bad':c.res.r==='warn'?'warn':'ok'}">${esc(c.res.r==='bad'?c.res.why:c.override?'سماح استثنائي':'دخول')}</span></td></tr>`).join(''):'<tr><td colspan="4" class="empty">لم يتم تسجيل دخول بعد في هذه الجلسة</td></tr>'}
   </tbody></table></div></div></div>`;
}

/* ---- members ---- */
function members(){
  let list=S.members.filter(m=>!S.mq||m.name.includes(S.mq)||m.no.toLowerCase().includes(S.mq.toLowerCase())||m.phone.includes(S.mq));
  if(S.mf!=='all')list=list.filter(m=>memberStatus(m).k===S.mf);
  return `<div class="card"><header><h2>${num(list.length)} مشترك</h2>
    <div class="row"><input id="mq" type="search" data-in="mq" value="${esc(S.mq)}" placeholder="بحث بالاسم أو الموبايل أو الرقم" style="width:260px" aria-label="بحث">
    <select class="sel" data-in="mf" aria-label="تصفية"><option value="all">الكل</option><option value="active" ${S.mf==='active'?'selected':''}>ساري</option><option value="expiring" ${S.mf==='expiring'?'selected':''}>ينتهي قريبًا</option><option value="expired" ${S.mf==='expired'?'selected':''}>منتهي</option><option value="frozen" ${S.mf==='frozen'?'selected':''}>مجمّد</option></select>
    <button class="btn pri" data-a="newMember">عضو جديد</button>
    ${S.mods.import?`<button class="btn" data-a="importX">استيراد من Excel</button>`:''}</div></header>
   <div class="tw"><table><thead><tr><th>رقم العضوية</th><th>الاسم</th><th>الموبايل</th><th>الباقة</th><th>النطاق</th><th>ينتهي</th><th>الحالة</th><th></th></tr></thead><tbody>
   ${list.map(m=>{const st=memberStatus(m),p=plan(m.plan);return `<tr><td><span class="num">${m.no}</span></td><td>${esc(m.name)}</td><td><span class="num">${m.phone}</span></td><td>${m.noSub?'—':p.name}</td><td>${m.noSub?'—':p.scope==='all'?'كل الفروع':brName(m.br)}</td><td>${m.noSub?'—':fmtD(m.endD)}</td><td><span class="badge ${st.c}">${st.t}</span></td><td><button class="btn sm" data-a="viewMember" data-id="${m.id}">عرض</button></td></tr>`}).join('')||'<tr><td colspan="8" class="empty">لا توجد نتائج</td></tr>'}
   </tbody></table></div></div>`;
}
const num=n=>`<span class="num">${n}</span>`;
function memberModal(m){
  const p=plan(m.plan),st=memberStatus(m);
  return {title:`${m.name}`,wide:true,body:`<div class="grid g2" style="grid-template-columns:1fr 1fr">
    <dl class="kv"><dt>رقم العضوية</dt><dd><span class="num">${m.no}</span></dd><dt>الموبايل</dt><dd><span class="num">${m.phone}</span></dd><dt>الباقة</dt><dd>${m.noSub?'—':p.name}</dd><dt>النطاق</dt><dd>${m.noSub?'—':p.scope==='all'?'كل الفروع':brName(m.br)}</dd><dt>الانتهاء</dt><dd>${m.noSub?'—':fmtD(m.endD)}</dd><dt>الحالة</dt><dd><span class="badge ${st.c}">${st.t}</span></dd><dt>الموافقة على البيانات</dt><dd>${m.consent?'تمت':'غير مسجلة'}</dd>${m.frozen?`<dt>التجميد</dt><dd>${fmtD(m.frozen.from)} إلى ${fmtD(m.frozen.to)}</dd>`:''}</dl>
    <div style="text-align:center">${fakeQR(m.no)}<div class="muted" style="font-size:12px">رمز QR تجريبي للعرض</div></div></div>`,
    foot:`${S.mods.pos_finance?`<button class="btn pri" data-a="renewGo" data-id="${m.id}">تجديد الاشتراك (في الكاشير)</button>`:''}
    <button class="btn" data-a="freezeOpen" data-id="${m.id}" ${m.noSub?'disabled':''}>تجميد</button>
    <button class="btn" data-a="cardOpen" data-id="${m.id}">طباعة الكارت</button>
    <a class="btn wa" target="_blank" rel="noopener" href="${waLink(m,`أهلاً ${m.name}، معاك سكواد جيم.`)}">واتساب</a>
    <button class="btn" data-a="closeModal">إغلاق</button>`};
}

/* ---- plans ---- */
function plans(){
  return `<div class="card"><header><h2>الباقات</h2>${S.role==='OWNER'?`<button class="btn" data-a="toast" data-t="تعديل الباقات من شاشة إدارة (غير مفعّلة في النموذج)">باقة جديدة</button>`:'<span class="muted" style="font-size:13px">التعديل للمالك فقط</span>'}</header>
  <div class="tw"><table><thead><tr><th>الباقة</th><th>المدة</th><th>السعر</th><th>رسوم التسجيل</th><th>النطاق</th><th>القيود</th><th>التجميد</th></tr></thead><tbody>
  ${PLANS.map(p=>`<tr><td><b>${p.name}</b></td><td>${num(p.days)} يوم</td><td>${money(p.price)}</td><td>${p.fee?money(p.fee):'—'}</td><td><span class="badge ${p.scope==='all'?'ok':'info'}">${p.scope==='all'?'كل الفروع':'فرع واحد'}</span></td><td>${p.window?`صباحي ${p.window[0]}:00–${p.window[1]}:00`:p.weekly?`${p.weekly} مرات أسبوعيًا`:'—'}</td><td>${p.fmax?`حتى ${p.fmax} يوم (${p.ftimes} مرة)`:'غير متاح'}</td></tr>`).join('')}
  </tbody></table></div></div>`;
}

/* ---- POS ---- */
function posTotals(){
  const sub=S.cart.reduce((a,l)=>a+l.price*l.qty,0);
  const d=Math.round(sub*(S.disc||0))/100;
  return{sub,d,total:sub-d};
}
function pos(){
  const T=posTotals(), cap=20, over=S.role==='RECEPTIONIST'&&S.disc>cap;
  const prods=PRODUCTS.filter(p=>!S.pq||p.name.includes(S.pq));
  const selM=S.members.find(m=>String(m.id)===String(S.posMember));
  const sp=plan(+S.posPlan);
  const rd=selM&&sp&&sp.id!==6?renewDates(selM,sp):null;
  return `<div class="pos">
   <div class="card"><header><h2>الكاشير — ${brName(S.branch)}</h2></header>
    <div class="body"><div class="tabs" role="tablist"><button role="tab" aria-selected="${S.tab.pos==='prod'}" data-a="tab" data-g="pos" data-k="prod">منتجات</button><button role="tab" aria-selected="${S.tab.pos==='sub'}" data-a="tab" data-g="pos" data-k="sub">اشتراكات وتذاكر</button></div>
    ${S.tab.pos==='prod'?`<input id="pq" type="search" data-in="pq" value="${esc(S.pq)}" placeholder="ابحث عن منتج" style="margin-bottom:12px" aria-label="بحث منتج">
     <div class="prods">${prods.map(p=>{const q=sellable(S.branch,p.id);return `<button class="prod" data-a="addProd" data-id="${p.id}" ${q<=0?'disabled':''}><b>${p.name}</b><span>${money(p.price)}</span><br><small>${q<=0?'نفد من المخزون':`متاح: ${q}`}</small></button>`}).join('')}</div>`
    :`<div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">
      <label class="f">العضو<select data-in="posMember"><option value="">— عميل عابر (للتذكرة اليومية فقط) —</option>${S.members.map(m=>`<option value="${m.id}" ${String(m.id)===String(S.posMember)?'selected':''}>${esc(m.name)} (${m.no})</option>`).join('')}</select></label>
      <label class="f">الباقة<select data-in="posPlan">${PLANS.map(p=>`<option value="${p.id}" ${String(p.id)===String(S.posPlan)?'selected':''}>${p.name} — ${mtxt(p.price)}</option>`).join('')}</select></label></div>
      ${rd?`<div class="note" style="background:var(--info-bg);color:var(--info)">القاعدة: ${selM.endD>base&&!selM.noSub?'تجديد قبل الانتهاء، الاشتراك الجديد يبدأ من تاريخ انتهاء القديم':'تجديد بعد الانتهاء، يبدأ من اليوم'}.<br>يبدأ <b>${fmtD(rd.start)}</b> وينتهي <b>${fmtD(rd.end)}</b>${selM.noSub&&sp.fee?` · تُضاف رسوم تسجيل ${mtxt(sp.fee)}`:''}</div>`:''}
      <button class="btn pri" data-a="addSub">أضف للسلة</button>`}
    </div></div>
   <div class="card cart"><header><h2>السلة</h2><button class="btn sm" data-a="clearCart">تفريغ</button></header><div class="body">
    ${S.cart.length?`<ul>${S.cart.map((l,i)=>`<li><div style="flex:1">${esc(l.name)}<br><small class="muted">${mtxt(l.price)}</small></div>${l.kind==='PRODUCT'?`<span class="qty"><button data-a="dec" data-i="${i}" aria-label="أقل">−</button><span class="num">${l.qty}</span><button data-a="inc" data-i="${i}" aria-label="أكثر">+</button></span>`:''}<b>${money(l.price*l.qty)}</b><button class="btn sm" data-a="rm" data-i="${i}" aria-label="حذف">✕</button></li>`).join('')}</ul>`:'<div class="empty">السلة فارغة</div>'}
    <div class="row" style="margin-top:12px"><label class="f" style="flex:1;margin:0">خصم %<input type="number" min="0" max="100" data-in="disc" value="${S.disc||''}" placeholder="0"></label>
     <label class="f" style="flex:1;margin:0">طريقة الدفع<select data-in="pay"><option value="CASH" ${S.pay==='CASH'?'selected':''}>كاش</option><option value="CARD" ${S.pay==='CARD'?'selected':''}>فيزا</option><option value="WALLET" ${S.pay==='WALLET'?'selected':''}>محفظة إلكترونية</option><option value="INSTAPAY" ${S.pay==='INSTAPAY'?'selected':''}>إنستا باي</option></select></label></div>
    ${over?`<div class="note" style="margin-top:10px">الخصم أعلى من حد الريسبشن (${cap}%). يحتاج موافقة مدير فرع. <button class="btn sm" data-a="approve">${S.approved?'تمت الموافقة':'طلب موافقة'}</button></div>`:''}
    ${S.disc>0&&!over?`<div class="muted" style="font-size:13px;margin-top:8px">سيتم إشعار مدير الفرع بالخصم وتسجيله في سجل المراجعة.</div>`:''}
    <div class="totals" style="margin-top:12px"><div><span>الإجمالي</span><span>${money(T.sub)}</span></div>${T.d?`<div><span>الخصم</span><span>− ${money(T.d)}</span></div>`:''}<div class="grand"><span>المطلوب</span><span>${money(T.total)}</span></div></div>
    <button class="btn pri" style="width:100%;margin-top:12px;padding:12px" data-a="checkout" ${!S.cart.length?'disabled':''}>إصدار الإيصال</button>
   </div></div></div>`;
}
function receiptHTML(r){
  return `<div class="receipt"><h4>سكواد جيم</h4><div class="c">${esc(r.br)} · إيصال <span class="num">${r.no}</span><br>${r.ts}${r.user?` · ${esc(r.user)}`:''}${r.member?`<br>العميل: ${esc(r.member)}`:'<br>عميل عابر'}</div>
   <table style="margin-top:8px"><tbody>${r.lines.map(l=>`<tr><td>${esc(l.name)}${l.qty>1?` ×${l.qty}`:''}</td><td style="text-align:end">${money(l.price*l.qty)}</td></tr>`).join('')}</tbody></table>
   ${r.d?`<div class="c" style="margin-top:6px;display:flex;justify-content:space-between"><span>خصم ${r.disc}%</span><span>− ${money(r.d)}</span></div>`:''}
   <div class="t"><span>الإجمالي</span><span>${money(r.total)}</span></div><div class="c" style="margin-top:6px">الدفع: ${({CASH:'كاش',CARD:'فيزا',WALLET:'محفظة إلكترونية',INSTAPAY:'إنستا باي'})[r.pay]}</div></div>`;
}

/* ---- shift ---- */
function shiftView(){
  if(!S.shift){
    return `<div class="grid g2"><div class="card"><header><h2>فتح وردية</h2></header><div class="body">
     <p class="muted">الوردية تُفتح وتُقفل يدويًا (وليس بالساعة) لأن الجيم يعمل 24 ساعة. ويُسمح بوردية واحدة مفتوحة فقط في الفرع.</p>
     <label class="f">عهدة الدرج (الكاش الموجود الآن)<input id="openCash" type="number" min="0" value="${S.shifts[0]?S.shifts[0].cnt:0}"></label>
     <button class="btn pri" data-a="openShift">فتح الوردية باسم ${A().n}</button></div></div>${shiftHistory()}</div>`;
  }
  const sh=S.shift, exp=sh.open+sh.cash;
  const by={};S.sales.filter(s=>s.shift===sh.id).forEach(s=>by[s.pay]=(by[s.pay]||0)+s.total);
  return `<div class="grid g2"><div class="card"><header><h2>وردية مفتوحة منذ ${sh.since}</h2></header><div class="body">
   <dl class="kv"><dt>عهدة الفتح</dt><dd>${money(sh.open)}</dd><dt>مبيعات كاش</dt><dd>${money(sh.cash)}</dd><dt>الكاش المتوقع</dt><dd><b>${money(exp)}</b></dd>
   ${Object.keys(by).map(k=>`<dt>${({CASH:'كاش',CARD:'فيزا',WALLET:'محفظة',INSTAPAY:'إنستا باي'})[k]}</dt><dd>${money(by[k])}</dd>`).join('')}</dl><hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
   <label class="f">العدّ الفعلي للكاش في الدرج<input id="cnt" type="number" min="0" placeholder="${exp}"></label>
   <button class="btn pri" data-a="closeShift">قفل الوردية</button></div></div>${shiftHistory()}</div>`;
}
function shiftHistory(){
  return `<div class="card"><header><h2>آخر الورديات</h2></header><div class="tw"><table><thead><tr><th>الموظف</th><th>الفتح</th><th>المتوقع</th><th>الفعلي</th><th>الفرق</th></tr></thead><tbody>${S.shifts.map(s=>{const v=s.cnt-s.exp;return `<tr><td>${esc(s.by)}</td><td>${esc(s.open)}</td><td>${money(s.exp)}</td><td>${money(s.cnt)}</td><td><span class="badge ${v===0?'ok':'bad'}">${v===0?'مطابق':(v>0?'زيادة ':'عجز ')+Math.abs(v)}</span></td></tr>`}).join('')}</tbody></table></div></div>`;
}

/* ---- inventory ---- */
function inventory(){
  const tabs=[['stock','المخزون والدفعات'],['transfers','التحويلات'],['po','أوامر الشراء']];
  const loc=S.invLoc==='central'?'C':S.branch;
  let body='';
  if(S.tab.inv==='stock'){
    body=`<div class="row" style="margin-bottom:12px"><label class="muted" style="font-size:13px">الموقع <select class="sel" data-in="invLoc"><option value="central" ${S.invLoc==='central'?'selected':''}>المخزن المركزي</option><option value="branch" ${S.invLoc==='branch'?'selected':''}>${brName(S.branch)}</option></select></label>
     <span class="muted" style="font-size:13px">البيع والتحويل يخصمان من أقرب دفعة انتهاءً أولًا (FEFO).</span></div>
     <div class="card"><div class="tw"><table><thead><tr><th>المنتج</th><th>الكمية الصالحة</th><th>الحد الأدنى</th><th>الدفعات (الأقرب انتهاءً أولًا)</th></tr></thead><tbody>
     ${PRODUCTS.map(p=>{const bs=stockOf(loc,p.id).slice().sort((a,b)=>a.exp-b.exp),q=sellable(loc,p.id);return `<tr><td><b>${p.name}</b><br><small class="muted">${p.cat}</small></td><td><span class="badge ${q<=p.min?'bad':'ok'}">${num(q)}</span></td><td>${num(p.min)}</td><td>${bs.map(b=>`<span class="badge ${b.exp<0?'bad':b.exp<=30?'warn':''}" style="margin:2px">${num(b.qty)} · ${b.exp<0?'منتهية':b.exp<=30?`تنتهي بعد ${b.exp} يوم`:fmtD(addD(b.exp))}</span>`).join('')}</td></tr>`}).join('')}
     </tbody></table></div></div>`;
  }
  if(S.tab.inv==='transfers'){
    const stName={REQUESTED:['طلب توريد','warn'],APPROVED:['موافَق عليه','info'],DISPATCHED:['تم الصرف من المخزن','info'],RECEIVED:['تم الاستلام','ok']};
    body=`<div class="card"><header><h2>طلبات التوريد والتحويلات</h2><button class="btn" data-a="newTransfer">طلب توريد جديد</button></header><div class="tw"><table><thead><tr><th>الرقم</th><th>الفرع</th><th>الأصناف</th><th>الحالة</th><th></th></tr></thead><tbody>
    ${S.transfers.map(t=>{const s=stName[t.st];const nxt={REQUESTED:'موافقة',APPROVED:'تنفيذ التحويل',DISPATCHED:'تأكيد الاستلام'}[t.st];return `<tr><td><span class="num">${t.id}</span></td><td>${brName(t.br)}</td><td>${t.items}</td><td><span class="badge ${s[1]}">${s[0]}</span></td><td>${nxt?`<button class="btn sm" data-a="advTransfer" data-id="${t.id}">${nxt}</button>`:''}</td></tr>`}).join('')}</tbody></table></div></div>`;
  }
  if(S.tab.inv==='po'){
    body=`<div class="card"><header><h2>أوامر الشراء (المخزن المركزي)</h2><button class="btn" data-a="toast" data-t="إنشاء أمر شراء جديد (غير مفعّل في النموذج)">أمر شراء جديد</button></header><div class="tw"><table><thead><tr><th>الرقم</th><th>المورد</th><th>الأصناف</th><th>الاستلام</th><th>الحالة</th><th></th></tr></thead><tbody>
    ${S.pos_orders.map(o=>`<tr><td><span class="num">${o.id}</span></td><td>${o.sup}</td><td>${o.items}</td><td>${o.recv}</td><td><span class="badge ${o.st==='CLOSED'?'ok':o.st==='PARTIAL'?'warn':'info'}">${({ORDERED:'تم الطلب',PARTIAL:'استلام جزئي',CLOSED:'مكتمل'})[o.st]}</span></td><td>${o.st!=='CLOSED'?`<button class="btn sm" data-a="recvPO" data-id="${o.id}">استلام</button>`:''}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="note" style="margin-top:12px">عند الاستلام يُسجَّل لكل دفعة: الكمية الفعلية، تاريخ الصلاحية، وسعر الشراء. الدفع للموردين كاش (لا يوجد رصيد موردين).</div>`;
  }
  return `<div class="tabs" role="tablist">${tabs.map(([k,t])=>`<button role="tab" aria-selected="${S.tab.inv===k}" data-a="tab" data-g="inv" data-k="${k}">${t}</button>`).join('')}</div>${body}`;
}

/* ---- maintenance ---- */
function maintenance(){
  const tabs=[['assets','الأجهزة'],['tickets','بلاغات الأعطال'],['sched','الصيانة الدورية']];
  const stA={ACTIVE:['يعمل','ok'],MAINT:['تحت الصيانة','warn'],OUT:['خارج الخدمة','bad']};
  let body='';
  if(S.tab.mnt==='assets')body=`<div class="card"><div class="tw"><table><thead><tr><th>الجهاز</th><th>الفرع</th><th>تاريخ الشراء</th><th>الحالة</th></tr></thead><tbody>${S.assets.map(a=>`<tr><td><b>${a.name}</b></td><td>${brName(a.br)}</td><td>${a.bought}</td><td><span class="badge ${stA[a.st][1]}">${stA[a.st][0]}</span></td></tr>`).join('')}</tbody></table></div></div>`;
  if(S.tab.mnt==='tickets'){
    const col=(k,t)=>`<div><h3>${t}</h3>${S.tickets.filter(x=>x.st===k).map(x=>{const a=S.assets.find(a=>a.id===x.asset);return `<div class="tk"><b>${a.name}</b> <span class="muted">· ${brName(a.br)}</span><br>${esc(x.desc)}${x.tech?`<br><small class="muted">الفني: ${x.tech}${x.cost?` · التكلفة ${mtxt(x.cost)}`:''}</small>`:''}${k!=='DONE'?`<div style="margin-top:8px"><button class="btn sm" data-a="advTicket" data-id="${x.id}">${k==='OPEN'?'بدء الصيانة':'تم الإصلاح'}</button></div>`:''}</div>`}).join('')||'<div class="muted" style="font-size:13px">لا يوجد</div>'}</div>`;
    body=`<div class="row" style="margin-bottom:12px"><button class="btn pri" data-a="newTicket">بلاغ جديد</button></div><div class="kan">${col('OPEN','مفتوح')}${col('PROG','تحت الصيانة')}${col('DONE','تم')}</div>`;
  }
  if(S.tab.mnt==='sched')body=`<div class="card"><div class="tw"><table><thead><tr><th>الجهاز</th><th>المهمة</th><th>كل</th><th>الموعد القادم</th><th>الحالة</th></tr></thead><tbody>${S.sched.map(s=>{const a=S.assets.find(a=>a.id===s.asset),due=s.last+s.every,left=due;return `<tr><td>${a.name}</td><td>${s.task}</td><td>${num(s.every)} يوم</td><td>${fmtD(addD(due))}</td><td><span class="badge ${left<0?'bad':left<=7?'warn':'ok'}">${left<0?`متأخرة ${-left} يوم`:left<=7?`بعد ${left} أيام`:'في الموعد'}</span></td></tr>`}).join('')}</tbody></table></div></div>`;
  return `<div class="tabs" role="tablist">${tabs.map(([k,t])=>`<button role="tab" aria-selected="${S.tab.mnt===k}" data-a="tab" data-g="mnt" data-k="${k}">${t}</button>`).join('')}</div>${body}`;
}

/* ---- expenses ---- */
function expensesV(){
  const list=S.expenses.filter(e=>e.br===S.branch||S.role==='OWNER'||S.role==='ACCOUNTANT');
  return `<div class="grid g2"><div class="card"><header><h2>مصروفات ${S.role==='OWNER'||S.role==='ACCOUNTANT'?'كل الفروع':brName(S.branch)}</h2></header><div class="tw"><table><thead><tr><th>التاريخ</th><th>الفرع</th><th>التصنيف</th><th>المبلغ</th><th>الدفع</th></tr></thead><tbody>${list.map(e=>`<tr><td>${fmtD(addD(e.d))}</td><td>${brName(e.br)}</td><td>${e.cat}</td><td>${money(e.amt)}</td><td>${e.m}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="card"><header><h2>تسجيل مصروف</h2></header><div class="body">${S.role==='ACCOUNTANT'?'<div class="note">دور المحاسب للقراءة فقط.</div>':''}
   <label class="f">التصنيف<select id="eCat">${['إيجار','كهرباء','مياه','نظافة','رواتب (إجمالي)','تسويق','أخرى'].map(c=>`<option>${c}</option>`).join('')}</select></label>
   <label class="f">المبلغ (ج.م)<input id="eAmt" type="number" min="0"></label>
   <label class="f">طريقة الدفع<select id="eM"><option>كاش</option><option>فيزا</option><option>تحويل بنكي</option><option>محفظة</option></select></label>
   <button class="btn pri" data-a="addExp" ${S.role==='ACCOUNTANT'?'disabled':''}>حفظ المصروف</button></div></div></div>`;
}

/* ---- reports ---- */
const REP=[{b:1,subs:184000,prod:38000,exp:62000,mnt:4200},{b:2,subs:142000,prod:31000,exp:51000,mnt:2800},{b:3,subs:97000,prod:18000,exp:38000,mnt:1500},{b:4,subs:76000,prod:14000,exp:31000,mnt:900},{b:5,subs:61000,prod:11000,exp:26000,mnt:600}];
function reports(){
  const rows=REP.filter(r=>S.role==='BRANCH_MANAGER'?r.b===S.branch:true).map(r=>({...r,rev:r.subs+r.prod,cogs:r.prod*.6,net:r.subs+r.prod-r.prod*.6-r.exp-r.mnt}));
  const mx=Math.max(...rows.map(r=>r.rev));
  const tot=k=>rows.reduce((a,r)=>a+r[k],0);
  return `<div class="note" style="background:var(--info-bg);color:var(--info)">أرقام تجريبية للشهر الحالي. ${S.role==='BRANCH_MANAGER'?'مدير الفرع يرى فرعه فقط.':'المالك والمحاسب يريان كل الفروع.'}</div>
  <div class="strip"><div><small>إجمالي الإيرادات</small><b>${money(tot('rev'))}</b></div><div><small>المصروفات</small><b>${money(tot('exp'))}</b></div><div><small>تكلفة الصيانة</small><b>${money(tot('mnt'))}</b></div><div><small>صافي الربح</small><b>${money(tot('net'))}</b></div></div>
  <div class="grid g2"><div class="card"><header><h2>الإيرادات حسب الفرع (اشتراكات / منتجات)</h2><button class="btn sm" data-a="export">تصدير Excel</button></header><div class="body">
   ${rows.map(r=>`<div class="hb"><span>${brName(r.b)}</span><div class="tr"><i style="width:${r.subs/mx*100}%;background:var(--brand)"></i><i style="width:${r.prod/mx*100}%;background:var(--tape)"></i></div><b>${money(r.rev)}</b></div>`).join('')}
   <div class="row muted" style="font-size:13px;margin-top:8px"><span><i class="dot" style="color:var(--brand)"></i> اشتراكات</span><span><i class="dot" style="color:var(--tape)"></i> منتجات</span></div></div></div>
  <div class="card"><header><h2>حسب طريقة الدفع</h2><button class="btn sm" data-a="export">تصدير Excel</button></header><div class="body">
   ${[['كاش',46],['فيزا',22],['محفظة إلكترونية',20],['إنستا باي',12]].map(([n,v])=>`<div class="hb"><span>${n}</span><div class="tr"><i style="width:${v}%;background:var(--brand)"></i></div><b>${v}%</b></div>`).join('')}</div></div></div>
  <div class="card" style="margin-top:16px"><header><h2>صافي الربح لكل فرع</h2><button class="btn sm" data-a="export">تصدير Excel</button></header><div class="tw"><table><thead><tr><th>الفرع</th><th>الإيراد</th><th>تكلفة المنتجات المباعة</th><th>المصروفات</th><th>الصيانة</th><th>الصافي</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${brName(r.b)}</td><td>${money(r.rev)}</td><td>${money(r.cogs)}</td><td>${money(r.exp)}</td><td>${money(r.mnt)}</td><td><b>${money(r.net)}</b></td></tr>`).join('')}</tbody></table></div></div>
  <div class="card" style="margin-top:16px"><header><h2>خصومات الريسبشن هذا الشهر</h2></header><div class="tw"><table><thead><tr><th>الموظف</th><th>عدد الخصومات</th><th>إجمالي الخصم</th></tr></thead><tbody><tr><td>مروة سعيد</td><td>14</td><td>${money(1850)}</td></tr><tr><td>إيهاب علي</td><td>3</td><td>${money(240)}</td></tr></tbody></table></div></div>`;
}

/* ---- settings ---- */
function settings(){
  const tabs=[['license','الترخيص'],['users','المستخدمون والأمان'],['backup','النسخ الاحتياطي']];
  let body='';
  if(S.tab.set==='license')body=`<div class="grid g2"><div class="card"><header><h2>حالة الترخيص</h2><span class="badge ok">صالح</span></header><div class="body"><dl class="kv"><dt>رقم الترخيص</dt><dd><span class="num">SG-2026-0001</span></dd><dt>الجيم</dt><dd>سكواد جيم</dd><dt>الدومين</dt><dd><span class="num">app.squadgym.example</span></dd><dt>أقصى عدد فروع</dt><dd>${num(5)} (مستخدم ${num(BR.length)})</dd><dt>الانتهاء</dt><dd>دائم</dd></dl>
   <label class="f" style="margin-top:14px">مفتاح الترخيص (نص موقّع رقميًا)<textarea rows="3" readonly dir="ltr" style="font-family:monospace;font-size:12px">eyJsaWNlbnNlX2lkIjoiU0ctMjAyNi0wMDAxIiwibW9kdWxlcyI6WyJjb3JlIiwi...vK3x9Qm2.Zk8Hs0Lq1w7TnXa3c</textarea></label>
   <button class="btn" data-a="toast" data-t="تغيير المفتاح يتم بلصق مفتاح جديد من المطوّر (غير مفعّل في النموذج)">تغيير الترخيص</button></div></div>
   <div class="card"><header><h2>الموديولات</h2></header><div class="body">${MODS.map(([k,n])=>`<div class="row" style="padding:5px 0;justify-content:space-between"><span>${n}</span><span class="badge ${S.mods[k]?'ok':''}">${S.mods[k]?'مفعّل':'غير مرخّص'}</span></div>`).join('')}<div class="note" style="margin-top:12px">غير المرخّص: الصفحات ترجع "غير مسموح"، والقوائم تُخفى، والمنطق يرفض التنفيذ. البيانات تبقى محفوظة.</div></div></div></div>`;
  if(S.tab.set==='users')body=`<div class="card"><header><h2>المستخدمون</h2><button class="btn" data-a="toast" data-t="إضافة مستخدم (غير مفعّل في النموذج)">مستخدم جديد</button></header><div class="tw"><table><thead><tr><th>الاسم</th><th>الدور</th><th>الفرع</th><th>2FA</th><th>آخر دخول</th><th></th></tr></thead><tbody>
   ${[['محمد (المالك)','OWNER','الكل',true,'اليوم 09:12'],['أحلام (مدير فرع الزقازيق)','BRANCH_MANAGER','فرع الزقازيق',true,'اليوم 08:40'],['مروة سعيد','RECEPTIONIST','فرع الزقازيق',false,'اليوم 07:55'],['إيهاب علي','RECEPTIONIST','فرع العاشر',false,'أمس 23:58'],['سيد (أمين المخزن)','WAREHOUSE_KEEPER','المركزي',false,'أمس 14:20'],['م. وائل','TECHNICIAN','الكل',false,'قبل يومين'],['هالة (المحاسبة)','ACCOUNTANT','الكل',true,'أمس 16:05']].map(u=>`<tr><td>${u[0]}</td><td>${ROLES[u[1]].n}</td><td>${u[2]}</td><td>${['OWNER','BRANCH_MANAGER','ACCOUNTANT'].includes(u[1])?'<span class="badge ok">إلزامي · مفعّل</span>':'<span class="badge">غير مطلوب</span>'}</td><td>${u[4]}</td><td><button class="btn sm" data-a="toast" data-t="إعادة ضبط كلمة المرور بيد المالك فقط">إعادة ضبط</button> <button class="btn sm bad" data-a="toast" data-t="تم إيقاف الحساب وقطع جلساته (تجريبي)">إيقاف</button></td></tr>`).join('')}</tbody></table></div></div>
   <div class="card" style="margin-top:16px"><header><h2>سياسات الأمان</h2></header><div class="body"><ul style="margin:0;padding-inline-start:20px;line-height:2"><li>كلمة المرور 10 حروف على الأقل، وقفل مؤقت بعد 5 محاولات فاشلة.</li><li>جلسة الريسبشن تنتهي بعد 30 دقيقة خمول، وبدون "تذكّرني".</li><li>الدخول مسموح من أي مكان، مع إشعار للمالك عند دخول مدير من جهاز جديد.</li><li>إعادة ضبط كلمات المرور بيد المالك فقط.</li></ul></div></div>`;
  if(S.tab.set==='backup')body=`<div class="card"><header><h2>النسخ الاحتياطي</h2><span class="badge ok">آخر نسخة ناجحة: اليوم 03:00</span></header><div class="body"><p class="muted">نسخة يومية تلقائية للقاعدة، ويُحتفظ بآخر 14 نسخة. تنزيل نسخة خارج الاستضافة مسؤولية الجيم.</p><div class="row"><button class="btn pri" data-a="toast" data-t="جارٍ إنشاء نسخة احتياطية (تجريبي)">نسخة الآن</button><button class="btn" data-a="toast" data-t="تنزيل آخر نسخة (تجريبي)">تنزيل آخر نسخة</button></div>
   <dl class="kv" style="margin-top:16px"><dt>إصدار النظام</dt><dd><span class="num">1.0.0</span></dd><dt>آخر تشغيل للـ cron</dt><dd>منذ دقيقة</dd><dt>PHP</dt><dd><span class="num">8.2</span></dd></dl></div></div>`;
  return `<div class="tabs" role="tablist">${tabs.map(([k,t])=>`<button role="tab" aria-selected="${S.tab.set===k}" data-a="tab" data-g="set" data-k="${k}">${t}</button>`).join('')}</div>${body}`;
}

const VIEWS={dashboard,checkin,members,plans,pos,shift:shiftView,inventory,maintenance,expenses:expensesV,reports,settings};

/* ========= render ========= */
const app=document.getElementById('app');
function modalHTML(){
  const m=S.modal; if(!m)return '';
  return `<div class="ov" data-a="ovClick"><div class="modal ${m.wide?'wide':''}" role="dialog" aria-modal="true" aria-label="${esc(m.title)}"><header><h3>${esc(m.title)}</h3><button class="btn sm" data-a="closeModal" aria-label="إغلاق">✕</button></header><div class="mb">${m.body}</div>${m.foot?`<footer>${m.foot}</footer>`:''}</div></div>`;
}
function render(){
  const ae=document.activeElement, fid=ae&&ae.id, ss=ae&&ae.selectionStart;
  let view;
  if(!screenAllowed(S.screen))view=locked('role');
  else if(!screenLicensed(S.screen))view=locked('license');
  else view=VIEWS[S.screen]();
  app.innerHTML=demoBar()+`<div class="shell"><aside class="side ${S.navOpen?'open':''}"><div class="logo"><strong>سكواد جيم</strong><span>نظام إدارة الجيم</span></div><nav class="nav" aria-label="القائمة الرئيسية">${nav()}</nav><div class="side-foot">${esc(A().n)}<br><span class="muted" style="color:inherit;opacity:.7">${brName(S.branch)}</span></div></aside>
  <main>${top()}<section class="content">${view}</section></main></div>${modalHTML()}<div class="toasts" aria-live="polite">${S.toasts.map(t=>`<div class="toast">${esc(t.t)}</div>`).join('')}</div>`;
  if(fid){const el=document.getElementById(fid);if(el){el.focus();try{if(ss!=null&&el.setSelectionRange&&el.type!=='number'&&el.type!=='search')el.setSelectionRange(ss,ss);else if(ss!=null&&el.type==='search')el.setSelectionRange(ss,ss)}catch(e){}}}
  else if(S.screen==='checkin'&&!S.modal){const el=document.getElementById('scan');if(el)el.focus()}
}
function openModal(o){S.modal=o;render()}
function closeModal(){S.modal=null;render()}
function goHome(){S.screen=A().s.find(k=>screenLicensed(k))||'dashboard';S.navOpen=false;render()}

/* ========= actions ========= */
const act={
  go:d=>{S.screen=d.k;S.navOpen=false;S.bellOpen=false;render()},
  goHome,burger:()=>{S.navOpen=!S.navOpen;render()},
  toggleMods:()=>{S.modsOpen=!S.modsOpen;render()},
  bell:()=>{S.bellOpen=!S.bellOpen;render()},
  readAll:()=>{S.notifs.forEach(n=>n.read=true);render()},
  reset:()=>location.reload(),
  toast:d=>toast(d.t),
  tab:d=>{S.tab[d.g]=d.k;render()},
  closeModal,
  ovClick:(d,e)=>{if(e.target.classList.contains('ov'))closeModal()},
  scan:()=>{
    if(!S.scan.trim())return;
    const r=findMembers(S.scan);
    if(!r.length){S.last=null;S.cands=null;toast('لا يوجد عضو بهذه البيانات');render();return}
    if(r.length>1){S.cands=r;render();return}
    doCheckin(r[0]);
  },
  pick:d=>doCheckin(S.members.find(m=>m.id===+d.id)),
  chip:d=>{S.scan=d.c;act.scan()},
  override:()=>{
    openModal({title:'سماح استثنائي بالدخول',body:`<p class="muted">سيُسجَّل السماح مع السبب ويصل إشعار لمدير الفرع.</p><label class="f">السبب (إلزامي)<textarea id="ovr" rows="3" placeholder="اكتب السبب"></textarea></label>`,foot:`<button class="btn pri" data-a="confirmOverride">تأكيد السماح</button><button class="btn" data-a="closeModal">إلغاء</button>`});
  },
  confirmOverride:()=>{
    const v=document.getElementById('ovr').value.trim(); if(!v){toast('اكتب السبب أولًا');return}
    const L=S.last; L.override=true; L.res={...L.res,r:'ok',why:'سماح استثنائي: '+v};
    S.checkins.unshift({m:L.m,res:L.res,at:new Date(),br:S.branch,override:true});
    notify(`سماح استثنائي للعضو ${L.m.no} (السبب: ${v})`);
    S.modal=null;toast('تم تسجيل السماح وإشعار المدير');render();
  },
  viewMember:d=>openModal(memberModal(S.members.find(m=>m.id===+d.id))),
  newMember:()=>{
    if(!guard())return;
    openModal({title:'عضو جديد',body:`<label class="f">الاسم<input id="nmName" type="text"></label><label class="f">الموبايل (فريد)<input id="nmPhone" type="text" dir="ltr" placeholder="01XXXXXXXXX"></label>
     <label class="f">مصدر المعرفة<select id="nmSrc"><option>إعلان</option><option>صديق</option><option>السوشيال ميديا</option><option>مرّ بالمكان</option><option>أخرى</option></select></label>
     <label class="f">ملاحظات صحية (اختيارية — بيانات حساسة، لا تسجّلها إلا للضرورة)<textarea id="nmHealth" rows="2"></textarea></label>
     <label class="row" style="margin-top:8px"><input type="checkbox" id="nmConsent"> تم أخذ موافقة العضو على معالجة بياناته الشخصية</label>`,
     foot:`<button class="btn pri" data-a="saveMember">حفظ العضو</button><button class="btn" data-a="closeModal">إلغاء</button>`});
  },
  saveMember:()=>{
    const n=document.getElementById('nmName').value.trim(),p=document.getElementById('nmPhone').value.trim();
    if(!n||!/^01\d{9}$/.test(p)){toast('اكتب الاسم وموبايل صحيح (11 رقم يبدأ بـ 01)');return}
    if(S.members.some(m=>m.phone===p)){toast('هذا الموبايل مسجّل لعضو آخر');return}
    if(!document.getElementById('nmConsent').checked){toast('لا يمكن الحفظ بدون موافقة العضو على معالجة بياناته');return}
    const id=Math.max(...S.members.map(m=>m.id))+1;
    S.members.unshift({id,no:'SG-'+(1000+id),name:n,phone:p,plan:1,br:S.branch,endD:addD(-1),frozen:null,consent:true,last:9999,wk:0,ftaken:0,noSub:true});
    S.modal=null;toast('تم تسجيل العضو. اضغط "عرض" ثم "تجديد" لبيع أول اشتراك');render();
  },
  importX:()=>openModal({title:'استيراد المشتركين من Excel',body:`<p>الأعمدة المطلوبة: الاسم، الموبايل، تاريخ انتهاء الاشتراك الحالي، الباقة، الفرع.</p><div class="note" style="background:var(--info-bg);color:var(--info)">سيُعرض لك معاينة قبل التأكيد، مع تقرير بالصفوف المرفوضة (موبايل مكرر، تاريخ غير صالح). الاستيراد لا يولّد إيرادًا ولا إيصالات.</div>`,foot:`<button class="btn" data-a="closeModal">إغلاق</button>`}),
  freezeOpen:d=>{
    const m=S.members.find(x=>x.id===+d.id),p=plan(m.plan);
    if(!guard())return;
    if(!p.fmax){toast('هذه الباقة لا تسمح بالتجميد');return}
    if(m.ftaken>=p.ftimes){toast(`تم استنفاد مرات التجميد المسموحة (${p.ftimes})`);return}
    openModal({title:'تجميد الاشتراك',body:`<p class="muted">الحد الأقصى لهذه الباقة ${p.fmax} يوم. أيام التجميد تُضاف تلقائيًا لتاريخ الانتهاء.</p><label class="f">عدد أيام التجميد<input id="fz" type="number" min="1" max="${p.fmax}" value="${Math.min(7,p.fmax)}"></label>`,foot:`<button class="btn pri" data-a="freezeGo" data-id="${m.id}">تجميد</button><button class="btn" data-a="closeModal">إلغاء</button>`});
  },
  freezeGo:d=>{
    const m=S.members.find(x=>x.id===+d.id),p=plan(m.plan),n=+document.getElementById('fz').value;
    if(!(n>=1&&n<=p.fmax)){toast(`المسموح من 1 إلى ${p.fmax} يوم`);return}
    m.frozen={from:base,to:addD(n)};m.endD=addD(n,m.endD);m.ftaken++;
    S.modal=null;toast(`تم التجميد ${n} يوم. تاريخ الانتهاء الجديد ${fmtD(m.endD)}`);render();
  },
  cardOpen:d=>{
    const m=S.members.find(x=>x.id===+d.id);
    openModal({title:'كارت العضوية (معاينة للطباعة)',body:`<div class="idcard"><div class="r"><div style="flex:1"><b style="font-size:18px">${esc(m.name)}</b><br><span class="num" style="opacity:.8">${m.no}</span><br><small style="opacity:.7">سكواد جيم</small></div>${fakeQR(m.no)}</div></div>`,foot:`<button class="btn pri" data-a="toast" data-t="إرسال للطابعة (تجريبي)">طباعة</button><button class="btn" data-a="closeModal">إغلاق</button>`});
  },
  renewGo:d=>{S.posMember=d.id;S.tab.pos='sub';S.screen='pos';S.modal=null;render()},

  /* POS */
  addProd:d=>{
    const p=PRODUCTS.find(x=>x.id===+d.id),l=S.cart.find(x=>x.kind==='PRODUCT'&&x.pid===p.id);
    const q=(l?l.qty:0)+1; if(q>sellable(S.branch,p.id)){toast('الكمية المطلوبة أكبر من المتاح');return}
    if(l)l.qty++;else S.cart.push({kind:'PRODUCT',pid:p.id,name:p.name,price:p.price,qty:1});render();
  },
  addSub:()=>{
    const p=plan(+S.posPlan),m=S.members.find(x=>String(x.id)===String(S.posMember));
    if(!m&&p.id!==6){toast('اختر العضو أولًا (العميل العابر للتذكرة اليومية فقط)');return}
    S.cart=S.cart.filter(l=>l.kind==='PRODUCT');
    S.cart.push({kind:'SUB',planId:p.id,memberId:m?m.id:null,name:`${p.name}${m?' — '+m.name:' — عميل عابر'}`,price:p.price,qty:1});
    if(m&&m.noSub&&p.fee)S.cart.push({kind:'FEE',name:'رسوم تسجيل (أول اشتراك)',price:p.fee,qty:1});
    render();
  },
  inc:d=>{const l=S.cart[+d.i];if(l.qty+1>sellable(S.branch,l.pid)){toast('لا يوجد مخزون كافٍ');return}l.qty++;render()},
  dec:d=>{const l=S.cart[+d.i];l.qty--;if(l.qty<=0)S.cart.splice(+d.i,1);render()},
  rm:d=>{S.cart.splice(+d.i,1);render()},
  clearCart:()=>{S.cart=[];S.disc=0;S.approved=false;render()},
  approve:()=>{S.approved=true;toast('تمت الموافقة (محاكاة موافقة مدير الفرع)');render()},
  checkout:()=>{
    if(!guard())return;
    const T=posTotals();
    if(S.role==='RECEPTIONIST'&&S.disc>20&&!S.approved){toast('الخصم أعلى من 20%: يحتاج موافقة مدير فرع');return}
    if(S.pay==='CASH'&&!S.shift){toast('لا توجد وردية مفتوحة. افتح وردية أولًا من صفحة الوردية');return}
    const no=`${BR.find(b=>b.id===S.branch).code}-${String(++S.receiptNo[S.branch]).padStart(6,'0')}`;
    S.cart.filter(l=>l.kind==='PRODUCT').forEach(l=>deductFEFO(S.branch,l.pid,l.qty));
    let mem=null;
    S.cart.filter(l=>l.kind==='SUB').forEach(l=>{
      const p=plan(l.planId); if(!l.memberId)return;
      const m=S.members.find(x=>x.id===l.memberId),rd=renewDates(m,p);
      m.plan=p.id;m.endD=rd.end;m.br=S.branch;m.noSub=false;m.frozen=null;m.ftaken=0;m.wk=0;mem=m.name;
    });
    const r={no,br:brName(S.branch),ts:new Date().toLocaleString('ar-EG-u-nu-latn',{dateStyle:'medium',timeStyle:'short'}),user:A().n,member:mem,lines:S.cart.map(l=>({...l})),disc:S.disc||0,d:T.d,total:T.total,pay:S.pay};
    S.sales.push({br:S.branch,total:T.total,pay:S.pay,shift:S.shift?S.shift.id:null});
    if(S.pay==='CASH'&&S.shift)S.shift.cash+=T.total;
    if(S.disc>0)notify(`خصم ${S.disc}% على الإيصال ${no} من ${A().n}`);
    S.cart=[];S.disc=0;S.approved=false;S.posMember='';
    const phone=(S.members.find(m=>m.name===mem)||{}).phone;
    const msg=`إيصال سكواد جيم رقم ${no} بقيمة ${mtxt(T.total)}: https://app.squadgym.example/r/9f3c1a7e5b2d`;
    openModal({title:`تم إصدار الإيصال ${no}`,body:receiptHTML(r),foot:`<a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/${phone?'2'+phone:''}?text=${encodeURIComponent(msg)}">إرسال عبر واتساب</a><button class="btn" data-a="toast" data-t="تنزيل PDF (تجريبي)">تنزيل PDF</button><button class="btn" data-a="closeModal">إغلاق</button>`});
  },

  /* shift */
  openShift:()=>{
    if(!guard())return;
    const v=+document.getElementById('openCash').value||0;
    S.shift={id:Date.now(),open:v,cash:0,since:hhmm(new Date())};toast('تم فتح الوردية');render();
  },
  closeShift:()=>{
    const el=document.getElementById('cnt');if(!el.value){toast('اكتب العدّ الفعلي للكاش');return}
    const cnt=+el.value,sh=S.shift,exp=sh.open+sh.cash,v=cnt-exp;
    S.shifts.unshift({by:A().n,br:S.branch,open:`اليوم ${sh.since}`,cash:sh.open,exp,cnt});
    if(v!==0)notify(`${v<0?'عجز':'زيادة'} ${Math.abs(v)} ج.م في تقفيل الوردية`);
    S.shift=null;toast(v===0?'تم القفل: الكاش مطابق':`تم القفل مع ${v<0?'عجز':'زيادة'} ${Math.abs(v)} ج.م وإشعار للمدير`);render();
  },

  /* inventory */
  advTransfer:d=>{
    if(!guard())return;
    const t=S.transfers.find(x=>x.id===d.id);t.st={REQUESTED:'APPROVED',APPROVED:'DISPATCHED',DISPATCHED:'RECEIVED'}[t.st];
    toast('تم تحديث حالة التحويل');render();
  },
  newTransfer:()=>{if(!guard())return;S.transfers.unshift({id:'T-'+(22+S.transfers.length-3),br:S.branch,items:'مياه 600 مل ×60 (مثال)',st:'REQUESTED'});notify('طلب توريد جديد من '+brName(S.branch),'المخزن المركزي');toast('تم إرسال طلب التوريد');render()},
  recvPO:d=>{
    if(!guard())return;
    const o=S.pos_orders.find(x=>x.id===d.id);o.st=o.st==='ORDERED'?'PARTIAL':'CLOSED';o.recv=o.st==='CLOSED'?'مكتمل':'جزئي';toast('تم تسجيل الاستلام بالدفعة وتاريخ الصلاحية وسعر الشراء');render();
  },

  /* maintenance */
  advTicket:d=>{
    if(!guard())return;
    const t=S.tickets.find(x=>x.id===+d.id),a=S.assets.find(x=>x.id===t.asset);
    if(t.st==='OPEN'){t.st='PROG';t.tech='م. وائل';a.st='MAINT';}
    else{t.st='DONE';t.cost=t.cost||200;a.st='ACTIVE';}
    toast('تم تحديث البلاغ');render();
  },
  newTicket:()=>{
    if(!guard())return;
    openModal({title:'بلاغ عطل جديد',body:`<label class="f">الجهاز<select id="tkA">${S.assets.map(a=>`<option value="${a.id}">${a.name} — ${brName(a.br)}</option>`).join('')}</select></label><label class="f">وصف العطل<textarea id="tkD" rows="3"></textarea></label><label class="row"><input type="checkbox" id="tkO"> إيقاف الجهاز (خارج الخدمة)</label>`,foot:`<button class="btn pri" data-a="saveTicket">حفظ البلاغ</button><button class="btn" data-a="closeModal">إلغاء</button>`});
  },
  saveTicket:()=>{
    const d=document.getElementById('tkD').value.trim(); if(!d){toast('اكتب وصف العطل');return}
    const aid=+document.getElementById('tkA').value;
    S.tickets.push({id:S.tickets.length+1,asset:aid,desc:d,st:'OPEN',tech:'',cost:0});
    if(document.getElementById('tkO').checked)S.assets.find(a=>a.id===aid).st='OUT';
    notify('بلاغ عطل جديد: '+d);S.modal=null;toast('تم فتح البلاغ');render();
  },

  /* expenses + reports */
  addExp:()=>{
    if(!guard())return;
    const amt=+document.getElementById('eAmt').value;if(!(amt>0)){toast('اكتب مبلغًا صحيحًا');return}
    S.expenses.unshift({d:0,br:S.branch,cat:document.getElementById('eCat').value,amt,m:document.getElementById('eM').value});toast('تم تسجيل المصروف');render();
  },
  export:()=>toast('تم تصدير ملف Excel (محاكاة)')
};

/* ========= events ========= */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-a]'); if(!el)return;
  if(el.dataset.a==='ovClick'&&e.target!==el)return;
  const f=act[el.dataset.a]; if(f){if(el.tagName==='A'&&el.dataset.a)e.preventDefault&&0;f(el.dataset,e)}
});
function onInput(e){
  const el=e.target; const k=el.dataset&&el.dataset.in; if(!k)return;
  const isText=(el.tagName==='INPUT'&&['text','search','number'].includes(el.type))||el.tagName==='TEXTAREA';
  if(e.type==='input'&&!isText)return;
  if(e.type==='change'&&isText)return;
  const v=el.type==='checkbox'?el.checked:el.value;
  if(k==='role'){S.role=v;S.navOpen=false;S.bellOpen=false;if(!screenAllowed(S.screen)||!screenLicensed(S.screen))goHome();else render()}
  else if(k==='mod'){S.mods[el.dataset.k]=v;if(!v&&(el.dataset.k==='inventory'&&S.mods.inventory===false)){}
    if(el.dataset.k==='pos_finance'&&!v){S.mods.inventory=false}
    render()}
  else if(k==='branch'){S.branch=+v;S.last=null;render()}
  else if(k==='scan'){S.scan=v}
  else if(k==='simHour'){S.simHour=+v;render()}
  else if(k==='disc'){S.disc=Math.max(0,Math.min(100,+v||0));S.approved=false;render()}
  else if(k==='invLoc'||k==='pay'||k==='posMember'||k==='posPlan'||k==='mq'||k==='mf'||k==='pq'){S[k]=v;render()}
}
document.addEventListener('input',onInput);
document.addEventListener('change',onInput);
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.id==='scan'){e.preventDefault();act.scan()}
  if(e.key==='Escape'){if(S.modal)closeModal();else if(S.modsOpen||S.bellOpen){S.modsOpen=false;S.bellOpen=false;render()}}
});
render();
})();
