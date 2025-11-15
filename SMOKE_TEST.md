Smoke test template (manual steps)

This doc describes manual steps you can run locally to verify profile -> chat integration. It does not run automatically (no service account provided).

1) Start the dev server and Sass watcher

```powershell
npm run dev
npm run compile-sass
```

2) Open the app in browser
- http://localhost:5174/src/account.html

3) Create or sign in with a password-based test account
- Use the app's signup page or the Firebase console to create a user.

4) Profile flow
- Upload an avatar image from the account page. The image should upload to Firebase Storage and preview.
- Update Display name and Username and press Save profile. Username should be saved to Firestore under `users/{uid}`.

5) Chat flow
- Open the chat page and send a message. It should show your display name, @username (if set), and avatar image.

6) Change password
- Use the Change password inputs on the account page. On success, Firestore `users/{uid}` should get `passwordLastChanged` timestamp.

Optional automated script (requires service account and firebase-admin)
- See `example-smoke-test.js` (not included) — you can write a Node script using firebase-admin to verify Firestore documents and Storage objects if you have a service account.
