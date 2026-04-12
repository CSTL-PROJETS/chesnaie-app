import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

// ─── ZONES ────────────────────────────────────────────────────
const ZONES_DEFAULT = [
  ...Array.from({length:20},(_,i)=>({id:`mh${i+1}`,name:`Mobile-home ${200+i+1}`,cat:"Hébergement",icon:"🏠"})),
  {id:"mh_all",name:"Hébergements (général)",cat:"Hébergement",icon:"🏘️"},
  {id:"bar",name:"Bar",cat:"Restauration",icon:"🍺"},
  {id:"cuisine",name:"Cuisine",cat:"Restauration",icon:"👨‍🍳"},
  {id:"accueil",name:"Accueil",cat:"Bureaux",icon:"🛎️"},
  {id:"bureau",name:"Bureau",cat:"Bureaux",icon:"💼"},
  {id:"appart",name:"Appartement direction",cat:"Bureaux",icon:"🏢"},
  {id:"salle_reunion",name:"Salle de réunion",cat:"Bureaux",icon:"📋"},
  {id:"suite1",name:"Suite 1",cat:"Suites",icon:"⭐"},
  {id:"suite2",name:"Suite 2",cat:"Suites",icon:"⭐"},
  {id:"suite3",name:"Suite 3",cat:"Suites",icon:"⭐"},
  {id:"suite4",name:"Suite 4",cat:"Suites",icon:"⭐"},
  {id:"salle_cosy",name:"Petite salle cosy",cat:"Salles",icon:"🕯️"},
  {id:"grande_salle",name:"Grande salle réception",cat:"Salles",icon:"🎊"},
  {id:"boite_nuit",name:"Boîte de nuit",cat:"Salles",icon:"🎵"},
  {id:"salle_ado",name:"Salle ado",cat:"Salles",icon:"🎮"},
  {id:"san_pub",name:"Sanitaires publics",cat:"Sanitaires",icon:"🚿"},
  {id:"san_pmr",name:"Sanitaires PMR",cat:"Sanitaires",icon:"♿"},
  {id:"wc_piscine",name:"WC piscine",cat:"Sanitaires",icon:"🚽"},
  {id:"laverie_pub",name:"Laverie publique",cat:"Services",icon:"🧺"},
  {id:"laverie_nous",name:"Laverie interne",cat:"Services",icon:"🧺"},
  {id:"local_vaisselle",name:"Local vaisselle",cat:"Services",icon:"🍽️"},
  {id:"stock1",name:"Stock 1",cat:"Services",icon:"📦"},
  {id:"stock2",name:"Stock 2",cat:"Services",icon:"📦"},
  {id:"stock3",name:"Stock 3",cat:"Services",icon:"📦"},
  {id:"coiffure",name:"Salon coiffure & massage",cat:"Services",icon:"✂️"},
  {id:"piscine",name:"Piscine",cat:"Piscine",icon:"🏊"},
  {id:"local_piscine1",name:"Local piscine 1",cat:"Piscine",icon:"🔧"},
  {id:"local_piscine2",name:"Local piscine 2",cat:"Piscine",icon:"🔧"},
  {id:"exterieur",name:"Espaces verts / extérieur",cat:"Extérieur",icon:"🌿"},
  {id:"tennis",name:"Table de tennis",cat:"Extérieur",icon:"🏓"},
  {id:"voiture1",name:"Voiture 1",cat:"Véhicules",icon:"🚗"},
  {id:"voiture2",name:"Voiture 2",cat:"Véhicules",icon:"🚗"},
  {id:"voiture3",name:"Voiture 3",cat:"Véhicules",icon:"🚗"},
  {id:"golf1",name:"Voiturette golf 1",cat:"Véhicules",icon:"⛳"},
  {id:"golf2",name:"Voiturette golf 2",cat:"Véhicules",icon:"⛳"},
  {id:"golf3",name:"Voiturette golf 3",cat:"Véhicules",icon:"⛳"},
];

const ROLES = {
  direction:      {label:"Direction",          color:"#2E7D32", icon:"👑", canCreate:true,  canValidate:true,  canReassign:true,  canManageUsers:true},
  qualite:        {label:"Contrôle qualité",   color:"#1565C0", icon:"🔍", canCreate:true,  canValidate:true,  canReassign:true,  canManageUsers:false},
  ctrl_technique: {label:"Contrôle technique", color:"#BF360C", icon:"🛠️", canCreate:true,  canValidate:true,  canReassign:true,  canManageUsers:false},
  technique:      {label:"Technique",          color:"#E65100", icon:"🔧", canCreate:true,  canValidate:false, canReassign:false, canManageUsers:false},
  menage:         {label:"Ménage",             color:"#6A1B9A", icon:"🧹", canCreate:false, canValidate:false, canReassign:false, canManageUsers:false},
  accueil:        {label:"Accueil",            color:"#00838F", icon:"🛎️", canCreate:true,  canValidate:false, canReassign:false, canManageUsers:false},
};

const WORKFLOW = ["À faire","En cours","À valider","Validée","Renvoyée"];
const PRIO_COLOR = {Urgente:"#C62828",Haute:"#E65100",Normale:"#1565C0",Basse:"#5D4037"};
const STATUS_COLOR = {"À faire":"#F57F17","En cours":"#1565C0","À valider":"#6A1B9A","Validée":"#2E7D32","Renvoyée":"#C62828"};

// ─── STORAGE ──────────────────────────────────────────────────
const db = {
  async get(k){
    try{
      const {data,error} = await supabase.from('tasks').select('data').eq('id',k).single();
      if(error) return null;
      return data?.data || null;
    }catch{return null;}
  },
  async set(k,v){
    try{
      await supabase.from('tasks').upsert({id:k, data:v, updated_at: new Date().toISOString()});
    }catch(e){console.error(e);}
  },
};

