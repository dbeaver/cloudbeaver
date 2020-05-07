/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SettingsMenuService } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { PermissionsService } from '@dbeaver/core/root';

@injectable()
export class AdministrationMenuService {
  static administrationMenuToken = 'administrationMenu';
  constructor(
    private settingsMenuService: SettingsMenuService,
    private permissionsService: PermissionsService,
  ) { }

  register() {
    this.settingsMenuService.addMenuItem({
      id: AdministrationMenuService.administrationMenuToken,
      order: 0,
      isHidden: () => !this.permissionsService.has('admin'),
      title: 'administration_menu_enter',
    });
  }
}
