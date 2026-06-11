import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('nexus-agents', () => ({
  runBenchmark: vi.fn(),
}));

function makeWritable(method: 'stdout' | 'stderr') {
  const originalWrite = process[method].write.bind(process[method]);
  let output = '';

  const spy = vi
    .spyOn(process[method], 'write')
    .mockImplementation(((chunk: string | Uint8Array) => {
      output += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
      return true;
    }) as typeof process.stdout.write);

  return {
    output: () => output,
    restore: () => {
      spy.mockRestore();
      process[method].write = originalWrite;
    },
  };
}

describe('cli', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints package version for --version', async () => {
    const stdout = makeWritable('stdout');
    try {
      const { main } = await import('./cli.js');
      await expect(main(['node', 'cli', '--version'])).resolves.toBe(0);
      expect(stdout.output()).toContain('nexus-eval-atbench 0.1.4');
    } finally {
      stdout.restore();
    }
  });

  it('prints help text for --help', async () => {
    const stdout = makeWritable('stdout');
    try {
      const { main } = await import('./cli.js');
      await expect(main(['node', 'cli', '--help'])).resolves.toBe(0);
      expect(stdout.output()).toContain('Usage:');
      expect(stdout.output()).toContain('--version');
    } finally {
      stdout.restore();
    }
  });

  it('does not execute CLI on import', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const stderr = makeWritable('stderr');
    try {
      await import('./cli.js');
      expect(exitSpy).not.toHaveBeenCalled();
      expect(stderr.output()).toBe('');
    } finally {
      stderr.restore();
    }
  });
});
