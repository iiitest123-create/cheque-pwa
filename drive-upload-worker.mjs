import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function usage() {
  console.log(`Usage:
  node drive-upload-worker.mjs --input <imagePath> --record-key <recordKey> [options]

Required env vars:
  GOOGLE_SERVICE_ACCOUNT_JSON   Path to service account json
  GOOGLE_DRIVE_FOLDER_ID        Target Drive folder id
  APPS_SCRIPT_URL               Apps Script web app URL
  APPS_SCRIPT_TOKEN             Apps Script secret token

Options:
  --input <path>                Input image path
  --record-key <key>            recordKey used for updateImage
  --file-name <name>            Override uploaded file name
  --mime <type>                 Default image/jpeg
  --dry-run                     Print actions without uploading
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
      args[key] = value;
      i++;
    }
  }
  return args;
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(serviceAccount, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(serviceAccount.private_key)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${unsigned}.${signature}`;
}

async function getAccessToken(serviceAccount) {
  const assertion = signJwt(serviceAccount, 'https://www.googleapis.com/auth/drive.file');
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Token request failed: ${response.status} ${JSON.stringify(json)}`);
  }
  if (!json.access_token) {
    throw new Error(`Token response missing access_token: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

async function uploadFile({ accessToken, filePath, fileName, mimeType, folderId }) {
  const metadata = {
    name: fileName,
    parents: [folderId]
  };
  const fileBuffer = fs.readFileSync(filePath);
  const boundary = 'openclaw-boundary-' + Date.now();
  const bodyParts = [
    `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n',
    `--${boundary}\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`,
    fileBuffer,
    `\r\n--${boundary}--\r\n`
  ];

  const body = Buffer.concat(bodyParts.map(part => Buffer.isBuffer(part) ? part : Buffer.from(part)));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': String(body.length)
    },
    body
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Drive upload failed: ${response.status} ${JSON.stringify(json)}`);
  }
  return json;
}

async function makeFileReadable({ accessToken, fileId }) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Set permission failed: ${response.status} ${text}`);
  }
}

async function callAppsScriptUpdate({ appsScriptUrl, token, recordKey, imageLink, imagePreview, imageStatus }) {
  const payload = {
    token,
    action: 'updateImage',
    recordKey,
    imageLink,
    imagePreview,
    imageStatus
  };

  const response = await fetch(appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (!response.ok || !json.ok) {
    throw new Error(`Apps Script update failed: ${response.status} ${JSON.stringify(json)}`);
  }
  return json;
}

function buildPreviewFormula(fileId) {
  const previewUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
  return `=IMAGE("${previewUrl}")`;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.input || !args['record-key']) {
    usage();
    process.exit(1);
  }

  const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;
  const appsScriptToken = process.env.APPS_SCRIPT_TOKEN;

  const inputPath = path.resolve(args.input);
  const recordKey = args['record-key'];
  const fileName = args['file-name'] || path.basename(inputPath);
  const mimeType = args.mime || 'image/jpeg';

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  if (args.dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      inputPath,
      recordKey,
      fileName,
      mimeType,
      folderId,
      appsScriptUrl,
      serviceAccountPath: serviceAccountPath || null,
      hasAppsScriptToken: Boolean(appsScriptToken)
    }, null, 2));
    return;
  }

  if (!serviceAccountPath || !folderId || !appsScriptUrl || !appsScriptToken) {
    throw new Error('Missing required env vars: GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_DRIVE_FOLDER_ID, APPS_SCRIPT_URL, APPS_SCRIPT_TOKEN');
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  const accessToken = await getAccessToken(serviceAccount);
  const uploaded = await uploadFile({
    accessToken,
    filePath: inputPath,
    fileName,
    mimeType,
    folderId
  });

  await makeFileReadable({ accessToken, fileId: uploaded.id });

  const imageLink = uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view?usp=sharing`;
  const imagePreview = buildPreviewFormula(uploaded.id);
  const updateResult = await callAppsScriptUpdate({
    appsScriptUrl,
    token: appsScriptToken,
    recordKey,
    imageLink,
    imagePreview,
    imageStatus: '已上傳'
  });

  console.log(JSON.stringify({
    ok: true,
    uploaded,
    imageLink,
    imagePreview,
    updateResult
  }, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }, null, 2));
  process.exit(1);
});
