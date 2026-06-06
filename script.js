
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

function getRecordText(record){
  return [
    record?.title,
    record?.answer,
    record?.detail,
    record?.description,
    record?.keywords,
    record?.category,
    record?.type,
    record?.people,
    record?.year,
    record?.date
  ].filter(Boolean).join(" ");
}

function getRecordYears(record){
  if(record?.year && /^\d{3,4}$/.test(String(record.year))){
    return [Number(record.year)];
  }
  const matches = getRecordText(record).match(/\b(1[0-9]{3}|20[0-9]{2})\b/g) || [];
  return [...new Set(matches.map(Number))];
}

function scoreYearToolRecord(record, query, numericYear){
  const text = normalizeTR(getRecordText(record));
  const title = normalizeTR(record?.title || "");
  const answer = normalizeTR(record?.answer || "");
  const detail = normalizeTR(record?.detail || record?.description || "");
  const yearText = String(record?.year || "");
  let score = 0;

  if(numericYear){
    if(yearText === String(numericYear)) score += 900;
    if(text.includes(String(numericYear))) score += 220;
    return score;
  }

  if(!query) return 0;
  if(title === query) score += 900;
  if(title.includes(query)) score += 520;
  if(answer.includes(query)) score += 160;
  if(detail.includes(query)) score += 90;
  if(yearText.includes(query)) score += 60;

  query.split(/\s+/).filter(Boolean).forEach(word => {
    if(title.includes(word)) score += 90;
    if(answer.includes(word)) score += 34;
    if(detail.includes(word)) score += 16;
    if(text.includes(word)) score += 8;
  });

  return score;
}

function buildYearToolIntro(input, matches, numericYear){
  const currentYear = new Date().getFullYear();
  const best = matches[0];

  if(numericYear){
    const diff = Math.abs(currentYear - numericYear);
    if(numericYear > currentYear){
      return `Bu yıl gelecekte görünüyor. ${numericYear} yılına yaklaşık ${diff} yıl var.`;
    }
    return `${numericYear} yılından bugüne ${currentYear - numericYear} yıl geçti.`;
  }

  const years = best ? getRecordYears(best) : [];
  if(years.length === 1){
    const diff = Math.abs(currentYear - years[0]);
    if(years[0] > currentYear){
      return `Bu konu ${years[0]} yılıyla ilişkilidir. O yıla yaklaşık ${diff} yıl var.`;
    }
    return `Bu olay ${years[0]} yılıyla ilişkilidir. Bugüne kadar yaklaşık ${currentYear - years[0]} yıl geçti.`;
  }
  if(years.length > 1){
    return `En ilgili kaydın içinde geçen yıllar: ${years.slice(0,4).join(", ")}. Birden fazla yıl olduğu için tek bir yılı kesin sonuç olarak göstermiyoruz.`;
  }
  return `"${input}" için site kayıtlarında benzer başlıklar arandı.`;
}

