/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import type { ESettingsValueType } from './ESettingsValueType';
import type { SettingsGroup } from './SettingsGroup';

export interface ISettingAccess {
  scope: string[];
}

export interface ISettingOptions {
  value: string;
  name: TLocalizationToken;
}

export interface ISettingDescription<T = object> {
  key: keyof T;
  access: ISettingAccess;

  type: ESettingsValueType;

  group: SettingsGroup;
  name: TLocalizationToken;
  description?: TLocalizationToken;
  options?: ISettingOptions[];
}

export type SettingsDescriptionGetter<T> = () => ISettingDescription<T>[];
