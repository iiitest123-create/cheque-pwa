# CHEQUE-SYSTEM-V2.md

## 目標
把現有 WhatsApp 支票／發票流程升級成一套更完整、可追查、易維護的記錄系統。

此版本不再把 Google Sheet 當唯一真相來源，而改為：
- **本地記錄庫（system of record）** 保存完整記錄與事件歷史
- **Google Sheet** 作為人手查看、對數、匯出用的 projection / view
- **圖片存儲** 可按環境接駁 Google Drive 或 Synology NAS

## V2 核心原則
1. 前線 WhatsApp 使用習慣盡量不變。
2. 每張單都要有唯一 `recordKey`。
3. 每次狀態改變都要留下 event log。
4. 圖片、抽取欄位、確認者、寫表結果都要可追查。
5. 圖片 upload 與主資料寫表分開，不可拖慢主流程。
6. Google Sheet 只是輸出層，不是唯一資料庫。

## 系統分層

### 1. Inbound Layer
來源：WhatsApp 群組訊息

記錄內容：
- message_id
- sender / sender_id
- session 關聯
- inbound media path
- 原始圖片路徑
- 收到時間

### 2. Evidence Layer
保存：
- 原始圖片路徑
- 壓縮後圖片路徑
- OCR / 抽取結果
- 相關附件 mapping

### 3. Record Layer
每筆正式記錄至少包含：
- recordKey
- 門市編號
- 支票類別
- 輸入日期
- 支票付款日期
- 支票號碼
- 支票金額
- 收款公司名
- Invoice No.
- 備註
- messageId
- sender
- inboundMediaPath
- 圖片狀態
- 圖片連結
- 圖片預覽
- 確認者
- 確認時間
- 主資料寫表狀態
- 寫表錯誤原因

### 4. Projection Layer
Google Sheet 顯示：
- 核心欄位
- 圖片連結 / 預覽
- 圖片狀態
- 記錄鍵值

## 推薦狀態流轉
- `draft`
- `pending_confirmation`
- `confirmed`
- `sheet_written`
- `sheet_failed`
- `image_pending`
- `image_uploaded`
- `image_failed`
- `closed`

## 本地中台（現階段）
V2 先採用 **workspace 內 JSON store + JSONL event log**，避免引入額外依賴。

檔案：
- `cheque-system/data/records.json`
- `cheque-system/data/events.jsonl`

優點：
- 可立即落地
- 易備份
- 易 diff / audit
- 不需安裝 DB driver

日後如有需要，可平滑升級至 SQLite。

## CLI 工具（現階段）
使用 `cheque-system/scripts/cheque-ledger.mjs` 管理記錄。

支援：
- 建立 / 更新記錄
- 記錄 inbound metadata
- 記錄確認
- 記錄 Sheet 寫入結果
- 記錄圖片 upload 結果
- 匯出 Apps Script `appendMain` payload
- 查詢單筆記錄
- 列出記錄

## 推薦操作流程
1. 收到 WhatsApp 圖片與文字
2. 建立 `recordKey`
3. 用 ledger 記錄 intake / media metadata
4. 抽取欄位後更新 record
5. 等待原提交者確認
6. 確認後標記 `confirmed`
7. 匯出 `appendMain` payload 寫入 Google Sheet
8. 背景處理圖片 upload
9. 成功後回填圖片資訊並記錄 event

## 為什麼這樣更好
- 即使 Google Sheet 欄位改動，核心記錄仍然完整
- 即使圖片 upload 失敗，事件歷史仍保留
- 即使日後改用 NAS，也不影響主 record schema
- 出事時可追查：誰提交、誰確認、何時寫表、何時補圖

## 下一階段
1. 把 WhatsApp 實際流程正式串接 ledger
2. 把 `appendMain / updateImage` 呼叫包成統一 worker
3. 視情況接駁 Google Drive 或 Synology NAS
4. 如有需要，再加簡單 dashboard / search 工具
