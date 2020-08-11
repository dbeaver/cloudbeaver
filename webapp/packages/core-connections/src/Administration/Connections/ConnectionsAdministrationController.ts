/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher, resourceKeyList } from '@cloudbeaver/core-sdk';

import { ConnectionsResource } from '../ConnectionsResource';

@injectable()
export class ConnectionsAdministrationController {
  @observable isDeleting = false;
  readonly selectedItems = observable<string, boolean>(new Map())
  readonly expandedItems = observable<string, boolean>(new Map())
  readonly error = new GQLErrorCatcher();
  get connections() {
    return Array.from(this.connectionsResource.data.values())
      .sort((a, b) => {
        if (this.connectionsResource.isNew(a.id) === this.connectionsResource.isNew(b.id)) {
          return 0;
        }
        if (this.connectionsResource.isNew(a.id)) {
          return -1;
        }
        return 1;
      });
  }
  get isLoading() {
    return this.connectionsResource.isLoading();
  }

  constructor(
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private commonDialogService: CommonDialogService,
  ) { }

  create = () => {
    const connectionInfo = this.connectionsResource.addNew();
    this.expandedItems.set(connectionInfo.id, true);
  }

  update = async () => {
    try {
      await this.connectionsResource.refresh('all');
    } catch (exception) {
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'Connections update failed');
      }
    }
  }

  delete = async () => {
    if (this.isDeleting) {
      return;
    }

    this.isDeleting = true;

    try {
      const deletionList = Array
        .from(this.selectedItems)
        .filter(([_, value]) => value)
        .map(([connectionId]) => connectionId);
      if (deletionList.length === 0) {
        return;
      }

      const confirmed = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'authentication_administration_confirm_user_deletion',
        message: `Would you like to delete connections: ${deletionList.join(', ')}`,
      });

      if (!confirmed) {
        return;
      }

      await this.connectionsResource.delete(resourceKeyList(deletionList));
      this.selectedItems.clear();
      await this.connectionsResource.refresh('all');
    } catch (exception) {
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'Connections delete failed');
      }
    } finally {
      this.isDeleting = false;
    }
  }

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  }
}
