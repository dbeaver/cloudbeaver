/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EConnectionFeature, ConnectionInfoResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';

import { SqlEditorSettingsService } from './SqlEditorSettingsService.js';

@injectable(() => [ConnectionInfoResource, SqlEditorSettingsService])
export class SqlEditorPermissionService {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly sqlEditorSettingsService: SqlEditorSettingsService,
  ) {}

  isScriptExecutionEnabled(connectionKey: IConnectionInfoParams): boolean {
    const connection = this.connectionInfoResource.get(connectionKey);

    if (!connection) {
      return false;
    }

    return !connection.features.includes(EConnectionFeature.restrictScriptExecute) && this.sqlEditorSettingsService.scriptExecutionEnabled;
  }
}
