/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';

import { DBDriverResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isObjectPropertyInfoStateEqual } from '@cloudbeaver/core-sdk';

import { ConnectionFormService } from '../ConnectionFormService';
import { connectionConfigContext } from '../Contexts/connectionConfigContext';
import { connectionFormStateContext } from '../Contexts/connectionFormStateContext';
import type { IConnectionFormFillConfigData, IConnectionFormSubmitData, IConnectionFormState } from '../IConnectionFormProps';
import { DriverProperties } from './DriverProperties';

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

  register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'driver_properties',
      name: 'customConnection_properties',
      title: 'customConnection_properties',
      order: 2,
      panel: () => DriverProperties,
      isDisabled: (tabId, props) => {
        if (props?.state.config.driverId) {
          return !props.state.config.driverId;
        }
        return true;
      },
    });

    this.connectionFormService.prepareConfigTask
      .addHandler(this.prepareConfig.bind(this));

    this.connectionFormService.formStateTask
      .addHandler(this.formState.bind(this));

    this.connectionFormService.fillConfigTask
      .addHandler(this.fillConfig.bind(this));
  }

  load(): void { }

  private fillConfig(
    { state, updated }: IConnectionFormFillConfigData,
    contexts: IExecutionContextProvider<IConnectionFormFillConfigData>
  ) {
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

  private prepareConfig(
    {
      state,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const config = contexts.getContext(connectionConfigContext);

    config.properties = { ...state.config.properties };
  }

  private formState(
    data: IConnectionFormState,
    contexts: IExecutionContextProvider<IConnectionFormState>
  ) {
    if (!data.info || !data.config.driverId) {
      return;
    }

    const config = contexts.getContext(connectionConfigContext);
    const driver = this.dbDriverResource.get(data.config.driverId);

    if (!driver?.driverProperties) {
      return;
    }

    if (!isObjectPropertyInfoStateEqual(driver.driverProperties, config.properties, data.info.properties)) {
      const stateContext = contexts.getContext(connectionFormStateContext);

      stateContext.markEdited();
    }
  }
}
