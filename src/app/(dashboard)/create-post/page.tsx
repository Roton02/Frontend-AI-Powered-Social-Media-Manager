"use client";
import { useEffect, useState } from "react";
import { api, getToken } from "@/lib/api";
import { SocialAccount } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
export default function CreatePostPage(){
 const [accounts,setAccounts]=useState<SocialAccount[]>([]),[accountIds,setAccountIds]=useState<string[]>([]);
 const chosen=accounts.filter(a=>accountIds.includes(a.id)),hasInstagram=chosen.some(a=>a.platform==="INSTAGRAM");
 // Videos go to YouTube and TikTok only; both require one.
 const videoPlatforms=["YOUTUBE","TIKTOK"],hasYoutube=chosen.some(a=>a.platform==="YOUTUBE"),hasTiktok=chosen.some(a=>a.platform==="TIKTOK");
 const needsVideo=chosen.some(a=>videoPlatforms.includes(a.platform)),hasImagePlatform=chosen.some(a=>!videoPlatforms.includes(a.platform));
 const limits:Record<string,number>={INSTAGRAM:2200,LINKEDIN:3000,YOUTUBE:5000,TIKTOK:2200,X:280};
 const textLimit=Math.min(63206,...chosen.map(a=>limits[a.platform]??63206));
 const toggle=(id:string,on:boolean)=>setAccountIds(ids=>on?[...ids,id]:ids.filter(x=>x!==id));
 const [content,setContent]=useState(""),[mediaUrl,setMediaUrl]=useState(""),[mediaType,setMediaType]=useState<"image"|"video">("image"),[scheduledAt,setScheduledAt]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 useEffect(()=>{api.get<SocialAccount[]>("/social/accounts",{workspace:true}).then(rows=>setAccounts(rows.filter(a=>a.capabilities.publishing))).catch(()=>setError("Could not load accounts. Please reload."));},[]);
 async function upload(file?:File){if(!file)return;
  const video=file.type==="video/mp4";
  if(video?file.size>100*1024*1024:(file.type!=="image/jpeg"||file.size>8*1024*1024)){toast.error("Choose a JPEG image up to 8 MB or an MP4 video up to 100 MB.");return;}
  setBusy(true);try{
  const body=new FormData();body.append("file",file);
  const response=await fetch(`${process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000"}/api/v1/upload/${video?"post-video":"post-image"}`,{method:"POST",headers:{Authorization:`Bearer ${getToken()}`},body});
  const result=await response.json();if(!response.ok)throw new Error(result.message||"Upload failed");setMediaUrl(result.result.url);setMediaType(video?"video":"image");
 }catch(e){toast.error(e instanceof Error?e.message:"Upload failed");}finally{setBusy(false);}}
 async function save(draft:boolean){
 if(needsVideo&&(!mediaUrl||mediaType!=="video")){toast.error("YouTube and TikTok require an MP4 video.");return;}
 if(mediaUrl&&mediaType==="video"&&hasImagePlatform){toast.error("Videos can only be posted to YouTube and TikTok for now. Untick the other accounts or remove the video.");return;}
 if(hasInstagram&&(!mediaUrl||mediaType!=="image")){toast.error("Instagram requires a JPEG image.");return;}
 if(hasInstagram&&content.length>2200){toast.error("Instagram captions can be at most 2,200 characters.");return;}
 if(content.length>textLimit){toast.error(`Text can be at most ${textLimit.toLocaleString()} characters for the selected accounts.`);return;}
 if(!draft&&scheduledAt&&(!Number.isFinite(new Date(scheduledAt).getTime())||new Date(scheduledAt).getTime()<=Date.now())){toast.error("Choose a future date and time.");return;}
 setBusy(true);
 // One post per account (the API stores one row/job per account). Accounts that succeed are
 // removed from the selection, so retrying after a partial failure never posts twice.
 const failed:string[]=[];
 for(const account of chosen){try{await api.post("/publishing",{content,accountId:account.id,mediaUrls:mediaUrl?[mediaUrl]:[],draft,...(!draft&&scheduledAt?{scheduledAt:new Date(scheduledAt).toISOString()}:{})},{workspace:true});setAccountIds(ids=>ids.filter(id=>id!==account.id));}
  catch(e){failed.push(`${account.accountName} (${account.platform}): ${e instanceof Error?e.message:"please retry"}`);}}
 setBusy(false);
 const done=chosen.length-failed.length;
 if(done)toast.success(draft?`Draft saved for ${done} account${done>1?"s":""}`:`Post queued for ${done} account${done>1?"s":""}. Check Scheduler for the results.`);
 if(failed.length){toast.error(`Not saved for: ${failed.join("; ")}. Those accounts are still selected so you can retry.`);return;}
 setContent("");setMediaUrl("");setScheduledAt("");}
 return <div className="max-w-2xl space-y-5"><h1 className="text-3xl font-bold">Create post</h1>{error&&<p role="alert">{error}</p>}
 <fieldset className="space-y-2"><legend className="mb-2">Post to (choose one or more)</legend>{accounts.length>1&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accountIds.length===accounts.length} onChange={e=>setAccountIds(e.target.checked?accounts.map(a=>a.id):[])}/>Select all</label>}
 {accounts.map(a=><label key={a.id} className="flex items-center gap-2 p-3 border rounded"><input type="checkbox" value={a.id} checked={accountIds.includes(a.id)} onChange={e=>toggle(a.id,e.target.checked)}/>{a.accountName} · {a.platform}</label>)}</fieldset>
 {!accounts.length&&<p>Connect an account with publishing access in Accounts.</p>}
 <label className="block">Post text<Textarea value={content} onChange={e=>setContent(e.target.value)} maxLength={textLimit}/></label>
 <label className="block">Media: JPEG image up to 8 MB (required for Instagram) or MP4 video up to 100 MB (YouTube and TikTok only, required for both). Images for X must be 5 MB or smaller.<Input type="file" accept="image/jpeg,video/mp4" disabled={busy} onChange={e=>upload(e.target.files?.[0])}/></label>
 {hasTiktok&&<p className="text-sm text-slate-500">TikTok uses your text as the caption. Until TikTok approves this app, TikTok posts are only visible to you.</p>}
 {hasYoutube&&<p className="text-sm text-slate-500">YouTube uses the first line of your text as the video title (up to 100 characters) and the full text as the description.</p>}
 {mediaUrl&&<p>{mediaType==="video"?"Video":"Image"} uploaded. <Button variant="outline" onClick={()=>setMediaUrl("")}>Remove {mediaType}</Button></p>}
 <label className="block">Schedule (optional)<Input type="datetime-local" className="[color-scheme:light]" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/></label>
 <p className="text-sm text-slate-500">Times use your device’s time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}. Schedules are saved in UTC.</p>
 <div className="flex gap-3"><Button disabled={busy||!accountIds.length||(!content.trim()&&!mediaUrl)} onClick={()=>save(false)}>{scheduledAt?"Schedule post":"Publish now"}</Button><Button variant="outline" disabled={busy||!accountIds.length||(!content.trim()&&!mediaUrl)} onClick={()=>save(true)}>Save draft</Button></div></div>;
}
