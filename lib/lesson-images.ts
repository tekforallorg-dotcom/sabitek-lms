import { supabase } from '@/lib/supabase'

const BUCKET = 'course-materials'
const MAX_INPUT_BYTES = 10 * 1024 * 1024 // 10MB pre-compression cap
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 0.82

/**
 * Downscale + re-encode an image to WebP for low-bandwidth learners.
 * A 4MB phone photo typically becomes ~100-200KB. GIF (animation) and
 * SVG pass through untouched.
 */
async function compressImage(file: File): Promise<{ blob: Blob; ext: string }> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return { blob: file, ext: file.name.split('.').pop() || 'gif' }
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return { blob: file, ext: file.name.split('.').pop() || 'jpg' }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY)
  )
  if (!blob) return { blob: file, ext: file.name.split('.').pop() || 'jpg' }

  // If webp somehow came out larger (rare, tiny images), keep the original.
  return blob.size < file.size ? { blob, ext: 'webp' } : { blob: file, ext: file.name.split('.').pop() || 'jpg' }
}

/**
 * Upload a lesson illustration to storage and return its public URL.
 * Compresses first; throws with a friendly message on failure.
 */
export async function uploadLessonImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Image must be under 10MB.')
  }

  const { blob, ext } = await compressImage(file)

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const filePath = `lesson-images/${fileName}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, { contentType: blob.type || file.type })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return publicUrl
}
