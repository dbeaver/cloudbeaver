/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType, AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { ConnectionInfoResource } from '../../ConnectionInfoResource';
import { DBDriverResource } from '../../DBDriverResource';
import { ConnectionsResource } from '../ConnectionsResource';
import { ConnectionsAdministration } from './ConnectionsAdministration';
import { ConnectionsDrawerItem } from './ConnectionsDrawerItem';

@injectable()
export class ConnectionsAdministrationService extends Bootstrap {
  constructor(
    private administrationScreenService: AdministrationScreenService,
    private administrationItemService: AdministrationItemService,
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private connectionInfoResource: ConnectionInfoResource,
    private dbDriverResource: DBDriverResource,
    private graphQLService: GraphQLService
  ) {
    super();
  }

  register() {
    this.administrationScreenService.activationEvent.addHandler((_, state) => this.handleDeactivate(state));

    this.administrationItemService.create({
      name: 'connections',
      type: AdministrationItemType.Default,
      order: 2,
      configurationWizardOptions: {
        defaultRoute: { sub: 'create', param: 'search-database' },
        description: 'connections_administration_configuration_wizard_step_description',
      },
      sub: [
        { name: 'create' },
      ],
      getContentComponent: () => ConnectionsAdministration,
      getDrawerComponent: () => ConnectionsDrawerItem,
      onActivate: this.loadConnections.bind(this),
    });
  }

  load(): void | Promise<void> { }

  private async handleDeactivate(state: boolean) {
    // if (state) {
    // return;
    // }

    // this.connectionInfoResource.markOutdated();
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
