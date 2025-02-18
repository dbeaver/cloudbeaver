/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, runInAction, toJS } from 'mobx';
import React from 'react';

import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, UserInfoResource } from '@cloudbeaver/core-authentication';
import {
  ConnectionInfoProjectKey,
  createConnectionParam,
  DatabaseAuthModelsResource,
  type DatabaseConnection,
  DBDriverResource,
  isJDBCConnection,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { DriverConfigurationType, isObjectPropertyInfoStateEqual, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { formStateContext } from '@cloudbeaver/core-ui';
import { getUniqueName, isNotNullDefined, isValuesEqual } from '@cloudbeaver/core-utils';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext.js';
import { ConnectionFormService } from '../ConnectionFormService.js';
import { connectionConfigContext } from '../Contexts/connectionConfigContext.js';
import { connectionCredentialsStateContext } from '../Contexts/connectionCredentialsStateContext.js';
import type { IConnectionFormFillConfigData, IConnectionFormState, IConnectionFormSubmitData } from '../IConnectionFormProps.js';
import { getConnectionName } from './getConnectionName.js';
import { getDefaultConfigurationType } from './getDefaultConfigurationType.js';

export const Options = React.lazy(async () => {
  const { Options } = await import('./Options.js');
  return { default: Options };
});

const MAIN_PROPERTY_DATABASE_KEY = 'database';
const MAIN_PROPERTY_HOST_KEY = 'host';
const MAIN_PROPERTY_PORT_KEY = 'port';
const MAIN_PROPERTY_SERVER_KEY = 'server';

@injectable()
export class ConnectionOptionsTabService extends Bootstrap {
  constructor(
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly connectionFormService: ConnectionFormService,
    private readonly dbDriverResource: DBDriverResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly localizationService: LocalizationService,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly databaseAuthModelsResource: DatabaseAuthModelsResource,
  ) {
    super();

    makeObservable<this, 'fillConfig'>(this, {
      fillConfig: action,
    });
  }

  override register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'options',
      name: 'plugin_connections_connection_form_part_main',
      order: 1,
      panel: () => Options,
    });

    this.connectionFormService.prepareConfigTask.addHandler(this.prepareConfig.bind(this));

    this.connectionFormService.formValidationTask.addHandler(this.validate.bind(this));

    this.connectionFormService.formSubmittingTask.addHandler(this.save.bind(this));

    this.connectionFormService.formStateTask.addHandler(this.formState.bind(this)).addHandler(this.formAuthState.bind(this));

    this.connectionFormService.configureTask.addHandler(this.configure.bind(this));

    this.connectionFormService.fillConfigTask.addHandler(this.fillConfig.bind(this));
  }

  private async save({ state, submitType }: IConnectionFormSubmitData, contexts: IExecutionContextProvider<IConnectionFormSubmitData>) {
    const status = contexts.getContext(this.connectionFormService.connectionStatusContext);
    const config = contexts.getContext(connectionConfigContext);

    if (!state.projectId) {
      status.error('connections_connection_create_fail');
      return;
    }

    try {
      if (submitType === 'submit') {
        if (state.mode === 'edit') {
          const connection = await state.resource.update(createConnectionParam(state.projectId, config.connectionId!), config);
          status.info('Connection was updated');
          status.info(connection.name);
        } else {
          const connection = await state.resource.create(state.projectId, config);
          config.connectionId = connection.id;
          status.info('Connection was created');
          status.info(connection.name);
        }
      } else {
        const info = await state.resource.test(state.projectId, config);
        status.info('Connection is established');
        status.info('Client version: ' + info.clientVersion);
        status.info('Server version: ' + info.serverVersion);
        status.info('Connection time: ' + info.connectTime);
      }
    } catch (exception: any) {
      if (submitType === 'submit') {
        status.error('connections_connection_create_fail', exception);
      } else {
        status.error('connections_connection_test_fail', exception);
      }
    }
  }

  private async validate({ state }: IConnectionFormSubmitData, contexts: IExecutionContextProvider<IConnectionFormSubmitData>) {
    const validation = contexts.getContext(this.connectionFormService.connectionValidationContext);

    if (state.config.configurationType === DriverConfigurationType.Manual && state.config.host?.length === 0 && state.config.driverId) {
      const driver = await this.dbDriverResource.load(state.config.driverId);
      if (!driver.embedded) {
        validation.error('plugin_connections_connection_form_host_invalid');
      }
    }

    if (!state.config.name?.length) {
      validation.error('plugin_connections_connection_form_name_invalid');
    }

    if (state.config.driverId && state.config.configurationType) {
      const driver = await this.dbDriverResource.load(state.config.driverId, ['includeProviderProperties']);

      if (!driver.configurationTypes.includes(state.config.configurationType)) {
        validation.error('plugin_connections_connection_form_host_configuration_invalid');
      }
    }

    if (state.projectId !== null && state.mode === 'create') {
      const project = this.projectInfoResource.get(state.projectId);

      if (!project?.canEditDataSources) {
        validation.error('plugin_connections_connection_form_project_invalid');
      }
    }

    // if (state.config.folder && !state.config.folder.match(CONNECTION_FOLDER_NAME_VALIDATION)) {
    //   validation.error('connections_connection_folder_validation');
    // }
  }

  private async setDefaults(state: IConnectionFormState) {
    if (!state.config.driverId) {
      return;
    }

    const driver = await this.dbDriverResource.load(state.config.driverId, ['includeProviderProperties']);

    state.config.authModelId = driver?.defaultAuthModel;
    state.config.configurationType = getDefaultConfigurationType(driver);

    if (!state.config.host) {
      state.config.host = driver?.defaultServer || 'localhost';
    }

    if (!state.config.port) {
      state.config.port = driver?.defaultPort;
    }

    state.config.databaseName = driver?.defaultDatabase;
    state.config.url = driver?.sampleURL;

    if (isJDBCConnection(driver)) {
      state.config.name = state.config.url;
    } else {
      state.config.name = getConnectionName(driver.name || '', state.config.host, state.config.port, driver.defaultPort);
    }
  }

  private async fillConfig({ state, updated }: IConnectionFormFillConfigData, contexts: IExecutionContextProvider<IConnectionFormFillConfigData>) {
    if (!updated) {
      return;
    }

    if (!state.config.credentials || updated) {
      state.config.credentials = {};
      state.config.saveCredentials = false;
    }

    if (!state.config.providerProperties || updated) {
      state.config.providerProperties = {};
    }

    if (!state.config.mainPropertyValues || updated) {
      state.config.mainPropertyValues = {};
    }

    if (!state.info) {
      await this.setDefaults(state);
      return;
    }

    state.config.connectionId = state.info.id;
    state.config.configurationType = state.info.configurationType;

    state.config.name = state.info.name;
    state.config.description = state.info.description;
    state.config.template = state.info.template;
    state.config.driverId = state.info.driverId;

    state.config.host = state.info.mainPropertyValues[MAIN_PROPERTY_HOST_KEY];
    state.config.port = state.info.mainPropertyValues[MAIN_PROPERTY_PORT_KEY];
    state.config.serverName = state.info.mainPropertyValues[MAIN_PROPERTY_SERVER_KEY];
    state.config.databaseName = state.info.mainPropertyValues[MAIN_PROPERTY_DATABASE_KEY];

    state.config.url = state.info.url;
    state.config.folder = state.info.folder;

    state.config.authModelId = state.info.authModel;
    state.config.saveCredentials = state.info.credentialsSaved;
    state.config.sharedCredentials = state.info.sharedCredentials;

    state.config.keepAliveInterval = state.info.keepAliveInterval;
    state.config.autocommit = state.info.autocommit;
    state.config.readOnly = state.info.readOnly;

    if (state.info.authProperties) {
      for (const property of state.info.authProperties) {
        if (!property.features.includes('password')) {
          state.config.credentials[property.id!] = property.value;
        }
      }
    }

    if (state.info.providerProperties) {
      state.config.providerProperties = { ...state.info.providerProperties };
    }

    if (state.info.mainPropertyValues) {
      state.config.mainPropertyValues = { ...state.info.mainPropertyValues };
    }
  }

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('includeAuthProperties', 'includeCredentialsSaved', 'customIncludeOptions');
  }

  private async prepareConfig({ state }: IConnectionFormSubmitData, contexts: IExecutionContextProvider<IConnectionFormSubmitData>) {
    const config = contexts.getContext(connectionConfigContext);
    const credentialsState = contexts.getContext(connectionCredentialsStateContext);

    if (!state.config.driverId || !state.projectId) {
      return;
    }

    const driver = await this.dbDriverResource.load(state.config.driverId, ['includeProviderProperties', 'includeMainProperties']);
    const tempConfig = toJS(config);

    if (state.mode === 'edit') {
      tempConfig.connectionId = state.config.connectionId;
    }

    tempConfig.configurationType = state.config.configurationType;
    tempConfig.name = state.config.name?.trim();

    if (tempConfig.name && state.mode === 'create') {
      const connections = await state.resource.load(ConnectionInfoProjectKey(state.projectId));
      const connectionNames = connections.map(connection => connection.name);

      tempConfig.name = getUniqueName(tempConfig.name, connectionNames);
    }

    tempConfig.description = state.config.description?.trim();
    tempConfig.template = state.config.template;
    tempConfig.driverId = state.config.driverId;
    tempConfig.keepAliveInterval = Number(state.config.keepAliveInterval);
    tempConfig.autocommit = state.config.autocommit;
    tempConfig.readOnly = state.config.readOnly;

    if (!state.config.template && state.config.folder) {
      tempConfig.folder = state.config.folder;
    }

    if (tempConfig.configurationType === DriverConfigurationType.Url) {
      tempConfig.url = state.config.url?.trim();
    }

    tempConfig.mainPropertyValues = toJS(state.config.mainPropertyValues);

    if (tempConfig.configurationType === DriverConfigurationType.Manual && !driver.useCustomPage) {
      tempConfig.mainPropertyValues[MAIN_PROPERTY_DATABASE_KEY] = state.config.databaseName?.trim();

      if (!driver.embedded) {
        tempConfig.mainPropertyValues[MAIN_PROPERTY_HOST_KEY] = state.config.host?.trim();
        tempConfig.mainPropertyValues[MAIN_PROPERTY_PORT_KEY] = state.config.port?.trim();
      }

      if (driver.requiresServerName) {
        tempConfig.mainPropertyValues[MAIN_PROPERTY_SERVER_KEY] = state.config.serverName?.trim();
      }
    }

    if ((state.config.authModelId || driver.defaultAuthModel) && !driver.anonymousAccess) {
      tempConfig.authModelId = state.config.authModelId || driver.defaultAuthModel;
      tempConfig.sharedCredentials = state.config.sharedCredentials;
      tempConfig.saveCredentials = state.config.saveCredentials || tempConfig.sharedCredentials;

      const properties = await this.getConnectionAuthModelProperties(tempConfig.authModelId, state.info);

      if (this.isCredentialsChanged(properties, state.config.credentials)) {
        tempConfig.credentials = this.prepareDynamicProperties(properties, toJS(state.config.credentials));
      }

      if (!tempConfig.saveCredentials) {
        credentialsState.requireAuthModel(tempConfig.authModelId);
      }
    }

    if (driver.providerProperties.length > 0) {
      tempConfig.providerProperties = this.prepareDynamicProperties(
        driver.providerProperties,
        toJS(state.config.providerProperties),
        tempConfig.configurationType,
      );
    }

    if (driver.useCustomPage && driver.mainProperties.length > 0) {
      tempConfig.mainPropertyValues = this.prepareDynamicProperties(
        driver.mainProperties,
        tempConfig.mainPropertyValues,
        tempConfig.configurationType,
      );
    }

    runInAction(() => {
      Object.assign(config, tempConfig);
    });
  }

  private prepareDynamicProperties(
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

  private async formAuthState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const config = contexts.getContext(connectionConfigContext);
    const stateContext = contexts.getContext(formStateContext);

    const driver = await this.dbDriverResource.load(config.driverId!, ['includeProviderProperties', 'includeMainProperties']);
    const authModel = await this.databaseAuthModelsResource.load(config.authModelId ?? data.info?.authModel ?? driver.defaultAuthModel);

    const providerId = authModel.requiredAuth ?? data.info?.requiredAuth ?? AUTH_PROVIDER_LOCAL_ID;

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

  private async formState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    if (!data.info) {
      return;
    }

    const config = contexts.getContext(connectionConfigContext);
    const stateContext = contexts.getContext(formStateContext);
    const driver = await this.dbDriverResource.load(data.config.driverId!, ['includeProviderProperties', 'includeMainProperties']);

    if (
      !isValuesEqual(config.name, data.info.name, '') ||
      !isValuesEqual(config.configurationType, data.info.configurationType, DriverConfigurationType.Manual) ||
      !isValuesEqual(config.description, data.info.description, '') ||
      !isValuesEqual(config.template, data.info.template, true) ||
      !isValuesEqual(config.folder, data.info.folder, undefined) ||
      !isValuesEqual(config.driverId, data.info.driverId, '') ||
      (config.url !== undefined && !isValuesEqual(config.url, data.info.url, '')) ||
      (config.host !== undefined && !isValuesEqual(config.host, data.info.host, '')) ||
      (config.port !== undefined && !isValuesEqual(config.port, data.info.port, '')) ||
      (config.serverName !== undefined && !isValuesEqual(config.serverName, data.info.serverName, '')) ||
      (config.databaseName !== undefined && !isValuesEqual(config.databaseName, data.info.databaseName, '')) ||
      config.credentials !== undefined ||
      (config.authModelId !== undefined && !isValuesEqual(config.authModelId, data.info.authModel, '')) ||
      (config.saveCredentials !== undefined && config.saveCredentials !== data.info.credentialsSaved) ||
      (config.sharedCredentials !== undefined && config.sharedCredentials !== data.info.sharedCredentials) ||
      (config.providerProperties !== undefined &&
        !isObjectPropertyInfoStateEqual(driver.providerProperties, config.providerProperties, data.info.providerProperties)) ||
      (config.mainPropertyValues !== undefined &&
        !isObjectPropertyInfoStateEqual(driver.mainProperties, config.mainPropertyValues, data.info.mainPropertyValues)) ||
      (config.keepAliveInterval !== undefined && !isValuesEqual(config.keepAliveInterval, data.info.keepAliveInterval)) ||
      (config.autocommit !== undefined && !isValuesEqual(config.autocommit, data.info.autocommit))
    ) {
      stateContext.markEdited();
    }
  }

  private isCredentialsChanged(authProperties: ObjectPropertyInfo[], credentials: Record<string, any>) {
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

  private async getConnectionAuthModelProperties(authModelId: string, connectionInfo?: DatabaseConnection): Promise<ObjectPropertyInfo[]> {
    const authModel = await this.databaseAuthModelsResource.load(authModelId);

    let properties = authModel.properties;

    if (connectionInfo?.authProperties && connectionInfo.authProperties.length > 0) {
      properties = connectionInfo.authProperties;
    }

    return properties;
  }
}
