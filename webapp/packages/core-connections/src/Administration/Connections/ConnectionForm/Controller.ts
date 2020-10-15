/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import {
  injectable, IInitializableController
} from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ConnectionConfig } from '@cloudbeaver/core-sdk';

import { DBDriverResource } from '../../../DBDriverResource';
import { ConnectionsResource } from '../../ConnectionsResource';
import { EConnectionType } from './EConnectionType';
import { IConnectionFormModel } from './IConnectionFormModel';

@injectable()
export class Controller
implements IInitializableController {
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

  @computed private get accessLoaded() {
    return !!this.model.grantedSubjects;
  }

  private accessChanged = false;
  private model!: IConnectionFormModel;
  private close!: () => void;

  constructor(
    private administrationScreenService: AdministrationScreenService,
    private connectionsResource: ConnectionsResource,
    private notificationService: NotificationService,
    private dbDriverResource: DBDriverResource
  ) { }

  init(
    model: IConnectionFormModel,
    close: () => void
  ): void {
    this.model = model;
    this.close = close;
  }

  isTabAvailable(tabId: string): boolean {
    if (this.administrationScreenService.isConfigurationMode) {
      if (tabId === 'access') {
        return false;
      }
    }
    return true;
  }

  setType = (type: EConnectionType) => {
    this.connectionType = type;
  };

  save = async () => {
    this.isSaving = true;
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
      this.notificationService.logException(exception, 'connections_connection_create_fail');
    } finally {
      this.isSaving = false;
    }
  };

  test = async () => {
    this.isSaving = true;
    try {
      await this.connectionsResource.test(this.getConnectionConfig());
      this.notificationService.logInfo({ title: 'Connection is established' });
    } catch (exception) {
      this.notificationService.logException(exception, 'connections_connection_test_fail');
    } finally {
      this.isSaving = false;
    }
  };

  handleAccessChange = () => { this.accessChanged = true; };

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
  };

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
      config.saveCredentials = this.model.connection.saveCredentials;
      if (this.isCredentialsChanged()) {
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
      if (property.value !== null && this.model.credentials[property.id!] !== property.value) {
        return true;
      }
    }
    return false;
  }
}
