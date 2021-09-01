/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { RoleInfo, RolesResource } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { CreateRoleService } from './CreateRoleService';
import { RolesAdministration } from './RolesAdministration';
import { RolesDrawerItem } from './RolesDrawerItem';

export interface IRoleDetailsInfoProps {
  role: RoleInfo;
}

@injectable()
export class RolesAdministrationService extends Bootstrap {
  readonly roleDetailsInfoPlaceholder = new PlaceholderContainer<IRoleDetailsInfoProps>();

  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly createRoleService: CreateRoleService,
    private readonly rolesResource: RolesResource,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  register(): void {
    this.administrationItemService.create({
      name: 'roles',
      type: AdministrationItemType.Default,
      order: 3.1,
      configurationWizardOptions: {
        description: 'administration_roles_tab_description',
      },
      sub: [
        {
          name: 'create',
          onActivate: () => this.createRoleService.fillData(),
        },
      ],
      getContentComponent: () => RolesAdministration,
      getDrawerComponent: () => RolesDrawerItem,
      onActivate: this.loadRoles.bind(this),
      onDeActivate: (configurationWizard, outside) => {
        if (outside) {
          this.rolesResource.cleanNewFlags();
        }
      },
    });
  }

  load(): void | Promise<void> { }

  private async loadRoles() {
    try {
      await this.rolesResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Error occurred while loading roles');
    }
  }
}
