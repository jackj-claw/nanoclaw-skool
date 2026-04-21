import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  resolveStateDir,
  parseHermesConfig,
  parseHermesCronJobs,
  discoverHermesMemory,
  discoverHermesSkills,
} from '../scripts/discover-hermes';

describe('resolveStateDir', () => {
  it('returns explicit --state-dir arg when it exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-'));
    try {
      expect(resolveStateDir(tmp)).toBe(tmp);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('expands ~ prefix in explicit path', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-'));
    const relative = path.relative(os.homedir(), tmp);
    try {
      expect(resolveStateDir('~/' + relative)).toBe(tmp);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('falls back to ~/.hermes when it exists and no explicit path', () => {
    const hermesPath = path.join(os.homedir(), '.hermes');
    const result = resolveStateDir();
    if (fs.existsSync(hermesPath)) {
      expect(result).toBe(hermesPath);
    } else {
      expect(result).toBe(null);
    }
  });

  it('returns null when explicit path does not exist', () => {
    expect(resolveStateDir('/does/not/exist/hermes')).toBe(null);
  });
});

describe('parseHermesConfig', () => {
  it('extracts model + provider + base_url from model block', () => {
    const yaml = `
model:
  default: claude-opus-4-7
  provider: anthropic
  base_url: http://127.0.0.1:8799
  context_length: 200000
`;
    const r = parseHermesConfig(yaml);
    expect(r.model).toBe('claude-opus-4-7');
    expect(r.provider).toBe('anthropic');
    expect(r.base_url).toBe('http://127.0.0.1:8799');
    expect(r.context_length).toBe(200000);
  });

  it('extracts delegation and fallback_model', () => {
    const yaml = `
delegation:
  model: gpt-5.4
  provider: openai-codex
fallback_model:
  provider: openai-codex
  model: gpt-5.4
`;
    const r = parseHermesConfig(yaml);
    expect(r.delegation?.model).toBe('gpt-5.4');
    expect(r.fallback_model?.provider).toBe('openai-codex');
  });

  it('returns {} on unparseable YAML', () => {
    expect(parseHermesConfig(':::bad yaml:::')).toEqual({});
  });

  it('returns {} on empty', () => {
    expect(parseHermesConfig('')).toEqual({});
  });
});

describe('parseHermesCronJobs', () => {
  it('extracts enabled + disabled jobs', () => {
    const payload = {
      jobs: [
        { id: 'a', name: 'n1', enabled: true, schedule: { kind: 'cron', expr: '0 8 * * 5' }, script: 's.py', skill: null, prompt: 'p', origin: { platform: 'telegram', chat_id: '123' }},
        { id: 'b', name: 'n2', enabled: false, schedule: { kind: 'cron', expr: '0 12 * * *' }},
      ],
    };
    const r = parseHermesCronJobs(JSON.stringify(payload));
    expect(r.total).toBe(2);
    expect(r.enabled).toBe(1);
    expect(r.jobs[0].cron_expr).toBe('0 8 * * 5');
    expect(r.jobs[0].script).toBe('s.py');
    expect(r.jobs[0].chat_id).toBe('123');
  });

  it('returns empty on malformed JSON', () => {
    expect(parseHermesCronJobs('not json')).toEqual({ total: 0, enabled: 0, jobs: [] });
  });

  it('returns empty when jobs array missing', () => {
    expect(parseHermesCronJobs('{}')).toEqual({ total: 0, enabled: 0, jobs: [] });
  });
});

describe('discoverHermesMemory', () => {
  it('detects MEMORY.md and USER.md with sizes', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-mem-'));
    try {
      const memDir = path.join(tmp, 'memories');
      fs.mkdirSync(memDir);
      fs.writeFileSync(path.join(memDir, 'MEMORY.md'), '# mem content');
      fs.writeFileSync(path.join(memDir, 'USER.md'), '# user content here');
      const r = discoverHermesMemory(tmp);
      expect(r.has_memory_md).toBe(true);
      expect(r.has_user_md).toBe(true);
      expect(r.memory_md_size).toBeGreaterThan(0);
      expect(r.user_md_size).toBeGreaterThan(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns all false/0 when memories dir absent', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-nomem-'));
    try {
      expect(discoverHermesMemory(tmp)).toEqual({
        has_memory_md: false,
        has_user_md: false,
        memory_md_size: 0,
        user_md_size: 0,
      });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('discoverHermesSkills', () => {
  it('enumerates skill subdirectories sorted', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-skills-'));
    try {
      const dir = path.join(tmp, 'skills', 'openclaw-imports');
      fs.mkdirSync(dir, { recursive: true });
      fs.mkdirSync(path.join(dir, 'zebra-skill'));
      fs.mkdirSync(path.join(dir, 'alpha-skill'));
      fs.mkdirSync(path.join(dir, 'mango-skill'));
      fs.writeFileSync(path.join(dir, 'not-a-dir.md'), 'x');
      const r = discoverHermesSkills(tmp);
      expect(r.count).toBe(3);
      expect(r.names).toEqual(['alpha-skill', 'mango-skill', 'zebra-skill']);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns empty when skills dir absent', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-noskills-'));
    try {
      expect(discoverHermesSkills(tmp)).toEqual({ count: 0, names: [] });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
