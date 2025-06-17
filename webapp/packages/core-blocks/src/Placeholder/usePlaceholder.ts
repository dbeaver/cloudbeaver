/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { isDefined } from '@dbeaver/js-helpers';
import { useAutoLoad } from '../Loader/useAutoLoad.js';
import type { PlaceholderContainer, PlaceholderElement } from './PlaceholderContainer.js';

interface Options<T extends Record<string, any>> {
  container: PlaceholderContainer<T>;
  extraElements?: PlaceholderElement<T>[];
  props: T;
}

export function usePlaceholder<T extends Record<string, any>>({ container, extraElements, props }: Options<T>): PlaceholderElement<T>[] {
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
    usePlaceholder,
    elements
      .map(element => element.getLoaders?.(props))
      .flat()
      .filter(isDefined),
  );

  return elements.filter(placeholder => !placeholder.isHidden?.(props));
}
