import test from 'node:test'
import assert from 'node:assert/strict'
import { MUSIC_AUDIO_MAX_BYTES, validateMusicAudio } from '../../../src/lib/music-validation.ts'

test('accepts a valid MP3',()=>assert.deepEqual(validateMusicAudio({name:'song.mp3',type:'audio/mpeg',size:1200}),{ok:true,extension:'mp3',mimeType:'audio/mpeg'}))
test('accepts M4A with browser audio/mp4 MIME',()=>assert.equal(validateMusicAudio({name:'song.m4a',type:'audio/mp4',size:2000}).ok,true))
test('rejects unsupported extensions',()=>assert.deepEqual(validateMusicAudio({name:'track.exe',type:'audio/mpeg',size:100}),{ok:false,error:'unsupported_type'}))
test('rejects files above 50 MiB',()=>assert.deepEqual(validateMusicAudio({name:'large.flac',type:'audio/flac',size:MUSIC_AUDIO_MAX_BYTES+1}),{ok:false,error:'file_too_large'}))
test('rejects empty files',()=>assert.deepEqual(validateMusicAudio({name:'empty.wav',type:'audio/wav',size:0}),{ok:false,error:'empty_file'}))
test('rejects a MIME mismatch',()=>assert.deepEqual(validateMusicAudio({name:'song.mp3',type:'image/png',size:100}),{ok:false,error:'unsupported_type'}))
