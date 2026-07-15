import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase, settingsToDb, settingsFromDb } from './supabase.js';
import {
  LayoutDashboard, Car, ShoppingBag, TrendingUp, Receipt, FileText,
  CreditCard, Settings, Plus, Edit2, Trash2, Eye, X, Check,
  AlertTriangle, Building2, Euro, ChevronRight, Search, Printer,
  BarChart2, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUpRight, ArrowDownRight, Banknote, Info, Moon, Sun, Menu
} from "lucide-react";
import {
  BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from "recharts";
const SK = {
  settings:'cd:settings', cars:'cd:cars', sales:'cd:sales',
  expenses:'cd:expenses', f24:'cd:f24', mandati:'cd:mandati', auth:'cd:auth'
};
const DEFAULT_AUTH = { username:'admin', password:'Skylinevalerio2026@' };
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
const BRANDS_MODELS = {
  'Alfa Romeo':['Giulia','Giulietta','Stelvio','Tonale','Junior','MiTo','147','156','159','166','Brera','Spider','GTV','GT'],
  'Audi':['A1','A3','A4','A5','A6','A7','A8','Q2','Q3','Q4 e-tron','Q5','Q6 e-tron','Q7','Q8','TT','R8','e-tron GT','S3','S4','S5','RS3','RS4','RS6'],
  'BMW':['Serie 1','Serie 2','Serie 3','Serie 4','Serie 5','Serie 6','Serie 7','Serie 8','X1','X2','X3','X4','X5','X6','X7','Z4','i3','i4','i5','i7','iX','M2','M3','M4','M5'],
  'Chevrolet':['Aveo','Spark','Cruze','Captiva','Trax','Camaro','Corvette'],
  'Citroën':['C1','C3','C3 Aircross','C4','C4 X','C5 X','Berlingo','Jumper','ë-C3'],
  'Dacia':['Sandero','Logan','Duster','Lodgy','Jogger','Spring','Bigster'],
  'DS':['DS3','DS4','DS5','DS7','DS9'],
  'Ferrari':['Roma','SF90','F8 Tributo','488','812 Superfast','Portofino','Purosangue','296 GTB'],
  'Fiat':['500','500e','500X','500L','Panda','Tipo','Bravo','Punto','Grande Punto','Stilo','Doblò','Qubo','Ducato','Freemont'],
  'Ford':['Fiesta','Focus','Mondeo','Ka','Ka+','Puma','Kuga','EcoSport','Mustang','Explorer','Transit','Galaxy','S-Max','C-Max','Bronco'],
  'Honda':['Civic','Jazz','HR-V','CR-V','ZR-V','e','NSX'],
  'Hyundai':['i10','i20','i30','i40','Tucson','Santa Fe','Kona','Ioniq','Ioniq 5','Ioniq 6','ix35','ix55'],
  'Jeep':['Renegade','Compass','Cherokee','Grand Cherokee','Wrangler','Avenger','Gladiator'],
  'Kia':['Picanto','Rio','Ceed','Proceed','Stinger','Sportage','Sorento','Niro','EV6','EV9'],
  'Lamborghini':['Huracán','Urus','Revuelto','Esteroque'],
  'Lancia':['Ypsilon','Delta','Musa','Flavia','Thema'],
  'Land Rover':['Defender','Discovery','Discovery Sport','Range Rover','Range Rover Sport','Range Rover Evoque','Range Rover Velar','Freelander'],
  'Lexus':['IS','ES','GS','LS','UX','NX','RX','LX','LC'],
  'Maserati':['Ghibli','Quattroporte','Levante','GranTurismo','Grecale','GranCabrio'],
  'Mazda':['2','3','6','CX-3','CX-5','CX-30','CX-60','MX-5','MX-30'],
  'Mercedes-Benz':['Classe A','Classe B','Classe C','Classe E','Classe S','CLA','CLS','GLA','GLB','GLC','GLE','GLS','AMG GT','EQA','EQB','EQC','EQE','EQS','G-Klasse','Vito','Sprinter'],
  'Mini':['Cooper','Cooper S','Clubman','Countryman','Cabrio','Paceman','Cooper SE'],
  'Mitsubishi':['Colt','Eclipse Cross','Outlander','ASX','L200','Pajero','Space Star'],
  'Nissan':['Micra','Juke','Qashqai','X-Trail','Ariya','Leaf','370Z','Navara','Pulsar'],
  'Opel':['Corsa','Astra','Insignia','Crossland','Mokka','Grandland','Zafira','Meriva','Adam','Vectra'],
  'Peugeot':['108','208','308','408','508','2008','3008','4008','5008','Rifter','Partner','Expert'],
  'Porsche':['Macan','Cayenne','Panamera','911','Boxster','Cayman','Taycan','718'],
  'Renault':['Twingo','Clio','Zoe','Megane','Laguna','Captur','Kadjar','Koleos','Scenic','Espace','Austral','Trafic','Master'],
  'SEAT':['Ibiza','Leon','Toledo','Ateca','Arona','Tarraco','Alhambra','Mii'],
  'Škoda':['Fabia','Rapid','Octavia','Superb','Kamiq','Karoq','Kodiaq','Enyaq','Citigo'],
  'Smart':['ForTwo','ForFour','#1','#3'],
  'Subaru':['Impreza','Legacy','Outback','Forester','XV','Levorg','BRZ','WRX'],
  'Suzuki':['Swift','Ignis','Baleno','Vitara','S-Cross','Jimny','SX4'],
  'Tesla':['Model 3','Model S','Model X','Model Y','Cybertruck'],
  'Toyota':['Aygo','Aygo X','Yaris','Yaris Cross','Corolla','Camry','C-HR','RAV4','Land Cruiser','Hilux','Prius','Supra','GR86','bZ4X','GR Yaris'],
  'Volkswagen':['Polo','Golf','Passat','Arteon','Up!','ID.3','ID.4','ID.5','ID.7','T-Roc','T-Cross','Tiguan','Touareg','Touran','Sharan'],
  'Volvo':['V40','V60','V90','S60','S90','XC40','XC60','XC90','C40','EX30','EX90'],
};
const BRAND_LIST = [...Object.keys(BRANDS_MODELS).sort(), 'Altro...'];
const ALTRO = 'Altro...';
const CHART_COLORS = ['#0071e3','#34c759','#ff9500','#ff3b30','#af52de','#5ac8fa','#ff6b00','#30d158'];
const DEFAULT_SETTINGS = {
  ragioneSociale:'', partitaIva:'', codiceFiscale:'', indirizzo:'',
  cap:'', citta:'', provincia:'', telefono:'', email:'', pec:'',
  regimeFiscale:'margine', liquidazioneIva:'trimestrale',
  codiceAteco:'45.11.01', banca:'', iban:'', tipoSocieta:'srl', aliquotaImposta:24,
  fondoCassaIniziale:200000
};
const _fmtEUR = new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'});
const _fmtNum = new Intl.NumberFormat('it-IT');
const _fmtDate = new Intl.DateTimeFormat('it-IT');
const fmt = n => _fmtEUR.format(n||0);
const fmtN = n => _fmtNum.format(n||0);
const fmtD = d => d ? _fmtDate.format(new Date(d)) : '—';
const today = () => new Date().toISOString().split('T')[0];
const uid = () => Math.random().toString(36).slice(2,9)+Date.now().toString(36);
const ivaM = (pv,pa) => +Math.max(0,(pv-pa)*22/122).toFixed(2);
const margN = (pv,pa) => +Math.max(0,(pv-pa)-ivaM(pv,pa)).toFixed(2);
const BADGE = {
  gray:'bg-[#f5f5f7] text-[#1d1d1f]',
  green:'bg-[#34c759]/15 text-[#1a7535]',
  red:'bg-[#ff3b30]/10 text-[#cc2900]',
  amber:'bg-[#ff9500]/15 text-[#7a4700]',
  blue:'bg-[#0071e3]/10 text-[#0071e3]',
  purple:'bg-[#af52de]/10 text-[#7b2fa0]',
};
const Badge = ({c='gray',children}) => <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE[c]||BADGE.gray}`}>{children}</span>;
const Card = ({children,cls=''}) => <div className={`bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.07)] transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.11)] ${cls}`}>{children}</div>;
const KPI_IC={blue:'text-[#0071e3]',green:'text-[#34c759]',amber:'text-[#ff9500]',red:'text-[#ff3b30]',purple:'text-[#af52de]',celeste:'text-[#5ac8fa]'};
const KPI = ({icon:Ic,label,value,sub,color='blue',trend}) => {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.07)] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_6px_28px_rgba(0,0,0,0.12)] cursor-default">
      <div className="flex items-start justify-between mb-3">
        <Ic size={18} className={KPI_IC[color]||KPI_IC.blue}/>
        {trend!==undefined&&<span className={`text-xs font-medium flex items-center gap-0.5 ${trend>=0?'text-[#34c759]':'text-[#ff3b30]'}`}>{trend>=0?<ArrowUpRight size={12}/>:<ArrowDownRight size={12}/>}{Math.abs(trend)}%</span>}
      </div>
      <div className="text-[22px] font-semibold text-[#1d1d1f] leading-tight">{value}</div>
      <div className="text-xs text-[#86868b] mt-1 font-medium">{label}</div>
      {sub&&<div className="text-[11px] text-[#86868b] mt-0.5">{sub}</div>}
    </div>
  );
};
const Modal = ({open,onClose,title,children,size='md'}) => {
  if(!open) return null;
  const sz={sm:'max-w-md',md:'max-w-2xl',lg:'max-w-4xl'};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className={`bg-white rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] w-full ${sz[size]} max-h-[90vh] flex flex-col animate-scaleIn`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0] flex-shrink-0">
          <h2 className="text-base font-semibold text-[#1d1d1f]">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#86868b] hover:bg-[#e8e8ed] transition-colors"><X size={14}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
};
const Inp = ({label,...p}) => (
  <div>{label&&<label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5">{label}</label>}
  <input className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all" {...p}/></div>
);
const Sel = ({label,children,...p}) => (
  <div>{label&&<label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5">{label}</label>}
  <select className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all appearance-none" {...p}>{children}</select></div>
);
const Txta = ({label,...p}) => (
  <div>{label&&<label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5">{label}</label>}
  <textarea className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 resize-none transition-all" rows={3} {...p}/></div>
);
const BTN_V={primary:'bg-[#1d1d1f] text-white hover:bg-[#3a3a3c] disabled:opacity-40',secondary:'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]',danger:'bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30]/20',success:'bg-[#34c759] text-white hover:bg-[#2db84d]',ghost:'text-[#0071e3] hover:bg-[#0071e3]/10'};
const BTN_S={sm:'px-3.5 py-1.5 text-xs',md:'px-4 py-2 text-sm',lg:'px-5 py-2.5 text-sm'};
const Btn = ({children,onClick,variant='primary',size='md',cls='',disabled=false,type='button'}) =>
  <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-150 active:scale-95 hover:scale-[1.03] ${BTN_V[variant]} ${BTN_S[size]} ${cls}`}>{children}</button>;
