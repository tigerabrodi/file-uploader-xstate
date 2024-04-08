import type { UploadFileActor } from './UploadFileMachine'

import { assign, createActor, fromPromise, setup } from 'xstate'

import { uploadFileMachine } from './UploadFileMachine'
import { getUploadUrl } from '../api'

export type UploadFile = {
  actor: UploadFileActor
  file: File
}

type UploadManagerContext = {
  uploadFiles: Array<UploadFile>
  uploadId: string
  uploadUrl: string
  errorMessage: string
}

type UploadManagerEvents =
  | {
      type: 'SELECT_FILES'
      files: Array<File>
    }
  | {
      type: 'CANCEL_FILE_UPLOAD'
      actorId: string
    }
  | {
      type: 'RETRY_FILE_UPLOAD'
      actorId: string
    }

export const uploadManagerMachine = setup({
  types: {
    context: {} as UploadManagerContext,
    events: {} as UploadManagerEvents,
  },
  actions: {
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

    setUploadFiles: assign(
      (
        _,
        params: {
          files: Array<File>
        }
      ) => ({
        uploadFiles: params.files.map((file) => {
          const actor = createActor(uploadFileMachine, {
            input: {
              file,
            },
          }) as UploadFileActor

          actor.start()

          return {
            file,
            actor,
          }
        }),
      })
    ),

    uploadAllFiles: ({ context }) => {
      const actorsToUpload = context.uploadFiles
        .map(({ actor }) => {
          const snapshot = actor.getSnapshot()

          if (snapshot.context.status === 'idle') {
            return actor
          }

          return null
        })
        .filter(Boolean) as Array<UploadFileActor>

      actorsToUpload.forEach((actor) => {
        actor.send({
          type: 'UPLOAD',
          uploadUrl: context.uploadUrl,
        })
      })
    },

    retryFileUpload: ({ context }, params: { actorId: string }) => {
      const uploadFileToBeRetried = context.uploadFiles.find(
        (uploadFile) => uploadFile.actor.id === params.actorId
      )

      if (!uploadFileToBeRetried) {
        return {}
      }

      uploadFileToBeRetried.actor.send({
        type: 'RETRY_FILE_UPLOAD',
      })
    },

    cancelFileUpload: assign(
      (
        { context },
        params: {
          actorId: string
        }
      ) => {
        const uploadFileToBeCancelled = context.uploadFiles.find(
          (uploadFile) => uploadFile.actor.id === params.actorId
        )

        if (!uploadFileToBeCancelled) {
          return {}
        }

        uploadFileToBeCancelled.actor.send({
          type: 'CANCEL_FILE_UPLOAD',
        })

        const newUploadFiles = context.uploadFiles.filter(
          (uploadFile) => uploadFile.actor.id !== params.actorId
        )

        return {
          uploadFiles: newUploadFiles,
        }
      }
    ),

    appendNewFiles: assign(
      (
        { context },
        params: {
          files: Array<File>
        }
      ) => {
        const newUploadFiles = params.files.map((file) => {
          const actor = createActor(uploadFileMachine, {
            input: {
              file,
            },
          }) as UploadFileActor

          actor.start()

          return {
            file,
            actor,
          }
        })

        console.log('newUploadFiles', newUploadFiles)

        return {
          uploadFiles: [...context.uploadFiles, ...newUploadFiles],
        }
      }
    ),
  },
  actors: {
    getUploadUrl: fromPromise(getUploadUrl),
  },
}).createMachine({
  id: 'uploadManager',
  initial: 'gettingUploadUrl',
  context: {
    errorMessage: '',
    uploadId: '',
    uploadUrl: '',
    uploadFiles: [],
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
          actions: {
            type: 'setUploadFiles',
            params: ({ event }) => ({ files: event.files }),
          },
          target: 'uploadAllFiles',
        },
      },
    },

    uploadAllFiles: {
      entry: 'uploadAllFiles',
      on: {
        CANCEL_FILE_UPLOAD: {
          actions: {
            type: 'cancelFileUpload',
            params: ({ event }) => ({ actorId: event.actorId }),
          },
        },
        RETRY_FILE_UPLOAD: {
          actions: {
            type: 'retryFileUpload',
            params: ({ event }) => ({ actorId: event.actorId }),
          },
        },
        // How do we select files again and handle new uploads?
        SELECT_FILES: {
          actions: {
            type: 'appendNewFiles',
            params: ({ event }) => ({ files: event.files }),
          },
          target: 'uploadAllFiles',
          reenter: true,
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
