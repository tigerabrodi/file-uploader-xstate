# File Uploader built with XState

# Journey

## New to XState

Being new to XState, I was excited. I heard amazing things about it. In particular, I'm a fan of using Statuses to manage the state of fetching data. Many friends I know reach for XState right away when they need to manage slighly more complex state.

**Spoiler:** It was a blast, I had loads of fun.

## Architecture rewrite

I read a bit up on XState and got a bit too quickly into the weeds. I started off by taking the approach where I would have a single machine handling all the file uploads. This quickly became complex. I had `currentFileIndex` in the context to keep track of the current file being uploaded which was a bit of a code smell.

It made me read up more on XState and how actors work. I learned that actors can run concurrently. This was a game changer. I could have each file upload be an actor and have a parent machine that manages the file uploads. This was so much more elegant and easier to reason about.

## Testing

Our goal with testing is to achieve confidence. Confidence that our code works as expected when the user interacts with the app.

To me, unit testing the State machine didn't make sense. We're first testing at a lower level, and not like the user. Second, we'd have to mock side effects which would make the tests less valuable.

I decided to test like a real user would via E2E tests in a real browser. This way we get a high confidence that the app works as expected, especially when dealing with behaviors like file uploads.

## Accessibility

As someone who cares about building accessible apps, I wanted to make sure the file uploader was accessible. I started off with React Dropzone, but it wasn't accessible. There weren't any accessible roles or labels. I didn't wanna modify it, so I rewrote it to use a native input and added some ARIA attributes to make it accessible.

We lose the drag and drop functionality, but we gain accessibility.

# Overview of XState

<details>
  <summary>🍿 Finite State Machines</summary>

---

At the core of XState is the concept of Finite State Machines (FSM). FSMs are a mathematical model of computation that can be in only one state at a time. They can transition from one state to another in response to events.

</details>

<details>
  <summary>🍿 State</summary>

---

In XState, states represent the different possible conditions or modes of your application. Each state can have its own set of properties, such as actions to be executed when entering or exiting the state, transitions to other states based on events, and nested substates

</details>

<details>
  <summary>🍿 Events</summary>

---

Events are the triggers that cause state transitions in XState. When an event is dispatched (sent) to the state machine, it checks the current state and decides the next state based on the defined transitions. Transitions specify the target state to move to when a specific event happens.

</details>

<details>
  <summary>🍿 Actions and Invoke</summary>

---

# Actions

Actions are intended to be quick, synchronous, "fire-and-forget" functions that are executed when entering a state, exiting a state, or during a transition. This is important to know because actions are not meant to be long-running or asynchronous. They also can't communicate back to the state machine. The state machine fires the action and then transitions to the next state.

# Invoke

Invoke on the other hand, is used for long-running, asynchronous tasks. It can be used to fetch data, set timeouts, or listen to events. It can communicate back to the state machine by sending events. When you care about the outcome of a task, you should use invoke.

</details>

<details>
  <summary>🍿 Actors</summary>

---

An actor is the running instance of a machine. It can be a child machine, a service, or a promise. Every actor can receive and send events. They have their own internal state. They communicate by sending asynchronous events to each other. Actors process one event at a time. When you send an event to an actor, it goes to the actor's message queue.

</details>

# Features

<details>
  <summary>🍿 UI and Accessibility</summary>

---

I wanted to make sure the experience is accessible. This includes:

- Using semantic HTML elements
- Adding ARIA attributes where necessary
- Using the right heading levels

You can take a look at the code to see all the details. I guess one interesting point is the file uploader. We have a visually hidden input connected to a label:

```jsx
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
```

</details>

<details>
  <summary>🍿 Parent machine</summary>

---

We have a parent machine that manages the file uploads. For every file upload, we create a new actor. This way we can manage each file upload separately. The nice part is that we can run actors concurrently. Therefore, to upload multiple files, we can upload them concurrently.

The file is quite big, but I think it makes sense to focus on the state and events.

```ts
type UploadFile = {
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
  | {
      type: 'DELETE_FILE_UPLOAD'
      actorId: string
    }
```

One of the things I was thinking about was whether I should let the UI send events directly to the child actors. I decided not to do this because I wanted to have the parent machine as the single source of truth. This also makes it less complex to manage the state.

Every event related to to a file upload goes through the parent machine. The parent machine then sends the event to the child actor. That's why we need the actorId in the events to know which actor to send the event to.

`UploadFile` could potentially be better named. Our goal is to keep track of the actor and the file associated with it.

`uploadUrl` and `uploadId` come from the mock API function we start off with to retreive where to send the file to.

</details>

<details>
  <summary>🍿 Upload file machine</summary>

---

Let's dive into the upload file machine. This machine manages the state of a single file upload.

