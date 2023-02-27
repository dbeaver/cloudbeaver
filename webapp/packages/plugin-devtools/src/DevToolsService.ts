/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';

interface IDevToolsSettings {
  enabled: boolean;
}

const DEVTOOLS = 'devtools';

@injectable()
export class DevToolsService {
  get isEnabled(): boolean {
    return this.settings.enabled;
  }

  private readonly settings: IDevToolsSettings;

  constructor(
    private readonly autoSaveService: LocalStorageSaveService,
  ) {
    this.settings = getDefaultDevToolsSettings();

    makeObservable<this, 'settings'>(this, {
      settings: observable,
    });
    this.autoSaveService.withAutoSave(DEVTOOLS, this.settings, getDefaultDevToolsSettings);
  }

  switch() {
    this.settings.enabled = !this.settings.enabled;
  }
}

function getDefaultDevToolsSettings(): IDevToolsSettings {
  return {
    enabled: false,
  };
}