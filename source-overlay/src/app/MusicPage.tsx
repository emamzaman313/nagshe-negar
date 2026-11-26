import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Album, AudioLines, Check, Disc3, Headphones, ListMusic, Music2, Play, Plus, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { validateMusicAudio } from '../lib/music-validation'
import './music.css'

type LicenseType = 'original' | 'cc0' | 'cc-by' | 'cc-by-sa' | 'licensed' | 'public-domain'
type TrackRow = {
  id:string; owner_id:string; title:string; artist:string; album:string|null; description:string|null
  audio_path:string; cover_path:string|null; duration_seconds:number|null; mime_type:string; file_size_bytes:number
  sha256:string|null; license_type:LicenseType; license_url:string|null; rights_holder:string
  rights_confirmed:boolean; source:string; visibility:'public'|'private'; status:'pending'|'published'|'rejected'|'disabled'
  moderation_note:string|null; created_at:string; published_at:string|null
}
type Track = TrackRow & { audio_url:string; cover_url:string }
type Playlist = {id:string;title:string;description:string|null;visibility:'public'|'private';owner_id:string}
const LICENSES: {value:LicenseType;label:string}[] = [
  {value:'original',label:'اثر اصلی / ساختهٔ خودم'},
  {value:'cc0',label:'Creative Commons CC0'},
  {value:'cc-by',label:'Creative Commons Attribution'},
  {value:'cc-by-sa',label:'Creative Commons BY-SA'},
  {value:'licensed',label:'دارای مجوز کتبی'},
  {value:'public-domain',label:'مالکیت عمومی / Public Domain'},
]
const formatSize = (n:number) => n < 1024*1024 ? Math.ceil(n/1024)+' KB' : (n/1024/1024).toFixed(1)+' MB'
const formatTime = (n:number|null) => n ? new Intl.NumberFormat('fa-IR').format(Math.floor(n/60))+':'+String(Math.floor(n%60)).padStart(2,'0') : '—'
const errorText = (e:unknown) => e instanceof Error ? e.message : 'خطای نامشخص'

async function signed(path:string|null) {
  if (!path || !supabase) return ''
  const {data,error} = await supabase.storage.from('qnr-music').createSignedUrl(path,14400)
  if (error) return ''
  return data.signedUrl
}
function playTrack(track:Track) {
  window.dispatchEvent(new CustomEvent('nn:music-play',{detail:{track,url:track.audio_url}}))
}

