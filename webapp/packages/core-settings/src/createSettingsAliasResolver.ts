/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { invertObject, type schema } from '@cloudbeaver/core-utils';

import type { ISettingChangeData, ISettingsSource } from './ISettingsSource.js';
import type { SettingsProvider } from './SettingsProvider.js';

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
  const reversed = invertObject(mappings);

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

  let resolverLock = false;

  function withLock<T>(fn: (locked: boolean) => T): T {
    if (resolverLock) {
      return fn(true);
    }
    try {
      resolverLock = true;
      return fn(false);
    } finally {
      resolverLock = false;
    }
  }

  return {
    onChange,
    has(key) {
      if (!(key in mappings)) {
        return false;
      }

      // check that there is no actual key in source
      if (withLock(locked => locked || source.has(key))) {
        return false;
      }

      const oldKey = mapKey(key);
      const has = source.has(oldKey);

      if (has && !DEPRECATED_SETTINGS.has(oldKey)) {
        console.warn(`You have deprecated settings: "${String(oldKey)}". Use "${key}" instead.`);
        DEPRECATED_SETTINGS.add(oldKey);
      }

      return has;
    },
    isOverrideDefaults: source.isOverrideDefaults?.bind(source.isOverrideDefaults),
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

      return source.getValue(mapKey(key));
    },
    setValue(key, value) {
      if (!(key in mappings)) {
        return;
      }
      withLock(locked => {
        if (!locked) {
          source.setValue(key, value);
        }
      });
    },
    async save() {},
    clear() {},
  };
}
