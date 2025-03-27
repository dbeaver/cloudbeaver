/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormMode, FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import {
  DriverConfigurationType,
  type ConnectionConfig,
  type DatabaseAuthModel,
  type ObjectPropertyInfo,
  type TestConnectionMutation,
} from '@cloudbeaver/core-sdk';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import {
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  DatabaseAuthModelsResource,
  DBDriverResource,
  isJDBCConnection,
  type DatabaseConnection,
  type DBDriver,
} from '@cloudbeaver/core-connections';
import type { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { action, computed, makeObservable, observable, reaction, toJS } from 'mobx';
import { getUniqueName, isNotNullDefined } from '@cloudbeaver/core-utils';
import { getDefaultConfigurationType } from './getDefaultConfigurationType.js';
import { getConnectionName } from './getConnectionName.js';
import type { LocalizationService } from '@cloudbeaver/core-localization';
import type { IConnectionFormOptionsState } from './IConnectionFormOptionsState.js';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ConnectionAuthenticationDialogLoader } from '../../ConnectionAuthentication/ConnectionAuthenticationDialogLoader.js';
import type { NotificationService } from '@cloudbeaver/core-events';

const MAIN_PROPERTY_DATABASE_KEY = 'database';
const MAIN_PROPERTY_HOST_KEY = 'host';
const MAIN_PROPERTY_PORT_KEY = 'port';
const MAIN_PROPERTY_SERVER_KEY = 'server';

const defaultStateGetter = () =>
  ({
    configurationType: DriverConfigurationType.Manual,
    keepAliveInterval: 0,
    credentials: {},
    template: false,
    mainPropertyValues: {},
    networkHandlersConfig: [],
    saveCredentials: false,
    properties: {},
    providerProperties: {},
  }) as IConnectionFormOptionsState;

export class ConnectionFormOptionsPart extends FormPart<IConnectionFormOptionsState, IConnectionFormState> {
  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly dbDriverResource: DBDriverResource,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly localizationService: LocalizationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {
    super(formState, defaultStateGetter());

    this.formState.validationTask.addPostHandler(this.askCredentials.bind(this));

    reaction(() => this.state.host, this.handleHostChange.bind(this));

    makeObservable(this, {
      setAuthModel: action.bound,
      setDriver: action.bound,
      updateNameTemplate: action.bound,
      connectionKey: computed,
    });
  }

  private handleHostChange(host: string | undefined, prevHost: string | undefined) {
    const driver = this.state.driverId ? this.dbDriverResource.get(this.state.driverId) : undefined;

    if (host !== prevHost && this.isNameAutoFill()) {
      this.updateNameTemplate(driver);
    }
  }

  private async askCredentials(data: IFormState<IConnectionFormState>, contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>) {
    const shouldNotAskCredentials = this.state.saveCredentials && !this.formState.state.requiredNetworkHandlersIds.length;

    if (this.formState.state.submitType !== 'test' || shouldNotAskCredentials) {
      return;
    }

    const config = { ...this.state };

    if (this.state.saveCredentials) {
      delete config.authModelId;
      delete config.credentials;
    }

    if (!this.formState.state.requiredNetworkHandlersIds.length) {
      delete config.networkHandlersConfig;
    }

    const result = await this.commonDialogService.open(ConnectionAuthenticationDialogLoader, {
      config,
      authModelId: config.authModelId ?? null,
      networkHandlers: this.formState.state.requiredNetworkHandlersIds,
      projectId: data.state.projectId,
    });

    if (result === DialogueStateResult.Rejected) {
      ExecutorInterrupter.interrupt(contexts);
    }
  }

  get connectionKey() {
    if (!this.state.connectionId || !this.formState.state.projectId) {
      return null;
    }

    return createConnectionParam(this.formState.state.projectId, this.state.connectionId);
  }

  // do not check outdated of userInfoResource cause it synced with projectInfoResource which is handled in optionsPart outdated method
  // otherwise you would get an infinite loading of the form
  override isOutdated(): boolean {
    if (!this.formState.state.projectId) {
      return false;
    }

    if (this.projectInfoResource.isOutdated(this.formState.state.projectId)) {
      return true;
    }

    return !!this.connectionKey && this.connectionInfoResource.isOutdated(this.connectionKey);
  }

