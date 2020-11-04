/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';

import { ConnectionAccess } from './ConnectionAccess/ConnectionAccess';
import { ConnectionFormService } from './ConnectionFormService';
import { DriverProperties } from './DriverProperties/DriverProperties';
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
    });
    this.connectionFormService.tabsContainer.add({
      key: 'driver_properties',
      name: 'customConnection_properties',
      order: 2,
      panel: () => DriverProperties,
      isDisabled: (tabId, props) => !props?.controller.driver,
    });
    this.connectionFormService.tabsContainer.add({
      key: 'access',
      name: 'connections_connection_edit_access',
      order: 3,
      isDisabled: (tabId, props) => !props?.controller.driver || this.administrationScreenService.isConfigurationMode,
      panel: () => ConnectionAccess,
    });
  }

  load(): void | Promise<void> { }
}
