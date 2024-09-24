/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { getPathParent, type ILoadableState, isContainsException } from '@cloudbeaver/core-utils';

import { CachedResource } from '../CachedResource.js';
import type { CachedResourceIncludeArgs, CachedResourceValueIncludes } from '../CachedResourceIncludes.js';
import type { ICachedResourceMetadata } from '../ICachedResourceMetadata.js';
import type { ResourceKey, ResourceKeySimple } from '../ResourceKey.js';
import { resourceKeyAlias, ResourceKeyAlias } from '../ResourceKeyAlias.js';
import { isResourceKeyList, resourceKeyList, ResourceKeyList } from '../ResourceKeyList.js';
import { ResourceKeyListAlias, resourceKeyListAlias, resourceKeyListAliasFactory } from '../ResourceKeyListAlias.js';
import { ResourceKeyUtils } from '../ResourceKeyUtils.js';
import { CachedTreeMetadata } from './CachedTreeMetadata.js';
import { CachedTreeUseTracker } from './CachedTreeUseTracker.js';
import { deleteTreeValue } from './deleteTreeValue.js';
import { getTreeParents } from './getTreeParents.js';
import { getTreeValue } from './getTreeValue.js';
import type { ICachedTreeData } from './ICachedTreeData.js';
import type { ICachedTreeElement } from './ICachedTreeElement.js';
import type { ICachedTreeMoveData } from './ICachedTreeMoveData.js';

