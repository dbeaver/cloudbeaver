/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import type { IEditableSettingsSource } from './IEditableSettingsSource.js';
import { SettingsSource } from './SettingsSource.js';

export abstract class EditableSettingsSource extends SettingsSource implements IEditableSettingsSource {
  protected readonly changes: Map<any, any>;
  constructor() {
    super();
    this.changes = new Map();

    makeObservable<this, 'changes'>(this, {
      changes: observable.shallow,
      clear: action,
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

  abstract isReadOnly(key: any): boolean;
  abstract save(): Promise<void>;

  resetValue(key: any): void {
    this.setValue(key, null);
  }

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
}
