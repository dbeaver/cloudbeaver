/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SettingsMenuService, ScreenService, AppScreenService } from '@cloudbeaver/core-app';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { PermissionsService } from '@cloudbeaver/core-root';

import { AdministrationScreenService } from './AdministrationScreen/AdministrationScreenService';
import { EAdminPermission } from './EAdminPermission';

@injectable()
export class AdministrationMenuService extends Bootstrap {
  constructor(
    private settingsMenuService: SettingsMenuService,
    private permissionsService: PermissionsService,
    private screenService: ScreenService,
    private administrationScreenService: AdministrationScreenService,
    private appScreenService: AppScreenService
  ) {
    super();
  }

  bootstrap() {
    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'administrationMenuEnter',
        order: 0,
        isHidden: () => !this.permissionsService.has(EAdminPermission.admin)
          || this.screenService.isActive(AdministrationScreenService.screenName),
        title: 'administration_menu_enter',
        onClick: () => this.administrationScreenService.navigateToRoot(),
      }
    );
    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'administrationMenuBack',
        order: 0,
        isHidden: () => !this.screenService.isActive(AdministrationScreenService.screenName),
        title: 'administration_menu_back',
        onClick: () => this.appScreenService.navigateToRoot(),
      }
    );
  }
}
