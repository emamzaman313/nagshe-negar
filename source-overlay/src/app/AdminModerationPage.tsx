import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock3, EyeOff, Film, Image as ImageIcon, RefreshCw, ShieldCheck, XCircle } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { supabase, supabaseConfigured } from '../lib/supabase'
import './moderation-center.css'

type Tab = 'reels' | 'posts' | 'reports'
type SocialPost = {
  id: string; author_id: string; media_path: string; media_type: 'image'|'video'
  caption: string; visibility: 'public'|'followers'; status: string; created_at: string
  author: string; mediaUrl: string
}
type SocialReport = {
  id: string; reporter_id: string; post_id: string; reason: string
  details: string; created_at: string; post?: SocialPost
}
const dateLabel = (value: string) => new Intl.DateTimeFormat('fa-IR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value))
const reasonLabel: Record<string,string> = {spam:'هرزنامه',harassment:'آزار و توهین',copyright:'نقض حق نشر',unsafe:'محتوای ناامن',other:'سایر'}

export function AdminModerationPage() {
  const [userId,setUserId] = useState<string|null>(null)
  const [admin,setAdmin] = useState(false)
  const [authLoading,setAuthLoading] = useState(true)
  const [tab,setTab] = useState<Tab>('reels')
  const [posts,setPosts] = useState<SocialPost[]>([])
  const [reports,setReports] = useState<SocialReport[]>([])
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [busy,setBusy] = useState('')
  const [reasons,setReasons] = useState<Record<string,string>>({})

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    let alive = true
    supabase.auth.getSession().then(({data}) => {
      if (alive) setUserId(data.session?.user.id ?? null)
    }).finally(() => { if (alive) setAuthLoading(false) })
    const {data} = supabase.auth.onAuthStateChange((_event,session) => {
      setUserId(session?.user.id ?? null)
      setAuthLoading(false)
    })
    return () => { alive = false; data.subscription.unsubscribe() }
  },[])

  useEffect(() => {
    if (!supabase || !userId) { setAdmin(false); return }
    let alive = true
    supabase.from('qnr_user_roles').select('role').eq('user_id',userId).eq('role','admin').maybeSingle()
      .then(({data,error:roleError}) => {
        if (!alive) return
        setAdmin(!roleError && Boolean(data))
        if (roleError) setError('بررسی نقش مدیر از سرور انجام نشد.')
      })
    return () => { alive = false }
  },[userId])

  const load = useCallback(async () => {
    if (!supabase || !admin) return
    setLoading(true); setError('')
    try {
      const [postResult,reportResult] = await Promise.all([
        supabase.from('qnr_social_posts')
          .select('id,author_id,media_path,media_type,caption,visibility,status,created_at')
          .eq('status','pending').order('created_at',{ascending:true}).limit(100),
        supabase.from('qnr_social_reports')
          .select('id,reporter_id,post_id,reason,details,created_at')
          .eq('status','open').order('created_at',{ascending:true}).limit(100)
      ])
      if (postResult.error) throw postResult.error
      if (reportResult.error) throw reportResult.error
      const allPosts = postResult.data ?? []
      const reportPostIds = [...new Set((reportResult.data ?? []).map(r => r.post_id))]
      const [profileResult,reportPostsResult] = await Promise.all([
        allPosts.length ? supabase.from('qnr_social_public_profiles').select('user_id,display_name').in('user_id',[...new Set(allPosts.map(p=>p.author_id))]) : Promise.resolve({data:[],error:null}),
        reportPostIds.length ? supabase.from('qnr_social_posts').select('id,author_id,media_path,media_type,caption,visibility,status,created_at').in('id',reportPostIds) : Promise.resolve({data:[],error:null})
      ])
      if (profileResult.error) throw profileResult.error
      if (reportPostsResult.error) throw reportPostsResult.error
      const names = new Map((profileResult.data ?? []).map(p=>[p.user_id,p.display_name]))
      const hydrate = async (row:any):Promise<SocialPost> => {
        const {data,error:signedError} = await supabase!.storage.from('qnr-social-media').createSignedUrl(row.media_path,3600)
        if (signedError) throw signedError
        return {...row,author:names.get(row.author_id) ?? 'هنرمند نقش‌نگار',mediaUrl:signed?.signedUrl ?? ''}
      }
      const hydratedPending = await Promise.all(allPosts.map(hydrate))
      const reportPostMap = new Map((reportPostsResult.data ?? []).map(p=>[p.id,p]))
      const reportProfiles = [...new Set((reportPostsResult.data ?? []).map(p=>p.author_id).filter(id=>!names.has(id)))]
      const {data:extraProfiles,error:extraError} = reportProfiles.length
        ? await supabase.from('qnr_social_public_profiles').select('user_id,display_name').in('user_id',reportProfiles)
        : {data:[],error:null}
      if (extraError) throw extraError
      for (const p of extraProfiles ?? []) names.set(p.user_id,p.display_name)
      const hydratedReports = await Promise.all((reportResult.data ?? []).map(async report => {
        const row:any = reportPostMap.get(report.post_id)
        return {...report,post:row ? await hydrate(row) : undefined}
      }))
      setPosts(hydratedPending); setReports(hydratedReports)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'دریافت صف مدیریت انجام نشد؛ اتصال و مجوزهای مدیر را بررسی کن.')
    } finally { setLoading(false) }
  },[admin])

  useEffect(() => { if (admin) void load() },[admin,load])

  const visiblePosts = useMemo(() => posts.filter(p => tab==='reels' ? p.media_type==='video' : p.media_type==='image'),[posts,tab])

  async function moderatePost(post:SocialPost,action:'approve'|'reject'|'hide') {
    if (!supabase) return
    const reason = (reasons[post.id] ?? '').trim()
    if (action!=='approve' && !reason) {
      setNotice('برای رد یا پنهان‌سازی، دلیل تصمیم را وارد کن.')
      return
    }
    setBusy(post.id); setNotice('')
    const {error:rpcError} = await supabase.rpc('qnr_admin_moderate_social_content',{
      p_target_type:'post',p_target_id:post.id,p_action:action,p_reason:reason || null
    })
    if (rpcError) setNotice('عملیات انجام نشد: '+rpcError.message)
    else {
      setNotice(action==='approve'?'محتوا تأیید و منتشر شد.':action==='reject'?'محتوا با ثبت دلیل رد شد.':'محتوا با ثبت دلیل پنهان شد.')
      setReasons(current=>{const next={...current};delete next[post.id];return next})
      await load()
    }
    setBusy('')
  }

  async function moderateReport(report:SocialReport,action:'review'|'dismiss') {
    if (!supabase) return
    setBusy(report.id); setNotice('')
    const {error:rpcError} = await supabase.rpc('qnr_admin_moderate_social_content',{
      p_target_type:'report',p_target_id:report.id,p_action:action,p_reason:null
    })
    if (rpcError) setNotice('رسیدگی به گزارش انجام نشد: '+rpcError.message)
    else { setNotice(action==='review'?'گزارش بررسی و ثبت شد.':'گزارش بسته شد.'); await load() }
    setBusy('')
  }

  if (!supabaseConfigured) return <main className="moderation-page"><EmptyState title="اتصال سرور آماده نیست" detail="تنظیمات Supabase در محیط انتشار بررسی شود."/></main>
  if (authLoading) return <main className="moderation-page"><p className="moderation-loading">در حال بررسی نشست و دسترسی…</p></main>
  if (!userId) return <main className="moderation-page"><EmptyState title="ورود مدیر لازم است" detail="برای ورود به مرکز نظارت، ابتدا وارد حساب مدیریتی شو."/><Link className="moderation-back" to="/account">ورود به حساب</Link></main>
  if (!admin) return <main className="moderation-page"><EmptyState title="دسترسی مدیر لازم است" detail="این بخش فقط برای حساب دارای نقش admin قابل استفاده است."/><Link className="moderation-back" to="/admin">بازگشت به مدیریت</Link></main>

  return <main className="moderation-page">
    <header className="moderation-hero">
      <div><span className="moderation-eyebrow">مرکز اعتماد و ایمنی</span><h1>نظارت بر محتوای نقش‌نگار</h1><p>ریلزها، آثار تصویری و گزارش‌های کاربران را از یک صف واحد مدیریت کن.</p></div>
      <div className="moderation-hero-actions"><Link to="/admin">پنل اصلی</Link><button onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/> تازه‌سازی</button></div>
    </header>
    <section className="moderation-stats">
      <article><Clock3/><span>در انتظار بررسی</span><strong>{posts.length.toLocaleString('fa-IR')}</strong></article>
      <article><Film/><span>ریلزهای منتظر</span><strong>{posts.filter(p=>p.media_type==='video').length.toLocaleString('fa-IR')}</strong></article>
      <article><ImageIcon/><span>آثار تصویری منتظر</span><strong>{posts.filter(p=>p.media_type==='image').length.toLocaleString('fa-IR')}</strong></article>
      <article><AlertTriangle/><span>گزارش‌های باز</span><strong>{reports.length.toLocaleString('fa-IR')}</strong></article>
    </section>
    <nav className="moderation-tabs" aria-label="صف‌های نظارت">
      <button className={tab==='reels'?'active':''} onClick={()=>setTab('reels')}>ریلزها <b>{posts.filter(p=>p.media_type==='video').length}</b></button>
      <button className={tab==='posts'?'active':''} onClick={()=>setTab('posts')}>پست‌های تصویری <b>{posts.filter(p=>p.media_type==='image').length}</b></button>
      <button className={tab==='reports'?'active':''} onClick={()=>setTab('reports')}>گزارش کاربران <b>{reports.length}</b></button>
    </nav>
    {notice&&<p className="moderation-notice" role="status">{notice}</p>}
    {error&&<div className="moderation-error" role="alert"><span>{error}</span><button onClick={()=>void load()}>تلاش دوباره</button></div>}
    {loading?<p className="moderation-loading">در حال دریافت اطلاعات واقعی از سرور…</p>:tab==='reports'?
      reports.length ? <section className="moderation-list">{reports.map(report=><article className="moderation-card moderation-report" key={report.id}>
        <div className="moderation-report-head"><span className="moderation-status"><AlertTriangle size={14}/>{reasonLabel[report.reason]??report.reason}</span><small>{dateLabel(report.created_at)}</small></div>
        <h2>گزارش محتوای کاربر</h2><p>{report.details||'گزارش بدون توضیح تکمیلی ثبت شده است.'}</p>
        {report.post&&<div className="moderation-reported-post">{report.post.mediaUrl?(report.post.media_type==='video'?<video src={report.post.mediaUrl} controls playsInline preload="metadata"/>:<img src={report.post.mediaUrl} alt="محتوای گزارش‌شده"/>):<span>رسانهٔ گزارش‌شده در دسترس نیست</span>}<div><b>{report.post.media_type==='video'?'ریلز':'پست تصویری'}</b><p>{report.post.caption}</p></div></div>}
        <div className="moderation-actions"><button onClick={()=>void moderateReport(report,'review')} disabled={busy===report.id}><CheckCircle2 size={16}/> بررسی شد</button><button className="quiet" onClick={()=>void moderateReport(report,'dismiss')} disabled={busy===report.id}><XCircle size={16}/> بستن گزارش</button></div>
      </article>)}</section> : <EmptyState title="گزارش بازی وجود ندارد" detail="گزارش‌های جدید کاربران پس از ثبت در این صف ظاهر می‌شوند."/> :
      visiblePosts.length ? <section className="moderation-list">{visiblePosts.map(post=><article className="moderation-card" key={post.id}>
        <div className="moderation-card-head"><div><span className="moderation-status"><Clock3 size={14}/>در انتظار بررسی</span><small>{post.media_type==='video'?'ریلز ویدئویی':'اثر تصویری'} · {post.visibility==='public'?'عمومی':'فقط دنبال‌کنندگان'} · {dateLabel(post.created_at)}</small></div><b>{post.author}</b></div>
        <div className="moderation-media">{post.mediaUrl?(post.media_type==='video'?<video src={post.mediaUrl} controls playsInline preload="metadata"/>:<img src={post.mediaUrl} alt={'اثر '+post.author}/>):<span>پیش‌نمایش رسانه در دسترس نیست</span>}</div>
        <p className="moderation-caption">{post.caption}</p>
        <label className="moderation-reason">دلیل تصمیم مدیریتی
          <textarea value={reasons[post.id]??''} onChange={e=>setReasons(current=>({...current,[post.id]:e.target.value}))} maxLength={1000} placeholder="برای رد یا پنهان‌سازی، دلیل روشن و محترمانه بنویس…"/>
        </label>
        <div className="moderation-actions"><button onClick={()=>void moderatePost(post,'approve')} disabled={busy===post.id}><CheckCircle2 size={16}/> تأیید و انتشار</button><button className="reject" onClick={()=>void moderatePost(post,'reject')} disabled={busy===post.id}><XCircle size={16}/> رد با دلیل</button><button className="quiet" onClick={()=>void moderatePost(post,'hide')} disabled={busy===post.id}><EyeOff size={16}/> پنهان‌سازی</button></div>
      </article>)}</section> : <EmptyState title={tab==='reels'?'ریلز در انتظار بررسی نیست':'پست تصویری در انتظار بررسی نیست'} detail="محتوای تازهٔ کاربران پس از ارسال، قبل از انتشار عمومی در این بخش قرار می‌گیرد."/>
    }
    <footer className="moderation-audit-note"><ShieldCheck size={18}/> همهٔ تصمیم‌ها از تابع امن سمت سرور ثبت می‌شوند و در تاریخچهٔ مدیریتی باقی می‌مانند.</footer>
  </main>
}
