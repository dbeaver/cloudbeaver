/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import type { AdminAuthProviderConfiguration, CachedMapResource, GetAuthProviderConfigurationsQueryVariables } from '@cloudbeaver/core-sdk';

export type ConfigurationFormMode = 'edit' | 'create';

export interface IConfigurationFormState {
  mode: ConfigurationFormMode;
  config: AdminAuthProviderConfiguration;

  readonly info: AdminAuthProviderConfiguration | undefined;
  readonly statusMessage: string | null;
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly loading: boolean;

  readonly submittingTask: IExecutorHandlersCollection<IConfigurationFormSubmitData>;
  readonly resource: CachedMapResource<
    string,
    AdminAuthProviderConfiguration,
    GetAuthProviderConfigurationsQueryVariables
  >;

  readonly load: () => Promise<void>;
  readonly loadConfigurationInfo: () => Promise<AdminAuthProviderConfiguration | undefined>;
  readonly save: () => Promise<void>;
  readonly setOptions: (
    mode: ConfigurationFormMode,
  ) => this;
}

export interface IConfigurationFormProps {
  state: IConfigurationFormState;
  onCancel?: () => void;
}

export interface IConfigurationFormFillConfigData {
  updated: boolean;
  state: IConfigurationFormState;
}

export interface IConfigurationFormSubmitData {
  state: IConfigurationFormState;
}
