/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  isResourceKeyList,
  ResourceKeyList,
  resourceKeyList,
  NavNodeChildrenQuery as fake, ResourceKeyUtils, ICachedResourceMetadata
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { NavNodeInfoResource } from './NavNodeInfoResource';

// TODO: so much dirty
export interface NodePath {
  parentPath: string;
}

type NavNodeChildrenQuery = fake & NodePath;

interface INodeMetadata extends ICachedResourceMetadata {
  withDetails: boolean;
}

@injectable()
export class NavTreeResource extends CachedMapResource<string, string[]> {
  protected metadata: MetadataMap<string, INodeMetadata>;

  constructor(
    private graphQLService: GraphQLService,
    private navNodeInfoResource: NavNodeInfoResource
  ) {
    super(new Map());
    this.metadata = new MetadataMap<string, INodeMetadata>(() => ({
      outdated: true,
      loading: false,
      withDetails: false,
    }));
    this.onDataOutdated.addHandler(navNodeInfoResource.markOutdated.bind(navNodeInfoResource));
  }

  @action setDetails(keyObject: ResourceKey<string>, state: boolean): void {
    ResourceKeyUtils.forEach(keyObject, key => {
      const children = resourceKeyList(this.getNestedChildren(key));
      this.navNodeInfoResource.setDetails(children, state);

      ResourceKeyUtils.forEach(children, key => {
        const metadata = this.metadata.get(key);

        if (!metadata.withDetails) {
          metadata.outdated = true;
        }
        metadata.withDetails = state;
      });
    });
  }

  deleteInNode(key: string, value: string[]): void;
  deleteInNode(key: ResourceKeyList<string>, value: string[][]): void;
  deleteInNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const values = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const currentValue = this.data.get(key);

      if (currentValue) {
        this.data.set(key, currentValue.filter(value => !values.includes(value)));
        this.delete(resourceKeyList(values));
      }
    });

    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  unshiftToNode(key: string, value: string[]): void;
  unshiftToNode(key: ResourceKeyList<string>, value: string[][]): void;
  unshiftToNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const values = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const currentValue = this.data.get(key) || [];

      currentValue.unshift(...values);
      this.data.set(key, currentValue);
    });

    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  pushToNode(key: string, value: string[]): void;
  pushToNode(key: ResourceKeyList<string>, value: string[][]): void;
  pushToNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const values = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const currentValue = this.data.get(key) || [];

      currentValue.push(...values);
      this.data.set(key, currentValue);
    });

    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  set(key: string, value: string[]): void;
  set(key: ResourceKeyList<string>, value: string[][]): void;
  set(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const value = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const childrenToRemove = this.data.get(key)?.concat() || [];
      this.data.set(key, value);
      this.delete(resourceKeyList(childrenToRemove.filter(navNodeId => !value.includes(navNodeId))));
    });

    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  delete(key: string): void;
  delete(key: ResourceKeyList<string>): void;
  delete(key: ResourceKey<string>): void;
  delete(key: ResourceKey<string>): void {
    const items = this.getNestedChildren(key);
    if (items.length === 0) {
      return;
    }

    for (const id of items) {
      this.data.delete(id);
    }
    const allKeys = resourceKeyList(items);
    this.markUpdated(allKeys);
    this.onItemDelete.execute(allKeys);
    this.navNodeInfoResource.delete(resourceKeyList(items.filter(navNodeId => navNodeId !== key)));
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, string[]>> {
    if (isResourceKeyList(key)) {
      const values: NavNodeChildrenQuery[] = [];
      for (const nodePath of key.list) {
        values.push(await this.loadNodeChildren(nodePath));
      }
      this.setNavObject(values);
    } else {
      this.setNavObject(await this.loadNodeChildren(key));
    }

    return this.data;
  }

  getNestedChildren(navNode: ResourceKey<string>): string[] {
    const nestedChildren: string[] = [];
    let prevChildren: string[];
    if (isResourceKeyList(navNode)) {
      prevChildren = navNode.list.concat();
    } else {
      prevChildren = [navNode, ...(this.get(navNode)?.concat() || [])];
    }
    nestedChildren.push(...prevChildren);

    while (prevChildren.length) {
      const nodeKey = prevChildren.shift()!;
      const children = this.get(nodeKey) || [];
      prevChildren.push(...children);
      nestedChildren.push(...children);
    }

    return nestedChildren;
  }

  private setNavObject(data: NavNodeChildrenQuery | NavNodeChildrenQuery[]) {
    if (Array.isArray(data)) {
      for (const node of data) {
        const metadata = this.metadata.get(node.parentPath);

        this.setDetails(node.navNodeInfo.id, metadata.withDetails);
        this.setDetails(resourceKeyList(node.navNodeChildren.map(node => node.id)), metadata.withDetails);
      }

      this.navNodeInfoResource.set(
        resourceKeyList(data.map(data => data.parentPath)),
        data.map(data => this.navNodeInfoResource.navNodeInfoToNavNode(data.navNodeInfo)).flat()
      );

      this.navNodeInfoResource.set(
        resourceKeyList(data.map(data => data.navNodeChildren.map(node => node.id)).flat()),
        data.map(
          data => data.navNodeChildren.map(
            node => this.navNodeInfoResource.navNodeInfoToNavNode(node, data.parentPath)
          )
        ).flat()
      );

      this.set(
        resourceKeyList(data.map(data => data.parentPath)),
        data.map(data => data.navNodeChildren.map(node => node.id))
      );
    } else {
      const metadata = this.metadata.get(data.parentPath);

      this.setDetails(data.navNodeInfo.id, metadata.withDetails);
      this.setDetails(resourceKeyList(data.navNodeChildren.map(node => node.id)), metadata.withDetails);

      this.navNodeInfoResource.set(
        data.parentPath,
        this.navNodeInfoResource.navNodeInfoToNavNode(data.navNodeInfo)
      );

      this.navNodeInfoResource.set(
        resourceKeyList(data.navNodeChildren.map(node => node.id)),
        data.navNodeChildren.map(node => this.navNodeInfoResource.navNodeInfoToNavNode(node, data.parentPath))
      );

      this.set(data.parentPath, data.navNodeChildren.map(node => node.id));
    }
  }

  private async loadNodeChildren(parentPath: string) {
    const metadata = this.metadata.get(parentPath);
    const { navNodeChildren, navNodeInfo } = await this.graphQLService.sdk.navNodeChildren({
      parentPath,
      withDetails: metadata.withDetails,
    });

    return { navNodeChildren, navNodeInfo, parentPath };
  }
}
