import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

async function run() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fbPath = new URL('../firebase.js', import.meta.url);
  const fb = fs.readFileSync(fbPath, 'utf8');

  const apiKeyMatch = fb.match(/apiKey:\s*"([^"]+)"/);
  const projectMatch = fb.match(/projectId:\s*"([^"]+)"/);
  if (!apiKeyMatch || !projectMatch) {
    console.error('Could not find apiKey or projectId in firebase.js');
    process.exit(1);
  }
  const API_KEY = apiKeyMatch[1];
  const PROJECT_ID = projectMatch[1];

  const ts = Date.now();
  const email = `smoke_user_${ts}@example.com`;
  const password = `Sm0kePass!${Math.floor(Math.random()*9000)+1000}`;

  console.log('Creating test user:', email);
  // sign up
  const signupRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const signupJson = await signupRes.json();
  if (signupJson.error) {
    console.error('Signup error:', signupJson.error);
    process.exit(1);
  }
  const idToken = signupJson.idToken;
  const uid = signupJson.localId;
  console.log('Created user uid=', uid);

  // Write users/{uid} document with username
  const username = `smoke_${Math.floor(Math.random()*10000)}`;
  console.log('Writing username to Firestore:', username);
  const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const fields = {
    fields: {
      username: { stringValue: username }
    }
  };
  const writeRes = await fetch(`${docUrl}?key=${API_KEY}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(fields)
  });
  const writeJson = await writeRes.json();
  if (!writeRes.ok) {
    console.error('Write failed:', writeJson);
    process.exit(1);
  }
  console.log('Write succeeded. Document name:', writeJson.name || '(none)');

  // Read it back
  console.log('Reading document back...');
  const readRes = await fetch(`${docUrl}?key=${API_KEY}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${idToken}` }
  });
  const readJson = await readRes.json();
  if (!readRes.ok) {
    console.error('Read failed:', readJson);
    process.exit(1);
  }
  const readUsername = readJson.fields && readJson.fields.username && readJson.fields.username.stringValue;
  console.log('Read username from Firestore:', readUsername);

  // Update password
  console.log('Updating password...');
  const newPassword = `NewSm0ke!${Math.floor(Math.random()*9000)+1000}`;
  const updRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, password: newPassword, returnSecureToken: true })
  });
  const updJson = await updRes.json();
  if (updJson.error) {
    console.error('Password update error:', updJson.error);
    process.exit(1);
  }
  console.log('Password updated successfully. New idToken received.');

  console.log('\nSMOKE TEST SUMMARY:');
  console.log('email:', email);
  console.log('initial password:', password);
  console.log('updated password:', newPassword);
  console.log('uid:', uid);
  console.log('username written/read:', username, '->', readUsername);
  console.log('\nSmoke test completed OK.');
}

run().catch(err => { console.error('Smoke test failure:', err); process.exit(1); });
