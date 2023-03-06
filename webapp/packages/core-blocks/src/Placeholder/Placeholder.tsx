/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Loader } from '../Loader/Loader';
import type { PlaceholderContainer, PlaceholderElement } from './PlaceholderContainer';

type Props<T extends Record<string, any>> = T & {
  container: PlaceholderContainer<T>;
  elements?: PlaceholderElement<T>[];
};

export const Placeholder = observer(function Placeholder<T extends Record<string, any>>({
  container,
  elements: extraElements,
  ...rest
}: Props<T>) {
  let elements = container.get();

  if (extraElements) {
    elements = [...elements, ...extraElements]
      .sort((a, b) => {
        if (a.order === b.order) {
          return 0;
        }

        return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
      });
  }

  return (
    <Loader suspense>
      {elements.map(({ id, component: Component }) => <Component key={id} {...(rest as any as T)} />)}
    </Loader>
  );
});
