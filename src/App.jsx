import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

const ZONES_DEFAULT = [
  ...Array.from({length:306},(_,i)=>({id:`mh${i+1}`,name:`Mobile-home ${i+1}`,cat:"Hébergement",icon:"🏠"})),
  {id:"suite_a",name:"Suite A",cat:"Suites",icon:"⭐"},{id:"suite_b",name:"Suite B",cat:"Suites",icon:"⭐"},
  {id:"suite_c",name:"Suite C",cat:"Suites",icon:"⭐"},{id:"suite_d",name:"Suite D",cat:"Suites",icon:"⭐"},
  {id:"bar",name:"Bar",cat:"Restauration",icon:"🍺"},{id:"cuisine",name:"Cuisine",cat:"Restauration",icon:"👨‍🍳"},
  {id:"terrasse",name:"Terrasse",cat:"Restauration",icon:"☀️"},
  {id:"salle_reception1",name:"Salle de réception 1",cat:"Salles",icon:"🎊"},{id:"salle_reception2",name:"Salle de réception 2",cat:"Salles",icon:"🎊"},
  {id:"boite_nuit",name:"Boîte de nuit",cat:"Salles",icon:"🎵"},{id:"salle_ado",name:"Salle ados",cat:"Salles",icon:"🎮"},
  {id:"accueil",name:"Nouvel accueil",cat:"Bureaux",icon:"🛎️"},{id:"bureau",name:"Bureau",cat:"Bureaux",icon:"💼"},
  {id:"batiment2",name:"Bâtiment 2",cat:"Bureaux",icon:"🏢"},{id:"batiment3",name:"Bâtiment 3",cat:"Bureaux",icon:"🏢"},
  {id:"coiffure",name:"Salon de coiffure",cat:"Services",icon:"✂️"},{id:"laverie",name:"Laverie",cat:"Services",icon:"🧺"},
  {id:"local_vaisselle",name:"Local vaisselle",cat:"Services",icon:"🍽️"},{id:"fitness",name:"Fitness",cat:"Services",icon:"💪"},
  {id:"sanitaires",name:"Sanitaires",cat:"Sanitaires",icon:"🚿"},{id:"sanitaires_pmr",name:"Sanitaires handicapés",cat:"Sanitaires",icon:"♿"},
  {id:"wc_piscine",name:"WC Piscine",cat:"Sanitaires",icon:"🚽"},
  {id:"piscine",name:"Piscine",cat:"Piscine & Loisirs",icon:"🏊"},{id:"tobogan",name:"Tobogan",cat:"Piscine & Loisirs",icon:"🌊"},
  {id:"local_tobogan",name:"Local Tobogan",cat:"Piscine & Loisirs",icon:"🔧"},{id:"jeux_enfants",name:"Jeux enfants",cat:"Piscine & Loisirs",icon:"🎠"},
  {id:"tennis",name:"Tennis",cat:"Sports",icon:"🎾"},{id:"ping_pong",name:"Ping pong",cat:"Sports",icon:"🏓"},
  {id:"terrain_multi",name:"Terrain multisport",cat:"Sports",icon:"⚽"},{id:"petanque",name:"Pétanque",cat:"Sports",icon:"🎯"},
  {id:"locaux_tech",name:"Locaux techniques",cat:"Technique",icon:"🔧"},{id:"chateau_eau",name:"Château d'eau",cat:"Technique",icon:"💧"},
  {id:"station_epuration",name:"Station d'épuration",cat:"Technique",icon:"🏭"},
  {id:"marre",name:"Mare",cat:"Extérieur",icon:"🦆"},{id:"poubelles",name:"Poubelles",cat:"Extérieur",icon:"🗑️"},
  {id:"espace_vert",name:"Espace vert",cat:"Extérieur",icon:"🌿"},{id:"autres",name:"Autres",cat:"Extérieur",icon:"📍"},
];

const ROLES = {
  direction:      {label:"Direction",          color:"#2E7D32",icon:"👑",canCreate:true,canValidate:true,canReassign:true,canManageUsers:true,seeAll:true},
  qualite:        {label:"Contrôle qualité",   color:"#1565C0",icon:"🔍",canCreate:true,canValidate:true,canReassign:true,canManageUsers:false,seeAll:true},
  ctrl_technique: {label:"Contrôle technique", color:"#BF360C",icon:"🛠️",canCreate:true,canValidate:true,canReassign:true,canManageUsers:false,seeAll:true},
  technique:      {label:"Technique",          color:"#E65100",icon:"🔧",canCreate:true,canValidate:false,canReassign:false,canManageUsers:false,seeAll:false},
  menage:         {label:"Ménage",             color:"#6A1B9A",icon:"🧹",canCreate:true,canValidate:false,canReassign:false,canManageUsers:false,seeAll:false},
  accueil:        {label:"Accueil",            color:"#00838F",icon:"🛎️",canCreate:true,canValidate:false,canReassign:false,canManageUsers:false,seeAll:false},
};

const WORKFLOW    = ["À faire","En cours","À valider","Validée","Renvoyée"];
const DEFAULT_TASK_TYPES = ["Ménage","Technique","Administratif","Communication","Commercial","Tarif","Référencement","Entretien","Voitures","Relevés","Livraison","Terrasse","Électricité","Plomberie","Béton","Taille haie et tonte","Taille","Peinture","Lumière","Linge","Dalle","Nettoyage ext.","Fuite","Électroménager","Calage","Sortie d'hivernage","Clim","Hivernage","Autre"];
const PRIO_COLOR  = {Urgente:"#C62828",Haute:"#E65100",Normale:"#1565C0",Basse:"#5D4037"};
const STATUS_COLOR= {"À faire":"#F57F17","En cours":"#1565C0","À valider":"#6A1B9A","Validée":"#2E7D32","Renvoyée":"#C62828"};
const RECURRENCE  = [{v:"",l:"Aucune"},{v:"daily",l:"Tous les jours"},{v:"weekly",l:"Chaque semaine"},{v:"monthly",l:"Chaque mois"},{v:"yearly",l:"Chaque année"}];

// ─── UTILS ────────────────────────────────────────────────────
function isOverdue(task){
  if(!task.deadline || task.status==="Validée") return false;
  return new Date(task.deadline) < new Date(new Date().toDateString());
}
function formatDate(iso){
  if(!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"});
}
function nextOccurrence(deadline, recurrence){
  const d = new Date(deadline);
  if(recurrence==="daily")   d.setDate(d.getDate()+1);
  if(recurrence==="weekly")  d.setDate(d.getDate()+7);
  if(recurrence==="monthly") d.setMonth(d.getMonth()+1);
  if(recurrence==="yearly")  d.setFullYear(d.getFullYear()+1);
  return d.toISOString().split("T")[0];
}

// ─── IMAGE COMPRESSION ────────────────────────────────────────
function compressImage(file){
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const MAX=800; let w=img.width,h=img.height;
        if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
        if(h>MAX){w=Math.round(w*MAX/h);h=MAX;}
        const c=document.createElement("canvas");
        c.width=w;c.height=h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        resolve(c.toDataURL("image/jpeg",0.65));
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────
function askNotif(){if("Notification" in window&&Notification.permission==="default")Notification.requestPermission();}
function notif(t,b){if("Notification" in window&&Notification.permission==="granted")new Notification(t,{body:b});}

// ─── DB ───────────────────────────────────────────────────────
const db={
  async get(k){try{const{data,error}=await supabase.from("tasks").select("data").eq("id",k).maybeSingle();if(error||!data)return null;return data.data;}catch{return null;}},
  async set(k,v){try{await supabase.from("tasks").upsert({id:k,data:v,updated_at:new Date().toISOString()});}catch(e){console.error(e);}},
};

// ─── CLAUDE AI ────────────────────────────────────────────────
async function analyzePhoto(b64,zoneName){
  try{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,
        messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:b64}},
        {type:"text",text:`Analyse qualité camping 4★ zone:${zoneName}. JSON uniquement: {"anomalies":["max 2"],"priorite":"Urgente|Haute|Normale|Basse","resume":"1 phrase"} Si RAS: anomalies=[],priorite="Basse",resume="État satisfaisant"`}]}]})});
    const d=await r.json();
    return JSON.parse((d.content?.map(c=>c.text||"").join("")||"{}").replace(/```json|```/g,"").trim());
  }catch{return{anomalies:[],priorite:"Normale",resume:"Analyse indisponible"};}
}

