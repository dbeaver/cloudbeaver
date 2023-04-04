/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';

interface IDevToolsSettings {
  enabled: boolean;
  distributed: boolean;
}

const DEVTOOLS = 'devtools';

@injectable()
export class DevToolsService {
  get isEnabled(): boolean {
    return this.settings.enabled;
  }

  get isDistributed(): boolean {
    return this.settings.distributed;
  }

  private readonly settings: IDevToolsSettings;

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly autoSaveService: LocalStorageSaveService,
  ) {
    this.settings = getDefaultDevToolsSettings();

    makeObservable<this, 'settings'>(this, {
      settings: observable,
    });
    this.autoSaveService.withAutoSave(DEVTOOLS, this.settings, getDefaultDevToolsSettings);
    this.serverConfigResource.onDataUpdate.addHandler(this.syncDistributedMode.bind(this));
  }

  switch() {
    this.settings.enabled = !this.settings.enabled;
    this.syncDistributedMode();
  }

  setDistributedMode(distributed: boolean) {
    this.settings.distributed = distributed;
    this.syncDistributedMode();
  }

  private syncDistributedMode() {
    if (this.isEnabled) {
      if (this.serverConfigResource.data) {
        this.serverConfigResource.data.distributed = this.isDistributed;
      }
    }
  }
}

function getDefaultDevToolsSettings(): IDevToolsSettings {
  return {
    enabled: false,
    distributed: false,
  };
}