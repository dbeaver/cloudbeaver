/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Disposable } from '@cloudbeaver/core-di';
import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import type { IDataQueryOptions, QueryDataSource } from '../QueryDataSource.js';
import type { ISqlDataSource, ISqlEditorCursor } from '../SqlDataSource/ISqlDataSource.js';
import type { ISQLScriptSegment, SQLParser } from '../SQLParser.js';
import type { SyncExecutor } from '@cloudbeaver/core-executor';

export interface ISqlEditorModel<TDataSource extends QueryDataSource = QueryDataSource<IDataQueryOptions>> extends Disposable {
  readonly cursor: ISqlEditorCursor;
  readonly cursorSegment: ISQLScriptSegment | undefined;
  readonly parser: SQLParser;
  readonly state: ISqlEditorTabState | null;
  readonly dataSource: ISqlDataSource<TDataSource> | undefined;

  readonly onUpdate: SyncExecutor;

  setState(state: ISqlEditorTabState): void;
  getResolvedSegment(): Promise<ISQLScriptSegment | undefined>;
}
