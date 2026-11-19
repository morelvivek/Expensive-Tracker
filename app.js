const CATS=[["Food","var(--c2)"],["Groceries","var(--c8)"],["Travel","var(--c1)"],["Shopping","var(--c5)"],["Education","var(--c4)"],["Bills","var(--c3)"],["Entertainment","var(--c7)"],["Other","var(--c6)"]];
const FEE_CAT="Children fees";
const col=n=>(CATS.find(c=>c[0]===n)||[FEE_CAT,"var(--c7)"])[1];
const CAT_ICONS={Food:"●",Groceries:"▧",Travel:"➤",Shopping:"◇",Education:"▤",Bills:"▦",Entertainment:"✦",Other:"•",[FEE_CAT]:"◇"};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const inr=n=>"₹"+Number(n).toLocaleString("en-IN",{maximumFractionDigits:2});
const fd=d=>new Date(d+"T00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"});
let F={cat:"All",q:"",date:"",editId:null};
let S={budget:0,limit:0,goal:0,exp:[],income:[],bills:[],sav:[]};
try{
  const stored=localStorage.getItem("tracker2");
  if(stored){const parsed=JSON.parse(stored);if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))S=Object.assign(S,parsed)}
}catch(e){toast("Saved data could not be read. New entries will start fresh.")}
for(const key of ["exp","income","bills","sav"])if(!Array.isArray(S[key]))S[key]=[];
S.exp=S.exp.filter(i=>i&&typeof i.note==="string"&&typeof i.cat==="string"&&typeof i.date==="string"&&Number.isFinite(Number(i.amt))).map(i=>({...i,amt:Number(i.amt)}));
S.income=S.income.filter(i=>i&&typeof i.source==="string"&&typeof i.date==="string"&&Number.isFinite(Number(i.amt))).map(i=>({...i,amt:Number(i.amt)}));
S.bills=S.bills.filter(b=>b&&typeof b.name==="string"&&typeof b.due==="string"&&Number.isFinite(Number(b.amt))).map(b=>({...b,amt:Number(b.amt)}));
S.sav=S.sav.filter(s=>s&&typeof s.date==="string"&&Number.isFinite(Number(s.amt))).map(s=>({...s,amt:Number(s.amt)}));
for(const key of ["budget","limit","goal"]){const value=Number(S[key]);S[key]=Number.isFinite(value)&&value>=0?value:0}
S.exp.forEach(i=>{if(i.cat==="Study")i.cat="Education"});
const save=()=>{try{localStorage.setItem("tracker2",JSON.stringify(S));return true}catch(e){toast("Could not save data in this browser.");return false}};
function readAmount(id,allowZero=false){
  const raw=$(id).value.trim(),amount=Number(raw);
  if((!raw&&!allowZero)||!Number.isFinite(amount)||amount<0||(!allowZero&&amount===0)){toast("Enter a valid amount.");$(id).focus();return null}
  return amount;
}
function readText(id,label){
  const value=$(id).value.trim();
  if(!value){toast(`Enter ${label}.`);$(id).focus();return null}
  return value;
}
const today=new Date().toISOString().slice(0,10),ym=today.slice(0,7);
const currentDate=()=>new Date().toISOString().slice(0,10);
$("month").textContent=new Date().toLocaleDateString("en-IN",{month:"long",year:"numeric"});
$("cat").innerHTML=CATS.map(c=>`<option>${c[0]}</option>`).join("");
["date","bd","kd"].forEach(i=>$(i).value=today);
const categoryBadge=name=>`<span class="category-badge" data-category="${esc(name)}"><span aria-hidden="true">${CAT_ICONS[name]||"•"}</span>${esc(name)}</span>`;
const delBtn=(k,id)=>`<button class="x delete-action" aria-label="Delete" title="Delete" data-k="${k}" data-id="${id}">×</button>`;

