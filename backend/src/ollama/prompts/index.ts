import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';

const PROMPTS_DIR = __dirname;
const INCLUDE_PATTERN = /\{\{include:([^}]+)\}\}/g;
const MAX_INCLUDE_DEPTH = 10;

function getPromptLookupDirs(promptDir = PROMPTS_DIR): string[] {
  const baseDirs = new Set<string>([
    promptDir,
    resolve(promptDir, '..', '..', 'ollama', 'prompts'),
    resolve(promptDir, '..', '..', '..', 'ollama', 'prompts'),
    resolve(process.cwd(), 'src/ollama/prompts'),
    resolve(process.cwd(), 'dist/ollama/prompts'),
  ]);

  return Array.from(baseDirs).filter((dir) => dir && dir.length > 0);
}

function resolvePromptPath(fileName: string, promptDir = PROMPTS_DIR): string {
  if (isAbsolute(fileName)) {
    return fileName;
  }

  for (const dir of getPromptLookupDirs(promptDir)) {
    const candidate = resolve(dir, fileName).replace(/\\/g, '/');
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return resolve(promptDir, fileName).replace(/\\/g, '/');
}

export function loadPromptFile(
  fileName: string,
  promptDir = PROMPTS_DIR,
): string {
  const filePath = resolvePromptPath(fileName, promptDir);

  if (!existsSync(filePath)) {
    throw new Error(`Prompt file not found: ${fileName}`);
  }

  return readFileSync(filePath, 'utf8');
}

export function resolvePromptIncludes(
  fileName: string,
  promptDir = PROMPTS_DIR,
  seen = new Set<string>(),
  depth = 0,
): string {
  if (depth > MAX_INCLUDE_DEPTH) {
    throw new Error(
      `Prompt include recursion exceeded max depth for ${fileName}`,
    );
  }

  const filePath = resolvePromptPath(fileName, promptDir);
  const normalizedPath = filePath.replace(/\\/g, '/');

  if (seen.has(normalizedPath)) {
    throw new Error(`Circular include detected for ${fileName}`);
  }

  seen.add(normalizedPath);

  let content: string;

  try {
    content = loadPromptFile(fileName, promptDir);
  } catch {
    throw new Error(`Prompt include not found: ${fileName}`);
  }

  return content.replace(INCLUDE_PATTERN, (_match, includeName: string) => {
    const includePath = includeName.trim();
    const nextSeen = new Set(seen);

    return resolvePromptIncludes(includePath, promptDir, nextSeen, depth + 1);
  });
}

export const PROPERTY_SYSTEM = resolvePromptIncludes('property-system.md');
export const EXTRACT_SYSTEM = resolvePromptIncludes('extract-filters.md');
export const ANSWER_SYSTEM = resolvePromptIncludes('answer.md');
