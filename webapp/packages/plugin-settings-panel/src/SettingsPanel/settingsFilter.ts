/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TranslateFn } from '@cloudbeaver/core-localization';
import type { ISettingDescription } from '@cloudbeaver/core-settings';

export function settingsFilter(translate: TranslateFn, filter: string) {
  filter = filter.trim();
  return (setting: ISettingDescription<any>) =>
    translate(setting.name).toLowerCase().includes(filter.toLowerCase()) ||
    translate(setting.description)?.toLowerCase().includes(filter.toLowerCase());
}
