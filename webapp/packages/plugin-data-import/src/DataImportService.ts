/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import { DataImportSettingsService } from './DataImportSettingsService';

@injectable()
export class DataImportService {
  get disabled() {
    return this.dataImportSettingsService.settings.getValue('disabled');
  }

  constructor(private readonly dataImportSettingsService: DataImportSettingsService) {
    makeObservable(this, {
      disabled: computed,
    });
  }
}
