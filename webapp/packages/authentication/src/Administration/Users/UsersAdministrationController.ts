/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { ErrorDetailsDialog } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { GQLErrorCatcher } from '@dbeaver/core/sdk';

import { UsersManagerService } from '../UsersManagerService';
import { CreateUserDialog } from './CreateUserDialog/CreateUserDialog';


@injectable()
export class UsersAdministrationController {
  @observable isDeleting = false;
  readonly selectedItems = observable<string, boolean>(new Map())
  readonly error = new GQLErrorCatcher();
  get users() {
    return this.usersManagerService.users.data;
  }
  get isLoading() {
    return this.usersManagerService.users.isLoading();
  }

  constructor(
    private notificationService: NotificationService,
    private usersManagerService: UsersManagerService,
    private commonDialogService: CommonDialogService,
  ) { }

  create = () => {
    this.commonDialogService.open(CreateUserDialog, null);
  }

  delete = async () => {
    if (this.isDeleting) {
      return;
    }

    this.isDeleting = true;
    try {
      for (const [userId, selected] of this.selectedItems) {
        if (selected) {
          await this.usersManagerService.delete(userId);
        }
      }
      await this.usersManagerService.users.refresh();
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
