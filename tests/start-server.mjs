// Start de testserver. In de template maakt hij eerst de ingevulde kopie (zie tests/root.js).
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const { REPO, ROOT, IS_TEMPLATE } = createRequire(import.meta.url)('./root.js');
if (IS_TEMPLATE) execFileSync(process.execPath, [join(REPO, 'tools', 'vul-in.mjs'), '--kopie', ROOT], { stdio: 'inherit' });

process.argv = [process.argv[0], join(REPO, 'tools', 'serve.mjs'), process.argv[2], ROOT, '--strict'];
await import('../tools/serve.mjs');
