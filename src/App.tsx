import type { UploadFile } from './machines/UploadManagerMachine'

import { useMachine, useSelector } from '@xstate/react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import styles from './App.module.css'
import { CloseIcon, FileIcon } from './icons'
import { uploadManagerMachine } from './machines/UploadManagerMachine'

function App() {
  const [state, send] = useMachine(uploadManagerMachine)

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
              : 'Drag and drop or click to select files'}
          </p>
        </div>
        {state.matches('failedToGetUploadUrl') && (
          <p>{state.context.errorMessage}</p>
        )}
      </div>

      <div className={styles.uploadedFilesContainer}>
        <h2>Uploaded files</h2>
        <ul className={styles.uploadedFilesList}>
          {state.context.uploadFiles.map((uploadFile) => (
            <UploadFileListItem
              key={uploadFile.actor.id}
              uploadFile={uploadFile}
            />
          ))}
        </ul>
      </div>
    </main>
  )
}

function UploadFileListItem({ uploadFile }: { uploadFile: UploadFile }) {
  const context = useSelector(uploadFile.actor, (snapshot) => snapshot.context)

  console.log('status', status)

  return (
    <li
      key={uploadFile.actor.id}
      className={`${styles.uploadedFilesListItem} ${context.status === 'failed' ? styles.failed : ''}`}
    >
      <FileIcon className={styles.fileIcon} />
      <div className={styles.uploadedFilesListItemContent}>
        <p className={styles.uploadedFilesListItemName}>
          {uploadFile.file.name}
        </p>

        <p className={styles.uploadedFilesListItemProgress}>
          {context.progress}%
        </p>
      </div>
      <button aria-label="Cancel upload" className={styles.closeButton}>
        <CloseIcon />
      </button>

      {context.status === 'failed' && (
        <p className={styles.uploadedFilesListItemError}>
          {context.errorMessage}
        </p>
      )}
    </li>
  )
}

export default App
