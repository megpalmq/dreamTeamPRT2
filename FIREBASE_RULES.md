Recommended Firebase security rules for this project

Firestore rules (firestore.rules):
- Allow authenticated users to read user documents.
- Allow users to write only their own `users/{uid}` document.
- Allow anyone to read `messages` but only authenticated users to create messages.
- Disallow client-side updates/deletes to messages (server or admin functions should manage moderation).

Storage rules (storage.rules):
- Allow users to upload avatars only to `avatars/{uid}/...` when authenticated and uid matches.
- Avatars are public for read/displaying in chat/profile.

How to deploy
1. Install Firebase CLI (if not installed):
   npm install -g firebase-tools
2. Login and select project:
   firebase login
   firebase use --add
3. Deploy rules:
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules

Security notes
- The above rules are a sensible starting point. For production, consider adding rate-limiting, content moderation, and stricter read rules for user documents if you store sensitive data.
- Ensure Firestore indexes and rules don't allow overly large content to be written by clients.
- Storage read=public for avatars is convenient for displaying images but ensure filenames/paths are secure and avoid exposing private data.
