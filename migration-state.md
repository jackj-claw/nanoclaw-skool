# Hermes → NanoClaw Migration State

## Progress
- [x] Phase 0: Discovery
- [ ] Phase 1: Groups and Architecture
- [ ] Phase 2: Settings from Config
- [ ] Phase 3: Identity and Memory
- [ ] Phase 4: Channel Credentials
- [ ] Phase 5: Scheduled Tasks
- [ ] Phase 6: Webhooks and Other Config
- [ ] Phase 7: Summary

## Discovery (2026-04-21)
- STATE_DIR: /Users/claw/.hermes
- MODEL: claude-opus-4-7
- PROVIDER: anthropic
- Memory files: MEMORY.md (3366 bytes), USER.md (1367 bytes)
- Skills: 43 in `skills/openclaw-imports/` (see full list in `~/docs/superpowers/plans/hermes-discovery-snapshot.txt`)
- Crons: 45 total, 45 enabled
- Tool scripts: 96 at `~/Desktop/workspace/tools/` (84 shell, 12 python)

## Decisions
- assistant_name: TBD (Task 2.6)
- group_model: separate-containers-per-subagent (decided at spec time)
- main_group: TBD (Task 2.6)
- container_runtime: apple-container (confirmed Task 2.3, `container system` running, kata kernel installed)

## Registered Groups
| folder | jid | channel | is_main |
|---|---|---|---|

## Settings Migrated
| key | status |
|---|---|
| timezone | Australia/Sydney (written to .env in Task 2.2) |
| anthropic_credential | via Max plan OAuth (Claude Code CLI, subscriptionType=max confirmed in Plan A Task 0.1) |
| sender_allowlist | pending (Task 2.7) |

## Identity & Memory
| file | status |
|---|---|
| groups/main/CLAUDE.md | pending (Task 2.7) |
| groups/global/CLAUDE.md | pending (Phase 3) |

## Channel Credentials
| channel | status | env_var |
|---|---|---|
| telegram (test bot @nanoclawjack_bot) | token stored at ~/.hermes-migration/nanoclaw-test-bot.env | TELEGRAM_BOT_TOKEN (pending write in Task 2.7 Step 2) |

## Scheduled Tasks
(Phase 5 of Plan C)

## Deferred / Not Applicable
- WhatsApp, Discord, Slack, Signal channels: configured in Hermes but unused — defer
- sam/syd/eve subagent configs: extracted manually during Phase 4 (Plan C)
- MCP servers: Hermes MCP setup differs from OpenClaw — handle case-by-case
- Voice mode (TTS/STT): defer to a separate post-migration task
- Production Telegram bot: stays on Hermes until cutover (Plan D)
