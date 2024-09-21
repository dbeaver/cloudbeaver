/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import type { ILoadableState, schema } from '@cloudbeaver/core-utils';

import type { SettingsProvider } from '../SettingsProvider.js';
import type { ISettingDescription, SettingsDescriptionGetter } from './ISettingDescription.js';

interface SettingsProviderItem<T extends schema.SomeZodObject = any> {
  settingsGetter: SettingsDescriptionGetter<schema.infer<T>>;
  loaders?: ReadonlyArray<ILoadableState>;
}

@injectable()
export class SettingsManagerService {
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

  registerSettings<TSchema extends schema.SomeZodObject>(
    provider: SettingsProvider<TSchema>,
    settingsGetter: SettingsDescriptionGetter<schema.infer<TSchema>>,
    loaders?: ReadonlyArray<ILoadableState>,
  ) {
    this.settings.push({
      settingsGetter,
      loaders,
    });
  }
}
