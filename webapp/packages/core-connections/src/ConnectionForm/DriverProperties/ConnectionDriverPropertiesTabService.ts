/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { IConnectionFormSubmitData, ConnectionFormService } from '../ConnectionFormService';
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
        if (props?.data.config.driverId) {
          return !props?.data.config.driverId;
        }
        return true;
      },
    });

    this.connectionFormService.prepareConfigTask
      .addHandler(this.prepareConfig.bind(this));
  }

  load(): void { }

  private async prepareConfig(
    {
      data,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const config = contexts.getContext(this.connectionFormService.connectionConfigContext);

    config.properties = data.config.properties;
  }
}
