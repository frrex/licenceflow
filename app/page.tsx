"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

type License = {
  id:number; productName:string; vendor:string; category:string;
  startDate:string; expirationDate:string; cost:number; currency:string;
  description:string; responsible:string; department:string; archived:boolean;
  createdAt:string; updatedAt:string;
};

type LicenseForm = Omit<License,"id"|"archived"|"createdAt"|"updatedAt"|"cost"> & {cost:string};
type ImportLog = {id:number;fileName:string;importedCount:number;products:string[];createdAt:string};

const today=new Date();
const isoFromNow=(days:number)=>{const d=new Date(today);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)};
const sample=(data:Omit<License,"responsible"|"department"|"archived">&Partial<Pick<License,"responsible"|"department">>):License=>({...data,responsible:data.responsible||"",department:data.department||"",archived:false});
const seed:License[]=[
  sample({id:1,productName:"Microsoft 365 Business",vendor:"Microsoft",category:"Üretkenlik",startDate:"2025-09-01",expirationDate:isoFromNow(12),cost:14800,currency:"USD",description:"120 kullanıcı · yıllık kurumsal plan",department:"Bilgi Teknolojileri",createdAt:"2025-09-01",updatedAt:"2026-08-12"}),
  sample({id:2,productName:"Figma Organization",vendor:"Figma",category:"Tasarım",startDate:"2025-10-15",expirationDate:isoFromNow(24),cost:5400,currency:"USD",description:"25 editör lisansı",department:"Tasarım",createdAt:"2025-10-15",updatedAt:"2026-07-18"}),
  sample({id:3,productName:"Slack Business+",vendor:"Salesforce",category:"İletişim",startDate:"2026-01-10",expirationDate:isoFromNow(68),cost:9600,currency:"USD",description:"Yıllık ekip aboneliği",department:"Operasyon",createdAt:"2026-01-10",updatedAt:"2026-06-02"}),
  sample({id:4,productName:"Adobe Creative Cloud",vendor:"Adobe",category:"Tasarım",startDate:"2025-08-02",expirationDate:isoFromNow(-8),cost:7200,currency:"USD",description:"12 kullanıcı",department:"Tasarım",createdAt:"2025-08-02",updatedAt:"2026-05-29"}),
  sample({id:5,productName:"GitHub Enterprise",vendor:"GitHub",category:"Geliştirme",startDate:"2026-03-01",expirationDate:isoFromNow(142),cost:11200,currency:"USD",description:"50 kullanıcı",department:"Yazılım",createdAt:"2026-03-01",updatedAt:"2026-08-05"}),
];

