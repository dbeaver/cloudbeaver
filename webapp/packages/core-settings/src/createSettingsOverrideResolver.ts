/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { type schema } from '@cloudbeaver/core-utils';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import type { ISettingChangeData, ISettingsSource } from './ISettingsSource.js';
import type { IEditableSettingsSource } from './IEditableSettingsSource.js';

interface ISettingsOverride<TTarget, TKey extends keyof TTarget> {
  key: string;
  map?: (value: any) => TTarget[TKey];
  filter?: (value: any) => boolean;
}

type SettingsMapping<TTarget> = Partial<{
  [key in keyof TTarget]: string | ISettingsOverride<TTarget, key>;
}>;

export function createSettingsOverrideResolver<TTarget extends schema.SomeZodObject>(
  source: ISettingsSource | IEditableSettingsSource,
  mappings: SettingsMapping<schema.infer<TTarget>>,
): ISettingsSource {
  type targetSchema = schema.infer<TTarget>;
  const fullDescriptionOverrides: Record<keyof targetSchema, ISettingsOverride<targetSchema, keyof targetSchema>> = {} as any;
  const reversed: Record<string, keyof targetSchema> = {};

  for (const key in mappings) {
    const value = mappings[key];
    if (typeof value === 'string') {
      reversed[value] = key;
      fullDescriptionOverrides[key] = {
        key: value,
        filter: (value: any) => isNotNullDefined(value),
        map: (value: any) => value,
      };
    } else if (value && typeof value === 'object' && 'key' in value) {
      reversed[value.key] = key;
      fullDescriptionOverrides[key] = {
        key: value.key,
        filter: value.filter || ((value: any) => isNotNullDefined(value)),
        map: value.map || ((value: any) => value),
      };
    }
  }

  function reverseMapKey(key: string): keyof targetSchema {
    return reversed[key] || (key as keyof targetSchema);
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
      if (!(key in fullDescriptionOverrides)) {
        return false;
      }

      const override = fullDescriptionOverrides[key]!;

      if (source.has(override.key)) {
        return override.filter!(source.getValue(override.key));
      }

      return false;
    },
    getValue(key) {
      if (!(key in fullDescriptionOverrides)) {
        return undefined;
      }

      const override = fullDescriptionOverrides[key]!;
      const value = source.getValue(override.key);

      if (override) {
        return override.map!(value);
      }

      return value;
    },
  };
}
