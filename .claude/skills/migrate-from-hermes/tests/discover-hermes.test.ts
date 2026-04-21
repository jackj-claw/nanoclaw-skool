import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveStateDir, parseHermesConfig } from '../scripts/discover-hermes';

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