// ─── ROOT ─────────────────────────────────────────────────────
export default function App(){
  const [users,setUsers]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [taskTypes,setTaskTypes]=useState(DEFAULT_TASK_TYPES);
  const [me,setMe]=useState(null);
  const [ready,setReady]=useState(false);
  const [screen,setScreen]=useState("login");
  const [taskId,setTaskId]=useState(null);

  useEffect(()=>{
    (async()=>{
      let u=await db.get("users_v1");
      let t=await db.get("tasks_v1");
      let tt=await db.get("tasktypes_v1");
      if(!u){u=[{id:"u0",name:"Céline",role:"direction",pin:""}];await db.set("users_v1",u);}
      setUsers(u);
      if(tt) setTaskTypes(tt);
      if(t){
        // Créer les occurrences récurrentes si échues
        t=spawnRecurring(t);
        setTasks(t);
      }
      setReady(true);
    })();
  },[]);

  function spawnRecurring(taskList){
    const today=new Date().toDateString();
    const newTasks=[];
    taskList.forEach(t=>{
      if(t.recurrence && t.recurrence!=="none" && t.status==="Validée" && t.deadline){
        const next=nextOccurrence(t.deadline,t.recurrence);
        const alreadyExists=taskList.some(x=>x.parentId===t.id&&x.deadline===next);
        if(!alreadyExists && new Date(next)<=new Date(today)){
          newTasks.push({...t,id:Date.now().toString(36)+Math.random().toString(36).slice(2,4),
            status:"À faire",deadline:next,parentId:t.id,
            createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
            photos:[],history:[{date:new Date().toISOString(),by:"system",action:`🔄 Occurrence récurrente (${RECURRENCE.find(r=>r.v===t.recurrence)?.l})`}]});
        }
      }
    });
    if(newTasks.length>0){
      const merged=[...taskList,...newTasks];
      db.set("tasks_v1",merged);
      return merged;
    }
    return taskList;
  }

  const saveUsers=async u=>{setUsers(u);await db.set("users_v1",u);};
  const saveTaskTypes=async tt=>{setTaskTypes(tt);await db.set("tasktypes_v1",tt);};
  const saveTasks=async(t,newT)=>{
    setTasks(t);await db.set("tasks_v1",t);
    if(newT){const who=users.find(u=>u.id===newT.assignedTo)?.name||"vous";notif("🏕️ Nouvelle tâche",`${newT.title} — ${who}`);}
  };

  // Réorganiser (direction uniquement)
  const moveTask=(id,dir)=>{
    const idx=tasks.findIndex(t=>t.id===id);
    if(idx<0)return;
    const arr=[...tasks];
    const swap=idx+dir;
    if(swap<0||swap>=arr.length)return;
    [arr[idx],arr[swap]]=[arr[swap],arr[idx]];
    saveTasks(arr);
  };

  const openTask=id=>{setTaskId(id);setScreen("task");};

  if(!ready)return<Splash/>;
  if(!me)return<Login users={users} onLogin={u=>{askNotif();setMe(u);setScreen("home");}}/>;

  const role=ROLES[me.role]||ROLES.accueil;
  const myTasks=tasks.filter(t=>t.assignedTo===me.id);
  const toValidate=tasks.filter(t=>t.status==="À valider");
  const currentTask=tasks.find(t=>t.id===taskId);

  return(
    <Shell>
      {screen==="home"     &&<Home me={me} role={role} tasks={tasks} myTasks={myTasks} toValidate={toValidate} users={users} onOpen={openTask} onNav={setScreen}/>}
      {screen==="dashboard"&&role.canManageUsers&&<Dashboard tasks={tasks} users={users} onOpen={openTask} onBack={()=>setScreen("home")}/>}
      {screen==="mytasks"  &&<MyTasks me={me} role={role} tasks={myTasks} users={users} onOpen={openTask} onBack={()=>setScreen("home")}/>}
      {screen==="all"      &&role.seeAll&&<AllTasks me={me} role={role} tasks={tasks} users={users} onOpen={openTask} onBack={()=>setScreen("home")} onMove={role.canManageUsers?moveTask:null}/>}
      {screen==="validate" &&role.canValidate&&<ToValidate tasks={toValidate} users={users} onOpen={openTask} onBack={()=>setScreen("home")}/>}
      {screen==="new"      &&<NewTask me={me} role={role} users={users} zones={ZONES_DEFAULT} taskTypes={taskTypes} onSave={async t=>{await saveTasks([t,...tasks],t);setScreen("home");}} onBack={()=>setScreen("home")}/>}
      {screen==="tasktypes"&&role.canManageUsers&&<TaskTypesManager taskTypes={taskTypes} onSave={saveTaskTypes} onBack={()=>setScreen("home")}/>}
      {screen==="task"&&currentTask&&
        <TaskDetail task={currentTask} me={me} role={role} users={users} zones={ZONES_DEFAULT} taskTypes={taskTypes}
          onSave={async t=>await saveTasks(tasks.map(x=>x.id===t.id?t:x))}
          onDelete={async()=>{await saveTasks(tasks.filter(x=>x.id!==currentTask.id));setScreen("home");}}
          onBack={()=>setScreen("home")}/>}
      {screen==="people"&&role.canManageUsers&&<People me={me} users={users} onSave={saveUsers} onBack={()=>setScreen("home")} onNavTypes={()=>setScreen("tasktypes")}/>}
      {screen==="profile"&&<Profile me={me} onLogout={()=>{setMe(null);setScreen("login");}} onBack={()=>setScreen("home")}/>}
      <BottomNav screen={screen} role={role} toValidate={toValidate.length} myTasks={myTasks.filter(t=>t.status!=="Validée").length} onNav={setScreen}/>
    </Shell>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────
function Splash(){return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",flexDirection:"column",gap:10,background:"#F8F9FA",fontFamily:"Georgia,serif",color:"#2E7D32"}}><div style={{fontSize:40}}>🏕️</div><div style={{fontSize:20}}>Parc de la Chesnaie</div><div style={{fontSize:12,color:"#9E9E9E",fontFamily:"sans-serif"}}>Chargement…</div></div>;}

// ─── LOGIN ────────────────────────────────────────────────────
function Login({users,onLogin}){
  const [sel,setSel]=useState(null);
  const [pin,setPin]=useState("");
  const [err,setErr]=useState("");
  const choose=u=>{if(!u.pin){onLogin(u);return;}setSel(u);setPin("");setErr("");};
  const confirm=()=>{if(pin!==sel.pin){setErr("Code incorrect");return;}onLogin(sel);};
  return(
    <div style={{minHeight:"100vh",background:"#F8F9FA",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{fontSize:44,marginBottom:8}}>🏕️</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:22,color:"#2E7D32",marginBottom:4}}>Parc de la Chesnaie</div>
      <div style={{fontFamily:"sans-serif",fontSize:13,color:"#9E9E9E",marginBottom:28}}>Qui êtes-vous ?</div>
      {!sel?(
        <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:8}}>
          {users.map(u=>{const r=ROLES[u.role];return(
            <button key={u.id} onClick={()=>choose(u)} style={{background:"#fff",border:"2px solid #E0E0E0",borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:r?.color||"#9E9E9E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{r?.icon||"👤"}</div>
              <div><div style={{fontFamily:"Georgia,serif",fontSize:16,color:"#1A1A1A"}}>{u.name}</div><div style={{fontFamily:"sans-serif",fontSize:12,color:"#9E9E9E"}}>{r?.label}</div></div>
            </button>);})}
        </div>
      ):(
        <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column",gap:12,alignItems:"center"}}>
          <div style={{fontFamily:"sans-serif",fontSize:14,color:"#424242"}}>Bonjour {sel.name}</div>
          <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={e=>setPin(e.target.value)} placeholder="Code PIN" autoFocus onKeyDown={e=>e.key==="Enter"&&confirm()} style={{width:"100%",border:"2px solid #ddd",borderRadius:10,padding:"12px",fontSize:22,textAlign:"center",letterSpacing:10,fontFamily:"sans-serif",boxSizing:"border-box"}}/>
          {err&&<div style={{color:"#C62828",fontFamily:"sans-serif",fontSize:13}}>{err}</div>}
          <button onClick={confirm} style={{width:"100%",background:"#2E7D32",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontSize:15,fontFamily:"sans-serif",fontWeight:"bold",cursor:"pointer"}}>Connexion</button>
          <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:"#9E9E9E",fontFamily:"sans-serif",fontSize:13,cursor:"pointer"}}>← Retour</button>
        </div>
      )}
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────
function Home({me,role,tasks,myTasks,toValidate,users,onOpen,onNav}){
  const urgentes=tasks.filter(t=>t.priority==="Urgente"&&t.status!=="Validée");
  const renvoyes=myTasks.filter(t=>t.status==="Renvoyée");
  const enRetard=myTasks.filter(t=>isOverdue(t));
  const actives=myTasks.filter(t=>t.status!=="Validée");
  return(
    <div style={{paddingBottom:72}}>
      <div style={{background:role.color,color:"#fff",padding:"18px 16px 14px"}}>
        <div style={{fontSize:11,opacity:.7,fontFamily:"sans-serif"}}>Parc de la Chesnaie</div>
        <div style={{fontSize:21,fontWeight:"bold"}}>Bonjour, {me.name} {role.icon}</div>
        <div style={{fontSize:12,opacity:.7,fontFamily:"sans-serif",marginTop:2}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})}</div>
      </div>
      <div style={{padding:"12px"}}>
        {enRetard.length>0&&<Banner color="#C62828" bg="#FFEBEE" icon="⏰" text={`${enRetard.length} tâche(s) en retard !`} onClick={()=>onNav("mytasks")}/>}
        {renvoyes.length>0&&<Banner color="#C62828" bg="#FFEBEE" icon="🔄" text={`${renvoyes.length} tâche(s) renvoyée(s)`} onClick={()=>onNav("mytasks")}/>}
        {role.canValidate&&toValidate.length>0&&<Banner color="#6A1B9A" bg="#F3E5F5" icon="🔍" text={`${toValidate.length} en attente de validation`} onClick={()=>onNav("validate")}/>}
        {urgentes.length>0&&<Banner color="#C62828" bg="#FFEBEE" icon="🚨" text={`${urgentes.length} tâche(s) urgente(s)`} onClick={()=>onNav(role.seeAll?"all":"mytasks")}/>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"10px 0"}}>
          <StatCard n={actives.length} label="Mes tâches" color={role.color} onClick={()=>onNav("mytasks")}/>
          {role.canValidate&&<StatCard n={toValidate.length} label="À valider" color="#6A1B9A" onClick={()=>onNav("validate")}/>}
          {role.seeAll&&<StatCard n={tasks.filter(t=>t.status!=="Validée").length} label="Total ouvertes" color="#424242" onClick={()=>onNav("all")}/>}
          {role.canManageUsers&&<StatCard n={tasks.filter(t=>isOverdue(t)).length} label="En retard" color="#C62828" onClick={()=>onNav("dashboard")}/>}
        </div>
        <SectionLabel text="MES TÂCHES RÉCENTES" action="Tout voir" onAction={()=>onNav("mytasks")}/>
        {actives.length===0&&<Empty label="Aucune tâche en cours"/>}
        {actives.slice(0,5).map(t=><TRow key={t.id} task={t} users={users} onOpen={onOpen}/>)}
      </div>
    </div>
  );
}

