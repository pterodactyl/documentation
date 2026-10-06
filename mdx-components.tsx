import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { ImageZoom, type ImageZoomProps } from 'fumadocs-ui/components/image-zoom';
import { APIPage } from '@/components/api-page';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    img: (props) => <ImageZoom {...(props as ImageZoomProps)} />,
    APIPage,
    OpenAPIPage: APIPage,
    ...components,
  };
}
