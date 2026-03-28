# 支票流程 PWA 模板

## 位置
- `cheque-pwa-template/index.html`

## 模板內容
這是一個可試看的 PWA 原型，包含三個角色畫面：
- 店舖版
- 管理員版
- 會計版

## 目前用途
- 讓你感受畫面與流程方向
- 目前已可讀取本地 `cheque-system/data/records.json` 真記錄做畫面展示
- 仍未正式接上提交寫入、登入權限、真正會計操作
- 屬於「真資料 preview」，未屬完整成品

## 如何試看
### 方法 A：直接打開
直接用瀏覽器打開：
- `cheque-pwa-template/index.html`

### 方法 B：本地 HTTP 預覽（較似真正 PWA）
在 workspace 執行：
```powershell
cd C:\Users\victor\.openclaw\workspace\cheque-pwa-template
node .\preview-server.mjs
```
然後開：
- `http://127.0.0.1:4173`

## 你會見到什麼
### 店舖版
- 揀門市
- 揀支票類別
- 拍照 / 相簿
- OCR 預覽
- 確認寫入

### 管理員版
- 待確認統計
- 已寫入記錄
- 查看單據列表

### 會計版
- 待過數提醒
- 已到期未過數提示
- 匯入銀行流水 / 批次對帳概念畫面

## 下一步可做
如果你覺得方向啱，下一步就可以把：
- 現有 ledger
- Google Sheet 寫入
- 圖片記錄
- 銀行對帳欄位

逐步接入這個 PWA 介面。