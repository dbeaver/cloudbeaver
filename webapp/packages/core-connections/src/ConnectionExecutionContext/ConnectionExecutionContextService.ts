/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { TaskScheduler } from '@cloudbeaver/core-executor';
import { CachedMapAllKey, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { IConnectionInfoParams } from '../CONNECTION_INFO_PARAM_SCHEMA.js';
import { ConnectionExecutionContext } from './ConnectionExecutionContext.js';
import { ConnectionExecutionContextResource } from './ConnectionExecutionContextResource.js';

@injectable()
export class ConnectionExecutionContextService {
  private readonly contexts: MetadataMap<string, ConnectionExecutionContext>;
  protected scheduler: TaskScheduler<string>;

  constructor(
    readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly GraphQLService: GraphQLService,
  ) {
    this.contexts = new MetadataMap(
      contextId =>
        new ConnectionExecutionContext(
          contextId,
          this.scheduler,
          this.connectionExecutionContextResource,
          this.asyncTaskInfoService,
          this.GraphQLService,
        ),
    );
    this.scheduler = new TaskScheduler((a, b) => a === b);
    this.connectionExecutionContextResource.onItemDelete.addHandler(key =>
      ResourceKeyUtils.forEach(key, contextId => this.contexts.delete(contextId)),
    );
  }

  get(contextId: string): ConnectionExecutionContext | undefined {
    if (!this.connectionExecutionContextResource.has(contextId)) {
      return undefined;
    }
    return this.contexts.get(contextId);
  }

  async load(): Promise<void> {
    await this.connectionExecutionContextResource.load(CachedMapAllKey);
  }

  async create(connectionKey: IConnectionInfoParams, defaultCatalog?: string, defaultSchema?: string): Promise<ConnectionExecutionContext> {
    const context = await this.connectionExecutionContextResource.create(connectionKey, defaultCatalog, defaultSchema);

    return this.contexts.get(context.id);
  }
}
