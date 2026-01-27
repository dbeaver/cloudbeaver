/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export interface IProperty extends Pick<IObjectPropertyInfo, 'displayName' | 'defaultValue' | 'description' | 'validValues'> {
  id: string;
  key: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  new?: boolean;
}