function meter(el,txtEl,val,max,label){
  if(!max){el.style.width="0";txtEl.textContent=label.none;return}
  const p=val/max*100;el.style.width=Math.min(p,100)+"%";
  el.className=label.save?"":(p>=100?"d":p>=80?"w":"");
  txtEl.textContent=label.fmt(p);
}
function render(){
  const mon=S.exp.filter(i=>i.date.startsWith(ym));
  const sum=mon.reduce((a,i)=>a+i.amt,0);
  const monthIncome=S.income.filter(i=>i.date.startsWith(ym)).reduce((a,i)=>a+i.amt,0);
  countTo($("total"),sum);
  countTo($("incomeTotal"),monthIncome);
  countTo($("balance"),monthIncome-sum);
  meter($("bm"),$("bmt"),sum,S.budget,{none:"Set a monthly budget in Budget & limit.",fmt:p=>`${Math.round(p)}% of ${inr(S.budget)} budget used · ${S.budget>=sum?inr(S.budget-sum)+" left":inr(sum-S.budget)+" over"}`});
  const by={};mon.forEach(i=>by[i.cat]=(by[i.cat]||0)+i.amt);
  const chartCats=[...CATS,[FEE_CAT,"var(--c7)"]];
  const parts=chartCats.filter(c=>by[c[0]]);
  $("bar").innerHTML=parts.map(c=>`<span style="width:${by[c[0]]/sum*100}%;background:${c[1]}"></span>`).join("");
  $("legend").innerHTML=parts.length?parts.map(c=>`<span><i style="background:${c[1]}"></i>${c[0]} ${inr(by[c[0]])}</span>`).join(""):"<span>Add an expense to see where the money goes.</span>";
  $("today").textContent=inr(S.exp.filter(i=>i.date===today).reduce((a,i)=>a+i.amt,0));
  const unpaid=S.bills.filter(b=>!b.paid);
  $("due").textContent=inr(unpaid.reduce((a,b)=>a+b.amt,0));
  const kids=mon.filter(i=>i.cat==="Children fees");
  $("kidt").textContent=inr(kids.reduce((a,i)=>a+i.amt,0));
  const sv=S.sav.reduce((a,s)=>a+s.amt,0);
  $("savt").textContent=inr(sv);$("sv").textContent=inr(sv);
  meter($("sm"),$("smt"),sv,S.goal,{save:1,none:"Set a savings goal in Budget & limit.",fmt:p=>`${Math.round(p)}% of ${inr(S.goal)} goal`});

  // alerts
  let a="";
  if(S.limit&&sum>=S.limit)a+=`<div class="alert d">Account limit reached: you have spent ${inr(sum)} of your ${inr(S.limit)} limit this month. Stop non-essential spending.</div>`;
  else if(S.limit&&sum>=S.limit*.9)a+=`<div class="alert w">You are close to your account limit: only ${inr(S.limit-sum)} left.</div>`;
  if(S.budget&&sum>S.budget)a+=`<div class="alert d">Over budget by ${inr(sum-S.budget)} this month.</div>`;
  else if(S.budget&&sum>=S.budget*.8)a+=`<div class="alert w">You have used ${Math.round(sum/S.budget*100)}% of your monthly budget.</div>`;
  const late=unpaid.filter(b=>b.due<today).length,soon=unpaid.filter(b=>b.due>=today&&b.due<=new Date(Date.now()+3*864e5).toISOString().slice(0,10)).length;
  if(late)a+=`<div class="alert d">${late} bill${late>1?"s are":" is"} overdue.</div>`;
  if(soon)a+=`<div class="alert w">${soon} bill${soon>1?"s are":" is"} due within 3 days.</div>`;
  $("alerts").innerHTML=a;

  // lists
  const categories=[...CATS.map(c=>c[0]),...(S.exp.some(i=>i.cat===FEE_CAT)?[FEE_CAT]:[])];
  $("chips").innerHTML=["All",...categories].map(c=>`<button data-chip="${c}" aria-pressed="${F.cat===c}">${c}</button>`).join("");
  const ex=[...S.exp].filter(i=>(F.cat==="All"||i.cat===F.cat)&&(!F.q||(i.note+" "+i.cat).toLowerCase().includes(F.q))&&(!F.date||i.date===F.date)).sort((x,y)=>y.date.localeCompare(x.date)||y.id-x.id);
  $("list").innerHTML=ex.length?ex.map(i=>`<div class="row expense-row"><span class="dot" style="background:${col(i.cat)}"></span><div class="grow"><b>${esc(i.note)}</b><small>${categoryBadge(i.cat)}<span class="row-date">${fd(i.date)}</span></small></div><span class="amt expense-amount">−${inr(i.amt)}</span><button class="btn s edit-action" title="Edit expense" data-edit="${i.id}"><span aria-hidden="true">✎</span> Edit</button>${delBtn("exp",i.id)}</div>`).join(""):`<p class="empty">${S.exp.length?"No expenses match this filter.":"No expenses yet. Add one above."}</p>`;
  const bl=[...S.bills].sort((x,y)=>(x.paid-y.paid)||x.due.localeCompare(y.due));
  $("blist").innerHTML=bl.length?bl.map(b=>`<div class="row"><div class="grow"><b>${esc(b.name)}</b><small class="${!b.paid&&b.due<today?"late":""}">${b.paid?"Paid":"Due "+fd(b.due)+(b.due<today?" (overdue)":"")}</small></div><span class="amt expense-amount">−${inr(b.amt)}</span>${b.paid?"":`<button class="btn s paid-action" data-pay="${b.id}"><span aria-hidden="true">✓</span> Mark paid</button>`}${delBtn("bills",b.id)}</div>`).join(""):'<p class="empty">No bills added yet.</p>';
  const kf=S.exp.filter(i=>i.cat==="Children fees"&&i.child).sort((x,y)=>y.date.localeCompare(x.date));
  const kc={};kf.forEach(i=>kc[i.child]=(kc[i.child]||0)+i.amt);
  $("klist").innerHTML=kf.length?Object.keys(kc).map(c=>`<div class="row"><div class="grow"><b>${esc(c)}</b><small>Total paid</small></div><span class="amt expense-amount">−${inr(kc[c])}</span></div>`).join("")+"<h2 style='margin-top:14px'>History</h2>"+kf.map(i=>`<div class="row"><div class="grow"><b>${esc(i.child)} · ${esc(i.note)}</b><small>${fd(i.date)}</small></div><span class="amt expense-amount">−${inr(i.amt)}</span>${delBtn("exp",i.id)}</div>`).join(""):'<p class="empty">No children fees added yet.</p>';
  $("slist").innerHTML=S.sav.length?[...S.sav].reverse().map(s=>`<div class="row"><div class="grow"><b>${esc(s.note||"Saving")}</b><small>${fd(s.date)}</small></div><span class="amt income-amount">+${inr(s.amt)}</span>${delBtn("sav",s.id)}</div>`).join(""):'<p class="empty">No savings added yet.</p>';
  $("inlist").innerHTML=S.income.length?[...S.income].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).map(i=>`<div class="row"><div class="grow"><b>${esc(i.source)}</b><small>${fd(i.date)}</small></div><span class="amt income-amount">+${inr(i.amt)}</span>${delBtn("income",i.id)}</div>`).join(""):'<p class="empty">No income recorded yet.</p>';
}
$("tabs").addEventListener("click",e=>{
  const t=e.target.dataset&&e.target.dataset.t;if(!t)return;
  document.querySelectorAll("#tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.t===t));
  document.querySelectorAll("main>section").forEach(s=>s.classList.toggle("hide",s.id!=="p-"+t));
});
function cancelExpenseEdit(){
  F.editId=null;$("f").reset();$("date").value=currentDate();$("date").readOnly=true;
  $("cat").querySelector(`option[value="${FEE_CAT}"]`)?.remove();
  $("expenseSubmit").textContent="Add expense";$("cancelEdit").classList.add("hide");
}
$("f").addEventListener("submit",e=>{e.preventDefault();
  const note=readText("note","a description"),amt=readAmount("amt");if(note===null||amt===null)return;
  const details={note,amt,cat:$("cat").value};
  if(F.editId!==null){
    const expense=S.exp.find(i=>String(i.id)===F.editId);
    if(!expense)return;
    Object.assign(expense,details,{date:$("date").value||expense.date});
    cancelExpenseEdit();toast("Expense updated");
  }else{
    S.exp.push({id:Date.now(),...details,date:currentDate()});
    toast("Expense added");$("note").value="";$("amt").value="";
  }
  save();$("note").focus();render()});
$("incf").addEventListener("submit",e=>{e.preventDefault();
  const source=readText("inote","an income source"),amt=readAmount("inamt");if(source===null||amt===null)return;
  S.income.push({id:Date.now(),source,amt,date:currentDate()});
  save();toast("Income added");$("inote").value="";$("inamt").value="";$("inote").focus();render()});
$("bf").addEventListener("submit",e=>{e.preventDefault();
  const name=readText("bn","a bill name"),amt=readAmount("ba");if(name===null||amt===null)return;
  S.bills.push({id:Date.now(),name,amt,due:$("bd").value,paid:false});
  save();toast("Bill added");$("bn").value="";$("ba").value="";render()});
$("kf").addEventListener("submit",e=>{e.preventDefault();
  const child=readText("kn","a child name"),amt=readAmount("ka");if(child===null||amt===null)return;
  S.exp.push({id:Date.now(),note:$("kt").value,child,amt,cat:"Children fees",date:$("kd").value});
  save();toast("Fee added");$("ka").value="";render()});
$("sf").addEventListener("submit",e=>{e.preventDefault();
  const amt=readAmount("sa");if(amt===null)return;
  S.sav.push({id:Date.now(),amt,note:$("sn").value.trim(),date:currentDate()});
  save();toast("Savings added");$("sa").value="";$("sn").value="";render()});
$("setf").addEventListener("submit",e=>{e.preventDefault();
  const budget=readAmount("sb",true),limit=readAmount("sl",true),goal=readAmount("sg",true);if(budget===null||limit===null||goal===null)return;
  S.budget=budget;S.limit=limit;S.goal=goal;
  save();toast("Settings saved");render();document.querySelector('[data-t="home"]').click()});
$("exportData").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(S,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=`expense-tracker-${currentDate()}.json`;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);toast("JSON backup downloaded");
});
$("importData").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{
    const data=JSON.parse(await file.text());
    if(!data||typeof data!=="object"||Array.isArray(data)||!Array.isArray(data.exp)||!Array.isArray(data.bills)||!Array.isArray(data.sav)||data.income!==undefined&&!Array.isArray(data.income))throw new Error("Invalid backup");
    for(const key of ["budget","limit","goal"]){const value=Number(data[key]||0);if(!Number.isFinite(value)||value<0)throw new Error("Invalid setting");data[key]=value}
    const restored={...S,...data,income:data.income||[]};
    restored.exp=restored.exp.filter(i=>i&&typeof i.note==="string"&&typeof i.cat==="string"&&typeof i.date==="string"&&Number.isFinite(Number(i.amt))).map(i=>({...i,amt:Number(i.amt)}));
    restored.income=restored.income.filter(i=>i&&typeof i.source==="string"&&typeof i.date==="string"&&Number.isFinite(Number(i.amt))).map(i=>({...i,amt:Number(i.amt)}));
    restored.bills=restored.bills.filter(b=>b&&typeof b.name==="string"&&typeof b.due==="string"&&Number.isFinite(Number(b.amt))).map(b=>({...b,amt:Number(b.amt)}));
    restored.sav=restored.sav.filter(s=>s&&typeof s.date==="string"&&Number.isFinite(Number(s.amt))).map(s=>({...s,amt:Number(s.amt)}));
    if(!confirm("Replace current tracker data with this backup?"))return;
    const previous=S;S=restored;S.exp.forEach(i=>{if(i.cat==="Study")i.cat="Education"});
    if(!save()){S=previous;return}
    $("sb").value=S.budget||"";$("sl").value=S.limit||"";$("sg").value=S.goal||"";
    render();toast("Backup restored");
  }catch(error){toast("Could not read that JSON backup.")}
  finally{e.target.value=""}
});
$("sb").value=S.budget||"";$("sl").value=S.limit||"";$("sg").value=S.goal||"";
document.querySelector("main").addEventListener("click",e=>{
  const d=e.target.dataset;
  if(e.target.id==="cancelEdit"){cancelExpenseEdit();return}
  if(d.edit){
    const i=S.exp.find(x=>String(x.id)===d.edit);if(!i)return;
    if(i.cat===FEE_CAT&&!Array.from($("cat").options).some(option=>option.value===FEE_CAT)){
      const option=document.createElement("option");option.value=FEE_CAT;option.textContent=FEE_CAT;$("cat").append(option);
    }
    F.editId=String(i.id);$("note").value=i.note;$("amt").value=i.amt;$("cat").value=i.cat;
    $("date").readOnly=false;$("date").value=i.date;$("expenseSubmit").textContent="Save changes";$("cancelEdit").classList.remove("hide");
    document.querySelector('[data-t="add"]').click();$("note").focus();return;
  }
  if(d.k){if(d.k==="exp"&&F.editId===d.id)cancelExpenseEdit();const old=S[d.k].slice();S[d.k]=S[d.k].filter(i=>String(i.id)!==d.id);save();render();toast("Deleted",()=>{S[d.k]=old;save();render()})}
  if(d.chip){F.cat=d.chip;render()}
  if(d.pay){const b=S.bills.find(x=>String(x.id)===d.pay);if(b){toast("Bill marked as paid");b.paid=true;S.exp.push({id:Date.now(),note:b.name+" (bill)",amt:b.amt,cat:"Bills",date:today});save();render()}}
});

