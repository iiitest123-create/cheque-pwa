import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { WORKSPACE_ROOT } from './lib/ledger-store.mjs';

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

async function runNodeScript(scriptRelativePath, scriptArgs = []) {
  const scriptPath = path.join(WORKSPACE_ROOT, scriptRelativePath);
  const { stdout, stderr } = await execFileAsync('node', [scriptPath, ...scriptArgs], {
    cwd: WORKSPACE_ROOT,
    env: process.env,
    maxBuffer: 1024 * 1024 * 10
  });

  if (stderr && stderr.trim()) {
    // tolerate noisy stderr as long as stdout is valid JSON
  }

  return JSON.parse(stdout);
}

async function main() {
  const args = parseArgs(process.argv);
  const recordKey = required(args, 'record-key');
  const imageMode = args['image-mode'] || 'local';
  const actor = args.actor || 'process-record';
  const steps = [];

  if (!args['skip-sheet']) {
    const sheetResult = await runNodeScript('cheque-system/scripts/cheque-sheet-sync.mjs', [
      '--record-key', recordKey,
      '--actor', actor
    ]);
    steps.push({ step: 'sheet-sync', ok: sheetResult.ok, result: sheetResult });
    if (!sheetResult.ok) {
      console.log(JSON.stringify({ ok: false, recordKey, steps }, null, 2));
      process.exit(1);
    }
  }

  if (!args['skip-image']) {
    const imageResult = await runNodeScript('cheque-system/scripts/cheque-image-sync.mjs', [
      '--record-key', recordKey,
      '--mode', imageMode,
      '--actor', actor
    ]);
    steps.push({ step: 'image-sync', ok: imageResult.ok, result: imageResult });
    if (!imageResult.ok) {
      console.log(JSON.stringify({ ok: false, recordKey, steps }, null, 2));
      process.exit(1);
    }
  }

  console.log(JSON.stringify({ ok: true, recordKey, actor, imageMode, steps }, null, 2));
}

main().catch(err => {
  console.error(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }, null, 2));
  process.exit(1);
});