  protected override async loader(): Promise<void> {
    if (this.formState.mode === 'create') {
      this.setInitialState(defaultStateGetter());

      if (this.formState.state.driverId && !this.isChanged) {
        await this.setDriver(this.formState.state.driverId);
      }

      return;
    }

    if (!this.connectionKey) {
      console.error('Connection connection key should be defined');
      return;
    }

    const info = await this.connectionInfoResource.load(this.connectionKey, [
      'includeAuthProperties',
      'includeCredentialsSaved',
      'customIncludeOptions',
      'includeProperties',
      'includeProviderProperties',
      'includeNetworkHandlersConfig',
    ]);

    const config: ConnectionConfig = defaultStateGetter();

    config.connectionId = info.id;
    config.configurationType = info.configurationType;

    config.name = info.name;
    config.description = info.description;
    config.template = info.template;
    config.driverId = info.driverId;

    config.host = info.mainPropertyValues[MAIN_PROPERTY_HOST_KEY];
    config.port = info.mainPropertyValues[MAIN_PROPERTY_PORT_KEY];
    config.serverName = info.mainPropertyValues[MAIN_PROPERTY_SERVER_KEY];
    config.databaseName = info.mainPropertyValues[MAIN_PROPERTY_DATABASE_KEY];

    config.url = info.url;
    config.folder = info.folder;

    config.authModelId = info.authModel;
    config.saveCredentials = info.credentialsSaved;
    config.sharedCredentials = info.sharedCredentials;

    config.keepAliveInterval = info.keepAliveInterval;
    config.autocommit = info.autocommit;
    config.readOnly = info.readOnly;

    if (info.authProperties) {
      for (const property of info.authProperties) {
        if (!property.features.includes('password')) {
          config.credentials[property.id!] = property.value;
        }
      }
    }

    if (info.providerProperties) {
      config.providerProperties = { ...info.providerProperties };
    }

    if (info.mainPropertyValues) {
      config.mainPropertyValues = { ...info.mainPropertyValues };
    }

    this.formState.state.availableDrivers = [info.driverId];

    this.setInitialState(config);
  }

  isNameAutoFill() {
    if (this.formState.mode === 'edit') {
      return false;
    }

    return this.state.name === this.initialState.name || !isNotNullDefined(this.initialState.name);
  }

  updateNameTemplate(driver: DBDriver | undefined) {
    const info = this.connectionKey ? this.connectionInfoResource.get(this.connectionKey) : undefined;

    if (isJDBCConnection(driver, info)) {
      this.state.name = this.state.url || '';
      this.initialState.name = this.state.name;
      return;
    }

    if (!driver) {
      this.state.name = 'New connection';
      this.initialState.name = this.state.name;
      return;
    }

    this.state.name = getConnectionName(driver.name || '', this.state.host, this.state.port, driver.defaultPort);
    this.initialState.name = this.state.name;
  }

  async setDriver(driverId: string) {
    if (this.formState.mode === 'edit') {
      return;
    }

    let prevDriver: DBDriver | undefined;
    let driver: DBDriver | undefined = this.dbDriverResource.get(driverId);
    let prevDriverId = this.initialState.driverId;

    this.state.driverId = driverId;
    this.initialState.driverId = driverId;

    if (!driver) {
      driver = await this.dbDriverResource.load(driverId, ['includeProviderProperties']);
    }

    if (prevDriverId) {
      prevDriver = await this.dbDriverResource.load(prevDriverId, ['includeProviderProperties']);
    }

    if (!this.state.configurationType || !driver?.configurationTypes.includes(this.state.configurationType)) {
      this.state.configurationType = getDefaultConfigurationType(driver);
    }

    if ((!prevDriver && this.state.host === undefined) || this.state.host === prevDriver?.defaultServer) {
      this.state.host = driver?.defaultServer || 'localhost';
    }

    if ((!prevDriver && this.state.port === undefined) || this.state.port === prevDriver?.defaultPort) {
      this.state.port = driver?.defaultPort;
    }

    if ((!prevDriver && this.state.databaseName === undefined) || this.state.databaseName === prevDriver?.defaultDatabase) {
      this.state.databaseName = driver?.defaultDatabase;
    }

    if ((!prevDriver && this.state.url === undefined) || this.state.url === prevDriver?.sampleURL) {
      this.state.url = driver?.sampleURL;
    }

    if (this.isNameAutoFill()) {
      this.updateNameTemplate(driver);
    }

    if (driver?.id !== prevDriver?.id) {
      this.state.credentials = {};
      this.state.providerProperties = {};
      this.state.authModelId = driver?.defaultAuthModel;
    }
  }

