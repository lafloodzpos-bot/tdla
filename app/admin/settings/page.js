"use client";
import { useState, useEffect } from "react";
import { ADMIN_PASSWORD } from "@/lib/config";

export default function AdminSettings() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pins, setPins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [siteEnabled, setSiteEnabled] = useState(true);
  const [publicAccess, setPublicAccess] = useState(false);
  const [telegramLink, setTelegramLink] = useState("");
  const [signalLink, setSignalLink] = useState("");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const flash = (text, type="success") => { setMessage({text,type}); setTimeout(()=>setMessage(null),3000); };
  const is = {padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:14,outline:"none",width:"100%"};
  const bs = (c="var(--accent)") => ({padding:"10px 20px",borderRadius:10,border:"none",background:c,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"});

  const login = async () => {
    const res = await fetch("/api/settings",{headers:{"x-admin-password":password}});
    if (res.status===401) { flash("Wrong password","error"); return; }
    const data = await res.json();
    setPins(data.pins||[]);
    setLogs(data.logs||[]);
    setAdminLogs(data.adminLogs||[]);
    setSiteEnabled(data.siteEnabled!==false);
    setPublicAccess(data.publicAccess===true);
    setTelegramLink(data.telegramLink||"");
    setSignalLink(data.signalLink||"");
    setAuthed(true);
    // Log admin login
    fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"log_admin"})});
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings",{headers:{"x-admin-password":password}});
      const data = await res.json();
      setPins(data.pins||[]);
      setLogs(data.logs||[]);
      setAdminLogs(data.adminLogs||[]);
      setSiteEnabled(data.siteEnabled!==false);
      setPublicAccess(data.publicAccess===true);
    } catch { flash("Failed to load","error"); }
    setLoading(false);
  };

  const savePins = async (newPins) => {
    await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"set_pins",pins:newPins})});
    setPins(newPins);
  };

  const addPin = async () => {
    if(!newName){flash("Name is required","error");return;}
    if(!newPin||newPin.length!==6){flash("PIN must be exactly 6 digits","error");return;}
    if(!/^\d{6}$/.test(newPin)){flash("PIN must be numbers only (6 digits)","error");return;}
    if(pins.find(p=>p.pin===newPin)){flash("This PIN already exists","error");return;}
    const updated = [...pins, {name:newName, pin:newPin, created:new Date().toISOString()}];
    await savePins(updated);
    setNewName(""); setNewPin("");
    flash("PIN added!");
  };

  const removePin = async (idx) => {
    if(!confirm("Remove this PIN?"))return;
    const updated = pins.filter((_,i)=>i!==idx);
    await savePins(updated);
    flash("PIN removed");
  };

  const toggleSite = async () => {
    const res = await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"toggle_site"})});
    const data = await res.json();
    setSiteEnabled(data.siteEnabled);
    flash(data.siteEnabled?"Site ENABLED - customers need PIN to access":"Site DISABLED - no one can access");
  };

  const togglePublic = async () => {
    const res = await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"toggle_public"})});
    const data = await res.json();
    setPublicAccess(data.publicAccess);
    flash(data.publicAccess?"Public access ON - anyone can browse without PIN":"Public access OFF - PIN required");
  };

  const changePassword = async () => {
    if(!newAdminPass||newAdminPass.length<6){flash("Password must be at least 6 characters","error");return;}
    if(newAdminPass!==confirmPass){flash("Passwords do not match","error");return;}
    const res = await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"change_password",newPassword:newAdminPass})});
    const data = await res.json();
    if(data.success){setPassword(newAdminPass);setNewAdminPass("");setConfirmPass("");flash("Admin password changed!");}
    else{flash(data.error||"Failed to change password","error");}
  };

  const clearLogs = async () => {
    if(!confirm("Clear all access logs?"))return;
    await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"clear_logs"})});
    setLogs([]);flash("Logs cleared");
  };

  const saveTelegram = async () => {
    const link = telegramLink.trim();
    if (link && !link.startsWith("https://")) { flash("Link must start with https://","error"); return; }
    await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"set_telegram",link})});
    setTelegramLink(link);
    flash(link ? "Telegram link saved!" : "Telegram link removed");
  };
  const saveSignal = async () => {
    const link = signalLink.trim();
    if (link && !link.startsWith("https://")) { flash("Link must start with https://","error"); return; }
    await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"set_signal",link})});
    setSignalLink(link);
    flash(link ? "Signal link saved!" : "Signal link removed");
  };
  const clearAdminLogs = async () => {
    if(!confirm("Clear all admin logs?"))return;
    await fetch("/api/settings",{method:"POST",headers:{"x-admin-password":password,"Content-Type":"application/json"},body:JSON.stringify({action:"clear_admin_logs"})});
    setAdminLogs([]);flash("Admin logs cleared");
  };

  if(!authed) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"var(--card)",borderRadius:20,border:"1px solid var(--border)",padding:40,maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <h1 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700,marginBottom:8}}>Admin Settings</h1>
          <p style={{color:"var(--muted)",fontSize:14}}>PIN management, access logs, site control</p>
        </div>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Admin password" style={{...is,marginBottom:16,padding:"14px 18px",fontSize:16}} autoFocus/>
        <button onClick={login} style={{...bs(),width:"100%",padding:"14px",fontSize:16}}>Login</button>
        {message&&<p style={{marginTop:12,textAlign:"center",fontSize:13,color:message.type==="error"?"var(--red)":"var(--green)"}}>{message.text}</p>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh"}}>
      <header style={{background:"rgba(10,10,15,.88)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <span style={{fontFamily:"'Outfit'",fontWeight:700,fontSize:18}}>Admin Settings</span>
          <div style={{display:"flex",gap:12}}><a href="/admin" style={{fontSize:13,color:"var(--muted)"}}>Products</a><a href="/shop" style={{fontSize:13,color:"var(--muted)"}}>Store</a></div>
        </div>
      </header>
      {message&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:200,background:message.type==="error"?"var(--red)":"var(--green)",color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:14,fontWeight:600}}>{message.text}</div>}
      <main style={{maxWidth:900,margin:"0 auto",padding:"24px 24px 80px"}}>
        
        {/* SITE KILL SWITCH */}
        <div style={{background:siteEnabled?"var(--card)":"rgba(239,68,68,.1)",borderRadius:14,padding:20,border:"1px solid "+(siteEnabled?"var(--border)":"var(--red)"),marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div><h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Site Status</h3><p style={{fontSize:13,color:"var(--muted)"}}>{siteEnabled?"Storefront is live":"Site is completely disabled for all users"}</p></div>
            <button onClick={toggleSite} style={{...bs(siteEnabled?"var(--red)":"var(--green)"),padding:"12px 24px",fontSize:14,minWidth:120}}>{siteEnabled?"Disable Site":"Enable Site"}</button>
          </div>
        </div>

        {/* PUBLIC ACCESS TOGGLE */}
        <div style={{background:publicAccess?"rgba(34,197,94,.08)":"var(--card)",borderRadius:14,padding:20,border:"1px solid "+(publicAccess?"var(--green)":"var(--border)"),marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div><h3 style={{fontSize:16,fontWeight:700,marginBottom:4}}>Public Access</h3><p style={{fontSize:13,color:"var(--muted)"}}>{publicAccess?"Anyone can browse without a PIN":"Customers need a PIN to access the store"}</p></div>
            <button onClick={togglePublic} style={{...bs(publicAccess?"var(--border)":"var(--green)"),color:publicAccess?"var(--muted)":"#fff",padding:"12px 24px",fontSize:14,minWidth:160}}>{publicAccess?"Require PIN":"Make Public"}</button>
          </div>
        </div>

        {/* MESSAGING LINKS */}
        <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:24}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Messaging Links</h3>
          <p style={{fontSize:12,color:"var(--dim)",marginBottom:16}}>These links are shown to customers on the storefront and used in the checkout buttons. Must start with https://</p>
          <div style={{display:"grid",gap:16}}>
            <div>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Telegram DM Link</label>
              <div style={{display:"flex",gap:8}}>
                <input value={telegramLink} onChange={e=>setTelegramLink(e.target.value)} placeholder="https://t.me/yourusername" style={{...is,flex:1}}/>
                <button onClick={saveTelegram} style={bs()}>Save</button>
              </div>
            </div>
            <div>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Signal DM Link</label>
              <div style={{display:"flex",gap:8}}>
                <input value={signalLink} onChange={e=>setSignalLink(e.target.value)} placeholder="https://signal.me/#p/..." style={{...is,flex:1}}/>
                <button onClick={saveSignal} style={bs()}>Save</button>
              </div>
            </div>
          </div>
        </div>

        {/* PIN MANAGEMENT */}
        <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:24}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>User PINs ({pins.length})</h3>
          <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="User name" style={{...is,flex:1,minWidth:120}}/>
            <input value={newPin} onChange={e=>setNewPin(e.target.value.replace(/[^0-9]/g,"").slice(0,6))} placeholder="6-digit PIN" style={{...is,flex:1,minWidth:120}} maxLength={6} inputMode="numeric"/>
            <button onClick={addPin} style={bs()}>Add PIN</button>
          </div>
          <p style={{fontSize:11,color:"var(--dim)",marginBottom:16}}>PIN must be exactly 6 digits (numbers only)</p>
          {pins.length===0&&<p style={{color:"var(--dim)",fontSize:13,textAlign:"center",padding:20}}>No PINs configured. Add a PIN to allow customer access.</p>}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {pins.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)"}}>
              <div><span style={{fontWeight:600,fontSize:14}}>{p.name}</span><span style={{color:"var(--dim)",fontSize:12,marginLeft:10}}>PIN: {p.pin}</span>{p.created&&<span style={{color:"var(--dim)",fontSize:11,marginLeft:10}}>Added: {new Date(p.created).toLocaleDateString("en-US")}</span>}</div>
              <button onClick={()=>removePin(i)} style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontSize:12,fontWeight:600}}>Remove</button>
            </div>))}
          </div>
        </div>

        {/* CHANGE ADMIN PASSWORD */}
        <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:24}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:16}}>Change Admin Password</h3>
          <div style={{display:"grid",gap:10,maxWidth:400}}>
            <input type="password" value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)} placeholder="New password (min 6 characters)" style={is}/>
            <input type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirm new password" style={is} onKeyDown={e=>e.key==="Enter"&&changePassword()}/>
            <button onClick={changePassword} style={{...bs(),width:"fit-content"}}>Update Password</button>
          </div>
          <p style={{fontSize:11,color:"var(--dim)",marginTop:8}}>This changes the password for both the Products admin and Settings admin.</p>
        </div>

        {/* ACCESS LOGS */}
        <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:16,fontWeight:700}}>Customer Access Logs ({logs.length})</h3>
            {logs.length>0&&<button onClick={clearLogs} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--red)",fontSize:12}}>Clear</button>}
          </div>
          {logs.length===0&&<p style={{color:"var(--dim)",fontSize:13,textAlign:"center",padding:20}}>No access logs yet.</p>}
          <div style={{maxHeight:300,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
            {logs.map((log,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"var(--surface)",borderRadius:6,fontSize:12,flexWrap:"wrap",gap:4}}>
              <span style={{fontWeight:600,color:"var(--text)"}}>{log.user}</span>
              <span style={{color:"var(--dim)"}}>PIN: {log.pin}</span>
              <span style={{color:"var(--dim)"}}>IP: {log.ip}</span>
              <span style={{color:"var(--dim)"}}>{new Date(log.date).toLocaleString("en-US",{month:"2-digit",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
            </div>))}
          </div>
        </div>

        {/* ADMIN LOGIN LOGS */}
        <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:16,fontWeight:700}}>Admin Login Logs ({adminLogs.length})</h3>
            {adminLogs.length>0&&<button onClick={clearAdminLogs} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--red)",fontSize:12}}>Clear</button>}
          </div>
          {adminLogs.length===0&&<p style={{color:"var(--dim)",fontSize:13,textAlign:"center",padding:20}}>No admin login logs yet.</p>}
          <div style={{maxHeight:300,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
            {adminLogs.map((log,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"var(--surface)",borderRadius:6,fontSize:12,flexWrap:"wrap",gap:4}}>
              <span style={{fontWeight:600,color:"var(--text)"}}>{log.type||"Admin"} Login</span>
              <span style={{color:"var(--dim)"}}>IP: {log.ip}</span>
              <span style={{color:"var(--dim)"}}>{new Date(log.date).toLocaleString("en-US",{month:"2-digit",day:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
            </div>))}
          </div>
        </div>
      </main>
    </div>
  );
}