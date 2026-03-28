# CHEQUE-READY-TO-TEST.md

## 目前已可直接試用的部分
### 1. 自動 intake
已啟用 workspace hook：`cheque-auto-intake`

作用：
- 當 WhatsApp 訊息包含 `門市編號 + 支票類別 + 圖片` 並進入 `message:preprocessed`
- 系統會自動在本地 ledger 建立一筆 `pending_confirmation` 記錄

### 2. 本地 ledger / event log
資料位置：
- `cheque-system/data/records.json`
- `cheque-system/data/events.jsonl`

### 3. 一鍵處理器
已可用 `cheque-process-record.mjs` 處理一筆已確認記錄：
- 寫 Google Sheet
- 壓縮圖片（local 模式）
- 日後可切換 drive 模式

## 建議你第一次實戰測試
### Step A：WhatsApp 發一條新測試訊息
請在實際流程對應的 WhatsApp 群組或你現在可測的 WhatsApp 對話，發：

```text
PU003 鋪頭支票
```

並附上一張新圖片。

### Step B：等 5-10 秒
讓 OpenClaw 走完 `message:preprocessed` 與 hook。

### Step C：檢查 ledger 狀態
在 workspace 執行：

```powershell
node .\cheque-system\scripts\cheque-status-report.mjs
```

如果 intake 成功，應見到：
- `pendingConfirmation` 增加
- `latestPendingConfirmation` 內出現最新 `recordKey`

### Step D：查看該筆記錄
```powershell
node .\cheque-system\scripts\cheque-ledger.mjs show --record-key <message_id>
```

### Step E：當你在 WhatsApp 完成確認後，可手動做一鍵處理
```powershell
$env:APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbznlUl54sCTqCipLT_wWeotNlZ1RnwU7OGKwmcUkSiAwjIKXTUnzHwqMTnORhMhT50c4g/exec'
$env:APPS_SCRIPT_TOKEN = 'wingwah-2026-cheque-bot-secret'
node .\cheque-system\scripts\cheque-process-record.mjs --record-key <message_id> --image-mode local --actor "system"
```

## 目前已打通 / 未打通
### 已打通
- WhatsApp auto-intake hook 已啟用
- ledger / event log 已可用
- Apps Script `appendMain` 已實測成功
- 圖片壓縮已實測成功
- 一鍵 orchestrator 已實測成功（local image mode）

### 未完全打通
- WhatsApp 確認訊息自動推進 `confirmed`
- 實際群組對話與 ledger 的全自動狀態流轉
- 圖片雲端 upload（Drive / Synology）正式上線

## 結論
**你而家已經可以開始做第一輪真實測試：測 auto-intake + ledger + sheet/local-image pipeline。**
