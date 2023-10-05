/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { combineITerableIterators, type DefaultValueGetter } from '@cloudbeaver/core-utils';

import type { ICachedResourceMetadata } from '../ICachedResourceMetadata';
import { isResourceAlias } from '../ResourceAlias';
import type { ResourceAliases } from '../ResourceAliases';
import type { ResourceKey, ResourceKeyFlat } from '../ResourceKey';
import { isResourceKeyList, ResourceKeyList } from '../ResourceKeyList';
import { ResourceKeyUtils } from '../ResourceKeyUtils';
import { ResourceMetadata } from '../ResourceMetadata';
import { createTreeNode } from './createTreeNode';
import { getTreeValue } from './getTreeValue';
import type { ICachedTreeElement } from './ICachedTreeElement';

export class CachedTreeMetadata<TValue, TMetadata extends ICachedResourceMetadata> extends ResourceMetadata<string, TMetadata> {
  protected getTree: () => ICachedTreeElement<TValue, TMetadata>;
  constructor(
    aliases: ResourceAliases<string>,
    private getDefaultMetadata: DefaultValueGetter<string, TMetadata>,
    isKeyEqual: (param: string, second: string) => boolean,
    getKeyRef: (key: string) => string,
    getTree: () => ICachedTreeElement<TValue, TMetadata>,
  ) {
    super(aliases, getDefaultMetadata, isKeyEqual, getKeyRef);
    this.getTree = getTree;
  }

  values(): IterableIterator<TMetadata> {
    return combineITerableIterators(this.metadata.values(), getAllMetadata(this.getTree()));
  }

  has(key: ResourceKey<string>): boolean {
    if (isResourceAlias(key)) {
      return super.has(key);
    }

    if (isResourceKeyList(key)) {
      return key.every(key => this.dataHasMetadata(key));
    }
    return this.dataHasMetadata(key);
  }

  /**
   * Use it instead of this.metadata.get
   * This method can be override
   */
  get(key: ResourceKeyFlat<string>): TMetadata;
  get(key: ResourceKeyList<string>): TMetadata[];
  get(key: ResourceKey<string>): TMetadata | TMetadata[];
  get(key: ResourceKey<string>): TMetadata | TMetadata[] {
    if (isResourceAlias(key)) {
      return super.get(key);
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
  delete(key: ResourceKey<string>): void {
    if (isResourceAlias(key)) {
      return super.delete(key);
    }
    ResourceKeyUtils.forEach(key, path => {
      const data = getTreeValue(this.getTree(), path);
      if (data) {
        data.metadata = this.getDefaultMetadata(path, this.metadata) as TMetadata;
      }
    });
  }

  createNode(path: string): ICachedTreeElement<TValue, TMetadata> {
    return createTreeNode(path, this.getDefaultMetadata(path, this.metadata));
  }

  protected dataGetMetadata(key: string): TMetadata {
    return getTreeValue(this.getTree(), key, this.createNode.bind(this)).metadata;
  }

  protected dataHasMetadata(key: string): boolean {
    return getTreeValue(this.getTree(), key) !== undefined;
  }
}

function* getAllMetadata<TValue, TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata>(
  data: ICachedTreeElement<TValue, TMetadata>,
): IterableIterator<TMetadata> {
  const elementsToScan = [data];

  while (elementsToScan.length) {
    const current = elementsToScan.shift()!;
    yield current.metadata;
    elementsToScan.push(...(Object.values(current.children).filter(Boolean) as any));
  }
}
