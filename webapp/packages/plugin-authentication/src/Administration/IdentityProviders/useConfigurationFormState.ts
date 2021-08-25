/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

import { useService } from '@cloudbeaver/core-di';
import type { AdminAuthProviderConfiguration, CachedMapResource, GetAuthProviderConfigurationsQueryVariables } from '@cloudbeaver/core-sdk';

import { ConfigurationFormService } from './ConfigurationFormService';
import { ConfigurationFormState } from './ConfigurationFormState';
import type { IConfigurationFormState } from './IConfigurationFormProps';

export function useConfigurationFormState(
  resource: CachedMapResource<string, AdminAuthProviderConfiguration, GetAuthProviderConfigurationsQueryVariables>,
  configure?: (state: IConfigurationFormState) => any
): IConfigurationFormState {
  const service = useService(ConfigurationFormService);
  const [state] = useState<IConfigurationFormState>(() => {
    const state = new ConfigurationFormState(
      service,
      resource,
    );
    configure?.(state);

    state.load();
    return state;
  });

  return state;
}
