/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

import { useService } from '@cloudbeaver/core-di';
import type { AdminAuthProviderConfiguration, CachedMapResource, GetAuthProviderConfigurationsQueryVariables } from '@cloudbeaver/core-sdk';

import { AuthConfigurationFormService } from './AuthConfigurationFormService';
import { AuthConfigurationFormState } from './AuthConfigurationFormState';
import type { IAuthConfigurationFormState } from './IAuthConfigurationFormProps';

export function useAuthConfigurationFormState(
  resource: CachedMapResource<string, AdminAuthProviderConfiguration, GetAuthProviderConfigurationsQueryVariables>,
  configure?: (state: IAuthConfigurationFormState) => any
): IAuthConfigurationFormState {
  const service = useService(AuthConfigurationFormService);
  const [state] = useState<IAuthConfigurationFormState>(() => {
    const state = new AuthConfigurationFormState(
      service,
      resource,
    );
    configure?.(state);

    state.load();
    return state;
  });

  return state;
}
