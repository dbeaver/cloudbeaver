/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { DriverPropertiesLoader } from './DriverPropertiesLoader.js';
import { ConnectionFormService } from '../ConnectionFormService.js';

@injectable()
export class ConnectionDriverPropertiesTabService extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'driver_properties',
      name: 'plugin_connections_connection_form_part_properties',
      title: 'plugin_connections_connection_form_part_properties',
      order: 2,
      panel: () => DriverPropertiesLoader,
      isDisabled: (tabId, props) => {
        if (props?.formState.state.config.driverId) {
          return !props.formState.state.config.driverId;
        }
        return true;
      },
    });
  }
}
