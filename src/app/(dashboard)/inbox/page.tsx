"use client";
import {useCallback,useEffect,useState} from "react";
import {api} from "@/lib/api";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {useWorkspace} from "@/lib/workspace-context";
import {toast} from "sonner";
type Message={id:string;text:string;direction:string;status:string;timestamp:string;aiSuggestion?:string};
type Conversation={id:string;senderId:string;platform:string;aiEnabled:boolean;humanTakeover:boolean;messages:Message[]};
export default function InboxPage(){
 const {workspace}=useWorkspace();
 const [conversations,setConversations]=useState<Conversation[]>([]),[activeId,setActiveId]=useState("");
 const [text,setText]=useState(""),[requestId,setRequestId]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const load=useCallback(async()=>{try{setConversations(await api.get<Conversation[]>("/social/conversations",{workspace:true}));setError("");}catch{setError("Could not load inbox. Please retry.");}},[]);
 useEffect(()=>{void load();const timer=setInterval(load,5000);return()=>clearInterval(timer);},[load]);
 const active=conversations.find(c=>c.id===activeId);
 const incoming=active?.messages.filter(m=>m.direction==='incoming').at(-1);
 async function select(c:Conversation){setActiveId(c.id);setText("");setRequestId(crypto.randomUUID());const message=c.messages.find(m=>m.status==='unread');if(message)try{await api.patch(`/social/inbox/${message.id}/read`,{},{workspace:true});await load();}catch{toast.error("Could not mark conversation as read.");}}
 async function takeover(){if(!active)return;setBusy(true);try{await api.patch(`/social/conversations/${active.id}/takeover`,{enabled:!active.humanTakeover},{workspace:true});await load();}catch(e){toast.error(e instanceof Error?e.message:"Please retry.");}finally{setBusy(false);}}
 async function reply(){if(!incoming)return;setBusy(true);try{await api.post(`/social/inbox/${incoming.id}/reply`,{text,requestId},{workspace:true});setText("");setRequestId(crypto.randomUUID());await load();}catch(e){toast.error(e instanceof Error?e.message:"Please retry.");await load();}finally{setBusy(false);}}
 return <div className="space-y-4"><h1 className="text-3xl font-bold">Unified inbox</h1><p>Workspace automatic replies: {workspace?.settings?.ai_auto_reply?'Enabled':'Disabled'}</p>{error&&<p role="alert">{error} <Button onClick={load}>Retry</Button></p>}
 <div className="grid md:grid-cols-[280px_1fr] gap-5"><div className="space-y-2">{!conversations.length&&<p>No conversations yet.</p>}{conversations.map(c=><button key={c.id} onClick={()=>select(c)} className={`block w-full p-4 text-left rounded border ${c.id===activeId?'bg-blue-50':'bg-white'}`}><strong>{c.platform}</strong><p className="truncate">{c.senderId}</p>{c.messages.some(m=>m.status==='unread'&&m.direction==='incoming')&&<span className="text-blue-700">Unread</span>}</button>)}</div>
 <section className="border rounded-xl p-5 bg-white space-y-4">{active?<><div className="flex justify-between gap-3"><p>{active.humanTakeover?'Human takeover':active.aiEnabled?'AI allowed':'AI disabled'}</p><Button variant="outline" disabled={busy} onClick={takeover}>{active.humanTakeover?'Allow AI replies':'Take over'}</Button></div>
 <div className="max-h-[55vh] overflow-y-auto space-y-3">{active.messages.map(m=><div key={m.id} className={`p-3 rounded ${m.direction==='incoming'?'bg-slate-100':'bg-blue-50 ml-8'}`}><p className="text-xs">{m.direction==='incoming'?'Customer':m.direction==='ai'?'AI':'You'} · {new Date(m.timestamp).toLocaleString()} · {m.status}</p><p className="whitespace-pre-wrap">{m.text}</p>{m.aiSuggestion&&<p className="text-sm mt-2">AI suggestion: {m.aiSuggestion}</p>}</div>)}</div>
 <label className="block">Your reply<Textarea value={text} disabled={busy} maxLength={2000} onChange={e=>{setText(e.target.value);setRequestId(crypto.randomUUID());}}/></label><Button disabled={busy||!text.trim()||!incoming} onClick={reply}>Send reply</Button></>:<p>Select a conversation.</p>}</section></div></div>;
}
