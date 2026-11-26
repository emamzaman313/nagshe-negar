import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Music2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './music.css'
type Track={id:string;title:string;artist:string;album:string|null;audio_path:string;cover_path:string|null;duration_seconds:number|null}
type Settings={default_track_id:string|null;enabled:boolean}
type DragStart={pointerId:number;y:number}
const formatTime=(value:number)=>{if(!Number.isFinite(value)||value<0)return '0:00';const n=Math.floor(value);return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
export function MusicPlayer(){
 const [tracks,setTracks]=useState<Track[]>([]),[current,setCurrent]=useState<Track|null>(null),[audioUrl,setAudioUrl]=useState(''),[coverUrl,setCoverUrl]=useState('')
 const [playing,setPlaying]=useState(false),[expanded,setExpanded]=useState(false),[collapsed,setCollapsed]=useState(false),[enabled,setEnabled]=useState(true),[volume,setVolume]=useState(.65)
 const [position,setPosition]=useState(0),[duration,setDuration]=useState(0),[error,setError]=useState('')
 const audio=useRef<HTMLAudioElement|null>(null),drag=useRef<DragStart|null>(null)
 const index=useMemo(()=>tracks.findIndex(t=>t.id===current?.id),[tracks,current])
 const resolveTrack=useCallback(async(track:Track|null)=>{
  if(!track||!supabase){setAudioUrl('');setCoverUrl('');return}
  const [a,c]=await Promise.all([supabase.storage.from('qnr-music').createSignedUrl(track.audio_path,1800),track.cover_path?supabase.storage.from('qnr-music').createSignedUrl(track.cover_path,1800):Promise.resolve({data:null,error:null})])
  if(a.error||!a.data?.signedUrl){setError('دسترسی به فایل موسیقی ممکن نیست.');setAudioUrl('');return}
  setAudioUrl(a.data.signedUrl);setCoverUrl(c.data?.signedUrl??'');setError('')
 },[])
 const load=useCallback(async()=>{
  if(!supabase)return
  const [s,t,p]=await Promise.all([supabase.from('qnr_music_platform_settings').select('default_track_id,enabled').eq('id',true).maybeSingle(),supabase.from('qnr_music_tracks').select('id,title,artist,album,audio_path,cover_path,duration_seconds').eq('status','published').eq('visibility','public').eq('rights_confirmed',true).eq('source','admin_library').order('published_at',{ascending:false}),supabase.auth.getUser()])
  if(t.error){setError('کتابخانه موسیقی بارگذاری نشد.');return}
  const list=(t.data??[]) as Track[];setTracks(list)
  const settings=(s.data??{default_track_id:null,enabled:true}) as Settings;setEnabled(settings.enabled!==false)
  const selected=list.find(x=>x.id===settings.default_track_id)??list[0]??null;setCurrent(selected);await resolveTrack(selected)
  if(p.data.user){const pref=await supabase.from('qnr_music_preferences').select('music_enabled,volume').eq('user_id',p.data.user.id).maybeSingle();if(pref.data){setEnabled(settings.enabled!==false&&pref.data.music_enabled!==false);setVolume(Number(pref.data.volume??.65))}}
 },[resolveTrack])
 useEffect(()=>{void load()},[load])
 useEffect(()=>{
  const client=supabase
  if(!client)return
  const channel=client.channel('qnr-music-live-settings')
   .on('postgres_changes',{event:'*',schema:'public',table:'qnr_music_platform_settings'},()=>{void load()})
   .on('postgres_changes',{event:'*',schema:'public',table:'qnr_music_tracks'},()=>{void load()})
   .subscribe()
  return()=>{void client.removeChannel(channel)}
 },[load])
 useEffect(()=>{if(!enabled&&audio.current){audio.current.pause();setPlaying(false)}},[enabled])
 useEffect(()=>{try{setCollapsed(window.localStorage.getItem('qnr-music-collapsed')==='true')}catch{}},[])
 useEffect(()=>{try{window.localStorage.setItem('qnr-music-collapsed',String(collapsed))}catch{}},[collapsed])
 useEffect(()=>{if(audio.current)audio.current.volume=volume},[volume,audioUrl])
 useEffect(()=>{const stop=()=>{audio.current?.pause();setPlaying(false)};const visibility=()=>{if(document.visibilityState!=='visible')stop()};document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',stop);window.addEventListener('blur',stop);return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',stop);window.removeEventListener('blur',stop);stop()}},[])
 useEffect(()=>{if(!audioUrl||!audio.current)return;audio.current.load()},[audioUrl])
 async function choose(track:Track,autoplay=false){setCurrent(track);setPosition(0);await resolveTrack(track);if(autoplay)window.setTimeout(()=>void audio.current?.play().then(()=>setPlaying(true)).catch(()=>setError('برای پخش، دوباره دکمهٔ پخش را بزن.')),100)}
 async function toggle(){if(!enabled||!audio.current||!audioUrl)return;if(playing){audio.current.pause();setPlaying(false);return}try{await audio.current.play();setPlaying(true);setError('')}catch{setError('مرورگر برای شروع پخش به لمس دکمه نیاز دارد.')}}
 function move(step:number){if(!tracks.length)return;const next=(index+step+tracks.length)%tracks.length;void choose(tracks[next],playing)}
 async function persistVolume(value:number){setVolume(value);const {data}=await supabase?.auth.getUser()??{data:{user:null}};if(data.user)void supabase?.from('qnr_music_preferences').upsert({user_id:data.user.id,volume:value},{onConflict:'user_id'})}
 function gripDown(event:React.PointerEvent<HTMLDivElement>){if(event.pointerType==='mouse'&&event.button!==0)return;drag.current={pointerId:event.pointerId,y:event.clientY};try{event.currentTarget.setPointerCapture(event.pointerId)}catch{drag.current=null}}
 function gripUp(event:React.PointerEvent<HTMLDivElement>){const start=drag.current;drag.current=null;if(!start||start.pointerId!==event.pointerId)return;const delta=event.clientY-start.y;if(delta>42)setCollapsed(true);else if(delta< -42)setCollapsed(false)}
 function gripKey(event:React.KeyboardEvent<HTMLDivElement>){if(event.key==='Enter'||event.key===' '){event.preventDefault();setCollapsed(v=>!v)}if(event.key==='ArrowDown'){event.preventDefault();setCollapsed(true)}if(event.key==='ArrowUp'){event.preventDefault();setCollapsed(false)}}
 if(!tracks.length)return null
 return <section className={`qnr-music-player ${expanded?'is-expanded':''} ${collapsed?'is-collapsed':''}`} aria-label="پخش‌کننده موسیقی نقش‌نگار" aria-expanded={!collapsed}>
  <audio ref={audio} src={audioUrl||undefined} preload="metadata" onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)} onLoadedMetadata={e=>setDuration(e.currentTarget.duration||current?.duration_seconds||0)} onEnded={()=>move(1)} onPause={()=>setPlaying(false)} onPlay={()=>setPlaying(true)} onError={()=>{if(audioUrl)setError('پخش این فایل ممکن نیست؛ آهنگ دیگری را انتخاب کن.')}}/>
  {collapsed?<button type="button" className="qnr-music-reopen" onClick={()=>setCollapsed(false)} aria-label="بازکردن پخش‌کننده موسیقی"><span className={playing?'is-playing':''}><Music2/></span><b>موسیقی</b><ChevronUp/></button>:<>
   <div className="qnr-music-grip" role="button" tabIndex={0} aria-label="برای جمع‌کردن به پایین بکشید؛ برای بازکردن به بالا بکشید" title="کشیدن به بالا یا پایین" onPointerDown={gripDown} onPointerUp={gripUp} onPointerCancel={()=>{drag.current=null}} onLostPointerCapture={()=>{drag.current=null}} onKeyDown={gripKey}><i/></div>
   <div className="qnr-music-main">
    <button className="qnr-music-cover" onClick={()=>setExpanded(v=>!v)} aria-label="نمایش جزئیات موسیقی">{coverUrl?<img src={coverUrl} alt="کاور آهنگ"/>:<Music2/>}</button>
    <div className="qnr-music-meta"><b>{current?.title??'موسیقی نقش‌نگار'}</b><span>{current?.artist??'کتابخانه نقش‌نگار'} <i className={playing?'qnr-music-status is-playing':'qnr-music-status'}/></span></div>
    <div className="qnr-music-controls"><button onClick={()=>move(-1)} aria-label="آهنگ قبلی"><SkipBack/></button><button className="qnr-music-play" onClick={()=>void toggle()} disabled={!enabled||!audioUrl} aria-label={playing?'توقف':'پخش'}>{playing?<Pause/>:<Play/>}</button><button onClick={()=>move(1)} aria-label="آهنگ بعدی"><SkipForward/></button></div>
    <button className="qnr-music-expand" onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'بستن جزئیات':'نمایش جزئیات'} aria-expanded={expanded}>{expanded?<ChevronDown/>:<ChevronUp/>}</button>
   </div>
   {expanded&&<div className="qnr-music-details"><div className="qnr-music-progress"><span>{formatTime(position)}</span><input aria-label="موقعیت پخش" type="range" min="0" max={duration||100} value={Math.min(position,duration||100)} onChange={e=>{if(audio.current)audio.current.currentTime=Number(e.target.value)}}/><span>{formatTime(duration)}</span></div><div className="qnr-music-volume"><VolumeX size={17}/><input aria-label="بلندی صدا" type="range" min="0" max="1" step=".01" value={volume} onChange={e=>void persistVolume(Number(e.target.value))}/><Volume2 size={17}/><span>{enabled?'پخش هنگام بازبودن برنامه':'پخش غیرفعال'}</span></div>{error&&<p role="status">{error}</p>}<div className="qnr-music-queue"><b>فهرست موسیقی مدیر</b>{tracks.map(t=><button key={t.id} className={current?.id===t.id?'active':''} onClick={()=>void choose(t,true)}><Music2 size={15}/><span>{t.title} — {t.artist}</span></button>)}</div></div>}
  </>}
 </section>
}
