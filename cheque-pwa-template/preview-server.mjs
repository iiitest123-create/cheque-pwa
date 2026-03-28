import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const WORKSPACE_ROOT = path.resolve(ROOT, '..');
const RECORDS_PATH = path.join(WORKSPACE_ROOT, 'cheque-system', 'data', 'records.json');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function safeJoin(root, requestPath) {
  const clean = requestPath.split('?')[0].split('#')[0];
  const normalized = path.normalize(decodeURIComponent(clean)).replace(/^([.][.][/\\])+/, '');
  const resolved = path.resolve(root, '.' + normalized);
  if (!resolved.startsWith(path.resolve(root))) return null;
  return resolved;
}

function sendJson(res, statusCode, obj) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(obj, null, 2));
}

function readRecords() {
  const raw = fs.readFileSync(RECORDS_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  return Object.values(parsed.records || {}).sort((a, b) => String(a.updatedAt).localeCompare(String(b.updatedAt)) * -1);
}

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(value + 'T00:00:00');
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(dateA, dateB) {
  const ms = dateB.getTime() - dateA.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function normalizeAccounting(record) {
  const payDate = toDateOnly(record.fields?.chequePaymentDate || '');
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let followUpStatus = '待過數';
  let note = '等待銀行過數 / 會計確認';

  if (payDate) {
    const delta = daysBetween(todayDate, payDate);
    if (delta < 0) {
      followUpStatus = '異常';
      note = `已過 ${Math.abs(delta)} 日仍未標記過數`;
    } else if (delta <= 2) {
      followUpStatus = '待跟進';
      note = `${delta} 日內應檢查銀行過數`;
    }
  }

  return { followUpStatus, note };
}

function buildDashboard() {
  const records = readRecords();
  const withAccounting = records.map(record => ({ ...record, accounting: normalizeAccounting(record) }));

  const summary = {
    total: withAccounting.length,
    pendingConfirmation: withAccounting.filter(r => r.recordStatus === 'pending_confirmation').length,
    confirmed: withAccounting.filter(r => r.recordStatus === 'confirmed').length,
    sheetWritten: withAccounting.filter(r => r.sheetStatus === '已寫入').length,
    sheetFailed: withAccounting.filter(r => r.sheetStatus === '寫入失敗').length,
    imagePending: withAccounting.filter(r => r.imageStatus === '待上傳').length,
    imageCompressed: withAccounting.filter(r => r.imageStatus === '已壓縮').length,
    imageUploaded: withAccounting.filter(r => r.imageStatus === '已上傳').length,
    accountingUpcoming: withAccounting.filter(r => r.accounting.followUpStatus === '待跟進').length,
    accountingOverdue: withAccounting.filter(r => r.accounting.followUpStatus === '異常').length
  };

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    summary,
    records: withAccounting,
    accountingRecords: withAccounting.filter(r => ['待跟進', '異常', '待過數'].includes(r.accounting.followUpStatus))
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);

  if (url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'cheque-pwa-preview' });
  }

  if (url.pathname === '/api/dashboard') {
    try {
      return sendJson(res, 200, buildDashboard());
    } catch (error) {
      return sendJson(res, 500, { ok: false, error: String(error?.message || error) });
    }
  }

  const urlPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = safeJoin(ROOT, urlPath || '/index.html');

  if (!filePath) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`PWA template preview ready: http://${HOST}:${PORT}`);
});