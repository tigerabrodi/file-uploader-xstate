1. **Project Setup**: Initialize project with Vite, React, TypeScript, and install dependencies (xstate, @xstate/react, axios, uuid).
2. **Mock API Functions**: Implement functions for getting upload URL, uploading files with progress simulation, and notification of completion.
3. **State Machine Creation**: Define the state machine with states for idle, getting URL, uploading (with progress), notifying, success, failure, and cancellation.
4. **State Implementations**:
   - **GettingUploadUrl**: Transition from idle to getting the upload URL.
   - **Uploading**: Handle file upload with progress updates and cancellation.
   - **Notifying**: Notify the backend on upload completion.
   - **Success & Failed States**: Setup transitions for retrying or marking as complete.
   - **Cancelling**: Handle upload cancellation.
5. **FileUploader Component**: Build the React component that uses the state machine.
6. **UI Interactions**: Implement file selection, display upload list with progress, and handle user actions (start, cancel, retry).
7. **Feedback**: Show success, failure messages, and upload progress.
8. **Testing**: Implement UI tests for file selection, upload, and cancellation
