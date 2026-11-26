/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { GraphQLService, ResultDataFormat, type SqlExecuteInfo } from '@cloudbeaver/core-sdk';

import { SQLTaskResultsService } from './SQLTaskResultsService.js';

describe('SQLTaskResultsService', () => {
  it('uses the default SQL task operation for ordinary results', async () => {
    const result = { results: [] } as unknown as SqlExecuteInfo;
    const getSqlExecuteTaskResults = vi.fn().mockResolvedValue({ result });
    const graphQLService = { sdk: { getSqlExecuteTaskResults } } as unknown as GraphQLService;
    const service = new SQLTaskResultsService(graphQLService);

    await expect(service.load(ResultDataFormat.Resultset, 'task-1')).resolves.toBe(result);
    expect(getSqlExecuteTaskResults).toHaveBeenCalledExactlyOnceWith({ taskId: 'task-1' });
  });

  it('uses the registered operation instead of requesting the result again', async () => {
    const result = { results: [] } as unknown as SqlExecuteInfo;
    const loader = vi.fn().mockResolvedValue(result);
    const getSqlExecuteTaskResults = vi.fn();
    const graphQLService = { sdk: { getSqlExecuteTaskResults } } as unknown as GraphQLService;
    const service = new SQLTaskResultsService(graphQLService);
    service.register(ResultDataFormat.Timeseries, loader);

    await expect(service.load(ResultDataFormat.Timeseries, 'task-2')).resolves.toBe(result);
    expect(loader).toHaveBeenCalledExactlyOnceWith('task-2');
    expect(getSqlExecuteTaskResults).not.toHaveBeenCalled();
  });
});
