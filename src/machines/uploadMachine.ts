import { assign, fromPromise, setup } from 'xstate'

import { getUploadUrl } from '../api'

type TrackedFile = {
  file: File
  progress: number
  state: 'pending' | 'uploading' | 'success' | 'failed'
  size: number
}

type UploadContext = {
  trackedFiles: Array<TrackedFile>
  currentFileIndex: number
  uploadId: string
  uploadUrl: string
  errorMessage: string
}

type UploadEvent = {
  type: 'SELECT_FILES'
  files: Array<File>
}

export const uploadMachine = setup({
  types: {
    context: {} as UploadContext,
    events: {} as UploadEvent,
  },
  actions: {
    setFiles: assign({
      trackedFiles: ({ event }) =>
        event.files.map((file) => ({
          state: 'pending' as const,
          progress: 0,
          size: file.size,
          file,
        })),
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
  },
  actors: {
    getUploadUrl: fromPromise(getUploadUrl),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QFcAOAbA9gQwgOgEsJ0wBiAZQFEAZSgYQBUB9AMQElbyBtABgF1EoVJlgEALgUwA7QSAAeiAIwAmAJx4A7AA5Fi7Rp4AWAKyKtPLQBoQAT0QBmHpvvmAbDseOeuwwF9f1mhYuHgwYhJSUACqGDgQUQBO6KQQ0mCEUgBumADW6UFxoWDhBJExwfFJCKXZAMbYEtK8fM2ywqKNMki2iAZ4iq48g67K2qp6GvbWCgiuhk4WjvNarnquGn4BIAUhYRHRsbiJyWAJCZgJeBgNAGYXALZ4O-h7pQcVx9VZmPWdza3ddriSRdUAzVz2Yx4Iw8HgaZS6NYbax2BAAWj0TmUhlUxhxqg0igsylG-i2UkwEDgsmebREwOkshmaOUeARWi0CLUeJ04zmKMQLPWeHMOkM9nhRM59n8gUO+CIJDpHRBTMQJk0Oj0WgMJjMFkMAoQxnseFUcwhQ08sJ8su28qKJTK8uOyoZoPkDlG-VU2MUxhWSPsriNfQGQyGoy04w0kztzzwCTAuBsDEw5Tibs6atmJLNJpUxiNyhWZvM4x1Ywm8YdN2wBBIEDTAHFihmjkks6rujMfJpzTqiz10fq8I4xRKEcTSWSgA */
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
          target: 'uploading',
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