const emptyForm:LicenseForm={productName:"",vendor:"",category:"Diğer",startDate:"",expirationDate:"",cost:"",currency:"USD",description:"",responsible:"",department:""};
function remainingDays(date:string){const start=new Date();start.setHours(0,0,0,0);return Math.ceil((new Date(`${date}T00:00:00`).getTime()-start.getTime())/86400000)}
function statusOf(date:string){const days=remainingDays(date);return days<=0?"Süresi Doldu":days<=30?"Yaklaşıyor":"Aktif"}
function money(value:number,currency:string){return new Intl.NumberFormat("tr-TR",{style:"currency",currency,maximumFractionDigits:0}).format(value)}
function shortDate(date:string){return new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${date}T12:00:00`))}
function excelExportDate(date:string){const [year,month,day]=date.split("-").map(Number);return new Date(year,month-1,day)}
function reminderText(days:number){if(days<0)return `${Math.abs(days)} gün gecikti`;if(days===0)return "Bugün sona eriyor";return `${days} gün kaldı`}

export default function Home(){
  const [licenses,setLicenses]=useState(seed);
  const [modalOpen,setModalOpen]=useState(false);
  const [editing,setEditing]=useState<number|null>(null);
  const [form,setForm]=useState<LicenseForm>(emptyForm);
  const [query,setQuery]=useState("");
  const [calendarLicenseId,setCalendarLicenseId]=useState<number|null>(null);
  const [recordView,setRecordView]=useState<"current"|"archived">("current");
  const [remindersOpen,setRemindersOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const [importLogs,setImportLogs]=useState<ImportLog[]>([]);
  const [importMessage,setImportMessage]=useState("");
  const [darkMode,setDarkMode]=useState(false);
  const [headerScrolled,setHeaderScrolled]=useState(false);
  const searchRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{fetch("/api/licenses").then(r=>r.ok?r.json():Promise.reject()).then(({licenses:rows})=>{if(rows.length)setLicenses(rows)}).catch(()=>{})},[]);
  useEffect(()=>{fetch("/api/import-logs").then(r=>r.ok?r.json():Promise.reject()).then(({logs})=>setImportLogs(logs)).catch(()=>{})},[]);
  useEffect(()=>{const saved=localStorage.getItem("licenceflow-theme");setDarkMode(saved?saved==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches)},[]);
  useEffect(()=>{const focusSearch=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();searchRef.current?.focus()}};window.addEventListener("keydown",focusSearch);return()=>window.removeEventListener("keydown",focusSearch)},[]);
  useEffect(()=>{const updateHeader=()=>setHeaderScrolled(window.scrollY>12);updateHeader();window.addEventListener("scroll",updateHeader,{passive:true});return()=>window.removeEventListener("scroll",updateHeader)},[]);

  const currentLicenses=useMemo(()=>licenses.filter(l=>!l.archived),[licenses]);
  const archivedLicenses=useMemo(()=>licenses.filter(l=>l.archived),[licenses]);
  const counts=useMemo(()=>({
    active:currentLicenses.filter(l=>statusOf(l.expirationDate)==="Aktif").length,
    soon:currentLicenses.filter(l=>statusOf(l.expirationDate)==="Yaklaşıyor").length,
    expired:currentLicenses.filter(l=>statusOf(l.expirationDate)==="Süresi Doldu").length,
  }),[currentLicenses]);
  const usdTotal=currentLicenses.reduce((sum,l)=>sum+(l.currency==="USD"?l.cost:0),0);
  const baseRows=recordView==="archived"?archivedLicenses:currentLicenses;
  const filtered=baseRows.filter(l=>{const q=query.toLocaleLowerCase("tr");return(!calendarLicenseId||l.id===calendarLicenseId)&&(!q||`${l.productName} ${l.vendor} ${l.category} ${l.department} ${statusOf(l.expirationDate)}`.toLocaleLowerCase("tr").includes(q))});
  const calendarFilteredLicense=calendarLicenseId?licenses.find(l=>l.id===calendarLicenseId):null;
  const reminders=[...currentLicenses].filter(l=>remainingDays(l.expirationDate)<=30).sort((a,b)=>remainingDays(a.expirationDate)-remainingDays(b.expirationDate));
  const renewals=reminders.slice(0,5);
  const categoryCosts=useMemo(()=>{
    const grouped:Record<string,number>={};
    currentLicenses.filter(l=>l.currency==="USD").forEach(l=>{grouped[l.category]=(grouped[l.category]||0)+l.cost});
    return Object.entries(grouped).sort((a,b)=>b[1]-a[1]);
  },[currentLicenses]);
  const maxCategoryCost=Math.max(...categoryCosts.map(([,value])=>value),1);

  const openAdd=()=>{setEditing(null);setForm(emptyForm);setModalOpen(true)};
  const openEdit=(license:License)=>{setEditing(license.id);setForm({productName:license.productName,vendor:license.vendor,category:license.category,startDate:license.startDate,expirationDate:license.expirationDate,cost:String(license.cost),currency:license.currency,description:license.description,responsible:license.responsible||"",department:license.department||""});setModalOpen(true)};

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    const payload={...form,cost:Number(form.cost),...(editing?{id:editing}:{})};
    try{
      const response=await fetch("/api/licenses",{method:editing?"PUT":"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      if(!response.ok)throw new Error();
      const {license}=await response.json();
      setLicenses(items=>editing?items.map(l=>l.id===editing?license:l):[license,...items]);
    }catch{
      const now=new Date().toISOString();
      if(editing)setLicenses(items=>items.map(l=>l.id===editing?{...l,...payload,cost:Number(payload.cost),updatedAt:now}:l));
      else setLicenses(items=>[{...payload,id:Date.now(),cost:Number(payload.cost),archived:false,createdAt:now,updatedAt:now},...items]);
    }
    setModalOpen(false);
  };

  const remove=async(id:number)=>{if(confirm("Bu lisans kaydını kalıcı olarak silmek istediğinize emin misiniz?")){setLicenses(items=>items.filter(l=>l.id!==id));try{await fetch(`/api/licenses?id=${id}`,{method:"DELETE"})}catch{}}};
  const archive=async(license:License)=>{const archived=!license.archived;setLicenses(items=>items.map(l=>l.id===license.id?{...l,archived}:l));try{await fetch("/api/licenses",{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({id:license.id,archived})})}catch{}};

  const exportExcel=()=>{
    const rows=filtered.map(l=>({"Ürün / Hizmet":l.productName,"Tedarikçi":l.vendor,"Kategori":l.category,"Başlangıç Tarihi":excelExportDate(l.startDate),"Bitiş Tarihi":excelExportDate(l.expirationDate),"Maliyet":l.cost,"Para Birimi":l.currency,"Departman":l.department,"Durum":l.archived?"Arşivlendi":statusOf(l.expirationDate),"Açıklama":l.description}));
    const sheet=XLSX.utils.json_to_sheet(rows,{cellDates:true});
    for(let row=2;row<=rows.length+1;row++){for(const column of ["D","E"]){const cell=sheet[`${column}${row}`];if(cell)cell.z='dd"."mm"."yyyy'}}
    sheet["!cols"]=[{wch:30},{wch:18},{wch:16},{wch:16},{wch:16},{wch:14},{wch:12},{wch:20},{wch:15},{wch:38}];
    const book=XLSX.utils.book_new();XLSX.utils.book_append_sheet(book,sheet,"Lisanslar");XLSX.writeFile(book,`licenceflow-lisanslar-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const importExcel=async(e:ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const book=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true});
      const rows=XLSX.utils.sheet_to_json<Record<string,unknown>>(book.Sheets[book.SheetNames[0]],{defval:""});
      const parsed=rows.map(row=>({productName:String(row["Ürün / Hizmet"]||row.productName||"").trim(),vendor:String(row.Tedarikçi||row.vendor||"").trim(),category:String(row.Kategori||row.category||"Diğer").trim(),startDate:excelDate(row["Başlangıç Tarihi"]||row.startDate),expirationDate:excelDate(row["Bitiş Tarihi"]||row.expirationDate),cost:numberValue(row.Maliyet||row.cost),currency:String(row["Para Birimi"]||row.currency||"USD").trim().toUpperCase(),responsible:"",department:String(row.Departman||row.department||"").trim(),description:String(row.Açıklama||row.description||"").trim()})).filter(row=>row.productName&&row.vendor&&row.startDate&&row.expirationDate);
      const imported:License[]=[];
      for(const row of parsed){const response=await fetch("/api/licenses",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(row)});if(response.ok){const data=await response.json();imported.push(data.license)}}
      setLicenses(items=>[...imported,...items]);setImportMessage(`${imported.length} lisans içe aktarıldı`);
      const logResponse=await fetch("/api/import-logs",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({fileName:file.name,importedCount:imported.length,products:imported.map(license=>license.productName)})});
      if(logResponse.ok){const {log}=await logResponse.json();setImportLogs(logs=>[log,...logs].slice(0,20))}
    }catch{setImportMessage("Dosya okunamadı. Sütun başlıklarını kontrol edin.")}
    e.target.value="";setTimeout(()=>setImportMessage(""),4000);
  };

  const toggleTheme=()=>setDarkMode(value=>{const next=!value;localStorage.setItem("licenceflow-theme",next?"dark":"light");return next});

  return <div className={`app-shell ${darkMode?"dark":""}`}>
    <main>
      <header className={`dashboard-header ${headerScrolled?"is-scrolled":""}`}>
        <div className="top-brand"><span className="brand-mark"><i/><i/></span><span><b>LicenceFlow</b><small>mehmet</small></span></div>
        <nav className="header-tabs" aria-label="Dashboard bölümleri"><a href="#overview">Özet</a><a href="#renewals">Yenilemeler</a><a href="#costs">Maliyet</a><a href="#licenses">Lisanslar</a></nav>
        <label className="global-search"><span>⌕</span><input ref={searchRef} value={query} onChange={e=>{setCalendarLicenseId(null);setQuery(e.target.value)}} onKeyDown={e=>{if(e.key==="Enter")document.getElementById("licenses")?.scrollIntoView({behavior:"smooth",block:"start"})}} placeholder="Lisanslarda ara..."/></label>
        <div className="header-actions">
          <button className={`theme-switch ${darkMode?"is-dark":"is-light"}`} aria-label={darkMode?"Açık temaya geç":"Koyu temaya geç"} aria-pressed={darkMode} title={darkMode?"Açık temaya geç":"Koyu temaya geç"} onClick={toggleTheme}><span className="theme-symbol" aria-hidden>{darkMode?"☾":"☼"}</span><span className="theme-knob" aria-hidden/></button>
          <button className="icon-button notify" aria-label="Hatırlatmalar" onClick={()=>setRemindersOpen(!remindersOpen)}><span className="notify-icon" aria-hidden>🔔</span>{reminders.length>0&&<span className="notification-count">{reminders.length}</span>}</button>
          <button className={`profile-chip ${profileOpen?"active":""}`} onClick={()=>{setProfileOpen(open=>!open);setRemindersOpen(false)}}><span>MY</span><div><b>Mehmet Yılmaz</b><small>Yönetici</small></div></button>
        </div>
        {profileOpen&&<div className="profile-menu"><div className="profile-menu-head"><span>MY</span><div><b>Mehmet Yılmaz</b><small>Yönetici · LicenceFlow</small></div><button onClick={()=>setProfileOpen(false)}>×</button></div><div className="import-log-head"><div><b>Excel Aktarım Geçmişi</b><small>Son 20 içe aktarma işlemi</small></div><span>{importLogs.length}</span></div><div className="import-log-list">{importLogs.map(log=><article key={log.id}><div className="log-icon">⇧</div><div><b>{log.fileName}</b><small>{new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(log.createdAt))}</small><p>{log.products.length?log.products.join(", "):"Aktarılan kayıt bulunmuyor"}</p></div><em>{log.importedCount} kayıt</em></article>)}{!importLogs.length&&<div className="empty-log"><b>Henüz aktarım yok</b><span>Excel’den eklenen lisanslar burada görünecek.</span></div>}</div></div>}
        {remindersOpen&&<div className="reminder-popover"><div className="reminder-head"><div><h3>Yenileme Hatırlatmaları</h3><p>30 gün içindeki işlemler</p></div><button onClick={()=>setRemindersOpen(false)}>×</button></div><div className="reminder-list">{reminders.map(l=>{const days=remainingDays(l.expirationDate);return <button key={l.id} onClick={()=>{openEdit(l);setRemindersOpen(false)}}><span className={days<=7?"urgent":"soon"}>◷</span><div><b>{l.productName}</b><small>{l.vendor} · {shortDate(l.expirationDate)}</small></div><em>{reminderText(days)}</em></button>})}{!reminders.length&&<div className="no-reminders">Yaklaşan yenileme bulunmuyor.</div>}</div></div>}
      </header>

      <section className="welcome" id="overview"><div><div className="welcome-meta"><div className="eyebrow">LİSANS MERKEZİ</div><div className="date-pill">◷ &nbsp;{new Intl.DateTimeFormat("tr-TR",{day:"numeric",month:"long",year:"numeric"}).format(today)}</div></div><h2>Günaydın, Mehmet</h2><p>Lisans portföyünüz güncel. <b>{counts.soon} yenileme</b> önümüzdeki 30 gün içinde.</p></div><div className="welcome-actions"><button className="primary" onClick={openAdd}><b>＋</b> Lisans Ekle</button></div></section>

      <section className="cards">
        <Metric icon="$" tone="purple" extra="cost-card featured-card" label="YILLIK TOPLAM MALİYET" value={money(usdTotal,"USD")} note={<>USD kayıtlarının toplamı</>}/>
        <Metric icon="▣" tone="blue" label="TOPLAM LİSANS" value={currentLicenses.length} note={<>{archivedLicenses.length} arşiv kaydı</>}/>
        <Metric icon="✓" tone="green" label="AKTİF LİSANS" value={counts.active} note={<>Tüm lisansların %{Math.round(counts.active/currentLicenses.length*100||0)}’i</>}/>
        <Metric icon="◷" tone="orange" label="YAKLAŞAN YENİLEMELER" value={counts.soon} note={<b className="warn">30 gün içinde</b>}/>
        <Metric icon="!" tone="red" label="SÜRESİ DOLANLAR" value={counts.expired} note={<b className="danger">İşlem gerekli</b>}/>
      </section>

      <section className="dashboard-grid" id="renewals">
        <div className="panel renewals"><div className="panel-head"><div><h2>Yaklaşan Yenilemeler</h2><p>Önümüzdeki 30 gün ve süresi dolanlar</p></div><button onClick={()=>document.getElementById("licenses")?.scrollIntoView({behavior:"smooth"})}>Tümünü gör →</button></div><LicenseTable rows={renewals} onEdit={openEdit} onRemove={remove} onArchive={archive}/></div>
        <RenewalCalendar licenses={currentLicenses} onLocate={license=>{setRecordView("current");setCalendarLicenseId(license.id);setTimeout(()=>document.getElementById("licenses")?.scrollIntoView({behavior:"smooth",block:"start"}),0)}}/>
        <div className="panel chart"><div className="panel-head"><div><h2>Durum Dağılımı</h2><p>Mevcut lisans portföyü</p></div></div><div className="donut" style={{background:`conic-gradient(#16a36a 0 ${counts.active/currentLicenses.length*100}%,#f0a436 0 ${(counts.active+counts.soon)/currentLicenses.length*100}%,#e95858 0)`}}><div><b>{currentLicenses.length}</b><span>Toplam</span></div></div><div className="legend"><p><span className="dot green-dot"/>Aktif <b>{counts.active}</b></p><p><span className="dot orange-dot"/>Yaklaşıyor <b>{counts.soon}</b></p><p><span className="dot red-dot"/>Süresi Doldu <b>{counts.expired}</b></p></div></div>
      </section>

      <section className="analytics-panel panel" id="costs"><div className="panel-head"><div><h2>Maliyet Analizi</h2><p>Kategori bazında yıllık lisans maliyeti</p></div><span className="currency-pill">USD kayıtları</span></div><div className="bar-list">{categoryCosts.map(([name,value])=><div className="bar-row" key={name}><span>{name}</span><div><i style={{width:`${value/maxCategoryCost*100}%`}}/></div><b>{money(value,"USD")}</b></div>)}{!categoryCosts.length&&<div className="no-reminders">Analiz için USD maliyet kaydı bulunmuyor.</div>}</div></section>

      <section className="licenses-page" id="licenses">
        <div className="list-top"><div><h2>{recordView==="current"?"Tüm Lisanslar":"Arşivlenen Lisanslar"}</h2><p>{baseRows.length} lisans kaydı listeleniyor</p></div><div className="list-actions"><label className="secondary import-button">↑ Excel’den Al<input type="file" accept=".xlsx,.xls" onChange={importExcel}/></label><button className="secondary" onClick={exportExcel}>↓ Excel’e Aktar</button></div></div>
        <div className="table-toolbar"><div className="view-tabs"><button className={recordView==="current"?"active":""} onClick={()=>{setCalendarLicenseId(null);setRecordView("current")}}>Aktif Kayıtlar <span>{currentLicenses.length}</span></button><button className={recordView==="archived"?"active":""} onClick={()=>{setCalendarLicenseId(null);setRecordView("archived")}}>Arşiv <span>{archivedLicenses.length}</span></button></div><div className="toolbar-messages">{calendarFilteredLicense&&<button className="calendar-filter-chip" onClick={()=>setCalendarLicenseId(null)}>Takvim: {calendarFilteredLicense.productName} ×</button>}{importMessage&&<span className="import-message">{importMessage}</span>}</div></div>
        <div className="panel full-table"><LicenseTable rows={filtered} onEdit={openEdit} onRemove={remove} onArchive={archive}/></div>
      </section>
    </main>

    {modalOpen&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setModalOpen(false)}><div className="modal"><div className="modal-head"><div><span className="modal-icon">＋</span><div><h2>{editing?"Lisansı Düzenle":"Yeni Lisans Ekle"}</h2><p>Lisans bilgilerini eksiksiz girin.</p></div></div><button onClick={()=>setModalOpen(false)}>×</button></div><form onSubmit={submit}><div className="form-grid"><label className="wide">Ürün / hizmet adı *<input required value={form.productName} onChange={e=>setForm({...form,productName:e.target.value})} placeholder="Örn. Microsoft 365 Business"/></label><label>Tedarikçi *<input required value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})} placeholder="Firma adı"/></label><DepartmentCombobox value={form.department} onChange={value=>setForm({...form,department:value})}/><DatePickerField label="Başlangıç tarihi" value={form.startDate} onChange={value=>setForm({...form,startDate:value})}/><DatePickerField label="Bitiş / yenileme tarihi" value={form.expirationDate} onChange={value=>setForm({...form,expirationDate:value})}/><label>Maliyet *<input type="number" min="0" required value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0"/></label><label>Para birimi<select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}><option>USD</option><option>EUR</option><option>TRY</option><option>GBP</option></select></label><label className="wide">Açıklama / not<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Lisansla ilgili notlar..."/></label></div><div className="info-box"><b>ⓘ Otomatik hesaplama</b><span>Kalan gün, durum ve yenileme hatırlatmaları bitiş tarihine göre hesaplanır.</span></div><div className="form-actions"><button type="button" onClick={()=>setModalOpen(false)}>Vazgeç</button><button className="primary" type="submit" disabled={!form.startDate||!form.expirationDate}>{editing?"Değişiklikleri Kaydet":"Lisansı Kaydet"}</button></div></form></div></div>}
  </div>;
}

