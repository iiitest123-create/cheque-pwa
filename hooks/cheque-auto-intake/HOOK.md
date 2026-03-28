---
name: cheque-auto-intake
description: Auto-intake WhatsApp cheque/invoice messages into the local cheque ledger when inbound messages contain store code, cheque type, and media attachments.
homepage: https://docs.openclaw.ai/automation/hooks
metadata:
  { "openclaw": { "emoji": "🧾", "events": ["message:preprocessed"], "requires": { "bins": ["node"] } } }
---

# cheque-auto-intake

Auto-create or update cheque ledger records from inbound WhatsApp messages before the agent handles the business workflow.

## What it does
- Listens on `message:preprocessed`
- Filters for WhatsApp inbound messages with likely cheque workflow content
- Extracts store code, cheque type, media path, sender metadata, and message id
- Upserts a local record into `cheque-system/data/records.json`
- Appends an event into `cheque-system/data/events.jsonl`

## Notes
- Silent by default; does not send user-facing messages
- Uses `messageId` as preferred `recordKey`
- Safe to run repeatedly because updates are idempotent
