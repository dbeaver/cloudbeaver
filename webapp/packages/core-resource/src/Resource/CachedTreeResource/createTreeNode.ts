/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ICachedResourceMetadata } from '../ICachedResourceMetadata.js';
import type { ICachedTreeElement } from './ICachedTreeElement.js';

export function createTreeNode<TValue, TMetadata extends ICachedResourceMetadata>(
  path: string,
  metadata: TMetadata,
): ICachedTreeElement<TValue, TMetadata> {
  return {
    key: path,
    children: {},
    metadata,
  };
}
