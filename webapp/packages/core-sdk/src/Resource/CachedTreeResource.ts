/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable } from 'mobx';

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { flat, getPathParents, getPathParts, ILoadableState, isContainsException, uuid } from '@cloudbeaver/core-utils';

import { CachedResource, ICachedResourceMetadata } from './CachedResource';
import type { CachedResourceIncludeArgs, CachedResourceValueIncludes } from './CachedResourceIncludes';
import { isResourceAlias } from './ResourceAlias';
import type { ResourceKey, ResourceKeyFlat, ResourceKeySimple } from './ResourceKey';
import { resourceKeyAlias, ResourceKeyAlias } from './ResourceKeyAlias';
import { isResourceKeyList, resourceKeyList, ResourceKeyList } from './ResourceKeyList';
import { ResourceKeyListAlias, resourceKeyListAlias, resourceKeyListAliasFactory } from './ResourceKeyListAlias';
import { ResourceKeyUtils } from './ResourceKeyUtils';

export interface ICachedTreeElement<TValue, TMetadata extends ICachedResourceMetadata> {
  value?: TValue;
  key?: string;
  metadata: TMetadata;
  parent?: ICachedTreeElement<TValue, TMetadata>;
  children: Record<string, ICachedTreeElement<TValue, TMetadata> | undefined>;
}

export type ICachedTreeData<TValue, TMetadata extends ICachedResourceMetadata> = ICachedTreeElement<TValue, TMetadata>;

export const CachedTreeRootValueKey = resourceKeyAlias('@cached-tree-resource/root-value');
export const CachedTreeRootChildrenKey = resourceKeyListAlias('@cached-tree-resource/root-children');
export const CachedTreeChildrenKey = resourceKeyListAliasFactory('@cached-tree-resource/children', (path: string) => ({ path }));

/**
 * CachedTreeResource is a resource that stores data that has tree structure.
 */
export abstract class CachedTreeResource<
  TValue,
  TContext extends Record<string, any> = Record<string, never>,
  TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata,
