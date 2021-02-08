/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';

import { ConnectionFormService } from './ConnectionFormService';
import { Options } from './Options/Options';

@injectable()
export class ConnectionFormBaseBootstrap extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private administrationScreenService: AdministrationScreenService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.connectionFormService.tabsContainer.add({
      key: 'options',
      name: 'customConnection_options',
      order: 1,
      panel: () => Options,
      options: {
        beforeSubmit: () => {},
      },
    });
  }

  load(): void | Promise<void> { }
}
