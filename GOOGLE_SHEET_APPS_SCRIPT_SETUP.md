# Google Sheet Apps Script Setup

## 用途
收到確認後，把支票記錄新增到 Google Sheet，並支援 V1 圖片欄位背景回填。

## 你要做的事

### 1. 打開你的 Google Sheet
已確認可讀連結：
https://docs.google.com/spreadsheets/d/13NdEMAAljcQcLw3tBk0kgNFWx0Zf2ZuTDpKHbAcdBAI/edit?usp=sharing

### 2. 開 Apps Script
在 Google Sheet 內：
- 擴充功能
- Apps Script

### 3. 建立腳本
把 `google-apps-script-cheque-log.gs` 內容整份貼進去。

> 此版本已加入中文亂碼修正邏輯，並支援 V1 圖片欄位策略：主資料先寫入，圖片日後背景回填。

### 4. 修改設定
在腳本最上方修改：
- `SHEET_NAME`：改成你實際工作表名稱
- `SECRET_TOKEN`：改成一串你自己定的長字串

例如：
```js
const SHEET_NAME = '記錄';
const SECRET_TOKEN = 'wingwah-2026-cheque-bot-secret';
```

### 5. 初始化表頭（只做一次）
在 Apps Script 介面執行：
- `setupHeader`

它會建立以下表頭：
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

### 6. 部署成 Web App
- 右上角：部署
- 新增部署作業
- 類型選：Web app
- Execute as：Me
- Who has access：Anyone with the link

部署後會得到一條 Web App URL。

## 之後如何寫入
OpenClaw / 後續流程只要 POST JSON 到該 URL。

## action 1：appendMain
用於主資料快速寫入。

範例 payload：
```json
{
  "token": "wingwah-2026-cheque-bot-secret",
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

## action 2：updateImage
用於圖片 upload 成功後，回填圖片欄位。

範例 payload：
```json
{
  "token": "wingwah-2026-cheque-bot-secret",
  "action": "updateImage",
  "recordKey": "3EB05AB1C8A99887B746E6",
  "imageLink": "https://drive.google.com/file/d/FILE_ID/view?usp=sharing",
  "imagePreview": "=IMAGE(\"https://drive.google.com/uc?export=view&id=FILE_ID\")",
  "imageStatus": "已上傳"
}
```

## 成功回應
```json
{
  "ok": true
}
```

## 注意
- `SECRET_TOKEN` 不要貼進群組
- 如果日後換表，只要改 `SHEET_NAME`
- 如果部署後改過程式，記得重新部署新版本
- `記錄鍵值` 建議使用 inbound `message_id` 或其他唯一值
- V1 階段即使圖片尚未 upload，只要主資料已寫入成功，群組仍可回覆 `已成功儲存`
- Google Drive folder id、憑證、分享權限屬於環境設定，不應硬編碼進 skill