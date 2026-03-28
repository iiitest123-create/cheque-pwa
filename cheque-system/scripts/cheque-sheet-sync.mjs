import { buildAppendMainPayload, getRecord, nowIso, readStore, upsertRecord } from './lib/ledger-store.mjs';

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

function print(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

async function main() {
  const args = parseArgs(process.argv);
  const recordKey = required(args, 'record-key');
  const appsScriptUrl = args.url || process.env.APPS_SCRIPT_URL;
  const token = args.token || process.env.APPS_SCRIPT_TOKEN;
  const actor = args.actor || 'sheet-sync';

  if (!appsScriptUrl) throw new Error('Missing Apps Script URL: use --url or APPS_SCRIPT_URL');
  if (!token) throw new Error('Missing token: use --token or APPS_SCRIPT_TOKEN');

  const store = readStore();
  const record = getRecord(store, recordKey);
  if (!record) throw new Error(`Record not found: ${recordKey}`);

  const payload = buildAppendMainPayload(record, token);

  try {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    if (!response.ok || !json.ok) {
      throw new Error(JSON.stringify(json));
    }

    const rowNumber = json.rowNumber || '';
    const updated = upsertRecord({
      recordKey,
      action: 'sheet_sync_success',
      actor,
      patch: {
        recordStatus: 'sheet_written',
        sheetStatus: '已寫入',
        sheet: {
          rowNumber,
          lastError: '',
          lastWriteAt: nowIso()
        }
      }
    });

    print({ ok: true, payload, response: json, record: updated });
  } catch (err) {
    const updated = upsertRecord({
      recordKey,
      action: 'sheet_sync_failed',
      actor,
      patch: {
        recordStatus: 'sheet_failed',
        sheetStatus: '寫入失敗',
        sheet: {
          lastError: String(err && err.message ? err.message : err),
          lastWriteAt: nowIso()
        }
      }
    });

    print({ ok: false, error: String(err && err.message ? err.message : err), record: updated });
    process.exit(1);
  }
}

main().catch(err => {
  console.error(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }, null, 2));
  process.exit(1);
});
