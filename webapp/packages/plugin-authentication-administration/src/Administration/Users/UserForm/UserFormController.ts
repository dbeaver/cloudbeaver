/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import { compareRoles, isLocalUser, RoleInfo, RolesResource, UsersResource } from '@cloudbeaver/core-authentication';
import { DatabaseConnection, DBDriverResource } from '@cloudbeaver/core-connections';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLErrorCatcher, AdminConnectionGrantInfo, AdminSubjectType, AdminUserInfo } from '@cloudbeaver/core-sdk';
import { ConnectionsResource } from '@cloudbeaver/plugin-connections-administration';

interface IStatusMessage {
  status: ENotificationType;
  message: TLocalizationToken;
}

interface IUserCredentials {
  login: string;
  password: string;
  passwordRepeat: string;
  metaParameters: Record<string, any>;
  roles: Map<string, boolean>;
}

@injectable()
export class UserFormController implements IInitializableController, IDestructibleController {
  readonly selectedConnections: Map<string, boolean>;

  grantedConnections: AdminConnectionGrantInfo[];
  isSaving: boolean;
  isLoading: boolean;
  credentials: IUserCredentials;
  enabled: boolean;
  statusMessage: IStatusMessage | null;

  get connections(): DatabaseConnection[] {
    return Array.from(this.connectionsResource.data.values());
  }

  get roles(): RoleInfo[] {
    return Array.from(this.rolesResource.data.values()).sort(compareRoles);
  }

  get local(): boolean {
    return isLocalUser(this.user);
  }

  user!: AdminUserInfo;

  readonly error: GQLErrorCatcher;

