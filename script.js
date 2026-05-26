
function normalizeTR(s){return(s||"").toLowerCase().replaceAll("ı","i").replaceAll("ğ","g").replaceAll("ü","u").replaceAll("ş","s").replaceAll("ö","o").replaceAll("ç","c");}

function getSearchTerm(){
  const big=document.getElementById("bigSearchInput");
  const side=document.getElementById("sideSearchInput");
  return (big && big.value.trim()) || (side && side.value.trim()) || "";
}

function filterData(){
  if(!window.HY_DATA) return [];
  const q=normalizeTR(getSearchTerm());
  const type=document.getElementById("typeFilter")?.value||"";
  const year=document.getElementById("yearFilter")?.value||"";
  return window.HY_DATA.filter(r=>{
    const hay=normalizeTR((r.title||"")+" "+(r.answer||"")+" "+(r.detail||"")+" "+(r.people||"")+" "+(r.category||"")+" "+(r.year||""));
    const hit=!q || hay.includes(q);
    const okType=!type || r.type===type;
    const okYear=!year || String(r.year)===String(year);
    return hit && okType && okYear;
  }).sort((a,b)=>b.year-a.year);
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
  data.slice(0,12).forEach(r=>{
    const a=document.createElement("a"); a.href=r.slug;
    a.innerHTML=`<b>${r.year}</b><span>${r.type}</span><p><strong>${r.title}</strong><br>${r.answer}</p>`;
    box.appendChild(a);
  });
  if(data.length===0){
    box.innerHTML='<a href="arama-yok.html"><b>?</b><span>Yok</span><p><strong>Sonuç bulunamadı</strong><br>Bu konu yeni içerik olarak eklenebilir.</p></a>';
  }
}

function syncSearch(source){
  const big=document.getElementById("bigSearchInput");
  const side=document.getElementById("sideSearchInput");
  if(source==="big" && side && big) side.value=big.value;
  if(source==="side" && side && big) big.value=side.value;
  renderArchive();
}

function fillYears(){
  const sel=document.getElementById("yearFilter"); if(!sel || !window.HY_DATA) return;
  const years=[...new Set(window.HY_DATA.map(r=>r.year))].sort((a,b)=>b-a);
  years.forEach(y=>{const o=document.createElement("option");o.value=y;o.textContent=y;sel.appendChild(o);});
}

document.addEventListener("DOMContentLoaded",()=>{
  fillYears();
  renderArchive();
  const big=document.getElementById("bigSearchInput");
  const side=document.getElementById("sideSearchInput");
  if(big){
    big.addEventListener("input",()=>syncSearch("big"));
    big.addEventListener("keydown",e=>{if(e.key==="Enter"){const first=document.querySelector("#bigSearchResults a, #archiveList a"); if(first) location.href=first.getAttribute("href");}});
  }
  if(side){
    side.addEventListener("input",()=>syncSearch("side"));
  }
  ["typeFilter","yearFilter"].forEach(id=>{const el=document.getElementById(id); if(el) el.addEventListener("input",renderArchive);});
});

function useSuggestion(term){
  const big=document.getElementById("bigSearchInput");
  const side=document.getElementById("sideSearchInput");
  if(big){ big.value=term; }
  if(side){ side.value=term; }
  renderArchive();
}
