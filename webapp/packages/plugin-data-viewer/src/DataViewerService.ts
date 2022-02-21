/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';

import { DataViewerSettingsService } from './DataViewerSettingsService';

@injectable()
export class DataViewerService {
  constructor(
    private readonly dataViewerSettingsService: DataViewerSettingsService,
  ) { }

  isDataEditable(connection: Connection) {
    const disabled = this.dataViewerSettingsService.settings.getValue('disableEdit');
    return !disabled && !connection.readOnly;
  }
}