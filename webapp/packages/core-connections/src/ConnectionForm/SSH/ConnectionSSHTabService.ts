/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';

import { DBDriverResource } from '../../DBDriverResource';
import { SSH_TUNNEL_ID } from '../../NetworkHandlerResource';
import { IConnectionFormSubmitData, ConnectionFormService } from '../ConnectionFormService';
import { SSH } from './SSH';
import { SSHTab } from './SSHTab';

@injectable()
export class ConnectionSSHTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly dbDriverResource: DBDriverResource
  ) {
    super();
  }

  register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'ssh',
      name: 'customConnection_options',
      order: 3,
      tab: () => SSHTab,
      panel: () => SSH,
      isHidden: (tabId, props) => {
        if (props?.data.config.driverId) {
          const driver = this.dbDriverResource.get(props.data.config.driverId);

          return !driver?.applicableNetworkHandlers.includes(SSH_TUNNEL_ID);
        }
        return true;
      },
    });

    this.connectionFormService.prepareConfigTask
      .addHandler(this.prepareConfig.bind(this));

    this.connectionFormService.formValidationTask
      .addHandler(this.validate.bind(this));
  }

  load(): void { }

  private validate(
    {
      data,
      options,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const validation = contexts.getContext(this.connectionFormService.connectionValidationContext);

    if (!data.config.networkHandlersConfig) {
      return;
    }

    for (const handler of data.config.networkHandlersConfig) {
      if (handler.enabled && handler.savePassword) {
        if (!handler.userName?.length) {
          validation.error("Field SSH 'User' can't be empty");
        }
        if (!handler.password?.length) {
          validation.error("Field SSH 'Password' can't be empty");
        }
      }
    }
  }

  private async prepareConfig(
    {
      data,
      options,
    }: IConnectionFormSubmitData,
    contexts: IExecutionContextProvider<IConnectionFormSubmitData>
  ) {
    const config = contexts.getContext(this.connectionFormService.connectionConfigContext);

    if (!data.config.networkHandlersConfig || data.config.networkHandlersConfig.length === 0) {
      return;
    }

    const configs: NetworkHandlerConfigInput[] = [];

    for (const handler of data.config.networkHandlersConfig) {
      const initialConfig = data.info?.networkHandlersConfig.find(h => h.id === handler.id);

      if (handler.enabled !== initialConfig?.enabled
          || handler.savePassword !== initialConfig?.savePassword
          || handler.userName !== initialConfig?.userName
          || (
            (initialConfig?.password === null && handler.password !== '')
              || (handler.password?.length || 0) > 0
          )
          || handler.properties.host !== initialConfig?.properties.host
          || handler.properties.port !== initialConfig?.properties.port) {
        configs.push(handler);
      }
    }

    if (configs.length > 0) {
      config.networkHandlersConfig = configs;
    }
  }
}