```ts
type Status =
  | {
      status: 'idle' | 'uploading' | 'uploaded'
    }
  | {
      status: 'failed'
      errorMessage: string
    }

export type UploadFileContext = {
  file: File | null
  progress: number
  abortController: AbortController | null
} & Status

type UploadFileInput = {
  file: File
}

export type UploadFileEvents =
  | {
      type: 'UPLOAD'
      uploadUrl: string
    }
  | {
      type: 'UPDATE_FILE_PROGRESS'
      progress: number
    }
  | {
      type: 'CANCEL_FILE_UPLOAD'
    }
  | {
      type: 'RETRY_FILE_UPLOAD'
    }
  | {
      type: 'UPDATE_ABORT_CONTROLLER'
      abortController: AbortController
    }
  | {
      type: 'DELETE_FILE_UPLOAD'
    }
```

The `Status` of the file upload can be `idle`, `uploading`, `uploaded`, or `failed`. When the status is `failed`, we also store the `errorMessage`. The reason we type the status as an object is because we want to store additional information when the status is `failed`. This provides nice type-safety when narrowing down the status to `failed`.

`UploadFileContext` contains the file to upload, the progress of the upload, and an `AbortController` to cancel the upload. We also include the `Status` in the context.

`UploadFileInput` is the input passed from the parent machine when creating a new actor. It contains the file to upload.

</details>

<details>
  <summary>🍿 Cancelling requests</summary>

---

When we cancel a file upload, we need to both remove it from the parent machine's state, cancel the request and stop the actor.

One of the things I haven't mentioned is that when we create an actor, we start the actor. Starting the actor is needed to make it "alive".

When cancelling the request, we need AbortController. One of the things I intially tried was to create the AbortController in the context when the actor is created. This resulted in a bug where all actors' AbortControllers would be aborted when one of them got aborted (cancelled).

So instead, we create the AbortController before we do the upload request. However, we also know that we may receive the `CANCEL_FILE_UPLOAD` event from the parent machine and need a way to reference the AbortController. So what I do is after creating the AbortController in the invoke, I send an event to the parent machine with the AbortController to update the context to include the AbortController.

```ts
    uploadCurrentFile: fromPromise(async ({ input }) => {
      const { context, parent, uploadUrl } = input as {
        context: UploadFileContext
        parent: BaseActorRef<UploadFileEvents>
        uploadUrl: string
      }

      const abortController = new AbortController()

      parent.send({
        type: 'UPDATE_ABORT_CONTROLLER',
        abortController: abortController,
      })

      await uploadFile({
        file: context.file!,
        url: uploadUrl,
        onProgress: (progress: number) => {
          parent.send({
            type: 'UPDATE_FILE_PROGRESS',
            progress: progress,
          })
        },
        signal: abortController.signal,
      })
    }),
```

</details>

<details>
  <summary>🍿 Testing</summary>

---

The tests are written with Cypress and Testing Library. We test the happy path, cancelling a file upload, deleting a file upload, and retrying a file upload.

```ts
const AVATAR_FILE = 'demo-avatar.webp'
const GALAXY_FILE = 'galaxy.jpg'

it('Should upload, cancel, retry and delete files', () => {
  cy.visit('/')

  cy.findByRole('heading', { name: 'Upload files' }).should('be.visible')
  cy.findByRole('heading', { name: 'Uploaded files' }).should('be.visible')
  cy.findByText('No files uploaded yet').should('be.visible')

  // In the real world, we would mock the API calls using cy.intercept()
  // Needed because of the initial request to get the upload URL
  cy.wait(500)

  cy.findByLabelText('Click to select files').selectFile(
    [`cypress/fixtures/${AVATAR_FILE}`, `cypress/fixtures/${GALAXY_FILE}`],
    // Needed because input is visually hidden
    {
      force: true,
    }
  )

  cy.findByText(AVATAR_FILE).should('be.visible')
  cy.findByText(GALAXY_FILE).should('be.visible')
  cy.findByText('No files uploaded yet').should('not.exist')

  cy.findByRole('button', { name: `Cancel file upload ${AVATAR_FILE}` }).click()
  cy.findByText(AVATAR_FILE).should('not.exist')

  cy.findByText('Upload failed. Please try again.').should('be.visible')
  cy.findByRole('button', { name: `Retry file upload ${GALAXY_FILE}` }).click()

  cy.findByRole('progressbar', {
    name: `Upload progress for ${GALAXY_FILE}: 100%`,
  })

  cy.findByRole('button', { name: `Delete file ${GALAXY_FILE}` }).click()

  cy.findByText('No files uploaded yet').should('be.visible')
})
```

Another thing worth mentioning is how we simulate the error when uploading the galaxy file.

If the first time, we throw an error. We do this by keeping track of the number of times we've tried to upload the file in a `Map`.

</details>

# Wrap up

It was a lot of fun building things. I learned more about XState than anticipated and am already in love with it. I can't wait to use it in more projects.
