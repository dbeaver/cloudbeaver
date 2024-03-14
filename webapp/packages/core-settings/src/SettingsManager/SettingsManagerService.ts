/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { schema } from '@cloudbeaver/core-utils';

import type { ISettingDescriptionWithScope, SettingsDescriptionGetter } from './ISettingDescription';
import { computed, makeObservable, observable } from 'mobx';

interface ScopeSettingsItem<T = any> {
  scope: string;
  schema: schema.AnyZodObject;
  settingsGetter: SettingsDescriptionGetter<T>;
}

@injectable()
export class SettingsManagerService {
  get activeSettings(): Map<string, ISettingDescriptionWithScope<any>> {
    return new Map(this.getSettings().map(setting => [`${setting.scope}.${String(setting.key)}`, setting]));
  }

  get settings(): ReadonlyArray<ScopeSettingsItem> {
    return this.#settings;
  }

  #settings: ScopeSettingsItem[];

  constructor() {
    this.#settings = observable([], { deep: false });

    makeObservable(this, {
      activeSettings: computed,
    });
  }

  registerSettings<TSchema extends schema.SomeZodObject>(
    scope: string,
    schema: TSchema,
    settingsGetter: SettingsDescriptionGetter<schema.infer<TSchema>>,
  ) {
    this.#settings.push({
      scope,
      schema,
      settingsGetter,
    });
  }

  private getSettings(): ISettingDescriptionWithScope<any>[] {
    const settings: ISettingDescriptionWithScope<any>[] = [];

    for (const { schema, scope, settingsGetter } of this.settings) {
      for (const setting of settingsGetter()) {
        settings.push({ ...setting, scope, schema: schema.shape[setting.key] });
      }
    }

    return settings;
  }
}
