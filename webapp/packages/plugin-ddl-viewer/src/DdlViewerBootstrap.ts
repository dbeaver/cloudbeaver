/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NavNodeInfoResource, EObjectFeature } from '@cloudbeaver/core-navigation-tree';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import { DDLViewerFooterService } from './DdlViewer/DDLViewerFooterService';
import { DDLViewerTab } from './DdlViewer/DDLViewerTab';
import { DDLViewerTabPanel } from './DdlViewer/DDLViewerTabPanel';
import { ExtendedDDLViewerTabPanel } from './ExtendedDDLViewer/ExtendedDDLViewerTabPanel';
import { NAV_NODE_DDL_ID } from './NAV_NODE_DDL_ID';
import { NAV_NODE_EXTENDED_DDL_ID } from './NAV_NODE_EXTENDED_DDL_ID';

@injectable()
export class DdlViewerBootstrap extends Bootstrap {
  constructor(
    private readonly navNodeViewService: NavNodeViewService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly ddlViewerFooterService: DDLViewerFooterService
  ) {
    super();
  }

  register(): void {
    this.navNodeViewService.addTransform({
      tab: (nodeId, folderId) => {
        if (folderId.startsWith(NAV_NODE_DDL_ID)) {
          return DDLViewerTab;
        }

        return undefined;
      },
      panel: (nodeId, folderId) => {
        if (folderId.startsWith(NAV_NODE_DDL_ID)) {
          return DDLViewerTabPanel;
        }

        return undefined;
      },
      transformer: (nodeId, children) => {
        const node = this.navNodeInfoResource.get(nodeId);

        if (node?.objectFeatures.includes(EObjectFeature.script)) {
          return [...children || [], NAV_NODE_DDL_ID];
        }

        return children;
      },
    });

    this.navNodeViewService.addTransform({
      tab: (nodeId, folderId) => {
        if (folderId.startsWith(NAV_NODE_EXTENDED_DDL_ID)) {
          return DDLViewerTab;
        }

        return undefined;
      },
      panel: (nodeId, folderId) => {
        if (folderId.startsWith(NAV_NODE_EXTENDED_DDL_ID)) {
          return ExtendedDDLViewerTabPanel;
        }

        return undefined;
      },
      transformer: (nodeId, children) => {
        const node = this.navNodeInfoResource.get(nodeId);

        if (node?.objectFeatures.includes(EObjectFeature.scriptExtended)) {
          return [...children || [], NAV_NODE_EXTENDED_DDL_ID];
        }

        return children;
      },
    });

    this.ddlViewerFooterService.register();
  }

  load(): void { }
}
