/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, formStateContext, formStatusContext, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import { type IConnectionFormRefactoredState } from '../ConnectionFormServiceRefactored.js';
import { DriverConfigurationType, isObjectPropertyInfoStateEqual, type ConnectionConfig, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import {
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
import { toJS } from 'mobx';
import { getUniqueName, isNotNullDefined, isValuesEqual } from '@cloudbeaver/core-utils';
import { getDefaultConfigurationType } from './getDefaultConfigurationType.js';
import { getConnectionName } from './getConnectionName.js';
import type { LocalizationService } from '@cloudbeaver/core-localization';
import type { IConnectionFormOptionsState } from './IConnectionFormOptionsState.js';

const MAIN_PROPERTY_DATABASE_KEY = 'database';
const MAIN_PROPERTY_HOST_KEY = 'host';
const MAIN_PROPERTY_PORT_KEY = 'port';
const MAIN_PROPERTY_SERVER_KEY = 'server';

interface ConnectionFormOptionsPartState {
  connectionConfig: IConnectionFormOptionsState;
  submitType: 'submit' | 'test';
}

const defaultStateGetter = () =>
  ({
    connectionConfig: {
      authModelId: '',
      autocommit: false,
      configurationType: DriverConfigurationType.Manual,
      connectionId: '',
      credentials: {},
      dataSourceId: '',
      databaseName: '',
      description: '',
      driverId: '',
      folder: '',
      host: '',
      keepAliveInterval: 0,
      mainPropertyValues: {},
      name: '',
      networkHandlersConfig: [],
      port: '',
      properties: {},
      providerProperties: {},
      readOnly: false,
      saveCredentials: false,
      selectedSecretId: '',
      serverName: '',
      sharedCredentials: false,
      template: false,
      templateId: '',
      url: '',
      userName: '',
      userPassword: '',
    },
    submitType: 'submit',
  }) as ConnectionFormOptionsPartState;

export class ConnectionFormOptionsPart extends FormPart<ConnectionFormOptionsPartState, IConnectionFormRefactoredState> {
  constructor(
    formState: IFormState<IConnectionFormRefactoredState>,
    private readonly dbDriverResource: DBDriverResource,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly localizationService: LocalizationService,
  ) {
    super(formState, defaultStateGetter());
  }

  override get isChanged(): boolean {
    const info = this.connectionInfoResource.get(
      createConnectionParam(this.formState.state.connectionInfoParams.projectId, this.formState.state.connectionInfoParams.connectionId),
    );

    if (!info) {
      return super.isChanged;
    }

    const driver = this.state.connectionConfig.driverId ? this.dbDriverResource.get(this.state.connectionConfig.driverId) : undefined;

    return (
      super.isChanged ||
      // TODO do I need it?
      !isValuesEqual(this.state.connectionConfig.name, info.name, '') ||
      !isValuesEqual(this.state.connectionConfig.configurationType, info.configurationType, DriverConfigurationType.Manual) ||
      !isValuesEqual(this.state.connectionConfig.description, info.description, '') ||
      !isValuesEqual(this.state.connectionConfig.template, info.template, true) ||
      !isValuesEqual(this.state.connectionConfig.folder, info.folder, undefined) ||
      !isValuesEqual(this.state.connectionConfig.driverId, info.driverId, '') ||
      (this.state.connectionConfig.url !== undefined && !isValuesEqual(this.state.connectionConfig.url, info.url, '')) ||
      (this.state.connectionConfig.host !== undefined && !isValuesEqual(this.state.connectionConfig.host, info.host, '')) ||
      (this.state.connectionConfig.port !== undefined && !isValuesEqual(this.state.connectionConfig.port, info.port, '')) ||
      (this.state.connectionConfig.serverName !== undefined && !isValuesEqual(this.state.connectionConfig.serverName, info.serverName, '')) ||
      (this.state.connectionConfig.databaseName !== undefined && !isValuesEqual(this.state.connectionConfig.databaseName, info.databaseName, '')) ||
      this.state.connectionConfig.credentials !== undefined ||
      (this.state.connectionConfig.authModelId !== undefined && !isValuesEqual(this.state.connectionConfig.authModelId, info.authModel, '')) ||
      (this.state.connectionConfig.saveCredentials !== undefined && this.state.connectionConfig.saveCredentials !== info.credentialsSaved) ||
      (this.state.connectionConfig.sharedCredentials !== undefined && this.state.connectionConfig.sharedCredentials !== info.sharedCredentials) ||
      (this.state.connectionConfig.providerProperties !== undefined &&
        !isObjectPropertyInfoStateEqual(driver?.providerProperties ?? [], this.state.connectionConfig.providerProperties, info.providerProperties)) ||
      (this.state.connectionConfig.mainPropertyValues !== undefined &&
        !isObjectPropertyInfoStateEqual(driver?.mainProperties ?? [], this.state.connectionConfig.mainPropertyValues, info.mainPropertyValues)) ||
      (this.state.connectionConfig.keepAliveInterval !== undefined &&
        !isValuesEqual(this.state.connectionConfig.keepAliveInterval, info.keepAliveInterval)) ||
      (this.state.connectionConfig.autocommit !== undefined && !isValuesEqual(this.state.connectionConfig.autocommit, info.autocommit))
    );
  }

  protected override async loader(): Promise<void> {
    const info = this.connectionInfoResource.get(
      createConnectionParam(this.formState.state.connectionInfoParams.projectId, this.formState.state.connectionInfoParams.connectionId),
    );

    if (!info) {
      const defaultConnectionConfig = await this.getDefaults();
      this.setInitialState({
        ...defaultStateGetter(),
        connectionConfig: defaultConnectionConfig || this.state.connectionConfig,
      });
      return;
    }

    const config = defaultStateGetter().connectionConfig;

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

    if (info.authProperties && config.credentials) {
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

    this.setInitialState({
      ...defaultStateGetter(),
      connectionConfig: config,
    });
  }

  private async formAuthState(
    data: IFormState<IConnectionFormRefactoredState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormRefactoredState>>,
  ) {
    const stateContext = contexts.getContext(formStateContext);
    const driver = await this.dbDriverResource.load(this.state.connectionConfig.driverId!, ['includeProviderProperties', 'includeMainProperties']);
    const info = this.connectionInfoResource.get(
      createConnectionParam(this.formState.state.connectionInfoParams.projectId, this.formState.state.connectionInfoParams.connectionId),
    );
    const authModel = await this.databaseAuthModelsResource.load(
      this.state.connectionConfig.authModelId ?? info?.authModel ?? driver.defaultAuthModel,
    );

    const providerId = authModel.requiredAuth ?? info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;

    await this.userInfoResource.load();

    if (!this.userInfoResource.hasToken(providerId)) {
      const provider = await this.authProvidersResource.load(providerId);
      const message = this.localizationService.translate('plugin_connections_connection_cloud_auth_required', undefined, {
        providerLabel: provider.label,
      });
      stateContext.setInfo(message);
      stateContext.readonly = data.mode === 'edit';
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

  protected override async format(
    data: IFormState<IConnectionFormRefactoredState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormRefactoredState>>,
  ): Promise<void> {
    if (!this.state.connectionConfig.driverId || !this.formState.state.connectionInfoParams.projectId) {
      return;
    }

    const driver = await this.dbDriverResource.load(this.state.connectionConfig.driverId, ['includeProviderProperties', 'includeMainProperties']);

    if (this.formState.mode === 'edit') {
      this.state.connectionConfig.connectionId = this.formState.state.connectionInfoParams.connectionId;
    }

    this.state.connectionConfig.name = this.state.connectionConfig.name?.trim();

    if (this.state.connectionConfig.name && this.formState.mode === 'create') {
      const connections = await this.connectionInfoResource.load(ConnectionInfoProjectKey(this.formState.state.connectionInfoParams.projectId));
      const connectionNames = connections.map(connection => connection.name);

      this.state.connectionConfig.name = getUniqueName(this.state.connectionConfig.name, connectionNames);
    }

    this.state.connectionConfig.description = this.state.connectionConfig.description?.trim();
    this.state.connectionConfig.keepAliveInterval = Number(this.state.connectionConfig.keepAliveInterval);

    if (this.state.connectionConfig.configurationType === DriverConfigurationType.Url) {
      this.state.connectionConfig.url = this.state.connectionConfig.url?.trim();
    }

    this.state.connectionConfig.mainPropertyValues = toJS(this.state.connectionConfig.mainPropertyValues);

    if (this.state.connectionConfig.configurationType === DriverConfigurationType.Manual && !driver.useCustomPage) {
      this.state.connectionConfig.mainPropertyValues![MAIN_PROPERTY_DATABASE_KEY] = this.state.connectionConfig.databaseName?.trim();

      if (!driver.embedded) {
        this.state.connectionConfig.mainPropertyValues![MAIN_PROPERTY_HOST_KEY] = this.state.connectionConfig.host?.trim();
        this.state.connectionConfig.mainPropertyValues![MAIN_PROPERTY_PORT_KEY] = this.state.connectionConfig.port?.trim();
      }

      if (driver.requiresServerName) {
        this.state.connectionConfig.mainPropertyValues![MAIN_PROPERTY_SERVER_KEY] = this.state.connectionConfig.serverName?.trim();
      }
    }

    if ((this.state.connectionConfig.authModelId || driver.defaultAuthModel) && !driver.anonymousAccess) {
      this.state.connectionConfig.authModelId = this.state.connectionConfig.authModelId || driver.defaultAuthModel;
      this.state.connectionConfig.saveCredentials = this.state.connectionConfig.saveCredentials || this.state.connectionConfig.sharedCredentials;

      const info = this.connectionInfoResource.get(
        createConnectionParam(this.formState.state.connectionInfoParams.projectId, this.formState.state.connectionInfoParams.connectionId),
      );
      const properties = await this.getConnectionAuthModelProperties(this.state.connectionConfig.authModelId, info);

      if (this.state.connectionConfig.credentials && isCredentialsChanged(properties, this.state.connectionConfig.credentials)) {
        this.state.connectionConfig.credentials = prepareDynamicProperties(properties, toJS(this.state.connectionConfig.credentials));
      }

      if (!this.state.connectionConfig.saveCredentials) {
        this.state.connectionConfig.authModelId = driver.defaultAuthModel;
      }
    }

    if (driver.providerProperties.length > 0 && this.state.connectionConfig.providerProperties) {
      this.state.connectionConfig.providerProperties = prepareDynamicProperties(
        driver.providerProperties,
        toJS(this.state.connectionConfig.providerProperties),
        this.state.connectionConfig.configurationType,
      );
    }

    if (driver.useCustomPage && driver.mainProperties.length > 0 && this.state.connectionConfig.mainPropertyValues) {
      this.state.connectionConfig.mainPropertyValues = prepareDynamicProperties(
        driver.mainProperties,
        this.state.connectionConfig.mainPropertyValues,
        this.state.connectionConfig.configurationType,
      );
    }
  }

  private async getDefaults(): Promise<ConnectionConfig | undefined> {
    if (!this.state.connectionConfig.driverId) {
      // TODO remove it?
      throw new Error('Driver id is not provided');
    }

    const defaultConnectionConfig: ConnectionConfig = { ...this.state.connectionConfig };

    const driver = await this.dbDriverResource.load(this.state.connectionConfig.driverId, ['includeProviderProperties']);

    defaultConnectionConfig.authModelId = driver?.defaultAuthModel;
    defaultConnectionConfig.configurationType = getDefaultConfigurationType(driver);

    if (!defaultConnectionConfig.host) {
      defaultConnectionConfig.host = driver?.defaultServer || 'localhost';
    }

    if (!defaultConnectionConfig.port) {
      defaultConnectionConfig.port = driver?.defaultPort;
    }

    defaultConnectionConfig.databaseName = driver?.defaultDatabase;
    defaultConnectionConfig.url = driver?.sampleURL;

    if (isJDBCConnection(driver)) {
      defaultConnectionConfig.name = this.state.connectionConfig.url;
    } else {
      defaultConnectionConfig.name = getConnectionName(
        driver.name || '',
        defaultConnectionConfig.host,
        defaultConnectionConfig.port,
        driver.defaultPort,
      );
    }

    return defaultConnectionConfig;
  }

  protected override async validate(
    data: IFormState<IConnectionFormRefactoredState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormRefactoredState>>,
  ): Promise<void> {
    const validation = contexts.getContext(formValidationContext);

    if (
      this.state.connectionConfig.configurationType === DriverConfigurationType.Manual &&
      this.state.connectionConfig.host?.length === 0 &&
      this.state.connectionConfig.driverId
    ) {
      const driver = await this.dbDriverResource.load(this.state.connectionConfig.driverId);
      if (!driver.embedded) {
        validation.error('plugin_connections_connection_form_host_invalid');
      }
    }

    if (!this.state.connectionConfig.name?.length) {
      validation.error('plugin_connections_connection_form_name_invalid');
    }

    if (this.state.connectionConfig.driverId && this.state.connectionConfig.configurationType) {
      const driver = await this.dbDriverResource.load(this.state.connectionConfig.driverId, ['includeProviderProperties']);

      if (!driver.configurationTypes.includes(this.state.connectionConfig.configurationType)) {
        validation.error('plugin_connections_connection_form_host_configuration_invalid');
      }
    }

    if (this.formState.state.connectionInfoParams.projectId !== null && this.formState.mode === 'create') {
      const project = this.projectInfoResource.get(this.formState.state.connectionInfoParams.projectId);

      if (!project?.canEditDataSources) {
        validation.error('plugin_connections_connection_form_project_invalid');
      }
    }

    // if (this.state.folder && !this.state.folder.match(CONNECTION_FOLDER_NAME_VALIDATION)) {
    //   validation.error('connections_connection_folder_validation');
    // }
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormRefactoredState>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormRefactoredState>>,
  ): Promise<void> {
    const status = contexts.getContext(formStatusContext);

    if (!this.formState.state.connectionInfoParams.projectId) {
      status.error('connections_connection_create_fail');
      return;
    }

    try {
      if (this.state.submitType === 'submit') {
        if (this.formState.mode === 'edit') {
          const connection = await this.connectionInfoResource.update(
            createConnectionParam(this.formState.state.connectionInfoParams.projectId, this.formState.state.connectionInfoParams.connectionId!),
            this.state.connectionConfig,
          );
          status.info('Connection was updated');
          status.info(connection.name);
        } else {
          const connection = await this.connectionInfoResource.create(
            this.formState.state.connectionInfoParams.projectId,
            this.state.connectionConfig,
          );
          this.formState.state.connectionInfoParams.connectionId = connection.id;
          status.info('Connection was created');
          status.info(connection.name);
        }
      } else {
        const info = await this.connectionInfoResource.test(this.formState.state.connectionInfoParams.projectId, this.state.connectionConfig);
        status.info('Connection is established');
        status.info('Client version: ' + info.clientVersion);
        status.info('Server version: ' + info.serverVersion);
        status.info('Connection time: ' + info.connectTime);
      }

      await this.formAuthState(data, contexts);
    } catch (exception: any) {
      if (this.state.submitType === 'submit') {
        status.error('connections_connection_create_fail', exception);
      } else {
        status.error('connections_connection_test_fail', exception);
      }
    }
  }
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
