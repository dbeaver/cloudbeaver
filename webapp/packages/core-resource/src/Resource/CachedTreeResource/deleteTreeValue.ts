/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getPathParts } from '@cloudbeaver/core-utils';

import type { ICachedResourceMetadata } from '../ICachedResourceMetadata.js';
import type { ICachedTreeElement } from './ICachedTreeElement.js';

export function deleteTreeValue<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
): void {
  if (!path) {
    data.children = {};
    return;
  }

  const paths = getPathParts(path);
  let current = data;

  for (let i = 0; i < paths.length - 1; ++i) {
    const key = paths[i]!;
    const next = current.children[key];
    if (next === undefined) {
      return undefined;
    }
    current = next;
  }
  delete current.children[paths[paths.length - 1]!];
}
