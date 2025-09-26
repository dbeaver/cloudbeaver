/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { TextValuePresentationBootstrap } from './ValuePanelPresentation/TextValue/TextValuePresentationBootstrap.js';
import { TextValuePresentationService } from './ValuePanelPresentation/TextValue/TextValuePresentationService.js';
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
      .addSingleton(TextValuePresentationService)
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
      .addSingleton(DataViewerBootstrap);
  },
});
