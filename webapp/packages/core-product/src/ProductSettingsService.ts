/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ISettingsSource, SettingsSource } from '@cloudbeaver/core-settings';

@injectable()
export class ProductSettingsService extends SettingsSource {
  constructor(fallback: ISettingsSource) {
    super(fallback);
  }

  setValue(key: string, value: any) {
    this.fallback?.setValue(key, value);
  }

  setSelfValue(key: string, value: string) {
    super.setValue(key, value);
  }
}
