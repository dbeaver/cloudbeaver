/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import type { schema } from '@cloudbeaver/core-utils';

import type { SettingsProvider } from '../SettingsProvider';
import type { ISettingDescriptionWithProvider, SettingsDescriptionGetter } from './ISettingDescription';

interface ScopeSettingsItem<T extends schema.SomeZodObject = schema.AnyZodObject> {
  provider: SettingsProvider<T>;
  settingsGetter: SettingsDescriptionGetter<schema.infer<T>>;
}

@injectable()
export class SettingsManagerService {
  get activeSettings(): ReadonlyArray<ISettingDescriptionWithProvider<any>> {
    return this.getSettings();
  }

  private settings: ScopeSettingsItem[];

  constructor() {
    this.settings = [];

    makeObservable<this, 'settings'>(this, {
      activeSettings: computed,
      settings: observable.shallow,
    });
  }

  registerSettings<TSchema extends schema.SomeZodObject>(
    provider: SettingsProvider<TSchema>,
    settingsGetter: SettingsDescriptionGetter<schema.infer<TSchema>>,
  ) {
    this.settings.push({
      provider,
      settingsGetter,
    });
  }

  private getSettings(): ReadonlyArray<ISettingDescriptionWithProvider<any>> {
    const settings: ISettingDescriptionWithProvider<any>[] = [];

    for (const { provider, settingsGetter } of this.settings) {
      for (const setting of settingsGetter()) {
        settings.push({ ...setting, provider, schema: provider.schema.shape[setting.key], scopedKey: provider.scopedKey(setting.key) });
      }
    }

    return settings;
  }
}
