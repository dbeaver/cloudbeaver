/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IFormStateInfo } from '@cloudbeaver/core-blocks';
import type { DatabaseConnection, IConnectionsResource } from '@cloudbeaver/core-connections';
import type { IExecutorHandlersCollection } from '@cloudbeaver/core-executor';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import type { MetadataMap } from '@cloudbeaver/core-utils';

export type ConnectionFormMode = 'edit' | 'create';
export type ConnectionFormType = 'admin' | 'public';

export interface IConnectionFormState {
  mode: ConnectionFormMode;
  type: ConnectionFormType;

  config: ConnectionConfig;

  partsState: MetadataMap<string, any>;

  readonly id: string;
  readonly initError: Error | null;
  readonly statusMessage: string | null;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly configured: boolean;

  readonly availableDrivers: string[];
  readonly resource: IConnectionsResource;
  readonly info: DatabaseConnection | undefined;
  readonly readonly: boolean;
  readonly submittingTask: IExecutorHandlersCollection<IConnectionFormSubmitData>;

  readonly load: () => Promise<void>;
  readonly loadConnectionInfo: () => Promise<DatabaseConnection | undefined>;
  readonly reset: () => void;
  readonly setPartsState: (state: MetadataMap<string, any>) => this;
  readonly setOptions: (
    mode: ConnectionFormMode,
    type: ConnectionFormType
  ) => this;
  readonly setConfig: (config: ConnectionConfig) => this;
  readonly setAvailableDrivers: (drivers: string[]) => this;
  readonly save: () => Promise<void>;
  readonly test: () => Promise<void>;
  readonly checkFormState: () => Promise<IFormStateInfo | null>;
  readonly dispose: () => void;
}

export interface IConnectionFormProps {
  state: IConnectionFormState;
  onCancel?: () => void;
}

export interface IConnectionFormFillConfigData {
  updated: boolean;
  state: IConnectionFormState;
}

export interface IConnectionFormSubmitData {
  submitType: 'submit' | 'test';
  state: IConnectionFormState;
}
