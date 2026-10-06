import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { ImageZoom, type ImageZoomProps } from 'fumadocs-ui/components/image-zoom';
import { APIPage } from '@/components/api-page';
import { SetupCodeBlock } from '@/components/docs/setup-code-block';
import { SetupPanel } from '@/components/docs/setup-panel';
import { SetupValue, ShowFor } from '@/components/docs/show-for';
import * as Widgets from '@/components/docs/widgets';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    pre: SetupCodeBlock,
    img: (props) => <ImageZoom {...(props as ImageZoomProps)} />,
    Steps,
    Step,
    SetupPanel,
    ShowFor,
    SetupValue,
    ...Widgets,
    APIPage,
    OpenAPIPage: APIPage,
    ...components,
  };
}
