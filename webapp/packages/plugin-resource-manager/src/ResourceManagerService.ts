/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { AuthInfoService, UserDataService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';

const queryResourceManagerSettingsKey = 'resource-manager';

interface ISettings {
  active: boolean;
}

@injectable()
export class ResourceManagerService {
  get active() {
    return this.enabled && this.settings.active;
  }

  get settings() {
    return this.userDataService.getUserData(queryResourceManagerSettingsKey, getResourceManagerDefaultSettings);
  }

  get enabled() {
    return !!this.serverConfigResource.data?.resourceManagerEnabled && !!this.authInfoService.userInfo;
  }

  constructor(
    private readonly userDataService: UserDataService,
    private readonly authInfoService: AuthInfoService,
    private readonly serverConfigResource: ServerConfigResource
  ) {
    this.togglePanel = this.togglePanel.bind(this);

    makeObservable(this, {
      settings: computed,
      active: computed,
      enabled: computed,
    });
  }

  togglePanel() {
    this.settings.active = !this.settings.active;
  }
}

function getResourceManagerDefaultSettings(): ISettings {
  return {
    active: false,
  };
}