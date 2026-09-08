/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { SSH_TUNNEL_ID } from '../NetworkHandlerResource.js';
import { NetworkHandlerAuthType, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { toJS } from 'mobx';

export const SSH_DEFAULT_HANDLER_CONFIG: () => NetworkHandlerConfigInput = () => ({
  id: SSH_TUNNEL_ID,
  enabled: false,
  authType: NetworkHandlerAuthType.Password,
  password: undefined,
  savePassword: false,
  userName: '',
  key: undefined,
  properties: {
    port: 22,
    host: '',
    aliveInterval: '0',
    sshConnectTimeout: '10000',
  },
});

export function isSSHPasswordChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput | null): boolean {
  if (!initial && !handler.enabled) {
    return false;
  }

  return (
    (((initial?.password === null && handler.password !== null) || initial?.password === '') && handler.password !== '') || !!handler.password?.length
  );
}

export function isSSHKeyChanged(handler: NetworkHandlerConfigInput, initial?: NetworkHandlerConfigInput | null): boolean {
  if (!initial && !handler.enabled) {
    return false;
  }

  return (((initial?.key === null && handler.key !== null) || initial?.key === '') && handler.key !== '') || !!handler.key?.length;
}

export function getSSHHandlerConfig(
  state: NetworkHandlerConfigInput,
  initialState?: NetworkHandlerConfigInput | null,
  savePassword?: boolean,
): NetworkHandlerConfigInput {
  const passwordChanged = isSSHPasswordChanged(state, initialState);
  const keyChanged = isSSHKeyChanged(state, initialState);

  const handlerConfig: NetworkHandlerConfigInput = {
    ...state,
    savePassword: (state.savePassword ?? false) || (savePassword ?? false),
    key: state.authType === NetworkHandlerAuthType.PublicKey && keyChanged ? state.key : undefined,
    password: passwordChanged ? state.password : undefined,
  };

  delete handlerConfig.secureProperties;

  return trimSSHConfig(handlerConfig);
}

function trimSSHConfig(input: NetworkHandlerConfigInput): NetworkHandlerConfigInput {
  const trimmedInput = toJS(input);
  const attributesToTrim = Object.keys(input) as (keyof NetworkHandlerConfigInput)[];

  for (const key of attributesToTrim) {
    if (typeof trimmedInput[key] === 'string') {
      trimmedInput[key] = trimmedInput[key]?.trim();
    }
  }

  for (const key in (trimmedInput.properties ?? {})) {
    if (typeof trimmedInput.properties[key] === 'string') {
      trimmedInput.properties[key] = trimmedInput.properties[key]?.trim();
    }
  }

  return trimmedInput;
}
