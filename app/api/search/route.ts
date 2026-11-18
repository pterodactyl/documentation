import { search, suggested } from '@/lib/search';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tag = params.get('tag') ?? undefined;
  const query = params.get('query')?.trim();

  return Response.json(query ? await search(query, tag) : suggested(tag));
}
