/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import type { schema } from '@cloudbeaver/core-utils';

import type { ESettingsValueType } from './ESettingsValueType';
import type { SettingsGroup } from './SettingsGroup';

export interface ISettingOptions {
  id: string;
  name: TLocalizationToken;
}

export interface ISettingDescription<T = object> {
  key: keyof T;

  type: ESettingsValueType;

  group: SettingsGroup;
  name: TLocalizationToken;
  description?: TLocalizationToken;
  options?: ISettingOptions[];
}

export interface ISettingDescriptionWithScope<T = Record<string, any>> extends ISettingDescription<T> {
  scope: string;
  schema: schema.AnyZodObject;
}

export type SettingsDescriptionGetter<T> = () => ISettingDescription<T>[];
