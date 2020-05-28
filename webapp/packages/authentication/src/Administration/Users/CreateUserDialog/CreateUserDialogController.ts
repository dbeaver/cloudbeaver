/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { ErrorDetailsDialog } from '@dbeaver/core/app';
import { injectable, IInitializableController, IDestructibleController } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { GQLErrorCatcher } from '@dbeaver/core/sdk';

import { UsersManagerService } from '../../UsersManagerService';


@injectable()
export class CreateUserDialogController implements IInitializableController, IDestructibleController {
  @observable isCreating = false;
  @observable credentials = {
    login: '',
    password: '',
    role: '',
  };

  readonly error = new GQLErrorCatcher();
  private isDistructed = false;
  private close!: () => void;

  constructor(
    private notificationService: NotificationService,
    private usersManagerService: UsersManagerService,
    private commonDialogService: CommonDialogService,
  ) { }

  init(onClose: () => void) {
    this.close = onClose;
  }

  destruct(): void {
    this.isDistructed = true;
  }

  create = async () => {
    if (this.isCreating) {
      return;
    }

    this.isCreating = true;
    let isUserCreated = false;
    try {
      const user = await this.usersManagerService.create(this.credentials.login);
      isUserCreated = !!user;
      await this.usersManagerService.updateCredentials(user.userId, { password: this.credentials.password });
      await this.usersManagerService.grantRole(user.userId, this.credentials.role);
      this.close();
    } catch (exception) {
      if (isUserCreated) {
        this.usersManagerService.delete(this.credentials.login);
      }
      if (!this.error.catch(exception) || this.isDistructed) {
        this.notificationService.logException(exception, 'Error creating new user');
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
