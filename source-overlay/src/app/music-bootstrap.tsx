import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { ChevronDown, ChevronUp, Grip, Music2, Pause, Play, Volume2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './music.css'

type Track = {id:string;title:string;artist:string;audio_path:string;cover_path:string|null;audio_url?:string;cover_url?:string;duration_seconds?:number|null}
type PlayEvent = CustomEvent<{track:Track;url:string}>
const STORAGE_KEY='nn-music-player-v1'
function GlobalMusicPlayer() {
  const audio=useRef<HTMLAudioElement>(null)
  const [track,setTrack]=useState<Track|null>(null)
  const [userId,setUserId]=useState<string|null>(null)
  const [playing,setPlaying]=useState(false)
  const [expanded,setExpanded]=useState(true)
  const [enabled,setEnabled]=useState(true)
  const [volume,setVolume]=useState(0.65)
  const [current,setCurrent]=useState(0)
  const [duration,setDuration]=useState(0)
  const [notice,setNotice]=useState('')
  const [position,setPosition]=useState<{x:number;y:number}|null>(null)
  const drag=useRef<{x:number;y:number;left:number;top:number}|null>(null)

  useEffect(()=>{
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')
      if(typeof saved.volume==='number') setVolume(Math.max(0,Math.min(1,saved.volume)))
      if(typeof saved.enabled==='boolean') setEnabled(saved.enabled)
      if(saved.position && Number.isFinite(saved.position.x) && Number.isFinite(saved.position.y)) setPosition(saved.position)
      if(saved.track?.id && supabase){
        supabase.from('qnr_music_tracks').select('id,title,artist,audio_path,cover_path,duration_seconds').eq('id',saved.track.id).maybeSingle().then(async ({data})=>{
          if(!data||!supabase)return
          const [audioSigned,coverSigned]=await Promise.all([
            supabase.storage.from('qnr-music').createSignedUrl(data.audio_path,14400),
            data.cover_path?supabase.storage.from('qnr-music').createSignedUrl(data.cover_path,14400):Promise.resolve({data:null,error:null} as any)
          ])
          if(audioSigned.data?.signedUrl) setTrack({...data,audio_url:audioSigned.data.signedUrl,cover_url:coverSigned.data?.signedUrl??''})
        })
      }
    }catch{/* Ignore corrupted local player state. */}
  },[])
  useEffect(()=>{
    if(!supabase)return
    supabase.auth.getSession().then(({data})=>setUserId(data.session?.user.id??null))
    const {data}=supabase.auth.onAuthStateChange((_event,session)=>setUserId(session?.user.id??null))
    return()=>data.subscription.unsubscribe()
  },[])
  useEffect(()=>{
    if(!supabase||!userId)return
    let cancelled=false
    supabase.from('qnr_music_preferences').select('music_enabled,volume').eq('user_id',userId).maybeSingle().then(({data:pref})=>{
      if(!cancelled&&pref){setEnabled(pref.music_enabled);setVolume(Number(pref.volume))}
    })
    return()=>{cancelled=true}
  },[userId])
  useEffect(()=>{
    const listener=async (event:Event)=>{
      const detail=(event as PlayEvent).detail
      if(!detail?.track||!detail.url)return
      if(!enabled){setNotice('موسیقی در تنظیمات پخش‌کننده غیرفعال است.');return}
      setTrack({...detail.track,audio_url:detail.url})
      setNotice('')
      const el=audio.current
      if(el){el.src=detail.url;el.load();try{await el.play();setPlaying(true)}catch{setPlaying(false);setNotice('برای شروع پخش، دکمهٔ پخش را لمس کن.')} }
    }
    window.addEventListener('nn:music-play',listener)
    return()=>window.removeEventListener('nn:music-play',listener)
  },[enabled])
  useEffect(()=>{
    if(audio.current) audio.current.volume=volume
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify({volume,enabled,position,track:track?{id:track.id}:null,current}))}catch{}
  },[volume,enabled,position,track,current])
  useEffect(()=>{
    if(!supabase||!userId)return
    void supabase.from('qnr_music_preferences').upsert({user_id:userId,volume,music_enabled:enabled,last_track_id:track?.id??null,last_position_seconds:Math.floor(current),updated_at:new Date().toISOString()})
  },[userId,volume,enabled,track?.id])
  useEffect(()=>{
    const onTime=()=>{if(audio.current){setCurrent(audio.current.currentTime);setDuration(audio.current.duration||0)}}
    const onEnded=()=>{setPlaying(false);setCurrent(0)}
    const onError=()=>{setPlaying(false);setNotice('پخش این فایل ممکن نیست؛ اتصال یا سلامت فایل صوتی را بررسی کن.')}
    const el=audio.current
    if(!el)return
    el.addEventListener('timeupdate',onTime);el.addEventListener('loadedmetadata',onTime);el.addEventListener('ended',onEnded);el.addEventListener('error',onError)
    return()=>{el.removeEventListener('timeupdate',onTime);el.removeEventListener('loadedmetadata',onTime);el.removeEventListener('ended',onEnded);el.removeEventListener('error',onError)}
  },[])
  function toggle(){
    const el=audio.current
    if(!enabled){setNotice('ابتدا موسیقی را فعال کن.');return}
    if(!el||!track?.audio_url){setNotice('ابتدا یک قطعه از کتابخانه انتخاب کن.');return}
    if(el.paused) void el.play().then(()=>{setPlaying(true);setNotice('')}).catch(()=>{setPlaying(false);setNotice('پخش توسط مرورگر مسدود شد؛ دوباره لمس کن.')})
    else{el.pause();setPlaying(false)}
  }
  function toggleEnabled(){
    const next=!enabled;setEnabled(next)
    if(!next){audio.current?.pause();setPlaying(false);setNotice('موسیقی غیرفعال شد.')}
    else setNotice('موسیقی دوباره فعال شد.')
  }
  function seek(value:number){if(audio.current&&Number.isFinite(value)){audio.current.currentTime=value;setCurrent(value)}}
  function startDrag(e:PointerEvent<HTMLDivElement>){
    if((e.target as HTMLElement).closest('button,input'))return
    const rect=(e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    drag.current={x:e.clientX,y:e.clientY,left:rect.left,top:rect.top}
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function moveDrag(e:PointerEvent<HTMLDivElement>){
    if(!drag.current)return
    const x=Math.max(8,Math.min(window.innerWidth-300,drag.current.left+e.clientX-drag.current.x))
    const y=Math.max(8,Math.min(window.innerHeight-110,drag.current.top+e.clientY-drag.current.y))
    setPosition({x,y})
  }
  function stopDrag(){drag.current=null}
  const style=position?{left:position.x,top:position.y,right:'auto',bottom:'auto'}:undefined
  const time=(n:number)=>Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0')
  return <div className={'nn-global-player'+(expanded?' expanded':' compact')+(enabled?'':' disabled')} style={style}>
    <audio ref={audio} preload="none" />
    <div className="nn-player-grab" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} title="برای جابه‌جایی بکش"><Grip size={14}/></div>
    <div className="nn-player-main">
      <div className="nn-player-cover">{track?.cover_url?<img src={track.cover_url} alt=""/>:<Music2 size={22}/>}</div>
      <div className="nn-player-meta"><strong>{enabled?(track?.title??'موسیقی نقش‌نگار'):'موسیقی غیرفعال است'}</strong><span>{enabled?(track?.artist??'یک قطعه از کتابخانه انتخاب کن'):'برای فعال‌سازی لمس کن'}</span></div>
      <button className="nn-player-control" onClick={toggle} aria-label={playing?'توقف':'پخش'}>{playing?<Pause size={19}/>:<Play size={19}/>}</button>
      <button className="nn-player-icon" onClick={toggleEnabled} aria-label={enabled?'غیرفعال‌کردن موسیقی':'فعال‌کردن موسیقی'}><Volume2 size={16}/></button>
      <button className="nn-player-icon" onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'جمع کردن':'باز کردن'}>{expanded?<ChevronDown size={17}/>:<ChevronUp size={17}/>}</button>
      <button className="nn-player-icon" onClick={()=>{audio.current?.pause();setPlaying(false);setTrack(null);setNotice('')}} aria-label="پاک‌کردن قطعهٔ جاری"><X size={16}/></button>
    </div>
    {expanded&&<div className="nn-player-extra">
      <div className="nn-player-timeline"><span>{time(current)}</span><input type="range" min={0} max={Math.max(1,duration)} step={0.1} value={Math.min(current,duration||0)} onChange={e=>seek(Number(e.target.value))}/><span>{time(duration)}</span></div>
      <label className="nn-player-volume"><Volume2 size={15}/><input type="range" min={0} max={1} step={0.01} value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label>
      {notice&&<small role="status">{notice}</small>}
    </div>}
  </div>
}
if(typeof document!=='undefined'&&!document.getElementById('nn-global-player-root')){
  const host=document.createElement('div');host.id='nn-global-player-root';document.body.appendChild(host);createRoot(host).render(<GlobalMusicPlayer/>)
}
