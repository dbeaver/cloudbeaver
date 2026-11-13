/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/// <reference types="vite/client" />
import { makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { StorageService } from '@cloudbeaver/core-storage';

interface IDevToolsSettings {
  enabled: boolean;
  override: boolean;
  distributed: boolean | null;
  configuration: boolean | null;
}

const DEVTOOLS = 'devtools';

export class DevToolsServiceImpl {
  get isEnabled(): boolean {
    return this.settings.enabled;
  }

  get isOverride(): boolean {
    return this.settings.override;
  }

  get isDistributed(): boolean {
    if (!this.isOverride) {
      return this.serverConfigResource.data?.distributed ?? false;
    }

    return this.settings.distributed ?? this.serverConfigResource.data?.distributed ?? false;
  }

  get isConfiguration(): boolean {
    if (!this.isOverride) {
      return this.serverConfigResource.data?.configurationMode ?? false;
    }

    return this.settings.configuration ?? this.serverConfigResource.data?.configurationMode ?? false;
  }

  private readonly settings: IDevToolsSettings;

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly storageService: StorageService,
  ) {
    this.settings = getDefaultDevToolsSettings();

    makeObservable<this, 'settings'>(this, {
      settings: observable,
    });

    this.storageService.registerSettings(DEVTOOLS, this.settings, getDefaultDevToolsSettings);
    this.serverConfigResource.onDataUpdate.addHandler(this.syncSettingsOverride.bind(this));
  }

  switch() {
    this.settings.enabled = !this.settings.enabled;
    this.syncSettingsOverride();
  }

  setOverride(override: boolean) {
    this.settings.override = override;
    this.syncSettingsOverride();
  }

  setDistributedMode(distributed: boolean) {
    this.settings.distributed = distributed;
    this.syncSettingsOverride();
  }

  setConfigurationMode(configuration: boolean) {
    this.settings.configuration = configuration;
    this.syncSettingsOverride();
  }

  private syncSettingsOverride() {
    if (this.isOverride && this.isEnabled) {
      if (this.serverConfigResource.data) {
        if (this.settings.distributed !== null) {
          this.serverConfigResource.data.distributed = this.isDistributed;
        }

        if (this.settings.configuration !== null) {
          this.serverConfigResource.data.configurationMode = this.isConfiguration;
        }
      }
    }
  }
}

export type DevToolsService = DevToolsServiceImpl;

export class DevToolsServiceDI extends Context.Service<DevToolsServiceDI, DevToolsServiceImpl>()(
  '@cloudbeaver/plugin-devtools/DevToolsService#DevToolsService',
) {
  static readonly implementation = DevToolsServiceImpl;

  static readonly dependencies = () => [ServerConfigResource, StorageService] as const;
  static readonly make: Effect.Effect<
    DevToolsServiceImpl,
    never,
    Context.Service.Identifier<typeof ServerConfigResource> | Context.Service.Identifier<typeof StorageService>
  > = Effect.gen(function* makeDevToolsService() {
    const serverConfigResource = yield* ServerConfigResource;
    const storageService = yield* StorageService;

    return new DevToolsServiceImpl(serverConfigResource, storageService);
  });
  static readonly layer: Layer.Layer<
    DevToolsServiceDI,
    never,
    Context.Service.Identifier<typeof ServerConfigResource> | Context.Service.Identifier<typeof StorageService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DevToolsService = DevToolsServiceDI;

function getDefaultDevToolsSettings(): IDevToolsSettings {
  return {
    enabled: import.meta.env.DEV,
    override: false,
    distributed: null,
    configuration: null,
  };
}
