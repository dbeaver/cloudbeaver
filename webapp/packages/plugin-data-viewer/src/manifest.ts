/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { DataPresentationService } from './DataPresentationService';
import { DataViewerBootstrap } from './DataViewerBootstrap';
import { DataViewerDataChangeConfirmationService } from './DataViewerDataChangeConfirmationService';
import { DataViewerService } from './DataViewerService';
import { DataViewerSettingsService } from './DataViewerSettingsService';
import { DataViewerTableService } from './DataViewerTableService';
import { DataViewerTabService } from './DataViewerTabService';
import { LocaleService } from './LocaleService';
import { ScriptPreviewService } from './ScriptPreview/ScriptPreviewService';
import { TableFooterMenuService } from './TableViewer/TableFooter/TableFooterMenu/TableFooterMenuService';
import { TableHeaderService } from './TableViewer/TableHeader/TableHeaderService';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';
import { DataValuePanelBootstrap } from './TableViewer/ValuePanel/DataValuePanelBootstrap';
import { DataValuePanelService } from './TableViewer/ValuePanel/DataValuePanelService';
import { BooleanValuePresentationBootstrap } from './ValuePanelPresentation/BooleanValue/BooleanValuePresentationBootstrap';
import { ImageValuePresentationBootstrap } from './ValuePanelPresentation/ImageValue/ImageValuePresentationBootstrap';
import { TextValuePresentationBootstrap } from './ValuePanelPresentation/TextValue/TextValuePresentationBootstrap';
import { TextValuePresentationService } from './ValuePanelPresentation/TextValue/TextValuePresentationService';

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
    DataValuePanelService,
    TextValuePresentationService,
    ScriptPreviewService,
    DataViewerDataChangeConfirmationService,
    TextValuePresentationBootstrap,
    ImageValuePresentationBootstrap,
    BooleanValuePresentationBootstrap,
    DataValuePanelBootstrap,
    DataViewerSettingsService,
    DataViewerService,
  ],
};
