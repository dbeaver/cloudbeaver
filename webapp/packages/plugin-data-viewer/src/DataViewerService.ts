/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';

import { DataViewerSettingsService } from './DataViewerSettingsService.js';

@injectable()
export class DataViewerService {
  get canCopyData() {
    return this.sessionPermissionsResource.has(EAdminPermission.admin) || !this.dataViewerSettingsService.disableCopyData;
  }

  get canExportData() {
    return this.sessionPermissionsResource.has(EAdminPermission.admin) || !this.dataViewerSettingsService.disableExportData;
  }

  constructor(
    private readonly dataViewerSettingsService: DataViewerSettingsService,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
  ) {}

  isDataEditable(connection: Connection) {
    if (connection.readOnly) {
      return false;
    }

    const isAdmin = this.sessionPermissionsResource.has(EAdminPermission.admin);
    const disabled = this.dataViewerSettingsService.disableEdit;

    return isAdmin || !disabled;
  }
}
