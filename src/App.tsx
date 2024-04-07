import { useMachine } from '@xstate/react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import styles from './App.module.css'
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
      <div className={styles.dragContainer}>
        <h1>Upload files</h1>
        <div {...getRootProps()} className={styles.dropzone}>
          <input {...getInputProps()} />
          <p>
            {isDragActive
              ? 'Drop the files!'
              : "Drag and drop or click to select files"}
          </p>
        </div>
        {state.matches('failedToGetUploadUrl') && (
          <p>{state.context.errorMessage}</p>
        )}
      </div>

      <div className={styles.uploadedFilesContainer}>
        <h2>Uploaded files</h2>
        <ul className={styles.uploadedFilesList}>
          {state.context.trackedFiles.map((trackedFile) => (
            <li key={trackedFile.id} className={styles.uploadedFilesListItem}>
              <FileIcon className={styles.fileIcon} />
              <div className={styles.uploadedFilesListItemContent}>
                  <p className={styles.uploadedFilesListItemName}>
                    {trackedFile.file.name}
                  </p>

                <p className={styles.uploadedFilesListItemProgress}>
                  {trackedFile.progress}%
                </p>
              </div>
              <button aria-label="Cancel upload" className={styles.closeButton}>
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