  private isDestructed: boolean;
  private connectionAccessChanged: boolean;
  private connectionAccessLoaded: boolean;
  private collapse!: () => void;
  private editing!: boolean;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly rolesResource: RolesResource,
    private readonly usersResource: UsersResource,
    private readonly connectionsResource: ConnectionsResource,
    private readonly dbDriverResource: DBDriverResource
  ) {
    makeObservable(this, {
      selectedConnections: observable,
      grantedConnections: observable,
      isSaving: observable,
      isLoading: observable,
      credentials: observable,
      enabled: observable.ref,
      statusMessage: observable,
      connections: computed,
      roles: computed,
    });

    this.selectedConnections = new Map();
    this.grantedConnections = [];
    this.isSaving = false;
    this.isLoading = false;
    this.credentials = {
      login: '',
      password: '',
      passwordRepeat: '',
      metaParameters: {},
      roles: new Map(),
    };
    this.enabled = true;
    this.error = new GQLErrorCatcher();
    this.isDestructed = false;
    this.connectionAccessChanged = false;
    this.connectionAccessLoaded = false;
    this.statusMessage = null;
  }

  init(): void { }

  update(user: AdminUserInfo, editing: boolean, collapse: () => void): void {
    const prevUser = this.user;
    this.user = user;
    this.editing = editing;
    this.collapse = collapse;
    if (prevUser !== this.user) {
      this.loadRoles();
    }
  }

  destruct(): void {
    this.isDestructed = true;
  }

  save = async () => {
    if (this.isSaving) {
      return;
    }
    if (!this.validate()) {
      return;
    }

    this.isSaving = true;
    try {
      if (!this.editing) {
        await this.usersResource.create({
          userId: this.credentials.login,
          credentials: {
            profile: '0',
            credentials: { password: this.credentials.password },
          },
          enabled: this.enabled,
          roles: this.getGrantedRoles(),
          metaParameters: this.credentials.metaParameters,
          grantedConnections: this.getGrantedConnections(),
        });
        this.collapse();
        this.notificationService.logSuccess({ title: 'authentication_administration_user_created' });
      } else {
        if (this.credentials.password) {
          await this.usersResource.updateCredentials(
            this.user.userId,
            {
              profile: '0',
              credentials: { password: this.credentials.password },
            }
          );
        }
        await this.updateRoles();
        await this.saveUserStatus();
        await this.saveConnectionPermissions();
        await this.saveMetaParameters();
        await this.usersResource.refresh(this.user.userId);
        this.notificationService.logSuccess({ title: 'authentication_administration_user_updated' });
      }
      this.error.clear();
      this.statusMessage = null;
    } catch (exception: any) {
      this.error.catch(exception);
      const title = this.editing ? 'authentication_administration_user_update_failed' : 'authentication_administration_user_create_failed';

      if (this.isDestructed) {
        this.notificationService.logException(exception, title);
        return;
      }

      this.setStatusMessage(this.error.responseMessage || exception.message || title, ENotificationType.Error);
    } finally {
      this.isSaving = false;
    }
  };

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  };

  handleConnectionsAccessChange = () => { this.connectionAccessChanged = true; };

  loadConnectionsAccess = async () => {
    if (this.isLoading || this.connectionAccessLoaded) {
      return;
    }

    this.isLoading = true;
    try {
      if (this.editing) {
        this.grantedConnections = await this.usersResource.loadConnections(this.user.userId);

        this.selectedConnections.clear();
        for (const connection of this.grantedConnections) {
          if (connection.subjectType !== AdminSubjectType.Role) {
            this.selectedConnections.set(connection.connectionId, true);
          }
        }
      }
      this.connectionAccessLoaded = true;
    } catch (exception: any) {
      this.setStatusMessage('authentication_administration_user_connections_access_load_fail', ENotificationType.Error);
    }
    await this.loadConnections();
    this.isLoading = false;
  };

  private setStatusMessage(message: TLocalizationToken, status: ENotificationType) {
    this.statusMessage = {
      message,
      status,
    };
  }

  private validate() {
    if (!this.editing) {
      if (!this.credentials.login.trim()) {
        this.setStatusMessage('authentication_user_login_not_set', ENotificationType.Error);
        return;
      }

      if (this.rolesResource.has(this.credentials.login)) {
        this.setStatusMessage('authentication_user_login_cant_be_used', ENotificationType.Error);
        return;
      }

      if (this.usersResource.has(this.credentials.login)) {
        this.setStatusMessage('authentication_user_login_already_exists', ENotificationType.Error);
        return;
      }
    }

    if (!this.credentials.password && !this.editing) {
      this.setStatusMessage('authentication_user_password_not_set', ENotificationType.Error);
      return;
    }

    if (this.credentials.password !== this.credentials.passwordRepeat) {
      this.setStatusMessage('authentication_user_passwords_not_match', ENotificationType.Error);
      return;
    }

    return true;
  }

  private async updateRoles() {
    for (const [roleId, checked] of this.credentials.roles) {
      if (checked) {
        if (!this.user.grantedRoles.includes(roleId)) {
          await this.usersResource.grantRole(this.user.userId, roleId, true);
        }
      } else {
        await this.usersResource.revokeRole(this.user.userId, roleId, true);
      }
    }
  }

  private getGrantedRoles() {
    return Array.from(this.credentials.roles.keys()).filter(roleId => this.credentials.roles.get(roleId));
  }

  private getGrantedConnections() {
    return Array.from(this.selectedConnections.keys())
      .filter(connectionId => {
        const connectionPermission = this.grantedConnections.find(
          connectionPermission => connectionPermission.connectionId === connectionId
        );
        return this.selectedConnections.get(connectionId)
          && connectionPermission?.subjectType !== AdminSubjectType.Role;
      });
  }

  private async saveMetaParameters() {
    await this.usersResource.setMetaParameters(this.user.userId, this.credentials.metaParameters);
  }

  private async saveUserStatus() {
    if (this.enabled !== this.user.enabled) {
      await this.usersResource.enableUser(this.user.userId, this.enabled);
    }
  }

  private async saveConnectionPermissions() {
    if (!this.connectionAccessChanged) {
      return;
    }
    await this.usersResource.setConnections(this.user.userId, this.getGrantedConnections());
    this.connectionAccessChanged = false;
    this.connectionAccessLoaded = false;
    await this.loadConnectionsAccess();
  }

  private async loadRoles() {
    try {
      await this.rolesResource.loadAll();
      await this.loadUser();
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Can\'t load roles');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadUser() {
    try {
      this.credentials.metaParameters = this.user.metaParameters;
      this.credentials.login = this.user.userId;
      this.credentials.roles = new Map(this.user.grantedRoles.map(roleId => ([roleId, true])));
      this.enabled = this.user.enabled;
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Can\'t load user');
    }
  }

  private async loadConnections() {
    try {
      await this.dbDriverResource.loadAll();
      await this.connectionsResource.loadAll();
    } catch (exception: any) {
      this.setStatusMessage('authentication_administration_user_connections_access_connections_load_fail', ENotificationType.Error);
    }
  }
}
