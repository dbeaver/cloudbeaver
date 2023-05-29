/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { AdminUser, AuthRolesResource, compareTeams, isLocalUser, TeamInfo, TeamsResource, UsersResource } from '@cloudbeaver/core-authentication';
import {
  compareConnectionsInfo,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  DatabaseConnection,
  DBDriverResource,
} from '@cloudbeaver/core-connections';
import { IDestructibleController, IInitializableController, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { isGlobalProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { AdminConnectionGrantInfo, AdminSubjectType, AdminUserInfo, CachedMapAllKey, GQLErrorCatcher } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { IUserFormState, UserFormService } from './UserFormService';

interface IStatusMessage {
  status: ENotificationType;
  message: TLocalizationToken;
}

interface IUserCredentials {
  login: string;
  password: string;
  passwordRepeat: string;
  metaParameters: Record<string, any>;
  teams: Map<string, boolean>;
  authRole?: string;
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
  partsState: MetadataMap<string, any>;

  get connections(): DatabaseConnection[] {
    return this.connectionInfoResource.values
      .filter(({ projectId }) => isGlobalProject(this.projectInfoResource.get(projectId)))
      .sort(compareConnectionsInfo);
  }

  get teams(): TeamInfo[] {
    return this.teamsResource.values.slice().sort(compareTeams);
  }

  get local(): boolean {
    return isLocalUser(this.user);
  }

  user!: AdminUserInfo;

  readonly error: GQLErrorCatcher;

  readonly afterSubmitTask: Executor<IUserFormState>;
  private isDestructed: boolean;
  private connectionAccessChanged: boolean;
  private connectionAccessLoaded: boolean;
  private collapse!: () => void;
  private editing!: boolean;

  constructor(
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly teamsResource: TeamsResource,
    private readonly usersResource: UsersResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly authRolesResource: AuthRolesResource,
    private readonly dbDriverResource: DBDriverResource,
    private readonly userFormService: UserFormService,
  ) {
    this.partsState = new MetadataMap();
    this.afterSubmitTask = new Executor();
    this.selectedConnections = new Map();
    this.grantedConnections = [];
    this.isSaving = false;
    this.isLoading = false;
    this.credentials = {
      login: '',
      password: '',
      passwordRepeat: '',
      metaParameters: {},
      teams: new Map(),
    };
    this.enabled = true;
    this.error = new GQLErrorCatcher();
    this.isDestructed = false;
    this.connectionAccessChanged = false;
    this.connectionAccessLoaded = false;
    this.statusMessage = null;

    makeObservable(this, {
      selectedConnections: observable,
      grantedConnections: observable,
      isSaving: observable,
      isLoading: observable,
      credentials: observable,
      enabled: observable.ref,
      statusMessage: observable,
      connections: computed,
      teams: computed,
    });
  }

  init(): void {
    this.userFormService.onFormInit.execute();
  }

  update(user: AdminUserInfo, editing: boolean, collapse: () => void): void {
    const prevUser = this.user;
    this.user = user;
    this.editing = editing;
    this.collapse = collapse;
    if (prevUser !== this.user) {
      this.loadTeams();
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
      let user: AdminUser;
      if (!this.editing) {
        user = await this.usersResource.create({
          userId: this.credentials.login,
          credentials: {
            profile: '0',
            credentials: { password: this.credentials.password },
          },
          enabled: this.enabled,
          teams: this.getGrantedTeams(),
          metaParameters: this.credentials.metaParameters,
          grantedConnections: this.getGrantedConnections(),
          authRole: this.credentials.authRole,
        });

        this.collapse();
        this.notificationService.logSuccess({ title: 'authentication_administration_user_created' });
      } else {
        if (this.credentials.password) {
          await this.usersResource.updateCredentials(this.user.userId, {
            profile: '0',
            credentials: { password: this.credentials.password },
          });
        }
        await this.updateTeams();
        await this.saveUserRole();
        await this.saveUserStatus();
        await this.saveConnectionPermissions();
        await this.saveMetaParameters();
        user = await this.usersResource.refresh(this.user.userId, ['includeMetaParameters']);

        this.notificationService.logSuccess({ title: 'authentication_administration_user_updated' });
      }

      const context = await this.afterSubmitTask.execute({
        user,
        partsState: this.partsState,
        props: {
          controller: this,
          user: this.user,
          editing: this.editing,
        },
      });

      if (ExecutorInterrupter.isInterrupted(context)) {
        return;
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

  handleConnectionsAccessChange = () => {
    this.connectionAccessChanged = true;
  };

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
          if (connection.subjectType !== AdminSubjectType.Team) {
            this.selectedConnections.set(connection.dataSourceId, true);
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

      if (this.teamsResource.has(this.credentials.login)) {
        this.setStatusMessage('authentication_user_login_cant_be_used', ENotificationType.Error);
        return;
      }

      if (this.usersResource.has(this.credentials.login)) {
        this.setStatusMessage('authentication_user_login_already_exists', ENotificationType.Error);
        return;
      }
    }

    if (!this.credentials.authRole && this.authRolesResource.data.length > 0) {
      this.setStatusMessage('authentication_user_role_not_set', ENotificationType.Error);
      return;
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

  private async updateTeams() {
    for (const [teamId, checked] of this.credentials.teams) {
      if (checked) {
        if (!this.user.grantedTeams.includes(teamId)) {
          await this.usersResource.grantTeam(this.user.userId, teamId, true);
        }
      } else {
        if (this.user.grantedTeams.includes(teamId)) {
          await this.usersResource.revokeTeam(this.user.userId, teamId, true);
        }
      }
    }
  }

  private getGrantedTeams() {
    return Array.from(this.credentials.teams.keys()).filter(teamId => this.credentials.teams.get(teamId));
  }

  private getGrantedConnections() {
    return Array.from(this.selectedConnections.keys()).filter(connectionId => {
      const connectionPermission = this.grantedConnections.find(connectionPermission => connectionPermission.dataSourceId === connectionId);
      return this.selectedConnections.get(connectionId) && connectionPermission?.subjectType !== AdminSubjectType.Team;
    });
  }

  private async saveMetaParameters() {
    await this.usersResource.setMetaParameters(this.user.userId, this.credentials.metaParameters);
  }

  private async saveUserRole() {
    if (this.credentials.authRole !== this.user.authRole) {
      await this.usersResource.setAuthRole(this.user.userId, this.credentials.authRole, true);
    }
  }

  private async saveUserStatus() {
    if (this.enabled !== this.user.enabled) {
      await this.usersResource.enableUser(this.user.userId, this.enabled, true);
    }
  }

  private async saveConnectionPermissions() {
    await this.projectInfoResource.load(CachedMapAllKey);

    if (!this.connectionAccessChanged || !this.projectInfoResource.values.some(isGlobalProject)) {
      return;
    }
    await this.usersResource.setConnections(this.user.userId, this.getGrantedConnections());
    this.connectionAccessChanged = false;
    this.connectionAccessLoaded = false;
    await this.loadConnectionsAccess();
  }

  private async loadTeams() {
    try {
      await this.teamsResource.load(CachedMapAllKey);
      await this.loadUser();
    } catch (exception: any) {
      this.notificationService.logException(exception, "Can't load teams");
    } finally {
      this.isLoading = false;
    }
  }

  private async loadUser() {
    try {
      this.credentials.metaParameters = this.user.metaParameters;
      this.credentials.login = this.user.userId;
      this.credentials.teams = new Map(this.user.grantedTeams.map(teamId => [teamId, true]));
      this.credentials.authRole = this.user.authRole;
      this.enabled = this.user.enabled;
    } catch (exception: any) {
      this.notificationService.logException(exception, "Can't load user");
    }
  }

  private async loadConnections() {
    try {
      await this.dbDriverResource.load(CachedMapAllKey);
      const projects = await this.projectInfoResource.load(CachedMapAllKey);

      await this.connectionInfoResource.load(ConnectionInfoProjectKey(...projects.filter(isGlobalProject).map(project => project.id)));
    } catch (exception: any) {
      this.setStatusMessage('authentication_administration_user_connections_access_connections_load_fail', ENotificationType.Error);
    }
  }
}
