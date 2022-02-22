/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { TaskScheduler } from '@cloudbeaver/core-executor';
import { ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { ConnectionExecutionContext } from './ConnectionExecutionContext';
import { ConnectionExecutionContextResource } from './ConnectionExecutionContextResource';

@injectable()
export class ConnectionExecutionContextService {
  private readonly contexts: MetadataMap<string, ConnectionExecutionContext>;
  protected scheduler: TaskScheduler<string>;

  constructor(
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource
  ) {
    this.contexts = new MetadataMap(contextId => new ConnectionExecutionContext(
      this.scheduler,
      this.connectionExecutionContextResource,
      contextId
    ));
    this.scheduler = new TaskScheduler((a, b) => a === b);
    this.connectionExecutionContextResource.onItemDelete.addHandler(
      key => ResourceKeyUtils.forEach(key, contextId => this.contexts.delete(contextId))
    );
  }

  get(contextId: string): ConnectionExecutionContext | undefined {
    if (!this.connectionExecutionContextResource.has(contextId)) {
      return undefined;
    }
    return this.contexts.get(contextId);
  }

  async load(): Promise<void> {
    await this.connectionExecutionContextResource.loadAll();
  }

  async create(
    connectionId: string,
    defaultCatalog?: string,
    defaultSchema?: string
  ): Promise<ConnectionExecutionContext> {
    const context = await this.connectionExecutionContextResource.create(connectionId, defaultCatalog, defaultSchema);

    return this.contexts.get(context.id);
  }
}
