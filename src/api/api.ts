import { v4 as uuidv4 } from 'uuid'

export const getUploadUrl = async (): Promise<{ id: string; url: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  console.log('getUploadUrl from api')
  return {
    id: uuidv4(),
    url: 'https://example.com/upload',
  }
}

type UploadFileParams = {
  url: string
  file: File
  onProgress: (progress: number) => void
  signal: AbortSignal
}

const retries = new Map<string, boolean>()

export const uploadFile = async ({
  // url,
  file,
  onProgress,
  signal,
}: UploadFileParams): Promise<void> => {
  const totalSize = file.size
  let uploadedSize = 0

  while (uploadedSize < totalSize) {
    await new Promise((resolve) => setTimeout(resolve, 200))

    // This is for testing purposes
    if (
      file.name === 'galaxy.jpg' &&
      (!retries.has(file.name) || retries.get(file.name))
    ) {
      retries.set(file.name, false) // Set to false after the first failure
      throw new Error('Upload failed')
    }

    uploadedSize += totalSize * (0.1 + Math.random() * 0.2)

    const progress = Math.min(uploadedSize / totalSize, 1)

    if (signal.aborted) {
      break
    }

    onProgress(Math.round(progress * 100))
  }
}

export const notifyCompletion = async (): Promise<void> => {
  console.log('notifyCompletion from api')
  await new Promise((resolve) => setTimeout(resolve, 300))
}
