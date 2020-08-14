/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { DBDriverResource } from '../../DBDriverResource';
import { ConnectionsResource } from '../ConnectionsResource';
import { ConnectionsAdministration } from './ConnectionsAdministration';
import { ConnectionsDrawerItem } from './ConnectionsDrawerItem';

@injectable()
export class ConnectionsAdministrationService extends Bootstrap {
  constructor(
    private administrationItemService: AdministrationItemService,
    private administrationScreenService: AdministrationScreenService,
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private dbDriverResource: DBDriverResource,
  ) {
    super();
  }

  register() {
    this.administrationItemService.create({
      name: 'connections',
      order: 2,
      sub: [
        {
          name: 'edit',
          getComponent: () => ConnectionsAdministration,
        },
      ],
      getContentComponent: () => ConnectionsAdministration,
      getDrawerComponent: () => ConnectionsDrawerItem,
      onActivate: this.loadConnections.bind(this),
    });
  }

  load(): void | Promise<void> { }

  navToRoot() {
    this.administrationScreenService.navigateToItem('connections');
  }

  navToCreate() {
    this.administrationScreenService.navigateToItemSub('connections', 'create');
  }

  navToEdit(userId: string) {
    this.administrationScreenService.navigateToItemSub('connections', 'edit', userId);
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
