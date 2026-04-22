# Hermes → NanoClaw Migration State

## Progress
- [x] Phase 0: Discovery
- [x] Phase 1: Groups and Architecture (main group registered; specialists live as Claude Code subagents inside main at `groups/main/.claude/agents/{eve,sam,syd,wholesale}.md`. The `groups/telegram_{eve,sam,syd,wholesale}/` scaffolds remain dormant as optional Pattern-B fallback.)
- [x] Phase 2: Settings (timezone, assistant_name=claw, container runtime=apple-container, plist PATH+CREDENTIAL_PROXY_HOST wired)
- [x] Phase 3: Identity and Memory (global + main CLAUDE/soul/user files; 4 specialists ported; vault mount wired at /workspace/extra/workspace)
- [x] Phase C.1: Service running as launchd `com.nanoclaw`. Telegram bot @nanoclawjack_bot connected. End-to-end reply verified on Opus 4.7 via Max plan OAuth.
- [x] Phase C.2: Native credential proxy running on :3001 (OneCLI not needed — `skill/native-credential-proxy` merged with apple-container preserved).
- [x] Phase C.3: Mount allowlist configured at `~/.config/nanoclaw/mount-allowlist.json`. Vault read-write in main container.
- [x] Phase D.1: Three working crons ported to NanoClaw scheduled_tasks (daily-content-ideas 07:00, daily-recipe-scheduler 08:30, shopify-address-validator every 30min). 42 other Hermes crons killed (not load-bearing per user audit).
- [x] Phase D.2: Hermes cutover. `ai.hermes.gateway` and `ai.hermes.anthropic_proxy` unloaded; plists archived at `~/.hermes-migration/archived-launchagents/` for rollback.
- [ ] Phase D.3: Week-long soak + build essential workflows natively in NanoClaw (CS reply pipeline, wholesale flow).
- [ ] Phase D.4: Cancel ChatGPT Pro (user action, after soak).
- [ ] Phase D.5: Rotate tokens exposed in migration transcript (Telegram bot token, OAuth token, old Anthropic API key, old Admin API key).
- [ ] Phase D.6: Delete `~/.hermes/` archive when confident no rollback needed.

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
