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

  console.log('state', state)

  return (
    <main className="flex flex-col items-center h-screen w-screen">
      <div className="flex flex-col items-center justify-center gap-4 mt-8">
        <h1 className="text-4xl font-bold">Upload files</h1>
        <div
          {...getRootProps()}
          className="bg-slate-700 rounded-lg p-4 text-center"
        >
          <input {...getInputProps()} />
          <p className="text-slate-200">
            {isDragActive
              ? 'Drop the files here ...'
              : "Drag 'n' drop some files here, or click to select files"}
          </p>
        </div>
      </div>
    </main>
  )
}

export default App
