const SHEET_NAME = 'Sheet1';
const SECRET_TOKEN = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput({ ok: false, error: 'Missing POST body' });
    }

    const data = normalizePayload(JSON.parse(e.postData.contents));

    if (data.token !== SECRET_TOKEN) {
      return jsonOutput({ ok: false, error: 'Unauthorized' });
    }

    const required = [
      'storeCode',
      'chequeType',
      'inputDate',
      'chequePaymentDate',
      'chequeNumber',
      'chequeAmount',
      'payeeName',
      'invoiceNo'
    ];

    const missing = required.filter(k => !String(data[k] ?? '').trim());
    if (missing.length > 0) {
      return jsonOutput({ ok: false, error: 'Missing required fields', fields: missing });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonOutput({ ok: false, error: `Sheet not found: ${SHEET_NAME}` });
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
      data.remarks || '-'
    ];

    sheet.appendRow(row);

    return jsonOutput({ ok: true, row });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
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

  // If the text already contains normal Chinese characters, keep it.
  if (/[\u4e00-\u9fff]/.test(text)) {
    return text;
  }

  // Try to repair UTF-8 text that was mis-decoded as Latin-1/Windows-1252.
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

  const headers = [
    '門市編號',
    '支票類別',
    '輸入日期',
    '支票付款日期',
    '支票號碼',
    '支票金額',
    '收款公司名',
    'Invoice No.',
    '備註'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
}
