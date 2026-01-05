/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, conditional, Dependency, external, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { TextValuePresentationBootstrap } from './ValuePanelPresentation/TextValue/TextValuePresentationBootstrap.js';
import { ImageValuePresentationBootstrap } from './ValuePanelPresentation/ImageValue/ImageValuePresentationBootstrap.js';
import { BooleanValuePresentationBootstrap } from './ValuePanelPresentation/BooleanValue/BooleanValuePresentationBootstrap.js';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService.js';
import { DataValuePanelService } from './TableViewer/ValuePanel/DataValuePanelService.js';
import { DataValuePanelBootstrap } from './TableViewer/ValuePanel/DataValuePanelBootstrap.js';
import { TableHeaderService } from './TableViewer/TableHeader/TableHeaderService.js';
import { TableFooterMenuService } from './TableViewer/TableFooter/TableFooterMenu/TableFooterMenuService.js';
import { TableRefreshActionBootstrap } from './TableViewer/TableFooter/TableFooterMenu/RefreshAction/TableRefreshActionBootstrap.js';
import { TableFetchSizeActionBootstrap } from './TableViewer/TableFooter/TableFooterMenu/FetchSizeAction/TableFetchSizeActionBootstrap.js';
import { DataViewerViewService } from './TableViewer/DataViewerViewService.js';
import { ResultSetTableFooterMenuService } from './ResultSet/ResultSetTableFooterMenuService.js';
import { LocaleService } from './LocaleService.js';
import { DataViewerTabService } from './DataViewerTabService.js';
import { DataViewerTableService } from './DataViewerTableService.js';
import { DataViewerSettingsService } from './DataViewerSettingsService.js';
import { DataViewerService } from './DataViewerService.js';
import { DataViewerDataChangeConfirmationService } from './DataViewerDataChangeConfirmationService.js';
import { DataViewerBootstrap } from './DataViewerBootstrap.js';
import { DataPresentationService } from './DataPresentationService.js';
import { IDatabaseDataSource } from './DatabaseDataModel/IDatabaseDataSource.js';
import { DatabaseDataActions } from './DatabaseDataModel/DatabaseDataActions.js';
import { DatabaseMetadataAction } from './DatabaseDataModel/Actions/General/DatabaseMetadataAction.js';
import { DatabaseRefreshAction } from './DatabaseDataModel/Actions/General/DatabaseRefreshAction.js';
import { DocumentDataAction } from './DatabaseDataModel/Actions/Document/DocumentDataAction.js';
import { IDatabaseDataActions } from './DatabaseDataModel/IDatabaseDataActions.js';
import { IDatabaseDataSelectAction } from './DatabaseDataModel/Actions/IDatabaseDataSelectAction.js';
import { IDatabaseDataEditAction } from './DatabaseDataModel/Actions/IDatabaseDataEditAction.js';
import { IDatabaseDataResultAction } from './DatabaseDataModel/Actions/IDatabaseDataResultAction.js';
import { DocumentEditAction } from './DatabaseDataModel/Actions/Document/DocumentEditAction.js';
import { GridEditAction } from './DatabaseDataModel/Actions/Grid/GridEditAction.js';
import { GridViewAction } from './DatabaseDataModel/Actions/Grid/GridViewAction.js';
import { IDatabaseDataViewAction } from './DatabaseDataModel/Actions/IDatabaseDataViewAction.js';
import { ResultSetDataAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetDataAction.js';
import { ResultSetEditAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetEditAction.js';
import { ResultSetViewAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetViewAction.js';
import { ResultSetSelectAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction.js';
import { IDatabaseDataFormatAction } from './DatabaseDataModel/Actions/IDatabaseDataFormatAction.js';
import { ResultSetFormatAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import { IDatabaseDataMetadataAction } from './DatabaseDataModel/Actions/IDatabaseDataMetadataAction.js';
import { ResultSetDataContentAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import { IDatabaseDataCacheAction } from './DatabaseDataModel/Actions/IDatabaseDataCacheAction.js';
import { ResultSetCacheAction } from './DatabaseDataModel/Actions/ResultSet/ResultSetCacheAction.js';
import { IDatabaseDataResult } from './DatabaseDataModel/IDatabaseDataResult.js';
import { IDatabaseDataConstraintAction } from './DatabaseDataModel/Actions/IDatabaseDataConstraintAction.js';
import { DatabaseDataConstraintAction } from './DatabaseDataModel/Actions/DatabaseDataConstraintAction.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-viewer',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(BooleanValuePresentationBootstrap))
      .addSingleton(Bootstrap, proxy(DataValuePanelBootstrap))
      .addSingleton(Bootstrap, proxy(DataViewerBootstrap))
      .addSingleton(Bootstrap, proxy(ImageValuePresentationBootstrap))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(TableFetchSizeActionBootstrap))
      .addSingleton(Bootstrap, proxy(TableHeaderService))
      .addSingleton(Bootstrap, proxy(TableRefreshActionBootstrap))
      .addSingleton(Bootstrap, proxy(TextValuePresentationBootstrap))
      .addSingleton(Dependency, proxy(DataViewerSettingsService))
      .addSingleton(DataPresentationService)
      .addSingleton(TextValuePresentationBootstrap)
      .addSingleton(ImageValuePresentationBootstrap)
      .addSingleton(BooleanValuePresentationBootstrap)
      .addSingleton(TableViewerStorageService)
      .addSingleton(DataValuePanelService)
      .addSingleton(DataValuePanelBootstrap)
      .addSingleton(TableHeaderService)
      .addSingleton(TableFooterMenuService)
      .addSingleton(TableRefreshActionBootstrap)
      .addSingleton(TableFetchSizeActionBootstrap)
      .addSingleton(DataViewerViewService)
      .addSingleton(ResultSetTableFooterMenuService)
      .addSingleton(DataViewerTabService)
      .addSingleton(DataViewerTableService)
      .addSingleton(DataViewerSettingsService)
      .addSingleton(DataViewerService)
      .addSingleton(DataViewerDataChangeConfirmationService)
      .addSingleton(DataViewerBootstrap)

      .addScoped(IDatabaseDataActions, DatabaseDataActions)
      .addTransient(IDatabaseDataSource, external())

      .addTransient(IDatabaseDataResult, external())
      .addScoped(IDatabaseDataMetadataAction, DatabaseMetadataAction)
      .addScoped(DatabaseRefreshAction)

      .addScoped(DocumentDataAction)
      .addScoped(DocumentEditAction)

      .addScoped(GridEditAction)
      .addScoped(GridViewAction)

      .addScoped(ResultSetDataAction)
      .addScoped(ResultSetEditAction)
      .addScoped(ResultSetViewAction)
      .addScoped(ResultSetSelectAction)
      .addScoped(ResultSetFormatAction)
      .addScoped(ResultSetCacheAction)
      .addScoped(DatabaseDataConstraintAction)
      .addScoped(ResultSetDataContentAction)

      .addScoped(
        IDatabaseDataResultAction,
        conditional(actions => proxy(actions.actions.getConstructor(IDatabaseDataResultAction)), IDatabaseDataSource),
      )
      .addScoped(
        IDatabaseDataEditAction,
        conditional(actions => proxy(actions.actions.getConstructor(IDatabaseDataEditAction)), IDatabaseDataSource),
      )
      .addScoped(
        IDatabaseDataViewAction,
        conditional(actions => proxy(actions.actions.getConstructor(IDatabaseDataViewAction)), IDatabaseDataSource),
      )
      .addScoped(
        IDatabaseDataFormatAction,
        conditional(actions => proxy(actions.actions.getConstructor(IDatabaseDataFormatAction)), IDatabaseDataSource),
      )
      .addScoped(
        IDatabaseDataCacheAction,
        conditional(actions => proxy(actions.actions.getConstructor(IDatabaseDataCacheAction)), IDatabaseDataSource),
      )
      .addScoped(
        IDatabaseDataSelectAction,
        conditional(actions => proxy(actions.actions.getConstructor(IDatabaseDataSelectAction)), IDatabaseDataSource),
      )
      .addScoped(
        IDatabaseDataConstraintAction,
        conditional(actions => proxy(actions.actions.getConstructor(IDatabaseDataConstraintAction)), IDatabaseDataSource),
      );
  },
});
