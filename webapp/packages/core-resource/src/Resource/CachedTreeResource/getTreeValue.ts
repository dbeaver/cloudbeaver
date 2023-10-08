/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getPathParts } from '@cloudbeaver/core-utils';

import type { ICachedResourceMetadata } from '../ICachedResourceMetadata';
import type { ICachedTreeElement } from './ICachedTreeElement';

export function getTreeValue<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
  getDefault: (path: string) => ICachedTreeElement<TValue, TMetadata>,
): ICachedTreeElement<TValue, TMetadata>;
export function getTreeValue<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
): ICachedTreeElement<TValue, TMetadata> | undefined;
export function getTreeValue<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
  getDefault?: (path: string) => ICachedTreeElement<TValue, TMetadata>,
): ICachedTreeElement<TValue, TMetadata> | undefined {
  if (!path) {
    return data;
  }
  const paths = getPathParts(path);
  let current = data;

  for (let i = 0; i < paths.length; ++i) {
    const path = paths[i];
    let next = current.children[path];
    if (next === undefined) {
      if (getDefault) {
        next = getDefault(path);
        next.parent = current;
        current.children[path] = next;
        next = current.children[path]!;
      } else {
        return undefined;
      }
    }
    current = next;
  }
  return current;
}