  setAuthModel(model: DatabaseAuthModel) {
    if (model.id !== this.initialState.authModelId) {
      this.state.credentials = {};
    } else {
      this.state.credentials = { ...this.initialState.credentials };
    }

    this.state.authModelId = model.id;
  }

  protected override async format(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    if (!this.state.driverId || !this.formState.state.projectId) {
      return;
    }

    const driver = await this.dbDriverResource.load(this.state.driverId, ['includeProviderProperties', 'includeMainProperties']);

    this.formState.state.requiredNetworkHandlersIds = observable([]);
    this.state.networkHandlersConfig = observable([]);

    this.state.name = this.state.name?.trim();

    if (this.state.name && this.formState.mode === 'create') {
      const connections = this.connectionInfoResource.get(ConnectionInfoProjectKey(this.formState.state.projectId)).filter(isNotNullDefined);
      const connectionNames = connections.map(connection => connection.name);

      this.state.name = getUniqueName(this.state.name, connectionNames);
    }

    this.state.description = this.state.description?.trim();

    if (this.state.template || !this.state.folder) {
      delete this.state.folder;
    }

    if (this.state.configurationType === DriverConfigurationType.Url) {
      this.state.url = this.state.url?.trim();
    } else {
      // if manual type configuration set, it helps to keep host, port, etc. properties (not saved on backend)
      delete this.state.url;
    }

    if (this.state.configurationType === DriverConfigurationType.Manual && !driver.useCustomPage) {
      this.state.mainPropertyValues![MAIN_PROPERTY_DATABASE_KEY] = this.state.databaseName?.trim();

      if (!driver.embedded) {
        this.state.mainPropertyValues![MAIN_PROPERTY_HOST_KEY] = this.state.host?.trim();
        this.state.mainPropertyValues![MAIN_PROPERTY_PORT_KEY] = this.state.port?.trim();
      }

      if (driver.requiresServerName) {
        this.state.mainPropertyValues![MAIN_PROPERTY_SERVER_KEY] = this.state.serverName?.trim();
      }
    }

    if ((this.state.authModelId || driver.defaultAuthModel) && !driver.anonymousAccess) {
      this.state.authModelId = this.state.authModelId || driver.defaultAuthModel;
      this.state.saveCredentials = this.state.saveCredentials || this.state.sharedCredentials;
      const info = this.connectionKey ? this.connectionInfoResource.get(this.connectionKey) : undefined;

      const properties = await this.getConnectionAuthModelProperties(this.state.authModelId, info);
      const passwordProperty = properties.find(property => property.features.includes('password'));
      const isPasswordEmpty =
        passwordProperty &&
        (this.state.credentials?.[passwordProperty.id!] === passwordProperty.defaultValue || !this.state.credentials?.[passwordProperty.id!]);

      if (isCredentialsChanged(properties, this.state.credentials!)) {
        this.state.credentials = prepareDynamicProperties(properties, toJS(this.state.credentials!));
      }

      if (isPasswordEmpty) {
        delete this.state.credentials?.[passwordProperty.id!];
      }
    }

    if (driver.providerProperties.length > 0) {
      this.state.providerProperties = prepareDynamicProperties(
        driver.providerProperties,
        toJS(this.state.providerProperties!),
        this.state.configurationType,
      );
    }

    if (driver.useCustomPage && driver.mainProperties.length > 0) {
      this.state.mainPropertyValues = prepareDynamicProperties(driver.mainProperties, this.state.mainPropertyValues!, this.state.configurationType);
    }
  }

