/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2022 DBeaver Corp
 *
 * All Rights Reserved
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */

import type { ISyncExecutor } from '@cloudbeaver/core-executor';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';

import type { SQLProposal } from '../SqlEditorService';
import type { SQLParser, ISQLScriptSegment } from '../SQLParser';
import type { ISQLEditorMode } from './SQLEditorModeContext';

export interface ISegmentExecutionData {
  segment: ISQLScriptSegment;
  type: 'start' | 'end' | 'error';
}

export interface ICursor {
  begin: number;
  end: number;
}

export interface ISQLEditorData {
  readonly cursor: ICursor;
  readonly activeSegmentMode: ISQLEditorMode;
  readonly parser: SQLParser;
  readonly dialect: SqlDialectInfo | undefined;
  readonly activeSegment: ISQLScriptSegment | undefined;
  readonly cursorSegment: ISQLScriptSegment | undefined;
  readonly readonly: boolean;
  readonly isLineScriptEmpty: boolean;
  readonly isScriptEmpty: boolean;
  readonly isDisabled: boolean;
  readonly value: string;
  readonly onExecute: ISyncExecutor<boolean>;
  readonly onSegmentExecute: ISyncExecutor<ISegmentExecutionData>;
  readonly onUpdate: ISyncExecutor;
  readonly onMode: ISyncExecutor<ISQLEditorData>;

  updateParserScriptsThrottle(): Promise<void>;
  setQuery(query: string): void;
  init(): void;
  destruct(): void;
  setCursor(begin: number, end?: number): void;
  formatScript(): Promise<void>;
  executeQuery (): Promise<void>;
  executeQueryNewTab(): Promise<void>;
  showExecutionPlan(): Promise<void>;
  executeScript(): Promise<void>;
  getHintProposals(position: number, simple: boolean): Promise<SQLProposal[]>;
  executeQueryAction<T>(
    segment: ISQLScriptSegment | undefined,
    action: (query: ISQLScriptSegment) => Promise<T>,
    passEmpty?: boolean,
    passDisabled?: boolean
  ): Promise<T | undefined>;
}