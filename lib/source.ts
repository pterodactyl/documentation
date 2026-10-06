import { openapi, openapiV2 } from '@/lib/openapi';
import { docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';

const apiV2 = await openapiV2.staticSource({
  baseDir: 'v2/api',
  groupBy: 'tag',
  meta: true,
});

// content/docs/v2/api/meta.json names and orders the section.
apiV2.files = apiV2.files.filter((file) => file.path !== 'v2/api/meta.json');

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader(
  {
    docs: docs.toFumadocsSource(),
    openapi: apiV2,
  },
  {
    baseUrl: '/',
    plugins: [lucideIconsPlugin(), openapi.loaderPlugin()],
  },
);

export type SourcePage = InferPageType<typeof source>;

export function getPageImage(page: SourcePage) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: SourcePage) {
  return {
    segments: [...page.slugs, 'content.md'],
    url: `/${page.slugs.join('/')}.md`,
  };
}

export function getPageGitHubUrl(page: SourcePage) {
  return `https://github.com/pterodactyl/documentation/blob/v2/content/docs/${page.path}`;
}

export async function getLLMText(page: SourcePage) {
  if (page.type === 'openapi') {
    const { bundled } = page.data.getSchema();
    const { operations = [] } = page.data.getOpenAPIPageProps();
    const sections = operations.map(({ path, method }) => {
      const operation = bundled.paths?.[path]?.[method];

      return `## ${method.toUpperCase()} ${path}

\`\`\`json
${JSON.stringify(operation, null, 2)}
\`\`\``;
    });

    return [`# ${page.data.title}`, page.data.description, ...sections].filter(Boolean).join('\n\n');
  }

  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