function RenewalCalendar({licenses,onLocate}:{licenses:License[];onLocate:(license:License)=>void}){
  const [month,setMonth]=useState(()=>new Date(today.getFullYear(),today.getMonth(),1));
  const [selectedDay,setSelectedDay]=useState<number|null>(null);
  const year=month.getFullYear(),monthIndex=month.getMonth();
  const firstWeekday=(new Date(year,monthIndex,1).getDay()+6)%7;
  const dayCount=new Date(year,monthIndex+1,0).getDate();
  const monthLicenses=licenses.filter(l=>{const date=new Date(`${l.expirationDate}T12:00:00`);return date.getFullYear()===year&&date.getMonth()===monthIndex});
  const selectedLicenses=selectedDay?monthLicenses.filter(l=>Number(l.expirationDate.slice(8,10))===selectedDay):[];
  const cells=Array.from({length:firstWeekday+dayCount},(_,index)=>index<firstWeekday?null:index-firstWeekday+1);
  return <div className="panel calendar-panel">
    <div className="panel-head calendar-head"><div><h2>Yenileme Takvimi</h2><p>{monthLicenses.length} yenileme bu ay</p></div><div className="calendar-nav"><button aria-label="Önceki ay" onClick={()=>{setSelectedDay(null);setMonth(new Date(year,monthIndex-1,1))}}>‹</button><button aria-label="Sonraki ay" onClick={()=>{setSelectedDay(null);setMonth(new Date(year,monthIndex+1,1))}}>›</button></div></div>
    <div className="calendar-body"><strong>{new Intl.DateTimeFormat("tr-TR",{month:"long",year:"numeric"}).format(month)}</strong><div className="calendar-weekdays">{["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(day=><span key={day}>{day}</span>)}</div><div className="calendar-days">{cells.map((day,index)=>{if(!day)return <span className="calendar-empty" key={`empty-${index}`}/>;const items=monthLicenses.filter(l=>Number(l.expirationDate.slice(8,10))===day);const isToday=day===today.getDate()&&monthIndex===today.getMonth()&&year===today.getFullYear();const tone=items.length?statusOf(items[0].expirationDate)==="Süresi Doldu"?"expired":statusOf(items[0].expirationDate)==="Yaklaşıyor"?"soon":"active":"";return <button key={day} className={`${isToday?"today":""} ${tone}`} disabled={!items.length} onClick={()=>items.length&&setSelectedDay(day)}><span>{day}</span>{items.length>0&&<i/>}</button>})}</div></div>
    {selectedDay&&<div className="calendar-popover"><div className="calendar-popover-head"><div><b>{selectedDay} {new Intl.DateTimeFormat("tr-TR",{month:"long"}).format(month)}</b><span>{selectedLicenses.length} lisans yenilemesi</span></div><button aria-label="Kapat" onClick={()=>setSelectedDay(null)}>×</button></div><div className="calendar-license-list">{selectedLicenses.map(license=><div key={license.id}><span className={`product-logo logo-${license.id%5}`}>{license.productName[0]}</span><div><b>{license.productName}</b><small>{license.vendor} · {license.department||license.category}</small></div><button onClick={()=>{setSelectedDay(null);onLocate(license)}}>Düzenle →</button></div>)}</div></div>}
  </div>
}

const departmentOptions=["Bilgi İşlem","Bilgi Teknolojileri","İdari İşler","İnsan Kaynakları","Finans","Muhasebe","Satış","Pazarlama","Operasyon","Hukuk","Satın Alma","Tasarım","Tasarım ve Marka","Yazılım Geliştirme","Yönetim"];

function DepartmentCombobox({value,onChange}:{value:string;onChange:(value:string)=>void}){
  const [open,setOpen]=useState(false);
  const matches=departmentOptions.filter(option=>!value||option.toLocaleLowerCase("tr").includes(value.toLocaleLowerCase("tr")));
  return <label className="department-combobox">Departman<div className={`combobox-input ${open?"is-open":""}`}><input value={value} onFocus={()=>setOpen(true)} onChange={e=>{onChange(e.target.value);setOpen(true)}} onKeyDown={e=>{if(e.key==="Escape")setOpen(false)}} placeholder="Departman seçin veya yazın"/><button type="button" aria-label="Departman listesini aç" onClick={()=>setOpen(current=>!current)}>⌄</button></div>{open&&<div className="combobox-menu">{matches.map(option=><button type="button" className={value===option?"selected":""} key={option} onClick={()=>{onChange(option);setOpen(false)}}><span>{option}</span>{value===option&&<i>✓</i>}</button>)}{!matches.length&&<div className="combobox-empty">“{value}” özel departman olarak kullanılacak.</div>}</div>}</label>
}

function DatePickerField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
  const selected=value?new Date(`${value}T12:00:00`):today;
  const [open,setOpen]=useState(false);
  const [month,setMonth]=useState(()=>new Date(selected.getFullYear(),selected.getMonth(),1));
  const year=month.getFullYear(),monthIndex=month.getMonth();
  const offset=(new Date(year,monthIndex,1).getDay()+6)%7;
  const dayCount=new Date(year,monthIndex+1,0).getDate();
  const cells=Array.from({length:offset+dayCount},(_,index)=>index<offset?null:index-offset+1);
  const monthNames=Array.from({length:12},(_,index)=>new Intl.DateTimeFormat("tr-TR",{month:"long"}).format(new Date(2026,index,1)));
  const years=Array.from({length:200},(_,index)=>2000+index);
  const choose=(day:number)=>{onChange(validIsoDate(year,monthIndex+1,day));setOpen(false)};
  return <label className="date-picker-field">{label} *<button type="button" className={`date-picker-trigger ${value?"has-value":""}`} onClick={()=>{const base=value?new Date(`${value}T12:00:00`):today;setMonth(new Date(base.getFullYear(),base.getMonth(),1));setOpen(!open)}}><span>{value?new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(selected):"Tarih seçin"}</span><i aria-hidden>▦</i></button>{open&&<div className="date-picker-popover"><div className="date-picker-head"><button type="button" aria-label="Önceki ay" onClick={()=>setMonth(new Date(year,monthIndex-1,1))}>‹</button><div className="date-picker-jump"><select aria-label="Ay seç" value={monthIndex} onChange={e=>setMonth(new Date(year,Number(e.target.value),1))}>{monthNames.map((name,index)=><option value={index} key={name}>{name}</option>)}</select><select aria-label="Yıl seç" value={year} onChange={e=>setMonth(new Date(Number(e.target.value),monthIndex,1))}>{years.map(item=><option value={item} key={item}>{item}</option>)}</select></div><button type="button" aria-label="Sonraki ay" onClick={()=>setMonth(new Date(year,monthIndex+1,1))}>›</button></div><div className="date-picker-weekdays">{["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(day=><span key={day}>{day}</span>)}</div><div className="date-picker-days">{cells.map((day,index)=>day?<button type="button" key={day} className={`${value===validIsoDate(year,monthIndex+1,day)?"selected":""} ${day===today.getDate()&&monthIndex===today.getMonth()&&year===today.getFullYear()?"today":""}`} onClick={()=>choose(day)}>{day}</button>:<span key={`empty-${index}`}/>)}</div><div className="date-picker-footer"><button type="button" onClick={()=>{onChange("");setOpen(false)}}>Temizle</button><button type="button" onClick={()=>{onChange(localIsoDate(today));setOpen(false)}}>Bugün</button></div></div>}</label>
}

function Metric({icon,tone,label,value,note,extra=""}:{icon:string;tone:string;label:string;value:string|number;note:React.ReactNode;extra?:string}){return <article className={extra}><span className={`card-icon ${tone}`}>{icon}</span><small>{label}</small><h3>{value}</h3><p>{note}</p></article>}

function LicenseTable({rows,onEdit,onRemove,onArchive}:{rows:License[];onEdit:(l:License)=>void;onRemove:(id:number)=>void;onArchive:(l:License)=>void}){return <div className="table-wrap"><table><thead><tr><th>ÜRÜN / HİZMET</th><th>DEPARTMAN</th><th>BİTİŞ TARİHİ</th><th>KALAN GÜN</th><th>MALİYET</th><th>DURUM</th><th/></tr></thead><tbody>{rows.map(l=>{const days=remainingDays(l.expirationDate),status=statusOf(l.expirationDate),statusClass=status==="Aktif"?"aktif":status==="Yaklaşıyor"?"yaklasiyor":"suresi-doldu";return <tr key={l.id}><td><span className={`product-logo logo-${l.id%5}`}>{l.productName[0]}</span><div><b>{l.productName}</b><small>{l.vendor} · {l.category}</small></div></td><td><b>{l.department||"Departman yok"}</b></td><td>{shortDate(l.expirationDate)}</td><td><b className={days<=0?"text-red":days<=30?"text-orange":""}>{days<0?`${Math.abs(days)} gün geçti`:days===0?"Bugün":`${days} gün`}</b></td><td><b>{money(l.cost,l.currency)}</b><small>/ yıl</small></td><td>{l.archived?<span className="status status-archived"><i/>Arşivlendi</span>:<span className={`status status-${statusClass}`}><i/>{status}</span>}</td><td className="row-actions"><button title="Düzenle" aria-label="Düzenle" onClick={()=>onEdit(l)}>✎</button><button title={l.archived?"Arşivden çıkar":"Arşivle"} aria-label={l.archived?"Arşivden çıkar":"Arşivle"} onClick={()=>onArchive(l)}>{l.archived?"↗":"□"}</button><button title="Kalıcı olarak sil" aria-label="Sil" onClick={()=>onRemove(l.id)}>⌫</button></td></tr>})}{!rows.length&&<tr><td className="no-results" colSpan={7}>Bu görünümde kayıt bulunamadı.</td></tr>}</tbody></table></div>}

function excelDate(value:unknown){
  if(value instanceof Date)return localIsoDate(value);
  if(typeof value==="number"){const d=XLSX.SSF.parse_date_code(value);if(d)return validIsoDate(d.y,d.m,d.d)}
  const text=String(value||"").trim();
  const tr=text.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/);
  if(tr){const turkish=validIsoDate(Number(tr[3]),Number(tr[2]),Number(tr[1]));if(turkish)return turkish}
  const iso=text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(iso)return validIsoDate(Number(iso[1]),Number(iso[2]),Number(iso[3]));
  const parsed=new Date(text);return Number.isNaN(parsed.getTime())?"":localIsoDate(parsed)
}
function validIsoDate(year:number,month:number,day:number){const date=new Date(year,month-1,day);return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`:""}
function localIsoDate(date:Date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function numberValue(value:unknown){if(typeof value==="number")return value;const text=String(value||"0").trim();const normalized=text.includes(",")?text.replaceAll(".","").replace(",","."):text;return Number(normalized)||0}
