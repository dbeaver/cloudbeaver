/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { isObjectsEqual } from '@cloudbeaver/core-utils';

export type ResourceAliasOptionsKey = string | number;
export type ResourceAliasOptionsValue = ResourceAliasOptionsKey | Array<ResourceAliasOptionsKey>;
export type ResourceAliasOptions = Readonly<Record<ResourceAliasOptionsKey, ResourceAliasOptionsValue>> | undefined;

export abstract class ResourceAlias<TKey, TOptions extends ResourceAliasOptions> {
  readonly id: string;
  readonly options: TOptions;
  private readonly typescriptHack: TKey;
  abstract readonly name: string;

  constructor(id: string, options: TOptions) {
    this.typescriptHack = null as any;
    this.id = id;
    this.options = options;
  }

  isEqual(key: ResourceAlias<TKey, any>): boolean  {
    if (isResourceAlias(key)) {
      return (
        key.id === this.id
        && isObjectsEqual(this.options, key.options)
      );
    }

    return true;
  }

  toString(): string {
    return `${this.name}(${this.id})(${JSON.stringify(this.options)})`;
  }
}
const key = Symbol('key');
const options = Symbol('options');
export interface ResourceAliasFactory<TKey, TOptions extends ResourceAliasOptions> {
  readonly id: string;
  readonly [key]: TKey;
  readonly [options]: TOptions;
}

export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
): data is ResourceAlias<TKey, TOptions>;
export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  id: string
): data is ResourceAlias<TKey, TOptions>;
export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  alias: ResourceAlias<TKey, TOptions>
): data is ResourceAlias<TKey, TOptions>;
export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  factory: ResourceAliasFactory<TKey, TOptions>
): data is ResourceAlias<TKey, TOptions>;
export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  id?: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions> | string
): data is ResourceAlias<TKey, TOptions> {
  if (!id || typeof id === 'string') {
    return data instanceof ResourceAlias && (!id || data.id === id);
  }
  return data instanceof ResourceAlias && data.id === id.id;
}