const Notif = ({msg,type,onClose}) => (
  <div className="fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] bg-white border border-[#f5f5f7] animate-slideInRight">
    {type==='success'?<CheckCircle size={15} className="text-[#34c759]"/>:type==='error'?<XCircle size={15} className="text-[#ff3b30]"/>:<AlertCircle size={15} className="text-[#0071e3]"/>}
    <span className="text-sm font-medium text-[#1d1d1f]">{msg}</span>
    <button onClick={onClose} className="ml-1 text-[#86868b] hover:text-[#1d1d1f]"><X size={13}/></button>
  </div>
);
const ICO_C={gray:'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]',blue:'text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/10',red:'text-[#86868b] hover:text-[#ff3b30] hover:bg-[#ff3b30]/10'};
const IcoBtn = ({onClick,icon:Ic,color='gray'}) =>
  <button onClick={onClick} className={`p-1.5 rounded-lg transition-all duration-150 hover:scale-110 active:scale-95 ${ICO_C[color]}`}><Ic size={13}/></button>;
const NAV = [
  {id:'dashboard',label:'Dashboard',icon:LayoutDashboard},{id:'parco',label:'Parco Auto',icon:Car},
  {id:'vendite',label:'Vendite',icon:TrendingUp},{id:'spese',label:'Spese',icon:ShoppingBag},
  {id:'iva',label:'Gestione IVA',icon:Receipt},{id:'f24',label:'F24 & Tasse',icon:FileText},
  {id:'mandati',label:'Mandati Pagamento',icon:CreditCard},{id:'bilancio',label:'Bilancio',icon:BarChart2},
  {id:'impostazioni',label:'Impostazioni',icon:Settings},
];
/* ── LoginScreen ──────────────────────────────────────────────────── */
const LoginScreen = ({onLogin,dark,toggleDark}) => {
  const [user,setUser]=useState('');
  const [pass,setPass]=useState('');
  const [err,setErr]=useState('');
  const [showPass,setShowPass]=useState(false);
  const [loading,setLoading]=useState(false);
  const submit=e=>{
    e.preventDefault();
    setLoading(true);
    setTimeout(()=>{
      const stored=JSON.parse(localStorage.getItem(SK.auth)||'null')||DEFAULT_AUTH;
      if(user===stored.username&&pass===stored.password){
        sessionStorage.setItem('cd:session','1');
        onLogin();
      } else {
        setErr('Credenziali non corrette. Riprova.');
        setPass('');
      }
      setLoading(false);
    },400);
  };
  return(
    <div className={`flex h-screen items-center justify-center relative pm-glass-bg${dark?' pm-dark':''}`} style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif'}}>
      {/* Toggle dark / light */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 glass-pill">
        <button className={`glass-btn${!dark?' glass-active':''}`} onClick={()=>dark&&toggleDark()} title="Modalità chiara" style={{width:30,height:30,flexShrink:0}}>
          <Sun size={14}/>
        </button>
        <button className={`glass-btn${dark?' glass-active':''}`} onClick={()=>!dark&&toggleDark()} title="Modalità scura" style={{width:30,height:30,flexShrink:0}}>
          <Moon size={14}/>
        </button>
      </div>
      <div className="w-full max-w-sm animate-scaleIn">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-16 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm flex items-center justify-center">
            <img src="/logo.png" alt="Skyline Motors" className="w-full h-full object-cover object-center"
              onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}
            />
            <div className="w-full h-full hidden items-center justify-center"><Car size={28} className="text-[#86868b]"/></div>
          </div>
          <h1 className="text-xl font-semibold tracking-tight" style={{color:dark?'#f5f5f7':'#1d1d1f'}}>Skyline Motors</h1>
          <p className="text-sm text-[#86868b] mt-0.5" style={{fontFamily:'Georgia,serif',fontStyle:'italic'}}>Gestionale interno</p>
        </div>
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_4px_32px_rgba(0,0,0,0.10)] px-8 py-8">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5">Utente</label>
              <input
                className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-3 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all"
                placeholder="Nome utente" value={user} onChange={e=>{setUser(e.target.value);setErr('');}} autoFocus autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass?'text':'password'}
                  className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-3 pr-10 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all"
                  placeholder="Password" value={pass} onChange={e=>{setPass(e.target.value);setErr('');}} autoComplete="current-password"
                />
                <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] transition-colors">
                  <Eye size={15}/>
                </button>
              </div>
            </div>
            {err&&<div className="flex items-center gap-2 bg-[#ff3b30]/10 text-[#cc2900] text-xs font-medium rounded-xl px-3.5 py-2.5"><AlertTriangle size={13}/>{err}</div>}
            <button type="submit" disabled={!user||!pass||loading}
              className="w-full bg-[#1d1d1f] text-white rounded-full py-3 text-sm font-semibold mt-2 transition-all duration-150 hover:bg-[#3a3a3c] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2">
              {loading?<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<><Check size={14}/>Accedi</>}
            </button>
          </form>
        </div>
        <p className="text-center text-[11px] text-[#86868b] mt-6">Accesso riservato al personale autorizzato</p>
      </div>
    </div>
  );
};

