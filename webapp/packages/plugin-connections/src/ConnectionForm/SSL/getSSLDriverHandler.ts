/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NetworkHandlerDescriptor } from '@cloudbeaver/core-sdk';

import { SSL_CODE_NAME } from './SSL_CODE_NAME.js';

export function getSSLDriverHandler(descriptors: NetworkHandlerDescriptor[], applicableHandlers: string[]) {
  const result = descriptors.find(descriptor => applicableHandlers.includes(descriptor.id) && descriptor.codeName === SSL_CODE_NAME);
  return result;
}
