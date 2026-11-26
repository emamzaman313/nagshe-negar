import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, UserRound, RefreshCw, ClipboardList } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './admin-users.css'

type Profile={id:string;display_name:string;chat_handle:string|null;member_rank:string;created_at:string}
type Audit={id:number;actor_id:string|null;action:string;subject_type:string;subject_id:string|null;reason:string|null;created_at:string}
type Role='editor'|'teacher'|'moderator'|'seller'
const roles:Role[]=['editor','teacher','moderator','seller']
const roleNames:Record<string,string>={admin:'مدیر',editor:'ویراستار',teacher:'مدرس',moderator:'ناظر',seller:'فروشنده'}
const faDate=(v:string)=>new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))
export function AdminUsersPage(){
 const [user,setUser]=useState<string|null>(null),[admin,setAdmin]=useState(false),[ready,setReady]=useState(false)
 const [profiles,setProfiles]=useState<Profile[]>([]),[roleMap,setRoleMap]=useState<Record<string,string[]>>({}),[audit,setAudit]=useState<Audit[]>([])
 const [query,setQuery]=useState(''),[role,setRole]=useState<Role>('moderator'),[tab,setTab]=useState<'users'|'audit'>('users')
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(''),[notice,setNotice]=useState('')
 useEffect(()=>{if(!supabase){setReady(true);return}supabase.auth.getUser().then(({data})=>{setUser(data.user?.id??null);setReady(true)})},[])
 useEffect(()=>{if(!user||!supabase)return;supabase.from('qnr_user_roles').select('role').eq('user_id',user).eq('role','admin').maybeSingle().then(({data})=>setAdmin(Boolean(data)))},[user])
 const load=useCallback(async()=>{
  if(!supabase||!admin)return
  setLoading(true)
  const [p,a]=await Promise.all([
   supabase.from('qnr_profiles').select('id,display_name,chat_handle,member_rank,created_at').order('created_at',{ascending:false}).limit(150),
   supabase.from('qnr_audit_log').select('id,actor_id,action,subject_type,subject_id,reason,created_at').order('created_at',{ascending:false}).limit(100)
  ])
  if(p.error||a.error){setNotice('اطلاعات مدیریت بارگذاری نشد؛ دسترسی مدیر را بررسی کن.');setLoading(false);return}
  const rows=(p.data??[]) as Profile[];setProfiles(rows);setAudit((a.data??[]) as Audit[])
  if(rows.length){const r=await supabase.from('qnr_user_roles').select('user_id,role').in('user_id',rows.map(x=>x.id));if(r.error)setNotice('نقش کاربران دریافت نشد.');else{const map:Record<string,string[]>={};for(const item of r.data??[])(map[item.user_id]??=[]).push(item.role);setRoleMap(map)}}
  setLoading(false)
 },[admin])
 useEffect(()=>{void load()},[load])
 const visible=useMemo(()=>profiles.filter(p=>(p.display_name+' '+(p.chat_handle??'')+' '+p.id).toLowerCase().includes(query.trim().toLowerCase())),[profiles,query])
 async function changeRole(id:string,grant:boolean){
  if(!supabase)return;setBusy(id);setNotice('')
  const {error}=await supabase.rpc('qnr_admin_set_user_role',{p_user_id:id,p_role:role,p_grant:grant})
  setNotice(error?'تغییر نقش انجام نشد؛ مجوز و وضعیت حساب را بررسی کن.':grant?'نقش با موفقیت اعطا شد.':'نقش با موفقیت لغو شد.')
  await load();setBusy('')
 }
 if(!ready)return <main className="qnr-admin-users"><p>در حال بررسی دسترسی…</p></main>
 if(!admin)return <main className="qnr-admin-users"><h1>مدیریت کاربران</h1><p>این بخش فقط برای مدیران در دسترس است.</p><a href="/account">ورود به حساب</a></main>
 return <main className="qnr-admin-users">
  <header><span><ShieldCheck/> مرکز مدیریت اعضا</span><h1>کاربران و سوابق مدیریتی</h1><p>نقش‌های غیرمدیریتی را با ثبت خودکار رویداد مدیریت کن.</p></header>
  <nav className="qnr-admin-users-tabs"><button className={tab==='users'?'active':''} onClick={()=>setTab('users')}><UserRound/> کاربران ({profiles.length})</button><button className={tab==='audit'?'active':''} onClick={()=>setTab('audit')}><ClipboardList/> سوابق مدیریت ({audit.length})</button><button onClick={()=>void load()}><RefreshCw/> تازه‌سازی</button></nav>
  {tab==='users'?<section className="qnr-admin-users-card">
   <div className="qnr-admin-users-tools"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="جست‌وجو بر اساس نام، شناسه یا شناسه گفتگو"/></label><select value={role} onChange={e=>setRole(e.target.value as Role)}>{roles.map(r=><option key={r} value={r}>{roleNames[r]}</option>)}</select></div>
   {loading?<p>در حال دریافت کاربران…</p>:visible.map(p=><article className="qnr-admin-user" key={p.id}><div className="qnr-admin-user-info"><b>{p.display_name||'عضو نقش‌نگار'}</b><small>{p.chat_handle?'@'+p.chat_handle:'بدون شناسه گفتگو'} · عضویت {faDate(p.created_at)}</small><code>{p.id}</code><div className="qnr-admin-role-chips">{(roleMap[p.id]??[]).map(r=><span key={r}>{roleNames[r]??r}</span>)}</div></div><div className="qnr-admin-user-actions">{(roleMap[p.id]??[]).includes(role)?<button className="secondary" disabled={busy===p.id} onClick={()=>void changeRole(p.id,false)}>لغو نقش</button>:<button disabled={busy===p.id} onClick={()=>void changeRole(p.id,true)}>اعطای نقش</button>}</div></article>)}
   {!visible.length&&!loading&&<p>کاربری با این عبارت پیدا نشد.</p>}
  </section>:<section className="qnr-admin-users-card"><h2>آخرین رویدادهای ثبت‌شده</h2>{audit.map(a=><article className="qnr-admin-audit" key={a.id}><b>{a.action}</b><span>{a.subject_type} · {a.subject_id??'—'}</span><small>{a.reason??'بدون توضیح'} · {faDate(a.created_at)}</small></article>)}</section>}
  {notice&&<p className="qnr-admin-users-notice" role="status">{notice}</p>}
 </main>
}
