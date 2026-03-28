# DRIVE-UPLOAD-WORKER-SETUP.md

## 用途
本地 worker 負責：
1. 讀取已壓縮的 JPG
2. upload 至 Google Drive 指定資料夾
3. 設定分享權限
4. 呼叫 Apps Script `updateImage`

## 檔案
- `drive-upload-worker.mjs`
- `compress-cheque-image.ps1`
- `TEST-IMAGE-UPLOAD-V1.ps1`

## 需要準備
### 1. Google Cloud service account JSON
你需要一個可用於 Google Drive API 的 service account JSON。

建議做法：
- 在 Google Cloud Project 啟用 **Google Drive API**
- 建立 service account
- 下載 JSON key
- 把目標 Google Drive 資料夾分享給該 service account email（Editor）

### 2. Google Drive folder id
建立一個專用資料夾，例如：
- `Cheque WhatsApp Uploads`

然後取出 folder id。

### 3. 設定環境變數
Windows PowerShell 範例：

```powershell
$env:GOOGLE_SERVICE_ACCOUNT_JSON = 'C:\secure\gdrive-service-account.json'
$env:GOOGLE_DRIVE_FOLDER_ID = 'YOUR_FOLDER_ID'
$env:APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznlUl54sCTqCipLT_wWeotNlZ1RnwU7OGKwmcUkSiAwjIKXTUnzHwqMTnORhMhT50c4g/exec'
$env:APPS_SCRIPT_TOKEN = 'wingwah-2026-cheque-bot-secret'
```

## 測試流程
### A. 先壓縮圖片
```powershell
powershell -ExecutionPolicy Bypass -File .\TEST-IMAGE-UPLOAD-V1.ps1 -InputPath 'C:\Users\victor\.openclaw\media\inbound\4ba659d6-32e8-488d-adb0-b150be440ac9.jpg'
```

### B. dry run
```powershell
node .\drive-upload-worker.mjs --input .\tmp\compressed\4ba659d6-32e8-488d-adb0-b150be440ac9.jpg --record-key IMG-V1-TEST-20260328-001 --dry-run
```

### C. 真 upload
```powershell
node .\drive-upload-worker.mjs --input .\tmp\compressed\4ba659d6-32e8-488d-adb0-b150be440ac9.jpg --record-key IMG-V1-TEST-20260328-001
```

## 成功結果
成功後會：
- 在 Drive 建立檔案
- 將檔案設為任何知道連結者可查看
- 將 `圖片連結`、`圖片預覽`、`圖片狀態=已上傳` 回填到 Google Sheet

## 注意
- service account JSON 不要放進 repo
- 建議放在 workspace 外的安全位置
- 若不想公開任何知道連結者可查看，可改權限策略；但 `=IMAGE()` 預覽可能受影響
- V1 先以可用、快速翻查為主
