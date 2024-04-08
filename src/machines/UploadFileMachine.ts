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
  abortController: AbortController | null
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
      type: 'UPDATE_FILE_PROGRESS'
      progress: number
    }
  | {
      type: 'CANCEL_FILE_UPLOAD'
    }
  | {
      type: 'RETRY_FILE_UPLOAD'
    }
  | {
      type: 'UPDATE_ABORT_CONTROLLER'
      abortController: AbortController
    }

export const uploadFileMachine = setup({
  types: {
    context: {} as UploadFileContext,
    events: {} as UploadFileEvents,
  },
  actions: {
    updateAbortController: assign(
      (_, params: { abortController: AbortController }) => ({
        abortController: params.abortController,
      })
    ),
    updateFileToUploading: assign({
      progress: 0,
      status: 'uploading',
      errorMessage: '',
      abortController: new AbortController(),
    }),
    updateFileToSuccess: assign({
      status: 'success',
    }),
    updateFileToError: assign({
      status: 'failed',
      errorMessage: 'Upload failed. Please try again.',
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
      context.abortController?.abort('Upload cancelled by user')
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

      const abortController = new AbortController()

      parent.send({
        type: 'UPDATE_ABORT_CONTROLLER',
        abortController: abortController,
      })

      await uploadFile({
        file: context.file!,
        url: uploadUrl,
        onProgress: (progress: number) => {
          parent.send({
            type: 'UPDATE_FILE_PROGRESS',
            progress: progress,
          })
        },
        signal: abortController.signal,
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
      abortController: null,
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
      entry: {
        type: 'updateFileToUploading',
      },
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
        UPDATE_FILE_PROGRESS: {
          actions: {
            type: 'updateFileProgress',
            params: ({ event }) => ({ progress: event.progress }),
          },
        },
        CANCEL_FILE_UPLOAD: {
          actions: {
            type: 'cancelFileUpload',
          },
          target: 'success',
        },
        RETRY_FILE_UPLOAD: {
          target: 'uploading',
          reenter: true,
        },
        UPDATE_ABORT_CONTROLLER: {
          actions: {
            type: 'updateAbortController',
            params: ({ event }) => ({ abortController: event.abortController }),
          },
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
