/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { RoleInfo } from '@cloudbeaver/core-authentication';
import type { IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import type { CachedMapResource } from '@cloudbeaver/core-sdk';
import type { MetadataMap } from '@cloudbeaver/core-utils';

export type RoleFormMode = 'edit' | 'create';

export interface IRoleFormState {
  mode: RoleFormMode;
  config: RoleInfo;
  partsState: MetadataMap<string, any>;

  readonly info: RoleInfo | undefined;
  readonly statusMessage: string | null;
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly loading: boolean;

  readonly submittingTask: IExecutorHandlersCollection<IRoleFormSubmitData>;
  readonly resource: CachedMapResource<string, RoleInfo>;

  readonly load: () => Promise<void>;
  readonly loadRoleInfo: () => Promise<RoleInfo | undefined>;
  readonly save: () => Promise<void>;
  readonly setOptions: (
    mode: RoleFormMode,
  ) => this;
}

export interface IRoleFormProps {
  state: IRoleFormState;
  onCancel?: () => void;
}

export interface IRoleFormFillConfigData {
  updated: boolean;
  state: IRoleFormState;
}

export interface IRoleFormSubmitData {
  state: IRoleFormState;
}
