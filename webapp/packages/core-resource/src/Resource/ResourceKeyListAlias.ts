/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ResourceAlias, type ResourceAliasFactory, type ResourceAliasOptions } from './ResourceAlias.js';

export class ResourceKeyListAlias<TKey, TOptions extends ResourceAliasOptions> extends ResourceAlias<TKey, TOptions> {
  readonly name = 'ResourceKeyListAlias';
}

export function isResourceKeyListAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
): data is ResourceKeyListAlias<TKey, TOptions>;
export function isResourceKeyListAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  id: string,
): data is ResourceKeyListAlias<TKey, TOptions>;
export function isResourceKeyListAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  alias: ResourceKeyListAlias<TKey, TOptions>,
): data is ResourceKeyListAlias<TKey, TOptions>;
export function isResourceKeyListAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  factory: ResourceKeyListAliasFactory<TKey, any, TOptions>,
): data is ResourceKeyListAlias<TKey, TOptions>;
export function isResourceKeyListAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  id?: ResourceKeyListAlias<TKey, TOptions> | ResourceKeyListAliasFactory<TKey, any, TOptions> | string,
): data is ResourceKeyListAlias<TKey, TOptions> {
  if (!id || typeof id === 'string') {
    return data instanceof ResourceKeyListAlias && (!id || data.id === id);
  }
  return data instanceof ResourceKeyListAlias && data.id === id.id;
}

export function resourceKeyListAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  id: string,
  options?: TOptions,
): ResourceKeyListAlias<TKey, TOptions> {
  return new ResourceKeyListAlias(id, options!);
}

export interface ResourceKeyListAliasFactory<TKey, TArgs extends any[], TOptions extends ResourceAliasOptions>
  extends ResourceAliasFactory<TKey, TOptions> {
  (...args: TArgs): ResourceKeyListAlias<TKey, TOptions>;
}

export function resourceKeyListAliasFactory<TKey = any, TArgs extends any[] = any[], TOptions extends ResourceAliasOptions = any>(
  id: string,
  optionsGetter: (...args: TArgs) => TOptions,
): ResourceKeyListAliasFactory<TKey, TArgs, TOptions> {
  function factory(...args: TArgs) {
    return resourceKeyListAlias(id, optionsGetter(...args));
  }
  Object.defineProperty(factory, 'id', { value: id, writable: false });
  Object.defineProperty(factory, 'isKeyOfAlias', { value: (key: string) => key.startsWith(`${ResourceKeyListAlias.name}(${id})`), writable: false });
  return factory as ResourceKeyListAliasFactory<TKey, TArgs, TOptions>;
}
