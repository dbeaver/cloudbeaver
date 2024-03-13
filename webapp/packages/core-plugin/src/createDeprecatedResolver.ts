/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISettingsSource } from '@cloudbeaver/core-settings';
import type { schema } from '@cloudbeaver/core-utils';

import type { PluginSettings } from './PluginSettings';

type SettingsMapping<TTarget, TSource> = {
  [key in keyof TTarget]: keyof TSource;
};

export function createSettingsAliasResolver<TSource extends schema.SomeZodObject, TTarget extends schema.SomeZodObject = TSource>(
  source: ISettingsSource,
  target: PluginSettings<TTarget>,
  scope: string,
  mappings?: SettingsMapping<schema.infer<TTarget>, schema.infer<TSource>>,
): ISettingsSource {
  type targetSchema = schema.infer<TTarget>;
  type sourceSchema = schema.infer<TSource>;

  function isApplicable(key: keyof targetSchema): boolean {
    return String(key).startsWith(target.scope + '.');
  }
  function unscopeKey(key: keyof targetSchema): keyof targetSchema {
    return String(key).replace(target.scope + '.', '') as unknown as keyof targetSchema;
  }
  function scopeKey(key: keyof sourceSchema): keyof sourceSchema {
    return `${scope}.${String(key)}` as unknown as keyof sourceSchema;
  }
  function mapKey(key: keyof targetSchema): keyof sourceSchema {
    key = unscopeKey(key);

    return scopeKey(mappings?.[key] || (key as unknown as keyof sourceSchema));
  }
  return {
    has(key) {
      if (!isApplicable(key)) {
        return false;
      }
      return source.has(mapKey(key));
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
    getDefaultValue(key) {
      if (!isApplicable(key)) {
        return undefined;
      }
      return source.getDefaultValue(mapKey(key));
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
    clear() {
      source.clear();
    },
  };
}
