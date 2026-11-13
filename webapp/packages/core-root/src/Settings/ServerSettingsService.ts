/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { PRODUCT_SETTINGS_LAYER } from '@cloudbeaver/core-product';
import { createSettingsLayer, EditableSettingsSource } from '@cloudbeaver/core-settings';

import { EAdminPermission } from '../EAdminPermission.js';
import { ServerConfigResource } from '../ServerConfigResource.js';
import { SessionPermissionsResource } from '../SessionPermissionsResource.js';

export const SERVER_SETTINGS_LAYER = createSettingsLayer(PRODUCT_SETTINGS_LAYER, 'server');

export class ServerSettingsServiceImpl extends EditableSettingsSource {
  private readonly settings: Map<string, any>;
  private lastConfig: any;

  constructor(
    readonly serverConfigResource: ServerConfigResource,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super();
    this.lastConfig = null;
    this.settings = new Map();
    this.serverConfigResource.onDataUpdate.addHandler(this.refreshConfig.bind(this));

    makeObservable<this, 'settings' | 'refreshConfig'>(this, {
      refreshConfig: action,
      settings: observable.shallow,
    });
  }

  override has(key: any): boolean {
    return this.settings.has(key) || super.has(key);
  }

  isOverrideDefaults(): boolean {
    return this.settings.size > 0;
  }

  isReadOnly(key: any): boolean {
    return !this.serverConfigResource.configurationMode && !this.sessionPermissionsResource.has(EAdminPermission.admin);
  }

  getValue(key: any): any {
    return this.settings.get(key);
  }

  async save() {
    await this.serverConfigResource.updateProductConfiguration(this.getChanges());
  }

  getChanges(): Record<string, unknown> {
    return Object.fromEntries(this.changes);
  }

  protected getSnapshot() {
    return Object.fromEntries(this.settings);
  }

  restoreDefaults() {
    this.update(() => {
      this.clear();

      for (const key of this.settings.keys()) {
        this.resetValue(key);
      }
    });
  }

  private refreshConfig() {
    this.update(() => {
      this.clear();
      this.settings.clear();

      if (!this.serverConfigResource.data) {
        this.lastConfig = null;
        return;
      }

      if (this.serverConfigResource.data.productConfiguration !== this.lastConfig) {
        this.lastConfig = this.serverConfigResource.data.productConfiguration;

        if (this.lastConfig && typeof this.lastConfig === 'object') {
          for (const [key, value] of Object.entries(this.lastConfig)) {
            this.settings.set(key, value);
          }
        }
      }
    });
  }
}

export type ServerSettingsService = ServerSettingsServiceImpl;

export class ServerSettingsServiceDI extends Context.Service<ServerSettingsServiceDI, ServerSettingsServiceImpl>()(
  '@cloudbeaver/core-root/Settings/ServerSettingsService#ServerSettingsService',
) {
  static readonly implementation = ServerSettingsServiceImpl;

  static readonly dependencies = () => [ServerConfigResource, SessionPermissionsResource] as const;
  static readonly make: Effect.Effect<
    ServerSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof ServerConfigResource> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Effect.gen(function* makeServerSettingsService() {
    const serverConfigResource = yield* ServerConfigResource;
    const sessionPermissionsResource = yield* SessionPermissionsResource;

    return new ServerSettingsServiceImpl(serverConfigResource, sessionPermissionsResource);
  });
  static readonly layer: Layer.Layer<
    ServerSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof ServerConfigResource> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerSettingsService = ServerSettingsServiceDI;
