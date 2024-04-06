import { useMachine } from '@xstate/react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import { CloseIcon, FileIcon } from './icons'
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
    <main className="flex h-screen w-screen flex-col items-center gap-4">
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
          <p className="text-lg text-red-600">{state.context.errorMessage}</p>
        )}
      </div>

      <div className="mt-8 flex w-full flex-col items-center justify-center gap-4">
        <h2>Uploaded files</h2>
        <ul className="flex w-[700px] flex-col gap-4">
          {state.context.trackedFiles.map((trackedFile) => (
            <li
              key={trackedFile.id}
              className="flex w-full items-center gap-3 border border-slate-700 p-4"
            >
              <FileIcon className="h-10" />
              <div className="flex flex-col gap-2">
                <div className="flex flex-col">
                  <p className="text-md text-slate-700">
                    {trackedFile.file.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {trackedFile.file.size} bytes
                  </p>
                </div>

                <p className="text-sm text-slate-700">{trackedFile.state}</p>
                <p className="text-sm text-slate-700">
                  {/* turn this into percentage, it's currently a number up to 1 */}
                  {trackedFile.progress}%
                </p>
              </div>
              <button
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white"
                aria-label="Cancel upload"
              >
                <CloseIcon className="h-3/4 w-3/4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default App
