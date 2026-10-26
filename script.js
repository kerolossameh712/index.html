const $=id=>document.getElementById(id);
let data={},cfg={},prev={};
const wd=["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const f=n=>(Math.round(n*100)/100).toString();
function load(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
const K=()=>"p2:"+$("month").value+":"+cfg.start+":"+(cfg.incl?1:0);
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
function init(){
  cfg=Object.assign({target:8,allow:4,start:26,incl:false},load("cfg2",{}));
  const n=new Date();let sy=n.getFullYear(),sm=n.getMonth()+1;
  if(n.getDate()<cfg.start){sm--;if(!sm){sm=12;sy--}}
  $("month").value=sy+"-"+String(sm).padStart(2,"0");
  $("target").value=cfg.target;$("allow").value=cfg.allow;$("start").value=cfg.start;$("incl").checked=cfg.incl;
  $("month").onchange=()=>render(true);
  const ch=()=>{cfg.target=+$("target").value||8;cfg.allow=+$("allow").value||0;cfg.start=Math.min(28,Math.max(1,+$("start").value||1));cfg.incl=$("incl").checked;save("cfg2",cfg);render(true)};
  ["target","allow","start","incl"].forEach(i=>$(i).onchange=ch);
  render(true);
  setTimeout(()=>{const t=document.querySelector(".day.today");if(t)t.scrollIntoView({block:"center"})},900);
}
let dim=30;
function render(full){
  data=load(K(),{});
  const [y,m]=$("month").value.split("-").map(Number),sd=cfg.start;
  dim=Math.round((new Date(y,m,sd)-new Date(y,m-1,sd))/864e5)+(cfg.incl?1:0);
  const fm=d=>d.toLocaleDateString("ar-EG",{day:"numeric",month:"long"});
  $("range").textContent="📅 من "+fm(new Date(y,m-1,sd))+" إلى "+fm(new Date(y,m-1,sd+dim-1))+" · "+dim+" يوم";
  const box=$("days"),now=new Date();box.innerHTML="";
  for(let i=0;i<dim;i++){
    const dt=new Date(y,m-1,sd+i),d=i+1,e=data[d]||{},el=document.createElement("div");
    el.className="day"+(dt.toDateString()==now.toDateString()?" today":"");
    el.style.animationDelay=Math.min(i*18,500)+"ms";
    el.innerHTML=`<div class="dt"><b>${dt.getDate()}</b><small>${wd[dt.getDay()]}</small></div>`;
    const mid=document.createElement("div");mid.className="mid";
    const inp=document.createElement("input");inp.type="number";inp.step="0.25";inp.min="0";inp.inputMode="decimal";
    inp.placeholder=e.l?"إجازة 🌴":"ساعات";inp.value=e.l?"":(e.h??"");inp.disabled=!!e.l;
    const bar=document.createElement("div");bar.className="bar";const bi=document.createElement("i");bar.append(bi);
    const setBar=()=>{const l=data[d]&&data[d].l;bi.className=l?"lv":"";bi.style.width=l?"100%":Math.min(100,((data[d]&&data[d].h)||0)/cfg.target*100)+"%"};
    setTimeout(setBar,60);
    inp.oninput=()=>{if(inp.value==="")delete data[d];else data[d]={h:+inp.value};save(K(),data);setBar();stats()};
    mid.append(inp,bar);
    const full=document.createElement("button");full.className="full";full.textContent="✓ "+cfg.target;
    full.onclick=()=>{data[d]={h:cfg.target};save(K(),data);inp.value=cfg.target;setBar();stats()};
    const b=document.createElement("button");b.textContent=e.l?"إجازة ✓":"إجازة";b.className=e.l?"on":"";
    b.onclick=()=>{if(data[d]&&data[d].l)delete data[d];else data[d]={l:1};save(K(),data);render()};
    el.append(mid,full,b);box.append(el);
  }
  stats();
}
let wasPos=false;
function stats(){
  const t=cfg.target;let w=0,lv=0,rec=0;
  Object.values(data).forEach(e=>{if(e.l){lv++;rec++}else if(e.h!==undefined){w+=e.h;rec++}});
  const paid=Math.min(lv,cfg.allow),req=dim*t,total=w+paid*t,diff=total-req,pct=req?total/req:0;
  count($("req"),req,v=>f(v)+" س");count($("work"),total,v=>f(v)+" س");
  $("lvu").textContent=lv+" / "+cfg.allow;$("rec").textContent=rec+" / "+dim;
  count($("pct"),Math.round(pct*100),v=>Math.round(v)+"%");
  $("pg").style.strokeDashoffset=327*(1-Math.min(pct,1));
  const r=$("res"),pos=diff>0.01;
  if(Math.abs(diff)<0.01){r.className="res";r.innerHTML="ساعاتك مظبوطة ✅<small>مفيش عجز ولا زيادة</small>"}
  else if(pos){r.className="res ok";r.innerHTML="ساعات إضافية 🎉<small>+"+f(diff)+" ساعة زيادة عن المطلوب</small>"}
  else{r.className="res bad";r.innerHTML="عجز ⏳<small>"+f(-diff)+" ساعة ناقصة عن المطلوب</small>"}
  if(pos&&!wasPos&&rec>0)burst();wasPos=pos;
  $("warn").textContent=lv>cfg.allow?"⚠️ أخدت "+(lv-cfg.allow)+" إجازة زيادة عن المسموح ومش محسوبة من الساعات.":"";
}
init();
