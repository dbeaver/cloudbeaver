/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import type { IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import type { CachedMapResource } from '@cloudbeaver/core-sdk';
import type { MetadataMap } from '@cloudbeaver/core-utils';

export type TeamFormMode = 'edit' | 'create';

export interface ITeamFormState {
  mode: TeamFormMode;
  config: TeamInfo;
  partsState: MetadataMap<string, any>;

  readonly info: TeamInfo | undefined;
  readonly statusMessage: string | null;
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly loading: boolean;

  readonly submittingTask: IExecutorHandlersCollection<ITeamFormSubmitData>;
  readonly resource: CachedMapResource<string, TeamInfo>;

  readonly load: () => Promise<void>;
  readonly loadTeamInfo: () => Promise<TeamInfo | undefined>;
  readonly save: () => Promise<void>;
  readonly setOptions: (
    mode: TeamFormMode,
  ) => this;
}

export interface ITeamFormProps {
  state: ITeamFormState;
  onCancel?: () => void;
}

export interface ITeamFormFillConfigData {
  updated: boolean;
  state: ITeamFormState;
}

export interface ITeamFormSubmitData {
  state: ITeamFormState;
}
