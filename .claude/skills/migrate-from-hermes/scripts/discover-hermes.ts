/**
 * Discover an existing Hermes installation and emit a structured summary.
 *
 * Usage: npx tsx .claude/skills/migrate-from-hermes/scripts/discover-hermes.ts [--state-dir <path>]
 *
 * Checks (in order): --state-dir arg, $HERMES_STATE_DIR, ~/.hermes
 * Parses config.yaml, scans memory files, skills, cron jobs, and user tool scripts.
 *
 * Emits a status block on stdout:
 *   === NANOCLAW MIGRATE: DISCOVERY ===
 *   ...
 *   === END ===
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { parse as yamlParse } from 'yaml';

// ---------------------------------------------------------------------------
// Status block emitter (mirrors setup/status.ts convention)
// ---------------------------------------------------------------------------

function emitStatus(fields: Record<string, string | number | boolean>): void {
  const lines = ['=== NANOCLAW MIGRATE: DISCOVERY ==='];
  for (const [key, value] of Object.entries(fields)) {
    lines.push(`${key}: ${value}`);
  }
  lines.push('=== END ===');
  console.log(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function parseArgs(): { stateDir?: string } {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--state-dir' && args[i + 1]) {
      return { stateDir: args[i + 1] };
    }
  }
  return {};
}

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

export function resolveStateDir(explicit?: string): string | null {
  const home = os.homedir();
  const candidates: string[] = [];

  if (explicit) {
    const expanded = explicit.startsWith('~')
      ? path.join(home, explicit.slice(1))
      : explicit;
    candidates.push(expanded);
  } else {
    const env = process.env.HERMES_STATE_DIR;
    if (env) candidates.push(env);
    candidates.push(path.join(home, '.hermes'));
  }

  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isDirectory()) {
        return c;
      }
    } catch {
      // Permission/race errors — skip
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Hermes config parsing
// ---------------------------------------------------------------------------

export interface HermesConfig {
  model?: string;
  provider?: string;
  base_url?: string;
  context_length?: number;
  delegation?: { model?: string; provider?: string; base_url?: string };
  fallback_model?: { model?: string; provider?: string };
  [key: string]: unknown;
}

export function parseHermesConfig(text: string): HermesConfig {
  if (!text.trim()) return {};
  let parsed: unknown;
  try { parsed = yamlParse(text); }
  catch { return {}; }
  if (!parsed || typeof parsed !== 'object') return {};
  const data = parsed as Record<string, unknown>;
  const result: HermesConfig = {};
  const modelBlock = data.model as Record<string, unknown> | undefined;
  if (modelBlock && typeof modelBlock === 'object') {
    if (typeof modelBlock.default === 'string') result.model = modelBlock.default;
    if (typeof modelBlock.provider === 'string') result.provider = modelBlock.provider;
    if (typeof modelBlock.base_url === 'string') result.base_url = modelBlock.base_url;
    if (typeof modelBlock.context_length === 'number') {
      result.context_length = modelBlock.context_length;
    }
  }
  const delegation = data.delegation as Record<string, unknown> | undefined;
  if (delegation && typeof delegation === 'object') {
    result.delegation = {
      model: typeof delegation.model === 'string' ? delegation.model : undefined,
      provider: typeof delegation.provider === 'string' ? delegation.provider : undefined,
      base_url: typeof delegation.base_url === 'string' ? delegation.base_url : undefined,
    };
  }
  const fallback = data.fallback_model as Record<string, unknown> | undefined;
  if (fallback && typeof fallback === 'object') {
    result.fallback_model = {
      model: typeof fallback.model === 'string' ? fallback.model : undefined,
      provider: typeof fallback.provider === 'string' ? fallback.provider : undefined,
    };
  }
  return result;
}

// ---------------------------------------------------------------------------
// Hermes cron jobs parsing
// ---------------------------------------------------------------------------

export interface HermesCronJob {
  id: string;
  name: string;
  enabled: boolean;
  cron_expr?: string;
  script?: string;
  skill?: string | null;
  prompt?: string;
  chat_id?: string;
  platform?: string;
}

export interface HermesCronJobsResult {
  total: number;
  enabled: number;
  jobs: HermesCronJob[];
}

export function parseHermesCronJobs(text: string): HermesCronJobsResult {
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { return { total: 0, enabled: 0, jobs: [] }; }
  if (!parsed || typeof parsed !== 'object') return { total: 0, enabled: 0, jobs: [] };
  const rawJobs = (parsed as { jobs?: unknown }).jobs;
  if (!Array.isArray(rawJobs)) return { total: 0, enabled: 0, jobs: [] };

  const jobs: HermesCronJob[] = rawJobs
    .filter((j: unknown): j is Record<string, unknown> => Boolean(j) && typeof j === 'object')
    .map((j: any) => ({
      id: String(j.id ?? ''),
      name: String(j.name ?? ''),
      enabled: Boolean(j.enabled),
      cron_expr: j.schedule?.expr ? String(j.schedule.expr) : undefined,
      script: j.script ?? undefined,
      skill: j.skill ?? null,
      prompt: j.prompt ? String(j.prompt).slice(0, 200) : undefined,
      chat_id: j.origin?.chat_id ? String(j.origin.chat_id) : undefined,
      platform: j.origin?.platform ? String(j.origin.platform) : undefined,
    }));

  return { total: jobs.length, enabled: jobs.filter((j) => j.enabled).length, jobs };
}

// ---------------------------------------------------------------------------
// Hermes memory detection
// ---------------------------------------------------------------------------

export interface HermesMemoryInfo {
  has_memory_md: boolean;
  has_user_md: boolean;
  memory_md_size: number;
  user_md_size: number;
}

export function discoverHermesMemory(stateDir: string): HermesMemoryInfo {
  const result: HermesMemoryInfo = { has_memory_md: false, has_user_md: false, memory_md_size: 0, user_md_size: 0 };
  const memDir = path.join(stateDir, 'memories');
  if (!fs.existsSync(memDir)) return result;
  const m = path.join(memDir, 'MEMORY.md');
  const u = path.join(memDir, 'USER.md');
  if (fs.existsSync(m)) { result.has_memory_md = true; result.memory_md_size = fs.statSync(m).size; }
  if (fs.existsSync(u)) { result.has_user_md = true; result.user_md_size = fs.statSync(u).size; }
  return result;
}

// ---------------------------------------------------------------------------
// Hermes skills detection
// ---------------------------------------------------------------------------

export interface HermesSkillsInfo {
  count: number;
  names: string[];
}

export function discoverHermesSkills(stateDir: string): HermesSkillsInfo {
  const dir = path.join(stateDir, 'skills', 'openclaw-imports');
  if (!fs.existsSync(dir)) return { count: 0, names: [] };
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const names = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  return { count: names.length, names };
}

// ---------------------------------------------------------------------------
// User tools detection (~/Desktop/workspace/tools or similar)
// ---------------------------------------------------------------------------

export interface UserToolsInfo {
  dir: string;
  shell_count: number;
  python_count: number;
  total: number;
}

export function discoverUserTools(toolsDir: string): UserToolsInfo {
  const result: UserToolsInfo = { dir: toolsDir, shell_count: 0, python_count: 0, total: 0 };
  if (!fs.existsSync(toolsDir)) return result;
  try {
    const entries = fs.readdirSync(toolsDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (e.name.endsWith('.sh')) result.shell_count++;
      else if (e.name.endsWith('.py')) result.python_count++;
    }
  } catch {}
  result.total = result.shell_count + result.python_count;
  return result;
}

// ---------------------------------------------------------------------------
// Discovery orchestrator
// ---------------------------------------------------------------------------

export interface DiscoveryOptions {
  stateDir: string | null;
  toolsDir: string;
}

export interface DiscoveryResult {
  status: 'found' | 'not_found';
  state_dir?: string;
  model?: string;
  provider?: string;
  has_memory_md: boolean;
  has_user_md: boolean;
  memory_md_size: number;
  user_md_size: number;
  skills_count: number;
  skills_names: string[];
  cron_total: number;
  cron_enabled: number;
  tools_dir: string;
  tools_shell: number;
  tools_python: number;
  tools_total: number;
}

export function runDiscovery(opts: DiscoveryOptions): DiscoveryResult {
  if (!opts.stateDir) {
    return {
      status: 'not_found',
      has_memory_md: false, has_user_md: false,
      memory_md_size: 0, user_md_size: 0,
      skills_count: 0, skills_names: [],
      cron_total: 0, cron_enabled: 0,
      tools_dir: opts.toolsDir, tools_shell: 0, tools_python: 0, tools_total: 0,
    };
  }
  const stateDir = opts.stateDir;
  const configPath = path.join(stateDir, 'config.yaml');
  let config: HermesConfig = {};
  if (fs.existsSync(configPath)) {
    config = parseHermesConfig(fs.readFileSync(configPath, 'utf8'));
  }
  const mem = discoverHermesMemory(stateDir);
  const skills = discoverHermesSkills(stateDir);
  const cronPath = path.join(stateDir, 'cron', 'jobs.json');
  const cron = fs.existsSync(cronPath)
    ? parseHermesCronJobs(fs.readFileSync(cronPath, 'utf8'))
    : { total: 0, enabled: 0, jobs: [] };
  const tools = discoverUserTools(opts.toolsDir);

  return {
    status: 'found',
    state_dir: stateDir,
    model: config.model,
    provider: config.provider,
    has_memory_md: mem.has_memory_md,
    has_user_md: mem.has_user_md,
    memory_md_size: mem.memory_md_size,
    user_md_size: mem.user_md_size,
    skills_count: skills.count,
    skills_names: skills.names,
    cron_total: cron.total,
    cron_enabled: cron.enabled,
    tools_dir: opts.toolsDir,
    tools_shell: tools.shell_count,
    tools_python: tools.python_count,
    tools_total: tools.total,
  };
}

// ---------------------------------------------------------------------------
// Main entrypoint
// ---------------------------------------------------------------------------

function main(): void {
  const { stateDir: explicit } = parseArgs();
  const stateDir = resolveStateDir(explicit);
  const toolsDir = process.env.HERMES_TOOLS_DIR || path.join(os.homedir(), 'Desktop', 'workspace', 'tools');
  const result = runDiscovery({ stateDir, toolsDir });
  const fields: Record<string, string | number | boolean> = {
    STATUS: result.status,
    STATE_DIR: result.state_dir ?? '',
    MODEL: result.model ?? '',
    PROVIDER: result.provider ?? '',
    HAS_MEMORY_MD: result.has_memory_md,
    HAS_USER_MD: result.has_user_md,
    MEMORY_MD_SIZE: result.memory_md_size,
    USER_MD_SIZE: result.user_md_size,
    SKILLS_COUNT: result.skills_count,
    SKILLS_NAMES: result.skills_names.join(','),
    CRON_TOTAL: result.cron_total,
    CRON_ENABLED: result.cron_enabled,
    TOOLS_DIR: result.tools_dir,
    TOOLS_SHELL: result.tools_shell,
    TOOLS_PYTHON: result.tools_python,
    TOOLS_TOTAL: result.tools_total,
  };
  emitStatus(fields);
}

// Run main() only when invoked directly (not when imported by tests)
const invokedDirectly =
  !!process.argv[1] &&
  (import.meta.url === `file://${process.argv[1]}` ||
    process.argv[1].endsWith('/discover-hermes.ts') ||
    process.argv[1].endsWith('\\discover-hermes.ts'));
if (invokedDirectly) {
  main();
}
