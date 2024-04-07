import type { ActorRefFrom, BaseActorRef } from 'xstate'

import { assign, fromPromise, setup } from 'xstate'

import { notifyCompletion, uploadFile } from '../api'

type Status =
  | {
      status: 'idle' | 'uploading' | 'success'
    }
  | {
      status: 'failed'
      errorMessage: string
    }

export type UploadFileContext = {
  file: File | null
  progress: number
  abortController: AbortController
} & Status

type UploadFileInput = {
  file: File
}

export type UploadFileEvents =
  | {
      type: 'UPLOAD'
      uploadUrl: string
    }
  | {
      type: 'UPDATE_CURRENT_FILE_PROGRESS'
      progress: number
    }
  | {
      type: 'CANCEL_CURRENT_FILE_UPLOAD'
    }

export const uploadFileMachine = setup({
  types: {
    context: {} as UploadFileContext,
    events: {} as UploadFileEvents,
  },
  actions: {
    updateFileToSuccess: assign({
      status: 'success',
    }),
    updateFileToError: assign({
      status: 'failed',
      errorMessage: 'Failed to upload file. Please try again.',
    }),
    updateFileProgress: assign(
      (
        _,
        params: {
          progress: number
        }
      ) => {
        return {
          progress: params.progress,
        }
      }
    ),
    stopActor: ({ self }) => {
      self.stop()
    },
    cancelFileUpload: ({ context }) => {
      context.abortController.abort()
    },
  },
  actors: {
    notifyCompletion: fromPromise(notifyCompletion),
    uploadCurrentFile: fromPromise(async ({ input }) => {
      const { context, parent, uploadUrl } = input as {
        context: UploadFileContext
        parent: BaseActorRef<UploadFileEvents>
        uploadUrl: string
      }

      await uploadFile({
        file: context.file!,
        url: uploadUrl,
        onProgress: (progress: number) => {
          parent.send({
            type: 'UPDATE_CURRENT_FILE_PROGRESS',
            progress: progress,
          })
        },
        onCancel: () => {
          parent.send({
            type: 'CANCEL_CURRENT_FILE_UPLOAD',
          })
        },
        signal: context.abortController.signal,
      })
    }),
  },
}).createMachine({
  initial: 'idle',

  context: ({ input }) => {
    const { file } = input as UploadFileInput

    return {
      file,
      progress: 0,
      status: 'idle',
      abortController: new AbortController(),
    }
  },
  states: {
    idle: {
      on: {
        UPLOAD: {
          target: 'uploading',
        },
      },
    },
    uploading: {
      invoke: {
        src: 'uploadCurrentFile',
        input: ({ context, self, event }) => ({
          context,
          parent: self,
          uploadUrl: (event as { uploadUrl: string }).uploadUrl,
        }),
        onDone: {
          actions: {
            type: 'updateFileToSuccess',
          },
          target: 'notifying',
        },
        onError: {
          actions: 'updateFileToError',
        },
      },

      on: {
        UPDATE_CURRENT_FILE_PROGRESS: {
          actions: {
            type: 'updateFileProgress',
            params: ({ event }) => ({ progress: event.progress }),
          },
        },
        CANCEL_CURRENT_FILE_UPLOAD: {
          actions: {
            type: 'cancelFileUpload',
          },
          target: 'success',
        },
      },
    },

    notifying: {
      invoke: {
        src: 'notifyCompletion',
        onDone: {
          target: 'success',
        },
        onError: {
          target: 'notificationFailed',
        },
      },
    },

    notificationFailed: {
      always: {
        actions: 'updateFileToError',
      },
    },

    success: {
      entry: 'stopActor',
      type: 'final',
    },
  },
})

export type UploadFileActor = ActorRefFrom<typeof uploadFileMachine>
