/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { DataPresentationService } from './DataPresentationService.js';
import { DataViewerBootstrap } from './DataViewerBootstrap.js';
import { DataViewerDataChangeConfirmationService } from './DataViewerDataChangeConfirmationService.js';
import { DataViewerService } from './DataViewerService.js';
import { DataViewerSettingsService } from './DataViewerSettingsService.js';
import { DataViewerTabService } from './DataViewerTabService.js';
import { DataViewerTableService } from './DataViewerTableService.js';
import { DatabaseDataConstraintAction } from './DatabaseDataModel/Actions/DatabaseDataConstraintAction.js';
import { DocumentDataAction } from './DatabaseDataModel/Actions/Document/DocumentDataAction.js';
import { DocumentEditAction } from './DatabaseDataModel/Actions/Document/DocumentEditAction.js';
import { DatabaseMetadataAction } from './DatabaseDataModel/Actions/General/DatabaseMetadataAction.js';
import { DatabaseRefreshAction } from './DatabaseDataModel/Actions/General/DatabaseRefreshAction.js';
import { GridEditAction } from './DatabaseDataModel/Actions/Grid/GridEditAction.js';
import { GridHistoryAction } from './DatabaseDataModel/Actions/Grid/GridHistoryAction.js';
import { GridViewAction } from './DatabaseDataModel/Actions/Grid/GridViewAction.js';
import { ResultSetCacheAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetCacheAction.js';
import { ResultSetDataAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetDataAction.js';
import { ResultSetDataContentAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import { ResultSetEditAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetEditAction.js';
import { ResultSetFormatAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import { ResultSetReferencesAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetReferencesAction.js';
import { ResultSetSelectAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction.js';
import { ResultSetViewAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetViewAction.js';
import { DatabaseDataActions } from './DatabaseDataModel/DatabaseDataActions.js';
import { LocaleService } from './LocaleService.js';
import { ResultSetTableFooterMenuService } from './ResultSet/ResultSetTableFooterMenuService.js';
import { DataViewerViewService } from './TableViewer/DataViewerViewService.js';
import { TableFetchSizeActionBootstrap } from './TableViewer/TableFooter/TableFooterMenu/FetchSizeAction/TableFetchSizeActionBootstrap.js';
import { TableRefreshActionBootstrap } from './TableViewer/TableFooter/TableFooterMenu/RefreshAction/TableRefreshActionBootstrap.js';
import { TableFooterMenuService } from './TableViewer/TableFooter/TableFooterMenu/TableFooterMenuService.js';
import { TableHeaderService } from './TableViewer/TableHeader/TableHeaderService.js';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService.js';
import { DataValuePanelBootstrap } from './TableViewer/ValuePanel/DataValuePanelBootstrap.js';
import { DataValuePanelService } from './TableViewer/ValuePanel/DataValuePanelService.js';
import { BooleanValuePresentationBootstrap } from './ValuePanelPresentation/BooleanValue/BooleanValuePresentationBootstrap.js';
import { ImageValuePresentationBootstrap } from './ValuePanelPresentation/ImageValue/ImageValuePresentationBootstrap.js';
import { TextValuePresentationBootstrap } from './ValuePanelPresentation/TextValue/TextValuePresentationBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-viewer',

  services: () => [
    DataPresentationService,
    TextValuePresentationBootstrap,
    ImageValuePresentationBootstrap,
    BooleanValuePresentationBootstrap,
    TableViewerStorageService,
    DataValuePanelService,
    DataValuePanelBootstrap,
    TableHeaderService,
    TableFooterMenuService,
    TableRefreshActionBootstrap,
    TableFetchSizeActionBootstrap,
    DataViewerViewService,
    ResultSetTableFooterMenuService,
    DataViewerTabService,
    DataViewerTableService,
    DataViewerSettingsService,
    DataViewerService,
    DataViewerDataChangeConfirmationService,
    DataViewerBootstrap,
  ],
  scoped: () => [
    DatabaseDataActions,
    DatabaseMetadataAction,
    DatabaseRefreshAction,
    DocumentDataAction,
    DocumentEditAction,
    GridEditAction,
    GridViewAction,
    GridHistoryAction,
    ResultSetDataAction,
    ResultSetEditAction,
    ResultSetViewAction,
    ResultSetSelectAction,
    ResultSetFormatAction,
    ResultSetCacheAction,
    DatabaseDataConstraintAction,
    ResultSetDataContentAction,
    ResultSetReferencesAction,
  ],
  bootstraps: () => [
    BooleanValuePresentationBootstrap,
    DataValuePanelBootstrap,
    DataViewerBootstrap,
    ImageValuePresentationBootstrap,
    LocaleService,
    TableFetchSizeActionBootstrap,
    TableHeaderService,
    TableRefreshActionBootstrap,
    TextValuePresentationBootstrap,
  ],
});
