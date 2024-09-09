/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TeamInfo, TeamMetaParameter, TeamsResource } from '@cloudbeaver/core-authentication';
import type { IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import type { MetadataMap } from '@cloudbeaver/core-utils';

export type TeamFormMode = 'edit' | 'create';

export interface TeamInfoConfig extends TeamInfo {
  metaParameters: Record<string, TeamMetaParameter>;
}

export interface ITeamFormState {
  mode: TeamFormMode;
  config: TeamInfoConfig;
  partsState: MetadataMap<string, any>;

  readonly info: TeamInfoConfig | undefined;
  readonly statusMessage: string | null;
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly loading: boolean;

  readonly submittingTask: IExecutorHandlersCollection<ITeamFormSubmitData>;
  readonly resource: TeamsResource;

  readonly load: () => Promise<void>;
  readonly loadTeamInfo: () => Promise<TeamInfo | undefined>;
  readonly save: () => Promise<void>;
  readonly setOptions: (mode: TeamFormMode) => this;
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
