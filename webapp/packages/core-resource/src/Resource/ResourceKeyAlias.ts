/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ResourceAlias, type ResourceAliasFactory, type ResourceAliasOptions } from './ResourceAlias.js';

export class ResourceKeyAlias<TKey, TOptions extends ResourceAliasOptions> extends ResourceAlias<TKey, TOptions> {
  readonly name = 'ResourceKeyAlias';
}

export function isResourceKeyAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(data: any): data is ResourceKeyAlias<TKey, TOptions>;
export function isResourceKeyAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  id: string,
): data is ResourceKeyAlias<TKey, TOptions>;
export function isResourceKeyAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  alias: ResourceKeyAlias<TKey, TOptions>,
): data is ResourceKeyAlias<TKey, TOptions>;
export function isResourceKeyAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  factory: ResourceKeyAliasFactory<TKey, any, TOptions>,
): data is ResourceKeyAlias<TKey, TOptions>;
export function isResourceKeyAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  id?: ResourceKeyAlias<TKey, TOptions> | ResourceKeyAliasFactory<TKey, any, TOptions> | string,
): data is ResourceKeyAlias<TKey, TOptions> {
  if (!id || typeof id === 'string') {
    return data instanceof ResourceKeyAlias && (!id || data.id === id);
  }
  return data instanceof ResourceKeyAlias && data.id === id.id;
}

export function resourceKeyAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  id: string,
  options?: TOptions,
  parent?: ResourceAlias<TKey, any>,
): ResourceKeyAlias<TKey, TOptions> {
  return new ResourceKeyAlias(id, options!, parent);
}

export interface ResourceKeyAliasFactory<TKey, TArgs extends any[], TOptions extends ResourceAliasOptions>
  extends ResourceAliasFactory<TKey, TOptions> {
  (...args: TArgs): ResourceKeyAlias<TKey, TOptions>;
}

export function resourceKeyAliasFactory<TKey = any, TArgs extends any[] = any[], TOptions extends ResourceAliasOptions = any>(
  id: string,
  optionsGetter: (...args: TArgs) => TOptions,
): ResourceKeyAliasFactory<TKey, TArgs, TOptions> {
  function factory(...args: TArgs) {
    return resourceKeyAlias(id, optionsGetter(...args));
  }
  Object.defineProperty(factory, 'id', { value: id, writable: false });
  Object.defineProperty(factory, 'isKeyOfAlias', { value: (key: string) => key.startsWith(`${ResourceKeyAlias.name}(${id})`), writable: false });
  return factory as ResourceKeyAliasFactory<TKey, TArgs, TOptions>;
}
