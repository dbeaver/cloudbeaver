/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionExecutionContextResource } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { ServerEventId } from '@cloudbeaver/core-root';
import type { CbDatabaseOutputLogEvent, WsOutputLogInfo } from '@cloudbeaver/core-sdk';

import type { IOutputLogType } from './IOutputLogTypes.js';
import { OutputLogsEventHandler } from './OutputLogsEventHandler.js';

export interface IOutputLog extends WsOutputLogInfo {
  severity?: IOutputLogType;
  contextId: string;
  timestamp: number;
}

export class OutputLogsResourceImpl extends CachedDataResource<IOutputLog[]> {
  constructor(
    sqlOutputLogsEventHandler: OutputLogsEventHandler,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
  ) {
    super(() => []);

    sqlOutputLogsEventHandler.onEvent(
      ServerEventId.CbDatabaseOutputLogUpdated,
      (event: CbDatabaseOutputLogEvent) => {
        this.collectMessagesFromEvent(event);
      },
      undefined,
      this,
    );

    // hack, we need to call this.use() to initialize resource at startup
    this.useTracker.use(undefined);

    this.connectionExecutionContextResource.onItemDelete.addHandler(key => {
      this.setData(this.data.filter(log => log.contextId !== key));
    });
  }

  private collectMessagesFromEvent(event: CbDatabaseOutputLogEvent) {
    const newLogs = event.messages.map(message => ({
      message: message.message,
      severity: message.severity,
      contextId: event.contextId,
      timestamp: event.eventTimestamp,
    })) as IOutputLog[];

    const updatedData: IOutputLog[] = (this.data || []).concat(newLogs);

    this.setData(updatedData);
  }

  override clear(): void {
    super.clear();
    this.useTracker.use(undefined);
  }

  deleteLogsByContextId(contextId: string): void {
    this.setData(this.data.filter(log => log.contextId !== contextId));
  }

  protected loader(): IOutputLog[] {
    return this.data;
  }
}

export type OutputLogsResource = OutputLogsResourceImpl;

export class OutputLogsResourceDI extends Context.Service<OutputLogsResourceDI, OutputLogsResourceImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlResultTabs/OutputLogs/OutputLogsResource#OutputLogsResource',
) {
  static readonly implementation = OutputLogsResourceImpl;

  static readonly dependencies = () => [OutputLogsEventHandler, ConnectionExecutionContextResource] as const;
  static readonly make: Effect.Effect<
    OutputLogsResourceImpl,
    never,
    Context.Service.Identifier<typeof OutputLogsEventHandler> | Context.Service.Identifier<typeof ConnectionExecutionContextResource>
  > = Effect.gen(function* makeOutputLogsResource() {
    const sqlOutputLogsEventHandler = yield* OutputLogsEventHandler;
    const connectionExecutionContextResource = yield* ConnectionExecutionContextResource;

    return new OutputLogsResourceImpl(sqlOutputLogsEventHandler, connectionExecutionContextResource);
  });
  static readonly layer: Layer.Layer<
    OutputLogsResourceDI,
    never,
    Context.Service.Identifier<typeof OutputLogsEventHandler> | Context.Service.Identifier<typeof ConnectionExecutionContextResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const OutputLogsResource = OutputLogsResourceDI;
