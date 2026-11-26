export type SocialMediaFile = { name: string; type: string; size: number }
export type SocialMediaValidation =
  | { ok: true; mediaType: 'image' | 'video'; mimeType: string; extension: string }
  | { ok: false; error: 'unsupported_type' | 'too_large' | 'invalid_extension' }

const MIME_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
  'video/quicktime': ['mov'],
}

export const SOCIAL_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const SOCIAL_VIDEO_MAX_BYTES = 100 * 1024 * 1024

export function validateSocialMedia(file: SocialMediaFile): SocialMediaValidation {
  if (file.size <= 0) return { ok: false, error: 'too_large' }
  const extensions = MIME_EXTENSIONS[file.type]
  if (!extensions) return { ok: false, error: 'unsupported_type' }
  const limit = file.type.startsWith('video/') ? SOCIAL_VIDEO_MAX_BYTES : SOCIAL_IMAGE_MAX_BYTES
  if (file.size > limit) return { ok: false, error: 'too_large' }
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!extensions.includes(extension)) return { ok: false, error: 'invalid_extension' }
  return {
    ok: true,
    mediaType: file.type.startsWith('video/') ? 'video' : 'image',
    mimeType: file.type,
    extension: extension === 'jpeg' ? 'jpg' : extension,
  }
}

export function normalizeSocialCaption(value: string) {
  const caption = value.trim()
  if (!caption) return { ok: false as const, error: 'empty' as const }
  if (caption.length > 2200) return { ok: false as const, error: 'too_long' as const }
  return { ok: true as const, caption }
}
