/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EAdminPermission } from '@cloudbeaver/core-administration';
import type { Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { PermissionsService } from '@cloudbeaver/core-root';

import { DataViewerSettingsService } from './DataViewerSettingsService';

@injectable()
export class DataViewerService {
  constructor(
    private readonly dataViewerSettingsService: DataViewerSettingsService,
    private readonly permissionsService: PermissionsService,
  ) { }

  isDataEditable(connection: Connection) {
    const isAdmin = this.permissionsService.has(EAdminPermission.admin);
    const editable = this.dataViewerSettingsService.settings.getValue(isAdmin ? 'edit.admin' : 'edit.users');
    return editable && !connection.readOnly;
  }
}