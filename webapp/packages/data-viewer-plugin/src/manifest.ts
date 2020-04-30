/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IServiceInjector, PluginManifest } from '@dbeaver/core/di';

import { DataViewerBootstrap } from './DataViewerBootstrap';
import { DataViewerTableService } from './DataViewerTableService';
import { DataViewerTabService } from './DataViewerTabService';
import { TableFooterMenuService } from './TableViewer/TableFooter/TableFooterMenu/TableFooterMenuService';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

export const manifest: PluginManifest = {
  info: {
    name: 'Data Viewer Plugin',
  },

  providers: [
    DataViewerTabService,
    DataViewerTableService,
    TableViewerStorageService,
    TableFooterMenuService,
  ],

  async initialize(services: IServiceInjector) {
    services
      .resolveServiceByClass(DataViewerBootstrap)
      .bootstrap();
  },
};
