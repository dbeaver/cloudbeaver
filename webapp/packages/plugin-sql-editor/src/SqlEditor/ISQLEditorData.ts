/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncExecutor } from '@cloudbeaver/core-executor';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';

import type { ISqlEditorCursor } from '../SqlDataSource/ISqlDataSource.js';
import type { SQLProposal } from '../SqlEditorService.js';
import type { ISQLScriptSegment } from '../SQLParser.js';
import type { ISqlEditorModel } from '../SqlEditorModel/ISqlEditorModel.js';

export interface ISegmentExecutionData {
  segment: ISQLScriptSegment;
  type: 'start' | 'end' | 'error';
}

export interface ISQLEditorData {
  readonly model: ISqlEditorModel;
  readonly dialect: SqlDialectInfo | undefined;
  readonly readonly: boolean;
  readonly editing: boolean;
  readonly isScriptEmpty: boolean;
  readonly isDisabled: boolean;
  readonly isIncomingChanges: boolean;
  readonly value: string;
  readonly incomingValue?: string;
  readonly isExecutionAllowed: boolean;
  readonly onExecute: ISyncExecutor<boolean>;
  readonly onSegmentExecute: ISyncExecutor<ISegmentExecutionData>;
  readonly onFormat: ISyncExecutor<[ISQLScriptSegment, string]>;
  /** displays if last getHintProposals call ended with limit */
  readonly hintsLimitIsMet: boolean;

  updateParserScriptsDebounced(): Promise<void>;
  setScript(query: string, source?: string, cursor?: ISqlEditorCursor): void;
  setCursor(begin: number, end?: number): void;
  formatScript(): Promise<void>;
  executeQuery(): Promise<void>;
  executeQueryNewTab(): Promise<void>;
  showExecutionPlan(): Promise<void>;
  executeScript(): Promise<void>;
  getHintProposals(position: number, simple: boolean): Promise<SQLProposal[]>;
  executeQueryAction<T>(
    segment: ISQLScriptSegment | undefined,
    action: (query: ISQLScriptSegment) => T | Promise<T>,
    passEmpty?: boolean,
    passDisabled?: boolean,
  ): Promise<T | undefined>;
  setModeId(tabId: string): void;
}
