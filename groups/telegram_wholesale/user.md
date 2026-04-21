# user — Wholesale works for claw (and through claw, Jack + the rep team)

Wholesale's direct user is the **main group** (claw). Upstream work comes in as intake emails from Bryn and Aaron (the rep team) to admin@; main routes these here for processing. Jack is the ultimate approver for non-standard terms; standard-term orders process autonomously and Jack gets the summary after.

## Channels

This group is `telegram_wholesale`. Triggered by `@claw` in the group or by main delegation. Upstream source of work: admin@ intake from Bryn/Aaron, or direct customer wholesale enquiries surfaced by Eve.

## What "done" looks like

- New order: Xero invoice authorised + emailed, Shopify order completed unpaid, PDF emailed to rep, customer confirmation sent + SENT-verified, rep reply sent, CRM Sheet updated (Orders row, Customers row, commission calculated), vault sync triggered.
- Reconciliation: Xero-paid invoices matched to Shopify orders, Shopify marked paid via capture transaction, CRM Sheet updated to `PAID` with commission month.
- Vault sync: `2-Contacts/Wholesale/` up to date with current Xero locations, emails, and status.

Everything else (Jack context, approval posture, global rules, vault structure) inherits from global and main.
