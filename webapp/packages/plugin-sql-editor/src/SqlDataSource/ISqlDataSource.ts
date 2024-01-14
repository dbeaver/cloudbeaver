/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { ISyncExecutor } from '@cloudbeaver/core-executor';
import type { ILoadableState } from '@cloudbeaver/core-utils';
import type { IDatabaseDataModel, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';

import type { IDataQueryOptions } from '../QueryDataSource';
import type { ESqlDataSourceFeatures } from './ESqlDataSourceFeatures';
import type { ISqlDataSourceHistory } from './SqlDataSourceHistory/ISqlDataSourceHistory';

export interface ISqlDataSourceKey {
  readonly key: string;
}

export type ScriptDataSourceType = 'history' | 'insert';

export interface ISetScriptData {
  script: string;
  source?: ScriptDataSourceType;
}

export interface ISqlDataSource extends ILoadableState {
  readonly sourceKey: string;
  readonly name: string | null;
  readonly icon?: string;
  readonly emptyPlaceholder?: string;
  readonly script: string;
  readonly incomingScript?: string;
  readonly projectId: string | null;
  readonly databaseModels: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>[];
  readonly executionContext?: IConnectionExecutionContextInfo;
  readonly message?: string;
  readonly onUpdate: ISyncExecutor;
  readonly onSetScript: ISyncExecutor<ISetScriptData>;
  readonly onDatabaseModelUpdate: ISyncExecutor<IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>[]>;
  readonly features: ESqlDataSourceFeatures[];
  readonly history: ISqlDataSourceHistory;
  readonly isAutoSaveEnabled: boolean;
  readonly isIncomingChanges: boolean;
  readonly isSaved: boolean;
  readonly isScriptSaved: boolean;
  readonly isExecutionContextSaved: boolean;

  isReadonly(): boolean;
  isEditing(): boolean;
  isOutdated(): boolean;
  markOutdated(): void;
  markUpdated(): void;
  hasFeature(feature: ESqlDataSourceFeatures): boolean;
  canRename(name: string | null): boolean;
  setName(name: string | null): void;
  setProject(projectId: string | null): void;
  setScript(script: string, source?: ScriptDataSourceType): void;
  setEditing(state: boolean): void;
  setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void;
  setIncomingExecutionContext(executionContext?: IConnectionExecutionContextInfo): void;
  setIncomingScript(script?: string): void;
  applyIncoming(): void;
  keepCurrent(): void;
  save(): Promise<void> | void;
  load(): Promise<void> | void;
  reset(): Promise<void> | void;
  dispose(): Promise<void> | void;
}
