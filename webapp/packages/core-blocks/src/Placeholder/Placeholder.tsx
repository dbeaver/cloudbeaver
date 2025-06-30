/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { usePlaceholder } from './usePlaceholder.js';
import type { PlaceholderContainer, PlaceholderElement } from './PlaceholderContainer.js';

type Props<T extends Record<string, any>> = T & {
  container: PlaceholderContainer<T>;
  elements?: PlaceholderElement<T>[];
  empty?: React.ReactNode;
};

export const Placeholder = observer(function Placeholder<T extends Record<string, any>>({
  container,
  elements: extraElements,
  empty,
  ...rest
}: Props<T>) {
  const elements = usePlaceholder({ container, extraElements, props: rest as any as T });

  if (elements.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <>
      {elements.map(({ id, component: Component }) => (
        <Component key={id} {...(rest as any as T)} />
      ))}
    </>
  );
});
