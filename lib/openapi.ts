import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createOpenAPI } from 'fumadocs-openapi/server';

// 1.x pages are committed MDX; 2.0 pages are generated from the spec at build time.
export const openapi = createOpenAPI({
  input: ['./openapi.json'],
});

export const openapiV2 = createOpenAPI({
  input: ['./openapi-v2.json'],
});

const PLUS_SPECS = './content/docs/plus/_spec';

export const openapiPlus = (existsSync(PLUS_SPECS) ? readdirSync(PLUS_SPECS) : [])
  .filter((file) => file.endsWith('.json'))
  .map((file) => ({
    name: file.slice(0, -'.json'.length),
    title: (JSON.parse(readFileSync(`${PLUS_SPECS}/${file}`, 'utf8')) as { info: { title: string } }).info.title,
    openapi: createOpenAPI({ input: [`${PLUS_SPECS}/${file}`] }),
  }));
