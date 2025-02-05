/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isObjectsEqual } from '@cloudbeaver/core-utils';

import type { ResourceKey } from './ResourceKey.js';

export type ResourceAliasOptionsKey = string | number;
export type ResourceAliasOptionsValueTypes = string | number | boolean | ResourceKey<unknown> | null | undefined;
export type ResourceAliasOptionsValue = ResourceAliasOptionsValueTypes | Array<ResourceAliasOptionsValueTypes>;
export type ResourceAliasOptions = Readonly<Record<ResourceAliasOptionsKey, ResourceAliasOptionsValue>> | undefined;

export abstract class ResourceAlias<TKey, TOptions extends ResourceAliasOptions> {
  readonly id: string;
  readonly options: TOptions;
  parent?: ResourceAlias<TKey, any>;
  abstract readonly name: string;

  constructor(id: string, options: TOptions, parent?: ResourceAlias<TKey, any>) {
    this.id = id;
    this.options = options;
    this.parent = parent;
  }

  find<TOptions extends ResourceAliasOptions = any>(
    key: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>,
  ): ResourceAlias<TKey, TOptions> | undefined {
    if (this.id === key.id) {
      return this as any;
    }

    if (this.parent) {
      return this.parent.find(key);
    }

    return undefined;
  }

  setParent(parent: ResourceAlias<TKey, any> | undefined): this {
    parent = this.parent ? this.parent.setParent(parent) : parent;
    const copy = new (this.constructor as any)(this.id, this.options, parent) as this;
    return copy;
  }

  isEqual(key: ResourceAlias<TKey, any>): boolean {
    if (!this.parent !== !key.parent) {
      return false;
    }

    if (this.parent && !this.parent.isEqual(key.parent!)) {
      return false;
    }

    return key.id === this.id && isObjectsEqual(this.options, key.options);
  }

  toString(): string {
    return `${this.getKeyPrefix()}(${JSON.stringify(this.options)})`;
  }

  isKeyOfAlias(key: string): boolean {
    return key.startsWith(this.getKeyPrefix());
  }

  [Symbol.toPrimitive](): string {
    return this.toString();
  }

  get [Symbol.toStringTag]() {
    return this.toString();
  }

  private getKeyPrefix(): string {
    return `${this.name}(${this.id})`;
  }
}
const key = Symbol('key');
const options = Symbol('options');
export interface ResourceAliasFactory<TKey, TOptions extends ResourceAliasOptions> {
  readonly id: string;
  readonly [key]: TKey;
  readonly [options]: TOptions;

  isKeyOfAlias(key: string): boolean;
}

export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(data: any): data is ResourceAlias<TKey, TOptions>;
export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  id: string,
): data is ResourceAlias<TKey, TOptions>;
export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  alias: ResourceAlias<TKey, TOptions>,
): data is ResourceAlias<TKey, TOptions>;
export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  factory: ResourceAliasFactory<TKey, TOptions>,
): data is ResourceAlias<TKey, TOptions>;
export function isResourceAlias<TKey = any, TOptions extends ResourceAliasOptions = any>(
  data: any,
  id?: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions> | string,
): data is ResourceAlias<TKey, TOptions> {
  if (!id || typeof id === 'string') {
    return data instanceof ResourceAlias && (!id || data.id === id);
  }
  return data instanceof ResourceAlias && data.id === id.id;
}
