# Hermes → NanoClaw Migration State

## Progress
- [x] Phase 0: Discovery
- [x] Phase 1: Groups and Architecture (main group registered; specialists scaffolded for eve/sam/syd/wholesale but not yet registered — awaiting actual Telegram channels)
- [x] Phase 2: Settings from Config (timezone, assistant_name, container runtime=apple-container, plist PATH+CREDENTIAL_PROXY_HOST wired)
- [x] Phase 3: Identity and Memory (global/CLAUDE.md + main/{CLAUDE,soul,user}.md + telegram_{eve,sam,syd,wholesale}/{CLAUDE,soul,user}.md all on draft mode)
- [x] Phase C.1: Service running as launchd `com.nanoclaw`. Telegram bot @nanoclawjack_bot connected. Acceptance ping delivered to Jack.
- [ ] Phase 4: Channel Credentials (OneCLI vault population for Shopify/Xero/WHOOP/Meta; Gmail tokens already in vault)
- [ ] Phase 5: Scheduled Tasks (port 45 Hermes crons — deferred to Plan D)
- [ ] Phase 6: Register specialist JIDs once Telegram channels exist for Eve/Sam/Syd/Wholesale
- [ ] Phase 7: Cutover from Hermes to NanoClaw on the production Telegram bot

## Discovery (2026-04-21)
- STATE_DIR: /Users/claw/.hermes
- MODEL: claude-opus-4-7
- PROVIDER: anthropic
- Memory files: MEMORY.md (3366 bytes), USER.md (1367 bytes)
- Skills: 43 in `skills/openclaw-imports/` (see full list in `~/docs/superpowers/plans/hermes-discovery-snapshot.txt`)
- Crons: 45 total, 45 enabled
- Tool scripts: 96 at `~/Desktop/workspace/tools/` (84 shell, 12 python)

## Decisions
- assistant_name: claw (Task 2.6)
- group_model: separate-containers-per-subagent (decided at spec time)
- main_group: folder=main, jid=6764337706@telegram, channel=telegram, is_main=true, no_trigger_required=true (Task 2.7)
- container_runtime: apple-container (confirmed Task 2.3, `container system` running, kata kernel installed, container image nanoclaw-agent:latest built and tested)

## Registered Groups
| folder | jid | channel | is_main |
|---|---|---|---|
| main | 6764337706@telegram | telegram | true |

## Settings Migrated
| key | status |
|---|---|
| timezone | Australia/Sydney (written to .env in Task 2.2) |
| anthropic_credential | via Max plan OAuth (Claude Code CLI, subscriptionType=max confirmed in Plan A Task 0.1) |
| sender_allowlist | pending (Task 2.7) |

## Identity & Memory
| file | status | content source |
|---|---|---|
| groups/global/CLAUDE.md | Jack-authored (self-checked ~780 tokens) | research-session-informed final draft: precedence rule, vault posture, output conventions, channel-formatting matrix, 9 cross-cutting hard rules, workspace/memory, sub-agent etiquette, pinned hot rules |
| groups/main/CLAUDE.md | Jack-authored (self-checked ~810 tokens) | role, tools (incl. Calendar), Telegram formatting, TTS pairing, container mounts (incl. vault at `/workspace/extra/workspace`), memory split (personal vs Chooki), scheduling, sub-group registration defaults, delegation rules, main specifics |
| groups/main/soul.md | Jack-authored (self-checked ~500 tokens) | claw as practical co-founder holding Jack accountable: voice (coworker tone, no prefaces, no em dashes, no unsolicited emoji), response shape (text+TTS pairing), accountability rhythm (calendar-first, morning template, nudges, weekly review, cash-check), health mode, role-specific refusals |
| groups/main/user.md | Jack-authored (self-checked ~430 tokens) | Jack facts, how he wants to be worked with (brutal honesty, coworker tone, drafts to approve), authority posture (pre-authorised vs needs-approval including calendar writes), vault as on-demand reference |

## Container mounts wired
| group | additional mount | host | container | access |
|---|---|---|---|---|
| main | Obsidian vault | `~/Desktop/workspace` | `/workspace/extra/workspace` | read-write |

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