const Sidebar = ({active,onNav,s,onLogout,open,onClose}) => (
  <>
    <div className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${open?'opacity-100':'opacity-0 pointer-events-none'}`} onClick={onClose}/>
    <div className={`w-56 glass-sidebar flex flex-col flex-shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:h-full ${open?'translate-x-0':'-translate-x-full'}`}>
    <div className="px-5 pt-5 pb-4 border-b border-[#f0f0f0] flex flex-col items-center gap-2">
      <button onClick={()=>onNav('dashboard')} className="w-full focus:outline-none group">
        <div className="w-full h-14 overflow-hidden rounded-2xl bg-[#f5f5f7] transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02] group-active:scale-[0.97]">
          <img src="/logo.png" alt="Skyline Motors" className="w-full h-full object-cover object-center"
            onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}
          />
          <div className="w-full h-full hidden items-center justify-center">
            <Car size={20} className="text-[#86868b]"/>
          </div>
        </div>
      </button>
      <div className="text-center">
        <span className="text-[12.5px] text-[#86868b]" style={{fontFamily:'Georgia,"Times New Roman",serif',fontStyle:'italic',letterSpacing:'0.02em'}}>Skyline Motors</span>
      </div>
    </div>
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {NAV.map(({id,label,icon:Ic})=>(
        <button key={id} onClick={()=>onNav(id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium active:scale-[0.98] glass-nav-btn ${active===id?'glass-nav-btn-active':'text-[#1d1d1f] hover:translate-x-0.5'}`}>
          <Ic size={14} className="flex-shrink-0"/>{label}
        </button>))}
    </nav>
    <div className="px-3 py-3 border-t border-[#f5f5f7] flex items-center justify-between">
      <span className="text-[#86868b] text-[11px] pl-2">v2.0 • {new Date().getFullYear()}</span>
      <button onClick={onLogout} className="flex items-center gap-1.5 text-[11px] text-[#86868b] hover:text-[#ff3b30] px-2.5 py-1.5 rounded-lg hover:bg-[#ff3b30]/10 transition-all duration-150 font-medium">
        <X size={11}/>Esci
      </button>
    </div>
  </div>
  </>
);
const Dashboard = ({cars,sales,expenses,f24,onNav,cassaMovimenti,settings}) => {
  const yr=new Date().getFullYear(),mo=new Date().getMonth();
  const fondoIniziale=settings?.fondoCassaIniziale??200000;
  const saldoCassa=fondoIniziale+(cassaMovimenti||[]).filter(m=>m.tipo==='entrata').reduce((a,m)=>a+m.importo,0)-(cassaMovimenti||[]).filter(m=>m.tipo==='uscita').reduce((a,m)=>a+m.importo,0);
  const {fat,mn,sp,iva,ivaGiaPagata,disp,scad,chart,pieD,rec,smLen}=useMemo(()=>{
    const oggi=new Date();
    const sm=sales.filter(s=>{const d=new Date(s.data_vendita);return d.getFullYear()===yr&&d.getMonth()===mo;});
    const em=expenses.filter(e=>{const d=new Date(e.data);return d.getFullYear()===yr&&d.getMonth()===mo;});
    const fat=sm.reduce((a,v)=>a+v.prezzo_vendita,0),mn=sm.reduce((a,v)=>a+margN(v.prezzo_vendita,v.prezzo_acquisto),0);
    const sp=em.reduce((a,e)=>a+e.importo,0);
    const totIvaAnno=sales.filter(s=>new Date(s.data_vendita).getFullYear()===yr).reduce((a,v)=>a+ivaM(v.prezzo_vendita,v.prezzo_acquisto),0);
    const ivaGiaPagata=f24.filter(r=>r.stato==='pagato'&&r.anno===yr&&DASH_IVA_CODES.includes(r.codice_tributo)).reduce((a,r)=>a+r.importo,0);
    const iva=Math.max(0,totIvaAnno-ivaGiaPagata);
    const disp=cars.filter(c=>c.stato==='disponibile').length;
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
    return {fat,mn,sp,iva,ivaGiaPagata,disp,scad,chart,pieD,rec,smLen:sm.length};
  },[sales,expenses,f24,cars,yr,mo]);
  return (
    <div className="space-y-5 animate-fadeUp">
      <div><h1 className="text-xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">Dashboard</h1><p className="text-[#86868b] text-sm mt-1">{MESI_FULL[mo]} {yr}</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
        <KPI icon={Euro} label="Fatturato del mese" value={fmt(fat)} color="celeste"/>
        <KPI icon={TrendingUp} label="Margine Netto" value={fmt(mn)} color="green"/>
        <KPI icon={ShoppingBag} label="Spese operative" value={fmt(sp)} color="amber"/>
        <KPI icon={BarChart2} label="Utile operativo" value={fmt(mn-sp)} color={mn-sp>=0?'blue':'red'}/>
        <KPI icon={Banknote} label="Saldo Cassa" value={fmt(saldoCassa)} color={saldoCassa>=0?'celeste':'red'} sub="Fondo disponibile"/>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Car} label="Auto disponibili" value={disp} color="purple" sub={`${cars.length} totali in parco`}/>
        <KPI icon={TrendingUp} label="Vendite mese" value={smLen} color="green" sub="Veicoli venduti"/>
        <KPI icon={Receipt} label="IVA da versare" value={fmt(iva)} color="amber" sub={`Anno ${yr} — pagata: ${fmt(ivaGiaPagata)}`}/>
        <KPI icon={FileText} label="F24 in scadenza" value={scad.length} color={scad.length>0?'red':'green'} sub="Prossimi 30 giorni"/>
      </div>
      {scad.length>0&&<div className="bg-[#ff9500]/8 border border-[#ff9500]/20 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle size={15} className="text-[#ff9500] mt-0.5 flex-shrink-0"/>
        <div className="flex-1"><p className="text-sm font-semibold text-[#7a4700]">{scad.length} F24 in scadenza nei prossimi 30 giorni</p>
          <p className="text-xs text-[#7a4700]/70 mt-1">{scad.map(f=>`${f.codice_tributo} — ${fmtD(f.scadenza)} — ${fmt(f.importo)}`).join(' • ')}</p></div>
        <Btn variant="ghost" size="sm" onClick={()=>onNav('f24')}>Gestisci <ChevronRight size={11}/></Btn>
      </div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card cls="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Andamento Ultimi 6 Mesi</h3>
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
          <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">Spese per Categoria</h3>
          {pieD.length>0
            ?<ResponsiveContainer width="100%" height={210}>
              <RPieChart><Pie data={pieD} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({percent})=>`${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieD.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Pie><Tooltip formatter={v=>fmt(v)} contentStyle={{borderRadius:'8px',fontSize:'12px'}}/></RPieChart>
            </ResponsiveContainer>
            :<div className="flex items-center justify-center h-48 text-[#86868b] text-sm">Nessuna spesa</div>}
        </Card>
      </div>
      <Card>
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-sm font-semibold">Ultime Vendite</h3>
          <Btn variant="ghost" size="sm" onClick={()=>onNav('vendite')}>Vedi tutte <ChevronRight size={11}/></Btn>
        </div>
        {rec.length===0?<div className="px-5 py-8 text-center text-[#86868b] text-sm">Nessuna vendita ancora registrata</div>
          :rec.map(s=>(
          <div key={s.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#0071e3]/10 rounded-xl flex items-center justify-center"><Car size={13} className="text-[#0071e3]"/></div>
              <div><p className="text-sm font-medium text-[#1d1d1f]">{s.marca} {s.modello} — <span className="font-mono">{s.targa}</span></p>
                <p className="text-xs text-[#86868b]">{fmtD(s.data_vendita)} • {s.cliente}</p></div>
            </div>
            <div className="text-right"><p className="text-sm font-bold text-[#1d1d1f]">{fmt(s.prezzo_vendita)}</p>
              <p className="text-xs text-green-600">Margine: {fmt(margN(s.prezzo_vendita,s.prezzo_acquisto))}</p></div>
          </div>))}
      </Card>
    </div>
  );
};
const STATI_C={disponibile:{l:'Disponibile',c:'green'},venduto:{l:'Venduto',c:'gray'},in_preparazione:{l:'In preparazione',c:'amber'}};
const emptyC=()=>({id:'',targa:'',marca:'',modello:'',anno:new Date().getFullYear(),km:0,colore:'',carburante:'Benzina',cambio:'Manuale',prezzo_acquisto:0,data_acquisto:today(),fornitore:'',note:'',stato:'disponibile',mandato_id:''});

/* ── BrandModelPicker ─────────────────────────────────────────────── */
const BrandModelPicker=({marca,modello,onChange})=>{
  const isAltroMarca=marca&&!BRANDS_MODELS[marca];
  const brandVal=isAltroMarca?ALTRO:marca||'';
  const models=marca&&BRANDS_MODELS[marca]?BRANDS_MODELS[marca]:[];
  const isAltroModello=modello&&models.length>0&&!models.includes(modello);
  const modelloVal=isAltroModello?ALTRO:modello||'';
  const handleBrand=e=>{const v=e.target.value;if(v===ALTRO){onChange('marca','');onChange('modello','');}else{onChange('marca',v);onChange('modello','');}};
  const handleModello=e=>{const v=e.target.value;if(v===ALTRO)onChange('modello','');else onChange('modello',v);};
  const lbl='block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5';
  const selCls='w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all appearance-none';
  const inpCls='w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all';
  return(
    <>
      <div>
        <label className={lbl}>Marca *</label>
        {brandVal===ALTRO
          ?<input className={inpCls} placeholder="Scrivi la marca..." value={marca} onChange={e=>onChange('marca',e.target.value)} autoFocus/>
          :<select className={selCls} value={brandVal} onChange={handleBrand}>
              <option value="">— Seleziona marca —</option>
              {BRAND_LIST.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
        }
      </div>
      <div>
        <label className={lbl}>Modello *</label>
        {(!marca||brandVal===ALTRO||isAltroModello)
          ?<input className={inpCls} placeholder="Scrivi il modello..." value={modello} onChange={e=>onChange('modello',e.target.value)}/>
          :<select className={selCls} value={modelloVal} onChange={handleModello}>
              <option value="">— Seleziona modello —</option>
              {models.map(m=><option key={m} value={m}>{m}</option>)}
              <option value={ALTRO}>Altro (scrivi)...</option>
            </select>
        }
      </div>
    </>
  );
};

const ParcoAuto=({cars,onAdd,onEdit,onDel,mandati})=>{
  const [q,setQ]=useState(''),[fs,setFs]=useState('tutti'),[show,setShow]=useState(false),[form,setForm]=useState(emptyC()),[eid,setEid]=useState(null);
  const filt=cars.filter(c=>{const s=q.toLowerCase();return(!q||c.targa?.toLowerCase().includes(s)||c.marca?.toLowerCase().includes(s)||c.modello?.toLowerCase().includes(s))&&(fs==='tutti'||c.stato===fs);});
  const openAdd=()=>{setForm(emptyC());setEid(null);setShow(true);};
  const openEdit=c=>{setForm({...c});setEid(c.id);setShow(true);};
  const save=()=>{if(!form.targa||!form.marca||!form.modello)return;const v={...form,id:eid||uid()};eid?onEdit(v):onAdd(v);setShow(false);};
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between animate-fadeUp">
        <div><h1 className="text-xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">Parco Auto</h1><p className="text-sm text-[#86868b] mt-1">{cars.filter(c=>c.stato==='disponibile').length} disponibili • {cars.length} totali</p></div>
        <Btn onClick={openAdd}><Plus size={13}/>Aggiungi Veicolo</Btn>
      </div>
      <Card>
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="relative flex-1"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cerca targa, marca, modello..." className="w-full pl-8 pr-3 py-2 text-sm bg-[#f5f5f7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 text-[#1d1d1f] placeholder-[#86868b]"/></div>
          <Sel value={fs} onChange={e=>setFs(e.target.value)}>
            <option value="tutti">Tutti gli stati</option>
            {Object.entries(STATI_C).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}
          </Sel>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#f5f5f7] text-[#86868b] text-xs">{['Targa','Veicolo','Anno','Km','Carburante','P.Acquisto','Data Acq.','Fornitore','Mandato','Stato','Azioni'].map(h=><th key={h} className="px-3 py-3 text-left font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {filt.length===0&&<tr><td colSpan={11} className="px-4 py-10 text-center text-[#86868b]">Nessun veicolo trovato</td></tr>}
              {filt.map(c=>(
                <tr key={c.id} className="hover:bg-[#f5f5f7]/60 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-[#1d1d1f]">{c.targa}</td>
                  <td className="px-3 py-2.5"><div className="font-medium text-[#1d1d1f]">{c.marca} {c.modello}</div><div className="text-xs text-[#86868b]">{c.colore} • {c.cambio}</div></td>
                  <td className="px-3 py-2.5">{c.anno}</td><td className="px-3 py-2.5">{fmtN(c.km)} km</td>
                  <td className="px-3 py-2.5">{c.carburante}</td><td className="px-3 py-2.5 font-medium">{fmt(c.prezzo_acquisto)}</td>
                  <td className="px-3 py-2.5 text-[#86868b]">{fmtD(c.data_acquisto)}</td><td className="px-3 py-2.5 text-[#3a3a3c]">{c.fornitore||'—'}</td>
                  <td className="px-3 py-2.5">{c.mandato_id?<span className="px-1.5 py-0.5 rounded text-xs font-bold bg-[#5ac8fa]/15 text-[#0071e3]">{(mandati||[]).find(m=>m.id===c.mandato_id)?.numero||'Collegato'}</span>:<span className="text-[#86868b] text-xs">—</span>}</td>
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
          <BrandModelPicker marca={form.marca} modello={form.modello} onChange={(k,v)=>f(k,v)}/>
          <Inp label="Anno" type="number" value={form.anno} onChange={e=>f('anno',+e.target.value)}/>
          <Inp label="Chilometri" type="number" value={form.km} onChange={e=>f('km',+e.target.value)}/>
          <Inp label="Colore" value={form.colore} onChange={e=>f('colore',e.target.value)}/>
          <Sel label="Carburante" value={form.carburante} onChange={e=>f('carburante',e.target.value)}>{['Benzina','Diesel','Ibrido','Elettrico','GPL','Metano'].map(v=><option key={v}>{v}</option>)}</Sel>
          <Sel label="Cambio" value={form.cambio} onChange={e=>f('cambio',e.target.value)}>{['Manuale','Automatico','Semiautomatico'].map(v=><option key={v}>{v}</option>)}</Sel>
          <Sel label="Stato" value={form.stato} onChange={e=>f('stato',e.target.value)}>{Object.entries(STATI_C).map(([k,v])=><option key={k} value={k}>{v.l}</option>)}</Sel>
          <Inp label="Prezzo Acquisto (€)" type="number" step="0.01" value={form.prezzo_acquisto} onChange={e=>f('prezzo_acquisto',+e.target.value)}/>
          <Inp label="Data Acquisto" type="date" value={form.data_acquisto} onChange={e=>f('data_acquisto',e.target.value)}/>
          <Inp label="Fornitore" value={form.fornitore} onChange={e=>f('fornitore',e.target.value)}/>
          <div className="col-span-3">
            <Sel label="Collega Mandato di Pagamento (opzionale)" value={form.mandato_id} onChange={e=>f('mandato_id',e.target.value)}>
              <option value="">— Nessun mandato collegato —</option>
              {(mandati||[]).filter(m=>(!m.veicolo_id||m.id===form.mandato_id)&&m.stato!=='annullato').map(m=>(
                <option key={m.id} value={m.id}>{m.numero} — {m.beneficiario} — {fmt(m.importo)} ({fmtD(m.data)})</option>
              ))}
            </Sel>
            {form.mandato_id&&<p className="text-xs text-[#5ac8fa] mt-1">✓ Il veicolo sarà collegato a questo mandato di pagamento</p>}
          </div>
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
        <div><h1 className="text-xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">Vendite</h1><p className="text-sm text-[#86868b] mt-1">{sales.length} vendite registrate</p></div>
        <Btn onClick={openAdd}><Plus size={13}/>Registra Vendita</Btn>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Euro} label="Fatturato" value={fmt(totFat)} color="celeste"/>
        <KPI icon={TrendingUp} label="Margine Lordo" value={fmt(filt.reduce((a,v)=>a+Math.max(0,v.prezzo_vendita-v.prezzo_acquisto),0))} color="green"/>
        <KPI icon={Receipt} label="IVA Regime Margine" value={fmt(totIva)} color="amber"/>
        <KPI icon={BarChart2} label="Margine Netto" value={fmt(totMN)} color="purple"/>
      </div>
      <Card>
        <div className="flex items-center gap-3 p-4 border-b">
          <Sel value={fmo} onChange={e=>setFmo(e.target.value)}><option value="">Tutti i mesi</option>{MESI_FULL.map((m,i)=><option key={i} value={i}>{m}</option>)}</Sel>
          <Sel value={fyr} onChange={e=>setFyr(+e.target.value)}>{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</Sel>
          <span className="text-sm text-[#86868b] ml-auto">{filt.length} risultati</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#f5f5f7] text-[#86868b] text-xs">{['Targa','Veicolo','Data','Cliente','P.Acquisto','P.Vendita','Marg.Lordo','IVA Margine','Marg.Netto','Pagamento','Azioni'].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {filt.length===0&&<tr><td colSpan={11} className="px-4 py-10 text-center text-[#86868b]">Nessuna vendita trovata</td></tr>}
              {[...filt].sort((a,b)=>new Date(b.data_vendita)-new Date(a.data_vendita)).map(s=>{
                const ml2=Math.max(0,s.prezzo_vendita-s.prezzo_acquisto),iv2=ivaM(s.prezzo_vendita,s.prezzo_acquisto),mn3=margN(s.prezzo_vendita,s.prezzo_acquisto);
                return <tr key={s.id} className="hover:bg-[#f5f5f7]/60">
                  <td className="px-3 py-2.5 font-mono font-bold">{s.targa}</td><td className="px-3 py-2.5 font-medium">{s.marca} {s.modello}</td>
                  <td className="px-3 py-2.5 text-[#86868b]">{fmtD(s.data_vendita)}</td><td className="px-3 py-2.5">{s.cliente}<div className="text-xs text-[#86868b]">{s.cf_cliente}</div></td>
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
        {form.prezzo_vendita>0&&<div className="mt-4 bg-[#f5f5f7] rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
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
      <div className="flex items-center justify-between"><h1 className="text-xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">Spese Operative</h1><Btn onClick={openAdd}><Plus size={13}/>Aggiungi Spesa</Btn></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI icon={Euro} label="Totale Spese" value={fmt(tot)} color="celeste"/>
        <KPI icon={ShoppingBag} label="Voci di spesa" value={filt.length} color="amber"/>
        <KPI icon={BarChart2} label="Media per voce" value={fmt(filt.length?tot/filt.length:0)} color="blue"/>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card cls="p-5">
          <h3 className="text-sm font-semibold mb-3">Per Categoria</h3>
          <div className="space-y-2.5">
            {Object.entries(catM).sort((a,b)=>b[1]-a[1]).map(([cat,val])=>(
              <div key={cat}><div className="flex justify-between text-xs text-[#3a3a3c] mb-0.5"><span className="truncate">{cat}</span><span className="font-medium ml-2 flex-shrink-0">{fmt(val)}</span></div>
              <div className="h-1.5 bg-[#f5f5f7] rounded-full"><div className="h-full bg-[#0071e3] rounded-full" style={{width:`${tot?(val/tot*100):0}%`}}/></div></div>))}
            {Object.keys(catM).length===0&&<p className="text-sm text-[#86868b] text-center py-4">Nessuna spesa</p>}
          </div>
        </Card>
        <Card cls="col-span-2">
          <div className="flex items-center gap-3 p-4 border-b">
            <Sel value={fmo} onChange={e=>setFmo(e.target.value)}><option value="">Tutti i mesi</option>{MESI_FULL.map((m,i)=><option key={i} value={i}>{m}</option>)}</Sel>
            <Sel value={fyr} onChange={e=>setFyr(+e.target.value)}>{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</Sel>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#f5f5f7] text-[#86868b] text-xs">{['Categoria','Descrizione','Data','Importo','Ricorrente','Azioni'].map(h=><th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {filt.length===0&&<tr><td colSpan={6} className="px-4 py-10 text-center text-[#86868b]">Nessuna spesa</td></tr>}
                {[...filt].sort((a,b)=>new Date(b.data)-new Date(a.data)).map(e=>(
                  <tr key={e.id} className="hover:bg-[#f5f5f7]/60">
                    <td className="px-4 py-2.5"><Badge c="blue">{e.categoria}</Badge></td>
                    <td className="px-4 py-2.5 font-medium">{e.descrizione}</td>
                    <td className="px-4 py-2.5 text-[#86868b]">{fmtD(e.data)}</td>
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
          <div className="flex items-center gap-2 mt-5"><input type="checkbox" id="ric" checked={form.ricorrente} onChange={e=>f('ricorrente',e.target.checked)} className="w-4 h-4 rounded"/><label htmlFor="ric" className="text-sm font-medium text-[#1d1d1f]">Spesa ricorrente</label></div>
          <div className="col-span-2"><Txta label="Note" value={form.note} onChange={e=>f('note',e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-2 mt-5"><Btn variant="secondary" onClick={()=>setShow(false)}>Annulla</Btn><Btn onClick={save}><Check size={13}/>Salva</Btn></div>
      </Modal>
    </div>
  );
};
const IVA_CODES_TRIM_MAP={Q1:'6031',Q2:'6032',Q3:'6033',Q4:'6099'};
const IVA_CODES_MENS_ARR=Array.from({length:12},(_,i)=>`600${i<9?'0':''}${i+1}`);
const IVA_ALL_CODES=[...Object.values(IVA_CODES_TRIM_MAP),...IVA_CODES_MENS_ARR,'1668'];
const IVA_QQ=[
  {id:'Q1',label:'I Trimestre — Gennaio · Febbraio · Marzo',mesi:[0,1,2],scad:'16 maggio'},
  {id:'Q2',label:'II Trimestre — Aprile · Maggio · Giugno',mesi:[3,4,5],scad:'20 agosto'},
  {id:'Q3',label:'III Trimestre — Luglio · Agosto · Settembre',mesi:[6,7,8],scad:'16 novembre'},
  {id:'Q4',label:'IV Trimestre — Ottobre · Novembre · Dicembre',mesi:[9,10,11],scad:'16 marzo anno seg.'},
];
const DASH_IVA_CODES=['6031','6032','6033','6099','1668',...IVA_CODES_MENS_ARR];
const GestioneIVA=({sales,settings,f24})=>{
  const [anno,setAnno]=useState(new Date().getFullYear());
  const bySales=useCallback(ms=>sales.filter(s=>{const d=new Date(s.data_vendita);return d.getFullYear()===anno&&ms.includes(d.getMonth());}),[sales,anno]);
  const f24PagatoByCode=useCallback(codice=>f24.filter(r=>r.stato==='pagato'&&r.anno===anno&&r.codice_tributo===codice).reduce((a,r)=>a+r.importo,0),[f24,anno]);
  const f24PagatoByMese=useCallback(mese=>f24.filter(r=>r.stato==='pagato'&&r.anno===anno&&r.codice_tributo===IVA_CODES_MENS_ARR[mese]).reduce((a,r)=>a+r.importo,0),[f24,anno]);
  const {totF,totA,totML,totIva,totMN,totIvaPagata,totIvaResidua}=useMemo(()=>{
    const aS=sales.filter(s=>new Date(s.data_vendita).getFullYear()===anno);
    const totF=aS.reduce((a,v)=>a+v.prezzo_vendita,0),totA=aS.reduce((a,v)=>a+v.prezzo_acquisto,0);
    const totML=Math.max(0,totF-totA),totIva=+(totML*22/122).toFixed(2),totMN=+(totML-totIva).toFixed(2);
    const totIvaPagata=f24.filter(r=>r.stato==='pagato'&&r.anno===anno&&IVA_ALL_CODES.includes(r.codice_tributo)).reduce((a,r)=>a+r.importo,0);
    return {totF,totA,totML,totIva,totMN,totIvaPagata,totIvaResidua:Math.max(0,totIva-totIvaPagata)};
  },[sales,f24,anno]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">Gestione IVA</h1><p className="text-sm text-[#86868b] mt-1">Regime del Margine — art. 36 D.L. 41/1995</p></div>
        <Sel value={anno} onChange={e=>setAnno(+e.target.value)}>{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</Sel>
      </div>
      <div className="bg-[#0071e3]/6 border border-[#0071e3]/15 rounded-2xl p-4 flex items-start gap-3">
        <Info size={15} className="text-[#0071e3] mt-0.5 flex-shrink-0"/>
        <p className="text-sm text-[#1d1d1f]">Nel <strong>Regime del Margine</strong> l'IVA si calcola sul margine: <code className="bg-[#0071e3]/10 px-1.5 py-0.5 rounded-md text-[#0071e3] text-xs">IVA = (P.Vendita − P.Acquisto) × 22 ÷ 122</code>. Liquidazione: {settings.liquidazioneIva}.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPI icon={Euro} label="Fatturato Anno" value={fmt(totF)} color="celeste"/>
        <KPI icon={TrendingUp} label="Margine Lordo" value={fmt(totML)} color="green"/>
        <KPI icon={Receipt} label="IVA Maturata" value={fmt(totIva)} color="amber" sub="Totale anno"/>
        <KPI icon={CheckCircle} label="IVA Già Pagata" value={fmt(totIvaPagata)} color="green" sub="Via F24"/>
        <KPI icon={AlertCircle} label="IVA Residua" value={fmt(totIvaResidua)} color={totIvaResidua>0?'red':'green'} sub={totIvaResidua===0?'Tutto versato':'Da versare'}/>
      </div>
      <div className="space-y-3">
        {IVA_QQ.map(q=>{
          const qs=bySales(q.mesi),fat=qs.reduce((a,v)=>a+v.prezzo_vendita,0),acq=qs.reduce((a,v)=>a+v.prezzo_acquisto,0);
          const ml=Math.max(0,fat-acq),iv=+(ml*22/122).toFixed(2),mn2=+(ml-iv).toFixed(2);
          const ivaCodice=IVA_CODES_TRIM_MAP[q.id];
          const ivaPag=settings.liquidazioneIva==='mensile'
            ?q.mesi.reduce((a,m)=>a+f24PagatoByMese(m),0)
            :f24PagatoByCode(ivaCodice);
          const ivaRes=Math.max(0,iv-ivaPag);
          const f24Rel=f24.filter(r=>r.anno===anno&&(settings.liquidazioneIva==='mensile'?q.mesi.map(m=>IVA_CODES_MENS_ARR[m]).includes(r.codice_tributo):r.codice_tributo===ivaCodice));
          return <Card key={q.id} cls="p-5">
            <div className="flex items-start justify-between mb-4">
              <div><h3 className="font-semibold text-[#1d1d1f]">{q.label}</h3><p className="text-xs text-[#86868b] mt-0.5">Scadenza: <span className="font-medium text-red-600">{q.scad}</span> • Codice F24: <span className="font-mono font-bold">{ivaCodice}</span></p></div>
              <div className="flex gap-2">
                {ivaPag>0&&<Badge c="green">Pagata: {fmt(ivaPag)}</Badge>}
                <Badge c={ivaRes>0?'amber':'green'}>{ivaRes>0?`Residua: ${fmt(ivaRes)}`:'Versata ✓'}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {[['Vendite',qs.length,'gray',false],['Fatturato',fat,'blue',true],['P.Acquisto',acq,'gray',true],['IVA Maturata',iv,'amber',true],['IVA Pagata',ivaPag,'green',true],['IVA Residua',ivaRes,ivaRes>0?'red':'green',true]].map(([l,v,c,curr])=>(
                <div key={l} className={`bg-[#f5f5f7] rounded-xl p-3 text-center`}><div className={`text-xs text-${c}-600 font-medium mb-1`}>{l}</div><div className={`font-bold text-${c}-800 text-sm`}>{curr?fmt(v):v}</div></div>))}
            </div>
            {f24Rel.length>0&&<div className="bg-[#f5f5f7] rounded-xl p-3 mb-3"><p className="text-xs font-semibold text-[#1d1d1f] mb-2">F24 collegati a questo trimestre:</p><div className="space-y-1">{f24Rel.map(r=><div key={r.id} className="flex items-center justify-between text-xs"><span className="font-mono text-[#86868b]">{r.codice_tributo}</span><span className="text-[#3a3a3c] truncate mx-2">{r.descrizione||r.codice_tributo}</span><span className="font-bold">{fmt(r.importo)}</span><Badge c={r.stato==='pagato'?'green':'amber'}>{r.stato==='pagato'?'Pagato':'Da pagare'}</Badge></div>)}</div></div>}
            {qs.length>0&&<div className="overflow-x-auto border-t pt-3"><table className="w-full text-xs">
              <thead><tr className="text-[#86868b]"><th className="py-1 text-left">Veicolo</th><th className="py-1 text-right">P.Vendita</th><th className="py-1 text-right">P.Acquisto</th><th className="py-1 text-right">Margine</th><th className="py-1 text-right">IVA</th></tr></thead>
              <tbody>{qs.map(s=>{const m=Math.max(0,s.prezzo_vendita-s.prezzo_acquisto),iv2=ivaM(s.prezzo_vendita,s.prezzo_acquisto);
                return <tr key={s.id} className="border-t border-[#f0f0f0]"><td className="py-1">{s.targa} — {s.marca} {s.modello}</td><td className="py-1 text-right">{fmt(s.prezzo_vendita)}</td><td className="py-1 text-right">{fmt(s.prezzo_acquisto)}</td><td className="py-1 text-right text-blue-600">{fmt(m)}</td><td className="py-1 text-right text-amber-600">{fmt(iv2)}</td></tr>;})}</tbody>
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
    <div className="p-4 border-b border-[#f0f0f0] bg-gray-50">
      <div className="text-xs font-bold text-[#86868b] uppercase mb-2">Dati Anagrafici del Contribuente</div>
      <div className="grid grid-cols-2 gap-4">
        <div><div className="text-[#86868b] text-xs">Ragione Sociale</div><div className="font-bold border-b border-gray-400 mt-1 pb-1">{s.ragioneSociale||'________________________________'}</div></div>
        <div><div className="text-[#86868b] text-xs">Codice Fiscale</div><div className="font-bold border-b border-gray-400 mt-1 pb-1 tracking-widest">{s.codiceFiscale||'_________________'}</div></div>
        <div><div className="text-[#86868b] text-xs">Domicilio Fiscale</div><div className="font-bold border-b border-gray-400 mt-1 pb-1">{s.indirizzo}{s.citta?`, ${s.citta}`:''}{s.provincia?` (${s.provincia})`:''}</div></div>
        <div><div className="text-[#86868b] text-xs">Partita IVA</div><div className="font-bold border-b border-gray-400 mt-1 pb-1 tracking-widest">{s.partitaIva||'_________________'}</div></div>
      </div>
    </div>
    <div className="p-4 border-b border-[#f0f0f0]">
      <div className="text-xs font-bold text-[#86868b] uppercase mb-2">Sezione Erario</div>
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
      <div><div className="text-xs font-bold text-[#86868b] uppercase mb-2">Saldo (A − B)</div><div className="border-2 border-blue-800 p-4 text-right rounded"><div className="text-2xl font-bold text-blue-800">{fmt(r.importo)}</div><div className="text-xs text-[#86868b] mt-1">Da versare entro il {fmtD(r.scadenza)}</div></div></div>
      <div><div className="text-xs font-bold text-[#86868b] uppercase mb-2">Firma del Contribuente</div><div className="border-b border-gray-400 mt-8 pb-1"/><div className="text-xs text-[#86868b] text-center mt-1">Data e firma</div></div>
    </div>
    <div className="bg-gray-100 px-4 py-2 text-center text-xs text-[#86868b] border-t">Pagabile presso banche, uffici postali o tramite i servizi telematici dell'Agenzia delle Entrate</div>
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
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">F24 & Tasse</h1><p className="text-sm text-[#86868b] mt-1">Gestione pagamenti tributari</p></div><Btn onClick={openAdd}><Plus size={13}/>Nuovo F24</Btn></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI icon={AlertCircle} label="Da Pagare" value={fmt(dap.reduce((a,r)=>a+r.importo,0))} color="red" sub={`${dap.length} scadenze`}/>
        <KPI icon={CheckCircle} label="Già Pagato" value={fmt(pag.reduce((a,r)=>a+r.importo,0))} color="green" sub={`${pag.length} pagamenti`}/>
        <KPI icon={FileText} label="Totale Anno" value={fmt(f24Records.reduce((a,r)=>a+r.importo,0))} color="celeste"/>
      </div>
      {dap.length>0&&<Card>
        <div className="px-5 py-3 border-b flex items-center gap-2"><AlertCircle size={14} className="text-red-500"/><h3 className="text-sm font-semibold text-red-700">Da Pagare</h3></div>
        {[...dap].sort((a,b)=>new Date(a.scadenza)-new Date(b.scadenza)).map(r=>{
          const diff=Math.ceil((new Date(r.scadenza)-oggi)/86400000);
          return <div key={r.id} className="flex items-center justify-between px-5 py-3 border-b last:border-0">
            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#ff3b30]/10 rounded-xl flex items-center justify-center text-xs font-bold text-[#ff3b30]">{r.codice_tributo}</div>
              <div><p className="text-sm font-semibold text-[#1d1d1f]">{r.descrizione||allT.find(t=>t.codice===r.codice_tributo)?.desc||r.codice_tributo}</p><p className="text-xs text-[#86868b]">Anno {r.anno} — Scadenza {fmtD(r.scadenza)}</p></div></div>
            <div className="flex items-center gap-3"><div className="text-right"><p className="font-bold text-[#1d1d1f]">{fmt(r.importo)}</p><p className={`text-xs font-medium ${diff<=0?'text-red-600':diff<=10?'text-amber-500':'text-[#86868b]'}`}>{diff<0?'SCADUTO':diff===0?'Oggi':diff===1?'Domani':`Fra ${diff} giorni`}</p></div>
              <button onClick={()=>setPrev(r)} className="p-1.5 text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg"><Eye size={13}/></button>
              <button onClick={()=>openEdit(r)} className="p-1.5 text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg"><Edit2 size={13}/></button>
              <Btn size="sm" variant="success" onClick={()=>paid(r.id)}><Check size={12}/>Pagato</Btn>
              <IcoBtn onClick={()=>onDel(r.id)} icon={Trash2} color="red"/></div>
          </div>;})}
      </Card>}
      {pag.length>0&&<Card>
        <div className="px-5 py-3 border-b flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/><h3 className="text-sm font-semibold text-green-700">Pagati</h3></div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="bg-[#f5f5f7] text-[#86868b] text-xs">{['Codice','Descrizione','Anno','Scadenza','Pagato il','Importo',''].map(h=><th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{pag.map(r=><tr key={r.id} className="hover:bg-[#f5f5f7]/60">
            <td className="px-4 py-2.5 font-mono font-bold text-green-700">{r.codice_tributo}</td>
            <td className="px-4 py-2.5">{r.descrizione||allT.find(t=>t.codice===r.codice_tributo)?.desc||'—'}</td>
            <td className="px-4 py-2.5">{r.anno}</td><td className="px-4 py-2.5 text-[#86868b]">{fmtD(r.scadenza)}</td>
            <td className="px-4 py-2.5"><Badge c="green">{fmtD(r.data_pagamento)}</Badge></td>
            <td className="px-4 py-2.5 font-semibold">{fmt(r.importo)}</td>
            <td className="px-4 py-2.5"><div className="flex gap-0.5"><button onClick={()=>setPrev(r)} className="p-1.5 text-[#86868b] hover:text-[#0071e3] hover:bg-[#0071e3]/10 rounded-lg"><Eye size={13}/></button><IcoBtn onClick={()=>onDel(r.id)} icon={Trash2} color="red"/></div></td>
          </tr>)}</tbody>
        </table></div>
      </Card>}
      {f24Records.length===0&&<Card cls="p-12 text-center text-[#86868b] text-sm">Nessun F24 registrato</Card>}
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
      <div className="flex items-center justify-between"><div><h1 className="text-xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">Mandati di Pagamento</h1><p className="text-sm text-[#86868b] mt-1">{mandati.length} mandati totali</p></div><Btn onClick={openAdd}><Plus size={13}/>Nuovo Mandato</Btn></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI icon={Euro} label="Totale Mandati" value={fmt(mandati.filter(m=>m.stato!=='annullato').reduce((a,m)=>a+m.importo,0))} color="celeste"/>
        <KPI icon={Clock} label="Da Eseguire" value={mandati.filter(m=>m.stato==='in_attesa'||m.stato==='approvato').length} color="amber"/>
        <KPI icon={CheckCircle} label="Eseguiti" value={mandati.filter(m=>m.stato==='eseguito').length} color="green"/>
      </div>
      <Card><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="bg-[#f5f5f7] text-[#86868b] text-xs">{['N°','Data','Beneficiario','Causale','Importo','Metodo','Stato','Azioni'].map(h=><th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y">
          {mandati.length===0&&<tr><td colSpan={8} className="px-4 py-10 text-center text-[#86868b]">Nessun mandato registrato</td></tr>}
          {[...mandati].sort((a,b)=>new Date(b.data)-new Date(a.data)).map(m=>(
            <tr key={m.id} className="hover:bg-[#f5f5f7]/60">
              <td className="px-4 py-2.5 font-mono font-bold text-blue-700">{m.numero}</td>
              <td className="px-4 py-2.5 text-[#86868b]">{fmtD(m.data)}</td>
              <td className="px-4 py-2.5 font-medium">{m.beneficiario}</td>
              <td className="px-4 py-2.5 text-[#3a3a3c] max-w-48 truncate">{m.causale}{m.f24_id&&<span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">F24</span>}{m.veicolo_id&&<span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-bold bg-[#5ac8fa]/15 text-[#0071e3]">Veicolo</span>}</td>
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
          <div className="text-center mb-5"><div className="text-xl font-bold tracking-wide uppercase">Mandato di Pagamento</div><div className="text-[#86868b] mt-1">N° {prev.numero} del {fmtD(prev.data)}</div></div>
          <div className="grid grid-cols-2 gap-6 mb-5">
            <div><div className="text-xs uppercase text-[#86868b] font-medium mb-1">Ordinante</div><div className="font-bold">{settings.ragioneSociale||'—'}</div><div className="text-xs text-[#86868b]">{settings.partitaIva}</div></div>
            <div><div className="text-xs uppercase text-[#86868b] font-medium mb-1">Beneficiario</div><div className="font-bold">{prev.beneficiario}</div><div className="text-xs text-[#86868b]">{prev.cf_ben}</div></div>
          </div>
          <div className="border-t pt-4 mb-4"><div className="text-xs uppercase text-[#86868b] font-medium mb-1">Causale</div><div className="font-medium">{prev.causale}</div></div>
          <div className="grid grid-cols-2 gap-6 border-t pt-4 mb-4">
            <div><div className="text-xs uppercase text-[#86868b] font-medium mb-1">Metodo</div><div className="font-bold">{prev.metodo}</div>{prev.iban_ben&&<div className="text-xs font-mono text-[#3a3a3c] mt-1">{prev.iban_ben}</div>}</div>
            <div className="text-right"><div className="text-xs uppercase text-[#86868b] font-medium mb-1">Importo</div><div className="text-2xl font-bold text-blue-800">{fmt(prev.importo)}</div></div>
          </div>
          <div className="border-t pt-4 flex justify-between items-end">
            <div><div className="text-xs text-[#86868b] uppercase font-medium">Stato</div><div className="mt-1 font-bold">{prev.stato==='eseguito'?<span className="text-green-600">✓ ESEGUITO il {fmtD(prev.data_ese)}</span>:<span className="text-amber-600">{STATI_M[prev.stato]?.l?.toUpperCase()}</span>}</div></div>
            <div className="text-center"><div className="border-b border-gray-400 w-44 mb-1 pb-4"/><div className="text-xs text-[#86868b]">Firma autorizzata</div></div>
          </div>
        </div>}
        <div className="flex justify-end gap-2 mt-4"><Btn variant="secondary" onClick={()=>setPrev(null)}>Chiudi</Btn><Btn onClick={()=>window.print()}><Printer size={13}/>Stampa</Btn></div>
      </Modal>
    </div>
  );
};
const FONTE_LABEL={vendita:'Vendita',spesa:'Spesa',mandato:'Mandato',manuale:'Manuale'};
const FONTE_COLOR={vendita:'green',spesa:'amber',mandato:'purple',manuale:'blue'};
const Bilancio=({sales,expenses,f24Records,cassaMovimenti,settings,cassaOps})=>{
  const [anno,setAnno]=useState(new Date().getFullYear());
  const [showMov,setShowMov]=useState(false);
  const [movForm,setMovForm]=useState({tipo:'entrata',data:today(),descrizione:'',importo:0});
  const fondoIniziale=settings?.fondoCassaIniziale??200000;
  const entrateTot=(cassaMovimenti||[]).filter(m=>m.tipo==='entrata').reduce((a,m)=>a+m.importo,0);
  const usciteTot=(cassaMovimenti||[]).filter(m=>m.tipo==='uscita').reduce((a,m)=>a+m.importo,0);
  const saldoAttuale=fondoIniziale+entrateTot-usciteTot;
  const saveMov=()=>{
    if(!movForm.descrizione||!movForm.importo)return;
    cassaOps.add({id:uid(),...movForm,fonte:'manuale',fonte_id:null});
    setShowMov(false);
    setMovForm({tipo:'entrata',data:today(),descrizione:'',importo:0});
  };
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
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">Bilancio</h1></div>
        <Sel value={anno} onChange={e=>setAnno(+e.target.value)}>{[2024,2025,2026].map(y=><option key={y}>{y}</option>)}</Sel>
      </div>

      {/* ── Fondo di Cassa ──────────────────────────────────── */}
      <Card cls="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Banknote size={15} className="text-[#5ac8fa]"/>Fondo di Cassa
          </h3>
          <Btn size="sm" onClick={()=>setShowMov(true)}><Plus size={12}/>Movimento manuale</Btn>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <KPI icon={Banknote} label="Fondo Iniziale" value={fmt(fondoIniziale)} color="blue"/>
          <KPI icon={ArrowUpRight} label="Entrate Totali" value={fmt(entrateTot)} color="green" sub={`${(cassaMovimenti||[]).filter(m=>m.tipo==='entrata').length} movimenti`}/>
          <KPI icon={ArrowDownRight} label="Uscite Totali" value={fmt(usciteTot)} color="amber" sub={`${(cassaMovimenti||[]).filter(m=>m.tipo==='uscita').length} movimenti`}/>
          <KPI icon={Euro} label="Saldo Attuale" value={fmt(saldoAttuale)} color={saldoAttuale>=0?'celeste':'red'} sub={saldoAttuale>=50000?'▲ Buona liquidità':saldoAttuale>=10000?'▲ Sufficiente':'⚠ Bassa liquidità'}/>
        </div>
        {(cassaMovimenti||[]).length>0?(
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#f5f5f7] text-[#86868b] text-xs">
                {['Data','Tipo','Descrizione','Fonte','Importo',''].map(h=><th key={h} className="px-3 py-2.5 text-left font-medium">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y">
                {[...(cassaMovimenti||[])].sort((a,b)=>new Date(b.data)-new Date(a.data)).map(m=>(
                  <tr key={m.id} className="hover:bg-[#f5f5f7]/60">
                    <td className="px-3 py-2.5 text-[#86868b] whitespace-nowrap">{fmtD(m.data)}</td>
                    <td className="px-3 py-2.5">
                      {m.tipo==='entrata'
                        ?<span className="flex items-center gap-1 text-green-600 font-medium text-xs"><ArrowUpRight size={12}/>Entrata</span>
                        :<span className="flex items-center gap-1 text-red-600 font-medium text-xs"><ArrowDownRight size={12}/>Uscita</span>}
                    </td>
                    <td className="px-3 py-2.5 text-[#1d1d1f] max-w-xs truncate">{m.descrizione}</td>
                    <td className="px-3 py-2.5"><Badge c={FONTE_COLOR[m.fonte]||'gray'}>{FONTE_LABEL[m.fonte]||m.fonte}</Badge></td>
                    <td className={`px-3 py-2.5 font-semibold whitespace-nowrap ${m.tipo==='entrata'?'text-green-600':'text-red-600'}`}>
                      {m.tipo==='entrata'?'+':'-'}{fmt(m.importo)}
                    </td>
                    <td className="px-3 py-2.5">
                      {m.fonte==='manuale'&&<IcoBtn onClick={()=>cassaOps.del(m.id)} icon={Trash2} color="red"/>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ):(
          <div className="text-center py-6 text-[#86868b] text-sm border border-dashed border-[#e8e8ed] rounded-xl">
            Nessun movimento registrato. I movimenti vengono creati automaticamente da vendite, spese e mandati eseguiti.
          </div>
        )}
      </Card>

      {/* ── KPI Bilancio annuale ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPI icon={Euro} label="Fatturato" value={fmt(tot.fat)} color="celeste" sub={`${tot.nv} vendite`}/>
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
          <thead><tr className="bg-[#f5f5f7] text-[#86868b] text-xs">{['Mese','N° Vendite','Fatturato','Margine Netto','Spese Op.','Imposte','Utile Netto'].map(h=><th key={h} className="px-4 py-2.5 text-left font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{md.map(m=>(
            <tr key={m.name} className="hover:bg-[#f5f5f7]/60">
              <td className="px-4 py-2.5 font-medium">{m.name}</td><td className="px-4 py-2.5">{m.nv}</td>
              <td className="px-4 py-2.5 text-blue-600">{fmt(m.fat)}</td><td className="px-4 py-2.5 text-green-600">{fmt(m.mn)}</td>
              <td className="px-4 py-2.5 text-amber-600">{fmt(m.sp)}</td><td className="px-4 py-2.5 text-purple-600">{fmt(m.im)}</td>
              <td className={`px-4 py-2.5 font-bold ${m.utile>=0?'text-green-700':'text-red-600'}`}>{fmt(m.utile)}</td>
            </tr>))}</tbody>
          <tfoot><tr className="bg-[#f5f5f7] font-bold border-t-2 border-[#e8e8ed]">
            <td className="px-4 py-2.5">TOTALE {anno}</td><td className="px-4 py-2.5">{tot.nv}</td>
            <td className="px-4 py-2.5 text-blue-700">{fmt(tot.fat)}</td><td className="px-4 py-2.5 text-green-700">{fmt(tot.mn)}</td>
            <td className="px-4 py-2.5 text-amber-700">{fmt(tot.sp)}</td><td className="px-4 py-2.5 text-purple-700">{fmt(tot.im)}</td>
            <td className={`px-4 py-2.5 ${tot.utile>=0?'text-green-700':'text-red-600'}`}>{fmt(tot.utile)}</td>
          </tr></tfoot>
        </table></div>
      </Card>

      {/* ── Modal Movimento Manuale ──────────────────────────── */}
      <Modal open={showMov} onClose={()=>setShowMov(false)} title="Nuovo Movimento Manuale">
        <div className="grid grid-cols-2 gap-4">
          <Sel label="Tipo Movimento" value={movForm.tipo} onChange={e=>setMovForm(p=>({...p,tipo:e.target.value}))}>
            <option value="entrata">Entrata (aumenta la cassa)</option>
            <option value="uscita">Uscita (riduce la cassa)</option>
          </Sel>
          <Inp label="Data" type="date" value={movForm.data} onChange={e=>setMovForm(p=>({...p,data:e.target.value}))}/>
          <div className="col-span-2"><Inp label="Descrizione *" value={movForm.descrizione} onChange={e=>setMovForm(p=>({...p,descrizione:e.target.value}))} placeholder="Es. Iniezione capitale, Prelievo titolare, Rimborso..."/></div>
          <Inp label="Importo (€) *" type="number" step="0.01" value={movForm.importo} onChange={e=>setMovForm(p=>({...p,importo:+e.target.value}))}/>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="secondary" onClick={()=>setShowMov(false)}>Annulla</Btn>
          <Btn onClick={saveMov}><Check size={13}/>Registra Movimento</Btn>
        </div>
      </Modal>
    </div>
  );
};
const Impostazioni=({settings,onSave})=>{
  const [form,setForm]=useState(settings),[ok,setOk]=useState(false);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  const save=()=>{onSave(form);setOk(true);setTimeout(()=>setOk(false),2500);};
  const stored=JSON.parse(localStorage.getItem(SK.auth)||'null')||DEFAULT_AUTH;
  const [authForm,setAuthForm]=useState({username:stored.username,password:'',passwordNew:'',passwordConf:''});
  const [authMsg,setAuthMsg]=useState(null);
  const saveAuth=()=>{
    if(!authForm.password){setAuthMsg({t:'err',m:'Inserisci la password attuale.'});return;}
    if(authForm.password!==stored.password){setAuthMsg({t:'err',m:'Password attuale non corretta.'});return;}
    if(authForm.passwordNew.length<6){setAuthMsg({t:'err',m:'La nuova password deve avere almeno 6 caratteri.'});return;}
    if(authForm.passwordNew!==authForm.passwordConf){setAuthMsg({t:'err',m:'Le nuove password non coincidono.'});return;}
    localStorage.setItem(SK.auth,JSON.stringify({username:authForm.username||stored.username,password:authForm.passwordNew}));
    setAuthMsg({t:'ok',m:'Credenziali aggiornate con successo.'});
    setAuthForm(p=>({...p,password:'',passwordNew:'',passwordConf:''}));
    setTimeout(()=>setAuthMsg(null),3000);
  };
  useEffect(()=>setForm(settings),[settings]);
  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-xl md:text-3xl font-semibold text-[#1d1d1f] tracking-tight">Impostazioni Azienda</h1>
      <Card cls="p-6">
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2"><Building2 size={14} className="text-[#86868b]"/>Dati Anagrafici</h2>
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
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2"><Receipt size={14} className="text-[#86868b]"/>Regime Fiscale</h2>
        <div className="grid grid-cols-2 gap-4">
          <Sel label="Tipo Società" value={form.tipoSocieta} onChange={e=>f('tipoSocieta',e.target.value)}><option value="srl">S.r.l.</option><option value="snc">S.n.c.</option><option value="sas">S.a.s.</option><option value="spa">S.p.A.</option><option value="ditta_individuale">Ditta Individuale</option></Sel>
          <Sel label="Regime IVA" value={form.regimeFiscale} onChange={e=>f('regimeFiscale',e.target.value)}><option value="margine">Regime del Margine (auto usate)</option><option value="ordinario">Regime Ordinario</option></Sel>
          <Sel label="Liquidazione IVA" value={form.liquidazioneIva} onChange={e=>f('liquidazioneIva',e.target.value)}><option value="trimestrale">Trimestrale</option><option value="mensile">Mensile</option></Sel>
          <Inp label="Aliquota IRES/IRPEF (%)" type="number" value={form.aliquotaImposta} onChange={e=>f('aliquotaImposta',+e.target.value)} placeholder="24"/>
        </div>
      </Card>
      <Card cls="p-6">
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2"><Banknote size={14} className="text-[#86868b]"/>Dati Bancari</h2>
        <div className="grid grid-cols-2 gap-4">
          <Inp label="Banca" value={form.banca} onChange={e=>f('banca',e.target.value)} placeholder="Es. UniCredit"/>
          <Inp label="IBAN Aziendale" value={form.iban} onChange={e=>f('iban',e.target.value.toUpperCase())} placeholder="IT60 X054 2811 1010 0000 0123 456"/>
        </div>
      </Card>
      <Card cls="p-6">
        <h2 className="text-sm font-semibold text-[#1d1d1f] mb-1 flex items-center gap-2"><Euro size={14} className="text-[#5ac8fa]"/>Fondo di Cassa</h2>
        <p className="text-xs text-[#86868b] mb-4">Capitale iniziale disponibile in cassa. Le vendite, spese e mandati eseguiti aggiornano automaticamente il saldo.</p>
        <div className="max-w-xs">
          <Inp label="Fondo di Cassa Iniziale (€)" type="number" step="1" value={form.fondoCassaIniziale??200000} onChange={e=>f('fondoCassaIniziale',+e.target.value)}/>
        </div>
      </Card>
      <div className="flex justify-end"><Btn onClick={save} variant={ok?'success':'primary'} cls="min-w-40">{ok?<><Check size={13}/>Salvato!</>:<><Check size={13}/>Salva Impostazioni</>}</Btn></div>

      {/* Credenziali accesso */}
      <Card cls="p-6">
        <h2 className="text-base font-semibold text-[#1d1d1f] mb-4 flex items-center gap-2"><Settings size={15}/>Credenziali di Accesso</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5">Nome utente</label>
            <input className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all"
              value={authForm.username} onChange={e=>setAuthForm(p=>({...p,username:e.target.value}))}/>
          </div>
          <div/>
          <div>
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5">Password attuale</label>
            <input type="password" className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all"
              placeholder="••••••••" value={authForm.password} onChange={e=>setAuthForm(p=>({...p,password:e.target.value}))}/>
          </div>
          <div/>
          <div>
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5">Nuova password</label>
            <input type="password" className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all"
              placeholder="Min. 6 caratteri" value={authForm.passwordNew} onChange={e=>setAuthForm(p=>({...p,passwordNew:e.target.value}))}/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wide mb-1.5">Conferma nuova password</label>
            <input type="password" className="w-full bg-[#f5f5f7] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/40 transition-all"
              placeholder="Ripeti la nuova password" value={authForm.passwordConf} onChange={e=>setAuthForm(p=>({...p,passwordConf:e.target.value}))}/>
          </div>
        </div>
        {authMsg&&<div className={`mt-3 flex items-center gap-2 text-xs font-medium rounded-xl px-3.5 py-2.5 ${authMsg.t==='ok'?'bg-[#34c759]/10 text-[#1a7535]':'bg-[#ff3b30]/10 text-[#cc2900]'}`}>
          {authMsg.t==='ok'?<Check size={13}/>:<AlertTriangle size={13}/>}{authMsg.m}
        </div>}
        <div className="flex justify-end mt-4">
          <Btn onClick={saveAuth} variant="primary" cls="min-w-44"><Check size={13}/>Aggiorna credenziali</Btn>
        </div>
      </Card>
    </div>
  );
};
export default function App() {
  const [dark,setDark]=useState(()=>localStorage.getItem('cd:dark')==='1');
  const toggleDark=useCallback(()=>setDark(d=>{const n=!d;localStorage.setItem('cd:dark',n?'1':'0');return n;}),[]);
  const [authed,setAuthed]=useState(()=>sessionStorage.getItem('cd:session')==='1');
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const logout=()=>{sessionStorage.removeItem('cd:session');setAuthed(false);};
  const [sec,setSec]=useState('dashboard'),[settings,setSettings]=useState(DEFAULT_SETTINGS),
    [cars,setCars]=useState([]),[sales,setSales]=useState([]),
    [expenses,setExpenses]=useState([]),[f24,setF24]=useState([]),
    [mandati,setMandati]=useState([]),[cassaMovimenti,setCassaMovimenti]=useState([]),
    [loading,setLoading]=useState(true),[notif,setNotif]=useState(null);
  const notifTimer=useRef(null);
  const notify=useCallback((msg,type='success')=>{
    clearTimeout(notifTimer.current);
    setNotif({msg,type});
    notifTimer.current=setTimeout(()=>setNotif(null),3000);
  },[]);

  /* ── Caricamento dati da Supabase ─────────────────────────── */
  useEffect(()=>{
    const loadAll=async()=>{
      const [rv,rs,re,rf,rm,ri,rc]=await Promise.all([
        supabase.from('veicoli').select('*').order('created_at'),
        supabase.from('vendite').select('*').order('created_at'),
        supabase.from('spese').select('*').order('created_at'),
        supabase.from('f24').select('*').order('created_at'),
        supabase.from('mandati').select('*').order('created_at'),
        supabase.from('impostazioni').select('*').eq('id',1).single(),
        supabase.from('fondo_cassa_movimenti').select('*').order('created_at'),
      ]);
      if(rv.data) setCars(rv.data);
      if(rs.data) setSales(rs.data);
      if(re.data) setExpenses(re.data);
      if(rf.data) setF24(rf.data);
      if(rm.data) setMandati(rm.data);
      if(ri.data) setSettings(settingsFromDb(ri.data));
      if(rc.data) setCassaMovimenti(rc.data);
      setLoading(false);
    };
    loadAll();
  },[]);

  /* ── CRUD Veicoli ─────────────────────────────────────────── */
  const cOps=useMemo(()=>({
    add:async v=>{
      setCars(p=>[...p,v]);
      await supabase.from('veicoli').insert(v);
      if(v.mandato_id){
        setMandati(p=>p.map(m=>m.id===v.mandato_id?{...m,veicolo_id:v.id}:m));
        supabase.from('mandati').update({veicolo_id:v.id}).eq('id',v.mandato_id);
      }
      notify('Veicolo aggiunto al parco');
    },
    edit:async v=>{
      setCars(p=>p.map(c=>c.id===v.id?v:c));
      await supabase.from('veicoli').upsert(v);
      notify('Veicolo aggiornato');
    },
    del:async id=>{
      setCars(p=>p.filter(c=>c.id!==id));
      await supabase.from('veicoli').delete().eq('id',id);
      notify('Veicolo eliminato','info');
    }
  }),[notify]);

  /* ── CRUD Vendite ─────────────────────────────────────────── */
  const sOps=useMemo(()=>({
    add:async s=>{
      setSales(p=>[...p,s]);
      await supabase.from('vendite').insert(s);
      if(s.veicolo_id){
        setCars(p=>p.map(c=>c.id===s.veicolo_id?{...c,stato:'venduto'}:c));
        await supabase.from('veicoli').update({stato:'venduto'}).eq('id',s.veicolo_id);
      }
      const mv={id:uid(),data:s.data_vendita,tipo:'entrata',descrizione:`Vendita ${s.targa} ${s.marca} ${s.modello} — ${s.cliente}`,importo:s.prezzo_vendita,fonte:'vendita',fonte_id:s.id};
      setCassaMovimenti(p=>[...p,mv]);
      supabase.from('fondo_cassa_movimenti').insert(mv);
      notify('Vendita registrata con successo');
    },
    edit:async s=>{
      setSales(p=>p.map(v=>v.id===s.id?s:v));
      await supabase.from('vendite').upsert(s);
      notify('Vendita aggiornata');
    },
    del:async id=>{
      setSales(p=>p.filter(v=>v.id!==id));
      await supabase.from('vendite').delete().eq('id',id);
      setCassaMovimenti(p=>p.filter(v=>!(v.fonte==='vendita'&&v.fonte_id===id)));
      supabase.from('fondo_cassa_movimenti').delete().eq('fonte','vendita').eq('fonte_id',id);
      notify('Vendita eliminata','info');
    }
  }),[notify]);

  /* ── CRUD Spese ───────────────────────────────────────────── */
  const eOps=useMemo(()=>({
    add:async e=>{
      setExpenses(p=>[...p,e]);
      await supabase.from('spese').insert(e);
      const mv={id:uid(),data:e.data,tipo:'uscita',descrizione:`Spesa: ${e.descrizione} (${e.categoria})`,importo:e.importo,fonte:'spesa',fonte_id:e.id};
      setCassaMovimenti(p=>[...p,mv]);
      supabase.from('fondo_cassa_movimenti').insert(mv);
      notify('Spesa aggiunta');
    },
    edit:async e=>{
      setExpenses(p=>p.map(v=>v.id===e.id?e:v));
      await supabase.from('spese').upsert(e);
      notify('Spesa aggiornata');
    },
    del:async id=>{
      setExpenses(p=>p.filter(v=>v.id!==id));
      await supabase.from('spese').delete().eq('id',id);
      setCassaMovimenti(p=>p.filter(v=>!(v.fonte==='spesa'&&v.fonte_id===id)));
      supabase.from('fondo_cassa_movimenti').delete().eq('fonte','spesa').eq('fonte_id',id);
      notify('Spesa eliminata','info');
    }
  }),[notify]);

  /* ── CRUD F24 ─────────────────────────────────────────────── */
  const fOps=useMemo(()=>({
    add:async r=>{
      setF24(p=>[...p,r]);
      await supabase.from('f24').insert(r);
      setMandati(p=>{
        const nNum=`MP${String(p.length+1).padStart(4,'0')}`;
        const nm={id:uid(),numero:nNum,data:today(),beneficiario:'Agenzia delle Entrate',cf_ben:'80415740580',
          causale:`F24 cod. ${r.codice_tributo} — ${r.descrizione||TRIBUTI_IVA_TRIM.find(t=>t.codice===r.codice_tributo)?.desc||r.codice_tributo} — Anno ${r.anno}`,
          importo:r.importo,metodo:'Bonifico',iban_ben:'',stato:'in_attesa',data_ese:'',note:'',f24_id:r.id};
        supabase.from('mandati').insert(nm);
        return [...p,nm];
      });
      notify('F24 aggiunto — mandato di pagamento creato automaticamente');
    },
    edit:async r=>{
      setF24(p=>p.map(v=>v.id===r.id?r:v));
      await supabase.from('f24').upsert(r);
      notify('F24 aggiornato');
    },
    del:async id=>{
      setF24(p=>p.filter(v=>v.id!==id));
      await supabase.from('f24').delete().eq('id',id);
      notify('F24 eliminato','info');
    }
  }),[notify]);

  /* ── CRUD Mandati ─────────────────────────────────────────── */
  const mOps=useMemo(()=>({
    add:async m=>{
      setMandati(p=>[...p,m]);
      await supabase.from('mandati').insert(m);
      notify('Mandato creato');
    },
    edit:async m=>{
      setMandati(p=>{
        const prev=p.find(v=>v.id===m.id);
        if(m.stato==='eseguito'&&prev?.stato!=='eseguito'){
          const mv={id:uid(),data:m.data_ese||today(),tipo:'uscita',descrizione:`Mandato ${m.numero} — ${m.causale||''} — ${m.beneficiario}`,importo:m.importo,fonte:'mandato',fonte_id:m.id};
          setCassaMovimenti(fp=>[...fp,mv]);
          supabase.from('fondo_cassa_movimenti').insert(mv);
          if(m.f24_id){
            setF24(fp=>fp.map(r=>r.id===m.f24_id?{...r,stato:'pagato',data_pagamento:m.data_ese||today()}:r));
            supabase.from('f24').update({stato:'pagato',data_pagamento:m.data_ese||today()}).eq('id',m.f24_id);
            notify('Mandato eseguito — F24 aggiornato e cassa scalata');
          } else notify('Mandato eseguito — importo scalato dalla cassa');
        } else notify('Mandato aggiornato');
        return p.map(v=>v.id===m.id?m:v);
      });
      await supabase.from('mandati').upsert(m);
    },
    del:async id=>{
      setMandati(p=>{
        const m=p.find(v=>v.id===id);
        if(m?.stato==='eseguito'){
          setCassaMovimenti(fp=>fp.filter(v=>!(v.fonte==='mandato'&&v.fonte_id===id)));
          supabase.from('fondo_cassa_movimenti').delete().eq('fonte','mandato').eq('fonte_id',id);
        }
        return p.filter(v=>v.id!==id);
      });
      await supabase.from('mandati').delete().eq('id',id);
      notify('Mandato eliminato','info');
    }
  }),[notify]);

  /* ── Impostazioni ─────────────────────────────────────────── */
  const saveSettings=useCallback(async s=>{
    setSettings(s);
    await supabase.from('impostazioni').upsert(settingsToDb(s));
    notify('Impostazioni salvate');
  },[notify]);

  /* ── CRUD Fondo Cassa ─────────────────────────────────────── */
  const cassaOps=useMemo(()=>({
    add:async mv=>{
      setCassaMovimenti(p=>[...p,mv]);
      await supabase.from('fondo_cassa_movimenti').insert(mv);
      notify('Movimento registrato in cassa');
    },
    del:async id=>{
      setCassaMovimenti(p=>p.filter(v=>v.id!==id));
      await supabase.from('fondo_cassa_movimenti').delete().eq('id',id);
      notify('Movimento eliminato','info');
    },
  }),[notify]);
  if(!authed) return <LoginScreen onLogin={()=>setAuthed(true)} dark={dark} toggleDark={toggleDark}/>;
  if(loading) return (
    <div className="flex h-screen items-center justify-center" style={{background:'#f5f5f7'}}>
      <div className="text-center"><div className="w-10 h-10 border-[3px] border-[#1d1d1f] border-t-transparent rounded-full animate-spin mx-auto mb-4"/><p className="text-[#86868b] text-sm font-medium">Caricamento in corso…</p></div>
    </div>
  );
  return (
    <div className={`flex h-screen overflow-hidden pm-glass-bg${dark?' pm-dark':''}`} style={{fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",system-ui,sans-serif'}}>
      {notif&&<Notif msg={notif.msg} type={notif.type} onClose={()=>setNotif(null)}/>}
      <Sidebar active={sec} onNav={v=>{setSec(v);setSidebarOpen(false);}} s={settings} onLogout={logout} open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>
      <div className="flex-1 overflow-y-auto relative">
        {/* Hamburger mobile */}
        <button onClick={()=>setSidebarOpen(true)} className="lg:hidden absolute top-4 left-4 z-30 p-2 rounded-xl glass-pill" style={{padding:'7px'}}>
          <Menu size={18}/>
        </button>
        {/* Toggle dark / light */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 glass-pill">
          <button className={`glass-btn${!dark?' glass-active':''}`} onClick={()=>dark&&toggleDark()} title="Modalità chiara" style={{width:30,height:30,flexShrink:0}}>
            <Sun size={14}/>
          </button>
          <button className={`glass-btn${dark?' glass-active':''}`} onClick={()=>!dark&&toggleDark()} title="Modalità scura" style={{width:30,height:30,flexShrink:0}}>
            <Moon size={14}/>
          </button>
        </div>
        <div className="p-4 md:p-7 pt-16 md:pt-7">
        {sec==='dashboard'&&<Dashboard cars={cars} sales={sales} expenses={expenses} f24={f24} mandati={mandati} onNav={setSec} cassaMovimenti={cassaMovimenti} settings={settings}/>}
        {sec==='parco'&&<ParcoAuto cars={cars} mandati={mandati} onAdd={cOps.add} onEdit={cOps.edit} onDel={cOps.del}/>}
        {sec==='vendite'&&<Vendite sales={sales} cars={cars} onAdd={sOps.add} onEdit={sOps.edit} onDel={sOps.del}/>}
        {sec==='spese'&&<Spese expenses={expenses} onAdd={eOps.add} onEdit={eOps.edit} onDel={eOps.del}/>}
        {sec==='iva'&&<GestioneIVA sales={sales} settings={settings} f24={f24}/>}
        {sec==='f24'&&<F24Manager f24Records={f24} onAdd={fOps.add} onEdit={fOps.edit} onDel={fOps.del} settings={settings}/>}
        {sec==='mandati'&&<MandatiPagamento mandati={mandati} onAdd={mOps.add} onEdit={mOps.edit} onDel={mOps.del} settings={settings}/>}
        {sec==='bilancio'&&<Bilancio sales={sales} expenses={expenses} f24Records={f24} cassaMovimenti={cassaMovimenti} settings={settings} cassaOps={cassaOps}/>}
        {sec==='impostazioni'&&<Impostazioni settings={settings} onSave={saveSettings}/>}
      </div>
      </div>
    </div>
  );
}
