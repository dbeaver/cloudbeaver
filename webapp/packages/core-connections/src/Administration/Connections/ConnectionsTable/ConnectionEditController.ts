/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action } from 'mobx';

import {
  injectable, IInitializableController, IDestructibleController, Bootstrap
} from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import {
  ConnectionConfig, GQLErrorCatcher, DatabaseAuthModel, ConnectionInfo
} from '@cloudbeaver/core-sdk';

import { DatabaseAuthModelsResource } from '../../../DatabaseAuthModelsResource';
import { DBDriver, DBDriverResource } from '../../../DBDriverResource';
import { ConnectionsResource } from '../../ConnectionsResource';

export enum ConnectionType {
  Attributes,
  URL
}

@injectable()
export class ConnectionEditController
implements IInitializableController, IDestructibleController {
  @observable connectionType = ConnectionType.Attributes
  @observable isLoading = true;
  @observable isSaving = false;
  @observable driver: DBDriver | null = null;
  @observable authModel: DatabaseAuthModel | null = null;
  @observable config: ConnectionConfig = {
    name: '',
    driverId: '',
    host: '',
    port: '',
    databaseName: '',
    template: false,
    url: '',
    properties: {},
    credentials: {},
  };

  get isNew() {
    return this.connectionsResource.isNew(this.connectionId);
  }

  get drivers() {
    return Array.from(this.dbDriverResource.data.values());
  }

  connectionId!: string;
  readonly error = new GQLErrorCatcher();
  private isDistructed = false;
  private connectionInfo!: ConnectionInfo;

  constructor(
    private connectionsResource: ConnectionsResource,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService,
    private dbAuthModelsResource: DatabaseAuthModelsResource,
    private dbDriverResource: DBDriverResource,
  ) { }

  init(id: string) {
    this.connectionId = id;
    this.loadConnectionInfo();
  }

  destruct(): void {
    this.isDistructed = true;
  }

  onChangeType = (type: ConnectionType) => {
    this.connectionType = type;
  }

  onChange = (property: keyof ConnectionConfig, value: any) => {
    this.config[property] = value;

    if (this.isNew) {
      (this.connectionInfo as any)[property] = value;
    }
  }

  onSelectDriver = (driver: DBDriver | null) => {
    this.driver = driver;
    if (driver) {
      this.loadDriver(driver.id);
    } else {
      this.authModel = null;
    }
  }

  onSaveConnection = async () => {
    this.isSaving = true;
    this.error.clear();
    try {
      if (this.isNew) {
        const connection = await this.connectionsResource.create(this.getConnectionConfig(), this.connectionId);

        this.notificationService.logInfo({ title: `Connection ${connection.name} created` });
      } else {
        const connection = await this.connectionsResource.update(this.connectionId, this.getConnectionConfig());

        this.notificationService.logInfo({ title: `Connection ${connection.name} updated` });
      }
    } catch (exception) {
      this.showError(exception, 'Failed to create connection');
    } finally {
      this.isSaving = false;
    }
  }

  onShowDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  }

  private getConnectionConfig(): ConnectionConfig {
    const config: ConnectionConfig = {};
    config.name = this.config.name;
    config.description = this.config.description;
    config.template = this.config.template;
    config.driverId = this.config.driverId;

    if (this.connectionType === ConnectionType.Attributes) {
      if (!this.driver?.embedded) {
        config.host = this.config.host;
        config.port = this.config.port;
      }
      config.databaseName = this.config.databaseName;
    } else {
      config.url = this.config.url;
    }
    if (this.authModel) {
      config.authModelId = this.config.authModelId;
      config.saveCredentials = Object.values(this.config.credentials).some(Boolean);
      if (config.saveCredentials) {
        config.credentials = this.config.credentials;
      }
    }
    if (Object.keys(this.config.properties).length > 0) {
      config.properties = this.config.properties;
    }

    return config;
  }

  @action
  private setDefaults() {
    this.onChange('name', this.connectionInfo?.name || (this.driver ? `${this.driver?.name} (custom)` : ''));
    this.onChange('template', this.connectionInfo?.template);
    this.onChange('driverId', this.connectionInfo?.driverId || this.driver?.id || '');
    this.onChange('host', this.connectionInfo?.host || '');
    this.onChange('port', this.connectionInfo?.port || this.driver?.defaultPort || '');
    this.onChange('databaseName', this.connectionInfo?.databaseName || '');
    this.onChange('url', this.connectionInfo?.url || this.driver?.sampleURL || '');
    this.onChange('properties', this.connectionInfo?.properties || {});
    this.onChange('authModelId', this.connectionInfo?.authModel || this.driver?.defaultAuthModel);
    this.onChange('credentials', {});
  }

  private showError(exception: Error, message: string) {
    if (!this.error.catch(exception) || this.isDistructed) {
      this.notificationService.logException(exception, message);
    }
  }

  private async loadConnectionInfo() {
    this.isLoading = true;
    try {
      await this.connectionsResource.load(this.connectionId);

      this.connectionInfo = this.connectionsResource.get(this.connectionId)!;
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load ConnectionInfo ${this.connectionId}`);
    } finally {
      this.isLoading = false;
    }

    await this.loadDriver(this.connectionInfo.driverId);
  }

  private async loadDriver(driverId: string) {
    if (!driverId) {
      this.isSaving = true;
      try {
        await this.dbDriverResource.loadAll();
      } catch (exception) {
        this.notificationService.logException(exception, 'Can\'t load drivers');
      } finally {
        this.isSaving = false;
      }
      this.setDefaults();
      return;
    }

    this.isSaving = true;
    try {
      this.driver = await this.dbDriverResource.load(driverId);
      this.setDefaults();
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load driver ${driverId}`);
    }

    if (!this.driver || this.driver.anonymousAccess) {
      this.isSaving = false;
      this.authModel = null;
      return;
    }

    try {
      this.authModel = await this.dbAuthModelsResource.load(
        this.connectionInfo?.authModel || this.driver.defaultAuthModel
      );
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load driver auth model');
    } finally {
      this.isSaving = false;
    }
  }
}
