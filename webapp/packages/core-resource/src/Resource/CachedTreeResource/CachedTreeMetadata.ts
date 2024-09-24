/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { combineITerableIterators, type DefaultValueGetter } from '@cloudbeaver/core-utils';

import type { ICachedResourceMetadata } from '../ICachedResourceMetadata.js';
import { isResourceAlias } from '../ResourceAlias.js';
import type { ResourceAliases } from '../ResourceAliases.js';
import type { ResourceKey, ResourceKeyFlat } from '../ResourceKey.js';
import { isResourceKeyList, ResourceKeyList } from '../ResourceKeyList.js';
import { ResourceKeyUtils } from '../ResourceKeyUtils.js';
import { ResourceMetadata } from '../ResourceMetadata.js';
import { createTreeNode } from './createTreeNode.js';
import { getTreeValue } from './getTreeValue.js';
import type { ICachedTreeElement } from './ICachedTreeElement.js';

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

  override values(): IterableIterator<TMetadata> {
    return combineITerableIterators(this.metadata.values(), getAllMetadata(this.getTree()));
  }

  override has(key: ResourceKey<string>): boolean {
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
  override get(key: ResourceKeyFlat<string>): TMetadata;
  override get(key: ResourceKeyList<string>): TMetadata[];
  override get(key: ResourceKey<string>): TMetadata | TMetadata[];
  override get(key: ResourceKey<string>): TMetadata | TMetadata[] {
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
  override delete(key: ResourceKey<string>): void {
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