export function MusicPage() {
  const [user,setUser] = useState<string|null>(null)
  const [admin,setAdmin] = useState(false)
  const [tracks,setTracks] = useState<Track[]>([])
  const [playlists,setPlaylists] = useState<Playlist[]>([])
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState('')
  const [notice,setNotice] = useState('')
  const [tab,setTab] = useState<'library'|'my'|'playlists'|'review'>('library')
  const [title,setTitle] = useState('')
  const [artist,setArtist] = useState('')
  const [album,setAlbum] = useState('')
  const [description,setDescription] = useState('')
  const [rightsHolder,setRightsHolder] = useState('')
  const [license,setLicense] = useState<LicenseType>('original')
  const [licenseUrl,setLicenseUrl] = useState('')
  const [audioFile,setAudioFile] = useState<File|null>(null)
  const [coverFile,setCoverFile] = useState<File|null>(null)
  const [rightsAccepted,setRightsAccepted] = useState(false)
  const [playlistTitle,setPlaylistTitle] = useState('')
  const [playlistVisibility,setPlaylistVisibility] = useState<'private'|'public'>('private')
  const [selectedPlaylist,setSelectedPlaylist] = useState('')
  const [profileTrack,setProfileTrack] = useState('')
  const [profileVisibility,setProfileVisibility] = useState<'public'|'followers'|'private'>('public')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({data}) => setUser(data.session?.user.id ?? null))
    const {data} = supabase.auth.onAuthStateChange((_event,session) => setUser(session?.user.id ?? null))
    return () => data.subscription.unsubscribe()
  },[])
  useEffect(() => {
    if (!supabase || !user) { setAdmin(false); return }
    supabase.from('qnr_user_roles').select('role').eq('user_id',user).eq('role','admin').then(({data}) => setAdmin(Boolean(data?.length)))
  },[user])

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setLoading(true)
    try {
      const {data,error} = await supabase.from('qnr_music_tracks')
        .select('id,owner_id,title,artist,album,description,audio_path,cover_path,duration_seconds,mime_type,file_size_bytes,sha256,license_type,license_url,rights_holder,rights_confirmed,source,visibility,status,moderation_note,created_at,published_at')
        .order('created_at',{ascending:false}).limit(100)
      if (error) throw error
      const hydrated = await Promise.all(((data ?? []) as TrackRow[]).map(async row => ({
        ...row,audio_url:await signed(row.audio_path),cover_url:await signed(row.cover_path)
      })))
      setTracks(hydrated)
      if (user) {
        const [pl,pm] = await Promise.all([
          supabase.from('qnr_music_playlists').select('id,title,description,visibility,owner_id').order('updated_at',{ascending:false}),
          supabase.from('qnr_profile_music').select('track_id,visibility').eq('user_id',user).maybeSingle()
        ])
        if (pl.error) throw pl.error
        setPlaylists((pl.data ?? []) as Playlist[])
        setProfileTrack(pm.data?.track_id ?? '')
        setProfileVisibility((pm.data?.visibility as any) ?? 'public')
      } else {
        setPlaylists([])
        setProfileTrack('')
      }
    } catch (error) {
      setNotice('بارگذاری کتابخانه ناموفق بود: '+errorText(error))
    } finally { setLoading(false) }
  },[user])
  useEffect(() => { void load() },[load])

  const visibleTracks = useMemo(() => tracks.filter(t =>
    tab==='review' ? admin && t.status==='pending' :
    tab==='my' ? t.owner_id===user :
    tab==='library' ? t.status==='published' && t.visibility==='public' :
    t.status==='published' && t.visibility==='public'
  ),[tracks,tab,user,admin])

  async function upload(e:FormEvent) {
    e.preventDefault()
    if (!supabase || !user || !audioFile) return
    const validation = validateMusicAudio(audioFile)
    if (!validation.ok) { setNotice(validation.error==='file_too_large'?'حجم فایل باید حداکثر ۵۰ مگابایت باشد.':'فرمت صوتی پشتیبانی نمی‌شود. MP3، M4A، AAC، OGG، WAV و FLAC مجازند.'); return }
    const ext = validation.extension
    const mime = validation.mimeType
    if (coverFile && (!['image/jpeg','image/png','image/webp'].includes(coverFile.type) || coverFile.size>5*1024*1024)) { setNotice('کاور باید JPG، PNG یا WebP و حداکثر ۵ مگابایت باشد.'); return }
    if (!title.trim() || !artist.trim() || !rightsHolder.trim() || !rightsAccepted) { setNotice('عنوان، هنرمند، صاحب حق اثر و تأیید مجوز الزامی‌اند.'); return }
    if (['cc-by','cc-by-sa','licensed'].includes(license) && !/^https:\/\//i.test(licenseUrl.trim())) { setNotice('برای این نوع مجوز، پیوند https معتبر لازم است.'); return }
    setBusy('upload'); setNotice('')
    const id = crypto.randomUUID()
    const audioPath = user+'/'+id+'.'+ext
    const coverExt = coverFile?.type==='image/png'?'png':coverFile?.type==='image/webp'?'webp':'jpg'
    const coverPath = coverFile ? user+'/'+id+'-cover.'+coverExt : null
    try {
      const digest = await crypto.subtle.digest('SHA-256',await audioFile.arrayBuffer())
      const sha256 = Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('')
      const {error:insertError} = await supabase.from('qnr_music_tracks').insert({
        id,owner_id:user,title:title.trim(),artist:artist.trim(),album:album.trim()||null,
        description:description.trim()||null,audio_path:audioPath,cover_path:coverPath,
        mime_type:mime,file_size_bytes:audioFile.size,sha256,license_type:license,
        license_url:licenseUrl.trim()||null,rights_holder:rightsHolder.trim(),rights_confirmed:true,
        source:'user_upload',visibility:'public',status:'pending'
      })
      if (insertError) throw insertError
      const audioUpload = await supabase.storage.from('qnr-music').upload(audioPath,audioFile,{contentType:mime,upsert:false})
      if (audioUpload.error) throw audioUpload.error
      if (coverFile && coverPath) {
        const coverUpload = await supabase.storage.from('qnr-music').upload(coverPath,coverFile,{contentType:coverFile.type,upsert:false})
        if (coverUpload.error) throw coverUpload.error
      }
      setTitle('');setArtist('');setAlbum('');setDescription('');setRightsHolder('');setLicense('original');setLicenseUrl('')
      setAudioFile(null);setCoverFile(null);setRightsAccepted(false)
      setNotice('فایل با SHA-256 ثبت شد و پس از بررسی مجوز توسط مدیر در کتابخانه منتشر می‌شود.')
      setTab('my')
      await load()
    } catch (error) {
      await supabase.storage.from('qnr-music').remove([audioPath,...(coverPath?[coverPath]:[])])
      await supabase.from('qnr_music_tracks').delete().eq('id',id)
      setNotice('بارگذاری انجام نشد: '+errorText(error))
    } finally { setBusy('') }
  }

  async function moderate(track:Track, status:'published'|'rejected') {
    if (!supabase || !admin) return
    setBusy(track.id)
    const {error} = await supabase.from('qnr_music_tracks').update({
      status,published_at:status==='published'?new Date().toISOString():null,
      moderation_note:status==='rejected'?'نیازمند اصلاح یا اثبات مجوز':null,updated_at:new Date().toISOString()
    }).eq('id',track.id)
    if (error) setNotice('ثبت تصمیم مدیر ناموفق بود: '+error.message)
    else { setNotice(status==='published'?'قطعه پس از بررسی مجوز منتشر شد.':'قطعه رد شد.'); await load() }
    setBusy('')
  }
  async function createPlaylist(e:FormEvent) {
    e.preventDefault()
    if (!supabase || !user || !playlistTitle.trim()) return
    setBusy('playlist')
    const {error} = await supabase.from('qnr_music_playlists').insert({owner_id:user,title:playlistTitle.trim(),visibility:playlistVisibility})
    if (error) setNotice('ساخت پلی‌لیست ناموفق بود: '+error.message)
    else { setPlaylistTitle('');setNotice('پلی‌لیست ساخته شد.');await load() }
    setBusy('')
  }
  async function addToPlaylist(track:Track) {
    if (!supabase || !user || !selectedPlaylist) { setNotice('ابتدا یکی از پلی‌لیست‌ها را انتخاب کن.'); return }
    setBusy(track.id)
    const {data:existing} = await supabase.from('qnr_music_playlist_items').select('position').eq('playlist_id',selectedPlaylist)
    const position = (existing ?? []).reduce((m:any,x:any)=>Math.max(m,Number(x.position)||0),-1)+1
    const {error} = await supabase.from('qnr_music_playlist_items').insert({playlist_id:selectedPlaylist,track_id:track.id,position,added_by:user})
    setNotice(error ? 'افزودن قطعه ناموفق بود: '+error.message : 'قطعه به پلی‌لیست اضافه شد.')
    setBusy('')
  }
  async function setProfile() {
    if (!supabase || !user || !profileTrack) return
    setBusy('profile')
    const {error} = await supabase.from('qnr_profile_music').upsert({user_id:user,track_id:profileTrack,visibility:profileVisibility,updated_at:new Date().toISOString()})
    setNotice(error ? 'ثبت موسیقی پروفایل ناموفق بود: '+error.message : 'موسیقی پروفایل ذخیره شد.')
    setBusy('')
  }
  async function clearProfile() {
    if (!supabase || !user) return
    setBusy('profile')
    const {error} = await supabase.from('qnr_profile_music').delete().eq('user_id',user)
    if (error) setNotice('حذف موسیقی پروفایل ناموفق بود.')
    else {setProfileTrack('');setNotice('موسیقی پروفایل حذف شد.')}
    setBusy('')
  }

  if (!supabaseConfigured) return <main className="nn-music-page"><section className="nn-music-empty">اتصال امن نقش‌نگار به Supabase تنظیم نشده است.</section></main>
  return <main className="nn-music-page">
    <section className="nn-music-hero">
      <div className="nn-music-hero-copy">
        <span className="nn-music-kicker"><AudioLines size={16}/> صدای کارگاه نقش‌نگار</span>
        <h1>موسیقی، در تار و پود خلاقیت</h1>
        <p>کتابخانه‌ای برای قطعه‌هایی که با اجازهٔ صاحب اثر منتشر می‌شوند؛ گوش بده، پلی‌لیست بساز و موسیقی امضای پروفایلت را انتخاب کن.</p>
        <div className="nn-music-stats"><span><Disc3 size={17}/>{tracks.filter(t=>t.status==='published'&&t.visibility==='public').length.toLocaleString('fa-IR')} قطعهٔ منتشرشده</span><span><ShieldCheck size={17}/> انتشار با بررسی مجوز</span></div>
      </div>
      <div className="nn-music-orbit" aria-hidden="true"><div className="nn-music-disc"><span/><i/><b/></div><div className="nn-music-wave"><AudioLines/><AudioLines/><AudioLines/></div></div>
    </section>

    {notice && <div className="nn-music-notice" role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="بستن"><X size={16}/></button></div>}
    {!user && <div className="nn-music-signin">برای بارگذاری موسیقی، ساخت پلی‌لیست و تنظیم موسیقی پروفایل، ابتدا وارد حساب شو. کتابخانهٔ عمومی برای شنیدن آزاد است.</div>}

    <nav className="nn-music-tabs" aria-label="بخش‌های موسیقی">
      <button className={tab==='library'?'active':''} onClick={()=>setTab('library')}><Headphones size={17}/> کتابخانه</button>
      <button className={tab==='my'?'active':''} onClick={()=>setTab('my')}><Album size={17}/> قطعه‌های من</button>
      <button className={tab==='playlists'?'active':''} onClick={()=>setTab('playlists')}><ListMusic size={17}/> پلی‌لیست‌ها</button>
      {admin && <button className={tab==='review'?'active':''} onClick={()=>setTab('review')}><ShieldCheck size={17}/> بررسی مجوزها</button>}
    </nav>

    {tab==='library' && <section className="nn-music-library">
      <div className="nn-music-section-head"><div><span className="nn-music-kicker">CURATED SOUND</span><h2>کتابخانهٔ شنیداری</h2></div><span>{visibleTracks.length.toLocaleString('fa-IR')} قطعه</span></div>
      {loading ? <div className="nn-music-loading"><AudioLines/> در حال دریافت کتابخانه…</div> : visibleTracks.length===0 ? <div className="nn-music-empty"><Disc3/><h3>کتابخانه آمادهٔ اولین قطعه است</h3><p>هنوز قطعهٔ دارای مجوزی منتشر نشده؛ می‌توانی اثر خودت یا موسیقی دارای مجوز را بارگذاری کنی.</p><button onClick={()=>setTab('my')}>افزودن اولین قطعه <Plus size={16}/></button></div> : <div className="nn-music-track-grid">
        {visibleTracks.map(track=><article className="nn-music-track" key={track.id}>
          <div className="nn-music-cover">{track.cover_url?<img src={track.cover_url} alt={'جلد '+track.title}/>:<div className="nn-music-cover-fallback"><Disc3 size={38}/></div>}
            <button className="nn-music-play" onClick={()=>playTrack(track)} aria-label={'پخش '+track.title}><Play size={19} fill="currentColor"/></button>
          </div>
          <div className="nn-music-track-info"><strong>{track.title}</strong><span>{track.artist}</span><small>{track.album||'تک‌آهنگ'} · {formatTime(track.duration_seconds)}</small></div>
          <div className="nn-music-track-actions">
            <span className={'nn-music-status '+track.status}>{track.status==='published'?'منتشرشده':track.status==='pending'?'در انتظار بررسی':track.status==='rejected'?'ردشده':'غیرفعال'}</span>
            {user && <button onClick={()=>void addToPlaylist(track)} disabled={!playlists.length||busy===track.id} title="افزودن به پلی‌لیست"><Plus size={16}/></button>}
          </div>
        </article>)}
      </div>}
    </section>}

    {tab==='my' && <section className="nn-music-my">
      {user && <form className="nn-music-upload" onSubmit={upload}>
        <div className="nn-music-section-head"><div><span className="nn-music-kicker">YOUR SOUND</span><h2>افزودن قطعه به کتابخانه</h2></div><UploadCloud size={25}/></div>
        <p className="nn-music-hint">فقط فایل‌هایی را بارگذاری کن که مالک آن هستی یا مجوز انتشار و پخش آن‌ها را داری. قطعه قبل از انتشار عمومی بررسی می‌شود.</p>
        <div className="nn-music-form-grid">
          <label>نام قطعه<input value={title} onChange={e=>setTitle(e.target.value)} maxLength={120} required placeholder="مثلاً صبح در کارگاه"/></label>
          <label>نام هنرمند / خواننده<input value={artist} onChange={e=>setArtist(e.target.value)} maxLength={120} required placeholder="نام صاحب اجرا"/></label>
          <label>آلبوم (اختیاری)<input value={album} onChange={e=>setAlbum(e.target.value)} maxLength={120} placeholder="نام آلبوم"/></label>
          <label>صاحب حق اثر<input value={rightsHolder} onChange={e=>setRightsHolder(e.target.value)} maxLength={160} required placeholder="نام شخص یا صاحب امتیاز"/></label>
          <label>نوع مجوز<select value={license} onChange={e=>setLicense(e.target.value as LicenseType)}>{LICENSES.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}</select></label>
          <label>پیوند مدرک مجوز {['cc-by','cc-by-sa','licensed'].includes(license)?'(الزامی)':'(اختیاری)'}<input value={licenseUrl} onChange={e=>setLicenseUrl(e.target.value)} type="url" placeholder="https://…"/></label>
          <label className="wide">توضیحات<textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000} rows={2} placeholder="اطلاعات بیشتر دربارهٔ قطعه و مجوز…"/></label>
          <label className="nn-music-file">فایل صوتی (حداکثر ۵۰ مگابایت)<input type="file" accept=".mp3,.m4a,.mp4,.aac,.ogg,.wav,.flac,audio/*" onChange={e=>setAudioFile(e.target.files?.[0]??null)} required/><small>{audioFile?audioFile.name+' · '+formatSize(audioFile.size):'MP3 · M4A · AAC · OGG · WAV · FLAC'}</small></label>
          <label className="nn-music-file">جلد قطعه (اختیاری، حداکثر ۵ مگابایت)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setCoverFile(e.target.files?.[0]??null)}/><small>{coverFile?coverFile.name:'JPG · PNG · WebP'}</small></label>
        </div>
        <label className="nn-music-rights"><input type="checkbox" checked={rightsAccepted} onChange={e=>setRightsAccepted(e.target.checked)}/> تأیید می‌کنم حق بارگذاری و انتشار این فایل را دارم و اطلاعات مجوز صحیح است.</label>
        <button className="nn-music-primary" type="submit" disabled={busy==='upload'||!audioFile||!rightsAccepted}>{busy==='upload'?'در حال بارگذاری و بررسی فایل…':<>ثبت برای بررسی مدیر <UploadCloud size={17}/></>}</button>
      </form>}
      <div className="nn-music-section-head"><div><span className="nn-music-kicker">MY TRACKS</span><h2>قطعه‌های من</h2></div></div>
      {!user ? <div className="nn-music-empty">برای مشاهدهٔ قطعه‌های خود وارد حساب شو.</div> : <div className="nn-music-owned-list">{tracks.filter(t=>t.owner_id===user).map(t=><div className="nn-music-owned" key={t.id}><span className="nn-music-owned-icon"><Music2/></span><div><strong>{t.title}</strong><small>{t.artist} · {formatSize(t.file_size_bytes)} · {t.license_type}</small></div><span className={'nn-music-status '+t.status}>{t.status==='pending'?'در انتظار':t.status==='published'?'منتشرشده':t.status==='rejected'?'ردشده':'غیرفعال'}</span></div>)}</div>}
      {user && <div className="nn-music-profile-setting"><div><span className="nn-music-kicker">PROFILE SIGNATURE</span><h3>موسیقی امضای پروفایل</h3><p>قطعه‌ای از کتابخانه را به پروفایلت وصل کن و سطح نمایش آن را تعیین کن.</p></div>
        <select value={profileTrack} onChange={e=>setProfileTrack(e.target.value)}><option value="">انتخاب قطعهٔ منتشرشده</option>{tracks.filter(t=>t.status==='published'&&(t.visibility==='public'||t.owner_id===user)).map(t=><option key={t.id} value={t.id}>{t.title} — {t.artist}</option>)}</select>
        <select value={profileVisibility} onChange={e=>setProfileVisibility(e.target.value as any)}><option value="public">عمومی</option><option value="followers">فقط دنبال‌کنندگان</option><option value="private">فقط خودم</option></select>
        <div className="nn-music-profile-actions"><button className="nn-music-primary" onClick={()=>void setProfile()} disabled={!profileTrack||busy==='profile'}>ذخیره موسیقی پروفایل</button><button className="nn-music-secondary" onClick={()=>void clearProfile()} disabled={busy==='profile'}>حذف موسیقی پروفایل</button></div>
      </div>}
    </section>}

    {tab==='playlists' && <section className="nn-music-playlists">
      <div className="nn-music-section-head"><div><span className="nn-music-kicker">YOUR MIXTAPES</span><h2>پلی‌لیست‌های تو</h2></div><ListMusic size={25}/></div>
      {!user ? <div className="nn-music-empty">برای ساخت و مدیریت پلی‌لیست وارد حساب شو.</div> : <>
        <form className="nn-music-create-playlist" onSubmit={createPlaylist}><input value={playlistTitle} onChange={e=>setPlaylistTitle(e.target.value)} placeholder="نام پلی‌لیست جدید" maxLength={100} required/><select value={playlistVisibility} onChange={e=>setPlaylistVisibility(e.target.value as any)}><option value="private">خصوصی</option><option value="public">عمومی</option></select><button className="nn-music-primary" disabled={busy==='playlist'}><Plus size={16}/> ساخت پلی‌لیست</button></form>
        <div className="nn-music-playlist-list">{playlists.map(p=><article key={p.id}><span className="nn-music-playlist-art"><Disc3/></span><div><strong>{p.title}</strong><small>{p.visibility==='public'?'عمومی':'خصوصی'} · {p.owner_id===user?'ساختهٔ من':'اشتراکی'}</small></div><button onClick={()=>setSelectedPlaylist(p.id)} className={selectedPlaylist===p.id?'selected':''}>{selectedPlaylist===p.id?'انتخاب شد':'انتخاب'}</button></article>)}</div>
        <p className="nn-music-hint">پس از انتخاب پلی‌لیست، از دکمهٔ + کنار هر قطعه در کتابخانه برای افزودن آن استفاده کن.</p>
      </>}
    </section>}

    {tab==='review' && admin && <section className="nn-music-review"><div className="nn-music-section-head"><div><span className="nn-music-kicker">RIGHTS & MODERATION</span><h2>صف بررسی مجوز موسیقی</h2></div><ShieldCheck/></div>
      {visibleTracks.length===0?<div className="nn-music-empty">در حال حاضر قطعهٔ در انتظار بررسی وجود ندارد.</div>:visibleTracks.map(t=><article key={t.id} className="nn-music-review-card"><div><strong>{t.title} — {t.artist}</strong><p>صاحب حق: {t.rights_holder} · مجوز: {t.license_type}</p>{t.license_url&&<a href={t.license_url} target="_blank" rel="noreferrer">مشاهده مدرک مجوز</a>}<small>SHA-256: {t.sha256??'ثبت نشده'}</small></div><div><button onClick={()=>void moderate(t,'published')} disabled={busy===t.id} className="approve"><Check size={16}/> انتشار</button><button onClick={()=>void moderate(t,'rejected')} disabled={busy===t.id} className="reject"><X size={16}/> رد</button></div></article>)}
    </section>}
  </main>
}
