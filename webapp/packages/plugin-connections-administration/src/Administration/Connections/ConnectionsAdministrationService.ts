/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { ConfirmationDialog, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { type ConnectionInfoOrigin, ConnectionInfoResource, type DatabaseConnection } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource } from '@cloudbeaver/core-root';

import { CreateConnectionService } from './CreateConnectionService.js';
import { CachedMapAllKey, getCachedDataResourceLoaderState, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';

export interface IConnectionDetailsPlaceholderProps {
  connection: DatabaseConnection;
  connectionOrigin?: ConnectionInfoOrigin;
}

const ConnectionsAdministration = React.lazy(async () => {
  const { ConnectionsAdministration } = await import('./ConnectionsAdministration.js');
  return { default: ConnectionsAdministration };
});
const ConnectionsDrawerItem = React.lazy(async () => {
  const { ConnectionsDrawerItem } = await import('./ConnectionsDrawerItem.js');
  return { default: ConnectionsDrawerItem };
});
const Origin = React.lazy(async () => {
  const { Origin } = await import('./ConnectionsTable/ConnectionDetailsInfo/Origin.js');
  return { default: Origin };
});
const SSH = React.lazy(async () => {
  const { SSH } = await import('./ConnectionsTable/ConnectionDetailsInfo/SSH.js');
  return { default: SSH };
});

@injectable()
export class ConnectionsAdministrationService extends Bootstrap {
  readonly connectionDetailsPlaceholder = new PlaceholderContainer<IConnectionDetailsPlaceholderProps>();

  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly createConnectionService: CreateConnectionService,
    private readonly commonDialogService: CommonDialogService,
    private readonly serverConfigResource: ServerConfigResource,
  ) {
    super();
  }

  override register(): void {
    this.administrationItemService.create({
      name: 'connections',
      type: AdministrationItemType.Administration,
      order: 5,
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
      getLoader: () => [
        getCachedDataResourceLoaderState(this.serverConfigResource, () => undefined),
        getCachedMapResourceLoaderState(this.connectionInfoResource, () => CachedMapAllKey),
      ],
      isHidden: () => this.serverConfigResource.distributed || !this.connectionInfoResource.values.some(connection => connection.template),
      getContentComponent: () => ConnectionsAdministration,
      getDrawerComponent: () => ConnectionsDrawerItem,
      onDeActivate: this.refreshUserConnections.bind(this),
    });
    this.connectionDetailsPlaceholder.add(Origin, 0);
    this.connectionDetailsPlaceholder.add(SSH, 2);
  }

  private refreshUserConnections(configuration: boolean, outside: boolean, outsideAdminPage: boolean): void {
    // TODO: we have to track users' leaving the page
    if (outside) {
      this.connectionInfoResource.cleanNewFlags();
      // const updated = await this.connectionInfoResource.updateSessionConnections();

      // if (updated) {
      //   this.sessionDataResource.markOutdated();
      // }
    }
  }

  private activateCreateMethod(param: string | null) {
    if (!param) {
      this.createConnectionService.setCreateMethod();
    }
    this.createConnectionService.setCreateMethod(param);
  }

  private deactivateCreateMethod(param: string | null, configuration: boolean, outside: boolean) {
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
}
