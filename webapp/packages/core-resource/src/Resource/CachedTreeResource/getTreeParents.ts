/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createPath, getPathParts } from '@cloudbeaver/core-utils';

import type { ICachedResourceMetadata } from '../ICachedResourceMetadata.js';
import type { ICachedTreeElement } from './ICachedTreeElement.js';

export function getTreeParents<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
  getDefault: (path: string) => ICachedTreeElement<TValue, TMetadata>,
): Array<ICachedTreeElement<TValue, TMetadata>>;
export function getTreeParents<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
): Array<ICachedTreeElement<TValue, TMetadata>>;
export function getTreeParents<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
  getDefault?: (path: string) => ICachedTreeElement<TValue, TMetadata>,
): Array<ICachedTreeElement<TValue, TMetadata>> {
  const parents = [data];

  if (!path) {
    return parents;
  }
  const paths = getPathParts(path);
  let currentNodePath = '';

  for (let i = 0; i < paths.length; ++i) {
    const current = parents[parents.length - 1];

    if (i === 0) {
      parents.shift();
    }

    const key = paths[i]!;
    currentNodePath = createPath(currentNodePath, key);
    let next = current?.children[key];
    if (next === undefined) {
      if (getDefault) {
        next = getDefault(currentNodePath);
        next.parent = current;
        current!.children[key] = next;
        next = current!.children[key]!;
      } else {
        return parents;
      }
    }
    parents.push(next);
  }
  return parents;
}
