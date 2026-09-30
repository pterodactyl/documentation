import { openapi } from '@/lib/openapi';
import { OpenAPIPage } from '@/components/openapi-page';
import type { OpenAPIPageProps_Preloaded } from 'fumadocs-openapi/ui';

export async function APIPage({ document, ...props }: Omit<OpenAPIPageProps_Preloaded, 'preloaded'>) {
  const { bundled } = await openapi.getSchema(document);

  return <OpenAPIPage {...props} payload={{ bundled }} />;
}
