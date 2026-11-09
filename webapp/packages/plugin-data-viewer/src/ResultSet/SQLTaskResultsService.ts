/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, type ResultDataFormat, type SqlExecuteInfo } from '@cloudbeaver/core-sdk';

type ResultLoader = (taskId: string) => Promise<SqlExecuteInfo>;

@injectable(() => [GraphQLService])
export class SQLTaskResultsService {
  private readonly loaders = new Map<ResultDataFormat, ResultLoader>();

  constructor(private readonly graphQLService: GraphQLService) {}

  register(dataFormat: ResultDataFormat, loader: ResultLoader): void {
    this.loaders.set(dataFormat, loader);
  }

  async load(dataFormat: ResultDataFormat, taskId: string): Promise<SqlExecuteInfo> {
    const loader = this.loaders.get(dataFormat);
    if (loader) {
      return loader(taskId);
    }

    const { result } = await this.graphQLService.sdk.getSqlExecuteTaskResults({ taskId });
    return result;
  }
}
