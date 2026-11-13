/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISessionEvent, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { CbDatabaseOutputLogEvent, CbSessionLogEvent as ISessionLogEvent } from '@cloudbeaver/core-sdk';

export { type ISessionLogEvent };

export class OutputLogsEventHandlerImpl extends TopicEventHandler<ISessionLogEvent, ISessionEvent> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbDatabaseOutputLog, sessionEventSource);
  }

  map(event: CbDatabaseOutputLogEvent) {
    return event;
  }
}

export type OutputLogsEventHandler = OutputLogsEventHandlerImpl;

export class OutputLogsEventHandlerDI extends Context.Service<OutputLogsEventHandlerDI, OutputLogsEventHandlerImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlResultTabs/OutputLogs/OutputLogsEventHandler#OutputLogsEventHandler',
) {
  static readonly implementation = OutputLogsEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<OutputLogsEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeOutputLogsEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new OutputLogsEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<OutputLogsEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const OutputLogsEventHandler = OutputLogsEventHandlerDI;
