/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { UserDataService } from '@cloudbeaver/core-authentication';
import { type IConnectionExecutionContextInfo, NOT_INITIALIZED_CONTEXT_ID } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import type { ProjectInfo } from '@cloudbeaver/core-projects';
import { getRmResourceKey, ResourceManagerResource } from '@cloudbeaver/core-resource-manager';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';

import { ResourceManagerScriptsSettingsService } from './ResourceManagerScriptsSettingsService.js';
import { SCRIPTS_TYPE_ID } from './SCRIPTS_TYPE_ID.js';

const queryResourceManagerScriptsSettingsKey = 'resource-manager-scripts';

interface ISettings {
  active: boolean;
}

interface IResourceProperties {
  'default-projectId'?: string;
  'default-datasource'?: string;
  'default-catalog'?: string;
  'default-schema'?: string;
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
    return this.resourceManagerService.enabled && !this.resourceManagerScriptsSettingsService.disabled;
  }

  constructor(
    private readonly userDataService: UserDataService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly resourceManagerResource: ResourceManagerResource,
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

  async createScript(resourceKey: string, executionContext?: IConnectionExecutionContextInfo, script = '') {
    await this.resourceManagerResource.writeText(resourceKey, script, false);

    await this.setExecutionContextInfo(resourceKey, executionContext);
  }

  async setExecutionContextInfo(
    path: string,
    executionContext: IConnectionExecutionContextInfo | undefined,
  ): Promise<IConnectionExecutionContextInfo | undefined> {
    if (!this.enabled) {
      return undefined;
    }
    const resourceKey = getRmResourceKey(path);

    const properties: IResourceProperties = await this.resourceManagerResource.setProperties(path, {
      'default-projectId': executionContext?.projectId,
      'default-datasource': executionContext?.connectionId,
      'default-catalog': executionContext?.defaultCatalog,
      'default-schema': executionContext?.defaultSchema,
    } as IResourceProperties);

    if (!properties['default-datasource']) {
      return undefined;
    }

    return {
      id: NOT_INITIALIZED_CONTEXT_ID,
      projectId: properties['default-projectId'] ?? resourceKey.projectId,
      connectionId: properties['default-datasource'],
      defaultCatalog: properties['default-catalog'],
      defaultSchema: properties['default-schema'],
    };
  }

  async getExecutionContextInfo(path: string): Promise<IConnectionExecutionContextInfo | undefined> {
    const resourcesInfo = await this.resourceManagerResource.load(path, ['includeProperties']);
    const properties: IResourceProperties = resourcesInfo.properties;
    const resourceKey = getRmResourceKey(path);

    if (!properties['default-datasource']) {
      return undefined;
    }

    return {
      id: NOT_INITIALIZED_CONTEXT_ID,
      projectId: properties['default-projectId'] ?? resourceKey.projectId,
      connectionId: properties['default-datasource'],
      defaultCatalog: properties['default-catalog'],
      defaultSchema: properties['default-schema'],
    };
  }
}

function getResourceManagerDefaultSettings(): ISettings {
  return {
    active: false,
  };
}
