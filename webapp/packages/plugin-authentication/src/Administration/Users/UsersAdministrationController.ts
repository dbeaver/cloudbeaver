/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { ErrorDetailsDialog } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { GQLErrorCatcher } from '@cloudbeaver/core-sdk';

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

  update = async () => {
    try {
      await this.usersManagerService.users.refresh(true, undefined);
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
        await this.usersManagerService.delete(userId);
      }
      this.selectedItems.clear();
      await this.usersManagerService.users.refresh(true, undefined);
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
