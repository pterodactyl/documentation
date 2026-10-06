import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import lastModified from 'fumadocs-mdx/plugins/last-modified';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';

const codeDefaults = rehypeCodeDefaultOptions;

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  plugins: [lastModified()],
  mdxOptions: {
    rehypeCodeOptions: {
      ...codeDefaults,
      transformers: [
        ...(codeDefaults.transformers ?? []),
        // Code blocks re-render themselves with the reader's setup filled in,
        // so they need to know their own language.
        {
          name: 'pterodactyl:language',
          pre(node) {
            node.properties['data-language'] = this.options.lang;
          },
        },
      ],
    },
  },
});