// ─── CLAUDE API ───────────────────────────────────────────────
async function analyzePhoto(base64, zoneName){
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",max_tokens:600,
      messages:[{role:"user",content:[
        {type:"image",source:{type:"base64",media_type:"image/jpeg",data:base64}},
        {type:"text",text:`Analyse qualité pour camping 4★ — zone : ${zoneName}.
Réponds UNIQUEMENT en JSON sans backticks :
{"anomalies":["max 3 problèmes"],"priorite":"Urgente|Haute|Normale|Basse","resume":"1 phrase","action":"1 phrase"}
Si RAS : anomalies=[], priorite="Basse", resume="État satisfaisant"`}
      ]}]
    })
  });
  const d = await res.json();
  const txt = d.content?.map(c=>c.text||"").join("")||"{}";
  try{return JSON.parse(txt.replace(/```json|```/g,"").trim());}
  catch{return {anomalies:[],priorite:"Normale",resume:"Analyse indisponible",action:""};}
}

// ─── ROOT APP ─────────────────────────────────────────────────
export default function App(){
  const [users, setUsers]       = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [me, setMe]             = useState(null); // current user
  const [ready, setReady]       = useState(false);
  const [screen, setScreen]     = useState("login");
  const [taskId, setTaskId]     = useState(null);

  // Load shared data
  useEffect(()=>{
    (async()=>{
      let u = await db.get("users_v1");
      const t = await db.get("tasks_v1");
      // Migration : si ancien compte avec PIN "1234", on remet sans PIN
      if(u && u.some(x=>x.pin==="1234")){
        u = u.map(x=>({...x,pin:x.pin==="1234"?"":x.pin}));
        await db.set("users_v1",u);
      }
      if(u) setUsers(u);
      else {
        const seed = [{id:"u0",name:"Céline",role:"direction",pin:""}];
        await db.set("users_v1",seed);
        setUsers(seed);
      }
      if(t) setTasks(t);
      setReady(true);
    })();
  },[]);

  const saveUsers = async(u)=>{ setUsers(u); await db.set("users_v1",u); };
  const saveTasks = async(t)=>{ setTasks(t); await db.set("tasks_v1",t); };

  const openTask = (id)=>{ setTaskId(id); setScreen("task"); };

  if(!ready) return <Splash />;
  if(!me)    return <Login users={users} onLogin={(u)=>{setMe(u);setScreen("home");}} />;

  const role = ROLES[me.role];
  const myTasks = tasks.filter(t=>t.assignedTo===me.id && t.status!=="Validée");
  const toValidate = tasks.filter(t=>t.status==="À valider");
  const currentTask = tasks.find(t=>t.id===taskId);

  return (
    <Shell>
      {screen==="home"    && <Home me={me} role={role} tasks={tasks} myTasks={myTasks} toValidate={toValidate} users={users} onOpen={openTask} onNav={setScreen} />}
      {screen==="mytasks" && <MyTasks me={me} role={role} tasks={myTasks} users={users} onOpen={openTask} onBack={()=>setScreen("home")} />}
      {screen==="all"     && <AllTasks me={me} role={role} tasks={tasks} users={users} zones={ZONES_DEFAULT} onOpen={openTask} onBack={()=>setScreen("home")} />}
      {screen==="validate"&& <ToValidate me={me} tasks={toValidate} users={users} zones={ZONES_DEFAULT} onOpen={openTask} onBack={()=>setScreen("home")} />}
      {screen==="new"     && <NewTask me={me} role={role} users={users} zones={ZONES_DEFAULT} onSave={async(t)=>{const u=[t,...tasks];await saveTasks(u);setScreen("home");}} onBack={()=>setScreen("home")} />}
      {screen==="task" && currentTask && <TaskDetail task={currentTask} me={me} role={role} users={users} zones={ZONES_DEFAULT} onSave={async(t)=>{const u=tasks.map(x=>x.id===t.id?t:x);await saveTasks(u);}} onDelete={async()=>{const u=tasks.filter(x=>x.id!==currentTask.id);await saveTasks(u);setScreen("home");}} onBack={()=>setScreen("home")} />}
      {screen==="people"  && <People me={me} role={role} users={users} onSave={saveUsers} onBack={()=>setScreen("home")} />}
      {screen==="profile" && <Profile me={me} onLogout={()=>setMe(null)} onBack={()=>setScreen("home")} />}
      {screen==="home" || screen==="mytasks" || screen==="all" || screen==="validate" ? 
        <BottomNav screen={screen} me={me} role={role} toValidate={toValidate.length} myTasks={myTasks.length} onNav={setScreen} /> : null}
    </Shell>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────
function Splash(){
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#F8F9FA",fontFamily:"Georgia,serif",color:"#2E7D32",fontSize:18,flexDirection:"column",gap:8}}>
    <div style={{fontSize:32}}>🏕️</div>
    <div>Parc de la Chesnaie</div>
    <div style={{fontSize:12,color:"#9E9E9E",fontFamily:"sans-serif"}}>Chargement…</div>
  </div>;
}

// ─── LOGIN ────────────────────────────────────────────────────
function Login({users,onLogin}){
  const [step,setStep]=useState("choose"); // choose|pin
  const [selected,setSelected]=useState(null);
  const [pin,setPin]=useState("");
  const [err,setErr]=useState("");

  const choose=(u)=>{
    if(!u.pin){onLogin(u);return;}  // Pas de PIN → connexion directe
    setSelected(u);
    setPin("");setErr("");
    setStep("pin");
  };
  const confirm=()=>{
    if(selected.pin && pin!==selected.pin){setErr("Code incorrect");return;}
    onLogin(selected);
  };

  return (
    <div style={{minHeight:"100vh",background:"#F8F9FA",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{fontSize:40,marginBottom:8}}>🏕️</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:22,color:"#2E7D32",marginBottom:4}}>Parc de la Chesnaie</div>
      <div style={{fontFamily:"sans-serif",fontSize:13,color:"#9E9E9E",marginBottom:28}}>Qui êtes-vous ?</div>
      {step==="choose" && (
        <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:8}}>
          {users.map(u=>{
            const r=ROLES[u.role];
            return <button key={u.id} onClick={()=>choose(u)} style={{background:"#fff",border:"2px solid #E0E0E0",borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:r?.color||"#9E9E9E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{r?.icon||"👤"}</div>
              <div>
                <div style={{fontFamily:"Georgia,serif",fontSize:16,color:"#1A1A1A"}}>{u.name}</div>
                <div style={{fontFamily:"sans-serif",fontSize:12,color:"#9E9E9E"}}>{r?.label||u.role}</div>
              </div>
            </button>;
          })}
        </div>
      )}
      {step==="pin" && selected && (
        <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:12,alignItems:"center"}}>
          <div style={{fontFamily:"sans-serif",fontSize:14,color:"#424242"}}>Bonjour {selected.name} — {selected.pin?"Entrez votre code PIN":"Appuyez sur Continuer"}</div>
          {selected.pin && <>
            <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e=>setPin(e.target.value)} placeholder="Code PIN" style={{width:"100%",border:"2px solid #ddd",borderRadius:10,padding:"12px",fontSize:18,textAlign:"center",letterSpacing:8,fontFamily:"sans-serif",boxSizing:"border-box"}} onKeyDown={e=>e.key==="Enter"&&confirm()} autoFocus />
            {err && <div style={{color:"#C62828",fontFamily:"sans-serif",fontSize:13}}>{err}</div>}
          </>}
          <button onClick={confirm} style={{width:"100%",background:"#2E7D32",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontFamily:"sans-serif",fontWeight:"bold",cursor:"pointer"}}>
            Connexion
          </button>
          <button onClick={()=>setStep("choose")} style={{background:"none",border:"none",color:"#9E9E9E",fontFamily:"sans-serif",fontSize:13,cursor:"pointer"}}>← Retour</button>
        </div>
      )}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────
