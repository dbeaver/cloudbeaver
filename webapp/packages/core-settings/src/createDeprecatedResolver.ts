/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import type { schema } from '@cloudbeaver/core-utils';

import type { ISettingChangeData, ISettingsSource } from './ISettingsSource';
import type { SettingsProvider } from './SettingsProvider';

const DEPRECATED_SETTINGS = new Set();

type SettingsMapping<TTarget, TSource> = {
  [key in keyof TTarget]: keyof TSource;
};

export function createSettingsAliasResolver<TSource extends schema.SomeZodObject, TTarget extends schema.SomeZodObject = TSource>(
  source: ISettingsSource,
  target: SettingsProvider<TTarget>,
  scope: string,
  mappings?: SettingsMapping<schema.infer<TTarget>, schema.infer<TSource>>,
): ISettingsSource {
  type targetSchema = schema.infer<TTarget>;
  type sourceSchema = schema.infer<TSource>;

  function isApplicable(key: keyof targetSchema): boolean {
    return String(key).startsWith(target.scope + '.');
  }
  function unscopeKey(scope: string, key: keyof targetSchema): keyof targetSchema {
    return String(key).replace(scope + '.', '') as unknown as keyof targetSchema;
  }
  function scopeKey(scope: string, key: keyof sourceSchema): keyof sourceSchema {
    return `${scope}.${String(key)}` as unknown as keyof sourceSchema;
  }
  function mapKey(key: keyof targetSchema): keyof sourceSchema {
    key = unscopeKey(target.scope, key);

    return scopeKey(scope, mappings?.[key] || (key as unknown as keyof sourceSchema));
  }
  const onChange: ISyncExecutor<ISettingChangeData<any>> = new SyncExecutor();

  source.onChange.next(
    onChange,
    data => {
      let key = unscopeKey(scope, data.key);

      key = scopeKey(target.scope, mappings?.[key] || key);
      return { ...data, key };
    },
    data => data.key.startsWith(scope),
  );
  return {
    onChange,
    has(key) {
      if (!isApplicable(key)) {
        return false;
      }

      const oldKey = mapKey(key);
      const has = source.has(mapKey(key));

      if (has && !DEPRECATED_SETTINGS.has(oldKey)) {
        console.warn(`You are using deprecated settings: "${String(oldKey)}". Use "${key}" instead.`);
        DEPRECATED_SETTINGS.add(oldKey);
      }

      return has;
    },
    isEdited(key) {
      if (!isApplicable(key)) {
        return false;
      }
      return source.isEdited(mapKey(key));
    },
    isReadOnly(key) {
      if (!isApplicable(key)) {
        return true;
      }
      return source.isReadOnly(mapKey(key));
    },
    getEditedValue(key) {
      if (!isApplicable(key)) {
        return undefined;
      }
      return source.getEditedValue(mapKey(key));
    },
    getValue(key) {
      if (!isApplicable(key)) {
        return undefined;
      }
      return source.getValue(mapKey(key));
    },
    setValue(key, value) {
      if (!isApplicable(key)) {
        return;
      }
      source.setValue(mapKey(key), value);
    },
    save() {
      return source.save();
    },
    clear() {
      source.clear();
    },
  };
}
