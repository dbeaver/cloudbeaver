/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { uuid } from '@cloudbeaver/core-utils';

export class SettingsGroup {
  readonly id: string;
  readonly subGroups: SettingsGroup[];

  protected groups: Map<string, SettingsGroup>;

  constructor(readonly name: string, readonly parent?: SettingsGroup) {
    this.id = uuid();
    this.subGroups = [];
    this.groups = parent?.groups || new Map();

    this.groups.set(this.id, this);
  }

  get(id: string): SettingsGroup | undefined {
    return this.groups.get(id);
  }

  createSubGroup(name: string): SettingsGroup {
    const subGroup = new SettingsGroup(name, this);

    this.subGroups.push(subGroup);

    return subGroup;
  }
}
