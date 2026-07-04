import { useState, useEffect } from "react";
import {
  LayoutDashboard, Car, ShoppingBag, TrendingUp, Receipt, FileText,
  CreditCard, Settings, Plus, Edit2, Trash2, Eye, X, Check,
  AlertTriangle, Building2, Euro, ChevronRight, Search, Printer,
  BarChart2, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUpRight, ArrowDownRight, Banknote, Info
} from "lucide-react";
import {
  BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
const SK = {
  settings:'cd:settings', cars:'cd:cars', sales:'cd:sales',
  expenses:'cd:expenses', f24:'cd:f24', mandati:'cd:mandati'
};
const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const MESI_FULL = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const TRIBUTI_IVA_TRIM = [
  {codice:'6031',desc:'IVA - I Trimestre (Gen-Mar)'},{codice:'6032',desc:'IVA - II Trimestre (Apr-Giu)'},
  {codice:'6033',desc:'IVA - III Trimestre (Lug-Set)'},{codice:'6099',desc:'IVA - IV Trimestre / Saldo annuale'},
  {codice:'1668',desc:'Interessi IVA trimestrale (0,33%)'},
];
const TRIBUTI_IVA_MENS = Array.from({length:12},(_,i)=>({codice:`600${i<9?'0':''}${i+1}`,desc:`IVA - ${MESI_FULL[i]}`}));
const ALTRI_TRIBUTI = [
  {codice:'2003',desc:'IRES - Saldo/Acconto unico',tipo:'ires'},{codice:'2002',desc:'IRES - Prima rata acconto',tipo:'ires'},
  {codice:'3800',desc:'IRAP - Saldo',tipo:'irap'},{codice:'3812',desc:'IRAP - Prima rata acconto',tipo:'irap'},
  {codice:'3813',desc:'IRAP - Seconda rata acconto',tipo:'irap'},{codice:'4001',desc:'IRPEF - Saldo',tipo:'irpef'},
  {codice:'4033',desc:'IRPEF - Prima rata acconto',tipo:'irpef'},{codice:'4034',desc:'IRPEF - Seconda rata acconto',tipo:'irpef'},
  {codice:'1001',desc:'INPS - Contributi fissi artigiani/commercianti',tipo:'inps'},
];
const CAT_SPESE = ['Affitto/Leasing','Utenze','Personale','Assicurazioni','Manutenzione','Marketing/Pubblicità','Carburante','Consulenze','Telefono/Internet','Materiale ufficio','Commissioni bancarie','Altre spese'];
const CHART_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#14b8a6'];
const DEFAULT_SETTINGS = {
  ragioneSociale:'', partitaIva:'', codiceFiscale:'', indirizzo:'',
  cap:'', citta:'', provincia:'', telefono:'', email:'', pec:'',
  regimeFiscale:'margine', liquidazioneIva:'trimestrale',
  codiceAteco:'45.11.01', banca:'', iban:'', tipoSocieta:'srl', aliquotaImposta:24
};
const fmt = n => new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(n||0);
const fmtN = n => new Intl.NumberFormat('it-IT').format(n||0);
const fmtD = d => d ? new Date(d).toLocaleDateString('it-IT') : '—';
const today = () => new Date().toISOString().split('T')[0];
const uid = () => Math.random().toString(36).slice(2,9)+Date.now().toString(36);
const ivaM = (pv,pa) => +Math.max(0,(pv-pa)*22/122).toFixed(2);
const margN = (pv,pa) => +Math.max(0,(pv-pa)-ivaM(pv,pa)).toFixed(2);
const BADGE = {gray:'bg-gray-100 text-gray-700',green:'bg-green-100 text-green-700',red:'bg-red-100 text-red-700',amber:'bg-amber-100 text-amber-700',blue:'bg-blue-100 text-blue-700',purple:'bg-purple-100 text-purple-700'};
const Badge = ({c='gray',children}) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BADGE[c]||BADGE.gray}`}>{children}</span>;
const Card = ({children,cls=''}) => <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${cls}`}>{children}</div>;
const KPI = ({icon:Ic,label,value,sub,color='blue',trend}) => {
  const bg={blue:'bg-blue-50',green:'bg-green-50',amber:'bg-amber-50',red:'bg-red-50',purple:'bg-purple-50'};
  const ic={blue:'text-blue-600',green:'text-green-600',amber:'text-amber-600',red:'text-red-600',purple:'text-purple-600'};
  return (
    <Card cls="p-5">
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-lg ${bg[color]}`}><Ic size={18} className={ic[color]}/></div>
        {trend!==undefined&&<span className={`text-xs font-medium flex items-center gap-0.5 ${trend>=0?'text-green-600':'text-red-500'}`}>{trend>=0?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>}{Math.abs(trend)}%</span>}
      </div>
      <div className="mt-3">
        <div className="text-xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {sub&&<div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </Card>
  );
};
const Modal = ({open,onClose,title,children,size='md'}) => {
  if(!open) return null;
  const sz={sm:'max-w-md',md:'max-w-2xl',lg:'max-w-4xl'};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sz[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
};
const Inp = ({label,...p}) => (
  <div>{label&&<label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...p}/></div>
);
const Sel = ({label,children,...p}) => (
  <div>{label&&<label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" {...p}>{children}</select></div>
);
const Txta = ({label,...p}) => (
  <div>{label&&<label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
  <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} {...p}/></div>
);
const Btn = ({children,onClick,variant='primary',size='md',cls='',disabled=false,type='button'}) => {
  const v={primary:'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',secondary:'bg-gray-100 text-gray-700 hover:bg-gray-200',danger:'bg-red-50 text-red-600 hover:bg-red-100',success:'bg-green-600 text-white hover:bg-green-700',ghost:'text-gray-600 hover:bg-gray-100'};
  const s={sm:'px-3 py-1.5 text-xs',md:'px-4 py-2 text-sm',lg:'px-5 py-2.5 text-base'};
  return <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-colors ${v[variant]} ${s[size]} ${cls}`}>{children}</button>;
};
const Notif = ({msg,type,onClose}) => {
  const c={success:'bg-green-50 border-green-200 text-green-700',error:'bg-red-50 border-red-200 text-red-700',info:'bg-blue-50 border-blue-200 text-blue-700'};
  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${c[type]}`}>
      {type==='success'?<CheckCircle size={15}/>:type==='error'?<XCircle size={15}/>:<AlertCircle size={15}/>}
      <span className="text-sm font-medium">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={13}/></button>
    </div>
  );
};
const IcoBtn = ({onClick,icon:Ic,color='gray'}) => {
  const c={gray:'text-gray-400 hover:text-gray-600 hover:bg-gray-100',blue:'text-gray-400 hover:text-blue-600 hover:bg-blue-50',red:'text-gray-400 hover:text-red-600 hover:bg-red-50'};
  return <button onClick={onClick} className={`p-1.5 rounded-lg transition-colors ${c[color]}`}><Ic size={13}/></button>;
};
const NAV = [
  {id:'dashboard',label:'Dashboard',icon:LayoutDashboard},{id:'parco',label:'Parco Auto',icon:Car},
  {id:'vendite',label:'Vendite',icon:TrendingUp},{id:'spese',label:'Spese',icon:ShoppingBag},
  {id:'iva',label:'Gestione IVA',icon:Receipt},{id:'f24',label:'F24 & Tasse',icon:FileText},
  {id:'mandati',label:'Mandati Pagamento',icon:CreditCard},{id:'bilancio',label:'Bilancio',icon:BarChart2},
  {id:'impostazioni',label:'Impostazioni',icon:Settings},
];
const Sidebar = ({active,onNav,s}) => (
  <div className="w-56 bg-slate-900 flex flex-col h-full flex-shrink-0">
    <div className="px-4 py-5 border-b border-slate-700">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0"><Car size={15} className="text-white"/></div>
        <div className="min-w-0">
          <div className="text-white text-sm font-semibold truncate">{s.ragioneSociale||'AutoDealer Pro'}</div>
          <div className="text-slate-400 text-xs">Gestionale</div>
        </div>
      </div>
    </div>
    <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
      {NAV.map(({id,label,icon:Ic})=>(
        <button key={id} onClick={()=>onNav(id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active===id?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <Ic size={15} className="flex-shrink-0"/>{label}
        </button>))}
    </nav>
    <div className="px-4 py-3 border-t border-slate-700 text-slate-500 text-xs">v2.0 • {new Date().getFullYear()}</div>
  </div>
);
const Dashboard = ({cars,sales,expenses,f24,onNav}) => {
  const yr=new Date().getFullYear(),mo=new Date().getMonth();
  const sm=sales.filter(s=>{const d=new Date(s.data_vendita);return d.getFullYear()===yr&&d.getMonth()===mo;});
  const em=expenses.filter(e=>{const d=new Date(e.data);return d.getFullYear()===yr&&d.getMonth()===mo;});
  const fat=sm.reduce((a,v)=>a+v.prezzo_vendita,0),mn=sm.reduce((a,v)=>a+margN(v.prezzo_vendita,v.prezzo_acquisto),0);
  const sp=em.reduce((a,e)=>a+e.importo,0);
  const IVA_CODES=['6031','6032','6033','6099','1668',...Array.from({length:12},(_,i)=>`600${i<9?'0':''}${i+1}`)];
  const totIvaAnno=sales.filter(s=>new Date(s.data_vendita).getFullYear()===yr).reduce((a,v)=>a+ivaM(v.prezzo_vendita,v.prezzo_acquisto),0);
  const ivaGiaPagata=f24.filter(r=>r.stato==='pagato'&&r.anno===yr&&IVA_CODES.includes(r.codice_tributo)).reduce((a,r)=>a+r.importo,0);
  const iva=Math.max(0,totIvaAnno-ivaGiaPagata);
  const disp=cars.filter(c=>c.stato==='disponibile').length,oggi=new Date();
  const scad=f24.filter(f=>{const d=new Date(f.scadenza),diff=(d-oggi)/86400000;return f.stato==='da_pagare'&&diff<=30&&diff>=0;});
  const chart=Array.from({length:6},(_,i)=>{
    const d=new Date(yr,mo-5+i,1),m=d.getMonth(),y=d.getFullYear();
    const sv=sales.filter(v=>{const dd=new Date(v.data_vendita);return dd.getMonth()===m&&dd.getFullYear()===y;});
    const ex=expenses.filter(e=>{const dd=new Date(e.data);return dd.getMonth()===m&&dd.getFullYear()===y;});
    return {name:MESI[m],Fatturato:+sv.reduce((a,v)=>a+v.prezzo_vendita,0).toFixed(0),Margine:+sv.reduce((a,v)=>a+margN(v.prezzo_vendita,v.prezzo_acquisto),0).toFixed(0),Spese:+ex.reduce((a,e)=>a+e.importo,0).toFixed(0)};
  });
  const catD={};
  expenses.filter(e=>new Date(e.data).getFullYear()===yr).forEach(e=>catD[e.categoria]=(catD[e.categoria]||0)+e.importo);
  const pieD=Object.entries(catD).map(([name,value])=>({name,value:+value.toFixed(0)})).slice(0,7);
  const rec=[...sales].sort((a,b)=>new Date(b.data_vendita)-new Date(a.data_vendita)).slice(0,5);
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1><p className="text-gray-500 text-sm mt-0.5">{MESI_FULL[mo]} {yr}</p></div>
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Euro} label="Fatturato del mese" value={fmt(fat)} color="blue"/>
        <KPI icon={TrendingUp} label="Margine Netto" value={fmt(mn)} color="green"/>
        <KPI icon={ShoppingBag} label="Spese operative" value={fmt(sp)} color="amber"/>
        <KPI icon={BarChart2} label="Utile operativo" value={fmt(mn-sp)} color={mn-sp>=0?'blue':'red'}/>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Car} label="Auto disponibili" value={disp} color="purple" sub={`${cars.length} totali in parco`}/>
        <KPI icon={TrendingUp} label="Vendite mese" value={sm.length} color="green" sub="Veicoli venduti"/>
        <KPI icon={Receipt} label="IVA da versare" value={fmt(iva)} color="amber" sub={`Anno ${yr} — pagata: ${fmt(ivaGiaPagata)}`}/>
        <KPI icon={FileText} label="F24 in scadenza" value={scad.length} color={scad.length>0?'red':'green'} sub="Prossimi 30 giorni"/>
      </div>
      {scad.length>0&&<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0"/>
        <div className="flex-1"><p className="text-sm font-semibold text-amber-800">⚠ {scad.length} F24 in scadenza nei prossimi 30 giorni</p>
          <p className="text-xs text-amber-600 mt-1">{scad.map(f=>`${f.codice_tributo} — scad. ${fmtD(f.scadenza)} — ${fmt(f.importo)}`).join(' • ')}</p></div>
        <Btn variant="ghost" size="sm" cls="text-amber-700 flex-shrink-0" onClick={()=>onNav('f24')}>Gestisci <ChevronRight size={11}/></Btn>
      </div>}
      <div className="grid grid-cols-3 gap-4">
        <Card cls="p-5 col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Andamento Ultimi 6 Mesi</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`€${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
              <Legend wrapperStyle={{fontSize:'11px'}}/>
              <Bar dataKey="Fatturato" fill="#3b82f6" radius={[3,3,0,0]}/>
              <Bar dataKey="Margine" fill="#10b981" radius={[3,3,0,0]}/>
              <Bar dataKey="Spese" fill="#f59e0b" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card cls="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Spese per Categoria</h3>
          {pieD.length>0
            ?<ResponsiveContainer width="100%" height={210}>
              <RPieChart><Pie data={pieD} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieD.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Pie><Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:'8px',fontSize:'12px'}}/></RPieChart>
            </ResponsiveContainer>
            :<div className="flex items-center justify-center h-48 text-gray-400 text-sm">Nessuna spesa</div>}
        </Card>
      </div>
      <Card>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold">Ultime Vendite</h3>
          <Btn variant="ghost" size="sm" onClick={()=>onNav('vendite')}>Vedi tutte <ChevronRight size={11}/></Btn>
        </div>
        {rec.length===0?<div className="px-5 py-8 text-center text-gray-400 text-sm">Nessuna vendita ancora registrata</div>
          :rec.map(s=>(
          <div key={s.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Car size={13} className="text-blue-500"/></div>
              <div><p className="text-sm font-medium text-gray-900">{s.marca} {s.modello} — <span className="font-mono">{s.targa}</span></p>
                <p className="text-xs text-gray-500">{fmtD(s.data_vendita)} • {s.cliente}</p></div>
            </div>
            <div className="text-right"><p className="text-sm font-bold text-gray-900">{fmt(s.prezzo_vendita)}</p>
              <p className="text-xs text-green-600">Margine: {fmt(margN(s.prezzo_vendita,s.prezzo_acquisto))}</p></div>
          </div>))}
      </Card>
    </div>
  );
};
const STATI_C={disponibile:{l:'Disponibile',c:'green'},venduto:{l:'Venduto',c:'gray'},in_preparazione:{l:'In preparazione',c:'amber'}};
const emptyC=()=>({id:'',targa:'',marca:'',modello:'',anno:new Date().getFullYear(),km:0,colore:'',carburante:'Benzina',cambio:'Manuale',prezzo_acquisto:0,data_acquisto:today(),fornitore:'',note:'',stato:'disponibile'});
const ParcoAuto=({cars,onAdd,onEdit,onDel})=>{
  const [q,setQ]=useState(''),[fs,setFs]=useState('tutti'),[show,setShow]=useState(false),[form,setForm]=useState(emptyC()),[eid,setEid]=useState(null);
  const filt=cars.filter(c=>{const s=q.toLowerCase();return(!q||c.targa?.toLowerCase().includes(s)||c.marca?.toLowerCase().includes(s)||c.modello?.toLowerCase().includes(s))&&(fs==='tutti'||c.stato===fs);});
  const openAdd=()=>{setForm(emptyC());setEid(null);setShow(true);};
  const openEdit=c=>{setForm({...c});setEid(c.id);setShow(true);};
  const save=()=>{if(!form.targa||!form.marca||!form.modello)return;const v={...form,id:eid||uid()};eid?onEdit(v):onAdd(v);setShow(false);};
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Parco Auto</h1><p className="text-sm text-gray-500">{cars.filter(c=>c.stato==='disponibile').length} disponibili • {cars.length} totali</p></div>
        <Btn onClick={openAdd}><Plus size={13}/>Aggiungi Veicolo</Btn>
      </div>
      <Card>
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="relative flex-1"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca targa, marca, modello..." className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/></div>
          <Sel value={fs} onChange={e=>setFs(e.target.value)}>
            <option value="tutti">Tutti gli stati</option>
            {Object.entries(STATI_C).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
          </Sel>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs">{['Targa','Veicolo','Anno','Km','Carburante','P.Acquisto','Data Acq.','Fornitore','Stato','Azioni'].map(h=><th key={h} className="px-3 py-3 text-left font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {filt.length===0&&<tr><td colSpan={10} className="px-4 py-10 text-center text-gray-400">Nessun veicolo trovato</td></tr>}
              {filt.map(c=>(
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-gray-900">{c.targa}</td>
                  <td className="px-3 py-2.5"><div className="font-medium text-gray-900">{c.marca} {c.modello}</div><div className="text-xs text-gray-500">{c.colore} • {c.cambio}</div></td>
                  <td className="px-3 py-2.5">{c.anno}</td><td className="px-3 py-2.5">{fmtN(c.km)} km</td>
                  <td className="px-3 py-2.5">{c.carburante}</td><td className="px-3 py-2.5 font-medium">{fmt(c.prezzo_acquisto)}</td>
                  <td className="px-3 py-2.5 text-gray-500">{fmtD(c.data_acquisto)}</td><td className="px-3 py-2.5 text-gray-600">{c.fornitore||'—'}</td>
                  <td className="px-3 py-2.5"><Badge c={STATI_C[c.stato]?.c}>{STATI_C[c.stato]?.l}</Badge></td>
                  <td className="px-3 py-2.5"><div className="flex gap-0.5"><IcoBtn onClick={()=>openEdit(c)} icon={Edit2} color="blue"/><IcoBtn onClick={()=>onDel(c.id)} icon={Trash2} color="red"/></div></td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={show} onClose={()=>setShow(false)} title={eid?'Modifica Veicolo':'Nuovo Veicolo'}>
        <div className="grid grid-cols-3 gap-4">
          <Inp label="Targa *" value={form.targa} onChange={e=>f('targa',e.target.value.toUpperCase())} placeholder="AB123CD"/>
          <Inp label="Marca *" value={form.marca} onChange={e=>f('marca',e.target.value)}/>
          <Inp label="Modello *" value={form.modello} onChange={e=>f('modello',e.target.value)}/>
          <Inp label="Anno" type="number" value={form.anno} onChange={e=>f('anno',+e.target.value)}/>
          <Inp label="Chilometri" type="number" value={form.km} onChange={e=>f('km',+e.target.value)}/>
          <Inp label="Colore" value={form.colore} onChange={e=>f('colore',e.target.value)}/>
          <Sel label="Carburante" value={form.carburante} onChange={e=>f('carburante',e.target.value)}>{['Benzina','Diesel','Ibrido','Elettrico','GPL','Metano'].map(v=><option key={v}>{v}</option>)}</Sel>
          <Sel label="Cambio" value={form.cambio} onChange={e=>f('cambio',e.target.value)}>{['Manuale','Automatico','Semiautomatico'].map(v=><option key={v}>{v}</option>)}</Sel>
          <Sel label="Stato" value={form.stato} onChange={e=>f('stato',e.target.value)}>{Object.entries(STATI_C).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}</Sel>
          <Inp label="Prezzo Acquisto (€)" type="number" step="0.01" value={form.prezzo_acquisto} onChange={e=>f('prezzo_acquisto',+e.target.value)}/>
          <Inp label="Data Acquisto" type="date" value={form.data_acquisto} onChange={e=>f('data_acquisto',e.target.value)}/>
          <Inp label="Fornitore" value={form.fornitore} onChange={e=>f('fornitore',e.target.value)}/>
          <div className="col-span-3"><Txta label="Note" value={form.note} onChange={e=>f('note',e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-2 mt-5"><Btn variant="secondary" onClick={()=>setShow(false)}>Annulla</Btn><Btn onClick={save}><Check size={13}/>Salva Veicolo</Btn></div>
      </Modal>
    </div>
  );
};
const emptyS=()=>({id:'',veicolo_id:'',targa:'',marca:'',modello:'',data_vendita:today(),prezzo_vendita:0,prezzo_acquisto:0,cliente:'',cf_cliente:'',metodo_pagamento:'Bonifico',note:''});
const Vendite=({sales,cars,onAdd,onEdit,onDel})=>{
  const [show,setShow]=useState(false),[form,setForm]=useState(emptyS()),[eid,setEid]=useState(null),[selC,setSelC]=useState(''),[fmo,setFmo]=useState(''),[fyr,setFyr]=useState(new Date().getFullYear());
  const avail=cars.filter(c=>c.stato!=='venduto');
  const filt=sales.filter(s=>{const d=new Date(s.data_vendita);return(fmo===''||d.getMonth()===+fmo)&&(!fyr||d.getFullYear()===+fyr);});
  const totFat=filt.reduce((a,v)=>a+v.prezzo_vendita,0),totMN=filt.reduce((a,v)=>a+margN(v.prezzo_vendita,v.prezzo_acquisto),0),totIva=filt.reduce((a,v)=>a+ivaM(v.prezzo_vendita,v.prezzo_acquisto),0);
  const openAdd=()=>{setForm(emptyS());setEid(null);setSelC('');setShow(true);};
  const openEdit=s=>{setForm({...s});setEid(s.id);setSelC(s.veicolo_id);setShow(true);};
  const pickCar=id=>{setSelC(id);const c=cars.find(x=>x.id===id);if(c)setForm(p=>({...p,veicolo_id:c.id,targa:c.targa,marca:c.marca,modello:c.modello,prezzo_acquisto:c.prezzo_acquisto}));};
  const save=()=>{if(!form.targa||!form.prezzo_vendita||!form.cliente)return;const s={...form,id:eid||uid()};eid?onEdit(s):onAdd(s);setShow(false);};
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const ml=Math.max(0,form.prezzo_vendita-form.prezzo_acquisto),iv=ivaM(form.prezzo_vendita,form.prezzo_acquisto),mn2=margN(form.prezzo_vendita,form.prezzo_acquisto);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Vendite</h1><p className="text-sm text-gray-500">{sales.length} vendite registrate</p></div>
        <Btn onClick={openAdd}><Plus size={13}/>Registra Vendita</Btn>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KPI icon={Euro} label="Fatturato" value={fmt(totFat)} color="blue"/>
        <KPI icon={TrendingUp} label="Margine Lordo" value={fmt(filt.reduce((a,v)=>a+Math.max(0,v.prezzo_vendita-v.prezzo_acquisto),0))} color="green"/>
        <KPI icon={Receipt} label="IVA Regime Margine" value={fmt(totIva)} color="amber"/>
        <KPI icon={BarChart2} label="Margine Netto" value={fmt(totMN)} color="purple"/>
      </div>
      <Card>
        <div className="flex items-center gap-3 p-4 border-b">
          <Sel value={fmo} onChange={e=>setFmo(e.target.value)}><option value="">Tutti i mesi</option>{MESI_FULL.map((m,i)=><option key={i} value={i}>{m}</option>)}</Sel>
          <Sel value={fyr} onChange={e=>setFyr(+e.target.value)}>{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</Sel>
          <span className="text-sm text-gray-500 ml-auto">{filt.length} risultati</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs">{['Targa','Veicolo','Data','Cliente','P.Acquisto','P.Vendita','Marg.Lordo','IVA Margine','Marg.Netto','Pagamento','Azioni'].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {filt.length===0&&<tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">Nessuna vendita trovata</td></tr>}
              {[...filt].sort((a,b)=>new Date(b.data_vendita)-new Date(a.data_vendita)).map(s=>{
                const ml2=Math.max(0,s.prezzo_vendita-s.prezzo_acquisto),iv2=ivaM(s.prezzo_vendita,s.prezzo_acquisto),mn3=margN(s.prezzo_vendita,s.prezzo_acquisto);
                return <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-mono font-bold">{s.targa}</td><td className="px-3 py-2.5 font-medium">{s.marca} {s.modello}</td>
                  <td className="px-3 py-2.5 text-gray-500">{fmtD(s.data_vendita)}</td><td className="px-3 py-2.5">{s.cliente}<div className="text-xs text-gray-400">{s.cf_cliente}</div></td>
                  <td className="px-3 py-2.5">{fmt(s.prezzo_acquisto)}</td><td className="px-3 py-2.5 font-semibold">{fmt(s.prezzo_vendita)}</td>
                  <td className="px-3 py-2.5 text-blue-600">{fmt(ml2)}</td><td className="px-3 py-2.5 text-amber-600">{fmt(iv2)}</td>
                  <td className="px-3 py-2.5 font-semibold text-green-600">{fmt(mn3)}</td><td className="px-3 py-2.5"><Badge c="blue">{s.metodo_pagamento}</Badge></td>
                  <td className="px-3 py-2.5"><div className="flex gap-0.5"><IcoBtn onClick={()=>openEdit(s)} icon={Edit2} color="blue"/><IcoBtn onClick={()=>onDel(s.id)} icon={Trash2} color="red"/></div></td>
                </tr>;})}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={show} onClose={()=>setShow(false)} title={eid?'Modifica Vendita':'Registra Vendita'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Sel label="Seleziona dal parco auto" value={selC} onChange={e=>pickCar(e.target.value)}><option value="">— Scegli veicolo o inserisci manualmente —</option>{avail.map(c=><option key={c.id} value={c.id}>{c.targa} — {c.marca} {c.modello} ({c.anno}) — Acq: {fmt(c.prezzo_acquisto)}</option>)}</Sel></div>
          <Inp label="Targa *" value={form.targa} onChange={e=>f('targa',e.target.value.toUpperCase())}/>
          <Inp label="Data Vendita *" type="date" value={form.data_vendita} onChange={e=>f('data_vendita',e.target.value)}/>
          <Inp label="Marca" value={form.marca} onChange={e=>f('marca',e.target.value)}/>
          <Inp label="Modello" value={form.modello} onChange={e=>f('modello',e.target.value)}/>
          <Inp label="Prezzo Acquisto (€)" type="number" step="0.01" value={form.prezzo_acquisto} onChange={e=>f('prezzo_acquisto',+e.target.value)}/>
          <Inp label="Prezzo Vendita (€) *" type="number" step="0.01" value={form.prezzo_vendita} onChange={e=>f('prezzo_vendita',+e.target.value)}/>
          <Inp label="Cliente *" value={form.cliente} onChange={e=>f('cliente',e.target.value)}/>
          <Inp label="Codice Fiscale Cliente" value={form.cf_cliente} onChange={e=>f('cf_cliente',e.target.value.toUpperCase())}/>
          <Sel label="Metodo Pagamento" value={form.metodo_pagamento} onChange={e=>f('metodo_pagamento',e.target.value)}>{['Bonifico','Contanti','Finanziamento','Assegno','POS'].map(v=><option key={v}>{v}</option>)}</Sel>
          <Txta label="Note" value={form.note} onChange={e=>f('note',e.target.value)}/>
        </div>
        {form.prezzo_vendita>0&&<div className="mt-4 bg-blue-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
          <div><div className="text-xs text-blue-600 font-medium">Margine Lordo</div><div className="text-lg font-bold text-blue-800">{fmt(ml)}</div></div>
          <div><div className="text-xs text-amber-600 font-medium">IVA Margine (22/122)</div><div className="text-lg font-bold text-amber-700">{fmt(iv)}</div></div>
          <div><div className="text-xs text-green-600 font-medium">Margine Netto</div><div className="text-lg font-bold text-green-700">{fmt(mn2)}</div></div>
        </div>}
        <div className="flex justify-end gap-2 mt-5"><Btn variant="secondary" onClick={()=>setShow(false)}>Annulla</Btn><Btn onClick={save}><Check size={13}/>Salva Vendita</Btn></div>
      </Modal>
    </div>
  );
};
const emptyE=()=>({id:'',categoria:'Affitto/Leasing',descrizione:'',importo:0,data:today(),ricorrente:false,note:''});
const Spese=({expenses,onAdd,onEdit,onDel})=>{
  const [show,setShow]=useState(false),[form,setForm]=useState(emptyE()),[eid,setEid]=useState(null),[fmo,setFmo]=useState(new Date().getMonth().toString()),[fyr,setFyr]=useState(new Date().getFullYear());
  const filt=expenses.filter(e=>{const d=new Date(e.data);return(fmo===''||d.getMonth()===+fmo)&&(!fyr||d.getFullYear()===+fyr);});
  const tot=filt.reduce((a,e)=>a+e.importo,0);
  const catM={};filt.forEach(e=>catM[e.categoria]=(catM[e.categoria]||0)+e.importo);
  const openAdd=()=>{setForm(emptyE());setEid(null);setShow(true);};
  const openEdit=e=>{setForm({...e});setEid(e.id);setShow(true);};
  const save=()=>{if(!form.descrizione||!form.importo)return;const e={...form,id:eid||uid()};eid?onEdit(e):onAdd(e);setShow(false);};
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900">Spese Operative</h1><Btn onClick={openAdd}><Plus size={13}/>Aggiungi Spesa</Btn></div>
      <div className="grid grid-cols-3 gap-4">
        <KPI icon={Euro} label="Totale Spese" value={fmt(tot)} color="red"/>
        <KPI icon={ShoppingBag} label="Voci di spesa" value={filt.length} color="amber"/>
        <KPI icon={BarChart2} label="Media per voce" value={fmt(filt.length?tot/filt.length:0)} color="blue"/>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card cls="p-5">
          <h3 className="text-sm font-semibold mb-3">Per Categoria</h3>
          <div className="space-y-2.5">
            {Object.entries(catM).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>(
              <div key={cat}><div className="flex justify-between text-xs text-gray-600 mb-0.5"><span className="truncate">{cat}</span><span className="font-medium ml-2 flex-shrink-0">{fmt(val)}</span></div>
              <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{width:`${tot?(val/tot*100):0}%`}}/></div></div>))}
            {Object.keys(catM).length===0&&<p className="text-sm text-gray-400 text-center py-4">Nessuna spesa</p>}
          </div>
        </Card>
        <Card cls="col-span-2">
          <div className="flex items-center gap-3 p-4 border-b">
            <Sel value={fmo} onChange={e=>setFmo(e.target.value)}><option value="">Tutti i mesi</option>{MESI_FULL.map((m,i)=><option key={i} value={i}>{m}</option>)}</Sel>
            <Sel value={fyr} onChange={e=>setFyr(+e.target.value)}>{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</Sel>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-gray-500 text-xs">{['Categoria','Descrizione','Data','Importo','Ricorrente','Azioni'].map(h=><th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {filt.length===0&&<tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Nessuna spesa</td></tr>}
                {[...filt].sort((a,b)=>new Date(b.data)-new Date(a.data)).map(e=>(
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5"><Badge c="blue">{e.categoria}</Badge></td>
                    <td className="px-4 py-2.5 font-medium">{e.descrizione}</td>
                    <td className="px-4 py-2.5 text-gray-500">{fmtD(e.data)}</td>
                    <td className="px-4 py-2.5 font-semibold text-red-600">{fmt(e.importo)}</td>
                    <td className="px-4 py-2.5">{e.ricorrente?<Badge c="green">Sì</Badge>:<Badge>No</Badge>}</td>
                    <td className="px-4 py-2.5"><div className="flex gap-0.5"><IcoBtn onClick={()=>openEdit(e)} icon={Edit2} color="blue"/><IcoBtn onClick={()=>onDel(e.id)} icon={Trash2} color="red"/></div></td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <Modal open={show} onClose={()=>setShow(false)} title={eid?'Modifica Spesa':'Nuova Spesa'}>
        <div className="grid grid-cols-2 gap-4">
          <Sel label="Categoria" value={form.categoria} onChange={e=>f('categoria',e.target.value)}>{CAT_SPESE.map(c=><option key={c}>{c}</option>)}</Sel>
          <Inp label="Data" type="date" value={form.data} onChange={e=>f('data',e.target.value)}/>
          <div className="col-span-2"><Inp label="Descrizione *" value={form.descrizione} onChange={e=>f('descrizione',e.target.value)}/></div>
          <Inp label="Importo (€) *" type="number" step="0.01" value={form.importo} onChange={e=>f('importo',+e.target.value)}/>
          <div className="flex items-center gap-2 mt-5"><input type="checkbox" id="ric" checked={form.ricorrente} onChange={e=>f('ricorrente',e.target.checked)} className="w-4 h-4 rounded"/><label htmlFor="ric" className="text-sm font-medium text-gray-700">Spesa ricorrente</label></div>
          <div className="col-span-2"><Txta label="Note" value={form.note} onChange={e=>f('note',e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-2 mt-5"><Btn variant="secondary" onClick={()=>setShow(false)}>Annulla</Btn><Btn onClick={save}><Check size={13}/>Salva</Btn></div>
      </Modal>
    </div>
  );
};
const GestioneIVA=({sales,settings,f24})=>{
  const [anno,setAnno]=useState(new Date().getFullYear());
  const IVA_CODES_TRIM={Q1:'6031',Q2:'6032',Q3:'6033',Q4:'6099'};
  const IVA_CODES_MENS=Array.from({length:12},(_,i)=>`600${i<9?'0':''}${i+1}`);
  const QQ=[
    {id:'Q1',label:'I Trimestre — Gennaio · Febbraio · Marzo',mesi:[0,1,2],scad:'16 maggio'},
    {id:'Q2',label:'II Trimestre — Aprile · Maggio · Giugno',mesi:[3,4,5],scad:'20 agosto'},
    {id:'Q3',label:'III Trimestre — Luglio · Agosto · Settembre',mesi:[6,7,8],scad:'16 novembre'},
    {id:'Q4',label:'IV Trimestre — Ottobre · Novembre · Dicembre',mesi:[9,10,11],scad:'16 marzo anno seg.'},
  ];
  const bySales=ms=>sales.filter(s=>{const d=new Date(s.data_vendita);return d.getFullYear()===anno&&ms.includes(d.getMonth());});
  // F24 IVA pagati per questo anno (per codice tributo)
  const f24PagatoByCode=codice=>f24.filter(r=>r.stato==='pagato'&&r.anno===anno&&r.codice_tributo===codice).reduce((a,r)=>a+r.importo,0);
  const f24PagatoByMese=mese=>f24.filter(r=>r.stato==='pagato'&&r.anno===anno&&r.codice_tributo===IVA_CODES_MENS[mese]).reduce((a,r)=>a+r.importo,0);
  const aS=sales.filter(s=>new Date(s.data_vendita).getFullYear()===anno);
  const totF=aS.reduce((a,v)=>a+v.prezzo_vendita,0),totA=aS.reduce((a,v)=>a+v.prezzo_acquisto,0);
  const totML=Math.max(0,totF-totA),totIva=+(totML*22/122).toFixed(2),totMN=+(totML-totIva).toFixed(2);
  const allIvaCodes=[...Object.values(IVA_CODES_TRIM),...IVA_CODES_MENS,'1668'];
  const totIvaPagata=f24.filter(r=>r.stato==='pagato'&&r.anno===anno&&allIvaCodes.includes(r.codice_tributo)).reduce((a,r)=>a+r.importo,0);
  const totIvaResidua=Math.max(0,totIva-totIvaPagata);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Gestione IVA</h1><p className="text-sm text-gray-500">Regime del Margine — art. 36 D.L. 41/1995</p></div>
        <Sel value={anno} onChange={e=>setAnno(+e.target.value)}>{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</Sel>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={15} className="text-blue-500 mt-0.5 flex-shrink-0"/>
        <p className="text-sm text-blue-700">Nel <strong>Regime del Margine</strong> l'IVA si calcola sul margine: <code className="bg-blue-100 px-1 rounded">IVA = (P.Vendita − P.Acquisto) × 22 ÷ 122</code>. Il margine deve essere positivo. Liquidazione: {settings.liquidazioneIva}.</p>
      </div>
      <div className="grid grid-cols-5 gap-4">
        <KPI icon={Euro} label="Fatturato Anno" value={fmt(totF)} color="blue"/>
        <KPI icon={TrendingUp} label="Margine Lordo" value={fmt(totML)} color="green"/>
        <KPI icon={Receipt} label="IVA Maturata" value={fmt(totIva)} color="amber" sub="Totale anno"/>
        <KPI icon={CheckCircle} label="IVA Già Pagata" value={fmt(totIvaPagata)} color="green" sub="Via F24"/>
        <KPI icon={AlertCircle} label="IVA Residua" value={fmt(totIvaResidua)} color={totIvaResidua>0?'red':'green'} sub={totIvaResidua===0?'Tutto versato':'Da versare'}/>
      </div>
      <div className="space-y-3">
        {QQ.map(q=>{
          const qs=bySales(q.mesi),fat=qs.reduce((a,v)=>a+v.prezzo_vendita,0),acq=qs.reduce((a,v)=>a+v.prezzo_acquisto,0);
          const ml=Math.max(0,fat-acq),iv=+(ml*22/122).toFixed(2),mn2=+(ml-iv).toFixed(2);
          const ivaCodice=IVA_CODES_TRIM[q.id];
          const ivaPag=settings.liquidazioneIva==='mensile'
            ?q.mesi.reduce((a,m)=>a+f24PagatoByMese(m),0)
            :f24PagatoByCode(ivaCodice);
          const ivaRes=Math.max(0,iv-ivaPag);
          const f24Rel=f24.filter(r=>r.anno===anno&&(settings.liquidazioneIva==='mensile'?q.mesi.map(m=>IVA_CODES_MENS[m]).includes(r.codice_tributo):r.codice_tributo===ivaCodice));
          return <Card key={q.id} cls="p-5">
            <div className="flex items-start justify-between mb-4">
              <div><h3 className="font-semibold text-gray-900">{q.label}</h3><p className="text-xs text-gray-500 mt-0.5">Scadenza: <span className="font-medium text-red-600">{q.scad}</span> • Codice F24: <span className="font-mono font-bold">{ivaCodice}</span></p></div>
              <div className="flex gap-2">
                {ivaPag>0&&<Badge c="green">Pagata: {fmt(ivaPag)}</Badge>}
                <Badge c={ivaRes>0?'amber':'green'}>{ivaRes>0?`Residua: ${fmt(ivaRes)}`:'Versata ✓'}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {[['Vendite',qs.length,'gray',false],['Fatturato',fat,'blue',true],['P.Acquisto',acq,'gray',true],['IVA Maturata',iv,'amber',true],['IVA Pagata',ivaPag,'green',true],['IVA Residua',ivaRes,ivaRes>0?'red':'green',true]].map(([l,v,c,curr])=>(
                <div key={l} className={`bg-${c}-50 rounded-lg p-3 text-center`}><div className={`text-xs text-${c}-600 font-medium mb-1`}>{l}</div><div className={`font-bold text-${c}-800 text-sm`}>{curr?fmt(v):v}</div></div>))}
            </div>
            {f24Rel.length>0&&<div className="bg-gray-50 rounded-lg p-3 mb-3"><p className="text-xs font-semibold text-gray-600 mb-2">F24 collegati a questo trimestre:</p><div className="space-y-1">{f24Rel.map(r=><div key={r.id} className="flex items-center justify-between text-xs"><span className="font-mono text-gray-500">{r.codice_tributo}</span><span className="text-gray-700 truncate mx-2">{r.descrizione||r.codice_tributo}</span><span className="font-bold">{fmt(r.importo)}</span><Badge c={r.stato==='pagato'?'green':'amber'}>{r.stato==='pagato'?'Pagato':'Da pagare'}</Badge></div>)}</div></div>}
            {qs.length>0&&<div className="overflow-x-auto border-t pt-3"><table className="w-full text-xs">
              <thead><tr className="text-gray-500"><th className="py-1 text-left">Veicolo</th><th className="py-1 text-right">P.Vendita</th><th className="py-1 text-right">P.Acquisto</th><th className="py-1 text-right">Margine</th><th className="py-1 text-right">IVA</th></tr></thead>
              <tbody>{qs.map(s=>{const m=Math.max(0,s.prezzo_vendita-s.prezzo_acquisto),iv2=ivaM(s.prezzo_vendita,s.prezzo_acquisto);
                return <tr key={s.id} className="border-t border-gray-100"><td className="py-1">{s.targa} — {s.marca} {s.modello}</td><td className="py-1 text-right">{fmt(s.prezzo_vendita)}</td><td className="py-1 text-right">{fmt(s.prezzo_acquisto)}</td><td className="py-1 text-right text-blue-600">{fmt(m)}</td><td className="py-1 text-right text-amber-600">{fmt(iv2)}</td></tr>;})}</tbody>
            </table></div>}
          </Card>;})}
      </div>
    </div>
  );
};
const emptyF=()=>({id:'',anno:new Date().getFullYear(),codice_tributo:'6031',descrizione:'',importo:0,scadenza:'',stato:'da_pagare',data_pagamento:'',note:''});
const F24Preview=({r,s})=>(
  <div className="border-2 border-gray-700 font-mono text-xs text-gray-800">
    <div className="bg-blue-800 text-white text-center py-2 font-bold tracking-widest text-sm">MODELLO F24 — VERSAMENTO UNITARIO</div>
    <div className="p-4 border-b border-gray-300 bg-gray-50">
      <div className="text-xs font-bold text-gray-500 uppercase mb-2">Dati Anagrafici del Contribuente</div>
      <div className="grid grid-cols-2 gap-4">
        <div><div className="text-gray-500 text-xs">Ragione Sociale</div><div className="font-bold border-b border-gray-400 mt-1 pb-1">{s.ragioneSociale||'________________________________'}</div></div>
        <div><div className="text-gray-500 text-xs">Codice Fiscale</div><div className="font-bold border-b border-gray-400 mt-1 pb-1 tracking-widest">{s.codiceFiscale||'_________________'}</div></div>
        <div><div className="text-gray-500 text-xs">Domicilio Fiscale</div><div className="font-bold border-b border-gray-400 mt-1 pb-1">{s.indirizzo}{s.citta?`, ${s.citta}`:''}{s.provincia?` (${s.provincia})`:''}</div></div>
        <div><div className="text-gray-500 text-xs">Partita IVA</div><div className="font-bold border-b border-gray-400 mt-1 pb-1 tracking-widest">{s.partitaIva||'_________________'}</div></div>
      </div>
    </div>
    <div className="p-4 border-b border-gray-300">
      <div className="text-xs font-bold text-gray-500 uppercase mb-2">Sezione Erario</div>
      <table className="w-full border-collapse text-xs">
        <thead><tr className="bg-gray-100"><th className="border border-gray-300 p-1.5 text-center">Codice Tributo</th><th className="border border-gray-300 p-1.5 text-center">Rateaz./Regione</th><th className="border border-gray-300 p-1.5 text-center">Anno di Rif.</th><th className="border border-gray-300 p-1.5 text-center">Importi a Debito</th><th className="border border-gray-300 p-1.5 text-center">Importi a Credito</th></tr></thead>
        <tbody>
          <tr><td className="border border-gray-300 p-1.5 text-center font-bold text-blue-800">{r.codice_tributo}</td><td className="border border-gray-300 p-1.5 text-center">—</td><td className="border border-gray-300 p-1.5 text-center font-bold">{r.anno}</td><td className="border border-gray-300 p-1.5 text-right font-bold">{fmt(r.importo)}</td><td className="border border-gray-300 p-1.5 text-center">—</td></tr>
          {[1,2,3,4].map(i=><tr key={i}>{[0,1,2,3,4].map(j=><td key={j} className="border border-gray-300 p-2">&nbsp;</td>)}</tr>)}
        </tbody>
        <tfoot><tr className="bg-gray-50 font-bold"><td colSpan={3} className="border border-gray-300 p-1.5 text-right">TOTALE A DEBITO (A)</td><td className="border border-gray-300 p-1.5 text-right text-blue-800">{fmt(r.importo)}</td><td className="border border-gray-300 p-1.5 text-center">—</td></tr></tfoot>
      </table>
    </div>
    <div className="p-4 grid grid-cols-2 gap-6">
      <div><div className="text-xs font-bold text-gray-500 uppercase mb-2">Saldo (A − B)</div><div className="border-2 border-blue-800 p-4 text-right rounded"><div className="text-2xl font-bold text-blue-800">{fmt(r.importo)}</div><div className="text-xs text-gray-500 mt-1">Da versare entro il {fmtD(r.scadenza)}</div></div></div>
      <div><div className="text-xs font-bold text-gray-500 uppercase mb-2">Firma del Contribuente</div><div className="border-b border-gray-400 mt-8 pb-1"/><div className="text-xs text-gray-400 text-center mt-1">Data e firma</div></div>
    </div>
    <div className="bg-gray-100 px-4 py-2 text-center text-xs text-gray-500 border-t">Pagabile presso banche, uffici postali o tramite i servizi telematici dell'Agenzia delle Entrate</div>
  </div>
);
const F24Manager=({f24Records,onAdd,onEdit,onDel,settings})=>{
  const [show,setShow]=useState(false),[prev,setPrev]=useState(null),[form,setForm]=useState(emptyF()),[eid,setEid]=useState(null);
  const allT=[...(settings.liquidazioneIva==='mensile'?TRIBUTI_IVA_MENS:TRIBUTI_IVA_TRIM),...ALTRI_TRIBUTI];
  const openAdd=()=>{setForm(emptyF());setEid(null);setShow(true);};
  const openEdit=r=>{setForm({...r});setEid(r.id);setShow(true);};
  const save=()=>{if(!form.codice_tributo||!form.importo)return;const r={...form,id:eid||uid()};eid?onEdit(r):onAdd(r);setShow(false);};
  const paid=id=>{const r=f24Records.find(x=>x.id===id);if(r)onEdit({...r,stato:'pagato',data_pagamento:today()});};
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const dap=f24Records.filter(r=>r.stato==='da_pagare'),pag=f24Records.filter(r=>r.stato==='pagato'),oggi=new Date();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">F24 & Tasse</h1><p className="text-sm text-gray-500">Gestione pagamenti tributari</p></div><Btn onClick={openAdd}><Plus size={13}/>Nuovo F24</Btn></div>
      <div className="grid grid-cols-3 gap-4">
        <KPI icon={AlertCircle} label="Da Pagare" value={fmt(dap.reduce((a,r)=>a+r.importo,0))} color="red" sub={`${dap.length} scadenze`}/>
        <KPI icon={CheckCircle} label="Già Pagato" value={fmt(pag.reduce((a,r)=>a+r.importo,0))} color="green" sub={`${pag.length} pagamenti`}/>
        <KPI icon={FileText} label="Totale Anno" value={fmt(f24Records.reduce((a,r)=>a+r.importo,0))} color="blue"/>
      </div>
      {dap.length>0&&<Card>
        <div className="px-5 py-3 border-b flex items-center gap-2"><AlertCircle size={14} className="text-red-500"/><h3 className="text-sm font-semibold text-red-700">Da Pagare</h3></div>
        {[...dap].sort((a,b)=>new Date(a.scadenza)-new Date(b.scadenza)).map(r=>{
          const diff=Math.ceil((new Date(r.scadenza)-oggi)/86400000);
          return <div key={r.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-xs font-bold text-red-600">{r.codice_tributo}</div>
              <div><p className="text-sm font-semibold text-gray-900">{r.descrizione||allT.find(t=>t.codice===r.codice_tributo)?.desc||r.codice_tributo}</p><p className="text-xs text-gray-500">Anno {r.anno} — Scadenza {fmtD(r.scadenza)}</p></div></div>
            <div className="flex items-center gap-3"><div className="text-right"><p className="font-bold text-gray-900">{fmt(r.importo)}</p><p className={`text-xs font-medium ${diff<=0?'text-red-600':diff<=10?'text-amber-500':'text-gray-400'}`}>{diff<0?'SCADUTO':diff===0?'Oggi':diff===1?'Domani':`Fra ${diff} giorni`}</p></div>
              <button onClick={()=>setPrev(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={13}/></button>
              <button onClick={()=>openEdit(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={13}/></button>
              <Btn size="sm" variant="success" onClick={()=>paid(r.id)}><Check size={12}/>Pagato</Btn>
              <IcoBtn onClick={()=>onDel(r.id)} icon={Trash2} color="red"/></div>
          </div>;})}
      </Card>}
      {pag.length>0&&<Card>
        <div className="px-5 py-3 border-b flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/><h3 className="text-sm font-semibold text-green-700">Pagati</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs">{['Codice','Descrizione','Anno','Scadenza','Pagato il','Importo',''].map(h=><th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{pag.map(r=><tr key={r.id} className="hover:bg-gray-50">
            <td className="px-4 py-2.5 font-mono font-bold text-green-700">{r.codice_tributo}</td>
            <td className="px-4 py-2.5">{r.descrizione||allT.find(t=>t.codice===r.codice_tributo)?.desc||'—'}</td>
            <td className="px-4 py-2.5">{r.anno}</td><td className="px-4 py-2.5 text-gray-500">{fmtD(r.scadenza)}</td>
            <td className="px-4 py-2.5"><Badge c="green">{fmtD(r.data_pagamento)}</Badge></td>
            <td className="px-4 py-2.5 font-semibold">{fmt(r.importo)}</td>
            <td className="px-4 py-2.5"><div className="flex gap-0.5"><button onClick={()=>setPrev(r)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={13}/></button><IcoBtn onClick={()=>onDel(r.id)} icon={Trash2} color="red"/></div></td>
          </tr>)}</tbody>
        </table></div>
      </Card>}
      {f24Records.length===0&&<Card cls="p-12 text-center text-gray-400 text-sm">Nessun F24 registrato</Card>}
      <Modal open={show} onClose={()=>setShow(false)} title={eid?'Modifica F24':'Nuovo F24'}>
        <div className="grid grid-cols-2 gap-4">
          <Inp label="Anno di Riferimento" type="number" value={form.anno} onChange={e=>f('anno',+e.target.value)}/>
          <Inp label="Data Scadenza" type="date" value={form.scadenza} onChange={e=>f('scadenza',e.target.value)}/>
          <div className="col-span-2"><Sel label="Codice Tributo" value={form.codice_tributo} onChange={e=>f('codice_tributo',e.target.value)}>
            <optgroup label={`IVA (${settings.liquidazioneIva})`}>{(settings.liquidazioneIva==='mensile'?TRIBUTI_IVA_MENS:TRIBUTI_IVA_TRIM).map(t=><option key={t.codice} value={t.codice}>{t.codice} — {t.desc}</option>)}</optgroup>
            <optgroup label="Altre Imposte">{ALTRI_TRIBUTI.map(t=><option key={t.codice} value={t.codice}>{t.codice} — {t.desc}</option>)}</optgroup>
          </Sel></div>
          <div className="col-span-2"><Inp label="Descrizione aggiuntiva" value={form.descrizione} onChange={e=>f('descrizione',e.target.value)}/></div>
          <Inp label="Importo (€)" type="number" step="0.01" value={form.importo} onChange={e=>f('importo',+e.target.value)}/>
          <Sel label="Stato" value={form.stato} onChange={e=>f('stato',e.target.value)}><option value="da_pagare">Da pagare</option><option value="pagato">Pagato</option></Sel>
          {form.stato==='pagato'&&<div className="col-span-2"><Inp label="Data Pagamento" type="date" value={form.data_pagamento} onChange={e=>f('data_pagamento',e.target.value)}/></div>}
          <div className="col-span-2"><Txta label="Note" value={form.note} onChange={e=>f('note',e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-2 mt-5"><Btn variant="secondary" onClick={()=>setShow(false)}>Annulla</Btn><Btn onClick={save}><Check size={13}/>Salva F24</Btn></div>
      </Modal>
      <Modal open={!!prev} onClose={()=>setPrev(null)} title="Anteprima F24" size="lg">
        {prev&&<F24Preview r={prev} s={settings}/>}
        <div className="flex justify-end gap-2 mt-4"><Btn variant="secondary" onClick={()=>setPrev(null)}>Chiudi</Btn><Btn onClick={()=>window.print()}><Printer size={13}/>Stampa</Btn></div>
      </Modal>
    </div>
  );
};
const emptyM=n=>({id:'',numero:n,data:today(),beneficiario:'',cf_ben:'',causale:'',importo:0,metodo:'Bonifico',iban_ben:'',stato:'in_attesa',data_ese:'',note:''});
const STATI_M={in_attesa:{l:'In attesa',c:'amber'},approvato:{l:'Approvato',c:'blue'},eseguito:{l:'Eseguito',c:'green'},annullato:{l:'Annullato',c:'red'}};
const MandatiPagamento=({mandati,onAdd,onEdit,onDel,settings})=>{
  const [show,setShow]=useState(false),[prev,setPrev]=useState(null),[form,setForm]=useState(emptyM('MP0001')),[eid,setEid]=useState(null);
  const nNum=`MP${String(mandati.length+1).padStart(4,'0')}`;
  const openAdd=()=>{setForm(emptyM(nNum));setEid(null);setShow(true);};
  const openEdit=m=>{setForm({...m});setEid(m.id);setShow(true);};
  const save=()=>{if(!form.beneficiario||!form.importo)return;const m={...form,id:eid||uid()};eid?onEdit(m):onAdd(m);setShow(false);};
  const approva=id=>{const m=mandati.find(x=>x.id===id);if(m)onEdit({...m,stato:'approvato'});};
  const esegui=id=>{const m=mandati.find(x=>x.id===id);if(m)onEdit({...m,stato:'eseguito',data_ese:today()});};
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-gray-900">Mandati di Pagamento</h1><p className="text-sm text-gray-500">{mandati.length} mandati totali</p></div><Btn onClick={openAdd}><Plus size={13}/>Nuovo Mandato</Btn></div>
      <div className="grid grid-cols-3 gap-4">
        <KPI icon={Euro} label="Totale Mandati" value={fmt(mandati.filter(m=>m.stato!=='annullato').reduce((a,m)=>a+m.importo,0))} color="blue"/>
        <KPI icon={Clock} label="Da Eseguire" value={mandati.filter(m=>m.stato==='in_attesa'||m.stato==='approvato').length} color="amber"/>
        <KPI icon={CheckCircle} label="Eseguiti" value={mandati.filter(m=>m.stato==='eseguito').length} color="green"/>
      </div>
      <Card><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="bg-gray-50 text-gray-500 text-xs">{['N°','Data','Beneficiario','Causale','Importo','Metodo','Stato','Azioni'].map(h=><th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y">
          {mandati.length===0&&<tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Nessun mandato registrato</td></tr>}
          {[...mandati].sort((a,b)=>new Date(b.data)-new Date(a.data)).map(m=>(
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{m.numero}</td>
              <td className="px-4 py-2.5 text-gray-500">{fmtD(m.data)}</td>
              <td className="px-4 py-2.5 font-medium">{m.beneficiario}</td>
              <td className="px-4 py-2.5 text-gray-600 max-w-48 truncate">{m.causale}{m.f24_id&&<span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">F24</span>}</td>
              <td className="px-4 py-2.5 font-bold">{fmt(m.importo)}</td>
              <td className="px-4 py-2.5">{m.metodo}</td>
              <td className="px-4 py-2.5"><Badge c={STATI_M[m.stato]?.c}>{STATI_M[m.stato]?.l}</Badge></td>
              <td className="px-4 py-2.5"><div className="flex items-center gap-1">
                <IcoBtn onClick={()=>setPrev(m)} icon={Eye} color="blue"/>
                {m.stato==='in_attesa'&&<Btn size="sm" variant="secondary" onClick={()=>approva(m.id)}>Approva</Btn>}
                {m.stato==='approvato'&&<Btn size="sm" variant="success" onClick={()=>esegui(m.id)}>Esegui</Btn>}
                <IcoBtn onClick={()=>openEdit(m)} icon={Edit2} color="blue"/>
                <IcoBtn onClick={()=>onDel(m.id)} icon={Trash2} color="red"/>
              </div></td>
            </tr>))}
        </tbody>
      </table></div></Card>
      <Modal open={show} onClose={()=>setShow(false)} title={eid?'Modifica Mandato':'Nuovo Mandato di Pagamento'}>
        <div className="grid grid-cols-2 gap-4">
          <Inp label="N° Mandato" value={form.numero} onChange={e=>f('numero',e.target.value)}/>
          <Inp label="Data" type="date" value={form.data} onChange={e=>f('data',e.target.value)}/>
          <Inp label="Beneficiario *" value={form.beneficiario} onChange={e=>f('beneficiario',e.target.value)}/>
          <Inp label="CF / P.IVA Beneficiario" value={form.cf_ben} onChange={e=>f('cf_ben',e.target.value.toUpperCase())}/>
          <div className="col-span-2"><Inp label="Causale del pagamento *" value={form.causale} onChange={e=>f('causale',e.target.value)}/></div>
          <Inp label="Importo (€) *" type="number" step="0.01" value={form.importo} onChange={e=>f('importo',+e.target.value)}/>
          <Sel label="Metodo" value={form.metodo} onChange={e=>f('metodo',e.target.value)}>{['Bonifico','Assegno','Contanti','SEPA','RID'].map(v=><option key={v}>{v}</option>)}</Sel>
          {form.metodo==='Bonifico'&&<div className="col-span-2"><Inp label="IBAN Beneficiario" value={form.iban_ben} onChange={e=>f('iban_ben',e.target.value.toUpperCase())} placeholder="IT60 X054 2811 1010 0000 0123 456"/></div>}
          <Sel label="Stato" value={form.stato} onChange={e=>f('stato',e.target.value)}>{Object.entries(STATI_M).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}</Sel>
          {form.stato==='eseguito'&&<Inp label="Data Esecuzione" type="date" value={form.data_ese} onChange={e=>f('data_ese',e.target.value)}/>}
          <div className="col-span-2"><Txta label="Note" value={form.note} onChange={e=>f('note',e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-2 mt-5"><Btn variant="secondary" onClick={()=>setShow(false)}>Annulla</Btn><Btn onClick={save}><Check size={13}/>Salva Mandato</Btn></div>
      </Modal>
      <Modal open={!!prev} onClose={()=>setPrev(null)} title="Mandato di Pagamento" size="md">
        {prev&&<div className="border-2 border-gray-300 p-6 font-serif text-sm">
          <div className="text-center mb-5"><div className="text-xl font-bold tracking-wide uppercase">Mandato di Pagamento</div><div className="text-gray-500 mt-1">N° {prev.numero} del {fmtD(prev.data)}</div></div>
          <div className="grid grid-cols-2 gap-6 mb-5">
            <div><div className="text-xs uppercase text-gray-400 font-medium mb-1">Ordinante</div><div className="font-bold">{settings.ragioneSociale||'—'}</div><div className="text-xs text-gray-500">{settings.partitaIva}</div></div>
            <div><div className="text-xs uppercase text-gray-400 font-medium mb-1">Beneficiario</div><div className="font-bold">{prev.beneficiario}</div><div className="text-xs text-gray-500">{prev.cf_ben}</div></div>
          </div>
          <div className="border-t pt-4 mb-4"><div className="text-xs uppercase text-gray-400 font-medium mb-1">Causale</div><div className="font-medium">{prev.causale}</div></div>
          <div className="grid grid-cols-2 gap-6 border-t pt-4 mb-4">
            <div><div className="text-xs uppercase text-gray-400 font-medium mb-1">Metodo</div><div className="font-bold">{prev.metodo}</div>{prev.iban_ben&&<div className="text-xs font-mono text-gray-600 mt-1">{prev.iban_ben}</div>}</div>
            <div className="text-right"><div className="text-xs uppercase text-gray-400 font-medium mb-1">Importo</div><div className="text-2xl font-bold text-blue-800">{fmt(prev.importo)}</div></div>
          </div>
          <div className="border-t pt-4 flex justify-between items-end">
            <div><div className="text-xs text-gray-400 uppercase font-medium">Stato</div><div className="mt-1 font-bold">{prev.stato==='eseguito'?<span className="text-green-600">✓ ESEGUITO il {fmtD(prev.data_ese)}</span>:<span className="text-amber-600">{STATI_M[prev.stato]?.l?.toUpperCase()}</span>}</div></div>
            <div className="text-center"><div className="border-b border-gray-400 w-44 mb-1 pb-4"/><div className="text-xs text-gray-400">Firma autorizzata</div></div>
          </div>
        </div>}
        <div className="flex justify-end gap-2 mt-4"><Btn variant="secondary" onClick={()=>setPrev(null)}>Chiudi</Btn><Btn onClick={()=>window.print()}><Printer size={13}/>Stampa</Btn></div>
      </Modal>
    </div>
  );
};
const Bilancio=({sales,expenses,f24Records})=>{
  const [anno,setAnno]=useState(new Date().getFullYear());
  const getData=mo=>{
    const sv=sales.filter(v=>{const d=new Date(v.data_vendita);return d.getFullYear()===anno&&d.getMonth()===mo;});
    const ex=expenses.filter(e=>{const d=new Date(e.data);return d.getFullYear()===anno&&d.getMonth()===mo;});
    const f4=f24Records.filter(r=>r.anno===anno&&r.stato==='pagato'&&new Date(r.data_pagamento||'').getMonth()===mo);
    const fat=sv.reduce((a,v)=>a+v.prezzo_vendita,0),mn=sv.reduce((a,v)=>a+margN(v.prezzo_vendita,v.prezzo_acquisto),0);
    const sp=ex.reduce((a,e)=>a+e.importo,0),im=f4.reduce((a,r)=>a+r.importo,0);
    return {fat,mn,sp,im,utile:mn-sp-im,nv:sv.length};
  };
  const md=MESI.map((name,i)=>({name,...getData(i)}));
  const tot=md.reduce((a,m)=>({fat:a.fat+m.fat,mn:a.mn+m.mn,sp:a.sp+m.sp,im:a.im+m.im,utile:a.utile+m.utile,nv:a.nv+m.nv}),{fat:0,mn:0,sp:0,im:0,utile:0,nv:0});
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900">Bilancio</h1>
        <Sel value={anno} onChange={e=>setAnno(+e.target.value)}>{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</Sel></div>
      <div className="grid grid-cols-5 gap-3">
        <KPI icon={Euro} label="Fatturato" value={fmt(tot.fat)} color="blue" sub={`${tot.nv} vendite`}/>
        <KPI icon={TrendingUp} label="Margine Netto" value={fmt(tot.mn)} color="green"/>
        <KPI icon={ShoppingBag} label="Spese Operative" value={fmt(tot.sp)} color="amber"/>
        <KPI icon={Receipt} label="Imposte Pagate" value={fmt(tot.im)} color="purple"/>
        <KPI icon={BarChart2} label="Utile Netto" value={fmt(tot.utile)} color={tot.utile>=0?'green':'red'}/>
      </div>
      <Card cls="p-5">
        <h3 className="text-sm font-semibold mb-4">Andamento {anno}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={md}>
            <defs>
              <linearGradient id="gMN" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              <linearGradient id="gSp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
            <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`€${(v/1000).toFixed(0)}k`}/>
            <Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:'8px',border:'1px solid #e5e7eb',fontSize:'12px'}}/>
            <Legend wrapperStyle={{fontSize:'11px'}}/>
            <Area type="monotone" dataKey="mn" name="Margine Netto" stroke="#10b981" fill="url(#gMN)" strokeWidth={2}/>
            <Area type="monotone" dataKey="sp" name="Spese Op." stroke="#f59e0b" fill="url(#gSp)" strokeWidth={2}/>
            <Area type="monotone" dataKey="utile" name="Utile Netto" stroke="#3b82f6" fill="none" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <div className="px-5 py-3 border-b"><h3 className="text-sm font-semibold">Dettaglio Mensile {anno}</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-gray-500 text-xs">{['Mese','N° Vendite','Fatturato','Margine Netto','Spese Op.','Imposte','Utile Netto'].map(h=><th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{md.map(m=>(
            <tr key={m.name} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 font-medium">{m.name}</td><td className="px-4 py-2.5">{m.nv}</td>
              <td className="px-4 py-2.5 text-blue-600">{fmt(m.fat)}</td><td className="px-4 py-2.5 text-green-600">{fmt(m.mn)}</td>
              <td className="px-4 py-2.5 text-amber-600">{fmt(m.sp)}</td><td className="px-4 py-2.5 text-purple-600">{fmt(m.im)}</td>
              <td className={`px-4 py-2.5 font-bold ${m.utile>=0?'text-green-700':'text-red-600'}`}>{fmt(m.utile)}</td>
            </tr>))}</tbody>
          <tfoot><tr className="bg-gray-50 font-bold border-t-2">
            <td className="px-4 py-2.5">TOTALE {anno}</td><td className="px-4 py-2.5">{tot.nv}</td>
            <td className="px-4 py-2.5 text-blue-700">{fmt(tot.fat)}</td><td className="px-4 py-2.5 text-green-700">{fmt(tot.mn)}</td>
            <td className="px-4 py-2.5 text-amber-700">{fmt(tot.sp)}</td><td className="px-4 py-2.5 text-purple-700">{fmt(tot.im)}</td>
            <td className={`px-4 py-2.5 ${tot.utile>=0?'text-green-700':'text-red-600'}`}>{fmt(tot.utile)}</td>
          </tr></tfoot>
        </table></div>
      </Card>
    </div>
  );
};
const Impostazioni=({settings,onSave})=>{
  const [form,setForm]=useState(settings),[ok,setOk]=useState(false);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const save=()=>{onSave(form);setOk(true);setTimeout(()=>setOk(false),2500);};
  useEffect(()=>setForm(settings),[settings]);
  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Impostazioni Azienda</h1>
      <Card cls="p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Building2 size={15}/>Dati Anagrafici</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Inp label="Ragione Sociale / Nome Azienda" value={form.ragioneSociale} onChange={e=>f('ragioneSociale',e.target.value)}/></div>
          <Inp label="Partita IVA" value={form.partitaIva} onChange={e=>f('partitaIva',e.target.value)} placeholder="12345678901"/>
          <Inp label="Codice Fiscale" value={form.codiceFiscale} onChange={e=>f('codiceFiscale',e.target.value.toUpperCase())}/>
          <div className="col-span-2"><Inp label="Indirizzo" value={form.indirizzo} onChange={e=>f('indirizzo',e.target.value)}/></div>
          <Inp label="CAP" value={form.cap} onChange={e=>f('cap',e.target.value)}/><Inp label="Città" value={form.citta} onChange={e=>f('citta',e.target.value)}/>
          <Inp label="Provincia (sigla)" value={form.provincia} onChange={e=>f('provincia',e.target.value.toUpperCase())} placeholder="RM"/>
          <Inp label="Codice ATECO" value={form.codiceAteco} onChange={e=>f('codiceAteco',e.target.value)}/>
          <Inp label="Telefono" value={form.telefono} onChange={e=>f('telefono',e.target.value)}/>
          <Inp label="Email" type="email" value={form.email} onChange={e=>f('email',e.target.value)}/>
          <div className="col-span-2"><Inp label="PEC" type="email" value={form.pec} onChange={e=>f('pec',e.target.value)}/></div>
        </div>
      </Card>
      <Card cls="p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Receipt size={15}/>Regime Fiscale</h2>
        <div className="grid grid-cols-2 gap-4">
          <Sel label="Tipo Società" value={form.tipoSocieta} onChange={e=>f('tipoSocieta',e.target.value)}><option value="srl">S.r.l.</option><option value="snc">S.n.c.</option><option value="sas">S.a.s.</option><option value="spa">S.p.A.</option><option value="ditta_individuale">Ditta Individuale</option></Sel>
          <Sel label="Regime IVA" value={form.regimeFiscale} onChange={e=>f('regimeFiscale',e.target.value)}><option value="margine">Regime del Margine (auto usate)</option><option value="ordinario">Regime Ordinario</option></Sel>
          <Sel label="Liquidazione IVA" value={form.liquidazioneIva} onChange={e=>f('liquidazioneIva',e.target.value)}><option value="trimestrale">Trimestrale</option><option value="mensile">Mensile</option></Sel>
          <Inp label="Aliquota IRES/IRPEF (%)" type="number" value={form.aliquotaImposta} onChange={e=>f('aliquotaImposta',+e.target.value)} placeholder="24"/>
        </div>
      </Card>
      <Card cls="p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Banknote size={15}/>Dati Bancari</h2>
        <div className="grid grid-cols-2 gap-4">
          <Inp label="Banca" value={form.banca} onChange={e=>f('banca',e.target.value)} placeholder="Es. UniCredit"/>
          <Inp label="IBAN Aziendale" value={form.iban} onChange={e=>f('iban',e.target.value.toUpperCase())} placeholder="IT60 X054 2811 1010 0000 0123 456"/>
        </div>
      </Card>
      <div className="flex justify-end"><Btn onClick={save} variant={ok?'success':'primary'} cls="min-w-40">{ok?<><Check size={13}/>Salvato!</>:<><Check size={13}/>Salva Impostazioni</>}</Btn></div>
    </div>
  );
};
export default function App() {
  const [sec,setSec]=useState('dashboard'),[settings,setSettings]=useState(DEFAULT_SETTINGS),
    [cars,setCars]=useState([]),[sales,setSales]=useState([]),
    [expenses,setExpenses]=useState([]),[f24,setF24]=useState([]),
    [mandati,setMandati]=useState([]),[loading,setLoading]=useState(true),
    [notif,setNotif]=useState(null);
  const notify=(msg,type='success')=>{setNotif({msg,type});setTimeout(()=>setNotif(null),3000);};
  const persist=(key,data)=>{
    try{localStorage.setItem(key,JSON.stringify(data));}catch(e){console.error(e);}
  };
  useEffect(()=>{
    const load=(key,set)=>{
      try{const d=localStorage.getItem(key);if(d)set(JSON.parse(d));}catch{}
    };
    load(SK.settings,setSettings);
    load(SK.cars,setCars);
    load(SK.sales,setSales);
    load(SK.expenses,setExpenses);
    load(SK.f24,setF24);
    load(SK.mandati,setMandati);
    setLoading(false);
  },[]);
  const cOps={
    add:v=>{const n=[...cars,v];setCars(n);persist(SK.cars,n);notify('Veicolo aggiunto al parco');},
    edit:v=>{const n=cars.map(c=>c.id===v.id?v:c);setCars(n);persist(SK.cars,n);notify('Veicolo aggiornato');},
    del:id=>{const n=cars.filter(c=>c.id!==id);setCars(n);persist(SK.cars,n);notify('Veicolo eliminato','info');}
  };
  const sOps={
    add:s=>{const n=[...sales,s];setSales(n);persist(SK.sales,n);
      if(s.veicolo_id){const nc=cars.map(c=>c.id===s.veicolo_id?{...c,stato:'venduto'}:c);setCars(nc);persist(SK.cars,nc);}
      notify('Vendita registrata con successo');},
    edit:s=>{const n=sales.map(v=>v.id===s.id?s:v);setSales(n);persist(SK.sales,n);notify('Vendita aggiornata');},
    del:id=>{const n=sales.filter(v=>v.id!==id);setSales(n);persist(SK.sales,n);notify('Vendita eliminata','info');}
  };
  const eOps={
    add:e=>{const n=[...expenses,e];setExpenses(n);persist(SK.expenses,n);notify('Spesa aggiunta');},
    edit:e=>{const n=expenses.map(v=>v.id===e.id?e:v);setExpenses(n);persist(SK.expenses,n);notify('Spesa aggiornata');},
    del:id=>{const n=expenses.filter(v=>v.id!==id);setExpenses(n);persist(SK.expenses,n);notify('Spesa eliminata','info');}
  };
  const fOps={
    add:r=>{
      const n=[...f24,r];setF24(n);persist(SK.f24,n);
      // Auto-crea mandato di pagamento collegato
      const nNum=`MP${String(mandati.length+1).padStart(4,'0')}`;
      const nm2={id:uid(),numero:nNum,data:today(),beneficiario:'Agenzia delle Entrate',cf_ben:'80415740580',causale:`F24 cod. ${r.codice_tributo} — ${r.descrizione||TRIBUTI_IVA_TRIM.find(t=>t.codice===r.codice_tributo)?.desc||r.codice_tributo} — Anno ${r.anno}`,importo:r.importo,metodo:'Bonifico',iban_ben:'',stato:'in_attesa',data_ese:'',note:'',f24_id:r.id};
      const nm=[...mandati,nm2];setMandati(nm);persist(SK.mandati,nm);
      notify('F24 aggiunto — mandato di pagamento creato automaticamente');
    },
    edit:r=>{const n=f24.map(v=>v.id===r.id?r:v);setF24(n);persist(SK.f24,n);notify('F24 aggiornato');},
    del:id=>{const n=f24.filter(v=>v.id!==id);setF24(n);persist(SK.f24,n);notify('F24 eliminato','info');}
  };
  const mOps={
    add:m=>{const n=[...mandati,m];setMandati(n);persist(SK.mandati,n);notify('Mandato creato');},
    edit:m=>{
      const prev=mandati.find(v=>v.id===m.id);
      const n=mandati.map(v=>v.id===m.id?m:v);setMandati(n);persist(SK.mandati,n);
      // Se il mandato diventa "eseguito" e ha un F24 collegato → marca F24 come pagato
      if(m.stato==='eseguito'&&prev?.stato!=='eseguito'&&m.f24_id){
        const nf=f24.map(r=>r.id===m.f24_id?{...r,stato:'pagato',data_pagamento:m.data_ese||today()}:r);
        setF24(nf);persist(SK.f24,nf);
        notify('Mandato eseguito — F24 marcato come pagato automaticamente');
      } else {
        notify('Mandato aggiornato');
      }
    },
    del:id=>{const n=mandati.filter(v=>v.id!==id);setMandati(n);persist(SK.mandati,n);notify('Mandato eliminato','info');}
  };
  const saveSettings=s=>{setSettings(s);persist(SK.settings,s);notify('Impostazioni salvate');};
  if(loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-gray-500 text-sm">Caricamento in corso...</p></div>
    </div>
  );
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{fontFamily:'system-ui,-apple-system,sans-serif'}}>
      {notif&&<Notif msg={notif.msg} type={notif.type} onClose={()=>setNotif(null)}/>}
      <Sidebar active={sec} onNav={setSec} s={settings}/>
      <div className="flex-1 overflow-y-auto"><div className="p-6">
        {sec==='dashboard'&&<Dashboard cars={cars} sales={sales} expenses={expenses} f24={f24} mandati={mandati} onNav={setSec}/>}
        {sec==='parco'&&<ParcoAuto cars={cars} onAdd={cOps.add} onEdit={cOps.edit} onDel={cOps.del}/>}
        {sec==='vendite'&&<Vendite sales={sales} cars={cars} onAdd={sOps.add} onEdit={sOps.edit} onDel={sOps.del}/>}
        {sec==='spese'&&<Spese expenses={expenses} onAdd={eOps.add} onEdit={eOps.edit} onDel={eOps.del}/>}
        {sec==='iva'&&<GestioneIVA sales={sales} settings={settings} f24={f24}/>}
        {sec==='f24'&&<F24Manager f24Records={f24} onAdd={fOps.add} onEdit={fOps.edit} onDel={fOps.del} settings={settings}/>}
        {sec==='mandati'&&<MandatiPagamento mandati={mandati} onAdd={mOps.add} onEdit={mOps.edit} onDel={mOps.del} settings={settings}/>}
        {sec==='bilancio'&&<Bilancio sales={sales} expenses={expenses} f24Records={f24}/>}
        {sec==='impostazioni'&&<Impostazioni settings={settings} onSave={saveSettings}/>}
      </div></div>
    </div>
  );
}
