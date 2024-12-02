/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ICachedResourceMetadata } from '../ICachedResourceMetadata.js';

export interface ICachedTreeElement<TValue, TMetadata extends ICachedResourceMetadata> {
  value?: TValue;
  key?: string;
  metadata: TMetadata;
  parent?: ICachedTreeElement<TValue, TMetadata>;
  children: Record<string, ICachedTreeElement<TValue, TMetadata> | undefined>;
}
