/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoOriginResource, isLocalConnection } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ConnectionFormService } from '../ConnectionFormService.js';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
export const ConnectionFormAuthenticationAction = importLazyComponent(() =>
  import('./ConnectionFormAuthenticationAction.js').then(m => m.ConnectionFormAuthenticationAction),
);

const OriginInfo = importLazyComponent(() => import('./OriginInfo.js').then(m => m.OriginInfo));
const OriginInfoTab = importLazyComponent(() => import('./OriginInfoTab.js').then(m => m.OriginInfoTab));

@injectable()
export class ConnectionOriginInfoTabService extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly connectionInfoOriginResource: ConnectionInfoOriginResource,
  ) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'origin',
      order: 3,
      tab: () => OriginInfoTab,
      panel: () => OriginInfo,
      getLoader: () => getCachedMapResourceLoaderState(this.connectionInfoOriginResource, () => CachedMapAllKey),
      isHidden: (tabId, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;
        const key = optionsPart?.connectionKey;
        const originInfo = key ? this.connectionInfoOriginResource.get(key) : null;

        if (!originInfo) {
          return true;
        }

        return isLocalConnection(originInfo.origin);
      },
    });

    this.connectionFormService.actionsContainer.add(ConnectionFormAuthenticationAction, 0);
  }
}