// ─── DASHBOARD (direction) ────────────────────────────────────
function Dashboard({tasks,users,onOpen,onBack}){
  const active=tasks.filter(t=>t.status!=="Validée");
  const overdue=tasks.filter(t=>isOverdue(t));
  const byStatus=WORKFLOW.map(s=>({s,n:tasks.filter(t=>t.status===s).length}));
  const maxN=Math.max(...byStatus.map(x=>x.n),1);
  const byUser=users.map(u=>({u,n:tasks.filter(t=>t.assignedTo===u.id&&t.status!=="Validée").length})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
  const recurring=tasks.filter(t=>t.recurrence&&t.recurrence!=="none"&&t.recurrence!=="");
  const upcoming=active.filter(t=>t.deadline).sort((a,b)=>new Date(a.deadline)-new Date(b.deadline)).slice(0,5);

  return(
    <div style={{paddingBottom:72}}>
      <TopBar title="📊 Dashboard Direction" onBack={onBack}/>
      <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:14}}>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          <KPI n={active.length} label="Ouvertes" color="#1565C0"/>
          <KPI n={overdue.length} label="En retard" color="#C62828"/>
          <KPI n={recurring.length} label="Récurrentes" color="#E65100"/>
        </div>

        {/* Statuts */}
        <Card title="Répartition par statut">
          {byStatus.map(({s,n})=>(
            <div key={s} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontFamily:"sans-serif",fontSize:12,marginBottom:3}}>
                <span style={{color:STATUS_COLOR[s]||"#555",fontWeight:"bold"}}>{s}</span>
                <span style={{color:"#9E9E9E"}}>{n}</span>
              </div>
              <div style={{background:"#F0F0F0",borderRadius:4,height:8,overflow:"hidden"}}>
                <div style={{background:STATUS_COLOR[s]||"#9E9E9E",width:`${(n/maxN)*100}%`,height:"100%",borderRadius:4,transition:"width .3s"}}/>
              </div>
            </div>
          ))}
        </Card>

        {/* Par personne */}
        {byUser.length>0&&<Card title="Tâches actives par personne">
          {byUser.map(({u,n})=>{
            const r=ROLES[u.role];
            return<div key={u.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:r?.color||"#9E9E9E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{r?.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"sans-serif",fontSize:12,fontWeight:"bold",color:"#1A1A1A",marginBottom:2}}>{u.name}</div>
                <div style={{background:"#F0F0F0",borderRadius:4,height:6,overflow:"hidden"}}>
                  <div style={{background:r?.color||"#9E9E9E",width:`${Math.min((n/10)*100,100)}%`,height:"100%",borderRadius:4}}/>
                </div>
              </div>
              <div style={{fontFamily:"sans-serif",fontSize:13,fontWeight:"bold",color:r?.color||"#555",width:20,textAlign:"right"}}>{n}</div>
            </div>;
          })}
        </Card>}

        {/* En retard */}
        {overdue.length>0&&<Card title="⏰ En retard" titleColor="#C62828">
          {overdue.slice(0,5).map(t=><TRow key={t.id} task={t} users={users} onOpen={onOpen} showAssignee overdue/>)}
          {overdue.length>5&&<div style={{fontFamily:"sans-serif",fontSize:12,color:"#9E9E9E",textAlign:"center",marginTop:4}}>+{overdue.length-5} autres</div>}
        </Card>}

        {/* Prochaines deadlines */}
        {upcoming.length>0&&<Card title="📅 Prochaines échéances">
          {upcoming.map(t=>{
            const od=isOverdue(t);
            return<div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F0F0F0",cursor:"pointer"}} onClick={()=>onOpen(t.id)}>
              <div style={{fontFamily:"sans-serif",fontSize:13,color:"#1A1A1A",flex:1,marginRight:8}}>{t.title}</div>
              <div style={{fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",color:od?"#C62828":"#E65100",whiteSpace:"nowrap"}}>{od?"⏰ ":"📅 "}{formatDate(t.deadline)}</div>
            </div>;
          })}
        </Card>}

        {/* Récurrentes */}
        {recurring.length>0&&<Card title="🔄 Tâches récurrentes">
          {recurring.map(t=>{
            const rl=RECURRENCE.find(r=>r.v===t.recurrence)?.l||"";
            return<div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F0F0F0",cursor:"pointer"}} onClick={()=>onOpen(t.id)}>
              <div>
                <div style={{fontFamily:"sans-serif",fontSize:13,fontWeight:"bold",color:"#1A1A1A"}}>{t.title}</div>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:"#9E9E9E"}}>{rl} · {t.status}</div>
              </div>
              {t.deadline&&<div style={{fontFamily:"sans-serif",fontSize:11,color:"#E65100"}}>📅 {formatDate(t.deadline)}</div>}
            </div>;
          })}
        </Card>}
      </div>
    </div>
  );
}

