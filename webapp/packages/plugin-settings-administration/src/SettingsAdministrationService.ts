/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { ISettingsSource } from '@cloudbeaver/core-settings';
import { TabsContainer } from '@cloudbeaver/core-ui';

export interface IAdministrationSettingsOptions {
  source: ISettingsSource;
  accessor: string[];
}

@injectable()
export class SettingsAdministrationService {
  readonly tabsContainer: TabsContainer<void, IAdministrationSettingsOptions>;
  constructor() {
    this.tabsContainer = new TabsContainer('layer');
  }
}
