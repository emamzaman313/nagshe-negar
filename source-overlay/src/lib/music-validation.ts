export type MusicAudioFile = { name:string; type:string; size:number }
export type MusicAudioValidation =
  | { ok:true; extension:string; mimeType:string }
  | { ok:false; error:'unsupported_type'|'file_too_large'|'empty_file' }

export const MUSIC_AUDIO_MAX_BYTES = 50 * 1024 * 1024
const MIME_BY_EXTENSION:Record<string,string> = {
  mp3:'audio/mpeg',m4a:'audio/mp4',mp4:'audio/mp4',aac:'audio/aac',
  ogg:'audio/ogg',wav:'audio/wav',flac:'audio/flac'
}
const MIME_ALIASES:Record<string,string[]> = {
  'audio/wav':['audio/x-wav','audio/wave'],
  'audio/flac':['audio/x-flac']
}

export function validateMusicAudio(file:MusicAudioFile):MusicAudioValidation {
  if(!Number.isFinite(file.size)||file.size<=0) return {ok:false,error:'empty_file'}
  if(file.size>MUSIC_AUDIO_MAX_BYTES) return {ok:false,error:'file_too_large'}
  const extension=file.name.split('.').pop()?.toLowerCase()??''
  const mimeType=MIME_BY_EXTENSION[extension]
  if(!mimeType) return {ok:false,error:'unsupported_type'}
  if(file.type && file.type!==mimeType && !(MIME_ALIASES[mimeType]??[]).includes(file.type))
    return {ok:false,error:'unsupported_type'}
  return {ok:true,extension:extension==='mp4'?'m4a':extension,mimeType}
}
