/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { flat, getPathParents, uuid } from '@cloudbeaver/core-utils';

import type { ICachedResourceMetadata } from '../ICachedResourceMetadata.js';
import type { ResourceAliases } from '../ResourceAliases.js';
import type { ResourceKey } from '../ResourceKey.js';
import { resourceKeyList } from '../ResourceKeyList.js';
import { ResourceKeyUtils } from '../ResourceKeyUtils.js';
import type { ResourceLogger } from '../ResourceLogger.js';
import { ResourceUseTracker } from '../ResourceUseTracker.js';
import type { CachedTreeMetadata } from './CachedTreeMetadata.js';

export class CachedTreeUseTracker<TValue, TMetadata extends ICachedResourceMetadata> extends ResourceUseTracker<string, TMetadata> {
  constructor(
    logger: ResourceLogger,
    aliases: ResourceAliases<string>,
    protected override metadata: CachedTreeMetadata<TValue, TMetadata>,
  ) {
    super(logger, aliases, metadata);
  }
  override use(param: ResourceKey<string>, id = uuid()): string {
    const transformedList = resourceKeyList(flat(ResourceKeyUtils.toList(this.aliases.transformToKey(param)).map(getPathParents)));

    this.metadata.update(transformedList, metadata => {
      metadata.dependencies.push(id);
    });

    return super.use(param, id);
  }

  override free(param: ResourceKey<string>, id: string): void {
    const transformedList = resourceKeyList(flat(ResourceKeyUtils.toList(this.aliases.transformToKey(param)).map(getPathParents)));
    this.metadata.update(transformedList, metadata => {
      if (metadata.dependencies.length > 0) {
        metadata.dependencies = metadata.dependencies.filter(v => v !== id);
      }
    });
    super.free(param, id);
  }
}
