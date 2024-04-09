import type { UploadFile } from './machines/UploadManagerMachine'
import type React from 'react'

import { useMachine, useSelector } from '@xstate/react'

import styles from './App.module.css'
import { CloseIcon, FileIcon, Spinner, Trash, Upload } from './icons'
import { uploadManagerMachine } from './machines/UploadManagerMachine'

function App() {
  const [state, send] = useMachine(uploadManagerMachine)

  function onFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    console.log('onFileUpload', event.target.files)
    const files = event.target.files

    if (!files) return

    console.log('after if (!files) return', Array.from(files))

    send({ type: 'SELECT_FILES', files: Array.from(files) })
  }

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

        <input
          type="file"
          id="file-upload"
          className="sr-only"
          multiple
          onChange={onFileUpload}
        />

        <label htmlFor="file-upload" className={styles.uploadButton}>
          <Upload className={styles.uploadIcon} />
          <p>Click to select files</p>
        </label>
        {state.matches('failedToGetUploadUrl') && (
          <p>{state.context.errorMessage}</p>
        )}
      </div>

      <div className={styles.uploadedFilesContainer}>
        <h2>Uploaded files</h2>
        {state.context.uploadFiles.length > 0 ? (
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
        ) : (
          <p className={styles.noFilesUploaded}>No files uploaded yet</p>
        )}
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

  console.log('context', context)

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
          max={100}
          aria-valuenow={context.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby={`file-upload-status-${uploadFile.actor.id}`}
        />

        <p id={`file-upload-status-${uploadFile.actor.id}`} className="sr-only">
          Upload progress for {uploadFile.file.name}: {context.progress}%
        </p>

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
