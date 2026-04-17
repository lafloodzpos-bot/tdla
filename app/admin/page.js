"use client";
import { useState, useRef } from "react";
import { upload } from "@vercel/blob/client";
import { CATEGORIES, PRODUCT_FIELDS, ADMIN_PASSWORD, fmt, todayStr } from "@/lib/config";

function DateInput({ value, onChange, placeholder }) {
  const handleChange = (e) => {
    let v = e.target.value.replace(/[^0-9]/g, "");
    if (v.length > 2) v = v.slice(0,2) + "/" + v.slice(2);
    if (v.length > 5) v = v.slice(0,5) + "/" + v.slice(5);
    if (v.length > 10) v = v.slice(0,10);
    onChange(v);
  };
  return <input value={value||""} onChange={handleChange} placeholder={placeholder||"mm/dd/yyyy"} maxLength={10} style={{padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:14,outline:"none",width:"100%"}}/>;
}

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [message, setMessage] = useState(null);
  const [adminView, setAdminView] = useState("products");
  const [annItems, setAnnItems] = useState([]);
  const [annEditing, setAnnEditing] = useState(null);
  const [annForm, setAnnForm] = useState({});
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const flash = (text, type = "success") => { setMessage({ text, type }); setTimeout(() => setMessage(null), 3000); };
  const loadProducts = async () => { setLoading(true); try { const res = await fetch("/api/products"); const data = await res.json(); data.sort((a,b)=>{ const da=a._internalDateAdded||""; const db=b._internalDateAdded||""; return db.localeCompare(da); }); setProducts(data); } catch { flash("Failed to load","error"); } setLoading(false); };
  const loadAnnouncements = async () => { try { const res = await fetch("/api/announcements",{headers:{"x-admin-password":password,"Content-Type":"application/json"}}); const data = await res.json(); setAnnItems(Array.isArray(data)?data:[]); } catch {} };
  const login = () => { fetch("/api/settings",{headers:{"x-admin-password":password}}).then(r=>{if(r.ok){setAuthed(true);loadProducts();loadAnnouncements();}else{flash("Wrong password","error");}}).catch(()=>flash("Error","error")); };
  const getNextSku = () => {
    const nums = products.map(p => { const m = (p.sku||"").match(/^TD(\d+)$/); return m ? parseInt(m[1]) : 0; });
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return "TD" + String(max + 1).padStart(5, "0");
  };
  const startNew = () => { setEditing("new"); setForm({ name:"", sku:getNextSku(), price:"", category:CATEGORIES[1]||"Highs", image:"", video:"", inStock:true, description:"", smellRating:"", strain:"", weight:"", badge:"", dateAdded:todayStr(), dateUpdated:"", salePrice:"", noDiscount:false, _internalDateAdded:new Date().toISOString() }); };
  const startEdit = (p) => { setEditing(p.id); setForm({...p}); };
  const uploadFile = async (file, field, setU) => { setU(true); try { const blob = await upload(file.name, file, { access:"public", handleUploadUrl:"/api/upload" }); setForm(p=>({...p,[field]:blob.url})); flash((field==="image"?"Photo":"Video")+" uploaded!"); } catch(err) { flash("Upload failed: "+(err.message||""),"error"); } setU(false); };
  const saveProduct = async () => {
    if (!form.name||!form.price) { flash("Name and price required","error"); return; }
    const pd = {...form, price:parseInt(form.price)||0, salePrice:form.salePrice?parseInt(form.salePrice):null, noDiscount:form.noDiscount||false, inStock:form.inStock!==false};
    if (editing==="new" && !pd._internalDateAdded) pd._internalDateAdded = new Date().toISOString();
    try {
      const hd = {"x-admin-password":password,"Content-Type":"application/json"};
      if (editing==="new") { await fetch("/api/products",{method:"POST",headers:hd,body:JSON.stringify(pd)}); flash("Product created!"); }
      else { await fetch("/api/products",{method:"PUT",headers:hd,body:JSON.stringify({id:editing,...pd})}); flash("Product updated!"); }
      if(form.sendTelegram&&form.telegramMessage){try{const nr=await fetch("/api/notify",{method:"POST",headers:hd,body:JSON.stringify({message:form.telegramMessage})});const nd=await nr.json();if(nd.sent)flash("Saved + Telegram sent!");else if(nd.reason==="missing_env_vars")flash("Saved. Telegram skipped (env vars not set)","error");else flash("Saved. Telegram failed","error");}catch{flash("Saved, Telegram request failed","error");}}
      setEditing(null); loadProducts();
    } catch { flash("Save failed","error"); }
  };
  const deleteProduct = async (id) => { if(!confirm("Delete this product?"))return; try{await fetch("/api/products?id="+id,{method:"DELETE",headers:{"x-admin-password":password,"Content-Type":"application/json"}});flash("Deleted!");loadProducts();}catch{flash("Delete failed","error");} };
  const is = {padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:14,outline:"none",width:"100%"};
  const bs = (c="var(--accent)") => ({padding:"10px 20px",borderRadius:10,border:"none",background:c,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"});

  if (!authed) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"var(--card)",borderRadius:20,border:"1px solid var(--border)",padding:40,maxWidth:400,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:48,height:48,borderRadius:12,background:"linear-gradient(135deg,var(--accent),#8b5cf6)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#fff",marginBottom:16}}>TD</div>
          <h1 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700,marginBottom:8}}>Admin Panel</h1>
          <p style={{color:"var(--muted)",fontSize:14}}>Enter your admin password</p>
        </div>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Admin password" style={{...is,marginBottom:16,padding:"14px 18px",fontSize:16}} autoFocus />
        <button onClick={login} style={{...bs(),width:"100%",padding:"14px",fontSize:16}}>Login</button>
        {message&&<p style={{marginTop:12,textAlign:"center",fontSize:13,color:message.type==="error"?"var(--red)":"var(--green)"}}>{message.text}</p>}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh"}}>
      <header style={{background:"rgba(10,10,15,.88)",backdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",padding:"0 24px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,var(--accent),#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff"}}>TD</div><span style={{fontFamily:"'Outfit'",fontWeight:700,fontSize:18}}>Admin Panel</span></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}><button onClick={()=>setAdminView("products")} style={{background:adminView==="products"?"var(--card)":"transparent",border:"1px solid "+(adminView==="products"?"var(--border)":"transparent"),color:adminView==="products"?"var(--text)":"var(--muted)",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500}}>Products</button><button onClick={()=>setAdminView("announcements")} style={{background:adminView==="announcements"?"var(--card)":"transparent",border:"1px solid "+(adminView==="announcements"?"var(--border)":"transparent"),color:adminView==="announcements"?"var(--text)":"var(--muted)",padding:"7px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:500}}>Announcements</button><a href="/shop" style={{fontSize:13,color:"var(--muted)",marginLeft:8}}>Store</a><a href="/admin/settings" style={{fontSize:13,color:"var(--accent)"}}>Settings</a><button onClick={()=>{setAuthed(false);setPassword("");}} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--muted)"}}>Logout</button></div>
        </div>
      </header>
      {message&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:200,background:message.type==="error"?"var(--red)":"var(--green)",color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:14,fontWeight:600}}>{message.text}</div>}
      <main style={{maxWidth:1100,margin:"0 auto",padding:"24px 24px 80px"}}>
        {adminView==="products"&&!editing&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <h2 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700}}>Products ({products.length})</h2>
            <button onClick={startNew} style={bs()}>+ Add New Product</button>
          </div>
          {loading&&<p style={{color:"var(--muted)",textAlign:"center",padding:40}}>Loading...</p>}
          {!loading&&products.length===0&&<div style={{textAlign:"center",padding:"60px 20px",background:"var(--card)",borderRadius:16,border:"1px solid var(--border)"}}><p style={{fontSize:18,marginBottom:16,color:"var(--muted)"}}>No products yet</p><button onClick={startNew} style={bs()}>Add Your First Product</button></div>}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {products.filter(p=>p.name).map(product=>(
              <div key={product.id} style={{display:"flex",alignItems:"center",gap:16,background:"var(--card)",borderRadius:14,padding:"14px 20px",border:"1px solid var(--border)",flexWrap:"wrap"}}>
                <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",background:"var(--surface)",flexShrink:0}}>
                  {product.image?<img src={product.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:12,color:"var(--dim)"}}>No img</div>}
                </div>
                <div style={{flex:1,minWidth:150}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <p style={{fontSize:15,fontWeight:600}}>{product.name}</p>
                    <span style={{fontSize:10,color:"var(--dim)",background:"var(--surface)",padding:"2px 6px",borderRadius:4}}>{product._internalDateAdded ? new Date(product._internalDateAdded).toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"}) : "No date"}</span>
                  </div>
                  <p style={{fontSize:11,color:"var(--dim)"}}>SKU: {product.sku} - {product.category} {product.video?" | Has video":""}{product.inStock===false&&<span style={{color:"var(--red)",marginLeft:8}}>Out of Stock</span>}</p>
                </div>
                <span style={{fontFamily:"'Outfit'",fontWeight:700,fontSize:18,color:"var(--accent)",minWidth:100,textAlign:"right"}}>{fmt(product.price||0)}</span>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>startEdit(product)} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--accent)",fontSize:12}}>Edit</button>
                  <button onClick={()=>deleteProduct(product.id)} style={{...bs("transparent"),border:"1px solid var(--border)",color:"var(--red)",fontSize:12}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>}
        {adminView==="products"&&editing&&<div style={{maxWidth:700,margin:"0 auto"}}>
          <button onClick={()=>setEditing(null)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:14,marginBottom:20}}>Back to Products</button>
          <h2 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700,marginBottom:24}}>{editing==="new"?"Add New Product":"Edit Product"}</h2>
          <div style={{background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",padding:24}}>
            {/* Internal Date - read only */}
            <div style={{marginBottom:16,padding:12,background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)"}}>
              <span style={{fontSize:11,color:"var(--dim)",fontWeight:600}}>Internal Date Added: </span>
              <span style={{fontSize:13,color:"var(--text)"}}>{form._internalDateAdded ? new Date(form._internalDateAdded).toLocaleDateString("en-US",{month:"2-digit",day:"2-digit",year:"numeric"}) + " " + new Date(form._internalDateAdded).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}) : "Will be set on save"}</span>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Product Image</label>
              <div style={{border:"2px dashed var(--border)",borderRadius:12,padding:16,textAlign:"center",background:"var(--surface)"}}>
                {form.image&&<div style={{marginBottom:12,borderRadius:8,overflow:"hidden"}}><img src={form.image} alt="Preview" style={{width:"100%",maxHeight:200,objectFit:"cover"}}/></div>}
                <input type="file" ref={imageRef} accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],"image",setUploadingImage)} style={{display:"none"}}/>
                <button onClick={()=>imageRef.current.click()} disabled={uploadingImage} style={{...bs("var(--accent)"),opacity:uploadingImage?0.6:1}}>{uploadingImage?"Uploading...":form.image?"Replace Photo":"Upload Photo"}</button>
                <p style={{fontSize:11,color:"var(--dim)",marginTop:8}}>JPG, PNG, WebP, GIF</p>
                {form.image&&<button onClick={()=>setForm(p=>({...p,image:""}))} style={{background:"none",border:"none",color:"var(--red)",fontSize:12,cursor:"pointer",marginTop:4}}>Remove</button>}
              </div>
            </div>
            <div style={{marginBottom:24}}>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:8,textTransform:"uppercase"}}>Product Video</label>
              <div style={{border:"2px dashed var(--border)",borderRadius:12,padding:16,textAlign:"center",background:"var(--surface)"}}>
                {form.video&&<div style={{marginBottom:12,borderRadius:8,overflow:"hidden"}}><video src={form.video} controls style={{width:"100%",maxHeight:200}}/></div>}
                <input type="file" ref={videoRef} accept="video/mp4,video/quicktime,video/webm,video/mov" onChange={e=>e.target.files[0]&&uploadFile(e.target.files[0],"video",setUploadingVideo)} style={{display:"none"}}/>
                <button onClick={()=>videoRef.current.click()} disabled={uploadingVideo} style={{...bs("#8b5cf6"),opacity:uploadingVideo?0.6:1}}>{uploadingVideo?"Uploading...":form.video?"Replace Video":"Upload Video"}</button>
                <p style={{fontSize:11,color:"var(--dim)",marginTop:8}}>MP4, MOV, WebM. Max 100MB.</p>
                {form.video&&<button onClick={()=>setForm(p=>({...p,video:""}))} style={{background:"none",border:"none",color:"var(--red)",fontSize:12,cursor:"pointer",marginTop:4}}>Remove</button>}
              </div>
            </div>
            <div style={{display:"grid",gap:16,marginBottom:24}}>
              <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Product Name *</label><input value={form.name||""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Product name" style={is}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>SKU</label><input value={form.sku||""} onChange={e=>setForm(p=>({...p,sku:e.target.value}))} style={is}/></div>
                <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Price *</label><input type="number" step="25" min="100" value={form.price||""} onChange={e=>setForm(p=>({...p,price:e.target.value}))} placeholder="100" style={is}/></div>
                <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Sale Price (optional)</label><input type="number" step="25" min="0" value={form.salePrice||""} onChange={e=>setForm(p=>({...p,salePrice:e.target.value}))} placeholder="Leave blank if no sale" style={is}/></div>
                <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Category</label><select value={form.category||""} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={is}>{CATEGORIES.filter(c=>c!=="All").map(cat=><option key={cat} value={cat}>{cat}</option>)}</select></div>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}><input type="checkbox" checked={form.inStock!==false} onChange={e=>setForm(p=>({...p,inStock:e.target.checked}))} style={{accentColor:"var(--accent)",width:18,height:18}}/><span style={{fontSize:14,fontWeight:500}}>In Stock</span></label>
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginTop:8}}><input type="checkbox" checked={form.noDiscount===true} onChange={e=>setForm(p=>({...p,noDiscount:e.target.checked}))} style={{accentColor:"var(--red)",width:18,height:18}}/><span style={{fontSize:14,fontWeight:500}}>No Additional Discounts</span></label>
              <p style={{fontSize:11,color:"var(--dim)",marginTop:2}}>When checked, automatic bulk cart discounts will not apply to this item. Customers will see a notice.</p>
            </div>
            <h3 style={{fontSize:14,fontWeight:600,color:"var(--muted)",marginBottom:16,textTransform:"uppercase",borderTop:"1px solid var(--border)",paddingTop:20}}>Product Details</h3>
            <div style={{display:"grid",gap:16}}>
              {PRODUCT_FIELDS.map(field=><div key={field.key}>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>{field.label}</label>
                {field.type==="textarea"?<textarea value={form[field.key]||""} onChange={e=>setForm(p=>({...p,[field.key]:e.target.value}))} rows={3} style={{...is,resize:"vertical"}}/>
                :field.type==="select"?<select value={form[field.key]||""} onChange={e=>setForm(p=>({...p,[field.key]:e.target.value}))} style={is}><option value="">-- Select --</option>{field.options.map(o=><option key={o} value={o}>{o}</option>)}</select>
                :field.type==="date"?<DateInput value={form[field.key]} onChange={v=>setForm(p=>({...p,[field.key]:v}))} placeholder="mm/dd/yyyy"/>
                :<input value={form[field.key]||""} onChange={e=>setForm(p=>({...p,[field.key]:e.target.value}))} style={is}/>}
                {field.subtext&&<p style={{fontSize:11,color:"var(--dim)",marginTop:4,fontStyle:"italic"}}>{field.subtext}</p>}
              </div>)}
            </div>
            {/* Telegram notification */}
            <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid var(--border)"}}>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:12}}>
                <input type="checkbox" checked={!!form.sendTelegram} onChange={e=>{const ck=e.target.checked;setForm(p=>{var fire=String.fromCodePoint(0x1F525);var plane=String.fromCodePoint(0x2708,0xFE0F);var pkg=String.fromCodePoint(0x1F4E6);var bang=String.fromCodePoint(0x203C,0xFE0F);var star=String.fromCodePoint(0x2B50,0xFE0F);var point=String.fromCodePoint(0x1F449,0x1F3FC);var url="https://tdla448.com";var nm=p.name||"Product";var sk=p.sku||"";var pr=p.salePrice||p.price||"0";var sr=parseInt(p.smellRating)||0;var hdr=editing==="new"?fire+" NEW DROP "+fire:fire+" Product Updated "+fire;var lines=[hdr,"<b>"+nm+"</b>","SKU: "+sk];if(sr>0){lines.push("Nose: "+star.repeat(sr));}lines.push("<b>$"+pr+"</b>"+plane);if(p.noDiscount){lines.push("No Additional Discounts"+bang);}else{lines.push("<b>($"+(Math.max(0,parseInt(pr)-50))+")</b> 5+ "+pkg);lines.push("<b>($"+(Math.max(0,parseInt(pr)-100))+")</b> 10+ "+pkg);}lines.push(point+" "+url);var msg=lines.join("\n");return{...p,sendTelegram:ck,telegramMessage:ck?(p.telegramMessage||msg):p.telegramMessage};});}} style={{accentColor:"var(--accent)",width:18,height:18}}/>
                <span style={{fontSize:14,fontWeight:600}}>Send Telegram announcement on save</span>
              </label>
              {form.sendTelegram&&<textarea value={form.telegramMessage||""} onChange={e=>setForm(p=>({...p,telegramMessage:e.target.value}))} rows={5} placeholder="Message to send..." style={{...is,resize:"vertical"}}/>}
            </div>
            <div style={{display:"flex",gap:12,marginTop:24,paddingTop:20,borderTop:"1px solid var(--border)"}}>
              <button onClick={saveProduct} style={{...bs(),flex:1,padding:"14px",fontSize:15}}>{editing==="new"?"Create Product":"Save Changes"}</button>
              <button onClick={()=>setEditing(null)} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--muted)",padding:"14px 24px"}}>Cancel</button>
            </div>
          </div>
        </div>}
      {adminView==="announcements"&&<div style={{maxWidth:800,margin:"0 auto"}}>
          {!annEditing?<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <h2 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700}}>Announcements ({annItems.length})</h2>
              <button onClick={()=>{setAnnEditing("new");setAnnForm({title:"",body:"",expiresAt:"",active:true,sendTelegram:false,telegramMessage:""});}} style={bs()}>+ New Announcement</button>
            </div>
            {annItems.length===0&&<div style={{textAlign:"center",padding:"60px 20px",background:"var(--card)",borderRadius:16,border:"1px solid var(--border)"}}><p style={{fontSize:18,marginBottom:16,color:"var(--muted)"}}>No announcements yet</p></div>}
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {annItems.map(a=>{const expired=a.expiresAt&&new Date(a.expiresAt)<new Date();return(<div key={a.id} style={{background:"var(--card)",borderRadius:14,padding:18,border:"1px solid var(--border)",display:"flex",gap:16,alignItems:"start",flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><p style={{fontSize:15,fontWeight:600}}>{a.title}</p>{!a.active&&<span style={{fontSize:10,background:"var(--border)",color:"var(--muted)",padding:"2px 8px",borderRadius:4}}>INACTIVE</span>}{expired&&<span style={{fontSize:10,background:"var(--red)",color:"#fff",padding:"2px 8px",borderRadius:4}}>EXPIRED</span>}</div>
                  <p style={{fontSize:13,color:"var(--muted)",whiteSpace:"pre-wrap"}}>{a.body}</p>
                  {a.expiresAt&&<p style={{fontSize:11,color:"var(--dim)",marginTop:4}}>Expires: {new Date(a.expiresAt).toLocaleString()}</p>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setAnnEditing(a.id);setAnnForm({title:a.title,body:a.body,expiresAt:a.expiresAt?a.expiresAt.substring(0,16):"",active:a.active!==false,sendTelegram:false,telegramMessage:""});}} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--accent)",fontSize:12}}>Edit</button>
                  <button onClick={async()=>{if(!confirm("Delete?"))return;await fetch("/api/announcements?id="+a.id,{method:"DELETE",headers:{"x-admin-password":password,"Content-Type":"application/json"}});flash("Deleted!");loadAnnouncements();}} style={{...bs("transparent"),border:"1px solid var(--border)",color:"var(--red)",fontSize:12}}>Delete</button>
                </div>
              </div>);})}
            </div>
          </>:<div style={{maxWidth:700,margin:"0 auto"}}>
            <button onClick={()=>setAnnEditing(null)} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:14,marginBottom:20}}>Back to Announcements</button>
            <h2 style={{fontFamily:"'Outfit'",fontSize:24,fontWeight:700,marginBottom:24}}>{annEditing==="new"?"New Announcement":"Edit Announcement"}</h2>
            <div style={{background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",padding:24,display:"grid",gap:16}}>
              <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Title *</label><input value={annForm.title||""} onChange={e=>setAnnForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Memorial Day Sale 20% Off" style={is}/></div>
              <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Body *</label><textarea value={annForm.body||""} onChange={e=>setAnnForm(p=>({...p,body:e.target.value}))} rows={4} placeholder="Details customers will see..." style={{...is,resize:"vertical"}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"var(--muted)",marginBottom:6}}>Expires At (optional)</label><input type="datetime-local" value={annForm.expiresAt||""} onChange={e=>setAnnForm(p=>({...p,expiresAt:e.target.value}))} style={is}/></div>
                <div style={{display:"flex",alignItems:"end"}}><label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"10px 0"}}><input type="checkbox" checked={annForm.active!==false} onChange={e=>setAnnForm(p=>({...p,active:e.target.checked}))} style={{accentColor:"var(--accent)",width:18,height:18}}/><span style={{fontSize:14,fontWeight:500}}>Active (visible)</span></label></div>
              </div>
              <div style={{paddingTop:20,borderTop:"1px solid var(--border)"}}>
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:12}}><input type="checkbox" checked={!!annForm.sendTelegram} onChange={e=>{const ck=e.target.checked;setAnnForm(p=>{var megaphone=String.fromCodePoint(0x1F4E2);const msg=megaphone+" "+(p.title||"Announcement")+"\n\n"+(p.body||"");return{...p,sendTelegram:ck,telegramMessage:ck?(p.telegramMessage||msg):p.telegramMessage};});}} style={{accentColor:"var(--accent)",width:18,height:18}}/><span style={{fontSize:14,fontWeight:600}}>Send Telegram announcement on save</span></label>
                {annForm.sendTelegram&&<textarea value={annForm.telegramMessage||""} onChange={e=>setAnnForm(p=>({...p,telegramMessage:e.target.value}))} rows={5} placeholder="Message to send..." style={{...is,resize:"vertical"}}/>}
              </div>
              <div style={{display:"flex",gap:12,paddingTop:20,borderTop:"1px solid var(--border)"}}>
                <button onClick={async()=>{if(!annForm.title||!annForm.body){flash("Title and body required","error");return;}const hd={"x-admin-password":password,"Content-Type":"application/json"};const payload={title:annForm.title,body:annForm.body,expiresAt:annForm.expiresAt?new Date(annForm.expiresAt).toISOString():null,active:annForm.active!==false};try{if(annEditing==="new"){await fetch("/api/announcements",{method:"POST",headers:hd,body:JSON.stringify(payload)});flash("Created!");}else{await fetch("/api/announcements",{method:"PUT",headers:hd,body:JSON.stringify({id:annEditing,...payload})});flash("Updated!");}if(annForm.sendTelegram&&annForm.telegramMessage){try{const nr=await fetch("/api/notify",{method:"POST",headers:hd,body:JSON.stringify({message:annForm.telegramMessage})});const nd=await nr.json();if(nd.sent)flash("Saved + Telegram sent!");else if(nd.reason==="missing_env_vars")flash("Saved. Telegram skipped (env vars not set)","error");}catch{}}setAnnEditing(null);loadAnnouncements();}catch{flash("Save failed","error");}}} style={{...bs(),flex:1,padding:"14px",fontSize:15}}>{annEditing==="new"?"Create":"Save Changes"}</button>
                <button onClick={()=>setAnnEditing(null)} style={{...bs("var(--surface)"),border:"1px solid var(--border)",color:"var(--muted)",padding:"14px 24px"}}>Cancel</button>
              </div>
            </div>
          </div>}
        </div>}
        </main>
    </div>
  );
}