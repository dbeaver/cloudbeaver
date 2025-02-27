/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoOriginResource, createConnectionParam, isLocalConnection } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ConnectionFormServiceRefactored } from '../ConnectionFormServiceRefactored.js';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

export const ConnectionFormAuthenticationAction = importLazyComponent(() =>
  import('./ConnectionFormAuthenticationAction.js').then(m => m.ConnectionFormAuthenticationAction),
);

export const OriginInfo = importLazyComponent(() => import('./OriginInfo.js').then(m => m.OriginInfo));
export const OriginInfoTab = importLazyComponent(() => import('./OriginInfoTab.js').then(m => m.OriginInfoTab));

@injectable()
export class ConnectionOriginInfoTabService extends Bootstrap {
  constructor(
    private readonly connectionFormServiceRefactored: ConnectionFormServiceRefactored,
    private readonly connectionInfoOriginResource: ConnectionInfoOriginResource,
  ) {
    super();
  }

  override register(): void {
    this.connectionFormServiceRefactored.parts.add({
      key: 'origin',
      order: 3,
      tab: () => OriginInfoTab,
      panel: () => OriginInfo,
      isHidden: (tabId, props) => {
        const projectId = props?.formState.state.projectId;
        const connectionId = props?.formState.state.config.connectionId;

        if (!projectId || !connectionId) {
          return true;
        }

        // TODO it is better to preload it
        const originInfo = this.connectionInfoOriginResource.get(createConnectionParam(projectId, connectionId));

        return originInfo ? isLocalConnection(originInfo.origin) : true;
      },
    });

    this.connectionFormServiceRefactored.actionsContainer.add(ConnectionFormAuthenticationAction, 0);
  }
}
