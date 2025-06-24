/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncExecutor } from '@cloudbeaver/core-executor';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';

import type { ISqlDataSource, ISqlEditorCursor } from '../SqlDataSource/ISqlDataSource.js';
import type { SQLProposal } from '../SqlEditorService.js';
import type { ISQLScriptSegment, SQLParser } from '../SQLParser.js';
import type { ISQLEditorMode } from './SQLEditorModeContext.js';

export interface ISegmentExecutionData {
  segment: ISQLScriptSegment;
  type: 'start' | 'end' | 'error';
}

export interface ISQLEditorData {
  readonly cursor: ISqlEditorCursor;
  activeSegmentMode: ISQLEditorMode;
  readonly parser: SQLParser;
  readonly dialect: SqlDialectInfo | undefined;
  readonly activeSegment: ISQLScriptSegment | undefined;
  readonly cursorSegment: ISQLScriptSegment | undefined;
  readonly readonly: boolean;
  readonly editing: boolean;
  readonly isScriptEmpty: boolean;
  readonly isDisabled: boolean;
  readonly isIncomingChanges: boolean;
  readonly value: string;
  readonly incomingValue?: string;
  readonly dataSource: ISqlDataSource | undefined;
  readonly onExecute: ISyncExecutor<boolean>;
  readonly onSegmentExecute: ISyncExecutor<ISegmentExecutionData>;
  readonly onFormat: ISyncExecutor<[ISQLScriptSegment, string]>;
  readonly onUpdate: ISyncExecutor;
  readonly onMode: ISyncExecutor<ISQLEditorData>;
  /** displays if last getHintProposals call ended with limit */
  readonly hintsLimitIsMet: boolean;

  updateParserScriptsDebounced(): Promise<void>;
  setScript(query: string, source?: string, cursor?: ISqlEditorCursor): void;
  init(): void;
  destruct(): void;
  setCursor(begin: number, end?: number): void;
  formatScript(): Promise<void>;
  executeQuery(): Promise<void>;
  executeQueryNewTab(): Promise<void>;
  showExecutionPlan(): Promise<void>;
  executeScript(): Promise<void>;
  switchEditing(): void;
  getHintProposals(position: number, simple: boolean): Promise<SQLProposal[]>;
  getResolvedSegment(): Promise<ISQLScriptSegment | undefined>;
  executeQueryAction<T>(
    segment: ISQLScriptSegment | undefined,
    action: (query: ISQLScriptSegment) => T | Promise<T>,
    passEmpty?: boolean,
    passDisabled?: boolean,
  ): Promise<T | undefined>;
  setModeId(tabId: string): void;
}
