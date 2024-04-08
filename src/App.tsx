import type { UploadFile } from './machines/UploadManagerMachine'

import { useMachine, useSelector } from '@xstate/react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

import styles from './App.module.css'
import { CloseIcon, FileIcon, Spinner, Trash } from './icons'
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

  function onCancelFileUpload(actorId: string) {
    send({ type: 'CANCEL_FILE_UPLOAD', actorId })
  }

  function onRetryFileUpload(actorId: string) {
    send({ type: 'RETRY_FILE_UPLOAD', actorId })
  }

  function onDeleteFileUpload(actorId: string) {
    send({ type: 'DELETE_FILE_UPLOAD', actorId })
  }

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
              onCancelFileUpload={onCancelFileUpload}
              onRetryFileUpload={onRetryFileUpload}
              onDeleteFileUpload={onDeleteFileUpload}
            />
          ))}
        </ul>
      </div>
    </main>
  )
}

type UploadFileListItemProps = {
  uploadFile: UploadFile
  onCancelFileUpload: (actorId: string) => void
  onRetryFileUpload: (actorId: string) => void
  onDeleteFileUpload: (actorId: string) => void
}

function UploadFileListItem({
  uploadFile,
  onCancelFileUpload,
  onRetryFileUpload,
  onDeleteFileUpload,
}: UploadFileListItemProps) {
  const context = useSelector(uploadFile.actor, (snapshot) => snapshot.context)

  return (
    <li
      key={uploadFile.actor.id}
      className={`${styles.uploadedFilesListItem} ${context.status === 'failed' ? styles.failed : ''}`}
      aria-describedby={
        context.status === 'failed' ? `error-${uploadFile.actor.id}` : undefined
      }
    >
      <FileIcon className={styles.fileIcon} />
      <div className={styles.uploadedFilesListItemContent}>
        <p className={styles.uploadedFilesListItemName}>
          {uploadFile.file.name}
        </p>

        <progress
          className={styles.uploadedFilesListItemProgress}
          value={context.progress}
          max="100"
        />

        {context.status === 'failed' && (
          <p
            id={`error-${uploadFile.actor.id}`}
            className={styles.uploadedFilesListItemError}
          >
            {context.errorMessage}
          </p>
        )}
      </div>
      {context.status === 'uploading' && (
        <button
          aria-label={`Cancel file upload ${uploadFile.file.name}`}
          className={`${styles.button} ${styles.destroyButton}`}
          onClick={() => onCancelFileUpload(uploadFile.actor.id)}
        >
          <CloseIcon />
        </button>
      )}

      {context.status === 'failed' && (
        <button
          aria-label={`Retry file upload ${uploadFile.file.name}`}
          className={`${styles.button} ${styles.retryButton}`}
          onClick={() => onRetryFileUpload(uploadFile.actor.id)}
        >
          <Spinner />
        </button>
      )}

      {context.status === 'uploaded' && (
        <button
          aria-label={`Delete file ${uploadFile.file.name}`}
          className={`${styles.button} ${styles.destroyButton}`}
          onClick={() => onDeleteFileUpload(uploadFile.actor.id)}
        >
          <Trash />
        </button>
      )}
    </li>
  )
}

export default App
