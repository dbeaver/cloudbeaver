/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { AdministrationScreenService } from '@dbeaver/administration';
import { ErrorDetailsDialog } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { GQLErrorCatcher } from '@dbeaver/core/sdk';

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
