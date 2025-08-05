/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { FormMode, FormPart, formSubmitContext, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import { DriverConfigurationType, type ConnectionConfig, type ObjectPropertyInfo, type TestConnectionMutation } from '@cloudbeaver/core-sdk';
import { Executor, ExecutorInterrupter, type IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';
import {
  ConnectionInfoAuthPropertiesResource,
  ConnectionInfoCustomOptionsResource,
  ConnectionInfoProjectKey,
  ConnectionInfoProviderPropertiesResource,
  ConnectionInfoResource,
  createConnectionParam,
  DatabaseAuthModelsResource,
  DBDriverResource,
  type ConnectionInfoAuthProperties,
  type DBDriver,
} from '@cloudbeaver/core-connections';
import type { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { NotificationService } from '@cloudbeaver/core-events';
import { action, computed, makeObservable, observable, reaction, toJS } from 'mobx';
import { getUniqueName } from '@cloudbeaver/core-utils';
import { getObjectPropertyDefaults } from '@cloudbeaver/core-blocks';
import { isNotNullDefined } from '@dbeaver/js-helpers';
import { parseJdbcUri } from '@dbeaver/jdbc-uri-parser';

import { getDefaultConfigurationType } from './getDefaultConfigurationType.js';
import { getConnectionName } from './getConnectionName.js';
import type { IConnectionFormOptionsState } from './IConnectionFormOptionsState.js';
import type { IConnectionFormState } from '../IConnectionFormState.js';
import { ConnectionAuthenticationDialogLoader } from '../../ConnectionAuthentication/ConnectionAuthenticationDialogLoader.js';

const MAIN_PROPERTY_DATABASE_KEY = 'database';
const MAIN_PROPERTY_HOST_KEY = 'host';
const MAIN_PROPERTY_PORT_KEY = 'port';
const MAIN_PROPERTY_SERVER_KEY = 'server';

const defaultStateGetter = (connectionId?: string, credentials?: Record<string, any>) =>
  ({
    connectionId,
    configurationType: DriverConfigurationType.Manual,
    keepAliveInterval: 0,
    credentials: credentials ?? {},
    mainPropertyValues: {},
    networkHandlersConfig: [],
    providerProperties: {},
  }) as IConnectionFormOptionsState;

export class ConnectionFormOptionsPart extends FormPart<IConnectionFormOptionsState, IConnectionFormState> {
  private disposeReaction: () => void;

  readonly onDriverIdChange: IExecutor<string | undefined>;

  constructor(
    formState: IFormState<IConnectionFormState>,
    private readonly dbDriverResource: DBDriverResource,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionInfoAuthPropertiesResource: ConnectionInfoAuthPropertiesResource,
    private readonly connectionInfoCustomOptionsResource: ConnectionInfoCustomOptionsResource,
    private readonly connectionInfoProviderPropertiesResource: ConnectionInfoProviderPropertiesResource,
    private readonly localizationService: LocalizationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {
    super(formState, defaultStateGetter(formState.state.connectionId));

    this.onDriverIdChange = new Executor();

    this.disposeReaction = reaction(
      () => this.getNameTemplate(),
      (value, prev) => {
        if (this.formState.mode === 'edit') {
          return;
        }
        if (!this.state.name || prev === this.state.name) {
          this.state.name = value;
        }
      },
    );

    makeObservable<this, 'askCredentials'>(this, {
      setAuthModelId: action.bound,
      setDriverId: action.bound,
      connectionKey: computed,
      askCredentials: action.bound,
    });
  }

  private async askCredentials(state: IConnectionFormOptionsState): Promise<IConnectionFormOptionsState | null> {
    const driver = this.state.driverId ? this.dbDriverResource.get(this.state.driverId) : undefined;
    const isCredentialsRequired = !state.saveCredentials || this.formState.state.requiredNetworkHandlersIds.length;

    if (!isCredentialsRequired || driver?.anonymousAccess) {
      return state;
    }

    const stateToRestore: IConnectionFormOptionsState = {};

    // does not show credentials in dialog if they are already saved
    if (state.saveCredentials) {
      if (state.authModelId) {
        stateToRestore.authModelId = state.authModelId;
        delete state.authModelId;
      }

      if (state.credentials) {
        stateToRestore.credentials = toJS(state.credentials);
        delete state.credentials;
      }
    }

    // does not show network handlers in dialog if they are not required
    if (!this.formState.state.requiredNetworkHandlersIds.length && state.networkHandlersConfig) {
      stateToRestore.networkHandlersConfig = toJS(state.networkHandlersConfig);
      delete state.networkHandlersConfig;
    }

    const result = await this.commonDialogService.open(ConnectionAuthenticationDialogLoader, {
      config: state,
      authModelId: state.authModelId ?? null,
      networkHandlers: this.formState.state.requiredNetworkHandlersIds,
      projectId: this.formState.state.projectId,
    });

    if (result === DialogueStateResult.Rejected) {
      return null;
    }

    for (const key of Object.keys(stateToRestore)) {
      state[key as keyof IConnectionFormOptionsState] = observable(stateToRestore[key as keyof IConnectionFormOptionsState] as any);
    }

    return state;
  }

  get connectionKey() {
    if (!this.initialState.connectionId || !this.formState.state.projectId) {
      return null;
    }

    return createConnectionParam(this.formState.state.projectId, this.initialState.connectionId);
  }

  // do not check outdated of userInfoResource cause it synced with projectInfoResource which is handled in optionsPart outdated method
  // otherwise you would get an infinite loading of the form
  override isOutdated(): boolean {
    if (!this.formState.state.projectId) {
      return false;
    }

    if (this.formState.mode === 'create') {
      if (this.state.driverId && this.dbDriverResource.isOutdated(this.state.driverId)) {
        return true;
      }
    }

    if (!this.connectionKey) {
      return false;
    }

    const isAuthPropertiesOutdated = this.connectionInfoAuthPropertiesResource.isOutdated(this.connectionKey);
    const isCustomOptionsOutdated = this.connectionInfoCustomOptionsResource.isOutdated(this.connectionKey);
    const isProviderPropertiesOutdated = this.connectionInfoProviderPropertiesResource.isOutdated(this.connectionKey);

    return isAuthPropertiesOutdated || isCustomOptionsOutdated || isProviderPropertiesOutdated;
  }

  protected override async loader(): Promise<void> {
    if (this.formState.mode === 'create') {
      const credentials = this.state.authModelId
        ? getObjectPropertyDefaults(await this.getConnectionAuthModelProperties(this.state.authModelId))
        : undefined;

      this.setInitialState(defaultStateGetter(this.initialState.connectionId ?? this.formState.state.connectionId, credentials));

      await this.setDriverId(this.state.driverId);

      return;
    }

    if (!this.connectionKey) {
      console.error('Connection connection key should be defined');
      return;
    }

    const [authPropertiesInfo, customOptionsInfo, providerPropertiesInfo] = await Promise.all([
      this.connectionInfoAuthPropertiesResource.load(this.connectionKey),
      this.connectionInfoCustomOptionsResource.load(this.connectionKey),
      this.connectionInfoProviderPropertiesResource.load(this.connectionKey),
    ]);

    const config: ConnectionConfig = defaultStateGetter();

    config.connectionId = customOptionsInfo.id;
    config.configurationType = customOptionsInfo.configurationType;

    config.name = customOptionsInfo.name;
    config.description = customOptionsInfo.description;
    config.driverId = customOptionsInfo.driverId;

    config.host = customOptionsInfo.host || customOptionsInfo.mainPropertyValues?.[MAIN_PROPERTY_HOST_KEY];
    config.port = customOptionsInfo.port || customOptionsInfo.mainPropertyValues?.[MAIN_PROPERTY_PORT_KEY];
    config.serverName = customOptionsInfo.serverName || customOptionsInfo.mainPropertyValues?.[MAIN_PROPERTY_SERVER_KEY];
    config.databaseName = customOptionsInfo.databaseName || customOptionsInfo.mainPropertyValues?.[MAIN_PROPERTY_DATABASE_KEY];

    config.url = customOptionsInfo.url;
    config.folder = customOptionsInfo.folder;

    config.authModelId = authPropertiesInfo.authModel;
    config.saveCredentials = authPropertiesInfo.credentialsSaved;
    config.sharedCredentials = authPropertiesInfo.sharedCredentials;

    config.keepAliveInterval = customOptionsInfo.keepAliveInterval;
    config.autocommit = customOptionsInfo.autocommit;
    config.defaultCatalogName = customOptionsInfo.defaultCatalogName;
    config.defaultSchemaName = customOptionsInfo.defaultSchemaName;
    config.readOnly = customOptionsInfo.readOnly;

    if (authPropertiesInfo.authProperties) {
      for (const property of authPropertiesInfo.authProperties) {
        if (!property.features.includes('password')) {
          config.credentials[property.id!] = property.value;
        }
      }
    }

    if (providerPropertiesInfo.providerProperties) {
      config.providerProperties = { ...toJS(providerPropertiesInfo.providerProperties) };
    }

    if (customOptionsInfo.mainPropertyValues) {
      config.mainPropertyValues = { ...toJS(customOptionsInfo.mainPropertyValues) };
    }

    this.formState.state.availableDrivers = [customOptionsInfo.driverId];

    this.setInitialState(config);
  }

  private getNameTemplate() {
    const driver = this.state.driverId ? this.dbDriverResource.get(this.state.driverId) : undefined;

    if (this.state.configurationType === DriverConfigurationType.Url) {
      const parsedJdbcUri = parseJdbcUri(this.state.url ?? '');
      return getConnectionName({
        driverName: driver?.name || 'New connection',
        host: parsedJdbcUri.host,
        port: parsedJdbcUri.port,
        defaultPort: driver?.defaultPort,
      });
    }

    return getConnectionName({
      driverName: driver?.name || 'New connection',
      host: this.state.host,
      port: this.state.port,
      defaultPort: driver?.defaultPort,
    });
  }

  async setDriverId(driverId: string | undefined): Promise<void> {
    if (this.formState.mode === 'edit') {
      return;
    }

    let driver: DBDriver | undefined;
    let prevDriver: DBDriver | undefined;
    const prevDriverId = this.state.driverId;
    this.state.driverId = driverId;

    if (driverId) {
      driver = await this.dbDriverResource.load(driverId, ['includeProviderProperties']);
    }

    if (!driver) {
      return;
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

    if (driver?.id !== prevDriver?.id) {
      this.state.credentials = {};
      this.state.providerProperties = {};
      await this.setAuthModelId(driver?.defaultAuthModel);
      await this.onDriverIdChange.execute(this.state.driverId);
    }
  }

  async setAuthModelId(modelId: string | undefined): Promise<void> {
    if (modelId === this.initialState.authModelId) {
      this.state.credentials = { ...this.initialState.credentials };
    } else if (modelId !== this.state.authModelId) {
      const properties = modelId ? await this.getConnectionAuthModelProperties(modelId) : [];
      this.state.credentials = getObjectPropertyDefaults(properties);
    }

    this.state.authModelId = modelId;
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
    this.state.keepAliveInterval = this.state.keepAliveInterval ? Number(this.state.keepAliveInterval) : undefined;

    this.state.name = this.state.name?.trim();
    this.state.description = this.state.description?.trim();

    if (!this.state.folder) {
      delete this.state.folder;
    }

    if (this.state.configurationType === DriverConfigurationType.Url) {
      this.state.url = this.state.url?.trim();
    } else {
      // if manual type configuration set, it helps to keep host, port, etc. properties (not saved on backend)
      delete this.state.url;
    }

    // databaseName, host, port, serverName only saves on backend like this
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
      const authPropertiesInfo = this.connectionKey ? await this.connectionInfoAuthPropertiesResource.load(this.connectionKey) : undefined;

      const properties = await this.getConnectionAuthModelProperties(this.state.authModelId, authPropertiesInfo);
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

  private async getConnectionAuthModelProperties(authModelId: string, connectionInfo?: ConnectionInfoAuthProperties): Promise<ObjectPropertyInfo[]> {
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

    const submitType = contexts.getContext(formSubmitContext);
    if (submitType.type === 'submit') {
      if (this.formState.mode === 'edit') {
        await this.connectionInfoResource.update(this.connectionKey!, this.state);
      } else {
        const connections = await this.connectionInfoResource.load(ConnectionInfoProjectKey(this.formState.state.projectId));
        const connectionNames = connections.map(connection => connection.name);

        const uniqueName = getUniqueName(this.state.name || '', connectionNames);
        const connection = await this.connectionInfoResource.create(this.formState.state.projectId, { ...this.state, name: uniqueName });
        this.state.connectionId = connection.id;
        this.initialState.connectionId = connection.id;
        this.formState.setMode(FormMode.Edit);
      }
    } else {
      try {
        const stateCopy = await this.askCredentials(observable(toJS(this.state)));

        if (!stateCopy) {
          return;
        }

        const info = await this.connectionInfoResource.test(this.formState.state.projectId, stateCopy);

        this.notificationService.logSuccess({
          title: 'plugin_connections_connection_established',
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

  override dispose(): void {
    this.disposeReaction();
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
