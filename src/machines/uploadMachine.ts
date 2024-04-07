import type { BaseActorRef } from 'xstate'

import { v4 } from 'uuid'
import { assign, fromPromise, setup } from 'xstate'

import { getUploadUrl, uploadFile } from '../api'

type TrackedFile = {
  file: File
  progress: number
  state: 'pending' | 'uploading' | 'success' | 'failed'
  size: number
  id: string
}

type UploadContext = {
  trackedFiles: Array<TrackedFile>
  currentFileIndex: number
  uploadId: string
  uploadUrl: string
  errorMessage: string
}

type UploadEvents =
  | {
      type: 'SELECT_FILES'
      files: Array<File>
    }
  | {
      type: 'UPDATE_CURRENT_FILE_PROGRESS'
      progress: number
    }
  | {
      type: 'CANCEL_CURRENT_FILE_UPLOAD'
      fileId: string
    }

export const uploadMachine = setup({
  types: {
    context: {} as UploadContext,
    events: {} as UploadEvents,
  },
  actions: {
    setNextFileToUploading: assign({
      currentFileIndex: ({ context }) => context.currentFileIndex + 1,
    }),
    setFiles: assign({
      trackedFiles: ({ event }) => {
        if (event.type === 'SELECT_FILES') {
          return event.files.map((file) => ({
            state: 'pending' as const,
            progress: 0,
            size: file.size,
            file,
            id: v4(),
          }))
        }

        return []
      },
    }),
    setUploadData: assign(
      (
        _,
        params: {
          url: string
          id: string
        }
      ) => ({
        uploadId: params.id,
        uploadUrl: params.url,
      })
    ),
    updateFileProgress: assign({
      trackedFiles: ({ event, context }) => {
        const { progress } = event as { progress: number }
        // This is not working!?
        // We never get here...
        return context.trackedFiles.map((trackedFile) => {
          if (
            trackedFile.id === context.trackedFiles[context.currentFileIndex].id
          ) {
            return {
              ...trackedFile,
              progress,
            }
          }
          return trackedFile
        })
      },
    }),
    removeFile: assign({
      trackedFiles: ({ event, context }) => {
        const { fileId } = event as { fileId: string }
        return context.trackedFiles.filter((file) => file.id !== fileId)
      },
    }),
    setCurrentFileToUploading: assign({
      trackedFiles: ({ context }) => {
        return context.trackedFiles.map((trackedFile) => {
          if (
            trackedFile.id === context.trackedFiles[context.currentFileIndex].id
          ) {
            return {
              ...trackedFile,
              state: 'uploading' as const,
            }
          }
          return trackedFile
        })
      },
    }),
    updateFileToError: assign({
      trackedFiles: ({ context }) => {
        return context.trackedFiles.map((trackedFile) => {
          if (
            trackedFile.id === context.trackedFiles[context.currentFileIndex].id
          ) {
            return {
              ...trackedFile,
              state: 'failed' as const,
            }
          }
          return trackedFile
        })
      },
    }),
    updateFileToSuccess: assign({
      trackedFiles: ({ context }) => {
        return context.trackedFiles.map((trackedFile) => {
          if (
            trackedFile.id === context.trackedFiles[context.currentFileIndex].id
          ) {
            return {
              ...trackedFile,
              state: 'success' as const,
            }
          }
          return trackedFile
        })
      },
    }),
  },
  actors: {
    getUploadUrl: fromPromise(getUploadUrl),
    uploadCurrentFile: fromPromise(async ({ input }) => {
      const { context, parent } = input as {
        context: UploadContext
        parent: BaseActorRef<UploadEvents>
      }

      await uploadFile({
        file: context.trackedFiles[context.currentFileIndex].file,
        url: context.uploadUrl,
        onProgress: (progress: number) => {
          parent.send({
            type: 'UPDATE_CURRENT_FILE_PROGRESS',
            progress: Math.round(progress * 100),
          })
        },
        onCancel: () => {
          parent.send({
            type: 'CANCEL_CURRENT_FILE_UPLOAD',
            fileId: context.trackedFiles[context.currentFileIndex].id,
          })
        },
        signal: new AbortController().signal,
      })
    }),
  },
  guards: {
    isCurrentFile: ({ event, context }) => {
      const { fileId } = event as { fileId: string }
      return context.trackedFiles[context.currentFileIndex].id === fileId
    },
    hasNextFile: ({ context }) =>
      context.currentFileIndex < context.trackedFiles.length - 1,
  },
}).createMachine({
  id: 'upload',
  initial: 'gettingUploadUrl',
  context: {
    trackedFiles: [],
    currentFileIndex: 0,
    errorMessage: '',
    uploadId: '',
    uploadUrl: '',
  },
  states: {
    gettingUploadUrl: {
      invoke: {
        src: 'getUploadUrl',
        onDone: {
          target: 'readyToUpload',
          actions: {
            type: 'setUploadData',
            params: ({ event }) => event.output,
          },
        },
        onError: {
          target: 'failedToGetUploadUrl',
        },
      },
    },

    readyToUpload: {
      on: {
        SELECT_FILES: {
          actions: { type: 'setFiles' },
          target: 'uploadingFiles',
        },
      },
    },

    uploadingFiles: {
      initial: 'uploadingFile',
      states: {
        uploadingFile: {
          entry: 'setCurrentFileToUploading',
          invoke: {
            src: 'uploadCurrentFile',
            input: ({ context, self }) => ({
              context,
              parent: self,
            }),
            onDone: {
              actions: 'updateFileToSuccess',
              target: 'checkNextFile',
            },
            onError: {
              actions: 'updateFileToError',
              target: 'checkNextFile',
            },
          },

          on: {
            UPDATE_CURRENT_FILE_PROGRESS: {
              actions: {
                type: 'updateFileProgress',
                params: ({ event }) => event.progress,
              },
            },
            CANCEL_CURRENT_FILE_UPLOAD: {
              actions: {
                type: 'removeFile',
                params: ({ event }) => event.fileId,
              },
              target: 'checkNextFile',
            },
          },
        },

        checkNextFile: {
          always: [
            {
              guard: 'hasNextFile',
              actions: 'setNextFileToUploading',
              target: 'uploadingFile',
            },
            {
              target: 'uploadsComplete',
            },
          ],
        },

        uploadsComplete: {
          type: 'final',
        },
      },
    },

    failedToGetUploadUrl: {
      entry: assign({
        errorMessage: () => 'Failed to get upload URL. Please try again.',
      }),
    },
  },
})
