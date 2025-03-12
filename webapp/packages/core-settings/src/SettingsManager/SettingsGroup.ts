/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { uuid } from '@cloudbeaver/core-utils';

export class SettingsGroup {
  readonly id: string;
  order: number;

  get level(): number {
    return (this.parent?.level ?? -1) + 1;
  }

  get subGroups(): ReadonlyArray<SettingsGroup> {
    return this.subGroupsData;
  }

  protected groups: Map<string, SettingsGroup>;
  private subGroupsData: SettingsGroup[];

  constructor(
    readonly name: string,
    readonly parent?: SettingsGroup,
  ) {
    this.id = uuid();
    this.order = Number.MAX_SAFE_INTEGER;
    this.subGroupsData = [];
    this.groups = parent?.groups || new Map();
    this.groups.set(this.id, this);

    makeObservable<this, 'subGroupsData' | 'groups'>(this, {
      subGroupsData: observable.shallow,
      groups: observable.shallow,
    });
  }

  has(id: string): boolean {
    return this.groups.has(id);
  }

  get(id: string): SettingsGroup | undefined {
    return this.groups.get(id);
  }

  createSubGroup(name: string): SettingsGroup {
    const subGroup = new SettingsGroup(name, this);

    this.subGroupsData.push(subGroup);

    return subGroup;
  }

  setOrder(order: number): this {
    this.order = order;
    return this;
  }

  deleteSubGroup(id: string): boolean {
    const index = this.subGroupsData.findIndex(group => group.id === id);

    if (index === -1) {
      return false;
    }

    this.subGroupsData.splice(index, 1);
    this.groups.delete(id);

    return true;
  }
}
