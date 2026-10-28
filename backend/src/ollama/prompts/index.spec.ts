import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadPromptFile, resolvePromptIncludes } from './index';

describe('ollama prompt loader', () => {
  it('loads the runtime prompt templates and resolves the schema include', () => {
    const {
      PROPERTY_SYSTEM,
      EXTRACT_SYSTEM,
      ANSWER_SYSTEM,
    } = require('./index');

    expect(PROPERTY_SYSTEM).toContain('PropertyType');
    expect(PROPERTY_SYSTEM).toContain('HOUSE');
    expect(EXTRACT_SYSTEM).toContain('city');
    expect(ANSWER_SYSTEM).toContain('<resultados>');
  });

  it('loads prompt files from a dist-like layout', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ollama-dist-layout-'));
    const distDir = join(dir, 'dist', 'ollama', 'prompts');
    const sourceDir = join(dir, 'dist', 'src', 'ollama', 'prompts');

    mkdirSync(distDir, { recursive: true });
    mkdirSync(sourceDir, { recursive: true });
    writeFileSync(join(distDir, 'property-system.md'), 'Prompt from dist');

    expect(resolvePromptIncludes('property-system.md', sourceDir)).toBe(
      'Prompt from dist',
    );
  });

  it('throws when an include file is missing', () => {
    expect(() => loadPromptFile('missing.md')).toThrow(/missing|not found/i);
  });

  it('throws when prompt includes recurse', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ollama-prompts-'));
    writeFileSync(join(dir, 'a.md'), '{{include:b.md}}');
    writeFileSync(join(dir, 'b.md'), '{{include:a.md}}');

    expect(() => resolvePromptIncludes('a.md', dir)).toThrow(
      /circular|recurs/i,
    );
  });
});