// ─── MY TASKS ─────────────────────────────────────────────────
function MyTasks({me,role,tasks,users,onOpen,onBack}){
  const [f,setF]=useState("actives");
  const actives=tasks.filter(t=>t.status!=="Validée");
  const validees=tasks.filter(t=>t.status==="Validée");
  const shown=f==="actives"?actives:validees;
  return(
    <div style={{paddingBottom:72}}>
      <TopBar title="Mes tâches" onBack={onBack}/>
      <div style={{display:"flex",gap:6,padding:"8px 12px",background:"#fff",borderBottom:"1px solid #eee"}}>
        <Chip label={`Actives (${actives.length})`} active={f==="actives"} color={role.color} onClick={()=>setF("actives")}/>
        <Chip label={`Validées (${validees.length})`} active={f==="validees"} color="#2E7D32" onClick={()=>setF("validees")}/>
      </div>
      <div style={{padding:"10px 12px"}}>
        {shown.length===0&&<Empty label="Aucune tâche"/>}
        {shown.map(t=><TRow key={t.id} task={t} users={users} onOpen={onOpen} overdue={isOverdue(t)}/>)}
      </div>
    </div>
  );
}

// ─── ALL TASKS ────────────────────────────────────────────────
function AllTasks({me,role,tasks,users,onOpen,onBack,onMove}){
  const [fS,setFS]=useState("Tous");
  const [fU,setFU]=useState("Tous");
  const shown=tasks.filter(t=>{
    const sOk=fS==="Tous"||t.status===fS;
    const uOk=fU==="Tous"||t.assignedTo===fU;
    return sOk&&uOk;
  });
  return(
    <div style={{paddingBottom:72}}>
      <TopBar title="Toutes les tâches" onBack={onBack}/>
      <div style={{padding:"6px 12px",background:"#fff",borderBottom:"1px solid #eee",display:"flex",gap:5,overflowX:"auto"}}>
        {["Tous",...WORKFLOW].map(s=><Chip key={s} label={s} active={fS===s} color={STATUS_COLOR[s]||"#555"} onClick={()=>setFS(s)}/>)}
      </div>
      <div style={{padding:"6px 12px",background:"#fff",borderBottom:"1px solid #eee",display:"flex",gap:5,overflowX:"auto"}}>
        <Chip label="Tous" active={fU==="Tous"} color="#555" onClick={()=>setFU("Tous")}/>
        {users.map(u=><Chip key={u.id} label={u.name} active={fU===u.id} color={ROLES[u.role]?.color||"#555"} onClick={()=>setFU(u.id)}/>)}
      </div>
      <div style={{padding:"10px 12px"}}>
        {shown.length===0&&<Empty label="Aucune tâche"/>}
        {shown.map((t,i)=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:4}}>
            {onMove&&<div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
              <button onClick={()=>onMove(t.id,-1)} style={{background:"#E8F5E9",border:"none",borderRadius:4,padding:"3px 6px",cursor:"pointer",color:"#2E7D32",fontSize:12}}>▲</button>
              <button onClick={()=>onMove(t.id,1)}  style={{background:"#E8F5E9",border:"none",borderRadius:4,padding:"3px 6px",cursor:"pointer",color:"#2E7D32",fontSize:12}}>▼</button>
            </div>}
            <div style={{flex:1}}><TRow task={t} users={users} onOpen={onOpen} showAssignee overdue={isOverdue(t)}/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TO VALIDATE ──────────────────────────────────────────────
function ToValidate({tasks,users,onOpen,onBack}){
  return(
    <div style={{paddingBottom:72}}>
      <TopBar title={`À valider (${tasks.length})`} onBack={onBack}/>
      <div style={{padding:"10px 12px"}}>
        {tasks.length===0&&<Empty label="Rien à valider ✅" emoji="✅"/>}
        {tasks.map(t=><TRow key={t.id} task={t} users={users} onOpen={onOpen} showAssignee highlight/>)}
      </div>
    </div>
  );
}

// ─── NEW TASK ─────────────────────────────────────────────────
function NewTask({me,role,users,zones,taskTypes,onSave,onBack}){
  const [title,setTitle]=useState("");
  const [type,setType]=useState("");
  const [zoneId,setZoneId]=useState("");
  const [catF,setCatF]=useState("Tous");
  const [priority,setPrio]=useState("Normale");
  const [assignedTo,setAss]=useState("");
  const [desc,setDesc]=useState("");
  const [deadline,setDeadline]=useState("");
  const [recurrence,setRec]=useState("");
  const cats=["Tous",...new Set(zones.map(z=>z.cat))];
  const fzones=catF==="Tous"?zones:zones.filter(z=>z.cat===catF);
  const save=()=>{
    if(!title.trim()||!zoneId)return;
    onSave({
      id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),
      title:title.trim(),type,zoneId,priority,desc,
      assignedTo:assignedTo||me.id,createdBy:me.id,
      status:"À faire",deadline:deadline||null,recurrence:recurrence||null,
      createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
      photos:[],history:[{date:new Date().toISOString(),by:me.id,action:"Tâche créée"}],
    });
  };
  return(
    <div style={{paddingBottom:20}}>
      <TopBar title="Nouvelle tâche" onBack={onBack}/>
      <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:14}}>
        <Fld label="Titre *"><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex : Réception TV défaillante" style={IS}/></Fld>
        <Fld label="Type de tâche">
          <select value={type} onChange={e=>setType(e.target.value)} style={IS}>
            <option value="">-- Choisir --</option>
            {taskTypes.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </Fld>
        <Fld label="Zone *">
          <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4,marginBottom:4}}>
            {cats.map(c=><Chip key={c} label={c} active={catF===c} color="#2E7D32" small onClick={()=>setCatF(c)}/>)}
          </div>
          <select value={zoneId} onChange={e=>setZoneId(e.target.value)} style={IS}>
            <option value="">-- Choisir une zone --</option>
            {fzones.map(z=><option key={z.id} value={z.id}>{z.icon} {z.name}</option>)}
          </select>
        </Fld>
        <Fld label="Priorité">
          <div style={{display:"flex",gap:6}}>
            {["Urgente","Haute","Normale","Basse"].map(p=>(
              <button key={p} onClick={()=>setPrio(p)} style={{flex:1,padding:"9px 2px",border:`2px solid ${priority===p?PRIO_COLOR[p]:"#ddd"}`,borderRadius:8,background:priority===p?PRIO_COLOR[p]:"#fff",color:priority===p?"#fff":PRIO_COLOR[p],fontSize:11,fontFamily:"sans-serif",fontWeight:"bold",cursor:"pointer"}}>{p}</button>
            ))}
          </div>
        </Fld>
        <Fld label="Assigné à">
          <select value={assignedTo} onChange={e=>setAss(e.target.value)} style={IS}>
            <option value="">-- Moi-même --</option>
            {users.map(u=><option key={u.id} value={u.id}>{ROLES[u.role]?.icon} {u.name} ({ROLES[u.role]?.label})</option>)}
          </select>
        </Fld>
        <Fld label="📅 Date limite (deadline)">
          <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={IS}/>
        </Fld>
        {role.canManageUsers&&<Fld label="🔄 Récurrence">
          <select value={recurrence} onChange={e=>setRec(e.target.value)} style={IS}>
            {RECURRENCE.map(r=><option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
        </Fld>}
        <Fld label="Description"><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Contexte, détails…" style={{...IS,resize:"vertical"}}/></Fld>
        <button onClick={save} disabled={!title.trim()||!zoneId} style={{background:title.trim()&&zoneId?"#2E7D32":"#BDBDBD",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontFamily:"sans-serif",fontSize:15,fontWeight:"bold",cursor:title.trim()&&zoneId?"pointer":"default"}}>
          Créer la tâche
        </button>
      </div>
    </div>
  );
}

