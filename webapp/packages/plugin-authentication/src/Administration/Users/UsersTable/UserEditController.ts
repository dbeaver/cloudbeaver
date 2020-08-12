/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher, AdminUserInfo } from '@cloudbeaver/core-sdk';

import { RolesManagerService } from '../../RolesManagerService';
import { UsersResource } from '../../UsersResource';

@injectable()
export class UserEditController implements IInitializableController, IDestructibleController {
  @observable isCreating = false;
  @observable isLoading = true;
  @observable credentials = {
    login: '',
    password: '',
    passwordRepeat: '',
    roles: new Map<string, boolean>(),
  };

  get isNew() {
    return this.usersResource.isNew(this.userId);
  }

  @computed get isFormFilled() {
    const rolesState = Array.from(this.credentials.roles.values())
      .filter(Boolean);

    return rolesState.length > 0
      && !!this.credentials.login
      && !!this.credentials.password
      && this.credentials.password === this.credentials.passwordRepeat;
  }

  @computed get roles() {
    return Array.from(this.rolesManagerService.roles.data.values());
  }

  @computed get user(): AdminUserInfo {
    return this.usersResource.get(this.userId)!;
  }

  readonly error = new GQLErrorCatcher();
  private isDistructed = false;
  private userId!: string;

  constructor(
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService,
    private rolesManagerService: RolesManagerService,
    private usersResource: UsersResource,
  ) { }

  init(id: string) {
    this.userId = id;
    this.loadRoles();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  save = async () => {
    if (this.isCreating) {
      return;
    }

    if (!this.credentials.password && this.isNew) {
      this.notificationService.logError({ title: 'authentication_user_password_not_set' });
      return;
    }

    if (this.credentials.password !== this.credentials.passwordRepeat) {
      this.notificationService.logError({ title: 'authentication_user_passwords_not_match' });
      return;
    }

    this.isCreating = true;
    let isUserCreated = false;
    try {
      if (this.isNew) {
        await this.usersResource.create(this.credentials.login, this.userId);
      }
      isUserCreated = !!this.user;

      if (this.credentials.password) {
        await this.usersResource.updateCredentials(this.user.userId, { password: this.credentials.password });
      }
      for (const [roleId, checked] of this.credentials.roles) {
        if (checked) {
          if (!this.user.grantedRoles.includes(roleId)) {
            await this.usersResource.grantRole(this.user.userId, roleId);
          }
        } else if (!this.isNew) {
          await this.usersResource.revokeRole(this.user.userId, roleId);
        }
      }
      await this.usersResource.refresh(this.user.userId);
      this.notificationService.logInfo({ title: 'authentication_user_user_created' });
    } catch (exception) {
      if (isUserCreated) {
        await this.deleteUser(this.credentials.login);
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

  private async deleteUser(userId: string) {
    try {
      await this.usersResource.delete(userId);
    } catch (exception) {
      if (!this.error.catch(exception) || this.isDistructed) {
        this.notificationService.logException(exception, 'Error deleting partially created user');
      }
    }
  }

  private async loadRoles() {
    try {
      await this.rolesManagerService.roles.loadAll();
      await this.loadUser();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load roles');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadUser() {
    try {
      await this.usersResource.load(this.userId);

      this.credentials.login = this.user.userId;
      this.credentials.roles = new Map(this.user.grantedRoles.map(roleId => ([roleId, true])));
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load user');
    }
  }
}
