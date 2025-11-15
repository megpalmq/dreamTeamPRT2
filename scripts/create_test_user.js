import https from 'https';
import fs from 'fs';

// Read firebase.js to extract apiKey
const fb = fs.readFileSync(new URL('../firebase.js', import.meta.url), 'utf8');
const m = fb.match(/apiKey:\s*"([^"]+)"/);
if (!m) {
  console.error('Could not find apiKey in firebase.js');
  process.exit(1);
}
const API_KEY = m[1];

// Generate test credentials
const ts = Date.now();
const email = `test_user_${ts}@example.com`;
const password = `TestPass!${Math.floor(Math.random()*9000)+1000}`;

const postData = JSON.stringify({
  email,
  password,
  returnSecureToken: true
});

const options = {
  hostname: 'identitytoolkit.googleapis.com',
  path: `/v1/accounts:signUp?key=${API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.error('Error creating user:', JSON.stringify(json.error, null, 2));
        process.exit(1);
      }
      console.log('Test user created successfully:');
      console.log('email:', email);
      console.log('password:', password);
      console.log('localId (uid):', json.localId);
      console.log('idToken:', json.idToken);
      console.log('Refresh token:', json.refreshToken);
    } catch (e) {
      console.error('Unexpected response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
  process.exit(1);
});

req.write(postData);
req.end();
