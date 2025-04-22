/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import type { ISettingChangeData, ISettingsSource } from './ISettingsSource.js';

export abstract class SettingsSource implements ISettingsSource {
  readonly onChange: ISyncExecutor<ISettingChangeData>;
  private updating: boolean;
  protected readonly changes: Map<any, any>;
  constructor() {
    this.onChange = new SyncExecutor();
    this.updating = false;
    this.changes = new Map();

    makeObservable<this, 'update' | 'changes'>(this, {
      changes: observable.shallow,
      update: action,
    });
  }

  has(key: any): boolean {
    return this.changes.has(key);
  }

  isEdited(key?: any): boolean {
    if (isNotNullDefined(key)) {
      return this.changes.has(key);
    }

    return this.changes.size > 0;
  }

  protected abstract getSnapshot(): Record<string, any>;
  abstract isReadOnly(key: any): boolean;
  abstract getValue(key: any): any;
  abstract save(): Promise<void>;

  clear(): void {
    this.changes.clear();
  }

  getEditedValue(key: any): any {
    if (this.changes.has(key)) {
      return this.changes.get(key);
    }

    return this.getValue(key);
  }

  setValue(key: any, value: any): void {
    const currentValue = this.getValue(key);
    if (currentValue === value || (!isNotNullDefined(currentValue) && value === null)) {
      this.changes.delete(key);
    } else {
      this.changes.set(key, value);
    }
  }

  protected update(action: () => void) {
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
