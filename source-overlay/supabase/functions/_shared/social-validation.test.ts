import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSocialCaption, validateSocialMedia, SOCIAL_IMAGE_MAX_BYTES, SOCIAL_VIDEO_MAX_BYTES } from '../../../src/lib/social-validation.ts'

test('accepts supported image and video formats', () => {
  assert.deepEqual(validateSocialMedia({ name: 'quilt.jpg', type: 'image/jpeg', size: 1024 }), { ok: true, mediaType: 'image', mimeType: 'image/jpeg', extension: 'jpg' })
  assert.equal(validateSocialMedia({ name: 'reel.mp4', type: 'video/mp4', size: 1024 }).ok, true)
})

test('rejects mismatched extensions and unsupported MIME types', () => {
  assert.deepEqual(validateSocialMedia({ name: 'clip.exe', type: 'video/mp4', size: 1024 }), { ok: false, error: 'invalid_extension' })
  assert.deepEqual(validateSocialMedia({ name: 'clip.mp4', type: 'application/octet-stream', size: 1024 }), { ok: false, error: 'unsupported_type' })
})

test('enforces image and video size limits', () => {
  assert.deepEqual(validateSocialMedia({ name: 'large.mp4', type: 'video/mp4', size: SOCIAL_VIDEO_MAX_BYTES + 1 }), { ok: false, error: 'too_large' })
  assert.deepEqual(validateSocialMedia({ name: 'large.jpg', type: 'image/jpeg', size: SOCIAL_IMAGE_MAX_BYTES + 1 }), { ok: false, error: 'too_large' })
})

test('normalizes and bounds captions', () => {
  assert.deepEqual(normalizeSocialCaption('  سلام  '), { ok: true, caption: 'سلام' })
  assert.deepEqual(normalizeSocialCaption('  '), { ok: false, error: 'empty' })
  assert.deepEqual(normalizeSocialCaption('x'.repeat(2201)), { ok: false, error: 'too_long' })
})