export const CachedTreeRootValueKey = resourceKeyAlias('@cached-tree-resource/root-value');
export const CachedTreeRootChildrenKey = resourceKeyListAlias('@cached-tree-resource/root-children');
export const CachedTreeChildrenKey = resourceKeyListAliasFactory('@cached-tree-resource/children', (path: string) => ({ path }));
export const CachedTreeParentsKey = resourceKeyListAliasFactory('@cached-tree-resource/parents', (path: string) => ({ path }));

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
  readonly onMove: ISyncExecutor<ICachedTreeMoveData>;
  override readonly useTracker: CachedTreeUseTracker<TValue, TMetadata>;
  protected override metadata: CachedTreeMetadata<TValue, TMetadata>;

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
          }) as any as ICachedTreeData<TValue, TMetadata>),
      defaultIncludes,
    );

    this.metadata = new CachedTreeMetadata(
      this.aliases,
      this.getDefaultMetadata.bind(this),
      this.isKeyEqual.bind(this),
      this.getKeyRef.bind(this),
      () => this.data,
    );
    this.useTracker = new CachedTreeUseTracker(this.logger, this.aliases, this.metadata);

    this.onMove = new SyncExecutor();
    this.onItemUpdate = new SyncExecutor<ResourceKeySimple<string>>(null);
    this.onItemDelete = new SyncExecutor<ResourceKeySimple<string>>(null);

    this.aliases.add(CachedTreeRootValueKey, () => '');
    this.aliases.add(CachedTreeRootChildrenKey, () => resourceKeyList(this.dataGetKeyChildren('')));
    this.aliases.add(CachedTreeChildrenKey, key => resourceKeyList(this.dataGetKeyChildren(key.options.path)));
    this.aliases.add(CachedTreeParentsKey, key => resourceKeyList(this.dataGetKeyParents(key.options.path)));

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
        this.logger.group(`outdate - ${resource.logger.getName()}`);

        if (map) {
          param = map(param) as any as string;
        }

        resource.delete(param as any as string);
      } finally {
        this.logger.groupEnd();
      }
    });

    return this;
  }

  has(key: ResourceKey<string>): boolean {
    if (this.aliases.isAlias(key) && (!this.metadata.has(key) || this.isLoaded(key))) {
      return false;
    }

    key = this.aliases.transformToKey(key);
    return ResourceKeyUtils.every(key, key => this.dataHas(this.getKeyRef(key)));
  }

  get(key: string | ResourceKeyAlias<string, any>): TValue | undefined;
  get(key: ResourceKeyList<string> | ResourceKeyListAlias<string, any>): Array<TValue | undefined>;
  get(key: ResourceKey<string>): Array<TValue | undefined> | TValue | undefined;
  get(key: ResourceKey<string>): Array<TValue | undefined> | TValue | undefined {
    key = this.aliases.transformToKey(key);
    return ResourceKeyUtils.map(key, key => this.dataGetValue(this.getKeyRef(key)));
  }

  getParentsId(key: string): string[] {
    return this.dataGetKeyParents(key);
  }

  set(key: string | ResourceKeyAlias<string, any>, value: TValue): void;
  set(key: ResourceKeyList<string> | ResourceKeyListAlias<string, any>, value: TValue[]): void;
  set(key: ResourceKey<string>, value: TValue | TValue[]): void;
  set(originalKey: ResourceKey<string>, value: TValue | TValue[]): void {
    if (this.aliases.isAlias(originalKey, CachedTreeChildrenKey) || this.aliases.isAlias(originalKey, CachedTreeRootChildrenKey)) {
      throw new Error("Children can't be set with alias");
    }
    const key = this.aliases.transformToKey(originalKey);

    if (isResourceKeyList(key)) {
      if (key.length === 0) {
        return;
      }

      for (let i = 0; i < key.length; i++) {
        this.dataSet(this.getKeyRef(key[i]!), (value as TValue[])[i]!);
      }
    } else {
      this.dataSet(this.getKeyRef(key), value as TValue);
    }
    this.markUpdated(key);
    this.markLoaded(key);
    this.cleanError(key);

    const parents = ResourceKeyUtils.mapArray(key, getPathParent);
    this.onItemUpdate.execute(ResourceKeyUtils.join(...parents, key));
  }

  protected moveSync(from: string, to: string, node: TValue): TValue {
    // order is matter, we creating new node
    this.set(to, node);
    // and then we change links
    this.onMove.execute({ from, to });
    // and then we delete old node
    this.delete(from);

    return this.get(to)!;
  }

  delete(originalKey: ResourceKey<string>): void {
    const key = this.aliases.transformToKey(originalKey);

    if (isResourceKeyList(key) && key.length === 0) {
      return;
    }

    this.onItemUpdate.execute(ResourceKeyUtils.mapKey(key, getPathParent));
    this.onItemDelete.execute(key);
    ResourceKeyUtils.forEach(key, key => {
      this.dataDelete(this.getKeyRef(key));
    });
    this.metadata.delete(originalKey);
    // rewrites pending outdate
    // this.markUpdated(key);
  }

  override async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: string | ResourceKeyAlias<string, any>,
    includes?: T,
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  override async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKeyList<string> | ResourceKeyListAlias<string, any> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  override async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: ResourceKey<string>,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  override async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKey<string> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    if (key === undefined) {
      key = CachedTreeRootChildrenKey;
    }
    await this.loadData(key, true, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  override async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: string | ResourceKeyAlias<string, any>,
    includes?: T,
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  override async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKeyList<string> | ResourceKeyListAlias<string, any> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  override async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: ResourceKey<string>,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  override async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
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
    return getTreeValue(this.data, key)?.value !== undefined;
  }

  /**
   * Use it instead of this.data.has
   * This method can be override
   */
  protected dataGet(key: string): ICachedTreeElement<TValue, TMetadata> | undefined {
    return getTreeValue(this.data, key);
  }

  /**
   * Use it instead of this.data.get
   * This method can be override
   */
  protected dataGetValueChildren(key: string): TValue[] {
    return Object.values(getTreeValue(this.data, key)?.children || {})
      .map(info => info?.value)
      .filter((value): value is TValue => value !== undefined);
  }

  /**
   * Use it instead of this.data.get
   * This method can be override
   */
  protected dataGetKeyChildren(key: string): string[] {
    return Object.values(getTreeValue(this.data, key)?.children || {})
      .map(info => info?.key)
      .filter((key): key is string => key !== undefined);
  }

  /**
   * Use it to get parent ids
   * This method can be override
   */
  protected dataGetKeyParents(key: string): string[] {
    return getTreeParents(this.data, key)
      .map(info => info.key)
      .filter((key): key is string => key !== undefined);
  }

  /**
   * Use it instead of this.data.get
   * This method can be override
   */
  protected dataGetValue(key: string): TValue | undefined {
    return getTreeValue(this.data, key)?.value;
  }

  /**
   * Use it instead of this.data.set
   * This method can be override
   */
  protected dataSet(key: string, value: TValue): void {
    const data = getTreeValue(this.data, key, path => this.metadata.createNode(path));
    data.key = key;
    data.value = value;
  }

  /**
   * Use it instead of this.data.delete
   * This method can be override
   */
  protected dataDelete(key: string): void {
    deleteTreeValue(this.data, key);
  }

  /**
   * Use it instead of this.data.clear
   * This method can be override
   */
  protected override resetDataToDefault(): void {
    this.data = this.metadata.createNode('');
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
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
      return resource.isOutdated(key, includes);
    },
    async load() {
      await resource.load(key, includes);
    },
    async reload() {
      await resource.refresh(key, includes);
    },
  };
}
