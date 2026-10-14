#!/usr/bin/env node
// Pushes every non-empty secret in .dev.vars to the deployed worker in one go.
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// PUBLIC_URL in .dev.vars is the local override; the deployed one lives in wrangler.jsonc.
const SKIP = new Set(['PUBLIC_URL', 'WEBHOOK_VERIFY']);
const secrets = {};
for (const line of readFileSync('.dev.vars', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !line.trim().startsWith('#') && m[2] && !SKIP.has(m[1])) secrets[m[1]] = m[2];
}
writeFileSync('.secrets.tmp.json', JSON.stringify(secrets));
console.log(`pushing ${Object.keys(secrets).length} secrets: ${Object.keys(secrets).join(', ')}`);
const r = spawnSync('npx', ['wrangler', 'secret', 'bulk', '.secrets.tmp.json'], { stdio: 'inherit' });
unlinkSync('.secrets.tmp.json');
process.exit(r.status ?? 1);
