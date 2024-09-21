/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ICachedResourceMetadata } from './ICachedResourceMetadata.js';
import type { ResourceAliases } from './ResourceAliases.js';
import type { ResourceKey, ResourceKeyFlat } from './ResourceKey.js';
import type { ResourceKeyList } from './ResourceKeyList.js';
import type { ResourceUseTracker } from './ResourceUseTracker.js';

export type CachedResourceData<TResource> = TResource extends IResource<infer T, any, any, any, any> ? T : never;
export type CachedResourceKey<TResource> = TResource extends IResource<any, infer T, any, any, any> ? T : never;
export type CachedResourceContext<TResource> = TResource extends IResource<any, any, infer T, any, any> ? T : void;
export type CachedResourceValue<TResource> = TResource extends IResource<any, any, any, infer T, any> ? T : never;
export type CachedResourceMetadata<TResource> = TResource extends IResource<any, any, any, any, infer T> ? T : void;

export interface IResource<
  TData,
  TKey,
  TInclude extends ReadonlyArray<string>,
  TValue = TData,
  TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata,
> {
  data: TData;
  readonly aliases: ResourceAliases<TKey>;
  readonly useTracker: ResourceUseTracker<TKey, TMetadata>;
  getName(): string;

  getException(param: ResourceKeyFlat<TKey>): Error | null;
  getException(param: ResourceKeyList<TKey>): Error[] | null;
  getException(param: ResourceKey<TKey>): Error[] | Error | null;
  getException(param: ResourceKey<TKey>): Error[] | Error | null;

  isLoadable(param?: ResourceKey<TKey>, context?: TInclude): boolean;
  isLoaded(param?: ResourceKey<TKey>, includes?: TInclude): boolean;
  isLoading(key?: ResourceKey<TKey>): boolean;
  isOutdated(param?: ResourceKey<TKey>, includes?: TInclude): boolean;
  isIntersect(key: ResourceKey<TKey>, nextKey: ResourceKey<TKey>): boolean;

  load(key?: ResourceKey<TKey>, context?: TInclude): Promise<TValue>;
  refresh(key?: ResourceKey<TKey>, context?: TInclude): Promise<TValue>;
}
