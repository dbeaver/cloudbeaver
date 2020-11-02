/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { ConnectionInfoResource } from '../../ConnectionInfoResource';
import { DBDriverResource } from '../../DBDriverResource';
import { ConnectionsResource } from '../ConnectionsResource';
import { ConnectionsAdministration } from './ConnectionsAdministration';
import { ConnectionsDrawerItem } from './ConnectionsDrawerItem';
import { CreateConnectionService } from './CreateConnectionService';

@injectable()
export class ConnectionsAdministrationService extends Bootstrap {
  constructor(
    private administrationItemService: AdministrationItemService,
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private dbDriverResource: DBDriverResource,
    private readonly createConnectionService: CreateConnectionService,
    private connectionInfoResource: ConnectionInfoResource,
  ) {
    super();
  }

  register(): void {
    this.administrationItemService.create({
      name: 'connections',
      type: AdministrationItemType.Default,
      order: 2,
      configurationWizardOptions: {
        defaultRoute: { sub: 'create' },
        description: 'connections_administration_configuration_wizard_step_description',
      },
      sub: [
        {
          name: 'create',
          onActivate: this.activateCreateMethod.bind(this),
          onDeActivate: this.deactivateCreateMethod.bind(this),
        },
      ],
      getContentComponent: () => ConnectionsAdministration,
      getDrawerComponent: () => ConnectionsDrawerItem,
      onActivate: this.loadConnections.bind(this),
      onDeActivate: async (configuration: boolean, outside: boolean) => {
        if (outside) {
          const updated = await this.connectionsResource.updateSessionConnections();
          if (updated) {
            await this.connectionInfoResource.refreshSession();
          }
        }
      },
    });
  }

  load(): void | Promise<void> { }

  private async activateCreateMethod(param: string | null) {
    if (!param) {
      this.createConnectionService.setCreateMethod();
    }
  }

  private async deactivateCreateMethod(param: string | null, configuration: boolean, outside: boolean) {
    if (outside) {
      this.createConnectionService.close();
    }
  }

  private async loadConnections() {
    try {
      await this.connectionsResource.loadAll();
      await this.dbDriverResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Error occurred while loading connections');
    }
  }
}
