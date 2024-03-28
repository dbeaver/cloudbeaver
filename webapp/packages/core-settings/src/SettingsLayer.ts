/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ISettingsLayer {
  parent: ISettingsLayer | null;
  level: number;
  name: string;
}

class SettingsLayer implements ISettingsLayer {
  parent: ISettingsLayer | null;
  get level(): number {
    if (!this.parent) {
      return 0;
    }
    return this.parent.level + 1;
  }
  name: string;

  constructor(parent: ISettingsLayer | null, name: string) {
    this.parent = parent;
    this.name = name;
  }
}

export function createSettingsLayer(parent: ISettingsLayer, name: string): ISettingsLayer {
  return new SettingsLayer(parent, name);
}

export const ROOT_SETTINGS_LAYER = new SettingsLayer(null, 'root');
