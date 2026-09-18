import * as fs from 'node:fs';
import * as path from 'node:path';
import { DEMO_PUBLIC_FILES, isDemoPublicFileContent } from './lib/apply-rewrites';

const DRY_RUN = process.argv.includes('--dry-run');

const root = process.cwd();
let removed = 0;

for (const rel of DEMO_PUBLIC_FILES) {
  const file = path.join(root, 'public', rel);
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (!isDemoPublicFileContent(rel, source)) continue;
  console.log(`🗑️  demo public file: public/${rel}`);
  if (!DRY_RUN) fs.unlinkSync(file);
  removed++;
}

console.log(
  `${DRY_RUN ? 'Would remove' : 'Removed'} ${removed} demo public file(s).`,
);
