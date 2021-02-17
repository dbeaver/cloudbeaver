/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { isLocalConnection } from '../../Administration/ConnectionsResource';
import { ConnectionFormService } from '../ConnectionFormService';
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
      isHidden: (tabId, props) => props?.data.info ? isLocalConnection(props.data.info) : true,
    });
  }

  load(): void { }
}
