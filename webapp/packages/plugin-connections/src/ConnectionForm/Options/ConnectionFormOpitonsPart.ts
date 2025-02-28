/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormPart, formStateContext, formStatusContext, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import { DriverConfigurationType, type ConnectionConfig, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
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
import { toJS } from 'mobx';
import { getUniqueName, isNotNullDefined } from '@cloudbeaver/core-utils';
import { getDefaultConfigurationType } from './getDefaultConfigurationType.js';
import { getConnectionName } from './getConnectionName.js';
import type { LocalizationService } from '@cloudbeaver/core-localization';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext.js';
import type { IConnectionFormOptionsState } from './IConnectionFormOptionsState.js';
import type { IConnectionFormStateRefactored } from '../IConnectionFormStateRefactored.js';

const MAIN_PROPERTY_DATABASE_KEY = 'database';
const MAIN_PROPERTY_HOST_KEY = 'host';
const MAIN_PROPERTY_PORT_KEY = 'port';
const MAIN_PROPERTY_SERVER_KEY = 'server';

const defaultStateGetter = () =>
  ({
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
  }) as IConnectionFormOptionsState;

export class ConnectionFormOptionsPart extends FormPart<IConnectionFormOptionsState, IConnectionFormStateRefactored> {
  constructor(
    formState: IFormState<IConnectionFormStateRefactored>,
    private readonly dbDriverResource: DBDriverResource,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionInfoOriginResource: ConnectionInfoOriginResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly localizationService: LocalizationService,
  ) {
    super(formState, defaultStateGetter());
  }

  // TODO should we have it?
  // override get isChanged(): boolean {
  //   const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId));

  //   if (!info) {
  //     return super.isChanged;
  //   }

  //   const driver = this.formState.state.config.driverId ? this.dbDriverResource.get(this.formState.state.driverId) : undefined;

  //   return (
  //     super.isChanged ||
  //     // TODO do I need it?
  //     !isValuesEqual(this.state.name, info.name, '') ||
  //     !isValuesEqual(this.state.configurationType, info.configurationType, DriverConfigurationType.Manual) ||
  //     !isValuesEqual(this.state.description, info.description, '') ||
  //     !isValuesEqual(this.state.template, info.template, true) ||
  //     !isValuesEqual(this.state.folder, info.folder, undefined) ||
  //     !isValuesEqual(this.state.driverId, info.driverId, '') ||
  //     (this.state.url !== undefined && !isValuesEqual(this.state.url, info.url, '')) ||
  //     (this.state.host !== undefined && !isValuesEqual(this.state.host, info.host, '')) ||
  //     (this.state.port !== undefined && !isValuesEqual(this.state.port, info.port, '')) ||
  //     (this.state.serverName !== undefined && !isValuesEqual(this.state.serverName, info.serverName, '')) ||
  //     (this.state.databaseName !== undefined && !isValuesEqual(this.state.databaseName, info.databaseName, '')) ||
  //     this.state.credentials !== undefined ||
  //     (this.state.authModelId !== undefined && !isValuesEqual(this.state.authModelId, info.authModel, '')) ||
  //     (this.state.saveCredentials !== undefined && this.state.saveCredentials !== info.credentialsSaved) ||
  //     (this.state.sharedCredentials !== undefined && this.state.sharedCredentials !== info.sharedCredentials) ||
  //     (this.state.providerProperties !== undefined &&
  //       !isObjectPropertyInfoStateEqual(driver?.providerProperties ?? [], this.state.providerProperties, info.providerProperties)) ||
  //     (this.state.mainPropertyValues !== undefined &&
  //       !isObjectPropertyInfoStateEqual(driver?.mainProperties ?? [], this.state.mainPropertyValues, info.mainPropertyValues)) ||
  //     (this.state.keepAliveInterval !== undefined && !isValuesEqual(this.state.keepAliveInterval, info.keepAliveInterval)) ||
  //     (this.state.autocommit !== undefined && !isValuesEqual(this.state.autocommit, info.autocommit))
  //   );
  // }

  protected override async loader(): Promise<void> {
    const connectionId = this.formState.state.config.connectionId;
    const projectId = this.formState.state.projectId;
    let info = connectionId ? this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, connectionId)) : undefined;

    if (projectId && connectionId) {
      const key = createConnectionParam(projectId, connectionId);
      info = await this.connectionInfoResource.load(key, [
        'includeAuthProperties',
        'includeCredentialsSaved',
        'customIncludeOptions',
        'includeNetworkHandlersConfig',
        'includeProperties',
        'includeProviderProperties',
      ]);
      await this.connectionInfoOriginResource.load(key);
    }

    if (!info) {
      const defaultConnectionConfig = await this.getDefaults();
      const config = {
        ...defaultStateGetter(),
        ...defaultConnectionConfig,
      };

      this.formState.state.config = {
        ...config,
        ...this.formState.state.config,
      };
      this.setInitialState(config);
      return;
    }

    const config = defaultStateGetter();

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

    this.formState.state.config = config;
    this.setInitialState(config);
  }

  private async formAuthState(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ) {
    const stateContext = contexts.getContext(formStateContext);
    const driver = await this.dbDriverResource.load(this.state.driverId!, ['includeProviderProperties', 'includeMainProperties']);
    const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!));
    const authModel = await this.databaseAuthModelsResource.load(this.state.authModelId ?? info?.authModel ?? driver.defaultAuthModel);

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
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): Promise<void> {
    if (!this.state.driverId || !this.formState.state.projectId) {
      return;
    }

    const credentialsState = contexts.getContext(connectionCredentialsStateContext);
    const driver = await this.dbDriverResource.load(this.state.driverId, ['includeProviderProperties', 'includeMainProperties']);

    if (this.formState.mode === 'edit') {
      this.state.connectionId = this.formState.state.config.connectionId;
    }

    this.state.name = this.state.name?.trim();

    if (this.state.name && this.formState.mode === 'create') {
      const connections = await this.connectionInfoResource.load(ConnectionInfoProjectKey(this.formState.state.projectId));
      const connectionNames = connections.map(connection => connection.name);

      this.state.name = getUniqueName(this.state.name, connectionNames);
    }

    this.state.description = this.state.description?.trim();
    this.state.keepAliveInterval = Number(this.state.keepAliveInterval);

    if (this.state.configurationType === DriverConfigurationType.Url) {
      this.state.url = this.state.url?.trim();
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
      this.state.authModelId = this.state.authModelId || driver.defaultAuthModel;
      this.state.saveCredentials = this.state.saveCredentials || this.state.sharedCredentials;

      const info = this.connectionInfoResource.get(createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!));
      const properties = await this.getConnectionAuthModelProperties(this.state.authModelId, info);

      if (this.state.credentials && isCredentialsChanged(properties, this.state.credentials)) {
        this.state.credentials = prepareDynamicProperties(properties, toJS(this.state.credentials));
      }

      if (!this.state.saveCredentials) {
        credentialsState.requireAuthModel(this.state.authModelId || driver.defaultAuthModel);
      }
    }

    if (driver.providerProperties.length > 0 && this.state.providerProperties) {
      this.state.providerProperties = prepareDynamicProperties(
        driver.providerProperties,
        toJS(this.state.providerProperties),
        this.state.configurationType,
      );
    }

    if (driver.useCustomPage && driver.mainProperties.length > 0 && this.state.mainPropertyValues) {
      this.state.mainPropertyValues = prepareDynamicProperties(driver.mainProperties, this.state.mainPropertyValues, this.state.configurationType);
    }
  }

  private async getDefaults(): Promise<ConnectionConfig | undefined> {
    const driverId = this.formState.state.config.driverId || this.state.driverId;
    if (!driverId) {
      // TODO remove it?
      throw new Error('Driver id is not provided');
    }

    const defaultConnectionConfig: ConnectionConfig = { ...this.formState.state.config };

    const driver = await this.dbDriverResource.load(driverId, ['includeProviderProperties']);

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
      // TODO check this case
      defaultConnectionConfig.name = this.state.url;
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
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
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

    // if (this.state.folder && !this.state.folder.match(CONNECTION_FOLDER_NAME_VALIDATION)) {
    //   validation.error('connections_connection_folder_validation');
    // }
  }

  protected override async saveChanges(
    data: IFormState<IConnectionFormStateRefactored>,
    contexts: IExecutionContextProvider<IFormState<IConnectionFormStateRefactored>>,
  ): Promise<void> {
    const status = contexts.getContext(formStatusContext);

    if (!this.formState.state.projectId) {
      status.error('connections_connection_create_fail');
      return;
    }

    try {
      if (this.formState.state.submitType === 'submit') {
        if (this.formState.mode === 'edit') {
          const connection = await this.connectionInfoResource.update(
            createConnectionParam(this.formState.state.projectId, this.formState.state.config.connectionId!),
            this.state,
          );
          status.info('Connection was updated');
          status.info(connection.name);
        } else {
          const connection = await this.connectionInfoResource.create(this.formState.state.projectId, this.state);
          this.state.connectionId = connection.id;
          this.formState.state.config.connectionId = connection.id;
          status.info('Connection was created');
          status.info(connection.name);
        }
      } else {
        const info = await this.connectionInfoResource.test(this.formState.state.projectId, this.state);
        status.info('Connection is established');
        status.info('Client version: ' + info.clientVersion);
        status.info('Server version: ' + info.serverVersion);
        status.info('Connection time: ' + info.connectTime);
      }

      await this.formAuthState(data, contexts);
    } catch (exception: any) {
      if (this.formState.state.submitType === 'submit') {
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
