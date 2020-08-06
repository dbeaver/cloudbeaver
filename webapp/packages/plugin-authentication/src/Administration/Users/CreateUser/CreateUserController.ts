/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher } from '@cloudbeaver/core-sdk';
import { AdministrationScreenService } from '@cloudbeaver/plugin-administration';

import { UsersManagerService } from '../../UsersManagerService';

@injectable()
export class CreateUserController {
  @observable isCreating = false;
  @observable login = '';

  readonly error = new GQLErrorCatcher();

  constructor(
    private notificationService: NotificationService,
    private administrationScreenService: AdministrationScreenService,
    private usersManagerService: UsersManagerService,
    private commonDialogService: CommonDialogService,
  ) { }

  create = async () => {
    if (this.isCreating) {
      return;
    }

    this.isCreating = true;
    try {
      await this.usersManagerService.create(this.login);
      this.administrationScreenService.navigateToItem('users');
    } catch (exception) {
      if (!this.error.catch(exception)) {
        this.notificationService.logException(exception, 'User create failed');
      }
    } finally {
      this.isCreating = false;
    }
  }

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  }
}
