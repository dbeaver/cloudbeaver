/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EObjectFeature, NavNodeInfoResource, NavNodeViewService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { DDLViewerFooterService } from './DdlViewer/DDLViewerFooterService';
import { DDLViewerTab } from './DdlViewer/DDLViewerTab';
import { DDLViewerTabPanel } from './DdlViewer/DDLViewerTabPanel';

const navNodeDDLId = 'object-viewer://ddl';

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
        if (folderId.startsWith(navNodeDDLId)) {
          return DDLViewerTab;
        }
        return undefined;
      },
      panel: (nodeId, folderId) => {
        if (folderId.startsWith(navNodeDDLId)) {
          return DDLViewerTabPanel;
        }
        return undefined;
      },
      transformer: (nodeId, children) => {
        const node = this.navNodeInfoResource.get(nodeId);

        if (!node?.objectFeatures?.includes(EObjectFeature.script)) {
          return children;
        }

        return [...children || [], navNodeDDLId];
      },
    });

    this.ddlViewerFooterService.register();
  }

  load(): void { }
}
