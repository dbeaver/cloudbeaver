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
    () => import('./DataViewerBootstrap').then(m => m.DataViewerBootstrap),
    () => import('./DataViewerTabService').then(m => m.DataViewerTabService),
    () => import('./DataViewerTableService').then(m => m.DataViewerTableService),
    () => import('./DataPresentationService').then(m => m.DataPresentationService),
    () => import('./TableViewer/TableViewerStorageService').then(m => m.TableViewerStorageService),
    () => import('./TableViewer/TableFooter/TableFooterMenu/TableFooterMenuService').then(m => m.TableFooterMenuService),
    () => import('./TableViewer/TableHeader/TableHeaderService').then(m => m.TableHeaderService),
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./TableViewer/ValuePanel/DataValuePanelService').then(m => m.DataValuePanelService),
    () => import('./ValuePanelPresentation/TextValue/TextValuePresentationService').then(m => m.TextValuePresentationService),
    () => import('./DataViewerDataChangeConfirmationService').then(m => m.DataViewerDataChangeConfirmationService),
    () => import('./ValuePanelPresentation/TextValue/TextValuePresentationBootstrap').then(m => m.TextValuePresentationBootstrap),
    () => import('./ValuePanelPresentation/ImageValue/ImageValuePresentationBootstrap').then(m => m.ImageValuePresentationBootstrap),
    () => import('./ValuePanelPresentation/BooleanValue/BooleanValuePresentationBootstrap').then(m => m.BooleanValuePresentationBootstrap),
    () => import('./TableViewer/ValuePanel/DataValuePanelBootstrap').then(m => m.DataValuePanelBootstrap),
    () => import('./DataViewerSettingsService').then(m => m.DataViewerSettingsService),
    () => import('./DataViewerService').then(m => m.DataViewerService),
    () => import('./ResultSet/ResultSetTableFooterMenuService').then(m => m.ResultSetTableFooterMenuService),
    () => import('./TableViewer/DataViewerViewService').then(m => m.DataViewerViewService),
  ],
};
