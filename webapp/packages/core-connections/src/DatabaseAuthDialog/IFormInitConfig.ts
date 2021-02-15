/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';

import type { ConnectionInitConfig } from '../ConnectionInfoResource';

export interface IFormInitConfig extends Omit<Required<ConnectionInitConfig>, 'id'> {
  networkCredentials: NetworkHandlerConfigInput[];
}