function Home({me,role,tasks,myTasks,toValidate,users,onOpen,onNav}){
  const urgentes=tasks.filter(t=>t.priority==="Urgente"&&t.status!=="Validée");
  const renvoyes=tasks.filter(t=>t.status==="Renvoyée"&&t.assignedTo===me.id);
  return <div style={{paddingBottom:72}}>
    {/* Header */}
    <div style={{background:role.color,color:"#fff",padding:"18px 16px 14px"}}>
      <div style={{fontSize:11,opacity:.7,fontFamily:"sans-serif"}}>Parc de la Chesnaie</div>
      <div style={{fontSize:21,fontWeight:"bold"}}>Bonjour, {me.name} {role.icon}</div>
      <div style={{fontSize:12,opacity:.7,fontFamily:"sans-serif",marginTop:2}}>
        {new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}
      </div>
    </div>
    <div style={{padding:"12px"}}>
      {/* Renvoyées à moi */}
      {renvoyes.length>0&&<AlertBanner color="#C62828" bg="#FFEBEE" icon="🔄" label={`${renvoyes.length} tâche${renvoyes.length>1?"s":""} renvoyée${renvoyes.length>1?"s":""} vers vous`} items={renvoyes} users={users} onOpen={onOpen} />}
      {/* Urgentes */}
      {urgentes.length>0&&<AlertBanner color="#C62828" bg="#FFEBEE" icon="🚨" label={`${urgentes.length} urgente${urgentes.length>1?"s":""}`} items={urgentes.slice(0,3)} users={users} onOpen={onOpen} />}
      {/* À valider */}
      {role.canValidate&&toValidate.length>0&&<AlertBanner color="#6A1B9A" bg="#F3E5F5" icon="🔍" label={`${toValidate.length} en attente de validation`} items={[]} users={users} onOpen={()=>onNav("validate")} isButton />}
      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"10px 0"}}>
        <StatCard n={myTasks.length} label="Mes tâches" color={role.color} onClick={()=>onNav("mytasks")} />
        {role.canValidate&&<StatCard n={toValidate.length} label="À valider" color="#6A1B9A" onClick={()=>onNav("validate")} />}
        {!role.canValidate&&<StatCard n={tasks.filter(t=>t.status==="Validée").length} label="Validées" color="#2E7D32" onClick={()=>onNav("all")} />}
        {role.canCreate&&<StatCard n={urgentes.length} label="Urgentes" color="#C62828" onClick={()=>onNav("all")} />}
        {role.canManageUsers&&<StatCard n={users.length} label="Utilisateurs" color="#424242" onClick={()=>onNav("people")} />}
      </div>
      {/* Mes tâches récentes */}
      <SectionTitle label="Mes tâches récentes" action="Tout voir" onAction={()=>onNav("mytasks")} />
      {myTasks.length===0&&<EmptyState label="Aucune tâche assignée" />}
      {myTasks.slice(0,4).map(t=><TaskRow key={t.id} task={t} users={users} onOpen={onOpen} />)}
    </div>
  </div>;
}

