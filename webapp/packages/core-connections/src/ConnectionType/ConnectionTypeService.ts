/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ThemeService } from '@cloudbeaver/core-theming';

import { ConnectionTypeResource, mapColorValue, PREDEFINED_UNSET_COLOR } from './ConnectionTypeResource.js';
import { ConnectionInfoResource } from '../ConnectionInfoResource.js';
import type { IConnectionInfoParams } from '../CONNECTION_INFO_PARAM_SCHEMA.js';

@injectable(() => [ConnectionTypeResource, ConnectionInfoResource, ThemeService])
export class ConnectionTypeService {
  constructor(
    private readonly connectionTypeResource: ConnectionTypeResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly themeService: ThemeService,
  ) {}

  getConnectionTypeColor(connectionKey: IConnectionInfoParams): string | undefined {
    const connection = this.connectionInfoResource.get(connectionKey);

    if (!connection) {
      return;
    }

    return this.getTypeColor(connection.connectionType);
  }

  getTypeColor(typeId: string): string | undefined {
    const theme = this.themeService.currentTheme?.type;
    const connectionType = this.connectionTypeResource.get(typeId);

    if (!connectionType) {
      return;
    }

    let color = connectionType.colorLight;

    if (connectionType.colorDark && theme === 'dark') {
      color = connectionType.colorDark;
    }

    if (color === PREDEFINED_UNSET_COLOR) {
      return;
    }

    return mapColorValue(color);
  }
}
