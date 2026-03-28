import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SYSTEM_ROOT = path.resolve(__dirname, '..', '..');
export const WORKSPACE_ROOT = path.resolve(SYSTEM_ROOT, '..');
export const DATA_DIR = path.join(SYSTEM_ROOT, 'data');
export const RECORDS_PATH = path.join(DATA_DIR, 'records.json');
export const EVENTS_PATH = path.join(DATA_DIR, 'events.jsonl');

export function nowIso() {
  return new Date().toISOString();
}

export function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RECORDS_PATH)) {
    fs.writeFileSync(RECORDS_PATH, JSON.stringify({ version: 1, records: {} }, null, 2) + '\n', 'utf8');
  }
  if (!fs.existsSync(EVENTS_PATH)) {
    fs.writeFileSync(EVENTS_PATH, '', 'utf8');
  }
}

export function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(RECORDS_PATH, 'utf8'));
}

export function writeStore(store) {
  fs.writeFileSync(RECORDS_PATH, JSON.stringify(store, null, 2) + '\n', 'utf8');
}

export function appendEvent(event) {
  ensureStore();
  fs.appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n', 'utf8');
}

export function getRecord(store, recordKey) {
  return store.records[recordKey] || null;
}

export function deepMerge(target, source) {
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      out[key] = deepMerge(out[key] || {}, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function normalizeRecord(base, patch) {
  const current = base || {
    recordKey: patch.recordKey,
    schemaVersion: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    recordStatus: 'draft',
    imageStatus: '待上傳',
    sheetStatus: '未寫入',
    source: {},
    fields: {
      storeCode: '',
      chequeType: '',
      inputDate: '',
      chequePaymentDate: '',
      chequeNumber: '',
      chequeAmount: '',
      payeeName: '',
      invoiceNo: '',
      remarks: '-'
    },
    images: {
      inboundMediaPath: '',
      compressedImagePath: '',
      imageLink: '',
      imagePreview: '',
      lastError: ''
    },
    confirmation: {
      confirmedBy: '',
      confirmedAt: '',
      originalSubmitterId: '',
      originalSubmitterLabel: ''
    },
    sheet: {
      rowNumber: '',
      lastError: '',
      lastWriteAt: ''
    },
    audit: {
      messageId: '',
      senderId: '',
      senderLabel: '',
      sessionFile: ''
    }
  };

  current.updatedAt = nowIso();
  return deepMerge(current, patch);
}

export function upsertRecord({ recordKey, patch, action, actor }) {
  const store = readStore();
  const current = getRecord(store, recordKey);
  const next = normalizeRecord(current, { recordKey, ...patch });
  store.records[recordKey] = next;
  writeStore(store);
  appendEvent({
    ts: nowIso(),
    action,
    actor: actor || 'system',
    recordKey,
    patch
  });
  return next;
}

export function buildAppendMainPayload(record, token) {
  return {
    token,
    action: 'appendMain',
    storeCode: record.fields.storeCode,
    chequeType: record.fields.chequeType,
    inputDate: record.fields.inputDate,
    chequePaymentDate: record.fields.chequePaymentDate,
    chequeNumber: record.fields.chequeNumber,
    chequeAmount: record.fields.chequeAmount,
    payeeName: record.fields.payeeName,
    invoiceNo: record.fields.invoiceNo,
    remarks: record.fields.remarks || '-',
    imageStatus: record.imageStatus || '待上傳',
    recordKey: record.recordKey
  };
}

export function cleanUndefined(obj) {
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, cleanUndefined(value)])
    );
  }
  return obj;
}
