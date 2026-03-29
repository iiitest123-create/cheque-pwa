const SHEET_NAME = 'Sheet1';
const SECRET_TOKEN = 'wingwah-2026-cheque-bot-secret';

const HEADERS = [
  '門市編號',
  '支票類別',
  '輸入日期',
  '支票付款日期',
  '支票號碼',
  '支票金額',
  '收款公司名',
  'Invoice No.',
  '備註',
  '圖片連結',
  '圖片預覽',
  '圖片狀態',
  '記錄鍵值'
];

const REQUIRED_MAIN_FIELDS = [
  'storeCode',
  'chequeType',
  'inputDate',
  'chequePaymentDate',
  'chequeNumber',
  'chequeAmount',
  'payeeName',
  'invoiceNo',
  'recordKey'
];

function doGet(e) {
  try {
    const token = e && e.parameter && e.parameter.token ? e.parameter.token : '';
    if (token !== SECRET_TOKEN) {
      return jsonOutput({ ok: false, error: 'Unauthorized' });
    }
    const action = e.parameter.action || 'getAll';
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return jsonOutput({ ok: false, error: `Sheet not found: ${SHEET_NAME}` });
    if (action === 'getAll') {
      return getAllRecords(sheet);
    }
    return jsonOutput({ ok: false, error: `Unsupported GET action: ${action}` });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput({ ok: false, error: 'Missing POST body' });
    }

    const data = normalizePayload(JSON.parse(e.postData.contents));

    if (data.token !== SECRET_TOKEN) {
      return jsonOutput({ ok: false, error: 'Unauthorized' });
    }

    const action = String(data.action || 'appendMain');
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonOutput({ ok: false, error: `Sheet not found: ${SHEET_NAME}` });
    }

    if (action === 'appendMain') {
      return appendMainRecord(sheet, data);
    }

    if (action === 'updateImage') {
      return updateImageFields(sheet, data);
    }

    return jsonOutput({ ok: false, error: `Unsupported action: ${action}` });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function getAllRecords(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return jsonOutput({ ok: true, action: 'getAll', records: [], total: 0 });
  }
  const lastCol = HEADERS.length;
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const records = values.map(function(row) {
    const obj = {};
    HEADERS.forEach(function(h, i) { obj[h] = row[i] ?? ''; });
    return obj;
  }).filter(function(r) {
    return String(r['記錄鍵值'] || '').trim() !== '';
  });
  return jsonOutput({ ok: true, action: 'getAll', records: records, total: records.length });
}

function appendMainRecord(sheet, data) {
  const missing = REQUIRED_MAIN_FIELDS.filter(k => !String(data[k] ?? '').trim());
  if (missing.length > 0) {
    return jsonOutput({ ok: false, error: 'Missing required fields', fields: missing });
  }

  const row = [
    data.storeCode,
    data.chequeType,
    data.inputDate,
    data.chequePaymentDate,
    data.chequeNumber,
    data.chequeAmount,
    data.payeeName,
    data.invoiceNo,
    data.remarks || '-',
    data.imageLink || '',
    data.imagePreview || '',
    data.imageStatus || '待上傳',
    data.recordKey
  ];

  sheet.appendRow(row);
  const rowNumber = sheet.getLastRow();
  return jsonOutput({ ok: true, action: 'appendMain', rowNumber, row });
}

function updateImageFields(sheet, data) {
  const recordKey = String(data.recordKey || '').trim();
  if (!recordKey) {
    return jsonOutput({ ok: false, error: 'Missing required fields', fields: ['recordKey'] });
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2) {
    return jsonOutput({ ok: false, error: 'No data rows found' });
  }

  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  const recordKeyColumnIndex = HEADERS.indexOf('記錄鍵值');
  const imageLinkColumnIndex = HEADERS.indexOf('圖片連結');
  const imagePreviewColumnIndex = HEADERS.indexOf('圖片預覽');
  const imageStatusColumnIndex = HEADERS.indexOf('圖片狀態');

  const rowOffset = values.findIndex(row => String(row[recordKeyColumnIndex] || '').trim() === recordKey);
  if (rowOffset === -1) {
    return jsonOutput({ ok: false, error: `Record not found for recordKey: ${recordKey}` });
  }

  const sheetRow = rowOffset + 2;

  if ('imageLink' in data) {
    sheet.getRange(sheetRow, imageLinkColumnIndex + 1).setValue(data.imageLink || '');
  }

  if ('imagePreview' in data) {
    sheet.getRange(sheetRow, imagePreviewColumnIndex + 1).setValue(data.imagePreview || '');
  }

  if ('imageStatus' in data) {
    sheet.getRange(sheetRow, imageStatusColumnIndex + 1).setValue(data.imageStatus || '');
  }

  return jsonOutput({ ok: true, action: 'updateImage', rowNumber: sheetRow, recordKey });
}

function normalizePayload(obj) {
  const out = {};
  Object.keys(obj || {}).forEach(function (key) {
    const value = obj[key];
    out[key] = typeof value === 'string' ? normalizeUtf8Text(value) : value;
  });
  return out;
}

function normalizeUtf8Text(value) {
  if (value == null) return value;
  const text = String(value);

  if (/[\u4e00-\u9fff]/.test(text)) {
    return text;
  }

  try {
    const repaired = decodeURIComponent(escape(text));
    if (/[\u4e00-\u9fff]/.test(repaired)) {
      return repaired;
    }
    return repaired;
  } catch (err) {
    return text;
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupHeader() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet not found: ${SHEET_NAME}`);

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
}
