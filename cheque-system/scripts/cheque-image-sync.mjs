import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { WORKSPACE_ROOT, getRecord, nowIso, readStore, upsertRecord } from './lib/ledger-store.mjs';

const execFileAsync = promisify(execFile);

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

async function runCompression({ inputPath, outputPath }) {
  const scriptPath = path.join(WORKSPACE_ROOT, 'compress-cheque-image.ps1');
  const { stdout, stderr } = await execFileAsync('powershell', [
    '-ExecutionPolicy', 'Bypass',
    '-File', scriptPath,
    '-InputPath', inputPath,
    '-OutputPath', outputPath,
    '-MaxLongEdge', '1600',
    '-TargetKB', '200',
    '-MaxKB', '300',
    '-InitialQuality', '70',
    '-MinQuality', '45'
  ], { cwd: WORKSPACE_ROOT, maxBuffer: 1024 * 1024 * 10 });

  if (stderr && stderr.trim()) {
    // keep going; some PowerShell setups are noisy
  }

  return JSON.parse(stdout);
}

async function runDriveUpload({ inputPath, recordKey }) {
  const scriptPath = path.join(WORKSPACE_ROOT, 'drive-upload-worker.mjs');
  const { stdout } = await execFileAsync('node', [scriptPath, '--input', inputPath, '--record-key', recordKey], {
    cwd: WORKSPACE_ROOT,
    maxBuffer: 1024 * 1024 * 10,
    env: process.env
  });
  return JSON.parse(stdout);
}

async function main() {
  const args = parseArgs(process.argv);
  const recordKey = required(args, 'record-key');
  const mode = args.mode || 'local';
  const actor = args.actor || 'image-sync';

  const store = readStore();
  const record = getRecord(store, recordKey);
  if (!record) throw new Error(`Record not found: ${recordKey}`);

  const inputPath = args.input || record.images.inboundMediaPath;
  if (!inputPath) throw new Error(`Record ${recordKey} has no inboundMediaPath`);

  const outputPath = path.join(WORKSPACE_ROOT, 'tmp', 'compressed', `${recordKey}.jpg`);

  try {
    const compression = await runCompression({ inputPath, outputPath });

    upsertRecord({
      recordKey,
      action: 'image_compressed',
      actor,
      patch: {
        imageStatus: mode === 'local' ? '已壓縮' : '待上傳',
        images: {
          compressedImagePath: compression.outputPath,
          lastError: ''
        }
      }
    });

    if (mode === 'local') {
      const updated = upsertRecord({
        recordKey,
        action: 'image_local_ready',
        actor,
        patch: {
          imageStatus: '已壓縮',
          images: {
            compressedImagePath: compression.outputPath,
            lastError: ''
          }
        }
      });

      print({ ok: true, mode, compression, record: updated });
      return;
    }

    const uploaded = await runDriveUpload({ inputPath: compression.outputPath, recordKey });

    const updated = upsertRecord({
      recordKey,
      action: 'image_uploaded',
      actor,
      patch: {
        imageStatus: '已上傳',
        recordStatus: record.recordStatus === 'sheet_written' ? 'closed' : record.recordStatus,
        images: {
          compressedImagePath: compression.outputPath,
          imageLink: uploaded.imageLink || '',
          imagePreview: uploaded.imagePreview || '',
          lastError: ''
        }
      }
    });

    print({ ok: true, mode, compression, uploaded, record: updated });
  } catch (err) {
    const updated = upsertRecord({
      recordKey,
      action: 'image_sync_failed',
      actor,
      patch: {
        imageStatus: '上傳失敗',
        images: {
          lastError: String(err && err.message ? err.message : err)
        }
      }
    });

    print({ ok: false, mode, error: String(err && err.message ? err.message : err), record: updated });
    process.exit(1);
  }
}

main().catch(err => {
  console.error(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }, null, 2));
  process.exit(1);
});
