// Start de testserver. In de template maakt hij eerst de ingevulde kopie (zie tests/root.js).
// Daarna bouwt hij elk bouwdoel in dist/, zodat de tests ook de Android-, portal- en
// hoofdsite-versie echt openen (tests/bouwdoelen.spec.js).
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const { REPO, ROOT, IS_TEMPLATE } = createRequire(import.meta.url)('./root.js');
if (IS_TEMPLATE) execFileSync(process.execPath, [join(REPO, 'tools', 'vul-in.mjs'), '--kopie', ROOT], { stdio: 'inherit' });
for (const doel of [['android'], ['portal', 'proef'], ['hoofdsite'], ['test', 'abcdef1234567890'], ['web']]) {
  execFileSync(process.execPath, [join(ROOT, 'tools', 'bouw.mjs'), ...doel], { stdio: 'inherit' });
}

process.argv = [process.argv[0], join(REPO, 'tools', 'serve.mjs'), process.argv[2], ROOT, '--strict'];
await import('../tools/serve.mjs');
