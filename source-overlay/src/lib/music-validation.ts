export const MUSIC_AUDIO_TYPES = ['audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/flac'] as const
export const MUSIC_COVER_TYPES = ['image/jpeg','image/png','image/webp'] as const
export const MAX_MUSIC_AUDIO_BYTES = 50 * 1024 * 1024
export const MAX_MUSIC_COVER_BYTES = 5 * 1024 * 1024
export function validateMusicAudio(file: {type:string;size:number}) {
 if (!MUSIC_AUDIO_TYPES.includes(file.type as typeof MUSIC_AUDIO_TYPES[number])) return {ok:false as const,error:'unsupported_audio_type'}
 if (!Number.isFinite(file.size)||file.size<1) return {ok:false as const,error:'empty_audio'}
 if (file.size>MAX_MUSIC_AUDIO_BYTES) return {ok:false as const,error:'audio_too_large'}
 return {ok:true as const}
}
export function validateMusicCover(file: {type:string;size:number}|null) {
 if (!file) return {ok:true as const}
 if (!MUSIC_COVER_TYPES.includes(file.type as typeof MUSIC_COVER_TYPES[number])) return {ok:false as const,error:'unsupported_cover_type'}
 if (!Number.isFinite(file.size)||file.size<1) return {ok:false as const,error:'empty_cover'}
 if (file.size>MAX_MUSIC_COVER_BYTES) return {ok:false as const,error:'cover_too_large'}
 return {ok:true as const}
}
