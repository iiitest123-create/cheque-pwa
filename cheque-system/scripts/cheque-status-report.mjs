import { readStore } from './lib/ledger-store.mjs';

function pick(records, status, limit = 5) {
  return records
    .filter(r => r.recordStatus === status || r.sheetStatus === status || r.imageStatus === status)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, limit)
    .map(r => ({
      recordKey: r.recordKey,
      storeCode: r.fields?.storeCode || '',
      chequeType: r.fields?.chequeType || '',
      invoiceNo: r.fields?.invoiceNo || '',
      recordStatus: r.recordStatus,
      sheetStatus: r.sheetStatus,
      imageStatus: r.imageStatus,
      updatedAt: r.updatedAt
    }));
}

const store = readStore();
const records = Object.values(store.records || {});

const summary = {
  total: records.length,
  pendingConfirmation: records.filter(r => r.recordStatus === 'pending_confirmation').length,
  confirmed: records.filter(r => r.recordStatus === 'confirmed').length,
  sheetWritten: records.filter(r => r.recordStatus === 'sheet_written').length,
  sheetFailed: records.filter(r => r.recordStatus === 'sheet_failed').length,
  imagePending: records.filter(r => r.imageStatus === '待上傳').length,
  imageCompressed: records.filter(r => r.imageStatus === '已壓縮').length,
  imageUploaded: records.filter(r => r.imageStatus === '已上傳').length,
  imageFailed: records.filter(r => r.imageStatus === '上傳失敗').length
};

console.log(JSON.stringify({
  ok: true,
  summary,
  latestPendingConfirmation: pick(records, 'pending_confirmation'),
  latestConfirmed: pick(records, 'confirmed'),
  latestSheetFailed: pick(records, 'sheet_failed'),
  latestImageFailed: pick(records, '上傳失敗')
}, null, 2));
