import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Music2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './music.css'

type Track = { id:string; title:string; artist:string; album:string|null; audio_path:string; cover_path:string|null; duration_seconds:number|null }
type Settings = { default_track_id:string|null; enabled:boolean }
const formatTime=(value:number)=>{if(!Number.isFinite(value)||value<0)return '0:00';const n=Math.floor(value);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}

export function MusicPlayer(){
 const [tracks,setTracks]=useState<Track[]>([])
 const [current,setCurrent]=useState<Track|null>(null)
 const [audioUrl,setAudioUrl]=useState('')
 const [coverUrl,setCoverUrl]=useState('')
 const [playing,setPlaying]=useState(false)
 const [expanded,setExpanded]=useState(false)
 const [enabled,setEnabled]=useState(true)
 const [volume,setVolume]=useState(.65)
 const [position,setPosition]=useState(0)
 const [duration,setDuration]=useState(0)
 const [error,setError]=useState('')
 const audio=useRef<HTMLAudioElement|null>(null)
 const index=useMemo(()=>tracks.findIndex(t=>t.id===current?.id),[tracks,current])

 const resolveTrack=useCallback(async(track:Track|null)=>{
  if(!track||!supabase){setAudioUrl('');setCoverUrl('');return}
  const [a,c]=await Promise.all([
   supabase.storage.from('qnr-music').createSignedUrl(track.audio_path,1800),
   track.cover_path?supabase.storage.from('qnr-music').createSignedUrl(track.cover_path,1800):Promise.resolve({data:null,error:null})
  ])
  if(a.error||!a.data?.signedUrl){setError('دسترسی به فایل موسیقی ممکن نیست.');setAudioUrl('');return}
  setAudioUrl(a.data.signedUrl);setCoverUrl(c.data?.signedUrl??'');setError('')
 },[])

 const load=useCallback(async()=>{
  if(!supabase)return
  const [s,t,p]=await Promise.all([
   supabase.from('qnr_music_platform_settings').select('default_track_id,enabled').eq('id',true).maybeSingle(),
   supabase.from('qnr_music_tracks').select('id,title,artist,album,audio_path,cover_path,duration_seconds').eq('status','published').eq('visibility','public').eq('rights_confirmed',true).eq('source','admin_library').order('published_at',{ascending:false}),
   supabase.auth.getUser()
  ])
  if(t.error){setError('کتابخانه موسیقی بارگذاری نشد.');return}
  const list=(t.data??[]) as Track[];setTracks(list)
  const settings=(s.data??{default_track_id:null,enabled:true}) as Settings;setEnabled(settings.enabled!==false)
  const selected=list.find(x=>x.id===settings.default_track_id)??list[0]??null
  setCurrent(selected);await resolveTrack(selected)
  if(p.data.user){
   const pref=await supabase.from('qnr_music_preferences').select('music_enabled,volume').eq('user_id',p.data.user.id).maybeSingle()
   if(pref.data){setEnabled(settings.enabled!==false&&pref.data.music_enabled!==false);setVolume(Number(pref.data.volume??.65))}
  }
 },[resolveTrack])
 useEffect(()=>{void load()},[load])
 useEffect(()=>{if(audio.current)audio.current.volume=volume},[volume,audioUrl])
 useEffect(()=>{
  const stop=()=>{audio.current?.pause();setPlaying(false)}
  const visibility=()=>{if(document.visibilityState!=='visible')stop()}
  document.addEventListener('visibilitychange',visibility)
  window.addEventListener('pagehide',stop);window.addEventListener('blur',stop)
  return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',stop);window.removeEventListener('blur',stop);stop()}
 },[])
 useEffect(()=>{if(!audioUrl||!audio.current)return;audio.current.load()},[audioUrl])
 async function choose(track:Track,autoplay=false){
  setCurrent(track);setPosition(0);await resolveTrack(track)
  if(autoplay){window.setTimeout(()=>void audio.current?.play().then(()=>setPlaying(true)).catch(()=>setError('برای پخش، دوباره دکمهٔ پخش را بزن.')),100)}
 }
 async function toggle(){
  if(!enabled||!audio.current||!audioUrl)return
  if(playing){audio.current.pause();setPlaying(false);return}
  try{await audio.current.play();setPlaying(true);setError('')}catch{setError('مرورگر برای شروع پخش به لمس دکمه نیاز دارد.')}
 }
 function move(step:number){if(!tracks.length)return;const next=(index+step+tracks.length)%tracks.length;void choose(tracks[next],playing)}
 async function persistVolume(value:number){
  setVolume(value);const {data}=await supabase?.auth.getUser()??{data:{user:null}}
  if(data.user)void supabase?.from('qnr_music_preferences').upsert({user_id:data.user.id,volume:value},{onConflict:'user_id'})
 }
 if(!tracks.length)return null
 return <section className={`qnr-music-player ${expanded?'is-expanded':''}`} aria-label="پخش‌کننده موسیقی نقش‌نگار">
  <audio ref={audio} src={audioUrl||undefined} preload="metadata" onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)} onLoadedMetadata={e=>setDuration(e.currentTarget.duration||current?.duration_seconds||0)} onEnded={()=>move(1)} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)}/>
  <div className="qnr-music-main">
   <button className="qnr-music-cover" onClick={()=>setExpanded(v=>!v)} aria-label="بازکردن پخش‌کننده">{coverUrl?<img src={coverUrl} alt="کاور آهنگ"/>:<Music2/>}</button>
   <div className="qnr-music-meta"><b>{current?.title??'موسیقی نقش‌نگار'}</b><span>{current?.artist??'کتابخانه نقش‌نگار'}</span></div>
   <div className="qnr-music-controls"><button onClick={()=>move(-1)} aria-label="آهنگ قبلی"><SkipBack/></button><button className="qnr-music-play" onClick={()=>void toggle()} disabled={!enabled||!audioUrl} aria-label={playing?'توقف':'پخش'}>{playing?<Pause/>:<Play/>}</button><button onClick={()=>move(1)} aria-label="آهنگ بعدی"><SkipForward/></button></div>
   <button className="qnr-music-expand" onClick={()=>setExpanded(v=>!v)} aria-label="نمایش جزئیات">{expanded?<ChevronDown/>:<ChevronUp/>}</button>
  </div>
  {expanded&&<div className="qnr-music-details">
   <div className="qnr-music-progress"><span>{formatTime(position)}</span><input aria-label="موقعیت پخش" type="range" min="0" max={duration||100} value={Math.min(position,duration||100)} onChange={e=>{if(audio.current)audio.current.currentTime=Number(e.target.value)}}/><span>{formatTime(duration)}</span></div>
   <div className="qnr-music-volume"><VolumeX size={17}/><input aria-label="بلندی صدا" type="range" min="0" max="1" step=".01" value={volume} onChange={e=>void persistVolume(Number(e.target.value))}/><Volume2 size={17}/><span>{enabled?'پخش هنگام بازبودن برنامه':'پخش غیرفعال'}</span></div>
   {error&&<p role="status">{error}</p>}
   <div className="qnr-music-queue"><b>فهرست موسیقی مدیر</b>{tracks.map(t=><button key={t.id} className={current?.id===t.id?'active':''} onClick={()=>void choose(t,true)}><Music2 size={15}/><span>{t.title} — {t.artist}</span></button>)}</div>
  </div>}
 </section>
}
