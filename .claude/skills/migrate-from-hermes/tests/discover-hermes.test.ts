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
  discoverUserTools,
  runDiscovery,
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

  it('returns ~/.hermes path when it exists (no explicit, no env)', () => {
    // Point HOME at a tmpdir that contains a .hermes directory, so the default fallback is deterministic
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-home-'));
    const fakeHermes = path.join(tmpHome, '.hermes');
    fs.mkdirSync(fakeHermes);
    const savedHome = process.env.HOME;
    const savedEnv = process.env.HERMES_STATE_DIR;
    try {
      process.env.HOME = tmpHome;
      delete process.env.HERMES_STATE_DIR;
      expect(resolveStateDir()).toBe(fakeHermes);
    } finally {
      if (savedHome === undefined) delete process.env.HOME;
      else process.env.HOME = savedHome;
      if (savedEnv === undefined) delete process.env.HERMES_STATE_DIR;
      else process.env.HERMES_STATE_DIR = savedEnv;
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  it('returns null when no explicit, no env, and ~/.hermes does not exist', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-nohome-'));
    const savedHome = process.env.HOME;
    const savedEnv = process.env.HERMES_STATE_DIR;
    try {
      process.env.HOME = tmpHome;
      delete process.env.HERMES_STATE_DIR;
      expect(resolveStateDir()).toBe(null);
    } finally {
      if (savedHome === undefined) delete process.env.HOME;
      else process.env.HOME = savedHome;
      if (savedEnv === undefined) delete process.env.HERMES_STATE_DIR;
      else process.env.HERMES_STATE_DIR = savedEnv;
      fs.rmSync(tmpHome, { recursive: true, force: true });
    }
  });

  it('returns null when explicit path does not exist', () => {
    expect(resolveStateDir('/does/not/exist/hermes')).toBe(null);
  });

  it('uses HERMES_STATE_DIR env var when no explicit path', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-env-'));
    const saved = process.env.HERMES_STATE_DIR;
    try {
      process.env.HERMES_STATE_DIR = tmp;
      expect(resolveStateDir()).toBe(tmp);
    } finally {
      if (saved === undefined) delete process.env.HERMES_STATE_DIR;
      else process.env.HERMES_STATE_DIR = saved;
      fs.rmSync(tmp, { recursive: true, force: true });
    }
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

  it('ignores non-string values in model block', () => {
    const yaml = `
model:
  default: null
  provider: false
  base_url: 42
`;
    const r = parseHermesConfig(yaml);
    expect(r.model).toBeUndefined();
    expect(r.provider).toBeUndefined();
    expect(r.base_url).toBeUndefined();
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

  it('filters out null or non-object job entries', () => {
    const payload = {
      jobs: [
        { id: 'a', name: 'ok', enabled: true, schedule: { expr: '* * * * *' } },
        null,
        'not-an-object',
        42,
        { id: 'b', name: 'ok2', enabled: false, schedule: { expr: '0 * * * *' } },
      ],
    };
    const r = parseHermesCronJobs(JSON.stringify(payload));
    expect(r.total).toBe(2);
    expect(r.enabled).toBe(1);
    expect(r.jobs.map((j) => j.id)).toEqual(['a', 'b']);
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

describe('discoverUserTools', () => {
  it('counts .sh and .py files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-tools-'));
    try {
      fs.writeFileSync(path.join(tmp, 'a.sh'), '#!/bin/bash\n');
      fs.writeFileSync(path.join(tmp, 'b.sh'), '#!/bin/bash\n');
      fs.writeFileSync(path.join(tmp, 'c.py'), 'print(1)\n');
      fs.writeFileSync(path.join(tmp, 'ignore.txt'), 'x');
      fs.mkdirSync(path.join(tmp, 'subdir'));
      const r = discoverUserTools(tmp);
      expect(r.shell_count).toBe(2);
      expect(r.python_count).toBe(1);
      expect(r.total).toBe(3);
      expect(r.dir).toBe(tmp);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns zeros when tools dir absent', () => {
    expect(discoverUserTools('/does/not/exist/tools')).toEqual({
      dir: '/does/not/exist/tools',
      shell_count: 0,
      python_count: 0,
      total: 0,
    });
  });
});

describe('runDiscovery', () => {
  it('emits full result for a minimal Hermes layout', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-full-'));
    try {
      fs.writeFileSync(path.join(tmp, 'config.yaml'), `
model:
  default: claude-opus-4-7
  provider: anthropic
`);
      fs.mkdirSync(path.join(tmp, 'memories'));
      fs.writeFileSync(path.join(tmp, 'memories', 'MEMORY.md'), '# mem');
      fs.mkdirSync(path.join(tmp, 'cron'));
      fs.writeFileSync(path.join(tmp, 'cron', 'jobs.json'),
        JSON.stringify({ jobs: [{ id: 'x', name: 'n', enabled: true, schedule: { expr: '* * * * *' }}] }));
      const r = runDiscovery({ stateDir: tmp, toolsDir: '/tmp/nonexistent' });
      expect(r.status).toBe('found');
      expect(r.model).toBe('claude-opus-4-7');
      expect(r.has_memory_md).toBe(true);
      expect(r.cron_total).toBe(1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns not_found when stateDir null', () => {
    expect(runDiscovery({ stateDir: null, toolsDir: '/tmp' }).status).toBe('not_found');
  });
});
