/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { UserDataService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import type { ProjectInfo } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';

import { ResourceManagerScriptsSettingsService } from './ResourceManagerScriptsSettingsService';
import { SCRIPTS_TYPE_ID } from './SCRIPTS_TYPE_ID';

const queryResourceManagerScriptsSettingsKey = 'resource-manager-scripts';

interface ISettings {
  active: boolean;
}

@injectable()
export class ResourceManagerScriptsService {
  get active() {
    return this.enabled && this.settings.active;
  }

  get settings() {
    return this.userDataService.getUserData(queryResourceManagerScriptsSettingsKey, getResourceManagerDefaultSettings);
  }

  get enabled() {
    return this.resourceManagerService.enabled && !this.resourceManagerScriptsSettingsService.settings.getValue('disabled');
  }

  constructor(
    private readonly userDataService: UserDataService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly resourceManagerScriptsSettingsService: ResourceManagerScriptsSettingsService,
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

  getRootFolder(project: ProjectInfo) {
    const scriptType = project.resourceTypes.find(type => type.id === SCRIPTS_TYPE_ID);

    return this.serverConfigResource.distributed ? scriptType?.rootFolder : undefined;
  }
}

function getResourceManagerDefaultSettings(): ISettings {
  return {
    active: false,
  };
}