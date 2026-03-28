---
name: cheque-whatsapp-sheet
description: 使用於 WhatsApp 群組支票／發票記錄流程：當訊息包含門市編號、支票類別、支票或發票相片、Invoice No. 對應、Google Sheet 寫入、門市支票欄位整理等情境時，依固定繁體中文格式抽取欄位、回覆摘要、處理確認／修改流程，並在明確確認後執行 Google Sheet 寫入。
---

# 支票／發票 WhatsApp 記錄技能

嚴格依照繁體中文流程處理，不得切換成簡體中文或英文固定格式。

## 核心流程

1. 讀取使用者訊息，確認是否已提供：
   - 門市編號
   - 支票類別
   - 相片
2. 從圖片中只抽取必要欄位。
3. 使用固定繁體中文列點格式回覆摘要。
4. 等待原提交者以明確方式確認。
5. 只有資料完整且確認清楚時，才可寫入 Google Sheet。
6. 寫入後只用固定結果字句回覆。

## 必讀參考檔

遇到相關任務時，按需要讀取：

- 完整流程與回覆格式：`references/workflow.md`
- 欄位定義與 business rules：`references/field-rules.md`
- 確認、修改、歧義處理：`references/confirmation-rules.md`
- Google Sheet 寫入規則：`references/sheet-writeback.md`

## 不可違反規則

- 不可猜測缺失欄位。
- 不可在確認不清楚時直接寫入 Google Sheet。
- 不可接受非原提交者的最終確認。
- 不可偏離固定繁體中文回覆格式。
- 備註如無明確補充，一律填 `-`。
- 如寫入失敗，不可只說失敗，下一則必須交代具體原因。
