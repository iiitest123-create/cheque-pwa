# Google Sheet Apps Script Setup

## 用途
收到確認後，把支票記錄新增到 Google Sheet。

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

> 此版本已加入中文亂碼修正邏輯，適合處理 WhatsApp / OpenClaw 寫入 Google Sheet 時常見的 UTF-8 亂碼情況。

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

### 6. 部署成 Web App
- 右上角：部署
- 新增部署作業
- 類型選：Web app
- Execute as：Me
- Who has access：Anyone with the link

部署後會得到一條 Web App URL。

## 之後如何寫入
OpenClaw / 後續流程只要 POST JSON 到該 URL。

範例 payload：
```json
{
  "token": "wingwah-2026-cheque-bot-secret",
  "storeCode": "PU003",
  "chequeType": "鋪頭支票",
  "inputDate": "2026-03-27",
  "chequePaymentDate": "2026-03-24",
  "chequeNumber": "067175",
  "chequeAmount": "715.30",
  "payeeName": "有盛行辦館有限公司",
  "invoiceNo": "526021362",
  "remarks": "-"
}
```

## 成功回應
```json
{
  "ok": true,
  "row": [ ... ]
}
```

## 注意
- `SECRET_TOKEN` 不要貼進群組
- 如果日後換表，只要改 `SHEET_NAME`
- 如果部署後改過程式，記得重新部署新版本
