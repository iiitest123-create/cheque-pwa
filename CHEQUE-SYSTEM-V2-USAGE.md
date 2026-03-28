# CHEQUE-SYSTEM-V2-USAGE.md

## 初始化
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs init
```

## 建立 / 更新一筆記錄
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs upsert `
  --record-key 3EB05AB1C8A99887B746E6 `
  --status pending_confirmation `
  --store-code PU003 `
  --cheque-type 鋪頭支票 `
  --input-date 2026-03-28 `
  --cheque-payment-date 2026-03-24 `
  --cheque-number 067175 `
  --cheque-amount 715.30 `
  --payee-name 有盛行辦館有限公司 `
  --invoice-no 526021362 `
  --remarks - `
  --message-id 3EB05AB1C8A99887B746E6 `
  --sender-id +85267012827 `
  --sender-label "Chun (+85267012827)" `
  --inbound-media-path "C:\Users\victor\.openclaw\media\inbound\4ba659d6-32e8-488d-adb0-b150be440ac9.jpg" `
  --original-submitter-id +85267012827 `
  --original-submitter-label "Chun (+85267012827)"
```

## 確認
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs confirm --record-key 3EB05AB1C8A99887B746E6 --actor "Chun (+85267012827)"
```

## 匯出寫入 Google Sheet payload
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs sheet-payload --record-key 3EB05AB1C8A99887B746E6 --token wingwah-2026-cheque-bot-secret
```

## 標記已寫入 Sheet
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs sheet-written --record-key 3EB05AB1C8A99887B746E6 --row-number 2
```

## 標記寫入失敗
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs sheet-failed --record-key 3EB05AB1C8A99887B746E6 --reason "Apps Script Unauthorized"
```

## 回填圖片
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs attach-image `
  --record-key 3EB05AB1C8A99887B746E6 `
  --compressed-image-path ".\tmp\compressed\4ba659d6-32e8-488d-adb0-b150be440ac9.jpg" `
  --image-link "https://example.com/image.jpg" `
  --image-preview "=IMAGE(\"https://example.com/image.jpg\")" `
  --image-status 已上傳
```

## 一條命令處理一筆已確認記錄
### 本地模式（先寫 Sheet，再壓圖到本機）
```powershell
$env:APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznlUl54sCTqCipLT_wWeotNlZ1RnwU7OGKwmcUkSiAwjIKXTUnzHwqMTnORhMhT50c4g/exec'
$env:APPS_SCRIPT_TOKEN = 'wingwah-2026-cheque-bot-secret'
node .\cheque-system\scripts\cheque-process-record.mjs --record-key 3EB05AB1C8A99887B746E6 --image-mode local --actor "Chun (+85267012827)"
```

### Drive 模式（寫 Sheet、壓圖、upload、回填圖片）
```powershell
$env:APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznlUl54sCTqCipLT_wWeotNlZ1RnwU7OGKwmcUkSiAwjIKXTUnzHwqMTnORhMhT50c4g/exec'
$env:APPS_SCRIPT_TOKEN = 'wingwah-2026-cheque-bot-secret'
$env:GOOGLE_SERVICE_ACCOUNT_JSON = 'C:\secure\gdrive-service-account.json'
$env:GOOGLE_DRIVE_FOLDER_ID = 'YOUR_FOLDER_ID'
node .\cheque-system\scripts\cheque-process-record.mjs --record-key 3EB05AB1C8A99887B746E6 --image-mode drive --actor "system"
```

## 只做寫 Sheet
```powershell
node .\cheque-system\scripts\cheque-sheet-sync.mjs --record-key 3EB05AB1C8A99887B746E6
```

## 只做圖片處理
### 本地模式
```powershell
node .\cheque-system\scripts\cheque-image-sync.mjs --record-key 3EB05AB1C8A99887B746E6 --mode local
```

### Drive 模式
```powershell
node .\cheque-system\scripts\cheque-image-sync.mjs --record-key 3EB05AB1C8A99887B746E6 --mode drive
```

## 查看單筆記錄
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs show --record-key 3EB05AB1C8A99887B746E6
```

## 列出記錄
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs list
```

## 列出某狀態記錄
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs list --status sheet_failed
```

## 狀態總覽
```powershell
node .\cheque-system\scripts\cheque-status-report.mjs
```
