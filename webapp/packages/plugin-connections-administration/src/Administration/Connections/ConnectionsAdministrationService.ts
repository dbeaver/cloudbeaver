/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { ConnectionInfoActiveProjectKey, ConnectionInfoResource, DatabaseConnection, DBDriverResource } from '@cloudbeaver/core-connections';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

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
    private readonly administrationItemService: AdministrationItemService,
    private readonly notificationService: NotificationService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly dbDriverResource: DBDriverResource,
    private readonly createConnectionService: CreateConnectionService,
    private readonly commonDialogService: CommonDialogService
  ) {
    super();
  }

  register(): void {
    this.administrationItemService.create({
      name: 'connections',
      type: AdministrationItemType.Administration,
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
          canDeActivate: this.canDeActivateCreate.bind(this),
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

  private async refreshUserConnections(
    configuration: boolean,
    outside: boolean,
    outsideAdminPage: boolean
  ): Promise<void> {
    // TODO: we have to track users' leaving the page
    if (outside) {
      this.connectionInfoResource.cleanNewFlags();
      // const updated = await this.connectionInfoResource.updateSessionConnections();

      // if (updated) {
      //   this.sessionDataResource.markOutdated();
      // }
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

  private async canDeActivateCreate() {
    if (this.createConnectionService.data === null) {
      return true;
    }

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'ui_changes_will_be_lost',
      message: 'connections_administration_deactivate_message',
      confirmActionText: 'ui_continue',
    });

    return result !== DialogueStateResult.Rejected;
  }

  private async loadConnections() {
    try {
      await this.connectionInfoResource.load(ConnectionInfoActiveProjectKey);
      await this.dbDriverResource.loadAll();
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Error occurred while loading connections');
    }
  }
}
