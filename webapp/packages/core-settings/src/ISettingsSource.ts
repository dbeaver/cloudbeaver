/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncExecutor } from '@cloudbeaver/core-executor';

export interface ISettingChangeData<T = any> {
  readonly key: T;
  readonly value: any;
}

export interface ISettingsSource {
  readonly onChange: ISyncExecutor<ISettingChangeData>;
  has: (key: any) => boolean;
  getValue: (key: any) => any | undefined;
}
