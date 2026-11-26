import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Bookmark, Heart, ImagePlus, MessageCircle, Play, Send, Share2, ShieldCheck, UserPlus, Users, Video, X } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { validateSocialCaption, validateSocialMedia, type SocialMediaKind } from '../lib/social-validation'
import './social.css'

type Tab = 'feed' | 'reels' | 'saved' | 'review'
type Row = { id:string; author_id:string; media_path:string; media_type:SocialMediaKind; caption:string; visibility:'public'|'followers'; status:string; created_at:string }
type Post = Row & { author:string; url:string; likes:number; comments:number; liked:boolean; saved:boolean; following:boolean }
type Comment = { id:string; author_id:string; body:string; created_at:string }

const faDate = (v:string) => new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))
async function stripImageMetadata(file:File):Promise<File> {
  if (!file.type.startsWith('image/')) return file
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  if (!context) { bitmap.close(); throw new Error('image-canvas-unavailable') }
  context.drawImage(bitmap,0,0)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve,reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('image-encode-failed')),file.type,0.92))
  return new File([blob],file.name,{type:blob.type,lastModified:Date.now()})
}

const message = (e:string) => e === 'file_too_large' ? 'عکس حداکثر ۱۰ و ویدئو حداکثر ۱۰۰ مگابایت است.' : e === 'unsupported_type' ? 'فرمت فایل پشتیبانی نمی‌شود.' : e === 'caption_required' ? 'توضیح اثر را بنویس.' : e === 'caption_too_long' ? 'توضیح بیش از ۲۲۰۰ نویسه است.' : 'فایل معتبر نیست.'

