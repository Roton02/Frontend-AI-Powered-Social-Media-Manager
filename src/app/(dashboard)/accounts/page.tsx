"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SocialAccount } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
type Page = {id:string;name:string;instagram:{id:string;name:string}|null};
export default function AccountsPage() {
  const [accounts,setAccounts]=useState<SocialAccount[]>([]);
  const [pages,setPages]=useState<Page[]>([]);
  const [selected,setSelected]=useState<string[]>([]);
  const [selection,setSelection]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function load(){try{setAccounts(await api.get<SocialAccount[]>("/social/accounts",{workspace:true}));setError("");}catch{setError("Could not load accounts. Please retry.");}}
  useEffect(()=>{
    void load(); const params=new URLSearchParams(window.location.search); const key=params.get("selection");
    if(params.has("error")&&params.get("error")!=="youtube_no_channel") setError("Connection was not completed. Please reconnect and allow access to your pages.");
    if(params.get("connected")==="linkedin") toast.success("LinkedIn profile connected");
    if(params.get("connected")==="youtube") toast.success("YouTube channel connected");
    if(params.get("connected")==="tiktok") toast.success("TikTok account connected");
    if(params.get("connected")==="x") toast.success("X profile connected");
    if(params.get("error")==="youtube_no_channel") setError("This Google account has no YouTube channel. Create a channel on YouTube, then reconnect.");
    if(key){setSelection(key);api.get<Page[]>(`/social/selection?selection=${encodeURIComponent(key)}`,{workspace:true}).then(setPages).catch(()=>setError("Page selection expired. Please reconnect."));}
    window.history.replaceState({},"",window.location.pathname);
  },[]);
  async function connect(platform:string){setBusy(true);try{const {url}=await api.get<{url:string}>(`/social/auth/${platform}`,{workspace:true});window.location.assign(url);}catch(e){toast.error(e instanceof Error?e.message:"Please try again.");setBusy(false);}}
  async function confirm(){setBusy(true);try{await api.post("/social/selection",{selection,pageIds:selected},{workspace:true});setSelection("");setPages([]);await load();toast.success("Accounts connected");}catch(e){toast.error(e instanceof Error?e.message:"Please retry.");}finally{setBusy(false);}}
  async function disconnect(id:string){setBusy(true);try{await api.delete(`/social/accounts/${id}`,{workspace:true});await load();}catch{toast.error("Could not disconnect. Please retry.");}finally{setBusy(false);}}
  return <div className="space-y-6"><h1 className="text-3xl font-bold">Connect Social Accounts</h1>
    <p>Connect Facebook Pages, linked Instagram Professional accounts, your LinkedIn profile and Pages, YouTube channels, TikTok accounts and X profiles to your business.</p>
    {error && <p role="alert">{error} <Button variant="outline" onClick={load}>Retry</Button></p>}
    <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={()=>connect("facebook")}>Connect Facebook</Button><Button disabled={busy} onClick={()=>connect("instagram")}>Connect Instagram</Button><Button disabled={busy} onClick={()=>connect("linkedin")}>Connect LinkedIn profile</Button><Button disabled={busy} onClick={()=>connect("linkedin-pages")}>Connect LinkedIn Page</Button><Button disabled={busy} onClick={()=>connect("youtube")}>Connect YouTube</Button><Button disabled={busy} onClick={()=>connect("tiktok")}>Connect TikTok</Button><Button disabled={busy} onClick={()=>connect("x")}>Connect X</Button></div>
    {selection && <Card><CardContent className="p-6 space-y-3"><h2 className="font-semibold">Choose your pages</h2>
      {!pages.length && <p>No eligible pages found. Check that you are an admin of the Page (and, for Instagram, that it is linked as a Professional account), then reconnect.</p>}
      {pages.map(p=><label key={p.id} className="flex gap-3"><input type="checkbox" checked={selected.includes(p.id)} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/>{p.name}{p.instagram?` · Instagram: ${p.instagram.name}`:""}</label>)}
      <Button disabled={busy||!selected.length} onClick={confirm}>Confirm connection</Button></CardContent></Card>}
    {accounts.map(a=><Card key={a.id}><CardContent className="p-6 space-y-3"><h2 className="font-semibold">{a.accountName} · {a.platform}</h2><p>{a.connectionStatus.replaceAll("_"," ")}</p><p>Available: {Object.entries(a.capabilities).filter(([,v])=>v).map(([k])=>k).join(", ")||"Reconnect to enable features"}</p>
      <div className="flex gap-3"><Button disabled={busy} variant="outline" onClick={()=>connect(a.platform==="LINKEDIN"&&a.kind==="page"?"linkedin-pages":a.platform.toLowerCase())}>Reconnect</Button><Button disabled={busy||a.connectionStatus==="DISCONNECTED"} variant="outline" onClick={()=>disconnect(a.id)}>Disconnect</Button></div></CardContent></Card>)}
    <p className="text-sm text-slate-500">LinkedIn profile posts as you; LinkedIn Page posts as a company Page you administer. YouTube posts are video uploads. TikTok and X are planned integrations.</p>
  </div>;
}
