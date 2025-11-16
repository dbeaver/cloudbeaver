/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import type { ISettingChangeData, ISettingsSource } from './ISettingsSource.js';

export abstract class SettingsSource implements ISettingsSource {
  readonly onChange: ISyncExecutor<ISettingChangeData>;
  private updating: boolean;
  constructor() {
    this.onChange = new SyncExecutor();
    this.updating = false;

    makeObservable<this, 'update'>(this, {
      update: action,
    });
  }

  protected abstract getSnapshot(): Record<string, any>;
  abstract has(key: any): boolean;
  abstract getValue(key: any): any;

  protected update(action: () => void): void {
    if (this.updating) {
      action();
      return;
    }

    this.updating = true;
    try {
      const snapshot = this.getSnapshot();
      action();
      const newSnapshot = this.getSnapshot();

      for (const [key, value] of Object.entries(newSnapshot)) {
        if (snapshot[key] !== value) {
          this.onChange.execute({ key, value });
        }
      }

      for (const key of Object.keys(snapshot)) {
        if (!(key in newSnapshot)) {
          this.onChange.execute({ key, value: undefined });
        }
      }
    } finally {
      this.updating = false;
    }
  }
}
