---
name: admin-inbox-check
description: Scan admin@trychookis.com unread for activity from Bryn, Aaron, or direct senders. Act only if there's something actionable. Invoke as /admin-inbox-check or schedule via cron. Silent return on a clean inbox is the expected happy path.
---

# Admin inbox check

Scan `admin@trychookis.com` unread, route by sender and intent, act only when needed. Most firings find nothing — that's fine, return silently.

## Scope

- **Inbox:** `admin@trychookis.com` only. Use `GOOGLE_TOKENS_FILE=/workspace/extra/workspace/.env.google.admin.tokens` on all gmail.sh calls.
- **Lookback window:** unread AND received in the last 72 hours. Anything older than 72h that's still unread → summarise + escalate to Jack in main; don't act unilaterally.
- **Out of scope:** hello@ (that's `/cs-triage`), jackj@ (that's Jack's personal). Never touch sent/archived.

## Workflow

### 1. Pull + filter

```bash
bash /workspace/extra/workspace/tools/gmail-unread-fast.sh admin@
```

Narrow to senders we care about. Three buckets:

- **Rep senders** — `from:(bryn@trychookis.com OR aaron@trychookis.com)`
- **Wholesale leads** — form submissions (Shopify contact form, stockist enquiry emails)
- **Everything else** — other senders hitting admin@. Usually noise, occasionally real.

Anything matching none of these three and sitting in inbox: mark for Jack's review (don't auto-action).

### 2. Classify + route

For each message after filtering, classify:

| Signal | Route |
|---|---|
| Bryn/Aaron forwarding a new wholesale customer email or intake form | Dispatch to `wholesale` subagent with `/wholesale-intake-check` context. Stage into Neon via the backend worker. Do NOT contact the customer. |
| Bryn/Aaron replying on an existing wholesale thread | Read the thread for context. If the reply unblocks a `needs_review` deal, advance the pipeline via `/wholesale-pipeline-tick`. Otherwise acknowledge to Jack. |
| Bryn/Aaron asking a direct question to Jack | Draft an admin@ reply via the `eve` subagent using the wholesale-blocked approval pattern: draft, post Telegram preview to Jack, exit. |
| Shopify contact form submission tagged wholesale | Forward to `bryn@, aaron@` from admin@ using `token-issue.sh` + `gmail-send.sh` (raw Gmail send pattern in `sops/shopify-form-classifier.md`). Mark thread handled. |
| Stockist enquiry from a shop/café/pub | Same as above — forward to Bryn + Aaron. Stockist leads go to Bryn/Aaron workflow, never auto-replied. |
| UGC / influencer / press | Forward to `grace@trychookis.com`, label UGC, archive. No reply. |
| Customer directly emailing admin@ (rare) | Not your scope. Flag to Jack, don't auto-forward; customers shouldn't have admin@ address. |

### 3. Report

After processing, output structured status:

```
admin-inbox-check:
  scanned: <n> unread in last 72h
  rep-activity: <n> from bryn | <n> from aaron | <n> forwarded leads
  routed:
    - wholesale intake (new): <n>
    - wholesale thread update: <n>  
    - form forwarded to reps: <n>
    - UGC forwarded to grace: <n>
  pending Jack review: <n>
    - <thread_id> | <subject> | <reason>
  actions taken: <list with thread_ids>
```

If `scanned == 0` OR (`rep-activity == 0` AND `pending Jack review == 0`), return the literal string `admin-inbox-check: idle` and nothing else. Main will suppress the Telegram message.

## Approval gates

- **Forwarding leads to Bryn/Aaron** — autonomous. No Jack approval needed. This is internal rep dispatch, not customer-facing.
- **Drafting a rep-facing admin@ reply** — draft only, queue for Jack approval via `eve`'s flow.
- **Advancing a wholesale deal past the `needs_review` gate** — always Jack's call. Never auto-resolve `needs_review` rows without explicit approval in the main thread.

## Never

- Reply to a customer from admin@. Customer replies come from `hello@` via `eve`. Admin@ talks only to reps and internal tools.
- Duplicate a Gmail thread. Always reply in-thread with `In-Reply-To` + `References` headers.
- Skip the vault read for wholesale context — always consult `/workspace/extra/workspace/2-Operations/Wholesale/orders.md` + `2-Contacts/Wholesale/` before acting on a deal.
- Write to Neon or the Sheet directly from this skill. Use the wholesale backend workers at `/workspace/extra/workspace/.worktrees/wholesale-ai-backend/tools/wholesale_ops/` so the DB stays the canonical source and the Sheet stays in sync.

## Idempotency

Every action takes a thread as input and uses its ID as the idempotency key. Running this skill twice in a row with the same inbox state must produce the same result with no duplicate sends, no duplicate DB rows, no duplicate Sheet rows. The wholesale backend workers handle idempotency on their side; trust their dedupe.

## Env expected

Before doing any real work, verify by reading (not echoing):
- `/workspace/extra/workspace/.env.google.admin.tokens` exists
- `/workspace/extra/workspace/.worktrees/wholesale-ai-backend/.env.wholesale_ops.local` exists AND has a non-empty `WHOLESALE_DATABASE_URL`

If either is missing, do NOT run — report the missing env to Jack and stop.
