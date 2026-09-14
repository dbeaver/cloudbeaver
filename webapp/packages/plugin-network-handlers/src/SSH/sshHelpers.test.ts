/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';

import { getSSHHandlerConfig, prepareSSHHandlerConfig, SSH_DEFAULT_HANDLER_CONFIG } from './sshHelpers.js';

describe('SSH config preparation', () => {
  const state = {
    ...SSH_DEFAULT_HANDLER_CONFIG(),
    enabled: true,
    authType: NetworkHandlerAuthType.Password,
    userName: ' user ',
    password: ' password ',
    properties: {
      host: ' host ',
      port: 22,
    },
  };

  it('keeps values unchanged while preparing the config', () => {
    expect(prepareSSHHandlerConfig(state)).toMatchObject({
      userName: ' user ',
      password: ' password ',
      properties: { host: ' host ' },
    });
  });

  it('preserves formatting in getSSHHandlerConfig', () => {
    expect(getSSHHandlerConfig(state)).toMatchObject({
      userName: 'user',
      password: 'password',
      properties: { host: 'host' },
    });
  });
});
