import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveStateDir } from '../scripts/discover-hermes';

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
