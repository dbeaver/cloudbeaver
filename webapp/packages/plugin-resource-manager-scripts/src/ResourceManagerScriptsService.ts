/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { UserConfigurationStorage, UserDataService } from '@cloudbeaver/core-authentication';
import { type IConnectionExecutionContextInfo, NOT_INITIALIZED_CONTEXT_ID } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { ProjectInfo } from '@cloudbeaver/core-projects';
import { getRmResourceKey, ResourceManagerResource } from '@cloudbeaver/core-resource-manager';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';
import { SideBarPanelService } from '@cloudbeaver/core-ui';

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

export const SCRIPTS_TAB_ID = 'resource-manager-scripts-tab';

export class ResourceManagerScriptsServiceImpl {
  get active() {
    return this.enabled && this.settings.active;
  }

  get settings() {
    return this.userDataService
      .withStorage(this.userConfigurationStorage)
      .getUserData(queryResourceManagerScriptsSettingsKey, getResourceManagerDefaultSettings);
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
    private readonly sideBarPanelService: SideBarPanelService,
    private readonly userConfigurationStorage: UserConfigurationStorage,
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

  selectTab() {
    this.sideBarPanelService.tabsContainer.select(SCRIPTS_TAB_ID);
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

export type ResourceManagerScriptsService = ResourceManagerScriptsServiceImpl;

export class ResourceManagerScriptsServiceDI extends Context.Service<ResourceManagerScriptsServiceDI, ResourceManagerScriptsServiceImpl>()(
  '@cloudbeaver/plugin-resource-manager-scripts/ResourceManagerScriptsService#ResourceManagerScriptsService',
) {
  static readonly implementation = ResourceManagerScriptsServiceImpl;
  static readonly dependencies = () =>
    [
      UserDataService,
      ServerConfigResource,
      ResourceManagerService,
      ResourceManagerResource,
      ResourceManagerScriptsSettingsService,
      SideBarPanelService,
      UserConfigurationStorage,
    ] as const;
  static readonly make: Effect.Effect<
    ResourceManagerScriptsServiceImpl,
    never,
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof ResourceManagerService>
    | Context.Service.Identifier<typeof ResourceManagerResource>
    | Context.Service.Identifier<typeof ResourceManagerScriptsSettingsService>
    | Context.Service.Identifier<typeof SideBarPanelService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Effect.gen(function* makeResourceManagerScriptsService() {
    const userDataService = yield* UserDataService;
    const serverConfigResource = yield* ServerConfigResource;
    const resourceManagerService = yield* ResourceManagerService;
    const resourceManagerResource = yield* ResourceManagerResource;
    const resourceManagerScriptsSettingsService = yield* ResourceManagerScriptsSettingsService;
    const sideBarPanelService = yield* SideBarPanelService;
    const userConfigurationStorage = yield* UserConfigurationStorage;

    return new ResourceManagerScriptsServiceImpl(
      userDataService,
      serverConfigResource,
      resourceManagerService,
      resourceManagerResource,
      resourceManagerScriptsSettingsService,
      sideBarPanelService,
      userConfigurationStorage,
    );
  });
  static readonly layer: Layer.Layer<
    ResourceManagerScriptsServiceDI,
    never,
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof ResourceManagerService>
    | Context.Service.Identifier<typeof ResourceManagerResource>
    | Context.Service.Identifier<typeof ResourceManagerScriptsSettingsService>
    | Context.Service.Identifier<typeof SideBarPanelService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResourceManagerScriptsService = ResourceManagerScriptsServiceDI;