// ─── MY TASKS ─────────────────────────────────────────────────
function MyTasks({me,role,tasks,users,onOpen,onBack}){
  const [filter,setFilter]=useState("Actives");
  const active=tasks.filter(t=>t.status!=="Validée");
  const done=tasks.filter(t=>t.status==="Validée");
  const shown=filter==="Actives"?active:done;
  return <div style={{paddingBottom:72}}>
    <TopBar title="Mes tâches" onBack={onBack} />
    <div style={{display:"flex",gap:6,padding:"8px 12px",background:"#fff",borderBottom:"1px solid #eee"}}>
      {["Actives","Validées"].map(f=><FilterChip key={f} label={`${f} (${f==="Actives"?active.length:done.length})`} active={filter===f} color={role.color} onClick={()=>setFilter(f)} />)}
    </div>
    <div style={{padding:"10px 12px"}}>
      {shown.length===0&&<EmptyState label={`Aucune tâche ${filter.toLowerCase()}`} />}
      {shown.map(t=><TaskRow key={t.id} task={t} users={users} onOpen={onOpen} />)}
    </div>
  </div>;
}

// ─── ALL TASKS (direction/qualite) ───────────────────────────
function AllTasks({me,role,tasks,users,zones,onOpen,onBack}){
  const [fStatus,setFStatus]=useState("Tous");
  const [fUser,setFUser]=useState("Tous");
  const shown=tasks.filter(t=>{
    const statusOk=fStatus==="Tous"||t.status===fStatus;
    const userOk=fUser==="Tous"||t.assignedTo===fUser;
    return statusOk&&userOk;
  });
  return <div style={{paddingBottom:72}}>
    <TopBar title="Toutes les tâches" onBack={onBack} />
    <div style={{padding:"8px 12px",background:"#fff",borderBottom:"1px solid #eee",display:"flex",gap:6,overflowX:"auto"}}>
      {["Tous",...WORKFLOW].map(s=><FilterChip key={s} label={s} active={fStatus===s} color={STATUS_COLOR[s]||"#555"} onClick={()=>setFStatus(s)} />)}
    </div>
    <div style={{padding:"8px 12px",background:"#fff",borderBottom:"1px solid #eee",display:"flex",gap:6,overflowX:"auto"}}>
      <FilterChip label="Tous" active={fUser==="Tous"} color="#555" onClick={()=>setFUser("Tous")} />
      {users.map(u=><FilterChip key={u.id} label={u.name} active={fUser===u.id} color={ROLES[u.role]?.color||"#555"} onClick={()=>setFUser(u.id)} />)}
    </div>
    <div style={{padding:"10px 12px"}}>
      {shown.length===0&&<EmptyState label="Aucune tâche" />}
      {shown.map(t=><TaskRow key={t.id} task={t} users={users} onOpen={onOpen} showAssignee />)}
    </div>
  </div>;
}

// ─── TO VALIDATE ──────────────────────────────────────────────
function ToValidate({me,tasks,users,zones,onOpen,onBack}){
  return <div style={{paddingBottom:72}}>
    <TopBar title={`À valider (${tasks.length})`} onBack={onBack} />
    <div style={{padding:"10px 12px"}}>
      {tasks.length===0&&<EmptyState label="Rien à valider — tout est bon !" emoji="✅" />}
      {tasks.map(t=><TaskRow key={t.id} task={t} users={users} onOpen={onOpen} showAssignee highlight />)}
    </div>
  </div>;
}

// ─── NEW TASK ─────────────────────────────────────────────────
function NewTask({me,role,users,zones,onSave,onBack}){
  const [title,setTitle]=useState("");
  const [zoneId,setZoneId]=useState("");
  const [priority,setPriority]=useState("Normale");
  const [assignedTo,setAssignedTo]=useState("");
  const [desc,setDesc]=useState("");
  const [catFilter,setCatFilter]=useState("Tous");
  const cats=["Tous",...new Set(zones.map(z=>z.cat))];
  const fzones=catFilter==="Tous"?zones:zones.filter(z=>z.cat===catFilter);

  const save=()=>{
    if(!title||!zoneId) return;
    onSave({
      id:Date.now().toString(36),
      title,zoneId,priority,desc,
      assignedTo:assignedTo||me.id,
      createdBy:me.id,
      status:"À faire",
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      photos:[],
      history:[{date:new Date().toISOString(),by:me.id,action:"Tâche créée"}]
    });
  };

  return <div>
    <TopBar title="Nouvelle tâche" onBack={onBack} />
    <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:14}}>
      <F label="Titre *"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex : Réception TV défaillante" style={IS} /></F>
      <F label="Zone *">
        <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:6,paddingBottom:2}}>
          {cats.map(c=><FilterChip key={c} small label={c} active={catFilter===c} color="#2E7D32" onClick={()=>setCatFilter(c)} />)}
        </div>
        <select value={zoneId} onChange={e=>setZoneId(e.target.value)} style={IS}>
          <option value="">-- Choisir une zone --</option>
          {fzones.map(z=><option key={z.id} value={z.id}>{z.icon} {z.name}</option>)}
        </select>
      </F>
      <F label="Priorité">
        <div style={{display:"flex",gap:6}}>
          {["Urgente","Haute","Normale","Basse"].map(p=>(
            <button key={p} onClick={()=>setPriority(p)} style={{flex:1,padding:"9px 2px",border:`2px solid ${priority===p?PRIO_COLOR[p]:"#ddd"}`,borderRadius:8,background:priority===p?PRIO_COLOR[p]:"#fff",color:priority===p?"#fff":PRIO_COLOR[p],fontSize:11,fontFamily:"sans-serif",fontWeight:priority===p?"bold":"normal",cursor:"pointer"}}>
              {p}
            </button>
          ))}
        </div>
      </F>
      {role.canReassign&&<F label="Assigné à">
        <select value={assignedTo} onChange={e=>setAssignedTo(e.target.value)} style={IS}>
          <option value="">-- Moi-même --</option>
          {users.map(u=><option key={u.id} value={u.id}>{ROLES[u.role]?.icon} {u.name} ({ROLES[u.role]?.label})</option>)}
        </select>
      </F>}
      <F label="Description"><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Contexte, détails…" style={{...IS,resize:"vertical"}} /></F>
      <button onClick={save} disabled={!title||!zoneId} style={{background:title&&zoneId?"#2E7D32":"#BDBDBD",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontFamily:"sans-serif",fontSize:15,fontWeight:"bold",cursor:title&&zoneId?"pointer":"default"}}>Créer</button>
    </div>
  </div>;
}

