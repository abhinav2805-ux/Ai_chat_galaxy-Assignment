import { writeFile, mkdir, access } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await access(UPLOAD_DIR)
  } catch {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function saveFile(file: File, conversationId: string): Promise<string> {
  await ensureUploadDir()
  
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const filePath = join(UPLOAD_DIR, fileName)
  
  await writeFile(filePath, buffer)
  
  return `/uploads/${fileName}`
}

export function getFileUrl(filePath: string): string {
  if (filePath.startsWith('http')) {
    return filePath
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}${filePath}`
}

export function isValidFileType(file: File): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf',
    'application/epub+zip'
  ]
  
  return allowedTypes.includes(file.type)
}

export function getFileSizeMB(file: File): number {
  return file.size / (1024 * 1024)
}

export function isFileTooLarge(file: File, maxSizeMB: number = 10): boolean {
  return getFileSizeMB(file) > maxSizeMB
} 