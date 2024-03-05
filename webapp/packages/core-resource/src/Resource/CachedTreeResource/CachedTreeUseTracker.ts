/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { flat, getPathParents, uuid } from '@cloudbeaver/core-utils';

import type { ICachedResourceMetadata } from '../ICachedResourceMetadata';
import type { ResourceAliases } from '../ResourceAliases';
import type { ResourceKey } from '../ResourceKey';
import { resourceKeyList } from '../ResourceKeyList';
import { ResourceKeyUtils } from '../ResourceKeyUtils';
import type { ResourceLogger } from '../ResourceLogger';
import { ResourceUseTracker } from '../ResourceUseTracker';
import type { CachedTreeMetadata } from './CachedTreeMetadata';

export class CachedTreeUseTracker<TValue, TMetadata extends ICachedResourceMetadata> extends ResourceUseTracker<string, TMetadata> {
  constructor(logger: ResourceLogger, aliases: ResourceAliases<string>, protected metadata: CachedTreeMetadata<TValue, TMetadata>) {
    super(logger, aliases, metadata);
  }
  use(param: ResourceKey<string>, id = uuid()): string {
    const transformedList = resourceKeyList(flat(ResourceKeyUtils.toList(this.aliases.transformToKey(param)).map(getPathParents)));

    this.metadata.update(transformedList, metadata => {
      metadata.dependencies.push(id);
    });

    return super.use(param, id);
  }

  free(param: ResourceKey<string>, id: string): void {
    const transformedList = resourceKeyList(flat(ResourceKeyUtils.toList(this.aliases.transformToKey(param)).map(getPathParents)));
    this.metadata.update(transformedList, metadata => {
      if (metadata.dependencies.length > 0) {
        metadata.dependencies = metadata.dependencies.filter(v => v !== id);
      }
    });
    super.free(param, id);
  }
}
