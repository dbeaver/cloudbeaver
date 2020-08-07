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
import { GQLErrorCatcher } from '@cloudbeaver/core-sdk';

import { ConnectionsResource } from '../ConnectionsResource';

@injectable()
export class ConnectionsAdministrationController {
  @observable isDeleting = false;
  readonly selectedItems = observable<string, boolean>(new Map())
  readonly error = new GQLErrorCatcher();
  get connections() {
    return this.connectionsResource.data;
  }
  get isLoading() {
    return this.connectionsResource.isLoading();
  }

  constructor(
    private notificationService: NotificationService,
    private connectionsResource: ConnectionsResource,
    private commonDialogService: CommonDialogService,
  ) { }

  create = () => { }

  update = async () => {
    try {
      await this.connectionsResource.refresh(undefined);
    } catch (exception) {
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'Users update failed');
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
        .map(([userId]) => userId);
      if (deletionList.length === 0) {
        return;
      }

      const confirmed = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'authentication_administration_confirm_user_deletion',
        message: `Would you like to delete users: ${deletionList.join(', ')}`,
      });

      if (!confirmed) {
        return;
      }

      for (const userId of deletionList) {
        await this.connectionsResource.delete(userId);
      }
      this.selectedItems.clear();
      await this.connectionsResource.refresh(undefined);
    } catch (exception) {
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'User delete failed');
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
