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
import { QuotasService } from './QuotasService';
import { NavigationTabsService } from './shared/NavigationTabs/NavigationTabsService';
import { SessionExpiredDialogService } from './shared/SessionExpireDialog/SessionExpiredDialogService';
import { SessionExpireWarningDialogService } from './shared/SessionExpireWarningDialog/SessionExpireWarningDialogService';
import { SqlGeneratorsBootstrap } from './shared/SqlGenerators/SqlGeneratorsBootstrap';
import { SqlGeneratorsResource } from './shared/SqlGenerators/SqlGeneratorsResource';
import { ToolsPanelService } from './shared/ToolsPanel/ToolsPanelService';
import { AdministrationTopAppBarBootstrapService } from './TopNavBar/AdministrationTopAppBarBootstrapService';
import { MainMenuService } from './TopNavBar/MainMenu/MainMenuService';
import { TopNavService } from './TopNavBar/TopNavBarService';


export const coreAppManifest: PluginManifest = {
  info: {
    name: 'Core App',
  },

  providers: [
    MainMenuService,
    SqlGeneratorsBootstrap,
    SqlGeneratorsResource,
    NavigationTabsService,
    TopNavService,
    AppScreenService,
    CoreSettingsService,
    AdministrationTopAppBarBootstrapService,
    AppLocaleService,
    SessionExpiredDialogService,
    SessionExpireWarningDialogService,
    ToolsPanelService,
    QuotasService,
  ],
};
