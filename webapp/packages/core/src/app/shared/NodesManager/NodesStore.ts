/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import {
  DatabaseObjectInfoWithId,
  NodeChildren,
  NodeWithParent,
} from './NodeWithParent';


export class NodesStore {
  @observable
  private nodesMap: Map<string, NodeWithParent> = new Map()
  @observable
  private databaseObjectInfoMap: Map<string, DatabaseObjectInfoWithId> = new Map()
  @observable
  private nodeChildrenMap: Map<string, NodeChildren> = new Map()

  getNode(nodeId: string): NodeWithParent | undefined {
    return this.nodesMap.get(nodeId);
  }

  getChildren(nodeId: string): NodeChildren | undefined {
    return this.nodeChildrenMap.get(nodeId);
  }

  getDatabaseObjectInfo(nodeId: string): DatabaseObjectInfoWithId | undefined {
    return this.databaseObjectInfoMap.get(nodeId);
  }

  @action
  updateNodeInfo(node: NodeWithParent) {
    this.nodesMap.set(node.id, node);

    const parent = this.nodeChildrenMap.get(node.parentId);

    if (!parent) {
      this.nodeChildrenMap.set(node.parentId, {
        children: [node.id],
        isLoaded: false,
      });
    } else if (!parent.children.includes(node.id)) {
      parent.children.push(node.id);
    }
  }

  @action
  updateDatabaseObjectInfo(databaseObjectInfo: DatabaseObjectInfoWithId) {
    this.databaseObjectInfoMap.set(databaseObjectInfo.id, databaseObjectInfo);
  }

  @action
  updateChildren(parentId: string, children: string[]) {
    this.nodeChildrenMap.set(parentId, {
      children,
      isLoaded: true,
    });
  }

  @action
  updateChildrenDatabaseObjectInfo(children: DatabaseObjectInfoWithId[]) {
    for (const child of children) {
      this.databaseObjectInfoMap.set(child.id, child);
    }
  }

  @action
  removeNode(nodeId: string) {
    const node = this.nodesMap.get(nodeId);
    if (!node) {
      return;
    }
    const parent = this.nodeChildrenMap.get(node.id);
    if (parent) {
      for (const children of parent.children) {
        this.removeNode(children);
      }
      this.nodeChildrenMap.delete(node.id);
    }
    this.databaseObjectInfoMap.delete(nodeId);
    this.nodesMap.delete(nodeId);
  }
}
