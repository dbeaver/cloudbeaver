/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { UsersResource, RolesResource, AdminUser } from '@cloudbeaver/core-authentication';
import { injectable, IInitializableController } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { AdminRoleInfo, AdminSubjectType } from '@cloudbeaver/core-sdk';

import { ConnectionsResource } from '../../../ConnectionsResource';
import { ConnectionFormController } from '../ConnectionFormController';
import { IConnectionFormModel } from '../IConnectionFormModel';

@injectable()
export class Controller
implements IInitializableController {
  @observable loading = false;
  @observable selectedSubjects: Map<string, boolean> = new Map();

  @computed get users(): AdminUser[] {
    return Array.from(this.usersResource.data.values());
  }

  @computed get roles(): AdminRoleInfo[] {
    return Array.from(this.rolesResource.data.values());
  }

  @computed private get accessLoaded() {
    return !!this.model.grantedSubjects;
  }

  get isLoading(): boolean {
    return this.usersResource.isLoading() || this.rolesResource.isLoading() || this.loading;
  }

  private model!: IConnectionFormModel;
  private formController!: ConnectionFormController;
  private accessChanged = false;

  constructor(
    private usersResource: UsersResource,
    private rolesResource: RolesResource,
    private connectionsResource: ConnectionsResource,
    private notificationService: NotificationService,
  ) {
    this.saveSubjectPermissions = this.saveSubjectPermissions.bind(this);
  }

  init(model: IConnectionFormModel, controller: ConnectionFormController): void {
    this.model = model;
    this.formController = controller;
    this.formController.afterSave.addHandler(this.saveSubjectPermissions);
  }

  select = (subjectId: string, state: boolean): void => {
    if (!state) {
      const index = this.model.grantedSubjects!.findIndex(subject => subject.subjectId === subjectId);
      if (index > -1) {
        this.model.grantedSubjects!.splice(index, 1);
      }
      return;
    }

    this.model.grantedSubjects!.push({
      connectionId: '',
      subjectId,
      subjectType: AdminSubjectType.User,
    });
  };

  load = async (): Promise<void> => {
    if (this.accessLoaded || this.isLoading) {
      return;
    }

    this.loading = true;
    try {
      this.model.grantedSubjects = await this.connectionsResource.loadAccessSubjects(this.model.connection.id);
      await this.loadSubjects();
    } catch (exception) {
      this.notificationService.logException(exception, 'connections_connection_edit_access_load_failed');
    }
    this.loading = false;
  };

  change = (): void => { this.accessChanged = true; };

  private async saveSubjectPermissions(connectionId: string) {
    if (!this.accessChanged || !this.model.grantedSubjects) {
      return;
    }
    await this.connectionsResource.setAccessSubjects(
      connectionId,
      this.model.grantedSubjects.map(subject => subject.subjectId)
    );
    this.accessChanged = false;
  }

  private async loadSubjects() {
    await this.usersResource.loadAll();
    await this.rolesResource.loadAll();

    for (const subject of this.model.grantedSubjects || []) {
      this.selectedSubjects.set(subject.subjectId, true);
    }
  }
}
