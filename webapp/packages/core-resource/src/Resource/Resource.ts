/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable, toJS } from 'mobx';

import { Dependency } from '@cloudbeaver/core-di';
import { isContainsException, isPrimitive, MetadataMap } from '@cloudbeaver/core-utils';

import { CachedResourceParamKey } from './CachedResource.js';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata.js';
import type { IResource } from './IResource.js';
import { isResourceAlias } from './ResourceAlias.js';
import { ResourceAliases } from './ResourceAliases.js';
import type { ResourceKey, ResourceKeyFlat } from './ResourceKey.js';
import { isResourceKeyList, type ResourceKeyList } from './ResourceKeyList.js';
import { ResourceKeyUtils } from './ResourceKeyUtils.js';
import { ResourceLogger } from './ResourceLogger.js';
import { ResourceMetadata } from './ResourceMetadata.js';
import { ResourceUseTracker } from './ResourceUseTracker.js';

export abstract class Resource<
    TData,
    TKey,
    TInclude extends ReadonlyArray<string>,
    TValue = TData,
    TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata,
  >
  extends Dependency
  implements IResource<TData, TKey, TInclude, TValue, TMetadata>
{
  data: TData;

  readonly aliases: ResourceAliases<TKey>;
  readonly useTracker: ResourceUseTracker<TKey, TMetadata>;

  protected readonly logger: ResourceLogger;
  protected readonly metadata: ResourceMetadata<TKey, TMetadata>;

  constructor(
    protected readonly defaultValue: () => TData,
    protected defaultIncludes: TInclude = [] as any,
  ) {
    super();
    this.isKeyEqual = this.isKeyEqual.bind(this);
    this.isIntersect = this.isIntersect.bind(this);
    this.isEqual = this.isEqual.bind(this);

    this.logger = new ResourceLogger(this.getName());
    this.aliases = new ResourceAliases(this.logger, this.validateKey.bind(this));
    this.metadata = new ResourceMetadata(this.aliases, this.getDefaultMetadata.bind(this), this.isKeyEqual, this.getKeyRef.bind(this));
    this.useTracker = new ResourceUseTracker(this.logger, this.aliases, this.metadata);

    this.data = this.defaultValue();

    makeObservable<this>(this, {
      data: observable,
    });
  }

  abstract isLoaded(param?: ResourceKey<TKey> | undefined, includes?: TInclude | undefined): boolean;
  abstract isOutdated(param?: ResourceKey<TKey> | undefined, includes?: TInclude | undefined): boolean;

  isLoadable(param?: ResourceKey<TKey> | undefined, context?: TInclude | undefined): boolean {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    if (isContainsException(this.getException(param))) {
      return false;
    }

    return !this.isLoaded(param, context) || this.isOutdated(param, context);
  }

  isLoading(key?: ResourceKey<TKey>): boolean {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }

    return this.metadata.some(key, metadata => metadata.loading);
  }

  /**
   * Check if key is a part of nextKey
   * @param nextKey - Resource key
   * @param key - Resource key
   * @returns {boolean} Returns true if key can be represented by nextKey
   */
  isIntersect(key: ResourceKey<TKey>, nextKey: ResourceKey<TKey>): boolean {
    if (key === nextKey) {
      return true;
    }

    if (isResourceAlias(key) && isResourceAlias(nextKey)) {
      key = this.aliases.transformToAlias(key);
      nextKey = this.aliases.transformToAlias(nextKey);

      return key.isEqual(nextKey);
    }

    if (isResourceAlias(key)) {
      key = this.aliases.transformToKey(key);
    }

    if (isResourceAlias(nextKey)) {
      nextKey = this.aliases.transformToKey(nextKey);
    }

    if (isResourceKeyList(key) || isResourceKeyList(nextKey)) {
      return ResourceKeyUtils.isIntersect(key, nextKey, this.isKeyEqual);
    }

    return ResourceKeyUtils.isIntersect(key, nextKey, this.isKeyEqual);
  }

  /**
   * Checks
   * @param param - Resource key
   * @param second - Resource key
   * @returns {boolean} Returns true if key can is the same by all key-values
   */
  isEqual(param: ResourceKey<TKey>, second: ResourceKey<TKey>): boolean {
    if (param === second) {
      return true;
    }

    if (isResourceAlias(param) && isResourceAlias(second)) {
      param = this.aliases.transformToAlias(param);
      second = this.aliases.transformToAlias(second);

      return param.isEqual(second);
    }

    if (isResourceAlias(param) || isResourceAlias(second)) {
      return false;
    }

    if (isResourceKeyList(param) && isResourceKeyList(second)) {
      return param.isEqual(second, this.isKeyEqual);
    }

    return ResourceKeyUtils.isEqual(param, second, this.isKeyEqual);
  }

  /**
   * Can be overridden to provide equality check for complicated keys
   */
  isKeyEqual(param: TKey, second: TKey): boolean {
    return param === second;
  }

  getName(): string {
    return this.constructor.name;
  }

  getException(param: ResourceKeyFlat<TKey>): Error | null;
  getException(param: ResourceKeyList<TKey>): Error[] | null;
  getException(param: ResourceKey<TKey>): Error[] | Error | null;
  getException(param: ResourceKey<TKey>): Error[] | Error | null {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    if (isResourceKeyList(param)) {
      return this.metadata.map(param, metadata => metadata?.exception || null).filter<Error>((exception): exception is Error => exception !== null);
    }

    return this.metadata.map(param, metadata => metadata?.exception || null);
  }

  abstract load(key?: ResourceKey<TKey> | undefined, context?: TInclude | undefined): Promise<TValue>;
  abstract refresh(key?: ResourceKey<TKey> | undefined, context?: TInclude | undefined): Promise<TValue>;

  /**
   * Can be overridden to provide static link to complicated keys
   */
  protected getKeyRef(key: TKey): TKey {
    if (isPrimitive(key)) {
      return key;
    }
    return Object.freeze(toJS(key));
  }

  /**
   * Check if key is valid. Can be overridden to provide custom validation.
   */
  protected abstract validateKey(key: TKey): boolean;

  /**
   * Use to extend metadata
   * @returns {Record<string, any>} Object Map
   */
  protected getDefaultMetadata(key: TKey, metadata: MetadataMap<TKey, TMetadata>): TMetadata {
    return {
      loaded: false,
      outdated: true,
      loading: false,
      exception: null,
      includes: observable([...this.defaultIncludes]),
      outdatedIncludes: observable([...this.defaultIncludes]),
      dependencies: observable([]),
    } as ICachedResourceMetadata as TMetadata;
  }
}
