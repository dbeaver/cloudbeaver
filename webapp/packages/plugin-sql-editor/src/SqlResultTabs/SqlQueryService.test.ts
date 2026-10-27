/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { Executor } from '@cloudbeaver/core-executor';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { QueryDataSource } from '../QueryDataSource.js';
import { SqlQueryResultService } from './SqlQueryResultService.js';
import { SqlQueryService } from './SqlQueryService.js';

const disposers: Array<() => Promise<void>> = [];

afterEach(async () => {
  for (const dispose of disposers.splice(0)) {
    await dispose();
  }
  vi.restoreAllMocks();
});

function createState(): ISqlEditorTabState {
  return {
    editorId: 'editor',
    datasourceKey: 'source',
    order: 0,
    tabs: [],
    resultGroups: [],
    resultTabs: [],
    statisticsTabs: [],
    modeState: [],
  };
}

function createFixture(outcomes: Array<Error | 'cancelled' | undefined> = []) {
  const storage = new TableViewerStorageService();
  const dialogs = new CommonDialogService();
  const openDialog = vi.spyOn(dialogs, 'open').mockResolvedValue({ status: DialogueStateResult.Rejected });
  const queryResults = new SqlQueryResultService(storage);
  const actions = {
    registerAction: vi.fn().mockReturnThis(),
    updateResults: vi.fn(),
  };
  const contextInfo = { id: 'context', projectId: 'project', connectionId: 'connection' };
  const executed: string[] = [];
  let cancelled = false;

  storage.onChange.addHandler(({ type, model }) => {
    if (type === 'add') {
      disposers.push(() => model.dispose());
    }
  });

  vi.spyOn(QueryDataSource.prototype, 'cancelled', 'get').mockImplementation(() => cancelled);
  vi.spyOn(QueryDataSource.prototype, 'request').mockImplementation(function request(this: QueryDataSource) {
    executed.push(this.options!.query);
    const outcome = outcomes.shift();
    cancelled = outcome === 'cancelled';

    if (outcome instanceof Error || cancelled) {
      this.error = outcome instanceof Error ? outcome : new Error('Query cancelled');
      return Promise.reject(this.error);
    }

    this.clearError();
    return Promise.resolve([]);
  });

  const service = new SqlQueryService(
    ...([
      { createScope: () => ({ serviceProvider: { getService: () => actions } }) },
      storage,
      {},
      { logException: vi.fn() },
      { load: () => Promise.resolve({ supportedDataFormats: [ResultDataFormat.Resultset] }) },
      { get: () => ({ context: contextInfo }) },
      queryResults,
      { onExecuteEvent: new Executor() },
      { trackTableDataUpdate: vi.fn() },
      { isDataEditable: () => true },
      { get: () => ({ executionContext: contextInfo }) },
      { getDefaultRowsCount: () => 200 },
      dialogs,
      {},
      { isScriptExecutionEnabled: () => true },
    ] as unknown as ConstructorParameters<typeof SqlQueryService>),
  );

  return { service, storage, openDialog, executed, outcomes };
}