// ─── TASK DETAIL ──────────────────────────────────────────────
function TaskDetail({task,me,role,users,zones,taskTypes,onSave,onDelete,onBack}){
  const zone=zones.find(z=>z.id===task.zoneId);
  const assignee=users.find(u=>u.id===task.assignedTo);
  const isMe=task.assignedTo===me.id;
  const [photos,setPhotos]=useState([...(task.photos||[])]);
  const [note,setNote]=useState("");
  const [rejectMsg,setRejectMsg]=useState("");
  const [reassignTo,setReassignTo]=useState("");
  const [analyzing,setAnalyzing]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const [editDeadline,setEditDeadline]=useState(false);
  const [newDeadline,setNewDeadline]=useState(task.deadline||"");
  const fileRef=useRef();

  useEffect(()=>{setPhotos([...(task.photos||[])]);setNewDeadline(task.deadline||"");},[task.updatedAt]);

  const update=(patch,histAction)=>{
    const updated={...task,...patch,updatedAt:new Date().toISOString(),
      history:[...(task.history||[]),{date:new Date().toISOString(),by:me.id,action:histAction}]};
    onSave(updated);
  };

  const setStatus=s=>update({status:s},`Statut → ${s}`);
  const validate=()=>update({status:"Validée",validatedBy:me.id},`✅ Validé par ${me.name}`);
  const addNote=()=>{if(!note.trim())return;update({history:[...(task.history||[]),{date:new Date().toISOString(),by:me.id,action:`💬 ${note}`}]},`💬 ${note}`);setNote("");};
  const reject=()=>{if(!rejectMsg.trim())return;update({status:"Renvoyée",rejectReason:rejectMsg},`🔄 Renvoyé — ${rejectMsg}`);setRejectMsg("");};
  const reassign=()=>{if(!reassignTo)return;const who=users.find(u=>u.id===reassignTo)?.name||"?";update({assignedTo:reassignTo,status:"À faire"},`📤 Réassigné à ${who}`);setReassignTo("");};
  const saveDeadline=()=>{update({deadline:newDeadline||null},`📅 Deadline → ${newDeadline?formatDate(newDeadline):"supprimée"}`);setEditDeadline(false);};

  const handlePhoto=async e=>{
    const file=e.target.files[0];if(!file)return;
    e.target.value="";setAnalyzing(true);setAiResult(null);
    try{
      const compressed=await compressImage(file);
      const b64=compressed.split(",")[1];
      const ai=await analyzePhoto(b64,zone?.name||task.zoneId);
      setAiResult(ai);
      const newPhoto={date:new Date().toISOString(),url:compressed,by:me.id,analysis:ai};
      const newPhotos=[...photos,newPhoto];
      setPhotos(newPhotos);
      const patch={photos:newPhotos};
      if((ai.priorite==="Urgente"||ai.priorite==="Haute")&&task.priority==="Normale")patch.priority=ai.priorite;
      update(patch,`📷 Photo ajoutée — ${ai.resume}`);
    }finally{setAnalyzing(false);}
  };

  const deletePhoto=i=>{
    if(!confirm("Supprimer cette photo ?"))return;
    const np=photos.filter((_,idx)=>idx!==i);
    setPhotos(np);update({photos:np},"🗑 Photo supprimée");
  };

  const overdue=isOverdue(task);
  const canPhoto=isMe||role.canValidate;
  const canStart=isMe&&task.status==="À faire";
  const canSendVal=isMe&&task.status!=="À valider"&&task.status!=="Validée";
  const canValidate=role.canValidate&&task.status==="À valider";

  return(
    <div style={{paddingBottom:24}}>
      <TopBar title="Détail de la tâche" onBack={onBack}/>
      <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:10}}>

        {/* Infos */}
        <Card>
          {overdue&&<div style={{background:"#FFEBEE",borderRadius:6,padding:"6px 10px",marginBottom:8,fontFamily:"sans-serif",fontSize:12,fontWeight:"bold",color:"#C62828"}}>⏰ TÂCHE EN RETARD — échéance {formatDate(task.deadline)}</div>}
          <div style={{fontSize:17,fontWeight:"bold",color:"#1A1A1A",marginBottom:4}}>{task.title}</div>
          <div style={{fontFamily:"sans-serif",fontSize:12,color:"#757575",marginBottom:8}}>
            {zone?.icon} {zone?.name}
            {task.type&&<span style={{marginLeft:8,background:"#E3F2FD",color:"#1565C0",borderRadius:4,padding:"1px 7px",fontWeight:"bold",fontFamily:"sans-serif",fontSize:11}}>{task.type}</span>}
            {task.recurrence&&task.recurrence!=="none"&&<span style={{marginLeft:6,background:"#FFF3E0",color:"#E65100",borderRadius:4,padding:"1px 7px",fontWeight:"bold",fontFamily:"sans-serif",fontSize:11}}>🔄 {RECURRENCE.find(r=>r.v===task.recurrence)?.l}</span>}
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            <Tag bg={PRIO_COLOR[task.priority]||"#9E9E9E"} label={task.priority}/>
            <Tag bg={STATUS_COLOR[task.status]||"#9E9E9E"} label={task.status}/>
            {assignee&&<Tag bg={ROLES[assignee.role]?.color||"#9E9E9E"} label={`👤 ${assignee.name}`}/>}
          </div>

          {/* Deadline */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
            {task.deadline&&!editDeadline&&<span style={{fontFamily:"sans-serif",fontSize:12,color:overdue?"#C62828":"#E65100",fontWeight:"bold"}}>📅 {formatDate(task.deadline)}</span>}
            {!task.deadline&&!editDeadline&&<span style={{fontFamily:"sans-serif",fontSize:12,color:"#BDBDBD"}}>Pas de deadline</span>}
            <button onClick={()=>setEditDeadline(!editDeadline)} style={{background:"#F5F5F5",border:"none",borderRadius:6,padding:"3px 8px",fontFamily:"sans-serif",fontSize:11,cursor:"pointer",color:"#424242"}}>
              {editDeadline?"Annuler":"✏️ Modifier"}
            </button>
          </div>
          {editDeadline&&<div style={{display:"flex",gap:8,marginTop:6}}>
            <input type="date" value={newDeadline} onChange={e=>setNewDeadline(e.target.value)} style={{...IS,flex:1}}/>
            <button onClick={saveDeadline} style={{background:"#2E7D32",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontFamily:"sans-serif",fontWeight:"bold",cursor:"pointer"}}>OK</button>
          </div>}

          {task.desc&&<div style={{marginTop:8,fontFamily:"sans-serif",fontSize:13,color:"#424242",lineHeight:1.5}}>{task.desc}</div>}
          {task.rejectReason&&<div style={{marginTop:8,background:"#FFEBEE",borderRadius:8,padding:"8px 10px",fontFamily:"sans-serif",fontSize:12,color:"#C62828"}}>🔄 Renvoyée : {task.rejectReason}</div>}
        </Card>

        {/* Statut bandeaux */}
        {task.status==="À valider"&&<div style={{background:"#F3E5F5",border:"2px solid #6A1B9A",borderRadius:10,padding:"14px",textAlign:"center"}}>
          <div style={{fontSize:24,marginBottom:4}}>⏳</div>
          <div style={{fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",color:"#6A1B9A"}}>En attente de validation</div>
          <div style={{fontFamily:"sans-serif",fontSize:12,color:"#9E9E9E",marginTop:2}}>La direction va vérifier votre travail</div>
        </div>}
        {task.status==="Validée"&&<div style={{background:"#E8F5E9",border:"2px solid #2E7D32",borderRadius:10,padding:"14px",textAlign:"center"}}>
          <div style={{fontSize:24,marginBottom:4}}>✅</div>
          <div style={{fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",color:"#2E7D32"}}>Tâche validée !</div>
        </div>}

        {canStart&&<Btn color="#1565C0" onClick={()=>setStatus("En cours")}>▶ Commencer la tâche</Btn>}
        {canSendVal&&<Btn color="#6A1B9A" onClick={()=>setStatus("À valider")}>📤 Envoyer en validation</Btn>}

        {/* Validation */}
        {canValidate&&<Card title="🔍 Validation" titleColor="#6A1B9A">
          <button onClick={validate} style={{width:"100%",background:"#2E7D32",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",cursor:"pointer",marginBottom:10}}>✅ Valider</button>
          <div style={{fontFamily:"sans-serif",fontSize:12,color:"#757575",marginBottom:6}}>Renvoyer avec motif :</div>
          <div style={{display:"flex",gap:8}}>
            <input value={rejectMsg} onChange={e=>setRejectMsg(e.target.value)} placeholder="Ex: SDB pas terminée" style={{...IS,flex:1}}/>
            <button onClick={reject} style={{background:"#C62828",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontFamily:"sans-serif",fontWeight:"bold",cursor:"pointer"}}>🔄</button>
          </div>
        </Card>}

        {/* Réassigner */}
        {role.canReassign&&<Card title="📤 Réassigner">
          <div style={{display:"flex",gap:8}}>
            <select value={reassignTo} onChange={e=>setReassignTo(e.target.value)} style={{...IS,flex:1}}>
              <option value="">-- Choisir --</option>
              {users.map(u=><option key={u.id} value={u.id}>{ROLES[u.role]?.icon} {u.name}</option>)}
            </select>
            <button onClick={reassign} disabled={!reassignTo} style={{background:reassignTo?"#2E7D32":"#BDBDBD",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontFamily:"sans-serif",fontWeight:"bold",cursor:reassignTo?"pointer":"default"}}>OK</button>
          </div>
        </Card>}

        {/* Photos */}
        <Card title={`📷 Photos (${photos.length})`}>
          <input type="file" accept="image/*" capture="environment" ref={fileRef} onChange={handlePhoto} style={{display:"none"}}/>
          {canPhoto&&<button onClick={()=>fileRef.current.click()} disabled={analyzing} style={{width:"100%",padding:"13px",border:"2px dashed #2E7D32",borderRadius:8,background:analyzing?"#F5F5F5":"#F1F8F1",color:"#2E7D32",fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",cursor:analyzing?"default":"pointer",marginBottom:12}}>
            {analyzing?"🔍 Analyse en cours…":"📷 Prendre / ajouter une photo"}
          </button>}
          {aiResult&&<div style={{background:aiResult.anomalies?.length>0?"#FFF8E1":"#E8F5E9",borderRadius:8,padding:"10px",marginBottom:10,border:"1px solid #E0E0E0"}}>
            <div style={{fontFamily:"sans-serif",fontSize:12,fontWeight:"bold",color:PRIO_COLOR[aiResult.priorite]||"#2E7D32",marginBottom:4}}>IA — {aiResult.priorite} — {aiResult.resume}</div>
            {aiResult.anomalies?.map((a,i)=><div key={i} style={{fontFamily:"sans-serif",fontSize:12,color:"#424242"}}>• {a}</div>)}
          </div>}
          {photos.length===0&&<div style={{textAlign:"center",color:"#BDBDBD",fontFamily:"sans-serif",fontSize:13,padding:"16px 0"}}>Aucune photo</div>}
          {photos.map((p,i)=>{
            const who=users.find(u=>u.id===p.by)?.name||"?";
            const mine=p.by===me.id&&task.status!=="Validée";
            return(
              <div key={i} style={{background:"#F8F9FA",borderRadius:10,border:"1px solid #E0E0E0",overflow:"hidden",marginBottom:10}}>
                <img src={p.url} alt="" style={{width:"100%",display:"block",maxHeight:260,objectFit:"cover"}}/>
                <div style={{padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"sans-serif",fontSize:12,fontWeight:"bold",color:"#424242"}}>{who}</div>
                    <div style={{fontFamily:"sans-serif",fontSize:10,color:"#9E9E9E"}}>{new Date(p.date).toLocaleString("fr-FR")}</div>
                  </div>
                  {mine&&<button onClick={()=>deletePhoto(i)} style={{background:"#FFEBEE",border:"none",borderRadius:6,padding:"5px 10px",color:"#C62828",fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",cursor:"pointer"}}>🗑 Supprimer</button>}
                </div>
                {p.analysis?.anomalies?.length>0&&<div style={{background:"#FFF8E1",padding:"6px 10px",fontFamily:"sans-serif",fontSize:11,color:"#E65100"}}>⚠ {p.analysis.anomalies.join(" · ")}</div>}
              </div>
            );
          })}
        </Card>

        {/* Note */}
        <Card title="💬 Ajouter une note">
          <div style={{display:"flex",gap:8}}>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Observation, info…" style={{...IS,flex:1}} onKeyDown={e=>e.key==="Enter"&&addNote()}/>
            <button onClick={addNote} style={{background:"#2E7D32",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontFamily:"sans-serif",fontWeight:"bold",cursor:"pointer"}}>OK</button>
          </div>
        </Card>

        {/* Historique */}
        <Card title="📋 Historique">
          {[...(task.history||[])].reverse().map((h,i)=>{
            const u=users.find(x=>x.id===h.by);
            return<div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:ROLES[u?.role]?.color||"#BDBDBD",marginTop:5,flexShrink:0}}/>
              <div>
                <div style={{fontFamily:"sans-serif",fontSize:12,color:"#212121"}}>{h.action}</div>
                <div style={{fontFamily:"sans-serif",fontSize:10,color:"#9E9E9E"}}>{u?.name||"Système"} · {new Date(h.date).toLocaleString("fr-FR")}</div>
              </div>
            </div>;
          })}
        </Card>

        {role.canManageUsers&&<button onClick={()=>{if(confirm("Supprimer définitivement ?"))onDelete();}} style={{background:"#fff",color:"#C62828",border:"1.5px solid #C62828",borderRadius:10,padding:"12px",fontFamily:"sans-serif",fontSize:13,cursor:"pointer",width:"100%"}}>
          🗑 Supprimer (Direction uniquement)
        </button>}
      </div>
    </div>
  );
}

// ─── PEOPLE ───────────────────────────────────────────────────
function People({me,users,onSave,onBack,onNavTypes}){
  const [adding,setAdding]=useState(false);
  const [editPin,setEditPin]=useState(null);
  const [newPin,setNewPin]=useState("");
  const [name,setName]=useState("");
  const [uRole,setURole]=useState("menage");
  const [pin,setPin]=useState("");
  const add=()=>{if(!name.trim())return;onSave([...users,{id:Date.now().toString(36),name:name.trim(),role:uRole,pin}]);setName("");setPin("");setURole("menage");setAdding(false);};
  const remove=id=>{if(id===me.id)return;if(confirm("Supprimer ?"))onSave(users.filter(u=>u.id!==id));};
  const savePin=id=>{onSave(users.map(u=>u.id===id?{...u,pin:newPin}:u));setEditPin(null);setNewPin("");};
  return(
    <div>
      <TopBar title="Équipe" onBack={onBack}/>
      <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:10}}>
        {users.map(u=>{const r=ROLES[u.role];return(
          <div key={u.id} style={{background:"#fff",border:"1px solid #E0E0E0",borderRadius:12,padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:r?.color||"#9E9E9E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{r?.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",color:"#1A1A1A"}}>{u.name}{u.id===me.id?" (moi)":""}</div>
                <div style={{fontFamily:"sans-serif",fontSize:12,color:"#9E9E9E"}}>{r?.label} · PIN : {u.pin?u.pin.replace(/./g,"●"):"aucun"}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{setEditPin(editPin===u.id?null:u.id);setNewPin(u.pin||"");}} style={{background:"#E3F2FD",border:"none",borderRadius:6,padding:"5px 10px",color:"#1565C0",fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",cursor:"pointer"}}>🔑 PIN</button>
                {u.id!==me.id&&<button onClick={()=>remove(u.id)} style={{background:"#FFEBEE",border:"none",borderRadius:6,padding:"5px 10px",color:"#C62828",fontFamily:"sans-serif",fontSize:12,fontWeight:"bold",cursor:"pointer"}}>×</button>}
              </div>
            </div>
            {editPin===u.id&&<div style={{marginTop:10,display:"flex",gap:8,alignItems:"center"}}>
              <input value={newPin} onChange={e=>setNewPin(e.target.value)} placeholder="Nouveau PIN (vide = sans PIN)" maxLength={6} inputMode="numeric" style={{...IS,flex:1}}/>
              <button onClick={()=>savePin(u.id)} style={{background:"#2E7D32",color:"#fff",border:"none",borderRadius:8,padding:"9px 14px",fontFamily:"sans-serif",fontWeight:"bold",cursor:"pointer"}}>OK</button>
              <button onClick={()=>setEditPin(null)} style={{background:"#fff",color:"#9E9E9E",border:"1px solid #ddd",borderRadius:8,padding:"9px 10px",fontFamily:"sans-serif",cursor:"pointer"}}>✕</button>
            </div>}
          </div>);})}
        {!adding&&<button onClick={()=>setAdding(true)} style={{background:"#F1F8F1",border:"1.5px dashed #2E7D32",borderRadius:12,padding:"14px",color:"#2E7D32",fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",cursor:"pointer"}}>+ Ajouter un utilisateur</button>}
        <button onClick={()=>onNavTypes()} style={{background:"#E3F2FD",border:"1.5px solid #1565C0",borderRadius:12,padding:"14px",color:"#1565C0",fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",cursor:"pointer"}}>🏷 Gérer les types de tâches</button>
        {adding&&<Card title="Nouvel utilisateur">
          <Fld label="Prénom"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Prénom" style={IS}/></Fld>
          <div style={{height:8}}/>
          <Fld label="Rôle"><select value={uRole} onChange={e=>setURole(e.target.value)} style={IS}>{Object.entries(ROLES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select></Fld>
          <div style={{height:8}}/>
          <Fld label="PIN"><input value={pin} onChange={e=>setPin(e.target.value)} placeholder="Ex: 1234" maxLength={6} inputMode="numeric" style={IS}/></Fld>
          <div style={{height:12}}/>
          <div style={{display:"flex",gap:8}}>
            <button onClick={add} disabled={!name.trim()} style={{flex:1,background:name.trim()?"#2E7D32":"#BDBDBD",color:"#fff",border:"none",borderRadius:8,padding:"11px",fontFamily:"sans-serif",fontWeight:"bold",cursor:name.trim()?"pointer":"default"}}>Créer</button>
            <button onClick={()=>setAdding(false)} style={{flex:1,background:"#fff",color:"#424242",border:"1px solid #ddd",borderRadius:8,padding:"11px",fontFamily:"sans-serif",cursor:"pointer"}}>Annuler</button>
          </div>
        </Card>}
      </div>
    </div>
  );
}

// ─── TASK TYPES MANAGER ──────────────────────────────────────
function TaskTypesManager({taskTypes,onSave,onBack}){
  const [types,setTypes]=useState([...taskTypes]);
  const [newType,setNewType]=useState("");
  const add=()=>{const t=newType.trim();if(!t||types.includes(t))return;setTypes([...types,t]);setNewType("");};
  const remove=t=>{if(!confirm(`Supprimer "${t}" ?`))return;setTypes(types.filter(x=>x!==t));};
  const moveUp=i=>{if(i===0)return;const arr=[...types];[arr[i-1],arr[i]]=[arr[i],arr[i-1]];setTypes(arr);};
  const moveDown=i=>{if(i===types.length-1)return;const arr=[...types];[arr[i],arr[i+1]]=[arr[i+1],arr[i]];setTypes(arr);};
  const save=()=>{onSave(types);onBack();};
  return<div>
    <TopBar title="🏷 Types de tâches" onBack={onBack}/>
    <div style={{padding:"12px",display:"flex",flexDirection:"column",gap:10}}>
      <Card title="Ajouter un type">
        <div style={{display:"flex",gap:8}}>
          <input value={newType} onChange={e=>setNewType(e.target.value)} placeholder="Ex: Inspection, Sécurité…" style={{...IS,flex:1}} onKeyDown={e=>e.key==="Enter"&&add()}/>
          <button onClick={add} style={{background:"#2E7D32",color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontFamily:"sans-serif",fontWeight:"bold",cursor:"pointer"}}>+</button>
        </div>
      </Card>
      <Card title={`Types (${types.length})`}>
        {types.map((t,i)=>(
          <div key={t} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #F0F0F0"}}>
            <div style={{display:"flex",flexDirection:"column",gap:2,flexShrink:0}}>
              <button onClick={()=>moveUp(i)} disabled={i===0} style={{background:i===0?"#F5F5F5":"#E8F5E9",border:"none",borderRadius:4,padding:"2px 6px",cursor:i===0?"default":"pointer",color:i===0?"#BDBDBD":"#2E7D32",fontSize:11}}>▲</button>
              <button onClick={()=>moveDown(i)} disabled={i===types.length-1} style={{background:i===types.length-1?"#F5F5F5":"#E8F5E9",border:"none",borderRadius:4,padding:"2px 6px",cursor:i===types.length-1?"default":"pointer",color:i===types.length-1?"#BDBDBD":"#2E7D32",fontSize:11}}>▼</button>
            </div>
            <div style={{flex:1,fontFamily:"sans-serif",fontSize:14,color:"#1A1A1A"}}>{t}</div>
            <button onClick={()=>remove(t)} style={{background:"#FFEBEE",border:"none",borderRadius:6,padding:"4px 8px",color:"#C62828",fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",cursor:"pointer"}}>✕</button>
          </div>
        ))}
      </Card>
      <button onClick={save} style={{background:"#2E7D32",color:"#fff",border:"none",borderRadius:10,padding:"14px",fontFamily:"sans-serif",fontSize:15,fontWeight:"bold",cursor:"pointer"}}>💾 Enregistrer</button>
    </div>
  </div>;
}

// ─── PROFILE ──────────────────────────────────────────────────
function Profile({me,onLogout,onBack}){
  const r=ROLES[me.role];
  return<div><TopBar title="Mon profil" onBack={onBack}/>
    <div style={{padding:24,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
      <div style={{width:72,height:72,borderRadius:"50%",background:r.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34}}>{r.icon}</div>
      <div style={{fontFamily:"Georgia,serif",fontSize:20,color:"#1A1A1A"}}>{me.name}</div>
      <Tag bg={r.color} label={r.label}/>
      <button onClick={onLogout} style={{marginTop:16,background:"#fff",color:"#C62828",border:"1.5px solid #C62828",borderRadius:10,padding:"12px 32px",fontFamily:"sans-serif",fontSize:14,cursor:"pointer"}}>Changer d'utilisateur</button>
    </div>
  </div>;
}

// ─── SHARED ───────────────────────────────────────────────────
function Shell({children}){return<div style={{fontFamily:"Georgia,serif",background:"#F8F9FA",minHeight:"100vh",maxWidth:480,margin:"0 auto",position:"relative"}}>{children}</div>;}
function TopBar({title,onBack}){return<div style={{background:"#2E7D32",color:"#fff",padding:"14px 12px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}><button onClick={onBack} style={{background:"none",border:"none",color:"#fff",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button><div style={{fontSize:16,fontWeight:"bold",flex:1}}>{title}</div></div>;}
function Card({title,titleColor="#2E7D32",children}){return<div style={{background:"#fff",border:"1px solid #E0E0E0",borderRadius:12,padding:"12px"}}>{title&&<div style={{fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",color:titleColor,letterSpacing:.5,textTransform:"uppercase",marginBottom:8}}>{title}</div>}{children}</div>;}
function KPI({n,label,color}){return<div style={{background:"#fff",border:`2px solid ${color}22`,borderRadius:12,padding:"12px",textAlign:"center"}}><div style={{fontSize:26,fontWeight:"bold",color,fontFamily:"Georgia,serif"}}>{n}</div><div style={{fontFamily:"sans-serif",fontSize:10,color:"#9E9E9E",marginTop:2}}>{label}</div></div>;}
function StatCard({n,label,color,onClick}){return<button onClick={onClick} style={{background:"#fff",border:`1.5px solid ${color}22`,borderRadius:12,padding:"14px",textAlign:"center",cursor:"pointer",display:"block"}}><div style={{fontSize:28,fontWeight:"bold",color,fontFamily:"Georgia,serif"}}>{n}</div><div style={{fontFamily:"sans-serif",fontSize:11,color:"#757575",marginTop:2}}>{label}</div></button>;}
function Tag({bg,label}){return<span style={{background:bg,color:"#fff",borderRadius:6,padding:"2px 8px",fontSize:11,fontFamily:"sans-serif"}}>{label}</span>;}
function Chip({label,active,color,onClick,small}){return<button onClick={onClick} style={{flexShrink:0,padding:small?"3px 8px":"6px 11px",border:`1.5px solid ${active?color:"#E0E0E0"}`,borderRadius:20,background:active?color:"#fff",color:active?"#fff":color,fontSize:small?10:12,fontFamily:"sans-serif",cursor:"pointer",fontWeight:active?"bold":"normal",whiteSpace:"nowrap"}}>{label}</button>;}
function Banner({color,bg,icon,text,onClick}){return<button onClick={onClick} style={{width:"100%",background:bg,border:`1.5px solid ${color}`,borderRadius:10,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}><div style={{color,fontWeight:"bold",fontSize:13,fontFamily:"sans-serif"}}>{icon} {text}</div><span style={{color,fontSize:14}}>›</span></button>;}
function SectionLabel({text,action,onAction}){return<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"10px 0 6px"}}><div style={{fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",color:"#9E9E9E",letterSpacing:.5}}>{text}</div>{action&&<button onClick={onAction} style={{background:"none",border:"none",color:"#2E7D32",fontFamily:"sans-serif",fontSize:12,cursor:"pointer"}}>{action}</button>}</div>;}
function Empty({label,emoji="📭"}){return<div style={{textAlign:"center",color:"#9E9E9E",padding:"36px 20px",fontFamily:"sans-serif",fontSize:13}}><div style={{fontSize:28,marginBottom:6}}>{emoji}</div>{label}</div>;}
function Btn({color,onClick,children}){return<button onClick={onClick} style={{width:"100%",background:color,color:"#fff",border:"none",borderRadius:10,padding:"13px",fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",cursor:"pointer"}}>{children}</button>;}
function Fld({label,children}){return<div><div style={{fontFamily:"sans-serif",fontSize:11,fontWeight:"bold",color:"#757575",letterSpacing:.5,textTransform:"uppercase",marginBottom:4}}>{label}</div>{children}</div>;}

function TRow({task,users,onOpen,showAssignee,highlight,overdue}){
  const assignee=users.find(u=>u.id===task.assignedTo);
  const od=overdue||isOverdue(task);
  return<button onClick={()=>onOpen(task.id)} style={{width:"100%",background:od?"#FFF8F8":highlight?"#F3E5F5":"#fff",border:`1px solid ${od?"#FFCDD2":"#E0E0E0"}`,borderLeft:`4px solid ${od?"#C62828":PRIO_COLOR[task.priority]||"#9E9E9E"}`,borderRadius:10,padding:"10px 12px",marginBottom:7,textAlign:"left",cursor:"pointer",display:"block"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div style={{fontFamily:"sans-serif",fontSize:14,fontWeight:"bold",color:od?"#C62828":"#1A1A1A",flex:1,marginRight:6}}>{od&&"⏰ "}{task.title}</div>
      <span style={{background:STATUS_COLOR[task.status]||"#9E9E9E",color:"#fff",borderRadius:7,padding:"2px 7px",fontSize:10,fontFamily:"sans-serif",flexShrink:0,whiteSpace:"nowrap"}}>{task.status}</span>
    </div>
    <div style={{fontFamily:"sans-serif",fontSize:11,color:"#757575",marginTop:3,display:"flex",gap:8,flexWrap:"wrap"}}>
      {showAssignee&&assignee&&<span>{ROLES[assignee.role]?.icon} {assignee.name}</span>}
      {task.type&&<span>🏷 {task.type}</span>}
      {task.deadline&&<span style={{color:od?"#C62828":"#E65100"}}>📅 {formatDate(task.deadline)}</span>}
      {task.recurrence&&task.recurrence!=="none"&&<span>🔄</span>}
      {task.photos?.length>0&&<span>📷 {task.photos.length}</span>}
    </div>
  </button>;
}

function BottomNav({screen,role,toValidate,myTasks,onNav}){
  const items=[
    {id:"home",icon:"🏠",label:"Accueil"},
    {id:"mytasks",icon:"✅",label:"Mes tâches",badge:myTasks},
    ...(role.canValidate?[{id:"validate",icon:"🔍",label:"Valider",badge:toValidate}]:[]),
    ...(role.canCreate?[{id:"new",icon:"➕",label:"Créer"}]:[]),
    ...(role.seeAll?[{id:"all",icon:"📋",label:"Toutes"}]:[]),
    ...(role.canManageUsers?[{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"people",icon:"👥",label:"Équipe"}]:[]),
    {id:"profile",icon:"👤",label:"Profil"},
  ];
  return<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #E0E0E0",display:"flex",zIndex:20}}>
    {items.map(n=>(
      <button key={n.id} onClick={()=>onNav(n.id)} style={{flex:1,border:"none",background:"none",padding:"7px 0",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,position:"relative"}}>
        <span style={{fontSize:18}}>{n.icon}</span>
        <span style={{fontFamily:"sans-serif",fontSize:9,color:screen===n.id?"#2E7D32":"#9E9E9E",fontWeight:screen===n.id?"bold":"normal"}}>{n.label}</span>
        {n.badge>0&&<div style={{position:"absolute",top:3,right:"10%",background:"#C62828",color:"#fff",borderRadius:8,padding:"1px 5px",fontSize:9,fontFamily:"sans-serif",fontWeight:"bold"}}>{n.badge}</div>}
      </button>
    ))}
  </div>;
}

const IS={width:"100%",border:"1px solid #ddd",borderRadius:8,padding:"9px 10px",fontSize:14,fontFamily:"sans-serif",boxSizing:"border-box",background:"#FAFAFA"};
