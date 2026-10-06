import { createOpenAPI } from 'fumadocs-openapi/server';

// 1.x pages are committed MDX; 2.0 pages are generated from the spec at build time.
export const openapi = createOpenAPI({
  input: ['./openapi.json'],
});

export const openapiV2 = createOpenAPI({
  input: ['./openapi-v2.json'],
});
