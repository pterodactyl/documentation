import { source, type SourcePage } from '@/lib/source';
import { getBreadcrumbItems } from 'fumadocs-core/breadcrumb';
import type { SortedResult } from 'fumadocs-core/search';
import { createFromSource } from 'fumadocs-core/search/server';

export interface SearchRow {
  url: string;
  title: string;
  excerpt?: string;
  method?: string;
  path?: string;
}

export interface SearchCard {
  id: string;
  url?: string;
  title: string;
  crumbs: string[];
  description?: string;
  rows: SearchRow[];
  /** Set on API cards, which group endpoints and have no page of their own. */
  endpoints?: number;
}

export interface SearchResults {
  cards: SearchCard[];
  guides: number;
  endpoints: number;
}

interface Operation {
  method: string;
  path: string;
}

interface Group {
  page: SortedResult;
  hits: SortedResult[];
}

type Ranked<T> = T & { score: number };

const MAX_GUIDES = 20;
const MAX_ENDPOINTS = 40;
const MAX_SECTIONS = 3;

const SUGGESTED: Record<string, string[]> = {
  v2: [
    '/v2/panel/getting-started',
    '/v2/panel/docker',
    '/v2/wings/installing',
    '/v2/upgrading/upgrading-from-v1',
    '/v2/panel/troubleshooting',
  ],
  v1: [
    '/v1/panel/getting-started',
    '/v1/wings/installing',
    '/v1/panel/updating',
    '/v1/wings/upgrading',
    '/v1/panel/troubleshooting',
  ],
};

function createServer(threshold: number) {
  return createFromSource(source, {
    language: 'english',
    search: { threshold, groupBy: { properties: ['page_id'], maxResult: 8 } },
    buildIndex(page) {
      return {
        id: page.url,
        title: page.data.title ?? '',
        description: page.data.description,
        url: page.url,
        structuredData: page.data.structuredData,
        tag: page.slugs[0],
      };
    },
  });
}

// Every word has to match; when nothing does, any word may.
const strict = createServer(0);
const loose = createServer(1);

const pages = new Map(source.getPages().map((page) => [page.url, page]));

// Sidebar order, newest first. "v2" reads as "Pterodactyl 2.0" when results span versions.
const versions = source.getPageTree().children.flatMap((node) => {
  if (typeof node.name !== 'string') return [];

  return [{ root: node.name, name: 'description' in node && typeof node.description === 'string' ? node.description : node.name }];
});

const operations = Promise.all(
  source.getPages().map(async (page) => [page.url, await operationOf(page)] as const),
).then((entries) => new Map(entries));

async function operationOf(page: SourcePage): Promise<Operation | undefined> {
  if (page.type === 'openapi') return page.data.getOpenAPIPageProps().operations?.[0];

  // 1.x API pages are generated MDX. The path is only in their <APIPage /> element.
  const method = page.data._openapi?.method;
  if (typeof method !== 'string') return undefined;

  const path = /path&#x22;:&#x22;(.+?)&#x22;/.exec(await page.data.getText('processed'))?.[1];

  return path ? { method, path } : undefined;
}

