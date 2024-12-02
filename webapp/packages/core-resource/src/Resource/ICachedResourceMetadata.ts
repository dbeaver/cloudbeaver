/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ICachedResourceOffsetPage } from './CachedResourceOffsetPageKeys.js';

export interface ICachedResourceMetadata {
  loaded: boolean;
  outdated: boolean;
  loading: boolean;
  includes: string[];
  outdatedIncludes: string[];
  exception: Error | null;
  /** List of generated id's added each time resource is used and removed on release */
  dependencies: string[];
  offsetPage?: ICachedResourceOffsetPage;
}
