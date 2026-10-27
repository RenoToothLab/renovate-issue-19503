import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = process.argv[2] && resolve(process.argv[2]);
if (!source) {
  console.error('Usage: node scripts/run-local.mjs /path/to/patched/renovate');
  process.exit(2);
}
const fixture = JSON.parse(readFileSync(new URL('../renovate.json', import.meta.url), 'utf8'));
delete fixture.$schema;
const directory = mkdtempSync(join(tmpdir(), 'renovate-19503-'));
const configFile = join(directory, 'config.cjs');
writeFileSync(configFile, `module.exports = ${JSON.stringify({
  repositories: ['RenoToothLab/renovate-issue-19503'],
  platform: 'github',
  onboarding: false,
  dryRun: process.argv.includes('--write') ? undefined : 'full',
  baseDir: join(directory, 'work'),
  force: { ...fixture, baseBranchPatterns: ['main'], useBaseBranchConfig: 'merge', includePaths: ['fixtures/**'], extends: [], lockFileMaintenance: { enabled: false }, pruneStaleBranches: false, schedule: ['at any time'], prHourlyLimit: 0, prConcurrentLimit: 0, automerge: false },
})};\n`);
console.error(`Renovate commit: ${execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim()}`);
const result = spawnSync(process.execPath, ['lib/renovate.ts'], {
  cwd: source,
  env: { ...process.env, LOG_LEVEL: 'debug', RENOVATE_CONFIG_FILE: configFile },
  stdio: 'inherit',
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
