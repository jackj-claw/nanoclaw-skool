# User Context

## Who Jack is

- **Name:** Jack Jeffcoat
- **Role:** Founder, Chooki's Chicken Salt, e-commerce + wholesale, 4 flavours, trychookis.com
- **Location:** Central Coast, NSW, Australia
- **Timezone:** Australia/Sydney
- **Telegram:** chat_id `6764337706`, username `@thetrolleyman`

## The business

Chooki's Chicken Salt is a solo-founder-led chicken salt brand based on the Central Coast. Four flavours. Mixed e-commerce and wholesale revenue. Run out of a small warehouse, with family and a few reps keeping it moving.

- **Key people:**
  - **Grace**, partner. Sun/Wed/Thu house visits (40 min each way; voice-note window). Handles UGC inbox (`grace@trychookis.com`).
  - **Bryn + Aaron**, sales reps. Commission: 15% first order, 10% recurring on product only. Split 50/50 when both tagged. Jack takes $0 commission.
  - **The boys**, Jack's kids. Wake around 7am; that's when his day starts.

## North Star, South America, December 2026

Eight weeks holiday, end of 2026. Every feature, project, and automation gets one filter: *does this help Jack get to South America?* Target state by then: CS fully autonomous, revenue scaling, orders shipping, staff holding the line, Jack orchestrates via voice (Bridget app) + Telegram from wherever.

## How Jack works

- **Works in bursts.** Jumps between tasks. Needs claw to be the tracker, planner, and follow-up memory.
- **Telegram-first.** Primary interface. Voice notes and brain dumps flow in; actionable items and drafts come back.
- **Warehouse hours roughly 7am-8pm.** Fill days 2x/week (Tue + Thu) with all hands on deck. Other days: chase warehouse, Bryn + Aaron sell.
- **Long drives = voice-note time.** Sun/Wed/Thu to Grace's. Expect 30-40 minute dumps during those windows.
- **Prefers proper long-term systems.** Cron over n8n. Structured wholesale email over forms. Daily planning with claw. Compound the second brain, don't rebuild the wheel.

## Preferences

- **Tone:** blunt, realistic, brutal honesty. No glazing. Tell him the downside.
- **Length:** short. He'll ask if he wants more.
- **Voice:** only when he asks. Text by default.
- **Approvals:** Jack-only on Telegram. Buttons from anyone else are ignored.
- **Source of truth:** the Obsidian vault at `~/Desktop/workspace/`, the second brain. When the vault and any other file disagree, the vault wins.

## Hard NOs (inherited, unchanging)

claw does not, without explicit approval in conversation:
- Spend money or sign contracts
- Contact suppliers
- Publish or post on social
- Change Shopify live settings, launch ads, or issue refunds
- Speak as the brand publicly

## Health signal

Jack uses WHOOP for sleep/recovery/strain/HRV tracking. Vault path: `~/Desktop/workspace/1-Projects/WHOOP Health Tracking/`. Recovery under 34% = dial back the day, lead with health in any morning briefing. After 10pm non-urgent goes to sleep redirect.

## Channels (Chooki operations)

- **Telegram**, primary Jack ↔ claw channel (this file sits in the `main` group talking to that channel).
- **WhatsApp**, DISABLED. Do not re-enable without explicit approval from Jack (history: went rogue 2026-03-14, messaged clients).
- **Email:** `hello@trychookis.com` (CS, Eve's domain), `admin@trychookis.com` (admin, B2B, wholesale), `jackj@trychookis.com` (Jack personal business), `grace@trychookis.com` (UGC, forward to Grace).
- **Meta:** @chookischickensalt on Facebook + Instagram (Syd's domain).
- **Shopify admin:** trychookis.com store.
- **Xero:** invoicing. **Xero invoice must exist and be AUTHORISED before completing any Shopify draft.**

## External system credentials

Credentials live in `~/Desktop/workspace/` as dotenv files:
- `.env.google.tokens` → hello@
- `.env.google.admin.tokens` → admin@
- `.env.google.claw.tokens` → jackj@

OneCLI vault injection handles the rest. Containers never hold raw keys.

## Current state (as of 2026-04-21)

- **CS Phase 2 live since 2026-04-20.** Eve drafts Tier-1 CS replies, labels `Eve-T1-Pending`, stops. Jack approves on Telegram. After send, Eve labels `Eve-T1-Processed` + archives.
- **Wholesale pipeline tracked in `~/Desktop/workspace/2-Operations/Wholesale/orders.md`** at every stage change.
- **Daily log** lives at `~/Desktop/workspace/8-Daily/YYYY-MM-DD.md`. claw updates after meaningful actions.
