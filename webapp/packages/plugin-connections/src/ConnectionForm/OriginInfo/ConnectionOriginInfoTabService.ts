/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { isLocalConnection } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { connectionFormConfigureContext } from '../connectionFormConfigureContext';
import { ConnectionFormService } from '../ConnectionFormService';
import type { IConnectionFormState } from '../IConnectionFormProps';
import { ConnectionFormAuthenticationAction } from './ConnectionFormAuthenticationAction';
import { OriginInfo } from './OriginInfo';
import { OriginInfoTab } from './OriginInfoTab';

@injectable()
export class ConnectionOriginInfoTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
  ) {
    super();
  }

  register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'origin',
      order: 3,
      tab: () => OriginInfoTab,
      panel: () => OriginInfo,
      stateGetter: () => () => ({}),
      isHidden: (tabId, props) => props?.state.info ? isLocalConnection(props.state.info) : true,
    });

    this.connectionFormService.configureTask
      .addHandler(this.configure.bind(this));

    this.connectionFormService.actionsContainer
      .add(ConnectionFormAuthenticationAction, 0);
  }

  load(): void { }

  private configure(data: IConnectionFormState, contexts: IExecutionContextProvider<IConnectionFormState>) {
    const configuration = contexts.getContext(connectionFormConfigureContext);

    configuration.include('includeOrigin');
  }
}
