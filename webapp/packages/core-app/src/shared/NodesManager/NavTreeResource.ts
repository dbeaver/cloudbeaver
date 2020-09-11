/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  isResourceKeyList,
  ResourceKeyList,
  resourceKeyList,
  NavNodeChildrenQuery
} from '@cloudbeaver/core-sdk';

import { NavNodeInfoResource } from './NavNodeInfoResource';

@injectable()
export class NavTreeResource extends CachedMapResource<string, string[]> {
  constructor(
    private graphQLService: GraphQLService,
    private navNodeInfoResource: NavNodeInfoResource,
  ) {
    super(new Map());
    this.onDataOutdated.subscribe(navNodeInfoResource.markOutdated.bind(navNodeInfoResource));
  }

  deleteInNode(key: string, value: string[]): void;
  deleteInNode(key: ResourceKeyList<string>, value: string[][]): void;
  deleteInNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]) {
    if (isResourceKeyList(keyObject)) {
      for (let i = 0; i < keyObject.list.length; i++) {
        const key = keyObject.list[i];
        const values = (valueObject as string[][])[i];
        const currentValue = this.data.get(key);

        if (currentValue) {
          this.data.set(key, currentValue.filter(value => !values.includes(value)));
          this.delete(resourceKeyList(values));
        }
      }
    } else {
      const currentValue = this.data.get(keyObject);

      if (currentValue) {
        this.data.set(keyObject, currentValue.filter(value => !(valueObject as string[]).includes(value)));
        this.delete(resourceKeyList(valueObject as string[]));
      }
    }

    this.markUpdated(keyObject);
    this.itemAddSubject.next(keyObject);
  }

  unshiftToNode(key: string, value: string[]): void;
  unshiftToNode(key: ResourceKeyList<string>, value: string[][]): void;
  unshiftToNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]) {
    if (isResourceKeyList(keyObject)) {
      for (let i = 0; i < keyObject.list.length; i++) {
        const key = keyObject.list[i];
        const values = (valueObject as string[][])[i];
        const currentValue = this.data.get(key) || [];

        currentValue.unshift(...values);
        this.data.set(key, currentValue);
      }
    } else {
      const currentValue = this.data.get(keyObject) || [];

      currentValue.unshift(...valueObject as string[]);
      this.data.set(keyObject, currentValue);
    }

    this.markUpdated(keyObject);
    this.itemAddSubject.next(keyObject);
  }

  pushToNode(key: string, value: string[]): void;
  pushToNode(key: ResourceKeyList<string>, value: string[][]): void;
  pushToNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]) {
    if (isResourceKeyList(keyObject)) {
      for (let i = 0; i < keyObject.list.length; i++) {
        const key = keyObject.list[i];
        const values = (valueObject as string[][])[i];
        const currentValue = this.data.get(key) || [];

        currentValue.push(...values);
        this.data.set(key, currentValue);
      }
    } else {
      const currentValue = this.data.get(keyObject) || [];

      currentValue.push(...valueObject as string[]);
      this.data.set(keyObject, currentValue);
    }

    this.markUpdated(keyObject);
    this.itemAddSubject.next(keyObject);
  }

  set(key: string, value: string[]): void;
  set(key: ResourceKeyList<string>, value: string[][]): void;
  set(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    if (isResourceKeyList(keyObject)) {
      for (let i = 0; i < keyObject.list.length; i++) {
        const key = keyObject.list[i];
        const value = (valueObject as string[][])[i];
        const childrenToRemove = this.data.get(key)?.concat() || [];
        this.data.set(key, value);
        this.delete(resourceKeyList(childrenToRemove.filter(navNodeId => !value.includes(navNodeId))));
      }
    } else {
      const childrenToRemove = this.data.get(keyObject)?.concat() || [];
      this.data.set(keyObject, valueObject as string[]);
      this.delete(resourceKeyList(
        childrenToRemove.filter(navNodeId => !(valueObject as string[]).includes(navNodeId))
      ));
    }
    this.markUpdated(keyObject);
    this.itemAddSubject.next(keyObject);
  }

  delete(key: string): void;
  delete(key: ResourceKeyList<string>): void;
  delete(key: ResourceKey<string>): void;
  delete(key: ResourceKey<string>) {
    const items = this.getNestedChildren(key);
    if (items.length === 0) {
      return;
    }

    for (const id of items) {
      this.data.delete(id);
    }
    const allKeys = resourceKeyList(items);
    this.markUpdated(allKeys);
    this.itemDeleteSubject.next(allKeys);
    this.navNodeInfoResource.delete(resourceKeyList(items.filter(navNodeId => navNodeId !== key)));
  }

  protected async loader(key: ResourceKey<string>) {
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

  getNestedChildren(navNode: ResourceKey<string>) {
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
      this.navNodeInfoResource.set(
        resourceKeyList(data.map(data => data.navNodeInfo.id)),
        data.map(data => this.navNodeInfoResource.navNodeInfoToNavNode(data.navNodeInfo)).flat()
      );

      this.navNodeInfoResource.set(
        resourceKeyList(data.map(data => data.navNodeChildren.map(node => node.id)).flat()),
        data.map(
          data => data.navNodeChildren.map(
            node => this.navNodeInfoResource.navNodeInfoToNavNode(node, data.navNodeInfo.id)
          )
        ).flat()
      );

      this.set(
        resourceKeyList(data.map(data => data.navNodeInfo.id)),
        data.map(data => data.navNodeChildren.map(node => node.id))
      );
    } else {
      this.navNodeInfoResource.set(
        data.navNodeInfo.id,
        this.navNodeInfoResource.navNodeInfoToNavNode(data.navNodeInfo)
      );

      this.navNodeInfoResource.set(
        resourceKeyList(data.navNodeChildren.map(node => node.id)),
        data.navNodeChildren.map(node => this.navNodeInfoResource.navNodeInfoToNavNode(node, data.navNodeInfo.id))
      );

      this.set(data.navNodeInfo.id, data.navNodeChildren.map(node => node.id));
    }
  }

  private async loadNodeChildren(parentPath: string) {
    const { navNodeChildren, navNodeInfo } = await this.graphQLService.sdk.navNodeChildren({
      parentPath,
    });

    return { navNodeChildren, navNodeInfo };
  }
}