// ─── TASK DETAIL ──────────────────────────────────────────────
function TaskDetail({task,me,role,users,zones,onSave,onDelete,onBack}){
  const zone=zones.find(z=>z.id===task.zoneId);
  const [note,setNote]=useState("");
  const [rejectMsg,setRejectMsg]=useState("");
  const [reassignTo,setReassignTo]=useState("");
  const [analyzing,setAnalyzing]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const [showPhotos,setShowPhotos]=useState(false);
  const fileRef=useRef();
  const assignee=users.find(u=>u.id===task.assignedTo);
  const creator=users.find(u=>u.id===task.createdBy);
  const isMe=task.assignedTo===me.id;

  const update=(patch,histAction)=>{
    const u={...task,...patch,updatedAt:new Date().toISOString(),
      history:[...task.history,{date:new Date().toISOString(),by:me.id,action:histAction}]};
    onSave(u);
  };

  const setStatus=(s)=>update({status:s},`Statut → ${s}`);

  const addNote=()=>{
    if(!note.trim())return;
    update({history:[...task.history,{date:new Date().toISOString(),by:me.id,action:`💬 ${note}`}]},`💬 ${note}`);
    setNote("");
  };

  const validate=()=>update({status:"Validée",validatedBy:me.id},`✅ Validé par ${me.name}`);

  const reject=()=>{
    if(!rejectMsg.trim())return;
    update({status:"Renvoyée",rejectedBy:me.id,rejectReason:rejectMsg},`🔄 Renvoyé — ${rejectMsg}`);
    setRejectMsg("");
  };

  const reassign=()=>{
    if(!reassignTo)return;
    const target=users.find(u=>u.id===reassignTo);
    update({assignedTo:reassignTo,status:"À faire"},`📤 Réassigné à ${target?.name||"?"}`);
    setReassignTo("");
  };

  const handlePhoto=async(e)=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      const b64=ev.target.result.split(",")[1];
      setAnalyzing(true);setAiResult(null);
      try{
        const r=await analyzePhoto(b64,zone?.name||task.zoneId);
        setAiResult(r);
        const p={date:new Date().toISOString(),url:ev.target.result,by:me.id,analysis:r};
        const newPhotos=[...task.photos,p];
        const histAction=`📷 Photo ajoutée — IA: ${r.resume}${r.anomalies.length>0?" — ⚠️"+r.anomalies[0]:""}`;
        const patch={photos:newPhotos};
        if((r.priorite==="Urgente"||r.priorite==="Haute")&&task.priority==="Normale") patch.priority=r.priorite;
        update(patch,histAction);
      }finally{setAnalyzing(false);}
    };
    reader.readAsDataURL(file);
  };

  const canAddPhoto = isMe || role.canValidate;
  const canChangeStatus = isMe;
  const canValidateTask = role.canValidate && task.status==="À valider";
  const canReassign = role.canReassign;
  const sendToValidate = isMe && task.status==="En cours";

  return <div style={{paddingBottom:20}}>
    <TopBar title="Détail de la tâche" onBack={onBack} />
    <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:10}}>

      {/* Info principale */}
      <Card>
        <div style={{fontSize:17,fontWeight:"bold",color:"#1A1A1A",marginBottom:4}}>{task.title}</div>
        <div style={{fontFamily:"sans-serif",fontSize:12,color:"#757575",marginBottom:8}}>{zone?.icon} {zone?.name} · {zone?.cat}</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <Tag bg={PRIO_COLOR[task.priority]||"#555"} label={task.priority} />
          <Tag bg={STATUS_COLOR[task.status]||"#555"} label={task.status} />
          {assignee&&<Tag bg={ROLES[assignee.role]?.color||"#555"} label={`👤 ${assignee.name}`} />}
        </div>
        {task.desc&&<div style={{marginTop:8,fontFamily:"sans-serif",fontSize:13,color:"#424242",lineHeight:1.5}}>{task.desc}</div>}
        {task.rejectReason&&<div style={{marginTop:8,background:"#FFEBEE",borderRadius:8,padding:"8px",fontFamily:"sans-serif",fontSize:12,color:"#C62828"}}>
          🔄 Renvoyée : {task.rejectReason}
        </div>}
      </Card>

      {/* Actions selon statut et rôle */}
      {canChangeStatus && task.status==="À faire" && (
        <ActionBtn color="#1565C0" onClick={()=>setStatus("En cours")}>▶ Commencer la tâche</ActionBtn>
      )}
      {sendToValidate && (
        <ActionBtn color="#6A1B9A" onClick={()=>setStatus("À valider")}>📤 Envoyer en validation</ActionBtn>
      )}

      {/* Validation */}
      {canValidateTask && <Card title="🔍 Validation" titleColor="#6A1B9A">
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <button onClick={validate} style={{flex:1,background:"#2E7D32",color:"#fff",border:"none",borderRadius:8,padding:"11px",fontFamily:"sans-serif",fontSize:13,fontWeight:"bold",cursor:"pointer"}}>✅ Valider</button>
        </div>
        <div style={{fontFamily:"sans-serif",fontSize:12,color:"#757575",marginBottom:5}}>Renvoyer avec motif :</div>
        <div style={{display:"flex",gap:8}}>
          <input value={rejectMsg} onChange={e=>setRejectMsg(e.target.value)} placeholder="Ex: SDB pas terminée" style={{...IS,flex:1}} />
          <button onClick={reject} style={{background:"#C62828",color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",fontFamily:"sans-serif",fontSize:12,cursor:"pointer"}}>🔄</button>
        </div>
      </Card>}

      {/* Réassignation */}
      {canReassign && <Card title="📤 Réassigner">
        <div style={{display:"flex",gap:8}}>
          <select value={reassignTo} onChange={e=>setReassignTo(e.target.value)} style={{...IS,flex:1}}>
            <option value="">-- Choisir --</option>
            {users.filter(u=>u.id!==task.assignedTo).map(u=><option key={u.id} value={u.id}>{ROLES[u.role]?.icon} {u.name}</option>)}
          </select>
          <button onClick={reassign} disabled={!reassignTo} style={{background:reassignTo?"#2E7D32":"#BDBDBD",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontFamily:"sans-serif",fontSize:13,cursor:reassignTo?"pointer":"default"}}>OK</button>
        </div>
      </Card>}

      {/* Photos */}
      <Card title={`📷 Photos (${task.photos.length})`}>
        <input type="file" accept="image/*" capture="environment" ref={fileRef} onChange={handlePhoto} style={{display:"none"}} />
        {canAddPhoto&&<button onClick={()=>fileRef.current.click()} disabled={analyzing} style={{width:"100%",padding:"10px",border:"1.5px dashed #2E7D32",borderRadius:8,background:analyzing?"#F5F5F5":"#F1F8F1",color:"#2E7D32",fontFamily:"sans-serif",fontSize:13,cursor:"pointer",fontWeight:"bold",marginBottom:8}}>
          {analyzing?"🔍 Analyse en cours…":"📷 Ajouter une photo"}
        </button>}
        {aiResult&&<AIResult r={aiResult} />}
        {task.photos.length>0&&<>
          <button onClick={()=>setShowPhotos(!showPhotos)} style={{background:"none",border:"none",color:"#1565C0",fontFamily:"sans-serif",fontSize:12,cursor:"pointer",padding:0,marginBottom:6}}>
            {showPhotos?"▾ Masquer les photos":"▸ Voir les photos"}
          </button>
          {showPhotos&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {task.photos.map((p,i)=>(
              <div key={i} style={{position:"relative"}}>
                <img src={p.url} alt="" style={{width:88,height:88,objectFit:"cover",borderRadius:8,border:"1px solid #ddd"}} />
                <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,.55)",color:"#fff",fontSize:8,padding:"2px 3px",borderRadius:"0 0 8px 8px",fontFamily:"sans-serif"}}>
                  {users.find(u=>u.id===p.by)?.name||"?"} · {new Date(p.date).toLocaleDateString("fr-FR")}
                </div>
                {p.analysis?.anomalies?.length>0&&<div style={{position:"absolute",top:2,right:2,background:"#C62828",color:"#fff",borderRadius:4,padding:"1px 4px",fontSize:8,fontFamily:"sans-serif"}}>⚠</div>}
              </div>
            ))}
          </div>}
        </>}
      </Card>

      {/* Note */}
      <Card title="💬 Ajouter une note">
        <div style={{display:"flex",gap:8}}>
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Observation, info…" style={{...IS,flex:1}} onKeyDown={e=>e.key==="Enter"&&addNote()} />
          <button onClick={addNote} style={{background:"#2E7D32",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontFamily:"sans-serif",fontSize:13,cursor:"pointer"}}>OK</button>
        </div>
      </Card>

      {/* Historique */}
      <Card title="📋 Historique">
        {[...task.history].reverse().map((h,i)=>{
          const u=users.find(x=>x.id===h.by);
          return <div key={i} style={{display:"flex",gap:8,marginBottom:7,alignItems:"flex-start"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:ROLES[u?.role]?.color||"#9E9E9E",marginTop:5,flexShrink:0}} />
            <div>
              <div style={{fontFamily:"sans-serif",fontSize:12,color:"#212121"}}>{h.action}</div>
              <div style={{fontFamily:"sans-serif",fontSize:10,color:"#9E9E9E"}}>{u?.name||"?"} · {new Date(h.date).toLocaleString("fr-FR")}</div>
            </div>
          </div>;
        })}
      </Card>

      {/* Supprimer */}
      {(role.canCreate||role.canManageUsers)&&<button onClick={()=>{if(confirm("Supprimer ?"))onDelete();}} style={{background:"#fff",color:"#C62828",border:"1.5px solid #C62828",borderRadius:10,padding:"12px",fontFamily:"sans-serif",fontSize:13,cursor:"pointer"}}>Supprimer la tâche</button>}
    </div>
  </div>;
}

