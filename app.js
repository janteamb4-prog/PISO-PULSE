(() => {
"use strict";
const $=id=>document.getElementById(id), KEY="piso-pulse-liquid-v2";
const defaults=["Food","Transport","Bills","Shopping","School","Health","Entertainment","Other"];
const palette=["#938be9","#69c6ad","#e79aaf","#e4b966","#79acd7","#c08bd6","#93bd85","#9ca7bd"];
const today=new Date(), iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`, monthOf=d=>d.slice(0,7), currentMonth=()=> $("monthPicker").value;
let state=load(), txType="expense", toastTimer, activePage="overview";
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&Array.isArray(x.transactions))return {...x,categories:x.categories?.length?x.categories:defaults,plans:x.plans||{},goals:x.goals||[],categoryBudgets:x.categoryBudgets||{},settings:x.settings||{}};}catch(e){}return {transactions:[],categories:[...defaults],plans:{},goals:[],categoryBudgets:{},settings:{theme:"light",accent:"lavender",name:""}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function money(n){return new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0)}
function shortMoney(n){return new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP",maximumFractionDigits:0}).format(Number(n)||0)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmtDate(s){return new Date(s+"T12:00:00").toLocaleDateString("en-PH",{month:"short",day:"numeric",year:"numeric"})}
function plan(){return state.plans[currentMonth()]||{allowance:0,budget:0}}
function monthTx(){return state.transactions.filter(t=>monthOf(t.date)===currentMonth())}
function calc(){const tx=monthTx(),p=plan(),extra=tx.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0),spent=tx.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0),income=(+p.allowance||0)+extra;return {tx,p,extra,spent,income,balance:income-spent,budgetLeft:(+p.budget||0)-spent}}
function toast(s){const el=$("toast");el.textContent=s;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2300)}
function ensureRecurring(){
  const target=currentMonth(), templates=state.transactions.filter(t=>t.recurring&&!t.recurringParent&&t.date<target+"-32");
  templates.forEach(t=>{
    const start=new Date(t.date+"T12:00:00"), end=new Date(target+"-01T12:00:00");
    let d=new Date(start.getFullYear(),start.getMonth()+1,Math.min(start.getDate(),28));
    while(d<=end){const m=iso(d).slice(0,7), date=`${m}-${String(Math.min(start.getDate(),28)).padStart(2,"0")}`;
      if(m<=target&&!state.transactions.some(x=>x.recurringParent===t.id&&x.date===date))state.transactions.push({...t,id:`${t.id}-${m}`,date,recurring:false,recurringParent:t.id,created:Date.now()});
      d=new Date(d.getFullYear(),d.getMonth()+1,Math.min(start.getDate(),28));
    }
  });
  save();
}
function setPage(page){
  activePage=page;document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));
  document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  $("breadcrumbPage").textContent=({overview:"Overview",transactions:"Transactions",budgets:"Budgets",goals:"Savings goals",reports:"Reports",settings:"Customize"})[page]||"Overview";
  renderPage(page);window.scrollTo({top:0,behavior:"smooth"});
}
function render(){
 const {tx,spent,income,balance,budgetLeft,p}=calc(),budget=+p.budget||0,days=new Date(currentMonth()+"-01T12:00:00");
 const lastDay=new Date(days.getFullYear(),days.getMonth()+1,0).getDate(),todayDay=(currentMonth()===iso(today).slice(0,7)?today.getDate():1),remainingDays=Math.max(1,lastDay-todayDay+1),daily=Math.max(0,balance)/remainingDays;
 $("availableBalance").textContent=money(balance);$("heroCaption").textContent=income?`${money(income)} total available this month`:"Set your monthly allowance to begin";
 $("heroSpentLabel").textContent=`${shortMoney(spent)} spent`; $("heroIncomeLabel").textContent=`${shortMoney(income)} income`;
 $("heroProgress").style.width=`${income?Math.max(0,Math.min(100,balance/income*100)):0}%`;
 $("dailyAllowance").textContent=money(daily);$("daysLeft").textContent=`${remainingDays} ${remainingDays===1?"day":"days"} left`;
 $("dailyHint").textContent=balance<0?"You are over your available balance": "Based on your remaining balance";
 $("incomeTotal").textContent=money(income);$("expenseTotal").textContent=money(spent);
 $("expenseCount").textContent=`${tx.filter(t=>t.type==="expense").length} expense entries`;
 $("budgetRemaining").textContent=budget?money(budgetLeft):"Not set";
 $("budgetSmall").textContent=budget?(budgetLeft>=0?"Remaining in your spending limit":"You are over your spending limit"):"Set a monthly spending limit";
 const saved=state.goals.reduce((a,g)=>a+(+g.current||0),0);$("savingsTotal").textContent=shortMoney(saved);$("savingsSmall").textContent=`${state.goals.length} active savings goals`;
 $("navTxCount").textContent=state.transactions.length;
 const displayName=state.settings.name||"Your wallet";$("profileName").textContent=displayName;$("profileInitial").textContent=(state.settings.name||"P").slice(0,1).toUpperCase();
 $("greeting").textContent=state.settings.name?`WELCOME BACK, ${state.settings.name.toUpperCase()}`:"YOUR FINANCIAL SPACE";
 $("todayDate").textContent=new Date().toLocaleDateString("en-PH",{weekday:"long",month:"long",day:"numeric"});
 $("budgetSpent").textContent=shortMoney(spent);$("budgetLimit").textContent=budget?shortMoney(budget):"Not set";
 const pct=budget?spent/budget*100:0;$("budgetBar").style.width=`${Math.min(100,pct)}%`;$("budgetPercent").textContent=`${Math.round(pct)}% used`;
 $("budgetStatus").textContent=budget?(budgetLeft>=0?`${shortMoney(budgetLeft)} left`:`${shortMoney(Math.abs(budgetLeft))} over limit`):"Set your budget to start";
 $("budgetWarnings").textContent=budget&&pct>=90?"⚠ You have used more than 90% of your monthly budget.":budget&&pct>=75?"You have used more than 75% of your monthly budget.":"";
 renderRecent(tx);renderCategoryChart(tx);renderBudgetPage();renderGoals();renderReports();renderTransactionsPage();renderSettings();renderAlerts();
}
function txMarkup(t){
 const income=t.type==="income",symbol=income?"↗":"↘";
 return `<div class="tx-row"><div class="tx-symbol ${t.type}">${symbol}</div><div class="tx-main"><b>${esc(t.description)}${t.recurringParent||t.recurring?` <span title="Recurring">↻</span>`:""}</b><small>${esc(t.category)} · ${fmtDate(t.date)}${t.note?` · ${esc(t.note)}`:""}</small></div><div><div class="tx-value ${t.type}">${income?"+":"−"}${money(t.amount)}</div><div class="tx-actions"><button data-edit-tx="${esc(t.id)}">Edit</button><button data-delete-tx="${esc(t.id)}">Delete</button></div></div></div>`;
}
function renderRecent(tx){const sorted=[...tx].sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created).slice(0,5);$("recentTransactions").innerHTML=sorted.map(txMarkup).join("");$("recentEmpty").hidden=tx.length>0}
function categorySums(tx){const o={};tx.filter(t=>t.type==="expense").forEach(t=>o[t.category]=(o[t.category]||0)+t.amount);return Object.entries(o).sort((a,b)=>b[1]-a[1])}
function renderCategoryChart(tx){
 const entries=categorySums(tx),total=entries.reduce((a,x)=>a+x[1],0);let angle=0;
 const parts=entries.map(([n,v],i)=>{const from=angle;angle+=total?v/total*360:0;return `${palette[i%palette.length]} ${from}deg ${angle}deg`});
 $("categoryDonut").style.background=entries.length?`conic-gradient(${parts.join(",")})`:"conic-gradient(#cbd0df 0deg 360deg)";
 $("donutAmount").textContent=shortMoney(total);
 $("categoryLegend").innerHTML=entries.length?entries.slice(0,6).map(([n,v],i)=>`<div class="legend-row"><i class="legend-dot" style="background:${palette[i%palette.length]}"></i><span>${esc(n)}</span><b>${shortMoney(v)}</b></div>`).join(""):`<span style="font-size:9px;color:#929aaf">No spending recorded</span>`;
}
function renderTransactionsPage(){
 const q=($("transactionSearch")?.value||"").toLowerCase(),type=$("typeFilter")?.value||"all",cat=$("categoryFilter")?.value||"all";
 const tx=monthTx().filter(t=>(type==="all"||t.type===type)&&(cat==="all"||t.category===cat)&&(`${t.description} ${t.category} ${t.note||""}`).toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date)||b.created-a.created);
 $("allTransactions").innerHTML=tx.map(txMarkup).join("");$("allEmpty").hidden=tx.length>0;$("resultCount").textContent=`${tx.length} ${tx.length===1?"entry":"entries"}`;
 $("categoryFilter").innerHTML=`<option value="all">All categories</option>`+state.categories.map(c=>`<option value="${esc(c)}" ${c===cat?"selected":""}>${esc(c)}</option>`).join("");
}
function renderBudgetPage(){
 const {p,spent,income,balance,tx}=calc();$("planAllowance").textContent=money(+p.allowance||0);$("planBudget").textContent=money(+p.budget||0);$("planSpent").textContent=money(spent);$("planAvailable").textContent=money(balance);
 const sums=categorySums(tx);const all=[...new Set([...state.categories,...sums.map(x=>x[0])])];
 $("categoryBudgets").innerHTML=all.map((c,i)=>{const actual=sums.find(x=>x[0]===c)?.[1]||0,limit=+(state.categoryBudgets[currentMonth()]||{})[c]||0,ratio=limit?actual/limit*100:0;return `<div class="cat-budget-row"><div class="cat-budget-name">${esc(c)}<small>${limit?`${Math.round(ratio)}% of limit`:"No limit set"}</small></div><div class="cat-budget-meter"><span style="width:${limit?Math.min(100,ratio):0}%;background:${limit&&ratio>=100?"#e28ca4":""}"></span></div><div class="cat-budget-value"><b>${limit?money(limit):"—"}</b>${money(actual)} spent</div></div>`}).join("");
}
function renderGoals(){
 const goals=state.goals,saved=goals.reduce((a,g)=>a+(+g.current||0),0),target=goals.reduce((a,g)=>a+(+g.target||0),0),done=goals.filter(g=>g.current>=g.target).length;
 $("goalsSaved").textContent=money(saved);$("goalsTarget").textContent=money(target);$("goalsCompleted").textContent=done;
 $("goalPreview").innerHTML=goals.slice(0,2).map(g=>{const pct=Math.min(100,g.current/g.target*100);return `<div class="goal-mini"><div class="goal-mini-top"><b>${esc(g.name)}</b><span>${Math.round(pct)}%</span></div><div class="mini-track"><span style="width:${pct}%"></span></div></div>`}).join("")||`<div class="empty-state"><span>◎</span><p>No savings goals yet</p></div>`;
 $("goalsGrid").innerHTML=goals.map(g=>{const pct=Math.min(100,g.current/g.target*100),done=g.current>=g.target;return `<article class="goal-card glass"><div class="goal-card-top"><span class="goal-emoji">✧</span><button class="goal-menu" data-goal-delete="${g.id}" title="Delete goal">···</button></div><h3>${esc(g.name)}</h3><p>${g.date?`Target date · ${fmtDate(g.date)}`:"No target date set"}</p><div class="goal-amounts"><span>Saved <b>${money(g.current)}</b></span><span>Target <b>${money(g.target)}</b></span></div><div class="goal-progress"><span style="width:${pct}%"></span></div><div class="goal-card-actions"><button class="secondary-button" data-goal-edit="${g.id}">Edit goal</button><button class="primary-button compact" data-goal-add="${g.id}">${done?"Completed":"＋ Add savings"}</button></div></article>`}).join("");
 $("goalsEmpty").hidden=goals.length>0;
}
function renderReports(){
 const {tx,spent,income}=calc(),expenses=tx.filter(t=>t.type==="expense"),elapsed=currentMonth()===iso(today).slice(0,7)?today.getDate():new Date(currentMonth()+"-01T12:00:00").getDate();
 $("averageDaily").textContent=money(spent/Math.max(1,elapsed));const largest=[...expenses].sort((a,b)=>b.amount-a.amount)[0];
 $("largestExpense").textContent=largest?money(largest.amount):money(0);$("largestExpenseName").textContent=largest?largest.description:"No expenses yet";$("reportCount").textContent=tx.length;
 $("savingRate").textContent=income?`${Math.round((income-spent)/income*100)}%`:"0%";
 const months=[];const base=new Date(currentMonth()+"-01T12:00:00");
 for(let i=5;i>=0;i--){const d=new Date(base.getFullYear(),base.getMonth()-i,1),m=iso(d).slice(0,7),items=state.transactions.filter(t=>monthOf(t.date)===m),extra=items.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0),out=items.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0),allow=+(state.plans[m]?.allowance||0);months.push({label:d.toLocaleDateString("en-PH",{month:"short"}),income:extra+allow,expense:out})}
 const max=Math.max(1,...months.flatMap(x=>[x.income,x.expense]));
 $("monthlyChart").innerHTML=months.map(m=>`<div class="month-column"><div class="bars"><div class="bar income" style="height:${Math.max(2,m.income/max*100)}%" title="Income ${money(m.income)}"></div><div class="bar expense" style="height:${Math.max(2,m.expense/max*100)}%" title="Expenses ${money(m.expense)}"></div></div><small>${m.label}</small></div>`).join("");
 const sums=categorySums(tx),total=sums.reduce((a,x)=>a+x[1],0);
 $("reportCategories").innerHTML=sums.length?sums.map(([n,v])=>`<div class="report-cat"><span>${esc(n)}</span><div class="report-cat-track"><span style="width:${total?v/total*100:0}%"></span></div><b>${money(v)}</b></div>`).join(""):`<div class="empty-state"><p>No expenses recorded for this month.</p></div>`;
}
function renderSettings(){
 $("settingsName").value=state.settings.name||"";$("appearanceSelect").value=state.settings.theme||"light";
 document.querySelectorAll(".swatch").forEach(b=>b.classList.toggle("selected",b.dataset.accent===(state.settings.accent||"lavender")));
 $("settingsCategories").innerHTML=state.categories.map(c=>`<div class="settings-category"><span>${esc(c)}</span><button data-remove-category="${esc(c)}">Remove</button></div>`).join("");
}
function alertMessages(){
 const {p,spent,balance}=calc(),budget=+p.budget||0,alerts=[];
 if(budget&&spent/budget>=1)alerts.push({good:false,title:"Spending budget exceeded",body:`You are ${money(spent-budget)} over your monthly spending limit.`});
 else if(budget&&spent/budget>=.9)alerts.push({good:false,title:"90% of budget used",body:"You are close to your monthly spending limit."});
 else if(budget&&spent/budget>=.75)alerts.push({good:false,title:"75% of budget used",body:"Keep an eye on your remaining spending room."});
 if(balance<0)alerts.push({good:false,title:"Available balance is below zero",body:"Your recorded expenses are higher than your allowance and extra income."});
 if(!alerts.length)alerts.push({good:true,title:"You're looking good",body:"No budget alerts right now. Keep tracking your money mindfully."});
 return alerts;
}
function renderAlerts(){const a=alertMessages();$("alertDot").classList.toggle("show",a.some(x=>!x.good));$("alertsContent").innerHTML=a.map(x=>`<div class="alert-line ${x.good?"good":""}"><b>${x.title}</b><br>${x.body}</div>`).join("")}
function renderPage(page){if(page==="overview"||page==="transactions"||page==="budgets"||page==="goals"||page==="reports"||page==="settings")render()}
function openTx(type="expense",item=null){
 txType=item?.type||type;$("txModalTitle").textContent=item?"Edit transaction":"Add transaction";$("txId").value=item?.id||"";
 $("txDescription").value=item?.description||"";$("txAmount").value=item?.amount??"";$("txDate").value=item?.date||iso(today);$("txNote").value=item?.note||"";$("txRecurring").checked=!!item?.recurring;
 document.querySelectorAll("[data-txtype]").forEach(b=>b.classList.toggle("selected",b.dataset.txtype===txType));
 $("txCategory").innerHTML=state.categories.map(c=>`<option value="${esc(c)}" ${c===(item?.category||state.categories[0])?"selected":""}>${esc(c)}</option>`).join("");
 $("transactionModal").showModal();setTimeout(()=>$("txDescription").focus(),40);
}
function openPlan(){const p=plan();$("allowanceInput").value=p.allowance||"";$("budgetInput").value=p.budget||"";$("planModal").showModal()}
function openGoal(g=null){$("goalModalTitle").textContent=g?"Edit savings goal":"Create savings goal";$("goalId").value=g?.id||"";$("goalName").value=g?.name||"";$("goalTarget").value=g?.target||"";$("goalCurrent").value=g?.current||0;$("goalDate").value=g?.date||"";$("goalModal").showModal()}
function openCategoryBudget(){const sums=categorySums(monthTx());const opts=[...new Set([...state.categories,...sums.map(x=>x[0])])];$("categoryBudgetSelect").innerHTML=opts.map(c=>`<option>${esc(c)}</option>`).join("");$("categoryBudgetAmount").value="";$("categoryBudgetModal").showModal()}
function exportJson(){download(`piso-pulse-backup-${currentMonth()}.json`,JSON.stringify(state,null,2),"application/json");toast("Backup downloaded")}
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportCsv(){
 const rows=[["Date","Type","Description","Category","Amount","Note"],...state.transactions.filter(t=>monthOf(t.date)===currentMonth()).sort((a,b)=>a.date.localeCompare(b.date)).map(t=>[t.date,t.type,t.description,t.category,t.amount,t.note||""])];
 const csv=rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");download(`piso-pulse-transactions-${currentMonth()}.csv`,"\ufeff"+csv,"text/csv;charset=utf-8");toast("CSV exported");
}
function deleteTx(id){const t=state.transactions.find(x=>x.id===id);if(!t)return;if(!confirm(`Delete "${t.description}"?`))return;state.transactions=state.transactions.filter(x=>x.id!==id&&x.recurringParent!==id);save();render();toast("Transaction deleted")}
function handleTxClick(e){const edit=e.target.closest("[data-edit-tx]"),del=e.target.closest("[data-delete-tx]");if(edit){const t=state.transactions.find(x=>x.id===edit.dataset.editTx);if(t)openTx(t.type,t)}if(del)deleteTx(del.dataset.deleteTx)}
// Navigation and common actions
document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.goto)));
$("quickAdd").onclick=$("firstTransaction").onclick=$("transactionPageAdd").onclick=()=>openTx();
$("editMonthlyPlan").onclick=$("editPlanBottom").onclick=openPlan;
$("newGoalQuick").onclick=$("createGoal").onclick=$("createFirstGoal").onclick=()=>openGoal();
$("profileSettings").onclick=()=>setPage("settings");
$("notificationButton").onclick=()=>$("alertsModal").showModal();
$("themeToggle").onclick=()=>{state.settings.theme=state.settings.theme==="dark"?"light":"dark";applyTheme();save()};
$("monthPicker").value=iso(today).slice(0,7);
$("monthPicker").addEventListener("change",()=>{ensureRecurring();render()});
$("recentTransactions").addEventListener("click",handleTxClick);$("allTransactions").addEventListener("click",handleTxClick);
["transactionSearch","typeFilter","categoryFilter"].forEach(id=>$(id).addEventListener(id==="transactionSearch"?"input":"change",renderTransactionsPage));
$("clearFilters").onclick=()=>{$("transactionSearch").value="";$("typeFilter").value="all";$("categoryFilter").value="all";renderTransactionsPage()};
document.querySelectorAll("[data-txtype]").forEach(b=>b.onclick=()=>{txType=b.dataset.txtype;document.querySelectorAll("[data-txtype]").forEach(x=>x.classList.toggle("selected",x===b))});
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).close());
$("transactionForm").addEventListener("submit",e=>{e.preventDefault();const amount=+$("txAmount").value,desc=$("txDescription").value.trim();if(!(amount>0)||!desc){toast("Enter a description and valid amount");return}
 const id=$("txId").value,old=state.transactions.find(t=>t.id===id),item={id:id||`tx-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type:txType,description:desc,amount,date:$("txDate").value,category:$("txCategory").value,note:$("txNote").value.trim(),recurring:$("txRecurring").checked,created:old?.created||Date.now()};
 state.transactions=old?state.transactions.map(t=>t.id===id?item:t):[item,...state.transactions];save();$("transactionModal").close();render();toast(old?"Transaction updated":"Transaction saved")});
$("planForm").addEventListener("submit",e=>{e.preventDefault();const allowance=+$("allowanceInput").value||0,budget=+$("budgetInput").value||0;if(allowance<0||budget<0){toast("Amounts cannot be negative");return}state.plans[currentMonth()]={allowance,budget};save();$("planModal").close();render();toast("Monthly plan saved")});
$("goalForm").addEventListener("submit",e=>{e.preventDefault();const id=$("goalId").value,name=$("goalName").value.trim(),target=+$("goalTarget").value,current=+$("goalCurrent").value||0;if(!name||!(target>0)){toast("Enter a goal name and target amount");return}const g={id:id||`goal-${Date.now()}`,name,target,current:Math.min(current,target),date:$("goalDate").value};state.goals=id?state.goals.map(x=>x.id===id?g:x):[g,...state.goals];save();$("goalModal").close();render();toast("Savings goal saved")});
$("goalsGrid").addEventListener("click",e=>{
 const add=e.target.closest("[data-goal-add]"),edit=e.target.closest("[data-goal-edit]"),del=e.target.closest("[data-goal-delete]");
 if(add){const g=state.goals.find(x=>x.id===add.dataset.goalAdd);if(g&&g.current<g.target){$("contributionGoalId").value=g.id;$("contributionAmount").value="";$("contributionModal").showModal()}}
 if(edit){const g=state.goals.find(x=>x.id===edit.dataset.goalEdit);if(g)openGoal(g)}
 if(del){const g=state.goals.find(x=>x.id===del.dataset.goalDelete);if(g&&confirm(`Delete savings goal "${g.name}"?`)){state.goals=state.goals.filter(x=>x.id!==g.id);save();render();toast("Goal deleted")}}
});
$("contributionForm").addEventListener("submit",e=>{e.preventDefault();const id=$("contributionGoalId").value,amount=+$("contributionAmount").value,g=state.goals.find(x=>x.id===id);if(!g||!(amount>0))return;g.current=Math.min(g.target,g.current+amount);save();$("contributionModal").close();render();toast(g.current>=g.target?"Goal completed — congratulations!":"Savings added")});
$("addCategoryBudget").onclick=openCategoryBudget;
$("categoryBudgetForm").addEventListener("submit",e=>{e.preventDefault();const cat=$("categoryBudgetSelect").value,amount=+$("categoryBudgetAmount").value;if(amount<0){toast("Enter a valid limit");return}state.categoryBudgets[currentMonth()]={...(state.categoryBudgets[currentMonth()]||{}),[cat]:amount};save();$("categoryBudgetModal").close();render();toast("Category budget saved")});
$("createCategory").onclick=()=>{const name=$("newCategoryName").value.trim();if(!name)return;if(state.categories.some(c=>c.toLowerCase()===name.toLowerCase())){toast("Category already exists");return}state.categories.push(name);$("newCategoryName").value="";save();render();toast("Category added")};
$("settingsCategories").addEventListener("click",e=>{const b=e.target.closest("[data-remove-category]");if(!b)return;const name=b.dataset.removeCategory;if(state.transactions.some(t=>t.category===name)){toast("This category is used by transactions");return}if(confirm(`Remove category "${name}"?`)){state.categories=state.categories.filter(c=>c!==name);save();render()}});
$("accentSwatches").addEventListener("click",e=>{const b=e.target.closest("[data-accent]");if(!b)return;state.settings.accent=b.dataset.accent;document.querySelectorAll(".swatch").forEach(x=>x.classList.toggle("selected",x===b));applyAccent()});
function applyAccent(){const map={lavender:["#8178e9","#eeecff"],ocean:["#4f9ecb","#e4f3fb"],rose:["#dc829e","#fbeaf0"],mint:["#48ae96","#e4f6f0"]},c=map[state.settings.accent||"lavender"];document.documentElement.style.setProperty("--accent",c[0]);document.documentElement.style.setProperty("--accent-soft",c[1])}
function applyTheme(){document.body.classList.toggle("dark-mode",state.settings.theme==="dark");$("appearanceSelect").value=state.settings.theme||"light";$("themeToggle").textContent=state.settings.theme==="dark"?"☾":"☼"}
$("saveSettings").onclick=()=>{state.settings.name=$("settingsName").value.trim();state.settings.theme=$("appearanceSelect").value;applyTheme();applyAccent();save();render();toast("Preferences saved")};
$("appearanceSelect").addEventListener("change",()=>{state.settings.theme=$("appearanceSelect").value;applyTheme()});
$("backupJson").onclick=exportJson;$("exportCsv").onclick=$("exportCsvSettings").onclick=exportCsv;
$("importJson").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const parsed=JSON.parse(await f.text());if(!parsed||!Array.isArray(parsed.transactions)||!Array.isArray(parsed.categories))throw Error("Invalid");if(!confirm("Importing this backup will replace your current tracker data. Continue?"))return;state={...parsed,plans:parsed.plans||{},goals:parsed.goals||[],categoryBudgets:parsed.categoryBudgets||{},settings:parsed.settings||{}};save();applyTheme();applyAccent();render();toast("Backup imported")}catch(err){toast("That backup file could not be read")}e.target.value=""});
$("clearData").onclick=()=>{if(!confirm("Permanently delete all budgets, transactions, goals, and preferences from this browser? Export a backup first if you need one."))return;localStorage.removeItem(KEY);state={transactions:[],categories:[...defaults],plans:{},goals:[],categoryBudgets:{},settings:{theme:"light",accent:"lavender",name:""}};applyTheme();applyAccent();render();toast("Tracker reset")};
function init(){ensureRecurring();applyTheme();applyAccent();render();setPage("overview")}
init();
})();