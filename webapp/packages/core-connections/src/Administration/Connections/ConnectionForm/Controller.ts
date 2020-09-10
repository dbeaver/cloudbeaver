/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import {
  injectable, IInitializableController, IDestructibleController
} from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { ConnectionConfig, GQLErrorCatcher } from '@cloudbeaver/core-sdk';

import { DBDriverResource } from '../../../DBDriverResource';
import { ConnectionsResource } from '../../ConnectionsResource';
import { EConnectionType } from './EConnectionType';
import { IConnectionFormModel } from './IConnectionFormModel';

@injectable()
export class Controller
implements IInitializableController, IDestructibleController {
  @observable connectionType = EConnectionType.Parameters;
  @observable isLoading = false;
  @observable isSaving = false;

  @computed get isDisabled() {
    return this.isLoading || this.isSaving;
  }

  /** It will be loaded by options controller */
  @computed get driver() {
    return this.dbDriverResource.get(this.model.connection.driverId) || null;
  }

  readonly error = new GQLErrorCatcher();

  @computed private get accessLoaded() {
    return !!this.model.grantedSubjects;
  }

  private accessChanged = false;
  private isDistructed = false;
  private model!: IConnectionFormModel;
  private close!: () => void;

  constructor(
    private connectionsResource: ConnectionsResource,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService,
    private dbDriverResource: DBDriverResource,
  ) { }

  init(
    model: IConnectionFormModel,
    close: () => void
  ) {
    this.model = model;
    this.close = close;
  }

  destruct(): void {
    this.isDistructed = true;
  }

  setType = (type: EConnectionType) => {
    this.connectionType = type;
  }

  save = async () => {
    this.isSaving = true;
    this.error.clear();
    try {
      if (this.model.editing) {
        const connection = await this.connectionsResource.update(this.model.connection.id, this.getConnectionConfig());
        await this.saveSubjectPermissions(connection.id);

        this.notificationService.logInfo({ title: `Connection ${connection.name} updated` });
      } else {
        const connection = await this.connectionsResource.create(this.getConnectionConfig());
        await this.saveSubjectPermissions(connection.id);
        this.close();
        this.notificationService.logInfo({ title: `Connection ${connection.name} created` });
      }
    } catch (exception) {
      this.showError(exception, 'Failed to create connection');
    } finally {
      this.isSaving = false;
    }
  }

  test = async () => {
    this.isSaving = true;
    this.error.clear();
    try {
      await this.connectionsResource.test(this.getConnectionConfig());
      this.notificationService.logInfo({ title: 'Connection is established' });
    } catch (exception) {
      this.showError(exception, 'Connection test failed');
    } finally {
      this.isSaving = false;
    }
  }

  onShowDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  }

  handleAccessChange = () => this.accessChanged = true;

  loadAccessSubjects = async () => {
    if (this.accessLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      this.model.grantedSubjects = await this.connectionsResource.loadAccessSubjects(this.model.connection.id);

    } catch (exception) {
      this.notificationService.logException(exception, 'connections_connection_edit_access_load_failed');
    }
    this.isLoading = false;
  }

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

  private getConnectionConfig(): ConnectionConfig {
    const config: ConnectionConfig = {};

    if (this.model.editing) {
      config.connectionId = this.model.connection.id;
    }

    config.name = this.model.connection.name;
    config.description = this.model.connection.description;
    config.template = this.model.connection.template;
    config.driverId = this.model.connection.driverId;

    if (this.connectionType === EConnectionType.Parameters) {
      if (!this.driver?.embedded) {
        config.host = this.model.connection.host;
        config.port = this.model.connection.port;
      }
      config.databaseName = this.model.connection.databaseName;
    } else {
      config.url = this.model.connection.url;
    }
    if (this.model.connection.authModel || this.driver!.defaultAuthModel) {
      config.authModelId = this.model.connection.authModel || this.driver!.defaultAuthModel;
      config.saveCredentials = this.isCredentialsChanged();
      if (config.saveCredentials) {
        config.credentials = this.model.credentials;
      }
    }
    if (Object.keys(this.model.connection.properties).length > 0) {
      config.properties = this.model.connection.properties;
    }

    return config;
  }

  private isCredentialsChanged() {
    if (!this.model.connection.authProperties.length) {
      return true;
    }
    for (const property of this.model.connection.authProperties) {
      if (this.model.credentials[property.id!] !== property.value) {
        return true;
      }
    }
    return false;
  }

  private showError(exception: Error, message: string) {
    if (!this.error.catch(exception) || this.isDistructed) {
      this.notificationService.logException(exception, message);
    }
  }
}
