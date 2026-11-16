/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { ILoadableState, schema } from '@cloudbeaver/core-utils';

import type { ISettingDescription, SettingsDescriptionGetter } from './ISettingDescription.js';

interface SettingsProviderItem<T extends schema.ZodObject = any> {
  settingsGetter: SettingsDescriptionGetter<schema.infer<T>>;
  loaders?: ReadonlyArray<ILoadableState>;
}

export class SettingsManagerServiceImpl {
  get activeSettings(): ReadonlyArray<ISettingDescription<any>> {
    return this.settings.reduce<ISettingDescription<any>[]>((acc, setting) => [...acc, ...setting.settingsGetter()], []);
  }

  get loaders(): ReadonlyArray<ILoadableState> {
    return this.settings.flatMap(setting => setting.loaders || []);
  }

  private settings: SettingsProviderItem[];

  constructor() {
    this.settings = [];

    makeObservable<this, 'settings'>(this, {
      activeSettings: computed,
      loaders: computed,
      settings: observable.shallow,
    });
  }

  registerSettings<TSchema extends schema.ZodObject>(
    settingsGetter: SettingsDescriptionGetter<schema.infer<TSchema>>,
    loaders?: ReadonlyArray<ILoadableState>,
  ): void {
    this.settings.push({
      settingsGetter,
      loaders,
    });
  }
}

export type SettingsManagerService = SettingsManagerServiceImpl;

export class SettingsManagerServiceDI extends Context.Service<SettingsManagerServiceDI, SettingsManagerServiceImpl>()(
  '@cloudbeaver/core-settings/SettingsManager/SettingsManagerService#SettingsManagerService',
) {
  static readonly implementation = SettingsManagerServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<SettingsManagerServiceImpl, never, never> = Effect.sync(() => new SettingsManagerServiceImpl());
  static readonly layer: Layer.Layer<SettingsManagerServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SettingsManagerService = SettingsManagerServiceDI;
