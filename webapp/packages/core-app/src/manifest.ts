/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { AppLocaleService } from './AppLocaleService';
import { AppScreenService } from './AppScreen/AppScreenService';
import { CoreSettingsService } from './CoreSettingsService';
import { ElementsTreeToolsMenuService } from './NavigationTree/ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService';
import { NavigationTreeBootstrap } from './NavigationTree/NavigationTreeBootstrap';
import { NavigationTreeService } from './NavigationTree/NavigationTreeService';
import { QuotasService } from './QuotasService';
import { NavigationTabsService } from './shared/NavigationTabs/NavigationTabsService';
import { ConnectionDialogsService } from './shared/NodesManager/ConnectionDialogsService';
import { DBObjectResource } from './shared/NodesManager/DBObjectResource';
import { NavNodeContextMenuService } from './shared/NodesManager/NavNodeContextMenuService';
import { NavNodeExtensionsService } from './shared/NodesManager/NavNodeExtensionsService';
import { NavNodeInfoResource } from './shared/NodesManager/NavNodeInfoResource';
import { NavNodeManagerService } from './shared/NodesManager/NavNodeManagerService';
import { NavNodeViewService } from './shared/NodesManager/NavNodeView/NavNodeViewService';
import { NavTreeResource } from './shared/NodesManager/NavTreeResource';
import { NavTreeSettingsService } from './shared/NodesManager/NavTreeSettingsService';
import { SessionExpiredDialogService } from './shared/SessionExpireDialog/SessionExpiredDialogService';
import { SessionExpireWarningDialogService } from './shared/SessionExpireWarningDialog/SessionExpireWarningDialogService';
import { SqlGeneratorsBootstrap } from './shared/SqlGenerators/SqlGeneratorsBootstrap';
import { SqlGeneratorsResource } from './shared/SqlGenerators/SqlGeneratorsResource';
import { LogViewerBootstrap } from './shared/ToolsPanel/LogViewer/LogViewerBootstrap';
import { LogViewerService } from './shared/ToolsPanel/LogViewer/LogViewerService';
import { LogViewerSettingsService } from './shared/ToolsPanel/LogViewer/LogViewerSettingsService';
import { ToolsPanelService } from './shared/ToolsPanel/ToolsPanelService';
import { AdministrationTopAppBarBootstrapService } from './TopNavBar/AdministrationTopAppBarBootstrapService';
import { ConnectionSchemaManagerBootstrap } from './TopNavBar/ConnectionSchemaManager/ConnectionSchemaManagerBootstrap';
import { ConnectionSchemaManagerService } from './TopNavBar/ConnectionSchemaManager/ConnectionSchemaManagerService';
import { MainMenuService } from './TopNavBar/MainMenu/MainMenuService';
import { TopNavService } from './TopNavBar/TopNavBarService';


export const coreAppManifest: PluginManifest = {
  info: {
    name: 'Core App',
  },

  providers: [
    ConnectionDialogsService,
    MainMenuService,
    NavigationTreeService,
    NavNodeManagerService,
    DBObjectResource,
    NavNodeViewService,
    NavNodeExtensionsService,
    NavNodeInfoResource,
    SqlGeneratorsBootstrap,
    SqlGeneratorsResource,
    NavTreeResource,
    ConnectionSchemaManagerService,
    NavigationTabsService,
    NavNodeContextMenuService,
    LogViewerService,
    LogViewerBootstrap,
    TopNavService,
    AppScreenService,
    CoreSettingsService,
    NavTreeSettingsService,
    LogViewerSettingsService,
    AdministrationTopAppBarBootstrapService,
    AppLocaleService,
    SessionExpiredDialogService,
    SessionExpireWarningDialogService,
    ConnectionSchemaManagerBootstrap,
    NavigationTreeBootstrap,
    ToolsPanelService,
    QuotasService,
    ElementsTreeToolsMenuService,
  ],
};
