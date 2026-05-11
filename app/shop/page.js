"use client";
import { useState, useEffect, useRef } from "react";
import { SITE_TAGLINE, SITE_DESCRIPTION, SITE_NAME, CATEGORIES, SHIPPING_OPTIONS, PAYMENT_METHODS, BULK_DISCOUNTS, fmt, genOrderNum } from "@/lib/config";

function Stars({ rating, label }) {
  if (!rating) return null;
  const n = parseInt(rating);
  return (<div style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}><span style={{color:"var(--dim)"}}>{label}:</span>{[1,2,3,4,5].map(i=>(<span key={i} style={{color:i<=n?"var(--gold)":"var(--border)"}}>&#9733;</span>))}</div>);
}

export default function StoreFront() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [page, setPage] = useState("shop");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [hideOOS, setHideOOS] = useState(false);
  const [sortPrice, setSortPrice] = useState("default");
  const [viewMode, setViewMode] = useState("default");
  const [shipping, setShipping] = useState("free");
  const [payment, setPayment] = useState("cash");
  const [copied, setCopied] = useState(false);
  const [addedId, setAddedId] = useState(null);
  const [sel, setSel] = useState(null);
  const [fsMedia, setFsMedia] = useState(null);
  const [slide, setSlide] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [tgLink, setTgLink] = useState("");
  const [sigLink, setSigLink] = useState("");
  const touchStart = useRef(null);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => { fetch("/api/products").then(r=>r.json()).then(d=>{d.sort((a,b)=>{const da=a._internalDateAdded||"";const db=b._internalDateAdded||"";return db.localeCompare(da);});setProducts(d);setLoading(false);}).catch(()=>setLoading(false)); }, []);
  useEffect(() => { fetch("/api/links").then(r=>r.json()).then(d=>{setTgLink(d.telegramLink||"");setSigLink(d.signalLink||"");}).catch(()=>{}); }, []);
  useEffect(() => { fetch("/api/announcements").then(r=>r.json()).then(d=>setAnnouncements(Array.isArray(d)?d:[])).catch(()=>{}); }, []);
  useEffect(() => { document.body.style.overflow=(sel||fsMedia)?"hidden":""; return()=>{document.body.style.overflow="";}; }, [sel,fsMedia]);
  useEffect(() => { setSlide(0); setVideoPlaying(false); }, [sel]);

  const totalItems = cart.reduce((s,i)=>s+i.qty,0);
  const activeTier = BULK_DISCOUNTS.length > 0 ? [...BULK_DISCOUNTS].reverse().find(t=>totalItems>=t.minItems) : null;
  const bulkDiscount = activeTier ? activeTier.discount : 0;
  const bulkLabel = activeTier ? activeTier.label : "";

  const getPrice = (item) => {
    const base = item.salePrice ? item.salePrice : item.price;
    if (item.noDiscount || !bulkDiscount) return base;
    return Math.max(0, base - bulkDiscount);
  };

  const cc = totalItems;
  const sub = cart.reduce((s,i)=>s+getPrice(i)*i.qty,0);
  const so = SHIPPING_OPTIONS.find(o=>o.id===shipping);
  const po = PAYMENT_METHODS.find(o=>o.id===payment);
  const tot = sub+so.price;

  const addToCart = (p) => { setCart(prev=>{const e=prev.find(i=>i.id===p.id);if(e)return prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i);return[...prev,{...p,qty:1}];}); setAddedId(p.id); setTimeout(()=>setAddedId(null),1200); };
  const updateQty = (id,d) => setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i));
  const rmCart = (id) => setCart(prev=>prev.filter(i=>i.id!==id));
  const filtered = products.filter(p => { if(!p.name)return false; if(hideOOS&&p.inStock===false)return false; return (category==="All"||p.category===category)&&p.name.toLowerCase().includes(search.toLowerCase()); }).sort((a,b)=>{ if(sortPrice==="low")return (a.salePrice||a.price)-(b.salePrice||b.price); if(sortPrice==="high")return (b.salePrice||b.price)-(a.salePrice||a.price); return 0; });
  const handleSwipe = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleSwipeEnd = (e, hasV, hasI) => { if(!touchStart.current)return; const diff=touchStart.current-e.changedTouches[0].clientX; if(Math.abs(diff)>50){if(diff>0&&hasV&&slide===0)setSlide(1);if(diff<0&&hasI&&slide===1)setSlide(0);} touchStart.current=null; };

  const orderText = () => {
    var totalDiscount = 0;
    const items = cart.map(i=>{
      const ep = getPrice(i);
      let label = i.qty+" x "+i.name+" ("+fmt(ep)+")";
      if(i.salePrice) label+=" [Sale]";
      if(bulkDiscount>0&&!i.noDiscount){ label+=" [Discounted -"+fmt(bulkDiscount)+"]"; totalDiscount+=bulkDiscount*i.qty; }
      return label;
    }).join("\n");
    let text = "ORDER REQUEST\n\n"+items+"\n\nTotal Items: "+cc+"\n"+(shipping==="free"?"Free Shipping":"Overnight: + "+fmt(so.price))+"\n";
    if(totalDiscount>0) text+="Discount: - "+fmt(totalDiscount)+"\n";
    text+="TOTAL: "+fmt(tot)+"\n\nPaying with "+po.label.toUpperCase()+"\n\nShipping Address will be collected after payment.\nNOTE: This order is not final. This is an estimate. Please confirm the order with us first.";
    return text;
  };
  const copyOrd = async () => { try{await navigator.clipboard.writeText(orderText());}catch{const t=document.createElement("textarea");t.value=orderText();document.body.appendChild(t);t.select();document.execCommand("copy");document.body.removeChild(t);} setCopied(true);setTimeout(()=>setCopied(false),3000); };
  const is = {padding:"12px 16px",borderRadius:10,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",fontSize:14,outline:"none",width:"100%"};

  return (
    <div>
      {fsMedia&&<div style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",zIndex:999,background:"#000",overflow:"auto",WebkitOverflowScrolling:"touch"}}>
        <button onClick={()=>setFsMedia(null)} style={{position:"fixed",top:12,right:12,background:"rgba(255,255,255,.85)",border:"none",color:"#000",fontSize:22,fontWeight:800,width:48,height:48,borderRadius:"50%",cursor:"pointer",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 12px rgba(0,0,0,.5)"}}>X</button>
        {(fsMedia.includes('.mp4')||fsMedia.includes('.mov')||fsMedia.includes('.webm'))?<video src={fsMedia} controls autoPlay playsInline style={{width:"100%",height:"100vh",objectFit:"contain"}}/>:<img src={fsMedia} alt="" style={{width:"200%",maxWidth:"200%",display:"block"}}/>}
      </div>}

      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(10,10,15,.88)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",padding:"0 24px"}}>
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>{setPage("shop");setSel(null);}}>
            <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,var(--accent),#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>TD</div>
            <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:20}}>TD<span style={{color:"var(--accent)"}}>LA</span></span>
          </div>
          <nav style={{display:"flex",alignItems:"center",gap:8}}>
            {["shop","cart"].map(p=>(<button key={p} onClick={()=>{setPage(p);setSel(null);}} style={{background:page===p?"var(--card)":"transparent",border:page===p?"1px solid var(--border)":"1px solid transparent",color:page===p?"var(--text)":"var(--muted)",padding:"7px 18px",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:500}}>{p==="cart"?`Cart (${cc})`:"Shop"}</button>))}
          </nav>
          <button onClick={()=>setPage("cart")} style={{background:"transparent",border:"none",color:"var(--text)",cursor:"pointer",padding:6,position:"relative"}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {cc>0&&<span style={{position:"absolute",top:-2,right:-6,background:"var(--red)",color:"#fff",fontSize:11,fontWeight:700,borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center"}}>{cc}</span>}
          </button>
        </div>
      </header>

      <main style={{maxWidth:1280,margin:"0 auto",padding:"24px 24px 80px"}}>
        {loading&&<div style={{textAlign:"center",padding:80,color:"var(--muted)"}}><p>Loading...</p></div>}

        {sel&&<div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setSel(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",width:"100%",maxWidth:360,maxHeight:"85vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{position:"relative",width:"100%",height:videoPlaying?undefined:280,aspectRatio:videoPlaying?"3/4":undefined,flexShrink:0,overflow:"hidden",borderRadius:"16px 16px 0 0",background:"#000"}} onTouchStart={handleSwipe} onTouchEnd={e=>handleSwipeEnd(e,!!sel.video,!!sel.image)}>
              <div style={{display:"flex",width:sel.video&&sel.image?"200%":"100%",height:"100%",transition:"transform 0.3s ease",transform:"translateX(-"+(slide*(sel.image&&sel.video?50:0))+"%)" }}>
                {sel.image&&<div style={{width:sel.video?"50%":"100%",height:"100%",flexShrink:0,cursor:"pointer"}} onClick={()=>setFsMedia(sel.image)}><img src={sel.image} alt={sel.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
                {sel.video&&<div style={{width:sel.image?"50%":"100%",height:"100%",flexShrink:0}}><video src={sel.video} controls playsInline onPlay={()=>setVideoPlaying(true)} onPause={()=>setVideoPlaying(false)} onEnded={()=>setVideoPlaying(false)} style={{width:"100%",height:"100%",objectFit:videoPlaying?"contain":"cover",background:"#000"}}/></div>}
              </div>
              {sel.image&&sel.video&&slide===0&&<button onClick={()=>setSlide(1)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:16}}>&gt;</button>}
              {sel.image&&sel.video&&slide===1&&<button onClick={()=>setSlide(0)} style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,.5)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",cursor:"pointer",fontSize:16}}>&lt;</button>}
              {sel.image&&sel.video&&<div style={{position:"absolute",bottom:8,left:0,right:0,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{background:"rgba(0,0,0,.5)",color:"#fff",padding:"2px 8px",borderRadius:4,fontSize:9}}>{slide===0?"Swipe for video":"Swipe for photo"}</div><div style={{display:"flex",gap:5}}><div onClick={()=>setSlide(0)} style={{width:7,height:7,borderRadius:"50%",background:"#fff",opacity:slide===0?1:0.4,cursor:"pointer"}}/><div onClick={()=>setSlide(1)} style={{width:7,height:7,borderRadius:"50%",background:"#fff",opacity:slide===1?1:0.4,cursor:"pointer"}}/></div></div>}
              {slide===0&&sel.image&&<div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.5)",color:"#fff",padding:"2px 8px",borderRadius:4,fontSize:9}}>Tap for full size</div>}
            </div>
            <div style={{padding:14,overflowY:"auto",flex:1}}>
              <div style={{display:"flex",gap:8,marginBottom:10}}>{sel.image&&<button onClick={()=>{fetch(sel.image).then(r=>r.blob()).then(b=>{const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=sel.name.replace(/[^a-zA-Z0-9]/g,"_")+".jpg";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);});}} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"var(--surface)",border:"1px solid var(--border)",color:"var(--muted)",fontSize:11,fontWeight:600,cursor:"pointer"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Save Photo</button>}{sel.video&&<button onClick={()=>{fetch(sel.video).then(r=>r.blob()).then(b=>{const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=sel.name.replace(/[^a-zA-Z0-9]/g,"_")+".mp4";document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);const n=document.createElement("div");n.style.cssText="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;padding:12px 24px;borderRadius:12px;fontSize:14px;fontWeight:600;zIndex:9999;textAlign:center;maxWidth:320px;boxShadow:0 4px 20px rgba(0,0,0,.3);";n.innerHTML="Video saved to Downloads folder!<br><span style=\"fontSize:12px;opacity:0.9\">Open Downloads to save to your Camera Roll</span>";document.body.appendChild(n);setTimeout(()=>n.remove(),4000);});}} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:8,background:"var(--surface)",border:"1px solid var(--border)",color:"var(--muted)",fontSize:11,fontWeight:600,cursor:"pointer"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Save Video</button>}</div>
              <p style={{fontSize:10,color:"var(--dim)",fontWeight:600,letterSpacing:".06em"}}>SKU: {sel.sku} - {sel.category}</p>
              <h2 style={{fontSize:16,fontWeight:700,marginTop:2,marginBottom:4}}>{sel.name}</h2>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                {sel.salePrice?<><span style={{fontFamily:"'Outfit'",fontSize:14,textDecoration:"line-through",color:"var(--dim)"}}>{fmt(sel.price)}</span><span style={{fontFamily:"'Outfit'",fontSize:20,fontWeight:800,color:"var(--red)"}}>{fmt(sel.salePrice)}</span></>:<span style={{fontFamily:"'Outfit'",fontSize:20,fontWeight:800,color:"#fff"}}>{fmt(sel.price)}</span>}
                {sel.inStock===false&&<span style={{background:"var(--red)",color:"#fff",padding:"2px 10px",borderRadius:6,fontSize:11,fontWeight:700}}>SOLD OUT</span>}
              </div>
              {sel.noDiscount&&<p style={{fontSize:10,color:"var(--dim)",marginTop:4,background:"var(--surface)",display:"inline-block",padding:"2px 8px",borderRadius:4,border:"1px solid var(--border)"}}>No additional discounts apply</p>}
              {sel.description&&<p style={{color:"var(--muted)",fontSize:12,lineHeight:1.5,marginTop:8,marginBottom:8}}>{sel.description}</p>}
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8,marginBottom:12}}>
                <Stars rating={sel.smellRating} label="Smell"/>
                {sel.strain&&<span style={{fontSize:10,color:"var(--dim)"}}>Strain: <strong style={{color:"var(--text)"}}>{sel.strain}</strong></span>}
                {sel.weight&&<span style={{fontSize:10,color:"var(--dim)"}}>Weight/Qty: <strong style={{color:"var(--text)"}}>{sel.weight}</strong></span>}
                {sel.dateAdded&&<span style={{fontSize:10,color:"var(--dim)"}}>Added: <strong style={{color:"var(--text)"}}>{sel.dateAdded}</strong></span>}
                {sel.dateUpdated&&<span style={{fontSize:10,color:"var(--dim)"}}>Updated: <strong style={{color:"var(--text)"}}>{sel.dateUpdated}</strong></span>}
              </div>
              <div style={{display:"flex",gap:10}}>
                {sel.inStock!==false?<button onClick={()=>{addToCart(sel);setSel(null);}} style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,var(--accent),#8b5cf6)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Add to Cart</button>:<div style={{flex:1,padding:"11px",borderRadius:10,background:"var(--border)",color:"var(--dim)",fontSize:14,fontWeight:700,textAlign:"center"}}>Sold Out</div>}
                <button onClick={()=>setSel(null)} style={{padding:"11px 16px",borderRadius:10,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",fontSize:13,cursor:"pointer"}}>Close</button>
              </div>
            </div>
          </div>
        </div>}
        {page==="shop"&&!loading&&<>
          
          <div style={{textAlign:"center",padding:"40px 20px 32px",background:"radial-gradient(ellipse at 50% 0%,var(--accent-glow) 0%,transparent 70%)",marginBottom:28,borderRadius:20}}>
            <h1 style={{fontFamily:"'Outfit'",fontSize:"clamp(26px,5vw,44px)",fontWeight:800,background:"linear-gradient(135deg,var(--text),var(--accent))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:10}}>{SITE_TAGLINE}</h1>
            <p style={{color:"var(--muted)",fontSize:15,maxWidth:460,margin:"0 auto"}}>{SITE_DESCRIPTION}</p>
            {(tgLink||sigLink)&&<div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16,flexWrap:"wrap"}}>
              {tgLink&&<a href={tgLink} target="_blank" rel="noopener" style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:10,background:"#0088cc",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>Telegram</a>}
              {sigLink&&<a href={sigLink} target="_blank" rel="noopener" style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",borderRadius:10,background:"#3a76f0",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5c4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12 7.858 4.5 12 4.5z"/></svg>Signal</a>}
            </div>}
            {BULK_DISCOUNTS.length>0&&<p style={{color:"var(--green)",fontSize:12,marginTop:12}}>{BULK_DISCOUNTS.map(d=>d.label).join(" | ")}</p>}
          </div>
          {announcements.length>0&&<div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>{announcements.map(a=>(<div key={a.id} style={{background:"linear-gradient(135deg,rgba(108,92,231,.12),rgba(139,92,246,.06))",border:"1px solid var(--accent)",borderRadius:14,padding:"14px 18px"}}><div style={{display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:700,color:"var(--accent)"}}><span>*</span><span>{a.title}</span></div><div style={{fontSize:14,color:"var(--text)",whiteSpace:"pre-wrap",lineHeight:1.5,marginTop:4}}>{a.body}</div></div>))}</div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:24,alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{CATEGORIES.map(cat=>(<button key={cat} onClick={()=>setCategory(cat)} style={{padding:viewMode==="compact"?"6px 10px":"8px 16px",borderRadius:viewMode==="compact"?8:10,border:"1px solid "+(category===cat?"var(--accent)":"var(--border)"),background:category===cat?"var(--accent)":"var(--surface)",color:category===cat?"#fff":"var(--muted)",cursor:"pointer",fontSize:13,fontWeight:600}}>{cat}</button>))}</div>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{...is,width:160}}/><select value={sortPrice} onChange={e=>setSortPrice(e.target.value)} style={{...is,width:120,cursor:"pointer"}}><option value="default">Sort</option><option value="low">Price: Low</option><option value="high">Price: High</option></select><label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:"var(--muted)",whiteSpace:"nowrap"}}><input type="checkbox" checked={hideOOS} onChange={e=>setHideOOS(e.target.checked)} style={{accentColor:"var(--accent)",width:16,height:16}}/>Hide Sold Out</label><div style={{display:"flex",gap:2,background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)",padding:2}}><button onClick={()=>setViewMode("default")} style={{padding:"5px 10px",borderRadius:6,border:"none",background:viewMode==="default"?"var(--accent)":"transparent",color:viewMode==="default"?"#fff":"var(--muted)",fontSize:11,fontWeight:600,cursor:"pointer"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button><button onClick={()=>setViewMode("compact")} style={{padding:"5px 10px",borderRadius:6,border:"none",background:viewMode==="compact"?"var(--accent)":"transparent",color:viewMode==="compact"?"#fff":"var(--muted)",fontSize:11,fontWeight:600,cursor:"pointer"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="4" height="4"/><rect x="10" y="3" width="4" height="4"/><rect x="17" y="3" width="4" height="4"/><rect x="3" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="17" y="10" width="4" height="4"/><rect x="3" y="17" width="4" height="4"/><rect x="10" y="17" width="4" height="4"/><rect x="17" y="17" width="4" height="4"/></svg></button></div></div>
          </div>
          {filtered.length===0&&<div style={{textAlign:"center",padding:60,color:"var(--muted)"}}><p>No products listed yet.</p></div>}
          <div style={{display:"grid",gridTemplateColumns:viewMode==="compact"?"repeat(auto-fill,minmax(140px,1fr))":"repeat(auto-fill,minmax(240px,1fr))",gap:viewMode==="compact"?10:16}}>
            {filtered.map((product)=>{const inS=product.inStock!==false;return(<div key={product.id} style={{background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",overflow:"hidden",cursor:"pointer",opacity:inS?1:0.55}} onClick={()=>setSel(product)}>
              <div style={{position:"relative"}}>{product.image?<img src={product.image} alt={product.name} style={{width:"100%",aspectRatio:viewMode==="compact"?"1/1":"3/4",objectFit:"cover",display:"block"}}/>:product.video?<video src={product.video+"#t=0.1"} muted playsInline preload="metadata" style={{width:"100%",aspectRatio:viewMode==="compact"?"1/1":"3/4",objectFit:"cover",display:"block"}}/>:<div style={{width:"100%",aspectRatio:viewMode==="compact"?"1/1":"3/4",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--surface)",color:"var(--dim)",fontSize:13}}>{product.name}</div>}
                {product.video&&<div style={{position:"absolute",bottom:8,left:8,background:"rgba(0,0,0,.6)",color:"#fff",padding:"3px 8px",borderRadius:5,fontSize:10,display:"flex",alignItems:"center",gap:3}}><svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>Video</div>}
                {!inS&&<div style={{position:"absolute",top:10,left:10,background:"var(--red)",color:"#fff",padding:"3px 10px",borderRadius:6,fontSize:10,fontWeight:700}}>SOLD OUT</div>}
                {product.badge&&inS&&<span style={{position:"absolute",top:10,right:10,background:product.badge==="HOT"?"var(--red)":product.badge==="NEW"?"var(--accent)":product.badge==="SALE"?"var(--green)":"var(--gold)",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6}}>{product.badge}</span>}
              </div>
              <div style={{padding:viewMode==="compact"?"8px 10px 10px":"14px 16px 16px"}}>{viewMode!=="compact"&&<p style={{fontSize:10,color:"var(--dim)",fontWeight:600,letterSpacing:".06em",marginBottom:3}}>SKU: {product.sku}</p>}<h3 style={{fontSize:viewMode==="compact"?12:14,fontWeight:600,marginBottom:viewMode==="compact"?2:4,lineHeight:1.3,minHeight:viewMode==="compact"?0:36}}>{product.name}</h3>
                {product.noDiscount&&viewMode!=="compact"&&<p style={{fontSize:9,color:"var(--dim)",marginBottom:4}}>No additional discounts</p>}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontFamily:"'Outfit'",fontWeight:700,color:"#fff"}}>{product.salePrice?<><span style={{fontSize:14,textDecoration:"line-through",color:"var(--dim)",marginRight:4}}>{fmt(product.price)}</span><span style={{fontSize:20,color:"var(--red)"}}>{fmt(product.salePrice)}</span></>:<span style={{fontSize:20}}>{fmt(product.price)}</span>}</span>
                  <button onClick={e=>{e.stopPropagation();inS&&addToCart(product);}} style={{padding:"8px 16px",borderRadius:10,border:"none",background:inS?"linear-gradient(135deg,var(--accent),#8b5cf6)":"var(--border)",color:"#fff",fontSize:12,fontWeight:600,cursor:inS?"pointer":"default"}}>{!inS?"Sold Out":addedId===product.id?"Added!":"Add to Cart"}</button>
                </div>
              </div>
            </div>);})}
          </div>
        </>}
        {page==="cart"&&<div style={{maxWidth:800,margin:"0 auto"}}>
          <button onClick={()=>setPage("shop")} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:14,marginBottom:20}}>Back to Shop</button>
          <h2 style={{fontFamily:"'Outfit'",fontSize:28,fontWeight:700,marginBottom:24}}>Your Cart</h2>
          {bulkLabel&&<div style={{background:"rgba(34,197,94,.1)",border:"1px solid var(--green)",borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:"var(--green)",fontWeight:600}}>{bulkLabel} applied!</div>}
          {cart.length===0?<div style={{textAlign:"center",padding:"60px 20px",background:"var(--surface)",borderRadius:16,border:"1px solid var(--border)"}}><p style={{color:"var(--muted)",fontSize:16,marginBottom:20}}>Your cart is empty</p><button onClick={()=>setPage("shop")} style={{padding:"12px 28px",borderRadius:10,border:"none",background:"var(--accent)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>Browse Products</button></div>
          :<>
            <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:24}}>
              {cart.map(item=>{const ep=getPrice(item);return(<div key={item.id} style={{display:"flex",alignItems:"center",gap:14,background:"var(--card)",borderRadius:14,padding:"14px 18px",border:"1px solid var(--border)",flexWrap:"wrap"}}>
                <div style={{width:48,height:48,borderRadius:10,overflow:"hidden",background:"var(--surface)",flexShrink:0}}>{item.image?<img src={item.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:10,color:"var(--dim)"}}>-</div>}</div>
                <div style={{flex:1,minWidth:100}}><p style={{fontSize:14,fontWeight:600,marginBottom:2}}>{item.name}</p><p style={{fontSize:11,color:"var(--dim)"}}>SKU: {item.sku}{item.salePrice?<span style={{color:"var(--red)",marginLeft:6}}>SALE</span>:""}{item.noDiscount&&bulkDiscount>0?<span style={{marginLeft:6}}>No disc.</span>:""}</p></div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={()=>updateQty(item.id,-1)} style={{width:30,height:30,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
                  <span style={{fontSize:15,fontWeight:600,minWidth:20,textAlign:"center"}}>{item.qty}</span>
                  <button onClick={()=>updateQty(item.id,1)} style={{width:30,height:30,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                </div>
                <div style={{minWidth:80,textAlign:"right"}}><span style={{fontFamily:"'Outfit'",fontWeight:700,fontSize:16}}>{fmt(ep*item.qty)}</span>{bulkDiscount>0&&!item.noDiscount&&<div style={{fontSize:10,color:"var(--green)"}}>-{fmt(bulkDiscount)}/ea</div>}</div>
                <button onClick={()=>rmCart(item.id)} style={{background:"transparent",border:"none",color:"var(--dim)",cursor:"pointer",padding:4,fontSize:16}}>X</button>
              </div>);})}
            </div>
            <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:600,marginBottom:14,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".04em"}}>Shipping Method</h3>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>{SHIPPING_OPTIONS.map(opt=>(<label key={opt.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:"1px solid "+(shipping===opt.id?"var(--accent)":"var(--border)"),background:shipping===opt.id?"rgba(108,92,231,.08)":"transparent",cursor:"pointer"}}><input type="radio" name="ship" value={opt.id} checked={shipping===opt.id} onChange={()=>setShipping(opt.id)} style={{accentColor:"var(--accent)"}}/><span style={{flex:1,fontSize:14,fontWeight:500}}>{opt.label}</span><span style={{fontSize:14,fontWeight:600,color:opt.price===0?"var(--green)":"var(--text)"}}>{opt.price===0?"FREE":fmt(opt.price)}</span></label>))}</div>
            </div>
            <div style={{background:"var(--card)",borderRadius:14,padding:20,border:"1px solid var(--border)",marginBottom:16}}>
              <h3 style={{fontSize:14,fontWeight:600,marginBottom:14,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".04em"}}>Payment Method</h3>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{PAYMENT_METHODS.map(opt=>(<button key={opt.id} onClick={()=>setPayment(opt.id)} style={{padding:"10px 22px",borderRadius:10,border:"1px solid "+(payment===opt.id?"var(--accent)":"var(--border)"),background:payment===opt.id?"rgba(108,92,231,.12)":"var(--surface)",color:payment===opt.id?"#fff":"var(--muted)",cursor:"pointer",fontSize:13,fontWeight:600}}>{opt.label}</button>))}</div>
            </div>
            <div style={{background:"var(--card)",borderRadius:14,padding:24,border:"1px solid var(--border)",marginBottom:20}}>
              <h3 style={{fontSize:14,fontWeight:600,marginBottom:16,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".04em"}}>Order Summary</h3>
              {[{l:"Subtotal",v:fmt(sub)},{l:"Shipping ("+so.label+")",v:so.price===0?"FREE":fmt(so.price),c:so.price===0?"var(--green)":null},{l:"Payment Method",v:po.label}].map((r,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:14,color:"var(--muted)"}}><span>{r.l}</span><span style={{fontWeight:500,color:r.c||"var(--text)"}}>{r.v}</span></div>))}
              {bulkLabel&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:10,fontSize:14}}><span style={{color:"var(--green)"}}>Bulk Discount</span><span style={{fontWeight:500,color:"var(--green)"}}>{bulkLabel}</span></div>}
              <div style={{borderTop:"1px solid var(--border)",paddingTop:14,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:16,fontWeight:700}}>Total Due</span><span style={{fontFamily:"'Outfit'",fontSize:26,fontWeight:800,color:"#fff"}}>{fmt(tot)}</span></div>
              <p style={{fontSize:11,color:"var(--dim)",marginTop:8,textAlign:"center"}}>This total is an estimate. Please message us to confirm.</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <button onClick={copyOrd} style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:copied?"linear-gradient(135deg,var(--green),#16a34a)":"linear-gradient(135deg,var(--accent),#8b5cf6)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",transition:"all .3s"}}>{copied?"Order Copied!":"Copy Order Details"}</button>
              {tgLink&&<button onClick={()=>{window.open(tgLink+"?text="+encodeURIComponent(orderText()),"_blank");}} style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#0088cc,#0077b5)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>Send Order on Telegram</button>}
              {sigLink&&<button onClick={()=>{copyOrd();window.open(sigLink,"_blank");}} style={{width:"100%",padding:"16px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#3a76f0,#2958b5)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5c4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12 7.858 4.5 12 4.5z"/></svg>Send Order on Signal</button>}
            </div>
            {copied&&<p style={{textAlign:"center",marginTop:12,fontSize:13,color:"var(--green)"}}>Paste into Telegram or Signal to submit</p>}
          </>}
        </div>}
      </main>
      <footer style={{borderTop:"1px solid var(--border)",padding:24,textAlign:"center",fontSize:12,color:"var(--dim)"}}>&#169; {new Date().getFullYear()} {SITE_NAME} - All rights reserved</footer>
    </div>
  );
}