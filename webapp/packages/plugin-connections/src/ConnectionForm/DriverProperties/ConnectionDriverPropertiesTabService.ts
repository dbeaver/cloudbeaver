/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable } from 'mobx';

import { DBDriverResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isObjectPropertyInfoStateEqual } from '@cloudbeaver/core-sdk';
import { formStateContext } from '@cloudbeaver/core-ui';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext.js';
import { ConnectionFormService } from '../ConnectionFormService.js';
import { connectionConfigContext } from '../Contexts/connectionConfigContext.js';
import type { IConnectionFormFillConfigData, IConnectionFormState, IConnectionFormSubmitData } from '../IConnectionFormProps.js';
import { DriverPropertiesLoader } from './DriverPropertiesLoader.js';

@injectable()
export class ConnectionDriverPropertiesTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly dbDriverResource: DBDriverResource,
  ) {
    super();

    makeObservable<this, 'fillConfig'>(this, {
      fillConfig: action,
    });
  }

  override register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'driver_properties',
      name: 'plugin_connections_connection_form_part_properties',
      title: 'plugin_connections_connection_form_part_properties',
      order: 2,
      panel: () => DriverPropertiesLoader,
      isDisabled: (tabId, props) => {
        if (props?.state.config.driverId) {
          return !props.state.config.driverId;
        }
        return true;
      },
    });

    this.connectionFormService.prepareConfigTask.addHandler(this.prepareConfig.bind(this));

    this.connectionFormService.formStateTask.addHandler(this.formState.bind(this));

    this.connectionFormService.fillConfigTask.addHandler(this.fillConfig.bind(this));

    this.connectionFormService.configureTask.addHandler(this.configure.bind(this));
  }

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('includeProperties', 'includeProviderProperties');
  }

  private fillConfig({ state, updated }: IConnectionFormFillConfigData, contexts: IExecutionContextProvider<IConnectionFormFillConfigData>) {
    if (!updated) {
      return;
    }
    if (!state.config.properties) {
      state.config.properties = {};
    }

    if (!state.info) {
      return;
    }

    state.config.properties = { ...state.info.properties };
  }

  private prepareConfig({ state }: IConnectionFormSubmitData, contexts: IExecutionContextProvider<IConnectionFormSubmitData>) {
    const config = contexts.getContext(connectionConfigContext);

    config.properties = { ...state.config.properties };

    if (config.driverId) {
      const driver = this.dbDriverResource.get(config.driverId);
      const trimmedProperties: typeof config.properties = {};

      const defaultDriverProperties = new Set(driver?.driverProperties?.map(property => property.id) ?? []);

      for (let key of Object.keys(config.properties)) {
        const value = config.properties[key];
        if (!defaultDriverProperties?.has(key)) {
          key = key.trim();
        }

        trimmedProperties[key] = typeof value === 'string' ? value.trim() : value;
      }

      config.properties = trimmedProperties;
    }
  }

  private formState(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    if (!data.info || !data.config.driverId) {
      return;
    }

    const config = contexts.getContext(connectionConfigContext);
    const driver = this.dbDriverResource.get(data.config.driverId);

    if (!driver?.driverProperties) {
      return;
    }

    if (!isObjectPropertyInfoStateEqual(driver.driverProperties, config.properties, data.info.properties)) {
      const stateContext = contexts.getContext(formStateContext);

      stateContext.markEdited();
    }
  }
}
