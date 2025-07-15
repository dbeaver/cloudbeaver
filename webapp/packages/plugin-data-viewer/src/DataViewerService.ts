/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';

import { DataViewerSettingsService } from './DataViewerSettingsService.js';
import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel.js';

export interface IErrorActionsContainerData {
  model: IDatabaseDataModel<any>;
}

@injectable()
export class DataViewerService {
  readonly errorActionsContainer: PlaceholderContainer<IErrorActionsContainerData>;

  get canCopyData() {
    return this.sessionPermissionsResource.has(EAdminPermission.admin) || !this.dataViewerSettingsService.disableCopyData;
  }

  get canExportData() {
    return this.sessionPermissionsResource.has(EAdminPermission.admin) || !this.dataViewerSettingsService.disableExportData;
  }

  constructor(
    private readonly dataViewerSettingsService: DataViewerSettingsService,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
  ) {
    this.errorActionsContainer = new PlaceholderContainer();
  }

  isDataEditable(connection: Connection) {
    if (connection.readOnly) {
      return false;
    }

    const isAdmin = this.sessionPermissionsResource.has(EAdminPermission.admin);
    const disabled = this.dataViewerSettingsService.disableEdit;

    return isAdmin || !disabled;
  }
}
