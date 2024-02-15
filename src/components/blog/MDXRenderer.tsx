import { Fragment } from 'react';

import * as runtime from 'react/jsx-runtime';
import { runSync, UseMdxComponents } from '@mdx-js/mdx';
import MDXComponents from '~/components/blog/MDXComponents';

function MDXRenderer({ code }: { code: string }) {
  const useMDXComponents: UseMdxComponents = (() =>
    MDXComponents) as unknown as UseMdxComponents;

  const { default: MdxModuleComponent } = runSync(code, {
    ...runtime,
    baseUrl: import.meta.url,
    Fragment,
    useMDXComponents,
  });

  return <MdxModuleComponent />;
}

export default MDXRenderer;
