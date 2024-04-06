import { useMachine } from '@xstate/react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { uploadMachine } from './machines'

function App() {
  const [state, send] = useMachine(uploadMachine)

  const onDrop = useCallback(
    (acceptedFiles: Array<File>) => {
      send({ type: 'SELECT_FILES', files: acceptedFiles })
    },
    [send]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <main className="flex h-screen w-screen flex-col items-center">
      <div className="mt-8 flex w-full flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">Upload files</h1>
        <div
          {...getRootProps()}
          className="flex h-[200px] w-[700px] flex-col items-center rounded-lg bg-slate-700 p-8 text-center"
        >
          <input {...getInputProps()} />
          <p className="mt-auto text-2xl text-slate-200">
            {isDragActive
              ? 'Drop the files here ...'
              : "Drag 'n' drop some files here, or click to select files"}
          </p>
        </div>
        {state.matches('failedToGetUploadUrl') && (
          <p className="text-lg text-red-600">
            Failed to select files. Please try again.
          </p>
        )}
      </div>
    </main>
  )
}

export default App
