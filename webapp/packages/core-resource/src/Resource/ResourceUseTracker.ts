/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { uuid } from '@cloudbeaver/core-utils';

import { CachedResourceParamKey } from './CachedResource.js';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata.js';
import { isResourceAlias } from './ResourceAlias.js';
import type { ResourceAliases } from './ResourceAliases.js';
import type { ResourceKey } from './ResourceKey.js';
import type { ResourceLogger } from './ResourceLogger.js';
import type { ResourceMetadata } from './ResourceMetadata.js';

export interface IUseData<TKey> {
  id: string | undefined;
  param: ResourceKey<TKey>;
  isInUse: boolean;
}

export class ResourceUseTracker<TKey, TMetadata extends ICachedResourceMetadata> {
  get isResourceInUse(): boolean {
    return this.metadata.some(metadata => metadata.dependencies.length > 0);
  }
  readonly onUse: ISyncExecutor<IUseData<TKey>>;
  constructor(protected logger: ResourceLogger, protected aliases: ResourceAliases<TKey>, protected metadata: ResourceMetadata<TKey, TMetadata>) {
    this.onUse = new SyncExecutor();
    this.onUse.setInitialDataGetter(this.getInitialOnUseData.bind(this));

    makeObservable<this>(this, {
      isResourceInUse: computed,
      use: action,
      free: action,
    });
  }

  /**
   * Return true if resource is in use
   * @param param - Resource key
   */
  isInUse(param: ResourceKey<TKey>): boolean {
    return this.metadata.some(param, metadata => metadata.dependencies.length > 0);
  }

  /**
   * Return true if resource is in use by {@link id}
   * @param id - Dependency id
   */
  hasUseId(id: string): boolean {
    return this.metadata.some(metadata => metadata.dependencies.includes(id));
  }

  /**
   * Use resource by {@link param}. Optionally provide {@link id} to track dependency.
   * @param param - Resource key
   * @param id - Dependency id (uuid by default)
   * @returns Dependency id
   */
  use(param: ResourceKey<TKey>, id = uuid()): string {
    this.metadata.update(param, metadata => {
      metadata.dependencies.push(id);
    });

    if (isResourceAlias(param)) {
      param = this.aliases.transformToAlias(param);

      this.metadata.update(param, metadata => {
        metadata.dependencies.push(id);
      });
    }

    this.onUse.execute({ id, param, isInUse: true });

    this.logger.log('Use resource: ', this.logger.getName(), param);
    return id;
  }

  /**
   * Release resource by {@link param} and {@link id}
   * @param param - Resource key
   * @param id - Dependency id
   */
  free(param: ResourceKey<TKey>, id: string): void {
    this.metadata.update(metadata => {
      if (metadata.dependencies.length > 0) {
        metadata.dependencies = metadata.dependencies.filter(v => v !== id);
      }
    });

    if (isResourceAlias(param)) {
      param = this.aliases.transformToAlias(param);
    }

    this.onUse.execute({ id, param, isInUse: false });

    this.logger.log('Free resource: ', this.logger.getName(), param);
  }

  clear(): void {
    this.onUse.execute(this.getInitialOnUseData());
  }

  protected getInitialOnUseData(): IUseData<TKey> {
    return {
      id: undefined,
      param: CachedResourceParamKey,
      isInUse: false,
    };
  }
}
