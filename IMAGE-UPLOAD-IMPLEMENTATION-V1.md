# IMAGE-UPLOAD-IMPLEMENTATION-V1.md

## 目標
以 V1 方式為 WhatsApp 支票／發票流程加入圖片處理：
- 主資料先快速寫入 Google Sheet
- 圖片在背景壓縮並 upload
- 成功後回填 `圖片連結`、`圖片預覽`、`圖片狀態`

## 設計原則
- 不阻塞群組主流程
- 不將圖片 base64 寫入 Google Sheet
- 不把敏感設定硬編碼進 skill
- 優先保留可讀性，其次才是檔案大小

## Google Sheet 新欄位
請確認工作表表頭已升級為以下 13 欄：
1. 門市編號
2. 支票類別
3. 輸入日期
4. 支票付款日期
5. 支票號碼
6. 支票金額
7. 收款公司名
8. Invoice No.
9. 備註
10. 圖片連結
11. 圖片預覽
12. 圖片狀態
13. 記錄鍵值

## Apps Script 端
本地 `google-apps-script-cheque-log.gs` 已支援：
- `action: appendMain`
- `action: updateImage`

### appendMain payload 範例
```json
{
  "token": "YOUR_SECRET_TOKEN",
  "action": "appendMain",
  "storeCode": "PU003",
  "chequeType": "鋪頭支票",
  "inputDate": "2026-03-28",
  "chequePaymentDate": "2026-03-24",
  "chequeNumber": "067175",
  "chequeAmount": "715.30",
  "payeeName": "有盛行辦館有限公司",
  "invoiceNo": "526021362",
  "remarks": "-",
  "imageStatus": "待上傳",
  "recordKey": "3EB05AB1C8A99887B746E6"
}
```

### updateImage payload 範例
```json
{
  "token": "YOUR_SECRET_TOKEN",
  "action": "updateImage",
  "recordKey": "3EB05AB1C8A99887B746E6",
  "imageLink": "https://drive.google.com/file/d/FILE_ID/view?usp=sharing",
  "imagePreview": "=IMAGE(\"https://drive.google.com/uc?export=view&id=FILE_ID\")",
  "imageStatus": "已上傳"
}
```

## 圖片 Worker（本地）
本地 worker 的責任：
1. 接收一個 inbound 圖檔路徑
2. 產出壓縮版 JPG
3. （可選）上傳到 Google Drive
4. 成功後 POST `updateImage` 到 Apps Script

## 壓縮規格
- 格式：JPG
- 長邊上限：1600px
- 品質：70 起步
- 目標：約 200KB
- 可接受上限：300KB

## V1 上線順序
1. 將新版 `google-apps-script-cheque-log.gs` 貼到 Google Apps Script
2. 執行 `setupHeader` 更新表頭
3. 重新部署 Web App
4. 用 `appendMain` 測試主資料寫入
5. 用本地 worker 測試圖片壓縮
6. 日後再補 Drive upload 與 `updateImage` 自動回填

## V1 現階段狀態
- 已完成：workflow / skill / Apps Script payload 設計
- 已完成：本地圖片壓縮 worker 草稿
- 待你補：線上 Apps Script 重新部署
- 待下一步：Google Drive upload 實作與憑證接駁
