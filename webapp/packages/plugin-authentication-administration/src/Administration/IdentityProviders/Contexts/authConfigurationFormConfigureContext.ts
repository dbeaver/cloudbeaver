/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { AdminAuthProviderConfiguration } from '@cloudbeaver/core-sdk';

import type { IAuthConfigurationFormState } from '../IAuthConfigurationFormProps';

export interface IAuthConfigurationFormConfigureContext {
  readonly providerId: string | undefined;
  readonly info: AdminAuthProviderConfiguration | undefined;
}

export function authConfigurationFormConfigureContext(
  contexts: IExecutionContextProvider<IAuthConfigurationFormState>,
  state: IAuthConfigurationFormState
): IAuthConfigurationFormConfigureContext {
  return {
    info: state.info,
    providerId: state.config.providerId,
  };
}
