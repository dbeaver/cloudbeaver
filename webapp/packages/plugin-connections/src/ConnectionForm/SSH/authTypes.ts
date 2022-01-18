/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';

interface IAuthType {
  key: NetworkHandlerAuthType;
  label: TLocalizationToken;
}

export const authTypes: IAuthType[] = [
  {
    key: NetworkHandlerAuthType.Password,
    label: 'Password',
  },
  {
    key: NetworkHandlerAuthType.PublicKey,
    label: 'Public Key',
  },
];