import { use } from 'react';
import { ComponentProvider, type IComponentProvider } from './ComponentProvider.js';

export function componentProviderWrapper<T extends keyof IComponentProvider>(
  key: T,
  component: Required<IComponentProvider>[T],
): Required<IComponentProvider>[T] {
  return function componentProviderWrapperInner(props: Required<IComponentProvider>[T] extends React.FC<infer P> ? P : never) {
    const provider = use(ComponentProvider);
    const Component = provider[key] || component;
    return <Component {...(props as any)} />;
  } as Required<IComponentProvider>[T];
}
