# User Context

## About Jack

- **Name:** Jack Jeffcoat
- **Role:** Founder, Chooki's Chicken Salt (e-commerce + wholesale, 4 flavours)
- **Website:** trychookis.com
- **Location:** Central Coast, NSW, Australia
- **Timezone:** Australia/Sydney
- **Telegram:** chat_id 6764337706 (username @thetrolleyman, first_name Jack)

## How Jack works

- Works in bursts, jumps between tasks. Needs the assistant to be tracker and day-planner.
- Manages the business primarily via Telegram + voice notes + brain dumps.
- Long drives to Grace's house (Sun/Wed/Thu, 40 min each way) = voice-note time.
- Warehouse hours roughly 7am-8pm. Boys wake up around 7am.
- Fill days 2x/week (currently Tue/Thu — all hands filling). Other days Jack chases warehouse + Bryn and Aaron sell.

## North Star

**South America trip, December 2026.** 8 weeks holiday. Business must run via voice (Bridget app) + Telegram while Jack is away. Every feature or project gets the filter: *"Does this help Jack get to South America?"* Target state: CS fully sorted, revenue scaling, orders shipping, staff holding the line.

## Preferences

- **Tone:** blunt, realistic, no fluff. Tell him the downside.
- **Response length:** short. He'll ask if he wants more.
- **Voice messages:** only when asked. Text by default.
- **Approvals:** Jack-only. Telegram approval buttons ignore anyone else.
- **System design:** prefers proper long-term systems. Cron over n8n. Structured wholesale email pipelines over forms. Daily planning with claw.
- **Source of truth:** Obsidian vault at `~/Desktop/workspace/` (on Jack's machine, mounted into relevant containers).

## Current projects / open loops

- Hermes → NanoClaw migration (this migration, in progress as of April 2026). Hermes is legacy, running in parallel until cutover.
- CS Phase 2 live since 2026-04-20: Eve drafts Tier-1 replies with Gmail label Eve-T1-Pending, then stops. Jack approves via Telegram → send.
- Wholesale: Bryn and Aaron on commission (15% first order, 10% recurring, product only, split 50/50 when tagged by both). Jack takes $0 commission.

## Key people

- **Grace** — partner. Grace's house visits are regular (Sun/Wed/Thu). Forward UGC enquiries to `grace@trychookis.com`.
- **Bryn + Aaron** — sales reps. Commission structure above. Handle wholesale escalations and unverified addresses.
- **The boys** — Jack's kids. 7am wake-up reference.

## Important gotchas

- Address workflow: if shipping address can't be verified, escalate to Bryn + Aaron. Different ship-to name is fine if address is valid. Customer-requested address changes stay in the CS thread.
- No returns on damaged or mis-sent items — gift to the customer, don't chase a return.
- UGC enquiries: forward to grace@trychookis.com, label UGC, remove from inbox.
- Xero before Shopify: Xero invoice must exist and be AUTHORISED before completing a Shopify draft order.
- Shopify drafts: GraphQL only (`draftOrderCreate`). REST silently drops `customer_id`. Never use REST for drafts.
