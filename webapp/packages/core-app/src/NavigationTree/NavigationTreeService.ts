/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';

import { ConnectionAuthService } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';
import type { IActiveView } from '@cloudbeaver/core-view';

import { CoreSettingsService } from '../CoreSettingsService';
import { EObjectFeature } from '../shared/NodesManager/EObjectFeature';
import { NavNodeExtensionsService } from '../shared/NodesManager/NavNodeExtensionsService';
import { NavNodeInfoResource, ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeInfoResource';
import { NavNodeManagerService } from '../shared/NodesManager/NavNodeManagerService';
import { NavTreeResource } from '../shared/NodesManager/NavTreeResource';
import { NodeManagerUtils } from '../shared/NodesManager/NodeManagerUtils';

export interface INavigationNodeMetadata {
  selected: boolean;
  expanded: boolean;
}

export interface INavigationNodeSelectionData {
  id: string;
  selected: boolean;
}

@injectable()
export class NavigationTreeService {
  readonly navigationTreeMetadata: MetadataMap<string, INavigationNodeMetadata>;
  readonly nodeSelectionTask: IExecutor<INavigationNodeSelectionData>;

  constructor(
    private navNodeManagerService: NavNodeManagerService,
    private notificationService: NotificationService,
    private connectionAuthService: ConnectionAuthService,
    private navNodeExtensionsService: NavNodeExtensionsService,
    private navTreeResource: NavTreeResource,
    private coreSettingsService: CoreSettingsService,
    private navNodeInfoResource: NavNodeInfoResource
  ) {
    makeObservable<NavigationTreeService, 'unselectAll'>(this, {
      unselectAll: action,
    });

    this.nodeSelectionTask = new Executor();
    this.navigationTreeMetadata = new MetadataMap<string, INavigationNodeMetadata>(() => ({
      selected: false,
      expanded: false,
    }));
    this.getView = this.getView.bind(this);

    this.navNodeInfoResource.onItemDelete.addHandler(key => {
      ResourceKeyUtils.forEach(key, key => {
        this.navigationTreeMetadata.delete(key);
      });
    });
    this.navTreeResource.onItemDelete.addHandler(key => {
      ResourceKeyUtils.forEach(key, key => {
        this.expandNode(key, false);
      });
    });
  }

  getChildren(id: string): string[] | undefined {
    const children = this.navTreeResource.get(id);

    if (children) {
      return children.slice(0, this.navTreeResource.childrenLimit);
    }

    return children;
  }

  async navToNode(id: string, parentId: string): Promise<void> {
    await this.navNodeManagerService.navToNode(id, parentId);
  }

  async loadNestedNodes(id = ROOT_NODE_PATH): Promise<boolean> {
    try {
      if (this.isConnectionNode(id) && !(await this.tryInitConnection(id))) {
        return false;
      }
      await this.navNodeManagerService.loadTree(id);
      return true;
    } catch (exception) {
      this.notificationService.logException(exception);
    }
    return false;
  }

  async selectNode(id: string, multiple?: boolean): Promise<void> {
    if (!multiple) {
      await this.unselectAll();
    }

    const metadata = this.navigationTreeMetadata.get(id);
    metadata.selected = !metadata.selected;

    await this.nodeSelectionTask.execute({
      id,
      selected: metadata.selected,
    });
  }

  isNodeExpanded(navNodeId: string): boolean {
    return this.navigationTreeMetadata.get(navNodeId).expanded;
  }

  isNodeSelected(navNodeId: string): boolean {
    return this.navigationTreeMetadata.get(navNodeId).selected;
  }

  expandNode(navNodeId: string, state: boolean): void {
    const metadata = this.navigationTreeMetadata.get(navNodeId);
    metadata.expanded = state;
  }

  getView(): IActiveView<string> | null {
    const element = Array.from(this.navigationTreeMetadata).find(([key, metadata]) => metadata.selected);

    if (!element) {
      return null;
    }

    return {
      context: element[0],
      extensions: this.navNodeExtensionsService.extensions,
    };
  }

  private async unselectAll() {
    for (const [id, metadata] of this.navigationTreeMetadata) {
      metadata.selected = false;
      await this.nodeSelectionTask.execute({
        id,
        selected: false,
      });
    }
  }

  private isConnectionNode(navNodeId: string) {
    const node = this.navNodeManagerService.getNode(navNodeId);
    return node?.objectFeatures.includes(EObjectFeature.dataSource);
  }

  private async tryInitConnection(navNodeId: string): Promise<boolean> {
    const connection = await this.connectionAuthService.auth(
      NodeManagerUtils.connectionNodeIdToConnectionId(navNodeId)
    );

    return connection?.connected || false;
  }
}
