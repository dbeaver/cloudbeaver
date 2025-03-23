/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ConnectionFormService } from '../ConnectionFormService.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
import { importLazyComponent } from '@cloudbeaver/core-blocks';

const DriverProperties = importLazyComponent(() => import('./DriverProperties.js').then(m => m.DriverProperties));

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
      panel: () => DriverProperties,
      isDisabled: (tabId, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;

        if (optionsPart?.state.driverId) {
          return false;
        }

        return true;
      },
    });
  }
}