> extends CachedResource<ICachedTreeData<TValue, TMetadata>, TValue, string, CachedResourceIncludeArgs<TValue, TContext>, TMetadata> {
  readonly onItemUpdate: ISyncExecutor<ResourceKeySimple<string>>;
  readonly onItemDelete: ISyncExecutor<ResourceKeySimple<string>>;

  constructor(defaultValue?: () => ICachedTreeData<TValue, TMetadata>, defaultIncludes?: CachedResourceIncludeArgs<TValue, TContext>) {
    super(
      CachedTreeRootChildrenKey,
      defaultValue ||
        (() =>
          ({
            children: {},
            metadata: {
              dependencies: [],
              exception: null,
              includes: [],
              loaded: false,
              loading: false,
              outdated: false,
            },
          } as any as ICachedTreeData<TValue, TMetadata>)),
      defaultIncludes,
    );
    this.onItemUpdate = new SyncExecutor<ResourceKeySimple<string>>(null);
    this.onItemDelete = new SyncExecutor<ResourceKeySimple<string>>(null);

    this.addAlias(CachedTreeRootValueKey, () => '');
    this.addAlias(CachedTreeRootChildrenKey, () => resourceKeyList(this.dataGetKeyChildren('')));
    this.addAlias(CachedTreeChildrenKey, key => resourceKeyList(this.dataGetKeyChildren(key.options.path)));

    makeObservable<this, 'dataSet' | 'dataDelete'>(this, {
      set: action,
      delete: action,
      dataSet: action,
      dataDelete: action,
    });
  }

  deleteInResource(resource: CachedTreeResource<string, any, any>, map?: (key: ResourceKey<string>) => ResourceKey<string>): this {
    this.onItemDelete.addHandler(param => {
      try {
        if (this.logActivity) {
          console.group(this.getActionPrefixedName(' outdate - ' + resource.getName()));
        }

        if (map) {
          param = map(param) as any as string;
        }

        resource.delete(param as any as string);
      } finally {
        if (this.logActivity) {
          console.groupEnd();
        }
      }
    });

    return this;
  }

  use(param: ResourceKey<string>, id = uuid()): string {
    const transformedList = resourceKeyList(flat(ResourceKeyUtils.toList(this.transformToKey(param)).map(getPathParents)));

    this.updateMetadata(transformedList, metadata => {
      metadata.dependencies.push(id);
    });

    return super.use(param, id);
  }

  free(param: ResourceKey<string>, id: string): void {
    const transformedList = resourceKeyList(flat(ResourceKeyUtils.toList(this.transformToKey(param)).map(getPathParents)));
    this.updateMetadata(transformedList, metadata => {
      if (metadata.dependencies.length > 0) {
        metadata.dependencies = metadata.dependencies.filter(v => v !== id);
      }
    });
    super.free(param, id);
  }

  has(key: ResourceKey<string>): boolean {
    if (this.isAlias(key) && (!this.hasMetadata(key) || this.isLoaded(key))) {
      return false;
    }

    key = this.transformToKey(key);
    return ResourceKeyUtils.every(key, key => this.dataHas(this.getKeyRef(key)));
  }

  get(key: string | ResourceKeyAlias<string, any>): TValue | undefined;
  get(key: ResourceKeyList<string> | ResourceKeyListAlias<string, any>): Array<TValue | undefined>;
  get(key: ResourceKey<string>): Array<TValue | undefined> | TValue | undefined;
  get(key: ResourceKey<string>): Array<TValue | undefined> | TValue | undefined {
    key = this.transformToKey(key);
    return ResourceKeyUtils.map(key, key => this.dataGetValue(this.getKeyRef(key)));
  }

  set(key: string | ResourceKeyAlias<string, any>, value: TValue): void;
  set(key: ResourceKeyList<string> | ResourceKeyListAlias<string, any>, value: TValue[]): void;
  set(key: ResourceKey<string>, value: TValue | TValue[]): void;
  set(originalKey: ResourceKey<string>, value: TValue | TValue[]): void {
    if (this.isAlias(originalKey, CachedTreeChildrenKey) || this.isAlias(originalKey, CachedTreeRootChildrenKey)) {
      throw new Error("Children can't be set with alias");
    }
    const key = this.transformToKey(originalKey);

    if (isResourceKeyList(key)) {
      if (key.length === 0) {
        return;
      }

      for (let i = 0; i < key.length; i++) {
        this.dataSet(this.getKeyRef(key[i]), (value as TValue[])[i]);
      }
    } else {
      this.dataSet(this.getKeyRef(key), value as TValue);
    }
    this.markUpdated(key);
    this.markLoaded(key);
    this.cleanError(key);
    this.onItemUpdate.execute(key);
  }

  delete(originalKey: ResourceKey<string>): void {
    const key = this.transformToKey(originalKey);

    if (isResourceKeyList(key) && key.length === 0) {
      return;
    }

    this.onItemDelete.execute(key);
    ResourceKeyUtils.forEach(key, key => {
      this.dataDelete(this.getKeyRef(key));
    });
    this.deleteMetadata(originalKey);
    // rewrites pending outdate
    // this.markUpdated(key);
  }

  hasMetadata(key: ResourceKey<string>): boolean {
    if (isResourceAlias(key)) {
      return super.hasMetadata(key);
    }

    if (isResourceKeyList(key)) {
      return key.every(key => this.dataHasMetadata(key));
    }
    return this.dataHasMetadata(key);
  }

  /**
   * Use it instead of this.metadata.values
   * This method can be override
   */

  getAllMetadata(): TMetadata[] {
    return [...this.metadata.values(), ...getAllValues(this.data).map(value => value.metadata)];
  }

  /**
   * Use it instead of this.metadata.get
   * This method can be override
   */
  getMetadata(key: ResourceKeyFlat<string>): TMetadata;
  getMetadata(key: ResourceKeyList<string>): TMetadata[];
  getMetadata(key: ResourceKey<string>): TMetadata | TMetadata[];
  getMetadata(key: ResourceKey<string>): TMetadata | TMetadata[] {
    if (isResourceAlias(key)) {
      return super.getMetadata(key);
    }
    if (isResourceKeyList(key)) {
      return key.map(key => this.dataGetMetadata(key));
    }

    return this.dataGetMetadata(key);
  }

  /**
   * Use it instead of this.metadata.delete
   * This method can be override
   */
  deleteMetadata(key: ResourceKey<string>): void {
    if (isResourceAlias(key)) {
      return super.deleteMetadata(key);
    }
    ResourceKeyUtils.forEach(key, path => {
      const data = this.dataGet(path);
      if (data) {
        data.metadata = this.getDefaultMetadata(path, this.metadata) as TMetadata;
      }
    });
  }

  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: string | ResourceKeyAlias<string, any>,
    includes?: T,
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKeyList<string> | ResourceKeyListAlias<string, any> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: ResourceKey<string>,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKey<string> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    if (key === undefined) {
      key = CachedTreeRootChildrenKey;
    }
    await this.loadData(key, true, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: string | ResourceKeyAlias<string, any>,
    includes?: T,
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKeyList<string> | ResourceKeyListAlias<string, any> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: ResourceKey<string>,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKey<string> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    if (key === undefined) {
      key = CachedTreeRootChildrenKey;
    }
    await this.loadData(key, false, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  /**
   * Use it instead of this.data.has
   * This method can be override
   */
  protected dataHas(key: string): boolean {
    return getValue(this.data, key)?.value !== undefined;
  }

  /**
   * Use it instead of this.data.has
   * This method can be override
   */
  protected dataGet(key: string): ICachedTreeElement<TValue, TMetadata> | undefined {
    return getValue(this.data, key);
  }

  /**
   * Use it instead of this.data.get
   * This method can be override
   */
  protected dataGetValueChildren(key: string): TValue[] {
    return Object.values(getValue(this.data, key)?.children || {})
      .map(info => info?.value)
      .filter((value): value is TValue => value !== undefined);
  }

  /**
   * Use it instead of this.data.get
   * This method can be override
   */
  protected dataGetKeyChildren(key: string): string[] {
    return Object.values(getValue(this.data, key)?.children || {})
      .map(info => info?.key)
      .filter((key): key is string => key !== undefined);
  }

  /**
   * Use it instead of this.data.get
   * This method can be override
   */
  protected dataGetValue(key: string): TValue | undefined {
    return getValue(this.data, key)?.value;
  }

  /**
   * Use it instead of this.data.get
   * This method can be override
   */
  protected dataGetMetadata(key: string): TMetadata {
    return getValue(this.data, key, this.getDefaultNode.bind(this)).metadata;
  }

  /**
   * Use it instead of this.data.has
   * This method can be override
   */
  protected dataHasMetadata(key: string): boolean {
    return getValue(this.data, key) !== undefined;
  }

  /**
   * Use it instead of this.data.set
   * This method can be override
   */
  protected dataSet(key: string, value: TValue): void {
    const data = getValue(this.data, key, this.getDefaultNode.bind(this));
    data.key = key;
    data.value = value;
  }

  /**
   * Use it instead of this.data.delete
   * This method can be override
   */
  protected dataDelete(key: string): void {
    deleteValue(this.data, key);
  }

  /**
   * Use it instead of this.data.clear
   * This method can be override
   */
  protected override resetDataToDefault(): void {
    this.data = this.getDefaultNode('');
  }

  protected getDefaultNode(path: string): ICachedTreeElement<TValue, TMetadata> {
    return {
      key: path,
      children: {},
      metadata: this.getDefaultMetadata(path, this.metadata) as TMetadata,
    };
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

function getAllValues<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
): ICachedTreeElement<TValue, TMetadata>[] {
  const elementsToScan = [data];
  const values: ICachedTreeElement<TValue, TMetadata>[] = [];

  while (elementsToScan.length) {
    const current = elementsToScan.shift()!;
    values.push(current);
    elementsToScan.push(...(Object.values(current.children).filter(Boolean) as any));
  }

  return values;
}

function getValue<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
  getDefault: (path: string) => ICachedTreeElement<TValue, TMetadata>,
): ICachedTreeElement<TValue, TMetadata>;
function getValue<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
): ICachedTreeElement<TValue, TMetadata> | undefined;
function getValue<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
  getDefault?: (path: string) => ICachedTreeElement<TValue, TMetadata>,
): ICachedTreeElement<TValue, TMetadata> | undefined {
  if (!path) {
    return data;
  }
  const paths = getPathParts(path);
  let current = data;

  for (let i = 0; i < paths.length; ++i) {
    const path = paths[i];
    let next = current.children[path];
    if (next === undefined) {
      if (getDefault) {
        next = getDefault(path);
        next.parent = current;
        current.children[path] = next;
        next = current.children[path]!;
      } else {
        return undefined;
      }
    }
    current = next;
  }
  return current;
}

function deleteValue<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
  path: string,
): void {
  if (!path) {
    data.children = {};
    return;
  }

  const paths = getPathParts(path);
  let current = data;

  for (let i = 0; i < paths.length - 1; ++i) {
    const path = paths[i];
    const next = current.children[path];
    if (next === undefined) {
      return undefined;
    }
    current = next;
  }
  delete current.children[paths[paths.length - 1]];
}

export function getCachedTreeResourceLoaderState<TValue, TContext extends Record<string, any> = Record<string, never>>(
  resource: CachedTreeResource<TValue, TContext>,
  key: ResourceKey<string>,
  includes?: CachedResourceIncludeArgs<TValue, TContext> | undefined,
): ILoadableState {
  return {
    get exception() {
      return resource.getException(key);
    },
    isLoading() {
      return resource.isLoading(key);
    },
    isLoaded() {
      return resource.isLoaded(key, includes);
    },
    isError() {
      return isContainsException(this.exception);
    },
    isOutdated() {
      return resource.isOutdated(key);
    },
    load() {
      return resource.load(key, includes);
    },
    reload() {
      return resource.refresh(key, includes);
    },
  };
}
