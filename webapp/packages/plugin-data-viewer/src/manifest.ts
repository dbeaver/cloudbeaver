/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const dataViewerManifest: PluginManifest = {
  info: {
    name: 'Data Viewer Plugin',
  },

  providers: [
    () => import('./TableViewer/TableFooter/TableFooterMenu/RefreshAction/TableRefreshActionBootstrap.js').then(m => m.TableRefreshActionBootstrap),
    () => import('./DataViewerBootstrap.js').then(m => m.DataViewerBootstrap),
    () => import('./DataViewerTabService.js').then(m => m.DataViewerTabService),
    () => import('./DataViewerTableService.js').then(m => m.DataViewerTableService),
    () => import('./DataPresentationService.js').then(m => m.DataPresentationService),
    () => import('./TableViewer/TableViewerStorageService.js').then(m => m.TableViewerStorageService),
    () => import('./TableViewer/TableFooter/TableFooterMenu/TableFooterMenuService.js').then(m => m.TableFooterMenuService),
    () => import('./TableViewer/TableHeader/TableHeaderService.js').then(m => m.TableHeaderService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./TableViewer/ValuePanel/DataValuePanelService.js').then(m => m.DataValuePanelService),
    () => import('./ValuePanelPresentation/TextValue/TextValuePresentationService.js').then(m => m.TextValuePresentationService),
    () => import('./DataViewerDataChangeConfirmationService.js').then(m => m.DataViewerDataChangeConfirmationService),
    () => import('./ValuePanelPresentation/TextValue/TextValuePresentationBootstrap.js').then(m => m.TextValuePresentationBootstrap),
    () => import('./ValuePanelPresentation/ImageValue/ImageValuePresentationBootstrap.js').then(m => m.ImageValuePresentationBootstrap),
    () => import('./ValuePanelPresentation/BooleanValue/BooleanValuePresentationBootstrap.js').then(m => m.BooleanValuePresentationBootstrap),
    () => import('./TableViewer/ValuePanel/DataValuePanelBootstrap.js').then(m => m.DataValuePanelBootstrap),
    () => import('./DataViewerSettingsService.js').then(m => m.DataViewerSettingsService),
    () => import('./DataViewerService.js').then(m => m.DataViewerService),
    () => import('./ResultSet/ResultSetTableFooterMenuService.js').then(m => m.ResultSetTableFooterMenuService),
    () => import('./TableViewer/DataViewerViewService.js').then(m => m.DataViewerViewService),
    () =>
      import('./TableViewer/TableFooter/TableFooterMenu/FetchSizeAction/TableFetchSizeActionBootstrap.js').then(m => m.TableFetchSizeActionBootstrap),
  ],
};
