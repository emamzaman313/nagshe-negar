import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, Eye, FileVideo, Image as ImageIcon, RefreshCw, ShieldCheck, Trash2, X } from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import './social-moderation-admin.css'

type Post = { id:string; author_id:string; media_path:string; media_type:'image'|'video'; caption:string; status:string; moderation_note:string|null; created_at:string; author:string; url:string }
type Report = { id:string; reporter_id:string; post_id:string; reason:string; details:string; status:string; created_at:string; reporter:string; postCaption:string; postType:string; postUrl:string }
type Comment = { id:string; post_id:string; author_id:string; body:string; status:string; created_at:string; author:string }

const faDate=(v:string)=>new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))
const reasonLabel:Record<string,string>={spam:'هرزنامه',harassment:'آزار و توهین',copyright:'نقض حق نشر',unsafe:'محتوای ناامن',other:'سایر'}

export function SocialModerationAdminPage(){
 const [user,setUser]=useState<string|null>(null),[admin,setAdmin]=useState(false),[authReady,setAuthReady]=useState(false)
 const [tab,setTab]=useState<'posts'|'reels'|'reports'|'comments'>('posts')
 const [posts,setPosts]=useState<Post[]>([]),[reports,setReports]=useState<Report[]>([]),[comments,setComments]=useState<Comment[]>([])
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const [reasons,setReasons]=useState<Record<string,string>>({})

 useEffect(()=>{
  if(!supabase){setAuthReady(true);setLoading(false);return}
  supabase.auth.getSession().then(({data,error:e})=>{if(e)setError('وضعیت ورود بررسی نشد.');setUser(data.session?.user.id??null);setAuthReady(true)})
  const {data}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user.id??null);setAuthReady(true)})
  return()=>data.subscription.unsubscribe()
 },[])

 const load=useCallback(async()=>{
  if(!supabase||!user){setAdmin(false);setPosts([]);setReports([]);setComments([]);setLoading(false);return}
  setLoading(true);setError('')
  try{
   const role=await supabase.from('qnr_user_roles').select('role').eq('user_id',user).eq('role','admin').maybeSingle()
   if(role.error)throw role.error
   if(!role.data){setAdmin(false);setPosts([]);setReports([]);setComments([]);return}
   setAdmin(true)
   const [postRes,reportRes,commentRes]=await Promise.all([
    supabase.from('qnr_social_posts').select('id,author_id,media_path,media_type,caption,status,moderation_note,created_at').eq('status','pending').order('created_at',{ascending:true}).limit(100),
    supabase.from('qnr_social_reports').select('id,reporter_id,post_id,reason,details,status,created_at').eq('status','open').order('created_at',{ascending:true}).limit(100),
    supabase.from('qnr_social_comments').select('id,post_id,author_id,body,status,created_at').in('status',['published','hidden']).order('created_at',{ascending:false}).limit(100)
   ])
   if(postRes.error)throw postRes.error
   if(reportRes.error)throw reportRes.error
   if(commentRes.error)throw commentRes.error
   const pRows=postRes.data??[],rRows=reportRes.data??[],cRows=commentRes.data??[]
   const authorIds=[...new Set([...pRows.map(x=>x.author_id),...cRows.map(x=>x.author_id),...rRows.map(x=>x.reporter_id)])]
   const postIds=[...new Set([...pRows.map(x=>x.id),...rRows.map(x=>x.post_id),...cRows.map(x=>x.post_id)])]
   const [profiles,relatedPosts]=await Promise.all([
    authorIds.length?supabase.from('qnr_social_public_profiles').select('user_id,display_name').in('user_id',authorIds):Promise.resolve({data:[],error:null}),
    postIds.length?supabase.from('qnr_social_posts').select('id,caption,media_type,media_path,author_id').in('id',postIds):Promise.resolve({data:[],error:null})
   ])
   if(profiles.error)throw profiles.error
   if(relatedPosts.error)throw relatedPosts.error
   const names=new Map((profiles.data??[]).map(x=>[x.user_id,x.display_name]))
   const postMap=new Map((relatedPosts.data??[]).map(x=>[x.id,x]))
   // A single orphaned/deleted media object must not take down every moderation queue.
   // Keep the text/report row actionable and render its existing "preview unavailable" state.
   const signedMediaUrl=async(path:string)=>{
    try{
     const {data,error}=await supabase!.storage.from('qnr-social-media').createSignedUrl(path,1800)
     if(error||!data?.signedUrl)return ''
     return data.signedUrl
    }catch{
     return ''
    }
   }
   const hydrated=await Promise.all(pRows.map(async p=>({
    ...p,author:names.get(p.author_id)??'هنرمند نقش‌نگار',url:await signedMediaUrl(p.media_path)
   } as Post)))
   const hydratedReports=await Promise.all(rRows.map(async r=>{
    const p=postMap.get(r.post_id)
    return {...r,reporter:names.get(r.reporter_id)??'کاربر',postCaption:p?.caption??'محتوا در دسترس نیست',postType:p?.media_type??'unknown',postUrl:p?.media_path?await signedMediaUrl(p.media_path):''} as Report
   }))
   setPosts(hydrated)
   setReports(hydratedReports)
   setComments(cRows.map(c=>({...c,author:names.get(c.author_id)??'هنرمند نقش‌نگار'} as Comment)))
  }catch(e){setError('دریافت اطلاعات مدیریت ناموفق بود: '+((e as {message?:string})?.message??'خطای نامشخص'))}
  finally{setLoading(false)}
 },[user])

 useEffect(()=>{if(authReady)void load()},[authReady,load])

 async function act(targetType:'post'|'report'|'comment',id:string,action:string){
  if(!supabase||busy)return
  const reason=(reasons[id]??'').trim()
  if(targetType==='post'&&['reject','hide'].includes(action)&&!reason){setError('برای رد یا پنهان‌سازی اثر، دلیل را بنویس.');return}
  if(targetType==='comment'&&action==='hide'&&!reason){setError('برای پنهان‌سازی دیدگاه، دلیل را بنویس.');return}
  setBusy(id);setError('');setNotice('')
  try{
   const {error:e}=await supabase.rpc('qnr_admin_moderate_social_content',{p_target_type:targetType,p_target_id:id,p_action:action,p_reason:reason||null})
   if(e)throw e
   setNotice('عملیات با موفقیت ثبت شد و در سوابق مدیریتی ذخیره شد.')
   setReasons(v=>({...v,[id]:''}))
   await load()
  }catch(e){setError('عملیات ثبت نشد: '+((e as {message?:string})?.message??'خطای نامشخص'))}
  finally{setBusy('')}
 }

 if(!supabaseConfigured)return <main className="nn-mod-page"><section className="nn-mod-empty"><ShieldCheck/><h1>مدیریت جامعه</h1><p>تنظیمات اتصال سرویس در دسترس نیست.</p></section></main>
 if(!authReady||loading)return <main className="nn-mod-page"><div className="nn-mod-loading">در حال بررسی دسترسی و بارگذاری صف‌ها…</div></main>
 if(!user||!admin)return <main className="nn-mod-page"><section className="nn-mod-empty"><ShieldCheck/><h1>دسترسی مدیریت لازم است</h1><p>این بخش فقط برای مدیران مجاز است.</p><a href="/account">ورود به حساب</a></section></main>

 const visiblePosts=tab==='reels'?posts.filter(p=>p.media_type==='video'):posts.filter(p=>p.media_type!=='video')
 return <main className="nn-mod-page">
  <header className="nn-mod-hero"><div><span>مرکز ایمنی و نظارت</span><h1>مدیریت جامعه</h1><p>بررسی ریلز، پست‌ها، گزارش‌های کاربران و دیدگاه‌ها از یک صف یکپارچه.</p></div><button type="button" onClick={()=>void load()} disabled={!!busy}><RefreshCw size={17}/> تازه‌سازی</button></header>
  <section className="nn-mod-stats" aria-label="خلاصه نظارت">
   <article><span>در انتظار بررسی</span><strong>{posts.length.toLocaleString('fa-IR')}</strong></article>
   <article><span>ریلزهای منتظر</span><strong>{posts.filter(p=>p.media_type==='video').length.toLocaleString('fa-IR')}</strong></article>
   <article><span>پست‌های تصویری منتظر</span><strong>{posts.filter(p=>p.media_type!=='video').length.toLocaleString('fa-IR')}</strong></article>
   <article><span>گزارش‌های باز</span><strong>{reports.length.toLocaleString('fa-IR')}</strong></article>
  </section>
  <nav className="nn-mod-tabs">
   <button className={tab==='posts'?'active':''} onClick={()=>setTab('posts')}><ImageIcon size={17}/> پست‌های تصویری <b>{posts.filter(p=>p.media_type!=='video').length.toLocaleString('fa-IR')}</b></button>
   <button className={tab==='reels'?'active':''} onClick={()=>setTab('reels')}><FileVideo size={17}/> تأیید ریلز <b>{posts.filter(p=>p.media_type==='video').length.toLocaleString('fa-IR')}</b></button>
   <button className={tab==='reports'?'active':''} onClick={()=>setTab('reports')}><AlertTriangle size={17}/> گزارش‌های باز <b>{reports.length.toLocaleString('fa-IR')}</b></button>
   <button className={tab==='comments'?'active':''} onClick={()=>setTab('comments')}><Eye size={17}/> دیدگاه‌ها <b>{comments.length.toLocaleString('fa-IR')}</b></button>
  </nav>
  {error&&<p className="nn-mod-message error" role="alert">{error}</p>}
  {notice&&<p className="nn-mod-message success" role="status">{notice}</p>}
  {(tab==='posts'||tab==='reels')&&<section className="nn-mod-list">{visiblePosts.length?visiblePosts.map(p=><article className="nn-mod-card" key={p.id}>
   <div className="nn-mod-media">{p.url?(p.media_type==='video'?<video src={p.url} controls playsInline preload="metadata"/>:<img src={p.url} alt="پیش‌نمایش اثر"/>):<span>رسانه قابل بارگذاری نیست</span>}</div>
   <div className="nn-mod-body"><div className="nn-mod-meta"><b>{p.media_type==='video'?'ریلز / ویدئو':'تصویر'}</b><span>{p.author}</span><time>{faDate(p.created_at)}</time></div><p>{p.caption}</p><label>دلیل تصمیم (برای رد یا پنهان‌سازی الزامی)<textarea maxLength={1000} value={reasons[p.id]??''} onChange={e=>setReasons(v=>({...v,[p.id]:e.target.value}))} placeholder="دلیل را کوتاه و روشن بنویس…"/></label><div className="nn-mod-actions"><button className="approve" disabled={busy===p.id} onClick={()=>void act('post',p.id,'approve')}><Check size={16}/> تأیید و انتشار</button><button className="reject" disabled={busy===p.id} onClick={()=>void act('post',p.id,'reject')}><X size={16}/> رد اثر</button><button className="quiet" disabled={busy===p.id} onClick={()=>void act('post',p.id,'hide')}><Eye size={16}/> پنهان‌سازی</button></div></div>
  </article>):<div className="nn-mod-empty"><Check/><h2>{tab==='reels'?'صف تأیید ریلز خالی است':'صف بررسی پست‌ها خالی است'}</h2><p>مورد تازه‌ای برای بررسی وجود ندارد.</p></div>}</section>}
  {tab==='reports'&&<section className="nn-mod-list">{reports.length?reports.map(r=><article className="nn-mod-report" key={r.id}><div><span className="nn-mod-reason">{reasonLabel[r.reason]??r.reason}</span><h2>{r.postCaption}</h2><p>گزارش‌دهنده: {r.reporter} · {faDate(r.created_at)}</p>{r.details&&<blockquote>{r.details}</blockquote>}<div className="nn-mod-reported-media">{r.postUrl?(r.postType==='video'?<video src={r.postUrl} controls playsInline preload="metadata"/>:<img src={r.postUrl} alt="محتوای گزارش‌شده"/>):<span>پیش‌نمایش رسانه موجود نیست</span>}<div><b>{r.postType==='video'?'ریلز گزارش‌شده':'پست تصویری گزارش‌شده'}</b><small>شناسه اثر: {r.post_id}</small></div></div><label>دلیل اقدام روی اثر<textarea maxLength={1000} value={reasons[r.post_id]??''} onChange={e=>setReasons(v=>({...v,[r.post_id]:e.target.value}))} placeholder="برای پنهان‌سازی، دلیل را وارد کن…"/></label></div><div className="nn-mod-actions"><button className="approve" disabled={busy===r.id} onClick={()=>void act('report',r.id,'review')}><Check size={16}/> رسیدگی شد</button><button className="quiet" disabled={busy===r.id} onClick={()=>void act('report',r.id,'dismiss')}><X size={16}/> رد گزارش</button><button className="reject" disabled={busy===r.id} onClick={()=>void act('post',r.post_id,'hide')}><Trash2 size={16}/> پنهان‌سازی اثر</button></div></article>):<div className="nn-mod-empty"><Check/><h2>گزارش بازی وجود ندارد</h2><p>همهٔ گزارش‌ها رسیدگی شده‌اند.</p></div>}</section>}
  {tab==='comments'&&<section className="nn-mod-list">{comments.length?comments.map(c=><article className="nn-mod-comment" key={c.id}><div><div className="nn-mod-meta"><b>{c.author}</b><time>{faDate(c.created_at)}</time><span className={c.status==='hidden'?'hidden':'visible'}>{c.status==='hidden'?'پنهان':'نمایش داده می‌شود'}</span></div><p>{c.body}</p><small>اثر مرتبط: {c.post_id}</small></div><div className="nn-mod-actions">{c.status==='published'?<><textarea aria-label="دلیل پنهان‌سازی" maxLength={1000} placeholder="دلیل پنهان‌سازی…" value={reasons[c.id]??''} onChange={e=>setReasons(v=>({...v,[c.id]:e.target.value}))}/><button className="reject" disabled={busy===c.id} onClick={()=>void act('comment',c.id,'hide')}>پنهان‌سازی</button></>:<button className="approve" disabled={busy===c.id} onClick={()=>void act('comment',c.id,'restore')}>بازگردانی</button>}</div></article>):<div className="nn-mod-empty"><Check/><h2>دیدگاهی وجود ندارد</h2></div>}</section>}
 </main>
}
