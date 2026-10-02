/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { AIProfile, IAIProfileCredentialsState } from '../AIProfilesResource.js';

interface IAIProfileCredentialsStatus {
  accountAuthentication: boolean;
  changed: boolean;
  validationError: string | undefined;
}

export function getAIProfileCredentialsStatus(profile: AIProfile | undefined, state: IAIProfileCredentialsState): IAIProfileCredentialsStatus {
  const accountAuthentication = !!profile?.accountProvider && state.accountAuthentication;
  const changed = !!state.token || (!!profile?.accountProvider && state.accountAuthentication !== profile.accountAuthentication);
  let validationError: string | undefined;

  if (accountAuthentication) {
    if (!profile?.account) {
      validationError = 'plugin_ai_account_not_connected';
    }
  } else if (!state.token && !profile?.tokenSaved) {
    validationError = 'plugin_ai_credentials_token_required';
  }

  return { accountAuthentication, changed, validationError };
}