function toast(msg,undo){
  const t=document.createElement("div");t.className="toast";t.textContent=msg;
  if(undo){const b=document.createElement("button");b.textContent="Undo";b.onclick=()=>{undo();t.remove()};t.appendChild(b)}
  $("toasts").appendChild(t);setTimeout(()=>t.remove(),undo?5000:2200);
}
const shown={};
function countTo(el,v){
  const from=shown[el.id]||0;shown[el.id]=v;
  if(matchMedia("(prefers-reduced-motion:reduce)").matches||from===v){el.textContent=inr(v);return}
  const t0=performance.now();
  (function step(t){const k=Math.min((t-t0)/450,1),e=1-Math.pow(1-k,3);el.textContent=inr(from+(v-from)*e);if(k<1)requestAnimationFrame(step)})(t0);
}
function applyTheme(m){
  document.documentElement.setAttribute("data-theme",m);
  $("theme").textContent=m==="dark"?"☀️":"🌙";
  $("theme").setAttribute("aria-label",m==="dark"?"Switch to light mode":"Switch to dark mode");
}
let th="";try{th=localStorage.getItem("theme")||""}catch(e){}
if(!th)th=matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";
applyTheme(th);
$("theme").addEventListener("click",()=>{
  th=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";
  applyTheme(th);try{localStorage.setItem("theme",th)}catch(e){}
});
$("q").addEventListener("input",e=>{F.q=e.target.value.trim().toLowerCase();render()});
$("qdate").addEventListener("input",e=>{F.date=e.target.value;render()});
$("qa").addEventListener("click",e=>{const q=e.target.dataset.q;if(q){$("amt").value=(parseFloat($("amt").value)||0)+parseFloat(q);$("amt").focus()}});
$("fab").addEventListener("click",()=>{document.querySelector('[data-t="add"]').click();window.scrollTo({top:0,behavior:"smooth"});setTimeout(()=>$("note").focus(),50)});
render();
