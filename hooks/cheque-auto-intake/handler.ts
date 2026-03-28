import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type HookEvent = {
  type: string;
  action: string;
  timestamp: Date | string;
  context?: Record<string, any>;
  messages: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(WORKSPACE_ROOT, 'cheque-system', 'data');
const RECORDS_PATH = path.join(DATA_DIR, 'records.json');
const EVENTS_PATH = path.join(DATA_DIR, 'events.jsonl');

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(RECORDS_PATH)) {
    fs.writeFileSync(RECORDS_PATH, JSON.stringify({ version: 1, records: {} }, null, 2) + '\n', 'utf8');
  }
  if (!fs.existsSync(EVENTS_PATH)) {
    fs.writeFileSync(EVENTS_PATH, '', 'utf8');
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(RECORDS_PATH, 'utf8'));
}

function writeStore(store: any) {
  fs.writeFileSync(RECORDS_PATH, JSON.stringify(store, null, 2) + '\n', 'utf8');
}

function appendEvent(event: any) {
  ensureStore();
  fs.appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n', 'utf8');
}

function deepMerge(target: any, source: any): any {
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

function nowIso() {
  return new Date().toISOString();
}

function eventIso(value: Date | string | undefined) {
  if (!value) return nowIso();
  try {
    return new Date(value).toISOString();
  } catch {
    return nowIso();
  }
}

function getBody(context: Record<string, any>) {
  return String(context.bodyForAgent || context.body || context.content || '').trim();
}

function extractStoreCode(text: string) {
  const m = text.match(/\b([A-Z]{2}\d{3})\b/);
  return m ? m[1] : '';
}

function extractChequeType(text: string) {
  const types = ['鋪頭支票', '跨境支票', '現金單'];
  return types.find(type => text.includes(type)) || '';
}

function extractMediaPath(text: string) {
  const attached = text.match(/\[media attached:\s*(.+?)\s*\((?:image|application|video|audio)\/[\w.+-]+\)\]/i);
  if (attached) return attached[1].trim();
  const winPath = text.match(/[A-Z]:\\[^\]\n\r\t]+\.(jpg|jpeg|png|webp|gif|bmp|pdf)/i);
  return winPath ? winPath[0] : '';
}

function looksRelevant(text: string, channelId: string) {
  if (channelId !== 'whatsapp') return false;
  const hasStore = /\b[A-Z]{2}\d{3}\b/.test(text);
  const hasType = /(鋪頭支票|跨境支票|現金單)/.test(text);
  const hasImage = /\[media attached:|<media:image>|\.(jpg|jpeg|png|webp)/i.test(text);
  return hasStore && hasType && hasImage;
}

function normalizeRecord(base: any, patch: any) {
  const current = base || {
    recordKey: patch.recordKey,
    schemaVersion: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    recordStatus: 'pending_confirmation',
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

const handler = async (event: HookEvent) => {
  if (event.type !== 'message' || event.action !== 'preprocessed') {
    return;
  }

  const context = event.context || {};
  const text = getBody(context);
  const channelId = String(context.channelId || '');
  if (!looksRelevant(text, channelId)) {
    return;
  }

  const recordKey = String(context.messageId || `auto-${Date.now()}`);
  const storeCode = extractStoreCode(text);
  const chequeType = extractChequeType(text);
  const inboundMediaPath = extractMediaPath(text);
  const senderId = String(context.metadata?.senderE164 || context.metadata?.senderId || context.from || '');
  const senderName = String(context.metadata?.senderName || senderId || '');
  const senderLabel = senderName && senderId ? `${senderName} (${senderId})` : (senderName || senderId);
  const inputDate = eventIso(event.timestamp).slice(0, 10);

  const store = readStore();
  const current = store.records[recordKey] || null;
  const next = normalizeRecord(current, {
    recordKey,
    recordStatus: 'pending_confirmation',
    fields: {
      storeCode,
      chequeType,
      inputDate,
      remarks: '-'
    },
    source: {
      autoIntake: true,
      channelId,
      conversationId: String(context.conversationId || ''),
      groupId: String(context.groupId || '')
    },
    images: {
      inboundMediaPath
    },
    confirmation: {
      originalSubmitterId: senderId,
      originalSubmitterLabel: senderLabel
    },
    audit: {
      messageId: String(context.messageId || ''),
      senderId,
      senderLabel
    }
  });

  store.records[recordKey] = next;
  writeStore(store);
  appendEvent({
    ts: nowIso(),
    action: 'auto_intake',
    actor: 'cheque-auto-intake',
    recordKey,
    patch: {
      storeCode,
      chequeType,
      inboundMediaPath,
      senderId,
      senderLabel
    }
  });
};

export default handler;
