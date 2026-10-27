const $=id=>document.getElementById(id);
const DEF="كيرلس سامح عيد";
let data={},cfg={},prev={},wasPos=false,punchT=null;
const wd=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const f=n=>(Math.round(n*100)/100).toString();
function load(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const keyFor=ym=>"p3:"+ym+":"+cfg.start+":"+cfg.end;
const K=()=>keyFor($("month").value);
const isOff=d=>cfg.wk!=="0"&&cfg.wk.includes(String(d.getDay()));
const fm=d=>d.toLocaleDateString("ar-EG",{day:"numeric",month:"long"});
const dm=(y,m)=>new Date(y,m,0).getDate();
const at=(s,i)=>new Date(s.getFullYear(),s.getMonth(),s.getDate()+i);
function toast(t){const e=$("toast");e.textContent=t;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2400)}
function bounds(ym,sd=cfg.start,ed=cfg.end){
  const [y,m]=ym.split("-").map(Number);
  const s=new Date(y,m-1,Math.min(sd,dm(y,m)));
  const e=ed<=sd?new Date(y,m,Math.min(ed,dm(y,m+1))):new Date(y,m-1,Math.min(ed,dm(y,m)));
  return{s,e,dim:Math.round((e-s)/864e5)+1};
}
function calc(ym,sd,ed,dat){
  const b=bounds(ym,sd,ed);let w=0,lv=0,rec=0,off=0;
  for(let i=0;i<b.dim;i++){
    if(isOff(at(b.s,i)))off++;
    const e=dat[i+1];if(!e)continue;
    if(e.l){lv++;rec++}else if(e.h!==undefined){w+=e.h;rec++}
  }
  const paid=Math.min(lv,cfg.allow),req=(b.dim-off)*cfg.target,total=w+paid*cfg.target;
  return{...b,w,lv,rec,off,paid,req,total,diff:total-req};
}
const rng=c=>fm(c.s)+" ← "+fm(c.e);
function count(el,to,fmt){
  const from=prev[el.id]||0;prev[el.id]=to;const t0=performance.now();
  (function s(t){const p=Math.min((t-t0)/700,1),e=1-Math.pow(1-p,3);el.textContent=fmt(from+(to-from)*e);if(p<1)requestAnimationFrame(s)})(t0);
}
function burst(){
  const c=["#6d5efc","#14b8a6","#f59e0b","#f472b6","#10b981"];
  for(let i=0;i<34;i++){const s=document.createElement("span");s.className="conf";
    s.style.left=Math.random()*100+"vw";s.style.background=c[i%5];s.style.animationDelay=Math.random()*.5+"s";
    document.body.append(s);setTimeout(()=>s.remove(),3000)}
}
function setName(){
  const n=cfg.name||DEF;$("nm").textContent=n;$("avl").textContent=n.trim().charAt(0)||"؟";
  document.title="ساعات الشغل | "+n;
}
function applyTheme(){
  const r=document.documentElement;
  if(cfg.theme==="dark"||cfg.theme==="light")r.dataset.theme=cfg.theme;else delete r.dataset.theme;
}
function migrate(){
  try{
    const ks=[];for(let i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));
    ks.forEach(k=>{
      const m=/^p2:(\d{4}-\d{2}):(\d+):([01])$/.exec(k);if(!m)return;
      const st=+m[2],en=m[3]==="1"?st:(st>1?st-1:31),nk="p3:"+m[1]+":"+st+":"+en;
      if(!localStorage.getItem(nk))localStorage.setItem(nk,localStorage.getItem(k));
      localStorage.removeItem(k);
    });
  }catch(e){}
}
function curYM(){
  const n=new Date(),t=new Date(n.getFullYear(),n.getMonth(),n.getDate());
  for(const d of [0,-1,1]){
    const x=new Date(n.getFullYear(),n.getMonth()+d,1),ym=x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0"),b=bounds(ym);
    if(t>=b.s&&t<=b.e)return ym;
  }
  return n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0");
}
function init(){
  migrate();
  const old=load("cfg2",{});
  cfg=Object.assign({target:8,allow:4,start:26,end:25,wk:"0",name:DEF,brk:0,rate:0,theme:"auto"},old);
  if(old.end===undefined&&old.start!==undefined)cfg.end=old.incl?old.start:(old.start>1?old.start-1:31);
  applyTheme();
  $("month").value=curYM();
  $("name").value=cfg.name;$("target").value=cfg.target;$("allow").value=cfg.allow;$("start").value=cfg.start;
  $("end").value=cfg.end;$("wk").value=cfg.wk;$("brk").value=cfg.brk||"";$("rate").value=cfg.rate||"";
  $("month").onchange=render;
  const cl=v=>Math.min(31,Math.max(1,+v||1));
  const ch=()=>{
    cfg.name=$("name").value.trim()||DEF;cfg.target=+$("target").value||8;cfg.allow=+$("allow").value||0;
    cfg.start=cl($("start").value);cfg.end=cl($("end").value);cfg.wk=$("wk").value;
    cfg.brk=+$("brk").value||0;cfg.rate=+$("rate").value||0;
    save("cfg2",cfg);setName();render();
  };
  ["name","target","allow","start","end","wk","brk","rate"].forEach(i=>$(i).onchange=ch);
  $("bTheme").onclick=()=>{cfg.theme=cfg.theme==="auto"?"dark":cfg.theme==="dark"?"light":"auto";save("cfg2",cfg);applyTheme();toast("الشكل: "+({auto:"تلقائي",dark:"داكن",light:"فاتح"})[cfg.theme])};
  $("bPrint").onclick=()=>window.print();
  $("bShare").onclick=()=>{
    const c=calc($("month").value,cfg.start,cfg.end,data);
    const t=["📋 ملخص ساعات الشغل","الموظف: "+(cfg.name||DEF),"الفترة: "+rng(c),"المطلوب: "+f(c.req)+" ساعة","اللي اتعمل: "+f(c.total)+" ساعة","النتيجة: "+(c.diff>=0?"ساعات إضافية "+f(c.diff):"عجز "+f(-c.diff))+" ساعة"].join("\n");
    if(navigator.share)navigator.share({text:t}).catch(()=>{});
    else if(navigator.clipboard)navigator.clipboard.writeText(t).then(()=>toast("اتنسخ الملخص ✅"));
  };
  $("bExp").onclick=()=>{
    const o={cfg2:cfg};periods().forEach(p=>o[p.key]=load(p.key,{}));
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:"application/json"}));
    a.download="hours-backup-"+new Date().toISOString().slice(0,10)+".json";a.click();toast("اتحفظت النسخة الاحتياطية 💾");
  };
  $("bImp").onclick=()=>$("fImp").click();
  $("fImp").onchange=e=>{
    const fl=e.target.files[0];if(!fl)return;
    fl.text().then(t=>{
      const o=JSON.parse(t);
      Object.keys(o).forEach(k=>{if(k==="cfg2"||/^p[23]:\d{4}-\d{2}:\d+:\d+$/.test(k))save(k,o[k])});
      toast("اترجعت البيانات ✅");setTimeout(()=>location.reload(),900);
    }).catch(()=>toast("الملف مش صالح ❌"));
  };
  punchT=load("punch",null);
  $("bPunch").onclick=punch;
  setInterval(tick,1000);tick();
  setName();render();
  setTimeout(()=>{const t=document.querySelector(".day.today");if(t)t.scrollIntoView({block:"center"})},900);
}
function tick(){
  const b=$("bPunch");b.textContent=punchT?"⏹️ سجّل خروج":"▶️ سجّل دخول";b.classList.toggle("on",!!punchT);
  if(!punchT){$("pt").textContent="--:--:--";return}
  const s=Math.floor((Date.now()-punchT)/1000),p=n=>String(n).padStart(2,"0");
  $("pt").textContent=p(Math.floor(s/3600))+":"+p(Math.floor(s/60)%60)+":"+p(s%60);
}
function punch(){
  if(!punchT){punchT=Date.now();save("punch",punchT);tick();toast("تم تسجيل الدخول ▶️");return}
  const hrs=Math.max(0,Math.round(((Date.now()-punchT)/36e5-(cfg.brk||0)/60)*100)/100);
  punchT=null;save("punch",null);tick();
  const ym=curYM(),k=keyFor(ym),d=load(k,{}),b=bounds(ym),t=new Date();t.setHours(0,0,0,0);
  const idx=Math.round((t-b.s)/864e5)+1;
  if(idx>=1&&idx<=b.dim){
    d[idx]={h:Math.round(((d[idx]&&d[idx].h||0)+hrs)*100)/100};save(k,d);
    if(ym===$("month").value)render();else stats();
  }
  toast("اتسجل "+f(hrs)+" ساعة النهاردة ✅");
}
function render(){
  data=load(K(),{});
  const c=calc($("month").value,cfg.start,cfg.end,data),now=new Date();
  $("range").textContent="📅 من "+fm(c.s)+" إلى "+fm(c.e)+" · "+c.dim+" يوم";
  const box=$("days");box.innerHTML="";
  for(let i=0;i<c.dim;i++){
    const dt=at(c.s,i),d=i+1,e=data[d]||{},off=isOff(dt),el=document.createElement("div");
    el.className="day"+(dt.toDateString()==now.toDateString()?" today":"")+(off?" off":"");
    el.style.animationDelay=Math.min(i*18,500)+"ms";
    el.innerHTML=`<div class="dt"><b>${dt.getDate()}</b><small>${wd[dt.getDay()]}${off?" 🛋️":""}</small></div>`;
    const mid=document.createElement("div");mid.className="mid";
    const inp=document.createElement("input");inp.type="number";inp.step="0.25";inp.min="0";inp.inputMode="decimal";
    inp.placeholder=e.l?"إجازة 🌴":(off?"إجازة أسبوعية":"ساعات");inp.value=e.l?"":(e.h??"");inp.disabled=!!e.l;
    const bar=document.createElement("div");bar.className="bar";const bi=document.createElement("i");bar.append(bi);
    const setBar=()=>{const l=data[d]&&data[d].l;bi.className=l?"lv":"";bi.style.width=l?"100%":Math.min(100,((data[d]&&data[d].h)||0)/cfg.target*100)+"%"};
    setTimeout(setBar,60);
    inp.oninput=()=>{if(inp.value==="")delete data[d];else data[d]={h:+inp.value};save(K(),data);setBar();stats()};
    mid.append(inp,bar);
    const qb=document.createElement("button");qb.className="full";qb.textContent="✓ "+cfg.target;
    qb.onclick=()=>{data[d]={h:cfg.target};save(K(),data);inp.value=cfg.target;setBar();stats()};
    const b=document.createElement("button");b.textContent=e.l?"إجازة ✓":"إجازة";b.className=e.l?"on":"";
    b.onclick=()=>{if(data[d]&&data[d].l)delete data[d];else data[d]={l:1};save(K(),data);render()};
    el.append(mid,qb,b);box.append(el);
  }
  stats();
}
function stats(){
  const c=calc($("month").value,cfg.start,cfg.end,data),{req,total,diff,lv,rec,dim}=c,pct=req?total/req:0;
  count($("req"),req,v=>f(v)+" س");count($("work"),total,v=>f(v)+" س");
  $("lvu").textContent=lv+" / "+cfg.allow;$("rec").textContent=rec+" / "+dim;
  count($("pct"),Math.round(pct*100),v=>Math.round(v)+"%");
  $("pg").style.strokeDashoffset=327*(1-Math.min(pct,1));
  const r=$("res"),pos=diff>0.01;
  if(Math.abs(diff)<0.01){r.className="res";r.innerHTML="ساعاتك مظبوطة ✅<small>مفيش عجز ولا زيادة</small>"}
  else if(pos){r.className="res ok";r.innerHTML="ساعات إضافية 🎉<small>+"+f(diff)+" ساعة زيادة عن المطلوب</small>"}
  else{r.className="res bad";r.innerHTML="عجز ⏳<small>"+f(-diff)+" ساعة ناقصة عن المطلوب</small>"}
  if(pos&&!wasPos&&rec>0)burst();wasPos=pos;
  const today=new Date();today.setHours(0,0,0,0);let rem=0,miss=0;
  for(let i=0;i<dim;i++){
    const dt=at(c.s,i);if(isOff(dt)||data[i+1])continue;
    if(dt>=today)rem++;else miss++;
  }
  let tip;
  if(diff>=0)tip="💪 خلصت المطلوب منك، وأي ساعات زيادة بتتحسب إضافي.";
  else if(rem>0)tip="🎯 محتاج متوسط "+f(-diff/rem)+" ساعة يوميًا في الـ "+rem+" يوم اللي فاضلين عشان تغطي العجز.";
  else tip="⏳ الفترة خلصت وعليك عجز "+f(-diff)+" ساعة.";
  if(cfg.rate>0&&Math.abs(diff)>0.01)tip+=" 💰 "+(diff>0?"قيمة الإضافي ≈ ":"قيمة العجز ≈ ")+f(Math.abs(diff)*cfg.rate);
  $("tip").textContent=tip;
  let w="";
  if(lv>cfg.allow)w+="⚠️ أخدت "+(lv-cfg.allow)+" إجازة زيادة عن المسموح ومش محسوبة من الساعات. ";
  if(miss)w+="📝 في "+miss+" يوم فات من غير تسجيل، وبيتحسبوا صفر.";
  $("warn").textContent=w;
  hist();
}
function periods(){
  const o=[];
  try{for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i),m=/^p3:(\d{4}-\d{2}):(\d+):(\d+)$/.exec(k);
    if(m)o.push({key:k,ym:m[1],start:+m[2],end:+m[3]});
  }}catch(e){}
  return o.sort((a,b)=>b.ym.localeCompare(a.ym));
}
function hist(){
  const box=$("hist");
  const rows=periods().map(p=>({p,c:calc(p.ym,p.start,p.end,load(p.key,{}))})).filter(x=>x.c.rec>0);
  if(!rows.length){box.innerHTML='<p class="mut">لسه مفيش شهور متسجلة.</p>';return}
  const bal=rows.reduce((s,x)=>s+x.c.diff,0);
  let h=`<div class="bal ${bal>=0?"ok":"bad"}">الرصيد التراكمي: ${bal>0?"+":""}${f(bal)} ساعة</div>`;
  rows.forEach(({c},i)=>{
    const pc=c.req?Math.min(100,c.total/c.req*100):0;
    h+=`<div class="hr" data-i="${i}"><div><b>${rng(c)}</b><small>${f(c.total)} / ${f(c.req)} س · إجازات ${c.lv}</small><div class="bar"><i style="width:${pc}%"></i></div></div><span class="df ${c.diff>=0?"ok":"bad"}">${c.diff>0?"+":""}${f(c.diff)}</span></div>`;
  });
  box.innerHTML=h;
  box.querySelectorAll(".hr").forEach(el=>el.onclick=()=>{
    const p=rows[+el.dataset.i].p;
    cfg.start=p.start;cfg.end=p.end;$("start").value=p.start;$("end").value=p.end;$("month").value=p.ym;
    save("cfg2",cfg);render();window.scrollTo({top:0,behavior:"smooth"});
  });
}
init();
if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}
