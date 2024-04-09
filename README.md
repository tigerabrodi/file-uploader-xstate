# File Uploader built with XState

# Journey

- Xstate was new, learning it
- didn't know actors could run concurrently, started off by making the file uploads sequential
- actors could run concurrently, so i made each file upload an actor
- we have a parent machine that manages the file uploads

---

- testing, i don't see why we should unit test, we first don't test like the user and second we gotta mock side effects
- focusing on accessibility

---

- aborting a file upload was tricky, key was creating them before starting the upload and then updating the context, creating them on creating for some reason makes them listen to the same signal
- react dropzone initially, but wasn't accessible, rewrote to use native input
-

# Features

# How could this be improved?

- aria live for progress and error messages
- potentially see if focus management can be improved when e.g. deleting a list item
