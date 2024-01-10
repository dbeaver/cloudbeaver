/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { isLocalConnection } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext';
import { ConnectionFormService } from '../ConnectionFormService';
import type { IConnectionFormState } from '../IConnectionFormProps';

export const ConnectionFormAuthenticationAction = React.lazy(async () => {
  const { ConnectionFormAuthenticationAction } = await import('./ConnectionFormAuthenticationAction');
  return { default: ConnectionFormAuthenticationAction };
});
export const OriginInfo = React.lazy(async () => {
  const { OriginInfo } = await import('./OriginInfo');
  return { default: OriginInfo };
});
export const OriginInfoTab = React.lazy(async () => {
  const { OriginInfoTab } = await import('./OriginInfoTab');
  return { default: OriginInfoTab };
});

@injectable()
export class ConnectionOriginInfoTabService extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'origin',
      order: 3,
      tab: () => OriginInfoTab,
      panel: () => OriginInfo,
      stateGetter: () => () => ({}),
      isHidden: (tabId, props) => (props?.state.info ? isLocalConnection(props.state.info) : true),
    });

    this.connectionFormService.configureTask.addHandler(this.configure.bind(this));

    this.connectionFormService.actionsContainer.add(ConnectionFormAuthenticationAction, 0);
  }

  load(): void {}

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('includeOrigin');
  }
}
