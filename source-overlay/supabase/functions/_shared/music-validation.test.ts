import test from 'node:test'
import assert from 'node:assert/strict'
import { validateMusicAudio, validateMusicCover, MAX_MUSIC_AUDIO_BYTES } from '../../../src/lib/music-validation.ts'

test('accepts supported audio at the exact 50 MiB boundary',()=>{
 assert.deepEqual(validateMusicAudio({type:'audio/mpeg',size:MAX_MUSIC_AUDIO_BYTES}),{ok:true})
})
test('rejects unsupported audio MIME types',()=>{
 assert.equal(validateMusicAudio({type:'application/octet-stream',size:100}).error,'unsupported_audio_type')
})
test('rejects audio larger than 50 MiB',()=>{
 assert.equal(validateMusicAudio({type:'audio/mpeg',size:MAX_MUSIC_AUDIO_BYTES+1}).error,'audio_too_large')
})
test('accepts optional cover and rejects unsupported or oversized covers',()=>{
 assert.deepEqual(validateMusicCover(null),{ok:true})
 assert.equal(validateMusicCover({type:'image/gif',size:100}).error,'unsupported_cover_type')
 assert.equal(validateMusicCover({type:'image/png',size:5*1024*1024+1}).error,'cover_too_large')
})
