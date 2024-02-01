/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { SETTINGS_GROUP_ID_PREFIX } from './SETTINGS_GROUP_ID_PREFIX';

export function getSettingGroupId(id: string): string {
  return `${SETTINGS_GROUP_ID_PREFIX}${id}`;
}
