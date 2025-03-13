/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormMode, FormPart, formStateContext, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import { DriverConfigurationType, type ConnectionConfig, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import {
  ConnectionInfoOriginResource,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
  DatabaseAuthModelsResource,
  DBDriverResource,
  isJDBCConnection,
  type DatabaseConnection,
} from '@cloudbeaver/core-connections';
import type { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import { observable, runInAction, toJS } from 'mobx';
import { getUniqueName, isNotNullDefined } from '@cloudbeaver/core-utils';
import { getDefaultConfigurationType } from './getDefaultConfigurationType.js';
import { getConnectionName } from './getConnectionName.js';
import type { LocalizationService } from '@cloudbeaver/core-localization';
import type { IConnectionFormOptionsState } from './IConnectionFormOptionsState.js';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { connectionTestContext } from '../Contexts/connectionTestContext.js';
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
    private readonly userInfoResource: UserInfoResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionInfoOriginResource: ConnectionInfoOriginResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly localizationService: LocalizationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {
    super(formState, defaultStateGetter());

    this.formState.validationTask.addPostHandler(this.askCredentials.bind(this));
    this.formState.loadedTask.addPostHandler(this.formAuthState.bind(this));
  }

  private async formAuthState(data: IFormState<IConnectionFormState>, contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>) {
    const stateContext = contexts.getContext(formStateContext);
    const info = this.connectionInfoResource.get(createConnectionParam(data.state.projectId, data.state.config.connectionId!));

    if (!this.formState.state.config.driverId || !this.formState.state.projectId) {
      return;
    }

    const driver = await this.dbDriverResource.load(this.formState.state.config.driverId, ['includeProviderProperties', 'includeMainProperties']);
    const authModel = await this.databaseAuthModelsResource.load(driver.defaultAuthModel);

    const providerId = authModel.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;

    await this.userInfoResource.load();

    if (!this.userInfoResource.hasToken(providerId)) {
      const provider = await this.authProvidersResource.load(providerId);
      const message = this.localizationService.translate('plugin_connections_connection_cloud_auth_required', undefined, {
        providerLabel: provider.label,
      });
      stateContext.setInfo(message);
      stateContext.readonly = this.formState.mode === 'edit';
    }
  }

  private async askCredentials(data: IFormState<IConnectionFormState>, contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>) {
    if (
      this.formState.state.submitType !== 'test' ||
      (!this.formState.state.config.authModelId && !this.formState.state.requiredNetworkHandlersIds.length)
    ) {
      return;
    }

    runInAction(() => {
      if (this.formState.state.config.authModelId) {
        if (!this.state.credentials) {
          this.state.credentials = { ...data.state.config.credentials };
        }

        this.state.credentials = observable(this.state.credentials);
      }
    });

    const result = await this.commonDialogService.open(ConnectionAuthenticationDialogLoader, {
      config: this.state,
      authModelId: this.formState.state.config.authModelId ?? null,
      networkHandlers: this.formState.state.requiredNetworkHandlersIds,
      projectId: data.state.projectId,
    });

    if (result === DialogueStateResult.Rejected) {
      ExecutorInterrupter.interrupt(contexts);
    }
  }

  protected override async loader(): Promise<void> {
    if (this.formState.mode === 'create') {
      await this.setDefaults();
      this.setInitialState({
        ...defaultStateGetter(),
        ...this.formState.state.config,
      });
      return;
    }

    if (!this.formState.state.config.connectionId || !this.formState.state.projectId) {
      console.error('Connection id and project id should be defined');
      return;
    }

    const info = await this.connectionInfoResource.load(
      createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId),
      [
        'includeAuthProperties',
        'includeCredentialsSaved',
        'customIncludeOptions',
        'includeProperties',
        'includeProviderProperties',
        'includeNetworkHandlersConfig',
      ],
    );
    await this.connectionInfoOriginResource.load(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId));

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
    this.formState.state.config = config;
    this.setInitialState(config);
  }

  private async setDefaults() {
    if (!this.formState.state.config.driverId) {
      return;
    }

    const driver = await this.dbDriverResource.load(this.formState.state.config.driverId, ['includeProviderProperties']);

    this.formState.state.config.authModelId = driver?.defaultAuthModel;
    this.formState.state.config.configurationType = getDefaultConfigurationType(driver);

    if (!this.formState.state.config.host) {
      this.formState.state.config.host = driver?.defaultServer || 'localhost';
    }

    if (!this.formState.state.config.port) {
      this.formState.state.config.port = driver?.defaultPort;
    }

    this.formState.state.config.databaseName = driver?.defaultDatabase;
    this.formState.state.config.url = driver?.sampleURL;

    if (isJDBCConnection(driver)) {
      this.formState.state.config.name = this.formState.state.config.url;
    } else {
      this.formState.state.config.name = getConnectionName(
        driver.name || '',
        this.formState.state.config.host,
        this.formState.state.config.port,
        driver.defaultPort,
      );
    }
  }

  protected override async format(
    data: IFormState<IConnectionFormState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormState>>,
  ): Promise<void> {
    if (!this.formState.state.config.driverId || !this.formState.state.projectId) {
      return;
    }

    const driver = await this.dbDriverResource.load(this.formState.state.config.driverId, ['includeProviderProperties', 'includeMainProperties']);

    if (this.formState.mode === 'edit') {
      this.state.connectionId = this.formState.state.config.connectionId;
    }

    this.formState.state.requiredNetworkHandlersIds = [];
    this.state.networkHandlersConfig = [];

    this.state.name = this.state.name?.trim();

    if (this.state.name && this.formState.mode === 'create') {
      const connections = await this.connectionInfoResource.load(ConnectionInfoProjectKey(this.formState.state.projectId));
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
      delete this.state.url;
    }

    this.state.mainPropertyValues = toJS(this.state.mainPropertyValues);

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
      this.state.authModelId = this.formState.state.config.authModelId || driver.defaultAuthModel;
      this.state.saveCredentials = this.state.saveCredentials || this.state.sharedCredentials;
      const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!));

      const properties = await this.getConnectionAuthModelProperties(this.state.authModelId, info);

      if (isCredentialsChanged(properties, this.state.credentials!)) {
        this.state.credentials = prepareDynamicProperties(properties, toJS(this.state.credentials!));
      }

      if (this.state.saveCredentials) {
        delete this.formState.state.config.authModelId;
      } else {
        this.formState.state.config.authModelId = this.state.authModelId;
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
    const state = this.formState.state;
    const testContext = contexts.getContext(connectionTestContext);

    if (!state.projectId) {
      return;
    }

    if (state.submitType === 'submit') {
      if (this.formState.mode === 'edit') {
        await this.connectionInfoResource.update(createConnectionParam(state.projectId, this.formState.state.config.connectionId!), this.state);
      } else {
        const connection = await this.connectionInfoResource.create(state.projectId, this.state);
        this.formState.state.config.connectionId = connection.id;
        this.formState.setMode(FormMode.Edit);
      }
    } else {
      try {
        const info = await this.connectionInfoResource.test(state.projectId, this.state);

        testContext.clientVersion = info.clientVersion;
        testContext.serverVersion = info.serverVersion;
        testContext.connectTime = info.connectTime;
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
