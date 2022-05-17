/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import { ResourceManagerSettingsService } from './ResourceManagerSettingsService';

@injectable()
export class ResourceManagerService {
  get enabled() {
    return !this.resourceManagerSettingsService.settings.getValue('disabled');
  }

  panelEnabled: boolean;

  constructor(
    private readonly resourceManagerSettingsService: ResourceManagerSettingsService
  ) {
    this.togglePanel = this.togglePanel.bind(this);

    this.panelEnabled = false;

    makeObservable(this, {
      panelEnabled: observable.ref,
      enabled: computed,
    });
  }

  togglePanel() {
    this.panelEnabled = !this.panelEnabled;
  }
}