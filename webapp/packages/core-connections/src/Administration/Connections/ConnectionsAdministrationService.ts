/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { ConnectionInfoResource } from '../../ConnectionInfoResource';
import { DBDriverResource } from '../../DBDriverResource';
import { NetworkHandlerResource } from '../../NetworkHandlerResource';
import { DatabaseConnection, ConnectionsResource } from '../ConnectionsResource';
import { ConnectionsAdministration } from './ConnectionsAdministration';
import { ConnectionsDrawerItem } from './ConnectionsDrawerItem';
import { Origin } from './ConnectionsTable/ConnectionDetailsInfo/Origin';
import { SSH } from './ConnectionsTable/ConnectionDetailsInfo/SSH';
import { Template } from './ConnectionsTable/ConnectionDetailsInfo/Template';
import { CreateConnectionService } from './CreateConnectionService';

export interface IConnectionDetailsPlaceholderProps {
  connection: DatabaseConnection;
}

@injectable()
export class ConnectionsAdministrationService extends Bootstrap {
  readonly connectionDetailsPlaceholder = new PlaceholderContainer<IConnectionDetailsPlaceholderProps>();

  constructor(
    private administrationItemService: AdministrationItemService,
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private dbDriverResource: DBDriverResource,
    private readonly createConnectionService: CreateConnectionService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly networkHandlerResource: NetworkHandlerResource
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
      onDeActivate: this.refreshUserConnections.bind(this),
    });
    this.connectionDetailsPlaceholder.add(Origin, 0);
    this.connectionDetailsPlaceholder.add(Template, 1);
    this.connectionDetailsPlaceholder.add(SSH, 2);
  }

  load(): void | Promise<void> { }

  private async refreshUserConnections(configuration: boolean, outside: boolean): Promise<void> {
    if (outside) {
      this.connectionsResource.cleanNewFlags();
      await this.connectionInfoResource.refreshUserConnections();
    }
  }

  private async activateCreateMethod(param: string | null) {
    if (!param) {
      this.createConnectionService.setCreateMethod();
    }
    this.createConnectionService.setCreateMethod(param);
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
      await this.networkHandlerResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Error occurred while loading connections');
    }
  }
}