// ─── PEOPLE ───────────────────────────────────────────────────
function People({me,role,users,onSave,onBack}){
  const [adding,setAdding]=useState(false);
  const [name,setName]=useState("");
  const [userRole,setUserRole]=useState("menage");
  const [pin,setPin]=useState("");

  const add=()=>{
    if(!name.trim())return;
    const u=[...users,{id:Date.now().toString(36),name:name.trim(),role:userRole,pin:pin||""}];
    onSave(u);setName("");setPin("");setAdding(false);
  };
  const remove=(id)=>{
    if(id===me.id)return;
    if(confirm("Supprimer cet utilisateur ?")) onSave(users.filter(u=>u.id!==id));
  };

  return <div>
    <TopBar title="Utilisateurs" onBack={onBack} />
    <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:10}}>
      {users.map(u=>{
        const r=ROLES[u.role];
        return <div key={u.id} style={{background:"#fff",border:"1px solid #E0E0E0",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:r?.color||"#9E9E9E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{r?.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",color:"#1A1A1A"}}>{u.name}{u.id===me.id?" (moi)":""}</div>
            <div style={{fontFamily:"sans-serif",fontSize:12,color:"#9E9E9E"}}>{r?.label}</div>
          </div>
          {u.id!==me.id&&<button onClick={()=>remove(u.id)} style={{background:"none",border:"none",color:"#C62828",fontSize:18,cursor:"pointer"}}>×</button>}
        </div>;
      })}
      {!adding&&<button onClick={()=>setAdding(true)} style={{background:"#F1F8F1",border:"1.5px dashed #2E7D32",borderRadius:12,padding:"13px",color:"#2E7D32",fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",cursor:"pointer"}}>+ Ajouter un utilisateur</button>}
      {adding&&<Card title="Nouvel utilisateur">
        <F label="Nom"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Prénom" style={IS} /></F>
        <div style={{height:8}} />
        <F label="Rôle">
          <select value={userRole} onChange={e=>setUserRole(e.target.value)} style={IS}>
            {Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </F>
        <div style={{height:8}} />
        <F label="Code PIN (optionnel)"><input value={pin} onChange={e=>setPin(e.target.value)} placeholder="Ex: 1234" maxLength={6} inputMode="numeric" style={IS} /></F>
        <div style={{height:10}} />
        <div style={{display:"flex",gap:8}}>
          <button onClick={add} disabled={!name} style={{flex:1,background:name?"#2E7D32":"#BDBDBD",color:"#fff",border:"none",borderRadius:8,padding:"11px",fontFamily:"sans-serif",fontWeight:"bold",cursor:name?"pointer":"default"}}>Créer</button>
          <button onClick={()=>setAdding(false)} style={{flex:1,background:"#fff",color:"#424242",border:"1px solid #ddd",borderRadius:8,padding:"11px",fontFamily:"sans-serif",cursor:"pointer"}}>Annuler</button>
        </div>
      </Card>}
    </div>
  </div>;
}

// ─── PROFILE ──────────────────────────────────────────────────
function Profile({me,onLogout,onBack}){
  const r=ROLES[me.role];
  return <div>
    <TopBar title="Profil" onBack={onBack} />
    <div style={{padding:20,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
      <div style={{width:72,height:72,borderRadius:"50%",background:r.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{r.icon}</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:20,color:"#1A1A1A"}}>{me.name}</div>
      <Tag bg={r.color} label={r.label} />
      <button onClick={onLogout} style={{marginTop:20,background:"#fff",color:"#C62828",border:"1.5px solid #C62828",borderRadius:10,padding:"12px 30px",fontFamily:"sans-serif",fontSize:14,cursor:"pointer"}}>Changer d'utilisateur</button>
    </div>
  </div>;
}

// ─── SHARED COMPONENTS ────────────────────────────────────────
function Shell({children}){return <div style={{fontFamily:"Georgia,serif",background:"#F8F9FA",minHeight:"100vh",maxWidth:480,margin:"0 auto",position:"relative"}}>{children}</div>;}
function TopBar({title,onBack}){return <div style={{background:"#2E7D32",color:"#fff",padding:"14px 12px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}><button onClick={onBack} style={{background:"none",border:"none",color:"#fff",fontSize:22,cursor:"pointer",lineHeight:1,padding:0}}>←</button><div style={{fontSize:16,fontWeight:"bold",flex:1}}>{title}</div></div>;}
function Card({title,titleColor="#2E7D32",children}){return <div style={{background:"#fff",border:"1px solid #E0E0E0",borderRadius:12,padding:"12px"}}>{title&&<div style={{fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",color:titleColor,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>{title}</div>}{children}</div>;}
function StatCard({n,label,color,onClick}){return <button onClick={onClick} style={{background:"#fff",border:`1.5px solid ${color}20`,borderRadius:12,padding:"14px",textAlign:"center",cursor:"pointer",display:"block"}}><div style={{fontSize:28,fontWeight:"bold",color,fontFamily:"Georgia,serif"}}>{n}</div><div style={{fontFamily:"sans-serif",fontSize:11,color:"#757575",marginTop:2}}>{label}</div></button>;}
function Tag({bg,label}){return <span style={{background:bg,color:"#fff",borderRadius:6,padding:"2px 8px",fontSize:11,fontFamily:"sans-serif"}}>{label}</span>;}
function FilterChip({label,active,color,onClick,small}){return <button onClick={onClick} style={{flexShrink:0,padding:small?"3px 8px":"6px 11px",border:`1.5px solid ${active?color:"#E0E0E0"}`,borderRadius:20,background:active?color:"#fff",color:active?"#fff":color,fontSize:small?10:12,fontFamily:"sans-serif",cursor:"pointer",fontWeight:active?"bold":"normal"}}>{label}</button>;}
function SectionTitle({label,action,onAction}){return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"10px 0 6px"}}><div style={{fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",color:"#9E9E9E",letterSpacing:.5,textTransform:"uppercase"}}>{label}</div>{action&&<button onClick={onAction} style={{background:"none",border:"none",color:"#2E7D32",fontFamily:"sans-serif",fontSize:12,cursor:"pointer"}}>{action}</button>}</div>;}
function EmptyState({label,emoji="📭"}){return <div style={{textAlign:"center",color:"#9E9E9E",padding:"36px 20px",fontFamily:"sans-serif",fontSize:13}}><div style={{fontSize:28,marginBottom:6}}>{emoji}</div>{label}</div>;}
function ActionBtn({color,onClick,children}){return <button onClick={onClick} style={{width:"100%",background:color,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",cursor:"pointer"}}>{children}</button>;}
function AlertBanner({color,bg,icon,label,items,users,onOpen,isButton}){
  return <div style={{background:bg,border:`1.5px solid ${color}`,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
    <div style={{color,fontWeight:"bold",fontSize:13,marginBottom:isButton||items.length===0?0:6,fontFamily:"sans-serif",cursor:isButton?"pointer":"default"}} onClick={isButton?onOpen:undefined}>
      {icon} {label} {isButton&&"→"}
    </div>
    {items.map(t=><button key={t.id} onClick={()=>onOpen(t.id)} style={{width:"100%",background:"#fff",border:"none",borderRadius:8,padding:"7px 10px",marginBottom:4,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
      <div style={{fontFamily:"sans-serif",fontSize:13,fontWeight:"bold",color}}>{t.title}</div>
      <span style={{fontSize:12,color:"#9E9E9E"}}>›</span>
    </button>)}
  </div>;
}
function TaskRow({task,users,onOpen,showAssignee,highlight}){
  const assignee=users.find(u=>u.id===task.assignedTo);
  return <button onClick={()=>onOpen(task.id)} style={{width:"100%",background:highlight?"#F3E5F5":"#fff",border:"1px solid #E0E0E0",borderLeft:`4px solid ${PRIO_COLOR[task.priority]||"#9E9E9E"}`,borderRadius:10,padding:"10px 12px",marginBottom:7,textAlign:"left",cursor:"pointer",display:"block"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div style={{fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",color:"#1A1A1A",flex:1,marginRight:6}}>{task.title}</div>
      <span style={{background:STATUS_COLOR[task.status]||"#555",color:"#fff",borderRadius:7,padding:"2px 7px",fontSize:10,fontFamily:"sans-serif",flexShrink:0,whiteSpace:"nowrap"}}>{task.status}</span>
    </div>
    <div style={{fontFamily:"sans-serif",fontSize:11,color:"#757575",marginTop:3,display:"flex",gap:8,flexWrap:"wrap"}}>
      {showAssignee&&assignee&&<span>{ROLES[assignee.role]?.icon} {assignee.name}</span>}
      {task.photos.length>0&&<span>📷 {task.photos.length}</span>}
    </div>
  </button>;
}
function AIResult({r}){
  const c=r.priorite==="Urgente"?"#C62828":r.priorite==="Haute"?"#E65100":"#2E7D32";
  return <div style={{background:r.anomalies.length>0?"#FFF8E1":"#E8F5E9",borderRadius:8,padding:"9px 10px",marginBottom:8,border:`1px solid ${c}40`}}>
    <div style={{fontFamily:"sans-serif",fontSize:12,fontWeight:"bold",color:c,marginBottom:3}}>IA — {r.priorite} — {r.resume}</div>
    {r.anomalies.map((a,i)=><div key={i} style={{fontFamily:"sans-serif",fontSize:12,color:"#424242"}}>• {a}</div>)}
    {r.action&&<div style={{fontFamily:"sans-serif",fontSize:12,color:"#1565C0",marginTop:4}}>👉 {r.action}</div>}
  </div>;
}
function F({label,children}){return <div><div style={{fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",color:"#757575",letterSpacing:.5,textTransform:"uppercase",marginBottom:4}}>{label}</div>{children}</div>;}
function BottomNav({screen,me,role,toValidate,myTasks,onNav}){
  const items=[
    {id:"home",icon:"🏠",label:"Accueil"},
    {id:"mytasks",icon:"✅",label:"Mes tâches",badge:myTasks},
    ...(role.canValidate?[{id:"validate",icon:"🔍",label:"Valider",badge:toValidate}]:[]),
    ...(role.canCreate?[{id:"new",icon:"➕",label:"Créer"}]:[]),
    ...(role.canManageUsers?[{id:"people",icon:"👥",label:"Équipe"}]:[]),
    {id:"profile",icon:"👤",label:"Profil"},
  ];
  return <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #E0E0E0",display:"flex",zIndex:10}}>
    {items.map(n=>(
      <button key={n.id} onClick={()=>onNav(n.id)} style={{flex:1,border:"none",background:"none",padding:"7px 0",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,position:"relative"}}>
        <span style={{fontSize:18}}>{n.icon}</span>
        <span style={{fontFamily:"sans-serif",fontSize:9,color:screen===n.id?"#2E7D32":"#9E9E9E",fontWeight:screen===n.id?"bold":"normal"}}>{n.label}</span>
        {n.badge>0&&<div style={{position:"absolute",top:4,right:"15%",background:"#C62828",color:"#fff",borderRadius:8,padding:"1px 5px",fontSize:9,fontFamily:"sans-serif",fontWeight:"bold"}}>{n.badge}</div>}
      </button>
    ))}
  </div>;
}
const IS={width:"100%",border:"1px solid #ddd",borderRadius:8,padding:"9px 10px",fontSize:14,fontFamily:"sans-serif",boxSizing:"border-box",background:"#FAFAFA"};
