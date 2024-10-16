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

import { ConnectionFormService } from '../ConnectionFormService.js';

export const ConnectionFormAuthenticationAction = React.lazy(async () => {
  const { ConnectionFormAuthenticationAction } = await import('./ConnectionFormAuthenticationAction.js');
  return { default: ConnectionFormAuthenticationAction };
});
export const OriginInfo = React.lazy(async () => {
  const { OriginInfo } = await import('./OriginInfo.js');
  return { default: OriginInfo };
});
export const OriginInfoTab = React.lazy(async () => {
  const { OriginInfoTab } = await import('./OriginInfoTab.js');
  return { default: OriginInfoTab };
});

@injectable()
export class ConnectionOriginInfoTabService extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.tabsContainer.add({
      key: 'origin',
      order: 3,
      tab: () => OriginInfoTab,
      panel: () => OriginInfo,
      stateGetter: () => () => ({}),
      isHidden: (tabId, props) => (props?.state.originInfo ? isLocalConnection(props.state.originInfo.origin) : true),
    });

    this.connectionFormService.actionsContainer.add(ConnectionFormAuthenticationAction, 0);
  }
}
