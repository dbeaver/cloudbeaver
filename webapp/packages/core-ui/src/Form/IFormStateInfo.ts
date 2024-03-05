/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ENotificationType } from '@cloudbeaver/core-events';

export interface IFormStateInfo {
  edited: boolean;
  disabled: boolean;
  readonly: boolean;
  statusMessage: string | string[] | null;
  statusType: ENotificationType | null;
}