function wordsOf(text: string): string[] {
  return text
    .replace(/<\/?mark>/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

// Plurals and "-ing" forms are the same word.
function sameWord(a: string, b: string): boolean {
  const [short, long] = a.length < b.length ? [a, b] : [b, a];

  return a === b || (short.length > 2 && long.startsWith(short) && long.length - short.length < 4);
}

function strength(content: string, terms: string[]): number {
  const words = wordsOf(content);

  return terms.filter((term) => words.some((word) => sameWord(term, word))).length;
}

function excerpt(markdown: string): string {
  const blocks = markdown.split(/\n{2,}/).filter((block) => !/^[#|]/.test(block));
  const block = blocks.find((candidate) => candidate.includes('<mark>')) ?? blocks[0] ?? '';

  return block
    .split(/(`[^`]*`)/)
    .map((part, index) => (index % 2 ? part : part.replace(/\*\*|~~/g, '')))
    .join('')
    .replace(/\s+/g, ' ');
}

function groupByPage(results: SortedResult[]): Group[] {
  const groups: Group[] = [];

  for (const result of results) {
    if (result.type === 'page') groups.push({ page: result, hits: [] });
    else groups.at(-1)?.hits.push(result);
  }

  return groups;
}

function guideCard({ page, hits }: Group, crumbs: string[], terms: string[]): Ranked<SearchCard> {
  const data = pages.get(page.url)?.data;
  const sections = new Map<string, Ranked<SearchRow>>();
  let description: string | undefined;

  for (const hit of hits) {
    const id = hit.url.split('#')[1];

    if (!id) {
      description ??= excerpt(hit.content);
      continue;
    }

    const row = sections.get(id) ?? {
      url: hit.url,
      title: data?.structuredData.headings.find((heading) => heading.id === id)?.content ?? '',
      score: 0,
    };

    if (hit.type === 'heading') {
      row.title = hit.content;
      row.score = strength(hit.content, terms);
    } else {
      row.excerpt ??= excerpt(hit.content);
    }

    sections.set(id, row);
  }

  const rows = Array.from(sections.values()).sort(byScore).slice(0, MAX_SECTIONS);
  const title = strength(page.content, terms);
  const heading = rows[0]?.score ?? 0;

  return {
    id: page.url,
    url: page.url,
    title: page.content,
    crumbs,
    description: description ?? (rows.length ? undefined : data?.description),
    rows: rows.map(({ score: _, ...row }) => row),
    score: title ? title * 10 + 3 : heading ? heading * 10 + 2 : 0,
  };
}

function endpointRow({ page, hits }: Group, { method, path }: Operation, terms: string[]): Ranked<SearchRow> {
  const title = strength(page.content, terms);

  return {
    url: page.url,
    title: page.content,
    excerpt: title || !hits[0] ? undefined : excerpt(hits[0].content),
    method: method.toUpperCase(),
    path,
    score: title ? title * 10 + 1 : 0,
  };
}

function byScore(a: { score: number }, b: { score: number }): number {
  return b.score - a.score;
}

export async function search(query: string, tag?: string): Promise<SearchResults> {
  const [matches, lookup] = await Promise.all([strict.search(query, { tag }), operations]);
  const results = matches.length ? matches : await loose.search(query, { tag });
  const terms = wordsOf(query);
  const guides: Ranked<SearchCard>[] = [];
  const found: (Ranked<SearchRow> & { crumbs: string[] })[] = [];

  const groups = groupByPage(results).map((group) => {
    const [root = '', ...rest] = (group.page.breadcrumbs ?? []).slice(1);
    const version = versions.findIndex((candidate) => candidate.root === root);

    return { group, version, crumbs: tag ? rest : [versions[version]?.name ?? root, ...rest] };
  });

  // Equal matches keep this order, so the newest version leads.
  groups.sort((a, b) => a.version - b.version);

  for (const { group, crumbs } of groups) {
    const operation = lookup.get(group.page.url);

    if (operation) found.push({ ...endpointRow(group, operation, terms), crumbs });
    else guides.push(guideCard(group, crumbs, terms));
  }

  // Endpoints that only mention the words are noise beside ones named for them.
  const best = Math.max(0, ...found.map((row) => row.score));
  const endpoints = found.filter((row) => row.score === best);
  const apis = new Map<string, Ranked<SearchCard>>();

  endpoints.forEach(({ crumbs, score, ...row }, index) => {
    const id = crumbs.join('/');
    const shown = index < MAX_ENDPOINTS;
    if (!shown && !apis.has(id)) return;

    const card = apis.get(id) ?? { id, title: crumbs.at(-1) ?? '', crumbs: crumbs.slice(0, -1), rows: [], endpoints: 0, score };

    card.endpoints = (card.endpoints ?? 0) + 1;
    if (shown) card.rows.push(row);
    apis.set(id, card);
  });

  // Title matches, then heading matches, then endpoints, then pages that mention the words.
  const cards = [...guides.sort(byScore).slice(0, MAX_GUIDES), ...apis.values()].sort(byScore);

  return {
    cards: cards.map(({ score: _, ...card }) => card),
    guides: guides.length,
    endpoints: endpoints.length,
  };
}

export function suggested(tag = 'v2'): SearchResults {
  const cards = (SUGGESTED[tag] ?? []).flatMap((url) => {
    const page = pages.get(url);
    if (!page) return [];

    const crumbs = getBreadcrumbItems(url, source.getPageTree()).flatMap((item) => (typeof item.name === 'string' ? [item.name] : []));

    return [{ id: url, url, title: page.data.title ?? '', crumbs, description: page.data.description, rows: [] }];
  });

  return { cards, guides: cards.length, endpoints: 0 };
}
