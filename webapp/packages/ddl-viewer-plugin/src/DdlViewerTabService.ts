/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EObjectFeature, NavigationTabsService, NodesManagerService } from '@dbeaver/core/app';
import { ITab } from '@dbeaver/core/blocks';
import { injectable } from '@dbeaver/core/di';

import { ddlViewer } from './DdlViewer/DdlViewer';
import { DdlViewerService } from './DdlViewerService';


@injectable()
export class DdlViewerTabService {

  constructor(private nodesManagerService: NodesManagerService,
              private navigationTabsService: NavigationTabsService,
              private ddlViewerService: DdlViewerService) {
  }

  buildTab(nodeId: string): ITab | null {
    const node = this.nodesManagerService.getNode(nodeId);
    const isDdlRequired = node?.object?.features?.includes(EObjectFeature.script);
    if (!isDdlRequired) {
      return null;
    }
    const ddlTab: ITab = {
      tabId: 'ddl-viewer',
      title: 'DDL',
      icon: 'sql-text',
      onActivate: () => this.activateDDLTab(nodeId),
      panel: () => ddlViewer(nodeId),
    };
    return ddlTab;
  }

  private activateDDLTab(nodeId: string) {
    const navigationTab = this.navigationTabsService.getTab(nodeId);

    if (!navigationTab) {
      throw new Error(`Tab ${nodeId} not found`);
    }
    // todo this must be refactored
    navigationTab.updateHandlerState({
      handlerId: navigationTab.handlerId,
      state: 'ddl-viewer',
    });
    this.ddlViewerService.loadDdlMetadata(nodeId);
  }
}
