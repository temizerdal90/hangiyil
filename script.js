
function normalizeTR(s){
  return (s||"").toLowerCase()
    .replaceAll("ı","i").replaceAll("İ","i")
    .replaceAll("ğ","g").replaceAll("ü","u")
    .replaceAll("ş","s").replaceAll("ö","o")
    .replaceAll("ç","c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}

function getSearchTerm(){
  const big=document.getElementById("bigSearchInput");
  const side=document.getElementById("sideSearchInput");
  return (big && big.value.trim()) || (side && side.value.trim()) || "";
}

function scoreRecord(r, q){
  const title=normalizeTR(r.title||"");
  const answer=normalizeTR(r.answer||"");
  const detail=normalizeTR(r.detail||"");
  const people=normalizeTR(r.people||"");
  const cat=normalizeTR(r.category||"");
  const year=String(r.year||"");
  if(!q) return 1;

  const words=q.split(/\s+/).filter(Boolean);
  let score=0;
  if(title===q) score+=1000;
  if(people===q) score+=900;
  if(title.includes(q)) score+=520;
  if(people && people.includes(q)) score+=420;
  if(answer.includes(q)) score+=180;
  if(detail.includes(q)) score+=90;
  if(cat.includes(q)) score+=30;
  if(year.includes(q)) score+=60;

  words.forEach(w=>{
    if(title.includes(w)) score+=95;
    if(people.includes(w)) score+=90;
    if(answer.includes(w)) score+=35;
    if(detail.includes(w)) score+=15;
  });
  return score;
}

function filterData(){
  if(!window.HY_DATA) return [];
  const q=normalizeTR(getSearchTerm());
  const type=document.getElementById("typeFilter")?.value||"";
  const year=document.getElementById("yearFilter")?.value||"";

  return window.HY_DATA
    .map(r=>({r, score:scoreRecord(r,q)}))
    .filter(x=>{
      const okQuery=!q || x.score>0;
      const okType=!type || x.r.type===type;
      const okYear=!year || String(x.r.year)===String(year);
      return okQuery && okType && okYear;
    })
    .sort((a,b)=> b.score-a.score || b.r.year-a.r.year)
    .map(x=>x.r);
}

function findKnowledge(q){
  const nq=normalizeTR(q);
  if(!nq || !window.HY_KNOWLEDGE) return null;
  let best=null, bestScore=0;
  window.HY_KNOWLEDGE.forEach(k=>{
    let s=0;
    (k.keys||[]).forEach(key=>{
      const nk=normalizeTR(key);
      if(nq===nk) s+=100;
      else if(nq.includes(nk) || nk.includes(nq)) s+=60;
      else {
        nq.split(/\s+/).forEach(w=>{ if(w && nk.includes(w)) s+=15; });
      }
    });
    if(s>bestScore){ bestScore=s; best=k; }
  });
  return bestScore>0 ? best : null;
}

function makeSmartAnswer(q, data){
  // Sitede sonuç varsa bilgi kutusu gösterme; sadece sonuç kartları listelensin.
  if(data.length>0){
    return "";
  }

  const k=findKnowledge(q);
  if(k){
    return `<div class="ai-answer-box"><p><b>${k.title}</b></p><p>${k.text}</p><div class="mini-results"><a href="${k.url}"><strong>Bu ba?lıkla ilgili sayfayı aç</strong><br><small>Detaylı yıl cevabını görüntüle</small></a></div></div>`;
  }

  const fallback=(window.HY_DATA||[]).slice().sort((a,b)=>b.year-a.year).slice(0,4);
  const rows=fallback.map(r=>`<a href="${r.slug}"><strong>${r.title}</strong><br><small>${r.answer}</small></a>`).join("");
  return `<div class="ai-answer-box"><p><b>Sonuç bulunamadı.</b> "${q}" için birebir kayıt bulamadık.</p><p>A?a?ıdaki güncel veya benzer kayıtları inceleyebilir, <a href="tum-kayitlar.html">Tüm Kayıtlar</a> sayfasından bütün ba?lıklara bakabilir ya da daha kısa bir ifadeyle yeniden arayabilirsin.</p><div class="mini-results">${rows}</div></div>`;
}

function renderArchive(){
  const data=filterData();
  const box=document.getElementById("archiveList");
  const count=document.getElementById("archiveCount");
  if(count) count.textContent=data.length+" kayıt";
  if(box){
    box.innerHTML="";
    data.slice(0,600).forEach(r=>{
      const a=document.createElement("a"); a.className="archive-row"; a.href=r.slug;
      a.innerHTML=`<b>${r.year}</b><span>${r.type}</span><p><strong>${r.title}</strong><br>${r.answer}</p>`;
      box.appendChild(a);
    });
  }
  renderBigSearchResults(data);
}

function renderBigSearchResults(data){
  const box=document.getElementById("bigSearchResults");
  if(!box) return;
  const q=getSearchTerm().trim();
  box.innerHTML="";
  if(q.length<1) return;

  box.innerHTML = makeSmartAnswer(q, data);

  data.slice(0,8).forEach(r=>{
    const a=document.createElement("a"); a.href=r.slug;
    a.innerHTML=`<b>${r.year}</b><span>${r.type}</span><p><strong>${r.title}</strong><br>${r.answer}</p>`;
    box.appendChild(a);
  });
}

function syncSearch(source){
  const big=document.getElementById("bigSearchInput");
  const side=document.getElementById("sideSearchInput");
  if(source==="big" && side && big) side.value=big.value;
  if(source==="side" && side && big) big.value=side.value;
  renderArchive();
  renderTodayBox();
}

function setQuickSearch(term){
  const big=document.getElementById("bigSearchInput");
  const side=document.getElementById("sideSearchInput");
  if(big) big.value=term;
  if(side) side.value=term;
  renderArchive();
}

function goToFirstSearchResult(){
  const first=document.querySelector("#bigSearchResults a[href$='.html'], #archiveList a");
  if(first) location.href=first.getAttribute("href");
}

function renderQuickSuggestions(){
  const box=document.querySelector(".quick-suggestions");
  if(!box || !window.HY_DATA) return;

  const records=(window.HY_DATA||[]).filter(r=>r?.title && r?.slug);
  const suggestions=[];
  const seen=new Set();

  const cleanText=(text)=>{
    const value=String(text||"");
    if(!/[\u00c3\u00c4\u00c5]/.test(value)) return value;
    try{ return decodeURIComponent(escape(value)); }
    catch(e){ return value; }
  };

  const textKey=(record)=>normalizeTR([
    cleanText(record.title),
    cleanText(record.category),
    cleanText(record.type),
    record.slug
  ].join(" "));

  const addSuggestion=(title, slug)=>{
    if(!title || !slug || seen.has(slug)) return;
    seen.add(slug);
    suggestions.push({title:cleanText(title), slug});
  };

  const randomIndex=(items)=>{
    if(!items.length) return null;
    return Math.floor(Math.random()*items.length);
  };

  const pickRandom=(items)=>{
    const index=randomIndex(items);
    return index===null ? null : items[index];
  };

  const groups=[
    record=>!/vefat|dogum|hayatini-kaybetti/.test(textKey(record)) && /cumhuriyet|fethi|darbe|savas|antlasma|devrim|imparatorluk|kuruldu/.test(textKey(record)),
    record=>/teknoloji|iphone|google|chatgpt|internet|youtube|facebook|bilgisayar/.test(textKey(record)),
    record=>/ilk|ilkler/.test(textKey(record)),
    record=>/vefat|kisi|ataturk|dogum|hayatini-kaybetti/.test(textKey(record)),
    record=>/spor|dunya-kupasi|olimpiyat|futbol/.test(textKey(record)),
    record=>/pandemi|covid|saglik|hastalik|asi/.test(textKey(record))
  ];

  const today=(window.HY_TODAY||[]).find(x=>x.url==="tarihte-bugun.html");
  addSuggestion("Tarihte bugün ne oldu?", today?.url || "tarihte-bugun.html");

  groups.forEach((match,index)=>{
    const pool=records.filter(record=>match(record) && !seen.has(record.slug));
    const record=pickRandom(pool);
    if(record) addSuggestion(record.title, record.slug);
  });

  const remaining=records.filter(record=>!seen.has(record.slug)).sort(()=>Math.random()-0.5);
  let fillOffset=0;
  while(suggestions.length<7 && fillOffset<remaining.length){
    const record=remaining[fillOffset++];
    addSuggestion(record.title, record.slug);
  }

  box.innerHTML=suggestions.slice(0,7).map(item=>
    `<a class="quick-suggestion" href="${item.slug}">${item.title}</a>`
  ).join("");
}

function fillYears(){
  const sel=document.getElementById("yearFilter"); if(!sel || !window.HY_DATA) return;
  const existing=[...sel.options].map(o=>o.value);
  const years=[...new Set(window.HY_DATA.map(r=>r.year))].sort((a,b)=>b-a);
  years.forEach(y=>{
    if(existing.includes(String(y))) return;
    const o=document.createElement("option");o.value=y;o.textContent=y;sel.appendChild(o);
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  fillYears();
  renderQuickSuggestions();
  renderArchive();
  const big=document.getElementById("bigSearchInput");
  const side=document.getElementById("sideSearchInput");
  if(big){
    big.addEventListener("input",()=>syncSearch("big"));
    big.addEventListener("keydown",e=>{
      if(e.key==="Enter"){
        const first=document.querySelector("#bigSearchResults a[href$='.html'], #archiveList a");
        if(first) location.href=first.getAttribute("href");
      }
    });
  }
  if(side) side.addEventListener("input",()=>syncSearch("side"));
  ["typeFilter","yearFilter"].forEach(id=>{
    const el=document.getElementById(id); if(el) el.addEventListener("input",renderArchive);
  });
});



function renderTodayBox(){
  const labelEl = document.getElementById("todayLabel");
  const titleEl = document.getElementById("todayTitle");
  const textEl = document.getElementById("todayText");

  if(!labelEl || !titleEl || !textEl){
    return;
  }

  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);

  const month = parts.find(p => p.type === "month")?.value || "01";
  const day = parts.find(p => p.type === "day")?.value || "01";
  const key = month + "-" + day;

  const fallbackLabel = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long"
  }).format(now);

  let items = [];
  if(window.HY_TODAY && Array.isArray(window.HY_TODAY)){
    items = window.HY_TODAY.filter(x => x.date === key);
  }

  if(items.length === 0){
    items = [{
      label: fallbackLabel,
      title: "Bugünün ar?ivi hazırlanıyor",
      year: "",
      text: "Bu tarih için kayıt eklendikçe burada otomatik görünür."
    }];
  }

  labelEl.textContent = items[0].label || fallbackLabel;
  titleEl.textContent = "Tarihte bugün ne oldu?";
  textEl.innerHTML = items.slice(0,3).map(it => {
    const title = (it.year ? it.year + " • " : "") + (it.title || "");
    const text = it.text || "";
    return `<span class="today-mini-event"><b>${title}</b><small>${text}</small></span>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", renderTodayBox);

