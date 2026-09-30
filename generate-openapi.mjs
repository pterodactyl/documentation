import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';
import { readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const output = './content/docs/v2/api';

// Hand-written pages that live next to the generated reference.
const keep = new Set(['index.mdx']);

await generateFiles({
  input: createOpenAPI({ input: ['./openapi-v2.json'] }),
  output,
  per: 'operation',
  groupBy: 'tag',
  meta: true,
  async beforeWrite() {
    for (const entry of await readdir(output).catch(() => [])) {
      if (!keep.has(entry)) {
        await rm(join(output, entry), { recursive: true, force: true });
      }
    }
  },
});
await writeFile(join(output, 'meta.json'), JSON.stringify({
  title: 'API Reference (2.0)',
  root: true,
  pages: ['index', '...'],
}, null, 2) + '\n');
