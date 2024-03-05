/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { DefaultValueGetter, isNotNullDefined, isPrimitive, MetadataMap } from '@cloudbeaver/core-utils';

import type { ICachedResourceMetadata } from './ICachedResourceMetadata';
import { isResourceAlias } from './ResourceAlias';
import type { ResourceAliases } from './ResourceAliases';
import type { ResourceKey, ResourceKeyFlat } from './ResourceKey';
import { isResourceKeyList, ResourceKeyList } from './ResourceKeyList';
import { ResourceKeyUtils } from './ResourceKeyUtils';

type MetadataCallback<TMetadata, TValue = void> = (metadata: TMetadata) => TValue;

export class ResourceMetadata<TKey, TMetadata extends ICachedResourceMetadata> {
  protected metadata: MetadataMap<TKey, TMetadata>;
  private readonly isKeyEqual: (param: TKey, second: TKey) => boolean;
  private readonly getKeyRef: (key: TKey) => TKey;

  constructor(
    private readonly aliases: ResourceAliases<TKey>,
    getDefaultMetadata: DefaultValueGetter<TKey, TMetadata>,
    isKeyEqual: (param: TKey, second: TKey) => boolean,
    getKeyRef: (key: TKey) => TKey,
  ) {
    this.metadata = new MetadataMap((key, metadata) => observable(getDefaultMetadata(key, metadata), undefined, { deep: false }));
    this.isKeyEqual = isKeyEqual;
    this.getKeyRef = getKeyRef;
  }

  values(): IterableIterator<TMetadata> {
    return this.metadata.values();
  }

  keys(): IterableIterator<TKey> {
    return this.metadata.keys();
  }

  has(key: ResourceKey<TKey>): boolean {
    if (isResourceKeyList(key)) {
      return key.every(key => this.metadata.has(this.getKeyRef(key)));
    }

    return this.metadata.has(this.getMetadataKeyRef(key));
  }

  every(predicate: (metadata: TMetadata) => boolean): boolean;
  every(param: ResourceKey<TKey>, predicate: (metadata: TMetadata) => boolean): boolean;
  every(param: ResourceKey<TKey> | ((metadata: TMetadata) => boolean), predicate?: (metadata: TMetadata) => boolean): boolean {
    if (!predicate) {
      predicate = param as (metadata: TMetadata) => boolean;
      for (const metadata of this.values()) {
        if (!predicate(metadata)) {
          return false;
        }
      }
      return true;
    }

    param = param as ResourceKey<TKey>;
    predicate = predicate as MetadataCallback<TMetadata, boolean>;

    if (!this.has(param)) {
      return false;
    }

    return !this.some(param, key => !predicate!(key));
  }

  some(predicate: MetadataCallback<TMetadata, boolean>): boolean;
  some(param: ResourceKey<TKey>, predicate: MetadataCallback<TMetadata, boolean>): boolean;
  some(param: ResourceKey<TKey> | MetadataCallback<TMetadata, boolean>, predicate?: MetadataCallback<TMetadata, boolean>): boolean {
    if (!predicate) {
      predicate = param as (metadata: TMetadata) => boolean;
      for (const metadata of this.values()) {
        if (predicate(metadata)) {
          return true;
        }
      }
      return false;
    }

    param = param as ResourceKey<TKey>;
    predicate = predicate as MetadataCallback<TMetadata, boolean>;

    if (!this.has(param)) {
      return false;
    }

    if (isResourceKeyList(param)) {
      return param.some(key => predicate!(this.get(key)));
    }

    let result = false;

    if (predicate(this.get(param))) {
      result = true;
    }

    if (isResourceAlias(param)) {
      param = this.aliases.transformToKey(param);

      if (isResourceKeyList(param)) {
        if (this.some(param, predicate)) {
          result = true;
        }
      }
    }

    return result;
  }

  map<TValue>(param: ResourceKeyFlat<TKey>, map: MetadataCallback<TMetadata | undefined, TValue>): TValue;
  map<TValue>(param: ResourceKeyList<TKey>, map: MetadataCallback<TMetadata | undefined, TValue>): TValue[];
  map<TValue>(param: ResourceKey<TKey>, map: MetadataCallback<TMetadata | undefined, TValue>): TValue | TValue[];
  map<TValue>(param: ResourceKey<TKey>, map: MetadataCallback<TMetadata | undefined, TValue>): TValue | TValue[] {
    const callback = (key: ResourceKeyFlat<TKey>) => {
      if (!this.has(key)) {
        return map(undefined);
      }
      return map(this.get(key));
    };

    if (isResourceKeyList(param)) {
      return param.map(callback);
    }

    return callback(param);
  }

  /**
   * Use it instead of this.metadata.get
   * This method can be overridden
   */
  get(key: ResourceKeyFlat<TKey>): TMetadata;
  get(key: ResourceKeyList<TKey>): TMetadata[];
  get(key: ResourceKey<TKey>): TMetadata | TMetadata[];
  get(key: ResourceKey<TKey>): TMetadata | TMetadata[] {
    if (isResourceKeyList(key)) {
      return key.map(key => this.get(key));
    }

    return this.metadata.get(this.getMetadataKeyRef(key));
  }

  /**
   * Use to update metadata
   * This method can be overridden
   */
  update(callback: MetadataCallback<TMetadata>): void;
  update(key: ResourceKey<TKey>, callback: MetadataCallback<TMetadata>): void;
  update(key: ResourceKey<TKey> | MetadataCallback<TMetadata>, callback?: MetadataCallback<TMetadata>): void {
    if (!callback) {
      callback = key as MetadataCallback<TMetadata>;
      for (const metadata of this.values()) {
        callback(metadata);
      }
      return;
    }

    key = key as ResourceKey<TKey>;

    ResourceKeyUtils.forEach(key, key => {
      callback = callback as MetadataCallback<TMetadata>;
      callback(this.get(key));
    });
  }

  /**
   * Use it instead of this.metadata.delete
   * This method can be overridden
   */
  delete(param: ResourceKey<TKey>): void {
    ResourceKeyUtils.forEach(param, key => {
      this.metadata.delete(this.getMetadataKeyRef(key));
    });
  }

  clear() {
    this.metadata.clear();
  }

  /**
   * Can be overridden to provide static link to complicated keys
   */
  protected getMetadataKeyRef(key: ResourceKeyFlat<TKey>): TKey {
    if (isResourceAlias(key)) {
      key = this.aliases.transformToAlias(key);

      if (isNotNullDefined(key.target)) {
        return this.getMetadataKeyRef(key.target);
      }

      return key.toString() as TKey;
    }

    if (isPrimitive(key)) {
      return key;
    }

    const ref = Array.from(this.keys()).find(k => this.isKeyEqual(k, key as TKey));

    if (ref) {
      return ref;
    }

    return this.getKeyRef(key);
  }
}
