/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ITab } from '@cloudbeaver/core-ui';
import { createValueToken } from '@cloudbeaver/core-di';

export const TabToken = createValueToken<ITab>('ITab');
