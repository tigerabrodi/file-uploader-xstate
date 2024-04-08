import { v4 as uuidv4 } from 'uuid'

export const getUploadUrl = async (): Promise<{ id: string; url: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 400))
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

export const uploadFile = async ({
  // url,
  file,
  onProgress,
  signal,
}: UploadFileParams): Promise<void> => {
  const totalSize = file.size
  let uploadedSize = 0

  while (uploadedSize < totalSize) {
    await new Promise((resolve) => setTimeout(resolve, 300))

    uploadedSize += totalSize * 0.2

    const progress = Math.min(uploadedSize / totalSize, 1)

    if (signal.aborted) {
      break
    }

    onProgress(Math.round(progress * 100))
  }
}

export const notifyCompletion = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300))
}
