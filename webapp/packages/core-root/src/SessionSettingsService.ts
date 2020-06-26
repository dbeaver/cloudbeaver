/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SettingsSource } from '@cloudbeaver/core-settings';

@injectable()
export class SessionSettingsService extends SettingsSource {

  constructor(private localStorageKey: string) {
    super();
    const state = localStorage.getItem(this.localStorageKey);
    if (state) {
      this.store = JSON.parse(state);
    }
  }

  setValue(key: string, value: string) {
    super.setValue(key, value);
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.store));
  }
}
