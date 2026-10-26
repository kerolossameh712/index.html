const $=id=>document.getElementById(id);
const DEF="كيرلس سامح عيد";
let data={},cfg={},prev={},wasPos=false;
const wd=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const f=n=>(Math.round(n*100)/100).toString();
function load(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const K=()=>"p2:"+$("month").value+":"+cfg.start+":"+(cfg.incl?1:0);
const isOff=d=>cfg.wk!=="0"&&cfg.wk.includes(String(d.getDay()));
const fm=d=>d.toLocaleDateString("ar-EG",{day:"numeric",month:"long"});
function toast(t){const e=$("toast");e.textContent=t;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2400)}
function calc(ym,sd,incl,dat){
  const [y,m]=ym.split("-").map(Number);
  const dim=Math.round((new Date(y,m,sd)-new Date(y,m-1,sd))/864e5)+(incl?1:0);
  let w=0,lv=0,rec=0,off=0;
  for(let i=0;i<dim;i++){
    if(isOff(new Date(y,m-1,sd+i)))off++;
    const e=dat[i+1];if(!e)continue;
    if(e.l){lv++;rec++}else if(e.h!==undefined){w+=e.h;rec++}
  }
  const paid=Math.min(lv,cfg.allow),req=(dim-off)*cfg.target,total=w+paid*cfg.target;
  return{y,m,sd,dim,off,w,lv,rec,paid,req,total,diff:total-req};
}
const rng=c=>fm(new Date(c.y,c.m-1,c.sd))+" ← "+fm(new Date(c.y,c.m-1,c.sd+c.dim-1));
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
function init(){
  cfg=Object.assign({target:8,allow:4,start:26,incl:false,wk:"0",name:DEF},load("cfg2",{}));
  const n=new Date();let sy=n.getFullYear(),sm=n.getMonth()+1;
  if(n.getDate()<cfg.start){sm--;if(!sm){sm=12;sy--}}
  $("month").value=sy+"-"+String(sm).padStart(2,"0");
  $("target").value=cfg.target;$("allow").value=cfg.allow;$("start").value=cfg.start;
  $("incl").checked=cfg.incl;$("wk").value=cfg.wk;$("name").value=cfg.name;
  $("month").onchange=render;
  const ch=()=>{
    cfg.target=+$("target").value||8;cfg.allow=+$("allow").value||0;
    cfg.start=Math.min(28,Math.max(1,+$("start").value||1));cfg.incl=$("incl").checked;
    cfg.wk=$("wk").value;cfg.name=$("name").value.trim()||DEF;
    save("cfg2",cfg);setName();render();
  };
  ["name","target","allow","start","incl","wk"].forEach(i=>$(i).onchange=ch);
  $("bShare").onclick=()=>{
    const c=calc($("month").value,cfg.start,cfg.incl,data);
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
      Object.keys(o).forEach(k=>{if(k==="cfg2"||/^p2:\d{4}-\d{2}:\d+:[01]$/.test(k))save(k,o[k])});
      toast("اترجعت البيانات ✅");setTimeout(()=>location.reload(),900);
    }).catch(()=>toast("الملف مش صالح ❌"));
  };
  setName();render();
  setTimeout(()=>{const t=document.querySelector(".day.today");if(t)t.scrollIntoView({block:"center"})},900);
}
function render(){
  data=load(K(),{});
  const c=calc($("month").value,cfg.start,cfg.incl,data),now=new Date();
  $("range").textContent="📅 من "+fm(new Date(c.y,c.m-1,c.sd))+" إلى "+fm(new Date(c.y,c.m-1,c.sd+c.dim-1))+" · "+c.dim+" يوم";
  const box=$("days");box.innerHTML="";
  for(let i=0;i<c.dim;i++){
    const dt=new Date(c.y,c.m-1,c.sd+i),d=i+1,e=data[d]||{},off=isOff(dt),el=document.createElement("div");
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
  const c=calc($("month").value,cfg.start,cfg.incl,data),{req,total,diff,lv,rec,dim}=c,pct=req?total/req:0;
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
    const dt=new Date(c.y,c.m-1,c.sd+i);if(isOff(dt)||data[i+1])continue;
    if(dt>=today)rem++;else miss++;
  }
  const tip=$("tip");
  if(diff>=0)tip.textContent="💪 خلصت المطلوب منك، وأي ساعات زيادة بتتحسب إضافي.";
  else if(rem>0)tip.textContent="🎯 محتاج متوسط "+f(-diff/rem)+" ساعة يوميًا في الـ "+rem+" يوم اللي فاضلين عشان تغطي العجز.";
  else tip.textContent="⏳ الفترة خلصت وعليك عجز "+f(-diff)+" ساعة.";
  let w="";
  if(lv>cfg.allow)w+="⚠️ أخدت "+(lv-cfg.allow)+" إجازة زيادة عن المسموح ومش محسوبة من الساعات. ";
  if(miss)w+="📝 في "+miss+" يوم فات من غير تسجيل، وبيتحسبوا صفر.";
  $("warn").textContent=w;
  hist();
}
function periods(){
  const o=[];
  try{for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i),m=/^p2:(\d{4}-\d{2}):(\d+):([01])$/.exec(k);
    if(m)o.push({key:k,ym:m[1],start:+m[2],incl:m[3]=="1"});
  }}catch(e){}
  return o.sort((a,b)=>b.ym.localeCompare(a.ym));
}
function hist(){
  const box=$("hist");
  const rows=periods().map(p=>({p,c:calc(p.ym,p.start,p.incl,load(p.key,{}))})).filter(x=>x.c.rec>0);
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
    cfg.start=p.start;cfg.incl=p.incl;$("start").value=p.start;$("incl").checked=p.incl;$("month").value=p.ym;
    save("cfg2",cfg);render();window.scrollTo({top:0,behavior:"smooth"});
  });
}
init();
if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{})})}
