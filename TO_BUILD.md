# NanoClaw Build Backlog

Items referenced in `groups/main/CLAUDE.md` or `groups/main/soul.md` that are NOT YET wired on this install. Build these before the behaviour they describe can be trusted. Sources listed for each so the person building doesn't start from scratch.

## 1. TTS output pipeline (every reply to Jack as text + voice)

**Promised in:** `groups/main/CLAUDE.md` §"Output pairing (text + TTS voice)", `groups/main/soul.md` §"Response shape".

**Status:** NOT WIRED. NanoClaw upstream has no TTS channel; Jess's fork doesn't either.

**Port source:** Hermes had it working. Hermes `config.yaml` uses:
```yaml
tts:
  provider: edge
  edge:
    voice: en-US-AriaNeural
```
(Microsoft Edge TTS, free, no API key.)

**Build path:**
- Create a NanoClaw skill `add-edge-tts` under `.claude/skills/`, modelled on the existing `add-voice-transcription` skill.
- Skill adds a TTS hook that intercepts outbound Telegram messages in main, synthesises Edge TTS audio, attaches as a voice note.
- Config: voice choice in `.env` as `TTS_VOICE=en-US-AriaNeural`; toggle per-group.
- Test path: Jack sends a Telegram message, main replies, Telegram shows both text and voice note.

## 2. Google Calendar tool (read + write events across linked Google accounts)

**Promised in:** `groups/main/CLAUDE.md` §"Tools" (line: "Google Calendar: read + write events"), `groups/main/user.md` authority posture (calendar writes pre-authorised), `groups/main/soul.md` accountability rhythm (calendar-first).

**Status:** NOT WIRED. No `calendar.sh` in `~/Desktop/workspace/tools/`. Hermes/OpenClaw had it via Google Suite OAuth.

**Build path:**
- Reuse the same Google OAuth tokens already in the vault at `~/Desktop/workspace/.env.google.*.tokens`.
- Write `~/Desktop/workspace/tools/calendar.sh` mirroring the pattern of existing `gmail.sh`: account name as arg, subcommands `list`, `create`, `update`, `delete`, `free-busy`.
- Agents call via the Bash tool from inside the container (vault is mounted at `/workspace/extra/workspace/tools/`).
- Must check ALL linked accounts before creating any event to avoid double-booking (per soul.md).

## 3. Approval bridge routing (sub-group drafts → main → back to sub-group)

**Promised in:** `groups/main/CLAUDE.md` §"Main-group specifics" (line: "Approvals flow back here via the nanoclaw bridge").

**Status:** NOT WIRED. Upstream NanoClaw has no approval-callback plumbing we've surfaced; Hermes had a Python bridge (`telegram_approval_bridge.py`).

**Build path:**
- Specialist groups queue a draft + emit a Telegram inline-keyboard approve/reject message from their group (or from main, Jack's choice).
- On tap, the callback fires `mcp__nanoclaw__send_message` or similar, main receives the decision, routes it back to the originating sub-group via `schedule_task` with `target_group_jid`.
- State model: queue item has id, originating group jid, message ref, sent/pending status. Store in SQLite alongside registered_groups.
- Acceptance test: Eve drafts CS reply → Jack approves in main → Eve sends + labels.

## 4. Kill switch implementation ("stop <agent>" in main)

**Promised in:** `groups/global/CLAUDE.md` §"Kill switch".

**Status:** Not wired. The rule is documented for agents, but main has no concrete way to terminate a specialist's session mid-run.

**Build path:**
- Simplest: main calls NanoClaw's task-queue cancel mechanism (if one exists) or writes a `{"type": "cancel_group_run", "jid": "<target>"}` record to `/workspace/ipc/tasks/` that the orchestrator watches.
- Fallback: maintain a session-id registry per sub-group, `launchctl kickstart -k` the gateway on truly stuck sessions.
- Not destructive to vault/db state — just terminate the live container session.

## 5. Per-agent approval-mode header

**Promised in:** `groups/global/CLAUDE.md` rule #2 (each specialist's `CLAUDE.md` has an `Approval mode:` line).

**Status:** No specialist agents registered yet. When Plan C registers Eve/Sam/Syd/Wholesale, their `CLAUDE.md` files must include a top-level line:
```
Approval mode: draft
```
flipped to `auto_send` manually by Jack after the trust window. Main should respect that value when evaluating rule #2.
