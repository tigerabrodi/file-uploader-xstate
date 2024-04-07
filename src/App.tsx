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
    <main>
      <div>
        <h1>Upload files</h1>
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <p>
            {isDragActive
              ? 'Drop the files here ...'
              : "Drag 'n' drop some files here, or click to select files"}
          </p>
        </div>
        {state.matches('failedToGetUploadUrl') && (
          <p>{state.context.errorMessage}</p>
        )}
      </div>

      <div>
        <h2>Uploaded files</h2>
        <ul>
          {state.context.trackedFiles.map((trackedFile) => (
            <li key={trackedFile.id}>
              <FileIcon />
              <div>
                <div>
                  <p>{trackedFile.file.name}</p>
                  <p>{trackedFile.file.size} bytes</p>
                </div>

                <p>{trackedFile.state}</p>
                <p>{trackedFile.progress}%</p>
              </div>
              <button aria-label="Cancel upload">
                <CloseIcon />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export default App
