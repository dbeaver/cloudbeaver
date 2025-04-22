/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { isDefined } from '@dbeaver/js-helpers';

import { useAutoLoad } from '../Loader/useAutoLoad.js';
import type { PlaceholderContainer, PlaceholderElement } from './PlaceholderContainer.js';

type Props<T extends Record<string, any>> = T & {
  container: PlaceholderContainer<T>;
  elements?: PlaceholderElement<T>[];
};

export const Placeholder = observer(function Placeholder<T extends Record<string, any>>({ container, elements: extraElements, ...rest }: Props<T>) {
  let elements = container.get();

  if (extraElements) {
    elements = [...elements, ...extraElements].sort((a, b) => {
      if (a.order === b.order) {
        return 0;
      }

      return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
    });
  }

  useAutoLoad(
    Placeholder,
    elements
      .map(element => element.getLoaders?.(rest as unknown as T))
      .flat()
      .filter(isDefined),
  );

  elements = elements.filter(placeholder => !placeholder.isHidden?.(rest as unknown as T));

  return (
    <>
      {elements.map(({ id, component: Component }) => (
        <Component key={id} {...(rest as any as T)} />
      ))}
    </>
  );
});
