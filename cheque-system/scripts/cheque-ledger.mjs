import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'cheque-system');
const DATA_DIR = path.join(ROOT, 'data');
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

function writeStore(store) {
  fs.writeFileSync(RECORDS_PATH, JSON.stringify(store, null, 2) + '\n', 'utf8');
}

function appendEvent(event) {
  ensureStore();
  fs.appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n', 'utf8');
}

function nowIso() {
  return new Date().toISOString();
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

function required(args, key) {
  if (!args[key]) throw new Error(`Missing required argument --${key}`);
  return args[key];
}

function getRecord(store, recordKey) {
  return store.records[recordKey] || null;
}

function normalizeRecord(base, patch) {
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
      imagePreview: ''
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

function deepMerge(target, source) {
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

function upsertRecord({ recordKey, patch, action, actor }) {
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

function print(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

function commandInit() {
  ensureStore();
  print({ ok: true, root: ROOT, recordsPath: RECORDS_PATH, eventsPath: EVENTS_PATH });
}

function commandUpsert(args) {
  const recordKey = required(args, 'record-key');
  const patch = {
    recordStatus: args.status || undefined,
    fields: {
      storeCode: args['store-code'] || undefined,
      chequeType: args['cheque-type'] || undefined,
      inputDate: args['input-date'] || undefined,
      chequePaymentDate: args['cheque-payment-date'] || undefined,
      chequeNumber: args['cheque-number'] || undefined,
      chequeAmount: args['cheque-amount'] || undefined,
      payeeName: args['payee-name'] || undefined,
      invoiceNo: args['invoice-no'] || undefined,
      remarks: args.remarks || undefined
    },
    audit: {
      messageId: args['message-id'] || undefined,
      senderId: args['sender-id'] || undefined,
      senderLabel: args['sender-label'] || undefined,
      sessionFile: args['session-file'] || undefined
    },
    images: {
      inboundMediaPath: args['inbound-media-path'] || undefined,
      compressedImagePath: args['compressed-image-path'] || undefined
    },
    confirmation: {
      originalSubmitterId: args['original-submitter-id'] || undefined,
      originalSubmitterLabel: args['original-submitter-label'] || undefined
    }
  };

  const cleaned = cleanUndefined(patch);
  const record = upsertRecord({ recordKey, patch: cleaned, action: 'upsert', actor: args.actor });
  print({ ok: true, record });
}

function commandConfirm(args) {
  const recordKey = required(args, 'record-key');
  const actor = required(args, 'actor');
  const record = upsertRecord({
    recordKey,
    action: 'confirm',
    actor,
    patch: {
      recordStatus: 'confirmed',
      confirmation: {
        confirmedBy: actor,
        confirmedAt: nowIso()
      }
    }
  });
  print({ ok: true, record });
}

function commandSheetWritten(args) {
  const recordKey = required(args, 'record-key');
  const record = upsertRecord({
    recordKey,
    action: 'sheet_written',
    actor: args.actor,
    patch: {
      recordStatus: 'sheet_written',
      sheetStatus: '已寫入',
      sheet: {
        rowNumber: args['row-number'] || '',
        lastError: '',
        lastWriteAt: nowIso()
      }
    }
  });
  print({ ok: true, record });
}

function commandSheetFailed(args) {
  const recordKey = required(args, 'record-key');
  const reason = required(args, 'reason');
  const record = upsertRecord({
    recordKey,
    action: 'sheet_failed',
    actor: args.actor,
    patch: {
      recordStatus: 'sheet_failed',
      sheetStatus: '寫入失敗',
      sheet: {
        lastError: reason,
        lastWriteAt: nowIso()
      }
    }
  });
  print({ ok: true, record });
}

function commandAttachImage(args) {
  const recordKey = required(args, 'record-key');
  const patch = {
    imageStatus: args['image-status'] || '已上傳',
    images: {
      compressedImagePath: args['compressed-image-path'] || undefined,
      imageLink: args['image-link'] || undefined,
      imagePreview: args['image-preview'] || undefined
    }
  };
  const record = upsertRecord({
    recordKey,
    action: 'attach_image',
    actor: args.actor,
    patch: cleanUndefined(patch)
  });
  print({ ok: true, record });
}

function commandShow(args) {
  const recordKey = required(args, 'record-key');
  const store = readStore();
  const record = getRecord(store, recordKey);
  if (!record) throw new Error(`Record not found: ${recordKey}`);
  print({ ok: true, record });
}

function commandList(args) {
  const store = readStore();
  let records = Object.values(store.records);
  if (args.status) {
    records = records.filter(r => r.recordStatus === args.status);
  }
  records = records.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  print({ ok: true, count: records.length, records });
}

function commandSheetPayload(args) {
  const recordKey = required(args, 'record-key');
  const token = required(args, 'token');
  const store = readStore();
  const record = getRecord(store, recordKey);
  if (!record) throw new Error(`Record not found: ${recordKey}`);

  const payload = {
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

  print({ ok: true, payload });
}

function cleanUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, cleanUndefined(value)]);
    return Object.fromEntries(entries);
  }
  return obj;
}

function usage() {
  console.log(`Commands:
  init
  upsert --record-key <key> [field flags]
  confirm --record-key <key> --actor <name>
  sheet-payload --record-key <key> --token <token>
  sheet-written --record-key <key> [--row-number 2]
  sheet-failed --record-key <key> --reason <msg>
  attach-image --record-key <key> [--image-link <url>] [--image-preview <formula>] [--image-status 已上傳]
  show --record-key <key>
  list [--status confirmed]
`);
}

function main() {
  const args = parseArgs(process.argv);
  const command = args._[0];

  switch (command) {
    case 'init':
      return commandInit();
    case 'upsert':
      return commandUpsert(args);
    case 'confirm':
      return commandConfirm(args);
    case 'sheet-payload':
      return commandSheetPayload(args);
    case 'sheet-written':
      return commandSheetWritten(args);
    case 'sheet-failed':
      return commandSheetFailed(args);
    case 'attach-image':
      return commandAttachImage(args);
    case 'show':
      return commandShow(args);
    case 'list':
      return commandList(args);
    default:
      usage();
      process.exit(command ? 1 : 0);
  }
}

try {
  main();
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }, null, 2));
  process.exit(1);
}
