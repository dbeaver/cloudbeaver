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

type SettingsMapping<TTarget> = Partial<{
  [key in keyof TTarget]: string;
}>;

export function createSettingsAliasResolver<TTarget extends schema.SomeZodObject>(
  source: ISettingsSource,
  target: SettingsProvider<TTarget>,
  mappings: SettingsMapping<schema.infer<TTarget>>,
): ISettingsSource {
  type targetSchema = schema.infer<TTarget>;
  const reversed = Object.fromEntries(Object.entries(mappings).map(a => a.reverse()));

  function reverseMapKey(key: string): keyof targetSchema {
    return (reversed[key] as any) || (key as any);
  }

  function mapKey(key: keyof targetSchema): string {
    return mappings[key] || (key as any);
  }
  const onChange: ISyncExecutor<ISettingChangeData<any>> = new SyncExecutor();

  source.onChange.next(
    onChange,
    data => ({ ...data, key: reverseMapKey(data.key) }),
    data => data.key in reversed,
  );
  return {
    onChange,
    has(key) {
      if (!(key in mappings)) {
        return false;
      }

      return source.has(mapKey(key));
    },
    isEdited(key) {
      if (!(key in mappings)) {
        return false;
      }
      return source.isEdited(mapKey(key));
    },
    isReadOnly(key) {
      if (!(key in mappings)) {
        return true;
      }
      return source.isReadOnly(mapKey(key));
    },
    getEditedValue(key) {
      if (!(key in mappings)) {
        return undefined;
      }
      return source.getEditedValue(mapKey(key));
    },
    getValue(key) {
      if (!(key in mappings)) {
        return undefined;
      }

      const oldKey = mapKey(key);

      if (!DEPRECATED_SETTINGS.has(oldKey)) {
        console.warn(`You are using deprecated settings: "${String(oldKey)}". Use "${key}" instead.`);
        DEPRECATED_SETTINGS.add(oldKey);
      }

      return source.getValue(mapKey(key));
    },
    setValue(key, value) {
      if (!(key in mappings)) {
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