function renderYearTool(){
  const input = document.getElementById("yearToolInput");
  const result = document.getElementById("yearToolResult");
  if(!input || !result) return;

  const raw = input.value.trim();
  if(!raw){
    result.hidden = true;
    result.innerHTML = "";
    return;
  }

  if(!/[0-9A-Za-zÇĞİÖŞÜçğıöşü]/.test(raw)){
    result.hidden = false;
    result.innerHTML = `<p class="year-tool-message">Lütfen 1453, 1923 gibi bir yıl veya İstanbul’un fethi gibi bir konu yazın.</p>`;
    return;
  }

  if(/^\d+$/.test(raw) && !/^\d{3,4}$/.test(raw)){
    result.hidden = false;
    result.innerHTML = `<p class="year-tool-message">Yıl aramak için 1453 veya 1923 gibi 3-4 haneli bir değer yazın.</p>`;
    return;
  }

  const yearMatch = raw.match(/^\d{3,4}$/);
  const numericYear = yearMatch ? Number(raw) : null;
  if(numericYear && (numericYear < 1000 || numericYear > 2999)){
    result.hidden = false;
    result.innerHTML = `<p class="year-tool-message">Lütfen 1453, 1923 gibi bir yıl veya İstanbul’un fethi gibi bir konu yazın.</p>`;
    return;
  }

  const query = normalizeTR(raw);
  const matches = (window.HY_DATA || [])
    .map(record => ({record, score: scoreYearToolRecord(record, query, numericYear)}))
    .filter(item => item.score > 0 && item.record?.slug)
    .sort((a,b) => b.score - a.score || Number(b.record.year || 0) - Number(a.record.year || 0))
    .map(item => item.record);

  const heading = numericYear ? `${numericYear} yılıyla ilgili kayıtlar` : "İlgili kayıtlar";
  const intro = buildYearToolIntro(raw, matches, numericYear);
  const count = matches.length;
  const rows = matches.slice(0,6).map(record => {
    const desc = record.answer || record.detail || record.description || "";
    const shortDesc = desc.length > 150 ? desc.slice(0,147).trim() + "..." : desc;
    return `<a href="${record.slug}"><strong>${record.title}</strong><small>${shortDesc}</small><span>Sayfayı aç</span></a>`;
  }).join("");

  result.hidden = false;
  if(!count){
    const emptyText = numericYear
      ? `${numericYear} yılı için doğrudan kayıt bulunamadı. Benzer tarih ve olay kayıtlarına <a href="tum-kayitlar.html">Tüm Kayıtlar</a>’dan bakabilirsiniz.`
      : `Bu konu için doğrudan kayıt bulunamadı. Benzer sonuçlar için <a href="tum-kayitlar.html">Tüm Kayıtlar</a> sayfasına bakabilirsiniz.`;
    result.innerHTML = `
      <p class="year-tool-message">${intro}</p>
      <p class="year-tool-count">0 kayıt bulundu.</p>
      <p>${emptyText}</p>
    `;
    return;
  }

  result.innerHTML = `
    <p class="year-tool-message">${intro}</p>
    <p class="year-tool-count">${count} kayıt bulundu.</p>
    <h3>${heading}</h3>
    <div class="year-tool-list">${rows}</div>
    <a class="year-tool-all" href="tum-kayitlar.html">Tüm Kayıtlar’a bak</a>
  `;
}

function initYearTool(){
  const input = document.getElementById("yearToolInput");
  const button = document.getElementById("yearToolButton");
  if(!input || !button) return;

  button.addEventListener("click", renderYearTool);
  input.addEventListener("input", renderYearTool);
  input.addEventListener("keydown", event => {
    if(event.key === "Enter"){
      event.preventDefault();
      renderYearTool();
    }
  });
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


const homePlaceholders=[
  "Örnek: Ampul hangi yıl icat edildi?",
  "Örnek: İlk telefon hangi yıl çıktı?",
  "Örnek: İstanbul hangi yıl fethedildi?",
  "Örnek: Cumhuriyet hangi yıl ilan edildi?",
  "Örnek: İnternet hangi yıl ortaya çıktı?",
  "Örnek: İlk uçak hangi yıl uçtu?",
  "Örnek: ChatGPT hangi yıl çıktı?",
  "Örnek: 12 Eylül darbesi hangi yıl oldu?",
  "Örnek: İlk iPhone hangi yıl çıktı?",
  "Örnek: Google hangi yıl kuruldu?",
  "Örnek: Televizyon hangi yıl icat edildi?",
  "Örnek: Matbaa hangi yıl icat edildi?",
  "Örnek: İlk otomobil hangi yıl üretildi?",
  "Örnek: Ay’a ilk iniş hangi yıl oldu?",
  "Örnek: Türkiye hangi yıl cumhuriyet oldu?"
];
function rotateHomePlaceholder(){
  const inputs=[document.getElementById("bigSearchInput"), document.getElementById("sideSearchInput")].filter(Boolean);
  if(!inputs.length) return;
  let index=Math.floor(Math.random()*homePlaceholders.length);
  const apply=()=>{
    inputs.forEach(input=>{ if(!input.value.trim()) input.placeholder=homePlaceholders[index % homePlaceholders.length]; });
    index=(index+1)%homePlaceholders.length;
  };
  apply();
  setInterval(apply,4000);
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
  rotateHomePlaceholder();
  initYearTool();
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
