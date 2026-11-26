import { useEffect, useState, type FormEvent } from 'react'
import { Music2, Pause, Play, UploadCloud } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { validateMusicAudio, validateMusicCover } from '../lib/music-validation'
import './music.css'

type Track={id:string;title:string;artist:string;album:string|null;audio_path:string;cover_path:string|null;file_size_bytes:number;status:string;published_at:string|null}
export function MusicAdminPage(){
 const [user,setUser]=useState<string|null>(null),[admin,setAdmin]=useState(false),[ready,setReady]=useState(false)
 const [tracks,setTracks]=useState<Track[]>([]),[defaultId,setDefaultId]=useState(''),[enabled,setEnabled]=useState(true)
 const [title,setTitle]=useState(''),[artist,setArtist]=useState(''),[album,setAlbum]=useState(''),[rightsHolder,setRightsHolder]=useState(''),[license,setLicense]=useState('original'),[licenseUrl,setLicenseUrl]=useState(''),[rights,setRights]=useState(false)
 const [audio,setAudio]=useState<File|null>(null),[cover,setCover]=useState<File|null>(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')

 useEffect(()=>{if(!supabase){setReady(true);return}supabase.auth.getUser().then(({data})=>{setUser(data.user?.id??null);setReady(true)})},[])
 useEffect(()=>{if(!user||!supabase)return;supabase.from('qnr_user_roles').select('role').eq('user_id',user).eq('role','admin').maybeSingle().then(({data})=>setAdmin(Boolean(data)))},[user])
 async function load(){
  if(!supabase||!admin)return
  const [t,s]=await Promise.all([supabase.from('qnr_music_tracks').select('id,title,artist,album,audio_path,cover_path,file_size_bytes,status,published_at').eq('source','admin_library').order('created_at',{ascending:false}),supabase.from('qnr_music_platform_settings').select('default_track_id,enabled').eq('id',true).maybeSingle()])
  if(t.error||s.error){setNotice('اطلاعات کتابخانه بارگذاری نشد.');return}
  setTracks((t.data??[]) as Track[]);setDefaultId(s.data?.default_track_id??'');setEnabled(s.data?.enabled!==false)
 }
 useEffect(()=>{void load()},[admin])
 async function upload(e:FormEvent){
  e.preventDefault();if(!supabase||!user||!audio)return
  if(!title.trim()||!artist.trim()||!rightsHolder.trim()||!rights){setNotice('عنوان، هنرمند، صاحب حق و تأیید مجوز الزامی است.');return}
  const audioCheck=validateMusicAudio(audio),coverCheck=validateMusicCover(cover)
  if(!audioCheck.ok){setNotice('فایل باید فرمت صوتی مجاز و حداکثر ۵۰ مگابایت باشد.');return}
  if(!coverCheck.ok){setNotice('کاور باید JPG، PNG یا WebP و حداکثر ۵ مگابایت باشد.');return}
  setBusy(true);setNotice('')
  const id=crypto.randomUUID(),ext=audio.name.split('.').pop()?.toLowerCase()||'audio',audioPath=`library/${id}/track.${ext}`,coverPath=cover?`library/${id}/cover.${cover.name.split('.').pop()?.toLowerCase()||'jpg'}`:null
  try{
   const up=await supabase.storage.from('qnr-music').upload(audioPath,audio,{contentType:audio.type,upsert:false})
   if(up.error)throw up.error
   if(coverPath&&cover){const c=await supabase.storage.from('qnr-music').upload(coverPath,cover,{contentType:cover.type,upsert:false});if(c.error)throw c.error}
   const row=await supabase.from('qnr_music_tracks').insert({id,owner_id:user,title:title.trim(),artist:artist.trim(),album:album.trim()||null,audio_path:audioPath,cover_path:coverPath,mime_type:audio.type,file_size_bytes:audio.size,license_type:license,license_url:licenseUrl.trim()||null,rights_holder:rightsHolder.trim(),rights_confirmed:true,source:'admin_library',visibility:'public',status:'published',published_at:new Date().toISOString()})
   if(row.error)throw row.error
   setTitle('');setArtist('');setAlbum('');setRightsHolder('');setLicenseUrl('');setRights(false);setAudio(null);setCover(null);setNotice('آهنگ به کتابخانه مرکزی اضافه شد.');await load()
  }catch(err){await supabase.storage.from('qnr-music').remove([audioPath,...(coverPath?[coverPath]:[])]);setNotice('بارگذاری انجام نشد؛ مجوز مدیر و تنظیمات فایل را بررسی کن.')}
  finally{setBusy(false)}
 }
 async function saveSettings(){
  if(!supabase)return;setBusy(true)
  const {error}=await supabase.from('qnr_music_platform_settings').upsert({id:true,default_track_id:defaultId||null,enabled,updated_by:user},{onConflict:'id'})
  setNotice(error?'ذخیره تنظیمات انجام نشد.':'موسیقی پیش‌فرض نقش‌نگار ذخیره شد.');setBusy(false)
 }
 async function setTrackStatus(track:Track,status:'disabled'|'published'){
  const {error}=await supabase!.from('qnr_music_tracks').update({status}).eq('id',track.id)
  setNotice(error?'تغییر وضعیت آهنگ انجام نشد.':'وضعیت آهنگ تغییر کرد.');await load()
 }
 if(!ready)return <main className="qnr-music-admin"><p>در حال بررسی دسترسی…</p></main>
 if(!admin)return <main className="qnr-music-admin"><h1>مدیریت موسیقی</h1><p>برای مشاهده این بخش به حساب مدیر نیاز داری.</p><a href="/account">ورود به حساب</a></main>
 return <main className="qnr-music-admin">
  <header><span><Music2/> استودیوی صوتی نقش‌نگار</span><h1>مدیریت موسیقی</h1><p>کتابخانه مرکزی، آهنگ پیش‌فرض و تجربه پخش کاربران را مدیریت کن.</p></header>
  <section className="qnr-music-admin-card"><h2><UploadCloud/> افزودن آهنگ به کتابخانه</h2><form onSubmit={upload}>
   <div className="qnr-music-form-grid"><label>عنوان آهنگ<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>هنرمند / سازنده<input required maxLength={120} value={artist} onChange={e=>setArtist(e.target.value)}/></label><label>آلبوم (اختیاری)<input maxLength={120} value={album} onChange={e=>setAlbum(e.target.value)}/></label><label>صاحب حق اثر<input required maxLength={160} value={rightsHolder} onChange={e=>setRightsHolder(e.target.value)}/></label><label>نوع مجوز<select value={license} onChange={e=>setLicense(e.target.value)}><option value="original">اثر اصلی</option><option value="cc0">CC0</option><option value="public-domain">مالکیت عمومی</option><option value="licensed">دارای مجوز</option></select></label>{['cc-by','cc-by-sa','licensed'].includes(license)&&<label>پیوند مجوز<input required type="url" value={licenseUrl} onChange={e=>setLicenseUrl(e.target.value)} placeholder="https://…"/></label>}</div>
   <label className="qnr-music-file">فایل صوتی (حداکثر ۵۰ مگابایت)<input required type="file" accept="audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/flac" onChange={e=>setAudio(e.target.files?.[0]??null)}/></label>
   <label className="qnr-music-file">کاور (اختیاری، حداکثر ۵ مگابایت)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setCover(e.target.files?.[0]??null)}/></label>
   <label className="qnr-music-check"><input type="checkbox" checked={rights} onChange={e=>setRights(e.target.checked)}/> تأیید می‌کنم حق انتشار و پخش این اثر را دارم.</label>
   <button disabled={busy||!audio}>{busy?'در حال انجام…':'بارگذاری و انتشار آهنگ'}</button>
  </form></section>
  <section className="qnr-music-admin-card"><h2>تنظیمات پخش سراسری</h2><label>آهنگ پیش‌فرض مدیر<select value={defaultId} onChange={e=>setDefaultId(e.target.value)}><option value="">اولین آهنگ منتشرشده</option>{tracks.filter(t=>t.status==='published').map(t=><option key={t.id} value={t.id}>{t.title} — {t.artist}</option>)}</select></label><label className="qnr-music-check"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> فعال بودن پخش موسیقی برای کاربران</label><button onClick={()=>void saveSettings()} disabled={busy}>ذخیره تنظیمات</button></section>
  <section className="qnr-music-admin-card"><h2>کتابخانه مرکزی ({tracks.length})</h2>{tracks.map(t=><article className="qnr-music-admin-track" key={t.id}><div><b>{t.title}</b><span>{t.artist} · {Math.ceil(t.file_size_bytes/1024/1024)} مگابایت · {t.status==='published'?'منتشرشده':'غیرفعال'}</span></div><button onClick={()=>void setTrackStatus(t,t.status==='published'?'disabled':'published')}>{t.status==='published'?<Pause size={16}/>:<Play size={16}/>} {t.status==='published'?'غیرفعال‌سازی':'انتشار'}</button></article>)}</section>
  {notice&&<p className="qnr-music-notice" role="status">{notice}</p>}
 </main>
}
