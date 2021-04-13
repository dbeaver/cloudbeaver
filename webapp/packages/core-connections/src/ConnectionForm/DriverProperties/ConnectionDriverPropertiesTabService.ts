/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isPropertiesEqual } from '@cloudbeaver/core-utils';

import { connectionConfigContext } from '../connectionConfigContext';
import { IConnectionFormSubmitData, ConnectionFormService, IConnectionFormState } from '../ConnectionFormService';
import { connectionFormStateContext } from '../connectionFormStateContext';
import { DriverProperties } from './DriverProperties';

@injectable()
export class ConnectionDriverPropertiesTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService
  ) {
    super();
  }

  register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'driver_properties',
      name: 'customConnection_properties',
      order: 2,
      panel: () => DriverProperties,
      isDisabled: (tabId, props) => {
        if (props?.state.config.driverId) {
          return !props?.state.config.driverId;
        }
        return true;
      },
    });

    this.connectionFormService.prepareConfigTask
      .addHandler(this.prepareConfig.bind(this));

    this.connectionFormService.formStateTask
      .addHandler(this.formState.bind(this));
  }

  load(): void { }

  private prepareConfig(
    {
      state,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const config = contexts.getContext(connectionConfigContext);

    config.properties = state.config.properties;
  }

  private formState(
    data: IConnectionFormState,
    contexts: IExecutionContextProvider<IConnectionFormState>
  ) {
    const config = contexts.getContext(connectionConfigContext);
    if (!isPropertiesEqual(config.properties, data.info?.properties)) {
      const stateContext = contexts.getContext(connectionFormStateContext);

      stateContext.markEdited();
    }
  }
}
