/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { lazy } from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { EAdminPermission, PermissionsService } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { MenuBaseItem, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

import { AdministrationTopAppBarService } from './AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarService.js';
import { ServerConfigurationConfigurationService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationConfigurationService.js';
import { ServerConfigurationFormService } from './ConfigurationWizard/ServerConfiguration/ServerConfigurationFormService.js';

const AdministrationMenu = lazy(() => import('./AdministrationMenu/AdministrationMenu.js').then(m => ({ default: m.AdministrationMenu })));
const AdministrationTopAppBarHeader = lazy(() =>
  import('./AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarHeader.js').then(m => ({ default: m.AdministrationTopAppBarHeader })),
);

const AppStateMenu = lazy(() => import('@cloudbeaver/plugin-top-app-bar').then(m => ({ default: m.AppStateMenu })));

const ServerConfigurationInfoPanel = importLazyComponent(() =>
  import('./ConfigurationWizard/ServerConfiguration/ServerConfigurationInfoPanel.js').then(m => m.ServerConfigurationInfoPanel),
);

const ServerConfigurationSecurityPanel = importLazyComponent(() =>
  import('./ConfigurationWizard/ServerConfiguration/ServerConfigurationSecurityPanel.js').then(m => m.ServerConfigurationSecurityPanel),
);

const ServerConfigurationConnectionFeatures = importLazyComponent(() =>
  import('./ConfigurationWizard/ServerConfiguration/Features/ServerConfigurationConnectionFeatures.js').then(
    m => m.ServerConfigurationConnectionFeatures,
  ),
);

const ServerConfigurationConnectionsSection = importLazyComponent(() =>
  import('./ConfigurationWizard/ServerConfiguration/Features/ServerConfigurationConnectionsSection.js').then(
    m => m.ServerConfigurationConnectionsSection,
  ),
);

const ServerConfigurationWorkspaceSection = importLazyComponent(() =>
  import('./ConfigurationWizard/ServerConfiguration/Features/ServerConfigurationWorkspaceSection.js').then(
    m => m.ServerConfigurationWorkspaceSection,
  ),
);

const ServerConfigurationUngroupedFeatures = importLazyComponent(() =>
  import('./ConfigurationWizard/ServerConfiguration/Features/ServerConfigurationUngroupedFeatures.js').then(
    m => m.ServerConfigurationUngroupedFeatures,
  ),
);

@injectable(() => [
  PermissionsService,
  ScreenService,
  AdministrationScreenService,
  AdministrationTopAppBarService,
  MenuService,
  ServerConfigurationFormService,
  ServerConfigurationConfigurationService,
])
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly screenService: ScreenService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly administrationTopAppBarService: AdministrationTopAppBarService,
    private readonly menuService: MenuService,
    private readonly serverConfigurationFormService: ServerConfigurationFormService,
    private readonly serverConfigurationConfigurationService: ServerConfigurationConfigurationService,
  ) {
    super();
  }

  override register(): void {
    this.serverConfigurationFormService.parts.add({
      key: 'info',
      name: 'administration_configuration_wizard_configuration_server_info',
      order: 0,
      panel: () => ServerConfigurationInfoPanel,
    });

    this.serverConfigurationFormService.parts.add({
      key: 'security',
      name: 'administration_configuration_wizard_configuration_security',
      order: 3,
      panel: () => ServerConfigurationSecurityPanel,
    });

    this.serverConfigurationConfigurationService.register();

    this.serverConfigurationConfigurationService.settingsContainer.add(ServerConfigurationConnectionsSection, 0);
    this.serverConfigurationConfigurationService.settingsContainer.add(ServerConfigurationWorkspaceSection, 3);
    this.serverConfigurationConfigurationService.settingsContainer.add(ServerConfigurationUngroupedFeatures, 4);

    this.serverConfigurationConfigurationService.connectionsContainer.add(ServerConfigurationConnectionFeatures, 0);

    this.administrationTopAppBarService.placeholder.add(AdministrationMenu, 0);
    this.administrationTopAppBarService.placeholder.add(AdministrationTopAppBarHeader, 0);
    this.administrationTopAppBarService.placeholder.add(AppStateMenu);

    const ADMINISTRATION_MENU_OPEN = new MenuBaseItem(
      {
        id: 'administrationMenuEnter',
        label: 'administration_menu_enter',
        tooltip: 'administration_menu_enter',
      },
      { onSelect: () => this.administrationScreenService.navigateToRoot() },
    );

    const ADMINISTRATION_MENU_BACK = new MenuBaseItem(
      {
        id: 'administrationMenuBack',
        label: 'administration_menu_back',
        tooltip: 'administration_menu_back',
      },
      { onSelect: () => this.screenService.navigateToRoot() },
    );

    this.menuService.addCreator({
      menus: [TOP_NAV_BAR_SETTINGS_MENU],
      getItems: (context, items) => {
        const administrationScreen = this.screenService.isActive(AdministrationScreenService.screenName);

        if (this.permissionsService.has(EAdminPermission.admin) && !administrationScreen) {
          return [...items, ADMINISTRATION_MENU_OPEN];
        }

        if (administrationScreen) {
          return [...items, ADMINISTRATION_MENU_BACK];
        }

        return items;
      },
      orderItems: (context, items) => {
        items.unshift(...menuExtractItems(items, [ADMINISTRATION_MENU_OPEN, ADMINISTRATION_MENU_BACK]));
        return items;
      },
    });
  }
}
