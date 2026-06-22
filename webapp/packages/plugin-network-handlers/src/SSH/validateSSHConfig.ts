/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { NetworkHandlerAuthType, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';

export function validateSSHConfig(state: NetworkHandlerConfigInput, initialState?: NetworkHandlerConfigInput | null): string[] {
  const errors: string[] = [];

  if (!state.properties?.['host']?.trim().length) {
    errors.push("Field SSH 'Host' can't be empty");
  }

  const port = Number(String(state.properties?.['port'] ?? '').trim());
  if (isNaN(port) || port < 1) {
    errors.push("Field SSH 'Port' must be a positive number");
  }

  if (state.savePassword && !state.userName?.trim()?.length) {
    errors.push("Field SSH 'User' can't be empty");
  }

  const keyAuth = state.authType === NetworkHandlerAuthType.PublicKey;
  const keySaved = initialState?.key === '';

  if (keyAuth && state.savePassword && !keySaved && !state.key?.length) {
    errors.push("Field SSH 'Private key' can't be empty");
  }

  const passwordSaved = initialState?.password === '' && initialState?.authType === state.authType;

  if (!keyAuth && state.savePassword && !passwordSaved && !state.password?.length) {
    errors.push("Field SSH 'Password' can't be empty");
  }

  return errors;
}
