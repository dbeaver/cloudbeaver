/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { TextValuePresentationBootstrap } from './DataPresentation/TextValuePresentation/TextValuePresentationBootstrap';
import { DataPresentationService } from './DataPresentationService';
import { DataViewerBootstrap } from './DataViewerBootstrap';
import { DataViewerTableService } from './DataViewerTableService';
import { DataViewerTabService } from './DataViewerTabService';
import { LocaleService } from './LocaleService';
import { TableFooterMenuService } from './TableViewer/TableFooter/TableFooterMenu/TableFooterMenuService';
import { TableHeaderService } from './TableViewer/TableHeader/TableHeaderService';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

export const manifest: PluginManifest = {
  info: {
    name: 'Data Viewer Plugin',
  },

  providers: [
    DataViewerBootstrap,
    DataViewerTabService,
    DataViewerTableService,
    DataPresentationService,
    TableViewerStorageService,
    TableFooterMenuService,
    TableHeaderService,
    LocaleService,
    TextValuePresentationBootstrap,
  ],
};
