/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable } from 'mobx';

import { UserConfigurationStorage, UserDataService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

@injectable(() => [UserDataService, UserConfigurationStorage, VersionUpdateService])
export class PatchBannerService {
  private get settings() {
    return this.userDataService.withStorage(this.userConfigurationStorage).getUserData(
      'version-update-hotfix', // Preserve the persisted dismissal setting.
      () => ({ dismissedVersion: '' }),
      data => typeof data.dismissedVersion === 'string',
    );
  }

  get visible(): boolean {
    const patch = this.versionUpdateService.latestPatch;
    return !!patch && this.settings.dismissedVersion !== patch.number;
  }

  constructor(
    private readonly userDataService: UserDataService,
    private readonly userConfigurationStorage: UserConfigurationStorage,
    private readonly versionUpdateService: VersionUpdateService,
  ) {
    makeObservable<this, 'settings'>(this, {
      settings: computed,
      visible: computed,
      dismiss: action.bound,
    });
  }

  dismiss(): void {
    const patch = this.versionUpdateService.latestPatch;

    if (patch) {
      this.settings.dismissedVersion = patch.number;
    }
  }
}