describe('SQL script errors', () => {
  it('continues with the next statement after Skip and preserves the failed result', async () => {
    const error = new Error('Invalid statement');
    const { service, storage, openDialog, executed } = createFixture([error]);
    const state = createState();
    const onQueryExecuted = vi.fn();
    openDialog.mockResolvedValue({ status: DialogueStateResult.Resolved, result: 'skip' });

    await service.executeQueries(state, ['invalid', 'next'], { onQueryExecuted });

    expect(executed).toEqual(['invalid', 'next']);
    expect(openDialog).toHaveBeenCalledWith(expect.anything(), { query: 'invalid', error });
    expect(onQueryExecuted.mock.calls).toEqual([
      ['invalid', 0, false],
      ['next', 1, true],
    ]);
    expect(state.resultGroups).toHaveLength(1);
    expect(storage.get(state.resultGroups[0]!.modelId)!.source.error).toBe(error);
    expect(service.getStatistics(state.statisticsTabs[0]!.tabId)).toMatchObject({ executedQueries: 1, modelId: null });
  });

  it('stops when the dialog is rejected or dismissed', async () => {
    const { service, executed } = createFixture([new Error('Invalid statement')]);

    await service.executeQueries(createState(), ['invalid', 'next']);

    expect(executed).toEqual(['invalid']);
  });

  it('retries the same statement without creating an extra result tab', async () => {
    const { service, openDialog, executed } = createFixture([new Error('Try again')]);
    const state = createState();
    const onQueryExecutionStart = vi.fn();
    openDialog.mockResolvedValue({ status: DialogueStateResult.Resolved, result: 'retry' });

    await service.executeQueries(state, ['retry me', 'next'], { onQueryExecutionStart });

    expect(executed).toEqual(['retry me', 'retry me', 'next']);
    expect(onQueryExecutionStart.mock.calls).toEqual([
      ['retry me', 0],
      ['retry me', 0],
      ['next', 1],
    ]);
    expect(state.resultGroups).toHaveLength(0);
    expect(service.getStatistics(state.statisticsTabs[0]!.tabId)).toMatchObject({ executedQueries: 2, modelId: null });
  });

  it('asks again if Retry fails, keeping one result for the skipped statement', async () => {
    const { service, openDialog, executed } = createFixture([new Error('First error'), new Error('Second error')]);
    const state = createState();
    openDialog
      .mockResolvedValueOnce({ status: DialogueStateResult.Resolved, result: 'retry' })
      .mockResolvedValueOnce({ status: DialogueStateResult.Resolved, result: 'skip' });

    await service.executeQueries(state, ['invalid', 'next']);

    expect(executed).toEqual(['invalid', 'invalid', 'next']);
    expect(openDialog).toHaveBeenCalledTimes(2);
    expect(state.resultGroups).toHaveLength(1);
  });

  it('asks about each error when only Skip was selected', async () => {
    const { service, openDialog, executed } = createFixture([new Error('First error'), new Error('Second error')]);
    openDialog.mockResolvedValue({ status: DialogueStateResult.Resolved, result: 'skip' });

    await service.executeQueries(createState(), ['first', 'second', 'next']);

    expect(executed).toEqual(['first', 'second', 'next']);
    expect(openDialog).toHaveBeenCalledTimes(2);
  });

  it('skips subsequent errors only for the current script execution', async () => {
    const { service, openDialog, executed, outcomes } = createFixture([new Error('First error'), new Error('Second error')]);
    const state = createState();
    openDialog.mockResolvedValue({ status: DialogueStateResult.Resolved, result: 'skip-all' });

    await service.executeQueries(state, ['first', 'second', 'next']);

    expect(executed).toEqual(['first', 'second', 'next']);
    expect(openDialog).toHaveBeenCalledTimes(1);
    expect(state.resultGroups).toHaveLength(2);

    outcomes.push(new Error('Another script error'));
    openDialog.mockResolvedValue({ status: DialogueStateResult.Rejected });
    await service.executeQueries(state, ['another script', 'not executed']);

    expect(openDialog).toHaveBeenCalledTimes(2);
    expect(executed).toEqual(['first', 'second', 'next', 'another script']);
  });

  it('stops after cancellation without opening the error dialog', async () => {
    const { service, openDialog, executed } = createFixture(['cancelled']);

    await service.executeQueries(createState(), ['cancelled query', 'next']);

    expect(executed).toEqual(['cancelled query']);
    expect(openDialog).not.toHaveBeenCalled();
  });

  it('still stops after cancellation when Skip all was selected', async () => {
    const { service, openDialog, executed } = createFixture([new Error('First error'), 'cancelled']);
    openDialog.mockResolvedValue({ status: DialogueStateResult.Resolved, result: 'skip-all' });

    await service.executeQueries(createState(), ['invalid', 'cancelled query', 'next']);

    expect(executed).toEqual(['invalid', 'cancelled query']);
    expect(openDialog).toHaveBeenCalledTimes(1);
  });
});