export function SocialPage({ initialTab = 'feed' }: { initialTab?: 'feed'|'reels' }) {
  const [user,setUser] = useState<string|null>(null), [admin,setAdmin] = useState(false)
  const [tab,setTab] = useState<Tab>(initialTab), [posts,setPosts] = useState<Post[]>([])
  const [loading,setLoading] = useState(true), [error,setError] = useState(''), [notice,setNotice] = useState('')
  const [caption,setCaption] = useState(''), [file,setFile] = useState<File|null>(null), [kind,setKind] = useState<SocialMediaKind|null>(null)
  const [visibility,setVisibility] = useState<'public'|'followers'>('public'), [busy,setBusy] = useState(''), [commentsFor,setCommentsFor] = useState('')
  const [comments,setComments] = useState<Comment[]>([]), [comment,setComment] = useState(''), [reportFor,setReportFor] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({data}) => setUser(data.session?.user.id ?? null))
    const {data} = supabase.auth.onAuthStateChange((_e,s) => setUser(s?.user.id ?? null))
    return () => data.subscription.unsubscribe()
  },[])
  useEffect(() => {
    if (!supabase || !user) { setAdmin(false); return }
    supabase.from('qnr_user_roles').select('role').eq('user_id',user).eq('role','admin').maybeSingle().then(({data}) => setAdmin(Boolean(data)))
  },[user])

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setLoading(true); setError('')
    try {
      let q = supabase.from('qnr_social_posts').select('id,author_id,media_path,media_type,caption,visibility,status,created_at').order('created_at',{ascending:false}).limit(60)
      if (tab === 'review') { if (!admin) { setPosts([]); setLoading(false); return } q = q.eq('status','pending') }
      else if (tab === 'saved') {
        if (!user) { setPosts([]); setLoading(false); return }
        const {data:s,error:e} = await supabase.from('qnr_social_bookmarks').select('post_id').eq('user_id',user)
        if (e) throw e
        const ids = (s ?? []).map(x => x.post_id)
        if (!ids.length) { setPosts([]); setLoading(false); return }
        q = q.in('id',ids).eq('status','published')
      } else { q = q.eq('status','published'); if (tab === 'reels') q = q.eq('media_type','video') }
      const {data,error:e} = await q
      if (e) throw e
      const rows = (data ?? []) as Row[]
      if (!rows.length) { setPosts([]); setLoading(false); return }
      const ids = rows.map(x => x.id), authors = [...new Set(rows.map(x => x.author_id))]
      const [pr,mt,lk,bm,fl] = await Promise.all([
        supabase.from('qnr_social_public_profiles').select('user_id,display_name').in('user_id',authors),
        supabase.from('qnr_social_post_metrics').select('post_id,likes_count,comments_count').in('post_id',ids),
        user ? supabase.from('qnr_social_likes').select('post_id').eq('user_id',user).in('post_id',ids) : Promise.resolve({data:[]}),
        user ? supabase.from('qnr_social_bookmarks').select('post_id').eq('user_id',user).in('post_id',ids) : Promise.resolve({data:[]}),
        user ? supabase.from('qnr_social_follows').select('following_id').eq('follower_id',user) : Promise.resolve({data:[]}),
      ])
      const names = new Map((pr.data ?? []).map((x:any) => [x.user_id,x.display_name]))
      const metrics = new Map((mt.data ?? []).map((x:any) => [x.post_id,x]))
      const liked = new Set((lk.data ?? []).map((x:any) => x.post_id)), saved = new Set((bm.data ?? []).map((x:any) => x.post_id))
      const following = new Set((fl.data ?? []).map((x:any) => x.following_id))
      const result = await Promise.all(rows.map(async row => {
        const {data:signed} = await supabase!.storage.from('qnr-social-media').createSignedUrl(row.media_path,3600)
        const m:any = metrics.get(row.id)
        return {...row,author:names.get(row.author_id) ?? 'هنرمند نقش‌نگار',url:signed?.signedUrl ?? '',likes:Number(m?.likes_count ?? 0),comments:Number(m?.comments_count ?? 0),liked:liked.has(row.id),saved:saved.has(row.id),following:following.has(row.author_id)}
      }))
      setPosts(result)
    } catch { setError('فید دریافت نشد؛ اتصال یا دسترسی حساب را بررسی کن.') }
    finally { setLoading(false) }
  },[tab,user,admin])
  useEffect(() => { void load() },[load])
  useEffect(() => {
    if (tab !== 'reels') return
    const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('.social-grid.reels video'))
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) void video.play().catch(() => undefined)
        else video.pause()
      })
    },{threshold:[0,0.6,1]})
    videos.forEach(video => observer.observe(video))
    return () => { observer.disconnect(); videos.forEach(video => video.pause()) }
  },[tab,posts])
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id || !posts.length) return
    document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'center'})
  },[posts])

  function chooseFile(f:File|null) {
    setFile(f); setNotice(''); setKind(null)
    if (!f) return
    const v = validateSocialMedia(f)
    if (!v.ok) { setNotice(message(v.error)); setFile(null) } else setKind(v.kind)
  }
  async function publish(e:FormEvent) {
    e.preventDefault()
    if (!supabase || !user || !file || !kind) return
    const c = validateSocialCaption(caption), v = validateSocialMedia(file)
    if (!c.ok) { setNotice(message(c.error)); return }
    if (!v.ok) { setNotice(message(v.error)); return }
    setBusy('publish')
    try {
      const uploadFile = kind === 'image' ? await stripImageMetadata(file) : file
      const cleanValidation = validateSocialMedia(uploadFile)
      if (!cleanValidation.ok) { setNotice(message(cleanValidation.error)); return }
      const path = user + '/' + crypto.randomUUID() + '.' + cleanValidation.extension
      const up = await supabase.storage.from('qnr-social-media').upload(path,uploadFile,{contentType:uploadFile.type,upsert:false})
      if (up.error) throw up.error
      const ins = await supabase.from('qnr_social_posts').insert({author_id:user,media_path:path,media_type:kind,caption:c.caption,visibility,status:'pending'})
      if (ins.error) { await supabase.storage.from('qnr-social-media').remove([path]); throw ins.error }
      setCaption(''); setFile(null); setKind(null); setNotice('اثر برای بررسی مدیر ارسال شد؛ پس از تأیید در فید نمایش داده می‌شود.')
      await load()
    } catch { setNotice('ارسال اثر انجام نشد؛ دوباره تلاش کن.') }
    finally { setBusy('') }
  }
  async function like(p:Post) {
    if (!supabase || !user) { setNotice('برای پسندیدن وارد حساب شو.'); return }
    setBusy(p.id)
    const r = p.liked ? await supabase.from('qnr_social_likes').delete().eq('post_id',p.id).eq('user_id',user) : await supabase.from('qnr_social_likes').insert({post_id:p.id,user_id:user})
    if (r.error) setNotice('ثبت پسند انجام نشد.')
    else setPosts(a => a.map(x => x.id === p.id ? {...x,liked:!p.liked,likes:Math.max(0,x.likes+(p.liked?-1:1))} : x))
    setBusy('')
  }
  async function save(p:Post) {
    if (!supabase || !user) { setNotice('برای ذخیرهٔ اثر وارد حساب شو.'); return }
    setBusy(p.id)
    const r = p.saved ? await supabase.from('qnr_social_bookmarks').delete().eq('post_id',p.id).eq('user_id',user) : await supabase.from('qnr_social_bookmarks').insert({post_id:p.id,user_id:user})
    if (r.error) setNotice('ذخیره انجام نشد.')
    else setPosts(a => a.map(x => x.id === p.id ? {...x,saved:!p.saved} : x))
    setBusy('')
  }
  async function sharePost(p:Post) {
    const url = `${window.location.origin}/social#social-post-${p.id}`
    try {
      if (navigator.share) await navigator.share({title:'نقش‌نگار',text:p.caption,url})
      else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setNotice('پیوند این اثر کپی شد.') }
      else setNotice('اشتراک‌گذاری در این مرورگر پشتیبانی نمی‌شود.')
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') setNotice('اشتراک‌گذاری انجام نشد.')
    }
  }
  async function follow(p:Post) {
    if (!supabase || !user) { setNotice('برای دنبال‌کردن وارد حساب شو.'); return }
    if (p.author_id === user) return
    setBusy(p.id)
    const r = p.following ? await supabase.from('qnr_social_follows').delete().eq('follower_id',user).eq('following_id',p.author_id) : await supabase.from('qnr_social_follows').insert({follower_id:user,following_id:p.author_id})
    if (r.error) setNotice('تغییر دنبال‌کردن انجام نشد.')
    else setPosts(a => a.map(x => x.author_id === p.author_id ? {...x,following:!p.following} : x))
    setBusy('')
  }
  async function openComments(p:Post) {
    if (!supabase) return
    setCommentsFor(p.id); setComments([])
    const r = await supabase.from('qnr_social_comments').select('id,author_id,body,created_at').eq('post_id',p.id).eq('status','published').order('created_at').limit(60)
    if (r.error) setNotice('دیدگاه‌ها بارگذاری نشدند.')
    else setComments((r.data ?? []) as Comment[])
  }
  async function sendComment(e:FormEvent) {
    e.preventDefault()
    if (!supabase || !user || !commentsFor || !comment.trim()) return
    const r = await supabase.from('qnr_social_comments').insert({post_id:commentsFor,author_id:user,body:comment.trim().slice(0,1200)})
    if (r.error) setNotice('ثبت دیدگاه انجام نشد.')
    else { setComment(''); await load(); await openComments(posts.find(p => p.id === commentsFor)!) }
  }
  async function report(e:FormEvent) {
    e.preventDefault()
    if (!supabase || !user || !reportFor) return
    const r = await supabase.from('qnr_social_reports').insert({reporter_id:user,post_id:reportFor,reason:'other'})
    setNotice(r.error ? (r.error.code === '23505' ? 'این اثر را قبلاً گزارش کرده‌ای.' : 'ثبت گزارش انجام نشد.') : 'گزارش برای مدیر ارسال شد.')
    setReportFor('')
  }
  async function moderate(p:Post,status:'published'|'rejected'|'hidden') {
    if (!supabase) return
    setBusy(p.id)
    const r = await supabase.from('qnr_social_posts').update({status,published_at:status === 'published' ? new Date().toISOString() : null}).eq('id',p.id)
    if (r.error) setNotice('تغییر وضعیت انجام نشد.')
    else { setNotice(status === 'published' ? 'اثر منتشر شد.' : 'وضعیت اثر به‌روز شد.'); await load() }
    setBusy('')
  }

  if (!supabaseConfigured) return <main className="social-page"><EmptyState title="اتصال نقش‌نگار آماده نیست" detail="کلید عمومی و آدرس Supabase باید در تنظیمات سایت قرار بگیرند." /></main>
  return <main className="social-page">
    <header className="social-hero"><div><span>جامعهٔ هنرمندان نقش‌نگار</span><h1>هر اثر، یک الهام تازه</h1><p>کارهایت را منتشر کن، از تجربهٔ دیگران یاد بگیر و هنرمندان هم‌سلیقه را پیدا کن.</p></div><div className="social-mark"><Users size={32}/><b>با هم می‌سازیم</b></div></header>
    {user ? <form className="social-composer" onSubmit={publish}>
      <b>اثر تازه‌ات را به جامعه نشان بده</b><textarea value={caption} onChange={e=>setCaption(e.target.value)} maxLength={2200} placeholder="از الهام، پارچه‌ها یا داستان پشت اثرت بنویس…"/>
      {file && <div className="social-file">{kind === 'video' ? <Video size={16}/> : <ImagePlus size={16}/>} {file.name}<button type="button" onClick={()=>chooseFile(null)}><X size={16}/></button></div>}
      <div className="social-tools"><label><ImagePlus size={17}/> افزودن عکس یا ویدئو<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={e=>chooseFile(e.target.files?.[0] ?? null)}/></label><select value={visibility} onChange={e=>setVisibility(e.target.value as 'public'|'followers')}><option value="public">نمایش عمومی</option><option value="followers">فقط دنبال‌کنندگان</option></select><button className="social-primary" disabled={busy==='publish'||!file||!caption.trim()}>{busy==='publish'?'در حال ارسال…':'ارسال برای بررسی'} <Send size={16}/></button></div>
      <small>عکس تا ۱۰ و ویدئو تا ۱۰۰ مگابایت؛ رسانه‌ها خصوصی ذخیره و پس از تأیید مدیر منتشر می‌شوند.</small>
    </form> : <section className="social-signin"><b>به جمع هنرمندان نقش‌نگار بپیوند</b><p>برای انتشار اثر، پسندیدن و گفت‌وگو وارد حساب شو.</p><a href="/account">ورود و ثبت‌نام</a></section>}
    <nav className="social-tabs"><button className={tab==='feed'?'active':''} onClick={()=>setTab('feed')}><Users size={16}/> فید آثار</button><button className={tab==='reels'?'active':''} onClick={()=>setTab('reels')}><Play size={16}/> ریلز</button><button className={tab==='saved'?'active':''} onClick={()=>setTab('saved')}><Bookmark size={16}/> ذخیره‌شده‌ها</button>{admin&&<><button className={tab==='review'?'active':''} onClick={()=>setTab('review')}><ShieldCheck size={16}/> صف مدیریت</button><a className="social-admin-link" href="/admin/social-moderation"><ShieldCheck size={16}/> مرکز مدیریت جامعه</a></>}</nav>
    {notice&&<p className="social-notice" role="status">{notice}</p>}
    {error&&<p className="social-error">{error} <button onClick={()=>void load()}>تلاش دوباره</button></p>}
    {loading?<p className="social-loading">در حال آماده‌سازی فید…</p>:!posts.length?<EmptyState title={tab==='reels'?'هنوز ریلزی منتشر نشده':tab==='saved'?'اثری ذخیره نکرده‌ای':tab==='review'?'صف بررسی خالی است':'اولین اثر این فید را تو منتشر کن'} detail="با انتشار یک عکس یا ویدئو، الهام بعدی را به این جمع هدیه بده."/>:
      <section className={'social-grid '+(tab==='reels'?'reels':'')}>{posts.map(p=><article className="social-card" id={`social-post-${p.id}`} key={p.id}>
        <div className="social-author"><span>{p.author.slice(0,1)}</span><div><b>{p.author}</b><small>{faDate(p.created_at)}{p.status==='pending'?' · در انتظار بررسی':''}</small></div>{tab==='review'?<em>در انتظار بررسی</em>:user&&user!==p.author_id&&<button onClick={()=>void follow(p)} disabled={busy===p.id}>{p.following?'دنبال می‌کنی':<><UserPlus size={14}/> دنبال‌کردن</>}</button>}</div>
        {p.url?(p.media_type==='video'?<video src={p.url} controls playsInline muted={tab==='reels'} preload="metadata"/>:<img src={p.url} alt={'اثر '+p.author} loading="lazy"/>):<div className="social-missing">رسانه در دسترس نیست</div>}
        <p className="social-caption">{p.caption}</p>
        {tab==='review'?<div className="social-moderate"><button disabled={busy===p.id} onClick={()=>void moderate(p,'published')}>تأیید و انتشار</button><button disabled={busy===p.id} onClick={()=>void moderate(p,'rejected')}>رد اثر</button><button disabled={busy===p.id} onClick={()=>void moderate(p,'hidden')}>پنهان‌سازی</button></div>:<div className="social-actions"><button className={p.liked?'liked':''} onClick={()=>void like(p)} disabled={busy===p.id}><Heart size={18} fill={p.liked?'currentColor':'none'}/> {p.likes.toLocaleString('fa-IR')}</button><button onClick={()=>void openComments(p)}><MessageCircle size={18}/> {p.comments.toLocaleString('fa-IR')}</button><button onClick={()=>void sharePost(p)}><Share2 size={18}/></button><button className={p.saved?'saved':''} onClick={()=>void save(p)} disabled={busy===p.id}><Bookmark size={18} fill={p.saved?'currentColor':'none'}/></button>{user&&<button className="report" onClick={()=>setReportFor(p.id)}>گزارش</button>}</div>}
        {commentsFor===p.id&&<div className="social-comments"><div><b>دیدگاه‌ها</b><button onClick={()=>setCommentsFor('')}><X size={16}/></button></div>{comments.map(c=><p key={c.id}><b>{c.author_id===user?'شما':'هنرمند جامعه'}</b> {c.body}</p>)}{user&&<form onSubmit={sendComment}><input value={comment} onChange={e=>setComment(e.target.value)} maxLength={1200} placeholder="دیدگاهت را بنویس…"/><button disabled={!comment.trim()}><Send size={16}/></button></form>}</div>}
      </article>)}</section>}
    {reportFor&&<div className="social-backdrop"><form className="social-modal" onSubmit={report}><button type="button" onClick={()=>setReportFor('')}><X size={17}/></button><h2>گزارش اثر</h2><p>این اثر برای بررسی به مدیران گزارش می‌شود.</p><button className="social-primary">ثبت گزارش</button></form></div>}
  </main>
}