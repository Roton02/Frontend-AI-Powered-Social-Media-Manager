"use client";
import {useEffect,useState} from "react";
import {api} from "@/lib/api";
import {useWorkspace} from "@/lib/workspace-context";
import {AIKnowledgeBase} from "@/lib/types";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {toast} from "sonner";
const fields=[['business_description','Business description'],['products_services','Products and services'],['opening_hours','Opening hours'],['delivery_information','Delivery information'],['return_policy','Return and refund policy'],['custom_instructions','Custom AI instructions']] as const;
export default function AIPage(){
 const {workspace,updateSettings}=useWorkspace();
 const [enabled,setEnabled]=useState(false),[form,setForm]=useState<Record<string,string>>({}),[entries,setEntries]=useState<AIKnowledgeBase[]>([]);
 const [editingId,setEditingId]=useState("");
 const [question,setQuestion]=useState(""),[answer,setAnswer]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function load(){try{setEntries(await api.get<AIKnowledgeBase[]>("/ai/knowledge-base",{workspace:true}));setError("");}catch{setError("Could not load your knowledge base. Please retry.");}}
 useEffect(()=>{setEnabled(workspace?.settings?.ai_auto_reply===true);setForm(Object.fromEntries(fields.map(([k])=>[k,String(workspace?.settings?.[k]||'')])));void load();},[workspace]);
 async function save(){setBusy(true);try{await updateSettings({...form,ai_auto_reply:enabled});toast.success("Business information saved");}catch(e){toast.error(e instanceof Error?e.message:"Please retry.");}finally{setBusy(false);}}
 async function add(){setBusy(true);try{if(editingId) await api.patch(`/ai/knowledge-base/${editingId}`,{question,answer,category:"FAQ"},{workspace:true}); else await api.post("/ai/knowledge-base",{question,answer,category:"FAQ"},{workspace:true});setEditingId("");setQuestion("");setAnswer("");await load();}catch(e){toast.error(e instanceof Error?e.message:"Please retry.");}finally{setBusy(false);}}
 async function remove(id:string){try{await api.delete(`/ai/knowledge-base/${id}`,{workspace:true});await load();}catch{toast.error("Could not delete entry.");}}
 return <div className="max-w-3xl space-y-6"><h1 className="text-3xl font-bold">AI and business knowledge</h1><p>Automatic replies use your saved business information. Missing information is sent for human assistance. Keep prices, availability and policies current.</p>
 <label className="flex gap-3"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Enable automatic replies for this workspace</label>
 {fields.map(([key,label])=><label className="block" key={key}>{label}<Textarea value={form[key]||''} maxLength={key==='opening_hours'?1000:key==='custom_instructions'?2000:4000} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<Button disabled={busy} onClick={save}>Save settings</Button>
 <h2 className="text-xl font-bold">Frequently asked questions</h2>{error&&<p role="alert">{error} <Button onClick={load}>Retry</Button></p>}
 <label className="block">Question<Input value={question} maxLength={500} onChange={e=>setQuestion(e.target.value)}/></label><label className="block">Verified answer<Textarea value={answer} maxLength={2000} onChange={e=>setAnswer(e.target.value)}/></label><Button disabled={busy||!question.trim()||!answer.trim()} onClick={add}>{editingId?"Update FAQ":"Add FAQ"}</Button>
 {entries.map(e=><article key={e.id} className="p-4 border rounded space-y-2"><strong>{e.question}</strong><p>{e.answer}</p><Button variant="outline" onClick={()=>{setEditingId(e.id);setQuestion(e.question);setAnswer(e.answer);}}>Edit</Button> <Button variant="outline" onClick={()=>remove(e.id)}>Delete</Button></article>)}</div>;
}