  private async getConnectionAuthModelProperties(authModelId: string, connectionInfo?: DatabaseConnection): Promise<ObjectPropertyInfo[]> {
    const authModel = await this.databaseAuthModelsResource.load(authModelId);

    let properties = authModel.properties;

    if (connectionInfo?.authProperties && connectionInfo.authProperties.length > 0) {
      properties = connectionInfo.authProperties;
    }

    return properties;
  }

  private getTestMessageInfo(testContext: TestConnectionMutation['connection']) {
    let message = '';

    if (testContext.clientVersion) {
      message += this.localizationService.translate('plugin_connections_connection_client_version', undefined, {
        version: testContext.clientVersion,
      });
    }

    if (testContext.serverVersion) {
      message += this.localizationService.translate('plugin_connections_connection_server_version', undefined, {
        version: testContext.serverVersion,
      });
    }

    if (testContext.connectTime) {
      message += this.localizationService.translate('plugin_connections_connection_connection_time', undefined, {
        time: testContext.connectTime,
      });
    }

    return message;
  }

  protected override async validate(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    const validation = contexts.getContext(formValidationContext);

    if (this.state.configurationType === DriverConfigurationType.Manual && this.state.host?.length === 0 && this.state.driverId) {
      const driver = await this.dbDriverResource.load(this.state.driverId);
      if (!driver.embedded) {
        validation.error('plugin_connections_connection_form_host_invalid');
      }
    }

    if (!this.state.name?.length) {
      validation.error('plugin_connections_connection_form_name_invalid');
    }

    if (this.state.driverId && this.state.configurationType) {
      const driver = await this.dbDriverResource.load(this.state.driverId, ['includeProviderProperties']);

      if (!driver.configurationTypes.includes(this.state.configurationType)) {
        validation.error('plugin_connections_connection_form_host_configuration_invalid');
      }
    }

    if (this.formState.state.projectId !== null && this.formState.mode === 'create') {
      const project = this.projectInfoResource.get(this.formState.state.projectId);

      if (!project?.canEditDataSources) {
        validation.error('plugin_connections_connection_form_project_invalid');
      }
    }
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    if (!this.formState.state.projectId) {
      return;
    }

    if (this.formState.state.submitType === 'submit') {
      if (this.formState.mode === 'edit') {
        await this.connectionInfoResource.update(this.connectionKey!, this.state);
      } else {
        const connection = await this.connectionInfoResource.create(this.formState.state.projectId, this.state);
        this.state.connectionId = connection.id;
        this.formState.setMode(FormMode.Edit);
      }
    } else {
      try {
        const info = await this.connectionInfoResource.test(this.formState.state.projectId, this.state);

        this.notificationService.logSuccess({
          title: 'connections_connection_test_success',
          message: this.getTestMessageInfo(info),
        });
      } catch (error) {
        this.notificationService.logException(error as Error, 'connections_connection_test_fail');
      } finally {
        // to prevent form from resetting the state after saving
        ExecutorInterrupter.interrupt(contexts);
      }
    }
  }
}

function prepareDynamicProperties(
  propertiesInfo: ObjectPropertyInfo[],
  properties: Record<string, any>,
  configurationType?: DriverConfigurationType,
) {
  const result: Record<string, any> = { ...properties };

  for (const propertyInfo of propertiesInfo) {
    if (!propertyInfo.id) {
      continue;
    }

    const supported = configurationType === undefined || propertyInfo.supportedConfigurationTypes?.some(type => type === configurationType);

    if (!supported) {
      delete result[propertyInfo.id];
    } else {
      const isDefault = isNotNullDefined(propertyInfo.defaultValue);
      if (!(propertyInfo.id in result) && isDefault) {
        result[propertyInfo.id] = propertyInfo.defaultValue;
      }
    }
  }

  for (const key of Object.keys(result)) {
    if (typeof result[key] === 'string') {
      result[key] = result[key]?.trim();
    }
  }

  return result;
}

function isCredentialsChanged(authProperties: ObjectPropertyInfo[], credentials: Record<string, any>) {
  for (const property of authProperties) {
    const value = credentials[property.id!];

    if (property.features.includes('password')) {
      if (value !== undefined) {
        return property.features.includes('file') ? true : !!value;
      }
    } else if (value !== property.value) {
      return true;
    }
  }
  return false;
}
