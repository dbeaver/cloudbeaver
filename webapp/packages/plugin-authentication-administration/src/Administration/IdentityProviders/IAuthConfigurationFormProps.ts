/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import type { AdminAuthProviderConfiguration, CachedMapResource, GetAuthProviderConfigurationsQueryVariables } from '@cloudbeaver/core-sdk';

export type AuthConfigurationFormMode = 'edit' | 'create';

export interface IAuthConfigurationFormState {
  mode: AuthConfigurationFormMode;
  config: AdminAuthProviderConfiguration;

  readonly info: AdminAuthProviderConfiguration | undefined;
  readonly statusMessage: string | null;
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly loading: boolean;

  readonly submittingTask: IExecutorHandlersCollection<IAuthConfigurationFormSubmitData>;
  readonly resource: CachedMapResource<
    string,
    AdminAuthProviderConfiguration,
    GetAuthProviderConfigurationsQueryVariables
  >;

  readonly load: () => Promise<void>;
  readonly loadConfigurationInfo: () => Promise<AdminAuthProviderConfiguration | undefined>;
  readonly save: () => Promise<void>;
  readonly setOptions: (
    mode: AuthConfigurationFormMode,
  ) => this;
}

export interface IAuthConfigurationFormProps {
  state: IAuthConfigurationFormState;
  onCancel?: () => void;
}

export interface IAuthConfigurationFormFillConfigData {
  updated: boolean;
  state: IAuthConfigurationFormState;
}

export interface IAuthConfigurationFormSubmitData {
  state: IAuthConfigurationFormState;
}
